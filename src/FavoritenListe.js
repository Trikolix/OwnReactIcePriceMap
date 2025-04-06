import React, { useEffect, useState } from "react";
import styled from "styled-components";

function FavoritenListe({ userId, isLoggedIn, setZeigeFavoriten }) {
  const [favoriten, setFavoriten] = useState([]);

  useEffect(() => {
    if (!isLoggedIn) return;

    fetch(`https://ice-app.4lima.de/backend/favoriten_liste.php?nutzer_id=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setFavoriten(data);
      })
      .catch((err) => {
        console.error("Fehler beim Laden der Favoriten:", err);
      });
  }, [userId, isLoggedIn]);

  if (!isLoggedIn) {
    return <p>Bitte melde dich an, um deine Favoriten zu sehen.</p>;
  }

  return (
    <Container>
      <BackButton onClick={() => setZeigeFavoriten(false)}>← Zurück zur Karte</BackButton>
      <Title>Deine Lieblings-Eisdielen 🍦</Title>
      {favoriten.length === 0 ? (
        <Message>Du hast noch keine Favoriten gespeichert.</Message>
      ) : (
        <List>
          {favoriten.map((eisdiele) => (
            <ListItem key={eisdiele.id}>
              <ShopName>{eisdiele.name}</ShopName>
              <Address>{eisdiele.adresse}</Address>
            </ListItem>
          ))}
        </List>
      )}
    </Container>
  );
}

export default FavoritenListe;


const BackButton = styled.button`
  background-color: #e0e0e0;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color: #cfcfcf;
  }
`;

const Container = styled.div`
  padding: 1rem;
  background-color: white;
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
`;

const ListItem = styled.li`
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background-color: white;
`;

const ShopName = styled.h3`
  font-size: 1.125rem;
  font-weight: bold;
`;

const Address = styled.p`
  margin: 0.5rem 0 0;
`;