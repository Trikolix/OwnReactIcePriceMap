<?php

function iceapp_encode_mail_subject(string $subjectText): string
{
    return '=?UTF-8?B?' . base64_encode($subjectText) . '?=';
}

function iceapp_build_mail_headers(string $contentType, string $from = 'Ice-App <noreply@ice-app.de>', string $replyTo = 'noreply@ice-app.de'): string
{
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: {$contentType}; charset=UTF-8\r\n";
    $headers .= "Content-Transfer-Encoding: quoted-printable\r\n";
    $headers .= "From: {$from}\r\n";
    $headers .= "Reply-To: {$replyTo}\r\n";

    return $headers;
}

function iceapp_normalize_mail_line_endings(string $body): string
{
    return preg_replace("/\r\n|\r|\n/", "\r\n", $body) ?? $body;
}

function iceapp_encode_quoted_printable_part(string $body): string
{
    return quoted_printable_encode(iceapp_normalize_mail_line_endings($body));
}

function iceapp_send_utf8_text_mail(string $to, string $subjectText, string $body, string $from = 'Ice-App <noreply@ice-app.de>'): bool
{
    return mail(
        $to,
        iceapp_encode_mail_subject($subjectText),
        iceapp_encode_quoted_printable_part($body),
        iceapp_build_mail_headers('text/plain', $from)
    );
}

function iceapp_send_utf8_html_mail(string $to, string $subjectText, string $body, string $from = 'Ice-App <noreply@ice-app.de>'): bool
{
    return mail(
        $to,
        iceapp_encode_mail_subject($subjectText),
        iceapp_encode_quoted_printable_part($body),
        iceapp_build_mail_headers('text/html', $from)
    );
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
    $message .= "Content-Transfer-Encoding: quoted-printable\r\n\r\n";
    $message .= iceapp_encode_quoted_printable_part($plainBody) . "\r\n\r\n";
    $message .= "--{$boundary}\r\n";
    $message .= "Content-Type: text/html; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: quoted-printable\r\n\r\n";
    $message .= iceapp_encode_quoted_printable_part($htmlBody) . "\r\n\r\n";
    $message .= "--{$boundary}--";

    return $message;
}

