import React, { useEffect, useMemo, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import {
  CheckCircle2,
  ChevronDown,
  Compass,
  ExternalLink,
  Flag,
  IceCreamBowl,
  Info,
  LoaderCircle,
  Lock,
  MapPin,
  Plus,
  QrCode,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import CheckinForm from "../../CheckinForm";
import { useUser } from "../../context/UserContext";
import { getApiBaseUrl } from "../../shared/api/client";
import Seo from "../../components/Seo";
import { EVENT_START_FINISH, formatRouteLabelWithDistance } from "./eventConfig";

const Page = styled.div`
  min-height: 100vh;
  overflow-x: clip;
  background:
    radial-gradient(circle at top, rgba(255, 226, 161, 0.42), transparent 32%),
    linear-gradient(180deg, #fff8ed 0%, #fff5e7 36%, #fffaf5 100%);
`;

const Container = styled.div`
  width: min(100%, 880px);
  margin: 0 auto;
  padding: 0.75rem 0.75rem 1.5rem;
  overflow-x: clip;
  box-sizing: border-box;
`;

const Card = styled.section`
  background: rgba(255, 253, 249, 0.97);
  border: 1px solid rgba(235, 193, 106, 0.34);
  border-radius: 20px;
  box-shadow: 0 14px 34px rgba(124, 79, 0, 0.08);
  padding: 0.9rem;
  margin-bottom: 0.9rem;
  overflow: hidden;
`;

const PassCard = styled(Card)`
  position: relative;
  background:
    linear-gradient(145deg, rgba(255, 199, 84, 0.16), rgba(255, 255, 255, 0.98)),
    #fffdfa;
`;

const CompactRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

const badgeShine = keyframes`
  0% {
    transform: translateX(-165%) skewX(-24deg);
    opacity: 0;
  }

  14% {
    opacity: 0.28;
  }

  52% {
    opacity: 0.72;
  }

  100% {
    transform: translateX(205%) skewX(-24deg);
    opacity: 0;
  }
`;

const VerifyBadge = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.38rem 0.72rem;
  border-radius: 999px;
  overflow: hidden;
  isolation: isolate;
  border: 1px solid rgba(255, 229, 171, 0.28);
  background: linear-gradient(135deg, #261900 0%, #4d3400 55%, #6d4a00 100%);
  color: #fff8ea;
  font-size: 0.8rem;
  font-weight: 800;
  box-shadow:
    inset 0 1px 0 rgba(255, 248, 234, 0.16),
    inset 0 -1px 0 rgba(255, 200, 96, 0.16),
    0 10px 18px rgba(77, 52, 0, 0.18);

  &::after {
    content: "";
    position: absolute;
    inset: -42% auto -42% -36%;
    width: 42%;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.14) 18%,
      rgba(255, 255, 255, 0.7) 48%,
      rgba(255, 248, 214, 0.24) 62%,
      rgba(255, 255, 255, 0.12) 82%,
      rgba(255, 255, 255, 0) 100%
    );
    transform: translateX(-165%) skewX(-24deg);
    filter: blur(0.5px);
    pointer-events: none;
    animation: ${badgeShine} 1.6s linear infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    &::after {
      animation: none;
      opacity: 0;
    }
  }
`;

const Title = styled.h1`
  margin: 0.45rem 0 0;
  color: #2f2100;
  font-size: clamp(1.35rem, 5.2vw, 2rem);
  line-height: 1.05;
`;

const Intro = styled.p`
  margin: 0.38rem 0 0;
  color: #7c4f00;
  line-height: 1.4;
  font-size: 0.94rem;
`;

const IdentityGrid = styled.div`
  display: grid;
  gap: 0.55rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 0.8rem;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const IdentityCard = styled.div`
  min-width: 0;
  background: rgba(255, 247, 229, 0.9);
  border: 1px solid rgba(240, 215, 154, 0.9);
  border-radius: 14px;
  padding: 0.7rem 0.8rem;
`;

const Label = styled.div`
  color: #8a5700;
  font-size: 0.78rem;
  margin-bottom: 0.22rem;
`;

const Value = styled.div`
  min-width: 0;
  color: #2f2100;
  font-size: 0.98rem;
  font-weight: 800;
  display: flex;
  gap: 0.45rem;
  align-items: center;
  line-height: 1.2;
  overflow-wrap: anywhere;
`;

const ProgressBar = styled.div`
  margin-top: 0.8rem;
  display: grid;
  gap: 0.5rem;
  grid-template-columns: 1fr auto;
  align-items: center;
`;

const ProgressTrack = styled.div`
  height: 10px;
  border-radius: 999px;
  background: #ffe9bb;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${({ $value }) => `${$value}%`};
  background: linear-gradient(90deg, #ffb522 0%, #ffd978 100%);
`;

const ProgressText = styled.div`
  color: #7c4f00;
  font-size: 0.84rem;
  font-weight: 700;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
  margin-top: 0.75rem;
`;

const Button = styled.button`
  border: 1px solid ${({ $secondary }) => ($secondary ? "#ecd49b" : "#ffb522")};
  border-radius: 13px;
  min-height: 42px;
  padding: 0.72rem 0.9rem;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  background: ${({ $secondary, $active }) => ($active ? "#ffddb0" : $secondary ? "#fff5df" : "#ffb522")};
  color: #2f2100;
  opacity: ${({ disabled }) => (disabled ? 0.55 : 1)};
  width: ${({ $full }) => ($full ? "100%" : "auto")};
  box-sizing: border-box;
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: #2f2100;
  font-size: 1.18rem;
`;

const SectionText = styled.p`
  margin: 0.35rem 0 0;
  color: #7c4f00;
  line-height: 1.42;
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
  border-radius: 18px;
  background: #fffdfa;
  padding: 1rem;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.2);
`;

const Sheet = styled(Modal)`
  position: fixed;
  inset: auto 0 0 0;
  width: auto;
  max-height: min(78vh, 640px);
  border-radius: 24px 24px 0 0;

  @media (min-width: 768px) {
    left: 50%;
    right: auto;
    width: min(640px, calc(100vw - 2rem));
    transform: translateX(-50%);
    border-radius: 24px;
    bottom: 1rem;
  }
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
  box-sizing: border-box;
`;

const MessageBox = styled.div`
  margin-top: 0.8rem;
  border-radius: 14px;
  padding: 0.8rem;
  background: ${({ $tone }) => ($tone === "error" ? "#fff1f2" : $tone === "success" ? "#f0fdf4" : "#fff7e5")};
  border: 1px solid ${({ $tone }) => ($tone === "error" ? "#fecdd3" : $tone === "success" ? "#86efac" : "#f0d79a")};
  color: ${({ $tone }) => ($tone === "error" ? "#9f1239" : $tone === "success" ? "#166534" : "#7c4f00")};
  line-height: 1.45;
`;

const PENDING_KEY = "event2026_pending_stamp_actions_v1";

function readPendingActions() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PENDING_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
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

function isCheckpointComplete(checkpoint) {
  return Boolean(checkpoint?.passed || checkpoint?.localStatus === "queued");
}

function isFinishCheckpoint(checkpoint, startFinish = EVENT_START_FINISH) {
  return checkpoint?.shop_id === startFinish.shop_id || checkpoint?.shop_id === startFinish.shopId || checkpoint?.name === startFinish.name;
}

function getPrimaryCheckin(checkpoint) {
  const eventDayCheckins = checkpoint?.event_day_checkins || [];
  if (!eventDayCheckins.length) return null;
  if (checkpoint?.checkin_id) {
    return eventDayCheckins.find((item) => Number(item.id) === Number(checkpoint.checkin_id)) || eventDayCheckins[0];
  }
  return eventDayCheckins[0];
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
      if (intervalId) window.clearInterval(intervalId);
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    };
  }, [onClose, onDetected]);

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} style={{ float: "right", border: "none", background: "transparent", fontSize: "1.4rem", cursor: "pointer" }}>×</button>
        <h2 style={{ marginTop: 0 }}>QR-Code scannen</h2>
        <SectionText style={{ marginTop: 0 }}>
          {checkpoint?.name}: Falls GPS nicht verfügbar ist, kannst du hier den QR-Code des Checkpoints scannen.
        </SectionText>
        {status === "camera" && <ScannerVideo ref={videoRef} muted playsInline />}
        <SectionText>
          {status === "camera"
            ? "Halte den QR-Code in die Kamera. Falls das nicht klappt, kannst du den Code unten manuell eingeben."
            : "Kamera-Scan ist in diesem Browser nicht verfügbar oder wurde nicht freigegeben. Gib den QR-Code unten manuell ein."}
        </SectionText>
        {error && <MessageBox $tone="error">{error}</MessageBox>}
        <TextInput value={manualCode} onChange={(event) => setManualCode(event.target.value)} placeholder="QR-Code manuell eingeben" />
        <ActionRow>
          <Button
            type="button"
            onClick={() => {
              if (!manualCode.trim()) return;
              onDetected(manualCode.trim());
              onClose();
            }}
          >
            QR-Code übernehmen
          </Button>
          <Button type="button" $secondary onClick={onClose}>Abbrechen</Button>
        </ActionRow>
      </Modal>
    </Overlay>
  );
}

