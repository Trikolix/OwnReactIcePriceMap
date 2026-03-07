import Header from '../Header';
import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { Link, useSearchParams } from 'react-router-dom';
import UserAvatar from '../components/UserAvatar';

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

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

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

  const priceOverviewStats = useMemo(() => {
    let bundeslaender = 0;
    let landkreise = 0;
    filteredPriceHierarchy.forEach((land) => {
      const states = land.bundeslaender || [];
      bundeslaender += states.length;
      states.forEach((bundesland) => {
        landkreise += (bundesland.landkreise || []).length;
      });
    });
    return {
      laender: filteredPriceHierarchy.length,
      bundeslaender,
      landkreise,
    };
  }, [filteredPriceHierarchy]);

  const formatCurrencyValue = (value, symbol = '€') => {
    if (value === null || value === undefined || value === '0.00') {
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#fff7e8' }}>
      <Header />
      <div style={{ width: '100%', minHeight: '100%', backgroundColor: 'transparent' }}>
        <Container>
          <HeroCard>
            <Title>Statistiken</Title>
            <HeroSubtitle>
              Community-Aktivität, beliebte Sorten und regionale Preisübersichten auf einen Blick.
            </HeroSubtitle>
          </HeroCard>
          <TabContainer>
            <TabButton
              $active={activeTab === 'activeUsers'}
              onClick={() => changeTab('activeUsers')}
            >
              aktivste Benutzer
            </TabButton>
            <TabButton
              $active={activeTab === 'mostPopularFlavours'}
              onClick={() => changeTab('mostPopularFlavours')}
            >
              beliebteste Eissorten
            </TabButton>
            <TabButton
              $active={activeTab === 'priceHierarchy'}
              onClick={() => changeTab('priceHierarchy')}
            >
              Preisübersicht
            </TabButton>
          </TabContainer>

          <TabContent>
            {activeTab === 'priceHierarchy' && (<SectionCard>
              <PriceOverviewToolbar>
                <div>
                  <SectionTitle style={{ textAlign: 'left', marginBottom: '0.35rem' }}>
                    Durchschnittlicher Kugelpreis je Region
                  </SectionTitle>
                  <PriceOverviewSubline>
                    Hierarchische Preisübersicht von Land bis Landkreis, sortiert nach Ø Kugelpreis.
                  </PriceOverviewSubline>
                </div>
                <SearchContainer>
                  <SearchInput
                    type="search"
                    placeholder="Land, Bundesland oder Landkreis suchen..."
                    value={priceSearch}
                    onChange={(e) => setPriceSearch(e.target.value)}
                  />
                </SearchContainer>
              </PriceOverviewToolbar>
              <PriceOverviewMeta>
                <MetaPill>{priceOverviewStats.laender} Länder</MetaPill>
                <MetaPill>{priceOverviewStats.bundeslaender} Bundesländer</MetaPill>
                <MetaPill>{priceOverviewStats.landkreise} Landkreise</MetaPill>
                {searchActive && <MetaPill $accent>Filter aktiv: „{priceSearch.trim()}“</MetaPill>}
              </PriceOverviewMeta>
              <TableScrollArea>
              <Table>
                <thead>
                  <tr>
                    <Th>Region</Th>
                    <Th>Ø Kugelpreis (€)</Th>
                    <Th>Anzahl Preismeldungen</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPriceHierarchy.length === 0 ? (
                    <tr>
                      <EmptyStateCell colSpan="3">Keine Daten gefunden</EmptyStateCell>
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
                                  <ExpandIndicator $expanded={landExpanded}>{landExpanded ? '▾' : '▸'}</ExpandIndicator>
                                ) : <LeafSpacer />}
                                <LevelBadge>Land</LevelBadge>
                                <RegionName>{land.name}</RegionName>
                              </NameWrapper>
                            </PriceNameCell>
                            <PriceValueCell><PriceValuePill>{formatPriceDisplay(land)}</PriceValuePill></PriceValueCell>
                            <Td><CountPill>{land.anzahl_eisdielen}</CountPill></Td>
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
                                        <ExpandIndicator $expanded={bundeslandExpanded}>{bundeslandExpanded ? '▾' : '▸'}</ExpandIndicator>
                                      ) : <LeafSpacer />}
                                      <LevelBadge>Bundesland</LevelBadge>
                                      <RegionName>{bundesland.name}</RegionName>
                                    </NameWrapper>
                                  </PriceNameCell>
                                  <PriceValueCell><PriceValuePill>{formatPriceDisplay(bundesland)}</PriceValuePill></PriceValueCell>
                                  <Td><CountPill>{bundesland.anzahl_eisdielen}</CountPill></Td>
                                </PriceTableRow>

                                {bundeslandExpanded && landkreise.map((landkreis) => (
                                  <PriceTableRow key={`landkreis-${landkreis.id}`} level="landkreis">
                                    <PriceNameCell>
                                      <NameWrapper>
                                        <Indent level={2} />
                                        <LeafSpacer />
                                        <LevelBadge>Landkreis</LevelBadge>
                                        <RegionName>{landkreis.name}</RegionName>
                                      </NameWrapper>
                                    </PriceNameCell>
                                    <PriceValueCell><PriceValuePill>{formatPriceDisplay(landkreis)}</PriceValuePill></PriceValueCell>
                                    <Td><CountPill>{landkreis.anzahl_eisdielen}</CountPill></Td>
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
              </TableScrollArea>
            </SectionCard>
            )}

            {activeTab === 'mostPopularFlavours' && (<SectionCard>
              <SectionTitle>Beliebteste Sorten</SectionTitle>
              <TableScrollArea>
              <Table $compactColumns>
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
              </TableScrollArea>
            </SectionCard>
            )}

            {activeTab === 'activeUsers' && (<SectionCard>

              <SectionTitle>Benutzer nach Level</SectionTitle>
              <TableScrollArea>
              <Table $stickyFirstColumn>
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
              </TableScrollArea>
            </SectionCard>
            )}
          </TabContent>
        </Container>
      </div>
    </div>
  )
}

