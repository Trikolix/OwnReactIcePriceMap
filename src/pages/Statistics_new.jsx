import Header from '../Header';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

// Styled Components
const Container = styled.div`
  max-width: 900px;
  margin: 2rem auto;
  font-family: sans-serif;
`;

const Box = styled.div`
  border: 1px solid #ccc;
  margin-bottom: 1rem;
  border-radius: 8px;
  overflow: hidden;
`;

const Summary = styled.summary`
  background: #f8f8f8;
  padding: 12px 16px;
  font-weight: bold;
  cursor: pointer;
`;

const SubSummary = styled.summary`
  background: #fcfcfc;
  padding: 10px 20px;
  font-weight: 500;
  cursor: pointer;
  border-top: 1px solid #eee;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 0.5rem 0 1rem;

  th, td {
    padding: 8px 12px;
    border-bottom: 1px solid #eee;
  }

  th {
    text-align: left;
    background-color: #fafafa;
    font-weight: 600;
  }
`;

const DistrictWrapper = styled.div`
  padding-left: 2rem;
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-align: center;
`;

export default function HierarchicalPriceView() {
  const [data, setData] = useState([]);
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    fetch(`${apiUrl}/api/get_preise_hierarchisch.php`)
      .then((res) => res.json())
      .then((json) => {
        console.log(json);
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fehler beim Laden der Dashboard-Daten:", err);
        setError(err);
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchDashboard();
  }, []);



  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#ffb522' }}>
      <Header />
      <Title>Statistiken</Title>
      <Container>Lade Dashboard Daten...</Container>
    </div >
  );
  if (error !== null) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#ffb522' }}>
      <Header />
      <Title>Statistiken</Title>
      <Container>Fehler beim Abruf der Daten</Container>
    </div >
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#ffb522' }}>
      <Header />
      <Container>
        <h1 style={{ textAlign: "center" }}>🍦 Eiskugelpreise in Europa</h1>
        {data.map((country) => (
          <Box key={country.id}>
            <details>
              <Summary>
                {country.name} – Ø {country.durchschnittlicher_kugelpreis.toFixed(2)} € – {country.anzahl_eisdielen} Eisdiele(n)
              </Summary>
              <div>
                {country.bundeslaender.map((state) => (
                  <details key={state.id}>
                    <SubSummary>
                      {state.name} – Ø {state.durchschnittlicher_kugelpreis.toFixed(2)} € – {state.anzahl_eisdielen} Eisdiele(n)
                    </SubSummary>
                    <DistrictWrapper>
                      <Table>
                        <thead>
                          <tr>
                            <th>Landkreis</th>
                            <th>Ø Preis</th>
                            <th>Eisdiele(n)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {state.landkreise.map((district) => (
                            <tr key={district.id}>
                              <td>{district.name}</td>
                              <td>{district.durchschnittlicher_kugelpreis.toFixed(2)} €</td>
                              <td>{district.anzahl_eisdielen}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </DistrictWrapper>
                  </details>
                ))}
              </div>
            </details>
          </Box>
        ))}
      </Container>
    </div>
  );
}