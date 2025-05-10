import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Header from "../Header";
import { Link } from "react-router-dom";

const Ranking = () => {
    const [eisdielenKugel, setEisdielenKugel] = useState([]);
    const [eisdielenSofteis, setEisdielenSofteis] = useState([]);
    const [sortConfigKugel, setSortConfigKugel] = useState({ key: 'PLV', direction: 'descending' });
    const [sortConfigSofteis, setSortConfigSofteis] = useState({ key: 'rating', direction: 'descending' });
    const [expandedRow, setExpandedRow] = useState(null);
    const apiUrl = process.env.REACT_APP_API_BASE_URL;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${apiUrl}/get_eisdielen_preisleistung.php`);
                const data = await response.json();
                setEisdielenKugel(data);
                const response2 = await fetch(`${apiUrl}/get_softeis_rating.php`);
                const data2 = await response2.json();
                setEisdielenSofteis(data2);
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
                    </TabContainer>
                    {activeTab === 'kugel' && (<><Table>
                        <thead>
                            <tr>
                                <th>Eisdiele</th>
                                <th onClick={() => sortTableKugel('avg_geschmack')}>
                                    Geschmack {sortConfigKugel.key === 'avg_geschmack' ? (sortConfigKugel.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => sortTableKugel('avg_kugelgroesse')}>
                                    Größe {sortConfigKugel.key === 'avg_kugelgroesse' ? (sortConfigKugel.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => sortTableKugel('avg_waffel')}>
                                    Waffel {sortConfigKugel.key === 'avg_waffel' ? (sortConfigKugel.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => sortTableKugel('avg_auswahl')}>
                                    Anzahl Sorten {sortConfigKugel.key === 'avg_auswahl' ? (sortConfigKugel.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => sortTableKugel('aktueller_preis')}>
                                    Preis (€) {sortConfigKugel.key === 'aktueller_preis' ? (sortConfigKugel.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => sortTableKugel('PLV')}>
                                    Rating {sortConfigKugel.key === 'PLV' ? (sortConfigKugel.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => sortTableKugel('geschmacks_faktor')}>
                                    Faktor Geschmack {sortConfigKugel.key === 'geschmacks_faktor' ? (sortConfigKugel.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => sortTableKugel('preisleistungs_faktor')}>
                                    Faktor Preis-Leistung {sortConfigKugel.key === 'preisleistungs_faktor' ? (sortConfigKugel.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedEisdielenKugel.map((eisdiele, index) => (
                                <React.Fragment key={index}>
                                    <tr onClick={() => toggleDetails(index)}>
                                        <td style={{ textAlign: 'left' }}>{eisdiele.eisdielen_name}</td>
                                        <td style={sortConfigKugel.key === 'avg_geschmack' ? { fontWeight: 'bold' } : {}}>{eisdiele.avg_geschmack ? Number(eisdiele.avg_geschmack).toFixed(1) : "–"}</td>
                                        <td style={sortConfigKugel.key === 'avg_kugelgroesse' ? { fontWeight: 'bold' } : {}}>{eisdiele.avg_kugelgroesse ? Number(eisdiele.avg_kugelgroesse).toFixed(1) : "–"}</td>
                                        <td style={sortConfigKugel.key === 'avg_waffel' ? { fontWeight: 'bold' } : {}}>{eisdiele.avg_waffel ? Number(eisdiele.avg_waffel).toFixed(1) : "–"}</td>
                                        <td style={sortConfigKugel.key === 'avg_auswahl' ? { fontWeight: 'bold' } : {}}>{eisdiele.avg_auswahl ? Number(eisdiele.avg_auswahl).toFixed(0) : "–"}</td>
                                        <td style={sortConfigKugel.key === 'aktueller_preis' ? { fontWeight: 'bold' } : {}}>{eisdiele.aktueller_preis ? Number(eisdiele.aktueller_preis).toFixed(2) : "–"} €</td>
                                        <td style={sortConfigKugel.key === 'PLV' ? { fontWeight: 'bold' } : {}}>{eisdiele.PLV ? Number(eisdiele.PLV).toFixed(2) : "–"}</td>
                                        <td style={sortConfigKugel.key === 'geschmacks_faktor' ? { fontWeight: 'bold' } : {}}>{eisdiele.geschmacks_faktor ? Number(eisdiele.geschmacks_faktor).toFixed(2) : "–"}</td>
                                        <td style={sortConfigKugel.key === 'preisleistungs_faktor' ? { fontWeight: 'bold' } : {}}>{eisdiele.preisleistungs_faktor ? Number(eisdiele.preisleistungs_faktor).toFixed(2) : "–"}</td>
                                    </tr>
                                    <DetailsRow visible={expandedRow === index} className="details-row">
                                        <td colSpan="9">
                                            <DetailsContainer>

                                                <h3><CleanLink to={`/map/activeShop/${eisdiele.eisdielen_id}`}>{eisdiele.eisdielen_name}</CleanLink></h3>
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
                            <h4>Erklärung zum Ranking</h4>
                            <LeftAlign>
                                <p>Die Preis-Leistungsverhältnis wird nach folgender Formel berechnet:</p>
                                <p>Es gibt einen <strong>Geschmacks-Faktor</strong> welcher sich aus Geschmack und Waffel zusammen setzt.
                                    Der Geschmack des Eises hat dabei eine 4 mal größere Gewichtung als die Waffel.</p>
                                <p>Als zweites gibt es einen <strong>Preisleistungs-Faktor</strong>, welcher das Verhältnis von Kugel zu Preis wieder spiegelt.<br />
                                    Der Wert ergibt 1, wenn eine Kugel die Größenbewertung von 5.0 bei einem Preis von 1,50€ bekommt.<br />
                                    Es ist also möglich, dass eine Eisdiele einen Preis-Leistungsfakto größer 1 hat, wenn sie sehr große Kugeln für unter 1,50€ anbietet.</p>
                                <p>Der Geschmacksfaktor und der Preis/Leistungsfaktor werden gewichtet miteinander mulitpliziert,
                                    wobei <strong>Geschmack mit 70%</strong> gewichtet wird und  <strong>Preis-Leistung mit 30%.</strong></p>
                                G - Ø Bewertung des Geschmacks<br />
                                K - Ø Bewertung der Kugelgröße<br />
                                W - Ø Bewertung der Eiswaffel<br />
                                P - Preis pro Kugel in €<br />
                                <img src={require('./plv-formel_neu.png')} alt='PLV Formel' />
                            </LeftAlign>
                        </Explanation></>)}
                    {activeTab === 'softeis' && (<>
                        <Table>
                            <thead>
                                <tr>
                                    <th>Eisdiele</th>
                                    <th onClick={() => sortTableSofteis('finaler_softeis_score')}>
                                        Gesamtwertung {sortConfigSofteis.key === 'finaler_softeis_score' ? (sortConfigSofteis.direction === 'ascending' ? '▲' : '▼') : ''}
                                    </th>
                                    <th onClick={() => sortTableSofteis('avg_geschmack')}>
                                        Geschmack {sortConfigSofteis.key === 'avg_geschmack' ? (sortConfigSofteis.direction === 'ascending' ? '▲' : '▼') : ''}
                                    </th>
                                    <th onClick={() => sortTableSofteis('avg_waffel')}>
                                        Waffel {sortConfigSofteis.key === 'avg_waffel' ? (sortConfigSofteis.direction === 'ascending' ? '▲' : '▼') : ''}
                                    </th>
                                    <th onClick={() => sortTableSofteis('avg_preisleistung')}>
                                        Preis-Leistung {sortConfigSofteis.key === 'avg_preisleistung' ? (sortConfigSofteis.direction === 'ascending' ? '▲' : '▼') : ''}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedEisdielenSofteis.map((eisdiele, index) => (
                                    <React.Fragment key={index}>
                                        <tr onClick={() => toggleDetails(`softeis-${index}`)}>
                                            <td style={{ textAlign: 'left' }}>{eisdiele.name}</td>
                                            <td style={sortConfigSofteis.key === 'finaler_softeis_score' ? { fontWeight: 'bold' } : {}}>
                                                {eisdiele.finaler_softeis_score.toFixed(2)}
                                            </td>
                                            <td style={sortConfigSofteis.key === 'avg_geschmack' ? { fontWeight: 'bold' } : {}}>
                                                {eisdiele.avg_geschmack.toFixed(1)}
                                            </td>
                                            <td style={sortConfigSofteis.key === 'avg_waffel' ? { fontWeight: 'bold' } : {}}>
                                                {eisdiele.avg_waffel.toFixed(1)}
                                            </td>
                                            <td style={sortConfigSofteis.key === 'avg_preisleistung' ? { fontWeight: 'bold' } : {}}>
                                                {eisdiele.avg_preisleistung.toFixed(1)}
                                            </td>
                                        </tr>
                                        <DetailsRow visible={expandedRow === `softeis-${index}`} className="details-row">
                                            <td colSpan="5">
                                                <DetailsContainer>
                                                    <h3><CleanLink to={`/map/activeShop/${eisdiele.eisdielen_id}`}>{eisdiele.name}</CleanLink></h3>
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
                        <h4>Erklärung zum Ranking</h4>
                        <LeftAlign>
                            <h2>Wie wird der <em>finale Softeis-Score</em> berechnet?</h2>

                            <h3>1. Einzelbewertung je Check-in</h3>
                            <p>
                                Für jeden Check-in mit vollständiger Bewertung (Geschmack, Waffel, Preis-Leistung) wird ein Score berechnet:
                            </p>
                                <img src={require('./softeis_formel.png')} alt='Formel Softeis Ranking' />
                            
                            <p>
                                Dieser Score liegt immer zwischen <strong>1,0</strong> und <strong>5,0</strong>.<br />
                                Wie auch beim Kugeleis-Ranking, wird der <strong>Geschmack mit 70%</strong> gewichtet,<br />
                                wobei innerhalb des Geschmacksfaktors der <strong>Eisgeschmack 4 mal mehr Gewicht als der<br />
                                Waffelgeschmack</strong> hat.<br />
                                Der <strong>Preis-Leistungsfaktor wird mit 30%</strong> gewichtet.
                            </p>

                            <h3>2. Durchschnitt je Nutzer &amp; Gewichtung</h3>
                            <p>
                                Je Nutzer und Eisdiele wird ein Durchschnitt aller Scores berechnet. Aktive Nutzer erhalten ein höheres Gewicht:
                            </p>
                            <ul>
                                <li><code>gewicht = √(Anzahl Check-ins des Nutzers)</code></li>
                                <li><code>gewichteter_score = durchschnittlicher Score × gewicht</code></li>
                            </ul>
                            <p>
                                Dadurch zählt eine einzelne Bewertung weniger als mehrere – aber mit abnehmendem Einfluss.
                            </p>

                            <h3>3. Finale Bewertung je Eisdiele</h3>
                            <p>
                                Die gewichteten Scores aller Nutzer für eine Eisdiele werden gemittelt:
                            </p>
                            <pre><code>
                                finaler_softeis_score =
                                Summe aller gewichteter Scores /
                                Summe aller Gewichte
                            </code></pre>
                            <p>
                                Das ergibt eine faire und vergleichbare Endbewertung zwischen 1,0 und 5,0.
                            </p>

                            <h3>Beispiel:</h3>
                            <ul>
                                <li>Nutzer A: 1 Check-in, Score 4,5 → Gewicht: √1 = 1 → Beitrag: 4,5</li>
                                <li>Nutzer B: 4 Check-ins, Ø Score 4,0 → Gewicht: √4 = 2 → Beitrag: 8,0</li>
                            </ul>
                            <p>
                                <strong>Finaler Score:</strong> (4,5 + 8,0) / (1 + 2) = <strong>4,17</strong>
                            </p>
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

const TabContent = styled.div`
  margin-top: 1rem;
`;