<?php
$servername = "localhost";
$username = "dein_db_user";
$password = "dein_db_passwort";
$database = "eis_karte";

$conn = new mysqli($servername, $username, $password, $database);

if ($conn->connect_error) {
    die("Verbindung fehlgeschlagen: " . $conn->connect_error);
}
?>
