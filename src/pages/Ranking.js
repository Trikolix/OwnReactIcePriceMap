import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Header from "../Header";
import { Link } from "react-router-dom";

const Ranking = () => {
    const [EisdielenKugel, setEisdielenKugel] = useState([]);
    const [EisdielenSofteis, setEisdielenSofteis] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'PLV', direction: 'descending' });
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

    const sortTable = (key) => {
        let direction = 'descending';
        if (sortConfig.key === key && sortConfig.direction === 'descending') {
            direction = 'ascending';
        }
        setSortConfig({ key, direction });
    };

    const sortedEisdielenKugel = React.useMemo(() => {
        let sortableItems = [...EisdielenKugel];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Convert to numbers if possible
                if (!isNaN(aValue) && !isNaN(bValue)) {
                    aValue = parseFloat(aValue);
                    bValue = parseFloat(bValue);
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [EisdielenKugel, sortConfig]);

    const toggleDetails = (index) => {
        setExpandedRow((prevIndex) => (prevIndex === index ? null : index));
    };

    return (
        <>
            <Header />
            <Container>
                <TableContainer className="container">
                    <h2 className="text-center">🏆 Eisdielen-Ranking</h2>
                    <Table>
                        <thead>
                            <tr>
                                <th>Eisdiele</th>
                                <th onClick={() => sortTable('avg_geschmack')}>
                                    Geschmack {sortConfig.key === 'avg_geschmack' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => sortTable('avg_kugelgroesse')}>
                                    Größe {sortConfig.key === 'avg_kugelgroesse' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => sortTable('avg_waffel')}>
                                    Waffel {sortConfig.key === 'avg_waffel' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => sortTable('avg_auswahl')}>
                                    Anzahl Sorten {sortConfig.key === 'avg_auswahl' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => sortTable('aktueller_preis')}>
                                    Preis (€) {sortConfig.key === 'aktueller_preis' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => sortTable('PLV')}>
                                    Rating {sortConfig.key === 'PLV' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => sortTable('geschmacks_faktor')}>
                                    Faktor Geschmack {sortConfig.key === 'geschmacks_faktor' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => sortTable('preisleistungs_faktor')}>
                                    Faktor Preis-Leistung {sortConfig.key === 'preisleistungs_faktor' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedEisdielenKugel.map((eisdiele, index) => (
                                <React.Fragment key={index}>
                                    <tr onClick={() => toggleDetails(index)}>
                                        <td style={{ textAlign: 'left' }}>{eisdiele.eisdielen_name}</td>
                                        <td style={sortConfig.key === 'avg_geschmack' ? { fontWeight: 'bold' } : {}}>{eisdiele.avg_geschmack ? Number(eisdiele.avg_geschmack).toFixed(1) : "–"}</td>
                                        <td style={sortConfig.key === 'avg_kugelgroesse' ? { fontWeight: 'bold' } : {}}>{eisdiele.avg_kugelgroesse ? Number(eisdiele.avg_kugelgroesse).toFixed(1) : "–"}</td>
                                        <td style={sortConfig.key === 'avg_waffel' ? { fontWeight: 'bold' } : {}}>{eisdiele.avg_waffel ? Number(eisdiele.avg_waffel).toFixed(1) : "–"}</td>
                                        <td style={sortConfig.key === 'avg_auswahl' ? { fontWeight: 'bold' } : {}}>{eisdiele.avg_auswahl ? Number(eisdiele.avg_auswahl).toFixed(0) : "–"}</td>
                                        <td style={sortConfig.key === 'aktueller_preis' ? { fontWeight: 'bold' } : {}}>{eisdiele.aktueller_preis ? Number(eisdiele.aktueller_preis).toFixed(2) : "–"} €</td>
                                        <td style={sortConfig.key === 'PLV' ? { fontWeight: 'bold' } : {}}>{eisdiele.PLV ? Number(eisdiele.PLV).toFixed(2) : "–"}</td>
                                        <td style={sortConfig.key === 'geschmacks_faktor' ? { fontWeight: 'bold' } : {}}>{eisdiele.geschmacks_faktor ? Number(eisdiele.geschmacks_faktor).toFixed(2) : "–"}</td>
                                        <td style={sortConfig.key === 'preisleistungs_faktor' ? { fontWeight: 'bold' } : {}}>{eisdiele.preisleistungs_faktor ? Number(eisdiele.preisleistungs_faktor).toFixed(2) : "–"}</td>
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
                    </Explanation>

                    <h2 className="text-center">🍦 Softeis-Ranking</h2>
                    <Table>
                        <thead>
                            <tr>
                                <th>Eisdiele</th>
                                <th>Gesamtwertung</th>
                                <th>Geschmack</th>
                                <th>Waffel</th>
                                <th>Preis-Leistung</th>
                            </tr>
                        </thead>
                        <tbody>
                            {EisdielenSofteis.map((eisdiele, index) => (
                                <tr key={`softeis-${index}`}>
                                    <td style={{ textAlign: 'left' }}>
                                        <CleanLink to={`/map/activeShop/${eisdiele.eisdiele_id}`}>
                                            {eisdiele.name}
                                        </CleanLink>
                                    </td>
                                    <td>{eisdiele.finaler_softeis_score.toFixed(2)}</td>
                                    <td>{eisdiele.avg_geschmack.toFixed(1)}</td>
                                    <td>{eisdiele.avg_waffel.toFixed(1)}</td>
                                    <td>{eisdiele.avg_preisleistung.toFixed(1)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
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