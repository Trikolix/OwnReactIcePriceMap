import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Header from "../Header";
import { useUser } from "../context/UserContext";

function FavoritenListe() {
  const [favoriten, setFavoriten] = useState([]);
  const { userId, isLoggedIn } = useUser();

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
    return;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#ffb522' }}>
      <Header/>
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
                  <ShopName>{eisdiele.name}</ShopName>
                  <Address>{eisdiele.adresse}</Address>
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
`;

const ShopName = styled.h3`
  font-size: 1.125rem;
  font-weight: bold;
`;

const Address = styled.p`
  margin: 0.5rem 0 0;
`;