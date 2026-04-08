import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import Header from '../Header';
import { useUser } from '../context/UserContext';
import MetaPill from '../components/RegionMetaPill';
import FavoritenButton from '../components/FavoritButton';
import ShareIcon from '../components/ShareButton';
import OpeningHours from '../components/OpeningHours';
import ShopWebsite from '../components/ShopWebsite';
import Rating from '../components/Rating';
import CheckinCard from '../components/CheckinCard';
import ReviewCard from '../components/ReviewCard';
import RouteCard from '../components/RouteCard';
import SubmitPriceModal from '../SubmitPriceModal';
import SubmitReviewModal from '../SubmitReviewModal';
import CheckinForm from '../CheckinForm';
import SubmitRouteModal from '../SubmitRouteModal';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ArrowLeft,
  CalendarDays,
  Flame,
  IceCream,
  Images,
  MapPin,
  MessageSquare,
  Navigation,
  Route,
  Sparkles,
  Star,
  Store,
  Users
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const ASSET_BASE = (import.meta.env.VITE_ASSET_BASE_URL || 'https://ice-app.de/').replace(/\/+$/, '');
const FEED_BATCH_SIZE = 24;
const TRAVEL_COLORS = ['#ffb522', '#ff8a00', '#ff595e', '#8ac926', '#33658a', '#1982c4', '#6a4c93', '#577590'];

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const buildAssetUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${ASSET_BASE}/${String(path).replace(/^\/+/, '')}`;
};

const formatRating = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(1) : '–';
};

const formatDate = (value, options = {}) => {
  if (!value) return '–';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '–';
  return date.toLocaleDateString('de-DE', options);
};

const formatDateTime = (value) => {
  if (!value) return '–';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '–';
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const calculateTimeDifference = (dateString) => {
  if (!dateString) return 'unbekannt';
  const currentDate = new Date();
  const pastDate = new Date(dateString);
  if (Number.isNaN(pastDate.getTime())) return 'unbekannt';
  const diffInMilliseconds = currentDate - pastDate;
  if (diffInMilliseconds < 0) return formatDate(dateString);
  const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));

  if (diffInHours < 1) {
    return 'vor weniger als 1 Stunde';
  }
  if (diffInHours < 24) {
    return `vor ${diffInHours} Stunde${diffInHours > 1 ? 'n' : ''}`;
  }
  if (diffInDays < 7) {
    return `vor ${diffInDays} Tag${diffInDays > 1 ? 'en' : ''}`;
  }
  if (diffInDays < 30) {
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `vor ${diffInWeeks} Woche${diffInWeeks > 1 ? 'n' : ''}`;
  }
  if (diffInDays < 365) {
    const diffInMonths = Math.floor(diffInDays / 30);
    return `vor ${diffInMonths} Monat${diffInMonths > 1 ? 'en' : ''}`;
  }
  if (diffInDays >= 365) {
    const diffInYears = Math.floor(diffInDays / 365);
    return `vor ${diffInYears} Jahr${diffInYears > 1 ? 'en' : ''}`;
  }
  return `vor ${diffInDays} Tagen`;
};

const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const buildPriceHistoryChart = (history) => {
  if (!Array.isArray(history) || history.length === 0) return [];

  const points = history
    .map((entry) => {
      const raw = entry?.datum ? new Date(String(entry.datum).replace(' ', 'T')) : null;
      if (!raw || Number.isNaN(raw.getTime())) return null;
      return { typ: entry.typ, preis: Number(entry.preis), rawDatum: raw };
    })
    .filter(Boolean)
    .sort((a, b) => a.rawDatum - b.rawDatum);

  if (points.length === 0) return [];

  const firstDate = new Date(points[0].rawDatum.getFullYear(), points[0].rawDatum.getMonth(), 1);
  const lastDate = new Date();
  const lastMonth = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1);
  const monthMap = {};
  let lastKugel = null;
  let lastSofteis = null;

  points.forEach((entry) => {
    const key = getMonthKey(entry.rawDatum);
    if (entry.typ === 'kugel') lastKugel = entry.preis;
    if (entry.typ === 'softeis') lastSofteis = entry.preis;
    monthMap[key] = { kugel: lastKugel, softeis: lastSofteis };
  });

  const chartData = [];
  let current = new Date(firstDate);
  let currentKugel = null;
  let currentSofteis = null;

  while (current <= lastMonth) {
    const key = getMonthKey(current);
    if (monthMap[key]) {
      if (monthMap[key].kugel !== undefined) currentKugel = monthMap[key].kugel;
      if (monthMap[key].softeis !== undefined) currentSofteis = monthMap[key].softeis;
    }
    chartData.push({
      datum: current.toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' }),
      kugel: currentKugel,
      softeis: currentSofteis,
    });
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }

  return chartData;
};

const getStatusMeta = (shop) => {
  const status = shop?.status;
  if (status === 'open') {
    return { label: shop?.is_open_now ? 'Jetzt geöffnet' : 'Offen gelistet', tone: 'open' };
  }
  if (status === 'seasonal_closed') {
    return {
      label: shop?.reopening_date ? `Saisonpause bis ${formatDate(shop.reopening_date)}` : 'Saisonpause',
      tone: 'seasonal',
    };
  }
  if (status === 'permanent_closed') {
    return { label: 'Dauerhaft geschlossen', tone: 'closed' };
  }
  return { label: 'Status unbekannt', tone: 'neutral' };
};

const aggregateTopVisitors = (checkins) => {
  const visitorMap = new Map();
  (checkins || []).forEach((checkin) => {
    const key = String(checkin.nutzer_id || checkin.nutzer_name || checkin.id);
    const current = visitorMap.get(key) || {
      nutzer_id: checkin.nutzer_id,
      nutzer_name: checkin.nutzer_name || 'Unbekannt',
      visits: 0,
      lastVisit: checkin.datum || null,
    };
    current.visits += 1;
    if (!current.lastVisit || new Date(checkin.datum) > new Date(current.lastVisit)) {
      current.lastVisit = checkin.datum;
    }
    visitorMap.set(key, current);
  });

  return [...visitorMap.values()]
    .sort((a, b) => {
      if (b.visits !== a.visits) return b.visits - a.visits;
      return new Date(b.lastVisit || 0) - new Date(a.lastVisit || 0);
    })
    .slice(0, 5);
};

const buildGalleryPreview = (gallery) => (gallery || []).slice(0, 8);

const hasValue = (value) => value !== null && value !== undefined;
const hasPriceEntry = (entry) => hasValue(entry?.preis);

const scoreMeta = {
  kugel: { label: 'Kugeleis', shortLabel: 'Ø Kugelwertung' },
  softeis: { label: 'Softeis', shortLabel: 'Ø Softeiswertung' },
  eisbecher: { label: 'Eisbecher', shortLabel: 'Ø Eisbecherwertung' },
};

const IceShopDetailPage = () => {
  const { shopId } = useParams();
  const { isLoggedIn, userId } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFeed, setActiveFeed] = useState('checkins');
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showCheckinForm, setShowCheckinForm] = useState(false);
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);
  const checkinRefs = useRef({});
  const reviewRefs = useRef({});

  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');
  const focusCheckinId = searchParams.get('focusCheckin');
  const focusReviewId = searchParams.get('focusReview');

  useEffect(() => {
    if (tabParam === 'reviews' || tabParam === 'checkins' || tabParam === 'photos' || tabParam === 'routes') {
      setActiveFeed(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    let cancelled = false;

    const fetchShopData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE}/get_eisdiele_details.php?eisdiele_id=${shopId}&nutzer_id=${userId || ''}`);
        if (!response.ok) {
          throw new Error('Fehler beim Abruf der Shop-Details');
        }
        const data = await response.json();
        if (!cancelled) {
          setShopData(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unbekannter Fehler');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (shopId) {
      fetchShopData();
    }

    return () => {
      cancelled = true;
    };
  }, [shopId, userId]);

  const refreshShop = async () => {
    const response = await fetch(`${API_BASE}/get_eisdiele_details.php?eisdiele_id=${shopId}&nutzer_id=${userId || ''}`);
    if (!response.ok) return;
    const data = await response.json();
    setShopData(data);
  };

  const eisdiele = shopData?.eisdiele;
  const preise = shopData?.preise || {};
  const scores = shopData?.scores || {};
  const statistiken = shopData?.statistiken || {};
  const reviews = shopData?.reviews || [];
  const checkins = shopData?.checkins || [];
  const routes = shopData?.routen || [];
  const photoGallery = shopData?.foto_galerie || [];
  const personalStats = shopData?.persoenliche_statistiken;
  const attribute = shopData?.attribute || [];
  const chartData = useMemo(() => buildPriceHistoryChart(shopData?.preis_historie || []), [shopData?.preis_historie]);
  const topVisitors = useMemo(() => aggregateTopVisitors(checkins), [checkins]);
  const galleryPreview = useMemo(() => buildGalleryPreview(photoGallery), [photoGallery]);
  const travelDistribution = useMemo(
    () => (statistiken.anreise_verteilung || []).map((entry, index) => ({ ...entry, fill: TRAVEL_COLORS[index % TRAVEL_COLORS.length] })),
    [statistiken.anreise_verteilung]
  );
  const popularFlavors = shopData?.beliebte_sorten?.meistgegessen || [];
  const bestRatedFlavors = shopData?.beliebte_sorten?.bestbewertet || [];
  const checkinTypeDetails = shopData?.checkin_details_by_type || [];
  const statusMeta = getStatusMeta(eisdiele);
  const activePhoto = activePhotoIndex !== null ? photoGallery[activePhotoIndex] : null;

  useEffect(() => {
    if (activeFeed === 'checkins' && focusCheckinId && checkinRefs.current[focusCheckinId]) {
      checkinRefs.current[focusCheckinId].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeFeed, focusCheckinId, checkins]);

  useEffect(() => {
    if (activeFeed === 'reviews' && focusReviewId && reviewRefs.current[focusReviewId]) {
      reviewRefs.current[focusReviewId].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeFeed, focusReviewId, reviews]);

  const showPreviousPhoto = useCallback(() => {
    if (!photoGallery.length) return;
    setActivePhotoIndex((prev) => {
      if (prev === null) return 0;
      return (prev - 1 + photoGallery.length) % photoGallery.length;
    });
  }, [photoGallery.length]);

  const showNextPhoto = useCallback(() => {
    if (!photoGallery.length) return;
    setActivePhotoIndex((prev) => {
      if (prev === null) return 0;
      return (prev + 1) % photoGallery.length;
    });
  }, [photoGallery.length]);

  useEffect(() => {
    if (activePhotoIndex === null) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActivePhotoIndex(null);
      } else if (event.key === 'ArrowLeft') {
        showPreviousPhoto();
      } else if (event.key === 'ArrowRight') {
        showNextPhoto();
      }
    };

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activePhotoIndex, showNextPhoto, showPreviousPhoto]);

  if (loading) {
    return (
      <PageShell>
        <Header />
        <PageBody>
          <StateCard>
            <h1>Eisdiele wird geladen</h1>
            <p>Community-Daten, Preisübersicht und Highlights werden vorbereitet.</p>
          </StateCard>
        </PageBody>
      </PageShell>
    );
  }

  if (error || !shopData || !eisdiele) {
    return (
      <PageShell>
        <Header />
        <PageBody>
          <StateCard>
            <h1>Eisdiele nicht verfügbar</h1>
            <p>{error || 'Die Detailseite konnte nicht geladen werden.'}</p>
            <BackLinkButton type="button" onClick={() => navigate('/map')}>
              Zur Karte
            </BackLinkButton>
          </StateCard>
        </PageBody>
      </PageShell>
    );
  }

  const priceCards = [
    { title: 'Kugelpreis', entry: preise.kugel, icon: <IceCream size={18} /> },
    { title: 'Softeispreis', entry: preise.softeis, icon: <Sparkles size={18} /> },
  ].filter(({ entry }) => hasPriceEntry(entry));

  const ratingItems = [
    hasValue(scores.kugel) ? { key: 'kugel', label: scoreMeta.kugel.label, value: scores.kugel } : null,
    hasValue(scores.softeis) ? { key: 'softeis', label: scoreMeta.softeis.label, value: scores.softeis } : null,
    hasValue(scores.eisbecher) ? { key: 'eisbecher', label: scoreMeta.eisbecher.label, value: scores.eisbecher } : null,
    hasValue(shopData?.bewertungen?.auswahl)
      ? { key: 'auswahl', label: 'Auswahl', text: `~ ${shopData.bewertungen.auswahl} Sorten` }
      : null,
  ].filter(Boolean);

  const primaryPriceCard = priceCards[0] || null;
  const primaryScoreEntry = ratingItems.find((item) => item.key !== 'auswahl') || null;

  const heroSummaryItems = [
    {
      label: primaryPriceCard?.title || 'Preis',
      value: primaryPriceCard?.entry?.preis != null
        ? `${Number(primaryPriceCard.entry.preis).toFixed(2)} ${primaryPriceCard.entry.waehrung_symbol || 'EUR'}`
        : 'Noch nicht gemeldet',
      subline: primaryPriceCard?.entry?.letztes_update
        ? `Zuletzt gemeldet ${calculateTimeDifference(primaryPriceCard.entry.letztes_update)}`
        : 'Noch keine aktuelle Meldung',
    },
    {
      label: primaryScoreEntry?.key ? scoreMeta[primaryScoreEntry.key]?.shortLabel || 'Ø Bewertung' : 'Ø Bewertung',
      value: primaryScoreEntry?.value != null ? formatRating(primaryScoreEntry.value) : '–',
      subline: primaryScoreEntry?.value != null ? 'Community-Score' : 'Noch keine Wertung',
    },
    {
      label: 'Check-ins',
      value: String(statistiken.gesamt_checkins || 0),
      subline: `${statistiken.verschiedene_besucher || 0} verschiedene Besucher`,
    },
    {
      label: 'Letzte Aktivität',
      value: statistiken.letzter_checkin ? formatDate(statistiken.letzter_checkin, { day: '2-digit', month: '2-digit', year: 'numeric' }) : '–',
      subline: statistiken.letzter_checkin ? calculateTimeDifference(statistiken.letzter_checkin) : 'Noch keine Check-ins',
    },
  ];

  const heroSnapshotItems = [
    {
      label: 'Ø Kugelwertung',
      value: scores.kugel !== null && scores.kugel !== undefined ? formatRating(scores.kugel) : '–',
      subline: scores.kugel !== null && scores.kugel !== undefined ? 'Community-Score' : 'Noch keine Wertung',
      icon: <Star size={18} />,
    },
    {
      label: 'Ø Kugelwertung',
      value: String(statistiken.gesamt_checkins || 0),
      subline: `${statistiken.verschiedene_besucher || 0} verschiedene Besucher`,
      icon: <Users size={18} />,
    },
    {
      label: 'Beliebteste Sorte',
      value: popularFlavors[0]?.sortenname || '–',
      subline: popularFlavors[0] ? `${popularFlavors[0].anzahl} Check-ins` : 'Noch keine Sortendaten',
      icon: <Flame size={18} />,
    },
    {
      label: 'Letzte Aktivität',
      value: statistiken.letzter_checkin ? formatDateTime(statistiken.letzter_checkin) : 'â€“',
      subline: statistiken.letzter_checkin ? calculateTimeDifference(statistiken.letzter_checkin) : 'Noch keine Check-ins',
      icon: <CalendarDays size={18} />,
    },
  ];

  return (
    <PageShell>
      <Header />
      <PageBody>
        <BackRow>
          <BackLink to={`/map/activeShop/${eisdiele.id}`}>
            <ArrowLeft size={16} />
            Zur Kartenansicht
          </BackLink>
        </BackRow>

        <HeroSection>
          <HeroContent>
            <HeroMetaRow>
              <StatusBadge $tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
              {eisdiele.land && <MetaPill>{eisdiele.land}</MetaPill>}
              {eisdiele.bundesland && eisdiele.bundesland_id ? (
                <MetaPill as={Link} to={`/region/bundesland/${eisdiele.bundesland_id}`}>
                  {eisdiele.bundesland}
                </MetaPill>
              ) : (
                eisdiele.bundesland && <MetaPill>{eisdiele.bundesland}</MetaPill>
              )}
              {eisdiele.landkreis && eisdiele.landkreis_id ? (
                <MetaPill as={Link} to={`/region/landkreis/${eisdiele.landkreis_id}`}>
                  {eisdiele.landkreis}
                </MetaPill>
              ) : (
                eisdiele.landkreis && <MetaPill>{eisdiele.landkreis}</MetaPill>
              )}
            </HeroMetaRow>
            <HeroTitle>{eisdiele.name}</HeroTitle>
            <HeroAddress>
              <MapPin size={16} />
              {eisdiele.adresse || 'Adresse nicht hinterlegt'}
            </HeroAddress>
            <HeroSummaryRow>
              <HeroSnapshotCard>
                <HeroSnapshotHeader>
                  <HeroSnapshotTitle>Auf einen Blick</HeroSnapshotTitle>
                  <HeroUtilityRow>
                    <UtilitySlot>
                      <FavoritenButton eisdieleId={eisdiele.id} />
                    </UtilitySlot>
                    <UtilitySlot>
                      <ShareIcon path={`/shop/${eisdiele.id}`} />
                    </UtilitySlot>
                  </HeroUtilityRow>
                </HeroSnapshotHeader>
                <HeroFactsGrid>
                  {heroSummaryItems.map((item) => (
                    <HeroFact key={item.label}>
                      <HeroFactLabel>{item.label}</HeroFactLabel>
                      <HeroFactValue>{item.value}</HeroFactValue>
                      <HeroFactSubline>{item.subline}</HeroFactSubline>
                    </HeroFact>
                  ))}
                </HeroFactsGrid>
                <HeroSnapshotChips>
                  <span>{reviews.length} Reviews</span>
                  <span>{photoGallery.length} Fotos</span>
                  <span>{routes.length} Routen</span>
                </HeroSnapshotChips>
              </HeroSnapshotCard>
            </HeroSummaryRow>
            <HeroActions>
              {isLoggedIn && <PrimaryAction type="button" onClick={() => setShowCheckinForm(true)}>Einchecken</PrimaryAction>}
              {isLoggedIn && <SecondaryAction type="button" onClick={() => setShowReviewForm(true)}>Bewerten</SecondaryAction>}
              <ActionAnchor
                href={
                  eisdiele.latitude && eisdiele.longitude
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${eisdiele.latitude},${eisdiele.longitude}`)}`
                    : undefined
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation size={16} />
                Route dorthin
              </ActionAnchor>
            </HeroActions>
          </HeroContent>
        </HeroSection>

        <TopGrid>
          <MainColumn>
            <SectionCard>
              <SectionHeader>
                <div>
                  <SectionTitle>Überblick</SectionTitle>
                  <SectionSubline>Die wichtigsten Informationen für einen schnellen Besuchsentscheid.</SectionSubline>
                </div>
              </SectionHeader>
              <InfoStack>
                <InfoBlock>
                  <InfoLabel>Adresse</InfoLabel>
                  <InfoValue>{eisdiele.adresse || 'Keine Adresse eingetragen'}</InfoValue>
                </InfoBlock>
                <InfoBlock>
                  <InfoLabel>Öffnungszeiten</InfoLabel>
                  <InfoValue><OpeningHours eisdiele={eisdiele} /></InfoValue>
                </InfoBlock>
                <InfoBlock>
                  <InfoLabel>Website</InfoLabel>
                  <InfoValue><ShopWebsite eisdiele={eisdiele} onSuccess={refreshShop} /></InfoValue>
                </InfoBlock>
                {personalStats && (
                  <InfoBlock>
                    <InfoLabel>Deine Historie</InfoLabel>
                    <InfoValue>
                      {personalStats.eigene_checkins || 0} eigene Check-ins
                      {personalStats.letzter_besuch ? ` · letzter Besuch ${formatDate(personalStats.letzter_besuch)}` : ''}
                    </InfoValue>
                  </InfoBlock>
                )}
              </InfoStack>
            </SectionCard>

            <SectionCard>
              <SectionHeader>
                <div>
                  <SectionTitle>Preise und Bewertungen</SectionTitle>
                  <SectionSubline>Aktuelle Preismeldungen, Durchschnittswerte und wahrgenommene Stärken.</SectionSubline>
                </div>
              </SectionHeader>
              {(priceCards.length > 0 || ratingItems.length > 0) ? (
                <SplitCards>
                  {priceCards.map(({ title, entry, icon }) => (
                    <MiniPanel key={title}>
                      <MiniPanelTitle>{icon}{title}</MiniPanelTitle>
                      <MiniPanelValue>{`${Number(entry.preis).toFixed(2)} ${entry.waehrung_symbol || 'EUR'}`}</MiniPanelValue>
                      <MiniPanelSubline>
                        {entry?.beschreibung || (entry?.letztes_update ? `Zuletzt aktualisiert ${calculateTimeDifference(entry.letztes_update)}` : 'Preis gemeldet')}
                      </MiniPanelSubline>
                    </MiniPanel>
                  ))}
                  {ratingItems.length > 0 && (
                    <MiniPanel>
                        <MiniPanelTitle><Star size={18} />Bewertungen</MiniPanelTitle>
                      <RatingsList>
                        {ratingItems.map((item) => (
                          <li key={item.key} data-text-only={item.value == null ? 'true' : undefined}>
                            {item.label}:
                            {item.value != null ? (
                              <>
                                <Rating stars={item.value} />
                                <strong>{formatRating(item.value)}</strong>
                              </>
                            ) : (
                              <strong>{item.text}</strong>
                            )}
                          </li>
                        ))}
                      </RatingsList>
                    </MiniPanel>
                  )}
                </SplitCards>
              ) : (
                <EmptyState>Für diese Eisdiele liegen noch keine Preis- oder Bewertungsdaten vor.</EmptyState>
              )}
              {attribute.length > 0 && (
                <TagCloud>
                  {attribute.map((attr) => (
                    <Tag key={`${attr.name}-${attr.anzahl}`}>{attr.anzahl}x {attr.name}</Tag>
                  ))}
                </TagCloud>
              )}
              {isLoggedIn && (
                <InlineActions>
                  <SecondaryAction type="button" onClick={() => setShowPriceForm(true)}>Preis melden</SecondaryAction>
                  <SecondaryAction type="button" onClick={() => setShowReviewForm(true)}>Bewertung abgeben</SecondaryAction>
                </InlineActions>
              )}
            </SectionCard>

            <SectionCard>
              <SectionHeader>
                <div>
                  <SectionTitle>Community-Insights</SectionTitle>
                  <SectionSubline>Was hier bestellt, geliebt und immer wieder besucht wird.</SectionSubline>
                </div>
              </SectionHeader>
              <InsightsGrid>
                <MiniPanel>
                  <MiniPanelTitle><Flame size={18} />Beliebteste Sorten</MiniPanelTitle>
                  {popularFlavors.length > 0 ? (
                    <RankingList>
                      {popularFlavors.slice(0, 5).map((sorte, index) => (
                        <RankingItem key={`${sorte.sortenname}-${index}`}>
                          <span>{index + 1}. {sorte.sortenname}</span>
                          <strong>{sorte.anzahl}x · {formatRating(sorte.durchschnittsbewertung)}★</strong>
                        </RankingItem>
                      ))}
                    </RankingList>
                  ) : <EmptyState>Kleine Eisdiele oder noch keine Sortendaten vorhanden.</EmptyState>}
                </MiniPanel>

                <MiniPanel>
                  <MiniPanelTitle><Sparkles size={18} />Bestbewertet</MiniPanelTitle>
                  {bestRatedFlavors.length > 0 ? (
                    <RankingList>
                      {bestRatedFlavors.slice(0, 5).map((sorte, index) => (
                        <RankingItem key={`${sorte.sortenname}-${index}`}>
                          <span>{index + 1}. {sorte.sortenname}</span>
                          <strong>{formatRating(sorte.durchschnittsbewertung)}★ · {sorte.anzahl}</strong>
                        </RankingItem>
                      ))}
                    </RankingList>
                  ) : <EmptyState>Für Best-of-Rankings fehlen noch genügend Bewertungen.</EmptyState>}
                </MiniPanel>

                <MiniPanel>
                  <MiniPanelTitle><Users size={18} />Größte Stammkunden</MiniPanelTitle>
                  {topVisitors.length > 0 ? (
                    <RankingList>
                      {topVisitors.map((visitor) => (
                        <RankingItem key={`${visitor.nutzer_id}-${visitor.nutzer_name}`}>
                          <LinkRow to={visitor.nutzer_id ? `/user/${visitor.nutzer_id}` : '#'} $disabled={!visitor.nutzer_id}>
                            {visitor.nutzer_name}
                          </LinkRow>
                          <strong>{visitor.visits} Besuche</strong>
                        </RankingItem>
                      ))}
                    </RankingList>
                  ) : <EmptyState>Noch keine wiederkehrenden Besucher sichtbar.</EmptyState>}
                </MiniPanel>
              </InsightsGrid>
            </SectionCard>

            <SectionCard>
              <SectionHeader>
                <div>
                  <SectionTitle>Verläufe und Verteilung</SectionTitle>
                  <SectionSubline>Preisverlauf, Anreisearten und Check-in-Struktur im Zeitverlauf.</SectionSubline>
                </div>
              </SectionHeader>
              <ChartsGrid>
                <ChartCard>
                  <ChartTitle>Preisverlauf</ChartTitle>
                  {chartData.length > 0 ? (
                    <ChartWrap>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(47, 33, 0, 0.10)" />
                          <XAxis dataKey="datum" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="kugel" stroke="#ff8a00" strokeWidth={3} dot={false} connectNulls />
                          <Line type="monotone" dataKey="softeis" stroke="#33658a" strokeWidth={3} dot={false} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartWrap>
                  ) : <EmptyState>Keine Preishistorie verfügbar.</EmptyState>}
                </ChartCard>

                <ChartCard>
                  <ChartTitle>Anreise-Verteilung</ChartTitle>
                  {travelDistribution.length > 0 ? (
                    <ChartWrap>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={travelDistribution}
                            dataKey="anzahl"
                            nameKey="anreise"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            label={({ anreise, percent }) => `${anreise}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {travelDistribution.map((entry, index) => (
                              <Cell key={`${entry.anreise}-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartWrap>
                  ) : <EmptyState>Für diese Eisdiele liegen noch keine Anreisedaten vor.</EmptyState>}
                </ChartCard>

                <ChartCard>
                  <ChartTitle>Check-ins nach Typ</ChartTitle>
                  {checkinTypeDetails.length > 0 ? (
                    <ChartWrap>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={checkinTypeDetails}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(47, 33, 0, 0.10)" />
                          <XAxis dataKey="typ" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="anzahl" fill="#ffb522" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartWrap>
                  ) : <EmptyState>Noch keine Typverteilung vorhanden.</EmptyState>}
                </ChartCard>
              </ChartsGrid>
            </SectionCard>
          </MainColumn>

          <AsideColumn>
            <SectionCard>
              <SectionHeader>
                <div>
                  <SectionTitle>Standort</SectionTitle>
                  <SectionSubline>Direktansicht der Eisdiele und schneller Sprung in die Navigation.</SectionSubline>
                </div>
              </SectionHeader>
              {eisdiele.latitude && eisdiele.longitude ? (
                <MapCard>
                  <MapContainer
                    center={[eisdiele.latitude, eisdiele.longitude]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <Marker position={[eisdiele.latitude, eisdiele.longitude]} icon={defaultIcon}>
                      <Popup>{eisdiele.name}</Popup>
                    </Marker>
                  </MapContainer>
                </MapCard>
              ) : (
                <EmptyState>Für diese Eisdiele sind keine Koordinaten hinterlegt.</EmptyState>
              )}
            </SectionCard>

            <SectionCard>
              <SectionHeader>
                <div>
                  <SectionTitle>Fotos</SectionTitle>
                  <SectionSubline>Aktuelle Eindrücke aus Check-ins der Community.</SectionSubline>
                </div>
              </SectionHeader>
              {galleryPreview.length > 0 ? (
                <PhotoGrid>
                  {galleryPreview.map((photo) => (
                    <PhotoTile key={photo.id} type="button" onClick={() => setActivePhotoIndex(photoGallery.findIndex((entry) => entry.id === photo.id))}>
                      {buildAssetUrl(photo.url) ? <img src={buildAssetUrl(photo.url)} alt={`Foto von ${photo.username}`} /> : <PhotoFallback><Images size={18} /></PhotoFallback>}
                    </PhotoTile>
                  ))}
                </PhotoGrid>
              ) : <EmptyState>Noch keine Fotos verfügbar.</EmptyState>}
            </SectionCard>
          </AsideColumn>
        </TopGrid>

        <SectionCard>
          <SectionHeader>
            <div>
              <SectionTitle>Community-Feed</SectionTitle>
              <SectionSubline>Alle Aktivitäten, Fotos und Routen dieser Eisdiele auf einen Blick.</SectionSubline>
            </div>
          </SectionHeader>
          <FeedTabs>
            <FeedTab type="button" $active={activeFeed === 'checkins'} onClick={() => setActiveFeed('checkins')}>
              <Store size={16} /> Check-ins ({checkins.length})
            </FeedTab>
            <FeedTab type="button" $active={activeFeed === 'reviews'} onClick={() => setActiveFeed('reviews')}>
              <MessageSquare size={16} /> Reviews ({reviews.length})
            </FeedTab>
            <FeedTab type="button" $active={activeFeed === 'photos'} onClick={() => setActiveFeed('photos')}>
              <Images size={16} /> Fotos ({photoGallery.length})
            </FeedTab>
            <FeedTab type="button" $active={activeFeed === 'routes'} onClick={() => setActiveFeed('routes')}>
              <Route size={16} /> Routen ({routes.length})
            </FeedTab>
          </FeedTabs>

          {activeFeed === 'checkins' && (
            <>
              {isLoggedIn && (
                <InlineActions>
                  <PrimaryAction type="button" onClick={() => setShowCheckinForm(true)}>Eis geschleckert</PrimaryAction>
                </InlineActions>
              )}
              <FeedList>
                {checkins.length > 0 ? checkins.slice(0, FEED_BATCH_SIZE).map((checkin) => (
                  <div key={checkin.id} ref={(el) => { checkinRefs.current[checkin.id] = el; }}>
                    <CheckinCard checkin={checkin} onSuccess={refreshShop} showComments={String(checkin.id) === String(focusCheckinId)} />
                  </div>
                )) : <EmptyState>Es wurden noch keine Eis-Besuche eingecheckt.</EmptyState>}
              </FeedList>
            </>
          )}

          {activeFeed === 'reviews' && (
            <>
              {isLoggedIn && (
                <InlineActions>
                  <PrimaryAction type="button" onClick={() => setShowReviewForm(true)}>Eisdiele bewerten</PrimaryAction>
                </InlineActions>
              )}
              <FeedList>
                {reviews.length > 0 ? reviews.slice(0, FEED_BATCH_SIZE).map((review) => (
                  <div key={review.id} ref={(el) => { reviewRefs.current[review.id] = el; }}>
                    <ReviewCard review={review} setShowReviewForm={setShowReviewForm} showComments={String(review.id) === String(focusReviewId)} />
                  </div>
                )) : <EmptyState>Es wurden noch keine Reviews abgegeben.</EmptyState>}
              </FeedList>
            </>
          )}

          {activeFeed === 'photos' && (
            <>
              {photoGallery.length > 0 ? (
                <LargePhotoGrid>
                  {photoGallery.map((photo, index) => (
                    <PhotoPanel key={photo.id}>
                      <PhotoPanelLink type="button" onClick={() => setActivePhotoIndex(index)}>
                        {buildAssetUrl(photo.url) ? <img src={buildAssetUrl(photo.url)} alt={`Check-in Foto von ${photo.username}`} /> : <PhotoFallback><Images size={20} /></PhotoFallback>}
                      </PhotoPanelLink>
                      <PhotoCaption>
                        <strong>{photo.username}</strong>
                        <span>{formatDate(photo.datum)}</span>
                      </PhotoCaption>
                    </PhotoPanel>
                  ))}
                </LargePhotoGrid>
              ) : <EmptyState>Keine Fotos verfügbar.</EmptyState>}
            </>
          )}

          {activeFeed === 'routes' && (
            <>
              {isLoggedIn && (
                <InlineActions>
                  <PrimaryAction type="button" onClick={() => setShowRouteForm(true)}>Neue Route einreichen</PrimaryAction>
                </InlineActions>
              )}
              <FeedList>
                {routes.length > 0 ? routes.map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    shopId={eisdiele.id}
                    shopName={eisdiele.name}
                    onSuccess={refreshShop}
                  />
                )) : <EmptyState>Es sind noch keine öffentlichen Routen für diese Eisdiele vorhanden.</EmptyState>}
              </FeedList>
            </>
          )}
        </SectionCard>
      </PageBody>

      {showPriceForm && (
        <SubmitPriceModal
          shop={shopData}
          userId={userId}
          showPriceForm={showPriceForm}
          setShowPriceForm={setShowPriceForm}
          onSuccess={refreshShop}
        />
      )}

      {showReviewForm && (
        <SubmitReviewModal
          shop={shopData}
          userId={userId}
          showForm={showReviewForm}
          setShowForm={setShowReviewForm}
          setShowPriceForm={setShowPriceForm}
          onSuccess={refreshShop}
        />
      )}

      {showCheckinForm && (
        <CheckinForm
          shopId={eisdiele.id}
          shopName={eisdiele.name}
          userId={userId}
          showCheckinForm={showCheckinForm}
          setShowCheckinForm={setShowCheckinForm}
          onSuccess={refreshShop}
          shop={shopData}
          setShowPriceForm={setShowPriceForm}
        />
      )}

      {showRouteForm && (
        <SubmitRouteModal
          showForm={showRouteForm}
          setShowForm={setShowRouteForm}
          shopId={eisdiele.id}
          shopName={eisdiele.name}
          onSuccess={refreshShop}
        />
      )}

      {activePhoto && (
        <PhotoLightboxOverlay onClick={() => setActivePhotoIndex(null)}>
          <PhotoLightboxCard onClick={(event) => event.stopPropagation()}>
            <PhotoLightboxClose type="button" onClick={() => setActivePhotoIndex(null)}>
              ×
            </PhotoLightboxClose>
            {photoGallery.length > 1 && (
              <PhotoLightboxNav type="button" $side="left" onClick={showPreviousPhoto}>
                ‹
              </PhotoLightboxNav>
            )}
            {buildAssetUrl(activePhoto.url) ? (
              <PhotoLightboxImage
                src={buildAssetUrl(activePhoto.url)}
                alt={`Foto von ${activePhoto.username || 'Unbekannt'}`}
              />
            ) : (
              <PhotoLightboxFallback>
                <Images size={28} />
              </PhotoLightboxFallback>
            )}
            {photoGallery.length > 1 && (
              <PhotoLightboxNav type="button" $side="right" onClick={showNextPhoto}>
                ›
              </PhotoLightboxNav>
            )}
            <PhotoLightboxMeta>
              <PhotoLightboxTitle>{activePhoto.username || 'Unbekannt'}</PhotoLightboxTitle>
              <PhotoLightboxText>Aufgenommen am {formatDateTime(activePhoto.datum)}</PhotoLightboxText>
              <PhotoLightboxText>
                Bild {activePhotoIndex + 1} von {photoGallery.length}
              </PhotoLightboxText>
            </PhotoLightboxMeta>
          </PhotoLightboxCard>
        </PhotoLightboxOverlay>
      )}
    </PageShell>
  );
};

