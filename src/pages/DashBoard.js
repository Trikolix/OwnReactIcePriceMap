import Header from './../Header';
import React, { useState, useEffect, useCallback } from 'react';
import styled from "styled-components";
import ReviewCard from "./../components/ReviewCard";
import CheckinCard from './../components/CheckinCard';
import GroupCheckinCard from './../components/GroupCheckinCard';
import RouteCard from './../components/RouteCard';
import ShopCard from './../components/ShopCard';
import AwardCard from './../components/AwardCard';
import AwardBundleCard from './../components/AwardBundleCard';

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

  // Hilfsfunktion: Gruppiert Activities nach group_id
  function groupActivities(activities) {
    const grouped = {};
    const singles = [];
    const awards = [];

    activities.forEach((a) => {
      if (a.typ === "checkin" && a.data.group_id) {
        const gid = a.data.group_id;
        if (!grouped[gid]) {
          grouped[gid] = [];
        }
        grouped[gid].push(a);
      } else if (a.typ === "award") {
        awards.push(a);
      } else {
        singles.push(a); // alles andere normal behalten
      }
    });

    // Awards innerhalb von 5min für denselben Nutzer (nach user_name) bündeln
    const awardBundles = [];
    const sortedAwards = awards.slice().sort((a, b) => {
      const da = new Date(a.data?.datum);
      const db = new Date(b.data?.datum);
      return da - db;
    });
    let bundle = [];
    for (let i = 0; i < sortedAwards.length; i++) {
      const curr = sortedAwards[i];
      const currUserId = curr.data?.nutzer_id;
      const currUserName = curr.data?.user_name;
      const currDate = new Date(curr.data?.datum);
      if (bundle.length === 0) {
        bundle.push(curr);
        continue;
      }
      const last = bundle[bundle.length - 1];
      const lastUserId = last.data?.nutzer_id;
      const lastUserName = last.data?.user_name;
      const lastDate = new Date(last.data?.datum);
      const diffMs = Math.abs(currDate - lastDate);
      if (currUserId === lastUserId && currUserName === lastUserName && diffMs <= 5 * 60 * 1000) {
        bundle.push(curr);
      } else {
        if (bundle.length > 1) {
          awardBundles.push({
            typ: "award_bundle",
            id: `awardbundle-${lastUserId}-${lastDate.getTime()}`,
            data: bundle.map((a) => a.data),
          });
        } else {
          awardBundles.push(bundle[0]);
        }
        bundle = [curr];
      }
    }
    // Letztes Bundle pushen
    if (bundle.length > 1) {
      const lastUserId = bundle[bundle.length - 1].data?.nutzer_id;
      const lastUserName = bundle[bundle.length - 1].data?.user_name;
      const lastDate = new Date(bundle[bundle.length - 1].data?.datum);
      awardBundles.push({
        typ: "award_bundle",
        id: `awardbundle-${lastUserId}-${lastDate.getTime()}`,
        data: bundle.map((a) => a.data),
      });
    } else if (bundle.length === 1) {
      awardBundles.push(bundle[0]);
    }

    const result = [
      ...singles,
      ...Object.keys(grouped).flatMap((gid) => {
        const items = grouped[gid];
        if (items.length === 1) {
          // nur ein Checkin -> wieder als normaler Checkin behandeln
          return items;
        } else {
          // mehrere -> Gruppierung
          return {
            typ: "group_checkin",
            id: `group-${gid}`,
            data: items.map((i) => i.data),
          };
        }
      }),
      ...awardBundles,
    ];

    function getItemDate(item) {
      if (item.typ === "group_checkin") {
        // bei Gruppe: Top-Level-Datum verwenden
        return item.data[0]?.datum;
      }
      if (item.typ === "award_bundle") {
        // Bundle: Datum des ersten Awards
        return item.data[0]?.datum;
      }
      if (item.typ === "checkin" || item.typ === "route" || item.typ === "award") {
        return item.data?.datum;
      }
      if (item.typ === "bewertung" || item.typ === "eisdiele") {
        return item.data?.erstellt_am;
      }
      return null;
    }

    // Sortierung nach Datum absteigend
    const sorted = result.sort((a, b) => {
      const da = new Date(getItemDate(a));
      const db = new Date(getItemDate(b));
      return db - da;
    });
    return sorted;
  }




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
          {groupActivities(activities).map((activity) => {
            const { typ, id, data } = activity;
            switch (typ) {
              case 'checkin':
                return <CheckinCard key={`checkin-${id}`} checkin={data} onSuccess={reload} />;
              case "group_checkin":
                return <GroupCheckinCard key={id} checkins={data} onSuccess={reload} />;
              case 'bewertung':
                return <ReviewCard key={`bewertung-${id}`} review={data} />;
              case 'route':
                return <RouteCard key={`route-${id}`} route={data} onSuccess={reload} />;
              case 'eisdiele':
                return <ShopCard key={`eisdiele-${id}`} iceShop={data} onSuccess={reload} />;
              case 'award':
                return <AwardCard key={`award-${id}`} award={data} />;
              case 'award_bundle':
                return <AwardBundleCard key={id} awards={data} userName={data[0]?.user_name} date={data[0]?.datum}/>;
              default:
                return null;
            }
          })}

          {/* Controls & Loader am Listenende – DOM bleibt bestehen */}
          <Controls>
            {hasMore && !loadingMore && (
              <LoadButton
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  fetchActivities(true, offset);
                }}
              >
                Mehr laden
              </LoadButton>

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
  text-align: center;
`;

const Placeholder = styled.div`
  width: 100%;
  text-align: center;
  padding: 2rem 0;
`;

const LoadButton = styled.button`
  align-self: flex-start;
  background-color: #ffb522;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #db9d20ff;
  }
`;
