<?php

function normalizeCountryCode(?string $countryCode): ?string
{
    if ($countryCode === null) {
        return null;
    }

    $countryCode = strtoupper(trim($countryCode));
    $alpha3ToAlpha2 = [
        'AUT' => 'AT',
        'CHE' => 'CH',
        'DEU' => 'DE',
        'EGY' => 'EG',
        'ESP' => 'ES',
        'FRA' => 'FR',
        'GBR' => 'GB',
        'ITA' => 'IT',
        'MAR' => 'MA',
        'USA' => 'US',
    ];

    if (isset($alpha3ToAlpha2[$countryCode])) {
        return $alpha3ToAlpha2[$countryCode];
    }

    return $countryCode !== '' ? $countryCode : null;
}

function getKnownCurrencyCatalog(): array
{
    static $catalog = [
        'AED' => ['name' => 'VAE-Dirham', 'symbol' => 'AED'],
        'AFN' => ['name' => 'Afghani', 'symbol' => 'AFN'],
        'ALL' => ['name' => 'Albanischer Lek', 'symbol' => 'L'],
        'AMD' => ['name' => 'Armenischer Dram', 'symbol' => 'AMD'],
        'ARS' => ['name' => 'Argentinischer Peso', 'symbol' => '$'],
        'AUD' => ['name' => 'Australischer Dollar', 'symbol' => '$'],
        'AZN' => ['name' => 'Aserbaidschanischer Manat', 'symbol' => 'AZN'],
        'BAM' => ['name' => 'Konvertible Mark', 'symbol' => 'KM'],
        'BGN' => ['name' => 'Bulgarischer Lew', 'symbol' => 'BGN'],
        'BRL' => ['name' => 'Brasilianischer Real', 'symbol' => 'R$'],
        'BYN' => ['name' => 'Weissrussischer Rubel', 'symbol' => 'Br'],
        'CAD' => ['name' => 'Kanadischer Dollar', 'symbol' => '$'],
        'CHF' => ['name' => 'Schweizer Franken', 'symbol' => 'CHF'],
        'CNY' => ['name' => 'Chinesischer Yuan', 'symbol' => 'CNY'],
        'CZK' => ['name' => 'Tschechische Krone', 'symbol' => 'CZK'],
        'DKK' => ['name' => 'Daenische Krone', 'symbol' => 'kr'],
        'EGP' => ['name' => 'Aegyptisches Pfund', 'symbol' => 'E£'],
        'EUR' => ['name' => 'Euro', 'symbol' => 'EUR'],
        'GBP' => ['name' => 'Britisches Pfund', 'symbol' => 'GBP'],
        'GEL' => ['name' => 'Georgischer Lari', 'symbol' => 'GEL'],
        'HKD' => ['name' => 'Hongkong-Dollar', 'symbol' => '$'],
        'HRK' => ['name' => 'Kuna', 'symbol' => 'kn'],
        'HUF' => ['name' => 'Ungarischer Forint', 'symbol' => 'Ft'],
        'IDR' => ['name' => 'Indonesische Rupiah', 'symbol' => 'Rp'],
        'ILS' => ['name' => 'Schekel', 'symbol' => 'ILS'],
        'INR' => ['name' => 'Indische Rupie', 'symbol' => 'INR'],
        'ISK' => ['name' => 'Islaendische Krone', 'symbol' => 'kr'],
        'JPY' => ['name' => 'Japanischer Yen', 'symbol' => 'JPY'],
        'KRW' => ['name' => 'Suedkoreanischer Won', 'symbol' => 'KRW'],
        'KZT' => ['name' => 'Kasachischer Tenge', 'symbol' => 'KZT'],
        'MAD' => ['name' => 'Marokkanischer Dirham', 'symbol' => 'MAD'],
        'MDL' => ['name' => 'Moldauischer Leu', 'symbol' => 'L'],
        'MKD' => ['name' => 'Mazedonischer Denar', 'symbol' => 'MKD'],
        'MXN' => ['name' => 'Mexikanischer Peso', 'symbol' => '$'],
        'MYR' => ['name' => 'Malaysischer Ringgit', 'symbol' => 'RM'],
        'NOK' => ['name' => 'Norwegische Krone', 'symbol' => 'kr'],
        'NZD' => ['name' => 'Neuseeland-Dollar', 'symbol' => '$'],
        'PLN' => ['name' => 'Polnischer Zloty', 'symbol' => 'PLN'],
        'RON' => ['name' => 'Rumaenischer Leu', 'symbol' => 'lei'],
        'RSD' => ['name' => 'Serbischer Dinar', 'symbol' => 'RSD'],
        'RUB' => ['name' => 'Russischer Rubel', 'symbol' => 'RUB'],
        'SAR' => ['name' => 'Saudi-Riyal', 'symbol' => 'SAR'],
        'SEK' => ['name' => 'Schwedische Krone', 'symbol' => 'kr'],
        'SGD' => ['name' => 'Singapur-Dollar', 'symbol' => '$'],
        'THB' => ['name' => 'Thailaendischer Baht', 'symbol' => 'THB'],
        'TRY' => ['name' => 'Tuerkische Lira', 'symbol' => 'TRY'],
        'UAH' => ['name' => 'Ukrainische Hrywnja', 'symbol' => 'UAH'],
        'USD' => ['name' => 'US Dollar', 'symbol' => '$'],
        'VND' => ['name' => 'Vietnamesischer Dong', 'symbol' => 'VND'],
        'ZAR' => ['name' => 'Suedafrikanischer Rand', 'symbol' => 'R'],
    ];

    return $catalog;
}

