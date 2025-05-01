<?php
require __DIR__ . '/../vendor/autoload.php';

use Kreait\Firebase\Factory;

$firebase = (new Factory())
    ->withServiceAccount(__DIR__ . '/../iceapp-787d8-firebase-adminsdk-fbsvc-ada9ca36ba.json');

$auth = $firebase->createAuth();
?>
