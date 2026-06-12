<?php
$code = file_get_contents('backend/kommentare.php');

$search1 = "        processTextMentions(\$pdo, \$kommentar, \$currentUserId, 'checkin_kommentar', \$checkinId, ['kommentar_id' => \$kommentarId]);";
$replace1 = "        \$stmtMeta = \$pdo->prepare(\"SELECT eisdiele_id FROM checkins WHERE id = ?\");\n        \$stmtMeta->execute([\$checkinId]);\n        \$metaId = \$stmtMeta->fetchColumn();\n        processTextMentions(\$pdo, \$kommentar, \$currentUserId, 'checkin_kommentar', \$checkinId, ['kommentar_id' => \$kommentarId, 'eisdiele_id' => \$metaId]);";

$search2 = "        processTextMentions(\$pdo, \$kommentar, \$currentUserId, 'bewertung_kommentar', \$bewertungId, ['kommentar_id' => \$kommentarId]);";
$replace2 = "        \$stmtMeta = \$pdo->prepare(\"SELECT eisdiele_id FROM bewertungen WHERE id = ?\");\n        \$stmtMeta->execute([\$bewertungId]);\n        \$metaId = \$stmtMeta->fetchColumn();\n        processTextMentions(\$pdo, \$kommentar, \$currentUserId, 'bewertung_kommentar', \$bewertungId, ['kommentar_id' => \$kommentarId, 'eisdiele_id' => \$metaId]);";

$search3 = "        processTextMentions(\$pdo, \$kommentar, \$currentUserId, 'route_kommentar', \$routeId, ['kommentar_id' => \$kommentarId]);";
$replace3 = "        \$stmtMeta = \$pdo->prepare(\"SELECT nutzer_id FROM routen WHERE id = ?\");\n        \$stmtMeta->execute([\$routeId]);\n        \$metaId = \$stmtMeta->fetchColumn();\n        processTextMentions(\$pdo, \$kommentar, \$currentUserId, 'route_kommentar', \$routeId, ['kommentar_id' => \$kommentarId, 'route_autor_id' => \$metaId]);";

$code = str_replace($search1, $replace1, $code);
$code = str_replace($search2, $replace2, $code);
$code = str_replace($search3, $replace3, $code);

file_put_contents('backend/kommentare.php', $code);