function getCountryCurrencyFallbackMap(): array
{
    static $map = [
        'AE' => 'AED',
        'AF' => 'AFN',
        'AL' => 'ALL',
        'AM' => 'AMD',
        'AR' => 'ARS',
        'AT' => 'EUR',
        'AU' => 'AUD',
        'AZ' => 'AZN',
        'BA' => 'BAM',
        'BE' => 'EUR',
        'BG' => 'BGN',
        'BR' => 'BRL',
        'BY' => 'BYN',
        'CA' => 'CAD',
        'CH' => 'CHF',
        'CN' => 'CNY',
        'CY' => 'EUR',
        'CZ' => 'CZK',
        'DE' => 'EUR',
        'DK' => 'DKK',
        'EG' => 'EGP',
        'ES' => 'EUR',
        'FI' => 'EUR',
        'FR' => 'EUR',
        'GB' => 'GBP',
        'GE' => 'GEL',
        'GR' => 'EUR',
        'HK' => 'HKD',
        'HR' => 'EUR',
        'HU' => 'HUF',
        'ID' => 'IDR',
        'IE' => 'EUR',
        'IL' => 'ILS',
        'IN' => 'INR',
        'IS' => 'ISK',
        'IT' => 'EUR',
        'JP' => 'JPY',
        'KR' => 'KRW',
        'KZ' => 'KZT',
        'LI' => 'CHF',
        'LT' => 'EUR',
        'LU' => 'EUR',
        'LV' => 'EUR',
        'MA' => 'MAD',
        'MC' => 'EUR',
        'MD' => 'MDL',
        'ME' => 'EUR',
        'MK' => 'MKD',
        'MT' => 'EUR',
        'MX' => 'MXN',
        'MY' => 'MYR',
        'NL' => 'EUR',
        'NO' => 'NOK',
        'NZ' => 'NZD',
        'PL' => 'PLN',
        'PT' => 'EUR',
        'RO' => 'RON',
        'RS' => 'RSD',
        'RU' => 'RUB',
        'SA' => 'SAR',
        'SE' => 'SEK',
        'SG' => 'SGD',
        'SI' => 'EUR',
        'SK' => 'EUR',
        'SM' => 'EUR',
        'TH' => 'THB',
        'TR' => 'TRY',
        'UA' => 'UAH',
        'US' => 'USD',
        'VA' => 'EUR',
        'VN' => 'VND',
        'XK' => 'EUR',
        'ZA' => 'ZAR',
    ];

    return $map;
}

function getFallbackCurrencyDefinitionForCountry(string $countryCode): ?array
{
    $countryCode = normalizeCountryCode($countryCode);
    if ($countryCode === null) {
        return null;
    }

    $map = getCountryCurrencyFallbackMap();
    if (!isset($map[$countryCode])) {
        return null;
    }

    $currencyCode = $map[$countryCode];
    $catalog = getKnownCurrencyCatalog();
    if (!isset($catalog[$currencyCode])) {
        return [
            'code' => $currencyCode,
            'name' => $currencyCode,
            'symbol' => $currencyCode,
        ];
    }

    return [
        'code' => $currencyCode,
        'name' => $catalog[$currencyCode]['name'],
        'symbol' => $catalog[$currencyCode]['symbol'],
    ];
}

function getCurrencylayerApiKey(): string
{
    $envKey = getenv('CURRENCYLAYER_API_KEY');
    if (is_string($envKey) && trim($envKey) !== '') {
        return trim($envKey);
    }

    return '797dbc00ed1f8b341292ae714e0a46d4';
}

