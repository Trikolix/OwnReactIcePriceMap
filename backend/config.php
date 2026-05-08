<?php

/**
 * ZENTRALE KONFIGURATION
 * Lädt FCM-Daten automatisch aus der firebase-key.json
 */

// --- WEB PUSH (VAPID) ---
putenv('ICEAPP_WEB_PUSH_VAPID_PUBLIC_KEY=BJQj9hzAfr-gcqZZqd-NECKiY-jqaP_t0DPYrnssuD3hFkcKQQgl2LexxBSHYTRrktRlKHDO5BgMvZSY-yfyniM');
$vapid_private_key = <<<EOT
-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg1691bNrKHDINiway
TILm258g2SKY4wXjO5OMNtHOWuqhRANCAASUI/YcwH6/oHKmWanfjRAiomPo6mj/
7dAz2K57LLg94RZHCkEIJdi3scQUh2E0a5LUZShwzuQYDL2UmPsn8p4j
-----END PRIVATE KEY-----
EOT;
putenv('ICEAPP_WEB_PUSH_VAPID_PRIVATE_KEY_PEM=' . $vapid_private_key);
putenv('ICEAPP_WEB_PUSH_VAPID_SUBJECT=mailto:noreply@ice-app.de');


// --- ANDROID PUSH (FCM) ---
$jsonPath = __DIR__ . '/firebase-key.json';

if (file_exists($jsonPath)) {
    $config = json_decode(file_get_contents($jsonPath), true);
    if ($config) {
        putenv('ICEAPP_FCM_PROJECT_ID=' . ($config['project_id'] ?? ''));
        putenv('ICEAPP_FCM_SERVICE_ACCOUNT_EMAIL=' . ($config['client_email'] ?? ''));
        putenv('ICEAPP_FCM_PRIVATE_KEY_PEM=' . ($config['private_key'] ?? ''));
    }
} else {
    // Fallback auf manuelle Werte (falls JSON nicht da)
    putenv('ICEAPP_FCM_PROJECT_ID=iceapp-787d8');
    putenv('ICEAPP_FCM_SERVICE_ACCOUNT_EMAIL=firebase-adminsdk-fbsvc@iceapp-787d8.iam.gserviceaccount.com');
}
