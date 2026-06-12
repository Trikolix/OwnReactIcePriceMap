1. **Frontend Mentions Input Component Improvements (`src/components/MentionTextarea.jsx`)**:
    - Update the autocomplete dropdown to appear directly below the cursor rather than at the bottom of the textarea.
    - This requires calculating the caret coordinates inside the textarea (e.g., using a library like `textarea-caret` or a simple dummy `div` mirroring method). Since we don't want to install extra dependencies unless necessary, I'll use a reliable `div` mirroring approach to calculate the `X` and `Y` offset of the caret.

2. **Backend Notification Deeplink Routing (`backend/lib/notification_dispatcher.php` & `kommentare.php`)**:
    - Currently, `processTextMentions` sends `mention` notifications with a reference ID.
    - We need to ensure that when clicking the notification, the user is navigated *directly* to the entity (and specific comment) where they were mentioned.
    - Let's trace how the deeplink is currently constructed for `mention`:
      ```php
      case 'mention':
          return $recipientId > 0
              ? '/user/' . $recipientId . '?mentionNotificationId=' . (int)$notification['id']
              : null;
      ```
    - The prompt says "soll man direkt zu dem entsprechenden Kommentar wo man erwähnt wurde geleitet werden."
    - This means the deeplink should point to the actual item.
    - `kommentare.php` calls: `processTextMentions($pdo, $kommentar, $currentUserId, 'checkin_kommentar', $checkinId, ['kommentar_id' => $kommentarId])`.
    - We should update `buildNotificationDeeplink` in `notification_dispatcher.php` to construct the correct URL based on the `reference_type` and `kommentar_id` in `zusatzdaten`.
    - Let's examine how `notify_comment` is routed and replicate that for `mention`, or we can have `processTextMentions` pass the exact deeplink data.

3. **Pre-commit Checks**: Run relevant checks and verify the UI.
4. **Submit Changes**: Commit the fixes and update the PR.
