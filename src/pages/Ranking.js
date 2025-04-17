// React + Express + Axios Version des Eisdielen-Rankings
// Diese Datei stellt das Frontend dar. Backend (Express + DB) folgt bei Bedarf separat.

import React, { useEffect, useState } from 'react';

function Ranking() {
    const [eisdielen, setEisdielen] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'PLV', direction: 'descending' });
    const [openDetails, setOpenDetails] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const query = `https://ice-app.4lima.de/backend/get_ranking.php`;
                const response = await fetch(query);
                const data = await response.json();
                console.log(data);
                setEisdielen(data);
            } catch (error) {
                console.error('Fehler beim Abrufen der Eisdielen:', error);
            }
        }
        fetchData();
    }, []);

    const sortedData = [...eisdielen].sort((a, b) => {
        const { key, direction } = sortConfig;
        const valueA = typeof a[key] === 'string' ? a[key].toLowerCase() : a[key];
        const valueB = typeof b[key] === 'string' ? b[key].toLowerCase() : b[key];
        if (valueA < valueB) return direction === 'ascending' ? -1 : 1;
        if (valueA > valueB) return direction === 'ascending' ? 1 : -1;
        return 0;
    });

    const handleSort = key => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className="container mt-4">
            <div className="text-center mb-3">
                <img src="header.png" alt="Header" height="150" width="150" />
                <h2>🏆 Eisdielen-Ranking</h2>
            </div>
            <table className="table table-bordered">
                <thead>
                    <tr>
                        {['eisdielen_name', 'avg_geschmack', 'avg_kugelgroesse', 'avg_waffel', 'avg_auswahl', 'aktueller_preis', 'PLV', 'geschmacks_faktor', 'preisleistungs_faktor'].map(key => (
                            <th key={key} onClick={() => handleSort(key)} style={{ cursor: 'pointer' }}>
                                {key.replace(/_/g, ' ')} {sortConfig.key === key ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((eisdiele, index) => (
                        <React.Fragment key={index}>
                            <tr onClick={() => setOpenDetails(openDetails === index ? null : index)} style={{ cursor: 'pointer' }}>
                                <td>{eisdiele.eisdielen_name}</td>
                                <td>{eisdiele.avg_geschmack.toFixed(1)}</td>
                                <td>{eisdiele.avg_kugelgroesse.toFixed(1)}</td>
                                <td>{eisdiele.avg_waffel.toFixed(1)}</td>
                                <td>{eisdiele.avg_auswahl.toFixed(1)}</td>
                                <td>{eisdiele.aktueller_preis.toFixed(2)} €</td>
                                <td><strong>{eisdiele.PLV.toFixed(2)}</strong></td>
                                <td>{eisdiele.geschmacks_faktor.toFixed(2)}</td>
                                <td>{eisdiele.preisleistungs_faktor.toFixed(2)}</td>
                            </tr>
                            {openDetails === index && (
                                <tr>
                                    <td colSpan="9">
                                        <div className="alert alert-info mb-0">
                                            <h5>{eisdiele.eisdielen_name}</h5>
                                            <strong>Adresse: </strong>{eisdiele.adresse}<br />
                                            <strong>Öffnungszeiten: </strong><br />
                                            {eisdiele.openingHours.split(';').map((line, i) => <div key={i}>{line}</div>)}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
            <div className="text-center">
                <h4>Erklärung zum Ranking</h4>
                <p>
                    Das Preis-Leistungsverhältnis wird nach folgender Formel berechnet: Geschmack (Gewichtung 70%) mit Geschmack und Waffel,
                    Kugelgröße/Preis (30%). Beispielhafte Formel siehe unten.
                </p>
                <img src="plv-formel_neu.png" alt="PLV Formel" />
            </div>
        </div>
    );
}

export default Ranking;