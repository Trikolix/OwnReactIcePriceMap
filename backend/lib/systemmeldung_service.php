<?php
require_once __DIR__ . '/mail.php';
require_once __DIR__ . '/notification_dispatcher.php';
require_once __DIR__ . '/systemmeldung_validation.php';

function systemmeldungJson($value): string
{
    return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
}

function systemmeldungRowForm(array $row): array
{
    $options = json_decode($row['options_json'] ?? '', true) ?: [];
    return ['title' => $row['titel'], 'message' => $row['nachricht'], 'link_url' => $row['link_url'] ?? '',
        'link_label' => $row['link_label'] ?? '', 'email_subject' => $row['email_subject'] ?? '',
        'email_heading' => $row['email_heading'] ?? '', 'email_body' => $row['email_body'] ?? '',
        'email_buttons' => json_decode($row['email_buttons'] ?? '', true) ?: [],
        'mail_send_mode' => $options['mail_send_mode'] ?? 'subscribers',
        'push_web' => $options['push_web'] ?? false, 'push_android' => $options['push_android'] ?? false];
}

function systemmeldungRecipients(PDO $pdo, array $form): array
{
    $users = $pdo->query('SELECT n.id, n.email, COALESCE(s.notify_news,0) AS news,
        COALESCE(s.notify_news_push,0) AS news_push, COALESCE(s.push_enabled_web,0) AS web,
        COALESCE(s.push_enabled_android,0) AS android FROM nutzer n
        LEFT JOIN user_notification_settings s ON s.user_id = n.id ORDER BY n.id')->fetchAll(PDO::FETCH_ASSOC);
    $mail = [];
    $eligible = [];
    foreach ($users as $user) {
        $email = trim((string)$user['email']);
        if ($form['mail_send_mode'] !== 'none' && ($form['mail_send_mode'] === 'all' || (int)$user['news'] === 1)
            && filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $mail[] = ['id' => (int)$user['id'], 'email' => $email];
        }
        $eligible[(int)$user['id']] = $user;
    }
    $push = [];
    foreach (['web' => 'web_push_subscriptions', 'android' => 'mobile_push_devices'] as $channel => $table) {
        if (!$form['push_' . $channel]) continue;
        $condition = $channel === 'android' ? " AND platform = 'android' AND provider = 'fcm'" : '';
        foreach ($pdo->query("SELECT * FROM {$table} WHERE invalidated_at IS NULL{$condition}")->fetchAll(PDO::FETCH_ASSOC) as $target) {
            $user = $eligible[(int)$target['user_id']] ?? null;
            if ($user && (int)$user['news_push'] === 1 && (int)$user[$channel] === 1) {
                $push[] = ['channel' => $channel, 'target' => $target];
            }
        }
    }
    $counts = ['in_app' => count($users), 'email' => count($mail), 'web' => 0, 'android' => 0];
    foreach ($push as $job) $counts[$job['channel']]++;
    return ['users' => $users, 'mail' => $mail, 'push' => $push, 'counts' => $counts];
}

function systemmeldungAudit(PDO $pdo, int $id, int $actor, string $action, array $details = []): void
{
    $pdo->prepare('INSERT INTO systemmeldung_audit (systemmeldung_id,actor_id,action,details_json) VALUES (?,?,?,?)')
        ->execute([$id, $actor, $action, systemmeldungJson($details)]);
}

function systemmeldungStore(PDO $pdo, array $form, ?int $id, int $actor): int
{
    $values = [$form['title'], $form['message'], $form['link_url'], $form['link_label'], $form['email_subject'],
        $form['email_heading'], $form['email_body'], systemmeldungJson($form['email_buttons']),
        systemmeldungJson(['mail_send_mode' => $form['mail_send_mode'], 'push_web' => $form['push_web'], 'push_android' => $form['push_android']])];
    if ($id) {
        $stmt = $pdo->prepare('SELECT state FROM systemmeldungen WHERE id = ? FOR UPDATE');
        $stmt->execute([$id]);
        $state = $stmt->fetchColumn();
        if ($state === false) throw new SystemmeldungException('Meldung nicht gefunden.', 404);
        if ($state !== 'draft') throw new SystemmeldungException('Nur Entwürfe können veröffentlicht werden.', 409);
        $pdo->prepare('UPDATE systemmeldungen SET titel=?,nachricht=?,link_url=?,link_label=?,email_subject=?,email_heading=?,email_body=?,email_buttons=?,options_json=? WHERE id=?')
            ->execute(array_merge($values, [$id]));
    } else {
        $pdo->prepare("INSERT INTO systemmeldungen (titel,nachricht,link_url,link_label,email_subject,email_heading,email_body,email_buttons,options_json,state,created_by) VALUES (?,?,?,?,?,?,?,?,?,'draft',?)")
            ->execute(array_merge($values, [$actor]));
        $id = (int)$pdo->lastInsertId();
    }
    return $id;
}

function systemmeldungSaveDraft(PDO $pdo, array $input, int $actor): array
{
    $form = systemmeldungForm($input);
    $id = systemmeldungInputId($input, false);
    $pdo->beginTransaction();
    try {
        $id = systemmeldungStore($pdo, $form, $id, $actor);
        systemmeldungAudit($pdo, $id, $actor, 'draft_saved');
        $pdo->commit();
        return ['systemmeldung_id' => $id];
    } catch (Throwable $e) { $pdo->rollBack(); throw $e; }
}

function systemmeldungInputId(array $input, bool $required = true): ?int
{
    if (!$required && (!isset($input['id']) || $input['id'] === null)) return null;
    if (!is_int($input['id'] ?? null) || $input['id'] <= 0) throw new SystemmeldungException('Ungültige ID.');
    return $input['id'];
}

function systemmeldungReplay(PDO $pdo, string $key, string $hash): ?array
{
    $stmt = $pdo->prepare('SELECT request_hash,result_json FROM systemmeldung_requests WHERE request_key=?');
    $stmt->execute([$key]);
    $request = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$request) return null;
    if (!hash_equals($request['request_hash'], $hash)) throw new SystemmeldungException('Request-Schlüssel wurde für andere Inhalte verwendet.', 409);
    return json_decode($request['result_json'], true);
}

