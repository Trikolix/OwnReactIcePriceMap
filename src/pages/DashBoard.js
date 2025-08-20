import Header from './../Header';
import React, { useState, useEffect, useCallback } from 'react';
import styled from "styled-components";
import ReviewCard from "./../components/ReviewCard";
import CheckinCard from './../components/CheckinCard';
import RouteCard from './../components/RouteCard';
import ShopCard from './../components/ShopCard';

function DashBoard() {
  const [activities, setActivities] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const days = 7;
  const minimum = 20;
  const apiUrl = process.env.REACT_APP_API_BASE_URL;

  const fetchActivities = async (append = false, customOffset = null) => {
    append ? setLoadingMore(true) : setLoadingInitial(true);
    try {
      const usedOffset = customOffset !== null ? customOffset : offset;

      const res = await fetch(
        `${apiUrl}/activity_feed.php?days=${days}&minimum=${minimum}&offset=${usedOffset}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      console.log("API Antwort:", json);

      const newActivities = json.activities || [];
      const meta = json.meta || {};

      if (newActivities.length === 0) {
        setHasMore(false);
      } else {
        setActivities((prev) =>
          append ? [...prev, ...newActivities] : newActivities
        );
        setOffset(meta.nextOffset ?? (usedOffset + newActivities.length));
        setHasMore(meta.hasMore ?? false);
      }
    } catch (err) {
      console.error("Fehler beim Laden der Dashboard-Daten:", err);
      setError(err);
    } finally {
      append ? setLoadingMore(false) : setLoadingInitial(false);
    }
  };


  // Initial laden
  useEffect(() => {
    fetchActivities(false, 0);
  }, []);


  const reload = () => {
    setOffset(0);
    setHasMore(true);
    fetchActivities(false, 0);
  };

  return (
    <Page>
      <Header />
      <Title>Aktivitäten</Title>

      <Container>
        {/* Initial-Loader: nur Platzhalter innerhalb des Containers */}
        {loadingInitial && activities.length === 0 && (
          <Placeholder>Lade Dashboard Daten...</Placeholder>
        )}

        {/* Fehleranzeige (nicht die Seite ersetzen) */}
        {error && activities.length === 0 && (
          <Placeholder>Fehler beim Abruf der Daten</Placeholder>
        )}

        <Section>
          {activities.map((activity) => {
            const { typ, id, data } = activity;

            switch (typ) {
              case 'checkin':
                return <CheckinCard key={`checkin-${id}`} checkin={data} onSuccess={reload} />;
              case 'bewertung':
                return <ReviewCard key={`bewertung-${id}`} review={data} />;
              case 'route':
                return <RouteCard key={`route-${id}`} route={data} onSuccess={reload} />;
              case 'eisdiele':
                return <ShopCard key={`eisdiele-${id}`} iceShop={data} onSuccess={reload} />;
              default:
                return null;
            }
          })}

          {/* Controls & Loader am Listenende – DOM bleibt bestehen */}
          <Controls>
            {hasMore && !loadingMore && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  fetchActivities(true, offset);
                }}
              >
                Mehr laden
              </button>

            )}
            {loadingMore && <p>Lade weitere Aktivitäten…</p>}
            {error && activities.length > 0 && (
              <p style={{ color: "red" }}>Fehler: {error.message}</p>
            )}
          </Controls>
        </Section>
      </Container>
    </Page>
  );
}

export default DashBoard;

/* ===== Styles ===== */
const Page = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;     /* nicht height: 100vh -> verhindert hartes Clipping */
  background-color: #ffb522;
`;

const Container = styled.div`
  padding: 1rem;
  background-color: white;
  /* entferne height: 100% -> lässt die Seite natürlich wachsen, behält Scroll */
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: center;
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: bold;
  margin: 1rem 0;
  text-align: center;
`;

const Section = styled.div`
  flex: 1 1 300px;
  max-width: 900px;
  min-width: 300px;
`;

const Controls = styled.div`
  margin: 1rem 0 4rem;
`;

const Placeholder = styled.div`
  width: 100%;
  text-align: center;
  padding: 2rem 0;
`;
