<?php
// backend/firebase_init.php
require '../vendor/autoload.php'; // Pfad anpassen, falls notwendig

use Kreait\Firebase\Factory;
use Kreait\Firebase\ServiceAccount;

$serviceAccount = ServiceAccount::fromJsonFile(__DIR__ . '/path/to/serviceAccountKey.json');
$firebase = (new Factory)
    ->withServiceAccount($serviceAccount)
    ->create();

$auth = $firebase->getAuth();
?>