import Header from './../Header';
import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { Link, useSearchParams } from 'react-router-dom';
import UserAvatar from './../components/UserAvatar';

const getNumericPrice = (node) => {
  if (!node) {
    return null;
  }
  const value = node.kugel_preis_eur ?? node.durchschnittlicher_kugelpreis_eur ?? node.kugel_preis ?? node.durchschnittlicher_kugelpreis;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const compareNodesByPrice = (a, b) => {
  const aVal = getNumericPrice(a);
  const bVal = getNumericPrice(b);

  if (aVal === null && bVal === null) {
    return 0;
  }
  if (aVal === null) {
    return 1;
  }
  if (bVal === null) {
    return -1;
  }
  return aVal - bVal;
};

const sortLandkreise = (landkreise = []) => [...landkreise].sort(compareNodesByPrice);

const sortBundeslaender = (bundeslaender = []) =>
  [...bundeslaender]
    .map((bundesland) => ({
      ...bundesland,
      landkreise: sortLandkreise(bundesland.landkreise || []),
    }))
    .sort(compareNodesByPrice);

const sortLaender = (laender = []) =>
  [...laender]
    .map((land) => ({
      ...land,
      bundeslaender: sortBundeslaender(land.bundeslaender || []),
    }))
    .sort(compareNodesByPrice);



function Statistics() {

  const [data, setData] = useState({
    pricePerLandkreis: [],
    reviews: [],
    checkins: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceHierarchy, setPriceHierarchy] = useState([]);
  const [priceSearch, setPriceSearch] = useState('');
  const [expandedNodes, setExpandedNodes] = useState({});

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
    setLoading(true);
    try {
      const [statsRes, hierarchyRes] = await Promise.all([
        fetch(`${apiUrl}/statistics.php`),
        fetch(`${apiUrl}/api/get_preise_hierarchisch.php`),
      ]);

      if (!statsRes.ok) {
        throw new Error(`Statistics request failed with status ${statsRes.status}`);
      }

      if (!hierarchyRes.ok) {
        throw new Error(`Price hierarchy request failed with status ${hierarchyRes.status}`);
      }

      const statsJson = await statsRes.json();
      const hierarchyJson = await hierarchyRes.json();

      setData(statsJson);
      const parsedHierarchy = Array.isArray(hierarchyJson) ? hierarchyJson : [];
      setPriceHierarchy(sortLaender(parsedHierarchy));
      setLoading(false);
    } catch (err) {
      console.error("Fehler beim Laden der Dashboard-Daten:", err);
      setError(err);
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, [apiUrl]);

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

  const normalizedSearch = priceSearch.trim().toLowerCase();
  const searchActive = normalizedSearch.length > 0;

  const filteredPriceHierarchy = useMemo(() => {
    if (!normalizedSearch) {
      return priceHierarchy;
    }

    const matches = (value = '') => value.toLowerCase().includes(normalizedSearch);

    return priceHierarchy
      .map((land) => {
        const landMatches = matches(land.name);
        const filteredBundeslaender = (land.bundeslaender || [])
          .map((bundesland) => {
            const bundeslandMatches = matches(bundesland.name);
            const filteredLandkreise = (bundesland.landkreise || []).filter((landkreis) =>
              matches(landkreis.name)
            );

            if (bundeslandMatches || filteredLandkreise.length > 0) {
              return {
                ...bundesland,
                landkreise: bundeslandMatches ? bundesland.landkreise : filteredLandkreise,
              };
            }

            return null;
          })
          .filter(Boolean);

        if (landMatches || filteredBundeslaender.length > 0) {
          return {
            ...land,
            bundeslaender: landMatches ? land.bundeslaender : filteredBundeslaender,
          };
        }

        return null;
      })
      .filter(Boolean);
  }, [normalizedSearch, priceHierarchy]);

  const formatCurrencyValue = (value, symbol = '€') => {
    if (value === null || value === undefined) {
      return '';
    }
    const num = Number(value);
    if (Number.isNaN(num)) {
      return '';
    }
    const suffix = symbol ? ` ${symbol}` : '';
    return `${num.toFixed(2)}${suffix}`;
  };

  const formatPriceDisplay = (node) => {
    if (!node) {
      return '-';
    }
    const euroValue = node.kugel_preis_eur ?? node.durchschnittlicher_kugelpreis_eur;
    const euroText = formatCurrencyValue(euroValue, '€');
    if (!euroText) {
      return '-';
    }

    const localValue = node.kugel_preis ?? node.durchschnittlicher_kugelpreis;
    const localCurrencyCode = node.currency?.code ? node.currency.code.toUpperCase() : null;
    const localSymbol = node.kugel_waehrung || node.currency?.symbol || localCurrencyCode || '';
    const isEuroCurrency = (localCurrencyCode && localCurrencyCode === 'EUR') || (!localCurrencyCode && (!localSymbol || localSymbol === '€'));

    if (isEuroCurrency || localValue === null || localValue === undefined) {
      return euroText;
    }

    const localText = formatCurrencyValue(localValue, localSymbol || localCurrencyCode || '');
    return localText ? `${euroText} (${localText})` : euroText;
  };

  const getLandKey = (id) => `land-${id}`;
  const getBundeslandKey = (landId, bundeslandId) => `bundesland-${landId}-${bundeslandId}`;

  const isExpanded = (key) => (searchActive ? true : !!expandedNodes[key]);

  const toggleNode = (key) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
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
              active={activeTab === 'priceHierarchy'}
              onClick={() => changeTab('priceHierarchy')}
            >
              Preisübersicht
            </TabButton>
          </TabContainer>

          <TabContent>
            {activeTab === 'priceHierarchy' && (<div>
              <Title>Durchschnittlicher Kugelpreis je Region</Title>
              <SearchContainer>
                <SearchInput
                  type="search"
                  placeholder="Land, Bundesland oder Landkreis suchen..."
                  value={priceSearch}
                  onChange={(e) => setPriceSearch(e.target.value)}
                />
              </SearchContainer>
              <Table>
                <thead>
                  <tr>
                    <Th>Region</Th>
                    <Th>Anzahl Preismeldungen</Th>
                    <Th>Ø Kugelpreis (€)</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPriceHierarchy.length === 0 ? (
                    <tr>
                      <Td colSpan="3" style={{ textAlign: 'center' }}>Keine Daten gefunden</Td>
                    </tr>
                  ) : (
                    filteredPriceHierarchy.map((land) => {
                      const landKey = getLandKey(land.id);
                      const landExpanded = isExpanded(landKey);
                      const bundeslaender = land.bundeslaender || [];
                      const landHasChildren = bundeslaender.length > 0;

                      return (
                        <React.Fragment key={landKey}>
                          <PriceTableRow
                            level="land"
                            clickable={landHasChildren}
                            onClick={landHasChildren ? () => toggleNode(landKey) : undefined}
                          >
                            <PriceNameCell>
                              <NameWrapper>
                                <Indent level={0} />
                                {landHasChildren ? (
                                  <ExpandIndicator>{landExpanded ? 'v' : '>'}</ExpandIndicator>
                                ) : <LeafSpacer />}
                                <LevelBadge>Land</LevelBadge>
                                <span>{land.name}</span>
                              </NameWrapper>
                            </PriceNameCell>
                            <Td>{land.anzahl_eisdielen}</Td>
                            <Td>{formatPriceDisplay(land)}</Td>
                          </PriceTableRow>

                          {landExpanded && bundeslaender.map((bundesland) => {
                            const bundeslandKey = getBundeslandKey(land.id, bundesland.id);
                            const bundeslandExpanded = isExpanded(bundeslandKey);
                            const landkreise = bundesland.landkreise || [];
                            const bundeslandHasChildren = landkreise.length > 0;

                            return (
                              <React.Fragment key={bundeslandKey}>
                                <PriceTableRow
                                  level="bundesland"
                                  clickable={bundeslandHasChildren}
                                  onClick={(e) => {
                                    if (bundeslandHasChildren) {
                                      e.stopPropagation();
                                      toggleNode(bundeslandKey);
                                    }
                                  }}
                                >
                                  <PriceNameCell>
                                    <NameWrapper>
                                      <Indent level={1} />
                                      {bundeslandHasChildren ? (
                                        <ExpandIndicator>{bundeslandExpanded ? 'v' : '>'}</ExpandIndicator>
                                      ) : <LeafSpacer />}
                                      <LevelBadge>Bundesland</LevelBadge>
                                      <span>{bundesland.name}</span>
                                    </NameWrapper>
                                  </PriceNameCell>
                                  <Td>{bundesland.anzahl_eisdielen}</Td>
                                  <Td>{formatPriceDisplay(bundesland)}</Td>
                                </PriceTableRow>

                                {bundeslandExpanded && landkreise.map((landkreis) => (
                                  <PriceTableRow key={`landkreis-${landkreis.id}`} level="landkreis">
                                    <PriceNameCell>
                                      <NameWrapper>
                                        <Indent level={2} />
                                        <LeafSpacer />
                                        <LevelBadge>Landkreis</LevelBadge>
                                        <span>{landkreis.name}</span>
                                      </NameWrapper>
                                    </PriceNameCell>
                                    <Td>{landkreis.anzahl_eisdielen}</Td>
                                    <Td>{formatPriceDisplay(landkreis)}</Td>
                                  </PriceTableRow>
                                ))}
                              </React.Fragment>
                            );
                          })}
                        </React.Fragment>
                      );
                    })
                  )}
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
                      <Td>
                        <UserInfo>
                          <UserAvatar
                            size={34}
                            userId={entry.nutzer_id}
                            name={entry.username}
                            avatarUrl={entry.avatar_url}
                          />
                          <UserLink to={`/user/${entry.nutzer_id}`}>{entry.username}</UserLink>
                        </UserInfo>
                      </Td>
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




const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

const SearchContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.75rem;
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 360px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  outline: none;

  &:focus {
    border-color: #ffb522;
    box-shadow: 0 0 0 2px rgba(255, 181, 34, 0.2);
  }
`;

const PriceTableRow = styled.tr`
  cursor: ${(props) => (props.clickable ? 'pointer' : 'default')};
  background-color: ${(props) =>
    props.level === 'land'
      ? '#fff8ec'
      : props.level === 'bundesland'
        ? '#fffdf6'
        : 'transparent'};
  transition: background-color 0.2s ease;
`;

const PriceNameCell = styled(Td)`
  padding-left: 0.25rem;
`;

const NameWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
`;

const Indent = styled.span`
  display: inline-block;
  width: ${(props) => (props.level || 0) * 1.5}rem;
  flex-shrink: 0;
`;

const LevelBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.6rem;
  border-radius: 999px;
  background-color: #ffe0a3;
  color: #8a5700;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
`;

const ExpandIndicator = styled.span`
  display: inline-block;
  width: 1rem;
  text-align: center;
  font-weight: bold;
`;

const LeafSpacer = styled.span`
  display: inline-block;
  width: 1rem;
`;
