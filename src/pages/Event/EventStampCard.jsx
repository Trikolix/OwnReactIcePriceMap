import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { CheckCircle2, Compass, LoaderCircle, MapPin, QrCode, RefreshCw } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import CheckinForm from "../../CheckinForm";
import { useUser } from "../../context/UserContext";
import { getApiBaseUrl } from "../../shared/api/client";
import { EVENT_START_FINISH } from "./eventConfig";

const Page = styled.div`
  min-height: 100vh;
  background: var(--event-bg);
`;

const Container = styled.div`
  width: min(96%, 1120px);
  margin: 0 auto;
  padding: 1rem;
`;

const Card = styled.section`
  background: #fffdfa;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(255, 181, 34, 0.08);
  padding: 1rem;
  margin-bottom: 1rem;
`;

const Title = styled.h1`
  margin: 0 0 0.55rem;
  color: #2f2100;
  font-size: clamp(1.5rem, 2.2vw, 2rem);
`;

const Subtle = styled.p`
  margin: 0;
  line-height: 1.5;
  color: #7c4f00;
`;

const Grid = styled.div`
  display: grid;
  gap: 0.9rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  margin-top: 1rem;
`;

const StatCard = styled.div`
  border: 1px solid #f0d79a;
  border-radius: 12px;
  background: #fff7e5;
  padding: 0.85rem;
`;

const ModeSwitch = styled.div`
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
  margin-top: 0.85rem;
`;

const ModeButton = styled.button`
  border: 1px solid ${({ $active }) => ($active ? "#c97c00" : "#f0d79a")};
  background: ${({ $active }) => ($active ? "#ffddb0" : "#fffdfa")};
  color: #6a4200;
  border-radius: 999px;
  padding: 0.55rem 0.9rem;
  font-weight: 700;
  cursor: pointer;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  margin-top: 1rem;
`;

const ActionButton = styled.button`
  border: none;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: ${({ $secondary }) => ($secondary ? "#fff1cc" : "#ffb522")};
  color: ${({ $secondary }) => ($secondary ? "#7c4f00" : "#2f2100")};
  opacity: ${({ disabled }) => (disabled ? 0.55 : 1)};
`;

const MessageBox = styled.div`
  border-radius: 12px;
  padding: 0.85rem;
  margin-top: 1rem;
  background: ${({ $tone }) => ($tone === "error" ? "#fff1f2" : $tone === "success" ? "#f0fdf4" : "#fff7e5")};
  border: 1px solid ${({ $tone }) => ($tone === "error" ? "#fecdd3" : $tone === "success" ? "#86efac" : "#f0d79a")};
  color: ${({ $tone }) => ($tone === "error" ? "#9f1239" : $tone === "success" ? "#166534" : "#7c4f00")};
`;

const CheckpointGrid = styled.div`
  display: grid;
  gap: 0.9rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
`;

const CheckpointCard = styled.div`
  border-radius: 14px;
  border: 1px solid
    ${({ $status }) => ($status === "confirmed" ? "#86efac" : $status === "queued" ? "#facc15" : "#f0d79a")};
  background: ${({ $status }) => ($status === "confirmed" ? "#f0fdf4" : $status === "queued" ? "#fffbea" : "#fffdf7")};
  padding: 0.95rem;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  font-size: 0.82rem;
  font-weight: 700;
  background: ${({ $status }) => ($status === "confirmed" ? "#dcfce7" : $status === "queued" ? "#fef3c7" : "#fff3c2")};
  color: ${({ $status }) => ($status === "confirmed" ? "#166534" : $status === "queued" ? "#92400e" : "#8a5700")};
`;

const CardActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 0.9rem;
`;

const CardButton = styled.button`
  border: 1px solid ${({ $primary }) => ($primary ? "#ffb522" : "#f0d79a")};
  background: ${({ $primary }) => ($primary ? "#ffb522" : "#fff7e5")};
  color: #2f2100;
  border-radius: 10px;
  padding: 0.65rem 0.85rem;
  font-weight: 700;
  cursor: pointer;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2200;
  padding: 1rem;
`;

const Modal = styled.div`
  width: min(92vw, 720px);
  max-height: 88vh;
  overflow: auto;
  border-radius: 16px;
  background: #fffdfa;
  padding: 1rem;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.2);
`;

const CloseButton = styled.button`
  border: none;
  background: transparent;
  color: #6a4200;
  font-size: 1.5rem;
  cursor: pointer;
  float: right;
