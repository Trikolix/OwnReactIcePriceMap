import Header from './../Header';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';



function Statistics() {

  const [data, setData] = useState({
    pricePerLandkreis: [],
    reviews: [],
    checkins: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiUrl = process.env.REACT_APP_API_BASE_URL;

  const [activeTab, setActiveTab] = useState('landkreisPreis');

  const fetchDashboard = async () => {
    fetch(`${apiUrl}/statistics.php`)
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
      <Title>Aktivitäten</Title>
      <Container>Lade Dashboard Daten...</Container>
    </div >
  );
  if (error !== null) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#ffb522' }}>
      <Header />
      <Title>Aktivitäten</Title>
      <Container>Fehler beim Abruf der Daten</Container>
    </div >
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#ffb522' }}>
      <Header />
      <div style={{ width: '100vw', height: '100vh', backgroundColor: 'white' }}>
      <Title>Statistiken</Title>
      <Container>
        <TabContainer>
          <TabButton
            active={activeTab === 'landkreisPreis'}
            onClick={() => setActiveTab('landkreisPreis')}
          >
            Ø Kugelpreis pro Landkreis
          </TabButton>
          <TabButton
            active={activeTab === 'bundeslandPreis'}
            onClick={() => setActiveTab('bundeslandPreis')}
          >
            Ø Kugelpreis pro Bundesland
          </TabButton>
          <TabButton
            active={activeTab === 'mostPopularFlavours'}
            onClick={() => setActiveTab('mostPopularFlavours')}
          >
            beliebteste Eissorten
          </TabButton>
          <TabButton
            active={activeTab === 'activeUsers'}
            onClick={() => setActiveTab('activeUsers')}
          >
            aktivste Benutzer
          </TabButton>
        </TabContainer>

          <TabContent>
            {activeTab === 'landkreisPreis' && (<div>
              <Title>Durchschnittlicher Kugelpreis pro Landkreis</Title>
              <Table>
                <thead>
                  <tr>
                    <Th>Landkreis (Bundesland)</Th>
                    <Th>Anzahl Preismeldungen</Th>
                    <Th>Ø Kugelpreis (€)</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.pricePerLandkreis.map((entry) => (
                    <tr key={entry.landkreis_id}>
                      <Td>{entry.landkreis_name} (<em>{entry.bundesland_name}</em>)</Td>
                      <Td>{entry.anzahl_eisdielen}</Td>
                      <Td>{entry.durchschnittlicher_kugelpreis} €</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            )}

            {activeTab === 'bundeslandPreis' && (<div>
              <Title>Durchschnittlicher Kugelpreis pro Bundesland</Title>
              <Table>
                <thead>
                  <tr>
                    <Th>Bundesland</Th>
                    <Th>Anzahl Preismeldungen</Th>
                    <Th>Ø Kugelpreis (€)</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.pricePerBundesland.map((entry) => (
                    <tr key={entry.bundesland_id}>
                      <Td>{entry.bundesland_name}</Td>
                      <Td>{entry.anzahl_eisdielen}</Td>
                      <Td>{entry.durchschnittlicher_kugelpreis} €</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            )}

            {activeTab === 'mostPopularFlavours' && (<div>
              <Title>beliebteste Sorten</Title>
              <Table>
                <thead>
                  <tr>
                    <Th>Geschmacksrichtung</Th>
                    <Th>Typ</Th>
                    <Th>Anzahl</Th>
                    <Th>Ø Bewertung</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.mostEatenFlavours.map((entry) => (
                    <tr>
                      <Td>{entry.sortenname}</Td>
                      <Td>{entry.typ}</Td>
                      <Td>{entry.anzahl}</Td>
                      <Td>{parseFloat(entry.bewertung).toFixed(2)}</Td>            
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            )}

            {activeTab === 'activeUsers' && (<div>
              <Title>aktivste Benutzer</Title>
              <Table>
                <thead>
                  <tr>
                    <Th>Nutzer</Th>
                    <Th>Checkins</Th>
                    <Th>Reviews</Th>
                    <Th>Preismeldungen</Th>
                    <Th>Routen</Th>
                    <Th>Eisdielen</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.mostActiveUsers.map((entry) => (
                    <tr key={entry.user_id}>
                      <Td><UserLink to={`/user/${entry.user_id}`}>{entry.username}</UserLink></Td>
                      <Td>{entry.checkins}</Td>
                      <Td>{entry.reviews}</Td>
                      <Td>{entry.preismeldungen}</Td>
                      <Td>{entry.routen}</Td>
                      <Td>{entry.eisdielen}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            )}
          </TabContent>
      </Container>
      </div>
    </div>
  )
}

export default Statistics;

const Container = styled.div`
  background-color: white;
  height: 100%;
  gap: 2rem;

  width: 90%;
  max-width: 900px;
  margin: 0 auto;
  padding: 0rem 1rem;
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-align: center;
`;

const Section = styled.div`
  flex: 1 1 300px;
  max-width: 900px;
  min-width: 300px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 0.75rem;
  background: #f0f0f0;
  border-bottom: 2px solid #ccc;
`;

const Td = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap; /* Tabs umbrechen, wenn nötig */
  gap: 0.5rem;
  margin-bottom: 1rem;

  @media (max-width: 600px) {
    justify-content: flex-start;
    overflow-x: auto;
    flex-wrap: wrap;
    -webkit-overflow-scrolling: touch;
    padding: 0 0.5rem;
    width: 100%;
  }
`;

const TabButton = styled.button`
  padding: 0.4rem 0.8rem;
  margin: 0;
  background-color: ${(props) => (props.active ? '#0077b6' : '#f0f0f0')};
  color: ${(props) => (props.active ? 'white' : '#333')};
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  white-space: nowrap;

  &:hover {
    background-color: ${(props) => (props.active ? '#005f8a' : '#e0e0e0')};
  }

  @media (max-width: 600px) {
    font-size: 0.875rem;
    padding: 0.3rem 0.6rem;
  }
`;


const TabContent = styled.div`
  margin-top: 1rem;
`;


const UserLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  cursor: pointer;
`;