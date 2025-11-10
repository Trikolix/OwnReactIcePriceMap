<?php

function getReviewAttributesForEisdielen(PDO $pdo, array $eisdieleIds): array {
    $normalizedIds = array_values(array_unique(array_filter(array_map('intval', $eisdieleIds), fn($id) => $id > 0)));
    if (empty($normalizedIds)) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($normalizedIds), '?'));
    $stmt = $pdo->prepare("
        SELECT
            b.eisdiele_id,
            a.id AS attribut_id,
            a.name,
            COUNT(*) AS anzahl
        FROM bewertung_attribute ba
        INNER JOIN attribute a ON ba.attribut_id = a.id
        INNER JOIN bewertungen b ON ba.bewertung_id = b.id
        WHERE b.eisdiele_id IN ($placeholders)
        GROUP BY b.eisdiele_id, a.id, a.name
        ORDER BY anzahl DESC, a.name ASC
    ");
    $stmt->execute($normalizedIds);

    $result = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $shopId = (int)$row['eisdiele_id'];
        if (!isset($result[$shopId])) {
            $result[$shopId] = [];
        }
        $result[$shopId][] = [
            'id' => (int)$row['attribut_id'],
            'name' => $row['name'],
            'anzahl' => (int)$row['anzahl'],
        ];
    }

    return $result;
}
