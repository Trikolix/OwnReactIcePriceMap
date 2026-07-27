<?php

require_once __DIR__ . '/auth.php';

const TOUR_DE_GLACE_ID = 'tour_de_glace_2026';
const TOUR_DE_GLACE_TIP_DEADLINE = '2026-07-04 16:30:00';
const TOUR_DE_GLACE_ADMIN_PREVIEW_START = '2026-06-27 00:00:00';
const TOUR_DE_GLACE_SHADOW_TEST_START = '2026-06-12 00:00:00';
const TOUR_DE_GLACE_SHADOW_TEST_ENABLED = false;
const TOUR_DE_GLACE_STAGE_TIP_EGG_MULTIPLIER = 1.25;

function tourDeGlaceTimezone(): DateTimeZone
{
    return new DateTimeZone('Europe/Berlin');
}

function tourDeGlacePointRules(): array
{
    return [
        'daily_visit' => ['action' => 'Tagesbesuch der Tour-Seite', 'yellow' => 0, 'green' => 5, 'mountain' => 0, 'ice' => 0, 'white' => 0, 'note' => '1x pro Tag'],
        'like' => ['action' => 'Like auf fremden Beitrag', 'yellow' => 0, 'green' => 1, 'mountain' => 0, 'ice' => 0, 'white' => 0, 'note' => 'max. 20 pro Tag'],
        'comment' => ['action' => 'Kommentar', 'yellow' => 2, 'green' => 5, 'mountain' => 0, 'ice' => 0, 'white' => 10, 'note' => 'max. 5 pro Tag'],
        'easter_egg' => ['action' => 'Etappe gesichtet', 'yellow' => 0, 'green' => 10, 'mountain' => 0, 'ice' => 0, 'white' => 0, 'note' => '1x pro Etappentag'],
        'referral' => ['action' => 'Neuen Nutzer geworben', 'yellow' => 40, 'green' => 100, 'mountain' => 0, 'ice' => 0, 'white' => 80, 'note' => 'nach Account-Verifizierung'],
        'challenge_completed' => ['action' => 'Challenge abgeschlossen', 'yellow' => 25, 'green' => 5, 'mountain' => 25, 'ice' => 0, 'white' => 35, 'note' => 'beste 3 Challenges gesamt'],
        'team_challenge_completed' => ['action' => 'Team-Challenge abgeschlossen', 'yellow' => 40, 'green' => 10, 'mountain' => 55, 'ice' => 0, 'white' => 50, 'note' => 'beste 3 Challenges gesamt'],
        'checkin_scoop_softice' => ['action' => 'Check-in: Kugel oder Softeis', 'yellow' => 10, 'green' => 0, 'mountain' => 0, 'ice' => 20, 'white' => 30, 'note' => 'unlimitiert'],
        'checkin_sundae' => ['action' => 'Check-in: Eisbecher', 'yellow' => 10, 'green' => 0, 'mountain' => 0, 'ice' => 25, 'white' => 30, 'note' => 'unlimitiert'],
        'checkin_photo' => ['action' => 'Check-in mit Foto', 'yellow' => 3, 'green' => 0, 'mountain' => 0, 'ice' => 10, 'white' => 20, 'note' => 'Zusatzpunkte'],
        'new_shop_checkin' => ['action' => 'Neue Eisdiele beim Check-in', 'yellow' => 0, 'green' => 0, 'mountain' => 0, 'ice' => 15, 'white' => 0, 'note' => 'erstmals von dir besucht'],
        'bike_bonus' => ['action' => 'Fahrrad-Anreise', 'yellow' => 5, 'green' => 0, 'mountain' => 25, 'ice' => 5, 'white' => 0, 'note' => 'unlimitiert'],
        'group_checkin' => ['action' => 'Gruppen-Check-in', 'yellow' => 8, 'green' => 3, 'mountain' => 10, 'ice' => 0, 'white' => 10, 'note' => 'Zusatzpunkte'],
        'profile_image' => ['action' => 'Profilbild vorhanden', 'yellow' => 0, 'green' => 10, 'mountain' => 0, 'ice' => 0, 'white' => 0, 'note' => 'einmalig'],
        'review' => ['action' => 'Bewertung', 'yellow' => 8, 'green' => 0, 'mountain' => 0, 'ice' => 8, 'white' => 20, 'note' => 'max. 10 im Aktionszeitraum'],
        'route' => ['action' => 'Route eingereicht', 'yellow' => 10, 'green' => 0, 'mountain' => 30, 'ice' => 0, 'white' => 0, 'note' => 'max. 3 im Aktionszeitraum'],
    ];
}

function tourDeGlaceRulePoints(string $ruleKey): array
{
    $rule = tourDeGlacePointRules()[$ruleKey] ?? [];
    return [
        'yellow' => (int)($rule['yellow'] ?? 0),
        'green' => (int)($rule['green'] ?? 0),
        'mountain' => (int)($rule['mountain'] ?? 0),
        'ice' => (int)($rule['ice'] ?? 0),
        'white' => (int)($rule['white'] ?? 0),
    ];
}

function tourDeGlaceStageTipPointRules(): array
{
    return [
        1 => 100,
        2 => 70,
        3 => 55,
        4 => 45,
        5 => 36,
        6 => 28,
        7 => 21,
        8 => 15,
        9 => 10,
        10 => 6,
    ];
}

function tourDeGlaceOverallTipPointRules(): array
{
    return [
        'gc_exact' => [1 => 50, 2 => 25, 3 => 25],
        'gc_top3_wrong_position' => 10,
        'jersey_exact' => 35,
    ];
}

function tourDeGlaceConfig(): array
{
    return [
        'id' => TOUR_DE_GLACE_ID,
        'title' => 'Tour de Glace 2026',
        'pre_start' => '2026-06-28 00:00:00',
        'start' => '2026-07-04 00:00:00',
        'end' => '2026-07-26 23:59:59',
        'tip_deadline' => TOUR_DE_GLACE_TIP_DEADLINE,
        'jerseys' => [
            'yellow' => ['label' => 'Gelbes Trikot', 'priority' => 1],
            'mountain' => ['label' => 'Bergtrikot', 'priority' => 2],
            'green' => ['label' => 'Grünes Trikot', 'priority' => 3],
            'ice' => ['label' => 'Eiscreme-Trikot', 'priority' => 4],
            'white' => ['label' => 'Weißes Trikot', 'priority' => 5],
        ],
        'rider_types' => [
            'sprinter' => [
                'name' => 'Sprinter',
                'description' => 'Stark bei Likes, Kommentaren und Tagesaufgaben.',
                'multipliers' => ['daily' => 1.5, 'likes' => 1.8, 'comments' => 1.5, 'checkins' => 0.8, 'bike' => 0.7, 'routes' => 0.8, 'reviews' => 1.0, 'profile' => 1.1, 'easter' => 1.3, 'groups' => 0.9, 'referrals' => 1.0, 'challenges' => 0.8],
            ],
            'bergfloh' => [
                'name' => 'Bergfloh',
                'description' => 'Stark bei Fahrrad-Anreise und sportlichen Aktionen.',
                'multipliers' => ['daily' => 1.0, 'likes' => 0.7, 'comments' => 0.8, 'checkins' => 1.0, 'bike' => 2.0, 'routes' => 1.5, 'reviews' => 0.9, 'profile' => 1.0, 'easter' => 1.0, 'groups' => 1.2, 'referrals' => 1.0, 'challenges' => 1.1],
            ],
            'connaisseur' => [
                'name' => 'Eis-Connaisseur',
                'description' => 'Stark bei Check-ins, Sorten und Bewertungen.',
                'multipliers' => ['daily' => 0.9, 'likes' => 0.8, 'comments' => 1.0, 'checkins' => 1.8, 'bike' => 1.0, 'routes' => 1.0, 'reviews' => 1.6, 'profile' => 1.0, 'easter' => 1.0, 'groups' => 0.9, 'referrals' => 1.0, 'challenges' => 1.0],
            ],
            'domestique' => [
                'name' => 'Domestique',
                'description' => 'Stark bei Community- und Gruppenaktionen.',
                'multipliers' => ['daily' => 1.1, 'likes' => 1.2, 'comments' => 1.8, 'checkins' => 1.0, 'bike' => 1.0, 'routes' => 1.0, 'reviews' => 1.0, 'profile' => 1.1, 'easter' => 1.1, 'groups' => 1.5, 'referrals' => 1.2, 'challenges' => 1.1],
            ],
            'fotograf' => [
                'name' => 'Fotograf',
                'description' => 'Stark bei Foto- und visuellen Aktionen.',
                'multipliers' => ['daily' => 1.0, 'likes' => 1.5, 'comments' => 1.2, 'checkins' => 1.2, 'bike' => 0.9, 'routes' => 0.9, 'reviews' => 1.1, 'profile' => 1.2, 'easter' => 1.1, 'groups' => 1.0, 'referrals' => 1.0, 'challenges' => 0.9],
            ],
            'rookie' => [
                'name' => 'Rookie',
                'description' => 'Einsteigerfreundlich mit soliden Boni auf einfache Aktionen.',
                'multipliers' => ['daily' => 1.2, 'likes' => 1.2, 'comments' => 1.2, 'checkins' => 1.2, 'bike' => 1.0, 'routes' => 1.0, 'reviews' => 1.2, 'profile' => 1.5, 'easter' => 1.2, 'groups' => 1.0, 'referrals' => 1.0, 'challenges' => 1.1],
            ],
        ],
        'stages' => [
            1 => ['date' => '2026-07-04', 'start_at' => '2026-07-04 17:05:00', 'start' => 'Barcelona', 'finish' => 'Barcelona', 'lat' => 41.3874, 'lng' => 2.1686, 'hint' => 'Die Tour startet in Barcelona.'],
            2 => ['date' => '2026-07-05', 'start_at' => '2026-07-05 13:45:00', 'start' => 'Tarragona', 'finish' => 'Barcelona', 'lat' => 41.3874, 'lng' => 2.1686, 'hint' => 'Die Etappe endet wieder in Barcelona.'],
            3 => ['date' => '2026-07-06', 'start_at' => '2026-07-06 12:10:00', 'start' => 'Granollers', 'finish' => 'Les Angles', 'lat' => 42.5797, 'lng' => 2.0747, 'hint' => 'Heute geht es in Richtung Pyrenäen.'],
            4 => ['date' => '2026-07-07', 'start_at' => '2026-07-07 13:10:00', 'start' => 'Carcassonne', 'finish' => 'Foix', 'lat' => 42.9653, 'lng' => 1.6072, 'hint' => 'Suche zwischen Burgstadt und Pyrenäen.'],
            5 => ['date' => '2026-07-08', 'start_at' => '2026-07-08 14:05:00', 'start' => 'Lannemezan', 'finish' => 'Pau', 'lat' => 43.2951, 'lng' => -0.3708, 'hint' => 'Pau ist ein Klassiker der Tour.'],
            6 => ['date' => '2026-07-09', 'start_at' => '2026-07-09 12:25:00', 'start' => 'Pau', 'finish' => 'Gavarnie-Gèdre', 'lat' => 42.7353, 'lng' => -0.0099, 'hint' => 'Bergluft und Pyrenäen warten.'],
            7 => ['date' => '2026-07-10', 'start_at' => '2026-07-10 13:15:00', 'start' => 'Hagetmau', 'finish' => 'Bordeaux', 'lat' => 44.8378, 'lng' => -0.5792, 'hint' => 'Heute führt die Spur nach Bordeaux.'],
            8 => ['date' => '2026-07-11', 'start_at' => '2026-07-11 13:15:00', 'start' => 'Périgueux', 'finish' => 'Bergerac', 'lat' => 44.8536, 'lng' => 0.4830, 'hint' => 'Dordogne-Tag mit Ziel Bergerac.'],
            9 => ['date' => '2026-07-12', 'start_at' => '2026-07-12 13:35:00', 'start' => 'Malemort', 'finish' => 'Ussel', 'lat' => 45.5480, 'lng' => 2.3090, 'hint' => 'Massif-Central-Gefühl in Ussel.'],
            10 => ['date' => '2026-07-14', 'start_at' => '2026-07-14 13:10:00', 'start' => 'Aurillac', 'finish' => 'Le Lioran', 'lat' => 45.0919, 'lng' => 2.7515, 'hint' => 'Nach dem Ruhetag wartet Le Lioran.'],
            11 => ['date' => '2026-07-15', 'start_at' => '2026-07-15 13:50:00', 'start' => 'Vichy', 'finish' => 'Nevers', 'lat' => 46.9896, 'lng' => 3.1590, 'hint' => 'Von Vichy nach Nevers.'],
            12 => ['date' => '2026-07-16', 'start_at' => '2026-07-16 13:30:00', 'start' => 'Nevers Magny-Cours', 'finish' => 'Chalon-sur-Saône', 'lat' => 46.7808, 'lng' => 4.8539, 'hint' => 'Motorsport-Start, Saône-Ziel.'],
            13 => ['date' => '2026-07-17', 'start_at' => '2026-07-17 13:00:00', 'start' => 'Dole', 'finish' => 'Belfort', 'lat' => 47.6397, 'lng' => 6.8638, 'hint' => 'Belfort markiert den Weg in die Vogesen.'],
            14 => ['date' => '2026-07-18', 'start_at' => '2026-07-18 13:10:00', 'start' => 'Mulhouse', 'finish' => 'Le Markstein', 'lat' => 47.9230, 'lng' => 7.0300, 'hint' => 'Vogesen-Bergtag am Le Markstein.'],
            15 => ['date' => '2026-07-19', 'start_at' => '2026-07-19 13:10:00', 'start' => 'Champagnole', 'finish' => 'Plateau de Solaison', 'lat' => 46.0240, 'lng' => 6.4090, 'hint' => 'Plateau-Finish vor dem Ruhetag.'],
            16 => ['date' => '2026-07-21', 'start_at' => '2026-07-21 13:00:00', 'start' => 'Evian-les-Bains', 'finish' => 'Thonon-les-Bains', 'lat' => 46.3705, 'lng' => 6.4798, 'hint' => 'Zeitfahr-Spur am Genfersee.'],
            17 => ['date' => '2026-07-22', 'start_at' => '2026-07-22 13:20:00', 'start' => 'Chambéry', 'finish' => 'Voiron', 'lat' => 45.3630, 'lng' => 5.5920, 'hint' => 'Alpenrand nach Voiron.'],
            18 => ['date' => '2026-07-23', 'start_at' => '2026-07-23 12:35:00', 'start' => 'Voiron', 'finish' => 'Orcières-Merlette', 'lat' => 44.6970, 'lng' => 6.3270, 'hint' => 'Orcières-Merlette ruft.'],
            19 => ['date' => '2026-07-24', 'start_at' => '2026-07-24 14:00:00', 'start' => 'Gap', 'finish' => "Alpe d'Huez", 'lat' => 45.0910, 'lng' => 6.0680, 'hint' => 'Die berühmten Kehren warten.'],
            20 => ['date' => '2026-07-25', 'start_at' => '2026-07-25 11:20:00', 'start' => "Le Bourg-d'Oisans", 'finish' => "Alpe d'Huez", 'lat' => 45.0910, 'lng' => 6.0680, 'hint' => "Noch einmal Alpe d'Huez."],
            21 => ['date' => '2026-07-26', 'start_at' => '2026-07-26 16:15:00', 'start' => 'Thoiry', 'finish' => 'Paris Champs-Élysées', 'lat' => 48.8698, 'lng' => 2.3076, 'hint' => 'Finale in Paris.'],
        ],
    ];
}

