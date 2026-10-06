<?php
require_once __DIR__ . '/db_connect.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/api_request.php';
require_once __DIR__ . '/lib/systemmeldung_service.php';

$auth = requireAuth($pdo);
$userId = (int)$auth['user_id'];
$action = $_GET['action'] ?? '';
try {
    if ($action === 'get') {
        apiMethod('GET');
        $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if (!$id) throw new SystemmeldungException('Ungültige ID.');
        $stmt = $pdo->prepare("SELECT s.id,s.titel,s.nachricht,s.link_url,s.link_label,s.erstellt_am,b.id AS notification_id
            FROM systemmeldungen s JOIN benachrichtigungen b ON b.typ='systemmeldung' AND b.referenz_id=s.id
            WHERE s.id=? AND s.state='published' AND b.empfaenger_id=? AND b.ausgeblendet_am IS NULL LIMIT 1");
        $stmt->execute([$id, $userId]);
        $message = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$message) throw new SystemmeldungException('Systemmeldung nicht verfügbar.', 404);
        apiJson(['status' => 'success', 'systemmeldung' => $message]);
    }
    if ($userId !== 1) apiJson(['status' => 'error', 'message' => 'Adminrechte erforderlich.'], 403);
    if ($action === 'list') {
        apiMethod('GET');
        apiJson(['status' => 'success'] + systemmeldungHistory($pdo, (int)($_GET['page'] ?? 1)));
    }
    if ($action === 'meta') {
        apiMethod('GET');
        $form = systemmeldungForm([]);
        $stmt = $pdo->query('SELECT email FROM nutzer WHERE id=1');
        apiJson(['status' => 'success', 'counts' => systemmeldungRecipients($pdo, $form)['counts'], 'admin_email' => $stmt->fetchColumn() ?: '']);
    }
    if (!in_array($action, ['save_draft','preview','test_email','create','publish','update','withdraw','delete'], true)) {
        apiJson(['status' => 'error', 'message' => 'Unbekannte Aktion.'], 400);
    }
    $input = apiInput();
    if ($action === 'save_draft') $result = systemmeldungSaveDraft($pdo, $input, $userId);
    elseif ($action === 'create' || $action === 'publish') $result = systemmeldungPublish($pdo, $input, $userId);
    elseif ($action === 'update') $result = systemmeldungCorrect($pdo, $input, $userId);
    elseif ($action === 'withdraw' || $action === 'delete') $result = systemmeldungWithdraw($pdo, systemmeldungInputId($input), $userId);
    else {
        $form = systemmeldungForm($input);
        $mail = systemmeldungMailData($form);
        if ($action === 'preview') {
            $result = ['counts' => systemmeldungRecipients($pdo, $form)['counts'],
                'mail_html' => iceapp_build_branded_admin_markdown_mail_html($mail['heading'], $mail['body'], $mail['buttons'], $mail['include_settings_hint'], 'https://ice-app.de/account/settings', 'Ice-App')];
        } else {
            if ($mail['body'] === '') throw new SystemmeldungException('Mailtext ist erforderlich.', 422, ['fields' => ['email_body' => 'Mailtext ist erforderlich.']]);
            $email = $pdo->query('SELECT email FROM nutzer WHERE id=1')->fetchColumn();
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) throw new SystemmeldungException('Admin-E-Mail nicht verfügbar.', 422);
            if (!iceapp_send_branded_admin_markdown_mail($email, '[TEST] ' . $mail['subject'], $mail['heading'], $mail['body'], $mail['buttons'], $mail['include_settings_hint'], 'https://ice-app.de/account/settings', 'Ice-App <noreply@ice-app.de>', 'Ice-App')) {
                throw new SystemmeldungException('Testmail wurde vom Mailtransport nicht angenommen.', 502);
            }
            $result = ['recipient' => $email];
        }
    }
    apiJson(['status' => 'success'] + $result);
} catch (SystemmeldungException $e) {
    apiJson(['status' => 'error', 'message' => $e->getMessage()] + $e->details, $e->httpStatus);
} catch (Throwable $e) {
    error_log('Systemmeldung API: ' . $e->getMessage());
    if ($e instanceof PDOException && in_array((string)$e->getCode(), ['42S02', '42S22'], true)) {
        $response = ['status' => 'error', 'code' => 'SYSTEMMELDUNG_SCHEMA_OUTDATED',
            'message' => 'Systemmeldungen sind vorübergehend nicht verfügbar.'];
        if ($userId === 1) {
            $response['message'] = 'Die Datenbankstruktur für Systemmeldungen ist nicht vollständig eingerichtet. Bitte die Migration 2026-10-06_harden_systemmeldungen.sql vollständig ausführen.';
            $response['migration'] = '2026-10-06_harden_systemmeldungen.sql';
        }
        apiJson($response, 503);
    }
    apiJson(['status' => 'error', 'message' => 'Aktion konnte nicht abgeschlossen werden. Bitte erneut versuchen.'], 500);
}
