import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { MapPinned, RefreshCw, Wrench } from "lucide-react";
import Header from "../Header";
import Seo from "../components/Seo";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import SubmitPriceModal from "../SubmitPriceModal";
import SubmitIceShopModal from "../SubmitIceShopModal";

const radiusOptions = [
  { value: 10000, label: "10 km" },
  { value: 25000, label: "25 km" },
  { value: 50000, label: "50 km" },
];

const formatDistance = (distanceM) => {
  if (distanceM == null || Number.isNaN(Number(distanceM))) {
    return "Unbekannte Distanz";
  }
  if (distanceM < 1000) {
    return `${Math.round(distanceM)} m entfernt`;
  }
  return `${(distanceM / 1000).toFixed(1).replace(".", ",")} km entfernt`;
};

const formatTaskType = (taskType) => {
  return taskType === "opening_hours_missing" ? "Öffnungszeiten" : "Preise";
};

const MaintenanceBoard = () => {
  const { userId, isLoggedIn, userPosition, setUserPosition } = useUser();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [radiusM, setRadiusM] = useState(25000);
  const [location, setLocation] = useState(() => (
    Array.isArray(userPosition) && userPosition.length === 2
      ? { lat: Number(userPosition[0]), lon: Number(userPosition[1]) }
      : null
  ));
  const [loadingLocation, setLoadingLocation] = useState(!location);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeShopDetail, setActiveShopDetail] = useState(null);

  useEffect(() => {
    if (isLoggedIn && userId != 1) {
      navigate("/");
    }
  }, [isLoggedIn, userId, navigate]);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);

  useEffect(() => {
    if (location || !navigator.geolocation) {
      setLoadingLocation(false);
      return undefined;
    }

    let watchId;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setLocation(nextLocation);
        setUserPosition([nextLocation.lat, nextLocation.lon]);
        setLoadingLocation(false);
      },
      () => setLoadingLocation(false),
      { enableHighAccuracy: false, timeout: 5000 }
    );

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const nextLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setLocation(nextLocation);
        setUserPosition([nextLocation.lat, nextLocation.lon]);
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 60000 }
    );

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [location, setUserPosition]);

  const loadTasks = useCallback(async () => {
    if (!apiUrl || !isLoggedIn || !location) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${apiUrl}/api/maintenance_tasks.php?lat=${encodeURIComponent(location.lat)}&lon=${encodeURIComponent(location.lon)}&radius_m=${radiusM}`
      );
      const data = await response.json();
      if (data.status !== "success") {
        throw new Error(data.message || "Pflegeaufgaben konnten nicht geladen werden.");
      }
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    } catch (err) {
      setError(err.message || "Pflegeaufgaben konnten nicht geladen werden.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, isLoggedIn, location, radiusM]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const fetchShopDetail = useCallback(async (shopId) => {
    const response = await fetch(`${apiUrl}/get_eisdiele_details.php?eisdiele_id=${shopId}&nutzer_id=${userId || ""}`);
    const data = await response.json();
    if (!response.ok || data?.error) {
      throw new Error(data?.error || "Eisdielen-Details konnten nicht geladen werden.");
    }
    return data;
  }, [apiUrl, userId]);

  const handleOpenPriceTask = async (task) => {
    try {
      const detail = await fetchShopDetail(task.shop_id);
      setActiveShopDetail(detail);
      setShowPriceModal(true);
    } catch (err) {
      setError(err.message || "Preisformular konnte nicht geöffnet werden.");
    }
  };

  const handleOpenOpeningHoursTask = async (task) => {
    try {
      const detail = await fetchShopDetail(task.shop_id);
      setActiveShopDetail(detail);
      setShowShopModal(true);
    } catch (err) {
      setError(err.message || "Shop-Editor konnte nicht geöffnet werden.");
    }
  };

  const stats = useMemo(() => ({
    total: tasks.length,
    price: tasks.filter((task) => task.task_type === "price_stale").length,
    openingHours: tasks.filter((task) => task.task_type === "opening_hours_missing").length,
  }), [tasks]);

  return (
    <>
      <Seo
        title="Pflegeboard | Ice App"
        description="Pflegebedürftige Eisdielen in deiner Nähe finden und mit Preisen oder Öffnungszeiten aktuell halten."
        canonical="/pflege"
      />
      <Header />
      <Page>
        <HeroCard>
          <HeroCopy>
            <HeroEyebrow>Pflegeboard</HeroEyebrow>
            <h1>Hilf mit, die Karte aktuell zu halten</h1>
            <p>
              Hier findest du Eisdielen in deiner Nähe, bei denen Preise veraltet sind oder Öffnungszeiten fehlen.
              Für abgeschlossene Pflegeaufgaben gibt es Extra-EP.
            </p>
          </HeroCopy>
          <HeroStats>
            <StatCard>
              <strong>{stats.total}</strong>
              <span>Aufgaben</span>
            </StatCard>
            <StatCard>
              <strong>{stats.price}</strong>
              <span>Preise</span>
            </StatCard>
            <StatCard>
              <strong>{stats.openingHours}</strong>
              <span>Öffnungszeiten</span>
            </StatCard>
          </HeroStats>
        </HeroCard>

        <Toolbar>
          <ToolbarGroup>
            <label htmlFor="maintenance-radius">Umkreis</label>
            <RadiusSelect id="maintenance-radius" value={radiusM} onChange={(e) => setRadiusM(Number(e.target.value))}>
              {radiusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </RadiusSelect>
          </ToolbarGroup>
          <RefreshButton type="button" onClick={loadTasks} disabled={loading || loadingLocation || !location}>
            <RefreshCw size={16} />
            Aktualisieren
          </RefreshButton>
        </Toolbar>

        {!isLoggedIn && (
          <StateCard>Bitte logge dich ein, um Pflegeaufgaben in deiner Nähe zu sehen.</StateCard>
        )}
        {isLoggedIn && loadingLocation && (
          <StateCard>Standort wird ermittelt…</StateCard>
        )}
        {isLoggedIn && !loadingLocation && !location && (
          <StateCard>Für das Pflegeboard wird dein Standort benötigt.</StateCard>
        )}
        {error && <ErrorCard>{error}</ErrorCard>}

        {isLoggedIn && location && !loading && tasks.length === 0 && (
          <StateCard>Im gewählten Umkreis gibt es aktuell keine offenen Pflegeaufgaben.</StateCard>
        )}

        <TaskGrid>
          {tasks.map((task) => (
            <TaskCard key={task.id}>
              <TaskHeader>
                <TaskBadge>{formatTaskType(task.task_type)}</TaskBadge>
                <DistanceBadge>{formatDistance(task.distance_m)}</DistanceBadge>
              </TaskHeader>
              <TaskTitle>{task.shop.name}</TaskTitle>
              <TaskAddress>{task.shop.address || "Keine Adresse"}</TaskAddress>
              <TaskReason>{task.reason_text}</TaskReason>
              <TaskMetaRow>
                <TaskMeta><Wrench size={15} /> +{task.bonus_ep} EP</TaskMeta>
              </TaskMetaRow>
              <TaskActions>
                {task.task_type === "price_stale" ? (
                  <PrimaryAction type="button" onClick={() => handleOpenPriceTask(task)}>Preis pflegen</PrimaryAction>
                ) : (
                  <PrimaryAction type="button" onClick={() => handleOpenOpeningHoursTask(task)}>Öffnungszeiten pflegen</PrimaryAction>
                )}
                <SecondaryAction as={Link} to={`/map/activeShop/${task.shop_id}`}>
                  <MapPinned size={15} />
                  Zur Eisdiele
                </SecondaryAction>
              </TaskActions>
            </TaskCard>
          ))}
        </TaskGrid>
      </Page>

      {showPriceModal && activeShopDetail && (
        <SubmitPriceModal
          shop={activeShopDetail}
          userId={userId}
          showPriceForm={showPriceModal}
          setShowPriceForm={(value) => {
            setShowPriceModal(value);
            if (!value) {
              setActiveShopDetail(null);
              loadTasks();
            }
          }}
          onSuccess={loadTasks}
        />
      )}

      {showShopModal && activeShopDetail?.eisdiele && (
        <SubmitIceShopModal
          showForm={showShopModal}
          setShowForm={(value) => {
            setShowShopModal(value);
            if (!value) {
              setActiveShopDetail(null);
              loadTasks();
            }
          }}
          userId={userId}
          refreshShops={loadTasks}
          existingIceShop={activeShopDetail.eisdiele}
        />
      )}
    </>
  );
};

export default MaintenanceBoard;

const Page = styled.main`
  min-height: 100vh;
  padding: 1.25rem 1rem 3rem;
  background:
    radial-gradient(circle at top left, rgba(255, 214, 140, 0.38), transparent 32%),
    linear-gradient(180deg, #fffaf1 0%, #fff2da 100%);
`;

const HeroCard = styled.section`
  max-width: 1100px;
  margin: 0 auto 1rem;
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(260px, 0.8fr);
  gap: 1rem;
  padding: 1.2rem;
  border-radius: 22px;
  border: 1px solid rgba(47, 33, 0, 0.1);
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 16px 32px rgba(58, 39, 0, 0.09);

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const HeroCopy = styled.div`
  h1 {
    margin: 0 0 0.45rem;
    color: #2f2100;
    font-size: clamp(2rem, 4vw, 3rem);
    line-height: 1;
  }

  p {
    margin: 0;
    color: rgba(47, 33, 0, 0.72);
    font-size: 1rem;
    line-height: 1.55;
  }
`;

const HeroEyebrow = styled.div`
  margin-bottom: 0.45rem;
  color: #9a5a00;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const HeroStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.7rem;
  align-content: start;
`;

const StatCard = styled.div`
  display: grid;
  gap: 0.2rem;
  padding: 0.9rem;
  border-radius: 16px;
  background: linear-gradient(180deg, #fff7e9 0%, #ffe9bc 100%);
  border: 1px solid rgba(255, 181, 34, 0.32);

  strong {
    color: #7a4b00;
    font-size: 1.6rem;
  }

  span {
    color: rgba(47, 33, 0, 0.72);
    font-size: 0.88rem;
  }
`;

const Toolbar = styled.div`
  max-width: 1100px;
  margin: 0 auto 1rem;
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
`;

const ToolbarGroup = styled.div`
  display: flex;
  gap: 0.55rem;
  align-items: center;
  color: #4f3800;
  font-weight: 700;
`;

const RadiusSelect = styled.select`
  border-radius: 12px;
  border: 1px solid rgba(47, 33, 0, 0.18);
  padding: 0.6rem 0.75rem;
  background: rgba(255, 255, 255, 0.85);
`;

const RefreshButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border-radius: 12px;
  border: 1px solid rgba(47, 33, 0, 0.15);
  background: rgba(255, 255, 255, 0.9);
  color: #4f3800;
  padding: 0.65rem 0.9rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StateCard = styled.div`
  max-width: 1100px;
  margin: 0 auto 1rem;
  padding: 1rem;
  border-radius: 16px;
  border: 1px solid rgba(47, 33, 0, 0.1);
  background: rgba(255, 255, 255, 0.86);
  color: rgba(47, 33, 0, 0.75);
`;

const ErrorCard = styled(StateCard)`
  color: #9f1d1d;
  border-color: rgba(159, 29, 29, 0.18);
  background: rgba(255, 239, 239, 0.92);
`;

const TaskGrid = styled.section`
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
`;

const TaskCard = styled.article`
  display: grid;
  gap: 0.7rem;
  padding: 1rem;
  border-radius: 18px;
  border: 1px solid rgba(47, 33, 0, 0.1);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 28px rgba(58, 39, 0, 0.08);
`;

const TaskHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
  align-items: center;
  flex-wrap: wrap;
`;

const TaskBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
  background: #fff2d9;
  color: #9a5a00;
  font-size: 0.78rem;
  font-weight: 800;
`;

const DistanceBadge = styled(TaskBadge)`
  background: #ebf4ff;
  color: #2453c2;
`;

const TaskTitle = styled.h2`
  margin: 0;
  color: #2f2100;
  font-size: 1.2rem;
`;

const TaskAddress = styled.p`
  margin: 0;
  color: rgba(47, 33, 0, 0.72);
  font-size: 0.92rem;
`;

const TaskReason = styled.p`
  margin: 0;
  color: #5b4300;
  font-size: 0.95rem;
  line-height: 1.5;
`;

const TaskMetaRow = styled.div`
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
`;

const TaskMeta = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: rgba(47, 33, 0, 0.72);
  font-size: 0.84rem;
`;

const TaskActions = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.65rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const PrimaryAction = styled.button`
  border: 1px solid rgba(255, 181, 34, 0.55);
  border-radius: 12px;
  background: linear-gradient(180deg, #ffd36f 0%, #ffb522 100%);
  color: #2f2100;
  padding: 0.75rem 0.95rem;
  font-weight: 800;
  cursor: pointer;
`;

const SecondaryAction = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border-radius: 12px;
  border: 1px solid rgba(47, 33, 0, 0.12);
  background: rgba(255, 255, 255, 0.92);
  color: #4f3800;
  padding: 0.75rem 0.95rem;
  text-decoration: none;
  font-weight: 700;
`;
