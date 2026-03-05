<?php
require_once __DIR__ . '/bootstrap.php';

try {
    event2026_ensure_schema($pdo);

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    event2026_require_admin($pdo);

    $status = trim((string) ($_GET['status'] ?? 'suggested'));
    $allowed = ['suggested', 'approved', 'rejected'];
    if (!in_array($status, $allowed, true)) {
        throw new InvalidArgumentException('Ungültiger Statusfilter.');
    }

    $limit = min(200, max(1, (int) ($_GET['limit'] ?? 100)));

    $stmt = $pdo->prepare("SELECT
            m.id,
            m.mail_message_id,
            m.sender,
            m.subject,
            m.amount_detected,
            m.reference_detected,
            m.confidence,
            m.status,
            m.created_at,
            r.id AS registration_id,
            r.payment_reference_code,
            p.id AS payment_id,
            p.status AS payment_status
        FROM event2026_payment_mail_matches m
        LEFT JOIN event2026_registrations r ON r.id = m.registration_id
        LEFT JOIN event2026_payments p ON p.id = m.payment_id
        WHERE m.status = :status
        ORDER BY m.confidence DESC, m.created_at DESC
        LIMIT :limit");
    $stmt->bindValue(':status', $status, PDO::PARAM_STR);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();

    echo json_encode([
        'status' => 'success',
        'items' => $stmt->fetchAll(PDO::FETCH_ASSOC),
    ]);
} catch (Throwable $e) {
    if (http_response_code() < 400) {
        http_response_code(400);
    }
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ]);
}