function httpGetJson(string $url, int $timeoutSeconds = 10): ?array
{
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => "User-Agent: Ice-App/0.1\r\nAccept: application/json\r\n",
            'timeout' => $timeoutSeconds,
        ],
    ]);

    $response = @file_get_contents($url, false, $context);
    if ($response === false) {
        return null;
    }

    $decoded = json_decode($response, true);
    return is_array($decoded) ? $decoded : null;
}

function fetchCurrencyDefinitionFromCountryApi(string $countryCode): ?array
{
    $countryCode = normalizeCountryCode($countryCode);
    if ($countryCode === null || strlen($countryCode) !== 2) {
        return null;
    }

    $payload = httpGetJson("https://restcountries.com/v3.1/alpha/{$countryCode}?fields=currencies", 6);
    if (!is_array($payload)) {
        return null;
    }

    $currencies = null;
    if (isset($payload['currencies']) && is_array($payload['currencies'])) {
        $currencies = $payload['currencies'];
    } elseif (isset($payload[0]['currencies']) && is_array($payload[0]['currencies'])) {
        $currencies = $payload[0]['currencies'];
    }

    if ($currencies === null) {
        return null;
    }

    foreach ($currencies as $code => $details) {
        $code = strtoupper(trim((string)$code));
        if ($code === '') {
            continue;
        }

        $catalog = getKnownCurrencyCatalog();
        $fallback = $catalog[$code] ?? [];

        return [
            'code' => $code,
            'name' => trim((string)($details['name'] ?? $fallback['name'] ?? $code)),
            'symbol' => trim((string)($details['symbol'] ?? $fallback['symbol'] ?? $code)),
        ];
    }

    return null;
}

function resolveCurrencyDefinitionForCountry(?string $countryCode): ?array
{
    $countryCode = normalizeCountryCode($countryCode);
    if ($countryCode === null) {
        return null;
    }

    $apiResult = fetchCurrencyDefinitionFromCountryApi($countryCode);
    if ($apiResult !== null) {
        return $apiResult;
    }

    return getFallbackCurrencyDefinitionForCountry($countryCode);
}