function iceapp_mail_escape(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function iceapp_build_notification_settings_footer_html(
    string $text,
    string $settingsUrl,
    string $linkLabel = 'Benachrichtigungseinstellungen öffnen'
): string {
    $safeText = iceapp_mail_escape($text);
    $safeSettingsUrl = iceapp_mail_escape($settingsUrl);
    $safeLinkLabel = iceapp_mail_escape($linkLabel);

    return "<div style=\"border-top:1px solid #f3dfad;background:#fff8e8;padding:18px 28px;color:#8a6a24;font-size:13px;line-height:1.45;\">"
        . "{$safeText}: <a href=\"{$safeSettingsUrl}\" style=\"color:#9a6500;text-decoration:underline;\">{$safeLinkLabel}</a>."
        . "</div>";
}

function iceapp_build_notification_settings_footer_plain(string $text, string $settingsUrl): string
{
    return rtrim($text) . ': ' . $settingsUrl;
}

function iceapp_build_mail_button_html(string $label, string $url, string $margin = '0 8px 8px 0'): string
{
    $safeLabel = iceapp_mail_escape($label);
    $safeUrl = iceapp_mail_escape($url);
    $safeMargin = iceapp_mail_escape($margin);

    return "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:separate;display:inline-table;margin:{$safeMargin};\">"
        . "<tr><td bgcolor=\"#2d1d00\" style=\"background-color:#2d1d00;border-radius:10px;mso-padding-alt:13px 18px;\">"
        . "<a href=\"{$safeUrl}\" style=\"display:inline-block;background-color:#2d1d00;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 18px;border-radius:10px;line-height:1.2;\">{$safeLabel}</a>"
        . "</td></tr></table>";
}

function iceapp_build_branded_action_mail_html(
    string $heading,
    array $paragraphs,
    string $buttonLabel,
    string $buttonUrl,
    string $fallbackTitle = 'Falls der Button nicht funktioniert',
    ?string $notificationSettingsFooterText = null,
    string $notificationSettingsUrl = ''
): string {
    $safeHeading = iceapp_mail_escape($heading);
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

    $body .= "<div style=\"margin:0 0 24px;\">" . iceapp_build_mail_button_html($buttonLabel, $buttonUrl, '0') . "</div>";
    $body .= "<div style=\"background:#fff4d6;border:1px solid #f3dfad;border-radius:12px;padding:14px 16px;margin:0 0 18px;\">";
    $body .= "<div style=\"font-weight:700;margin-bottom:6px;\">{$safeFallbackTitle}</div>";
    $body .= "<a href=\"{$safeButtonUrl}\" style=\"color:#b45309;word-break:break-all;\">{$safeButtonUrl}</a>";
    $body .= "</div>";
    $body .= "<p style=\"margin:0;\">Viele Grüße<br>dein Ice-App Team</p>";
    $body .= "</div>";

    if ($notificationSettingsFooterText !== null && $notificationSettingsUrl !== '') {
        $body .= iceapp_build_notification_settings_footer_html($notificationSettingsFooterText, $notificationSettingsUrl);
    }

    $body .= "</div></div></body></html>";

    return $body;
}

function iceapp_build_action_mail_plain(
    string $greeting,
    array $paragraphs,
    string $buttonUrl,
    string $fallbackIntro = 'Falls dein E-Mail-Programm keine HTML-Links unterstützt, kopiere bitte den folgenden Link in deinen Browser:',
    ?string $notificationSettingsFooterText = null,
    string $notificationSettingsUrl = ''
): string {
    $body = $greeting . "\n\n";
    foreach ($paragraphs as $paragraph) {
        $body .= (string) $paragraph . "\n\n";
    }
    $body .= $fallbackIntro . "\n";
    $body .= $buttonUrl . "\n\n";
    $body .= "Viele Grüße\nDein Ice-App Team";
    if ($notificationSettingsFooterText !== null && $notificationSettingsUrl !== '') {
        $body .= "\n\n" . iceapp_build_notification_settings_footer_plain($notificationSettingsFooterText, $notificationSettingsUrl);
    }

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
    string $from = 'Ice-App <noreply@ice-app.de>',
    ?string $notificationSettingsFooterText = null,
    string $notificationSettingsUrl = ''
): bool {
    $boundary = '----=' . md5(uniqid((string) mt_rand(), true));
    $plainBody = iceapp_build_action_mail_plain(
        $greeting,
        $paragraphs,
        $buttonUrl,
        'Falls dein E-Mail-Programm keine HTML-Links unterstützt, kopiere bitte den folgenden Link in deinen Browser:',
        $notificationSettingsFooterText,
        $notificationSettingsUrl
    );
    $htmlBody = iceapp_build_branded_action_mail_html(
        $heading,
        array_merge([$greeting], $paragraphs),
        $buttonLabel,
        $buttonUrl,
        $fallbackTitle,
        $notificationSettingsFooterText,
        $notificationSettingsUrl
    );

    return mail(
        $to,
        iceapp_encode_mail_subject($subjectText),
        iceapp_build_multipart_message($plainBody, $htmlBody, $boundary),
        iceapp_build_multipart_headers($boundary, $from)
    );
}

function iceapp_build_branded_bulk_mail_html(
    string $heading,
    array $paragraphs,
    array $buttons = [],
    bool $includeNotificationSettingsHint = false,
    string $settingsUrl = 'https://ice-app.de/account/settings'
): string {
    $safeHeading = iceapp_mail_escape($heading);
    $body = "<!doctype html><html><body style=\"margin:0;background:#fff7e8;font-family:Arial,Helvetica,sans-serif;color:#2d1d00;\">";
    $body .= "<div style=\"max-width:680px;margin:0 auto;padding:28px 16px;\">";
    $body .= "<div style=\"background:#fffdfa;border:1px solid #f3dfad;border-radius:18px;overflow:hidden;box-shadow:0 8px 24px rgba(124,79,0,0.10);\">";
    $body .= "<div style=\"background:#ffb522;color:#2d1d00;padding:24px 28px;\">";
    $body .= "<div style=\"font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;\">Ice-Tour</div>";
    $body .= "<h1 style=\"margin:8px 0 0;font-size:28px;line-height:1.18;\">{$safeHeading}</h1>";
    $body .= "</div>";
    $body .= "<div style=\"padding:28px;line-height:1.6;font-size:16px;\">";

    foreach ($paragraphs as $paragraph) {
        $body .= "<p style=\"margin:0 0 16px;\">" . nl2br(iceapp_mail_escape((string) $paragraph), false) . "</p>";
    }

    if (!empty($buttons)) {
        $body .= "<div style=\"display:block;margin:8px 0 22px;\">";
        foreach ($buttons as $button) {
            $url = iceapp_mail_escape((string) ($button['url'] ?? ''));
            if ($url === '') {
                continue;
            }
            $body .= iceapp_build_mail_button_html((string) ($button['label'] ?? 'Link öffnen'), (string) ($button['url'] ?? ''));
        }
        $body .= "</div>";
    }

    if (!empty($buttons)) {
        $body .= "<div style=\"background:#fff4d6;border:1px solid #f3dfad;border-radius:12px;padding:14px 16px;margin:0 0 18px;\">";
        $body .= "<div style=\"font-weight:700;margin-bottom:8px;\">Falls ein Button nicht funktioniert</div>";
        foreach ($buttons as $button) {
            $label = iceapp_mail_escape((string) ($button['label'] ?? 'Link'));
            $url = iceapp_mail_escape((string) ($button['url'] ?? ''));
            if ($url === '') {
                continue;
            }
            $body .= "<div style=\"margin-top:6px;\"><span style=\"font-weight:700;\">{$label}:</span> <a href=\"{$url}\" style=\"color:#b45309;word-break:break-all;\">{$url}</a></div>";
        }
        $body .= "</div>";
    }

    $body .= "</div>";

    if ($includeNotificationSettingsHint) {
        $body .= iceapp_build_notification_settings_footer_html(
            'Du erhältst diese Nachricht, weil du Ice-App News abonniert hast. Deine Benachrichtigungseinstellungen kannst du jederzeit in der Ice-App ändern',
            $settingsUrl
        );
    }

    $body .= "</div></div></body></html>";

    return $body;
}

function iceapp_build_bulk_mail_plain(
    string $heading,
    array $paragraphs,
    array $buttons = [],
    bool $includeNotificationSettingsHint = false,
    string $settingsUrl = 'https://ice-app.de/account/settings'
): string {
    $body = $heading . "\n\n";
    foreach ($paragraphs as $paragraph) {
        $body .= (string) $paragraph . "\n\n";
    }
    foreach ($buttons as $button) {
        $label = trim((string) ($button['label'] ?? 'Link öffnen'));
        $url = trim((string) ($button['url'] ?? ''));
        if ($url !== '') {
            $body .= "{$label}: {$url}\n";
        }
    }
    if (!empty($buttons)) {
        $body .= "\n";
    }
    if ($includeNotificationSettingsHint) {
        $body .= iceapp_build_notification_settings_footer_plain(
            'Du erhältst diese Nachricht, weil du Ice-App News abonniert hast. Deine Benachrichtigungseinstellungen kannst du jederzeit in der Ice-App ändern',
            $settingsUrl
        ) . "\n";
    }

    return rtrim($body);
}

function iceapp_send_branded_bulk_mail(
    string $to,
    string $subjectText,
    string $heading,
    array $paragraphs,
    array $buttons = [],
    bool $includeNotificationSettingsHint = false,
    string $settingsUrl = 'https://ice-app.de/account/settings',
    string $from = 'Ice-App <noreply@ice-app.de>'
): bool {
    $boundary = '----=' . md5(uniqid((string) mt_rand(), true));
    $plainBody = iceapp_build_bulk_mail_plain($heading, $paragraphs, $buttons, $includeNotificationSettingsHint, $settingsUrl);
    $htmlBody = iceapp_build_branded_bulk_mail_html($heading, $paragraphs, $buttons, $includeNotificationSettingsHint, $settingsUrl);

    return mail(
        $to,
        iceapp_encode_mail_subject($subjectText),
        iceapp_build_multipart_message($plainBody, $htmlBody, $boundary),
        iceapp_build_multipart_headers($boundary, $from)
    );
}

function iceapp_mail_is_safe_http_url(string $url): bool
{
    $scheme = parse_url($url, PHP_URL_SCHEME);
    return filter_var($url, FILTER_VALIDATE_URL) !== false && in_array($scheme, ['http', 'https'], true);
}

function iceapp_render_admin_markdown_inline_html(string $text): string
{
    $tokens = [];
    $text = preg_replace_callback('/\[button:\s*([^\]]+)\]\((https?:\/\/[^)\s]+)\)/i', static function (array $matches) use (&$tokens): string {
        $url = trim($matches[2]);
        if (!iceapp_mail_is_safe_http_url($url)) {
            return iceapp_mail_escape($matches[0]);
        }
        $key = '%%ICEAPP_TOKEN_' . count($tokens) . '%%';
        $tokens[$key] = iceapp_build_mail_button_html(trim($matches[1]), $url, '4px 0');
        return $key;
    }, $text);
    $text = preg_replace_callback('/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/i', static function (array $matches) use (&$tokens): string {
        $url = trim($matches[2]);
        if (!iceapp_mail_is_safe_http_url($url)) {
            return iceapp_mail_escape($matches[0]);
        }
        $key = '%%ICEAPP_TOKEN_' . count($tokens) . '%%';
        $tokens[$key] = '<a href="' . iceapp_mail_escape($url) . '" style="color:#b45309;text-decoration:underline;">' . iceapp_mail_escape(trim($matches[1])) . '</a>';
        return $key;
    }, $text);
    $safe = iceapp_mail_escape($text);
    $safe = preg_replace('/\*\*([^*]+)\*\*/', '<strong>$1</strong>', $safe);

    return strtr($safe, $tokens);
}

function iceapp_render_admin_markdown_inline_plain(string $text): string
{
    $text = preg_replace('/\[button:\s*([^\]]+)\]\((https?:\/\/[^)\s]+)\)/i', '$1: $2', $text);
    $text = preg_replace('/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/i', '$1: $2', $text);
    return preg_replace('/\*\*([^*]+)\*\*/', '$1', $text);
}

function iceapp_parse_admin_mail_markdown_blocks(string $markdown): array
{
    $lines = preg_split("/\R/", trim($markdown)) ?: [];
    $blocks = [];
    $paragraph = [];
    $listItems = [];

    $flushParagraph = static function () use (&$blocks, &$paragraph): void {
        if (!empty($paragraph)) {
            $blocks[] = ['type' => 'paragraph', 'text' => implode("\n", $paragraph)];
            $paragraph = [];
        }
    };
    $flushList = static function () use (&$blocks, &$listItems): void {
        if (!empty($listItems)) {
            $blocks[] = ['type' => 'list', 'items' => $listItems];
            $listItems = [];
        }
    };

    foreach ($lines as $line) {
        $trimmed = trim($line);
        if ($trimmed === '') {
            $flushParagraph();
            $flushList();
            continue;
        }

        if (preg_match('/^(#{1,3})\s+(.+)$/', $trimmed, $matches)) {
            $flushParagraph();
            $flushList();
            $blocks[] = [
                'type' => 'heading',
                'level' => min(3, strlen($matches[1])),
                'text' => trim($matches[2]),
            ];
            continue;
        }

        if (preg_match('/^-\s+(.+)$/', $trimmed, $matches)) {
            $flushParagraph();
            $listItems[] = trim($matches[1]);
            continue;
        }

        $flushList();
        $paragraph[] = $trimmed;
    }

    $flushParagraph();
    $flushList();

    return $blocks;
}

function iceapp_build_branded_admin_markdown_mail_html(
    string $heading,
    string $markdown,
    array $fallbackButtons = [],
    bool $includeNotificationSettingsHint = false,
    string $settingsUrl = 'https://ice-app.de/account/settings'
): string {
    $safeHeading = iceapp_mail_escape($heading);
    $blocks = iceapp_parse_admin_mail_markdown_blocks($markdown);

    $body = "<!doctype html><html><body style=\"margin:0;background:#fff7e8;font-family:Arial,Helvetica,sans-serif;color:#2d1d00;\">";
    $body .= "<div style=\"max-width:680px;margin:0 auto;padding:28px 16px;\">";
    $body .= "<div style=\"background:#fffdfa;border:1px solid #f3dfad;border-radius:18px;overflow:hidden;box-shadow:0 8px 24px rgba(124,79,0,0.10);\">";
    $body .= "<div style=\"background:#ffb522;color:#2d1d00;padding:24px 28px;\">";
    $body .= "<div style=\"font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;\">Ice-Tour</div>";
    $body .= "<h1 style=\"margin:8px 0 0;font-size:28px;line-height:1.18;\">{$safeHeading}</h1>";
    $body .= "</div>";
    $body .= "<div style=\"padding:28px;line-height:1.6;font-size:16px;\">";

    foreach ($blocks as $block) {
        if ($block['type'] === 'heading') {
            $fontSize = ((int) $block['level']) === 1 ? '23px' : (((int) $block['level']) === 2 ? '20px' : '18px');
            $body .= "<h2 style=\"margin:22px 0 10px;font-size:{$fontSize};line-height:1.25;color:#2d1d00;\">" . iceapp_mail_escape((string) $block['text']) . "</h2>";
        } elseif ($block['type'] === 'list') {
            $body .= "<ul style=\"margin:0 0 18px;padding-left:22px;\">";
            foreach ($block['items'] as $item) {
                $body .= "<li style=\"margin:0 0 8px;\">" . iceapp_render_admin_markdown_inline_html((string) $item) . "</li>";
            }
            $body .= "</ul>";
        } else {
            $body .= "<p style=\"margin:0 0 16px;\">" . nl2br(iceapp_render_admin_markdown_inline_html((string) $block['text']), false) . "</p>";
        }
    }

    if (!empty($fallbackButtons)) {
        $body .= "<div style=\"display:block;margin:8px 0 22px;\">";
        foreach ($fallbackButtons as $button) {
            $url = iceapp_mail_escape((string) ($button['url'] ?? ''));
            if ($url !== '') {
                $body .= iceapp_build_mail_button_html((string) ($button['label'] ?? 'Link öffnen'), (string) ($button['url'] ?? ''));
            }
        }
        $body .= "</div>";
    }

    $body .= "</div>";

    if ($includeNotificationSettingsHint) {
        $body .= iceapp_build_notification_settings_footer_html(
            'Du erhältst diese Nachricht, weil du Ice-App News abonniert hast. Deine Benachrichtigungseinstellungen kannst du jederzeit in der Ice-App ändern',
            $settingsUrl
        );
    }

    $body .= "</div></div></body></html>";

    return $body;
}

function iceapp_build_admin_markdown_mail_plain(
    string $heading,
    string $markdown,
    array $fallbackButtons = [],
    bool $includeNotificationSettingsHint = false,
    string $settingsUrl = 'https://ice-app.de/account/settings'
): string {
    $blocks = iceapp_parse_admin_mail_markdown_blocks($markdown);
    $body = $heading . "\n\n";
    foreach ($blocks as $block) {
        if ($block['type'] === 'heading') {
            $body .= strtoupper((string) $block['text']) . "\n\n";
        } elseif ($block['type'] === 'list') {
            foreach ($block['items'] as $item) {
                $body .= "- " . iceapp_render_admin_markdown_inline_plain((string) $item) . "\n";
            }
            $body .= "\n";
        } else {
            $body .= iceapp_render_admin_markdown_inline_plain((string) $block['text']) . "\n\n";
        }
    }
    foreach ($fallbackButtons as $button) {
        $label = trim((string) ($button['label'] ?? 'Link öffnen'));
        $url = trim((string) ($button['url'] ?? ''));
        if ($url !== '') {
            $body .= "{$label}: {$url}\n";
        }
    }
    if (!empty($fallbackButtons)) {
        $body .= "\n";
    }
    if ($includeNotificationSettingsHint) {
        $body .= iceapp_build_notification_settings_footer_plain(
            'Du erhältst diese Nachricht, weil du Ice-App News abonniert hast. Deine Benachrichtigungseinstellungen kannst du jederzeit in der Ice-App ändern',
            $settingsUrl
        ) . "\n";
    }

    return rtrim($body);
}

function iceapp_send_branded_admin_markdown_mail(
    string $to,
    string $subjectText,
    string $heading,
    string $markdown,
    array $fallbackButtons = [],
    bool $includeNotificationSettingsHint = false,
    string $settingsUrl = 'https://ice-app.de/account/settings',
    string $from = 'Ice-App <noreply@ice-app.de>'
): bool {
    $boundary = '----=' . md5(uniqid((string) mt_rand(), true));
    $plainBody = iceapp_build_admin_markdown_mail_plain($heading, $markdown, $fallbackButtons, $includeNotificationSettingsHint, $settingsUrl);
    $htmlBody = iceapp_build_branded_admin_markdown_mail_html($heading, $markdown, $fallbackButtons, $includeNotificationSettingsHint, $settingsUrl);

    return mail(
        $to,
        iceapp_encode_mail_subject($subjectText),
        iceapp_build_multipart_message($plainBody, $htmlBody, $boundary),
        iceapp_build_multipart_headers($boundary, $from)
    );
}
