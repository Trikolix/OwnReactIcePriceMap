<?php
require_once __DIR__ . '/../lib/preset_avatars.php';
require_once  __DIR__ . '/../db_connect.php';

$avatars = listPresetAvatars();
echo json_encode(['avatars' => $avatars]);