function getCurrencyByCode(PDO $pdo, string $currencyCode): ?array
{
    $stmt = $pdo->prepare("SELECT id, code, name, symbol FROM waehrungen WHERE code = ?");
    $stmt->execute([strtoupper(trim($currencyCode))]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row ?: null;
}

function getOrCreateCurrencyId(PDO $pdo, array $currencyDefinition): ?int
{
    $currencyCode = strtoupper(trim((string)($currencyDefinition['code'] ?? '')));
    if ($currencyCode === '') {
        return null;
    }

    $existingCurrency = getCurrencyByCode($pdo, $currencyCode);
    if ($existingCurrency) {
        $updates = [];
        $params = [];

        $name = trim((string)($currencyDefinition['name'] ?? ''));
        $symbol = trim((string)($currencyDefinition['symbol'] ?? ''));

        if ($name !== '' && $existingCurrency['name'] !== $name) {
            $updates[] = "name = ?";
            $params[] = $name;
        }

        if ($symbol !== '' && ($existingCurrency['symbol'] ?? '') !== $symbol) {
            $updates[] = "symbol = ?";
            $params[] = $symbol;
        }

        if ($updates) {
            $params[] = $existingCurrency['id'];
            $update = $pdo->prepare("UPDATE waehrungen SET " . implode(', ', $updates) . " WHERE id = ?");
            $update->execute($params);
        }

        return (int)$existingCurrency['id'];
    }

    $insert = $pdo->prepare("
        INSERT INTO waehrungen (code, name, symbol)
        VALUES (:code, :name, :symbol)
    ");
    $insert->execute([
        ':code' => $currencyCode,
        ':name' => trim((string)($currencyDefinition['name'] ?? $currencyCode)),
        ':symbol' => trim((string)($currencyDefinition['symbol'] ?? $currencyCode)),
    ]);

    return (int)$pdo->lastInsertId();
}

function ensureCurrencyForCountry(PDO $pdo, ?string $countryCode): ?int
{
    $currencyDefinition = resolveCurrencyDefinitionForCountry($countryCode);
    if ($currencyDefinition === null) {
        return null;
    }

    return getOrCreateCurrencyId($pdo, $currencyDefinition);
}

function getExchangeRateMapFromApi(string $sourceCode = 'EUR'): ?array
{
    $sourceCode = strtoupper(trim($sourceCode));
    if ($sourceCode === '') {
        return null;
    }

    $apiKey = getCurrencylayerApiKey();
    $url = "http://api.currencylayer.com/live?access_key={$apiKey}&source={$sourceCode}";
    $payload = httpGetJson($url, 10);

    if (!is_array($payload) || empty($payload['success']) || empty($payload['quotes']) || !is_array($payload['quotes'])) {
        return null;
    }

    return $payload;
}

function upsertExchangeRate(PDO $pdo, int $fromCurrencyId, int $toCurrencyId, float $rate): void
{
    $stmt = $pdo->prepare("
        INSERT INTO wechselkurse (von_waehrung_id, zu_waehrung_id, kurs)
        VALUES (:from_id, :to_id, :rate)
        ON DUPLICATE KEY UPDATE
            kurs = VALUES(kurs),
            aktualisiert_am = CURRENT_TIMESTAMP
    ");

    $stmt->execute([
        ':from_id' => $fromCurrencyId,
        ':to_id' => $toCurrencyId,
        ':rate' => $rate,
    ]);
}

function ensureExchangeRatesForCurrency(PDO $pdo, string $currencyCode): bool
{
    $currencyCode = strtoupper(trim($currencyCode));
    if ($currencyCode === '') {
        return false;
    }

    if ($currencyCode === 'EUR') {
        return true;
    }

    $eur = getCurrencyByCode($pdo, 'EUR');
    $target = getCurrencyByCode($pdo, $currencyCode);
    if (!$eur || !$target) {
        return false;
    }

    $payload = getExchangeRateMapFromApi('EUR');
    if ($payload === null) {
        return false;
    }

    $pair = 'EUR' . $currencyCode;
    if (!isset($payload['quotes'][$pair])) {
        return false;
    }

    $eurToTarget = (float)$payload['quotes'][$pair];
    if ($eurToTarget <= 0) {
        return false;
    }

    upsertExchangeRate($pdo, (int)$eur['id'], (int)$target['id'], $eurToTarget);
    upsertExchangeRate($pdo, (int)$target['id'], (int)$eur['id'], 1 / $eurToTarget);

    return true;
}

function ensureCountryCurrencyAndRates(PDO $pdo, ?string $countryCode): ?array
{
    $currencyDefinition = resolveCurrencyDefinitionForCountry($countryCode);
    if ($currencyDefinition === null) {
        return null;
    }

    $currencyId = getOrCreateCurrencyId($pdo, $currencyDefinition);
    if ($currencyId === null) {
        return null;
    }

    ensureExchangeRatesForCurrency($pdo, $currencyDefinition['code']);

    return [
        'currency_id' => $currencyId,
        'currency_code' => $currencyDefinition['code'],
        'currency_name' => $currencyDefinition['name'],
        'currency_symbol' => $currencyDefinition['symbol'],
    ];
}

function syncCountryCurrencies(PDO $pdo): void
{
    $countryStmt = $pdo->query("
        SELECT id, country_code, waehrung_id
        FROM laender
        WHERE country_code IS NOT NULL AND TRIM(country_code) <> ''
    ");

    $updateStmt = $pdo->prepare("
        UPDATE laender
        SET waehrung_id = :waehrung_id
        WHERE id = :id
    ");

    while ($country = $countryStmt->fetch(PDO::FETCH_ASSOC)) {
        if (!empty($country['waehrung_id'])) {
            continue;
        }

        $resolved = ensureCountryCurrencyAndRates($pdo, $country['country_code']);
        if ($resolved === null) {
            continue;
        }

        $updateStmt->execute([
            ':waehrung_id' => $resolved['currency_id'],
            ':id' => $country['id'],
        ]);
    }
}

function syncExchangeRatesForAllCurrencies(PDO $pdo): int
{
    $payload = getExchangeRateMapFromApi('EUR');
    if ($payload === null) {
        throw new RuntimeException('Wechselkurse konnten nicht von currencylayer geladen werden.');
    }

    $sourceCode = strtoupper((string)($payload['source'] ?? 'EUR'));
    $sourceCurrency = getCurrencyByCode($pdo, $sourceCode);
    if (!$sourceCurrency) {
        throw new RuntimeException("Basiswaehrung '{$sourceCode}' fehlt in 'waehrungen'.");
    }

    $stmt = $pdo->query("SELECT id, code FROM waehrungen");
    $currencies = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $updatedPairs = 0;
    foreach ($currencies as $currency) {
        $targetCode = strtoupper((string)$currency['code']);
        $targetId = (int)$currency['id'];

        if ($targetCode === $sourceCode) {
            continue;
        }

        $pair = $sourceCode . $targetCode;
        if (!isset($payload['quotes'][$pair])) {
            continue;
        }

        $rate = (float)$payload['quotes'][$pair];
        if ($rate <= 0) {
            continue;
        }

        upsertExchangeRate($pdo, (int)$sourceCurrency['id'], $targetId, $rate);
        upsertExchangeRate($pdo, $targetId, (int)$sourceCurrency['id'], 1 / $rate);
        $updatedPairs += 2;
    }

    return $updatedPairs;
}
