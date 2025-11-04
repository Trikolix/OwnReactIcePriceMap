import Header from './../Header';
import React, { useState, useEffect } from 'react';
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

  const parseActivityDate = (rawValue) => {
    if (!rawValue) return null;
    if (rawValue instanceof Date) return rawValue;
    const value = typeof rawValue === "string"
      ? (rawValue.includes("T") ? rawValue : rawValue.replace(" ", "T"))
      : rawValue;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const extractActivityDate = (data) => {
    if (!data) return null;
    return parseActivityDate(data.datum || data.erstellt_am || data.created_at || null);
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
      const da = extractActivityDate(a.data);
      const db = extractActivityDate(b.data);

      if (!da && !db) return 0;
      if (!da) return -1;
      if (!db) return 1;
      return da - db;
    });
    let bundle = [];
    for (let i = 0; i < sortedAwards.length; i++) {
      const curr = sortedAwards[i];
      const currUserId = curr.data?.user_id ?? curr.data?.nutzer_id;
      const currUserName = curr.data?.user_name;
      const currDate = extractActivityDate(curr.data);
      if (bundle.length === 0) {
        bundle.push(curr);
        continue;
      }
      const last = bundle[bundle.length - 1];
      const lastUserId = last.data?.user_id ?? last.data?.nutzer_id;
      const lastUserName = last.data?.user_name;
      const lastDate = extractActivityDate(last.data);
      const diffMs = (currDate && lastDate) ? Math.abs(currDate - lastDate) : Number.POSITIVE_INFINITY;
      if (
        currUserId === lastUserId &&
        currUserName === lastUserName &&
        diffMs <= 5 * 60 * 1000
      ) {
        bundle.push(curr);
      } else {
        if (bundle.length > 1) {
          const bundleDate = extractActivityDate(bundle[bundle.length - 1].data);
          const bundleUserId = lastUserId ?? "unknown";
          const bundleDateKey = bundleDate ? bundleDate.getTime() : "unknown";
          awardBundles.push({
            typ: "award_bundle",
            id: `awardbundle-${bundleUserId}-${bundleDateKey}`,
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
      const lastData = bundle[bundle.length - 1].data;
      const bundleDate = extractActivityDate(lastData);
      const bundleUserId = lastData?.user_id ?? lastData?.nutzer_id ?? "unknown";
      const bundleDateKey = bundleDate ? bundleDate.getTime() : "unknown";
      awardBundles.push({
        typ: "award_bundle",
        id: `awardbundle-${bundleUserId}-${bundleDateKey}`,
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
      if (!item) return null;

      if (item.typ === "group_checkin") {
        // Bei Gruppen den neuesten Checkin in der Gruppe verwenden
        const latestCheckin = item.data?.reduce((latest, current) => {
          const currentDate = extractActivityDate(current);
          if (!currentDate) return latest;
          if (!latest) return current;
          const latestDate = extractActivityDate(latest);
          return (!latestDate || currentDate > latestDate) ? current : latest;
        }, null);
        return extractActivityDate(latestCheckin);
      }

      if (item.typ === "award_bundle") {
        const lastAward = Array.isArray(item.data) ? item.data[item.data.length - 1] : null;
        return extractActivityDate(lastAward);
      }

      return extractActivityDate(item.data);
    }

    // Sortierung nach Datum absteigend
    const sorted = result.sort((a, b) => {
      const da = getItemDate(a);
      const db = getItemDate(b);

      if (!db && !da) return 0;
      if (!db) return -1;
      if (!da) return 1;
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
              case 'award_bundle': {
                const firstAward = Array.isArray(data) ? data[0] : null;
                const latestAward = Array.isArray(data) ? data[data.length - 1] : null;
                return (
                  <AwardBundleCard
                    key={id}
                    awards={data}
                    userName={latestAward?.user_name || firstAward?.user_name}
                    date={latestAward?.datum || firstAward?.datum}
                  />
                );
              }
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
