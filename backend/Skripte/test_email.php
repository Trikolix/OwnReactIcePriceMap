<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

$empfaenger1 = 'ch_helbig@mail.de';
$betreff = 'Ice-App Debug E-Mail';
$nachricht = '<html><body><h1>Test-E-Mail</h1><p>Wenn Sie diese E-Mail erhalten, funktioniert die mail()-Funktion grundsätzlich.</p></body></html>';

$headers = "MIME-Version: 1.0\r\n";
$headers .= "Content-type: text/html; charset=UTF-8\r\n";
$headers .= "From: noreply@ice-app.de\r\n";

// Senden der E-Mail und Überprüfen des Rückgabewerts
$mail_sent = @mail($empfaenger1, $betreff, $nachricht, $headers);

if ($mail_sent) {
    echo "PHP: Die E-Mail wurde erfolgreich zum Versand an den Mailserver übergeben.";
} else {
    echo "PHP: Die mail()-Funktion ist fehlgeschlagen.";
    $error = error_get_last();
    if ($error && strpos($error['message'], 'mail()') !== false) {
        echo "\nFehlermeldung: " . $error['message'];
    } else {
        echo "\nEs wurde kein spezifischer PHP-Fehler für mail() gefunden. Dies deutet oft auf ein Konfigurationsproblem mit dem Mailserver (sendmail) hin.";
    }
}
?>
