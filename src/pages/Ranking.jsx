import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Header from "../Header";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { formatOpeningHoursLines, hydrateOpeningHours } from "../utils/openingHours";

const EARTH_RADIUS_KM = 6371;
const FILTERS_COMPACT_BREAKPOINT_PX = 768;

const isCompactFilterViewport = () => {
    if (typeof window === 'undefined') {
        return false;
    }
    return window.innerWidth < FILTERS_COMPACT_BREAKPOINT_PX;
};

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

const Ranking = () => {
    const { userId, userPosition, setUserPosition } = useUser();
    const [eisdielenKugel, setEisdielenKugel] = useState([]);
    const [eisdielenSofteis, setEisdielenSofteis] = useState([]);
    const [eisdielenEisbecher, setEisdielenEisbecher] = useState([]);
    const [sortConfigKugel, setSortConfigKugel] = useState({ key: 'finaler_score', direction: 'descending' });
    const [sortConfigSofteis, setSortConfigSofteis] = useState({ key: 'finaler_softeis_score', direction: 'descending' });
    const [sortConfigEisbecher, setSortConfigEisbehcer] = useState({ key: 'finaler_eisbecher_score', direction: 'descending' });
    const [expandedRow, setExpandedRow] = useState(null);
    const [activeTab, setActiveTab] = useState('kugel');
    const [searchTerm, setSearchTerm] = useState('');
    const [distanceFilter, setDistanceFilter] = useState('any');
    const [ratingScope, setRatingScope] = useState('global');
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
    const [isCompactFilters, setIsCompactFilters] = useState(() => isCompactFilterViewport());
    const [areFiltersExpanded, setAreFiltersExpanded] = useState(() => !isCompactFilterViewport());
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const buildDefaultDateTimeValue = React.useCallback(() => {
        const date = new Date();
        date.setMinutes(date.getMinutes() + 60);
        date.setSeconds(0, 0);
        return date.toISOString().slice(0, 16);
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
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        const handleResize = () => {
            setIsCompactFilters(isCompactFilterViewport());
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    useEffect(() => {
        setAreFiltersExpanded(!isCompactFilters);
    }, [isCompactFilters]);

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

                const queryParts = [];
                if (ratingUserId !== null) {
                    queryParts.push(`user_id=${ratingUserId}`);
                }
                if (openFilterQueryString) {
                    queryParts.push(openFilterQueryString);
                }
                const query = queryParts.length ? `?${queryParts.join('&')}` : '';
                const endpoints = [
                    'get_kugeleis_rating.php',
                    'get_softeis_rating.php',
                    'get_eisbecher_rating.php'
                ];

                const [dataKugel, dataSofteis, dataEisbecher] = await Promise.all(
                    endpoints.map(async (endpoint) => {
                        const response = await fetch(`${apiUrl}/${endpoint}${query}`);
                        if (!response.ok) {
                            throw new Error(`Fehler beim Abrufen von ${endpoint}`);
                        }
                        return response.json();
                    })
                );

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

    const applyFiltersAndSort = (items, sortConfig) => {
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
            let matchesOpenState = true;
            if (openFilterMode === 'now') {
                matchesOpenState = Boolean(item.is_open_now);
            } else if (openFilterMode === 'custom' && openFilterDateTime) {
                matchesOpenState = item.is_open_reference === null
                    ? true
                    : Boolean(item.is_open_reference);
            }
            return matchesSearch && matchesDistance && matchesAttributes && matchesOpenState;
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
        return applyFiltersAndSort(eisdielenKugel, sortConfigKugel);
    }, [eisdielenKugel, sortConfigKugel, searchTerm, distanceFilter, userPosition, selectedAttributes, eisdieleAttributes, openFilterMode, openFilterDateTime]);

    const sortedEisdielenSofteis = React.useMemo(() => {
        return applyFiltersAndSort(eisdielenSofteis, sortConfigSofteis);
    }, [eisdielenSofteis, sortConfigSofteis, searchTerm, distanceFilter, userPosition, selectedAttributes, eisdieleAttributes, openFilterMode, openFilterDateTime]);

    const sortedEisdielenEisbecher = React.useMemo(() => {
        return applyFiltersAndSort(eisdielenEisbecher, sortConfigEisbecher);
    }, [eisdielenEisbecher, sortConfigEisbecher, searchTerm, distanceFilter, userPosition, selectedAttributes, eisdieleAttributes, openFilterMode, openFilterDateTime]);

    const activeResultCount = React.useMemo(() => {
        if (activeTab === 'kugel') return sortedEisdielenKugel.length;
        if (activeTab === 'softeis') return sortedEisdielenSofteis.length;
        return sortedEisdielenEisbecher.length;
    }, [activeTab, sortedEisdielenKugel.length, sortedEisdielenSofteis.length, sortedEisdielenEisbecher.length]);

    const toggleDetails = (index) => {
        setExpandedRow((prevIndex) => (prevIndex === index ? null : index));
    };
    const filtersContent = (
        <>
            <FiltersRow>
                <FilterGroup>
                    <FilterLabel htmlFor="ranking-search">Suche</FilterLabel>
                    <FilterInput
                        id="ranking-search"
                        type="text"
                        value={searchTerm}
                        placeholder="Eisdiele suchen..."
                        onChange={(event) => setSearchTerm(event.target.value)}
                    />
                </FilterGroup>
                <FilterGroup>
                    <FilterLabel htmlFor="ranking-distance">Entfernung</FilterLabel>
                    <FilterSelect
                        id="ranking-distance"
                        value={distanceFilter}
                        onChange={handleDistanceChange}
                    >
                        <option value="any">Alle Entfernungen</option>
                        <option value="2">bis 2 km</option>
                        <option value="5">bis 5 km</option>
                        <option value="10">bis 10 km</option>
                        <option value="25">bis 25 km</option>
                        <option value="50">bis 50 km</option>
                    </FilterSelect>
                </FilterGroup>
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
            {!userPosition && (
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
        <>
            <Header />
            <Container>
                <TableContainer className="container">
                    <HeroCard>
                        <PageTitle>🏆 Eisdielen-Ranking</PageTitle>
                        <PageSubtitle>
                            Vergleiche Eisdielen nach Geschmack, Preis-Leistung und Community-Rating.
                        </PageSubtitle>
                        <MetaChips>
                            <MetaChip>{activeResultCount} Treffer</MetaChip>
                            {searchTerm.trim() && <MetaChip>Suche: {searchTerm.trim()}</MetaChip>}
                            {distanceFilter !== 'any' && <MetaChip>Entfernung: ≤ {distanceFilter} km</MetaChip>}
                            {selectedAttributes.length > 0 && <MetaChip>{selectedAttributes.length} Attribut-Filter</MetaChip>}
                        </MetaChips>
                    </HeroCard>
                    <TabContainer>
                        <TabButton
                            $active={activeTab === 'kugel'}
                            onClick={() => setActiveTab('kugel')}
                        >
                            Kugeleis
                        </TabButton>
                        <TabButton
                            $active={activeTab === 'softeis'}
                            onClick={() => setActiveTab('softeis')}
                        >
                            Softeis
                        </TabButton>
                        <TabButton
                            $active={activeTab === 'eisbecher'}
                            onClick={() => setActiveTab('eisbecher')}
                        >
                            Eisbecher
                        </TabButton>
                    </TabContainer>
                    {isCompactFilters && (
                        <FiltersToggleBar>
                            <FiltersToggleButton
                                type="button"
                                onClick={() => setAreFiltersExpanded((prev) => !prev)}
                            >
                                {areFiltersExpanded ? 'Filter verbergen' : 'Filter anzeigen'}
                            </FiltersToggleButton>
                        </FiltersToggleBar>
                    )}
                    {(!isCompactFilters || areFiltersExpanded) && (
                        <FiltersPanel>
                            {filtersContent}
                        </FiltersPanel>
                    )}
                    {activeTab === 'kugel' && (
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
                                <th onClick={() => sortTableKugel('finaler_score')}>
                                    Rating {sortConfigKugel.key === 'finaler_score' ? (sortConfigKugel.direction === 'ascending' ? '▲' : '▼') : ''}
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
                                        <td style={sortConfigKugel.key === 'finaler_score' ? { fontWeight: 'bold' } : {}}>{eisdiele.finaler_score ? Number(eisdiele.finaler_score).toFixed(2) : "–"}</td>
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
                            <Explanation>
                            <h1>Erklärung zum Ranking</h1>
                            <LeftAlign>
                                <ScoreExplanation>
                                    <h2>Wie wird das Rating für Kugeleis berechnet?</h2>

                                    <h3>1. Einzelbewertung je Check-in</h3>
                                    <p>
                                        Für jeden Check-in für Kugeleis wird ein Score berechnet:<br />
                                        Dieser Score setzt sich aus zwei Faktoren zusammen:
                                        <ul>
                                            <li>
                                                <strong>Geschmacksfaktor:</strong> Der Geschmack zählt viermal so viel wie die Waffel. Wenn keine Waffel bewertet wurde, zählt nur der Geschmack.
                                            </li>
                                            <li>
                                                <strong>Preis-Leistungs-Faktor:</strong> Seit dem <code>27.08.2025</code> wird dieser Wert direkt vom Nutzer vergeben und liegt zwischen <code>1.0</code> und <code>5.0</code>.
                                                <br />
                                                Zuvor wurde der Preis-Leistungs-Faktor automatisch aus der Kugelgröße im Verhältnis zum Preis berechnet.
                                                Eine Kugel mit Größe <code>5.0</code> bei einem Preis von <code>1,50 €</code> ergab beispielsweise den Wert <code>5.0</code>.
                                                Dabei konnten bei großen Kugeln und Preisen unter 1,50 € Werte von über 5 entstehen, während bei sehr kleinen Kugeln und Preisen über 1,50 € Werte unter 1 möglich waren.
                                            </li>
                                            <li>
                                                <strong>Finaler Score:</strong> Geschmack (70 %) + Preis-Leistung (30 %), gewichtet zu einem Gesamtwert zwischen ca. <code>1.0</code> und <code>5.0</code>.
                                            </li>
                                        </ul>
                                    </p>


                                    <h3>2. Durchschnitt je Nutzer &amp; Gewichtung</h3>
                                    <p>
                                        Je Nutzer und Eisdiele wird ein Durchschnitt aller Scores berechnet. Aktive Nutzer erhalten ein höheres Gewicht:
                                    </p>
                                    <ul>
                                        <li><strong>gewicht:</strong> <code>√(Anzahl Check-ins des Nutzers)</code></li>
                                        <li><strong>gewichteter Score: </strong> <code>durchschnittlicher Score × gewicht</code></li>
                                    </ul>
                                    <p>
                                        Dadurch zählt eine einzelne Bewertung weniger als mehrere – aber mit abnehmendem Einfluss.
                                    </p>

                                    <h3>3. Finale Bewertung je Eisdiele</h3>
                                    <p>
                                        Die gewichteten Scores aller Nutzer für eine Eisdiele werden gemittelt:
                                    </p>
                                    <ul>
                                        <li><strong>Rating: </strong><code>Summe aller gewichteter Scores / Summe aller Gewichte</code></li>
                                    </ul>

                                    <h3>Beispiel:</h3>
                                    <ul>
                                        <li>Nutzer A: 1 Check-in, Score 4,5 → Gewicht: √1 = 1 → Beitrag: 4,5</li>
                                        <li>Nutzer B: 4 Check-ins, Ø Score 4,0 → Gewicht: √4 = 2 → Beitrag: 8,0</li>
                                    </ul>
                                    <p>
                                        <strong>Finaler Score:</strong> (4,5 + 8,0) / (1 + 2) = <strong>4,17</strong>
                                    </p>
                                </ScoreExplanation>
                            </LeftAlign>
                            </Explanation>
                        </>
                    )}
                    {activeTab === 'softeis' && (
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
                                    <th onClick={() => sortTableSofteis('finaler_softeis_score')}>
                                        Rating {sortConfigSofteis.key === 'finaler_softeis_score' ? (sortConfigSofteis.direction === 'ascending' ? '▲' : '▼') : ''}
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
                                            <td style={sortConfigSofteis.key === 'finaler_softeis_score' ? { fontWeight: 'bold' } : {}}>
                                                {eisdiele.finaler_softeis_score ? eisdiele.finaler_softeis_score.toFixed(2) : '-'}
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
                            <Explanation>
                            <h1>Erklärung zum Ranking</h1>
                            <LeftAlign>
                                <ScoreExplanation>
                                    <h2>Wie wird das Rating für Softeis berechnet?</h2>

                                    <h3>1. Einzelbewertung je Check-in</h3>
                                    <p>
                                        Für jeden Check-in für Softeis wird ein Score berechnet:<br />
                                        Dieser Score setzt sich aus zwei Faktoren zusammen:
                                        <ul>
                                            <li>
                                                <strong>Geschmacksfaktor:</strong> Der Geschmack zählt viermal so viel wie die Waffel. Wenn keine Waffel bewertet wurde, zählt nur der Geschmack.
                                            </li>
                                            <li>
                                                <strong>Preis-Leistungs-Faktor:</strong> Wird direkt durch den Nutzer als Wert zwischen <code>1.0</code> und <code>5.0</code> bewertet.
                                            </li>
                                            <li>
                                                <strong>Finaler Score:</strong> Geschmack (70 %) + Preis-Leistung (30 %), gewichtet zu einem Gesamtwert zwischen ca. <code>1.0</code> und <code>5.0</code>.
                                            </li>
                                        </ul>
                                    </p>


                                    <h3>2. Durchschnitt je Nutzer &amp; Gewichtung</h3>
                                    <p>
                                        Je Nutzer und Eisdiele wird ein Durchschnitt aller Scores berechnet. Aktive Nutzer erhalten ein höheres Gewicht:
                                    </p>
                                    <ul>
                                        <li><strong>gewicht:</strong> <code>√(Anzahl Check-ins des Nutzers)</code></li>
                                        <li><strong>gewichteter Score: </strong> <code>durchschnittlicher Score × gewicht</code></li>
                                    </ul>
                                    <p>
                                        Dadurch zählt eine einzelne Bewertung weniger als mehrere – aber mit abnehmendem Einfluss.
                                    </p>

                                    <h3>3. Finale Bewertung je Eisdiele</h3>
                                    <p>
                                        Die gewichteten Scores aller Nutzer für eine Eisdiele werden gemittelt:
                                    </p>
                                    <ul>
                                        <li><strong>Rating: </strong><code>Summe aller gewichteter Scores / Summe aller Gewichte</code></li>
                                    </ul>


                                    <h3>Beispiel:</h3>
                                    <ul>
                                        <li>Nutzer A: 1 Check-in, Score 4,5 → Gewicht: √1 = 1 → Beitrag: 4,5</li>
                                        <li>Nutzer B: 4 Check-ins, Ø Score 4,0 → Gewicht: √4 = 2 → Beitrag: 8,0</li>
                                    </ul>
                                    <p>
                                        <strong>Finaler Score:</strong> (4,5 + 8,0) / (1 + 2) = <strong>4,17</strong>
                                    </p>
                                </ScoreExplanation>
                            </LeftAlign>
                            </Explanation>
                        </>
                    )}
                    {activeTab === 'eisbecher' && (
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
                                    <th onClick={() => sortTableEisbecher('finaler_eisbecher_score')}>
                                        Rating {sortConfigEisbecher.key === 'finaler_eisbecher_score' ? (sortConfigEisbecher.direction === 'ascending' ? '▲' : '▼') : ''}
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
                                            <td style={sortConfigEisbecher.key === 'finaler_eisbecher_score' ? { fontWeight: 'bold' } : {}}>
                                                {eisdiele.finaler_eisbecher_score !== null && eisdiele.finaler_eisbecher_score !== undefined ? Number(eisdiele.finaler_eisbecher_score).toFixed(2) : '-'}
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
                            <Explanation>
                            <h1>Erklärung zum Ranking</h1>
                            <LeftAlign>
                                <ScoreExplanation>
                                    <h2>Wie wird der <em>finale Eisbecher-Score</em> berechnet?</h2>

                                    <h3>1. Einzelbewertung je Check-in</h3>
                                    <p>
                                        Für jeden Check-in wird ein Score berechnet:<br />
                                        <ul>
                                            <li>
                                                <strong>Score: </strong><code> Geschmack * 0,7 + Preis-Leistung * 0,3</code><br />
                                            </li>
                                        </ul>
                                    </p>

                                    <h3>2. Durchschnitt je Nutzer &amp; Gewichtung</h3>
                                    <p>
                                        Je Nutzer und Eisdiele wird ein Durchschnitt aller Scores berechnet. Aktive Nutzer erhalten ein höheres Gewicht:
                                    </p>
                                    <ul>
                                        <li><strong>gewicht:</strong> <code>√(Anzahl Check-ins des Nutzers)</code></li>
                                        <li><strong>gewichteter Score: </strong> <code>durchschnittlicher Score × gewicht</code></li>
                                    </ul>
                                    <p>
                                        Dadurch zählt eine einzelne Bewertung weniger als mehrere – aber mit abnehmendem Einfluss.
                                    </p>

                                    <h3>3. Finale Bewertung je Eisdiele</h3>
                                    <p>
                                        Die gewichteten Scores aller Nutzer für eine Eisdiele werden gemittelt:
                                    </p>
                                    <ul>
                                        <li><strong>Rating: </strong><code>Summe aller gewichteter Scores / Summe aller Gewichte</code></li>
                                    </ul>


                                    <h3>Beispiel:</h3>
                                    <ul>
                                        <li>Nutzer A: 1 Check-in, Score 4,5 → Gewicht: √1 = 1 → Beitrag: 4,5</li>
                                        <li>Nutzer B: 4 Check-ins, Ø Score 4,0 → Gewicht: √4 = 2 → Beitrag: 8,0</li>
                                    </ul>
                                    <p>
                                        <strong>Finaler Score:</strong> (4,5 + 8,0) / (1 + 2) = <strong>4,17</strong>
                                    </p>
                                </ScoreExplanation>
                            </LeftAlign>
                            </Explanation>
                        </>
                    )}

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
  padding: 0.5rem;
  background:
    radial-gradient(circle at top right, rgba(255, 218, 140, 0.35), transparent 45%),
    linear-gradient(180deg, #fffaf0 0%, #fff7e5 100%);
  min-height: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: center;
`;

const TableContainer = styled.div`
  justify-content: center;
  text-align: center;
  width: 100%;
  max-width: 1440px;
`;

const HeroCard = styled.div`
  background: rgba(255, 252, 243, 0.96);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.08);
  padding: 1rem 1rem 0.9rem;
  margin-bottom: 1rem;
`;

const PageTitle = styled.h2`
  margin: 0;
  font-size: clamp(1.35rem, 2vw, 1.8rem);
  color: #2f2100;
  line-height: 1.2;
`;

const PageSubtitle = styled.p`
  margin: 0.35rem 0 0;
  color: rgba(47, 33, 0, 0.7);
  font-size: 0.95rem;
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

const LeftAlign = styled.p`
  text-align: left;
`

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 980px;

  th, td {
    border-bottom: 1px solid rgba(47, 33, 0, 0.08);
    padding: 10px 10px;
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

  tbody tr:not(.details-row) {
    cursor: pointer;
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
    position: -webkit-sticky;
    position: sticky;
    left: 0;
    z-index: 5;
    width: calc(100vw - 34px);
    max-width: calc(100vw - 34px);
  }
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
    box-shadow: ${(props) => (props.$active ? '0 2px 8px rgba(255,181,34,0.25)' : 'none')};
    transition: background-color 0.15s ease, box-shadow 0.15s ease, color 0.15s ease;

    &:hover {
        background-color: ${(props) => (props.$active ? '#ffbf3f' : 'rgba(255,181,34,0.1)')};
    }
`;

const FiltersPanel = styled.div`
  background: rgba(255, 252, 243, 0.94);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 16px;
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.07);
  padding: 0.6rem 0.6rem 0.1rem;
  margin-bottom: 1rem;
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
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 180px;
  text-align: left;
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
`;

const FilterSelect = styled.select`
  padding: 0.45rem 0.6rem;
  border-radius: 10px;
  border: 1px solid rgba(47, 33, 0, 0.14);
  font-size: 0.95rem;
  background: rgba(255, 255, 255, 0.95);
  color: #2f2100;
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
  background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,250,239,0.95));
  padding: 1.5rem;
  border-radius: 1rem;
  border: 1px solid rgba(47, 33, 0, 0.08);
  box-shadow: 0 8px 20px rgba(28, 20, 0, 0.06);
  line-height: 1.6;
  font-size: 1rem;
  color: #2f2100;

  h3 {
    margin-top: 0;
    font-size: 1.25rem;
    color: #4c3400;
  }

  ul {
    padding-left: 1.2rem;
    list-style-type: "🍧​ ";
  }

  strong {
    color: #2f2100;
  }

  code {
    background: rgba(47, 33, 0, 0.06);
    padding: 0.1rem 0.3rem;
    border-radius: 4px;
    font-size: 0.95rem;
  }
`;
