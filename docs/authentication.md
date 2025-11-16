# API Authentication Overview

This project now issues short opaque API tokens for every successful login.  
The tokens are stored in `user_api_tokens` with metadata for auditing and a sliding expiry:

* Idle timeout: 30 days (`AUTH_TOKEN_TTL_DAYS` in `backend/lib/auth.php`)
* Each authenticated request extends the expiry window (sliding session)
* Tokens can be revoked individually (`revokeToken`) or per user (`revokeAllTokensForUser`)

## Backend changes

1. **Database**
   * Apply `backend/Database/user_api_tokens.sql` to create the storage table.

2. **Token helpers**
   * `backend/lib/auth.php` exposes:
     * `generateAuthToken(PDO $pdo, int $userId)`
     * `requireAuth(PDO $pdo)` – terminates the request with `401` if missing/invalid
     * `getAuthTokenFromRequest()`, `revokeToken()`, `revokeAllTokensForUser()`
   * Reuse this helper in every protected endpoint: `require_once __DIR__ . '/lib/auth.php'; $auth = requireAuth($pdo);`

3. **Endpoints**
   * `backend/userManagement/login.php` now returns `{ userId, username, token, expires_at }` and sets an `HttpOnly` cookie.
   * `backend/userManagement/session.php` validates the caller and returns the user payload (handy for the frontend boot flow).
   * `backend/userManagement/logout.php` revokes the current token.

4. **CORS**
   * `Authorization` is now part of the allowed headers (see `backend/db_connect.php`).

## Frontend changes

1. **Fetch interceptor**
   * `src/utils/installAuthFetch.js` injects a `Bearer …` header for every request against `REACT_APP_API_BASE_URL`.
   * `401` responses emit a global `auth:unauthorized` event which forces a logout.

2. **Session handling**
   * `src/context/UserContext.js` stores the auth token + expiry in `localStorage`, validates it once on boot via `/userManagement/session.php`, and exposes `login`/`logout`.
   * `src/LoginModal.js` consumes the new login payload and no longer persists credentials manually.

## How to protect an endpoint

```php
<?php
require_once __DIR__ . '/db_connect.php';
require_once __DIR__ . '/lib/auth.php';

$auth = requireAuth($pdo); // dies with 401 if missing
$currentUserId = (int)$auth['user_id'];

// …your logic…
```

## Notes & next steps

* Reuse `requireAuth` on all write endpoints (`checkins`, `reviews`, admin tools, …).
* Call `revokeAllTokensForUser($pdo, $userId)` after password resets or manual bans.
* Consider issuing device names and exposing a “logout from other devices” UI built on top of `user_api_tokens`.

