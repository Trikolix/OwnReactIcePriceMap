<?php

function getReviewById(PDO $pdo, int $reviewId): ?array {
    $stmt = $pdo->prepare("
        SELECT b.*, 
               n.username AS nutzer_name,
               e.name AS eisdiele_name,
               up.avatar_path AS avatar_url
        FROM bewertungen b
        JOIN nutzer n ON n.id = b.nutzer_id
        JOIN eisdielen e ON e.id = b.eisdiele_id
        LEFT JOIN user_profile_images up ON up.user_id = n.id
        WHERE b.id = :id
    ");
    $stmt->execute(['id' => $reviewId]);
    $review = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$review) return null;

    $review['attribute'] = getAttributesForReview($pdo, $reviewId);
    $review['bilder'] = getBilderForReview($pdo, $reviewId);
    $review['commentCount'] = getCommentCountForReview($pdo, $id);
    
    return $review;
}

function getCommentCountForReview(PDO $pdo, int $reviewId): int {
    $stmtKommentare = $pdo->prepare("SELECT COUNT(*) FROM kommentare WHERE bewertung_id = :id");
    $stmtKommentare->execute(['id' => $reviewId]);
    return (int) $stmtKommentare->fetchColumn();
}

function getReviewByUserAndShop(PDO $pdo, int $userId, int $shopId): ?array {
    $stmt = $pdo->prepare("
        SELECT *
        FROM bewertungen
        WHERE nutzer_id = :userId AND eisdiele_id = :shopId
    ");
    $stmt->execute(['userId' => $userId, 'shopId' => $shopId]);
    $review = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$review) return null;

    $review['attribute'] = getAttributesForReview($pdo, $review['id']);
    $review['bilder'] = getBilderForReview($pdo, $review['id']);
    $review['commentCount'] = getCommentCountForReview($pdo, $review['id']);

    return $review;
}

function getReviewsByEisdieleId(PDO $pdo, int $shopId): array {
    $stmt = $pdo->prepare("
        SELECT b.*,
               n.id AS nutzer_id,
               n.username AS nutzer_name,
               e.name AS eisdiele_name,
               e.adresse,
               up.avatar_path AS avatar_url
        FROM bewertungen b
        JOIN nutzer n ON b.nutzer_id = n.id
        JOIN eisdielen e ON b.eisdiele_id = e.id
        LEFT JOIN user_profile_images up ON up.user_id = n.id
        WHERE b.eisdiele_id = :shopId
        ORDER BY b.id DESC
    ");
    $stmt->execute(['shopId' => $shopId]);
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($reviews as &$review) {
        $review['attributes'] = getAttributesForReview($pdo, $review['id']);
        $review['bilder'] = getBilderForReview($pdo, $review['id']);
        $review['commentCount'] = getCommentCountForReview($pdo, $review['id']);
    }

    return $reviews;
}

function getReviewsByNutzerId(PDO $pdo, int $userId): array {
    $stmt = $pdo->prepare("
        SELECT b.*,
               n.id AS nutzer_id,
               n.username AS nutzer_name,
               e.name AS eisdiele_name,
               e.adresse,
               up.avatar_path AS avatar_url
        FROM bewertungen b
        JOIN nutzer n ON b.nutzer_id = n.id
        JOIN eisdielen e ON b.eisdiele_id = e.id
        LEFT JOIN user_profile_images up ON up.user_id = n.id
        WHERE b.nutzer_id = :userId
        ORDER BY b.id DESC
    ");
    $stmt->execute(['userId' => $userId]);
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($reviews as &$review) {
        $review['attributes'] = getAttributesForReview($pdo, $review['id']);
        $review['bilder'] = getBilderForReview($pdo, $review['id']);
        $review['commentCount'] = getCommentCountForReview($pdo, $review['id']);
    }

    return $reviews;
}

function getLatestReviews(PDO $pdo, int $offsetDays = 0, int $days = 7): array {
    $stmt = $pdo->prepare("
        SELECT b.*,
               n.id AS nutzer_id,
               n.username AS nutzer_name,
               e.name AS eisdiele_name,
               e.adresse,
               up.avatar_path AS avatar_url
        FROM bewertungen b
        JOIN nutzer n ON b.nutzer_id = n.id
        JOIN eisdielen e ON b.eisdiele_id = e.id
        LEFT JOIN user_profile_images up ON up.user_id = n.id
        WHERE b.erstellt_am >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL :offset + :days DAY)
          AND b.erstellt_am < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL :offset DAY)
        ORDER BY b.erstellt_am DESC
    ");
    $stmt->execute([
        'offset' => $offsetDays,
        'days'   => $days
    ]);
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($reviews as &$review) {
        $review['attributes'] = getAttributesForReview($pdo, $review['id']);
        $review['bilder']     = getBilderForReview($pdo, $review['id']);
        $review['commentCount'] = getCommentCountForReview($pdo, $review['id']);
    }

    return $reviews;
}

function getAttributesForReview(PDO $pdo, int $reviewId): array {
    $stmt = $pdo->prepare("
        SELECT a.name 
        FROM bewertung_attribute ba
        JOIN attribute a ON ba.attribut_id = a.id
        WHERE ba.bewertung_id = :id
    ");
    $stmt->execute(['id' => $reviewId]);
    return $stmt->fetchAll(PDO::FETCH_COLUMN);
}

function getAllAttributes(PDO $pdo): array {
    $stmt = $pdo->prepare("
        SELECT a.name
        FROM attribute a
        LEFT JOIN bewertung_attribute ba ON a.id = ba.attribut_id
        GROUP BY a.name
        ORDER BY COUNT(ba.attribut_id) DESC, a.name ASC
    ");
    $stmt->execute();
    return array_map('trim', $stmt->fetchAll(PDO::FETCH_COLUMN));
}

function getBilderForReview(PDO $pdo, int $reviewId): array {
    $stmt = $pdo->prepare("
        SELECT *
        FROM bilder
        WHERE bewertung_id = :id
    ");
    $stmt->execute(['id' => $reviewId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
?>
