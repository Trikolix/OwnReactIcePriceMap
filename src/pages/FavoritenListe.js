import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Header from "../Header";
import { useUser } from "../context/UserContext";
import { Link } from "react-router-dom";
import { formatOpeningHoursLines, hydrateOpeningHours } from "../utils/openingHours";

function FavoritenListe() {
  const [favoriten, setFavoriten] = useState([]);
  const { userId, isLoggedIn } = useUser();
  const apiUrl = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    if (!isLoggedIn) return;

    fetch(`${apiUrl}/favoriten_liste.php?nutzer_id=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setFavoriten(data);
        console.log(data);
      })
      .catch((err) => {
        console.error("Fehler beim Laden der Favoriten:", err);
      });
  }, [userId, isLoggedIn, apiUrl]);

  if (!isLoggedIn) {
    return;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#ffb522' }}>
      <Header />
      <Container>
        <Title>Deine Lieblings-Eisdielen 🍦</Title>
        {!isLoggedIn ? (
          <p>Bitte melde dich an, um deine Favoriten zu sehen.</p>
        ) : (
          favoriten.length === 0 ? (
            <Message>Du hast noch keine Favoriten gespeichert.</Message>
          ) : (
            <List>
              {favoriten.map((eisdiele) => (
                <ListItem key={eisdiele.id}>
                  <ShopName><CleanLink to={`/map/activeShop/${eisdiele.id}`}>{eisdiele.name}</CleanLink></ShopName>
                  <Paragraph><strong>Adresse:</strong> {eisdiele.adresse}</Paragraph>
                  <Paragraph>
                    <strong>Öffnungszeiten:</strong>{" "}
                    {typeof eisdiele.is_open_now === 'boolean' && (
                      <OpenBadge $open={eisdiele.is_open_now}>
                        {eisdiele.is_open_now ? 'Jetzt geöffnet' : 'Geschlossen'}
                      </OpenBadge>
                    )}
                    <br />
                    {(() => {
                      const structured = hydrateOpeningHours(eisdiele.openingHoursStructured, eisdiele.opening_hours_note || "");
                      let lines = formatOpeningHoursLines(structured);
                      if (!lines.length && eisdiele.openingHours) {
                        lines = eisdiele.openingHours.split(";").map((part) => part.trim());
                      }
                      return lines.length ? lines.map((part, index) => <div key={index}>{part}</div>) : <div>Keine Angaben</div>;
                    })()}
                  </Paragraph>
                  <Paragraph>Am {new Date(eisdiele.favorit_seit).toLocaleString()} zu den Favoriten hinzugefügt.</Paragraph>
                </ListItem>
              ))}
            </List>
          )
        )}
      </Container>
    </div>
  );
}

export default FavoritenListe;

const CleanLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`;

const Container = styled.div`
  padding: 1rem;
  background-color: white;
  height: 100vh;
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-align: center;
`;

const Message = styled.p`
  font-size: 1rem;
`;

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
`;

const ListItem = styled.li`
  padding: 1rem;
  border-radius: 1rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  background-color: white;
  width: 80vw;
  max-width: 600px;
`;

const ShopName = styled.h3`
  font-size: 1.125rem;
  font-weight: bold;
  margin-top: 0px;
  margin-bottom: 0.5rem;
`;

const Paragraph = styled.p`
  margin: 0.5rem 0 0;
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
