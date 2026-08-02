import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import Header from "../Header";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { formatOpeningHoursLines, hydrateOpeningHours } from "../utils/openingHours";
import { formatDateTimeLocalInputValue } from "../utils/dateTimeLocal";
import Seo from "../components/Seo";
import { Calculator, ChartNoAxesCombined, ChevronDown, ChevronUp, MapPin, ShieldCheck, SlidersHorizontal, Trophy, UsersRound } from "lucide-react";

const EARTH_RADIUS_KM = 6371;
const toRadians = (value) => (value * Math.PI) / 180;
const RANKING_TYPES = new Set(['kugel', 'softeis', 'eisbecher']);
const RANKING_SCOPES = new Set(['global', 'gourmetCyclist', 'personal']);
const RANKING_DISTANCES = new Set(['2', '5', '10', '25', '50']);
const RANKING_SORT_KEYS = new Set(['ranking_score', 'taste_factor', 'avg_preisleistung', 'nutzeranzahl', 'kugel_preis_eur', 'softeis_preis_eur']);

const parseAttributeIds = (value) => Array.from(new Set(
    String(value || '')
        .split(',')
        .map((id) => Number.parseInt(id, 10))
        .filter((id) => Number.isInteger(id) && id > 0)
)).sort((a, b) => a - b);

const getDefaultSortDirection = (key) => (
    key === 'kugel_preis_eur' || key === 'softeis_preis_eur' ? 'ascending' : 'descending'
);

const readRankingUrlState = (search, { hasUser, hasLocation }) => {
    const params = new URLSearchParams(search);
    const type = RANKING_TYPES.has(params.get('type')) ? params.get('type') : 'kugel';
    const requestedScope = params.get('scope');
    const scope = RANKING_SCOPES.has(requestedScope) && (requestedScope !== 'personal' || hasUser)
        ? requestedScope
        : 'global';
    const isSingleRaterScope = scope === 'personal' || scope === 'gourmetCyclist';
    const requestedSort = params.get('sort');
    const priceSortForType = type === 'softeis' ? 'softeis_preis_eur' : 'kugel_preis_eur';
    const sortIsValid = RANKING_SORT_KEYS.has(requestedSort)
        && !(type === 'eisbecher' && ['kugel_preis_eur', 'softeis_preis_eur'].includes(requestedSort))
        && !(['kugel_preis_eur', 'softeis_preis_eur'].includes(requestedSort) && requestedSort !== priceSortForType);
    const sort = sortIsValid ? requestedSort : 'ranking_score';
    const requestedDirection = params.get('dir');
    const direction = requestedDirection === 'ascending' || requestedDirection === 'descending'
        ? requestedDirection
        : getDefaultSortDirection(sort);
    const requestedDistance = params.get('distance');
    const openMode = params.get('open');
    const openAt = params.get('open_at') || '';

    return {
        type,
        q: params.get('q') || '',
        distance: hasLocation && RANKING_DISTANCES.has(requestedDistance) ? requestedDistance : 'any',
        scope,
        reliability: isSingleRaterScope ? 'all' : (params.get('reliability') === 'all' ? 'all' : 'reliable'),
        favorites: hasUser && params.get('favorites') === '1',
        openMode: openMode === 'now' ? 'now' : (openMode === 'at' && openAt ? 'custom' : 'all'),
        openAt,
        attributes: parseAttributeIds(params.get('attributes')),
        sort,
        direction,
    };
};

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
    const latDiff = toRadians(lat2 - lat1);
    const lonDiff = toRadians(lon2 - lon1);
    const a =
        Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(lonDiff / 2) * Math.sin(lonDiff / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(EARTH_RADIUS_KM * c * 10) / 10;
};

const rankingExplanationCopy = {
    kugel: {
        label: 'Kugeleis',
        individual: 'Der Geschmacksfaktor besteht bei vorhandener Waffel zu 80 % aus Geschmack und zu 20 % aus Waffel. Er zählt zu 70 %, Preis-Leistung – ersatzweise die Größenbewertung – zu 30 %.',
        reliability: 'Mindestens 3 unterschiedliche Nutzer',
        stabilizer: 3,
    },
    softeis: {
        label: 'Softeis',
        individual: 'Der Geschmacksfaktor besteht bei vorhandener Waffel zu 80 % aus Geschmack und zu 20 % aus Waffel. Er zählt zu 70 %, die direkt bewertete Preis-Leistung zu 30 %.',
        reliability: 'Mindestens 2 unterschiedliche Nutzer',
        stabilizer: 2,
    },
    eisbecher: {
        label: 'Eisbecher',
        individual: 'Geschmack zählt zu 70 %, die direkt bewertete Preis-Leistung zu 30 %.',
        reliability: 'Mindestens 2 unterschiedliche Nutzer',
        stabilizer: 2,
    },
};

const rankingStepIconStyles = {
    amber: { color: '#8a5000', background: 'rgba(255, 181, 34, 0.2)' },
    blue: { color: '#155d8d', background: 'rgba(77, 169, 224, 0.18)' },
    violet: { color: '#5b3f9a', background: 'rgba(143, 108, 214, 0.16)' },
    green: { color: '#176844', background: 'rgba(71, 177, 117, 0.17)' },
};

const RankingScoreExplanation = ({ type, isSingleRaterScope }) => {
    const copy = rankingExplanationCopy[type];

    return (
        <Explanation>
            <ScoreExplanation>
                <ExplanationKicker>{isSingleRaterScope ? 'Transparentes Einzelrating' : 'Transparentes Community-Ranking'}</ExplanationKicker>
                <ExplanationTitle>So entsteht das {copy.label}-Ranking</ExplanationTitle>
                <ExplanationLead>
                    {isSingleRaterScope
                        ? 'Die Spalte „Ranking“ entspricht dem Durchschnitt deiner Check-ins für diese Eisdiele.'
                        : 'Die Spalte „Ranking“ zeigt einen stabilisierten Score. Er belohnt gute Bewertungen, ohne einzelne oder wenige Bewertungen zu stark zu überbewerten.'}
                </ExplanationLead>

                <ExplanationSteps>
                    <ExplanationStep>
                        <StepIcon style={rankingStepIconStyles.amber}><Calculator size={20} aria-hidden="true" /></StepIcon>
                        <StepContent>
                            <h3>1. Einzelbewertung</h3>
                            <p>{copy.individual}</p>
                            <Formula>0,7 × Geschmacksfaktor + 0,3 × Preis-Leistung</Formula>
                        </StepContent>
                    </ExplanationStep>

                    {isSingleRaterScope ? (
                        <ExplanationStep>
                            <StepIcon style={rankingStepIconStyles.blue}><UsersRound size={20} aria-hidden="true" /></StepIcon>
                            <StepContent>
                                <h3>2. Durchschnitt deiner Check-ins</h3>
                                <p>Deine Check-ins pro Eisdiele werden gemittelt. Die Anzahl bleibt als Datenbasis sichtbar, verändert den Score aber nicht zusätzlich.</p>
                            </StepContent>
                        </ExplanationStep>
                    ) : (
                        <>
                            <ExplanationStep>
                                <StepIcon style={rankingStepIconStyles.blue}><UsersRound size={20} aria-hidden="true" /></StepIcon>
                                <StepContent>
                                    <h3>2. Fairer Nutzer-Durchschnitt</h3>
                                    <p>Pro Nutzer und Eisdiele werden die Check-ins zunächst gemittelt. Dieses Nutzer-Ergebnis erhält das Gewicht <FormulaInline>√(Anzahl Check-ins)</FormulaInline> – mehr Erfahrung zählt also, aber mit abnehmendem Einfluss.</p>
                                </StepContent>
                            </ExplanationStep>
                            <ExplanationStep>
                                <StepIcon style={rankingStepIconStyles.violet}><ChartNoAxesCombined size={20} aria-hidden="true" /></StepIcon>
                                <StepContent>
                                    <h3>3. Rohwert der Eisdiele</h3>
                                    <p>Die gewichteten Nutzer-Durchschnitte werden zum Rohwert zusammengeführt:</p>
                                    <Formula>Σ(Nutzer-Score × Nutzer-Gewicht) / Σ(Nutzer-Gewichte)</Formula>
                                </StepContent>
                            </ExplanationStep>
                            <ExplanationStep>
                                <StepIcon style={rankingStepIconStyles.green}><ShieldCheck size={20} aria-hidden="true" /></StepIcon>
                                <StepContent>
                                    <h3>4. Stabilisierung nach Nutzerzahl</h3>
                                    <p>Der finale Ranking-Score wird bei wenigen unterschiedlichen Nutzern zum Durchschnitt aller {copy.label}-Eisdielen hingezogen. Mit wachsender Nutzerzahl nähert er sich dem Rohwert an.</p>
                                    <Formula>n/(n + {copy.stabilizer}) × Rohwert + {copy.stabilizer}/(n + {copy.stabilizer}) × Kategorien-Durchschnitt</Formula>
                                </StepContent>
                            </ExplanationStep>
                        </>
                    )}
                </ExplanationSteps>

                <ExplanationNote>
                    <ShieldCheck size={18} aria-hidden="true" />
                    <span>{isSingleRaterScope
                        ? <><strong>Datenbasis:</strong> Die Anzahl deiner Check-ins zeigt, wie oft du die Eisdiele bewertet hast.</>
                        : <><strong>Verlässliche Datenbasis:</strong> Der Standardfilter zeigt nur Eisdielen mit {copy.reliability}. Die Stabilisierung bleibt auch bei „Alle inklusive weniger Daten“ aktiv.</>}</span>
                </ExplanationNote>
            </ScoreExplanation>
        </Explanation>
    );
};

