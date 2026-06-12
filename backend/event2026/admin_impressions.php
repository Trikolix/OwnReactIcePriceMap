<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/../lib/image_upload.php';

header('Content-Type: application/json');

function event2026_impression_bool($value): int
{
    if (is_bool($value)) {
        return $value ? 1 : 0;
    }
    $normalized = strtolower(trim((string) $value));
    return in_array($normalized, ['1', 'true', 'yes', 'on'], true) ? 1 : 0;
}

function event2026_impression_input(): array
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') !== false) {
        $payload = json_decode(file_get_contents('php://input') ?: '[]', true);
        return is_array($payload) ? $payload : [];
    }
    return $_POST;
}

function event2026_fetch_admin_impressions(PDO $pdo, int $eventId): array
{
    $stmt = $pdo->prepare("SELECT
            i.id,
            i.title,
            i.caption,
            i.image_url,
            i.sort_order,
            i.is_published,
            i.created_by_user_id,
            i.created_at,
            i.updated_at,
            n.username AS created_by_username
        FROM event2026_impressions i
        LEFT JOIN nutzer n ON n.id = i.created_by_user_id
        WHERE i.event_id = :event_id
        ORDER BY i.sort_order ASC, i.created_at DESC, i.id DESC");
    $stmt->execute([':event_id' => $eventId]);

    return array_map(static function (array $row): array {
        return [
            'id' => (int) $row['id'],
            'title' => $row['title'] ?: '',
            'caption' => $row['caption'] ?: '',
            'image_url' => (string) $row['image_url'],
            'sort_order' => (int) $row['sort_order'],
            'is_published' => (int) $row['is_published'] === 1,
            'created_by_user_id' => $row['created_by_user_id'] !== null ? (int) $row['created_by_user_id'] : null,
            'created_by_username' => $row['created_by_username'] ?: null,
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function event2026_respond_admin_impressions(PDO $pdo, array $event): void
{
    echo json_encode([
        'status' => 'success',
        'event' => [
            'id' => (int) $event['id'],
            'slug' => (string) $event['slug'],
            'name' => (string) $event['name'],
            'event_date' => $event['event_date'],
        ],
        'impressions' => event2026_fetch_admin_impressions($pdo, (int) $event['id']),
    ]);
}

try {
    event2026_ensure_schema($pdo);
    $admin = event2026_require_admin($pdo);
    $event = event2026_current_event($pdo);
    $eventId = (int) $event['id'];
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        event2026_respond_admin_impressions($pdo, $event);
        exit;
    }

    if ($method === 'POST' && isMultipartBodyTooLarge()) {
        http_response_code(413);
        throw new RuntimeException('Die hochgeladenen Bilder sind zu groß. Bitte wähle weniger oder kleinere Bilder.');
    }

    if ($method === 'POST' && isset($_FILES['image']) && ($_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
        $filesArray = [
            'name' => [$_FILES['image']['name']],
            'type' => [$_FILES['image']['type']],
            'tmp_name' => [$_FILES['image']['tmp_name']],
            'error' => [$_FILES['image']['error']],
            'size' => [$_FILES['image']['size']],
        ];
        $uploaded = processUploadedImages($filesArray, '../../uploads/event_impressions/', 'event_');
        if (empty($uploaded[0]['url'])) {
            throw new RuntimeException('Bild konnte nicht hochgeladen werden.');
        }

        $title = trim((string) ($_POST['title'] ?? ''));
        $caption = trim((string) ($_POST['caption'] ?? ''));
        $sortOrder = isset($_POST['sort_order']) ? (int) $_POST['sort_order'] : 0;
        $isPublished = event2026_impression_bool($_POST['is_published'] ?? 1);

        $stmt = $pdo->prepare("INSERT INTO event2026_impressions (
                event_id, title, caption, image_url, sort_order, is_published, created_by_user_id
            ) VALUES (
                :event_id, :title, :caption, :image_url, :sort_order, :is_published, :created_by_user_id
            )");
        $stmt->execute([
            ':event_id' => $eventId,
            ':title' => $title !== '' ? $title : null,
            ':caption' => $caption !== '' ? $caption : null,
            ':image_url' => $uploaded[0]['url'],
            ':sort_order' => $sortOrder,
            ':is_published' => $isPublished,
            ':created_by_user_id' => (int) $admin['user_id'],
        ]);

        event2026_respond_admin_impressions($pdo, $event);
        exit;
    }

    if (!in_array($method, ['POST', 'PATCH', 'DELETE'], true)) {
        http_response_code(405);
        throw new RuntimeException('Methode nicht erlaubt.');
    }

    $input = event2026_impression_input();
    $action = (string) ($input['action'] ?? ($method === 'DELETE' ? 'delete' : 'update'));
    $impressionId = isset($input['id']) ? (int) $input['id'] : (int) ($input['impression_id'] ?? 0);
    if ($impressionId <= 0) {
        http_response_code(422);
        throw new RuntimeException('Impression-ID fehlt.');
    }

    $existsStmt = $pdo->prepare("SELECT id FROM event2026_impressions WHERE id = :id AND event_id = :event_id LIMIT 1");
    $existsStmt->execute([
        ':id' => $impressionId,
        ':event_id' => $eventId,
    ]);
    if (!$existsStmt->fetchColumn()) {
        http_response_code(404);
        throw new RuntimeException('Impression wurde nicht gefunden.');
    }

    if ($action === 'delete') {
        $deleteStmt = $pdo->prepare("DELETE FROM event2026_impressions WHERE id = :id AND event_id = :event_id");
        $deleteStmt->execute([
            ':id' => $impressionId,
            ':event_id' => $eventId,
        ]);
        event2026_respond_admin_impressions($pdo, $event);
        exit;
    }

    $title = trim((string) ($input['title'] ?? ''));
    $caption = trim((string) ($input['caption'] ?? ''));
    $sortOrder = isset($input['sort_order']) ? (int) $input['sort_order'] : 0;
    $isPublished = event2026_impression_bool($input['is_published'] ?? 0);

    $updateStmt = $pdo->prepare("UPDATE event2026_impressions
        SET title = :title,
            caption = :caption,
            sort_order = :sort_order,
            is_published = :is_published
        WHERE id = :id AND event_id = :event_id");
    $updateStmt->execute([
        ':title' => $title !== '' ? $title : null,
        ':caption' => $caption !== '' ? $caption : null,
        ':sort_order' => $sortOrder,
        ':is_published' => $isPublished,
        ':id' => $impressionId,
        ':event_id' => $eventId,
    ]);

    event2026_respond_admin_impressions($pdo, $event);
} catch (Throwable $e) {
    if (http_response_code() < 400) {
        http_response_code(500);
    }
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ]);
}