const CheckpointList = styled.div`
  display: grid;
  gap: 0.75rem;
  margin-top: 0.85rem;
`;

const CheckpointCard = styled.article`
  border-radius: 18px;
  border: 1px solid ${({ $highlight, $passed }) => ($highlight && !$passed ? "#ffb522" : $passed ? "#8ed6a4" : "#efdbb0")};
  background: ${({ $highlight, $passed }) => ($highlight && !$passed
    ? "linear-gradient(160deg, rgba(255, 226, 170, 0.5), rgba(255, 252, 246, 0.98))"
    : $passed
      ? "#f4fff6"
      : "#fffdf8")};
  padding: 0.9rem;
`;

const HeadRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.7rem;
  align-items: flex-start;
`;

const NameWrap = styled.div`
  min-width: 0;
`;

const CheckpointName = styled.div`
  color: #2f2100;
  font-size: 1.02rem;
  font-weight: 800;
  line-height: 1.2;
`;

const ShopName = styled.div`
  color: #7c4f00;
  margin-top: 0.25rem;
  line-height: 1.3;
`;

const Badge = styled.div`
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  padding: 0.26rem 0.56rem;
  background: ${({ $locked, $passed }) => ($locked ? "#fff0c8" : $passed ? "#dcfce7" : "#fff3d0")};
  color: ${({ $locked, $passed }) => ($locked ? "#8a5700" : $passed ? "#166534" : "#8a5700")};
  font-size: 0.8rem;
  font-weight: 800;
