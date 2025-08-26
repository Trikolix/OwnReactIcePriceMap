import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useMediaQuery } from 'react-responsive';
import styled from 'styled-components';
import { useSearchParams } from 'react-router-dom';
import Rating from "./components/Rating";
import { useUser } from './context/UserContext';
import ReviewCard from './components/ReviewCard';
import CheckinCard from './components/CheckinCard';
import FavoritenButton from './components/FavoritButton';
import OpeningHours from './components/OpeningHours';
import ShopWebsite from './components/ShopWebsite';
import RouteCard from './components/RouteCard';
import SubmitRouteForm from './SubmitRouteModal';
import ShareIcon from './components/ShareButton';
import CheckinFrom from './CheckinForm';
import SubmitPriceModal from './SubmitPriceModal';
import SubmitReviewModal from './SubmitReviewModal';

const ShopDetailsView = ({ shopId, onClose, setIceCreamShops, refreshMapShops }) => {
  const [activeTab, setActiveTab] = useState('info');
  const headerRef = useRef(null);
  const startYRef = useRef(0);
  const { isLoggedIn, userId } = useUser();
  const [routes, setRoutes] = useState([]);
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showCheckinForm, setShowCheckinForm] = useState(false);
  const [shopData, setShopData] = useState(null);
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const [currentHeight, setCurrentHeight] = useState(window.innerHeight * 0.5);
  const [{ height }, api] = useSpring(() => ({ height: currentHeight }));
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const focusCheckinId = searchParams.get("focusCheckin");

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const minHeight = window.innerHeight * 0.3;
  const maxHeight = window.innerHeight * 1;

  const handleTouchStart = (e) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    const deltaY = e.touches[0].clientY - startYRef.current;
    const newHeight = Math.max(minHeight, Math.min(maxHeight, currentHeight - deltaY));
    api.start({ height: newHeight });
  };

  const handleTouchEnd = (e) => {
    // Setze neue aktuelle Höhe, um später weiterrechnen zu können
    api.start({ height: height.get() });
    setCurrentHeight(height.get());
  };

  const fetchShopData = useCallback(async (id) => {
    try {
      const response = await fetch(`${apiUrl}/get_eisdiele.php?eisdiele_id=${id}`);
      const data = await response.json();
      setShopData(data);
    } catch (err) {
      console.error('Fehler beim Abrufen der Shop-Details via URL:', err);
    }
  }, []);

  const refreshShop = () => {
    fetchShopData(shopData.eisdiele.id);
  };

  const fetchRoutes = useCallback(async (id, userId) => {
    try {
      // Basis-URL mit der Eisdiele-ID
      let url = `${apiUrl}/routen/getRoutes.php?eisdiele_id=${id}`;

      // Wenn userId gesetzt ist, hänge sie an die URL an
      if (userId) {
        url += `&nutzer_id=${userId}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      setRoutes(data);
    } catch (err) {
      console.error('Fehler beim Abrufen der Routen via URL:', err);
    }
  }, []);

  const refreshRoutes = () => {
    fetchRoutes(shopId, userId);
  };

  useEffect(() => {
    if (shopId) {
      fetchShopData(shopId);
      fetchRoutes(shopId, userId);
    }
  }, [shopId, userId, fetchShopData, fetchRoutes]);


  if (!shopData) return null;

  return (
    <>
      {isMobile ? (
        <AnimatedContainer
          style={{ height }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Inhalt */}
          <Header ref={headerRef}>
            <IceShopHeader>{shopData.eisdiele.name}</IceShopHeader>
            <CloseButton onClick={onClose}>✖</CloseButton>
            <FavoritenButton
              eisdieleId={shopData.eisdiele.id}
              setIceCreamShops={setIceCreamShops}
            />
            <ShareIcon path={"/map/activeShop/" + shopData.eisdiele.id} />
          </Header>
          <Tabs>
            <Tab onClick={() => setActiveTab('info')} active={activeTab === 'info'}>Allgemein</Tab>
            <Tab onClick={() => setActiveTab('checkins')} active={activeTab === 'checkins'}>Check-ins</Tab>
            <Tab onClick={() => setActiveTab('reviews')} active={activeTab === 'reviews'}>Bewertungen</Tab>
          </Tabs>
          <Content>
            <ShopDetailsContent
              activeTab={activeTab}
              shopData={shopData}
              isLoggedIn={isLoggedIn}
              setShowPriceForm={setShowPriceForm}
              refreshShop={refreshShop}
              setShowCheckinForm={setShowCheckinForm}
              setShowRouteForm={setShowRouteForm}
              setShowReviewForm={setShowReviewForm}
              routes={routes}
              refreshRoutes={refreshRoutes}
              focusCheckinId={focusCheckinId}
            />
          </Content>
        </AnimatedContainer>
      ) : (
        <Container>
          <Header ref={headerRef}>
            <IceShopHeader>{shopData.eisdiele.name}</IceShopHeader>
            <CloseButton onClick={onClose}>✖</CloseButton>
            <FavoritenButton
              eisdieleId={shopData.eisdiele.id}
              setIceCreamShops={setIceCreamShops}
            />
            <ShareIcon path={"/map/activeShop/" + shopData.eisdiele.id} />
          </Header>
          <Tabs>
            <Tab onClick={() => setActiveTab('info')} active={activeTab === 'info'}>Allgemein</Tab>
            <Tab onClick={() => setActiveTab('checkins')} active={activeTab === 'checkins'}>Check-ins</Tab>
            <Tab onClick={() => setActiveTab('reviews')} active={activeTab === 'reviews'}>Bewertungen</Tab>
          </Tabs>
          <Content>
            <ShopDetailsContent
              activeTab={activeTab}
              shopData={shopData}
              isLoggedIn={isLoggedIn}
              setShowPriceForm={setShowPriceForm}
              refreshShop={refreshShop}
              setShowCheckinForm={setShowCheckinForm}
              setShowRouteForm={setShowRouteForm}
              setShowReviewForm={setShowReviewForm}
              routes={routes}
              refreshRoutes={refreshRoutes}

              focusCheckinId={focusCheckinId}
            />
          </Content>
        </Container>)}
      {showRouteForm && (
        <SubmitRouteForm
          showForm={showRouteForm}
          setShowForm={setShowRouteForm}
          shopId={shopData.eisdiele.id}
          shopName={shopData.eisdiele.name}
          onSuccess={refreshRoutes}
        />
      )}
      {showPriceForm && (<SubmitPriceModal
        shop={shopData}
        userId={userId}
        showPriceForm={showPriceForm}
        setShowPriceForm={setShowPriceForm}
        onSuccess={() => { refreshShop(); refreshMapShops(); }}
      />)}

      {showReviewForm && (<SubmitReviewModal
        shop={shopData}
        userId={userId}
        showForm={showReviewForm}
        setShowForm={setShowReviewForm}
        setShowPriceForm={setShowPriceForm}
        onSuccess={() => { refreshShop(); refreshMapShops(); }}
      />)}
      {showCheckinForm && (<CheckinFrom
        shopId={shopData.eisdiele.id}
        shopName={shopData.eisdiele.name}
        userId={userId}
        showCheckinForm={showCheckinForm}
        setShowCheckinForm={setShowCheckinForm}
        onSuccess={refreshShop}
        shop={shopData}
        setShowPriceForm={setShowPriceForm}
      />)}

    </>);
};
const ShopDetailsContent = ({ activeTab, shopData, isLoggedIn, setShowPriceForm, refreshShop, setShowCheckinForm, setShowRouteForm, setShowReviewForm, routes, refreshRoutes, focusCheckinId }) => {
  const checkinRefs = useRef({});

  useEffect(() => {
    if (
      activeTab === 'checkins' &&
      focusCheckinId &&
      shopData?.checkins?.length &&
      checkinRefs.current[focusCheckinId]
    ) {
      checkinRefs.current[focusCheckinId].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeTab, shopData?.checkins, focusCheckinId]);

  const calculateTimeDifference = (dateString) => {
    const currentDate = new Date();
    const pastDate = new Date(dateString);

    // Berechnen der Differenz in Millisekunden
    const diffInMilliseconds = currentDate - pastDate;

    // Umrechnen in Tage
    const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));

    if (diffInDays > 365) {
      const diffInYears = Math.floor(diffInDays / 365);
      return `Vor ${diffInYears} Jahr${diffInYears > 1 ? 'en' : ''}`;
    } else if (diffInDays > 30) {
      const diffInMonths = Math.floor(diffInDays / 30);
      return `Vor ${diffInMonths} Monat${diffInMonths > 1 ? 'en' : ''}`;
    } else if (diffInDays === 0)
      return 'Vor < 24 Stunden';
    else {
      return `Vor ${diffInDays} Tag${diffInDays > 1 ? 'en' : ''}`;
    }
  };
  if (activeTab === 'info') {
    return (
      <div>
        <strong>Eisdiele in: </strong>{shopData.eisdiele.land} - {shopData.eisdiele.bundesland} - {shopData.eisdiele.landkreis}<br />
        <strong>Adresse:</strong> {shopData.eisdiele.adresse}<br />
        <OpeningHours eisdiele={shopData.eisdiele} />
        <ShopWebsite eisdiele={shopData.eisdiele} onSuccess={refreshShop} />
        <h2>Preise</h2>
        {(shopData.preise.kugel == null && shopData.preise.softeis == null) && (<>Es sind noch keine Preise für die Eisdiele gemeldet. {isLoggedIn && <>Trage jetzt gerne Preise ein:</>} </>)}
        <Table>
          {shopData.preise.kugel != null && (
            <tr>
              <th>Kugelpreis:</th>
              <td>
                <strong>{shopData.preise?.kugel?.preis?.toFixed(2) ?? "-"} {shopData.preise?.kugel?.waehrung_symbol ?? "€"} </strong>
                {shopData.preise?.kugel?.beschreibung ? (<>({shopData.preise.kugel.beschreibung}) </>) : <></>}
                <span style={{ fontSize: 'smaller', color: 'grey' }}>({calculateTimeDifference(shopData.preise.kugel.letztes_update)} aktualisiert)</span>
              </td>
            </tr>)}
          {shopData.preise.softeis != null && (
            <tr>
              <th>Softeispreis:</th>
              <td>
                <strong>{shopData.preise?.softeis?.preis?.toFixed(2) ?? "-"} {shopData.preise?.softeis?.waehrung_symbol ?? "€"} </strong>
                {shopData.preise?.softeis?.beschreibung ? (<>({shopData.preise.softeis.beschreibung}) </>) : <></>}
                <span style={{ fontSize: 'smaller', color: 'grey' }}>({calculateTimeDifference(shopData.preise.softeis.letztes_update)} aktualisiert)</span>
              </td>
            </tr>)}
        </Table>
        {isLoggedIn && (<ButtonContainer><Button onClick={() => setShowPriceForm(true)}>Preis melden / bestätigen</Button></ButtonContainer>)}
        {(shopData.bewertungen.auswahl || shopData.scores.kugel || shopData.scores.softeis || shopData.scores.eisbecher || shopData.attribute?.length > 0) ? (
          <>
            <h2>Durchschnittliche Bewertung</h2>
            <Table>
              {shopData.scores.kugel !== null && (
                <tr>
                  <th>Kugeleis:</th>
                  <td>
                    <Rating stars={shopData.scores.kugel} />{" "}
                    <strong>{shopData.scores.kugel}</strong>
                  </td>
                </tr>)}
              {shopData.scores.softeis !== null && (
                <tr>
                  <th>Softeis:</th>
                  <td>
                    <Rating stars={shopData.scores.softeis} />{" "}
                    <strong>{shopData.scores.softeis}</strong>
                  </td>
                </tr>)}
              {shopData.scores.eisbecher !== null && (
                <tr>
                  <th>Eisbecher:</th>
                  <td>
                    <Rating stars={shopData.scores.eisbecher} />{" "}
                    <strong>{shopData.scores.eisbecher}</strong>
                  </td>
                </tr>)}
              {shopData.bewertungen.auswahl !== null && (
                <tr>
                  <th>Auswahl:</th>
                  <td>
                    ~ <strong>{shopData.bewertungen.auswahl}</strong> Sorten
                  </td>
                </tr>)}
              {shopData.attribute?.length > 0 &&
                <tr>
                  <th>Attribute:</th>
                  <td>
                    <AttributeSection>
                      {shopData.attribute.map(attribute => (<AttributeBadge>{attribute.anzahl} x {attribute.name}</AttributeBadge>))}
                    </AttributeSection>
                  </td>
                </tr>}
            </Table>
          </>
        ) : (
          <>
            <h2>Bewertungen</h2>
            Es sind noch keine Bewertungen für die Eisdiele abgegeben wurden.<br /><br />
          </>
        )}
        {isLoggedIn && (<ButtonContainer><Button onClick={() => setShowCheckinForm(true)}>Eis-Besuch einchecken</Button></ButtonContainer>)}
        {isLoggedIn && (<ButtonContainer><Button onClick={() => setShowReviewForm(true)}>Eisdiele bewerten</Button></ButtonContainer>)}
        <h2>Komoot Routen</h2>
        {routes.length < 1 && (<>Es sind noch keine öffentlichen Routen für die Eisdiele vorhanden.</>)}
        {isLoggedIn && (<ButtonContainer><Button onClick={() => setShowRouteForm(true)}>Neue Route einreichen</Button></ButtonContainer>)}
        {routes.map((route, index) => (
          <RouteCard key={index} route={route} shopId={shopData.eisdiele.id} shopName={shopData.eisdiele.name} onSuccess={refreshRoutes} />
        ))}
      </div>
    );
  } else if (activeTab === 'checkins') {
    return (
      <div>
        <h2>CheckIns</h2>
        {shopData.checkins.length <= 0 && (<>Es wurden noch Eis-Besuche eingecheckt.</>)}
        {isLoggedIn && (<ButtonContainer><Button onClick={() => setShowCheckinForm(true)}>Eis geschleckert</Button></ButtonContainer>)}
        {shopData.checkins && (shopData.checkins.map((checkin, index) => (
          <div
            key={checkin.id}
            ref={(el) => checkinRefs.current[checkin.id] = el}
          >
            <CheckinCard
              key={checkin.id}
              checkin={checkin}
              onSuccess={refreshShop}
              showComments={checkin.id.toString() === focusCheckinId?.toString()}
            />
          </div>
        )))}
      </div>);
  } else if (activeTab === 'reviews') {
    return (<div>
      <h2>Bewertungen</h2>
      {shopData.reviews.length <= 0 && (<>Es wurden noch keine Reviews abgegeben.</>)}
      {isLoggedIn && (<ButtonContainer><Button onClick={() => setShowReviewForm(true)}>Eisdiele bewerten</Button></ButtonContainer>)}
      {shopData.reviews && (shopData.reviews.map((review, index) => (
        <ReviewCard key={index} review={review} setShowReviewForm={setShowReviewForm} />
      )))}
    </div>);
  }

  return null;

}
export default ShopDetailsView;

const AnimatedContainer = styled(animated.div)`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
  border-radius: 12px 12px 0 0;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow: hidden;
`;

const Container = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isfullheight',
})`
  overscroll-behavior: none;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: ${({ isfullheight }) => (isfullheight ? '100%' : '50%')};
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
  border-radius: 12px 12px 0 0;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  transition: height 0.3s ease;

  @media (min-width: 768px) {
    width: 30%;
    height: 100%;
    top: 0;
    bottom: auto;
    left: 0;
    right: auto;
    border-radius: 0;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0rem 1rem;
  background: #ffb522;
  color: black;
  font-weight: bold;
  border-bottom: 1px solid #ddd;

  @media (min-width: 768px) {
    padding: 1rem;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
`;

const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid #ddd;
`;

const Tab = styled.button`
  flex: 1;
  padding: 0.5rem;
  background: ${({ active }) => (active ? '#ffb522' : 'white')};
  border: none;
  border-bottom: ${({ active }) => (active ? '2px solid black' : 'none')};
  cursor: pointer;
  font-weight: bold;
`;

const Content = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
`;

const Table = styled.table`
  border-spacing: 0.5rem 0.25rem;
  margin-top: 1rem;
  margin-bottom: 1rem;

  th {
    text-align: left;
    vertical-align: top;
    white-space: nowrap;
    color: #555;
    font-weight: normal;
    padding-right: 0.5rem;
  }

  td {
    vertical-align: top;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1rem;
  margin-bottom: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: #ffb522;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
`;

const AttributeSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const AttributeBadge = styled.span`
  background-color: #e0f3ff;
  color: #0077b6;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const IceShopHeader = styled.h2`
  margin-top: 2rem;
`
