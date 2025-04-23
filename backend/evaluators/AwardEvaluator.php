<?php
interface AwardEvaluator {
    /**
     * Prüft, ob ein Benutzer neue Awards erhalten sollte.
     *
     * @param int $userId
     * @return array Liste neuer Awards
     */
    public function evaluate(int $userId): array;
}
?>