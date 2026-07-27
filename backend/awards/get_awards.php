<?php
require_once __DIR__ . '/auth_awards_admin.php';
require_once __DIR__ . '/awards_cache.php';

header('Content-Type: application/json; charset=utf-8');

const AWARDS_CACHE_TTL_SECONDS = 300;

try {
    $usePagination = (string)($_GET['paginated'] ?? '') === '1';
    $query = trim((string)($_GET['q'] ?? ''));
    $category = trim((string)($_GET['category'] ?? ''));

    if ($usePagination) {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $pageSize = min(100, max(12, (int)($_GET['page_size'] ?? 24)));
        $offset = ($page - 1) * $pageSize;

        $where = [];
        $params = [];
        if ($category !== '') {
            $where[] = 'a.category = ?';
            $params[] = $category;
        }
        if ($query !== '') {
            $where[] = '(CAST(a.id AS CHAR) LIKE ? OR a.code LIKE ? OR a.category LIKE ? OR al.title_de LIKE ? OR al.description_de LIKE ?)';
            $like = '%' . $query . '%';
            array_push($params, $like, $like, $like, $like, $like);
        }
        $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $countStmt = $pdo->prepare(
            "SELECT COUNT(DISTINCT a.id)
             FROM awards a
             LEFT JOIN award_levels al ON al.award_id = a.id
             {$whereSql}"
        );
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();
        $totalPages = max(1, (int)ceil($total / $pageSize));
        if ($page > $totalPages) {
            $page = $totalPages;
            $offset = ($page - 1) * $pageSize;
        }

        $idStmt = $pdo->prepare(
            "SELECT DISTINCT a.id
             FROM awards a
             LEFT JOIN award_levels al ON al.award_id = a.id
             {$whereSql}
             ORDER BY a.id DESC
             LIMIT {$offset}, {$pageSize}"
        );
        $idStmt->execute($params);
        $awardIds = array_map('intval', $idStmt->fetchAll(PDO::FETCH_COLUMN));

        $awards = [];
        if ($awardIds) {
            $placeholders = implode(',', array_fill(0, count($awardIds), '?'));
            $stmt = $pdo->prepare(
                "SELECT a.id, a.code, a.category, al.level, al.threshold, al.icon_path, al.title_de, al.description_de, al.ep
                 FROM awards a
                 LEFT JOIN award_levels al ON al.award_id = a.id
                 WHERE a.id IN ({$placeholders})
                 ORDER BY a.id DESC, al.level ASC"
            );
            $stmt->execute($awardIds);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $awardIndexById = [];
            foreach ($rows as $row) {
                $awardId = (int)$row['id'];
                if (!isset($awardIndexById[$awardId])) {
                    $awardIndexById[$awardId] = count($awards);
                    $awards[] = ['id' => $awardId, 'code' => $row['code'], 'category' => $row['category'], 'levels' => []];
                }
                if ($row['level'] !== null) {
                    $awards[$awardIndexById[$awardId]]['levels'][] = [
                        'level' => (int)$row['level'],
                        'threshold' => (int)$row['threshold'],
                        'icon_path' => $row['icon_path'],
                        'title_de' => $row['title_de'],
                        'description_de' => $row['description_de'],
                        'ep' => (int)$row['ep'],
                    ];
                }
            }
        }

        $categoryStmt = $pdo->query("SELECT DISTINCT category FROM awards WHERE category IS NOT NULL AND category <> '' ORDER BY category ASC");
        $categories = $categoryStmt->fetchAll(PDO::FETCH_COLUMN);
        echo json_encode([
            'items' => $awards,
            'categories' => $categories,
            'pagination' => ['page' => $page, 'page_size' => $pageSize, 'total' => $total, 'total_pages' => $totalPages],
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    $cachedJson = readAwardsCache(AWARDS_CACHE_TTL_SECONDS);
    if ($cachedJson !== null) {
        echo $cachedJson;
        exit;
    }

    $sql = "
        SELECT
            a.id,
            a.code,
            a.category,
            al.level,
            al.threshold,
            al.icon_path,
            al.title_de,
            al.description_de,
            al.ep
        FROM awards a
        LEFT JOIN award_levels al
            ON al.award_id = a.id
        ORDER BY a.id DESC, al.level ASC
    ";

    $stmt = $pdo->query($sql);

    $awards = [];
    $awardIndexById = [];

    while (($row = $stmt->fetch(PDO::FETCH_ASSOC)) !== false) {
        $awardId = (int)$row['id'];

        if (!isset($awardIndexById[$awardId])) {
            $awardIndexById[$awardId] = count($awards);
            $awards[] = [
                'id' => $awardId,
                'code' => $row['code'],
                'category' => $row['category'],
                'levels' => [],
            ];
        }

        if ($row['level'] !== null) {
            $awards[$awardIndexById[$awardId]]['levels'][] = [
                'level' => (int)$row['level'],
                'threshold' => isset($row['threshold']) ? (int)$row['threshold'] : null,
                'icon_path' => $row['icon_path'],
                'title_de' => $row['title_de'],
                'description_de' => $row['description_de'],
                'ep' => isset($row['ep']) ? (int)$row['ep'] : 0,
            ];
        }
    }

    $json = json_encode($awards, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        throw new RuntimeException('JSON encoding failed');
    }

    writeAwardsCache($json);
    echo $json;
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Fehler beim Abrufen der Awards: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}

