<?php

require_once __DIR__ . '/db_connect.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/likes.php';
require_once __DIR__ . '/evaluators/LikeCountEvaluator.php';

header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $authUser = authenticateRequest($pdo);
        $userId = $authUser ? (int)$authUser['user_id'] : null;
        $entityType = $_GET['entity_type'] ?? '';
        $entityId = (int)($_GET['entity_id'] ?? 0);

        if (!isValidLikeEntityType($entityType) || $entityId <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid parameters']);
            exit();
        }

        $likesCount = getLikesCount($pdo, $entityType, $entityId);
        $hasLiked = $userId ? hasUserLiked($pdo, $userId, $entityType, $entityId) : false;

        echo json_encode([
            'likes_count' => $likesCount,
            'has_liked' => $hasLiked
        ]);
        exit();
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $authUser = requireAuth($pdo);
        $userId = (int)$authUser['user_id'];
        $input = json_decode(file_get_contents('php://input'), true);
        $entityType = $input['entity_type'] ?? '';
        $entityId = (int)($input['entity_id'] ?? 0);
        $action = $input['action'] ?? 'like';

        if (!isValidLikeEntityType($entityType) || $entityId <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid parameters']);
            exit();
        }

        if ($action === 'like') {
            $success = addLike($pdo, $userId, $entityType, $entityId);
            $likesCount = getLikesCount($pdo, $entityType, $entityId);
            $hasLiked = hasUserLiked($pdo, $userId, $entityType, $entityId);
            $newAwards = [];
            if ($success) {
                $evaluator = new LikeCountEvaluator();
                $newAwards = $evaluator->evaluate($userId);
            }
            echo json_encode([
                'success' => ($success || $hasLiked),
                'likes_count' => $likesCount,
                'has_liked' => $hasLiked,
                'new_awards' => $newAwards
            ]);
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
