<?php

function getRouteIceShops(PDO $pdo, array $routeIds): array {
    $routeIds = array_values(array_filter(array_unique(array_map('intval', $routeIds))));
    if (empty($routeIds)) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($routeIds), '?'));
    $sql = "
        SELECT re.route_id,
               e.id   AS eisdiele_id,
               e.name AS eisdiele_name
        FROM route_eisdielen re
        JOIN eisdielen e ON e.id = re.eisdiele_id
        WHERE re.route_id IN ($placeholders)
        ORDER BY e.name ASC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($routeIds);

    $map = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $routeId = (int)$row['route_id'];
        if (!isset($map[$routeId])) {
            $map[$routeId] = [];
        }
        $map[$routeId][] = [
            'id'   => (int)$row['eisdiele_id'],
            'name' => $row['eisdiele_name'],
        ];
    }

    return $map;
}

