import Header from './../Header';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link, useSearchParams } from 'react-router-dom';



function Statistics() {

  const [data, setData] = useState({
    pricePerLandkreis: [],
    reviews: [],
    checkins: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiUrl = process.env.REACT_APP_API_BASE_URL;

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'activeUsers';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [expandedFlavour, setExpandedFlavour] = useState(null);
  const [flavourDetails, setFlavourDetails] = useState({});

  // Tab wechseln und URL aktualisieren
  const changeTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab }); // setzt ?tab=...
  };

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

  const loadFlavourDetails = async (sortenname, iceType) => {
    const key = `${sortenname}__${iceType}`;

    if (flavourDetails[key]) {
      setExpandedFlavour(expandedFlavour === key ? null : key);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/getBestShopsByFlavour.php?sortenname=${encodeURIComponent(sortenname)}&iceType=${encodeURIComponent(iceType)}`);
      const json = await res.json();
      setFlavourDetails(prev => ({ ...prev, [key]: json }));
      setExpandedFlavour(key);
    } catch (err) {
      console.error("Fehler beim Laden der Details:", err);
    }
  };



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
              active={activeTab === 'activeUsers'}
              onClick={() => changeTab('activeUsers')}
            >
              aktivste Benutzer
            </TabButton>
            <TabButton
              active={activeTab === 'mostPopularFlavours'}
              onClick={() => changeTab('mostPopularFlavours')}
            >
              beliebteste Eissorten
            </TabButton>
            <TabButton
              active={activeTab === 'landkreisPreis'}
              onClick={() => changeTab('landkreisPreis')}
            >
              Ø Kugelpreis pro Landkreis
            </TabButton>
            <TabButton
              active={activeTab === 'bundeslandPreis'}
              onClick={() => changeTab('bundeslandPreis')}
            >
              Ø Kugelpreis pro Bundesland
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
                  {data.mostEatenFlavours.map((entry, idx) => {
                    const key = `${entry.sortenname}__${entry.typ}`;
                    const isExpanded = expandedFlavour === key;
                    const details = flavourDetails[key] || [];

                    return (
                      <React.Fragment key={key}>
                        <tr onClick={() => loadFlavourDetails(entry.sortenname, entry.typ)} style={{ cursor: 'pointer' }}>
                          <Td>{entry.sortenname}</Td>
                          <Td>{entry.typ}</Td>
                          <Td>{entry.anzahl}</Td>
                          <Td>{parseFloat(entry.bewertung).toFixed(2)}</Td>
                        </tr>
                        <tr>
                          <Td colSpan="4" style={{ padding: 0, border: 'none' }}>
                            <ExpandContainer expanded={isExpanded}>
                              {details.length > 0 ? (
                                <DetailList>
                                  {details.map((eisdiele) => (
                                    <li key={eisdiele.eisdiele_id}>
                                      <strong><CleanLink to={`/map/activeShop/${eisdiele.eisdiele_id}`}>{eisdiele.eisdiele_name}</CleanLink></strong>: Ø {parseFloat(eisdiele.durchschnittsbewertung).toFixed(2)}
                                    </li>
                                  ))}
                                </DetailList>
                              ) : (
                                <EmptyText>Keine Daten verfügbar</EmptyText>
                              )}
                            </ExpandContainer>
                          </Td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>

              </Table>
            </div>
            )}

            {activeTab === 'activeUsers' && (<div>

              <Title>Benutzer nach Level</Title>
              <Table>
                <thead>
                  <tr>
                    <Th>Nutzer</Th>
                    <Th>EP Gesamt</Th>
                    <Th>Checkins</Th>
                    <Th>Bewertungen</Th>
                    <Th>Preismeldungen</Th>
                    <Th>Routen</Th>
                    <Th>EP Eisdielen</Th>
                    <Th>EP geworbene Nutzer</Th>
                    <Th>EP Awards</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.usersByLevel.map((entry) => (
                    <tr key={entry.nutzer_id}>
                      <Td><UserLink to={`/user/${entry.nutzer_id}`}>{entry.username}</UserLink></Td>
                      <Td><strong>{entry.ep_gesamt}</strong></Td>
                      <Td>{entry.anzahl_checkins} ({(entry.ep_checkins_ohne_bild + entry.ep_checkins_mit_bild)}EP)</Td>
                      <Td>{entry.anzahl_bewertungen} ({entry.ep_bewertungen}EP)</Td>
                      <Td>{entry.anzahl_preismeldungen} ({entry.ep_preismeldungen}EP)</Td>
                      <Td>{entry.anzahl_routen} ({entry.ep_routen}EP)</Td>
                      <Td>{entry.ep_eisdielen} EP</Td>
                      <Td>{entry.ep_geworbene_nutzer} EP</Td>
                      <Td>{entry.ep_awards} EP</Td>
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
  margin: 0 auto;
  padding: 0rem 1rem;
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-align: center;
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
  background-color: ${(props) => (props.active ? '#ffb522' : '#f0f0f0')};
  color: ${(props) => (props.active ? 'white' : '#333')};
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  white-space: nowrap;

  &:hover {
    background-color: ${(props) => (props.active ? '#da9c20ff' : '#e0e0e0')};
  }

  @media (max-width: 600px) {
    font-size: 0.875rem;
    padding: 0.3rem 0.6rem;
  }
`;


const TabContent = styled.div`
  margin-top: 1rem;
  overflow: auto; /* Scrollen nur hier */
`;


const UserLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  cursor: pointer;
`;

const ExpandContainer = styled.div`
  max-height: ${(props) => (props.expanded ? '500px' : '0')};
  overflow: hidden;
  transition: max-height 0.4s ease;
  background-color: #fafafa;
  padding: ${(props) => (props.expanded ? '0.5rem 1rem' : '0 1rem')};
`;

const DetailList = styled.ul`
  margin: 0.5rem 0;
  padding-left: 1rem;
  list-style-type: disc;
  font-size: 0.95rem;
`;

const EmptyText = styled.div`
  padding: 0.5rem;
  font-style: italic;
  color: #777;
`;

const CleanLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`;