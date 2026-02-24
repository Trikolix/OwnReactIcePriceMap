import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useUser } from '../context/UserContext';
import Header from '../Header';
import Rating from '../components/Rating';
import CheckinCard from '../components/CheckinCard';
import ReviewCard from '../components/ReviewCard';
import RouteCard from '../components/RouteCard';
import FavoritenButton from '../components/FavoritButton';
import OpeningHours from '../components/OpeningHours';
import ShopWebsite from '../components/ShopWebsite';
import SubmitPriceModal from '../SubmitPriceModal';
import SubmitReviewModal from '../SubmitReviewModal';
import CheckinForm from '../CheckinForm';
import SubmitRouteModal from '../SubmitRouteModal';
import ShareIcon from '../components/ShareButton';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const ASSET_BASE = (import.meta.env.VITE_ASSET_BASE_URL || 'https://ice-app.de/').replace(/\/+$/, '');

const buildAssetUrl = (path) => (path ? `https://ice-app.de/${path}` : null);

const TRAVEL_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

const IceShopDetailPage = () => {
  const { shopId } = useParams();
  const { isLoggedIn, userId } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showCheckinForm, setShowCheckinForm] = useState(false);
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [focusCheckinId, setFocusCheckinId] = useState(null);
  const [focusReviewId, setFocusReviewId] = useState(null);

  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');
  const checkinIdParam = searchParams.get('focusCheckin');
  const reviewIdParam = searchParams.get('focusReview');

  useEffect(() => {
    if (tabParam) setActiveTab(tabParam);
    if (checkinIdParam) setFocusCheckinId(checkinIdParam);
    if (reviewIdParam) setFocusReviewId(reviewIdParam);
  }, [tabParam, checkinIdParam, reviewIdParam]);

  const fetchShopData = async () => {
    try {
      const response = await fetch(`${API_BASE}/get_eisdiele_details.php?eisdiele_id=${shopId}&nutzer_id=${userId || ''}`);
      if (!response.ok) throw new Error('Fehler beim Abruf der Shop-Details');
      const data = await response.json();
      setShopData(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shopId) fetchShopData();
  }, [shopId, userId]);

  const refreshShop = () => fetchShopData();

  const handleEditClick = () => {
    // Implement edit functionality if needed
    console.log('Edit clicked');
  };

  const calculateTimeDifference = (dateString) => {
    const currentDate = new Date();
    const pastDate = new Date(dateString);
    const diffInMilliseconds = currentDate - pastDate;
    const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));

    if (diffInDays > 365) {
      const diffInYears = Math.floor(diffInDays / 365);
      return `Vor ${diffInYears} Jahr${diffInYears > 1 ? 'en' : ''}`;
    } else if (diffInDays > 30) {
      const diffInMonths = Math.floor(diffInDays / 30);
      return `Vor ${diffInMonths} Monat${diffInMonths > 1 ? 'en' : ''}`;
    } else if (diffInDays === 0) {
      return 'Vor < 24 Stunden';
    } else {
      return `Vor ${diffInDays} Tag${diffInDays > 1 ? 'en' : ''}`;
    }
  };

  const formatRating = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(1) : '–';
  };

  const formatDate = (value) => {
    if (!value) return '–';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '–' : date.toLocaleDateString();
  };

  if (loading) {
    return (
      <FullPage>
        <Header />
        <WhiteBackground>
          <DashboardWrapper>
            <LoadingCard>
              <h1>Eisdielen-Details</h1>
              <p>Lade Daten...</p>
            </LoadingCard>
          </DashboardWrapper>
        </WhiteBackground>
      </FullPage>
    );
  }

  if (error) {
    return (
      <FullPage>
        <Header />
        <WhiteBackground>
          <DashboardWrapper>
            <LoadingCard>
              <h1>Eisdielen-Details</h1>
              <p>Fehler: {error}</p>
            </LoadingCard>
          </DashboardWrapper>
        </WhiteBackground>
      </FullPage>
    );
  }

  if (!shopData) {
    return (
      <FullPage>
        <Header />
        <WhiteBackground>
          <DashboardWrapper>
            <LoadingCard>
              <h1>Eisdielen-Details</h1>
              <p>Shop nicht gefunden</p>
            </LoadingCard>
          </DashboardWrapper>
        </WhiteBackground>
      </FullPage>
    );
  }

  const eisdiele = shopData.eisdiele;
  const preise = shopData.preise;
  const scores = shopData.scores;
  const statistiken = shopData.statistiken;
  const checkinDetailsByType = shopData.checkin_details_by_type;
  const beliebteSorten = shopData.beliebte_sorten;
  const attribute = shopData.attribute;
  const reviews = shopData.reviews || [];
  const checkins = shopData.checkins || [];
  const routen = shopData.routen || [];
  const fotoGalerie = shopData.foto_galerie || [];
  const aehnlicheEisdielen = shopData.aehnliche_eisdielen || [];
  const persoenlicheStatistiken = shopData.persoenliche_statistiken;
  const preisHistorie = shopData.preis_historie || [];

  // Prepare price history data for chart
  // Kombiniere alle Preisänderungen in ein gemeinsames Array für die Chart
  const priceHistoryCombined = [];
  preisHistorie.forEach(entry => {
    // Datum in ISO-Format für Sortierung
    const isoDatum = entry.datum.replace(' ', 'T');
    priceHistoryCombined.push({
      typ: entry.typ,
      preis: parseFloat(entry.preis),
      waehrung: entry.waehrung_symbol,
      rawDatum: isoDatum,
    });
  });
  // Nach Datum sortieren (aufsteigend)
  priceHistoryCombined.sort((a, b) => new Date(a.rawDatum) - new Date(b.rawDatum));

  // Erzeuge ein Array mit allen Zeitpunkten und jeweils den letzten bekannten Preis pro Typ
  // Monatsweise Zeitachse von erstem Preis bis heute
  function getMonthKey(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
  }

  let firstDate = priceHistoryCombined.length > 0 ? new Date(priceHistoryCombined[0].rawDatum) : null;
  let lastDate = new Date();
  if (firstDate) {
    // Immer auf den 1. des Monats setzen
    firstDate = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
    lastDate = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1);
  }

  // Map für schnellen Zugriff auf letzten Preis pro Typ pro Monat
  const monthMap = {};
  let lastKugel = null;
  let lastSofteis = null;
  priceHistoryCombined.forEach(entry => {
    const d = new Date(entry.rawDatum);
    const key = getMonthKey(d);
    if (!monthMap[key]) monthMap[key] = {};
    if (entry.typ === 'kugel') lastKugel = entry.preis;
    if (entry.typ === 'softeis') lastSofteis = entry.preis;
    monthMap[key] = { kugel: lastKugel, softeis: lastSofteis };
  });

  // Chartdaten für jeden Monat generieren
  const chartData = [];
  if (firstDate) {
    let current = new Date(firstDate);
    let lastKugelVal = null;
    let lastSofteisVal = null;
    while (current <= lastDate) {
      const key = getMonthKey(current);
      if (monthMap[key]) {
        if (monthMap[key].kugel !== undefined) lastKugelVal = monthMap[key].kugel;
        if (monthMap[key].softeis !== undefined) lastSofteisVal = monthMap[key].softeis;
      }
      chartData.push({
        datum: current.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit' }),
        kugel: lastKugelVal,
        softeis: lastSofteisVal
      });
      // Nächster Monat
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
  }

  // Travel mode distribution with colors
  const travelDistribution = statistiken.anreise_verteilung.map((entry, index) => ({
    ...entry,
    fill: TRAVEL_COLORS[index % TRAVEL_COLORS.length]
  }));

  return (
    <FullPage>
      <Header />
      <WhiteBackground>
        <DashboardWrapper>
          <ShopHeader>
            <ShopTitle>{eisdiele.name}</ShopTitle>
            <ActionButtons>
              <FavoritenButton eisdieleId={eisdiele.id} />
              <ShareIcon path={`/eisdiele/${shopId}`} />
            </ActionButtons>
          </ShopHeader>

          <Tabs>
            <Tab onClick={() => setActiveTab('info')} active={activeTab === 'info'}>Allgemein</Tab>
            <Tab onClick={() => setActiveTab('bewertungen')} active={activeTab === 'bewertungen'}>Bewertungen</Tab>
            <Tab onClick={() => setActiveTab('checkins')} active={activeTab === 'checkins'}>Check-Ins</Tab>
            <Tab onClick={() => setActiveTab('statistiken')} active={activeTab === 'statistiken'}>Statistiken</Tab>
            <Tab onClick={() => setActiveTab('fotos')} active={activeTab === 'fotos'}>Fotos</Tab>
            <Tab onClick={() => setActiveTab('routen')} active={activeTab === 'routen'}>Routen</Tab>
          </Tabs>

          {activeTab === 'info' && (
            <InfoTabContent>
              <GeneralInfoSection>
                <h2>Allgemeine Informationen</h2>
                <InfoGrid>
                  <InfoItem>
                    <strong>Adresse:</strong> {eisdiele.adresse}
                  </InfoItem>
                  <InfoItem>
                    <strong>Region:</strong> {eisdiele.landkreis}, {eisdiele.bundesland}, {eisdiele.land}
                  </InfoItem>
                  <InfoItem>
                    <strong>Status:</strong> {eisdiele.status === 'open' ? 'Geöffnet' : eisdiele.status === 'seasonal_closed' ? 'Saisonbedingt geschlossen' : 'Permanent geschlossen'}
                  </InfoItem>
                  <InfoItem>
                    <strong>Erster Check-in:</strong> {formatDate(statistiken.erster_checkin)}
                  </InfoItem>
                  <InfoItem>
                    <strong>Letzter Check-in:</strong> {formatDate(statistiken.letzter_checkin)}
                  </InfoItem>
                </InfoGrid>

                <OpeningHours eisdiele={eisdiele} />
                <ShopWebsite eisdiele={eisdiele} onSuccess={refreshShop} />

                {isLoggedIn && (
                  <SuggestionButton type="button" onClick={handleEditClick}>
                    Änderung vorschlagen
                  </SuggestionButton>
                )}
              </GeneralInfoSection>

              <MapSection>
                <h2>Standort</h2>
                <MapContainer
                  center={[eisdiele.latitude, eisdiele.longitude]}
                  zoom={15}
                  style={{ height: '400px', width: '100%', borderRadius: '8px' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker
                    position={[eisdiele.latitude, eisdiele.longitude]}
                    icon={defaultIcon}
                  >
                    <Popup>{eisdiele.name}</Popup>
                  </Marker>
                </MapContainer>
              </MapSection>

              <PricesSection>
                <h2>Preise</h2>
                {(preise.kugel == null && preise.softeis == null) && (
                  <p>Es sind noch keine Preise für die Eisdiele gemeldet. {isLoggedIn && 'Trage jetzt gerne Preise ein:'}</p>
                )}
                <Table>
                  {preise.kugel != null && (
                    <tr>
                      <th>Kugelpreis:</th>
                      <td>
                        <strong>{preise.kugel.preis ?? '-'}{' '}{preise.kugel.waehrung_symbol ?? '€'}</strong>
                        {preise.kugel.beschreibung ? ` (${preise.kugel.beschreibung})` : ''}
                        <span style={{ fontSize: 'smaller', color: 'grey' }}>
                          ({calculateTimeDifference(preise.kugel.letztes_update)} aktualisiert)
                        </span>
                      </td>
                    </tr>
                  )}
                  {preise.softeis != null && (
                    <tr>
                      <th>Softeispreis:</th>
                      <td>
                        <strong>{preise.softeis.preis ?? '-'}{' '}{preise.softeis.waehrung_symbol ?? '€'}</strong>
                        {preise.softeis.beschreibung ? ` (${preise.softeis.beschreibung})` : ''}
                        <span style={{ fontSize: 'smaller', color: 'grey' }}>
                          ({calculateTimeDifference(preise.softeis.letztes_update)} aktualisiert)
                        </span>
                      </td>
                    </tr>
                  )}
                </Table>
                {isLoggedIn && (
                  <ButtonContainer>
                    <Button onClick={() => setShowPriceForm(true)}>Preis melden / bestätigen</Button>
                  </ButtonContainer>
                )}
              </PricesSection>

              <RatingsSection>
                <h2>Durchschnittliche Bewertung</h2>
                {(scores.kugel || scores.softeis || scores.eisbecher || shopData.bewertungen.auswahl || attribute.length > 0) ? (
                  <Table>
                    {scores.kugel !== null && (
                      <tr>
                        <th>Kugeleis:</th>
                        <td>
                          <Rating stars={scores.kugel} /> <strong>{scores.kugel}</strong>
                        </td>
                      </tr>
                    )}
                    {scores.softeis !== null && (
                      <tr>
                        <th>Softeis:</th>
                        <td>
                          <Rating stars={scores.softeis} /> <strong>{scores.softeis}</strong>
                        </td>
                      </tr>
                    )}
                    {scores.eisbecher !== null && (
                      <tr>
                        <th>Eisbecher:</th>
                        <td>
                          <Rating stars={scores.eisbecher} /> <strong>{scores.eisbecher}</strong>
                        </td>
                      </tr>
                    )}
                    {shopData.bewertungen.auswahl !== null && (
                      <tr>
                        <th>Auswahl:</th>
                        <td>
                          ~ <strong>{shopData.bewertungen.auswahl}</strong> Sorten
                        </td>
                      </tr>
                    )}
                    {attribute.length > 0 && (
                      <tr>
                        <th>Attribute:</th>
                        <td>
                          <AttributeSection>
                            {attribute.map(attr => (
                              <AttributeBadge key={attr.name}>{attr.anzahl} x {attr.name}</AttributeBadge>
                            ))}
                          </AttributeSection>
                        </td>
                      </tr>
                    )}
                  </Table>
                ) : (
                  <p>Es sind noch keine Bewertungen für die Eisdiele abgegeben wurden.</p>
                )}
                {isLoggedIn && (
                  <ButtonContainer>
                    <Button onClick={() => setShowCheckinForm(true)}>Eis-Besuch einchecken</Button>
                    <Button onClick={() => setShowReviewForm(true)}>Eisdiele bewerten</Button>
                  </ButtonContainer>
                )}
              </RatingsSection>

              <PriceHistorySection>
                <h2>Preisverlauf</h2>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="datum" type="category" allowDuplicatedCategory={false} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="kugel"
                        name="Kugel"
                        stroke="#8884d8"
                        dot={{ r: 3 }}
                        isAnimationActive={false}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="softeis"
                        name="Softeis"
                        stroke="#4ECDC4"
                        dot={{ r: 3 }}
                        isAnimationActive={false}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p>Keine Preishistorie verfügbar.</p>
                )}
              </PriceHistorySection>

            {/*  <SimilarShopsSection>
                <h2>Ähnliche Eisdielen in der Nähe</h2>
                {aehnlicheEisdielen.length > 0 ? (
                  <SimilarShopsGrid>
                    {aehnlicheEisdielen.map(shop => (
                      <SimilarShopCard
                        key={shop.id}
                        onClick={() => navigate(`/eisdiele/${shop.id}`)}
                      >
                        <h3>{shop.name}</h3>
                        <p>{shop.adresse}</p>
                        {shop.finaler_kugel_score && (
                          <p>
                            <Rating stars={shop.finaler_kugel_score} /> {shop.finaler_kugel_score}
                          </p>
                        )}
                      </SimilarShopCard>
                    ))}
                  </SimilarShopsGrid>
                ) : (
                  <p>Keine ähnlichen Eisdielen in der Nähe gefunden.</p>
                )}
              </SimilarShopsSection> */}
            </InfoTabContent>
          )}

          {activeTab === 'bewertungen' && (
            <ReviewsTabContent>
              <h2>Bewertungen</h2>
              {reviews.length <= 0 && <p>Es wurden noch keine Reviews abgegeben.</p>}
              {isLoggedIn && (
                <ButtonContainer>
                  <Button onClick={() => setShowReviewForm(true)}>Eisdiele bewerten</Button>
                </ButtonContainer>
              )}
              {reviews.map((review, index) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  setShowReviewForm={setShowReviewForm}
                  showComments={review.id.toString() === focusReviewId?.toString()}
                />
              ))}
            </ReviewsTabContent>
          )}

          {activeTab === 'checkins' && (
            <CheckinsTabContent>
              <h2>Check-Ins</h2>
              {checkins.length <= 0 && <p>Es wurden noch keine Eis-Besuche eingecheckt.</p>}
              {isLoggedIn && (
                <ButtonContainer>
                  <Button onClick={() => setShowCheckinForm(true)}>Eis geschleckert</Button>
                </ButtonContainer>
              )}
              {checkins.map((checkin, index) => (
                <CheckinCard
                  key={checkin.id}
                  checkin={checkin}
                  onSuccess={refreshShop}
                  showComments={checkin.id.toString() === focusCheckinId?.toString()}
                />
              ))}
            </CheckinsTabContent>
          )}

          {activeTab === 'statistiken' && (
            <StatisticsTabContent>
              <h2>Statistiken</h2>

              <StatsSection>
                <h3>Check-in Statistiken</h3>
                <InfoGrid>
                  <InfoItem>
                    <strong>Gesamt Check-ins:</strong> {statistiken.gesamt_checkins}
                  </InfoItem>
                  <InfoItem>
                    <strong>Verschiedene Besucher:</strong> {statistiken.verschiedene_besucher}
                  </InfoItem>
                  <InfoItem>
                    <strong>Kugeleis Check-ins:</strong> {statistiken.checkins_nach_typ.Kugel}
                  </InfoItem>
                  <InfoItem>
                    <strong>Softeis Check-ins:</strong> {statistiken.checkins_nach_typ.Softeis}
                  </InfoItem>
                  <InfoItem>
                    <strong>Eisbecher Check-ins:</strong> {statistiken.checkins_nach_typ.Eisbecher}
                  </InfoItem>
                </InfoGrid>

                <h3>Anreise Verteilung</h3>
                {travelDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={travelDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="anzahl"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {travelDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p>Keine Anreisedaten verfügbar.</p>
                )}
              </StatsSection>

              <StatsSection>
                <h3>Beliebte Sorten</h3>
                <TwoColumnGrid>
                  <div>
                    <h4>Meist gegessen</h4>
                    {beliebteSorten.meistgegessen.length > 0 ? (
                      <RankingList>
                        {beliebteSorten.meistgegessen.map((sorte, index) => (
                          <RankingItem key={index}>
                            <span>{index + 1}. {sorte.sortenname}</span>
                            <span>{sorte.anzahl}x · {formatRating(sorte.durchschnittsbewertung)}★</span>
                          </RankingItem>
                        ))}
                      </RankingList>
                    ) : (
                      <p>Keine Daten verfügbar.</p>
                    )}
                  </div>
                  <div>
                    <h4>Best bewertet</h4>
                    {beliebteSorten.bestbewertet.length > 0 ? (
                      <RankingList>
                        {beliebteSorten.bestbewertet.map((sorte, index) => (
                          <RankingItem key={index}>
                            <span>{index + 1}. {sorte.sortenname}</span>
                            <span>{formatRating(sorte.durchschnittsbewertung)}★ · {sorte.anzahl} Bewertungen</span>
                          </RankingItem>
                        ))}
                      </RankingList>
                    ) : (
                      <p>Keine Daten verfügbar.</p>
                    )}
                  </div>
                </TwoColumnGrid>
              </StatsSection>

              {checkinDetailsByType.length > 0 && (
                <StatsSection>
                  <h3>Check-in Details nach Typ</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={checkinDetailsByType}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="typ" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="anzahl" name="Anzahl" fill="#8884d8" />
                      <Bar dataKey="avg_geschmack" name="Durchschnittlicher Geschmack" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </StatsSection>
              )}

              {persoenlicheStatistiken && (
                <StatsSection>
                  <h3>Deine persönlichen Statistiken</h3>
                  <InfoGrid>
                    <InfoItem>
                      <strong>Eigene Check-ins:</strong> {persoenlicheStatistiken.eigene_checkins}
                    </InfoItem>
                    <InfoItem>
                      <strong>Erster Besuch:</strong> {formatDate(persoenlicheStatistiken.erster_besuch)}
                    </InfoItem>
                    <InfoItem>
                      <strong>Letzter Besuch:</strong> {formatDate(persoenlicheStatistiken.letzter_besuch)}
                    </InfoItem>
                  </InfoGrid>

                  {persoenlicheStatistiken.lieblingssorten && persoenlicheStatistiken.lieblingssorten.length > 0 && (
                    <div>
                      <h4>Deine Lieblingssorten</h4>
                      <RankingList>
                        {persoenlicheStatistiken.lieblingssorten.map((sorte, index) => (
                          <RankingItem key={index}>
                            <span>{index + 1}. {sorte.sortenname}</span>
                            <span>{sorte.anzahl}x · {formatRating(sorte.durchschnittsbewertung)}★</span>
                          </RankingItem>
                        ))}
                      </RankingList>
                    </div>
                  )}
                </StatsSection>
              )}
            </StatisticsTabContent>
          )}

          {activeTab === 'fotos' && (
            <PhotosTabContent>
              <h2>Fotos</h2>
              {fotoGalerie.length > 0 ? (
                <PhotoGallery>
                  {fotoGalerie.map(photo => (
                    <PhotoCard key={photo.id}>
                      <img
                        src={buildAssetUrl(photo.pfad)}
                        alt={`Check-in Foto von ${photo.nutzername}`}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder-image.jpg';
                        }}
                      />
                      <PhotoInfo>
                        <span>Von {photo.nutzername}</span>
                        <span>{new Date(photo.datum).toLocaleDateString()}</span>
                      </PhotoInfo>
                    </PhotoCard>
                  ))}
                </PhotoGallery>
              ) : (
                <p>Keine Fotos verfügbar.</p>
              )}
            </PhotosTabContent>
          )}

          {activeTab === 'routen' && (
            <RoutesTabContent>
              <h2>Komoot Routen</h2>
              {routen.length < 1 && <p>Es sind noch keine öffentlichen Routen für die Eisdiele vorhanden.</p>}
              {isLoggedIn && (
                <ButtonContainer>
                  <Button onClick={() => setShowRouteForm(true)}>Neue Route einreichen</Button>
                </ButtonContainer>
              )}
              {routen.map((route, index) => (
                <RouteCard
                  key={index}
                  route={route}
                  shopId={eisdiele.id}
                  shopName={eisdiele.name}
                  onSuccess={refreshShop}
                />
              ))}
            </RoutesTabContent>
          )}

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
        </DashboardWrapper>
      </WhiteBackground>
    </FullPage>
  );
};

