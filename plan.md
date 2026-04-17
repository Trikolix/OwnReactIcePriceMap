1.  **Create the Cronjob Script (`backend/Skripte/cron_dead_icecream_stores.php`)**
    -   Query for all "dead" `eisdielen` (created > 1 month ago, 0 A-items, not permanently closed).
    -   Calculate `b_items_present` (address, opening hours, website) to determine the grace period (4 months, 6 months, 9 months, or 12 months).
    -   Identify stores approaching their deletion deadline (1 month before).
    -   Identify stores that have passed their deletion deadline.
    -   Use `createNotification()` to send in-app notifications (systemmeldung).
    -   Optionally dispatch an email if user has notifications enabled (`user_notification_settings`).
    -   "Delete" stores by setting `status = 'permanent_closed'` if they passed the deadline.
    -   Log actions in an execution log or echo to terminal.

2.  **Add Pre-commit Step**
    -   Execute `pre_commit_instructions` to ensure the new script satisfies project standards.
