1. **Backend Database Modification (`backend/lib/comment_award.php` and `backend/kommentare.php`)**
   - Create a database migration script/function (similar to `ensureKommentarUserRegistrationSupport`) to add a `user_award_id` column to the `kommentare` table if it doesn't exist, and add an index. Include it in `backend/kommentare.php`.
   - Modify `backend/kommentare.php` to handle `user_award_id`:
     - Allow `user_award_id` in validation rules when listing, creating, deleting, and updating comments.
     - Adjust queries to support the new column.
     - Implement `handleAwardKommentarBenachrichtigungen` to send notifications to the user who received the award, and others involved in the comment thread.
     - Delete notifications properly when a comment is deleted.
   - Modify `backend/activity_feed.php` to fetch `commentCount` for awards (in the query for `user_awards ua`). Add `(SELECT COUNT(*) FROM kommentare k WHERE k.user_award_id = ua.id) AS commentCount`.

2. **Frontend `CommentSection.jsx` update**
   - Accept a new `userAwardId` prop.
   - Update `isValidProps` logic.
   - Change API request payloads (`user_award_id: userAwardId`).
   - Implement simple Smiley feature (like a button bar above/below the textarea) allowing users to easily click and add emojis like "👍", "❤️", "🍦", "😂", "🥳" into the `newComment` and `editingText`.

3. **Frontend `AwardCard.jsx` modification**
   - Import `CommentSection` and `CommentToggle` from `../styles/SharedStyles`.
   - Add state for toggling comments (`areCommentsVisible`).
   - Insert `CommentToggle` and `<CommentSection userAwardId={award.id} type="award" />` below the `ContentWrapper`.

4. **Pre-commit checks**
   - Ensure to follow pre-commit check instructions and execute properly.
