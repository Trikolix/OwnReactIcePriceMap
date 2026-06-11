<?php

require_once __DIR__ . '/db_connect.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/likes.php';
require_once __DIR__ . '/lib/awards.php';
require_once __DIR__ . '/evaluators/LikeCountEvaluator.php';

header('Content-Type: application/json');

try {
    $authUser = requireAuth($pdo);
    $userId = (int)$authUser['id'];

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $entityType = $_GET['entity_type'] ?? '';
        $entityId = (int)($_GET['entity_id'] ?? 0);

        if (!in_array($entityType, ['checkin', 'bewertung', 'route', 'kommentar']) || $entityId <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid parameters']);
            exit();
        }

        $likesCount = getLikesCount($pdo, $entityType, $entityId);
        $hasLiked = hasUserLiked($pdo, $userId, $entityType, $entityId);

        echo json_encode([
            'likes_count' => $likesCount,
            'has_liked' => $hasLiked
        ]);
        exit();
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $entityType = $input['entity_type'] ?? '';
        $entityId = (int)($input['entity_id'] ?? 0);
        $action = $input['action'] ?? 'like';

        if (!in_array($entityType, ['checkin', 'bewertung', 'route', 'kommentar']) || $entityId <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid parameters']);
            exit();
        }

        if ($action === 'like') {
            $success = addLike($pdo, $userId, $entityType, $entityId);
            $likesCount = getLikesCount($pdo, $entityType, $entityId);
            echo json_encode(['success' => $success, 'likes_count' => $likesCount, 'has_liked' => true]);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
        }
        exit();
    }

    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
