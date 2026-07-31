import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Header from "../Header";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { formatOpeningHoursLines, hydrateOpeningHours } from "../utils/openingHours";
import { formatDateTimeLocalInputValue } from "../utils/dateTimeLocal";
import Seo from "../components/Seo";
import { Calculator, ChartNoAxesCombined, ChevronDown, MapPin, ShieldCheck, SlidersHorizontal, Trophy, UsersRound } from "lucide-react";

const EARTH_RADIUS_KM = 6371;
const toRadians = (value) => (value * Math.PI) / 180;

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

const RankingScoreExplanation = ({ type }) => {
    const copy = rankingExplanationCopy[type];

    return (
        <Explanation>
            <ScoreExplanation>
                <ExplanationKicker>Transparentes Community-Ranking</ExplanationKicker>
                <ExplanationTitle>So entsteht das {copy.label}-Ranking</ExplanationTitle>
                <ExplanationLead>
                    Die Spalte „Ranking“ zeigt einen stabilisierten Score. Er belohnt gute Bewertungen,
                    ohne einzelne oder wenige Bewertungen zu stark zu überbewerten.
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

                    <ExplanationStep>
                        <StepIcon style={rankingStepIconStyles.blue}><UsersRound size={20} aria-hidden="true" /></StepIcon>
                        <StepContent>
                            <h3>2. Fairer Nutzer-Durchschnitt</h3>
                            <p>
                                Pro Nutzer und Eisdiele werden die Check-ins zunächst gemittelt. Dieses
                                Nutzer-Ergebnis erhält das Gewicht <FormulaInline>√(Anzahl Check-ins)</FormulaInline> –
                                mehr Erfahrung zählt also, aber mit abnehmendem Einfluss.
                            </p>
                        </StepContent>
                    </ExplanationStep>

                    <ExplanationStep>
                        <StepIcon style={rankingStepIconStyles.violet}><ChartNoAxesCombined size={20} aria-hidden="true" /></StepIcon>
                        <StepContent>
                            <h3>3. Rohwert der Eisdiele</h3>
                            <p>
                                Die gewichteten Nutzer-Durchschnitte werden zum Rohwert zusammengeführt:
                            </p>
                            <Formula>Σ(Nutzer-Score × Nutzer-Gewicht) / Σ(Nutzer-Gewichte)</Formula>
                        </StepContent>
                    </ExplanationStep>

                    <ExplanationStep>
                        <StepIcon style={rankingStepIconStyles.green}><ShieldCheck size={20} aria-hidden="true" /></StepIcon>
                        <StepContent>
                            <h3>4. Stabilisierung nach Nutzerzahl</h3>
                            <p>
                                Der finale Ranking-Score wird bei wenigen unterschiedlichen Nutzern zum
                                Durchschnitt aller {copy.label}-Eisdielen hingezogen. Mit wachsender
                                Nutzerzahl nähert er sich dem Rohwert an.
                            </p>
                            <Formula>n/(n + {copy.stabilizer}) × Rohwert + {copy.stabilizer}/(n + {copy.stabilizer}) × Kategorien-Durchschnitt</Formula>
                        </StepContent>
                    </ExplanationStep>
                </ExplanationSteps>

                <ExplanationNote>
                    <ShieldCheck size={18} aria-hidden="true" />
                    <span><strong>Verlässliche Datenbasis:</strong> Der Standardfilter zeigt nur Eisdielen mit {copy.reliability}. Die Stabilisierung bleibt auch bei „Alle inklusive weniger Daten“ aktiv.</span>
                </ExplanationNote>
            </ScoreExplanation>
        </Explanation>
    );
};

