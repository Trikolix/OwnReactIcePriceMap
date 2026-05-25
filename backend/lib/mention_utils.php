<?php
require_once __DIR__ . '/notification_dispatcher.php';

/**
 * Parses text for @username mentions, looks up the corresponding users,
 * and triggers a notification for each mentioned user.
 *
 * @param PDO $pdo
 * @param string|null $text The text containing potential mentions (e.g., kommentar, beschreibung)
 * @param int $sourceUserId The ID of the user who created the text (so they aren't notified of their own mentions)
 * @param string $referenceType The type of entity the text belongs to (e.g., 'checkin', 'route', 'kommentar')
 * @param int $referenceId The ID of the entity
 * @param array $extraData Additional data for the notification
 * @return array The IDs of the mentioned users
 */
function processTextMentions(PDO $pdo, ?string $text, int $sourceUserId, string $referenceType, int $referenceId, array $extraData = []): array
{
    if (empty($text)) {
        return [];
    }

    // Find all @username matches (letters, numbers, underscore, dot, dash)
    if (!preg_match_all('/@([a-zA-Z0-9_.-]+)/', $text, $matches)) {
        return [];
    }

    // $matches[1] contains the usernames without the @ symbol
    $usernames = array_unique($matches[1]);
    $mentionedUserIds = [];

    // Fetch the username of the source user for the notification text
    $stmtSource = $pdo->prepare("SELECT username FROM nutzer WHERE id = ?");
    $stmtSource->execute([$sourceUserId]);
    $sourceUsername = $stmtSource->fetchColumn();
    if (!$sourceUsername) {
        $sourceUsername = "Ein Nutzer";
    }

    $notificationText = "$sourceUsername hat dich in einem Beitrag erwähnt.";

    foreach ($usernames as $username) {
        // Find user by username
        $stmtUser = $pdo->prepare("SELECT id FROM nutzer WHERE username = ?");
        $stmtUser->execute([$username]);
        $targetUserId = $stmtUser->fetchColumn();

        if ($targetUserId && (int)$targetUserId !== $sourceUserId) {
            $targetUserId = (int)$targetUserId;
            $mentionedUserIds[] = $targetUserId;

            // Send notification
            createNotification(
                $pdo,
                $targetUserId,
                'mention', // new notification type
                $referenceId,
                $notificationText,
                array_merge($extraData, [
                    'source_user_id' => $sourceUserId,
                    'reference_id' => $referenceId,
                    'reference_type' => $referenceType
                ])
            );
        }
    }

    return $mentionedUserIds;
}