export default IceShopDetailPage;

// Styled Components
const FullPage = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const WhiteBackground = styled.div`
  background: white;
  flex: 1;
`;

const DashboardWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
`;

const LoadingCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  text-align: center;
`;

const ShopHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ShopTitle = styled.h1`
  font-size: 2rem;
  color: #333;
  margin: 0;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Tabs = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #eee;
  overflow-x: auto;
`;

const Tab = styled.button`
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  border-bottom: ${props => props.active ? '2px solid #ffb522' : 'none'};
  cursor: pointer;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  color: ${props => props.active ? '#333' : '#666'};
  white-space: nowrap;
`;

const InfoTabContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const GeneralInfoSection = styled.div`
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const InfoItem = styled.div`
  margin-bottom: 0.5rem;
`;

const MapSection = styled.div`
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
`;

const PricesSection = styled.div`
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
`;

const RatingsSection = styled.div`
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
`;

const PriceHistorySection = styled.div`
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
`;

const SimilarShopsSection = styled.div`
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
`;

const SimilarShopsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
`;

const SimilarShopCard = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
`;

const ReviewsTabContent = styled.div`
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
`;

const CheckinsTabContent = styled.div`
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
`;

const StatisticsTabContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
`;

const StatsSection = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const RankingList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const RankingItem = styled.li`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
  }
`;

const PhotosTabContent = styled.div`
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
`;

const PhotoGallery = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
`;

const PhotoCard = styled.div`
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }
`;

const PhotoInfo = styled.div`
  padding: 0.5rem;
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #666;
`;

const RoutesTabContent = styled.div`
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;

  th, td {
    padding: 0.5rem;
    text-align: left;
    border-bottom: 1px solid #eee;
  }

  th {
    font-weight: bold;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
  flex-wrap: wrap;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  background: #ffb522;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.2s;

  &:hover {
    background: #e6a21a;
  }
`;

const SuggestionButton = styled.button`
  padding: 0.5rem 1rem;
  background: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;

  &:hover {
    background: #e0e0e0;
  }
`;

const AttributeSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const AttributeBadge = styled.span`
  background: #e0e0e0;
  padding: 0.2rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.8rem;
`;