<?php

class SystemmeldungException extends RuntimeException
{
    public $httpStatus;
    public $details;
    public function __construct(string $message, int $httpStatus = 422, array $details = [])
    {
        parent::__construct($message);
        $this->httpStatus = $httpStatus;
        $this->details = $details;
    }
}

function systemmeldungUrl(string $value): string
{
    $value = trim($value);
    if ($value === '') return '';
    if (preg_match('/[\x00-\x20\\\\]/', $value) || strpos($value, '//') === 0) {
        throw new SystemmeldungException('Ungültiges Linkziel.');
    }
    if ($value[0] === '/') return $value;
    if (!filter_var($value, FILTER_VALIDATE_URL) || !in_array(strtolower((string)parse_url($value, PHP_URL_SCHEME)), ['http', 'https'], true)
        || parse_url($value, PHP_URL_USER) !== null || parse_url($value, PHP_URL_PASS) !== null) {
        throw new SystemmeldungException('Links müssen mit /, https:// oder http:// beginnen.');
    }
    return $value;
}

function systemmeldungForm(array $input, bool $publishing = false): array
{
    $limits = ['title' => 160, 'message' => 16000, 'link_label' => 100, 'link_url' => 255,
        'email_subject' => 180, 'email_heading' => 180, 'email_body' => 100000];
    $form = [];
    $errors = [];
    foreach ($limits as $key => $max) {
        $value = $input[$key] ?? '';
        if (!is_string($value) || mb_strlen($value) > $max || strpos($value, "\0") !== false) {
            $errors[$key] = "Text erforderlich, höchstens {$max} Zeichen.";
        } else {
            $form[$key] = trim($value);
        }
    }
    if ($errors) throw new SystemmeldungException('Bitte Eingaben prüfen.', 422, ['fields' => $errors]);
    foreach (['link_url'] as $key) {
        try { $form[$key] = systemmeldungUrl($form[$key]); }
        catch (SystemmeldungException $e) { $errors[$key] = $e->getMessage(); }
    }
    $mode = $input['mail_send_mode'] ?? 'subscribers';
    if (!in_array($mode, ['none', 'subscribers', 'all'], true)) $errors['mail_send_mode'] = 'Ungültiger Versandmodus.';
    $form['mail_send_mode'] = $mode;
    foreach (['push_web', 'push_android'] as $key) {
        if (isset($input[$key]) && !is_bool($input[$key])) $errors[$key] = 'Boolescher Wert erforderlich.';
        $form[$key] = ($input[$key] ?? false) === true;
    }
    $buttons = $input['email_buttons'] ?? [];
    if (!is_array($buttons) || array_keys($buttons) !== range(0, count($buttons) - 1) && count($buttons) !== 0 || count($buttons) > 5) {
        $errors['email_buttons'] = 'Höchstens fünf Buttons erlaubt.';
        $buttons = [];
    }
    $form['email_buttons'] = [];
    foreach ($buttons as $button) {
        if (!is_array($button) || !is_string($button['label'] ?? null) || !is_string($button['url'] ?? null)
            || mb_strlen($button['label']) > 100 || mb_strlen($button['url']) > 255) {
            $errors['email_buttons'] = 'Buttonbeschriftung und gültiger Link erforderlich.';
            continue;
        }
        if (trim($button['label']) === '' && trim($button['url']) === '') continue;
        try {
            $url = systemmeldungUrl($button['url']);
            if ($url === '' || trim($button['label']) === '') throw new SystemmeldungException('Buttonbeschriftung und Link erforderlich.');
            $form['email_buttons'][] = ['label' => trim($button['label']), 'url' => $url];
        } catch (SystemmeldungException $e) { $errors['email_buttons'] = $e->getMessage(); }
    }
    if ($publishing) {
        if ($form['title'] === '') $errors['title'] = 'Titel ist erforderlich.';
        if ($form['message'] === '') $errors['message'] = 'App-Nachricht ist erforderlich.';
        if ($mode !== 'none' && $form['email_body'] === '') $errors['email_body'] = 'Mailtext ist erforderlich.';
        if ($mode === 'all' && (($input['force_mail_all_confirmed'] ?? false) !== true || ($input['force_mail_all_confirm_text'] ?? '') !== 'EMAIL AN ALLE')) {
            $errors['mail_send_mode'] = 'E-Mail an alle muss ausdrücklich bestätigt werden.';
        }
    }
    if ($errors) throw new SystemmeldungException('Bitte Eingaben prüfen.', 422, ['fields' => $errors]);
    return $form;
}

function systemmeldungMailData(array $form): array
{
    $buttons = $form['email_buttons'];
    if (!$buttons && $form['link_url'] !== '') $buttons[] = ['label' => $form['link_label'] ?: 'Mehr erfahren', 'url' => $form['link_url']];
    foreach ($buttons as &$button) {
        if ($button['url'][0] === '/') $button['url'] = 'https://ice-app.de' . $button['url'];
    }
    unset($button);
    return ['subject' => $form['email_subject'] ?: 'Ice-App: ' . $form['title'],
        'heading' => $form['email_heading'] ?: $form['title'], 'body' => $form['email_body'],
        'buttons' => $buttons, 'include_settings_hint' => $form['mail_send_mode'] === 'subscribers'];
}
