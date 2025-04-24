import Header from './../Header';
import React, { useState, useEffect } from 'react';
import styled from "styled-components";
import Rating from './../components/Rating';

function DashBoard() {
  const [data, setData] = useState({
    pricePerLandkreis: [],
    reviews: [],
    checkins: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    fetch("https://ice-app.4lima.de/backend/dashboard.php")
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
  }, []);


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

        <Section>
          <Title>Neueste Bewertungen</Title>
          {data.reviews.map((review) => (
            <Card key={review.id}>
              <strong>{review.nutzer_name}</strong> hat <strong>{review.eisdiele_name}</strong> bewertet. <em><small>(vom {new Date(review.erstellt_am).toLocaleDateString()})</small></em><br />
              {review.geschmack !== null && (<>Geschmack: <Rating stars={review.geschmack} /><strong>{review.geschmack}</strong><br /></>) }
              {review.kugelgroesse !== null && (<>Größe: <Rating stars={review.kugelgroesse} /><strong>{review.kugelgroesse}</strong><br /></>) }
              {review.waffel !== null && (<>Waffel: <Rating stars={review.waffel} /><strong>{review.waffel}</strong><br /></>) }
              {review.auswahl !== null && (<>Auswahl: ~<strong>{review.auswahl}</strong> Sorten<br /></>)}
              <p>{review.beschreibung}</p>
              <small>vergebene Attribute: {review.bewertung_attribute.join(", ")}</small>
            </Card>
          ))}
        </Section>

        <Section>
          <Title>Neueste Check-ins</Title>
          {data.checkins.map((checkin) => (
            <Card key={checkin.id}>
              <strong>{checkin.eisdiele_name}</strong> ({checkin.adresse})<br />
              Check-in von <em>{checkin.nutzer_name}</em> am {new Date(checkin.datum).toLocaleDateString()}<br />
              Typ: {checkin.typ}<br />
              Geschmack: <Rating stars={checkin.geschmackbewertung} /><strong>{checkin.geschmackbewertung}</strong><br />
              Waffel: <Rating stars={checkin.waffelbewertung} /><strong>{checkin.waffelbewertung}</strong><br />
              Größe: <Rating stars={checkin.größenbewertung} /><strong>{checkin.größenbewertung}</strong><br />
              <p>{checkin.kommentar}</p>
              <strong>Sorten:</strong>
              <List>
                {checkin.eissorten.map((sorte, index) => (
                  <li key={index}>{sorte}</li>
                ))}
              </List>
              {checkin.bild_url && <Image src={`https://ice-app.4lima.de/${checkin.bild_url}`} alt="Checkin Bild" />}
            </Card>
          ))}
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

const Card = styled.div`
  background: #f9f9f9;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const Image = styled.img`
  max-width: 300px;
  border-radius: 12px;
  margin-top: 1rem;
`;

const List = styled.ul`
  margin-top: 0.5rem;
  padding-left: 1.5rem;
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