function getTourDeGlaceNow(): DateTimeImmutable
{
    return new DateTimeImmutable('now', tourDeGlaceTimezone());
}

function tourDeGlaceStageFunTexts(): array
{
    return [
        1 => 'Du hast den Prolog erspäht. Die Beine sind frisch, das Eis hoffentlich auch.',
        2 => 'Barcelona ruft nochmal. Dein Spürsinn fährt schon im Gelben.',
        3 => 'Bergsichtung gesichert. Sauerstoff knapp, Kugel Moral voll.',
        4 => 'Zwischen Burgstadt und Pyrenäen gesichtet. Sehr ritterlich, sehr eisig.',
        5 => 'Pau gesichtet. Klassiker-Punkte für klassische Sucharbeit.',
        6 => 'Gavarnie-Gedre meldet: Bergluft drin, Sichtung gesichert.',
        7 => 'Sprintsichtung! Kurz angetippt, schnell kassiert.',
        8 => 'Dordogne-Tag, Sichtung im Gepäck. Bergerac wäre stolz auf diese Nase.',
        9 => 'Massif-Central-Sichtung. Unebenes Profil, glatte Leistung.',
        10 => 'Die Sichtung macht Pause vom Pausieren.',
        11 => 'Vichy nach Nevers, Sichtung nicht verpasst. Das Peloton schaut kurz rüber.',
        12 => 'Magny-Cours-Gefühl: Boxenstopp gemacht, Etappe gesichtet.',
        13 => 'Belfort markiert den Weg. Du markierst die Sichtung.',
        14 => 'Vogesen-Sichtung gesichert. Der Berg wollte sich verstecken, hat aber verloren.',
        15 => 'Plateau-Finish, Plateau-Sichtung. Oben schmeckt das Eis theoretisch besser.',
        16 => 'Zeitfahrsichtung! Keine Windschattenhilfe, trotzdem getroffen.',
        17 => 'Alpenrand nach Voiron. Sichtung am Rand entdeckt, sauber markiert.',
        18 => 'Orcières-Merlette ruft. Dein Suchtempo antwortet.',
        19 => '21 Kehren, eine Sichtung. Deine Kletterform ist fragwürdig, dein Spürsinn nicht.',
        20 => "Nochmal Alpe d'Huez. Die Sichtung wollte Revanche, du warst schneller.",
        21 => 'Finalsichtung! Champs-Élysées, Zielstrich, Gehirnfrost.',
    ];
}

function isTourDeGlaceLocalDevRequest(): bool
{
    $hostValues = [
        $_SERVER['HTTP_HOST'] ?? '',
        $_SERVER['SERVER_NAME'] ?? '',
        $_SERVER['HTTP_ORIGIN'] ?? '',
        $_SERVER['HTTP_REFERER'] ?? '',
    ];

    foreach ($hostValues as $value) {
        if (preg_match('/(^|\/\/)(localhost|127\.0\.0\.1)(:|\/|$)/i', (string)$value)) {
            $requestUri = (string)($_SERVER['REQUEST_URI'] ?? '');
            $serverHost = (string)($_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? '');
            return stripos($serverHost, 'localhost') !== false
                || stripos($serverHost, '127.0.0.1') !== false
                || stripos($requestUri, '/backend_dev/') !== false;
        }
    }

    return false;
}

