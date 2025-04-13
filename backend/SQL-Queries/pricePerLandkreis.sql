SELECT l.id AS landkreis_id,
       l.name AS landkreis_name,
       b.name AS bundesland_name,
       Count(ep.eisdiele_id) AS anzahl_eisdielen,
       Round(Avg(ep.kugel_preis), 2) AS durchschnittlicher_kugelpreis
FROM   (SELECT e.id AS eisdiele_id,
               e.landkreis_id,
               (SELECT p1.preis
                FROM   preise p1
                WHERE  p1.eisdiele_id = e.id
                       AND p1.typ = 'kugel'
                ORDER  BY p1.gemeldet_am DESC
                LIMIT  1) AS kugel_preis
        FROM   eisdielen e
        WHERE  e.landkreis_id IS NOT NULL) ep
       JOIN landkreise l
         ON ep.landkreis_id = l.id
       JOIN bundeslaender b
         ON l.bundesland_id = b.id
WHERE  ep.kugel_preis IS NOT NULL
GROUP  BY ep.landkreis_id
ORDER  BY durchschnittlicher_kugelpreis ASC; 