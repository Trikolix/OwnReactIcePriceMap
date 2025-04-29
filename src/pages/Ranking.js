import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Header from "../Header";
import { Link } from "react-router-dom";

const Ranking = () => {
    const [eisdielen, setEisdielen] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'PLV', direction: 'descending' });
    const [expandedRow, setExpandedRow] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('https://ice-app.de/backend/get_eisdielen_preisleistung.php');
                const data = await response.json();
                setEisdielen(data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    const sortTable = (key) => {
        let direction = 'descending';
        if (sortConfig.key === key && sortConfig.direction === 'descending') {
            direction = 'ascending';
        }
        setSortConfig({ key, direction });
    };

    const sortedEisdielen = React.useMemo(() => {
        let sortableItems = [...eisdielen];
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
    }, [eisdielen, sortConfig]);

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
                            {sortedEisdielen.map((eisdiele, index) => (
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
                        <p>
                            Die Preis-Leistungsverhältnis wird nach folgender Formel berechnet. Der Geschmack hat dabei eine Gewichtung
                            von 3, die Kugelgröße eine Wichtung von 2 und die Waffel eine Wichtung von 1.
                            Das ganze wird noch mit dem Verhältnis zur günstigsten Eisdiele multipliziert. Für eine perfekte 5.0
                            Bewertung bräuchte es also durchschnittlich 5.0 Bewertungen in allen Kategorien
                            und es müsste zeitgleich die günstigste Eisdiele in der ganzen Datenbank sein.<br /><br />
                            G - Ø Bewertung des Geschmacks<br />
                            K - Ø Bewertung der Kugelgröße<br />
                            W - Ø Bewertung der Eiswaffel<br />
                            P - Preis pro Kugel in €<br />
                            Pmin - Preis der günstigsten Eisdiele in €<br />
                            <img src={require('./plv-formel_neu.png')} alt='PLV Formel' />
                        </p>
                    </Explanation>
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