function ensureTourDeGlaceTables(PDO $pdo): void
{
    if (isset($GLOBALS['__tour_de_glace_schema_initialized'])) {
        return;
    }
    $GLOBALS['__tour_de_glace_schema_initialized'] = true;

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS tour_de_glace_user_profiles (
            id INT NOT NULL AUTO_INCREMENT,
            campaign_id VARCHAR(64) NOT NULL,
            user_id INT NOT NULL,
            rider_type VARCHAR(40) NOT NULL,
            rider_type_changes INT NOT NULL DEFAULT 0,
            selected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_tdg_profile (campaign_id, user_id),
            KEY idx_tdg_profile_rider (campaign_id, rider_type),
            CONSTRAINT fk_tdg_profile_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
    ensureTourDeGlaceColumn($pdo, 'tour_de_glace_user_profiles', 'rider_type_changes', 'INT NOT NULL DEFAULT 0 AFTER rider_type');

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS tour_de_glace_point_events (
            id INT NOT NULL AUTO_INCREMENT,
            campaign_id VARCHAR(64) NOT NULL,
            user_id INT NOT NULL,
            action_type VARCHAR(64) NOT NULL,
            action_category VARCHAR(40) NOT NULL,
            source_type VARCHAR(64) NOT NULL,
            source_id INT NOT NULL,
            points_yellow INT NOT NULL DEFAULT 0,
            points_green INT NOT NULL DEFAULT 0,
            points_mountain INT NOT NULL DEFAULT 0,
            points_ice INT NOT NULL DEFAULT 0,
            points_white INT NOT NULL DEFAULT 0,
            is_shadow_test TINYINT(1) NOT NULL DEFAULT 0,
            metadata_json LONGTEXT DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_tdg_point_source (campaign_id, action_type, source_type, source_id, user_id, is_shadow_test),
            KEY idx_tdg_points_user (campaign_id, user_id, created_at),
            KEY idx_tdg_points_action_day (campaign_id, user_id, action_type, created_at),
            CONSTRAINT fk_tdg_points_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
    ensureTourDeGlaceColumn($pdo, 'tour_de_glace_point_events', 'is_shadow_test', 'TINYINT(1) NOT NULL DEFAULT 0 AFTER points_white');
    ensureTourDeGlaceUniqueIndex($pdo, 'tour_de_glace_point_events', 'uniq_tdg_point_source', ['campaign_id', 'action_type', 'source_type', 'source_id', 'user_id', 'is_shadow_test']);

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS tour_de_glace_tips (
            id INT NOT NULL AUTO_INCREMENT,
            campaign_id VARCHAR(64) NOT NULL,
            user_id INT NOT NULL,
            tip_gc_winner VARCHAR(160) DEFAULT NULL,
            tip_gc_second VARCHAR(160) DEFAULT NULL,
            tip_gc_third VARCHAR(160) DEFAULT NULL,
            tip_green_winner VARCHAR(160) DEFAULT NULL,
            tip_mountain_winner VARCHAR(160) DEFAULT NULL,
            tip_white_winner VARCHAR(160) DEFAULT NULL,
            submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_tdg_tips (campaign_id, user_id),
            CONSTRAINT fk_tdg_tips_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
    ensureTourDeGlaceColumn($pdo, 'tour_de_glace_tips', 'tip_gc_second', 'VARCHAR(160) DEFAULT NULL AFTER tip_gc_winner');
    ensureTourDeGlaceColumn($pdo, 'tour_de_glace_tips', 'tip_gc_third', 'VARCHAR(160) DEFAULT NULL AFTER tip_gc_second');

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS tour_de_glace_final_results (
            campaign_id VARCHAR(64) NOT NULL,
            result_gc_winner VARCHAR(160) NOT NULL,
            result_gc_second VARCHAR(160) NOT NULL,
            result_gc_third VARCHAR(160) NOT NULL,
            result_green_winner VARCHAR(160) NOT NULL,
            result_mountain_winner VARCHAR(160) NOT NULL,
            result_white_winner VARCHAR(160) NOT NULL,
            updated_by_user_id INT DEFAULT NULL,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (campaign_id),
            KEY idx_tdg_final_results_user (updated_by_user_id),
            CONSTRAINT fk_tdg_final_results_user FOREIGN KEY (updated_by_user_id) REFERENCES nutzer(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS tour_de_glace_stage_tips (
            id INT NOT NULL AUTO_INCREMENT,
            campaign_id VARCHAR(64) NOT NULL,
            user_id INT NOT NULL,
            stage_number INT NOT NULL,
            tip_stage_winner VARCHAR(160) NOT NULL,
            submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_tdg_stage_tip (campaign_id, user_id, stage_number),
            KEY idx_tdg_stage_tips_user (campaign_id, user_id),
            KEY idx_tdg_stage_tips_stage (campaign_id, stage_number),
            CONSTRAINT fk_tdg_stage_tip_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS tour_de_glace_stage_results (
            id INT NOT NULL AUTO_INCREMENT,
            campaign_id VARCHAR(64) NOT NULL,
            stage_number INT NOT NULL,
            stage_winner VARCHAR(160) NOT NULL,
            stage_place_2 VARCHAR(160) DEFAULT NULL,
            stage_place_3 VARCHAR(160) DEFAULT NULL,
            stage_place_4 VARCHAR(160) DEFAULT NULL,
            stage_place_5 VARCHAR(160) DEFAULT NULL,
            stage_place_6 VARCHAR(160) DEFAULT NULL,
            stage_place_7 VARCHAR(160) DEFAULT NULL,
            stage_place_8 VARCHAR(160) DEFAULT NULL,
            stage_place_9 VARCHAR(160) DEFAULT NULL,
            stage_place_10 VARCHAR(160) DEFAULT NULL,
            top10_json JSON DEFAULT NULL,
            updated_by_user_id INT DEFAULT NULL,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_tdg_stage_result (campaign_id, stage_number),
            KEY idx_tdg_stage_results_user (updated_by_user_id),
            CONSTRAINT fk_tdg_stage_result_user FOREIGN KEY (updated_by_user_id) REFERENCES nutzer(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
    for ($place = 2; $place <= 10; $place++) {
        $previousColumn = $place === 2 ? 'stage_winner' : 'stage_place_' . ($place - 1);
        ensureTourDeGlaceColumn($pdo, 'tour_de_glace_stage_results', 'stage_place_' . $place, 'VARCHAR(160) DEFAULT NULL AFTER ' . $previousColumn);
    }
    ensureTourDeGlaceColumn($pdo, 'tour_de_glace_stage_results', 'top10_json', 'JSON DEFAULT NULL AFTER stage_winner');

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS tour_de_glace_easter_eggs (
            id INT NOT NULL AUTO_INCREMENT,
            campaign_id VARCHAR(64) NOT NULL,
            stage_number INT NOT NULL,
            stage_date DATE NOT NULL,
            start_location VARCHAR(120) NOT NULL,
            finish_location VARCHAR(120) NOT NULL,
            latitude DECIMAL(10,7) DEFAULT NULL,
            longitude DECIMAL(10,7) DEFAULT NULL,
            hint_text VARCHAR(255) NOT NULL,
            secret_code VARCHAR(80) NOT NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_tdg_egg_stage (campaign_id, stage_number),
            UNIQUE KEY uniq_tdg_egg_code (campaign_id, secret_code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
    ensureTourDeGlaceColumn($pdo, 'tour_de_glace_easter_eggs', 'latitude', 'DECIMAL(10,7) DEFAULT NULL AFTER finish_location');
    ensureTourDeGlaceColumn($pdo, 'tour_de_glace_easter_eggs', 'longitude', 'DECIMAL(10,7) DEFAULT NULL AFTER latitude');

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS tour_de_glace_user_easter_eggs (
            id INT NOT NULL AUTO_INCREMENT,
            campaign_id VARCHAR(64) NOT NULL,
            easter_egg_id INT NOT NULL,
            user_id INT NOT NULL,
            is_shadow_test TINYINT(1) NOT NULL DEFAULT 0,
            found_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_tdg_user_egg (campaign_id, easter_egg_id, user_id, is_shadow_test),
            KEY idx_tdg_user_eggs_user (campaign_id, user_id),
            CONSTRAINT fk_tdg_user_egg FOREIGN KEY (easter_egg_id) REFERENCES tour_de_glace_easter_eggs(id) ON DELETE CASCADE,
            CONSTRAINT fk_tdg_user_egg_user FOREIGN KEY (user_id) REFERENCES nutzer(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
    ensureTourDeGlaceColumn($pdo, 'tour_de_glace_user_easter_eggs', 'is_shadow_test', 'TINYINT(1) NOT NULL DEFAULT 0 AFTER user_id');
    ensureTourDeGlaceUniqueIndex($pdo, 'tour_de_glace_user_easter_eggs', 'uniq_tdg_user_egg', ['campaign_id', 'easter_egg_id', 'user_id', 'is_shadow_test']);

    seedTourDeGlaceEasterEggs($pdo);
}

function ensureTourDeGlaceColumn(PDO $pdo, string $tableName, string $columnName, string $definition): void
{
    $stmt = $pdo->prepare("SHOW COLUMNS FROM {$tableName} LIKE :column_name");
    $stmt->execute(['column_name' => $columnName]);
    if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
        $pdo->exec("ALTER TABLE {$tableName} ADD COLUMN {$columnName} {$definition}");
    }
}

function ensureTourDeGlaceUniqueIndex(PDO $pdo, string $tableName, string $indexName, array $columns): void
{
    $stmt = $pdo->prepare("SHOW INDEX FROM {$tableName} WHERE Key_name = :index_name");
    $stmt->execute(['index_name' => $indexName]);
    $existingRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $existingColumns = [];
    foreach ($existingRows as $row) {
        $existingColumns[(int)$row['Seq_in_index']] = $row['Column_name'];
    }
    ksort($existingColumns);
    $existingColumns = array_values($existingColumns);

    if ($existingColumns === $columns) {
        return;
    }

    if ($existingRows) {
        $pdo->exec("ALTER TABLE {$tableName} DROP INDEX {$indexName}");
    }

    $columnList = implode(', ', $columns);
    $pdo->exec("ALTER TABLE {$tableName} ADD UNIQUE KEY {$indexName} ({$columnList})");
}

function seedTourDeGlaceEasterEggs(PDO $pdo): void
{
    $config = tourDeGlaceConfig();
    $stmt = $pdo->prepare(
        "INSERT INTO tour_de_glace_easter_eggs
            (campaign_id, stage_number, stage_date, start_location, finish_location, latitude, longitude, hint_text, secret_code, is_active)
         VALUES
            (:campaign_id, :stage_number, :stage_date, :start_location, :finish_location, :latitude, :longitude, :hint_text, :secret_code, 1)
         ON DUPLICATE KEY UPDATE
            stage_date = VALUES(stage_date),
            start_location = VALUES(start_location),
            finish_location = VALUES(finish_location),
            latitude = VALUES(latitude),
            longitude = VALUES(longitude),
            hint_text = VALUES(hint_text),
            is_active = 1"
    );

    foreach ($config['stages'] as $stageNumber => $stage) {
        $stmt->execute([
            'campaign_id' => TOUR_DE_GLACE_ID,
            'stage_number' => $stageNumber,
            'stage_date' => $stage['date'],
            'start_location' => $stage['start'],
            'finish_location' => $stage['finish'],
            'latitude' => $stage['lat'] ?? null,
            'longitude' => $stage['lng'] ?? null,
            'hint_text' => $stage['hint'],
            'secret_code' => 'tdg-' . $stageNumber . '-' . strtolower(substr(sha1(TOUR_DE_GLACE_ID . '|' . $stageNumber), 0, 8)),
        ]);
    }
}

function getTourDeGlacePhase(?DateTimeImmutable $now = null): string
{
    $config = tourDeGlaceConfig();
    $tz = tourDeGlaceTimezone();
    $reference = $now ?? getTourDeGlaceNow();
    $preStart = new DateTimeImmutable($config['pre_start'], $tz);
    $start = new DateTimeImmutable($config['start'], $tz);
    $end = new DateTimeImmutable($config['end'], $tz);

    if ($reference < $preStart) {
        return 'upcoming';
    }
    if ($reference < $start) {
        return 'pre';
    }
    if ($reference <= $end) {
        return 'active';
    }
    return 'results';
}

function canUseTourDeGlaceAdminPreview(?int $userId): bool
{
    return in_array((int)$userId, [1], true);
}

function getTourDeGlacePhaseForUser(?int $userId = null, ?DateTimeImmutable $now = null): string
{
    $phase = getTourDeGlacePhase($now);
    if ($phase !== 'upcoming' || !canUseTourDeGlaceAdminPreview($userId)) {
        return $phase;
    }

    $reference = $now ?? getTourDeGlaceNow();
    $adminPreviewStart = new DateTimeImmutable(TOUR_DE_GLACE_ADMIN_PREVIEW_START, tourDeGlaceTimezone());
    return $reference >= $adminPreviewStart ? 'pre' : $phase;
}

function getTourDeGlaceProfile(PDO $pdo, int $userId): ?array
{
    ensureTourDeGlaceTables($pdo);
    $stmt = $pdo->prepare("SELECT * FROM tour_de_glace_user_profiles WHERE campaign_id = ? AND user_id = ? LIMIT 1");
    $stmt->execute([TOUR_DE_GLACE_ID, $userId]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);
    return $profile ?: null;
}

function selectTourDeGlaceRiderType(PDO $pdo, int $userId, string $riderType): array
{
    ensureTourDeGlaceTables($pdo);
    $config = tourDeGlaceConfig();
    if (!isset($config['rider_types'][$riderType])) {
        throw new InvalidArgumentException('Ungültiger Fahrertyp.');
    }

    $existing = getTourDeGlaceProfile($pdo, $userId);
    if ($existing) {
        if ((string)$existing['rider_type'] === $riderType) {
            return $existing;
        }
        if ((int)($existing['rider_type_changes'] ?? 0) >= 3) {
            throw new RuntimeException('Du hast deinen Fahrertyp bereits 3 mal gewechselt.');
        }
        $stmt = $pdo->prepare(
            "UPDATE tour_de_glace_user_profiles
             SET rider_type = ?, rider_type_changes = rider_type_changes + 1, selected_at = NOW()
             WHERE campaign_id = ? AND user_id = ?"
        );
        $stmt->execute([$riderType, TOUR_DE_GLACE_ID, $userId]);
        return getTourDeGlaceProfile($pdo, $userId) ?: ['user_id' => $userId, 'rider_type' => $riderType, 'rider_type_changes' => 0];
    }

    $stmt = $pdo->prepare(
        "INSERT INTO tour_de_glace_user_profiles (campaign_id, user_id, rider_type)
         VALUES (?, ?, ?)"
    );
    $stmt->execute([TOUR_DE_GLACE_ID, $userId, $riderType]);
    return getTourDeGlaceProfile($pdo, $userId) ?: ['user_id' => $userId, 'rider_type' => $riderType];
}

function isTourDeGlaceActiveNow(): bool
{
    return getTourDeGlacePhase() === 'active';
}

function isTourDeGlaceShadowTestNow(?DateTimeImmutable $now = null): bool
{
    if (!TOUR_DE_GLACE_SHADOW_TEST_ENABLED) {
        return false;
    }

    $reference = $now ?? getTourDeGlaceNow();
    $tz = tourDeGlaceTimezone();
    $shadowStart = new DateTimeImmutable(TOUR_DE_GLACE_SHADOW_TEST_START, $tz);
    $officialStart = new DateTimeImmutable(tourDeGlaceConfig()['start'], $tz);
    return $reference >= $shadowStart && $reference < $officialStart;
}

function canUseTourDeGlaceShadowTest(?int $userId): bool
{
    return TOUR_DE_GLACE_SHADOW_TEST_ENABLED && in_array((int)$userId, [1, 23], true);
}

function isTourDeGlacePointCollectionActive(?int $userId = null): bool
{
    return isTourDeGlaceActiveNow() || (canUseTourDeGlaceShadowTest($userId) && isTourDeGlaceShadowTestNow());
}

function getTourDeGlacePointScopeValue(?int $userId = null): int
{
    return canUseTourDeGlaceShadowTest($userId) && isTourDeGlaceShadowTestNow() ? 1 : 0;
}

function tourDeGlaceDailyLimitForAction(string $actionType): ?int
{
    $limits = [
        'like' => 20,
        'comment' => 5,
        'easter_egg' => 1,
        'daily_visit' => 1,
    ];
    return $limits[$actionType] ?? null;
}

function tourDeGlaceCampaignLimitForAction(string $actionType): ?int
{
    $limits = [
        'route' => 3,
        'review' => 10,
    ];
    return $limits[$actionType] ?? null;
}

function getTourDeGlaceActionCount(PDO $pdo, int $userId, string $actionType, string $scope): int
{
    $scopeValue = getTourDeGlacePointScopeValue($userId);
    if ($scope === 'day') {
        $stmt = $pdo->prepare(
            "SELECT COUNT(*)
             FROM tour_de_glace_point_events
             WHERE campaign_id = ?
               AND user_id = ?
               AND action_type = ?
               AND is_shadow_test = ?
               AND DATE(created_at) = CURRENT_DATE()"
        );
        $stmt->execute([TOUR_DE_GLACE_ID, $userId, $actionType, $scopeValue]);
        return (int)$stmt->fetchColumn();
    }

    $stmt = $pdo->prepare(
        "SELECT COUNT(*)
         FROM tour_de_glace_point_events
         WHERE campaign_id = ?
           AND user_id = ?
           AND action_type = ?
           AND is_shadow_test = ?"
    );
    $stmt->execute([TOUR_DE_GLACE_ID, $userId, $actionType, $scopeValue]);
    return (int)$stmt->fetchColumn();
}

function getTourDeGlaceCheckinCountBeforeStart(PDO $pdo, int $userId): int
{
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM checkins WHERE nutzer_id = ? AND datum < '2026-07-04 00:00:00'");
    $stmt->execute([$userId]);
    return (int)$stmt->fetchColumn();
}

function isTourDeGlaceWhiteEligible(PDO $pdo, int $userId): bool
{
    return getTourDeGlaceCheckinCountBeforeStart($pdo, $userId) < 5;
}

function applyTourDeGlaceMultiplier(array $basePoints, float $multiplier, bool $whiteEligible): array
{
    $result = [];
    foreach (['yellow', 'green', 'mountain', 'ice', 'white'] as $jersey) {
        $value = (int)($basePoints[$jersey] ?? 0);
        if ($jersey === 'white' && !$whiteEligible) {
            $result[$jersey] = 0;
        } else {
            $result[$jersey] = (int)round($value * $multiplier);
        }
    }
    return $result;
}

function recordTourDeGlacePointEvent(PDO $pdo, int $userId, string $actionType, string $category, string $sourceType, int $sourceId, array $basePoints, array $metadata = [], ?string $createdAt = null): ?array
{
    try {
        if (!isset($GLOBALS['__tour_de_glace_schema_initialized']) && $pdo->inTransaction()) {
            return null;
        }

        ensureTourDeGlaceTables($pdo);
        if (!isTourDeGlacePointCollectionActive($userId)) {
            return null;
        }

        $profile = getTourDeGlaceProfile($pdo, $userId);

        $dailyLimit = tourDeGlaceDailyLimitForAction($actionType);
        if ($dailyLimit !== null && getTourDeGlaceActionCount($pdo, $userId, $actionType, 'day') >= $dailyLimit) {
            return null;
        }

        $campaignLimit = tourDeGlaceCampaignLimitForAction($actionType);
        if ($campaignLimit !== null && getTourDeGlaceActionCount($pdo, $userId, $actionType, 'campaign') >= $campaignLimit) {
            return null;
        }

        $config = tourDeGlaceConfig();
        $riderType = (string)($profile['rider_type'] ?? '');
        $multiplier = (float)($config['rider_types'][$riderType]['multipliers'][$category] ?? 1.0);
        $points = applyTourDeGlaceMultiplier($basePoints, $multiplier, isTourDeGlaceWhiteEligible($pdo, $userId));

        if (array_sum($points) <= 0) {
            return null;
        }

        $createdAtSql = $createdAt !== null ? ', created_at' : '';
        $createdAtPlaceholder = $createdAt !== null ? ', ?' : '';
        $stmt = $pdo->prepare(
            "INSERT IGNORE INTO tour_de_glace_point_events (
                campaign_id, user_id, action_type, action_category, source_type, source_id,
                points_yellow, points_green, points_mountain, points_ice, points_white, is_shadow_test, metadata_json{$createdAtSql}
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?{$createdAtPlaceholder})"
        );
        $isShadowTest = getTourDeGlacePointScopeValue($userId);
        $params = [
            TOUR_DE_GLACE_ID,
            $userId,
            $actionType,
            $category,
            $sourceType,
            $sourceId,
            $points['yellow'],
            $points['green'],
            $points['mountain'],
            $points['ice'],
            $points['white'],
            $isShadowTest,
            $metadata ? json_encode($metadata, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null,
        ];
        if ($createdAt !== null) {
            $params[] = $createdAt;
        }
        $stmt->execute($params);

        return $stmt->rowCount() > 0 ? $points : null;
    } catch (Throwable $e) {
        error_log('Tour de Glace point event failed: ' . $e->getMessage());
        return null;
    }
}

function recordTourDeGlaceCheckin(PDO $pdo, int $userId, int $checkinId, array $context = []): array
{
    $type = (string)($context['type'] ?? '');
    $hasPhoto = !empty($context['has_photo']);
    $isBike = (($context['anreise'] ?? '') === 'Fahrrad');
    $isNewShopForUser = !empty($context['is_new_shop']);
    $hasGroup = !empty($context['group_id']);

    $base = $type === 'Eisbecher'
        ? tourDeGlaceRulePoints('checkin_sundae')
        : tourDeGlaceRulePoints('checkin_scoop_softice');
    if ($hasPhoto) {
        foreach (tourDeGlaceRulePoints('checkin_photo') as $jersey => $points) {
            $base[$jersey] = ($base[$jersey] ?? 0) + $points;
        }
    }
    if ($isNewShopForUser) {
        foreach (tourDeGlaceRulePoints('new_shop_checkin') as $jersey => $points) {
            $base[$jersey] = ($base[$jersey] ?? 0) + $points;
        }
    }
    $events = [];
    $events[] = recordTourDeGlacePointEvent($pdo, $userId, 'checkin', 'checkins', 'checkin', $checkinId, $base, $context);

    if ($isBike) {
        $events[] = recordTourDeGlacePointEvent($pdo, $userId, 'bike_bonus', 'bike', 'checkin', $checkinId, tourDeGlaceRulePoints('bike_bonus'), $context);
    }

    if ($hasGroup) {
        $events[] = recordTourDeGlacePointEvent($pdo, $userId, 'group_checkin', 'groups', 'checkin', $checkinId, tourDeGlaceRulePoints('group_checkin'), $context);
    }

    return array_values(array_filter($events));
}

function recordTourDeGlaceReview(PDO $pdo, int $userId, int $reviewId, array $context = []): ?array
{
    return recordTourDeGlacePointEvent($pdo, $userId, 'review', 'reviews', 'review', $reviewId, tourDeGlaceRulePoints('review'), $context);
}

function recordTourDeGlaceComment(PDO $pdo, int $userId, int $commentId, array $context = []): ?array
{
    return recordTourDeGlacePointEvent($pdo, $userId, 'comment', 'comments', 'comment', $commentId, tourDeGlaceRulePoints('comment'), $context);
}

function recordTourDeGlaceLike(PDO $pdo, int $userId, int $likeSourceId, array $context = []): ?array
{
    return recordTourDeGlacePointEvent($pdo, $userId, 'like', 'likes', 'like', $likeSourceId, tourDeGlaceRulePoints('like'), $context);
}

function recordTourDeGlaceRoute(PDO $pdo, int $userId, int $routeId, array $context = []): ?array
{
    return recordTourDeGlacePointEvent($pdo, $userId, 'route', 'routes', 'route', $routeId, tourDeGlaceRulePoints('route'), $context);
}

function recordTourDeGlaceReferral(PDO $pdo, int $inviterUserId, int $invitedUserId, array $context = []): ?array
{
    if ($inviterUserId <= 0 || $invitedUserId <= 0 || $inviterUserId === $invitedUserId) {
        return null;
    }

    return recordTourDeGlacePointEvent($pdo, $inviterUserId, 'referral', 'referrals', 'user', $invitedUserId, tourDeGlaceRulePoints('referral'), array_merge($context, ['invited_user_id' => $invitedUserId]));
}

function recordTourDeGlaceChallengeCompleted(PDO $pdo, int $userId, int $challengeId, array $context = []): ?array
{
    if ($userId <= 0 || $challengeId <= 0) {
        return null;
    }

    foreach (syncTourDeGlaceChallengePoints($pdo, $userId) as $event) {
        if (($event['action_type'] ?? '') === 'challenge_completed' && (int)($event['source_id'] ?? 0) === $challengeId) {
            return $event;
        }
    }
    return null;
}

function tourDeGlaceChallengeBasePoints(string $actionType): array
{
    return tourDeGlaceRulePoints($actionType === 'team_challenge_completed' ? 'team_challenge_completed' : 'challenge_completed');
}

function recordTourDeGlaceTeamChallengeCompleted(PDO $pdo, int $userId, int $teamChallengeId, array $context = []): ?array
{
    if ($userId <= 0 || $teamChallengeId <= 0) {
        return null;
    }

    foreach (syncTourDeGlaceChallengePoints($pdo, $userId) as $event) {
        if (($event['action_type'] ?? '') === 'team_challenge_completed' && (int)($event['source_id'] ?? 0) === $teamChallengeId) {
            return $event;
        }
    }
    return null;
}

function syncTourDeGlaceChallengePoints(PDO $pdo, int $userId): array
{
    if ($userId <= 0 || !isTourDeGlacePointCollectionActive($userId)) {
        return [];
    }

    ensureTourDeGlaceTables($pdo);
    $config = tourDeGlaceConfig();
    $scopeValue = getTourDeGlacePointScopeValue($userId);
    $candidates = [];

    $soloStmt = $pdo->prepare(
        "SELECT id, type, difficulty, eisdiele_id, completed_at
         FROM challenges
         WHERE nutzer_id = ?
           AND completed = 1
           AND completed_at IS NOT NULL
           AND completed_at BETWEEN ? AND ?"
    );
    $soloStmt->execute([$userId, $config['start'], $config['end']]);
    foreach ($soloStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $basePoints = tourDeGlaceChallengeBasePoints('challenge_completed');
        $candidates[] = [
            'action_type' => 'challenge_completed',
            'source_type' => 'challenge',
            'source_id' => (int)$row['id'],
            'completed_at' => (string)$row['completed_at'],
            'score' => array_sum($basePoints),
            'base_points' => $basePoints,
            'metadata' => [
                'type' => $row['type'] ?? null,
                'difficulty' => $row['difficulty'] ?? null,
                'shop_id' => isset($row['eisdiele_id']) ? (int)$row['eisdiele_id'] : null,
            ],
        ];
    }

    $teamStmt = $pdo->prepare(
        "SELECT id, type, difficulty, final_shop_id, completed_at
         FROM team_challenges
         WHERE status = 'completed'
           AND completed_at IS NOT NULL
           AND completed_at BETWEEN ? AND ?
           AND (inviter_user_id = ? OR invitee_user_id = ?)"
    );
    $teamStmt->execute([$config['start'], $config['end'], $userId, $userId]);
    foreach ($teamStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $basePoints = tourDeGlaceChallengeBasePoints('team_challenge_completed');
        $candidates[] = [
            'action_type' => 'team_challenge_completed',
            'source_type' => 'team_challenge',
            'source_id' => (int)$row['id'],
            'completed_at' => (string)$row['completed_at'],
            'score' => array_sum($basePoints),
            'base_points' => $basePoints,
            'metadata' => [
                'type' => $row['type'] ?? null,
                'difficulty' => $row['difficulty'] ?? null,
                'shop_id' => isset($row['final_shop_id']) ? (int)$row['final_shop_id'] : null,
            ],
        ];
    }

    usort($candidates, static function (array $a, array $b): int {
        if ($a['score'] !== $b['score']) {
            return $b['score'] <=> $a['score'];
        }
        $dateCompare = strcmp($a['completed_at'], $b['completed_at']);
        if ($dateCompare !== 0) {
            return $dateCompare;
        }
        return $a['source_id'] <=> $b['source_id'];
    });
    $selected = array_slice($candidates, 0, 3);

    $deleteStmt = $pdo->prepare(
        "DELETE FROM tour_de_glace_point_events
         WHERE campaign_id = ?
           AND user_id = ?
           AND is_shadow_test = ?
           AND action_type IN ('challenge_completed', 'team_challenge_completed')"
    );
    $deleteStmt->execute([TOUR_DE_GLACE_ID, $userId, $scopeValue]);

    $events = [];
    foreach ($selected as $candidate) {
        $points = recordTourDeGlacePointEvent(
            $pdo,
            $userId,
            $candidate['action_type'],
            'challenges',
            $candidate['source_type'],
            $candidate['source_id'],
            $candidate['base_points'],
            array_merge($candidate['metadata'], ['challenge_ranked_score' => $candidate['score']]),
            $candidate['completed_at']
        );
        if ($points !== null) {
            $events[] = array_merge($points, [
                'action_type' => $candidate['action_type'],
                'source_id' => $candidate['source_id'],
            ]);
        }
    }

    return $events;
}

function recordTourDeGlaceDailyVisit(PDO $pdo, int $userId): ?array
{
    $dateKey = (int)getTourDeGlaceNow()->format('Ymd');
    return recordTourDeGlacePointEvent($pdo, $userId, 'daily_visit', 'daily', 'tour_day', $dateKey, tourDeGlaceRulePoints('daily_visit'));
}

function userHasTourDeGlaceProfileImage(PDO $pdo, int $userId): bool
{
    $stmt = $pdo->prepare(
        "SELECT 1
         FROM user_profile_images
         WHERE user_id = ?
           AND avatar_path IS NOT NULL
           AND avatar_path <> ''
         LIMIT 1"
    );
    $stmt->execute([$userId]);
    return (bool)$stmt->fetchColumn();
}

function recordTourDeGlaceProfileImage(PDO $pdo, int $userId): ?array
{
    if (!userHasTourDeGlaceProfileImage($pdo, $userId)) {
        return null;
    }

    return recordTourDeGlacePointEvent($pdo, $userId, 'profile_image', 'profile', 'user', $userId, tourDeGlaceRulePoints('profile_image'));
}

function fetchTourDeGlaceTotals(PDO $pdo, ?int $userId = null): array
{
    ensureTourDeGlaceTables($pdo);
    $where = "campaign_id = ? AND is_shadow_test = ?";
    $params = [TOUR_DE_GLACE_ID, getTourDeGlacePointScopeValue($userId)];
    if ($userId !== null) {
        $where .= " AND user_id = ?";
        $params[] = $userId;
    }

    $stmt = $pdo->prepare(
        "SELECT user_id,
                SUM(points_yellow) AS yellow,
                SUM(points_green) AS green,
                SUM(points_mountain) AS mountain,
                SUM(points_ice) AS ice,
                SUM(points_white) AS white
         FROM tour_de_glace_point_events
         WHERE {$where}
         GROUP BY user_id"
    );
    $stmt->execute($params);
    $totals = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $uid = (int)$row['user_id'];
        $totals[$uid] = [
            'user_id' => $uid,
            'yellow' => (int)$row['yellow'],
            'green' => (int)$row['green'],
            'mountain' => (int)$row['mountain'],
            'ice' => (int)$row['ice'],
            'white' => (int)$row['white'],
        ];
    }
    return $totals;
}

function getTourDeGlaceLeaderboard(PDO $pdo, string $jersey = 'yellow', int $limit = 50, bool $includeBreakdown = true): array
{
    ensureTourDeGlaceTables($pdo);
    $allowed = ['yellow', 'green', 'mountain', 'ice', 'white'];
    if (!in_array($jersey, $allowed, true)) {
        $jersey = 'yellow';
    }
    $column = 'points_' . $jersey;
    $stmt = $pdo->prepare(
        "SELECT p.user_id, n.username, up.avatar_path, SUM(p.{$column}) AS points
         FROM tour_de_glace_point_events p
         JOIN nutzer n ON n.id = p.user_id
         LEFT JOIN user_profile_images up ON up.user_id = p.user_id
         WHERE p.campaign_id = ?
           AND p.is_shadow_test = ?
         GROUP BY p.user_id, n.username, up.avatar_path
         HAVING points > 0
         ORDER BY points DESC, p.user_id ASC
         " . ($limit > 0 ? "LIMIT ?" : "")
    );
    $stmt->bindValue(1, TOUR_DE_GLACE_ID);
    $stmt->bindValue(2, getTourDeGlacePointScopeValue(), PDO::PARAM_INT);
    if ($limit > 0) {
        $stmt->bindValue(3, max(1, min(100, $limit)), PDO::PARAM_INT);
    }
    $stmt->execute();

    $rank = 0;
    $entries = array_map(function (array $row) use (&$rank, $pdo, $includeBreakdown): array {
        $rank++;
        $entry = [
            'rank' => $rank,
            'user_id' => (int)$row['user_id'],
            'username' => $row['username'],
            'avatar_path' => $row['avatar_path'],
            'points' => (int)$row['points'],
        ];
        if ($includeBreakdown) {
            $entry['breakdown'] = getTourDeGlaceUserBreakdown($pdo, (int)$row['user_id']);
        }
        return $entry;
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));

    return applyTourDeGlaceRankTrends($pdo, $entries, tourDeGlaceSnapshotType($jersey));
}

function getTourDeGlaceUserRank(PDO $pdo, string $jersey, int $userId): ?array
{
    $allowed = ['yellow', 'green', 'mountain', 'ice', 'white'];
    if (!in_array($jersey, $allowed, true)) {
        return null;
    }

    foreach (getTourDeGlaceLeaderboard($pdo, $jersey, 0, false) as $entry) {
        if ((int)$entry['user_id'] === $userId) {
            return $entry;
        }
    }

    return null;
}

function ensureLeaderboardDailySnapshotsTable(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS leaderboard_daily_snapshots (
            id INT NOT NULL AUTO_INCREMENT,
            leaderboard_type VARCHAR(64) NOT NULL,
            snapshot_date DATE NOT NULL,
            user_id INT NOT NULL,
            rank_position INT NOT NULL,
            score INT NOT NULL DEFAULT 0,
            payload_json JSON DEFAULT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_leaderboard_snapshot_user (leaderboard_type, snapshot_date, user_id),
            KEY idx_leaderboard_snapshot_lookup (leaderboard_type, snapshot_date, rank_position),
            CONSTRAINT fk_leaderboard_snapshot_user FOREIGN KEY (user_id) REFERENCES nutzer (id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci"
    );
}

function tourDeGlaceSnapshotType(string $rankingKey): string
{
    return TOUR_DE_GLACE_ID . '_' . $rankingKey;
}

function getTourDeGlacePreviousRankMap(PDO $pdo, string $snapshotType, ?DateTimeImmutable $reference = null): array
{
    ensureLeaderboardDailySnapshotsTable($pdo);
    $date = ($reference ?? getTourDeGlaceNow())->modify('-1 day')->format('Y-m-d');
    $stmt = $pdo->prepare(
        "SELECT user_id, rank_position
         FROM leaderboard_daily_snapshots
         WHERE leaderboard_type = ?
           AND snapshot_date = ?"
    );
    $stmt->execute([$snapshotType, $date]);

    $ranks = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $ranks[(int)$row['user_id']] = (int)$row['rank_position'];
    }
    return $ranks;
}

function applyTourDeGlaceRankTrends(PDO $pdo, array $entries, string $snapshotType): array
{
    if (!$entries) {
        return [];
    }

    $previousRanks = getTourDeGlacePreviousRankMap($pdo, $snapshotType);
    if (!$previousRanks) {
        foreach ($entries as &$entry) {
            $entry['rank_change'] = null;
            $entry['rank_delta'] = null;
        }
        unset($entry);
        return $entries;
    }

    foreach ($entries as &$entry) {
        $userId = (int)($entry['user_id'] ?? 0);
        $currentRank = (int)($entry['rank'] ?? 0);
        $previousRank = $previousRanks[$userId] ?? null;
        $entry['previous_rank'] = $previousRank;
        if ($previousRank === null) {
            $entry['rank_change'] = 'new';
            $entry['rank_delta'] = null;
        } elseif ($currentRank < $previousRank) {
            $entry['rank_change'] = 'up';
            $entry['rank_delta'] = $previousRank - $currentRank;
        } elseif ($currentRank > $previousRank) {
            $entry['rank_change'] = 'down';
            $entry['rank_delta'] = $currentRank - $previousRank;
        } else {
            $entry['rank_change'] = 'same';
            $entry['rank_delta'] = 0;
        }
    }
    unset($entry);

    return $entries;
}

function getTourDeGlaceStageTipLeaderboard(PDO $pdo, int $limit = 50): array
{
    ensureTourDeGlaceTables($pdo);
    $stmt = $pdo->prepare(
        "SELECT t.user_id,
                n.username,
                up.avatar_path,
                t.stage_number,
                t.tip_stage_winner,
                t.updated_at
         FROM tour_de_glace_stage_tips t
         JOIN nutzer n ON n.id = t.user_id
         LEFT JOIN user_profile_images up ON up.user_id = t.user_id
         WHERE t.campaign_id = ?
         ORDER BY t.user_id ASC, t.stage_number ASC"
    );
    $stmt->execute([TOUR_DE_GLACE_ID]);

    $results = getTourDeGlaceStageResults($pdo);
    $entries = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $stageNumber = (int)$row['stage_number'];
        $top10 = $results[$stageNumber]['top10'] ?? [];
        if (!$top10) {
            continue;
        }

        $userId = (int)$row['user_id'];
        $score = scoreTourDeGlaceStageTip(
            (string)$row['tip_stage_winner'],
            $top10,
            hasTourDeGlaceStageEgg($pdo, $userId, $stageNumber)
        );
        if (!isset($entries[$userId])) {
            $entries[$userId] = [
                'user_id' => $userId,
                'username' => $row['username'],
                'avatar_path' => $row['avatar_path'],
                'points' => 0,
                'winner_hits' => 0,
                'top3_hits' => 0,
                'top10_hits' => 0,
                'last_tip_at' => null,
            ];
        }
        $entries[$userId]['points'] += (int)$score['final_ep'];
        if ((int)($score['predicted_rank'] ?? 0) === 1) {
            $entries[$userId]['winner_hits']++;
        }
        if (($score['predicted_rank'] ?? null) !== null && (int)$score['predicted_rank'] <= 3) {
            $entries[$userId]['top3_hits']++;
        }
        if (!empty($score['scored'])) {
            $entries[$userId]['top10_hits']++;
        }
        if ($row['updated_at'] && ($entries[$userId]['last_tip_at'] === null || strcmp((string)$row['updated_at'], (string)$entries[$userId]['last_tip_at']) > 0)) {
            $entries[$userId]['last_tip_at'] = $row['updated_at'];
        }
    }

    $entries = array_values(array_filter($entries, static fn(array $entry): bool => (int)$entry['points'] > 0));
    usort($entries, static function (array $left, array $right): int {
        foreach (['points', 'winner_hits', 'top3_hits', 'top10_hits'] as $key) {
            $diff = (int)$right[$key] <=> (int)$left[$key];
            if ($diff !== 0) {
                return $diff;
            }
        }
        $leftTime = (string)($left['last_tip_at'] ?? '9999-12-31 23:59:59');
        $rightTime = (string)($right['last_tip_at'] ?? '9999-12-31 23:59:59');
        $timeDiff = strcmp($leftTime, $rightTime);
        if ($timeDiff !== 0) {
            return $timeDiff;
        }
        return (int)$left['user_id'] <=> (int)$right['user_id'];
    });

    $ranked = [];
    $previousRankFields = null;
    $rank = 0;
    $maxRows = $limit > 0 ? max(1, min(100, $limit)) : null;
    foreach ($entries as $index => $entry) {
        $rankFields = [
            'points' => (int)$entry['points'],
            'winner_hits' => (int)$entry['winner_hits'],
            'top3_hits' => (int)$entry['top3_hits'],
            'top10_hits' => (int)$entry['top10_hits'],
            'last_tip_at' => $entry['last_tip_at'],
        ];
        if ($previousRankFields !== $rankFields) {
            $rank = $index + 1;
            $previousRankFields = $rankFields;
        }
        $entry['rank'] = $rank;
        $ranked[] = $entry;
        if ($maxRows !== null && count($ranked) >= $maxRows) {
            break;
        }
    }

    return applyTourDeGlaceRankTrends($pdo, $ranked, tourDeGlaceSnapshotType('stage_tips'));
}

function getTourDeGlaceStageTipUserRank(PDO $pdo, int $userId): ?array
{
    foreach (getTourDeGlaceStageTipLeaderboard($pdo, 0) as $entry) {
        if ((int)$entry['user_id'] === $userId) {
            return $entry;
        }
    }
    return null;
}

function getTourDeGlaceStageTipSummary(array $stageTips): array
{
    $summary = [
        'points' => 0,
        'winner_hits' => 0,
        'top3_hits' => 0,
        'top10_hits' => 0,
    ];
    foreach ($stageTips as $tip) {
        $summary['points'] += (int)($tip['final_ep'] ?? 0);
        if ((int)($tip['predicted_rank'] ?? 0) === 1) {
            $summary['winner_hits']++;
        }
        if (($tip['predicted_rank'] ?? null) !== null && (int)$tip['predicted_rank'] <= 3) {
            $summary['top3_hits']++;
        }
        if (!empty($tip['scored'])) {
            $summary['top10_hits']++;
        }
    }
    return $summary;
}

function getTourDeGlaceOverallTipLeaderboard(PDO $pdo, int $limit = 50): array
{
    ensureTourDeGlaceTables($pdo);
    $results = getTourDeGlaceFinalResults($pdo);
    if (!$results) {
        return [];
    }

    $stmt = $pdo->prepare(
        "SELECT t.user_id, n.username, up.avatar_path, t.tip_gc_winner, t.tip_gc_second, t.tip_gc_third,
                t.tip_green_winner, t.tip_mountain_winner, t.tip_white_winner, t.updated_at
         FROM tour_de_glace_tips t
         JOIN nutzer n ON n.id = t.user_id
         LEFT JOIN user_profile_images up ON up.user_id = t.user_id
         WHERE t.campaign_id = ?"
    );
    $stmt->execute([TOUR_DE_GLACE_ID]);

    $entries = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $score = scoreTourDeGlaceOverallTips($row, $results);
        $entries[] = array_merge([
            'user_id' => (int)$row['user_id'],
            'username' => $row['username'],
            'avatar_path' => $row['avatar_path'],
            'last_tip_at' => $row['updated_at'],
        ], $score);
    }

    usort($entries, static function (array $left, array $right): int {
        foreach (['points', 'exact_hits', 'gc_winner_correct', 'gc_top3_hits'] as $key) {
            $diff = (int)$right[$key] <=> (int)$left[$key];
            if ($diff !== 0) {
                return $diff;
            }
        }
        $timeDiff = strcmp((string)$left['last_tip_at'], (string)$right['last_tip_at']);
        return $timeDiff !== 0 ? $timeDiff : ((int)$left['user_id'] <=> (int)$right['user_id']);
    });

    $ranked = [];
    $previousRankFields = null;
    $rank = 0;
    $maxRows = $limit > 0 ? max(1, min(100, $limit)) : null;
    foreach ($entries as $index => $entry) {
        $rankFields = [$entry['points'], $entry['exact_hits'], $entry['gc_winner_correct'], $entry['gc_top3_hits'], $entry['last_tip_at']];
        if ($previousRankFields !== $rankFields) {
            $rank = $index + 1;
            $previousRankFields = $rankFields;
        }
        $entry['rank'] = $rank;
        $ranked[] = $entry;
        if ($maxRows !== null && count($ranked) >= $maxRows) {
            break;
        }
    }
    return $ranked;
}

function getTourDeGlaceOverallTipUserRank(PDO $pdo, int $userId): ?array
{
    foreach (getTourDeGlaceOverallTipLeaderboard($pdo, 0) as $entry) {
        if ((int)$entry['user_id'] === $userId) {
            return $entry;
        }
    }
    return null;
}

function getTourDeGlaceUserRanks(PDO $pdo, int $userId): array
{
    $ranks = [];
    foreach (['yellow', 'green', 'mountain', 'ice', 'white'] as $jersey) {
        $ranks[$jersey] = getTourDeGlaceUserRank($pdo, $jersey, $userId);
    }
    return $ranks;
}

function getTourDeGlaceUserBreakdown(PDO $pdo, int $userId): array
{
    ensureTourDeGlaceTables($pdo);
    $stmt = $pdo->prepare(
        "SELECT action_type,
                SUM(points_yellow) AS yellow,
                SUM(points_green) AS green,
                SUM(points_mountain) AS mountain,
                SUM(points_ice) AS ice,
                SUM(points_white) AS white
         FROM tour_de_glace_point_events
         WHERE campaign_id = ?
           AND user_id = ?
           AND is_shadow_test = ?
         GROUP BY action_type
         ORDER BY action_type ASC"
    );
    $stmt->execute([TOUR_DE_GLACE_ID, $userId, getTourDeGlacePointScopeValue($userId)]);

    $breakdown = [
        'yellow' => [],
        'green' => [],
        'mountain' => [],
        'ice' => [],
        'white' => [],
    ];

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $actionType = (string)$row['action_type'];
        foreach (array_keys($breakdown) as $jersey) {
            $points = (int)$row[$jersey];
            if ($points > 0) {
                $breakdown[$jersey][$actionType] = $points;
            }
        }
    }

    return $breakdown;
}

function getTourDeGlaceCompactLeaderboards(PDO $pdo, int $limit = 5): array
{
    $leaderboards = [];
    foreach (['yellow', 'green', 'mountain', 'ice', 'white'] as $jersey) {
        $leaderboards[$jersey] = getTourDeGlaceLeaderboard($pdo, $jersey, $limit);
    }
    $leaderboards['stage_tips'] = getTourDeGlaceStageTipLeaderboard($pdo, $limit);
    $leaderboards['overall_tips'] = getTourDeGlaceOverallTipLeaderboard($pdo, $limit);
    return $leaderboards;
}

function getTourDeGlaceOfficialLeaders(PDO $pdo): array
{
    $config = tourDeGlaceConfig();
    $leaders = [];
    $assignedUsers = [];
    $jerseys = array_keys($config['jerseys']);
    usort($jerseys, static fn($a, $b) => $config['jerseys'][$a]['priority'] <=> $config['jerseys'][$b]['priority']);

    foreach ($jerseys as $jersey) {
        $leaderboard = getTourDeGlaceLeaderboard($pdo, $jersey, 100, false);
        $rawLeader = $leaderboard[0] ?? null;
        $official = null;
        foreach ($leaderboard as $entry) {
            if (!isset($assignedUsers[(int)$entry['user_id']])) {
                $official = $entry;
                $assignedUsers[(int)$entry['user_id']] = true;
                break;
            }
        }
        $leaders[$jersey] = [
            'raw' => $rawLeader,
            'official' => $official,
        ];
    }
    return $leaders;
}

function getCurrentTourDeGlaceStage(?DateTimeImmutable $now = null): ?array
{
    $config = tourDeGlaceConfig();
    $reference = $now ?? getTourDeGlaceNow();
    if (isTourDeGlaceShadowTestNow($reference)) {
        $shadowStart = new DateTimeImmutable(TOUR_DE_GLACE_SHADOW_TEST_START, tourDeGlaceTimezone());
        $stageNumbers = array_keys($config['stages']);
        $daysSinceShadowStart = (int)$shadowStart->setTime(0, 0)->diff($reference->setTime(0, 0))->days;
        $stageNumber = (int)$stageNumbers[$daysSinceShadowStart % count($stageNumbers)];
        return ['stage_number' => $stageNumber] + array_merge($config['stages'][$stageNumber], ['date' => $reference->format('Y-m-d')]);
    }
    $today = $reference->format('Y-m-d');
    foreach ($config['stages'] as $number => $stage) {
        if ($stage['date'] === $today) {
            return ['stage_number' => $number] + $stage;
        }
    }
    return null;
}

function normalizeTourDeGlaceTipName(string $value): string
{
    $normalized = preg_replace('/\s+/u', ' ', trim($value));
    if (function_exists('mb_strtolower')) {
        return mb_strtolower((string)$normalized, 'UTF-8');
    }
    return strtolower((string)$normalized);
}

function normalizeTourDeGlaceStageTop10(array $top10, string $fallbackWinner = ''): array
{
    $clean = [];
    for ($index = 0; $index < 10; $index++) {
        $name = $top10[$index] ?? '';
        $name = trim((string)preg_replace('/\s+/u', ' ', (string)$name));
        $clean[] = $name !== ''
            ? (function_exists('mb_substr') ? mb_substr($name, 0, 160, 'UTF-8') : substr($name, 0, 160))
            : '';
    }

    $fallbackWinner = trim((string)preg_replace('/\s+/u', ' ', $fallbackWinner));
    if (($clean[0] ?? '') === '' && $fallbackWinner !== '') {
        $clean[0] = function_exists('mb_substr') ? mb_substr($fallbackWinner, 0, 160, 'UTF-8') : substr($fallbackWinner, 0, 160);
    }
    while ($clean && end($clean) === '') {
        array_pop($clean);
    }

    return $clean;
}

function decodeTourDeGlaceStageTop10(?string $json, string $fallbackWinner = ''): array
{
    $decoded = [];
    if ($json !== null && $json !== '') {
        $value = json_decode($json, true);
        if (is_array($value)) {
            $decoded = $value;
        }
    }
    return normalizeTourDeGlaceStageTop10($decoded, $fallbackWinner);
}

function buildTourDeGlaceStageTop10FromRow(array $row): array
{
    $top10 = decodeTourDeGlaceStageTop10($row['top10_json'] ?? null, (string)($row['stage_winner'] ?? ''));
    $columnTop10 = [(string)($row['stage_winner'] ?? '')];
    for ($place = 2; $place <= 10; $place++) {
        $columnTop10[] = (string)($row['stage_place_' . $place] ?? '');
    }
    $columnTop10 = normalizeTourDeGlaceStageTop10($columnTop10, (string)($row['stage_winner'] ?? ''));

    foreach ($columnTop10 as $index => $name) {
        if ($name !== '') {
            $top10[$index] = $name;
        }
    }

    return normalizeTourDeGlaceStageTop10($top10, (string)($row['stage_winner'] ?? ''));
}

function hasTourDeGlaceStageEgg(PDO $pdo, int $userId, int $stageNumber): bool
{
    if ($userId <= 0 || $stageNumber <= 0) {
        return false;
    }

    ensureTourDeGlaceTables($pdo);
    $stmt = $pdo->prepare(
        "SELECT 1
         FROM tour_de_glace_user_easter_eggs u
         JOIN tour_de_glace_easter_eggs e ON e.id = u.easter_egg_id
         WHERE u.campaign_id = ?
           AND u.user_id = ?
           AND u.is_shadow_test = ?
           AND e.stage_number = ?
         LIMIT 1"
    );
    $stmt->execute([TOUR_DE_GLACE_ID, $userId, getTourDeGlacePointScopeValue($userId), $stageNumber]);
    return (bool)$stmt->fetchColumn();
}

function scoreTourDeGlaceStageTip(string $tip, array $top10, bool $hasStageEgg): array
{
    $tip = trim((string)preg_replace('/\s+/u', ' ', $tip));
    $predictedRank = null;
    if ($tip !== '') {
        $normalizedTip = normalizeTourDeGlaceTipName($tip);
        foreach (array_values($top10) as $index => $name) {
            if ($normalizedTip === normalizeTourDeGlaceTipName((string)$name)) {
                $predictedRank = $index + 1;
                break;
            }
        }
    }

    $rules = tourDeGlaceStageTipPointRules();
    $baseEp = $predictedRank !== null ? (int)($rules[$predictedRank] ?? 0) : 0;
    $eggMultiplier = $hasStageEgg ? TOUR_DE_GLACE_STAGE_TIP_EGG_MULTIPLIER : 1.0;
    $finalEp = $baseEp > 0 ? (int)round($baseEp * $eggMultiplier) : 0;

    return [
        'predicted_rank' => $predictedRank,
        'base_ep' => $baseEp,
        'egg_multiplier' => $eggMultiplier,
        'egg_bonus_ep' => max(0, $finalEp - $baseEp),
        'final_ep' => $finalEp,
        'scored' => $predictedRank !== null,
        'is_correct' => $predictedRank === 1,
    ];
}

function scoreTourDeGlaceOverallTips(array $tips, ?array $results): array
{
    $summary = [
        'points' => 0,
        'exact_hits' => 0,
        'gc_winner_correct' => false,
        'gc_top3_hits' => 0,
        'scored' => false,
    ];
    if (!$results) {
        return $summary;
    }

    $rules = tourDeGlaceOverallTipPointRules();
    $actualTop3 = [
        normalizeTourDeGlaceTipName((string)($results['result_gc_winner'] ?? '')),
        normalizeTourDeGlaceTipName((string)($results['result_gc_second'] ?? '')),
        normalizeTourDeGlaceTipName((string)($results['result_gc_third'] ?? '')),
    ];
    foreach (['tip_gc_winner', 'tip_gc_second', 'tip_gc_third'] as $index => $tipKey) {
        $tip = normalizeTourDeGlaceTipName((string)($tips[$tipKey] ?? ''));
        if ($tip === '') {
            continue;
        }
        if ($tip === $actualTop3[$index]) {
            $summary['points'] += (int)$rules['gc_exact'][$index + 1];
            $summary['exact_hits']++;
            $summary['gc_top3_hits']++;
            if ($index === 0) {
                $summary['gc_winner_correct'] = true;
            }
        } elseif (in_array($tip, $actualTop3, true)) {
            $summary['points'] += (int)$rules['gc_top3_wrong_position'];
            $summary['gc_top3_hits']++;
        }
    }

    foreach ([
        'tip_green_winner' => 'result_green_winner',
        'tip_mountain_winner' => 'result_mountain_winner',
        'tip_white_winner' => 'result_white_winner',
    ] as $tipKey => $resultKey) {
        $tip = normalizeTourDeGlaceTipName((string)($tips[$tipKey] ?? ''));
        $result = normalizeTourDeGlaceTipName((string)($results[$resultKey] ?? ''));
        if ($tip !== '' && $tip === $result) {
            $summary['points'] += (int)$rules['jersey_exact'];
            $summary['exact_hits']++;
        }
    }

    $summary['scored'] = true;
    return $summary;
}

function getTourDeGlaceStage(int $stageNumber): ?array
{
    $config = tourDeGlaceConfig();
    if (!isset($config['stages'][$stageNumber])) {
        return null;
    }
    return ['stage_number' => $stageNumber] + $config['stages'][$stageNumber];
}

function getTourDeGlaceStageStart(array $stage): DateTimeImmutable
{
    $startAt = (string)($stage['start_at'] ?? (($stage['date'] ?? getTourDeGlaceNow()->format('Y-m-d')) . ' 12:00:00'));
    return new DateTimeImmutable($startAt, tourDeGlaceTimezone());
}

function formatTourDeGlaceStageTipRow(array $row, array $resultsByStage = [], ?DateTimeImmutable $now = null, ?PDO $pdo = null): array
{
    $stageNumber = (int)$row['stage_number'];
    $stage = getTourDeGlaceStage($stageNumber);
    $startAt = $stage ? getTourDeGlaceStageStart($stage) : null;
    $reference = $now ?? getTourDeGlaceNow();
    $result = $resultsByStage[$stageNumber] ?? null;
    $top10 = is_array($result) ? ($result['top10'] ?? []) : [];
    $winner = $top10[0] ?? ($result['stage_winner'] ?? null);
    $tip = (string)($row['tip_stage_winner'] ?? '');
    $userId = isset($row['user_id']) ? (int)$row['user_id'] : null;
    $hasStageEgg = $pdo !== null && $userId ? hasTourDeGlaceStageEgg($pdo, $userId, $stageNumber) : false;
    $score = scoreTourDeGlaceStageTip($tip, $top10, $hasStageEgg);
    $hasResult = count($top10) > 0;

    return array_merge([
        'user_id' => $userId,
        'username' => $row['username'] ?? null,
        'stage_number' => $stageNumber,
        'stage_date' => $stage['date'] ?? ($row['stage_date'] ?? null),
        'start_at' => $startAt ? $startAt->format('Y-m-d H:i:s') : null,
        'start_location' => $stage['start'] ?? ($row['start_location'] ?? null),
        'finish_location' => $stage['finish'] ?? ($row['finish_location'] ?? null),
        'tip_stage_winner' => $tip,
        'stage_winner' => $winner,
        'stage_top10' => $top10,
        'closed' => $startAt ? $reference > $startAt : true,
        'submitted_at' => $row['submitted_at'] ?? null,
        'updated_at' => $row['updated_at'] ?? null,
        'has_stage_egg' => $hasStageEgg,
        'has_result' => $hasResult,
    ], $hasResult ? $score : [
        'predicted_rank' => null,
        'base_ep' => 0,
        'egg_multiplier' => $hasStageEgg ? TOUR_DE_GLACE_STAGE_TIP_EGG_MULTIPLIER : 1.0,
        'egg_bonus_ep' => 0,
        'final_ep' => 0,
        'scored' => false,
        'is_correct' => false,
    ]);
}

function getTourDeGlaceTips(PDO $pdo, int $userId): ?array
{
    ensureTourDeGlaceTables($pdo);
    $stmt = $pdo->prepare("SELECT * FROM tour_de_glace_tips WHERE campaign_id = ? AND user_id = ? LIMIT 1");
    $stmt->execute([TOUR_DE_GLACE_ID, $userId]);
    $tips = $stmt->fetch(PDO::FETCH_ASSOC);
    return $tips ?: null;
}

function submitTourDeGlaceTips(PDO $pdo, int $userId, array $tips): array
{
    ensureTourDeGlaceTables($pdo);
    $config = tourDeGlaceConfig();
    $now = getTourDeGlaceNow();
    $preStart = canUseTourDeGlaceAdminPreview($userId)
        ? new DateTimeImmutable(TOUR_DE_GLACE_ADMIN_PREVIEW_START, tourDeGlaceTimezone())
        : new DateTimeImmutable($config['pre_start'], tourDeGlaceTimezone());
    $deadline = new DateTimeImmutable(TOUR_DE_GLACE_TIP_DEADLINE, tourDeGlaceTimezone());
    if ($now < $preStart) {
        throw new RuntimeException('Die Tippabgabe ist noch nicht geöffnet.');
    }
    if ($now > $deadline) {
        throw new RuntimeException('Die Tippabgabe ist geschlossen.');
    }

    $clean = [];
    foreach (['tip_gc_winner', 'tip_gc_second', 'tip_gc_third', 'tip_green_winner', 'tip_mountain_winner', 'tip_white_winner'] as $key) {
        $value = trim((string)($tips[$key] ?? ''));
        $clean[$key] = $value !== '' ? substr($value, 0, 160) : null;
    }
    $seenTipNames = [];
    foreach (['tip_gc_winner', 'tip_gc_second', 'tip_gc_third'] as $key) {
        $value = $clean[$key] ?? null;
        if ($value === null || $value === '') {
            continue;
        }
        $normalizedValue = strtolower((string)preg_replace('/\s+/', ' ', trim($value)));
        if (isset($seenTipNames[$normalizedValue])) {
            throw new RuntimeException('Ein Fahrer darf in der Gesamtwertung nur einmal auf Platz 1, 2 oder 3 getippt werden.');
        }
        $seenTipNames[$normalizedValue] = true;
    }

    $stmt = $pdo->prepare(
        "INSERT INTO tour_de_glace_tips (
            campaign_id, user_id, tip_gc_winner, tip_gc_second, tip_gc_third, tip_green_winner, tip_mountain_winner, tip_white_winner, submitted_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
            tip_gc_winner = VALUES(tip_gc_winner),
            tip_gc_second = VALUES(tip_gc_second),
            tip_gc_third = VALUES(tip_gc_third),
            tip_green_winner = VALUES(tip_green_winner),
            tip_mountain_winner = VALUES(tip_mountain_winner),
            tip_white_winner = VALUES(tip_white_winner),
            updated_at = NOW()"
    );
    $stmt->execute([
        TOUR_DE_GLACE_ID,
        $userId,
        $clean['tip_gc_winner'],
        $clean['tip_gc_second'],
        $clean['tip_gc_third'],
        $clean['tip_green_winner'],
        $clean['tip_mountain_winner'],
        $clean['tip_white_winner'],
    ]);

    return getTourDeGlaceTips($pdo, $userId) ?: [];
}

function getTourDeGlaceStageResults(PDO $pdo): array
{
    ensureTourDeGlaceTables($pdo);
    $stmt = $pdo->prepare(
        "SELECT stage_number,
                stage_winner,
                stage_place_2,
                stage_place_3,
                stage_place_4,
                stage_place_5,
                stage_place_6,
                stage_place_7,
                stage_place_8,
                stage_place_9,
                stage_place_10,
                top10_json,
                updated_by_user_id,
                updated_at
         FROM tour_de_glace_stage_results
         WHERE campaign_id = ?
         ORDER BY stage_number ASC"
    );
    $stmt->execute([TOUR_DE_GLACE_ID]);

    $results = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $stageNumber = (int)$row['stage_number'];
        $top10 = buildTourDeGlaceStageTop10FromRow($row);
        $results[$stageNumber] = [
            'stage_number' => $stageNumber,
            'stage_winner' => $top10[0] ?? $row['stage_winner'],
            'top10' => $top10,
            'updated_by_user_id' => isset($row['updated_by_user_id']) ? (int)$row['updated_by_user_id'] : null,
            'updated_at' => $row['updated_at'],
        ];
    }
    return $results;
}

function getTourDeGlaceFinalResults(PDO $pdo): ?array
{
    ensureTourDeGlaceTables($pdo);
    $stmt = $pdo->prepare(
        "SELECT result_gc_winner, result_gc_second, result_gc_third, result_green_winner, result_mountain_winner,
                result_white_winner, updated_by_user_id, updated_at
         FROM tour_de_glace_final_results
         WHERE campaign_id = ?
         LIMIT 1"
    );
    $stmt->execute([TOUR_DE_GLACE_ID]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    return $result ?: null;
}

function saveTourDeGlaceFinalResults(PDO $pdo, int $adminUserId, array $results): array
{
    ensureTourDeGlaceTables($pdo);
    $clean = [];
    $fields = ['result_gc_winner', 'result_gc_second', 'result_gc_third', 'result_green_winner', 'result_mountain_winner', 'result_white_winner'];
    foreach ($fields as $field) {
        $value = trim((string)preg_replace('/\s+/u', ' ', (string)($results[$field] ?? '')));
        if ($value === '') {
            throw new RuntimeException('Bitte alle Gesamt- und Trikot-Ergebnisse eintragen.');
        }
        $clean[$field] = function_exists('mb_substr') ? mb_substr($value, 0, 160, 'UTF-8') : substr($value, 0, 160);
    }
    $seen = [];
    foreach (['result_gc_winner', 'result_gc_second', 'result_gc_third'] as $field) {
        $name = normalizeTourDeGlaceTipName($clean[$field]);
        if (isset($seen[$name])) {
            throw new RuntimeException('Ein Fahrer darf in der Gesamtwertung nur einmal auf Platz 1, 2 oder 3 stehen.');
        }
        $seen[$name] = true;
    }

    $stmt = $pdo->prepare(
        "INSERT INTO tour_de_glace_final_results (
            campaign_id, result_gc_winner, result_gc_second, result_gc_third, result_green_winner,
            result_mountain_winner, result_white_winner, updated_by_user_id, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
            result_gc_winner = VALUES(result_gc_winner),
            result_gc_second = VALUES(result_gc_second),
            result_gc_third = VALUES(result_gc_third),
            result_green_winner = VALUES(result_green_winner),
            result_mountain_winner = VALUES(result_mountain_winner),
            result_white_winner = VALUES(result_white_winner),
            updated_by_user_id = VALUES(updated_by_user_id),
            updated_at = NOW()"
    );
    $stmt->execute(array_merge([TOUR_DE_GLACE_ID], array_map(static fn(string $field): string => $clean[$field], $fields), [$adminUserId]));
    return getTourDeGlaceFinalResults($pdo) ?: [];
}

function submitTourDeGlaceStageTip(PDO $pdo, int $userId, int $stageNumber, string $tipStageWinner): array
{
    ensureTourDeGlaceTables($pdo);
    $stage = getTourDeGlaceStage($stageNumber);
    if (!$stage) {
        throw new RuntimeException('Ungültige Etappe.');
    }

    $now = getTourDeGlaceNow();
    if ($now > getTourDeGlaceStageStart($stage)) {
        throw new RuntimeException('Die Tippabgabe für diese Etappe ist geschlossen.');
    }

    $cleanTip = trim((string)preg_replace('/\s+/u', ' ', $tipStageWinner));
    if ($cleanTip === '') {
        throw new RuntimeException('Bitte gib einen Etappensieger ein.');
    }
    $cleanTip = substr($cleanTip, 0, 160);

    $stmt = $pdo->prepare(
        "INSERT INTO tour_de_glace_stage_tips (campaign_id, user_id, stage_number, tip_stage_winner, submitted_at)
         VALUES (?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
            tip_stage_winner = VALUES(tip_stage_winner),
            updated_at = NOW()"
    );
    $stmt->execute([TOUR_DE_GLACE_ID, $userId, $stageNumber, $cleanTip]);

    $tips = getTourDeGlaceStageTipsForUser($pdo, $userId);
    foreach ($tips as $tip) {
        if ((int)$tip['stage_number'] === $stageNumber) {
            return $tip;
        }
    }
    return [];
}

function saveTourDeGlaceStageResult(PDO $pdo, int $adminUserId, int $stageNumber, string $stageWinner, array $top10 = []): array
{
    ensureTourDeGlaceTables($pdo);
    if (!getTourDeGlaceStage($stageNumber)) {
        throw new RuntimeException('Ungültige Etappe.');
    }

    $cleanTop10 = normalizeTourDeGlaceStageTop10($top10, $stageWinner);
    $cleanWinner = $cleanTop10[0] ?? trim((string)preg_replace('/\s+/u', ' ', $stageWinner));
    if ($cleanWinner === '') {
        throw new RuntimeException('Bitte gib einen Etappensieger ein.');
    }

    $top10Json = json_encode($cleanTop10, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($top10Json === false) {
        throw new RuntimeException('Etappenergebnis konnte nicht verarbeitet werden.');
    }

    $startedTransaction = !$pdo->inTransaction();
    if ($startedTransaction) {
        $pdo->beginTransaction();
    }

    try {
        $deleteStmt = $pdo->prepare(
            "DELETE FROM tour_de_glace_stage_results
             WHERE campaign_id = ?
               AND stage_number = ?"
        );
        $deleteStmt->execute([TOUR_DE_GLACE_ID, $stageNumber]);

        $placeColumns = [];
        $placePlaceholders = [];
        $placeValues = [];
        for ($place = 2; $place <= 10; $place++) {
            $placeColumns[] = 'stage_place_' . $place;
            $placePlaceholders[] = '?';
            $placeValues[] = ($cleanTop10[$place - 1] ?? '') !== '' ? $cleanTop10[$place - 1] : null;
        }

        $insertStmt = $pdo->prepare(
            "INSERT INTO tour_de_glace_stage_results (
                campaign_id,
                stage_number,
                stage_winner,
                " . implode(",\n                ", $placeColumns) . ",
                top10_json,
                updated_by_user_id,
                updated_at
             )
             VALUES (?, ?, ?, " . implode(', ', $placePlaceholders) . ", ?, ?, NOW())"
        );
        $insertStmt->execute(array_merge([
            TOUR_DE_GLACE_ID,
            $stageNumber,
            $cleanWinner,
        ], $placeValues, [
            $top10Json,
            $adminUserId,
        ]));

        if ($startedTransaction) {
            $pdo->commit();
        }
    } catch (Throwable $e) {
        if ($startedTransaction && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    return getTourDeGlaceStageResults($pdo)[$stageNumber] ?? [];
}

function getTourDeGlaceStageTipsForUser(PDO $pdo, int $userId): array
{
    ensureTourDeGlaceTables($pdo);
    $stmt = $pdo->prepare(
        "SELECT user_id, stage_number, tip_stage_winner, submitted_at, updated_at
         FROM tour_de_glace_stage_tips
         WHERE campaign_id = ?
           AND user_id = ?
         ORDER BY stage_number ASC"
    );
    $stmt->execute([TOUR_DE_GLACE_ID, $userId]);

    $results = getTourDeGlaceStageResults($pdo);
    $tipsByStage = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $tipsByStage[(int)$row['stage_number']] = $row;
    }

    $stageTips = [];
    foreach (tourDeGlaceConfig()['stages'] as $stageNumber => $stage) {
        $row = $tipsByStage[(int)$stageNumber] ?? [
            'user_id' => $userId,
            'stage_number' => (int)$stageNumber,
            'tip_stage_winner' => '',
            'submitted_at' => null,
            'updated_at' => null,
        ];
        $stageTips[] = formatTourDeGlaceStageTipRow($row, $results, null, $pdo);
    }
    return $stageTips;
}

function getTourDeGlaceCorrectStageTipCount(PDO $pdo, int $userId): int
{
    $count = 0;
    foreach (getTourDeGlaceStageTipsForUser($pdo, $userId) as $tip) {
        if (!empty($tip['is_correct'])) {
            $count++;
        }
    }
    return $count;
}

function getTourDeGlaceAvailableEasterEgg(PDO $pdo, ?int $stageNumber = null): ?array
{
    ensureTourDeGlaceTables($pdo);
    $stage = null;
    $now = getTourDeGlaceNow();
    if ($stageNumber !== null) {
        $config = tourDeGlaceConfig();
        if (!isset($config['stages'][$stageNumber])) {
            return null;
        }
        $stage = ['stage_number' => $stageNumber] + $config['stages'][$stageNumber];
    } else {
        $stage = getCurrentTourDeGlaceStage();
        if (!$stage && getTourDeGlacePhase($now) === 'pre') {
            $stage = getTourDeGlaceStage(1);
        }
    }
    if (!$stage) {
        return null;
    }

    if (isTourDeGlaceShadowTestNow($now)) {
        $shadowStage = getCurrentTourDeGlaceStage($now);
        if (!$shadowStage || (int)$stage['stage_number'] !== (int)$shadowStage['stage_number']) {
            return null;
        }
        $stage['date'] = $now->format('Y-m-d');
    }
    $stageDate = new DateTimeImmutable($stage['date'] . ' 00:00:00', tourDeGlaceTimezone());
    $availableFrom = $stageDate->modify('-6 hours');
    if ((int)$stage['stage_number'] === 1) {
        $preStart = new DateTimeImmutable(tourDeGlaceConfig()['pre_start'], tourDeGlaceTimezone());
        if ($now >= $preStart && $now < $stageDate) {
            $availableFrom = $preStart;
        }
    }
    $expiresAt = $stageDate->modify('+2 days');
    if ($now < $availableFrom || $now > $expiresAt) {
        return null;
    }

    $stmt = $pdo->prepare("SELECT * FROM tour_de_glace_easter_eggs WHERE campaign_id = ? AND stage_number = ? AND is_active = 1 LIMIT 1");
    $stmt->execute([TOUR_DE_GLACE_ID, (int)$stage['stage_number']]);
    $egg = $stmt->fetch(PDO::FETCH_ASSOC);
    $funTexts = tourDeGlaceStageFunTexts();
    return $egg ? array_merge($egg, [
        'expires_at' => $expiresAt->format('Y-m-d H:i:s'),
        'fun_text' => $funTexts[(int)$stage['stage_number']] ?? null,
    ]) : null;
}

function getTourDeGlaceFoundEggIds(PDO $pdo, int $userId): array
{
    ensureTourDeGlaceTables($pdo);
    $stmt = $pdo->prepare(
        "SELECT easter_egg_id
         FROM tour_de_glace_user_easter_eggs
         WHERE campaign_id = ?
           AND user_id = ?
           AND is_shadow_test = ?"
    );
    $stmt->execute([TOUR_DE_GLACE_ID, $userId, getTourDeGlacePointScopeValue($userId)]);
    return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
}

function getTourDeGlaceSightedStages(PDO $pdo, int $userId): array
{
    ensureTourDeGlaceTables($pdo);
    $stmt = $pdo->prepare(
        "SELECT e.id,
                e.stage_number,
                e.stage_date,
                e.start_location,
                e.finish_location,
                u.found_at
         FROM tour_de_glace_user_easter_eggs u
         JOIN tour_de_glace_easter_eggs e ON e.id = u.easter_egg_id
         WHERE u.campaign_id = ?
           AND u.user_id = ?
           AND u.is_shadow_test = ?
         ORDER BY e.stage_number ASC"
    );
    $stmt->execute([TOUR_DE_GLACE_ID, $userId, getTourDeGlacePointScopeValue($userId)]);

    return array_map(static fn(array $row): array => [
        'id' => (int)$row['id'],
        'stage_number' => (int)$row['stage_number'],
        'stage_date' => $row['stage_date'],
        'start_location' => $row['start_location'],
        'finish_location' => $row['finish_location'],
        'found_at' => $row['found_at'],
    ], $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function getTourDeGlaceAwards(PDO $pdo, ?int $userId = null): array
{
    $params = [];
    $userAwardJoin = '';
    if ($userId !== null) {
        $userAwardJoin = "LEFT JOIN user_awards ua
            ON ua.award_id = al.award_id
           AND ua.level = al.level
           AND ua.user_id = ?";
        $params[] = $userId;
    }

    $stmt = $pdo->prepare(
        "SELECT al.award_id,
                al.level,
                al.threshold,
                al.icon_path,
                al.title_de,
                al.description_de,
                al.ep" . ($userId !== null ? ", ua.id AS user_award_id, ua.awarded_at" : "") . "
         FROM award_levels al
         {$userAwardJoin}
         WHERE al.award_id IN (72, 73)
         ORDER BY CASE al.award_id WHEN 72 THEN 1 WHEN 73 THEN 2 ELSE 3 END, al.level ASC"
    );
    $stmt->execute($params);

    return array_map(static fn(array $row): array => [
        'award_id' => (int)$row['award_id'],
        'level' => (int)$row['level'],
        'threshold' => isset($row['threshold']) ? (int)$row['threshold'] : null,
        'icon_path' => $row['icon_path'],
        'title_de' => $row['title_de'],
        'description_de' => $row['description_de'],
        'ep' => isset($row['ep']) ? (int)$row['ep'] : 0,
        'achieved' => $userId !== null && !empty($row['user_award_id']),
        'awarded_at' => $row['awarded_at'] ?? null,
    ], $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function findTourDeGlaceEasterEgg(PDO $pdo, int $userId, int $stageNumber, string $secretCode): array
{
    ensureTourDeGlaceTables($pdo);
    $egg = getTourDeGlaceAvailableEasterEgg($pdo, $stageNumber);
    if (!$egg) {
        throw new RuntimeException('Diese Etappensichtung ist nicht verfügbar.');
    }
    if (!isTourDeGlacePointCollectionActive($userId) && (int)$egg['stage_number'] !== 1) {
        throw new RuntimeException('Die Aktion ist aktuell nicht aktiv.');
    }
    $submittedCode = trim($secretCode);
    if (!$egg || $submittedCode === '' || !hash_equals((string)$egg['secret_code'], $submittedCode)) {
        throw new RuntimeException('Diese Etappensichtung ist nicht verfügbar.');
    }

    $stmt = $pdo->prepare(
        "INSERT IGNORE INTO tour_de_glace_user_easter_eggs (campaign_id, easter_egg_id, user_id, is_shadow_test)
         VALUES (?, ?, ?, ?)"
    );
    $stmt->execute([TOUR_DE_GLACE_ID, (int)$egg['id'], $userId, getTourDeGlacePointScopeValue($userId)]);
    $isNew = $stmt->rowCount() > 0;
    $points = null;
    if ($isNew) {
        $points = recordTourDeGlacePointEvent($pdo, $userId, 'easter_egg', 'easter', 'easter_egg', (int)$egg['id'], tourDeGlaceRulePoints('easter_egg'), ['stage_number' => (int)$egg['stage_number']]);
    }

    return [
        'found' => true,
        'is_new' => $isNew,
        'points' => $points,
        'egg' => [
            'id' => (int)$egg['id'],
            'stage_number' => (int)$egg['stage_number'],
            'stage_date' => $egg['stage_date'],
            'start_location' => $egg['start_location'],
            'finish_location' => $egg['finish_location'],
            'latitude' => isset($egg['latitude']) ? (float)$egg['latitude'] : null,
            'longitude' => isset($egg['longitude']) ? (float)$egg['longitude'] : null,
            'fun_text' => $egg['fun_text'] ?? null,
        ],
    ];
}

function buildTourDeGlaceProgress(PDO $pdo, ?int $userId = null): array
{
    ensureTourDeGlaceTables($pdo);
    $config = tourDeGlaceConfig();
    $phase = getTourDeGlacePhaseForUser($userId);
    $isShadowTest = canUseTourDeGlaceShadowTest($userId) && isTourDeGlaceShadowTestNow();
    $profile = $userId ? getTourDeGlaceProfile($pdo, $userId) : null;
    if ($userId && isTourDeGlacePointCollectionActive($userId)) {
        recordTourDeGlaceDailyVisit($pdo, $userId);
        recordTourDeGlaceProfileImage($pdo, $userId);
    }
    $totals = $userId ? (fetchTourDeGlaceTotals($pdo, $userId)[$userId] ?? ['yellow' => 0, 'green' => 0, 'mountain' => 0, 'ice' => 0, 'white' => 0]) : null;
    $currentStage = ($phase === 'active' || $isShadowTest) ? getCurrentTourDeGlaceStage() : null;
    $availableEgg = ($phase === 'active' || $phase === 'pre' || $isShadowTest) ? getTourDeGlaceAvailableEasterEgg($pdo) : null;
    $foundEggIds = $userId ? getTourDeGlaceFoundEggIds($pdo, $userId) : [];
    $sightedStages = $userId ? getTourDeGlaceSightedStages($pdo, $userId) : [];
    $stageTips = $userId ? getTourDeGlaceStageTipsForUser($pdo, $userId) : [];
    $stageTipSummary = $userId ? getTourDeGlaceStageTipSummary($stageTips) : null;
    $finalResults = getTourDeGlaceFinalResults($pdo);
    $overallTipSummary = $userId && $finalResults
        ? scoreTourDeGlaceOverallTips(getTourDeGlaceTips($pdo, $userId) ?: [], $finalResults)
        : null;

    return [
        'campaign' => [
            'id' => $config['id'],
            'title' => $config['title'],
            'phase' => $isShadowTest ? 'active' : $phase,
            'official_phase' => $phase,
            'shadow_test' => $isShadowTest,
            'point_collection_active' => isTourDeGlacePointCollectionActive($userId),
            'pre_start' => $config['pre_start'],
            'start' => $config['start'],
            'end' => $config['end'],
            'tip_deadline' => $config['tip_deadline'],
        ],
        'rider_types' => $config['rider_types'],
        'point_rules' => array_values(tourDeGlacePointRules()),
        'jerseys' => $config['jerseys'],
        'profile' => $profile ? [
            'rider_type' => $profile['rider_type'],
            'selected_at' => $profile['selected_at'],
            'rider_type_changes' => (int)($profile['rider_type_changes'] ?? 0),
            'rider_type_changes_remaining' => max(0, 3 - (int)($profile['rider_type_changes'] ?? 0)),
            'white_eligible' => $userId ? isTourDeGlaceWhiteEligible($pdo, $userId) : false,
        ] : null,
        'my_scores' => $totals,
        'my_breakdown' => $userId ? getTourDeGlaceUserBreakdown($pdo, $userId) : null,
        'my_ranks' => $userId ? getTourDeGlaceUserRanks($pdo, $userId) : null,
        'leaderboards' => getTourDeGlaceCompactLeaderboards($pdo, 5),
        'tips' => $userId ? getTourDeGlaceTips($pdo, $userId) : null,
        'stage_tips' => $stageTips,
        'stage_tip_summary' => $stageTipSummary,
        'stage_tip_rank' => $userId ? getTourDeGlaceStageTipUserRank($pdo, $userId) : null,
        'final_results' => $finalResults,
        'overall_tip_summary' => $overallTipSummary,
        'overall_tip_rank' => $userId && $finalResults ? getTourDeGlaceOverallTipUserRank($pdo, $userId) : null,
        'stage' => $currentStage,
        'easter_egg' => $availableEgg ? [
            'id' => (int)$availableEgg['id'],
            'stage_number' => (int)$availableEgg['stage_number'],
            'stage_date' => $availableEgg['stage_date'],
            'start_location' => $availableEgg['start_location'],
            'finish_location' => $availableEgg['finish_location'],
            'latitude' => isset($availableEgg['latitude']) ? (float)$availableEgg['latitude'] : null,
            'longitude' => isset($availableEgg['longitude']) ? (float)$availableEgg['longitude'] : null,
            'hint_text' => $availableEgg['hint_text'],
            'fun_text' => $availableEgg['fun_text'] ?? null,
            'map_secret_code' => $availableEgg['secret_code'],
            'expires_at' => $availableEgg['expires_at'],
            'found' => in_array((int)$availableEgg['id'], $foundEggIds, true),
        ] : null,
        'found_easter_eggs' => count($foundEggIds),
        'sighted_stages' => $sightedStages,
        'awards' => getTourDeGlaceAwards($pdo, $userId),
        'leaders' => getTourDeGlaceOfficialLeaders($pdo),
    ];
}

?>
