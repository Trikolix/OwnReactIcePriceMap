import Header from '../Header';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { Link, useSearchParams } from 'react-router-dom';
import UserAvatar from '../components/UserAvatar';
import { useUser } from '../context/UserContext';
import Seo from '../components/Seo';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChevronDown, History, Info, SlidersHorizontal } from 'lucide-react';

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

const formatPriceDate = (value) => {
  if (!value) return null;
  const date = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString('de-DE');
};



function Statistics() {
  const { userId } = useUser();

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
  const today = new Date().toISOString().slice(0, 10);
  const [priceTo, setPriceTo] = useState(today);
  const [priceFreshnessDays, setPriceFreshnessDays] = useState('all');
  const [priceMinShops, setPriceMinShops] = useState('3');
  const [priceStatsMeta, setPriceStatsMeta] = useState(null);
  const [showPageIntro, setShowPageIntro] = useState(false);
  const [showPriceDataBasis, setShowPriceDataBasis] = useState(false);
  const [showPriceAnalysis, setShowPriceAnalysis] = useState(false);
  const [showPriceAdvancedOptions, setShowPriceAdvancedOptions] = useState(false);
  const [priceTimelineRange, setPriceTimelineRange] = useState('12m');
  const [priceTimelineLandId, setPriceTimelineLandId] = useState('');
  const [priceTimelineBundeslandId, setPriceTimelineBundeslandId] = useState('');
  const [priceTimelineLandkreisId, setPriceTimelineLandkreisId] = useState('');
  const [priceTimeline, setPriceTimeline] = useState([]);
  const [priceTimelineMeta, setPriceTimelineMeta] = useState(null);
  const [priceTimelineLoading, setPriceTimelineLoading] = useState(false);
  const [priceTimelineError, setPriceTimelineError] = useState(null);

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTabParam = searchParams.get('tab');
  const initialTab = initialTabParam === 'rankings' ? 'activeUsers' : (initialTabParam || 'activeUsers');
  const initialRankingPeriodParam = searchParams.get('period');
  const initialRankingPeriod = ['overall', 'week', 'month'].includes(initialRankingPeriodParam)
    ? initialRankingPeriodParam
    : 'overall';
  const initialRankingArchiveKey = initialRankingPeriod === 'overall' ? '' : (searchParams.get('period_key') || '');
  const [activeTab, setActiveTab] = useState(initialTab);

  const [rankingPeriod, setRankingPeriod] = useState(initialRankingPeriod);
  const [rankingArchiveKey, setRankingArchiveKey] = useState(initialRankingArchiveKey);
  const [rankingsData, setRankingsData] = useState(null);
  const [rankingsLoading, setRankingsLoading] = useState(false);
  const [expandedRankingEntry, setExpandedRankingEntry] = useState(null);
  const lastWrittenStatisticsQuery = useRef(null);
  const isApplyingExternalStatisticsQuery = useRef(false);

  // Tab wechseln und URL aktualisieren
  const changeTab = (tab) => {
    setActiveTab(tab);
  };

  useEffect(() => {
    const queryString = searchParams.toString();
    if (lastWrittenStatisticsQuery.current === queryString) {
      lastWrittenStatisticsQuery.current = null;
      return;
    }

    const nextTabParam = searchParams.get('tab');
    const nextTab = nextTabParam === 'rankings' ? 'activeUsers' : (nextTabParam || 'activeUsers');
    const nextPeriodParam = searchParams.get('period');
    const nextPeriod = ['overall', 'week', 'month'].includes(nextPeriodParam) ? nextPeriodParam : 'overall';
    const nextArchiveKey = nextPeriod === 'overall' ? '' : (searchParams.get('period_key') || '');

    const needsStateUpdate = nextTab !== activeTab
      || nextPeriod !== rankingPeriod
      || nextArchiveKey !== rankingArchiveKey;
    // Browser navigation (or a manually edited URL) wins over the current UI state.
    // The write effect below skips once, so it cannot write stale state back into the URL.
    isApplyingExternalStatisticsQuery.current = needsStateUpdate;

    if (nextTab !== activeTab) {
      setActiveTab(nextTab);
    }
    if (nextPeriod !== rankingPeriod) {
      setRankingPeriod(nextPeriod);
    }
    if (nextArchiveKey !== rankingArchiveKey) {
      setRankingArchiveKey(nextArchiveKey);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isApplyingExternalStatisticsQuery.current) {
      isApplyingExternalStatisticsQuery.current = false;
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', activeTab);

    if (activeTab === 'activeUsers') {
      nextParams.set('period', rankingPeriod);
      if (rankingPeriod !== 'overall' && rankingArchiveKey) {
        nextParams.set('period_key', rankingArchiveKey);
      } else {
        nextParams.delete('period_key');
      }
    } else {
      nextParams.delete('period');
      nextParams.delete('period_key');
    }

    if (nextParams.toString() !== searchParams.toString()) {
      lastWrittenStatisticsQuery.current = nextParams.toString();
      setSearchParams(nextParams, { replace: true });
    }
  }, [activeTab, rankingArchiveKey, rankingPeriod, searchParams, setSearchParams]);

  const fetchDashboard = async () => {
    if (!priceStatsMeta) {
      setLoading(true);
    }
    try {
      const [statsRes, hierarchyRes] = await Promise.all([
        fetch(`${apiUrl}/statistics.php`),
        fetch(apiUrl + '/api/price_statistics.php?to=' + encodeURIComponent(priceTo) + '&freshness_days=' + encodeURIComponent(priceFreshnessDays) + '&min_shops=' + encodeURIComponent(priceMinShops)),
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
      const parsedHierarchy = Array.isArray(hierarchyJson?.hierarchy) ? hierarchyJson.hierarchy : [];
      setPriceHierarchy(sortLaender(parsedHierarchy));
      setPriceStatsMeta(hierarchyJson?.meta || null);
      setLoading(false);
    } catch (err) {
      console.error("Fehler beim Laden der Dashboard-Daten:", err);
      setError(err);
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, [apiUrl, priceFreshnessDays, priceMinShops, priceTo]);

  useEffect(() => {
    if (activeTab !== 'activeUsers' || rankingPeriod === 'overall') {
      return;
    }

    let isCancelled = false;
    const userParam = userId ? `&user_id=${userId}` : '';
    const archiveParam = rankingArchiveKey ? `&period_key=${encodeURIComponent(rankingArchiveKey)}` : '';

    const loadRankings = async () => {
      setRankingsLoading(true);
      try {
        const response = await fetch(`${apiUrl}/api/period_leaderboard.php?period=${rankingPeriod}${archiveParam}${userParam}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const json = await response.json();
        if (!isCancelled) {
          setRankingsData(json);
        }
      } catch (err) {
        console.error('Fehler beim Laden der Zeitraum-Rankings:', err);
        if (!isCancelled) {
          setRankingsData(null);
        }
      } finally {
        if (!isCancelled) {
          setRankingsLoading(false);
        }
      }
    };

    loadRankings();
    return () => {
      isCancelled = true;
    };
  }, [activeTab, apiUrl, rankingArchiveKey, rankingPeriod, userId]);

  useEffect(() => {
    if (rankingPeriod === 'overall' && rankingArchiveKey) {
      setRankingArchiveKey('');
    }
  }, [rankingArchiveKey, rankingPeriod]);

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

  const priceTimelineLand = useMemo(
    () => priceHierarchy.find((land) => String(land.id) === priceTimelineLandId) || null,
    [priceHierarchy, priceTimelineLandId],
  );
  const priceTimelineBundeslaender = priceTimelineLand?.bundeslaender || [];
  const priceTimelineBundesland = useMemo(
    () => priceTimelineBundeslaender.find((bundesland) => String(bundesland.id) === priceTimelineBundeslandId) || null,
    [priceTimelineBundeslaender, priceTimelineBundeslandId],
  );
  const priceTimelineLandkreise = priceTimelineBundesland?.landkreise || [];
  const priceTimelineLandkreis = useMemo(
    () => priceTimelineLandkreise.find((landkreis) => String(landkreis.id) === priceTimelineLandkreisId) || null,
    [priceTimelineLandkreise, priceTimelineLandkreisId],
  );
  const priceTimelineRegion = useMemo(() => {
    if (priceTimelineLandkreis) {
      return { level: 'landkreis', id: priceTimelineLandkreis.id, name: priceTimelineLandkreis.name };
    }
    if (priceTimelineBundesland) {
      return { level: 'bundesland', id: priceTimelineBundesland.id, name: priceTimelineBundesland.name };
    }
    if (priceTimelineLand) {
      return { level: 'land', id: priceTimelineLand.id, name: priceTimelineLand.name };
    }
    return null;
  }, [priceTimelineBundesland, priceTimelineLand, priceTimelineLandkreis]);

  useEffect(() => {
    if (priceTimelineLandId || priceHierarchy.length === 0) {
      return;
    }
    const germany = priceHierarchy.find((land) => land.name === 'Deutschland');
    setPriceTimelineLandId(String((germany || priceHierarchy[0]).id));
  }, [priceHierarchy, priceTimelineLandId]);

  useEffect(() => {
    if (!showPriceAnalysis || !priceTimelineRegion || !apiUrl) {
      return;
    }

    let cancelled = false;
    const loadTimeline = async () => {
      setPriceTimelineLoading(true);
      setPriceTimelineError(null);
      try {
        const params = new URLSearchParams({
          level: priceTimelineRegion.level,
          id: String(priceTimelineRegion.id),
          range: priceTimelineRange,
          to: priceTo,
          freshness_days: priceFreshnessDays,
          min_shops: priceMinShops,
        });
        const response = await fetch(apiUrl + '/api/price_statistics_timeline.php?' + params.toString());
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        const json = await response.json();
        if (!cancelled) {
          setPriceTimeline(Array.isArray(json?.series) ? json.series : []);
          setPriceTimelineMeta(json?.meta || null);
        }
      } catch (timelineError) {
        if (!cancelled) {
          console.error('Fehler beim Laden der Preiszeitreihe:', timelineError);
          setPriceTimeline([]);
          setPriceTimelineMeta(null);
          setPriceTimelineError(timelineError);
        }
      } finally {
        if (!cancelled) {
          setPriceTimelineLoading(false);
        }
      }
    };

    loadTimeline();
    return () => {
      cancelled = true;
    };
  }, [apiUrl, priceFreshnessDays, priceMinShops, priceTimelineRange, priceTimelineRegion, priceTo, showPriceAnalysis]);

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
      return { euroText: '-', localText: '' };
    }
    const euroValue = node.kugel_preis_eur ?? node.durchschnittlicher_kugelpreis_eur;
    const euroText = formatCurrencyValue(euroValue, '€');
    if (!euroText) {
      return { euroText: '-', localText: '' };
    }

    const localValue = node.kugel_preis ?? node.durchschnittlicher_kugelpreis;
    const localCurrencyCode = node.currency?.code ? node.currency.code.toUpperCase() : null;
    const localSymbol = node.kugel_waehrung || node.currency?.symbol || localCurrencyCode || '';
    const isEuroCurrency = (localCurrencyCode && localCurrencyCode === 'EUR') || (!localCurrencyCode && (!localSymbol || localSymbol === '€'));

    if (isEuroCurrency || localValue === null || localValue === undefined) {
      return { euroText, localText: '' };
    }

    const localText = formatCurrencyValue(localValue, localSymbol || localCurrencyCode || '');
    return { euroText, localText: localText || '' };
  };

  const getHierarchyLabel = (level) => {
    if (level === 'land') {
      return 'Land';
    }
    if (level === 'bundesland') {
      return 'Bundesland';
    }
    return 'Landkreis';
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

  const overallLeaderboard = useMemo(
    () => (data.usersByLevel || []).filter((entry) => Number(entry.ep_gesamt) > 0),
    [data.usersByLevel]
  );
  const ownOverallPosition = userId
    ? overallLeaderboard.findIndex((entry) => Number(entry.nutzer_id) === Number(userId))
    : -1;
  const ownPeriodEntry = userId
    ? (rankingsData?.leaderboard || []).find((entry) => Number(entry.user_id) === Number(userId))
    : null;
  const ownRankingRank = rankingPeriod === 'overall'
    ? (ownOverallPosition >= 0 ? ownOverallPosition + 1 : null)
    : (ownPeriodEntry?.rank ?? null);
  const jumpToOwnRank = () => {
    const isMobile = window.matchMedia('(max-width: 700px)').matches;
    const target = document.getElementById(isMobile ? 'statistics-current-user-mobile' : 'statistics-current-user-desktop');
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target?.focus({ preventScroll: true });
  };
  const hasRankingEntries = (rankingsData?.leaderboard || []).length > 0;
  let emptyRankingMessage = 'Noch keine Einträge im Gesamtranking.';
  if (rankingPeriod === 'month') {
    emptyRankingMessage = 'Noch keine Einträge diesen Monat. Verdiene durch eine Aktion EP und sei der erste in der Rangliste.';
  } else if (rankingPeriod === 'week') {
    emptyRankingMessage = 'Noch keine Einträge diese Woche. Verdiene durch eine Aktion EP und sei der erste in der Rangliste.';
  }
  const archiveOptions = rankingsData?.period_meta?.archives || [];


  if (loading) return (
    <StatisticsPage>
      <Header />
      <StatisticsState aria-live="polite">
        <LoadingSpinner aria-hidden="true" />
        <Title>Statistiken</Title>
        <span>Statistiken werden geladen …</span>
      </StatisticsState>
    </StatisticsPage>
  );
  if (error !== null) return (
    <StatisticsPage>
      <Header />
      <StatisticsState $error role="alert">
        <Title>Statistiken</Title>
        <span>Die Statistiken konnten nicht geladen werden.</span>
      </StatisticsState>
    </StatisticsPage>
  );

  return (
    <StatisticsPage>
      <Seo
        title="Eispreis-Statistiken Deutschland | Ice-App"
        description="Statistiken der Ice-App: regionale Eispreise, beliebte Sorten, Community-Aktivität und Preisübersichten für Eisdielen in Deutschland."
        keywords={[
          'Eispreis Statistik',
          'Eispreise Deutschland',
          'Kugelpreis Statistik',
          'Ice-App Statistik',
          'Eisdielen Deutschland Preise',
        ]}
        canonical="/statistics"
      />
      <Header />
        <Container>
          <PageHeader>
            <Title>Statistiken</Title>
            <HeroSubtitle $expanded={showPageIntro}>
              Community-Aktivität, beliebte Sorten und regionale Preisübersichten auf einen Blick.
            </HeroSubtitle>
            <PageInfoToggle
              type="button"
              onClick={() => setShowPageIntro((current) => !current)}
              aria-expanded={showPageIntro}
            >
              <Info size={15} aria-hidden="true" />
              {showPageIntro ? 'Info ausblenden' : 'Worum geht’s?'}
              <ChevronDown size={15} aria-hidden="true" />
            </PageInfoToggle>
          </PageHeader>
          <TabContainer role="tablist" aria-label="Statistikbereiche">
            <TabButton
              type="button"
              role="tab"
              id="statistics-tab-active-users"
              aria-controls="statistics-tabpanel"
              aria-selected={activeTab === 'activeUsers'}
              aria-label="Aktivste Nutzer"
              $active={activeTab === 'activeUsers'}
              onClick={() => changeTab('activeUsers')}
            >
              <TabLabel $mobile> Nutzer</TabLabel>
              <TabLabel $desktop>aktivste Nutzer</TabLabel>
            </TabButton>
            <TabButton
              type="button"
              role="tab"
              id="statistics-tab-popular-flavours"
              aria-controls="statistics-tabpanel"
              aria-selected={activeTab === 'mostPopularFlavours'}
              aria-label="Am häufigsten eingetragene Sorten"
              $active={activeTab === 'mostPopularFlavours'}
              onClick={() => changeTab('mostPopularFlavours')}
            >
              <TabLabel $mobile>Sorten</TabLabel>
              <TabLabel $desktop>häufigste Sorten</TabLabel>
            </TabButton>
            <TabButton
              type="button"
              role="tab"
              id="statistics-tab-price-hierarchy"
              aria-controls="statistics-tabpanel"
              aria-selected={activeTab === 'priceHierarchy'}
              aria-label="Preisübersicht"
              $active={activeTab === 'priceHierarchy'}
              onClick={() => changeTab('priceHierarchy')}
            >
              <TabLabel $mobile>Preise</TabLabel>
              <TabLabel $desktop>Preisübersicht</TabLabel>
            </TabButton>
          </TabContainer>

          <TabContent
            role="tabpanel"
            id="statistics-tabpanel"
            aria-labelledby={`statistics-tab-${activeTab === 'activeUsers' ? 'active-users' : activeTab === 'mostPopularFlavours' ? 'popular-flavours' : 'price-hierarchy'}`}
          >
            {activeTab === 'priceHierarchy' && (<SectionCard>
              <PriceOverviewToolbar>
                <div>
                  <SectionTitle style={{ textAlign: 'left', marginBottom: '0.35rem' }}>
                    Typischer Kugelpreis je Region
                  </SectionTitle>
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
              <PriceOverviewPrimaryMeta>
                {priceStatsMeta?.eligible_shops !== undefined && <MetaPill $accent>{priceStatsMeta.eligible_shops} Eisdielen mit Preis</MetaPill>}
                {searchActive && <MetaPill>Suche: „{priceSearch.trim()}“</MetaPill>}
              </PriceOverviewPrimaryMeta>
              <PriceDataBasisToggle
                type="button"
                onClick={() => setShowPriceDataBasis((current) => !current)}
                aria-expanded={showPriceDataBasis}
              >
                <span><History size={15} aria-hidden="true" /> Datenbasis · Stand {formatPriceDate(priceStatsMeta?.latest_reported_at) || formatPriceDate(priceStatsMeta?.newest_reported_at) || 'unbekannt'}</span>
                <ChevronDown size={17} aria-hidden="true" />
              </PriceDataBasisToggle>
              {showPriceDataBasis && (
                <PriceDataBasisPanel>
                  <PriceOverviewMeta>
                    <MetaPill>{priceOverviewStats.laender} Länder</MetaPill>
                    <MetaPill>{priceOverviewStats.bundeslaender} Bundesländer</MetaPill>
                    <MetaPill>{priceOverviewStats.landkreise} Landkreise</MetaPill>
                  </PriceOverviewMeta>
                  <PriceDataHint>
                    <Info size={16} aria-hidden="true" />
                    <span>
                      Letzte bekannte Kugelpreise der Community. Auch ältere Preisstände können enthalten sein.
                      {(formatPriceDate(priceStatsMeta?.oldest_reported_at) || formatPriceDate(priceStatsMeta?.oldest_report_date)) && (
                        <> Ältester berücksichtigter Preis: {formatPriceDate(priceStatsMeta?.oldest_reported_at) || formatPriceDate(priceStatsMeta?.oldest_report_date)}.</>
                      )}
                      {Number(priceStatsMeta?.shops_with_report_older_than_180_days || 0) > 0 && (
                        <> {priceStatsMeta.shops_with_report_older_than_180_days} Preisstände sind älter als 180 Tage.</>
                      )}
                    </span>
                  </PriceDataHint>
                </PriceDataBasisPanel>
              )}
              <PriceAnalysisToggle
                type="button"
                onClick={() => setShowPriceAnalysis((current) => !current)}
                $expanded={showPriceAnalysis}
                aria-expanded={showPriceAnalysis}
              >
                <span><SlidersHorizontal size={17} aria-hidden="true" /> Preisverlauf analysieren</span>
                <ChevronDown size={18} aria-hidden="true" />
              </PriceAnalysisToggle>
              {showPriceAnalysis && (
                <PriceAnalysisPanel>
                  <PriceAnalysisHeader>
                    <div>
                      <PriceAnalysisTitle>Preisentwicklung im Zeitverlauf</PriceAnalysisTitle>
                      <PriceOverviewSubline>Typischer Preis zum Monatsende.</PriceOverviewSubline>
                    </div>
                  </PriceAnalysisHeader>
                  <PriceAnalysisControls $primary>
                    <PriceFilterLabel>
                      Land
                      <PriceFilterSelect
                        value={priceTimelineLandId}
                        onChange={(event) => {
                          setPriceTimelineLandId(event.target.value);
                          setPriceTimelineBundeslandId('');
                          setPriceTimelineLandkreisId('');
                        }}
                      >
                        {priceHierarchy.map((land) => (
                          <option key={land.id} value={String(land.id)}>{land.name}</option>
                        ))}
                      </PriceFilterSelect>
                    </PriceFilterLabel>
                    {priceTimelineBundeslaender.length > 0 && (
                      <PriceFilterLabel>
                        Bundesland <span>(optional)</span>
                        <PriceFilterSelect
                          value={priceTimelineBundeslandId}
                          onChange={(event) => {
                            setPriceTimelineBundeslandId(event.target.value);
                            setPriceTimelineLandkreisId('');
                          }}
                        >
                          <option value="">Ganzes Land</option>
                          {priceTimelineBundeslaender.map((bundesland) => (
                            <option key={bundesland.id} value={String(bundesland.id)}>{bundesland.name}</option>
                          ))}
                        </PriceFilterSelect>
                      </PriceFilterLabel>
                    )}
                    {priceTimelineBundesland && priceTimelineLandkreise.length > 0 && (
                      <PriceFilterLabel>
                        Landkreis <span>(optional)</span>
                        <PriceFilterSelect
                          value={priceTimelineLandkreisId}
                          onChange={(event) => setPriceTimelineLandkreisId(event.target.value)}
                        >
                          <option value="">Ganzes Bundesland</option>
                          {priceTimelineLandkreise.map((landkreis) => (
                            <option key={landkreis.id} value={String(landkreis.id)}>{landkreis.name}</option>
                          ))}
                        </PriceFilterSelect>
                      </PriceFilterLabel>
                    )}
                  </PriceAnalysisControls>
                  <TimelineRangeToggle aria-label="Zeitraum für Preisverlauf">
                    <TimelineRangeButton type="button" style={priceTimelineRange === '12m' ? { background: '#ffb522', borderColor: '#ffb522', color: '#2f2100' } : undefined} onClick={() => setPriceTimelineRange('12m')}>12 Monate</TimelineRangeButton>
                    <TimelineRangeButton type="button" style={priceTimelineRange === '3y' ? { background: '#ffb522', borderColor: '#ffb522', color: '#2f2100' } : undefined} onClick={() => setPriceTimelineRange('3y')}>3 Jahre</TimelineRangeButton>
                    <TimelineRangeButton type="button" style={priceTimelineRange === 'all' ? { background: '#ffb522', borderColor: '#ffb522', color: '#2f2100' } : undefined} onClick={() => setPriceTimelineRange('all')}>Seit Beginn</TimelineRangeButton>
                  </TimelineRangeToggle>
                  {priceTimelineLoading ? (
                    <TimelineState>Preisverlauf wird geladen…</TimelineState>
                  ) : priceTimelineError ? (
                    <TimelineState $error>Der Preisverlauf konnte nicht geladen werden.</TimelineState>
                  ) : priceTimeline.length === 0 ? (
                    <TimelineState>Für diese Region liegen noch keine historischen Preisstände vor.</TimelineState>
                  ) : (
                    <TimelineChartWrap>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={priceTimeline}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(47, 33, 0, 0.10)" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={22} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => Number(value).toFixed(2) + ' €'} width={52} />
                          <Tooltip
                            formatter={(value, name, item) => {
                              if (value == null) return ['–', name];
                              const count = name === 'Deutschland' ? item?.payload?.germany_shop_count : item?.payload?.shop_count;
                              return [Number(value).toFixed(2) + ' €' + (count ? ' · ' + count + ' Eisdielen' : ''), name];
                            }}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="median_eur" name={priceTimelineRegion?.name || 'Region'} stroke="#d97706" strokeWidth={3} dot={false} connectNulls={false} />
                          {priceTimelineMeta?.comparison === 'germany' && (
                            <Line type="monotone" dataKey="germany_median_eur" name="Deutschland" stroke="#59758c" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls={false} />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </TimelineChartWrap>
                  )}
                  <AnalysisAdvancedToggle
                    type="button"
                    onClick={() => setShowPriceAdvancedOptions((current) => !current)}
                    aria-expanded={showPriceAdvancedOptions}
                  >
                    <span><SlidersHorizontal size={15} aria-hidden="true" /> Erweiterte Optionen</span>
                    <small>Stand {formatPriceDate(priceTo)} · {priceFreshnessDays === 'all' ? 'alle Preise' : `max. ${priceFreshnessDays} Tage`} · {priceMinShops} Shops</small>
                    <ChevronDown size={17} aria-hidden="true" />
                  </AnalysisAdvancedToggle>
                  {showPriceAdvancedOptions && (
                    <PriceAnalysisControls $advanced>
                      <PriceFilterLabel>
                        Stichtag
                        <PriceFilterInput type="date" value={priceTo} max={today} onChange={(event) => setPriceTo(event.target.value)} />
                      </PriceFilterLabel>
                      <PriceFilterLabel>
                        Aktualität
                        <PriceFilterSelect value={priceFreshnessDays} onChange={(event) => setPriceFreshnessDays(event.target.value)}>
                          <option value="all">Alle letzten Preise</option>
                          <option value="90">max. 90 Tage</option>
                          <option value="180">max. 180 Tage</option>
                          <option value="365">max. 365 Tage</option>
                        </PriceFilterSelect>
                      </PriceFilterLabel>
                      <PriceFilterLabel>
                        Mindestbasis
                        <PriceFilterSelect value={priceMinShops} onChange={(event) => setPriceMinShops(event.target.value)}>
                          <option value="1">1 Eisdiele</option>
                          <option value="3">3 Eisdielen</option>
                          <option value="5">5 Eisdielen</option>
                          <option value="10">10 Eisdielen</option>
                        </PriceFilterSelect>
                      </PriceFilterLabel>
                    </PriceAnalysisControls>
                  )}
                </PriceAnalysisPanel>
              )}
              <TableScrollArea>
              <Table $prioritizeFirstColumn>
                <thead>
                  <tr>
                    <Th>Region</Th>
                    <Th>Typischer Preis (€)</Th>
                    <Th>Eisdielen mit Preis</Th>
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

                      const landPrice = formatPriceDisplay(land);
                      return (
                        <React.Fragment key={landKey}>
                          <PriceTableRow
                            level="land"
                            clickable={landHasChildren}
                            role={landHasChildren ? 'button' : undefined}
                            tabIndex={landHasChildren ? 0 : undefined}
                            aria-expanded={landHasChildren ? landExpanded : undefined}
                            onClick={landHasChildren ? () => toggleNode(landKey) : undefined}
                            onKeyDown={landHasChildren ? (event) => {
                              if (event.target.closest('a')) return;
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                toggleNode(landKey);
                              }
                            } : undefined}
                          >
                            <PriceNameCell>
                              <NameWrapper>
                                <Indent level={0} />
                                {landHasChildren ? (
                                  <ExpandIndicator $expanded={landExpanded}>{landExpanded ? '▾' : '▸'}</ExpandIndicator>
                                ) : <LeafSpacer />}
                                  <RegionTextGroup>
                                    <RegionName>{land.name}</RegionName>
                                    <RegionMeta>{getHierarchyLabel('land')}</RegionMeta>
                                  </RegionTextGroup>
                              </NameWrapper>
                            </PriceNameCell>
                            <PriceValueCell>
                              <PriceValuePill>
                                <PriceMain>{landPrice.euroText}</PriceMain>
                                {landPrice.localText && <PriceSecondary>{landPrice.localText}</PriceSecondary>}
                              </PriceValuePill>
                            </PriceValueCell>
                            <Td><CountPill>{land.anzahl_eisdielen}</CountPill></Td>
                          </PriceTableRow>

                          {landExpanded && bundeslaender.map((bundesland) => {
                            const bundeslandKey = getBundeslandKey(land.id, bundesland.id);
                            const bundeslandExpanded = isExpanded(bundeslandKey);
                            const landkreise = bundesland.landkreise || [];
                            const bundeslandHasChildren = landkreise.length > 0;
                            const bundeslandPrice = formatPriceDisplay(bundesland);

                            return (
                              <React.Fragment key={bundeslandKey}>
                                <PriceTableRow
                                  level="bundesland"
                                  clickable={bundeslandHasChildren}
                                  role={bundeslandHasChildren ? 'button' : undefined}
                                  tabIndex={bundeslandHasChildren ? 0 : undefined}
                                  aria-expanded={bundeslandHasChildren ? bundeslandExpanded : undefined}
                                  onClick={(e) => {
                                    if (bundeslandHasChildren) {
                                      e.stopPropagation();
                                      toggleNode(bundeslandKey);
                                    }
                                  }}
                                  onKeyDown={bundeslandHasChildren ? (event) => {
                                    if (event.target.closest('a')) return;
                                    if (event.key === 'Enter' || event.key === ' ') {
                                      event.preventDefault();
                                      toggleNode(bundeslandKey);
                                    }
                                  } : undefined}
                                >
                                  <PriceNameCell>
                                    <NameWrapper>
                                      <Indent level={1} />
                                      {bundeslandHasChildren ? (
                                        <ExpandIndicator $expanded={bundeslandExpanded}>{bundeslandExpanded ? '▾' : '▸'}</ExpandIndicator>
                                      ) : <LeafSpacer />}
                                      <RegionTextGroup>
                                        <RegionName as={Link} to={`/region/bundesland/${bundesland.id}`} onClick={(event) => event.stopPropagation()}>
                                          {bundesland.name}
                                        </RegionName>
                                        <RegionMeta>{getHierarchyLabel('bundesland')}</RegionMeta>
                                      </RegionTextGroup>
                                    </NameWrapper>
                                  </PriceNameCell>
                                  <PriceValueCell>
                                    <PriceValuePill>
                                      <PriceMain>{bundeslandPrice.euroText}</PriceMain>
                                      {bundeslandPrice.localText && <PriceSecondary>{bundeslandPrice.localText}</PriceSecondary>}
                                    </PriceValuePill>
                                  </PriceValueCell>
                                  <Td><CountPill>{bundesland.anzahl_eisdielen}</CountPill></Td>
                                </PriceTableRow>

                                {bundeslandExpanded && landkreise.map((landkreis) => {
                                  const landkreisPrice = formatPriceDisplay(landkreis);
                                  return (
                                    <PriceTableRow key={`landkreis-${landkreis.id}`} level="landkreis">
                                      <PriceNameCell>
                                        <NameWrapper>
                                          <Indent level={2} />
                                          <LeafSpacer />
                                          <RegionTextGroup>
                                            <RegionName as={Link} to={`/region/landkreis/${landkreis.id}`}>
                                              {landkreis.name}
                                            </RegionName>
                                            <RegionMeta>{getHierarchyLabel('landkreis')}</RegionMeta>
                                          </RegionTextGroup>
                                        </NameWrapper>
                                      </PriceNameCell>
                                      <PriceValueCell>
                                        <PriceValuePill>
                                          <PriceMain>{landkreisPrice.euroText}</PriceMain>
                                          {landkreisPrice.localText && <PriceSecondary>{landkreisPrice.localText}</PriceSecondary>}
                                        </PriceValuePill>
                                      </PriceValueCell>
                                      <Td><CountPill>{landkreis.anzahl_eisdielen}</CountPill></Td>
                                    </PriceTableRow>
                                  );
                                })}
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
              <SectionTitle>Am häufigsten eingetragene Sorten</SectionTitle>
              <FlavourIntro>
                Entdecke, welche Sorten die Community am häufigsten in Check-ins eingetragen hat – und wo sie besonders überzeugend bewertet wurden.
              </FlavourIntro>
              <MobileContent>
                <MobileCardList>
                  {data.mostEatenFlavours.map((entry) => (
                    <MobileFlavourCard key={`${entry.sortenname}__${entry.typ}`}>
                      <FlavourSummaryLink
                        to={`/statistics/flavours/${encodeURIComponent(entry.sortenname)}?type=${encodeURIComponent(entry.typ)}`}
                      >
                        <span>
                          <strong>{entry.sortenname}</strong>
                          <small>{entry.typ}</small>
                        </span>
                        <FlavourCardValues>
                          <span>{entry.anzahl}×</span>
                          <strong>Ø {entry.bewertung !== null ? parseFloat(entry.bewertung).toFixed(2) : '–'}</strong>
                        </FlavourCardValues>
                      </FlavourSummaryLink>
                    </MobileFlavourCard>
                  ))}
                </MobileCardList>
              </MobileContent>
              <DesktopContent>
                <TableScrollArea>
                  <Table $compactColumns>
                    <thead>
                      <tr>
                        <Th>Geschmacksrichtung</Th>
                        <Th>Typ</Th>
                        <Th>Check-ins</Th>
                        <Th>Verschiedene Nutzer</Th>
                        <Th>Ø Bewertung</Th>
                        <Th>Details</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.mostEatenFlavours.map((entry) => (
                        <tr key={`${entry.sortenname}__${entry.typ}`}>
                          <Td>{entry.sortenname}</Td>
                          <Td>{entry.typ}</Td>
                          <Td>{entry.anzahl}</Td>
                          <Td>{entry.verschiedene_nutzer}</Td>
                          <Td>{entry.bewertung !== null ? parseFloat(entry.bewertung).toFixed(2) : '–'}</Td>
                          <Td>
                            <CleanLink to={`/statistics/flavours/${encodeURIComponent(entry.sortenname)}?type=${encodeURIComponent(entry.typ)}`}>
                              Sorten-Details
                            </CleanLink>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableScrollArea>
              </DesktopContent>
            </SectionCard>
            )}


            {activeTab === 'activeUsers' && (
              <SectionCard>
                <SectionHeaderRow>
                  <SectionTitle style={{ marginBottom: 0 }}>Aktivste Nutzer</SectionTitle>
                  <HeaderControls>
                  <PeriodToggle>
                      <ToggleButton
                        type="button"
                        $active={rankingPeriod === 'overall'}
                        onClick={() => {
                          setRankingPeriod('overall');
                          setRankingArchiveKey('');
                        }}
                      >
                        Gesamt
                      </ToggleButton>
                      <ToggleButton
                        type="button"
                        $active={rankingPeriod === 'week'}
                        onClick={() => {
                          setRankingPeriod('week');
                          setRankingArchiveKey('');
                        }}
                      >
                        Woche
                      </ToggleButton>
                      <ToggleButton
                        type="button"
                        $active={rankingPeriod === 'month'}
                        onClick={() => {
                          setRankingPeriod('month');
                          setRankingArchiveKey('');
                        }}
                      >
                        Monat
                      </ToggleButton>
                  </PeriodToggle>
                  {rankingPeriod !== 'overall' && (
                    <ArchiveSelect
                      value={rankingArchiveKey || (rankingsData?.period_meta?.key ?? '')}
                      onChange={(event) => setRankingArchiveKey(event.target.value)}
                    >
                      {archiveOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </ArchiveSelect>
                  )}
                  {ownRankingRank !== null && (
                    <JumpToOwnRank type="button" onClick={jumpToOwnRank}>
                      Zu deinem Rang #{ownRankingRank} <ChevronDown size={15} aria-hidden="true" />
                    </JumpToOwnRank>
                  )}
                  </HeaderControls>
                </SectionHeaderRow>

                {rankingPeriod === 'month' && (
                  <RankingDisclaimer>
                    Diese Monatsrangliste entspricht nicht automatisch der Wertung für den User of the Month.
                  </RankingDisclaimer>
                )}

                {rankingPeriod !== 'overall' && rankingsLoading ? (
                  <EmptyText>Lade Rankings…</EmptyText>
                ) : rankingPeriod === 'overall' ? (
                  <>
                    <MobileContent>
                      <MobileCardList>
                        {overallLeaderboard.map((entry, index) => {
                          const key = `overall-${entry.nutzer_id}`;
                          const isExpanded = expandedRankingEntry === key;
                          return (
                            <MobileRankingCard
                              key={key}
                              id={Number(userId) === Number(entry.nutzer_id) ? 'statistics-current-user-mobile' : undefined}
                              tabIndex={Number(userId) === Number(entry.nutzer_id) ? -1 : undefined}
                              $highlighted={Number(userId) === Number(entry.nutzer_id)}
                            >
                              <RankingCardTop>
                                <RankingPosition>#{index + 1}</RankingPosition>
                                <UserInfo>
                                  <UserAvatar size={38} userId={entry.nutzer_id} name={entry.username} avatarUrl={entry.avatar_url} />
                                  <UserLink to={`/user/${entry.nutzer_id}`}>{entry.username}</UserLink>
                                  <LevelTag>Level {entry.current_level || 1}</LevelTag>
                                  {Number(userId) === Number(entry.nutzer_id) && <CurrentUserTag>Du</CurrentUserTag>}
                                </UserInfo>
                                <RankingPoints><strong>{entry.ep_gesamt}</strong><small>EP</small></RankingPoints>
                              </RankingCardTop>
                              <RankingCardDetailsToggle type="button" onClick={() => setExpandedRankingEntry(isExpanded ? null : key)} aria-expanded={isExpanded}>
                                Details <ChevronDown size={16} aria-hidden="true" />
                              </RankingCardDetailsToggle>
                              {isExpanded && (
                                <RankingDetailsGrid>
                                  <span>Check-ins <strong>{entry.anzahl_checkins}</strong></span>
                                  <span>Bewertungen <strong>{entry.anzahl_bewertungen}</strong></span>
                                  <span>Preismeldungen <strong>{entry.anzahl_preismeldungen}</strong></span>
                                  <span>Routen <strong>{entry.anzahl_routen}</strong></span>
                                  <span>Eisdielen-EP <strong>{entry.ep_eisdielen}</strong></span>
                                  <span>Awards-EP <strong>{entry.ep_awards}</strong></span>
                                </RankingDetailsGrid>
                              )}
                            </MobileRankingCard>
                          );
                        })}
                      </MobileCardList>
                    </MobileContent>
                    <DesktopContent>
                      <TableScrollArea>
                        <Table $stickyFirstColumn>
                          <thead>
                            <tr>
                              <Th>Rang</Th>
                              <Th>Nutzer</Th>
                              <Th>Level</Th>
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
                            {overallLeaderboard.map((entry, index) => (
                              <RankingTableRow
                                key={entry.nutzer_id}
                                id={Number(userId) === Number(entry.nutzer_id) ? 'statistics-current-user-desktop' : undefined}
                                tabIndex={Number(userId) === Number(entry.nutzer_id) ? -1 : undefined}
                                $highlighted={Number(userId) === Number(entry.nutzer_id)}
                              >
                                <Td><strong>#{index + 1}</strong></Td>
                                <Td>
                                  <UserInfo>
                                    <UserAvatar size={34} userId={entry.nutzer_id} name={entry.username} avatarUrl={entry.avatar_url} />
                                    <UserLink to={`/user/${entry.nutzer_id}`}>{entry.username}</UserLink>
                                    {Number(userId) === Number(entry.nutzer_id) && <CurrentUserTag>Du</CurrentUserTag>}
                                  </UserInfo>
                                </Td>
                                <Td>Level {entry.current_level || 1}</Td>
                                <Td><strong>{entry.ep_gesamt}</strong></Td>
                                <Td>{entry.anzahl_checkins} ({(entry.ep_checkins_ohne_bild + entry.ep_checkins_mit_bild)}EP)</Td>
                                <Td>{entry.anzahl_bewertungen} ({entry.ep_bewertungen}EP)</Td>
                                <Td>{entry.anzahl_preismeldungen} ({entry.ep_preismeldungen}EP)</Td>
                                <Td>{entry.anzahl_routen} ({entry.ep_routen}EP)</Td>
                                <Td>{entry.ep_eisdielen} EP</Td>
                                <Td>{entry.ep_geworbene_nutzer} EP</Td>
                                <Td>{entry.ep_awards} EP</Td>
                              </RankingTableRow>
                            ))}
                          </tbody>
                        </Table>
                      </TableScrollArea>
                    </DesktopContent>
                  </>
                ) : (
                  <>
                    {hasRankingEntries ? (
                      <>
                        <MobileContent>
                          <MobileCardList>
                            {(rankingsData?.leaderboard || []).map((entry) => {
                              const key = `period-${entry.user_id}`;
                              const isExpanded = expandedRankingEntry === key;
                              const checkins = (entry.counts.checkins_with_photo || 0) + (entry.counts.checkins_without_photo || 0);
                              return (
                                <MobileRankingCard
                                  key={key}
                                  id={Number(userId) === Number(entry.user_id) ? 'statistics-current-user-mobile' : undefined}
                                  tabIndex={Number(userId) === Number(entry.user_id) ? -1 : undefined}
                                  $highlighted={Number(userId) === Number(entry.user_id)}
                                >
                                  <RankingCardTop>
                                    <RankingPosition>#{entry.rank}</RankingPosition>
                                    <UserInfo>
                                      <UserAvatar size={38} userId={entry.user_id} name={entry.username} avatarUrl={entry.avatar_url} />
                                      <UserLink to={`/user/${entry.user_id}`}>{entry.username}</UserLink>
                                      {Number(userId) === Number(entry.user_id) && <CurrentUserTag>Du</CurrentUserTag>}
                                    </UserInfo>
                                    <RankingPoints><strong>{entry.total_ep}</strong><small>EP</small></RankingPoints>
                                  </RankingCardTop>
                                  <RankingCardDetailsToggle type="button" onClick={() => setExpandedRankingEntry(isExpanded ? null : key)} aria-expanded={isExpanded}>
                                    Details <ChevronDown size={16} aria-hidden="true" />
                                  </RankingCardDetailsToggle>
                                  {isExpanded && (
                                    <RankingDetailsGrid>
                                      <span>Check-ins <strong>{checkins}</strong><small>{entry.points.checkins || 0} EP</small></span>
                                      <span>Bewertungen <strong>{entry.counts.reviews || 0}</strong><small>{entry.points.reviews || 0} EP</small></span>
                                      <span>Preise <strong>{entry.counts.price_reports || 0}</strong><small>{entry.points.price_reports || 0} EP</small></span>
                                      <span>Routen <strong>{entry.counts.routes || 0}</strong><small>{entry.points.routes || 0} EP</small></span>
                                      <span>Eisdielen <strong>{entry.counts.shops || 0}</strong><small>{entry.points.shops || 0} EP</small></span>
                                      <span>Awards <strong>{entry.counts.awards_ep || 0}</strong><small>{entry.points.awards || 0} EP</small></span>
                                    </RankingDetailsGrid>
                                  )}
                                </MobileRankingCard>
                              );
                            })}
                          </MobileCardList>
                        </MobileContent>
                        <DesktopContent>
                          <TableScrollArea>
                            <Table $stickyFirstColumn>
                              <thead>
                                <tr>
                                  <Th>Rang</Th>
                                  <Th>Nutzer</Th>
                                  <Th>EP</Th>
                                  <Th>Check-ins</Th>
                                  <Th>Bewertungen</Th>
                                  <Th>Preise</Th>
                                  <Th>Routen</Th>
                                  <Th>Eisdielen</Th>
                                  <Th>Awards</Th>
                                  <Th>Einladungen</Th>
                                </tr>
                              </thead>
                              <tbody>
                                {(rankingsData?.leaderboard || []).map((entry) => (
                                  <RankingTableRow
                                    key={`period-${entry.user_id}`}
                                    id={Number(userId) === Number(entry.user_id) ? 'statistics-current-user-desktop' : undefined}
                                    tabIndex={Number(userId) === Number(entry.user_id) ? -1 : undefined}
                                    $highlighted={Number(userId) === Number(entry.user_id)}
                                  >
                                    <Td><strong>#{entry.rank}</strong></Td>
                                    <Td>
                                      <UserInfo>
                                        <UserAvatar size={34} userId={entry.user_id} name={entry.username} avatarUrl={entry.avatar_url} />
                                        <UserLink to={`/user/${entry.user_id}`}>{entry.username}</UserLink>
                                        {Number(userId) === Number(entry.user_id) && <CurrentUserTag>Du</CurrentUserTag>}
                                      </UserInfo>
                                    </Td>
                                    <Td><strong>{entry.total_ep}</strong></Td>
                                    <Td>{(entry.counts.checkins_with_photo || 0) + (entry.counts.checkins_without_photo || 0)}<CellSubline>{entry.points.checkins || 0} EP</CellSubline></Td>
                                    <Td>{entry.counts.reviews || 0}<CellSubline>{entry.points.reviews || 0} EP</CellSubline></Td>
                                    <Td>{entry.counts.price_reports || 0}<CellSubline>{entry.points.price_reports || 0} EP</CellSubline></Td>
                                    <Td>{entry.counts.routes || 0}<CellSubline>{entry.points.routes || 0} EP</CellSubline></Td>
                                    <Td>{entry.counts.shops || 0}<CellSubline>{entry.points.shops || 0} EP</CellSubline></Td>
                                    <Td>{entry.points.awards || 0}<CellSubline>{entry.counts.awards_ep || 0} EP</CellSubline></Td>
                                    <Td>{entry.points.invites || 0}<CellSubline>{entry.counts.invites_ep || 0} EP</CellSubline></Td>
                                  </RankingTableRow>
                                ))}
                              </tbody>
                            </Table>
                          </TableScrollArea>
                        </DesktopContent>
                      </>
                    ) : (
                      <EmptyRankingNotice>{emptyRankingMessage}</EmptyRankingNotice>
                    )}
                  </>
                )}
              </SectionCard>
            )}
          </TabContent>
        </Container>
    </StatisticsPage>
  )
}

export default Statistics;

const StatisticsPage = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(255, 218, 140, 0.32), transparent 45%),
    linear-gradient(180deg, #fffaf0 0%, #fff7e7 100%);
`;

const Container = styled.div`
  min-height: calc(100vh - 72px);
  gap: 1rem;
  width: min(96%, 1480px);
  box-sizing: border-box;
  margin: 0 auto;
  padding-top: 0.5rem;
`;

const Title = styled.h2`
  font-size: clamp(1.35rem, 2vw, 1.8rem);
  font-weight: 800;
  margin: 0;
  text-align: center;
  color: #2f2100;
`;

const PageHeader = styled.header`
  padding: 0.7rem 0.25rem 0.5rem;
  margin-bottom: 0.25rem;

  @media (max-width: 700px) {
    padding: 0.55rem 0.1rem 0.35rem;
    margin-bottom: 0.35rem;
  }
`;

const StatisticsState = styled.main`
  min-height: calc(100vh - 72px);
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 0.55rem;
  padding: 1.5rem;
  color: ${({ $error }) => ($error ? '#a63d2a' : '#6c4c13')};
  text-align: center;

  span {
    font-size: 0.92rem;
    font-weight: 700;
  }
`;

const LoadingSpinner = styled.span`
  width: 28px;
  height: 28px;
  border: 3px solid rgba(255, 181, 34, 0.28);
  border-top-color: #c47700;
  border-radius: 50%;
  animation: statistics-loading-spin 0.8s linear infinite;

  @keyframes statistics-loading-spin {
    to { transform: rotate(360deg); }
  }
`;

const HeroSubtitle = styled.p`
  margin: 0.35rem 0 0;
  text-align: center;
  color: rgba(47, 33, 0, 0.68);
  font-size: 0.95rem;

  @media (max-width: 700px) {
    display: ${({ $expanded }) => ($expanded ? 'block' : 'none')};
    margin-top: 0.55rem;
    font-size: 0.86rem;
  }
`;

const PageInfoToggle = styled.button`
  display: none;

  @media (max-width: 700px) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    width: 100%;
    min-height: 32px;
    margin-top: 0.2rem;
    border: 0;
    background: transparent;
    color: #7a560e;
    font: inherit;
    font-size: 0.78rem;
    font-weight: 700;
  }
`;

const SectionHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
  padding: 0 1rem 0.9rem;
  flex-wrap: wrap;

  @media (max-width: 700px) {
    align-items: stretch;
    padding: 0 0.85rem 0.75rem;

    h3 {
      width: 100%;
      text-align: left;
    }
  }
`;

const HeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;

  @media (max-width: 700px) {
    width: 100%;
    display: grid;
    gap: 0.5rem;
  }
`;

const PeriodToggle = styled.div`
  display: inline-flex;
  background: rgba(47, 33, 0, 0.05);
  border-radius: 999px;
  padding: 4px;

  @media (max-width: 700px) {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
`;

const ArchiveSelect = styled.select`
  border: 1px solid rgba(47, 33, 0, 0.14);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.95);
  color: #2f2100;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  min-width: 180px;

  @media (max-width: 700px) {
    width: 100%;
    min-height: 44px;
  }
`;

const JumpToOwnRank = styled.button`
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.28rem;
  padding: 0.45rem 0.7rem;
  border: 1px solid rgba(255, 181, 34, 0.42);
  border-radius: 10px;
  background: rgba(255, 244, 217, 0.68);
  color: #754500;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;

  &:hover {
    background: rgba(255, 232, 178, 0.8);
  }

  &:focus-visible {
    outline: 3px solid rgba(255, 181, 34, 0.44);
    outline-offset: 2px;
  }

  @media (max-width: 700px) {
    width: 100%;
    min-height: 44px;
  }
`;

const ToggleButton = styled.button`
  border: none;
  border-radius: 999px;
  padding: 0.5rem 0.9rem;
  background: ${({ $active }) => ($active ? '#ffb522' : 'transparent')};
  color: ${({ $active }) => ($active ? '#2f2100' : '#6b5327')};
  font-weight: 800;
  cursor: pointer;

  @media (max-width: 700px) {
    min-height: 36px;
    padding: 0.45rem 0.4rem;
  }
`;

const EmptyRankingNotice = styled.div`
  margin: 0 1rem 1rem;
  padding: 1rem 1.1rem;
  border-radius: 16px;
  background: rgba(255, 248, 230, 0.9);
  border: 1px solid rgba(217, 119, 6, 0.16);
  color: #7c4a03;
  font-weight: 700;
  line-height: 1.45;
`;

const RankingDisclaimer = styled.div`
  margin: 0 1rem 1rem;
  padding: 0.9rem 1rem;
  border-radius: 14px;
  background: rgba(255, 251, 235, 0.95);
  border: 1px solid rgba(180, 83, 9, 0.16);
  color: #8a4b04;
  font-size: 0.92rem;
  line-height: 1.45;

  @media (max-width: 700px) {
    margin: 0 0.75rem 0.75rem;
    padding: 0.75rem 0.8rem;
    font-size: 0.82rem;
  }
`;

const CellSubline = styled.div`
  margin-top: 0.15rem;
  color: rgba(47, 33, 0, 0.62);
  font-size: 0.74rem;
  line-height: 1.2;
`;

const SectionCard = styled.div`
  background: rgba(255, 252, 243, 0.94);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.08);
  padding: 1rem 0rem 0rem 0rem;
  min-width: 0;

  @media (max-width: 700px) {
    border-radius: 14px;
    padding-top: 0.8rem;
  }
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
  padding: 0 1rem;

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

const PriceOverviewPrimaryMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin: 0 0.85rem 0.55rem;
`;

const PriceDataBasisToggle = styled.button`
  width: calc(100% - 2rem);
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  margin: 0 1rem 0.65rem;
  padding: 0.45rem 0;
  border: 0;
  border-top: 1px solid rgba(47, 33, 0, 0.08);
  background: transparent;
  color: #765116;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-width: 0;
  }

  &:focus-visible {
    outline: 3px solid rgba(255, 181, 34, 0.42);
    outline-offset: 2px;
  }
`;

const PriceDataBasisPanel = styled.div`
  margin: -0.25rem 1rem 0.75rem;
  padding: 0.7rem;
  border-radius: 10px;
  background: rgba(255, 248, 230, 0.68);
`;

const PriceOverviewMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin: 0 0 0.55rem;
`;

const PriceDataHint = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  margin: 0;
  color: rgba(95, 63, 0, 0.72);
  font-size: 0.78rem;
  line-height: 1.4;
`;

const PriceAnalysisToggle = styled.button`
  width: calc(100% - 2rem);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 0 1rem 0.85rem;
  padding: 0.65rem 0.8rem;
  border: 1px solid rgba(217, 119, 6, 0.24);
  border-radius: 11px;
  background: rgba(255, 244, 217, 0.68);
  color: #754500;
  cursor: pointer;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 800;
  min-height: 44px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }

  &:hover {
    background: rgba(255, 232, 178, 0.8);
  }
`;

const PriceAnalysisPanel = styled.section`
  margin: 0 1rem 1rem;
  padding: 1rem;
  border: 1px solid rgba(217, 119, 6, 0.2);
  border-radius: 14px;
  background: linear-gradient(145deg, rgba(255, 251, 240, 0.96), rgba(255, 244, 217, 0.66));
`;

const PriceAnalysisHeader = styled.div`
  margin-bottom: 0.9rem;
`;

const PriceAnalysisTitle = styled.h4`
  margin: 0 0 0.25rem;
  color: #593700;
  font-size: 1rem;
`;

const PriceAnalysisControls = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.65rem;

  ${({ $advanced }) => $advanced && `
    margin-top: 0.65rem;
    padding-top: 0.65rem;
    border-top: 1px solid rgba(217, 119, 6, 0.16);
  `}
`;

const TimelineRangeToggle = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.85rem;
`;

const TimelineRangeButton = styled.button`
  border: 1px solid rgba(95, 63, 0, 0.16);
  border-radius: 999px;
  padding: 0.35rem 0.7rem;
  background: rgba(255, 255, 255, 0.72);
  color: #6a4908;
  cursor: pointer;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  min-height: 36px;
`;

const TimelineState = styled.div`
  margin-top: 0.9rem;
  padding: 1rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.62);
  color: #75521b;
  font-size: 0.9rem;
  text-align: center;
`;

const TimelineChartWrap = styled.div`
  height: 255px;
  margin-top: 0.9rem;
  padding: 0.35rem 0 0;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.62);
`;

const AnalysisAdvancedToggle = styled.button`
  width: 100%;
  min-height: 42px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.85rem;
  padding: 0.45rem 0;
  border: 0;
  border-top: 1px solid rgba(217, 119, 6, 0.16);
  background: transparent;
  color: #754500;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
  text-align: left;

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  small {
    color: rgba(95, 63, 0, 0.68);
    font-size: 0.7rem;
    font-weight: 600;
    text-align: right;
  }

  &:focus-visible {
    outline: 3px solid rgba(255, 181, 34, 0.42);
    outline-offset: 2px;
  }
`;

const PriceFilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  padding: 0 1rem;
  margin: 0 0 0.75rem;
`;

const PriceFilterLabel = styled.label`
  display: grid;
  gap: 0.2rem;
  color: rgba(47, 33, 0, 0.72);
  font-size: 0.75rem;
  font-weight: 800;
`;

const PriceFilterInput = styled.input`
  min-height: 2.75rem;
  border: 1px solid rgba(47, 33, 0, 0.16);
  border-radius: 9px;
  padding: 0.35rem 0.5rem;
  color: #2f2100;
  background: #fff;
`;

const PriceFilterSelect = styled.select`
  width: 100%;
  min-height: 2.75rem;
  border: 1px solid rgba(47, 33, 0, 0.16);
  border-radius: 9px;
  padding: 0.35rem 0.5rem;
  color: #2f2100;
  background: #fff;
  font: inherit;
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

    ${({ $prioritizeFirstColumn }) =>
      $prioritizeFirstColumn &&
      `
      min-width: 100%;
      table-layout: fixed;

      th,
      td {
        padding: 0.55rem 0.45rem;
      }

      th {
        white-space: normal;
        line-height: 1.2;
      }

      th:first-child,
      td:first-child {
        width: 58%;
        min-width: 58%;
        max-width: 58%;
      }

      th:nth-child(2),
      td:nth-child(2) {
        width: 24%;
        min-width: 24%;
        max-width: 24%;
      }

      th:nth-child(3),
      td:nth-child(3) {
        width: 18%;
        min-width: 18%;
        max-width: 18%;
      }
    `}

    th:first-child,
    td:first-child {
      width: 120px;
      min-width: 120px;
      max-width: 120px;
    }

    ${({ $prioritizeFirstColumn }) =>
      $prioritizeFirstColumn &&
      `
      th:first-child,
      td:first-child {
        width: 58%;
        min-width: 58%;
        max-width: 58%;
      }
    `}

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

const RankingTableRow = styled.tr`
  td {
    background: ${({ $highlighted }) => ($highlighted ? 'rgba(255, 181, 34, 0.18)' : 'rgba(255, 255, 255, 0.97)')};
    transition: background-color 0.18s ease;
  }

  td:first-child {
    background: ${({ $highlighted }) => ($highlighted ? 'rgba(255, 181, 34, 0.24)' : 'rgba(255, 255, 255, 0.97)')};
  }

  &:hover td {
    background: ${({ $highlighted }) => ($highlighted ? 'rgba(255, 181, 34, 0.24)' : 'rgba(255, 248, 230, 0.82)')};
  }

  ${({ $highlighted }) => $highlighted && `
    td {
      color: #6f3c00;
      font-weight: 700;
    }
  `}
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
  margin-bottom: 0.4rem;
  padding: 0.35rem;
  background: rgba(255, 255, 255, 0.38);
  border: 1px solid rgba(47, 33, 0, 0.06);
  border-radius: 14px;
  box-shadow: none;

  @media (max-width: 700px) {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.2rem;
    margin-bottom: 0.65rem;
    padding: 0.25rem;
    border-radius: 12px;
  }
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

  &:focus-visible {
    outline: 3px solid rgba(255, 181, 34, 0.48);
    outline-offset: 2px;
  }

  @media (max-width: 700px) {
    min-height: 42px;
    padding: 0.45rem 0.25rem;
    font-size: 0.87rem;
  }
`;

const TabLabel = styled.span`
  display: ${({ $mobile }) => ($mobile ? 'none' : 'inline')};

  @media (max-width: 700px) {
    display: ${({ $mobile }) => ($mobile ? 'inline' : 'none')};
  }
`;


const TabContent = styled.div`
  margin-top: 0.45rem;
  display: grid;
  gap: 1rem;
  min-width: 0;
`;

const MobileContent = styled.div`
  display: none;

  @media (max-width: 700px) {
    display: block;
  }
`;

const DesktopContent = styled.div`
  display: block;

  @media (max-width: 700px) {
    display: none;
  }
`;

const MobileCardList = styled.div`
  display: grid;
  gap: 0.55rem;
  padding: 0 0.75rem 0.75rem;
`;

const MobileFlavourCard = styled.article`
  overflow: hidden;
  border: 1px solid rgba(47, 33, 0, 0.09);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.76);
`;

const FlavourIntro = styled.p`
  max-width: 720px;
  margin: -0.35rem auto 1rem;
  padding: 0 1rem;
  color: rgba(47, 33, 0, 0.72);
  font-size: 0.88rem;
  line-height: 1.5;
  text-align: center;
`;

const FlavourSummaryLink = styled(Link)`
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.65rem 0.7rem;
  color: #2f2100;
  text-decoration: none;

  > span:first-child {
    display: grid;
    gap: 0.08rem;
    min-width: 0;
  }

  strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    color: rgba(95, 63, 0, 0.68);
    font-size: 0.75rem;
  }

  &:hover {
    background: rgba(255, 181, 34, 0.12);
  }

  &:focus-visible {
    outline: 3px solid rgba(255, 181, 34, 0.52);
    outline-offset: -3px;
  }
`;

const FlavourCardValues = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  flex-shrink: 0;
  color: #704600;
  font-size: 0.78rem;

  strong {
    padding: 0.22rem 0.4rem;
    border-radius: 999px;
    background: rgba(255, 181, 34, 0.14);
  }
`;




const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
`;

const CurrentUserTag = styled.span`
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  padding: 0.12rem 0.38rem;
  border-radius: 999px;
  background: rgba(255, 181, 34, 0.3);
  color: #6f3c00;
  font-size: 0.68rem;
  font-weight: 800;
`;

const LevelTag = styled.span`
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  padding: 0.12rem 0.38rem;
  border-radius: 999px;
  background: rgba(47, 33, 0, 0.06);
  color: #6b5327;
  font-size: 0.68rem;
  font-weight: 800;
`;

const MobileRankingCard = styled.article`
  border: 1px solid ${({ $highlighted }) => ($highlighted ? 'rgba(255, 181, 34, 0.45)' : 'rgba(47, 33, 0, 0.09)')};
  border-radius: 12px;
  background: ${({ $highlighted }) => ($highlighted ? 'rgba(255, 244, 217, 0.66)' : 'rgba(255, 255, 255, 0.76)')};
  overflow: hidden;
`;

const RankingCardTop = styled.div`
  min-height: 58px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.55rem;
  padding: 0.6rem 0.7rem 0.35rem;
`;

const RankingPosition = styled.strong`
  min-width: 2.2rem;
  color: #754500;
  font-size: 1rem;
`;

const RankingPoints = styled.span`
  display: grid;
  justify-items: end;
  line-height: 1;
  color: #754500;

  strong {
    font-size: 1.05rem;
  }

  small {
    margin-top: 0.12rem;
    color: rgba(95, 63, 0, 0.66);
    font-size: 0.68rem;
    font-weight: 700;
  }
`;

const RankingCardDetailsToggle = styled.button`
  width: calc(100% - 1.4rem);
  min-height: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0.7rem;
  padding: 0.2rem 0;
  border: 0;
  border-top: 1px solid rgba(47, 33, 0, 0.08);
  background: transparent;
  color: #795817;
  font: inherit;
  font-size: 0.76rem;
  font-weight: 800;
  cursor: pointer;

  &:focus-visible {
    outline: 3px solid rgba(255, 181, 34, 0.5);
    outline-offset: 2px;
  }
`;

const RankingDetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.4rem;
  padding: 0.55rem 0.7rem 0.7rem;
  background: rgba(255, 248, 230, 0.62);

  span {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.25rem;
    color: rgba(47, 33, 0, 0.72);
    font-size: 0.72rem;
  }

  strong {
    color: #2f2100;
  }

  small {
    grid-column: 1 / -1;
    color: #8a600c;
    font-size: 0.68rem;
  }
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

  @media (max-width: 700px) {
    min-height: 44px;
    max-width: none;
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

  &:focus-visible td {
    outline: 2px solid #ffb522;
    outline-offset: -2px;
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
  min-height: 36px;
  min-width: 0;
`;

const RegionName = styled.span`
  font-weight: 700;
  color: #2f2100;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  text-decoration: none;
`;

const RegionTextGroup = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 0.1rem;
`;

const RegionMeta = styled.span`
  font-size: 0.72rem;
  color: rgba(95, 63, 0, 0.75);
  line-height: 1.1;
`;

const Indent = styled.span`
  display: inline-block;
  width: ${(props) => (props.level || 0) * 1.5}rem;
  flex-shrink: 0;
`;

const ExpandIndicator = styled.span`
  display: inline-grid;
  place-items: center;
  width: 1.65rem;
  height: 1.65rem;
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
  width: 1.65rem;
`;

const PriceValueCell = styled(Td)`
  white-space: normal;
`;

const PriceValuePill = styled.span`
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.08rem;
  padding: 0.28rem 0.55rem;
  border-radius: 14px;
  background: rgba(255, 181, 34, 0.12);
  border: 1px solid rgba(255, 181, 34, 0.22);
  color: #7a4a00;
  min-width: 72px;
  max-width: 100%;
`;

const PriceMain = styled.span`
  font-weight: 800;
  line-height: 1.15;
`;

const PriceSecondary = styled.span`
  font-size: 0.74rem;
  line-height: 1.1;
  color: rgba(122, 74, 0, 0.78);
  white-space: normal;
  overflow-wrap: anywhere;
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