`;

const GoalGrid = styled.div`
  display: grid;
  gap: 0.45rem;
  margin-top: 0.8rem;
`;

const GoalRow = styled.div`
  display: flex;
  gap: 0.55rem;
  align-items: center;
  border-radius: 12px;
  padding: 0.6rem 0.7rem;
  background: ${({ $done }) => ($done ? "#eefcf2" : "#fff7e7")};
  border: 1px solid ${({ $done }) => ($done ? "#b7e7c2" : "#f1ddb0")};
  color: ${({ $done }) => ($done ? "#166534" : "#7c4f00")};
`;

const GoalText = styled.div`
  min-width: 0;
`;

const GoalTitle = styled.div`
  font-weight: 800;
  line-height: 1.2;
`;

const GoalHint = styled.div`
  margin-top: 0.1rem;
  font-size: 0.83rem;
  line-height: 1.3;
`;

const MetaText = styled.div`
  margin-top: 0.7rem;
  color: #8a5700;
  line-height: 1.4;
  font-size: 0.9rem;
`;

const CheckinSummary = styled.div`
  margin-top: 0.75rem;
  border-radius: 14px;
  background: #fff6df;
  border: 1px solid #efd7a0;
  padding: 0.72rem 0.78rem;
`;

const SummaryTitle = styled.div`
  color: #7c4f00;
  font-size: 0.82rem;
  font-weight: 800;
  margin-bottom: 0.22rem;
`;

const SummaryText = styled.div`
  color: #2f2100;
  line-height: 1.38;
  font-size: 0.9rem;
`;

const CardActions = styled.div`
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 0.8rem;
  align-items: start;

  > *:only-child {
    grid-column: 1 / -1;
  }

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const InlineLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  justify-self: start;
  gap: 0.45rem;
  min-height: 42px;
  border-radius: 13px;
  border: 1px solid #ecd49b;
  background: #fff5df;
  color: #2f2100;
  text-decoration: none;
  font-weight: 800;
  padding: 0.72rem 0.9rem;
  box-sizing: border-box;