export default Statistics;

const Container = styled.div`
  background:
    radial-gradient(circle at top right, rgba(255, 218, 140, 0.28), transparent 45%),
    linear-gradient(180deg, #fffaf0 0%, #fff7e7 100%);
  min-height: 100%;
  gap: 1rem;
  width: min(96%, 1480px);
  box-sizing: border-box;
  margin: 0 auto;
  padding: 1rem;
`;

const Title = styled.h2`
  font-size: clamp(1.35rem, 2vw, 1.8rem);
  font-weight: 800;
  margin: 0;
  text-align: center;
  color: #2f2100;
`;

const HeroCard = styled.div`
  background: rgba(255, 252, 243, 0.96);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.08);
  padding: 1rem 1rem 0.9rem;
  margin-bottom: 1rem;
`;

const HeroSubtitle = styled.p`
  margin: 0.35rem 0 0;
  text-align: center;
  color: rgba(47, 33, 0, 0.68);
  font-size: 0.95rem;
`;

const SectionCard = styled.div`
  background: rgba(255, 252, 243, 0.94);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.08);
  padding: 1rem;
  min-width: 0;
`;

const SectionTitle = styled.h3`
  margin: 0 0 0.85rem;
  text-align: center;
  color: #2f2100;
  font-size: 1.05rem;
  font-weight: 800;
`;

const PriceOverviewToolbar = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.65rem;
  margin-bottom: 0.55rem;

  @media (min-width: 900px) {
    grid-template-columns: 1fr auto;
    align-items: end;
    gap: 1rem;
  }
`;

const PriceOverviewSubline = styled.p`
  margin: 0;
  color: rgba(47, 33, 0, 0.68);
  font-size: 0.9rem;
  text-align: left;
`;

const PriceOverviewMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin: 0 0 0.85rem;
`;

const MetaPill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.22rem 0.65rem;
  border-radius: 999px;
  background: ${({ $accent }) => ($accent ? 'rgba(255, 181, 34, 0.18)' : 'rgba(47, 33, 0, 0.04)')};
  border: 1px solid ${({ $accent }) => ($accent ? 'rgba(255, 181, 34, 0.35)' : 'rgba(47, 33, 0, 0.08)')};
  color: #6a4908;
  font-weight: 700;
  font-size: 0.78rem;
`;

const TableScrollArea = styled.div`
  width: 100%;
  overflow-x: auto;
  border-radius: 14px;
  border: 1px solid rgba(47, 33, 0, 0.08);
  background: rgba(255, 255, 255, 0.8);
`;

const Table = styled.table`
  width: 100%;
  min-width: 760px;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: auto;
  ${({ $stickyFirstColumn }) =>
    $stickyFirstColumn &&
    `
    thead th:first-child {
      left: 0;
      z-index: 3;
      background: rgba(255, 252, 243, 0.98);
      box-shadow: 2px 0 0 rgba(47, 33, 0, 0.06);
    }

    tbody td:first-child {
      position: sticky;
      left: 0;
      z-index: 2;
      background: rgba(255, 255, 255, 0.97);
      box-shadow: 2px 0 0 rgba(47, 33, 0, 0.06);
    }
  `}

  @media (max-width: 700px) {
    ${({ $compactColumns }) =>
      $compactColumns &&
      `
      min-width: 100%;
      table-layout: fixed;
    `}

    th:first-child,
    td:first-child {
      width: 120px;
      min-width: 120px;
      max-width: 120px;
    }

    ${({ $compactColumns }) =>
      $compactColumns &&
      `
      th,
      td {
        padding: 0.5rem 0.35rem;
      }

      th {
        font-size: 0.78rem;
      }

      td {
        font-size: 0.82rem;
      }

      th:first-child,
      td:first-child {
        width: 120px;
        min-width: 120px;
        max-width: 120px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      th:nth-child(2),
      td:nth-child(2) {
        width: 48px;
        min-width: 48px;
        max-width: 48px;
      }

      th:nth-child(3),
      td:nth-child(3) {
        width: 42px;
        min-width: 42px;
        max-width: 42px;
        text-align: right;
      }

      th:nth-child(4),
      td:nth-child(4) {
        width: 66px;
        min-width: 66px;
        max-width: 66px;
        text-align: right;
      }
    `}
  }
