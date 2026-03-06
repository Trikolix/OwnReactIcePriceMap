<?php

function shops_list(PDO $pdo): void
{
    $limit = isset($_GET['limit']) ? max(1, min(2000, (int) $_GET['limit'])) : 500;
    $minLat = isset($_GET['minLat']) ? (float) $_GET['minLat'] : null;
    $maxLat = isset($_GET['maxLat']) ? (float) $_GET['maxLat'] : null;
    $minLon = isset($_GET['minLon']) ? (float) $_GET['minLon'] : null;
    $maxLon = isset($_GET['maxLon']) ? (float) $_GET['maxLon'] : null;

    $where = [];
    $params = [];

    if ($minLat !== null && $maxLat !== null && $minLon !== null && $maxLon !== null) {
        $where[] = 'e.latitude BETWEEN :minLat AND :maxLat';
        $where[] = 'e.longitude BETWEEN :minLon AND :maxLon';
        $params[':minLat'] = $minLat;
        $params[':maxLat'] = $maxLat;
        $params[':minLon'] = $minLon;
        $params[':maxLon'] = $maxLon;
    }

    $adresseExists = false;
    $columnStmt = $pdo->query("SHOW COLUMNS FROM eisdielen LIKE 'adresse'");
    if ($columnStmt && $columnStmt->fetch(PDO::FETCH_ASSOC)) {
        $adresseExists = true;
    }

    $selectFields = 'e.id, e.name, e.latitude, e.longitude';
    if ($adresseExists) {
        $selectFields .= ', e.adresse';
    }

    $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    $sql = "SELECT {$selectFields}
            FROM eisdielen e
            {$whereSql}
            ORDER BY e.id DESC
            LIMIT :limit";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    json_success(['items' => $rows, 'count' => count($rows)]);
}

function shops_show(PDO $pdo, int $shopId): void
{
    if ($shopId <= 0) {
        json_error('Ungültige Shop-ID.', 400);
        return;
    }

    $stmt = $pdo->prepare("SELECT *
        FROM eisdielen
        WHERE id = :id
        LIMIT 1");
    $stmt->execute([':id' => $shopId]);
    $shop = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$shop) {
        json_error('Shop nicht gefunden.', 404);
        return;
    }

    json_success(['item' => $shop]);
}
