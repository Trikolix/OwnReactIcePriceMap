import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Header from "../Header";
import { Link } from "react-router-dom";

const Ranking = () => {
    const [eisdielenKugel, setEisdielenKugel] = useState([]);
    const [eisdielenSofteis, setEisdielenSofteis] = useState([]);
    const [eisdielenEisbecher, setEisdielenEisbecher] = useState([]);
    const [sortConfigKugel, setSortConfigKugel] = useState({ key: 'finaler_score', direction: 'descending' });
    const [sortConfigSofteis, setSortConfigSofteis] = useState({ key: 'finaler_softeis_score', direction: 'descending' });
    const [sortConfigEisbecher, setSortConfigEisbehcer] = useState({ key: 'finaler_eisbecher_score', direction: 'descending' });
    const [expandedRow, setExpandedRow] = useState(null);
    const apiUrl = process.env.REACT_APP_API_BASE_URL;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${apiUrl}/get_kugeleis_rating.php`);
                const data = await response.json();
                setEisdielenKugel(data);
                const response2 = await fetch(`${apiUrl}/get_softeis_rating.php`);
                const data2 = await response2.json();
                setEisdielenSofteis(data2);
                const response3 = await fetch(`${apiUrl}/get_eisbecher_rating.php`);
                const data3 = await response3.json();
                setEisdielenEisbecher(data3);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [apiUrl]);

    const sortTableKugel = (key) => {
        let direction = 'descending';
        if (sortConfigKugel.key === key && sortConfigKugel.direction === 'descending') {
            direction = 'ascending';
        }
        setSortConfigKugel({ key, direction });
    };

    const sortTableSofteis = (key) => {
        let direction = 'descending';
        if (sortConfigSofteis.key === key && sortConfigSofteis.direction === 'descending') {
            direction = 'ascending';
        }
        setSortConfigSofteis({ key, direction });
    };

    const sortTableEisbecher = (key) => {
        let direction = 'descending';
        if (sortConfigEisbecher.key === key && sortConfigEisbecher.direction === 'descending') {
            direction = 'ascending';
        }
        setSortConfigEisbehcer({ key, direction });
    };

    const sortedEisdielenKugel = React.useMemo(() => {
        let sortableItems = [...eisdielenKugel];
        if (sortConfigKugel.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfigKugel.key];
                let bValue = b[sortConfigKugel.key];

                // Convert to numbers if possible
                if (!isNaN(aValue) && !isNaN(bValue)) {
                    aValue = parseFloat(aValue);
                    bValue = parseFloat(bValue);
                }

                if (aValue < bValue) {
                    return sortConfigKugel.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfigKugel.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [eisdielenKugel, sortConfigKugel]);

    const sortedEisdielenSofteis = React.useMemo(() => {
        let sortableItems = [...eisdielenSofteis];
        if (sortConfigSofteis.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfigSofteis.key];
                let bValue = b[sortConfigSofteis.key];

                // Convert to numbers if possible
                if (!isNaN(aValue) && !isNaN(bValue)) {
                    aValue = parseFloat(aValue);
                    bValue = parseFloat(bValue);
                }

                if (aValue < bValue) {
                    return sortConfigSofteis.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfigSofteis.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [eisdielenSofteis, sortConfigSofteis]);

    const sortedEisdielenEisbecher = React.useMemo(() => {
        let sortableItems = [...eisdielenEisbecher];
        if (sortConfigEisbecher.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfigEisbecher.key];
                let bValue = b[sortConfigEisbecher.key];

                // Convert to numbers if possible
                if (!isNaN(aValue) && !isNaN(bValue)) {
                    aValue = parseFloat(aValue);
                    bValue = parseFloat(bValue);
                }

                if (aValue < bValue) {
                    return sortConfigEisbecher.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfigEisbecher.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [eisdielenEisbecher, sortConfigEisbecher]);

    const toggleDetails = (index) => {
        setExpandedRow((prevIndex) => (prevIndex === index ? null : index));
    };

    // Add tabs for displaying Kugeleis-Rating and Softeis-Rating
    const [activeTab, setActiveTab] = useState('kugel');

    return (
        <>
            <Header />
            <Container>
                <TableContainer className="container">
                    <h2 className="text-center">🏆 Eisdielen-Ranking</h2>
                    <TabContainer>
                        <TabButton
                            active={activeTab === 'kugel'}
                            onClick={() => setActiveTab('kugel')}
                        >
                            Kugeleis
                        </TabButton>
                        <TabButton
                            active={activeTab === 'softeis'}
                            onClick={() => setActiveTab('softeis')}
                        >
                            Softeis
                        </TabButton>
                        <TabButton
                            active={activeTab === 'eisbecher'}
                            onClick={() => setActiveTab('eisbecher')}
                        >
                            Eisbecher
                        </TabButton>
                    </TabContainer>
                    {activeTab === 'kugel' && (<><Table>
                        <thead>
                            <tr>
                                <th>Eisdiele</th>
                                <th onClick={() => sortTableKugel('avg_geschmack')}>
                                    Geschmack {sortConfigKugel.key === 'avg_geschmack' ? (sortConfigKugel.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => sortTableKugel('avg_waffel')}>
                                    Waffel {sortConfigKugel.key === 'avg_waffel' ? (sortConfigKugel.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => sortTableKugel('kugel_preis_eur')}>
                                    Preis {sortConfigKugel.key === 'kugel_preis_eur' ? (sortConfigKugel.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => sortTableKugel('avg_preisleistung')}>
                                    Preis-Leistung {sortConfigKugel.key === 'avg_preisleistung' ? (sortConfigKugel.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => sortTableKugel('finaler_score')}>
                                    Rating {sortConfigKugel.key === 'finaler_score' ? (sortConfigKugel.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => sortTableKugel('avg_geschmacksfaktor')}>
                                    Faktor Geschmack {sortConfigKugel.key === 'avg_geschmacksfaktor' ? (sortConfigKugel.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => sortTableKugel('checkin_anzahl')}>
                                    Anzahl Bewertungen {sortConfigKugel.key === 'checkin_anzahl' ? (sortConfigKugel.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedEisdielenKugel.map((eisdiele, index) => (
                                <React.Fragment key={index}>
                                    <tr onClick={() => toggleDetails(index)}>
                                        <td style={{ textAlign: 'left' }}>{eisdiele.name}</td>
                                        <td style={sortConfigKugel.key === 'avg_geschmack' ? { fontWeight: 'bold' } : {}}>{eisdiele.avg_geschmack ? Number(eisdiele.avg_geschmack).toFixed(1) : "–"}</td>
                                        <td style={sortConfigKugel.key === 'avg_waffel' ? { fontWeight: 'bold' } : {}}>{eisdiele.avg_waffel ? Number(eisdiele.avg_waffel).toFixed(1) : "–"}</td>
                                        <td style={sortConfigKugel.key === 'preis' ? { fontWeight: 'bold' } : {}}>
                                            {eisdiele.kugel_preis_eur ? Number(eisdiele.kugel_preis_eur).toFixed(2) : "–"} €
                                            {eisdiele.kugel_waehrung !== "€" && eisdiele.kugel_preis ? " (" + Number(eisdiele.kugel_preis).toFixed(2) + " " + eisdiele.kugel_waehrung + ")" : ""}
                                        </td>
                                        <td style={sortConfigKugel.key === 'avg_preisleistung' ? { fontWeight: 'bold' } : {}}>{eisdiele.avg_preisleistung ? Number(eisdiele.avg_preisleistung).toFixed(2) : "–"}</td>
                                        <td style={sortConfigKugel.key === 'finaler_score' ? { fontWeight: 'bold' } : {}}>{eisdiele.finaler_score ? Number(eisdiele.finaler_score).toFixed(2) : "–"}</td>
                                        <td style={sortConfigKugel.key === 'avg_geschmacksfaktor' ? { fontWeight: 'bold' } : {}}>{eisdiele.avg_geschmacksfaktor ? Number(eisdiele.avg_geschmacksfaktor).toFixed(2) : "–"}</td>
                                        <td style={sortConfigKugel.key === 'checkin_anzahl' ? { fontWeight: 'bold' } : {}}>{eisdiele.checkin_anzahl} (von {eisdiele.nutzeranzahl} Nutzer/n)</td>
                                    </tr>
                                    <DetailsRow visible={expandedRow === index} className="details-row">
                                        <td colSpan="9">
                                            <DetailsContainer>

                                                <h3><CleanLink to={`/map/activeShop/${eisdiele.eisdiele_id}`}>{eisdiele.name}</CleanLink></h3>
                                                <strong>Adresse: </strong>{eisdiele.adresse}<br />
                                                <strong>Öffnungszeiten: </strong><br />{eisdiele.openingHours.split(';').map((time, i) => (
                                                    <React.Fragment key={i}>
                                                        {time}<br />
                                                    </React.Fragment>
                                                ))}
                                            </DetailsContainer>
                                        </td>
                                    </DetailsRow>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </Table>
                        <Explanation>
                            <h1>Erklärung zum Ranking</h1>
                            <LeftAlign>
                                <ScoreExplanation>
                                    <h2>Wie wird das Rating für Kugeleis berechnet?</h2>

                                    <h3>1. Einzelbewertung je Check-in</h3>
                                    <p>
                                        Für jeden Check-in für Kugeleis wird ein Score berechnet:<br />
                                        Dieser Score setzt sich aus zwei Faktoren zusammen:
                                        <ul>
                                            <li>
                                                <strong>Geschmacksfaktor:</strong> Der Geschmack zählt viermal so viel wie die Waffel. Wenn keine Waffel bewertet wurde, zählt nur der Geschmack.
                                            </li>
                                            <li>
                                                <strong>Preis-Leistungs-Faktor:</strong> Seit dem <code>27.08.2025</code> wird dieser Wert direkt vom Nutzer vergeben und liegt zwischen <code>1.0</code> und <code>5.0</code>.
                                                <br />
                                                Zuvor wurde der Preis-Leistungs-Faktor automatisch aus der Kugelgröße im Verhältnis zum Preis berechnet.
                                                Eine Kugel mit Größe <code>5.0</code> bei einem Preis von <code>1,50 €</code> ergab beispielsweise den Wert <code>5.0</code>.
                                                Dabei konnten bei großen Kugeln und Preisen unter 1,50 € Werte von über 5 entstehen, während bei sehr kleinen Kugeln und Preisen über 1,50 € Werte unter 1 möglich waren.
                                            </li>
                                            <li>
                                                <strong>Finaler Score:</strong> Geschmack (70 %) + Preis-Leistung (30 %), gewichtet zu einem Gesamtwert zwischen ca. <code>1.0</code> und <code>5.0</code>.
                                            </li>
                                        </ul>
                                    </p>


                                    <h3>2. Durchschnitt je Nutzer &amp; Gewichtung</h3>
                                    <p>
                                        Je Nutzer und Eisdiele wird ein Durchschnitt aller Scores berechnet. Aktive Nutzer erhalten ein höheres Gewicht:
                                    </p>
                                    <ul>
                                        <li><strong>gewicht:</strong> <code>√(Anzahl Check-ins des Nutzers)</code></li>
                                        <li><strong>gewichteter Score: </strong> <code>durchschnittlicher Score × gewicht</code></li>
                                    </ul>
                                    <p>
                                        Dadurch zählt eine einzelne Bewertung weniger als mehrere – aber mit abnehmendem Einfluss.
                                    </p>

                                    <h3>3. Finale Bewertung je Eisdiele</h3>
                                    <p>
                                        Die gewichteten Scores aller Nutzer für eine Eisdiele werden gemittelt:
                                    </p>
                                    <ul>
                                        <li><strong>Rating: </strong><code>Summe aller gewichteter Scores / Summe aller Gewichte</code></li>
                                    </ul>

                                    <h3>Beispiel:</h3>
                                    <ul>
                                        <li>Nutzer A: 1 Check-in, Score 4,5 → Gewicht: √1 = 1 → Beitrag: 4,5</li>
                                        <li>Nutzer B: 4 Check-ins, Ø Score 4,0 → Gewicht: √4 = 2 → Beitrag: 8,0</li>
                                    </ul>
                                    <p>
                                        <strong>Finaler Score:</strong> (4,5 + 8,0) / (1 + 2) = <strong>4,17</strong>
                                    </p>
                                </ScoreExplanation>
                            </LeftAlign>
                        </Explanation></>)}
                    {activeTab === 'softeis' && (<>
                        <Table>
                            <thead>
                                <tr>
                                    <th>Eisdiele</th>
                                    <th onClick={() => sortTableSofteis('avg_geschmack')}>
                                        Geschmack {sortConfigSofteis.key === 'avg_geschmack' ? (sortConfigSofteis.direction === 'ascending' ? '▲' : '▼') : ''}
                                    </th>
                                    <th onClick={() => sortTableKugel('avg_waffel')}>
                                        Waffel {sortConfigSofteis.key === 'avg_waffel' ? (sortConfigSofteis.direction === 'ascending' ? '▲' : '▼') : ''}
                                    </th>
                                    <th onClick={() => sortTableSofteis('avg_preisleistung')}>
                                        Preis-Leistung {sortConfigSofteis.key === 'avg_preisleistung' ? (sortConfigSofteis.direction === 'ascending' ? '▲' : '▼') : ''}
                                    </th>
                                    <th onClick={() => sortTableSofteis('finaler_softeis_score')}>
                                        Rating {sortConfigSofteis.key === 'finaler_softeis_score' ? (sortConfigSofteis.direction === 'ascending' ? '▲' : '▼') : ''}
                                    </th>
                                    <th onClick={() => sortTableSofteis('finaler_geschmacksfaktor')}>
                                        Geschmacksfaktor {sortConfigSofteis.key === 'finaler_geschmacksfaktor' ? (sortConfigSofteis.direction === 'ascending' ? '▲' : '▼') : ''}
                                    </th>
                                    <th onClick={() => sortTableSofteis('checkin_anzahl')}>
                                        Anzahl Bewertungen {sortConfigSofteis.key === 'checkin_anzahl' ? (sortConfigSofteis.direction === 'ascending' ? '▲' : '▼') : ''}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedEisdielenSofteis.map((eisdiele, index) => (
                                    <React.Fragment key={index}>
                                        <tr onClick={() => toggleDetails(`softeis-${index}`)}>
                                            <td style={{ textAlign: 'left' }}>{eisdiele.name}</td>
                                            <td style={sortConfigSofteis.key === 'avg_geschmack' ? { fontWeight: 'bold' } : {}}>
                                                {eisdiele.avg_geschmack ? eisdiele.avg_geschmack.toFixed(1) : '-'}
                                            </td>
                                            <td style={sortConfigSofteis.key === 'avg_waffel' ? { fontWeight: 'bold' } : {}}>
                                                {eisdiele.avg_waffel ? eisdiele.avg_waffel.toFixed(1) : '-'}
                                            </td>
                                            <td style={sortConfigSofteis.key === 'avg_preisleistung' ? { fontWeight: 'bold' } : {}}>
                                                {eisdiele.avg_preisleistung ? eisdiele.avg_preisleistung.toFixed(1) : '-'}
                                            </td>
                                            <td style={sortConfigSofteis.key === 'finaler_softeis_score' ? { fontWeight: 'bold' } : {}}>
                                                {eisdiele.finaler_softeis_score ? eisdiele.finaler_softeis_score.toFixed(2) : '-'}
                                            </td>
                                            <td style={sortConfigSofteis.key === 'finaler_geschmacksfaktor' ? { fontWeight: 'bold' } : {}}>
                                                {eisdiele.finaler_geschmacksfaktor ? eisdiele.finaler_geschmacksfaktor.toFixed(2) : '-'}
                                            </td>
                                            <td style={sortConfigSofteis.key === 'checkin_anzahl' ? { fontWeight: 'bold' } : {}}>
                                                {eisdiele.checkin_anzahl} (von {eisdiele.anzahl_nutzer} Nutzer/n))
                                            </td>
                                        </tr>
                                        <DetailsRow visible={expandedRow === `softeis-${index}`} className="details-row">
                                            <td colSpan="7">
                                                <DetailsContainer>
                                                    <h3><CleanLink to={`/map/activeShop/${eisdiele.eisdiele_id}`}>{eisdiele.name}</CleanLink></h3>
                                                    <strong>Adresse: </strong>{eisdiele.adresse}<br />
                                                    <strong>Öffnungszeiten: </strong><br />{eisdiele.openingHours?.split(';').map((time, i) => (
                                                        <React.Fragment key={i}>
                                                            {time}<br />
                                                        </React.Fragment>
                                                    ))}
                                                </DetailsContainer>
                                            </td>
                                        </DetailsRow>
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </Table>
                        <Explanation>
                            <h1>Erklärung zum Ranking</h1>
                            <LeftAlign>
                                <ScoreExplanation>
                                    <h2>Wie wird das Rating für Softeis berechnet?</h2>

                                    <h3>1. Einzelbewertung je Check-in</h3>
                                    <p>
                                        Für jeden Check-in für Softeis wird ein Score berechnet:<br />
                                        Dieser Score setzt sich aus zwei Faktoren zusammen:
                                        <ul>
                                            <li>
                                                <strong>Geschmacksfaktor:</strong> Der Geschmack zählt viermal so viel wie die Waffel. Wenn keine Waffel bewertet wurde, zählt nur der Geschmack.
                                            </li>
                                            <li>
                                                <strong>Preis-Leistungs-Faktor:</strong> Wird direkt durch den Nutzer als Wert zwischen <code>1.0</code> und <code>5.0</code> bewertet.
                                            </li>
                                            <li>
                                                <strong>Finaler Score:</strong> Geschmack (70 %) + Preis-Leistung (30 %), gewichtet zu einem Gesamtwert zwischen ca. <code>1.0</code> und <code>5.0</code>.
                                            </li>
                                        </ul>
                                    </p>


                                    <h3>2. Durchschnitt je Nutzer &amp; Gewichtung</h3>
                                    <p>
                                        Je Nutzer und Eisdiele wird ein Durchschnitt aller Scores berechnet. Aktive Nutzer erhalten ein höheres Gewicht:
                                    </p>
                                    <ul>
                                        <li><strong>gewicht:</strong> <code>√(Anzahl Check-ins des Nutzers)</code></li>
                                        <li><strong>gewichteter Score: </strong> <code>durchschnittlicher Score × gewicht</code></li>
                                    </ul>
                                    <p>
                                        Dadurch zählt eine einzelne Bewertung weniger als mehrere – aber mit abnehmendem Einfluss.
                                    </p>

                                    <h3>3. Finale Bewertung je Eisdiele</h3>
                                    <p>
                                        Die gewichteten Scores aller Nutzer für eine Eisdiele werden gemittelt:
                                    </p>
                                    <ul>
                                        <li><strong>Rating: </strong><code>Summe aller gewichteter Scores / Summe aller Gewichte</code></li>
                                    </ul>


                                    <h3>Beispiel:</h3>
                                    <ul>
                                        <li>Nutzer A: 1 Check-in, Score 4,5 → Gewicht: √1 = 1 → Beitrag: 4,5</li>
                                        <li>Nutzer B: 4 Check-ins, Ø Score 4,0 → Gewicht: √4 = 2 → Beitrag: 8,0</li>
                                    </ul>
                                    <p>
                                        <strong>Finaler Score:</strong> (4,5 + 8,0) / (1 + 2) = <strong>4,17</strong>
                                    </p>
                                </ScoreExplanation>
                            </LeftAlign>
                        </Explanation></>
                    )}
                    {activeTab === 'eisbecher' && (<>
                        <Table>
                            <thead>
                                <tr>
                                    <th>Eisdiele</th>
                                    <th onClick={() => sortTableEisbecher('avg_geschmack')}>
                                        Geschmack {sortConfigEisbecher.key === 'avg_geschmack' ? (sortConfigEisbecher.direction === 'ascending' ? '▲' : '▼') : ''}
                                    </th>
                                    <th onClick={() => sortTableEisbecher('avg_preisleistung')}>
                                        Preis-Leistung {sortConfigEisbecher.key === 'avg_preisleistung' ? (sortConfigEisbecher.direction === 'ascending' ? '▲' : '▼') : ''}
                                    </th>
                                    <th onClick={() => sortTableEisbecher('finaler_eisbecher_score')}>
                                        Rating {sortConfigEisbecher.key === 'finaler_eisbecher_score' ? (sortConfigEisbecher.direction === 'ascending' ? '▲' : '▼') : ''}
                                    </th>
                                    <th onClick={() => sortTableEisbecher('checkin_anzahl')}>
                                        Anzahl Bewertungen {sortConfigEisbecher.key === 'checkin_anzahl' ? (sortConfigEisbecher.direction === 'ascending' ? '▲' : '▼') : ''}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedEisdielenEisbecher.map((eisdiele, index) => (
                                    <React.Fragment key={index}>
                                        <tr onClick={() => toggleDetails(`softeis-${index}`)}>
                                            <td style={{ textAlign: 'left' }}>{eisdiele.name}</td>
                                            <td style={sortConfigEisbecher.key === 'avg_geschmack' ? { fontWeight: 'bold' } : {}}>
                                                {eisdiele.avg_geschmack.toFixed(1)}
                                            </td>
                                            <td style={sortConfigEisbecher.key === 'avg_preisleistung' ? { fontWeight: 'bold' } : {}}>
                                                {eisdiele.avg_preisleistung.toFixed(1)}
                                            </td>
                                            <td style={sortConfigEisbecher.key === 'finaler_eisbecher_score' ? { fontWeight: 'bold' } : {}}>
                                                {eisdiele.finaler_eisbecher_score.toFixed(2)}
                                            </td>
                                            <td style={sortConfigEisbecher.key === 'checkin_anzahl' ? { fontWeight: 'bold' } : {}}>
                                                {eisdiele.checkin_anzahl} (von {eisdiele.anzahl_nutzer} Nutzer/n))
                                            </td>
                                        </tr>
                                        <DetailsRow visible={expandedRow === `softeis-${index}`} className="details-row">
                                            <td colSpan="5">
                                                <DetailsContainer>
                                                    <h3><CleanLink to={`/map/activeShop/${eisdiele.eisdiele_id}`}>{eisdiele.name}</CleanLink></h3>
                                                    <strong>Adresse: </strong>{eisdiele.adresse}<br />
                                                    <strong>Öffnungszeiten: </strong><br />{eisdiele.openingHours?.split(';').map((time, i) => (
                                                        <React.Fragment key={i}>
                                                            {time}<br />
                                                        </React.Fragment>
                                                    ))}
                                                </DetailsContainer>
                                            </td>
                                        </DetailsRow>
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </Table>
                        <Explanation>
                            <h1>Erklärung zum Ranking</h1>
                            <LeftAlign>
                                <ScoreExplanation>
                                    <h2>Wie wird der <em>finale Eisbecher-Score</em> berechnet?</h2>

                                    <h3>1. Einzelbewertung je Check-in</h3>
                                    <p>
                                        Für jeden Check-in wird ein Score berechnet:<br />
                                        <ul>
                                            <li>
                                                <strong>Score: </strong><code> Geschmack * 0,7 + Preis-Leistung * 0,3</code><br />
                                            </li>
                                        </ul>
                                    </p>

                                    <h3>2. Durchschnitt je Nutzer &amp; Gewichtung</h3>
                                    <p>
                                        Je Nutzer und Eisdiele wird ein Durchschnitt aller Scores berechnet. Aktive Nutzer erhalten ein höheres Gewicht:
                                    </p>
                                    <ul>
                                        <li><strong>gewicht:</strong> <code>√(Anzahl Check-ins des Nutzers)</code></li>
                                        <li><strong>gewichteter Score: </strong> <code>durchschnittlicher Score × gewicht</code></li>
                                    </ul>
                                    <p>
                                        Dadurch zählt eine einzelne Bewertung weniger als mehrere – aber mit abnehmendem Einfluss.
                                    </p>

                                    <h3>3. Finale Bewertung je Eisdiele</h3>
                                    <p>
                                        Die gewichteten Scores aller Nutzer für eine Eisdiele werden gemittelt:
                                    </p>
                                    <ul>
                                        <li><strong>Rating: </strong><code>Summe aller gewichteter Scores / Summe aller Gewichte</code></li>
                                    </ul>


                                    <h3>Beispiel:</h3>
                                    <ul>
                                        <li>Nutzer A: 1 Check-in, Score 4,5 → Gewicht: √1 = 1 → Beitrag: 4,5</li>
                                        <li>Nutzer B: 4 Check-ins, Ø Score 4,0 → Gewicht: √4 = 2 → Beitrag: 8,0</li>
                                    </ul>
                                    <p>
                                        <strong>Finaler Score:</strong> (4,5 + 8,0) / (1 + 2) = <strong>4,17</strong>
                                    </p>
                                </ScoreExplanation>
                            </LeftAlign>
                        </Explanation></>
                    )}

                </TableContainer>
            </Container>
        </>
    );
};

export default Ranking;

const CleanLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`;

const Container = styled.div`
  padding: 1rem;
  background-color: white;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: center;
`;

const TableContainer = styled.div`
  justify-content: center;
  overflow-x: auto;
  text-align: center;
`;

const LeftAlign = styled.p`
  text-align: left;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  th, td {
    border: 1px solid #ddd;
    padding: 8px;
  }
  th {
    cursor: pointer;
    background-color: #f2f2f2;
  }
  tr {
    cursor: pointer;
  }
`;
const Explanation = styled.div`
  margin-top: 2rem;
  text-align: center;
  h4 {
    margin-bottom: 1rem;
  }
  p {
    line-height: 1.6;
  }
  img {
    display: block;
    margin: 1rem auto;
  }
`;

const DetailsRow = styled.tr`
  display: ${(props) => (props.visible ? 'table-row' : 'none')};
`;

const DetailsContainer = styled.div`
  text-align: left;
  background-color: #e9f5ff;
  border: 1px solid #b3d9ff;
  border-radius: 4px;
  padding: 1rem;
  h3 {
    margin-top: 0;
  }
  strong {
    font-weight: bold;
  }
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`;

const TabButton = styled.button`
  padding: 0.5rem 1rem;
  margin: 0 0.5rem;
  background-color: ${(props) => (props.active ? '#0077b6' : '#f0f0f0')};
  color: ${(props) => (props.active ? 'white' : '#333')};
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;

  &:hover {
    background-color: ${(props) => (props.active ? '#005f8a' : '#e0e0e0')};
  }
`;

const ScoreExplanation = styled.div`
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  line-height: 1.6;
  font-size: 1rem;
  color: #333;

  h3 {
    margin-top: 0;
    font-size: 1.25rem;
    color: #444;
  }

  ul {
    padding-left: 1.2rem;
    list-style-type: "🍧​ ";
  }

  strong {
    color: #222;
  }

  code {
    background: #efefef;
    padding: 0.1rem 0.3rem;
    border-radius: 4px;
    font-size: 0.95rem;
  }
`;