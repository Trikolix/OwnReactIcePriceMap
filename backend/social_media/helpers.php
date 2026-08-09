<?php

require_once __DIR__ . '/../lib/auth.php';

function requireSocialMediaAdmin(PDO $pdo): array
{
    $auth = requireAuth($pdo);
    if ((int)($auth['user_id'] ?? 0) !== 1) {
        http_response_code(403);
        echo json_encode([
            'status' => 'error',
            'message' => 'Kein Zugriff. Dieser Bereich ist nur für Admins verfügbar.',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    return $auth;
}

function socialMediaNormalizeCandidate(array $row): array
{
    $ratingFields = [
        'geschmackbewertung' => 'Geschmack',
        'waffelbewertung' => 'Waffel',
        'größenbewertung' => 'Größe',
        'preisleistungsbewertung' => 'Preis-Leistung',
    ];
    $ratings = [];
    foreach ($ratingFields as $field => $label) {
        if ($row[$field] !== null && $row[$field] !== '') {
            $ratings[] = [
                'key' => $field,
                'label' => $label,
                'value' => round((float)$row[$field], 1),
            ];
        }
    }

    $flavours = [];
    $rawFlavours = trim((string)($row['flavours'] ?? ''));
    if ($rawFlavours !== '') {
        foreach (explode('||', $rawFlavours) as $flavour) {
            $flavour = trim($flavour);
            if ($flavour !== '') {
                $flavours[] = $flavour;
            }
        }
    }

    $latitude = $row['shop_latitude'] !== null && $row['shop_latitude'] !== ''
        ? (float)$row['shop_latitude']
        : null;
    $longitude = $row['shop_longitude'] !== null && $row['shop_longitude'] !== ''
        ? (float)$row['shop_longitude']
        : null;

    return [
        'image_id' => (int)$row['image_id'],
        'image_url' => (string)($row['image_url'] ?? ''),
        'checkin_id' => (int)$row['checkin_id'],
        'image_created_at' => $row['image_created_at'] ?? null,
        'username' => (string)($row['username'] ?? 'Ice-App-Nutzer'),
        'checkin_date' => $row['checkin_date'] ?? null,
        'shop_name' => (string)($row['shop_name'] ?? 'Unbekannte Eisdiele'),
        'shop_address' => $row['shop_address'] ?? null,
        'shop_latitude' => $latitude,
        'shop_longitude' => $longitude,
        'checkin_type' => (string)($row['checkin_type'] ?? ''),
        'comment' => (string)($row['checkin_comment'] ?? ''),
        'arrival' => (string)($row['arrival_type'] ?? ''),
        'avatar_url' => (string)($row['avatar_url'] ?? ''),
        'flavours' => $flavours,
        'ratings' => $ratings,
    ];
}

function socialMediaCandidateQuery(string $where = ''): string
{
    return "
        SELECT
            b.id AS image_id,
            b.url AS image_url,
            b.checkin_id,
            b.erstellt_am AS image_created_at,
            c.datum AS checkin_date,
            c.typ AS checkin_type,
            c.kommentar AS checkin_comment,
            c.anreise AS arrival_type,
            c.geschmackbewertung,
            c.waffelbewertung,
            c.größenbewertung,
            c.preisleistungsbewertung,
            n.username,
            up.avatar_path AS avatar_url,
            e.name AS shop_name,
            e.adresse AS shop_address,
            e.latitude AS shop_latitude,
            e.longitude AS shop_longitude,
            flavours.flavours
        FROM bilder b
        JOIN checkins c ON c.id = b.checkin_id
        JOIN nutzer n ON n.id = b.nutzer_id
        JOIN eisdielen e ON e.id = c.eisdiele_id
        LEFT JOIN user_profile_images up ON up.user_id = n.id
        LEFT JOIN (
            SELECT checkin_id, GROUP_CONCAT(TRIM(sortenname) ORDER BY id SEPARATOR '||') AS flavours
            FROM checkin_sorten
            GROUP BY checkin_id
        ) flavours ON flavours.checkin_id = c.id
        {$where}
    ";
}

function socialMediaFetchCandidate(PDO $pdo, int $imageId): ?array
{
    $stmt = $pdo->prepare(socialMediaCandidateQuery('WHERE b.id = :image_id AND b.url <> \'\' LIMIT 1'));
    $stmt->execute(['image_id' => $imageId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ? socialMediaNormalizeCandidate($row) : null;
}

function socialMediaFetchCandidates(PDO $pdo, array $filters = []): array
{
    $where = ["b.url IS NOT NULL", "b.url <> ''"];
    $params = [];

    $search = trim((string)($filters['search'] ?? ''));
    if ($search !== '') {
        $where[] = '(n.username LIKE :search OR e.name LIKE :search OR e.adresse LIKE :search)';
        $params['search'] = '%' . $search . '%';
    }

    $type = trim((string)($filters['type'] ?? ''));
    if (in_array($type, ['Kugel', 'Softeis', 'Eisbecher'], true)) {
        $where[] = 'c.typ = :type';
        $params['type'] = $type;
    }

    $from = trim((string)($filters['from'] ?? ''));
    if ($from !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $from)) {
        $where[] = 'c.datum >= :from_date';
        $params['from_date'] = $from . ' 00:00:00';
    }

    $to = trim((string)($filters['to'] ?? ''));
    if ($to !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
        $where[] = 'c.datum < DATE_ADD(:to_date, INTERVAL 1 DAY)';
        $params['to_date'] = $to . ' 00:00:00';
    }

    $whereSql = 'WHERE ' . implode(' AND ', $where);
    $countStmt = $pdo->prepare('SELECT COUNT(*) FROM bilder b JOIN checkins c ON c.id = b.checkin_id JOIN nutzer n ON n.id = b.nutzer_id JOIN eisdielen e ON e.id = c.eisdiele_id ' . $whereSql);
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $page = max(1, (int)($filters['page'] ?? 1));
    $limit = min(100, max(1, (int)($filters['limit'] ?? 24)));
    $offset = ($page - 1) * $limit;
    $sql = socialMediaCandidateQuery($whereSql) . ' ORDER BY c.datum DESC, b.id DESC LIMIT :limit OFFSET :offset';
    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $items = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $items[] = socialMediaNormalizeCandidate($row);
    }

    return [
        'items' => $items,
        'total' => $total,
        'page' => $page,
        'limit' => $limit,
        'pages' => $limit > 0 ? (int)ceil($total / $limit) : 0,
    ];
}