`;

const ScannerVideo = styled.video`
  width: 100%;
  border-radius: 12px;
  background: #111827;
  min-height: 240px;
  margin-top: 0.75rem;
`;

const TextInput = styled.input`
  width: 100%;
  border: 1px solid #e6d6ab;
  border-radius: 10px;
  padding: 0.8rem 0.9rem;
  margin-top: 0.75rem;
  font: inherit;
`;

const Small = styled.div`
  font-size: 0.9rem;
  color: #7c4f00;
  line-height: 1.45;
`;

const PENDING_KEY = "event2026_pending_stamp_actions_v1";

function modeLabel(mode) {
  return mode === "test" ? "Test-Stempelkarte" : "Event-Stempelkarte";
}

function readPendingActions() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PENDING_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writePendingActions(actions) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(actions));
}

function checkpointStatus(checkpoint, pendingMap) {
  if (checkpoint?.passed) return "confirmed";
  if (pendingMap.has(checkpoint.id)) return "queued";
  return "open";
}

function statusLabel(status) {
  if (status === "confirmed") return "Serverseitig bestätigt";
  if (status === "queued") return "Lokal vorgemerkt";
  return "Offen";
}

function haversineDistanceMeters(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function QrScannerModal({ checkpoint, onClose, onDetected }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [manualCode, setManualCode] = useState("");
  const [status, setStatus] = useState("initial");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let intervalId = null;

    const startScanner = async () => {
      if (typeof window === "undefined" || !("BarcodeDetector" in window) || !navigator.mediaDevices?.getUserMedia) {
        setStatus("manual");
        return;
      }

      try {
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        setStatus("camera");
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        intervalId = window.setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes?.[0]?.rawValue) {
              onDetected(codes[0].rawValue);
              onClose();
            }
          } catch (detectError) {
            setError(detectError.message || "QR-Code konnte nicht gelesen werden.");
          }
        }, 700);
      } catch (scannerError) {
        setStatus("manual");
        setError(scannerError.message || "Kamera konnte nicht geöffnet werden.");
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onClose, onDetected]);

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(event) => event.stopPropagation()}>
        <CloseButton type="button" onClick={onClose}>×</CloseButton>
        <h2 style={{ marginTop: 0 }}>QR-Code scannen</h2>
        <Subtle>
          {checkpoint?.name}: Falls GPS nicht verfügbar ist, kannst du hier den QR-Code des Checkpoints scannen.
        </Subtle>

        {status === "camera" && <ScannerVideo ref={videoRef} muted playsInline />}

        <Small style={{ marginTop: "0.85rem" }}>
          {status === "camera"
            ? "Halte den QR-Code in die Kamera. Wenn dein Browser das nicht unterstützt, kannst du den Code unten manuell eingeben."
            : "Kamera-Scan ist in diesem Browser nicht verfügbar oder wurde nicht freigegeben. Gib den QR-Code unten manuell ein."}
        </Small>

        {error && <MessageBox $tone="error">{error}</MessageBox>}

        <TextInput
          value={manualCode}
          onChange={(event) => setManualCode(event.target.value)}
          placeholder="QR-Code manuell eingeben"
        />
        <ActionRow>
          <ActionButton
            type="button"
            onClick={() => {
              if (!manualCode.trim()) return;
              onDetected(manualCode.trim());
              onClose();
            }}
          >
            QR-Code übernehmen
          </ActionButton>
          <ActionButton type="button" $secondary onClick={onClose}>
            Abbrechen
          </ActionButton>
        </ActionRow>
      </Modal>
    </Overlay>
  );
}

export default function EventStampCard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoggedIn, authToken, userId } = useUser();
  const apiBase = getApiBaseUrl();
  const mode = searchParams.get("mode") === "test" ? "test" : "live";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(null);
  const [pendingActions, setPendingActions] = useState(() => readPendingActions());
  const [locationState, setLocationState] = useState({
    coords: null,
    loading: false,
    error: "",
  });
  const [showScannerFor, setShowScannerFor] = useState(null);
  const [checkinTarget, setCheckinTarget] = useState(null);
  const [showCheckinForm, setShowCheckinForm] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const syncState = () => setPendingActions(readPendingActions());
    window.addEventListener("online", syncState);
    return () => window.removeEventListener("online", syncState);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !apiBase) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    fetch(`${apiBase}/event2026/stamp_card.php?mode=${mode}`, {
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    })
      .then(async (response) => {
        const json = await response.json();
        if (response.status === 403) {
          navigate("/event-me");
          return;
        }
        if (!response.ok || json.status !== "success") {
          throw new Error(json.message || "Stempelkarte konnte nicht geladen werden.");
        }
        if (!cancelled) {
          setData(json);
        }
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setError(fetchError.message || "Unbekannter Fehler");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiBase, authToken, isLoggedIn, mode, navigate]);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (!navigator.geolocation) {
      setLocationState((current) => ({ ...current, error: "Dein Browser unterstützt keine Standortfreigabe." }));
      return;
    }

    let watchId = null;
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocationState({
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          },
          loading: false,
          error: "",
        });
      },
      (geoError) => {
        setLocationState((current) => ({
          ...current,
          loading: false,
          error: geoError.message || "Standort konnte nicht ermittelt werden.",
        }));
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isLoggedIn]);

  const pendingMap = useMemo(() => {
    const relevant = pendingActions.filter((item) => item.mode === mode);
    return new Map(relevant.map((item) => [item.checkpoint_id, item]));
  }, [mode, pendingActions]);

  const checkpoints = data?.checkpoints || [];

  const checkpointsWithDistance = useMemo(() => {
    return checkpoints.map((checkpoint) => {
      const distanceMeters = locationState.coords
        ? haversineDistanceMeters(locationState.coords.lat, locationState.coords.lng, checkpoint.lat, checkpoint.lng)
        : null;
      return {
        ...checkpoint,
        distanceMeters,
        localStatus: checkpointStatus(checkpoint, pendingMap),
      };
    });
  }, [checkpoints, locationState.coords, pendingMap]);

  const openCheckin = (checkpoint) => {
    if (!checkpoint?.shop_id) {
      setMessage({ tone: "error", text: "Für diesen Checkpoint ist keine Eisdiele hinterlegt." });
      return;
    }
    setCheckinTarget({
      checkpointId: checkpoint.id,
      shopId: checkpoint.shop_id,
      shopName: checkpoint.shop_name || checkpoint.name,
    });
    setShowCheckinForm(true);
  };

  const updateCheckpointLocally = (checkpointId, nextValues) => {
    setData((current) => {
      if (!current) return current;
      const nextCheckpoints = (current.checkpoints || []).map((checkpoint) =>
        checkpoint.id === checkpointId ? { ...checkpoint, ...nextValues } : checkpoint
      );
      const mandatoryTotal = nextCheckpoints.filter((checkpoint) => Number(checkpoint.is_mandatory) === 1).length;
      const mandatoryPassed = nextCheckpoints.filter(
        (checkpoint) => Number(checkpoint.is_mandatory) === 1 && checkpoint.passed
      ).length;
      return {
        ...current,
        checkpoints: nextCheckpoints,
        progress: {
          mandatory_total: mandatoryTotal,
          mandatory_passed: mandatoryPassed,
          is_finisher: mandatoryTotal > 0 && mandatoryPassed >= mandatoryTotal,
        },
      };
    });
  };

  const storePendingAction = (action) => {
    const nextActions = [
      ...readPendingActions().filter((item) => !(item.checkpoint_id === action.checkpoint_id && item.mode === action.mode)),
      action,
    ];
    writePendingActions(nextActions);
    setPendingActions(nextActions);
    updateCheckpointLocally(action.checkpoint_id, {
      passed: false,
      pending_local: true,
    });
  };

  const removePendingAction = (checkpointId, targetMode) => {
    const nextActions = readPendingActions().filter((item) => !(item.checkpoint_id === checkpointId && item.mode === targetMode));
    writePendingActions(nextActions);
    setPendingActions(nextActions);
  };

  const submitStampAction = async (action, options = {}) => {
    const online = typeof navigator === "undefined" ? true : navigator.onLine;
    if (!online && !options.forceNetwork) {
      storePendingAction(action);
      setMessage({
        tone: "info",
        text: "Aktion lokal gespeichert. Sie wird synchronisiert, sobald wieder eine Verbindung besteht.",
      });
      return { queued: true };
    }

    try {
      const response = await fetch(`${apiBase}/event2026/stamp_pass.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(action),
      });
      const json = await response.json();
      if (!response.ok || json.status !== "success") {
        const shouldQueue = response.status >= 500 || response.status === 0;
        if (shouldQueue && !options.forceNetwork) {
          storePendingAction(action);
          setMessage({
            tone: "info",
            text: "Server gerade nicht erreichbar. Die Aktion wurde lokal vorgemerkt und wird später synchronisiert.",
          });
          return { queued: true };
        }
        throw new Error(json.message || "Stempel konnte nicht gespeichert werden.");
      }

      removePendingAction(action.checkpoint_id, action.mode);
      updateCheckpointLocally(action.checkpoint_id, {
        passed: true,
        passed_at: json.checkpoint?.passed_at || new Date().toISOString(),
        source: json.checkpoint?.source || action.source,
        checkin_id: action.checkin_id || null,
        pending_local: false,
      });
      setMessage({
        tone: "success",
        text: json.message || "Checkpoint erfolgreich abgestempelt.",
      });
      return { success: true, payload: json };
    } catch (submitError) {
      if (!options.forceNetwork && /Failed to fetch|NetworkError|Load failed/i.test(String(submitError.message || ""))) {
        storePendingAction(action);
        setMessage({
          tone: "info",
          text: "Netzproblem erkannt. Die Aktion wurde lokal vorgemerkt und wird später synchronisiert.",
        });
        return { queued: true };
      }
      setMessage({
        tone: "error",
        text: submitError.message || "Stempel konnte nicht gespeichert werden.",
      });
      return { error: true };
    }
  };

  const refreshLocation = () => {
    if (!navigator.geolocation) {
      setLocationState((current) => ({ ...current, error: "Dein Browser unterstützt keine Standortfreigabe." }));
      return;
    }
    setLocationState((current) => ({ ...current, loading: true, error: "" }));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationState({
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          },
          loading: false,
          error: "",
        });
      },
      (geoError) => {
        setLocationState({
          coords: null,
          loading: false,
          error: geoError.message || "Standort konnte nicht ermittelt werden.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleGpsStamp = async (checkpoint) => {
    if (!locationState.coords) {
      setMessage({ tone: "error", text: "Standort noch nicht verfügbar. Bitte zuerst Standort prüfen." });
      return;
    }
    if (checkpoint.distanceMeters !== null && checkpoint.distanceMeters > 300) {
      setMessage({ tone: "error", text: "Du bist noch weiter als 300 m vom Checkpoint entfernt." });
      return;
    }

    const action = {
      checkpoint_id: checkpoint.id,
      mode,
      source: "gps_click",
      lat: locationState.coords.lat,
      lng: locationState.coords.lng,
      distance_m: checkpoint.distanceMeters,
      qr_code_id: checkpoint.qr_code_id,
      shop_id: checkpoint.shop_id,
      queued_at: new Date().toISOString(),
    };
    const result = await submitStampAction(action);
    if (result?.success) {
      setCheckinTarget({
        checkpointId: checkpoint.id,
        shopId: checkpoint.shop_id,
        shopName: checkpoint.shop_name || checkpoint.name,
      });
    }
  };

  const handleQrCode = async (checkpoint, qrCode) => {
    const action = {
      checkpoint_id: checkpoint.id,
      mode,
      source: "qr_scan",
      qr_code: qrCode,
      qr_code_id: checkpoint.qr_code_id,
      shop_id: checkpoint.shop_id,
      queued_at: new Date().toISOString(),
      lat: locationState.coords?.lat || null,
      lng: locationState.coords?.lng || null,
    };
    const result = await submitStampAction(action);
    if (result?.success) {
      setCheckinTarget({
        checkpointId: checkpoint.id,
        shopId: checkpoint.shop_id,
        shopName: checkpoint.shop_name || checkpoint.name,
      });
    }
  };

  const syncPending = async () => {
    const queue = readPendingActions().filter((item) => item.mode === mode);
    if (!queue.length) {
      setMessage({ tone: "info", text: "Es sind keine offenen Aktionen zum Synchronisieren vorhanden." });
      return;
    }

    setSyncing(true);
    for (const action of queue) {
      await submitStampAction(action, { forceNetwork: true });
    }
    setSyncing(false);
  };

  useEffect(() => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    if (syncing || !pendingActions.some((item) => item.mode === mode)) return;
    syncPending();
  }, [mode, pendingActions, syncing]);

  const pendingCount = pendingActions.filter((item) => item.mode === mode).length;
  const startFinishDistance = locationState.coords
    ? haversineDistanceMeters(locationState.coords.lat, locationState.coords.lng, EVENT_START_FINISH.lat, EVENT_START_FINISH.lng)
    : null;

  return (
    <Page>
      <Header />
      <Container>
        <Card>
          <Title>{modeLabel(mode)}</Title>
          <Subtle>
            Geschützter Bereich für deine digitale Stempelkarte. Per GPS kannst du im 300-m-Umkreis abstempeln, bei Problemen per QR-Code-Fallback.
          </Subtle>
          <ModeSwitch>
            <ModeButton
              type="button"
              $active={mode === "live"}
              onClick={() => setSearchParams({ mode: "live" })}
            >
              Event-Stempelkarte
            </ModeButton>
            <ModeButton
              type="button"
              $active={mode === "test"}
              onClick={() => setSearchParams({ mode: "test" })}
            >
              Test-Stempelkarte
            </ModeButton>
          </ModeSwitch>

          <Grid>
            <StatCard>
              <div style={{ color: "#8a5700", fontSize: 13 }}>Route</div>
              <strong>{data?.slot?.route_name || "-"}</strong>
            </StatCard>
            <StatCard>
              <div style={{ color: "#8a5700", fontSize: 13 }}>Fortschritt</div>
              <strong>{data?.progress?.mandatory_passed || 0} / {data?.progress?.mandatory_total || 0}</strong>
            </StatCard>
            <StatCard>
              <div style={{ color: "#8a5700", fontSize: 13 }}>Lokale Warteschlange</div>
              <strong>{pendingCount} offen</strong>
            </StatCard>
            <StatCard>
              <div style={{ color: "#8a5700", fontSize: 13 }}>Standort</div>
              <strong>{locationState.coords ? `${locationState.coords.accuracy?.toFixed?.(0) || "?"} m Genauigkeit` : "Noch nicht erfasst"}</strong>
            </StatCard>
            <StatCard>
              <div style={{ color: "#8a5700", fontSize: 13 }}>Start & Ziel</div>
              <strong>{EVENT_START_FINISH.name}</strong>
              <div style={{ marginTop: 4, fontSize: 13, color: "#8a5700" }}>{EVENT_START_FINISH.address}</div>
            </StatCard>
          </Grid>

          <ActionRow>
            <ActionButton type="button" onClick={refreshLocation} disabled={locationState.loading}>
              {locationState.loading ? <LoaderCircle size={16} /> : <Compass size={16} />}
              Standort prüfen
            </ActionButton>
            <ActionButton type="button" $secondary onClick={syncPending} disabled={syncing || pendingCount === 0}>
              <RefreshCw size={16} />
              {syncing ? "Synchronisiere..." : "Offene Aktionen synchronisieren"}
            </ActionButton>
          </ActionRow>

          {locationState.error && <MessageBox $tone="error">{locationState.error}</MessageBox>}
          {message && (
            <MessageBox $tone={message.tone}>
              {message.text}
              {checkinTarget?.shopId && message.tone === "success" && (
                <div style={{ marginTop: 10 }}>
                  <ActionButton type="button" onClick={() => setShowCheckinForm(true)}>
                    Jetzt Eis einchecken
                  </ActionButton>
                </div>
              )}
            </MessageBox>
          )}
        </Card>

        {mode === "live" && (
          <Card>
            <h2 style={{ marginTop: 0 }}>Start & Ziel</h2>
            <Subtle>
              Treffpunkt fuer Start und Ziel ist <strong>{EVENT_START_FINISH.name}</strong>, {EVENT_START_FINISH.fullAddress}.
            </Subtle>
            <Small style={{ marginTop: "0.7rem" }}>
              {startFinishDistance !== null
                ? `Entfernung zum Start-/Zielbereich: ${Math.round(startFinishDistance)} m`
                : "Sobald dein Standort verfuegbar ist, siehst du hier auch die Entfernung zum Start-/Zielbereich."}
            </Small>
            <ActionRow>
              <ActionButton
                type="button"
                $secondary
                onClick={() => openCheckin({ shop_id: EVENT_START_FINISH.shopId, shop_name: EVENT_START_FINISH.name, name: EVENT_START_FINISH.name })}
              >
                Eis bei {EVENT_START_FINISH.name} einchecken
              </ActionButton>
            </ActionRow>
          </Card>
        )}

        {!isLoggedIn && (
          <Card>
            <Subtle>Bitte logge dich ein, um deine Event-Stempelkarte zu öffnen.</Subtle>
          </Card>
        )}

        {loading && (
          <Card>
            <Subtle>Stempelkarte wird geladen...</Subtle>
          </Card>
        )}

        {error && (
          <Card>
            <MessageBox $tone="error">{error}</MessageBox>
          </Card>
        )}

        {!loading && !error && checkpointsWithDistance.length > 0 && (
          <Card>
            <h2 style={{ marginTop: 0 }}>Checkpoints</h2>
            <CheckpointGrid>
              {checkpointsWithDistance.map((checkpoint) => {
                const gpsReady = checkpoint.distanceMeters !== null && checkpoint.distanceMeters <= 300;
                const status = checkpoint.localStatus;
                return (
                  <CheckpointCard key={`${mode}-${checkpoint.id}`} $status={status}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                      <div>
                        <strong>{checkpoint.name}</strong>
                        <div style={{ marginTop: 6, color: "#7c4f00" }}>{checkpoint.shop_name || checkpoint.name}</div>
                      </div>
                      <StatusBadge $status={status}>
                        {status === "confirmed" ? <CheckCircle2 size={14} /> : status === "queued" ? <RefreshCw size={14} /> : <MapPin size={14} />}
                        {statusLabel(status)}
                      </StatusBadge>
                    </div>

                    <Small style={{ marginTop: "0.7rem" }}>
                      {checkpoint.distanceMeters !== null
                        ? `Entfernung: ${Math.round(checkpoint.distanceMeters)} m`
                        : "Entfernung noch unbekannt. Bitte Standort prüfen."}
                    </Small>
                    <Small>
                      {checkpoint.passed_at
                        ? `Bestätigt am ${new Date(checkpoint.passed_at).toLocaleString("de-DE")}`
                        : "Noch kein serverseitiger Stempel vorhanden."}
                    </Small>
                    {mode === "live" && checkpoint.route_labels?.length > 0 && (
                      <Small>Route: {checkpoint.route_labels.join(", ")}</Small>
                    )}

                    <CardActions>
                      <CardButton type="button" $primary onClick={() => handleGpsStamp(checkpoint)} disabled={!gpsReady || status === "confirmed"}>
                        Per GPS abstempeln
                      </CardButton>
                      <CardButton type="button" onClick={() => setShowScannerFor(checkpoint)} disabled={status === "confirmed"}>
                        <QrCode size={15} />
                        QR-Code scannen
                      </CardButton>
                      <CardButton type="button" onClick={() => openCheckin(checkpoint)} disabled={!checkpoint.shop_id}>
                        Eis einchecken
                      </CardButton>
                    </CardActions>

                    {!gpsReady && status !== "confirmed" && (
                      <Small style={{ marginTop: "0.7rem" }}>
                        GPS-Stempel ist erst im 300-m-Umkreis aktiv. Wenn GPS nicht mitspielt, nutze den QR-Code-Fallback.
                      </Small>
                    )}
                  </CheckpointCard>
                );
              })}
            </CheckpointGrid>
          </Card>
        )}

        {!loading && !error && checkpointsWithDistance.length === 0 && (
          <Card>
            <Subtle>
              Für diesen Modus sind aktuell noch keine Checkpoints konfiguriert. Im Testmodus müssen dafür zwei Test-Eisdielen hinterlegt sein.
            </Subtle>
          </Card>
        )}

        <Card>
          <h2 style={{ marginTop: 0 }}>Hinweise für den Ablauf</h2>
          <ul style={{ color: "#7c4f00", lineHeight: 1.6, marginBottom: 0 }}>
            <li>Im Zweifel zuerst einen Stempel holen und danach direkt dein Eis über den CTA einchecken.</li>
            <li>Wenn du offline bist, wird der Stempel lokal vorgemerkt und später synchronisiert.</li>
            <li>Bei QR-Problemen kannst du den Code im Scanner-Dialog auch manuell eingeben.</li>
          </ul>
        </Card>
      </Container>

      {showScannerFor && (
        <QrScannerModal
          checkpoint={showScannerFor}
          onClose={() => setShowScannerFor(null)}
          onDetected={(qrCode) => handleQrCode(showScannerFor, qrCode)}
        />
      )}

      {showCheckinForm && checkinTarget && (
        <CheckinForm
          shopId={checkinTarget.shopId}
          shopName={checkinTarget.shopName}
          userId={userId}
          showCheckinForm={showCheckinForm}
          setShowCheckinForm={setShowCheckinForm}
          onSuccess={() => {
            setMessage({
              tone: "success",
              text: `Eis-Check-in für ${checkinTarget.shopName} erfolgreich gespeichert.`,
            });
          }}
        />
      )}

      <Footer />
    </Page>
  );
}
