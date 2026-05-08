import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { MapContainer as LeafletMapContainer, Marker, Popup, TileLayer, ZoomControl, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/lib/assets/MarkerCluster.css";
import "react-leaflet-cluster/lib/assets/MarkerCluster.Default.css";
import { List, Map, MapPinned, RefreshCw, Wrench } from "lucide-react";
import Header from "../Header";
import Seo from "../components/Seo";
import { useUser } from "../context/UserContext";
import SubmitPriceModal from "../SubmitPriceModal";
import SubmitIceShopModal from "../SubmitIceShopModal";

const radiusOptions = [
  { value: 10000, label: "10 km" },
  { value: 25000, label: "25 km" },
  { value: 50000, label: "50 km" },
];

const taskFilterOptions = [
  { value: "all", label: "Alle Aufgaben" },
  { value: "price_stale", label: "Nur Preise" },
  { value: "opening_hours_missing", label: "Nur Öffnungszeiten" },
];

const mapMetrics = [
  { value: "freshness", label: "Datenaktualit\u00e4t" },
  { value: "price", label: "Letztes Preisupdate" },
  { value: "checkin", label: "Letzter Check-in" },
  { value: "tasks", label: "Pflegebedarf" },
  { value: "openingHours", label: "\u00d6ffnungszeiten" },
  { value: "completeness", label: "Datenvollst\u00e4ndigkeit" },
];

const freshnessSteps = [
  { max: 20, color: "#22c55e", label: "Aktuell" },
  { max: 40, color: "#84cc16", label: "Gut" },
  { max: 60, color: "#eab308", label: "Mittel" },
  { max: 80, color: "#f97316", label: "Alt" },
  { max: Infinity, color: "#dc2626", label: "Kritisch" },
];

const ageSteps = [
  { max: 30, color: "#22c55e", label: "\u2264 30 Tage" },
  { max: 90, color: "#84cc16", label: "\u2264 90 Tage" },
  { max: 180, color: "#eab308", label: "\u2264 180 Tage" },
  { max: 365, color: "#f97316", label: "\u2264 365 Tage" },
  { max: Infinity, color: "#dc2626", label: "> 365 Tage / nie" },
];

const metricLegends = {
  freshness: freshnessSteps,
  price: ageSteps,
  checkin: ageSteps,
  tasks: [
    { color: "#22c55e", label: "Keine Aufgabe" },
    { color: "#f97316", label: "Eine Aufgabe" },
    { color: "#dc2626", label: "Mehrere Aufgaben" },
  ],
  openingHours: [
    { color: "#22c55e", label: "Gepflegt" },
    { color: "#dc2626", label: "Fehlt" },
  ],
  completeness: [
    { color: "#22c55e", label: "Vollst\u00e4ndig" },
    { color: "#eab308", label: "Teilweise" },
    { color: "#dc2626", label: "L\u00fcckenhaft" },
  ],
};

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

const formatDate = (value) => {
  if (!value) {
    return "Nie";
  }
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatAge = (ageDays) => {
  if (ageDays == null) {
    return "Nie";
  }
  if (ageDays === 0) {
    return "Heute";
  }
  return `${ageDays} Tage`;
};

const getStepColor = (steps, value) => {
  const step = steps.find((entry) => value <= entry.max);
  return step?.color || "#dc2626";
};

const getMaintenanceColor = (shop, metric) => {
  if (metric === "price") {
    return shop.price_age_days == null ? "#dc2626" : getStepColor(ageSteps, shop.price_age_days);
  }
  if (metric === "checkin") {
    return shop.checkin_age_days == null ? "#dc2626" : getStepColor(ageSteps, shop.checkin_age_days);
  }
  if (metric === "tasks") {
    const taskCount = Array.isArray(shop.active_tasks) ? shop.active_tasks.length : 0;
    if (taskCount === 0) return "#22c55e";
    return taskCount === 1 ? "#f97316" : "#dc2626";
  }
  if (metric === "openingHours") {
    return shop.has_opening_hours ? "#22c55e" : "#dc2626";
  }
  if (metric === "completeness") {
    const score = Number(shop.completeness_score || 0);
    if (score >= 100) return "#22c55e";
    if (score >= 67) return "#eab308";
    return "#dc2626";
  }
  return getStepColor(freshnessSteps, Number(shop.staleness_score || 100));
};

const getMaintenanceSeverity = (shop, metric) => {
  if (metric === "price") return shop.price_age_days == null ? Infinity : shop.price_age_days;
  if (metric === "checkin") return shop.checkin_age_days == null ? Infinity : shop.checkin_age_days;
  if (metric === "tasks") return Array.isArray(shop.active_tasks) ? shop.active_tasks.length : 0;
  if (metric === "openingHours") return shop.has_opening_hours ? 0 : 1;
  if (metric === "completeness") return 100 - Number(shop.completeness_score || 0);
  return Number(shop.staleness_score || 100);
};

const createMaintenanceIcon = (color) => L.divIcon({
  className: "maintenance-marker-icon",
  html: `<span style="display:block;width:20px;height:20px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 8px 16px rgba(47,33,0,.28);"></span>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -13],
});

const createClusterIcon = (metric) => (cluster) => {
  const markers = cluster.getAllChildMarkers();
  const shops = markers.map((marker) => marker.options.shop).filter(Boolean);
  const worstShop = shops.reduce((worst, shop) => (
    !worst || getMaintenanceSeverity(shop, metric) > getMaintenanceSeverity(worst, metric) ? shop : worst
  ), null);
  const color = worstShop ? getMaintenanceColor(worstShop, metric) : "#dc2626";
  const count = cluster.getChildCount();
  const size = count >= 100 ? 48 : count >= 10 ? 42 : 36;

  return L.divIcon({
    className: "maintenance-cluster-icon",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;display:grid;place-items:center;background:${color};color:#fff;border:3px solid #fff;box-shadow:0 10px 20px rgba(47,33,0,.28);font-weight:800;">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const MaintenanceBoard = () => {
  const { userId, currentLevel, isLoggedIn, userPosition, setUserPosition } = useUser();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const isAdmin = Number(userId) === 1;
  const canAccessMaintenanceBoard = isAdmin || Number(currentLevel || 0) >= 15;
  const [activeView, setActiveView] = useState("list");
  const [activeMetric, setActiveMetric] = useState("freshness");
  const [taskFilter, setTaskFilter] = useState("all");
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
      () => { },
      { enableHighAccuracy: false, maximumAge: 60000 }
    );

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [location, setUserPosition]);

  const loadTasks = useCallback(async () => {
    if (!apiUrl || !isLoggedIn || !canAccessMaintenanceBoard || !location) {
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
  }, [apiUrl, canAccessMaintenanceBoard, isLoggedIn, location, radiusM]);

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

  const visibleTasks = useMemo(() => {
    if (taskFilter === "all") {
      return tasks;
    }
    return tasks.filter((task) => task.task_type === taskFilter);
  }, [tasks, taskFilter]);

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

        <ViewToolbar>
          <ViewSwitch aria-label="Pflegeboard Ansicht">
            <ViewButton type="button" $active={activeView === "list"} onClick={() => setActiveView("list")}>
              <List size={16} />
              Liste
            </ViewButton>
            <ViewButton type="button" $active={activeView === "map"} onClick={() => setActiveView("map")}>
              <Map size={16} />
              Karte
            </ViewButton>
          </ViewSwitch>

          {activeView === "list" ? (
            <ListControls>
              <ToolbarGroup>
                <label htmlFor="maintenance-radius">Umkreis</label>
                <RadiusSelect id="maintenance-radius" value={radiusM} onChange={(e) => setRadiusM(Number(e.target.value))}>
                  {radiusOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </RadiusSelect>
              </ToolbarGroup>
              <ToolbarGroup>
                <label htmlFor="maintenance-task-filter">Aufgaben</label>
                <RadiusSelect id="maintenance-task-filter" value={taskFilter} onChange={(e) => setTaskFilter(e.target.value)}>
                  {taskFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </RadiusSelect>
              </ToolbarGroup>
              <RefreshButton type="button" onClick={loadTasks} disabled={loading || loadingLocation || !location}>
                <RefreshCw size={16} />
                Aktualisieren
              </RefreshButton>
            </ListControls>
          ) : (
            <ToolbarGroup>
              <label htmlFor="maintenance-map-metric">Metrik</label>
              <RadiusSelect id="maintenance-map-metric" value={activeMetric} onChange={(e) => setActiveMetric(e.target.value)}>
                {mapMetrics.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </RadiusSelect>
            </ToolbarGroup>
          )}
        </ViewToolbar>

        {!isLoggedIn && (
          <StateCard>Bitte logge dich ein, um Pflegeaufgaben in deiner Nähe zu sehen.</StateCard>
        )}
        {isLoggedIn && !canAccessMaintenanceBoard && (
          <StateCard>Das Pflegeboard ist ab Level 15 freigeschaltet.</StateCard>
        )}
        {activeView === "list" && isLoggedIn && canAccessMaintenanceBoard && loadingLocation && (
          <StateCard>Standort wird ermittelt…</StateCard>
        )}
        {activeView === "list" && isLoggedIn && canAccessMaintenanceBoard && !loadingLocation && !location && (
          <StateCard>Für das Pflegeboard wird dein Standort benötigt.</StateCard>
        )}
        {error && <ErrorCard>{error}</ErrorCard>}

        {activeView === "list" && isLoggedIn && canAccessMaintenanceBoard && location && !loading && visibleTasks.length === 0 && (
          <StateCard>
            {tasks.length === 0
              ? "Im gewählten Umkreis gibt es aktuell keine offenen Pflegeaufgaben."
              : "Für den gewählten Filter gibt es aktuell keine offenen Pflegeaufgaben."}
          </StateCard>
        )}

        {activeView === "map" && isLoggedIn && canAccessMaintenanceBoard && isAdmin && (
          <MaintenanceMapView
            apiUrl={apiUrl}
            location={location}
            metric={activeMetric}
            onOpenPriceTask={handleOpenPriceTask}
            onOpenOpeningHoursTask={handleOpenOpeningHoursTask}
          />
        )}

        {activeView === "map" && isLoggedIn && canAccessMaintenanceBoard && !isAdmin && (
          <StateCard>Die Kartenansicht ist nur fuer Admins sichtbar.</StateCard>
        )}

        {activeView === "list" && canAccessMaintenanceBoard && (
          <TaskGrid>
            {visibleTasks.map((task) => (
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
        )}
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

const MaintenanceMapEvents = ({ onViewportChange }) => {
  const map = useMapEvents({
    moveend: () => onViewportChange(map),
    zoomend: () => onViewportChange(map),
  });

  useEffect(() => {
    onViewportChange(map);
  }, [map, onViewportChange]);

  return null;
};

const MaintenanceMapView = ({ apiUrl, location, metric, onOpenPriceTask, onOpenOpeningHoursTask }) => {
  const [viewport, setViewport] = useState(null);
  const [shops, setShops] = useState([]);
  const [loadingMap, setLoadingMap] = useState(false);
  const [mapError, setMapError] = useState(null);
  const legend = metricLegends[metric] || metricLegends.freshness;

  const handleViewportChange = useCallback((map) => {
    const bounds = map.getBounds();
    setViewport({
      zoom: map.getZoom(),
      minLat: bounds.getSouth(),
      maxLat: bounds.getNorth(),
      minLon: bounds.getWest(),
      maxLon: bounds.getEast(),
    });
  }, []);

  useEffect(() => {
    if (!apiUrl || !viewport) {
      return undefined;
    }

    if (viewport.zoom < 6) {
      setShops([]);
      setLoadingMap(false);
      setMapError("Bitte weiter in die Karte hineinzoomen.");
      return undefined;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoadingMap(true);
      setMapError(null);
      try {
        const params = new URLSearchParams({
          min_lat: String(viewport.minLat),
          max_lat: String(viewport.maxLat),
          min_lon: String(viewport.minLon),
          max_lon: String(viewport.maxLon),
        });
        const response = await fetch(`${apiUrl}/api/maintenance_map_metrics.php?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok || data.status !== "success") {
          throw new Error(data.message || "Kartenmetriken konnten nicht geladen werden.");
        }
        setShops(Array.isArray(data.shops) ? data.shops : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setMapError(err.message || "Kartenmetriken konnten nicht geladen werden.");
          setShops([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingMap(false);
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [apiUrl, viewport]);

  const center = location ? [location.lat, location.lon] : [51.1634, 10.4477];
  const zoom = location ? 11 : 6;
  const clusterIcon = useMemo(() => createClusterIcon(metric), [metric]);

  return (
    <MapPanel>
      <LegendRow>
        {legend.map((entry) => (
          <LegendItem key={entry.label}>
            <LegendDot $color={entry.color} />
            {entry.label}
          </LegendItem>
        ))}
      </LegendRow>
      <MapShell>
        <LeafletMapContainer center={center} zoom={zoom} minZoom={4} zoomControl={false} style={{ height: "100%", width: "100%" }}>
          <ZoomControl position="topright" />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={19}
          />
          <MaintenanceMapEvents onViewportChange={handleViewportChange} />
          <MarkerClusterGroup key={metric} maxClusterRadius={32} iconCreateFunction={clusterIcon}>
            {shops.map((shop) => {
              if (shop.lat == null || shop.lon == null) {
                return null;
              }
              const activeTasks = Array.isArray(shop.active_tasks) ? shop.active_tasks : [];
              return (
                <Marker
                  key={shop.shop_id}
                  position={[shop.lat, shop.lon]}
                  icon={createMaintenanceIcon(getMaintenanceColor(shop, metric))}
                  shop={shop}
                >
                  <Popup>
                    <PopupContent>
                      <strong>{shop.name}</strong>
                      <span>{shop.address || "Keine Adresse"}</span>
                      <PopupMetric>Preisupdate: {formatDate(shop.latest_price_update)} ({formatAge(shop.price_age_days)})</PopupMetric>
                      <PopupMetric>Check-in: {formatDate(shop.latest_checkin_at)} ({formatAge(shop.checkin_age_days)})</PopupMetric>
                      <PopupMetric>Öffnungszeiten: {shop.has_opening_hours ? "gepflegt" : "fehlen"}</PopupMetric>
                      <PopupMetric>Pflegebedarf: {activeTasks.length ? activeTasks.map(formatTaskType).join(", ") : "keiner"}</PopupMetric>
                      <PopupActions>
                        <PopupButton type="button" onClick={() => onOpenPriceTask({ shop_id: shop.shop_id })}>Preis pflegen</PopupButton>
                        <PopupButton type="button" onClick={() => onOpenOpeningHoursTask({ shop_id: shop.shop_id })}>Öffnungszeiten</PopupButton>
                        <PopupLink to={`/map/activeShop/${shop.shop_id}`}>Zur Eisdiele</PopupLink>
                      </PopupActions>
                    </PopupContent>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        </LeafletMapContainer>
        {(loadingMap || mapError) && (
          <MapOverlay $error={Boolean(mapError)}>
            {loadingMap ? "Kartenmetriken werden geladen..." : mapError}
          </MapOverlay>
        )}
      </MapShell>
    </MapPanel>
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

const ViewToolbar = styled(Toolbar)`
  align-items: stretch;
`;

const ViewSwitch = styled.div`
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 14px;
  border: 1px solid rgba(47, 33, 0, 0.12);
  background: rgba(255, 255, 255, 0.84);
`;

const ViewButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 0;
  border-radius: 10px;
  padding: 0.55rem 0.75rem;
  background: ${({ $active }) => ($active ? "#2f2100" : "transparent")};
  color: ${({ $active }) => ($active ? "#fff" : "#4f3800")};
  font-weight: 800;
  cursor: pointer;
`;

const ListControls = styled.div`
  display: flex;
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

const MapPanel = styled.section`
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  gap: 0.75rem;
`;

const LegendRow = styled.div`
  display: flex;
  gap: 0.55rem 0.8rem;
  flex-wrap: wrap;
  align-items: center;
  padding: 0.75rem 0.85rem;
  border-radius: 16px;
  border: 1px solid rgba(47, 33, 0, 0.1);
  background: rgba(255, 255, 255, 0.88);
`;

const LegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: rgba(47, 33, 0, 0.76);
  font-size: 0.85rem;
  font-weight: 700;
`;

const LegendDot = styled.span`
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(47, 33, 0, 0.22);
`;

const MapShell = styled.div`
  position: relative;
  height: min(68vh, 720px);
  min-height: 440px;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(47, 33, 0, 0.12);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 16px 32px rgba(58, 39, 0, 0.09);

  .leaflet-container {
    height: 100%;
    width: 100%;
  }

  @media (max-width: 640px) {
    height: 66vh;
    min-height: 380px;
    border-radius: 14px;
  }
`;

const MapOverlay = styled.div`
  position: absolute;
  left: 50%;
  bottom: 1rem;
  z-index: 500;
  transform: translateX(-50%);
  max-width: calc(100% - 2rem);
  padding: 0.65rem 0.85rem;
  border-radius: 999px;
  background: ${({ $error }) => ($error ? "rgba(255, 239, 239, 0.96)" : "rgba(255, 255, 255, 0.96)")};
  color: ${({ $error }) => ($error ? "#9f1d1d" : "#4f3800")};
  box-shadow: 0 10px 24px rgba(47, 33, 0, 0.18);
  font-size: 0.9rem;
  font-weight: 800;
  text-align: center;
`;

const PopupContent = styled.div`
  min-width: 220px;
  display: grid;
  gap: 0.35rem;
  color: #2f2100;

  strong {
    font-size: 1rem;
  }

  span {
    color: rgba(47, 33, 0, 0.68);
  }
`;

const PopupMetric = styled.div`
  color: rgba(47, 33, 0, 0.78);
  font-size: 0.86rem;
`;

const PopupActions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
  margin-top: 0.35rem;
`;

const PopupButton = styled.button`
  border: 1px solid rgba(255, 181, 34, 0.55);
  border-radius: 10px;
  background: #ffcf62;
  color: #2f2100;
  padding: 0.5rem 0.55rem;
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;
`;

const PopupLink = styled(Link)`
  grid-column: 1 / -1;
  border-radius: 10px;
  border: 1px solid rgba(47, 33, 0, 0.12);
  background: rgba(255, 255, 255, 0.94);
  color: #4f3800;
  padding: 0.5rem 0.55rem;
  text-align: center;
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 800;
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
