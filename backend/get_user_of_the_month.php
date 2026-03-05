<?php
require_once __DIR__ . '/db_connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // For development, consider restricting this in production

try {
    // 1. Determine the current month's level
    $start = new DateTime('2025-04-01');
    $now = new DateTime();
    $diff = $start->diff($now);
    
    // Total months passed since the start date.
    $months_passed = $diff->y * 12 + $diff->m;
    $current_level = $months_passed + 1;

    // 2. Fetch all "User of the Month" awards
    $stmt = $pdo->prepare("
        SELECT
            al.level,
            al.threshold as nutzer_id,
            al.icon_path as image,
            n.username as name
        FROM award_levels al
        JOIN nutzer n ON al.threshold = n.id
        WHERE al.award_id = 43
        ORDER BY al.level DESC
    ");
    $stmt->execute();
    $all_users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$all_users) {
        echo json_encode(['currentUser' => null, 'pastUsers' => []]);
        exit;
    }

    // 3. Process the data
    $currentUser = null;
    $pastUsers = [];

    // Base start date for calculating months
    $base_date = new DateTime('2025-03-01'); // Start from March to make April month number 1

    foreach ($all_users as $user) {
        // Calculate the month and year for the user's level
        $user_month_date = clone $base_date;
        $user_month_date->modify('+' . $user['level'] . ' months');
        $month_name = $user_month_date->format('F'); // Full month name in English

        // German month names array
        $german_months = [
            'January'   => 'Januar',
            'February'  => 'Februar',
            'March'     => 'März',
            'April'     => 'April',
            'May'       => 'Mai',
            'June'      => 'Juni',
            'July'      => 'Juli',
            'August'    => 'August',
            'September' => 'September',
            'October'   => 'Oktober',
            'November'  => 'November',
            'December'  => 'Dezember'
        ];
        $german_month_name = $german_months[$month_name] ?? $month_name;

        $processed_user = [
            'month' => $german_month_name,
            'id' => (int)$user['nutzer_id'],
            'name' => $user['name'],
            'image' => 'https://ice-app.de/' . $user['image']
        ];
        
        if ((int)$user['level'] === $current_level) {
            $currentUser = $processed_user;
        } else {
            $pastUsers[] = $processed_user;
        }
    }
    
    // Fallback if there is no user for the current exact month, pick the latest one.
    if ($currentUser === null && !empty($all_users)) {
        // The first user from the sorted list is the most recent one.
        $latest_user_from_db = $all_users[0];
        
        if ((int)$latest_user_from_db['level'] <= $current_level) {
            $latest_user_month_date = clone $base_date;
            $latest_user_month_date->modify('+' . $latest_user_from_db['level'] . ' months');
            $month_name = $latest_user_month_date->format('F');
            $german_month_name = $german_months[$month_name] ?? $month_name;

            $currentUser = [
                'month' => $german_month_name,
                'id' => (int)$latest_user_from_db['nutzer_id'],
                'name' => $latest_user_from_db['name'],
                'image' => 'https://ice-app.de/' . $latest_user_from_db['image']
            ];
            
            // The most recent user is now currentUser, so remove them from pastUsers list.
            // Since the list is sorted, this will be the first element.
            if (!empty($pastUsers)) {
                array_shift($pastUsers);
            }
        }
    }


    echo json_encode([
        'currentUser' => $currentUser,
        'pastUsers' => array_values($pastUsers)
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred: ' . $e->getMessage()]);
}
?>