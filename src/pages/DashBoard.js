import Header from './../Header';
import React, { useState, useEffect } from 'react';
import styled from "styled-components";
import ReviewCard from "./../components/ReviewCard";
import CheckinCard from './../components/CheckinCard';
import RouteCard from './../components/RouteCard';
import ShopCard from './../components/ShopCard';


function DashBoard() {

  const [activities, setActivities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiUrl = process.env.REACT_APP_API_BASE_URL;

  const fetchDashboard = async () => {
    fetch(`${apiUrl}/activity_feed.php`)
      .then((res) => res.json())
      .then((json) => {
        console.log(json);
        setActivities(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fehler beim Laden der Dashboard-Daten:", err);
        setError(err);
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchDashboard();
  }, []);


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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#ffb522' }}>
      <Header />
      <Title>Aktivitäten</Title>
      <Container>
        <Section>
          {activities.map((activity) => {
            const { typ, id, data } = activity;

            switch (typ) {
              case 'checkin':
                return <CheckinCard key={`checkin-${id}`} checkin={data} onSuccess={fetchDashboard}/>;
              case 'bewertung':
                return <ReviewCard key={`bewertung-${id}`} review={data} />;
              case 'route':
                return <RouteCard key={`route-${id}`} route={data} onSuccess={fetchDashboard}/>;
              case 'eisdiele':
                return <ShopCard key={`eisdiele-${id}`} iceShop={data} onSuccess={fetchDashboard}/>;
              default:
                return null;
            }
          })}
        </Section>
      </Container>
    </div>
  )
}

export default DashBoard;

const Container = styled.div`
  padding: 1rem;
  background-color: white;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: center;
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-align: center;
`;

const Section = styled.div`
  flex: 1 1 300px;
  max-width: 900px;
  min-width: 300px;
`;