import Header from './../Header';
import React, { useState, useEffect } from 'react';
import styled from "styled-components";
import ReviewCard from "./../components/ReviewCard";
import CheckinCard from './../components/CheckinCard';

function DashBoard() {
  const [data, setData] = useState({
    pricePerLandkreis: [],
    reviews: [],
    checkins: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiUrl = process.env.REACT_APP_API_BASE_URL;

  const fetchDashboard = async () => {
    fetch(`${apiUrl}/dashboard.php`)
      .then((res) => res.json())
      .then((json) => {
        console.log(json);
        setData(json);
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
  });


  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#ffb522' }}>
      <Header />
      <Title>Dashboard</Title>
      <Container>Lade Dashboard Daten...</Container>
    </div >
  );
  if (error !== null) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#ffb522' }}>
      <Header />
      <Title>Dashboard</Title>
      <Container>Fehler beim Abruf der Daten</Container>
    </div >
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#ffb522' }}>
      <Header />
      <Title>Dashboard</Title>
      <Container>
      <Section>
          <Title>Neueste Check-ins</Title>
          {data.checkins.map((checkin) => (
            <CheckinCard key={checkin.id} checkin={checkin} onSuccess={fetchDashboard}/>
            
          ))}
        </Section>

        <Section>
          <Title>Neueste Bewertungen</Title>
          {data.reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </Section>

        <Section>
          <Title>Durchschnittlicher Eispreis pro Landkreis</Title>
          <Table>
            <thead>
              <tr>
                <Th>Landkreis</Th>
                <Th>Anzahl Eisdielen</Th>
                <Th>Ø Kugelpreis (€)</Th>
              </tr>
            </thead>
            <tbody>
              {data.pricePerLandkreis.map((entry) => (
                <tr key={entry.landkreis_id}>
                  <Td>{entry.landkreis_name} (<em>{entry.bundesland_name}</em>)</Td>
                  <Td>{entry.anzahl_eisdielen}</Td>
                  <Td>{entry.durchschnittlicher_kugelpreis} €</Td>
                </tr>
              ))}
            </tbody>
          </Table>
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
  max-width: 100%;
  min-width: 300px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 0.75rem;
  background: #f0f0f0;
  border-bottom: 2px solid #ccc;
`;

const Td = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
`;