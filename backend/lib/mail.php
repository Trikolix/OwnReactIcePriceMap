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
