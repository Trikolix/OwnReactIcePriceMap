<?php

function iceapp_encode_mail_subject(string $subjectText): string
{
    return '=?UTF-8?B?' . base64_encode($subjectText) . '?=';
}

function iceapp_build_mail_headers(string $contentType, string $from = 'Ice-App <noreply@ice-app.de>', string $replyTo = 'noreply@ice-app.de'): string
{
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: {$contentType}; charset=UTF-8\r\n";
    $headers .= "Content-Transfer-Encoding: 8bit\r\n";
    $headers .= "From: {$from}\r\n";
    $headers .= "Reply-To: {$replyTo}\r\n";

    return $headers;
}

function iceapp_send_utf8_text_mail(string $to, string $subjectText, string $body, string $from = 'Ice-App <noreply@ice-app.de>'): bool
{
    return mail($to, iceapp_encode_mail_subject($subjectText), $body, iceapp_build_mail_headers('text/plain', $from));
}

function iceapp_send_utf8_html_mail(string $to, string $subjectText, string $body, string $from = 'Ice-App <noreply@ice-app.de>'): bool
{
    return mail($to, iceapp_encode_mail_subject($subjectText), $body, iceapp_build_mail_headers('text/html', $from));
}

function iceapp_build_multipart_headers(string $boundary, string $from = 'Ice-App <noreply@ice-app.de>', string $replyTo = 'noreply@ice-app.de'): string
{
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";
    $headers .= "From: {$from}\r\n";
    $headers .= "Reply-To: {$replyTo}\r\n";

    return $headers;
}

function iceapp_build_multipart_message(string $plainBody, string $htmlBody, string $boundary): string
{
    $message = "--{$boundary}\r\n";
    $message .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $message .= $plainBody . "\r\n\r\n";
    $message .= "--{$boundary}\r\n";
    $message .= "Content-Type: text/html; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $message .= $htmlBody . "\r\n\r\n";
    $message .= "--{$boundary}--";

    return $message;
}

function iceapp_mail_escape(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function iceapp_build_branded_action_mail_html(
    string $heading,
    array $paragraphs,
    string $buttonLabel,
    string $buttonUrl,
    string $fallbackTitle = 'Falls der Button nicht funktioniert'
): string {
    $safeHeading = iceapp_mail_escape($heading);
    $safeButtonLabel = iceapp_mail_escape($buttonLabel);
    $safeButtonUrl = iceapp_mail_escape($buttonUrl);
    $safeFallbackTitle = iceapp_mail_escape($fallbackTitle);

    $body = "<!doctype html><html><body style=\"margin:0;background:#fff7e8;font-family:Arial,Helvetica,sans-serif;color:#2d1d00;\">";
    $body .= "<div style=\"max-width:640px;margin:0 auto;padding:28px 16px;\">";
    $body .= "<div style=\"background:#fffdfa;border:1px solid #f3dfad;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(124,79,0,0.10);\">";
    $body .= "<div style=\"background:#ffb522;color:#2d1d00;padding:22px 26px;\">";
    $body .= "<div style=\"font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;\">Ice-App</div>";
    $body .= "<h1 style=\"margin:8px 0 0;font-size:26px;line-height:1.2;\">{$safeHeading}</h1>";
    $body .= "</div>";
    $body .= "<div style=\"padding:26px;line-height:1.58;font-size:16px;\">";

    foreach ($paragraphs as $paragraph) {
        $body .= "<p style=\"margin:0 0 16px;\">" . iceapp_mail_escape((string) $paragraph) . "</p>";
    }

    $body .= "<p style=\"margin:0 0 24px;\"><a href=\"{$safeButtonUrl}\" style=\"display:inline-block;background:#2d1d00;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 18px;border-radius:10px;\">{$safeButtonLabel}</a></p>";
    $body .= "<div style=\"background:#fff4d6;border:1px solid #f3dfad;border-radius:12px;padding:14px 16px;margin:0 0 18px;\">";
    $body .= "<div style=\"font-weight:700;margin-bottom:6px;\">{$safeFallbackTitle}</div>";
    $body .= "<a href=\"{$safeButtonUrl}\" style=\"color:#b45309;word-break:break-all;\">{$safeButtonUrl}</a>";
    $body .= "</div>";
    $body .= "<p style=\"margin:0;\">Viele Grüße<br>dein Ice-App Team</p>";
    $body .= "</div></div></div></body></html>";

    return $body;
}

function iceapp_build_action_mail_plain(
    string $greeting,
    array $paragraphs,
    string $buttonUrl,
    string $fallbackIntro = 'Falls dein E-Mail-Programm keine HTML-Links unterstützt, kopiere bitte den folgenden Link in deinen Browser:'
): string {
    $body = $greeting . "\n\n";
    foreach ($paragraphs as $paragraph) {
        $body .= (string) $paragraph . "\n\n";
    }
    $body .= $fallbackIntro . "\n";
    $body .= $buttonUrl . "\n\n";
    $body .= "Viele Grüße\nDein Ice-App Team";

    return $body;
}

function iceapp_send_branded_action_mail(
    string $to,
    string $subjectText,
    string $heading,
    string $greeting,
    array $paragraphs,
    string $buttonLabel,
    string $buttonUrl,
    string $fallbackTitle = 'Falls der Button nicht funktioniert',
    string $from = 'Ice-App <noreply@ice-app.de>'
): bool {
    $boundary = '----=' . md5(uniqid((string) mt_rand(), true));
    $plainBody = iceapp_build_action_mail_plain($greeting, $paragraphs, $buttonUrl);
    $htmlBody = iceapp_build_branded_action_mail_html($heading, array_merge([$greeting], $paragraphs), $buttonLabel, $buttonUrl, $fallbackTitle);

    return mail(
        $to,
        iceapp_encode_mail_subject($subjectText),
        iceapp_build_multipart_message($plainBody, $htmlBody, $boundary),
        iceapp_build_multipart_headers($boundary, $from)
    );
}
