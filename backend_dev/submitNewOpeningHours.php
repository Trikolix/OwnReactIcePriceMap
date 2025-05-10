<?php
require_once  __DIR__ . '/db_connect.php';
// Konfiguration für den E-Mail-Versand
$to = 'admin@ice-app.de'; // Ersetze durch deine E-Mail-Adresse
$subject = 'Neue Öffnungszeiten vorgeschlagen';

// Daten aus dem POST-Request abrufen
$shopId = isset($_POST['shopId']) ? $_POST['shopId'] : '';
$shopName = isset($_POST['shopName']) ? $_POST['shopName'] : '';
$userId = isset($_POST['userId']) ? $_POST['userId'] : '';
$username = isset($_POST['username']) ? $_POST['username'] : '';

$newOpeningHours = isset($_POST['newOpeningHours']) ? $_POST['newOpeningHours'] : '';

// Überprüfen, ob alle notwendigen Daten vorhanden sind
if ($shopId && $userId && $newOpeningHours) {
    // E-Mail-Inhalt erstellen
    $message = "Neue Öffnungszeiten wurden vorgeschlagen:\n\n";
    $message .= "Eisdiele: $shopName (Shop-ID: $shopId)\n";
    $message .= "Username: $username (ID: $userId)\n";
    $message .= "Neue Öffnungszeiten:\n\n$newOpeningHours\n";

    // E-Mail-Header
    $headers = 'From: no-reply@ice-app.de' . "\r\n" .
                'Reply-To: no-reply@ice-app.de' . "\r\n" .
                'X-Mailer: PHP/' . phpversion();

    // E-Mail senden
    if (mail($to, $subject, $message, $headers)) {
        echo json_encode(['status' => 'success', 'message' => 'E-Mail erfolgreich gesendet.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Fehler beim Senden der E-Mail.']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Ungültige Daten.']);
}
?>