export default IceShopDetailPage;

const PageShell = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(255, 218, 140, 0.22), transparent 28%),
    linear-gradient(180deg, #fffaf0 0%, #fff7e7 55%, #fffdf8 100%);
`;

const PageBody = styled.main`
  max-width: 1320px;
  margin: 0 auto;
  padding: 1rem 1rem 3rem;
`;

const GlassCard = styled.div`
  background: rgba(255, 252, 243, 0.94);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 24px;
  box-shadow: 0 18px 45px rgba(28, 20, 0, 0.08);
`;

const BackRow = styled.div`
  margin-bottom: 0.8rem;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: #7a4a00;
  text-decoration: none;
  font-weight: 700;
`;

const actionStyles = `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 2.9rem;
  padding: 0.75rem 1rem;
  border-radius: 14px;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;

  &:hover {
    transform: translateY(-1px);
  }
`;

const BackLinkButton = styled.button`
  ${actionStyles}
  margin: 1rem auto 0;
  border: 1px solid rgba(47, 33, 0, 0.12);
  background: rgba(255, 255, 255, 0.9);
  color: #5b4520;
`;

const HeroSection = styled.section`
  margin-bottom: 1rem;
`;

const HeroContent = styled(GlassCard)`
  padding: 1.4rem;
  background:
    radial-gradient(circle at top left, rgba(255, 181, 34, 0.16), transparent 34%),
    rgba(255, 252, 243, 0.94);
`;

const HeroUtilityRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

const UtilitySlot = styled.div`
  position: relative;
  width: 2.65rem;
  height: 2.65rem;
  border-radius: 999px;
  border: 1px solid rgba(47, 33, 0, 0.08);
  background: rgba(255, 255, 255, 0.84);
  display: inline-flex;
  align-items: center;
  justify-content: center;

  svg {
    position: static !important;
    inset: auto !important;
    width: 18px !important;
    height: 18px !important;
    color: #5b4520 !important;
  }

  button {
    position: static !important;
    top: auto !important;
    left: auto !important;
    border: none;
    background: transparent;
    padding: 0;
    width: 100%;
    height: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .favoriten-button {
    position: static !important;
  }

  .favoriten-button span {
    font-size: 18px !important;
    line-height: 1;
  }
`;

const HeroMetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.85rem;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.28rem 0.7rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 800;
  background: ${({ $tone }) => {
    if ($tone === 'open') return 'rgba(63, 177, 117, 0.16)';
    if ($tone === 'seasonal') return 'rgba(255, 181, 34, 0.16)';
    if ($tone === 'closed') return 'rgba(120, 120, 120, 0.16)';
    return 'rgba(47, 33, 0, 0.08)';
  }};
  color: ${({ $tone }) => {
    if ($tone === 'open') return '#196a3a';
    if ($tone === 'seasonal') return '#8a5700';
    if ($tone === 'closed') return '#555';
    return '#5b4520';
  }};
`;

const HeroTitle = styled.h1`
  margin: 0;
  color: #2f2100;
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: 1.02;
`;

const HeroAddress = styled.div`
  margin-top: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: rgba(47, 33, 0, 0.72);
  font-weight: 600;
`;

const HeroSummaryRow = styled.div`
  margin-top: 1rem;
`;

const HeroSnapshotCard = styled.div`
  padding: 1rem 1rem 0.95rem;
  border-radius: 1rem;
  border: 1px solid rgba(47, 33, 0, 0.08);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(10px);
`;

const HeroSnapshotHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.9rem;

  @media (max-width: 620px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const HeroSnapshotTitle = styled.div`
  color: #6b5327;
  font-weight: 800;
  font-size: 0.92rem;
`;

const HeroFactsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
  margin-top: 0.85rem;

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

const HeroFact = styled.div`
  padding: 0.8rem 0.85rem;
  border-radius: 0.9rem;
  background: rgba(255, 251, 241, 0.9);
  border: 1px solid rgba(47, 33, 0, 0.08);
`;

const HeroFactLabel = styled.div`
  color: #6b5327;
  font-size: 0.82rem;
  font-weight: 700;
`;

const HeroFactValue = styled.div`
  margin-top: 0.28rem;
  color: #2f2100;
  font-size: clamp(1.05rem, 2.3vw, 1.35rem);
  font-weight: 800;
  line-height: 1.2;
`;

const HeroFactSubline = styled.div`
  margin-top: 0.3rem;
  color: rgba(47, 33, 0, 0.64);
  font-size: 0.86rem;
  line-height: 1.35;
`;

const HeroSnapshotChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.8rem;

  span {
    background: rgba(255, 181, 34, 0.12);
    color: #7a4a00;
    border: 1px solid rgba(255, 181, 34, 0.2);
    padding: 0.28rem 0.6rem;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 700;
  }
`;

const HeroActions = styled.div`
  margin-top: 1.1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
`;

const PrimaryAction = styled.button`
  ${actionStyles}
  border: 1px solid rgba(255, 181, 34, 0.62);
  background: linear-gradient(180deg, #ffd26e 0%, #ffb522 100%);
  color: #2f2100;
  box-shadow: 0 10px 24px rgba(255, 181, 34, 0.22);
`;

const SecondaryAction = styled.button`
  ${actionStyles}
  border: 1px solid rgba(47, 33, 0, 0.12);
  background: rgba(255, 255, 255, 0.9);
  color: #5b4520;
`;

const ActionAnchor = styled.a`
  ${actionStyles}
  border: 1px solid rgba(47, 33, 0, 0.12);
  background: rgba(255, 255, 255, 0.84);
  color: #5b4520;
`;

const TopGrid = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(300px, 0.85fr);
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
`;

const MainColumn = styled.div`
  display: grid;
  gap: 1rem;
`;

const AsideColumn = styled.div`
  display: grid;
  gap: 1rem;
  align-self: start;
`;

const SectionCard = styled(GlassCard)`
  padding: 1rem;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 0.9rem;
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: #2f2100;
  font-size: 1.15rem;
`;

const SectionSubline = styled.p`
  margin: 0.25rem 0 0;
  color: rgba(47, 33, 0, 0.64);
  line-height: 1.4;
`;

const InfoStack = styled.div`
  display: grid;
  gap: 0.9rem;
`;

const InfoBlock = styled.div`
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: 0.75rem;
  padding-top: 0.85rem;
  border-top: 1px solid rgba(47, 33, 0, 0.07);

  &:first-child {
    border-top: none;
    padding-top: 0;
  }

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
    gap: 0.35rem;
  }
`;

const InfoLabel = styled.div`
  font-weight: 800;
  color: #6b5327;
`;

const InfoValue = styled.div`
  color: #2f2100;
  line-height: 1.5;
`;

const SplitCards = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const MiniPanel = styled.div`
  background: rgba(255, 255, 255, 0.76);
  border-radius: 18px;
  padding: 1rem;
  border: 1px solid rgba(47, 33, 0, 0.08);
`;

const MiniPanelTitle = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #6b5327;
  font-weight: 800;
  margin-bottom: 0.55rem;
`;

const MiniPanelValue = styled.div`
  color: #2f2100;
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1.1;
`;

const MiniPanelSubline = styled.div`
  margin-top: 0.35rem;
  color: rgba(47, 33, 0, 0.6);
  line-height: 1.4;
  font-size: 0.92rem;
`;

const RatingsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.45rem;

  li {
    display: grid;
    grid-template-columns: 88px minmax(96px, auto) auto;
    align-items: center;
    gap: 0.35rem;
    color: #2f2100;
  }

  li strong {
    justify-self: start;
  }

  li[data-text-only='true'] strong {
    grid-column: 2 / span 2;
  }

  @media (max-width: 420px) {
    li {
      grid-template-columns: 78px minmax(88px, auto) auto;
    }
  }
`;

const TagCloud = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.85rem;
`;

const Tag = styled.span`
  padding: 0.32rem 0.7rem;
  border-radius: 999px;
  background: rgba(255, 181, 34, 0.12);
  color: #7a4a00;
  border: 1px solid rgba(255, 181, 34, 0.22);
  font-size: 0.82rem;
  font-weight: 700;
`;

const InlineActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1rem;
`;

const InsightsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const RankingList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.5rem;
`;

const RankingItem = styled.li`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: baseline;
  color: #2f2100;
  border-bottom: 1px solid rgba(47, 33, 0, 0.07);
  padding-bottom: 0.45rem;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  strong {
    color: #7a4a00;
    white-space: nowrap;
  }
`;

const LinkRow = styled(Link)`
  color: #2f2100;
  text-decoration: none;
  pointer-events: ${({ $disabled }) => ($disabled ? 'none' : 'auto')};

  &:hover {
    text-decoration: ${({ $disabled }) => ($disabled ? 'none' : 'underline')};
  }
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;

  @media (max-width: 1180px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: rgba(255, 255, 255, 0.76);
  border-radius: 18px;
  padding: 1rem;
  border: 1px solid rgba(47, 33, 0, 0.08);
`;

const ChartTitle = styled.h3`
  margin: 0 0 0.75rem;
  color: #2f2100;
  font-size: 1rem;
`;

const ChartWrap = styled.div`
  width: 100%;
  height: 260px;
`;

const MapCard = styled.div`
  width: 100%;
  height: 300px;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(47, 33, 0, 0.08);
`;

const PhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
`;

const PhotoTile = styled.button`
  display: block;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(47, 33, 0, 0.08);
  padding: 0;
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const PhotoFallback = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8a5700;
  background: linear-gradient(180deg, #fff7e3 0%, #ffe8b0 100%);
`;

const FeedTabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-bottom: 1rem;
`;

const FeedTab = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(255, 181, 34, 0.55)' : 'rgba(47, 33, 0, 0.12)')};
  background: ${({ $active }) => ($active ? 'rgba(255, 181, 34, 0.22)' : 'rgba(255,255,255,0.88)')};
  color: ${({ $active }) => ($active ? '#7a4a00' : '#5b4520')};
  font-weight: 800;
  padding: 0.55rem 0.9rem;
  cursor: pointer;
`;

const FeedList = styled.div`
  display: grid;
  gap: 0.9rem;
`;

const LargePhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.85rem;
`;

const PhotoPanel = styled.div`
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(47, 33, 0, 0.08);
  background: rgba(255, 255, 255, 0.84);
`;

const PhotoPanelLink = styled.button`
  display: block;
  aspect-ratio: 4 / 3;
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const PhotoCaption = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.75rem 0.85rem;
  color: #2f2100;

  span {
    color: rgba(47, 33, 0, 0.6);
    font-size: 0.85rem;
  }
`;

const EmptyState = styled.div`
  padding: 0.95rem 1rem;
  border-radius: 16px;
  border: 1px dashed rgba(47, 33, 0, 0.12);
  background: rgba(255, 255, 255, 0.64);
  color: rgba(47, 33, 0, 0.62);
  line-height: 1.45;
`;

const StateCard = styled(GlassCard)`
  max-width: 620px;
  margin: 3rem auto;
  padding: 1.5rem;
  text-align: center;

  h1 {
    margin: 0;
    color: #2f2100;
  }

  p {
    margin: 0.6rem 0 0;
    color: rgba(47, 33, 0, 0.66);
  }
`;

const PhotoLightboxOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 5000;
  background: rgba(11, 10, 7, 0.86);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const PhotoLightboxCard = styled.div`
  position: relative;
  width: min(92vw, 1100px);
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const PhotoLightboxClose = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  transform: translateY(-110%);
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  background: rgba(255, 255, 255, 0.12);
  color: white;
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;

  @media (max-width: 720px) {
    transform: none;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 2;
  }
`;

const PhotoLightboxNav = styled.button`
  position: absolute;
  top: 50%;
  ${({ $side }) => ($side === 'left' ? 'left: 0.75rem;' : 'right: 0.75rem;')}
  transform: translateY(-50%);
  width: 3rem;
  height: 3rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  background: rgba(255, 255, 255, 0.14);
  color: white;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;

  @media (max-width: 720px) {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1.7rem;
  }
`;

const PhotoLightboxImage = styled.img`
  max-width: 100%;
  max-height: min(74vh, 860px);
  object-fit: contain;
  border-radius: 18px;
  display: block;
  box-shadow: 0 20px 55px rgba(0, 0, 0, 0.28);
`;

const PhotoLightboxFallback = styled.div`
  width: min(92vw, 900px);
  height: min(64vh, 720px);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
`;

const PhotoLightboxMeta = styled.div`
  width: min(92vw, 900px);
  color: white;
  text-align: center;
  display: grid;
  gap: 0.25rem;
`;

const PhotoLightboxTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
`;

const PhotoLightboxText = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
`;