const Ranking = () => {
    const { userId, userPosition, setUserPosition, authToken } = useUser();
    const location = useLocation();
    const navigate = useNavigate();
    const initialUrlStateRef = useRef(null);
    if (!initialUrlStateRef.current) {
        initialUrlStateRef.current = readRankingUrlState(location.search, {
            hasUser: Boolean(userId),
            hasLocation: Boolean(userPosition),
        });
    }
    const initialUrlState = initialUrlStateRef.current;
    const [eisdielenKugel, setEisdielenKugel] = useState([]);
    const [eisdielenSofteis, setEisdielenSofteis] = useState([]);
    const [eisdielenEisbecher, setEisdielenEisbecher] = useState([]);
    const [sortConfigKugel, setSortConfigKugel] = useState(() => initialUrlState.type === 'kugel'
        ? { key: initialUrlState.sort, direction: initialUrlState.direction }
        : { key: 'ranking_score', direction: 'descending' });
    const [sortConfigSofteis, setSortConfigSofteis] = useState(() => initialUrlState.type === 'softeis'
        ? { key: initialUrlState.sort, direction: initialUrlState.direction }
        : { key: 'ranking_score', direction: 'descending' });
    const [sortConfigEisbecher, setSortConfigEisbehcer] = useState(() => initialUrlState.type === 'eisbecher'
        ? { key: initialUrlState.sort, direction: initialUrlState.direction }
        : { key: 'ranking_score', direction: 'descending' });
    const [expandedRow, setExpandedRow] = useState(null);
    const [activeTab, setActiveTab] = useState(initialUrlState.type);
    const [searchTerm, setSearchTerm] = useState(initialUrlState.q);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialUrlState.q);
    const [distanceFilter, setDistanceFilter] = useState(initialUrlState.distance);
    const [ratingScope, setRatingScope] = useState(initialUrlState.scope);
    const [reliabilityMode, setReliabilityMode] = useState(initialUrlState.reliability);
    const [favoritesOnly, setFavoritesOnly] = useState(initialUrlState.favorites);
    const [locationStatus, setLocationStatus] = useState(userPosition ? 'available' : 'idle');
    const [locationError, setLocationError] = useState(null);
    const [attributeOptions, setAttributeOptions] = useState([]);
    const [selectedAttributes, setSelectedAttributes] = useState(initialUrlState.attributes);
    const [eisdieleAttributes, setEisdieleAttributes] = useState({});
    const [showAttributeFilters, setShowAttributeFilters] = useState(false);
    const [openFilterMode, setOpenFilterMode] = useState(initialUrlState.openMode);
    const [openFilterDateTime, setOpenFilterDateTime] = useState(initialUrlState.openAt);
    const [attributeCountsByTab, setAttributeCountsByTab] = useState({
        kugel: {},
        softeis: {},
        eisbecher: {}
    });
    const [areFiltersExpanded, setAreFiltersExpanded] = useState(false);
    const [showScoreExplanation, setShowScoreExplanation] = useState(false);
    const [showExpandedNearbyResults, setShowExpandedNearbyResults] = useState(true);
    const [rankingLoading, setRankingLoading] = useState(false);
    const [rankingError, setRankingError] = useState(null);
    const [rankingRetryToken, setRankingRetryToken] = useState(0);
    const rankingCacheRef = useRef(new Map());
    const rankingRequestIdRef = useRef(0);
    const rankingUrlWriteRef = useRef(null);
    const rankingUrlHydrationRef = useRef(false);
    const rankingLocationSearchRef = useRef(location.search);
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const isSingleRaterScope = ratingScope === 'personal' || ratingScope === 'gourmetCyclist';
    const buildDefaultDateTimeValue = React.useCallback(() => {
        return formatDateTimeLocalInputValue();
    }, []);
    const openFilterQueryString = React.useMemo(() => {
        if (openFilterMode === 'now') {
            return 'open_now=1';
        }
        if (openFilterMode === 'custom' && openFilterDateTime) {
            return `open_at=${encodeURIComponent(openFilterDateTime)}`;
        }
        return '';
    }, [openFilterMode, openFilterDateTime]);
    const handleOpenFilterModeChange = React.useCallback((value) => {
        setOpenFilterMode(value);
        if (value === 'custom' && !openFilterDateTime) {
            setOpenFilterDateTime(buildDefaultDateTimeValue());
        }
    }, [openFilterDateTime, buildDefaultDateTimeValue]);
    const syncAttributeFilters = React.useCallback((datasetsByTab) => {
        const attributeMap = {};
        const attributeOptionsMap = new Map();
        const countsByTab = {
            kugel: {},
            softeis: {},
            eisbecher: {}
        };

        Object.entries(datasetsByTab).forEach(([tabKey, items = []]) => {
            const tabCounts = {};

            items.forEach((item) => {
                const eisdieleId = Number(item.eisdiele_id);
                const attributes = Array.isArray(item.attributes) ? item.attributes : [];

                if (!attributes.length || Number.isNaN(eisdieleId)) {
                    return;
                }

                if (!attributeMap[eisdieleId]) {
                    attributeMap[eisdieleId] = new Set();
                }

                attributes.forEach((attribute) => {
                    const attributeId = Number(attribute.id);
                    if (Number.isNaN(attributeId)) {
                        return;
                    }
                    const attributeCount = Number(attribute.anzahl) || 0;
                    attributeMap[eisdieleId].add(attributeId);
                    const existingEntry = attributeOptionsMap.get(attributeId);
                    attributeOptionsMap.set(attributeId, {
                        id: attributeId,
                        name: attribute.name,
                        count: (existingEntry?.count || 0) + attributeCount
                    });
                    tabCounts[attributeId] = (tabCounts[attributeId] || 0) + attributeCount;
                });
            });

            countsByTab[tabKey] = tabCounts;
        });

        const attributeOptionsSorted = Array.from(attributeOptionsMap.values()).sort((a, b) =>
            a.name.localeCompare(b.name, 'de', { sensitivity: 'base' })
        );
        const validAttributeIds = new Set(attributeOptionsSorted.map((option) => option.id));

        setEisdieleAttributes(attributeMap);
        setAttributeOptions(attributeOptionsSorted);
        setAttributeCountsByTab(countsByTab);
        setSelectedAttributes((prev) => {
            if (prev.length === 0) {
                return prev;
            }
            const filtered = prev.filter((id) => validAttributeIds.has(id));
            return filtered.length === prev.length ? prev : filtered;
        });
    }, []);

    useEffect(() => {
        if (userPosition) {
            setLocationStatus('available');
            setLocationError(null);
        }
    }, [userPosition]);

    useEffect(() => {
        if (!userId) {
            setFavoritesOnly(false);
        }
    }, [userId]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 250);
        return () => window.clearTimeout(timeoutId);
    }, [searchTerm]);

    useEffect(() => {
        if (location.search === rankingLocationSearchRef.current) {
            return;
        }
        rankingLocationSearchRef.current = location.search;
        if (rankingUrlWriteRef.current === location.search) {
            rankingUrlWriteRef.current = null;
            return;
        }

        rankingUrlHydrationRef.current = true;
        const nextState = readRankingUrlState(location.search, {
            hasUser: Boolean(userId),
            hasLocation: Boolean(userPosition),
        });
        setActiveTab(nextState.type);
        setSearchTerm(nextState.q);
        setDebouncedSearchTerm(nextState.q);
        setDistanceFilter(nextState.distance);
        setRatingScope(nextState.scope);
        setReliabilityMode(nextState.reliability);
        setFavoritesOnly(nextState.favorites);
        setOpenFilterMode(nextState.openMode);
        setOpenFilterDateTime(nextState.openAt);
        setSelectedAttributes(nextState.attributes);
        const nextSortConfig = { key: nextState.sort, direction: nextState.direction };
        if (nextState.type === 'kugel') setSortConfigKugel(nextSortConfig);
        if (nextState.type === 'softeis') setSortConfigSofteis(nextSortConfig);
        if (nextState.type === 'eisbecher') setSortConfigEisbehcer(nextSortConfig);
    }, [location.search, userId, userPosition]);

    const requestUserLocation = () => {
        if (!navigator.geolocation) {
            setLocationStatus('unsupported');
            setLocationError('Dein Browser unterstützt keine Standortabfrage.');
            return;
        }

        setLocationStatus('requesting');
        setLocationError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = [position.coords.latitude, position.coords.longitude];
                setUserPosition(coords);
                setLocationStatus('available');
            },
            (error) => {
                setLocationStatus('denied');
                if (error.code === error.PERMISSION_DENIED) {
                    setLocationError('Standortzugriff wurde abgelehnt.');
                } else {
                    setLocationError('Standort konnte nicht ermittelt werden.');
                }
            }
        );
    };

    useEffect(() => {
        if (!apiUrl) {
            return undefined;
        }

        if (ratingScope === 'personal' && !userId) {
            setRatingScope('global');
            return undefined;
        }

        const controller = new AbortController();
        const requestId = ++rankingRequestIdRef.current;
        const loadRanking = async () => {
            const ratingUserId = ratingScope === 'gourmetCyclist'
                ? 1
                : ratingScope === 'personal'
                    ? (userId ? Number(userId) : null)
                    : null;

            if (ratingScope === 'personal' && !ratingUserId) {
                return;
            }

            const queryParts = [`scope=${encodeURIComponent(ratingScope)}`];
            if (ratingUserId !== null) queryParts.push(`user_id=${ratingUserId}`);
            if (favoritesOnly && userId) queryParts.push('favorites_only=1');
            if (openFilterQueryString) queryParts.push(openFilterQueryString);
            const query = `?${queryParts.join('&')}`;
            const cacheKey = `${query}|viewer:${favoritesOnly && userId ? userId : 'public'}`;
            const applyPayload = (payload) => {
                const dataKugel = Array.isArray(payload.kugel) ? payload.kugel : [];
                const dataSofteis = Array.isArray(payload.softeis) ? payload.softeis : [];
                const dataEisbecher = Array.isArray(payload.eisbecher) ? payload.eisbecher : [];
                setEisdielenKugel(dataKugel);
                setEisdielenSofteis(dataSofteis);
                setEisdielenEisbecher(dataEisbecher);
                syncAttributeFilters({ kugel: dataKugel, softeis: dataSofteis, eisbecher: dataEisbecher });
            };

            const cachedEntry = rankingCacheRef.current.get(cacheKey);
            const cachedPayload = cachedEntry && (Date.now() - cachedEntry.cachedAt < 45000)
                ? cachedEntry.payload
                : null;
            if (!cachedPayload && cachedEntry) rankingCacheRef.current.delete(cacheKey);
            if (cachedPayload) {
                applyPayload(cachedPayload);
                if (requestId === rankingRequestIdRef.current) {
                    setRankingError(null);
                    setRankingLoading(false);
                }
                return;
            }

            // Do not leave the previous scope visible while a new scope is
            // pending; otherwise it looks like the new filter had no effect.
            setRankingLoading(true);
            setRankingError(null);
            setEisdielenKugel([]);
            setEisdielenSofteis([]);
            setEisdielenEisbecher([]);

            try {
                const response = await fetch(`${apiUrl}/api/rankings.php${query}`, {
                    headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
                    signal: controller.signal,
                });
                if (!response.ok) throw new Error('Fehler beim Abrufen des Rankings');
                const payload = await response.json();
                if (controller.signal.aborted || requestId !== rankingRequestIdRef.current) return;
                rankingCacheRef.current.set(cacheKey, { payload, cachedAt: Date.now() });
                // Keep memory bounded while retaining the most recently used
                // combinations for instant back-and-forth switching.
                while (rankingCacheRef.current.size > 8) {
                    rankingCacheRef.current.delete(rankingCacheRef.current.keys().next().value);
                }
                applyPayload(payload);
                setRankingError(null);
            } catch (error) {
                if (error?.name === 'AbortError' || controller.signal.aborted || requestId !== rankingRequestIdRef.current) return;
                console.error('Error fetching data:', error);
                setRankingError('Ranking konnte nicht geladen werden. Bitte erneut versuchen.');
            } finally {
                if (requestId === rankingRequestIdRef.current) setRankingLoading(false);
            }
        };

        loadRanking();
        return () => controller.abort();
    }, [apiUrl, ratingScope, userId, authToken, favoritesOnly, syncAttributeFilters, openFilterQueryString, rankingRetryToken]);

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

    const sortTableEisbecher = (key) => {
        let direction = 'descending';
        if (sortConfigEisbecher.key === key && sortConfigEisbecher.direction === 'descending') {
            direction = 'ascending';
        }
        setSortConfigEisbehcer({ key, direction });
    };

    const handleDistanceChange = (event) => {
        const value = event.target.value;
        if (value !== 'any' && !userPosition) {
            requestUserLocation();
            setDistanceFilter('any');
            return;
        }
        setDistanceFilter(value);
    };

    const handleRatingScopeChange = (event) => {
        const value = event.target.value;
        if (value === 'personal' && !userId) {
            return;
        }
        setRankingError(null);
        setRankingLoading(true);
        setEisdielenKugel([]);
        setEisdielenSofteis([]);
        setEisdielenEisbecher([]);
        setRatingScope(value);
        if (value === 'personal' || value === 'gourmetCyclist') {
            setReliabilityMode('all');
        }
    };

    const handleAttributeToggle = (attributeId) => {
        setSelectedAttributes((prev) => {
            if (prev.includes(attributeId)) {
                return prev.filter((id) => id !== attributeId);
            }
            return [...prev, attributeId];
        });
    };

    const clearAttributeFilter = () => {
        setSelectedAttributes([]);
    };

    const activeAttributeCounts = React.useMemo(() => {
        return attributeCountsByTab[activeTab] || {};
    }, [attributeCountsByTab, activeTab]);

    const displayedAttributeOptions = React.useMemo(() => {
        return attributeOptions
            .filter((option) => {
                const count = activeAttributeCounts[option.id] || 0;
                return count > 0 || selectedAttributes.includes(option.id);
            })
            .sort((a, b) => {
                const countA = activeAttributeCounts[a.id] || 0;
                const countB = activeAttributeCounts[b.id] || 0;
                if (countA !== countB) {
                    return countB - countA;
                }
                return a.name.localeCompare(b.name, 'de', { sensitivity: 'base' });
            });
    }, [attributeOptions, activeAttributeCounts, selectedAttributes]);

    const renderAttributeSummary = (attributes) => {
        if (!Array.isArray(attributes) || attributes.length === 0) {
            return null;
        }
        return (
            <AttributeSummary>
                <strong>Beliebte Attribute aus Reviews:</strong>
                <AttributeBadges>
                    {attributes.map((attribute) => (
                        <AttributeBadge
                            as={Link}
                            key={`${attribute.id}-${attribute.name}`}
                            to={`/map?attributes=${attribute.id}`}
                            aria-label={`Eisdielen mit dem Attribut ${attribute.name} auf der Karte ansehen`}
                        >
                            <span>{attribute.name}</span>
                            <em>{attribute.anzahl || 0}×</em>
                        </AttributeBadge>
                    ))}
                </AttributeBadges>
            </AttributeSummary>
        );
    };

    const formatOpenBadgeText = (entity) => {
        if (entity.open_reference) {
            const date = new Date(entity.open_reference);
            if (!Number.isNaN(date.getTime())) {
                const dateLabel = date.toLocaleDateString('de-DE', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit'
                });
                const timeLabel = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                return `Geöffnet am ${dateLabel} ${timeLabel}`;
            }
        }
        if (typeof entity.is_open_now === 'boolean') {
            return entity.is_open_now ? 'Jetzt geöffnet' : 'Geschlossen';
        }
        return null;
    };

    const renderOpenStateBadge = (entity) => {
        const text = formatOpenBadgeText(entity);
        if (!text) {
            return null;
        }
        const isReference = Boolean(entity.open_reference);
        const isOpen = isReference ? true : Boolean(entity.is_open_now);
        return <OpenBadge $open={isOpen}>{text}</OpenBadge>;
    };

    const getOpeningHoursLines = React.useCallback((shop) => {
        if (!shop) return [];
        const structured = hydrateOpeningHours(
            shop.openingHoursStructured,
            shop.opening_hours_note || ""
        );
        let lines = formatOpeningHoursLines(structured);
        if (!lines.length && shop.openingHours) {
            lines = shop.openingHours.split(';').map((part) => part.trim());
        }
        return lines;
    }, []);

    const minimumUsersForTab = (tab) => tab === 'kugel' ? 3 : 2;

    const applyFiltersAndSort = (items, sortConfig, tab, reliabilityOverride = reliabilityMode) => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        const maxDistance = distanceFilter !== 'any' ? parseFloat(distanceFilter) : null;

        const itemsWithDistance = items.map((item) => {
            const lat = parseFloat(item.latitude);
            const lon = parseFloat(item.longitude);
            const hasCoords = !Number.isNaN(lat) && !Number.isNaN(lon);
            const distanceKm = userPosition && hasCoords
                ? calculateDistanceKm(userPosition[0], userPosition[1], lat, lon)
                : null;
            return { ...item, distanceKm };
        });

        const filteredItems = itemsWithDistance.filter((item) => {
            const itemName = (item.name || '').toLowerCase();
            const matchesSearch = normalizedSearch === '' || itemName.includes(normalizedSearch);
            const matchesDistance = maxDistance === null || (item.distanceKm !== null && item.distanceKm <= maxDistance);
            const eisdieleId = Number(item.eisdiele_id);
            const itemAttributes = eisdieleAttributes[eisdieleId];
            const matchesAttributes =
                selectedAttributes.length === 0 ||
                (itemAttributes && selectedAttributes.every((attrId) => itemAttributes.has(attrId)));
            const uniqueRaters = Number(item.nutzeranzahl ?? item.anzahl_nutzer ?? 0);
            const matchesReliability = reliabilityOverride === 'all' || uniqueRaters >= minimumUsersForTab(tab);
            let matchesOpenState = true;
            if (openFilterMode === 'now') {
                matchesOpenState = Boolean(item.is_open_now);
            } else if (openFilterMode === 'custom' && openFilterDateTime) {
                matchesOpenState = item.is_open_reference === null
                    ? true
                    : Boolean(item.is_open_reference);
            }
            return matchesSearch && matchesDistance && matchesAttributes && matchesReliability && matchesOpenState;
        });

        if (sortConfig.key === null) {
            return filteredItems;
        }

        const getSortValue = (item) => {
            if (sortConfig.key === 'taste_factor') {
                const tasteFactor = tab === 'softeis'
                    ? item.finaler_geschmacksfaktor
                    : (item.avg_geschmacksfaktor ?? item.finaler_geschmacksfaktor ?? item.avg_geschmack);
                const numericTasteFactor = Number(tasteFactor);
                return Number.isFinite(numericTasteFactor) ? numericTasteFactor : null;
            }

            const value = item[sortConfig.key];
            const numericValue = Number(value);
            return value !== '' && value !== null && value !== undefined && Number.isFinite(numericValue)
                ? numericValue
                : value;
        };

        const sortableItems = [...filteredItems];
        sortableItems.sort((a, b) => {
            const aValue = getSortValue(a);
            const bValue = getSortValue(b);

            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });

        return sortableItems;
    };

    const sortedEisdielenKugel = React.useMemo(() => {
        return applyFiltersAndSort(eisdielenKugel, sortConfigKugel, 'kugel');
    }, [eisdielenKugel, sortConfigKugel, searchTerm, distanceFilter, userPosition, selectedAttributes, eisdieleAttributes, openFilterMode, openFilterDateTime, reliabilityMode]);

    const sortedEisdielenSofteis = React.useMemo(() => {
        return applyFiltersAndSort(eisdielenSofteis, sortConfigSofteis, 'softeis');
    }, [eisdielenSofteis, sortConfigSofteis, searchTerm, distanceFilter, userPosition, selectedAttributes, eisdieleAttributes, openFilterMode, openFilterDateTime, reliabilityMode]);

    const sortedEisdielenEisbecher = React.useMemo(() => {
        return applyFiltersAndSort(eisdielenEisbecher, sortConfigEisbecher, 'eisbecher');
    }, [eisdielenEisbecher, sortConfigEisbecher, searchTerm, distanceFilter, userPosition, selectedAttributes, eisdieleAttributes, openFilterMode, openFilterDateTime, reliabilityMode]);

    const relaxedEisdielenKugel = React.useMemo(() => applyFiltersAndSort(eisdielenKugel, sortConfigKugel, 'kugel', 'all'), [eisdielenKugel, sortConfigKugel, searchTerm, distanceFilter, userPosition, selectedAttributes, eisdieleAttributes, openFilterMode, openFilterDateTime]);
    const relaxedEisdielenSofteis = React.useMemo(() => applyFiltersAndSort(eisdielenSofteis, sortConfigSofteis, 'softeis', 'all'), [eisdielenSofteis, sortConfigSofteis, searchTerm, distanceFilter, userPosition, selectedAttributes, eisdieleAttributes, openFilterMode, openFilterDateTime]);
    const relaxedEisdielenEisbecher = React.useMemo(() => applyFiltersAndSort(eisdielenEisbecher, sortConfigEisbecher, 'eisbecher', 'all'), [eisdielenEisbecher, sortConfigEisbecher, searchTerm, distanceFilter, userPosition, selectedAttributes, eisdieleAttributes, openFilterMode, openFilterDateTime]);

    useEffect(() => {
        setShowExpandedNearbyResults(true);
    }, [activeTab, distanceFilter, searchTerm, selectedAttributes, openFilterMode, openFilterDateTime, ratingScope]);

    const toggleDetails = (index) => {
        setExpandedRow((prevIndex) => (prevIndex === index ? null : index));
    };

    const strictActiveRows = activeTab === 'kugel'
        ? sortedEisdielenKugel
        : activeTab === 'softeis'
            ? sortedEisdielenSofteis
            : sortedEisdielenEisbecher;
    const relaxedActiveRows = activeTab === 'kugel'
        ? relaxedEisdielenKugel
        : activeTab === 'softeis'
            ? relaxedEisdielenSofteis
            : relaxedEisdielenEisbecher;
    const shouldExpandNearbyResults = distanceFilter !== 'any'
        && reliabilityMode === 'reliable'
        && strictActiveRows.length < 3
        && relaxedActiveRows.length > strictActiveRows.length
        && showExpandedNearbyResults;
    const activeRows = shouldExpandNearbyResults ? relaxedActiveRows : strictActiveRows;
    const activeResultCount = activeRows.length;
    const showRankingResults = !rankingLoading && !rankingError;
    const activeSortConfig = activeTab === 'kugel'
        ? sortConfigKugel
        : activeTab === 'softeis'
            ? sortConfigSofteis
            : sortConfigEisbecher;
    const activePriceKey = activeTab === 'softeis' ? 'softeis_preis_eur' : 'kugel_preis_eur';

    useEffect(() => {
        if (rankingUrlHydrationRef.current) {
            rankingUrlHydrationRef.current = false;
            return;
        }
        const params = new URLSearchParams();
        const isSingleScope = ratingScope === 'personal' || ratingScope === 'gourmetCyclist';
        const normalizedAttributes = [...selectedAttributes]
            .filter((id) => Number.isInteger(Number(id)) && Number(id) > 0)
            .map(Number)
            .sort((a, b) => a - b);

        if (activeTab !== 'kugel') params.set('type', activeTab);
        if (debouncedSearchTerm.trim()) params.set('q', debouncedSearchTerm.trim());
        if (distanceFilter !== 'any' && userPosition) params.set('distance', distanceFilter);
        if (ratingScope !== 'global') params.set('scope', ratingScope);
        if (!isSingleScope && reliabilityMode === 'all') params.set('reliability', 'all');
        if (favoritesOnly && userId) params.set('favorites', '1');
        if (openFilterMode === 'now') params.set('open', 'now');
        if (openFilterMode === 'custom' && openFilterDateTime) {
            params.set('open', 'at');
            params.set('open_at', openFilterDateTime);
        }
        if (normalizedAttributes.length) params.set('attributes', normalizedAttributes.join(','));
        if (activeSortConfig.key !== 'ranking_score' || activeSortConfig.direction !== 'descending') {
            params.set('sort', activeSortConfig.key);
            if (activeSortConfig.direction !== getDefaultSortDirection(activeSortConfig.key)) {
                params.set('dir', activeSortConfig.direction);
            }
        }

        const nextSearch = params.toString() ? `?${params.toString()}` : '';
        if (nextSearch === location.search) return;
        rankingUrlWriteRef.current = nextSearch;
        navigate({ pathname: location.pathname, search: nextSearch }, { replace: true });
    }, [
        activeTab,
        activeSortConfig,
        debouncedSearchTerm,
        distanceFilter,
        favoritesOnly,
        location.pathname,
        location.search,
        navigate,
        openFilterDateTime,
        openFilterMode,
        ratingScope,
        reliabilityMode,
        selectedAttributes,
        userId,
        userPosition,
    ]);

    const sortActiveRows = activeTab === 'kugel'
        ? sortTableKugel
        : activeTab === 'softeis'
            ? sortTableSofteis
            : sortTableEisbecher;
    const setActiveSort = (key, direction) => {
        const nextConfig = { key, direction };
        if (activeTab === 'kugel') {
            setSortConfigKugel(nextConfig);
        } else if (activeTab === 'softeis') {
            setSortConfigSofteis(nextConfig);
        } else {
            setSortConfigEisbehcer(nextConfig);
        }
    };
    const tasteFactorKey = 'taste_factor';
    const mobileSortOptions = [
        { key: 'ranking_score', label: 'Ranking', defaultDirection: 'descending' },
        { key: tasteFactorKey, label: 'Geschmacksfaktor', mobileLabel: 'Geschmack', defaultDirection: 'descending' },
        { key: 'avg_preisleistung', label: 'Preis-Leistung', mobileLabel: 'Preis-Leist.', defaultDirection: 'descending' },
        ...(activeTab !== 'eisbecher' ? [{ key: activePriceKey, label: 'Preis', defaultDirection: 'ascending' }] : []),
        { key: 'nutzeranzahl', label: 'Unterschiedliche Nutzer', mobileLabel: 'Nutzer', defaultDirection: 'descending' },
    ];
    const handleMobileSortChange = (event) => {
        const option = mobileSortOptions.find(({ key }) => key === event.target.value);
        if (option) setActiveSort(option.key, option.defaultDirection);
    };
    const activeDetailKey = (shop, index) => `${activeTab}-${shop.eisdiele_id || index}`;
    const formatRating = (value, digits = 2) => value === null || value === undefined || value === ''
        ? '–'
        : Number(value).toFixed(digits);
    const getTasteFactor = (shop) => activeTab === 'softeis'
        ? (shop.finaler_geschmacksfaktor ?? shop.avg_geschmacksfaktor ?? shop.avg_geschmack)
        : (shop.avg_geschmacksfaktor ?? shop.finaler_geschmacksfaktor ?? shop.avg_geschmack);
    const getUniqueRaters = (shop) => Number(shop.nutzeranzahl ?? shop.anzahl_nutzer ?? 0);
    const isLowConfidence = (shop) => reliabilityMode === 'reliable' && getUniqueRaters(shop) < minimumUsersForTab(activeTab);
    const getPriceLabel = (shop) => {
        if (activeTab === 'eisbecher') return null;
        const priceKey = activeTab === 'softeis' ? 'softeis' : 'kugel';
        const priceEur = shop[`${priceKey}_preis_eur`];
        const price = shop[`${priceKey}_preis`];
        const currency = shop[`${priceKey}_waehrung`];
        if (priceEur === null || priceEur === undefined) return '–';
        const euro = `${Number(priceEur).toFixed(2)} €`;
        const isEuro = ['€', 'EUR', 'EURO'].includes(String(currency || '').trim().toUpperCase());
        if (currency && !isEuro && price !== null && price !== undefined) {
            return `${euro} (${Number(price).toFixed(2)} ${currency})`;
        }
        return euro;
    };
    const filterSummary = [
        ratingScope !== 'global' ? (ratingScope === 'gourmetCyclist' ? 'TheGourmetCyclist' : 'Persönlich') : null,
        !isSingleRaterScope && reliabilityMode !== 'reliable' ? 'alle Daten' : null,
        favoritesOnly ? 'meine Favoriten' : null,
        openFilterMode === 'now' ? 'jetzt geöffnet' : openFilterMode === 'custom' ? 'zu Termin geöffnet' : null,
        selectedAttributes.length > 0 ? `${selectedAttributes.length} Attribute` : null,
    ].filter(Boolean).join(' · ') || 'Standardfilter';
    const activeAdvancedFilterCount = [
        ratingScope !== 'global',
        !isSingleRaterScope && reliabilityMode !== 'reliable',
        favoritesOnly,
        openFilterMode !== 'all',
        selectedAttributes.length > 0,
    ].filter(Boolean).length;
    const renderShopDetails = (shop) => (
        <DetailsContainer>
            <DetailMetrics>
                <DetailMetric $wide={activeTab === 'eisbecher'}>
                    <span>Geschmack</span><strong>{formatRating(shop.avg_geschmack, 1)}</strong>
                </DetailMetric>
                {activeTab !== 'eisbecher' && (
                    <DetailMetric><span>Waffel</span><strong>{formatRating(shop.avg_waffel, 1)}</strong></DetailMetric>
                )}
                <DetailMetric $wide={isSingleRaterScope}>
                    <span>Entfernung</span><strong>{shop.distanceKm !== null && shop.distanceKm !== undefined ? `${Number(shop.distanceKm).toFixed(1)} km` : '–'}</strong>
                </DetailMetric>
                {!isSingleRaterScope && (
                    <DetailMetric><span>Nutzer</span><strong>{getUniqueRaters(shop)}</strong></DetailMetric>
                )}
            </DetailMetrics>
            <DetailInformation>
                <DetailInformationRow>
                    <strong>Adresse</strong>
                    <span>{shop.adresse || '–'}</span>
                </DetailInformationRow>
                <DetailInformationRow>
                    <strong>Öffnungszeiten</strong>
                    <span>{renderOpenStateBadge(shop) || 'Keine Angabe'}</span>
                </DetailInformationRow>
                {getOpeningHoursLines(shop).length > 0 && (
                    <OpeningHoursPreview>{getOpeningHoursLines(shop).join(' · ')}</OpeningHoursPreview>
                )}
            </DetailInformation>
            {renderAttributeSummary(shop.attributes)}
        </DetailsContainer>
    );
    const advancedFiltersContent = (
        <>
            <FiltersRow>
                <FilterGroup>
                    <FilterLabel htmlFor="ranking-rating">Rating-Quelle</FilterLabel>
                    <FilterSelect
                        id="ranking-rating"
                        value={ratingScope}
                        onChange={handleRatingScopeChange}
                    >
                        <option value="global">Global</option>
                        <option value="gourmetCyclist">TheGourmetCyclist-Rating</option>
                        <option value="personal" disabled={!userId}>Personal-Rating</option>
                    </FilterSelect>
                </FilterGroup>
                <FilterGroup>
                    <FilterLabel htmlFor="ranking-reliability">Verlässlichkeit</FilterLabel>
                    <FilterSelect
                        id="ranking-reliability"
                        value={reliabilityMode}
                        onChange={(event) => setReliabilityMode(event.target.value)}
                        disabled={isSingleRaterScope}
                    >
                        <option value="reliable">Verlässlich (empfohlen)</option>
                        <option value="all">Alle inklusive weniger Daten</option>
                    </FilterSelect>
                    <FilterHint>
                        {isSingleRaterScope
                            ? 'Einzelrating – alle eigenen Bewertungen werden berücksichtigt.'
                            : activeTab === 'kugel' ? 'mindestens 3 unterschiedliche Nutzer' : 'mindestens 2 unterschiedliche Nutzer'}
                    </FilterHint>
                </FilterGroup>
                <FilterGroup>
                    <FilterLabel>Öffnungszeiten</FilterLabel>
                    <FilterSelect
                        value={openFilterMode}
                        onChange={(event) => handleOpenFilterModeChange(event.target.value)}
                    >
                        <option value="all">Alle Zeiten</option>
                        <option value="now">Jetzt geöffnet</option>
                        <option value="custom">Geöffnet am …</option>
                    </FilterSelect>
                    {openFilterMode === 'custom' && (
                        <FilterInput
                            type="datetime-local"
                            value={openFilterDateTime}
                            onChange={(event) => setOpenFilterDateTime(event.target.value)}
                        />
                    )}
                </FilterGroup>
                {userId && (
                    <FilterGroup>
                        <FilterLabel>Favoriten</FilterLabel>
                        <FavoriteFilterButton
                            type="button"
                            $active={favoritesOnly}
                            onClick={() => setFavoritesOnly((previous) => !previous)}
                            aria-pressed={favoritesOnly}
                        >
                            Nur meine Favoriten
                        </FavoriteFilterButton>
                    </FilterGroup>
                )}
            </FiltersRow>
            {attributeOptions.length > 0 && (
                <AttributeFilterSection>
                    <AttributeToggleButton
                        type="button"
                        onClick={() => setShowAttributeFilters((prev) => !prev)}
                    >
                        {showAttributeFilters ? 'Attribute ausblenden' : 'Attribute anzeigen'}
                    </AttributeToggleButton>
                    {showAttributeFilters && (
                        <AttributeFilterWrapper>
                            <FilterLabel as="div">Attribute</FilterLabel>
                            <AttributeFilterContainer>
                                {displayedAttributeOptions.map((attribute) => {
                                    const count = activeAttributeCounts[attribute.id] || 0;
                                    return (
                                        <AttributePill
                                            key={attribute.id}
                                            type="button"
                                            $active={selectedAttributes.includes(attribute.id)}
                                            onClick={() => handleAttributeToggle(attribute.id)}
                                        >
                                            {attribute.name} ({count})
                                        </AttributePill>
                                    );
                                })}
                            </AttributeFilterContainer>
                            {selectedAttributes.length > 0 && (
                                <ClearFilterButton type="button" onClick={clearAttributeFilter}>
                                    Filter zurücksetzen
                                </ClearFilterButton>
                            )}
                        </AttributeFilterWrapper>
                    )}
                </AttributeFilterSection>
            )}
            {!userPosition && locationStatus !== 'idle' && (
                <LocationHint>
                    <span>Teile deinen Standort, um Entfernungen anzeigen und filtern zu können.</span>
                    <LocationButton
                        type="button"
                        onClick={requestUserLocation}
                        disabled={locationStatus === 'requesting'}
                    >
                        {locationStatus === 'requesting' ? 'Standort wird ermittelt...' : 'Standort freigeben'}
                    </LocationButton>
                    {locationError && <LocationError>{locationError}</LocationError>}
                </LocationHint>
            )}
            {userPosition && (
                <FilterHint>Entfernungen beziehen sich auf deinen aktuellen Standort.</FilterHint>
            )}
        </>
    );

    return (
        <RankingPage>
            <Seo
                title="Eisdielen-Ranking | Bewertungen und Preis-Leistung in der Ice-App"
                description="Eisdielen-Ranking der Ice-App: Vergleiche Bewertungen, Preis-Leistung und Community-Ratings für Eisdielen in Deutschland."
                keywords={[
                    'Eisdielen Ranking',
                    'Ice-App Ranking',
                    'Eisdielen Bewertung',
                    'Eis Bewertung Deutschland',
                    'Preis Leistung Eisdiele',
                ]}
                canonical="/ranking"
            />
            <Header />
            <Container>
                <TableContainer className="container" aria-busy={rankingLoading}>
                    <HeroCard>
                        <PageTitle><Trophy size={31} aria-hidden="true" /> Eisdielen-Ranking</PageTitle>
                    </HeroCard>
                    <TabContainer role="tablist" aria-label="Art des Eises">
                        <TabButton
                            type="button"
                            role="tab"
                            aria-selected={activeTab === 'kugel'}
                            $active={activeTab === 'kugel'}
                            onClick={() => setActiveTab('kugel')}
                        >
                            Kugeleis
                        </TabButton>
                        <TabButton
                            type="button"
                            role="tab"
                            aria-selected={activeTab === 'softeis'}
                            $active={activeTab === 'softeis'}
                            onClick={() => setActiveTab('softeis')}
                        >
                            Softeis
                        </TabButton>
                        <TabButton
                            type="button"
                            role="tab"
                            aria-selected={activeTab === 'eisbecher'}
                            $active={activeTab === 'eisbecher'}
                            onClick={() => setActiveTab('eisbecher')}
                        >
                            Eisbecher
                        </TabButton>
                    </TabContainer>
                    <FilterCard>
                      <QuickFiltersBar>
                        <FilterGroup>
                            <FilterLabel htmlFor="ranking-search">Suche</FilterLabel>
                            <FilterInput id="ranking-search" type="search" value={searchTerm} placeholder="Eisdiele suchen..." onChange={(event) => setSearchTerm(event.target.value)} />
                        </FilterGroup>
                        <FilterGroup>
                            <FilterLabel htmlFor="ranking-distance">Entfernung</FilterLabel>
                            <FilterSelect id="ranking-distance" value={distanceFilter} onChange={handleDistanceChange}>
                                <option value="any">Alle Entfernungen</option>
                                <option value="2">bis 2 km</option>
                                <option value="5">bis 5 km</option>
                                <option value="10">bis 10 km</option>
                                <option value="25">bis 25 km</option>
                                <option value="50">bis 50 km</option>
                            </FilterSelect>
                        </FilterGroup>
                        <FiltersToggleButton
                            type="button"
                            onClick={() => setAreFiltersExpanded((prev) => !prev)}
                            aria-expanded={areFiltersExpanded}
                            aria-controls="ranking-advanced-filters"
                        >
                            <SlidersHorizontal size={17} aria-hidden="true" />
                            <span>{areFiltersExpanded ? 'Weniger Filter' : 'Mehr Filter'}</span>
                            {!areFiltersExpanded && activeAdvancedFilterCount > 0 && <FilterButtonSummary>· {activeAdvancedFilterCount} aktiv</FilterButtonSummary>}
                            <ChevronDown size={16} aria-hidden="true" $expanded={areFiltersExpanded} />
                        </FiltersToggleButton>
                      </QuickFiltersBar>
                      {!areFiltersExpanded && activeAdvancedFilterCount > 0 && (
                        <ClosedFilterSummary aria-live="polite">{filterSummary}</ClosedFilterSummary>
                      )}
                      {!userPosition && locationStatus !== 'idle' && (
                          <CompactLocationHint>
                              <MapPin size={16} aria-hidden="true" />
                              <span>{locationStatus === 'requesting' ? 'Standort wird ermittelt…' : locationError || 'Standort für Entfernungen freigeben.'}</span>
                          </CompactLocationHint>
                      )}
                      {areFiltersExpanded && (
                          <FiltersPanel id="ranking-advanced-filters" role="region" aria-label="Weitere Ranking-Filter">
                              <FilterPanelHeader>
                                <strong>Weitere Filter</strong>
                                {activeAdvancedFilterCount > 0 && <span>{activeAdvancedFilterCount} aktiv</span>}
                              </FilterPanelHeader>
                              {advancedFiltersContent}
                          </FiltersPanel>
                      )}
                    </FilterCard>
                    {false && activeTab === 'kugel' && (
                        <>
                            <TableScrollArea>
                                <Table>
                        <thead>
                            <tr>
                                <th>Eisdiele</th>
                                <th onClick={() => sortTableKugel('avg_geschmack')}>
                                    Geschmack {sortConfigKugel.key === 'avg_geschmack' ? (sortConfigKugel.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => sortTableKugel('avg_waffel')}>
                                    Waffel {sortConfigKugel.key === 'avg_waffel' ? (sortConfigKugel.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => sortTableKugel('kugel_preis_eur')}>
                                    Preis {sortConfigKugel.key === 'kugel_preis_eur' ? (sortConfigKugel.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => sortTableKugel('distanceKm')}>
                                    Entfernung {sortConfigKugel.key === 'distanceKm' ? (sortConfigKugel.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => sortTableKugel('avg_preisleistung')}>
                                    Preis-Leistung {sortConfigKugel.key === 'avg_preisleistung' ? (sortConfigKugel.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => sortTableKugel('ranking_score')}>
                                    Ranking {sortConfigKugel.key === 'ranking_score' ? (sortConfigKugel.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => sortTableKugel('avg_geschmacksfaktor')}>
                                    Faktor Geschmack {sortConfigKugel.key === 'avg_geschmacksfaktor' ? (sortConfigKugel.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => sortTableKugel('checkin_anzahl')}>
                                    Anzahl Bewertungen {sortConfigKugel.key === 'checkin_anzahl' ? (sortConfigKugel.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedEisdielenKugel.map((eisdiele, index) => (
                                <React.Fragment key={index}>
                                    <tr onClick={() => toggleDetails(index)}>
                                        <td style={{ textAlign: 'left' }}>{eisdiele.name}</td>
                                        <td style={sortConfigKugel.key === 'avg_geschmack' ? { fontWeight: 'bold' } : {}}>{eisdiele.avg_geschmack ? Number(eisdiele.avg_geschmack).toFixed(1) : "–"}</td>
                                        <td style={sortConfigKugel.key === 'avg_waffel' ? { fontWeight: 'bold' } : {}}>{eisdiele.avg_waffel ? Number(eisdiele.avg_waffel).toFixed(1) : "–"}</td>
                                        <td style={sortConfigKugel.key === 'kugel_preis_eur' ? { fontWeight: 'bold' } : {}}>
                                            {eisdiele.kugel_preis_eur ? Number(eisdiele.kugel_preis_eur).toFixed(2) : "–"} €
                                            {eisdiele.kugel_waehrung !== "€" && eisdiele.kugel_preis ? " (" + Number(eisdiele.kugel_preis).toFixed(2) + " " + eisdiele.kugel_waehrung + ")" : ""}
                                        </td>
                                        <td style={sortConfigKugel.key === 'distanceKm' ? { fontWeight: 'bold' } : {}}>
                                            {eisdiele.distanceKm !== null && eisdiele.distanceKm !== undefined ? `${Number(eisdiele.distanceKm).toFixed(1)} km` : "–"}
                                        </td>
                                        <td style={sortConfigKugel.key === 'avg_preisleistung' ? { fontWeight: 'bold' } : {}}>{eisdiele.avg_preisleistung ? Number(eisdiele.avg_preisleistung).toFixed(2) : "–"}</td>
                                        <td style={sortConfigKugel.key === 'ranking_score' ? { fontWeight: 'bold' } : {}} title={`Rohwert: ${Number(eisdiele.raw_score).toFixed(2)}`}>{eisdiele.ranking_score ? Number(eisdiele.ranking_score).toFixed(2) : "–"}</td>
                                        <td style={sortConfigKugel.key === 'avg_geschmacksfaktor' ? { fontWeight: 'bold' } : {}}>{eisdiele.avg_geschmacksfaktor ? Number(eisdiele.avg_geschmacksfaktor).toFixed(2) : "–"}</td>
                                        <td style={sortConfigKugel.key === 'checkin_anzahl' ? { fontWeight: 'bold' } : {}}>{eisdiele.checkin_anzahl} (von {eisdiele.nutzeranzahl} Nutzer/n)</td>
                                    </tr>
                                    <DetailsRow visible={expandedRow === index} className="details-row">
                                        <td colSpan="9">
                                            <DetailsContainer>

                                                <h3><CleanLink to={`/map/activeShop/${eisdiele.eisdiele_id}`}>{eisdiele.name}</CleanLink></h3>
                                                <strong>Adresse: </strong>{eisdiele.adresse}<br />
                                                <strong>Öffnungszeiten: </strong>
                                                {renderOpenStateBadge(eisdiele)}
                                                <br />
                                                {getOpeningHoursLines(eisdiele).map((time, i) => (
                                                    <React.Fragment key={i}>
                                                        {time}<br />
                                                    </React.Fragment>
                                                ))}
                                                {renderAttributeSummary(eisdiele.attributes)}
                                            </DetailsContainer>
                                        </td>
                                    </DetailsRow>
                                </React.Fragment>
                            ))}
                        </tbody>
                                </Table>
                            </TableScrollArea>
                            <RankingScoreExplanation type="kugel" />
                        </>
                    )}
                    {false && activeTab === 'softeis' && (
                        <>
                            <TableScrollArea>
                                <Table>
                            <thead>
                                <tr>
                                    <th>Eisdiele</th>
                                    <th onClick={() => sortTableSofteis('avg_geschmack')}>
                                        Geschmack {sortConfigSofteis.key === 'avg_geschmack' ? (sortConfigSofteis.direction === 'ascending' ? '▲' : '▼') : ''}
                                    </th>
                                    <th onClick={() => sortTableSofteis('avg_waffel')}>
                                        Waffel {sortConfigSofteis.key === 'avg_waffel' ? (sortConfigSofteis.direction === 'ascending' ? '▲' : '▼') : ''}
                                    </th>
                                    <th onClick={() => sortTableSofteis('avg_preisleistung')}>
                                        Preis-Leistung {sortConfigSofteis.key === 'avg_preisleistung' ? (sortConfigSofteis.direction === 'ascending' ? '▲' : '▼') : ''}
                                    </th>
                                <th onClick={() => sortTableSofteis('ranking_score')}>
                                    Ranking {sortConfigSofteis.key === 'ranking_score' ? (sortConfigSofteis.direction === 'ascending' ? '▲' : '▼') : ''}
                                    </th>
                                    <th onClick={() => sortTableSofteis('finaler_geschmacksfaktor')}>
                                        Geschmacksfaktor {sortConfigSofteis.key === 'finaler_geschmacksfaktor' ? (sortConfigSofteis.direction === 'ascending' ? '▲' : '▼') : ''}
                                    </th>
                                    <th onClick={() => sortTableSofteis('distanceKm')}>
                                        Entfernung {sortConfigSofteis.key === 'distanceKm' ? (sortConfigSofteis.direction === 'ascending' ? '▲' : '▼') : ''}
                                    </th>
                                    <th onClick={() => sortTableSofteis('checkin_anzahl')}>
                                        Anzahl Bewertungen {sortConfigSofteis.key === 'checkin_anzahl' ? (sortConfigSofteis.direction === 'ascending' ? '▲' : '▼') : ''}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedEisdielenSofteis.map((eisdiele, index) => (
                                    <React.Fragment key={index}>
                                        <tr onClick={() => toggleDetails(`softeis-${index}`)}>
                                            <td style={{ textAlign: 'left' }}>{eisdiele.name}</td>
                                            <td style={sortConfigSofteis.key === 'avg_geschmack' ? { fontWeight: 'bold' } : {}}>
                                                {eisdiele.avg_geschmack ? eisdiele.avg_geschmack.toFixed(1) : '-'}
                                            </td>
                                            <td style={sortConfigSofteis.key === 'avg_waffel' ? { fontWeight: 'bold' } : {}}>
                                                {eisdiele.avg_waffel ? eisdiele.avg_waffel.toFixed(1) : '-'}
                                            </td>
                                            <td style={sortConfigSofteis.key === 'avg_preisleistung' ? { fontWeight: 'bold' } : {}}>
                                                {eisdiele.avg_preisleistung ? eisdiele.avg_preisleistung.toFixed(1) : '-'}
                                            </td>
                                            <td style={sortConfigSofteis.key === 'ranking_score' ? { fontWeight: 'bold' } : {}} title={`Rohwert: ${Number(eisdiele.raw_score).toFixed(2)}`}>
                                                {eisdiele.ranking_score ? Number(eisdiele.ranking_score).toFixed(2) : '-'}
                                            </td>
                                            <td style={sortConfigSofteis.key === 'finaler_geschmacksfaktor' ? { fontWeight: 'bold' } : {}}>
                                                {eisdiele.finaler_geschmacksfaktor ? eisdiele.finaler_geschmacksfaktor.toFixed(2) : '-'}
                                            </td>
                                            <td style={sortConfigSofteis.key === 'distanceKm' ? { fontWeight: 'bold' } : {}}>
                                                {eisdiele.distanceKm !== null && eisdiele.distanceKm !== undefined ? `${Number(eisdiele.distanceKm).toFixed(1)} km` : '-'}
                                            </td>
                                            <td style={sortConfigSofteis.key === 'checkin_anzahl' ? { fontWeight: 'bold' } : {}}>
                                                {eisdiele.checkin_anzahl} (von {eisdiele.anzahl_nutzer} Nutzer/n)
                                            </td>
                                        </tr>
                                        <DetailsRow visible={expandedRow === `softeis-${index}`} className="details-row">
                                            <td colSpan="8">
                                                <DetailsContainer>
                                                    <h3><CleanLink to={`/map/activeShop/${eisdiele.eisdiele_id}`}>{eisdiele.name}</CleanLink></h3>
                                                    <strong>Adresse: </strong>{eisdiele.adresse}<br />
                                                    <strong>Öffnungszeiten: </strong>
                                                    {renderOpenStateBadge(eisdiele)}
                                                    <br />
                                                    {getOpeningHoursLines(eisdiele).map((time, i) => (
                                                        <React.Fragment key={i}>
                                                            {time}<br />
                                                        </React.Fragment>
                                                    ))}
                                                    {renderAttributeSummary(eisdiele.attributes)}
                                                </DetailsContainer>
                                            </td>
                                        </DetailsRow>
                                    </React.Fragment>
                                ))}
                            </tbody>
                                </Table>
                            </TableScrollArea>
                            <RankingScoreExplanation type="softeis" />
                        </>
                    )}
                    {false && activeTab === 'eisbecher' && (
                        <>
                            <TableScrollArea>
                                <Table>
                            <thead>
                                <tr>
                                    <th>Eisdiele</th>
                                    <th onClick={() => sortTableEisbecher('avg_geschmack')}>
                                        Geschmack {sortConfigEisbecher.key === 'avg_geschmack' ? (sortConfigEisbecher.direction === 'ascending' ? '▲' : '▼') : ''}
                                    </th>
                                    <th onClick={() => sortTableEisbecher('avg_preisleistung')}>
                                        Preis-Leistung {sortConfigEisbecher.key === 'avg_preisleistung' ? (sortConfigEisbecher.direction === 'ascending' ? '▲' : '▼') : ''}
                                    </th>
                                <th onClick={() => sortTableEisbecher('ranking_score')}>
                                    Ranking {sortConfigEisbecher.key === 'ranking_score' ? (sortConfigEisbecher.direction === 'ascending' ? '▲' : '▼') : ''}
                                    </th>
                                    <th onClick={() => sortTableEisbecher('distanceKm')}>
                                        Entfernung {sortConfigEisbecher.key === 'distanceKm' ? (sortConfigEisbecher.direction === 'ascending' ? '▲' : '▼') : ''}
                                    </th>
                                    <th onClick={() => sortTableEisbecher('checkin_anzahl')}>
                                        Anzahl Bewertungen {sortConfigEisbecher.key === 'checkin_anzahl' ? (sortConfigEisbecher.direction === 'ascending' ? '▲' : '▼') : ''}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedEisdielenEisbecher.map((eisdiele, index) => (
                                    <React.Fragment key={index}>
                                        <tr onClick={() => toggleDetails(`eisbecher-${index}`)}>
                                            <td style={{ textAlign: 'left' }}>{eisdiele.name}</td>
                                            <td style={sortConfigEisbecher.key === 'avg_geschmack' ? { fontWeight: 'bold' } : {}}>
                                                {eisdiele.avg_geschmack !== null && eisdiele.avg_geschmack !== undefined ? Number(eisdiele.avg_geschmack).toFixed(1) : '-'}
                                            </td>
                                            <td style={sortConfigEisbecher.key === 'avg_preisleistung' ? { fontWeight: 'bold' } : {}}>
                                                {eisdiele.avg_preisleistung !== null && eisdiele.avg_preisleistung !== undefined ? Number(eisdiele.avg_preisleistung).toFixed(1) : '-'}
                                            </td>
                                            <td style={sortConfigEisbecher.key === 'ranking_score' ? { fontWeight: 'bold' } : {}} title={`Rohwert: ${Number(eisdiele.raw_score).toFixed(2)}`}>
                                                {eisdiele.ranking_score !== null && eisdiele.ranking_score !== undefined ? Number(eisdiele.ranking_score).toFixed(2) : '-'}
                                            </td>
                                            <td style={sortConfigEisbecher.key === 'distanceKm' ? { fontWeight: 'bold' } : {}}>
                                                {eisdiele.distanceKm !== null && eisdiele.distanceKm !== undefined ? `${Number(eisdiele.distanceKm).toFixed(1)} km` : '-'}
                                            </td>
                                            <td style={sortConfigEisbecher.key === 'checkin_anzahl' ? { fontWeight: 'bold' } : {}}>
                                                {eisdiele.checkin_anzahl} (von {eisdiele.anzahl_nutzer} Nutzer/n)
                                            </td>
                                        </tr>
                                        <DetailsRow visible={expandedRow === `eisbecher-${index}`} className="details-row">
                                            <td colSpan="6">
                                                <DetailsContainer>
                                                    <h3><CleanLink to={`/map/activeShop/${eisdiele.eisdiele_id}`}>{eisdiele.name}</CleanLink></h3>
                                                    <strong>Adresse: </strong>{eisdiele.adresse}<br />
                                                    <strong>Öffnungszeiten: </strong>
                                                    {renderOpenStateBadge(eisdiele)}
                                                    <br />
                                                    {getOpeningHoursLines(eisdiele).map((time, i) => (
                                                        <React.Fragment key={i}>
                                                            {time}<br />
                                                        </React.Fragment>
                                                    ))}
                                                    {renderAttributeSummary(eisdiele.attributes)}
                                                </DetailsContainer>
                                            </td>
                                        </DetailsRow>
                                    </React.Fragment>
                                ))}
                            </tbody>
                                </Table>
                            </TableScrollArea>
                            <RankingScoreExplanation type="eisbecher" />
                        </>
                    )}

                    {rankingLoading && <RankingLoadingState role="status" aria-live="polite" aria-label="Ranking wird geladen">
                        <LoadingTitle>{ratingScope === 'gourmetCyclist' ? 'TheGourmetCyclist-Rating' : ratingScope === 'personal' ? 'Personal-Rating' : 'Globales Rating'} wird geladen …</LoadingTitle>
                        <LoadingRows aria-hidden="true"><LoadingRow /><LoadingRow /><LoadingRow /></LoadingRows>
                    </RankingLoadingState>}
                    {rankingError && <RankingError role="alert">
                        <span>{rankingError}</span>
                        <RetryButton type="button" onClick={() => {
                            rankingCacheRef.current.clear();
                            setRankingError(null);
                            setRankingRetryToken((value) => value + 1);
                        }}>Erneut versuchen</RetryButton>
                    </RankingError>}
                    {showRankingResults && <ResultsContext>
                        <strong>{activeResultCount} passende Eisdielen</strong>
                        <span>{distanceFilter !== 'any' ? `im Umkreis von ${distanceFilter} km` : 'ohne Entfernungsfilter'}</span>
                        {searchTerm.trim() && <span>· Suche: „{searchTerm.trim()}“</span>}
                    </ResultsContext>}
                    {showRankingResults && <MobileResultsToolbar aria-label="Ergebnisübersicht und Sortierung">
                        <MobileResultCount>
                            <strong>{activeResultCount} Treffer</strong>
                            {distanceFilter !== 'any' && <span>· bis {distanceFilter} km</span>}
                        </MobileResultCount>
                        <MobileSortControls>
                            <VisuallyHidden as="label" htmlFor="ranking-mobile-sort">Sortieren nach</VisuallyHidden>
                            <FilterSelect id="ranking-mobile-sort" value={activeSortConfig.key} onChange={handleMobileSortChange}>
                                {mobileSortOptions.map((option) => <option key={option.key} value={option.key}>{option.mobileLabel || option.label}</option>)}
                            </FilterSelect>
                            <MobileSortDirectionButton
                                type="button"
                                onClick={() => setActiveSort(activeSortConfig.key, activeSortConfig.direction === 'ascending' ? 'descending' : 'ascending')}
                                aria-label={`Sortierung: ${activeSortConfig.direction === 'ascending' ? 'aufsteigend' : 'absteigend'}. Reihenfolge umkehren`}
                                title={activeSortConfig.direction === 'ascending' ? 'Aufsteigend – Reihenfolge umkehren' : 'Absteigend – Reihenfolge umkehren'}
                            >
                                <span aria-hidden="true">{activeSortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                            </MobileSortDirectionButton>
                        </MobileSortControls>
                    </MobileResultsToolbar>}
                    {showRankingResults && shouldExpandNearbyResults && (
                        <NearbyFallbackNotice>
                            <span>Nur {strictActiveRows.length} verlässliche Treffer im Umkreis. Weitere nahe Eisdielen mit kleiner Datenbasis werden angezeigt.</span>
                            <button type="button" onClick={() => setShowExpandedNearbyResults(false)}>Nur verlässliche anzeigen</button>
                        </NearbyFallbackNotice>
                    )}
                    {showRankingResults && <MobileResults aria-label="Ranking-Ergebnisse">
                        {activeRows.map((shop, index) => {
                            const detailKey = activeDetailKey(shop, index);
                            const isExpanded = expandedRow === detailKey;
                            return (
                                <RankingCard key={detailKey}>
                                    <RankingCardHeader>
                                        <RankBadge>#{index + 1}</RankBadge>
                                        <CardShopName as={Link} to={`/map/activeShop/${shop.eisdiele_id}`}>{shop.name}</CardShopName>
                                        <ScoreBadge><strong>{formatRating(shop.ranking_score)}</strong><small>Ranking</small></ScoreBadge>
                                    </RankingCardHeader>
                                    <PrimaryMetrics>
                                        <PrimaryMetric><span>Geschmacksfaktor</span><strong>{formatRating(getTasteFactor(shop))}</strong></PrimaryMetric>
                                        <PrimaryMetric><span>Preis-Leistung</span><strong>{formatRating(shop.avg_preisleistung)}</strong></PrimaryMetric>
                                        {!isSingleRaterScope && activeTab !== 'eisbecher' && (
                                            <PrimaryMetric><span>Preis</span><strong>{getPriceLabel(shop)}</strong></PrimaryMetric>
                                        )}
                                        <PrimaryMetric $wide={isSingleRaterScope || activeTab === 'eisbecher'}>
                                            <span>{isSingleRaterScope ? 'Eigene Check-ins' : 'Check-ins'}</span>
                                            <strong>{shop.checkin_anzahl || 0}</strong>
                                        </PrimaryMetric>
                                        {isLowConfidence(shop) && <LowConfidence>geringe Verlässlichkeit</LowConfidence>}
                                    </PrimaryMetrics>
                                    <CardDetailsButton type="button" onClick={() => toggleDetails(detailKey)} aria-expanded={isExpanded}>
                                        {isExpanded ? 'Details ausblenden' : 'Details anzeigen'}
                                        {isExpanded ? <ChevronUp size={17} aria-hidden="true" /> : <ChevronDown size={17} aria-hidden="true" />}
                                    </CardDetailsButton>
                                    {isExpanded && renderShopDetails(shop)}
                                </RankingCard>
                            );
                        })}
                    </MobileResults>}

                    {showRankingResults && <DesktopResults>
                        <TableScrollArea>
                            <Table>
                                <thead>
                                    <tr>
                                        <th>Eisdiele</th>
                                        <th><SortButton type="button" $active={activeSortConfig.key === 'ranking_score'} onClick={() => sortActiveRows('ranking_score')}>Ranking {activeSortConfig.key === 'ranking_score' && (activeSortConfig.direction === 'ascending' ? '▲' : '▼')}</SortButton></th>
                                        <th><SortButton type="button" $active={activeSortConfig.key === tasteFactorKey} onClick={() => sortActiveRows(tasteFactorKey)}>Geschmacksfaktor {activeSortConfig.key === tasteFactorKey && (activeSortConfig.direction === 'ascending' ? '▲' : '▼')}</SortButton></th>
                                        <th><SortButton type="button" $active={activeSortConfig.key === 'avg_preisleistung'} onClick={() => sortActiveRows('avg_preisleistung')}>Preis-Leistung {activeSortConfig.key === 'avg_preisleistung' && (activeSortConfig.direction === 'ascending' ? '▲' : '▼')}</SortButton></th>
                                        {activeTab !== 'eisbecher' && <th><SortButton type="button" $active={activeSortConfig.key === activePriceKey} onClick={() => sortActiveRows(activePriceKey)}>Preis {activeSortConfig.key === activePriceKey && (activeSortConfig.direction === 'ascending' ? '▲' : '▼')}</SortButton></th>}
                                        <th><SortButton type="button" title="Sortiert nach unterschiedlichen Nutzern" $active={activeSortConfig.key === 'nutzeranzahl'} onClick={() => sortActiveRows('nutzeranzahl')}>Bewertungen &amp; Nutzer {activeSortConfig.key === 'nutzeranzahl' && (activeSortConfig.direction === 'ascending' ? '▲' : '▼')}</SortButton></th>
                                        <th aria-label="Details" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeRows.map((shop, index) => {
                                        const detailKey = activeDetailKey(shop, index);
                                        const isExpanded = expandedRow === detailKey;
                                        return (
                                            <React.Fragment key={detailKey}>
                                                <tr>
                                                    <td><RankInline>#{index + 1}</RankInline><ShopLink to={`/map/activeShop/${shop.eisdiele_id}`}>{shop.name}</ShopLink></td>
                                                    <td><RankingValue title={`Rohwert: ${formatRating(shop.raw_score)}`}>{formatRating(shop.ranking_score)}</RankingValue></td>
                                                    <td>{formatRating(getTasteFactor(shop))}</td>
                                                    <td>{formatRating(shop.avg_preisleistung)}</td>
                                                    {activeTab !== 'eisbecher' && <td>{getPriceLabel(shop)}</td>}
                                                    <td>{shop.checkin_anzahl || 0} Check-ins{!isSingleRaterScope && <SmallValue>von {getUniqueRaters(shop)} Nutzern{isLowConfidence(shop) && ' · niedrig'}</SmallValue>}</td>
                                                    <td><DetailsButton type="button" onClick={() => toggleDetails(detailKey)} aria-expanded={isExpanded}>Details <ChevronDown size={16} aria-hidden="true" /></DetailsButton></td>
                                                </tr>
                                                {isExpanded && <DetailsRow visible className="details-row"><td colSpan={activeTab === 'eisbecher' ? 6 : 7}>{renderShopDetails(shop)}</td></DetailsRow>}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </TableScrollArea>
                    </DesktopResults>}

                    {showRankingResults && <ScoreExplanationToggle type="button" onClick={() => setShowScoreExplanation((current) => !current)} aria-expanded={showScoreExplanation}>
                        <span><Calculator size={17} aria-hidden="true" /> So wird das Ranking berechnet</span>
                        <ChevronDown size={18} aria-hidden="true" />
                    </ScoreExplanationToggle>}
                    {showRankingResults && showScoreExplanation && <RankingScoreExplanation type={activeTab} isSingleRaterScope={isSingleRaterScope} />}

                </TableContainer>
            </Container>
        </RankingPage>
    );
};

export default Ranking;

const CleanLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`;

const RankingPage = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(255, 218, 140, 0.35), transparent 45%),
    linear-gradient(180deg, #fffaf0 0%, #fff7e5 100%);
`;

const Container = styled.div`
  padding: 0.5rem;
  background: transparent;
  min-height: calc(100vh - 72px);
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: center;

  @media (max-width: 768px) {
    padding: 0.35rem;
    gap: 1rem;
  }
`;

const TableContainer = styled.div`
  justify-content: center;
  text-align: left;
  width: 100%;
  max-width: 1440px;
`;

const HeroCard = styled.div`
  padding: 0.7rem 0.25rem 0.5rem;
  margin-bottom: 0.25rem;

  @media (max-width: 768px) {
    padding: 0.4rem 0.1rem 0.2rem;
    margin-bottom: 0.2rem;
  }
`;

const PageTitle = styled.h2`
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  font-size: clamp(1.35rem, 2vw, 1.8rem);
  color: #2f2100;
  line-height: 1.2;
`;

const MetaChips = styled.div`
  margin-top: 0.7rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  justify-content: center;
`;

const MetaChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  background: rgba(255, 181, 34, 0.14);
  border: 1px solid rgba(255, 181, 34, 0.28);
  color: #6c4500;
  font-size: 0.8rem;
  font-weight: 700;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 760px;

  th, td {
    border-bottom: 1px solid rgba(47, 33, 0, 0.08);
    padding: 10px 10px;
    text-align: center;
  }

  th:first-child,
  td:first-child {
    text-align: left;
  }
  th {
    cursor: pointer;
    background: rgba(255, 252, 243, 0.98);
    color: #5f3f00;
    font-weight: 800;
    font-size: 0.85rem;
    position: sticky;
    top: 0;
    z-index: 2;
    white-space: nowrap;
  }

  td {
    color: #2f2100;
    font-size: 0.92rem;
    background: rgba(255, 255, 255, 0.72);
  }

  tbody tr:not(.details-row):hover td {
    background: rgba(255, 181, 34, 0.08);
  }

  tbody tr:not(.details-row):nth-child(4n + 1) td {
    background: rgba(255, 255, 255, 0.9);
  }

  tbody tr:not(.details-row) td:first-child {
    font-weight: 700;
  }

  @media (max-width: 768px) {
    min-width: 700px;
    table-layout: fixed;

    th,
    td {
      padding: 6px 6px;
      font-size: 0.78rem;
      line-height: 1.15;
    }

    th:first-child {
      position: sticky;
      left: 0;
      width: 124px;
      min-width: 124px;
      max-width: 124px;
      z-index: 3;
    }

    tbody tr:not(.details-row) td:first-child {
      position: sticky;
      left: 0;
      width: 124px;
      min-width: 124px;
      max-width: 124px;
      z-index: 3;
    }

    th:not(:first-child),
    tbody tr:not(.details-row) td:not(:first-child) {
      width: 72px;
      min-width: 72px;
      max-width: 72px;
      white-space: normal;
      word-break: break-word;
      text-align: center;
    }

    th:first-child {
      z-index: 5;
      background: rgba(255, 252, 243, 0.99);
      box-shadow: 1px 0 0 rgba(47, 33, 0, 0.08);
    }

    tbody tr:not(.details-row) td:first-child {
      box-shadow: 1px 0 0 rgba(47, 33, 0, 0.08);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    tbody tr.details-row td {
      width: auto;
      min-width: 0;
      max-width: none;
      z-index: 1;
      background: rgba(255, 252, 243, 0.98);
      box-sizing: border-box;
      padding: 0.4rem;
      border-bottom: 1px solid rgba(47, 33, 0, 0.08);
    }
  }
`;

const TableScrollArea = styled.div`
  width: 100%;
  overflow-x: auto;
  border-radius: 16px;
  border: 1px solid rgba(47, 33, 0, 0.08);
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.08);
  background: rgba(255, 252, 243, 0.92);
`;

const MobileResults = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: grid;
    gap: 0.6rem;
  }
`;

const MobileResultsToolbar = styled.div`
  display: none;

  @media (max-width: 768px) {
    min-height: 44px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(108px, 0.9fr) 44px;
    align-items: center;
    gap: 0.4rem;
    margin: 0 0 0.6rem;
  }
`;

const MobileResultCount = styled.div`
  min-width: 0;
  overflow: hidden;
  color: #6c4500;
  font-size: 0.8rem;
  white-space: nowrap;
  text-overflow: ellipsis;

  strong {
    color: #2f2100;
    font-size: 0.88rem;
  }
`;

const MobileSortControls = styled.div`
  display: contents;

  select {
    min-width: 0;
  }
`;

const MobileSortDirectionButton = styled.button`
  min-height: 44px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(47, 33, 0, 0.14);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.95);
  color: #5f3f00;
  font: inherit;
  font-size: 1.2rem;
  font-weight: 800;
  cursor: pointer;

  &:focus-visible {
    outline: 3px solid rgba(255, 181, 34, 0.45);
    outline-offset: 2px;
  }
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const DesktopResults = styled.div`
  display: block;

  @media (max-width: 768px) {
    display: none;
  }
`;

const ResultsContext = styled.div`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: 0.7rem 0 0.45rem;
  color: #6c4500;
  font-size: 0.85rem;

  strong {
    color: #2f2100;
    font-size: 0.95rem;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const RankingLoadingState = styled.div`
  margin: 0.7rem 0 0.8rem;
  padding: 0.9rem;
  border: 1px solid rgba(255, 181, 34, 0.28);
  border-radius: 12px;
  background: rgba(255, 252, 243, 0.82);
  color: #754500;
`;

const LoadingTitle = styled.strong`
  display: block;
  font-size: 0.9rem;
`;

const LoadingRows = styled.div`
  display: grid;
  gap: 0.45rem;
  margin-top: 0.7rem;
`;

const LoadingRow = styled.div`
  height: 1.7rem;
  border-radius: 7px;
  background: linear-gradient(90deg, rgba(255, 226, 169, 0.42), rgba(255, 247, 226, 0.9), rgba(255, 226, 169, 0.42));
  background-size: 200% 100%;
  animation: ranking-shimmer 1.4s ease-in-out infinite;

  @keyframes ranking-shimmer {
    from { background-position: 100% 0; }
    to { background-position: -100% 0; }
  }
`;

const RankingError = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 0.7rem 0 0.8rem;
  padding: 0.8rem 0.9rem;
  border: 1px solid rgba(176, 0, 32, 0.2);
  border-radius: 12px;
  background: rgba(255, 235, 238, 0.86);
  color: #8a1c2b;

  @media (max-width: 520px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const RetryButton = styled.button`
  min-height: 36px;
  padding: 0.35rem 0.7rem;
  border: 1px solid rgba(138, 28, 43, 0.24);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.8);
  color: #8a1c2b;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
`;

const NearbyFallbackNotice = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 0 0 0.55rem;
  padding: 0.6rem 0.7rem;
  border-left: 3px solid #ffb522;
  border-radius: 8px;
  background: rgba(255, 244, 217, 0.62);
  color: #6b4a08;
  font-size: 0.82rem;
  line-height: 1.4;

  button {
    flex: 0 0 auto;
    min-height: 34px;
    border: 0;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.88);
    color: #754500;
    font: inherit;
    font-size: 0.78rem;
    font-weight: 800;
    cursor: pointer;
  }

  @media (max-width: 768px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.45rem;
  }
`;

const RankingCard = styled.article`
  overflow: hidden;
  border: 1px solid rgba(47, 33, 0, 0.09);
  border-radius: 14px;
  background: rgba(255, 252, 243, 0.94);
  box-shadow: none;
`;

const RankingCardHeader = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 0.75rem 0.45rem;
`;

const RankBadge = styled.strong`
  min-width: 2.15rem;
  color: #754500;
  font-size: 1rem;
`;

const CardShopName = styled.strong`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #2f2100;
  text-decoration: none;

  &:hover {
    color: #8a5600;
    text-decoration: underline;
  }
`;

const ScoreBadge = styled.span`
  display: grid;
  justify-items: end;
  color: #754500;

  strong { font-size: 1.15rem; }
  small { margin-top: 0.1rem; color: rgba(95, 63, 0, 0.68); font-size: 0.66rem; font-weight: 700; }
`;

const PrimaryMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem 0.9rem;
  padding: 0 0.75rem 0.5rem;
`;

const PrimaryMetric = styled.span`
  display: grid;
  gap: 0.12rem;
  min-width: 0;
  grid-column: ${({ $wide }) => $wide ? '1 / -1' : 'auto'};

  span { color: rgba(95, 63, 0, 0.72); font-size: 0.7rem; font-weight: 700; }
  strong { color: #493100; font-size: 0.92rem; }
`;

const LowConfidence = styled.span`
  grid-column: 1 / -1;
  color: #936000;
  font-size: 0.72rem;
  font-weight: 700;
`;

const CardDetailsButton = styled.button`
  width: calc(100% - 1.5rem);
  min-height: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0.75rem;
  padding: 0.2rem 0;
  border: 0;
  border-top: 1px solid rgba(47, 33, 0, 0.08);
  background: transparent;
  color: #795817;
  font: inherit;
  font-size: 0.76rem;
  font-weight: 800;
  cursor: pointer;
`;

const SortButton = styled.button`
  border: 0;
  background: transparent;
  color: ${({ $active }) => ($active ? '#2f2100' : '#5f3f00')};
  font: inherit;
  font-weight: 800;
  cursor: pointer;
`;

const RankInline = styled.span`
  display: inline-flex;
  min-width: 2.4rem;
  color: #8a5a00;
  font-weight: 800;
`;

const ShopLink = styled(Link)`
  color: #2f2100;
  text-decoration: none;

  &:hover {
    color: #8a5600;
    text-decoration: underline;
  }
`;

const RankingValue = styled.strong`
  color: #5b3700;
  font-size: 1rem;
`;

const SmallValue = styled.small`
  display: block;
  margin-top: 0.12rem;
  color: rgba(47, 33, 0, 0.64);
`;

const DetailsButton = styled.button`
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  border: 0;
  border-radius: 8px;
  background: rgba(255, 181, 34, 0.13);
  color: #754500;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
`;

const DetailMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem 0.8rem;
  margin: 0 0 0.7rem;
`;

const DetailMetric = styled.span`
  display: grid;
  gap: 0.1rem;
  min-width: 0;
  grid-column: ${({ $wide }) => $wide ? '1 / -1' : 'auto'};

  span { color: rgba(47, 33, 0, 0.68); font-size: 0.75rem; font-weight: 700; }
  strong { color: #5f3f00; font-size: 0.88rem; }
`;
const Explanation = styled.div`
  margin-top: 2rem;
  text-align: center;
  background: rgba(255, 252, 243, 0.94);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.08);
  padding: 1rem;
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

const ScoreExplanationToggle = styled.button`
  width: 100%;
  min-height: 46px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  margin-top: 1rem;
  padding: 0.55rem 0.8rem;
  border: 1px solid rgba(217, 119, 6, 0.24);
  border-radius: 12px;
  background: rgba(255, 244, 217, 0.68);
  color: #754500;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 800;
  cursor: pointer;

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
`;

const DetailsContainer = styled.div`
  text-align: left;
  background: rgba(255, 252, 243, 0.72);
  border-top: 1px solid rgba(255, 181, 34, 0.25);
  border-radius: 0;
  padding: 0.8rem 0.75rem 0.75rem;
  width: 100%;
  box-sizing: border-box;
  overflow-wrap: anywhere;
  strong {
    font-weight: bold;
    color: #5f3f00;
  }

  @media (max-width: 768px) {
    padding: 0.7rem 0.75rem 0.75rem;
    width: 100%;
    max-width: none;
  }
`;

const DetailInformation = styled.div`
  display: grid;
  gap: 0.35rem;
  margin-top: 0.1rem;
  color: rgba(47, 33, 0, 0.82);
  font-size: 0.82rem;
`;

const DetailInformationRow = styled.div`
  display: grid;
  grid-template-columns: minmax(6.6rem, auto) minmax(0, 1fr);
  align-items: baseline;
  gap: 0.5rem;

  strong { color: #6b4a08; }
`;

const OpeningHoursPreview = styled.p`
  margin: 0.1rem 0 0;
  color: rgba(47, 33, 0, 0.72);
  line-height: 1.45;
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

  @media (max-width: 768px) {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.2rem;
    margin-bottom: 0.45rem;
    padding: 0.25rem;
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
    box-shadow: ${(props) => (props.$active ? '0 2px 8px rgba(255,181,34,0.25)' : 'none')};
    transition: background-color 0.15s ease, box-shadow 0.15s ease, color 0.15s ease;

    &:hover {
        background-color: ${(props) => (props.$active ? '#ffbf3f' : 'rgba(255,181,34,0.1)')};
    }

    &:focus-visible {
        outline: 3px solid rgba(255, 181, 34, 0.5);
        outline-offset: 2px;
    }

    @media (max-width: 768px) {
        min-height: 44px;
        padding: 0.45rem 0.2rem;
        font-size: 0.88rem;
    }
`;

const FiltersPanel = styled.div`
  border-top: 1px solid rgba(47, 33, 0, 0.1);
  padding: 0.85rem 0.1rem 0.2rem;
`;

const FilterCard = styled.section`
  margin-bottom: 1rem;
  padding: 0.25rem 0.75rem 0.65rem;
  border: 1px solid rgba(47, 33, 0, 0.1);
  border-radius: 16px;
  background: rgba(255, 252, 243, 0.94);
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.07);

  @media (max-width: 768px) {
    margin-bottom: 0.65rem;
    padding: 0.2rem 0.6rem 0.45rem;
  }
`;

const QuickFiltersBar = styled.div`
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(180px, 0.7fr) auto;
  align-items: end;
  gap: 0.75rem;
  padding: 0.65rem 0.1rem;
  margin-bottom: 0.45rem;
  border: 0;
  border-bottom: 1px solid rgba(47, 33, 0, 0.1);
  border-radius: 0;
  background: transparent;
  box-shadow: none;

  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr;
    gap: 0.45rem;
    padding: 0.45rem 0.1rem;

    & > div:first-child {
      grid-column: 1 / -1;
    }
  }
`;

const ClosedFilterSummary = styled.div`
  margin: 0.2rem 0 0.25rem;
  padding: 0 0.1rem;
  color: #765116;
  font-size: 0.78rem;
  font-weight: 700;
`;

const FilterPanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.65rem;
  color: #4b3511;
  font-size: 0.9rem;

  span {
    color: #8a631e;
    font-size: 0.78rem;
    font-weight: 700;
  }
`;

const CompactLocationHint = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  margin: -0.15rem 0 0.55rem;
  color: #765116;
  font-size: 0.78rem;
`;

const FiltersRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: flex-start;
  margin: 0.4rem 0 0.8rem;
`;

const FiltersToggleBar = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 0.5rem;
`;

const FiltersToggleButton = styled.button`
  padding: 0.4rem 1.2rem;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  border-radius: 999px;
  border: 1px solid #ffb522;
  background-color: rgba(255, 244, 217, 0.95);
  color: #7b4a00;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(255, 181, 34, 0.12);

  &:hover {
    background-color: #ffe2a9;
  }

  &:focus-visible {
    outline: 3px solid rgba(255, 181, 34, 0.45);
    outline-offset: 2px;
  }

  white-space: nowrap;

  svg:last-child {
    transition: transform 0.18s ease;
    transform: rotate(${({ $expanded }) => ($expanded ? '180deg' : '0deg')});
  }

  @media (max-width: 768px) {
    min-width: 0;
    width: 100%;
    padding-inline: 0.7rem;
  }
`;

const FilterButtonSummary = styled.small`
  color: rgba(95, 63, 0, 0.72);
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;

  @media (max-width: 768px) {
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 180px;
  text-align: left;

  @media (max-width: 768px) {
    min-width: 0;
  }
`;

const FilterLabel = styled.label`
  font-size: 0.85rem;
  margin-bottom: 0.3rem;
  text-align: left;
  color: #6b5327;
  font-weight: 700;
`;

const FilterInput = styled.input`
  padding: 0.45rem 0.6rem;
  border-radius: 10px;
  border: 1px solid rgba(47, 33, 0, 0.14);
  font-size: 0.95rem;
  background: rgba(255, 255, 255, 0.95);
  color: #2f2100;
  min-height: 44px;
`;

const FilterSelect = styled.select`
  padding: 0.45rem 0.6rem;
  border-radius: 10px;
  border: 1px solid rgba(47, 33, 0, 0.14);
  font-size: 0.95rem;
  background: rgba(255, 255, 255, 0.95);
  color: #2f2100;
  min-height: 44px;
`;

const FavoriteFilterButton = styled.button`
  min-height: 44px;
  padding: 0.45rem 0.7rem;
  border: 1px solid ${({ $active }) => $active ? 'rgba(255, 181, 34, 0.9)' : 'rgba(47, 33, 0, 0.14)'};
  border-radius: 10px;
  background: ${({ $active }) => $active ? 'rgba(255, 181, 34, 0.2)' : 'rgba(255, 255, 255, 0.95)'};
  color: #4b3100;
  font: inherit;
  font-weight: 700;
  text-align: left;
  cursor: pointer;

  &:focus-visible { outline: 3px solid rgba(31, 104, 220, 0.7); outline-offset: 2px; }
`;

const AttributeFilterSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.6rem;
  margin-bottom: 1rem;
`;

const AttributeToggleButton = styled.button`
  align-self: flex-start;
  padding: 0.4rem 1.2rem;
  border: 1px solid rgba(255, 181, 34, 0.45);
  border-radius: 999px;
  background-color: rgba(255, 255, 255, 0.9);
  color: #7b4a00;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background-color: #fff4d9;
  }
`;

const AttributeFilterWrapper = styled.div`
  width: 100%;
  padding: 0.25rem 0.75rem 0.75rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(47, 33, 0, 0.06);
`;

const AttributeFilterContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
  max-height: 180px;
  overflow-y: auto;
  padding-right: 0.25rem;
`;

const AttributePill = styled.button`
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid ${(props) => (props.$active ? '#ffb522' : 'rgba(47,33,0,0.15)')};
  background-color: ${(props) => (props.$active ? '#fff4d9' : 'rgba(255,255,255,0.95)')};
  cursor: pointer;
  font-size: 0.85rem;
  color: #4f390f;
  transition: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;

  &:hover {
    border-color: #ffb522;
  }
`;

const ClearFilterButton = styled.button`
  margin-top: 0.5rem;
  border: none;
  background: none;
  color: #8c4600;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0;
  text-decoration: underline;

  &:hover {
    color: #6f3200;
  }
`;

const AttributeSummary = styled.div`
  margin-top: 0.75rem;
  strong {
    display: block;
    margin-bottom: 0.35rem;
  }
`;

const AttributeBadges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`;

const AttributeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  box-sizing: border-box;
  gap: 0.25rem;
  padding: 0.18rem 0.5rem;
  border-radius: 999px;
  background-color: #ffd480;
  border: 1px solid #ffb522;
  font-size: 0.76rem;
  color: #7a0900;
  text-decoration: none;

  &:hover {
    background-color: #ffe2a9;
  }

  &:focus-visible {
    outline: 3px solid rgba(31, 104, 220, 0.65);
    outline-offset: 2px;
  }

  em {
    font-style: normal;
    color: #710000;
    font-weight: 600;
  }
`;

const OpenBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.5rem;
  margin-left: 0.35rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ $open }) => ($open ? '#0f5132' : '#6c757d')};
  background: ${({ $open }) => ($open ? 'rgba(63, 177, 117, 0.2)' : 'rgba(108, 117, 125, 0.2)')};
`;

const FilterHint = styled.p`
  text-align: center;
  font-size: 0.85rem;
  color: #6b5327;
  margin: 0.5rem 0 1rem;
`;

const LocationHint = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: #6b5327;
  margin-bottom: 1rem;
`;

const LocationButton = styled.button`
  padding: 0.4rem 1rem;
  background-color: #ffb522;
  color: #2f2100;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(255, 181, 34, 0.2);

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LocationError = styled.span`
  color: #b00020;
  font-size: 0.8rem;
`;

const ScoreExplanation = styled.div`
  background: linear-gradient(145deg, rgba(255,255,255,0.98), rgba(255,247,226,0.96));
  padding: clamp(1.1rem, 3vw, 2rem);
  border-radius: 14px;
  border: 1px solid rgba(47, 33, 0, 0.08);
  box-shadow: 0 10px 26px rgba(28, 20, 0, 0.07);
  text-align: left;
  color: #2f2100;
`;

const ExplanationKicker = styled.p`
  margin: 0;
  color: #966000;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const ExplanationTitle = styled.h2`
  margin: 0.25rem 0 0;
  color: #422c00;
  font-size: clamp(1.3rem, 3vw, 1.7rem);
  line-height: 1.25;
`;

const ExplanationLead = styled.p`
  margin: 0.7rem 0 1.25rem;
  max-width: 720px;
  color: #5f4a23;
  line-height: 1.6;
`;

const ExplanationSteps = styled.div`
  display: grid;
  gap: 0.75rem;
`;

const ExplanationStep = styled.article`
  display: grid;
  grid-template-columns: 2.4rem minmax(0, 1fr);
  gap: 0.8rem;
  padding: 0.9rem;
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.72);
`;

const StepIcon = styled.div`
  display: grid;
  place-items: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 10px;
  color: #8a5000;
  background: rgba(255, 181, 34, 0.2);
`;

const StepContent = styled.div`
  min-width: 0;

  h3 {
    margin: 0;
    color: #4c3400;
    font-size: 1rem;
  }

  p {
    margin: 0.25rem 0 0;
    color: #5f4a23;
    line-height: 1.55;
  }
`;

const Formula = styled.code`
  display: inline-block;
  max-width: 100%;
  margin-top: 0.55rem;
  padding: 0.35rem 0.55rem;
  overflow-x: auto;
  border-radius: 7px;
  background: rgba(47, 33, 0, 0.06);
  color: #4c3400;
  font-size: 0.84rem;
  white-space: nowrap;
`;

const FormulaInline = styled.code`
  padding: 0.05rem 0.28rem;
  border-radius: 4px;
  background: rgba(47, 33, 0, 0.07);
  color: #4c3400;
  font-size: 0.9em;
`;

const ExplanationNote = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  margin-top: 1rem;
  padding: 0.8rem 0.9rem;
  border-radius: 10px;
  background: rgba(71, 177, 117, 0.1);
  color: #285e40;
  font-size: 0.9rem;
  line-height: 1.5;

  svg {
    flex: 0 0 auto;
    margin-top: 0.1rem;
  }
`;
