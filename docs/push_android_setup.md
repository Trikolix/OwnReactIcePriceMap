# Push and Android Setup

## Required server env vars

- `ICEAPP_WEB_PUSH_VAPID_PUBLIC_KEY`
- `ICEAPP_WEB_PUSH_VAPID_PRIVATE_KEY_PEM`
- `ICEAPP_WEB_PUSH_VAPID_SUBJECT`
- `ICEAPP_FCM_PROJECT_ID`
- `ICEAPP_FCM_SERVICE_ACCOUNT_EMAIL`
- `ICEAPP_FCM_PRIVATE_KEY_PEM`

## Android release checklist

- Place the real Firebase `google-services.json` in `android/app/`. This file is intentionally gitignored; do not commit dummy or production Firebase credentials.
- Set signing config for the release build.
- Create an Android notification channel with the id `ice_app_notifications`.
- Publish `assetlinks.json` for `de.thegourmetcyclists.iceapp` with the release SHA-256 fingerprint under `https://ice-app.de/.well-known/assetlinks.json`.
- Run `npm run build` and `npm run cap:sync` before opening Android Studio.

## Notes

- Browser push uses VAPID and wakes the service worker without a payload; the worker pulls pending deliveries from the backend.
- Android push uses FCM HTTP v1 and the native Capacitor push plugin.
