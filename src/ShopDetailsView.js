import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import Rating from "./components/Rating";
import { useUser } from './context/UserContext';
import ReviewCard from './components/ReviewCard';
import CheckinCard from './components/CheckinCard';
import FavoritenButton from './components/FavoritButton';
import OpeningHours from './components/OpeningHours';

const ShopDetailsView = ({ shop, onClose, setShowPriceForm, setShowReviewForm, setShowCheckinForm, setIceCreamShops }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [isFullHeight, setIsFullHeight] = useState(false);
  const headerRef = useRef(null);
  const startYRef = useRef(0);
  const { isLoggedIn } = useUser();

  useEffect(() => {
    const handleTouchStart = (e) => {
      startYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const touchY = e.touches[0].clientY;
      const deltaY = touchY - startYRef.current;
      console.log('Touch move deltaY:', deltaY);

      if (deltaY < -50 && !isFullHeight) {
        console.log("setIsFulHeight -> true")
        setIsFullHeight(true);
      } else if (deltaY > 50 && isFullHeight) {
        setIsFullHeight(false);
      }
    };

    const container = headerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart);
      container.addEventListener('touchmove', handleTouchMove);
    }

    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [isFullHeight]);

  if (!shop) return null;

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

  console.log('ShopDetailsView', shop);
  return (
    <Container isFullHeight={isFullHeight}>
      <Header ref={headerRef}>
        <h2>{shop.eisdiele.name}</h2>
        <CloseButton onClick={onClose}>✖</CloseButton>
        <FavoritenButton
          eisdieleId={shop.eisdiele.id}
          setIceCreamShops={setIceCreamShops}
        />
      </Header>
      <Tabs>
        <Tab onClick={() => setActiveTab('info')} active={activeTab === 'info'}>Allgemein</Tab>
        <Tab onClick={() => setActiveTab('reviews')} active={activeTab === 'reviews'}>Bewertungen</Tab>
        <Tab onClick={() => setActiveTab('checkins')} active={activeTab === 'checkins'}>Check-ins</Tab>
      </Tabs>
      <Content>
        {activeTab === 'info' &&
          <div>
            <strong>Adresse:</strong> {shop.eisdiele.adresse}<br />
            <OpeningHours eisdiele={shop.eisdiele} />
            {shop.eisdiele.website !== "" && shop.eisdiele.website !== null && (<>
              <strong>Website:</strong> <a href={shop.eisdiele.website} target="_blank" rel="noopener noreferrer">{shop.eisdiele.website}</a><br />
            </>)}

            <h2>Preise</h2>
            {(shop.preise.kugel == null && shop.preise.softeis == null) && (<>Es sind noch keine Preise für die Eisdiele gemeldet. {isLoggedIn && <>Trage jetzt gerne Preise ein:</>} </>)}
            <Table>
              {shop.preise.kugel != null && (
                <tr>
                  <th>Kugelpreis:</th>
                  <td>
                    <strong>{shop.preise?.kugel?.preis?.toFixed(2) ? shop.preise.kugel.preis.toFixed(2) : "-"} € </strong>
                    {shop.preise?.kugel?.beschreibung ? (<>({shop.preise.kugel.beschreibung}) </>) : <></>}
                    <span style={{ fontSize: 'smaller', color: 'grey' }}>({calculateTimeDifference(shop.preise.kugel.letztes_update)} aktualisiert)</span>
                  </td>
                </tr>)}
              {shop.preise.softeis != null && (
                <tr>
                  <th>Softeispreis:</th>
                  <td>
                    <strong>{shop.preise?.softeis?.preis?.toFixed(2) ? shop.preise.softeis.preis.toFixed(2) : "-"} € </strong>
                    {shop.preise?.softeis?.beschreibung ? (<>({shop.preise.softeis.beschreibung}) </>) : <></>}
                    <span style={{ fontSize: 'smaller', color: 'grey' }}>({calculateTimeDifference(shop.preise.softeis.letztes_update)} aktualisiert)</span>
                  </td>
                </tr>)}
            </Table>
            {isLoggedIn && (<ButtonContainer><Button onClick={() => setShowPriceForm(true)}>Preis melden / bestätigen</Button></ButtonContainer>)}


            {shop.bewertungen && (shop.bewertungen.geschmack || shop.bewertungen.auswahl || shop.bewertungen.kugelgroesse) ? (<>
              <h2>Durchschnitt aus {(shop.reviews.length)} Bewertung(en)</h2>
              <Table>
                {shop.bewertungen.geschmack !== null && (<tr>
                  <th>Geschmack:</th>
                  <td>
                    <Rating stars={shop.bewertungen.geschmack} />{" "}
                    <strong>{shop.bewertungen.geschmack}</strong>
                  </td>
                </tr>)}
                {shop.bewertungen.waffel !== null && (<tr>
                  <th>Waffel:</th>
                  <td>
                    <Rating stars={shop.bewertungen.waffel} />{" "}
                    <strong>{shop.bewertungen.waffel}</strong>
                  </td>
                </tr>)}
                {shop.bewertungen.kugelgroesse !== null && (<tr>
                  <th>Größe:</th>
                  <td>
                    <Rating stars={shop.bewertungen.kugelgroesse} />{" "}
                    <strong>{shop.bewertungen.kugelgroesse}</strong>
                  </td>
                </tr>)}
                {shop.bewertungen.auswahl !== null && (<tr>
                  <th>Auswahl:</th>
                  <td>
                    ~ <strong>{shop.bewertungen.auswahl}</strong> Sorten
                  </td>
                </tr>)}
                {shop.attribute?.length > 0 &&
                  <tr>
                    <th>Attribute:</th>
                    <td>
                      <AttributeSection>
                        {shop.attribute.map(attribute => (<AttributeBadge>{attribute.anzahl} x {attribute.name}</AttributeBadge>))}
                      </AttributeSection>
                    </td>
                  </tr>}
              </Table>
            </>
            ) : (<><h2>Bewertungen</h2>Es sind noch keine Bewertungen für die Eisdiele abgegeben wurden.<br /><br /></>)}
            {isLoggedIn && (<ButtonContainer><Button onClick={() => setShowReviewForm(true)}>Eisdiele bewerten</Button></ButtonContainer>)}
            {isLoggedIn && shop.eisdiele.komoot !== "" && (<>
              <h2>Komoot</h2>
              <div dangerouslySetInnerHTML={{ __html: shop.eisdiele.komoot }} />
            </>)}
          </div>}
        {activeTab === 'reviews' &&
          <div>
            <h2>Bewertungen</h2>
            {shop.reviews.length <= 0 && (<>Es wurden noch keine Reviews abgegeben.</>)}
            {isLoggedIn && (<ButtonContainer><Button onClick={() => setShowReviewForm(true)}>Eisdiele bewerten</Button></ButtonContainer>)}
            {shop.reviews && (shop.reviews.map((review, index) => (
              <ReviewCard key={index} review={review} setShowReviewForm={setShowReviewForm} />
            )))}
          </div>}
        {activeTab === 'checkins' && <div>
          <h2>CheckIns</h2>
          {shop.checkins.length <= 0 && (<>Es wurden noch Eis-Besuche eingecheckt.</>)}
          {isLoggedIn && (<ButtonContainer><Button onClick={() => setShowCheckinForm(true)}>Eis geschleckert</Button></ButtonContainer>)}
          {shop.checkins && (shop.checkins.map((checkin, index) => (
            <CheckinCard key={index} checkin={checkin} />
          )))}
        </div>}
      </Content>
    </Container>
  );
};

export default ShopDetailsView;

const Container = styled.div`
  overscroll-behavior: none;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: ${({ isFullHeight }) => (isFullHeight ? '100%' : '50%')};
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