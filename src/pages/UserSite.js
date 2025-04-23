import Header from './../Header';
import React, { useState, useEffect } from 'react';
import styled from "styled-components";
import { useUser } from "../context/UserContext";

function UserSite() {
    const { userId, isLoggedIn } = useUser();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isLoggedIn) return;

        fetch(`https://ice-app.4lima.de/backend/get_user_stats.php?nutzer_id=${userId}`)
            .then((res) => res.json())
            .then((json) => {
                console.log(json);
                setData(json);
                console.log(data);
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
            <Title>UserSite für Nutzer {userId}</Title>
            <Container>Lade Dashboard Daten...</Container>
        </div >
    );
    if (error !== null) return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#ffb522' }}>
            <Header />
            <Title>UserSite für Nutzer {userId}</Title>
            <Container>Fehler beim Abruf der Daten</Container>
        </div >
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#ffb522' }}>
            <Header />
            <Title>UserSite für Nutzer {userId}</Title>
            <Container>
                <Section>
                    <strong>{data.eisdielen_besucht}</strong> verschiedene Eisdielen besucht<br />
                    <strong>{data.anzahl_checkins}</strong> Check-In's getätigt<br />
                    {data.eisarten.map(([typ, count]) => (<>{typ}: <strong>{count}</strong><br /></>))}
                </Section>
            </Container>
        </div>
    )

}

export default UserSite;

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