function systemmeldungPublish(PDO $pdo, array $input, int $actor): array
{
    $form = systemmeldungForm($input, true);
    $id = systemmeldungInputId($input, false);
    $key = $input['request_key'] ?? '';
    if (!is_string($key) || !preg_match('/^[A-Za-z0-9_-]{8,64}$/D', $key)) throw new SystemmeldungException('Request-Schlüssel erforderlich.');
    $hash = hash('sha256', systemmeldungJson([$id, $form]));
    $replay = systemmeldungReplay($pdo, $key, $hash);
    if ($replay) return $replay;
    $pdo->beginTransaction();
    try {
        $recipients = systemmeldungRecipients($pdo, $form);
        $expected = $input['expected_counts'] ?? [];
        $validCounts = is_array($expected) && count($expected) === 4;
        foreach ($recipients['counts'] as $channel => $count) {
            $validCounts = $validCounts && isset($expected[$channel]) && is_int($expected[$channel]) && $expected[$channel] === $count;
        }
        if (!$validCounts) {
            throw new SystemmeldungException('Empfängerzahlen haben sich geändert. Bitte Versand erneut bestätigen.', 409, ['counts' => $recipients['counts']]);
        }
        $mail = systemmeldungMailData($form);
        $storedForm = $form;
        $storedForm['email_subject'] = $mail['subject'];
        $storedForm['email_heading'] = $mail['heading'];
        $storedForm['email_buttons'] = $mail['buttons'];
        $id = systemmeldungStore($pdo, $storedForm, $id, $actor);
        $pdo->prepare("UPDATE systemmeldungen SET state='published',published_at=NOW(),request_key=?,request_hash=? WHERE id=?")
            ->execute([$key, $hash, $id]);
        $mailInsert = $pdo->prepare('INSERT INTO systemmeldung_mail_queue (systemmeldung_id,user_id,email,subject,heading,body,buttons_json,include_settings_hint,mail_mode) VALUES (?,?,?,?,?,?,?,?,?)');
        foreach ($recipients['mail'] as $recipient) {
            $mailInsert->execute([$id, $recipient['id'], $recipient['email'], $mail['subject'], $mail['heading'], $mail['body'],
                systemmeldungJson($mail['buttons']), (int)$mail['include_settings_hint'], $form['mail_send_mode']]);
        }
        $notificationInsert = $pdo->prepare("INSERT INTO benachrichtigungen (empfaenger_id,typ,referenz_id,text,zusatzdaten) VALUES (?,'systemmeldung',?,?,?)");
        $extra = ['message' => $form['message'], 'link_url' => $form['link_url'], 'link_label' => $form['link_label']];
        $notifications = [];
        foreach ($recipients['users'] as $user) {
            $notificationInsert->execute([(int)$user['id'], $id, $form['title'], systemmeldungJson($extra)]);
            $notifications[(int)$user['id']] = ['id' => (int)$pdo->lastInsertId(), 'empfaenger_id' => (int)$user['id'],
                'typ' => 'systemmeldung', 'referenz_id' => $id, 'text' => $form['title'], 'zusatzdaten' => '{}'];
        }
        $pushInsert = $pdo->prepare('INSERT INTO systemmeldung_push_queue (systemmeldung_id,notification_id,user_id,channel,target_id,delivery_id) VALUES (?,?,?,?,?,?)');
        foreach ($recipients['push'] as $job) {
            $target = $job['target'];
            $notification = $notifications[(int)$target['user_id']];
            $payload = buildPushPayload($notification);
            $deliveryId = $job['channel'] === 'web'
                ? queueWebPushDelivery($pdo, $notification, $target, $payload)
                : queueAndroidPushDelivery($pdo, $notification, $target, $payload);
            // Web pull must not expose a job before its worker has rechecked consent.
            $pdo->prepare("UPDATE push_notification_deliveries SET status='queued' WHERE id=?")->execute([$deliveryId]);
            $pushInsert->execute([$id, $notification['id'], (int)$target['user_id'], $job['channel'], (int)$target['id'], $deliveryId]);
        }
        $result = ['systemmeldung_id' => $id, 'counts' => $recipients['counts']];
        $pdo->prepare('INSERT INTO systemmeldung_requests (request_key,systemmeldung_id,request_hash,result_json) VALUES (?,?,?,?)')
            ->execute([$key, $id, $hash, systemmeldungJson($result)]);
        $pdo->prepare('UPDATE systemmeldungen SET publish_result=? WHERE id=?')->execute([systemmeldungJson($result), $id]);
        systemmeldungAudit($pdo, $id, $actor, 'published', ['counts' => $recipients['counts'], 'mail_send_mode' => $form['mail_send_mode'], 'push_web' => $form['push_web'], 'push_android' => $form['push_android'], 'request_key' => $key]);
        $pdo->commit();
        return $result;
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        // A concurrent publication may have won the unique request-key insertion.
        $replay = systemmeldungReplay($pdo, $key, $hash);
        if ($replay) return $replay;
        throw $e;
    }
}