const Ranking = () => {
    const { userId, userPosition, setUserPosition } = useUser();
    const [eisdielenKugel, setEisdielenKugel] = useState([]);
    const [eisdielenSofteis, setEisdielenSofteis] = useState([]);
    const [eisdielenEisbecher, setEisdielenEisbecher] = useState([]);
    const [sortConfigKugel, setSortConfigKugel] = useState({ key: 'ranking_score', direction: 'descending' });
    const [sortConfigSofteis, setSortConfigSofteis] = useState({ key: 'ranking_score', direction: 'descending' });
    const [sortConfigEisbecher, setSortConfigEisbehcer] = useState({ key: 'ranking_score', direction: 'descending' });
    const [expandedRow, setExpandedRow] = useState(null);
    const [activeTab, setActiveTab] = useState('kugel');
    const [searchTerm, setSearchTerm] = useState('');
    const [distanceFilter, setDistanceFilter] = useState('any');
    const [ratingScope, setRatingScope] = useState('global');
    const [reliabilityMode, setReliabilityMode] = useState('reliable');
    const [locationStatus, setLocationStatus] = useState(userPosition ? 'available' : 'idle');
    const [locationError, setLocationError] = useState(null);
    const [attributeOptions, setAttributeOptions] = useState([]);
    const [selectedAttributes, setSelectedAttributes] = useState([]);
    const [eisdieleAttributes, setEisdieleAttributes] = useState({});
    const [showAttributeFilters, setShowAttributeFilters] = useState(false);
    const [openFilterMode, setOpenFilterMode] = useState('all');
    const [openFilterDateTime, setOpenFilterDateTime] = useState('');
    const [attributeCountsByTab, setAttributeCountsByTab] = useState({
        kugel: {},
        softeis: {},
        eisbecher: {}
    });
    const [areFiltersExpanded, setAreFiltersExpanded] = useState(false);
    const [showScoreExplanation, setShowScoreExplanation] = useState(false);
    const [showHeroDescription, setShowHeroDescription] = useState(false);
    const [showExpandedNearbyResults, setShowExpandedNearbyResults] = useState(true);
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
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
            return;
        }

        if (ratingScope === 'personal' && !userId) {
            setRatingScope('global');
            return;
        }

        const fetchData = async () => {
            try {
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
                if (openFilterQueryString) {
                    queryParts.push(openFilterQueryString);
                }
                const query = queryParts.length ? `?${queryParts.join('&')}` : '';
                const response = await fetch(`${apiUrl}/api/rankings.php${query}`);
                if (!response.ok) throw new Error('Fehler beim Abrufen des Rankings');
                const payload = await response.json();
                const dataKugel = Array.isArray(payload.kugel) ? payload.kugel : [];
                const dataSofteis = Array.isArray(payload.softeis) ? payload.softeis : [];
                const dataEisbecher = Array.isArray(payload.eisbecher) ? payload.eisbecher : [];

                setEisdielenKugel(dataKugel);
                setEisdielenSofteis(dataSofteis);
                setEisdielenEisbecher(dataEisbecher);
                syncAttributeFilters({
                    kugel: dataKugel,
                    softeis: dataSofteis,
                    eisbecher: dataEisbecher
                });
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [apiUrl, ratingScope, userId, syncAttributeFilters, openFilterQueryString]);

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
        setRatingScope(value);
        if (value === 'personal') {
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
                        <AttributeBadge key={`${attribute.id}-${attribute.name}`}>
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

        const sortableItems = [...filteredItems];
        sortableItems.sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            if (!isNaN(aValue) && !isNaN(bValue)) {
                aValue = parseFloat(aValue);
                bValue = parseFloat(bValue);
            }

            if (aValue === null || aValue === undefined) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            if (bValue === null || bValue === undefined) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }

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
    const activeSortConfig = activeTab === 'kugel'
        ? sortConfigKugel
        : activeTab === 'softeis'
            ? sortConfigSofteis
            : sortConfigEisbecher;
    const sortActiveRows = activeTab === 'kugel'
        ? sortTableKugel
        : activeTab === 'softeis'
            ? sortTableSofteis
            : sortTableEisbecher;
    const tasteFactorKey = activeTab === 'softeis' ? 'finaler_geschmacksfaktor' : 'avg_geschmacksfaktor';
    const activeDetailKey = (shop, index) => `${activeTab}-${shop.eisdiele_id || index}`;
    const formatRating = (value, digits = 2) => value === null || value === undefined || value === ''
        ? '–'
        : Number(value).toFixed(digits);
    const getTasteFactor = (shop) => shop[tasteFactorKey] ?? shop.avg_geschmacksfaktor ?? shop.finaler_geschmacksfaktor ?? shop.avg_geschmack;
    const getUniqueRaters = (shop) => Number(shop.nutzeranzahl ?? shop.anzahl_nutzer ?? 0);
    const isLowConfidence = (shop) => reliabilityMode === 'reliable' && getUniqueRaters(shop) < minimumUsersForTab(activeTab);
    const getPriceLabel = (shop) => {
        if (shop.kugel_preis_eur === null || shop.kugel_preis_eur === undefined) return '–';
        const euro = `${Number(shop.kugel_preis_eur).toFixed(2)} €`;
        if (shop.kugel_waehrung && shop.kugel_waehrung !== '€' && shop.kugel_preis !== null && shop.kugel_preis !== undefined) {
            return `${euro} (${Number(shop.kugel_preis).toFixed(2)} ${shop.kugel_waehrung})`;
        }
        return euro;
    };
    const filterSummary = [
        ratingScope === 'global' ? 'Global' : ratingScope === 'gourmetCyclist' ? 'TheGourmetCyclist' : 'Persönlich',
        reliabilityMode === 'reliable' ? 'verlässlich' : 'alle Daten',
        openFilterMode === 'now' ? 'jetzt geöffnet' : openFilterMode === 'custom' ? 'zu Termin geöffnet' : 'alle Zeiten',
    ].join(' · ');
    const renderShopDetails = (shop) => (
        <DetailsContainer>
            <h3><CleanLink to={`/map/activeShop/${shop.eisdiele_id}`}>{shop.name}</CleanLink></h3>
            <DetailMetrics>
                <span>Geschmack <strong>{formatRating(shop.avg_geschmack, 1)}</strong></span>
                {activeTab !== 'eisbecher' && <span>Waffel <strong>{formatRating(shop.avg_waffel, 1)}</strong></span>}
                <span>Entfernung <strong>{shop.distanceKm !== null && shop.distanceKm !== undefined ? `${Number(shop.distanceKm).toFixed(1)} km` : '–'}</strong></span>
                <span>Check-ins <strong>{shop.checkin_anzahl || 0}</strong></span>
            </DetailMetrics>
            <strong>Adresse: </strong>{shop.adresse || '–'}<br />
            <strong>Öffnungszeiten: </strong>{renderOpenStateBadge(shop)}<br />
            {getOpeningHoursLines(shop).map((time, i) => <React.Fragment key={i}>{time}<br /></React.Fragment>)}
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
                    <FilterLabel htmlFor="ranking-reliability">Datenbasis</FilterLabel>
                    <FilterSelect id="ranking-reliability" value={reliabilityMode} onChange={(event) => setReliabilityMode(event.target.value)}>
                        <option value="reliable">Verlässlich (empfohlen)</option>
                        <option value="all">Alle inklusive weniger Daten</option>
                    </FilterSelect>
                    <FilterHint>
                        {activeTab === 'kugel' ? 'mindestens 3 unterschiedliche Nutzer' : 'mindestens 2 unterschiedliche Nutzer'}
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
            </FiltersRow>
            {attributeOptions.length > 0 && (
                <AttributeFilterSection>
                    <AttributeToggleButton
                        type="button"
                        onClick={() => setShowAttributeFilters((prev) => !prev)}
                    >
                        {showAttributeFilters ? 'Attribute-Filter verbergen' : 'Attribute-Filter anzeigen'}
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
                <TableContainer className="container">
                    <HeroCard>
                        <PageTitle><Trophy size={31} aria-hidden="true" /> Eisdielen-Ranking</PageTitle>
                        <PageSubtitle $expanded={showHeroDescription}>
                          Vergleiche Eisdielen nach Geschmack, Preis-Leistung und Community-Rating.
                        </PageSubtitle>
                        <HeroInfoToggle type="button" onClick={() => setShowHeroDescription((current) => !current)} aria-expanded={showHeroDescription}>
                            {showHeroDescription ? 'Info ausblenden' : 'Was wird verglichen?'} <ChevronDown size={15} aria-hidden="true" />
                        </HeroInfoToggle>
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
                        <FiltersToggleButton type="button" onClick={() => setAreFiltersExpanded((prev) => !prev)} aria-expanded={areFiltersExpanded}>
                            <SlidersHorizontal size={17} aria-hidden="true" />
                            <span>{areFiltersExpanded ? 'Filter schließen' : 'Filter'}</span>
                            {!areFiltersExpanded && <FilterButtonSummary>{filterSummary}</FilterButtonSummary>}
                            <ChevronDown size={16} aria-hidden="true" />
                        </FiltersToggleButton>
                    </QuickFiltersBar>
                    {!userPosition && locationStatus !== 'idle' && (
                        <CompactLocationHint>
                            <MapPin size={16} aria-hidden="true" />
                            <span>{locationStatus === 'requesting' ? 'Standort wird ermittelt…' : locationError || 'Standort für Entfernungen freigeben.'}</span>
                        </CompactLocationHint>
                    )}
                    {areFiltersExpanded && (
                        <FiltersPanel>
                            <FilterSummary>Aktiv: {filterSummary}</FilterSummary>
                            {advancedFiltersContent}
                        </FiltersPanel>
                    )}
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

                    <ResultsContext>
                        <strong>{activeResultCount} passende Eisdielen</strong>
                        <span>{distanceFilter !== 'any' ? `im Umkreis von ${distanceFilter} km` : 'ohne Entfernungsfilter'}</span>
                        {searchTerm.trim() && <span>· Suche: „{searchTerm.trim()}“</span>}
                    </ResultsContext>
                    {shouldExpandNearbyResults && (
                        <NearbyFallbackNotice>
                            <span>Nur {strictActiveRows.length} verlässliche Treffer im Umkreis. Weitere nahe Eisdielen mit kleiner Datenbasis werden angezeigt.</span>
                            <button type="button" onClick={() => setShowExpandedNearbyResults(false)}>Nur verlässliche anzeigen</button>
                        </NearbyFallbackNotice>
                    )}
                    <MobileResults aria-label="Ranking-Ergebnisse">
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
                                    <CardMetrics>
                                        <Metric><span>Geschmacksfaktor</span><strong>{formatRating(getTasteFactor(shop))}</strong></Metric>
                                        <Metric><span>Preis-Leistung</span><strong>{formatRating(shop.avg_preisleistung)}</strong></Metric>
                                        <Metric><span>Preis</span><strong>{getPriceLabel(shop)}</strong></Metric>
                                        <Metric><span>Datenbasis</span><strong>{getUniqueRaters(shop)} Nutzer{isLowConfidence(shop) ? ' · niedrig' : ''}</strong></Metric>
                                    </CardMetrics>
                                    <CardDetailsButton type="button" onClick={() => toggleDetails(detailKey)} aria-expanded={isExpanded}>
                                        Details anzeigen <ChevronDown size={17} aria-hidden="true" />
                                    </CardDetailsButton>
                                    {isExpanded && renderShopDetails(shop)}
                                </RankingCard>
                            );
                        })}
                    </MobileResults>

                    <DesktopResults>
                        <TableScrollArea>
                            <Table>
                                <thead>
                                    <tr>
                                        <th>Eisdiele</th>
                                        <th><SortButton type="button" $active={activeSortConfig.key === 'ranking_score'} onClick={() => sortActiveRows('ranking_score')}>Ranking {activeSortConfig.key === 'ranking_score' && (activeSortConfig.direction === 'ascending' ? '▲' : '▼')}</SortButton></th>
                                        <th><SortButton type="button" $active={activeSortConfig.key === tasteFactorKey} onClick={() => sortActiveRows(tasteFactorKey)}>Geschmacksfaktor {activeSortConfig.key === tasteFactorKey && (activeSortConfig.direction === 'ascending' ? '▲' : '▼')}</SortButton></th>
                                        <th><SortButton type="button" $active={activeSortConfig.key === 'avg_preisleistung'} onClick={() => sortActiveRows('avg_preisleistung')}>Preis-Leistung {activeSortConfig.key === 'avg_preisleistung' && (activeSortConfig.direction === 'ascending' ? '▲' : '▼')}</SortButton></th>
                                        <th><SortButton type="button" $active={activeSortConfig.key === 'kugel_preis_eur'} onClick={() => sortActiveRows('kugel_preis_eur')}>Preis {activeSortConfig.key === 'kugel_preis_eur' && (activeSortConfig.direction === 'ascending' ? '▲' : '▼')}</SortButton></th>
                                        <th><SortButton type="button" $active={activeSortConfig.key === 'nutzeranzahl'} onClick={() => sortActiveRows('nutzeranzahl')}>Datenbasis {activeSortConfig.key === 'nutzeranzahl' && (activeSortConfig.direction === 'ascending' ? '▲' : '▼')}</SortButton></th>
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
                                                    <td>{getPriceLabel(shop)}</td>
                                                    <td>{shop.checkin_anzahl || 0} Check-ins<SmallValue>{getUniqueRaters(shop)} Nutzer{isLowConfidence(shop) && ' · niedrig'}</SmallValue></td>
                                                    <td><DetailsButton type="button" onClick={() => toggleDetails(detailKey)} aria-expanded={isExpanded}>Details <ChevronDown size={16} aria-hidden="true" /></DetailsButton></td>
                                                </tr>
                                                {isExpanded && <DetailsRow visible className="details-row"><td colSpan="7">{renderShopDetails(shop)}</td></DetailsRow>}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </TableScrollArea>
                    </DesktopResults>

                    <ScoreExplanationToggle type="button" onClick={() => setShowScoreExplanation((current) => !current)} aria-expanded={showScoreExplanation}>
                        <span><Calculator size={17} aria-hidden="true" /> So wird das Ranking berechnet</span>
                        <ChevronDown size={18} aria-hidden="true" />
                    </ScoreExplanationToggle>
                    {showScoreExplanation && <RankingScoreExplanation type={activeTab} />}

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
    padding: 0.55rem 0.1rem 0.35rem;
    margin-bottom: 0.35rem;
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

