<?php
require_once __DIR__ . '/BaseAwardEvaluator.php';
require_once __DIR__ . '/../lib/user_profile.php';

class ProfileAvatarEvaluator extends BaseAwardEvaluator {
    const AWARD_ID = 64;
    const UPLOAD_PREFIX = 'uploads/user_avatars/';

    public function evaluate(int $userId): array {
        global $pdo;

        $avatarPath = getUserAvatarPath($pdo, $userId);
        if (!$this->hasAvatar($avatarPath)) {
            return [];
        }

        $achievements = [];
        $levels = $this->getAwardLevels();

        if (isset($levels[1]) && $this->storeAwardIfNew($userId, self::AWARD_ID, 1)) {
            $achievements[] = $this->formatAchievement($levels[1], 1);
        }

        if ($this->isUploadedAvatar($avatarPath) && isset($levels[2]) && $this->storeAwardIfNew($userId, self::AWARD_ID, 2)) {
            $achievements[] = $this->formatAchievement($levels[2], 2);
        }

        return $achievements;
    }

    private function hasAvatar(?string $avatarPath): bool {
        return trim((string)$avatarPath) !== '';
    }

    private function isUploadedAvatar(?string $avatarPath): bool {
        $path = ltrim((string)$avatarPath, '/');
        return strncmp($path, self::UPLOAD_PREFIX, strlen(self::UPLOAD_PREFIX)) === 0;
    }

    private function getAwardLevels(): array {
        global $pdo;

        $stmt = $pdo->prepare("SELECT level, icon_path, title_de, description_de, ep
                               FROM award_levels
                               WHERE award_id = :awardId
                               ORDER BY level ASC");
        $stmt->execute(['awardId' => self::AWARD_ID]);

        $levels = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $levels[(int)$row['level']] = $row;
        }

        return $levels;
    }

    private function formatAchievement(array $levelData, int $level): array {
        return [
            'award_id' => self::AWARD_ID,
            'level' => $level,
            'message' => $levelData['description_de'],
            'icon' => $levelData['icon_path'],
            'ep' => (int)$levelData['ep'],
        ];
    }
}
?>