function systemmeldungCorrect(PDO $pdo, array $input, int $actor): array
{
    $id = systemmeldungInputId($input);
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('SELECT * FROM systemmeldungen WHERE id=? FOR UPDATE');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) throw new SystemmeldungException('Meldung nicht gefunden.', 404);
        if ($row['state'] !== 'published') throw new SystemmeldungException('Nur veröffentlichte Meldungen können korrigiert werden.', 409);
        $old = systemmeldungRowForm($row);
        $merged = $old;
        foreach (['title', 'message', 'link_url', 'link_label'] as $field) $merged[$field] = $input[$field] ?? '';
        $form = systemmeldungForm($merged);
        if (!$form['title'] || !$form['message']) throw new SystemmeldungException('Titel und App-Nachricht erforderlich.');
        foreach (['email_subject', 'email_heading', 'email_body', 'email_buttons', 'mail_send_mode', 'push_web', 'push_android'] as $field) {
            if (isset($input[$field]) && $input[$field] !== $old[$field]) throw new SystemmeldungException('E-Mail- und Push-Inhalte bleiben nach Veröffentlichung unverändert.', 409);
        }
        $pdo->prepare('UPDATE systemmeldungen SET titel=?,nachricht=?,link_url=?,link_label=? WHERE id=?')
            ->execute([$form['title'], $form['message'], $form['link_url'], $form['link_label'], $id]);
        $extra = ['message' => $form['message'], 'link_url' => $form['link_url'], 'link_label' => $form['link_label']];
        $pdo->prepare("UPDATE benachrichtigungen SET text=?,zusatzdaten=? WHERE typ='systemmeldung' AND referenz_id=?")
            ->execute([$form['title'], systemmeldungJson($extra), $id]);
        systemmeldungAudit($pdo, $id, $actor, 'app_corrected', ['before' => array_intersect_key($old, $extra + ['title' => '']), 'after' => $extra + ['title' => $form['title']]]);
        $pdo->commit();
        return ['systemmeldung_id' => $id];
    } catch (Throwable $e) { $pdo->rollBack(); throw $e; }
}

