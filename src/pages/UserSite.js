import Header from './../Header';
import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { useUser } from "../context/UserContext";
import CheckinCard from "../components/CheckinCard";
import ReviewCard from "../components/ReviewCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import RouteCard from '../components/RouteCard';
import LevelDisplay from '../components/LevelDisplay';

function UserSite() {
  const { userId: userIdFromUrl } = useParams();
  const { userId: userIdFromContext } = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const finalUserId = userIdFromUrl || userIdFromContext;
  const apiUrl = process.env.REACT_APP_API_BASE_URL;

  // Add state to manage pagination for check-ins and reviews
  const [checkinPage, setCheckinPage] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);
  const [awardPage, setAwardPage] = useState(1);
  const [routePage, setRoutePage] = useState(1);


  const loadMoreCheckins = () => {
    setCheckinPage((prevPage) => prevPage + 1);
  };

  const loadMoreReviews = () => {
    setReviewPage((prevPage) => prevPage + 1);
  };

  const loadMoreAwards = () => {
    setAwardPage((prevPage) => prevPage + 1);
  };

  const loadMoreRoutes = () => {
    setRoutePage((prevPage) => prevPage + 1);
  };


  // Add tabs for displaying check-ins and reviews
  const [activeTab, setActiveTab] = useState('checkins');

  const fetchUserData = async (finalUserId) => {
    try {
      const response = await fetch(`${apiUrl}/get_user_stats.php?nutzer_id=${finalUserId}&cur_user_id=${userIdFromContext}`);
      if (!response.ok) {
        throw new Error("Fehler beim Abruf der Daten");
      }
      const json = await response.json();
      setData(json);
      setLoading(false);
    } catch (err) {
      console.error("Fehler beim Laden der Dashboard-Daten:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!finalUserId) return;

    fetchUserData(finalUserId);
  }, [finalUserId]);

  const refreshUser = () => {
    fetchUserData(finalUserId);
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#ffb522' }}>
      <Header />
      <div style={{ width: '100vw', backgroundColor: 'white', height: '100vh' }}>
        <DashboardWrapper>
          <HeaderDiv>
            <h1>Nutzerseite</h1>
            <p>Lade Dashboard Daten...</p>
          </HeaderDiv>
        </DashboardWrapper>
      </div >
    </div >
  );
  if (error !== null) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#ffb522' }}>
      <Header />
      <div style={{ width: '100vw', backgroundColor: 'white' }}>
        <DashboardWrapper>
          <HeaderDiv>
            <h1>Nutzerseite</h1>
            <p>Fehler beim Abruf der Daten</p>
          </HeaderDiv>
        </DashboardWrapper>
      </div >
    </div >
  );

  // Filter check-ins and reviews based on the current page
  const displayedCheckins = data.checkins.slice(0, checkinPage * 5);
  const displayedReviews = data.reviews.slice(0, reviewPage * 5);
  const displayedAwards = data.user_awards.slice(0, awardPage * 4);
  const displayedRoutes = data.routen.slice(0, routePage * 5);

  const totalIcePortions = (data.eisarten.Kugel || 0) + (data.eisarten.Softeis || 0) + (data.eisarten.Eisbecher || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#ffb522' }}>
      <Header />
      <div style={{ width: '100vw', backgroundColor: 'white' }}>
        <DashboardWrapper>
          <HeaderDiv>
            <h1>Nutzerseite von {data.nutzername}</h1>
            <p>Mitglied seit: {new Date(data.erstellungsdatum).toLocaleDateString()}</p>
            <p>Einladungslink: <a href="https://ice-app.de/#/register/{data.invite_code}">https://ice-app.de/#/register/{data.invite_code}</a></p>
            <LevelDisplay levelInfo={data.level_info} />
          </HeaderDiv>

          <IceCreamStatsWrapper>
            <IceCreamSection>
              <h3>Eisarten gegessen</h3>
              <List>
                <li>Kugeleis: {data.eisarten.Kugel ? data.eisarten.Kugel : '0'}</li>
                <li>Softeis: {data.eisarten.Softeis ? data.eisarten.Softeis : '0'}</li>
                <li>Eisbecher: {data.eisarten.Eisbecher ? data.eisarten.Eisbecher : '0'}</li>
              </List>
            </IceCreamSection>
            <IceCreamSection>
              <h3>Top 5 Geschmacksrichtungen</h3>
              <List>
                {data.top_5_geschmacksrichtung.map((sorte, i) => (
                  <li key={i}>{sorte.sortenname} ({sorte.anzahl}x)</li>
                ))}
              </List>
            </IceCreamSection>
          </IceCreamStatsWrapper>

          <StatsSection>
            <StatBox>
              <h2>{data.eisdielen_besucht}</h2>
              <p>verschiedene Eisdielen besucht</p>
            </StatBox>
            <StatBox>
              <h2>{data.anzahl_checkins}</h2>
              <p>Check-ins</p>
            </StatBox>
            <StatBox>
              <h2>{totalIcePortions}</h2>
              <p>Portionen Eis gegessen</p>
            </StatBox>
          </StatsSection>

          <h3>Awards</h3>
          <AwardsGrid>
            {displayedAwards.map((award, index) => (
              <AwardCard key={index}>
                <EPBadge>{award.ep} EP ✨</EPBadge>
                <AwardImage src={`https://ice-app.de/${award.icon_path}`} alt={award.title_de} />
                <AwardTitle>{award.title_de}</AwardTitle>
                <AwardDescription>{award.description_de}</AwardDescription>
                <AwardDate>Vergeben am {new Date(award.awarded_at).toLocaleDateString()}</AwardDate>
              </AwardCard>
            ))}
            {displayedAwards.length < data.user_awards.length && (
              <LoadMoreButton onClick={loadMoreAwards}>Mehr Awards laden</LoadMoreButton>
            )}
          </AwardsGrid>

          <Section>
            <h3>Verschiedene Eisdielen pro Landkreise</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.eisdielen_pro_landkreis} layout="vertical" margin={{ left: 50 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="landkreis" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="anzahl" fill="#4bc0c0" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section>
            <h3>Neuste Beiträge von {data.nutzername}</h3>
            <TabContainer>
              <TabButton
                active={activeTab === 'checkins'}
                onClick={() => setActiveTab('checkins')}
              >
                Check-ins
              </TabButton>
              <TabButton
                active={activeTab === 'reviews'}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews
              </TabButton>
              {displayedRoutes.length > 0 && (
                <TabButton
                  active={activeTab === 'routen'}
                  onClick={() => setActiveTab('routen')}
                >
                  Routen
                </TabButton>
              )}
            </TabContainer>
          </Section>

          <TabContent>
            {activeTab === 'checkins' && (
              <div>
                {displayedCheckins.map((checkin, index) => (
                  <CheckinCard key={index} checkin={checkin} onSuccess={refreshUser} />
                ))}
                {displayedCheckins.length < data.checkins.length && (
                  <LoadMoreButton onClick={loadMoreCheckins}>Mehr Checkins laden</LoadMoreButton>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {displayedReviews.map((review, index) => (
                  <ReviewCard key={index} review={review} />
                ))}
                {displayedReviews.length < data.reviews.length && (
                  <LoadMoreButton onClick={loadMoreReviews}>Mehr Reviews laden</LoadMoreButton>
                )}
              </div>
            )}
            {activeTab === 'routen' && (
              <div>
                {displayedRoutes.map((route, index) => (
                  <RouteCard key={index} route={route} shopId={route.eisdiele_id} shopName={route.eisdiele_name} onSuccess={refreshUser}  />
                ))}
                {displayedReviews.length < data.reviews.length && (
                  <LoadMoreButton onClick={loadMoreRoutes}>Mehr Routen laden</LoadMoreButton>
                )}
              </div>
            )}
          </TabContent>
        </DashboardWrapper>
      </div>
    </div >
  );
}

export default UserSite;

const DashboardWrapper = styled.div`
  width: 90%;
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
  height: 100%;
`;

const HeaderDiv = styled.div`
  margin-bottom: 2rem;
  h1 {
    font-size: 2rem;
    margin-bottom: 0.25rem;
  }
`;

const StatsSection = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  justify-content: center;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const StatBox = styled.div`
  flex: 1;
  background: #f0f8ff;
  padding: 1rem;
  border-radius: 12px;
  text-align: center;
  min-width: 150px;

  h2 {
    margin: 0;
    font-size: 2rem;
    color: #0077b6;
  }

  p {
    margin: 0.5rem 0 0;
    color: #555;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const Section = styled.section`
  margin-top: 2rem;
`;

const List = styled.ul`
  padding-left: 1.25rem;
  li {
    margin-bottom: 0.25rem;
  }
`;

const AwardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
`;

const AwardCard = styled.div`
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 16px;
  text-align: center;
  position: relative;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const AwardImage = styled.img`
  height: 200px;

  @media (max-width: 768px) {
    height: 100px;
  }
`;

const AwardTitle = styled.h3`
  font-weight: 600;
`;

const AwardDescription = styled.p`
  font-size: 0.875rem;
  color: #666;
  margin-top: 4px;
`;

const AwardDate = styled.span`
  font-size: 0.75rem;
  color: #999;
  margin-top: 8px;
`;

const EPBadge = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  background: linear-gradient(135deg, #FFD700, #FFC107);
  color: #fff;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  z-index: 1;
  animation: popIn 0.4s ease-out;

  @keyframes popIn {
    0% { transform: scale(0.8); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
`;

const IceCreamStatsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  margin-top: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const IceCreamSection = styled.div`
  flex: 1;
  min-width: 200px;
`;

// Style the load more buttons
const LoadMoreButton = styled.button`
  display: block;
  margin: 1rem auto;
  padding: 0.5rem 1rem;
  background-color: #0077b6;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #005f8a;
  }
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`;

const TabButton = styled.button`
  padding: 0.5rem 1rem;
  margin: 0 0.5rem;
  background-color: ${(props) => (props.active ? '#0077b6' : '#f0f0f0')};
  color: ${(props) => (props.active ? 'white' : '#333')};
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;

  &:hover {
    background-color: ${(props) => (props.active ? '#005f8a' : '#e0e0e0')};
  }
`;

const TabContent = styled.div`
  margin-top: 1rem;
`;