const PageSubtitle = styled.p`
  margin: 0.35rem 0 0;
  color: rgba(47, 33, 0, 0.7);
  font-size: 0.95rem;

  @media (max-width: 768px) {
    display: ${({ $expanded }) => ($expanded ? 'block' : 'none')};
    margin-top: 0.5rem;
    font-size: 0.86rem;
  }
`;

const HeroInfoToggle = styled.button`
  display: none;

  @media (max-width: 768px) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    min-height: 30px;
    margin-top: 0.25rem;
    padding: 0;
    border: 0;
    background: transparent;
    color: #7b4a00;
    font: inherit;
    font-size: 0.76rem;
    font-weight: 700;
  }
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
  padding: 0.75rem 0.75rem 0.55rem;
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

  strong { font-size: 1.05rem; }
  small { margin-top: 0.1rem; color: rgba(95, 63, 0, 0.68); font-size: 0.66rem; font-weight: 700; }
`;

const CardMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.4rem;
  padding: 0 0.75rem 0.65rem;
`;

const Metric = styled.span`
  display: grid;
  gap: 0.08rem;
  padding: 0.45rem 0.5rem;
  border-radius: 9px;
  background: rgba(255, 244, 217, 0.58);

  span { color: rgba(95, 63, 0, 0.72); font-size: 0.68rem; font-weight: 700; }
  strong { overflow: hidden; color: #493100; font-size: 0.82rem; text-overflow: ellipsis; white-space: nowrap; }
`;

const CardDetailsButton = styled.button`
  width: calc(100% - 1.5rem);
  min-height: 38px;
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
  font-size: 0.78rem;
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
  gap: 0.45rem;
  margin: 0 0 0.7rem;

  span {
    display: flex;
    justify-content: space-between;
    gap: 0.4rem;
    color: rgba(47, 33, 0, 0.72);
    font-size: 0.8rem;
  }
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
  background: linear-gradient(180deg, rgba(255, 248, 225, 0.95), rgba(255, 253, 244, 0.95));
  border: 1px solid rgba(255, 181, 34, 0.25);
  border-radius: 12px;
  padding: 1rem;
  width: 100%;
  box-sizing: border-box;
  overflow-wrap: anywhere;
  h3 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    color: #2f2100;
  }
  strong {
    font-weight: bold;
    color: #5f3f00;
  }

  @media (max-width: 768px) {
    padding: 0.75rem;
    width: 100%;
    max-width: none;
  }
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
    margin-bottom: 0.65rem;
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
  background: rgba(255, 252, 243, 0.94);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 16px;
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.07);
  padding: 0.75rem;
  margin-bottom: 1rem;
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
    gap: 0.55rem;
    padding: 0.55rem 0.1rem;
  }
`;

const FilterSummary = styled.p`
  margin: 0 0 0.6rem;
  color: #765116;
  font-size: 0.8rem;
  font-weight: 700;
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
  justify-content: center;
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

  @media (max-width: 768px) {
    grid-column: 1 / -1;
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

const AttributeFilterSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1rem;
`;

const AttributeToggleButton = styled.button`
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
  gap: 0.35rem;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  background-color: #ffd480;
  border: 1px solid #ffb522;
  font-size: 0.85rem;
  color: #7a0900;;

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