`;

export default function EventStampCard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoggedIn, authToken, userId, username } = useUser();
  const apiBase = getApiBaseUrl();
  const requestedMode = searchParams.get("mode") === "test" ? "test" : "live";
  const isAdmin = Number(userId) === 1;
  const mode = requestedMode === "test" && isAdmin ? "test" : "live";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(null);
  const [pendingActions, setPendingActions] = useState(() => readPendingActions());
  const [locationState, setLocationState] = useState({ coords: null, loading: false, error: "" });
  const [showScannerFor, setShowScannerFor] = useState(null);
  const [checkinTarget, setCheckinTarget] = useState(null);
  const [stampSuccessPrompt, setStampSuccessPrompt] = useState(null);
  const [showCheckinForm, setShowCheckinForm] = useState(false);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    if (requestedMode === "test" && !isAdmin) {
      setSearchParams({ mode: "live" }, { replace: true });
    }
  }, [isAdmin, requestedMode, setSearchParams]);

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
          if (json?.message?.includes("Test-Stempelkarte")) {
            setSearchParams({ mode: "live" }, { replace: true });
            return;
          }
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
  }, [apiBase, authToken, isLoggedIn, mode, navigate, refreshNonce, setSearchParams]);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (!navigator.geolocation) {
      setLocationState((current) => ({ ...current, error: "Dein Browser unterstützt keine Standortfreigabe." }));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
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

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isLoggedIn]);

  const pendingMap = useMemo(() => {
    const relevant = pendingActions.filter((item) => item.mode === mode);
    return new Map(relevant.map((item) => [item.checkpoint_id, item]));
  }, [mode, pendingActions]);
  const startFinish = data?.start_finish || EVENT_START_FINISH;
  const stampingEnabled = data?.stamping?.enabled ?? true;
  const stampingMessage = data?.stamping?.message || "";

  const checkpointsWithDistance = useMemo(() => {
    return (data?.checkpoints || []).map((checkpoint) => ({
      ...checkpoint,
      distanceMeters: locationState.coords
        ? haversineDistanceMeters(locationState.coords.lat, locationState.coords.lng, checkpoint.lat, checkpoint.lng)
        : null,
      localStatus: checkpointStatus(checkpoint, pendingMap),
    }));
  }, [data?.checkpoints, locationState.coords, pendingMap]);

  const finishCheckpoint = useMemo(
    () => checkpointsWithDistance.find((checkpoint) => isFinishCheckpoint(checkpoint, startFinish)) || null,
    [checkpointsWithDistance, startFinish]
  );
  const primaryCheckpoints = useMemo(
    () => checkpointsWithDistance.filter((checkpoint) => !isFinishCheckpoint(checkpoint, startFinish)),
    [checkpointsWithDistance, startFinish]
  );
  const mandatoryPrimaryCheckpoints = useMemo(
    () => primaryCheckpoints.filter((checkpoint) => Number(checkpoint.is_mandatory) === 1),
    [primaryCheckpoints]
  );

  const completedMandatoryCount = mandatoryPrimaryCheckpoints.filter(isCheckpointComplete).length;
  const finishUnlocked = mandatoryPrimaryCheckpoints.every(isCheckpointComplete);
  const pendingCount = pendingActions.filter((item) => item.mode === mode).length;
  const progressRatio = mandatoryPrimaryCheckpoints.length
    ? Math.round((completedMandatoryCount / mandatoryPrimaryCheckpoints.length) * 100)
    : 0;
  const startFinishDistance = locationState.coords
    ? haversineDistanceMeters(locationState.coords.lat, locationState.coords.lng, startFinish.lat, startFinish.lng)
    : null;

  const updateCheckpointLocally = (checkpointId, nextValues) => {
    setData((current) => {
      if (!current) return current;
      return {
        ...current,
        checkpoints: (current.checkpoints || []).map((checkpoint) =>
          checkpoint.id === checkpointId ? { ...checkpoint, ...nextValues } : checkpoint
        ),
      };
    });
  };

  const openCheckin = (checkpoint, existingCheckinId = null) => {
    if (!checkpoint?.shop_id) {
      setMessage({ tone: "error", text: "Für diesen Checkpoint ist keine Eisdiele hinterlegt." });
      return;
    }
    setCheckinTarget({
      checkpointId: checkpoint.id,
      shopId: checkpoint.shop_id,
      shopName: checkpoint.shop_name || checkpoint.name,
      checkinId: existingCheckinId,
      initialLocation: locationState.coords
        ? { lat: locationState.coords.lat, lon: locationState.coords.lng }
        : null,
    });
    setShowCheckinForm(true);
  };

  const storePendingAction = (action) => {
    const nextActions = [
      ...readPendingActions().filter((item) => !(item.checkpoint_id === action.checkpoint_id && item.mode === action.mode)),
      action,
    ];
    writePendingActions(nextActions);
    setPendingActions(nextActions);
    updateCheckpointLocally(action.checkpoint_id, { passed: false, pending_local: true });
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
      setMessage({ tone: "info", text: "Aktion lokal gespeichert. Sie wird synchronisiert, sobald wieder eine Verbindung besteht." });
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
          setMessage({ tone: "info", text: "Server gerade nicht erreichbar. Die Aktion wurde lokal vorgemerkt und wird später synchronisiert." });
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
      setRefreshNonce((current) => current + 1);
      setMessage({ tone: "success", text: json.message || "Checkpoint erfolgreich abgestempelt." });
      return { success: true };
    } catch (submitError) {
      if (!options.forceNetwork && /Failed to fetch|NetworkError|Load failed/i.test(String(submitError.message || ""))) {
        storePendingAction(action);
        setMessage({ tone: "info", text: "Netzproblem erkannt. Die Aktion wurde lokal vorgemerkt und wird später synchronisiert." });
        return { queued: true };
      }
      setMessage({ tone: "error", text: submitError.message || "Stempel konnte nicht gespeichert werden." });
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

  const handleGpsStamp = async (checkpoint, locked) => {
    if (!stampingEnabled) {
      setMessage({ tone: "info", text: stampingMessage || "Live-Stempel sind aktuell noch nicht freigeschaltet." });
      return;
    }
    if (locked) {
      setMessage({ tone: "info", text: "Dieser Abschluss-Checkpoint wird erst nach allen Pflichtstopps freigeschaltet." });
      return;
    }
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
      const nextTarget = {
        checkpointId: checkpoint.id,
        shopId: checkpoint.shop_id,
        shopName: checkpoint.shop_name || checkpoint.name,
        checkinId: null,
        initialLocation: locationState.coords
          ? { lat: locationState.coords.lat, lon: locationState.coords.lng }
          : null,
      };
      setCheckinTarget(nextTarget);
      setStampSuccessPrompt(nextTarget);
    }
  };

  const handleQrCode = async (checkpoint, qrCode) => {
    if (!stampingEnabled) {
      setMessage({ tone: "info", text: stampingMessage || "Live-Stempel sind aktuell noch nicht freigeschaltet." });
      return;
    }
    const locked = isFinishCheckpoint(checkpoint, startFinish) && !finishUnlocked;
    if (locked) {
      setMessage({ tone: "info", text: "Dieser Abschluss-Checkpoint wird erst nach allen Pflichtstopps freigeschaltet." });
      return;
    }
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
      const nextTarget = {
        checkpointId: checkpoint.id,
        shopId: checkpoint.shop_id,
        shopName: checkpoint.shop_name || checkpoint.name,
        checkinId: null,
        initialLocation: locationState.coords
          ? { lat: locationState.coords.lat, lon: locationState.coords.lng }
          : null,
      };
      setCheckinTarget(nextTarget);
      setStampSuccessPrompt(nextTarget);
    }
  };

  const syncPending = async () => {
    if (!stampingEnabled) {
      setMessage({ tone: "info", text: stampingMessage || "Live-Stempel sind aktuell noch nicht freigeschaltet." });
      return;
    }
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

  const renderCheckpointCard = (checkpoint, options = {}) => {
    const passed = isCheckpointComplete(checkpoint);
    const locked = Boolean(options.locked);
    const gpsReady = checkpoint.distanceMeters !== null && checkpoint.distanceMeters <= 300;
    const eventDayCheckins = checkpoint.event_day_checkins || [];
    const hasIceCheckin = eventDayCheckins.length > 0;
    const primaryCheckin = getPrimaryCheckin(checkpoint);
    const focusCheckinId = primaryCheckin?.id || null;
    const checkinLinkLabel = eventDayCheckins.length > 1 ? "Zu Check-ins" : "Zum Check-in";
    const checkinLink = checkpoint.shop_id && focusCheckinId
      ? `/map/activeShop/${checkpoint.shop_id}?tab=checkins&focusCheckin=${focusCheckinId}`
      : checkpoint.shop_id
        ? `/map/activeShop/${checkpoint.shop_id}?tab=checkins`
        : null;

    return (
      <CheckpointCard key={`${mode}-${checkpoint.id}`} $highlight={options.highlight} $passed={passed}>
        <HeadRow>
          <NameWrap>
            <CheckpointName>{checkpoint.name}</CheckpointName>
            <ShopName>{checkpoint.shop_name || checkpoint.name}</ShopName>
          </NameWrap>
          <Badge $locked={locked} $passed={passed}>
            {passed ? <CheckCircle2 size={14} /> : locked ? <Lock size={14} /> : <MapPin size={14} />}
            {passed ? "Bestätigt" : locked ? "Gesperrt" : "Offen"}
          </Badge>
        </HeadRow>

        <GoalGrid>
          <GoalRow $done={passed}>
            <CheckCircle2 size={18} />
            <GoalText>
              <GoalTitle>Checkpoint bestätigt</GoalTitle>
              <GoalHint>
                {passed
                  ? "Pflichtziel erreicht."
                  : locked
                    ? options.lockHint
                    : "Pflichtziel für diese Station."}
              </GoalHint>
            </GoalText>
          </GoalRow>
          <GoalRow $done={hasIceCheckin}>
            <IceCreamBowl size={18} />
            <GoalText>
              <GoalTitle>Eis eingecheckt</GoalTitle>
              <GoalHint>
                {hasIceCheckin
                  ? `${eventDayCheckins.length} Eventtags-Check-in${eventDayCheckins.length > 1 ? "s" : ""} vorhanden.`
                  : "Nice to have: mindestens ein Eis an diesem Checkpoint einchecken."}
              </GoalHint>
            </GoalText>
          </GoalRow>
        </GoalGrid>

        <MetaText>
          {checkpoint.distanceMeters !== null
            ? `Deine Entfernung: ${Math.round(checkpoint.distanceMeters)} m`
            : "Entfernung noch unbekannt. Bitte Standort prüfen."}
        </MetaText>
        {checkpoint.passed_at && (
          <MetaText>Bestätigt am {new Date(checkpoint.passed_at).toLocaleString("de-DE")}</MetaText>
        )}

        {primaryCheckin && (
          <CheckinSummary>
            <SummaryTitle>Neuester Eis-Check-in</SummaryTitle>
            <SummaryText>
              {new Date(primaryCheckin.datum).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
              {" · "}
              {primaryCheckin.typ}
              {primaryCheckin.sorten_preview ? ` · ${primaryCheckin.sorten_preview}` : ""}
            </SummaryText>
            {primaryCheckin.kommentar_preview && (
              <SummaryText style={{ marginTop: "0.22rem", color: "#7c4f00" }}>
                {primaryCheckin.kommentar_preview}
              </SummaryText>
            )}
          </CheckinSummary>
        )}

        <CardActions>
          {!passed && (
            <>
              <Button type="button" onClick={() => handleGpsStamp(checkpoint, locked)} disabled={!gpsReady || locked || !stampingEnabled}>
                Standort-Stempel
              </Button>
              <Button
                type="button"
                $secondary
                onClick={() => {
                  if (!stampingEnabled) {
                    setMessage({ tone: "info", text: stampingMessage || "Live-Stempel sind aktuell noch nicht freigeschaltet." });
                    return;
                  }
                  if (locked) {
                    setMessage({ tone: "info", text: options.lockHint || "Dieser Checkpoint ist noch gesperrt." });
                    return;
                  }
                  setShowScannerFor(checkpoint);
                }}
                disabled={locked || !stampingEnabled}
              >
                <QrCode size={15} />
                QR-Code
              </Button>
            </>
          )}
          {passed && !hasIceCheckin && (
            <Button type="button" $secondary onClick={() => openCheckin(checkpoint, null)} disabled={!checkpoint.shop_id}>
              <Plus size={15} />
              Eis einchecken
            </Button>
          )}
          {passed && hasIceCheckin && checkinLink && (
            <InlineLink to={checkinLink}>
              <ExternalLink size={15} />
              {checkinLinkLabel}
            </InlineLink>
          )}
          {passed && hasIceCheckin && (
            <Button type="button" $secondary onClick={() => openCheckin(checkpoint, null)} disabled={!checkpoint.shop_id}>
              <Plus size={15} />
              Weiteres Eis
            </Button>
          )}
        </CardActions>

        {!gpsReady && !passed && !locked && (
          <MetaText>GPS-Stempel ist erst im 300-m-Umkreis aktiv. Wenn GPS nicht mitspielt, nutze den QR-Code.</MetaText>
        )}
        {!passed && !stampingEnabled && (
          <MetaText>{stampingMessage || "Live-Stempel sind aktuell noch nicht freigeschaltet."}</MetaText>
        )}
      </CheckpointCard>
    );
  };

  return (
    <Page>
      <Seo
        title="Ice-Tour Stempelkarte"
        description="Digitale Stempelkarte für Teilnehmer der Ice-Tour 2026."
        robots="noindex,nofollow"
      />
      <Header />
      <Container>
        <PassCard>
          <CompactRow>
            <div>
              <VerifyBadge>
                <ShieldCheck size={16} />
                Offizieller Teilnehmer
              </VerifyBadge>
              <Title>{mode === "test" ? "Test-Stempelkarte" : "Event-Stempelkarte"}</Title>
              <Intro>Zum Vorzeigen bei der Eisdiele und als kompakte Übersicht für deine Tour.</Intro>
            </div>
            {isAdmin && (
              <CompactRow style={{ justifyContent: "flex-end" }}>
                <Button type="button" $secondary $active={mode === "live"} onClick={() => setSearchParams({ mode: "live" })}>Live</Button>
                <Button type="button" $secondary $active={mode === "test"} onClick={() => setSearchParams({ mode: "test" })}>Test</Button>
              </CompactRow>
            )}
          </CompactRow>

          <IdentityGrid>
            <IdentityCard>
              <Label>Nutzername</Label>
              <Value><UserRound size={17} />{username || "-"}</Value>
            </IdentityCard>
            <IdentityCard>
              <Label>Teilnehmer</Label>
              <Value>{data?.slot?.full_name || "-"}</Value>
            </IdentityCard>
            <IdentityCard>
              <Label>Strecke</Label>
              <Value>
                <Flag size={17} />
                {data?.slot ? formatRouteLabelWithDistance(data.slot.route_key, data.slot.distance_km) : "-"}
              </Value>
            </IdentityCard>
          </IdentityGrid>

          <ProgressBar>
            <ProgressTrack>
              <ProgressFill $value={progressRatio} />
            </ProgressTrack>
            <ProgressText>{completedMandatoryCount} / {mandatoryPrimaryCheckpoints.length} Pflichtstopps</ProgressText>
          </ProgressBar>

          <ActionRow>
            <Button type="button" $secondary onClick={() => setShowInfoSheet(true)}>
              <Info size={16} />
              Infos
              <ChevronDown size={16} />
            </Button>
            <Button type="button" onClick={refreshLocation} disabled={locationState.loading}>
              {locationState.loading ? <LoaderCircle size={16} /> : <Compass size={16} />}
              Standort prüfen
            </Button>
          </ActionRow>

          {locationState.error && <MessageBox $tone="error">{locationState.error}</MessageBox>}
          {!stampingEnabled && <MessageBox $tone="info">{stampingMessage || "Live-Stempel sind aktuell noch nicht freigeschaltet."}</MessageBox>}
          {message && <MessageBox $tone={message.tone}>{message.text}</MessageBox>}
        </PassCard>

        {!isLoggedIn && <Card><SectionText style={{ margin: 0 }}>Bitte logge dich ein, um deine Event-Stempelkarte zu öffnen.</SectionText></Card>}
        {loading && <Card><SectionText style={{ margin: 0 }}>Stempelkarte wird geladen...</SectionText></Card>}
        {error && <Card><MessageBox $tone="error" style={{ marginTop: 0 }}>{error}</MessageBox></Card>}

        {!loading && !error && (
          <Card>
            <SectionTitle>Deine Tour-Checkpoints</SectionTitle>
            <SectionText>
              Zielbild pro Checkpoint: Pflichtstempel holen und idealerweise mindestens ein Eis einchecken.
            </SectionText>
            <CheckpointList>
              {primaryCheckpoints.length > 0
                ? primaryCheckpoints.map((checkpoint) => renderCheckpointCard(checkpoint))
                : <SectionText>Für diesen Modus sind aktuell keine routenrelevanten Checkpoints hinterlegt.</SectionText>}
              {finishCheckpoint && renderCheckpointCard(finishCheckpoint, {
                highlight: true,
                locked: !finishUnlocked && finishCheckpoint.localStatus !== "confirmed",
                lockHint: `Noch ${Math.max(0, mandatoryPrimaryCheckpoints.length - completedMandatoryCount)} Pflichtstopp(s) bis zur Freischaltung.`,
              })}
            </CheckpointList>
          </Card>
        )}

        <Card>
          <SectionTitle>Hinweise</SectionTitle>
          <ul style={{ color: "#7c4f00", lineHeight: 1.6, marginBottom: 0, paddingLeft: "1.2rem" }}>
            <li>Im Zweifel zuerst den Stempel holen und danach direkt über den Button "Eis einchecken" weitermachen.</li>
            <li>Wenn du offline bist, wird der Stempel lokal vorgemerkt und später synchronisiert.</li>
            <li>Bei QR-Problemen kannst du den Code im Scanner-Dialog auch manuell eingeben.</li>
          </ul>
        </Card>
      </Container>

      {showInfoSheet && (
        <Overlay onClick={() => setShowInfoSheet(false)}>
          <Sheet onClick={(event) => event.stopPropagation()}>
            <div style={{ width: 56, height: 6, borderRadius: 999, background: "#ebd6a6", margin: "0 auto 0.8rem" }} />
            <button type="button" onClick={() => setShowInfoSheet(false)} style={{ float: "right", border: "none", background: "transparent", fontSize: "1.4rem", cursor: "pointer" }}>×</button>
            <SectionTitle style={{ marginRight: "2rem" }}>Event-Infos</SectionTitle>
            <SectionText>Hier findest du zusätzliche Infos zu deinem Fortschritt, Standort und noch nicht übertragenen Stempeln.</SectionText>

            <IdentityGrid style={{ marginTop: "0.8rem" }}>
              <IdentityCard>
                <Label>Fortschritt</Label>
                <Value>{completedMandatoryCount} / {mandatoryPrimaryCheckpoints.length}</Value>
              </IdentityCard>
              <IdentityCard>
                <Label>Noch nicht übertragene Stempel</Label>
                <Value>{pendingCount} ausstehend</Value>
              </IdentityCard>
              <IdentityCard>
                <Label>Standortgenauigkeit</Label>
                <Value>{locationState.coords ? `${locationState.coords.accuracy?.toFixed?.(0) || "?"} m` : "Noch nicht erfasst"}</Value>
              </IdentityCard>
            </IdentityGrid>

            <CheckinSummary style={{ marginTop: "0.8rem" }}>
              <SummaryTitle>Start & Ziel</SummaryTitle>
              <SummaryText>{startFinish.name}</SummaryText>
              <SummaryText style={{ color: "#7c4f00", marginTop: "0.2rem" }}>{startFinish.full_address || startFinish.fullAddress}</SummaryText>
              <SummaryText style={{ color: "#7c4f00", marginTop: "0.2rem" }}>
                {startFinishDistance !== null ? `${Math.round(startFinishDistance)} m entfernt` : "Entfernung folgt nach Standortfreigabe"}
              </SummaryText>
            </CheckinSummary>

            <ActionRow>
              <Button type="button" onClick={refreshLocation} disabled={locationState.loading}>
                {locationState.loading ? <LoaderCircle size={16} /> : <Compass size={16} />}
                Standort aktualisieren
              </Button>
              <Button type="button" $secondary onClick={syncPending} disabled={syncing || pendingCount === 0}>
                <RefreshCw size={16} />
                {syncing ? "Übertrage..." : "Ausstehende Stempel übertragen"}
              </Button>
            </ActionRow>
          </Sheet>
        </Overlay>
      )}

      {showScannerFor && (
        <QrScannerModal
          checkpoint={showScannerFor}
          onClose={() => setShowScannerFor(null)}
          onDetected={(qrCode) => handleQrCode(showScannerFor, qrCode)}
        />
      )}

      {stampSuccessPrompt && (
        <Overlay onClick={() => setStampSuccessPrompt(null)}>
          <Modal onClick={(event) => event.stopPropagation()}>
            <SectionTitle>Checkpoint erfolgreich abgestempelt</SectionTitle>
            <SectionText>
              {stampSuccessPrompt.shopName
                ? `Jetzt Eis bei ${stampSuccessPrompt.shopName} einchecken.`
                : "Jetzt Eis einchecken."}
            </SectionText>
            <ActionRow>
              <Button
                type="button"
                onClick={() => {
                  setStampSuccessPrompt(null);
                  setShowCheckinForm(true);
                }}
                disabled={!stampSuccessPrompt.shopId}
              >
                <Plus size={16} />
                Eis einchecken
              </Button>
              <Button type="button" $secondary onClick={() => setStampSuccessPrompt(null)}>
                Später
              </Button>
            </ActionRow>
          </Modal>
        </Overlay>
      )}

      {showCheckinForm && checkinTarget && (
        <CheckinForm
          checkinId={checkinTarget.checkinId}
          shopId={checkinTarget.shopId}
          shopName={checkinTarget.shopName}
          userId={userId}
          initialLocation={checkinTarget.initialLocation}
          showCheckinForm={showCheckinForm}
          setShowCheckinForm={setShowCheckinForm}
          onSuccess={() => {
            setRefreshNonce((current) => current + 1);
            setStampSuccessPrompt(null);
            setMessage({
              tone: "success",
              text: checkinTarget.checkinId
                ? `Check-in bei ${checkinTarget.shopName} erfolgreich aktualisiert.`
                : `Eis-Check-in für ${checkinTarget.shopName} erfolgreich gespeichert.`,
            });
          }}
        />
      )}

      <Footer />
    </Page>
  );
}