`;

const Th = styled.th`
  text-align: left;
  padding: 0.7rem 0.75rem;
  background: rgba(255, 252, 243, 0.98);
  color: #5f3f00;
  border-bottom: 1px solid rgba(47, 33, 0, 0.12);
  font-weight: 800;
  font-size: 0.83rem;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 1;
`;

const Td = styled.td`
  padding: 0.7rem 0.75rem;
  border-bottom: 1px solid rgba(47, 33, 0, 0.08);
  color: #2f2100;
  font-size: 0.92rem;
  vertical-align: top;
`;

const EmptyStateCell = styled(Td)`
  text-align: center;
  padding: 1.2rem 0.75rem;
  color: rgba(47, 33, 0, 0.62);
  font-style: italic;
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1rem;
  padding: 0.35rem;
  background: rgba(255, 252, 243, 0.88);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(28, 20, 0, 0.05);
`;

const TabButton = styled.button`
  padding: 0.55rem 0.95rem;
  margin: 0;
  background-color: ${(props) => (props.$active ? '#ffb522' : 'transparent')};
  color: ${(props) => (props.$active ? '#2f2100' : '#5c4a25')};
  border: 1px solid ${(props) => (props.$active ? 'rgba(255,181,34,0.55)' : 'transparent')};
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: ${(props) => (props.$active ? '0 2px 8px rgba(255,181,34,0.25)' : 'none')};
  transition: background-color 0.15s ease, box-shadow 0.15s ease, color 0.15s ease;

  &:hover {
    background-color: ${(props) => (props.$active ? '#ffbf3f' : 'rgba(255,181,34,0.1)')};
  }
`;


const TabContent = styled.div`
  margin-top: 1rem;
  display: grid;
  gap: 1rem;
  min-width: 0;
`;




const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
`;

const UserLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    color: #8a5600;
  }
`;

const ExpandContainer = styled.div`
  max-height: ${(props) => (props.expanded ? '500px' : '0')};
  overflow: hidden;
  transition: max-height 0.4s ease;
  background: linear-gradient(180deg, rgba(255,248,225,0.7), rgba(255,255,255,0.9));
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
  color: #7a6440;
`;

const CleanLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`;

const SearchContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 0;
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 360px;
  min-width: min(100%, 320px);
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(47, 33, 0, 0.14);
  border-radius: 10px;
  font-size: 1rem;
  outline: none;
  background: rgba(255,255,255,0.95);
  color: #2f2100;

  &:focus {
    border-color: #ffb522;
    box-shadow: 0 0 0 2px rgba(255, 181, 34, 0.2);
  }
`;

const PriceTableRow = styled.tr`
  cursor: ${(props) => (props.clickable ? 'pointer' : 'default')};
  background-color: ${(props) =>
    props.level === 'land'
      ? 'rgba(255, 181, 34, 0.10)'
      : props.level === 'bundesland'
        ? 'rgba(255, 181, 34, 0.04)'
        : 'transparent'};
  transition: background-color 0.2s ease;

  &:hover td {
    background: ${(props) => (props.clickable ? 'rgba(255, 181, 34, 0.10)' : 'transparent')};
  }

  td {
    background: ${(props) =>
      props.level === 'land'
        ? 'rgba(255, 248, 225, 0.6)'
        : props.level === 'bundesland'
          ? 'rgba(255, 255, 255, 0.86)'
          : 'rgba(255, 255, 255, 0.72)'};
  }
`;

const PriceNameCell = styled(Td)`
  padding-left: 0.25rem;
`;

const NameWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  min-height: 28px;
`;

const RegionName = styled.span`
  font-weight: 700;
  color: #2f2100;
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
  background-color: rgba(255, 181, 34, 0.18);
  color: #8a5700;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border: 1px solid rgba(255, 181, 34, 0.3);
`;

const ExpandIndicator = styled.span`
  display: inline-grid;
  place-items: center;
  width: 1.05rem;
  height: 1.05rem;
  text-align: center;
  font-weight: bold;
  border-radius: 999px;
  color: #7f5300;
  background: ${({ $expanded }) => ($expanded ? 'rgba(255,181,34,0.22)' : 'rgba(47,33,0,0.05)')};
  border: 1px solid ${({ $expanded }) => ($expanded ? 'rgba(255,181,34,0.35)' : 'rgba(47,33,0,0.08)')};
  font-size: 0.75rem;
`;

const LeafSpacer = styled.span`
  display: inline-block;
  width: 1.05rem;
`;

const PriceValueCell = styled(Td)`
  white-space: nowrap;
`;

const PriceValuePill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  background: rgba(255, 181, 34, 0.12);
  border: 1px solid rgba(255, 181, 34, 0.22);
  color: #7a4a00;
  font-weight: 700;
  min-width: 72px;
  justify-content: center;
`;

const CountPill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: rgba(47, 33, 0, 0.04);
  border: 1px solid rgba(47, 33, 0, 0.08);
  color: #5b4520;
  font-weight: 700;
`;