function systemmeldungWithdraw(PDO $pdo, int $id, int $actor): array
{
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('SELECT state FROM systemmeldungen WHERE id=? FOR UPDATE');
        $stmt->execute([$id]);
        if ($stmt->fetchColumn() === false) throw new SystemmeldungException('Meldung nicht gefunden.', 404);
        $pdo->prepare("UPDATE systemmeldungen SET state='withdrawn',withdrawn_at=COALESCE(withdrawn_at,NOW()) WHERE id=?")->execute([$id]);
        $pdo->prepare("UPDATE benachrichtigungen SET ausgeblendet_am=COALESCE(ausgeblendet_am,NOW()) WHERE typ='systemmeldung' AND referenz_id=?")->execute([$id]);
        foreach (['systemmeldung_mail_queue', 'systemmeldung_push_queue'] as $table) {
            $pdo->prepare("UPDATE {$table} SET status='cancelled',last_error='Message withdrawn' WHERE systemmeldung_id=? AND status IN ('pending','retry','failed')")->execute([$id]);
        }
        $pdo->prepare("UPDATE push_notification_deliveries d JOIN systemmeldung_push_queue q ON q.delivery_id=d.id SET d.status='cancelled' WHERE q.systemmeldung_id=? AND d.shown_at IS NULL")->execute([$id]);
        systemmeldungAudit($pdo, $id, $actor, 'withdrawn');
        $pdo->commit();
        return ['systemmeldung_id' => $id];
    } catch (Throwable $e) { $pdo->rollBack(); throw $e; }
}

function systemmeldungHistory(PDO $pdo, int $page): array
{
    $page = max(1, $page);
    $total = (int)$pdo->query('SELECT COUNT(*) FROM systemmeldungen')->fetchColumn();
    $stmt = $pdo->prepare('SELECT * FROM systemmeldungen ORDER BY erstellt_am DESC,id DESC LIMIT 20 OFFSET ?');
    $stmt->bindValue(1, ($page - 1) * 20, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $ids = array_column($rows, 'id');
    $stats = [];
    if ($ids) {
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        foreach (['email' => 'systemmeldung_mail_queue', 'push' => 'systemmeldung_push_queue'] as $channel => $table) {
            $select = $channel === 'push' ? 'channel' : "'email' AS channel";
            $query = $pdo->prepare("SELECT systemmeldung_id,{$select},status,COUNT(*) AS count FROM {$table} WHERE systemmeldung_id IN ({$placeholders}) GROUP BY systemmeldung_id,channel,status");
            $query->execute($ids);
            foreach ($query->fetchAll(PDO::FETCH_ASSOC) as $stat) $stats[$stat['systemmeldung_id']][$stat['channel']][$stat['status']] = (int)$stat['count'];
        }
        $query = $pdo->prepare("SELECT referenz_id,COUNT(*) AS total,SUM(ist_gelesen) AS read_count FROM benachrichtigungen WHERE typ='systemmeldung' AND referenz_id IN ({$placeholders}) GROUP BY referenz_id");
        $query->execute($ids);
        foreach ($query->fetchAll(PDO::FETCH_ASSOC) as $stat) $stats[$stat['referenz_id']]['in_app'] = ['total' => (int)$stat['total'], 'read' => (int)$stat['read_count']];
    }
    foreach ($rows as &$row) {
        $row['id'] = (int)$row['id'];
        $row['form'] = systemmeldungRowForm($row);
        $row['delivery_stats'] = $stats[$row['id']] ?? [];
        unset($row['request_hash'], $row['publish_result']);
    }
    unset($row);
    return ['systemmeldungen' => $rows, 'pagination' => ['page' => $page, 'total' => $total, 'pages' => max(1, (int)ceil($total / 20))]];
}
