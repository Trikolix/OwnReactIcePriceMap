import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import Header from "./Header";
import Footer from "./Footer";
import { getApiBaseUrl } from "../../shared/api/client";
import { useUser } from "../../context/UserContext";
import Seo from "../../components/Seo";
import { formatRouteShortWithDistance, getPaceLabel, PACE_OPTIONS, ROUTE_OPTIONS } from "./eventConfig";
import {
  EVENT_LOGIN_REQUIRED_MESSAGE,
  getEventAccessErrorMessage,
  readEventApiJson,
} from "./eventAuthMessages";

const Page = styled.div`
  min-height: 100vh;
  background: var(--event-bg);
`;

const Container = styled.div`
  width: min(96%, 1240px);
  margin: 0 auto;
  padding: 1rem;
`;

const Card = styled.div`
  background: #fffdfa;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(255, 181, 34, 0.08);
  padding: 1.1rem;
  margin-bottom: 1rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
`;

const SummaryBox = styled.div`
  border: 1px solid #f3e5bd;
  border-radius: 12px;
  padding: 0.8rem 0.9rem;
  background: #fffaf0;
`;

const Badge = styled.span`
  display: inline-block;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  background: ${({ $tone }) => ($tone === "success" ? "#dcfce7" : "#fff3c2")};
  color: ${({ $tone }) => ($tone === "success" ? "#166534" : "#8a5700")};
  font-weight: 700;
  font-size: 0.85rem;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: 0.9rem;
`;

const SectionText = styled.p`
  margin: 0.35rem 0 0;
  color: #7c4f00;
  line-height: 1.45;
`;

const TableWrap = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  th, td {
    padding: 0.65rem 0.55rem;
    border-bottom: 1px solid #f3e5bd;
    text-align: left;
    vertical-align: top;
    white-space: nowrap;
  }

  th {
    color: #7c4f00;
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
`;

const ClickableRow = styled.tr`
  cursor: pointer;
  background: ${({ $selected }) => ($selected ? "#fff3c4" : "transparent")};

  &:hover {
    background: ${({ $selected }) => ($selected ? "#fff0b4" : "#fffaf0")};
  }
`;

const DetailGrid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;

  @media (min-width: 980px) {
    grid-template-columns: 1.2fr 1fr;
  }
`;

const DetailSection = styled.div`
  border: 1px solid #f3e5bd;
  border-radius: 12px;
  background: #fffaf0;
  padding: 0.9rem;
`;

const DetailTitle = styled.h3`
  margin: 0 0 0.7rem;
  color: #3a2600;
  font-size: 1rem;
`;

const InfoList = styled.div`
  display: grid;
  gap: 0.55rem;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px dashed rgba(138, 87, 0, 0.18);
  padding-bottom: 0.45rem;
  flex-wrap: wrap;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  color: #7c4f00;
`;

const InfoValue = styled.span`
  color: #2d1d00;
  font-weight: 700;
  text-align: right;

  @media (max-width: 720px) {
    width: 100%;
    text-align: left;
  }
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 0.9rem;
`;

const ActionButton = styled.button`
  border: none;
  border-radius: 8px;
  padding: 0.65rem 0.95rem;
  background: #ffb522;
  color: white;
  font-weight: 700;
  cursor: pointer;
`;

const SecondaryButton = styled.button`
  border: 1px solid #ecd49b;
  border-radius: 8px;
  padding: 0.65rem 0.95rem;
  background: #fff5df;
  color: #7c4f00;
  font-weight: 700;
  cursor: pointer;
`;

const AccountLink = styled(Link)`
  color: #d97706;
  font-weight: 700;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const QrGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.9rem;
`;

const QrCard = styled.div`
  border: 1px solid #f3e5bd;
  border-radius: 14px;
  background: #fffaf0;
  padding: 0.9rem;
  display: grid;
  gap: 0.75rem;
`;

const QrImage = styled.img`
  width: min(100%, 220px);
  aspect-ratio: 1 / 1;
  justify-self: center;
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(124, 79, 0, 0.12);
  padding: 0.55rem;
  box-sizing: border-box;
`;

const MonoField = styled.input`
  width: 100%;
  border: 1px solid #ead7ab;
  border-radius: 10px;
  padding: 0.62rem 0.75rem;
  font: inherit;
  color: #2d1d00;
  background: #fffef9;
  box-sizing: border-box;
`;

const NumberField = styled(MonoField)`
  width: 120px;
  margin-top: 0.25rem;
`;

const SelectField = styled.select`
  width: 100%;
  border: 1px solid #ead7ab;
  border-radius: 10px;
  padding: 0.62rem 0.75rem;
  font: inherit;
  color: #2d1d00;
  background: #fffef9;
  box-sizing: border-box;
`;

const CopyButton = styled.button`
  border: 1px solid #ecd49b;
  border-radius: 10px;
  padding: 0.6rem 0.85rem;
  background: #fff5df;
  color: #7c4f00;
  font-weight: 700;
  cursor: pointer;
`;

const SectionToggle = styled.button`
  border: 1px solid #ecd49b;
  border-radius: 10px;
  padding: 0.6rem 0.85rem;
  background: #fff5df;
  color: #7c4f00;
  font-weight: 700;
  cursor: pointer;
`;

const SortButton = styled.button`
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 800;
  text-transform: inherit;
  letter-spacing: inherit;
  padding: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(45, 29, 0, 0.42);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 4vh 1rem;
  overflow-y: auto;
`;

const ModalDialog = styled.div`
  width: min(100%, 1080px);
  max-height: 92vh;
  overflow-y: auto;
  background: #fffdfa;
  border-radius: 12px;
  box-shadow: 0 18px 48px rgba(45, 29, 0, 0.28);
  padding: 1.1rem;
`;

const ModalHeader = styled.div`
  position: sticky;
  top: -1.1rem;
  z-index: 1;
  background: #fffdfa;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  padding-bottom: 0.9rem;
  margin-bottom: 0.8rem;
  border-bottom: 1px solid #f3e5bd;
`;

const CloseButton = styled.button`
  border: 1px solid #ecd49b;
  border-radius: 8px;
  background: #fff5df;
  color: #7c4f00;
  font-weight: 800;
  cursor: pointer;
  padding: 0.45rem 0.7rem;
`;

const ADMIN_ROUTE_DISTANCE_BY_KEY = {
  epic_4: 180,
  classic_3: 140,
  family_2: 75,
};

function formatEuro(value) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("de-DE");
}

function formatDateTimeLocalInput(value) {
  if (!value) return "";
  return String(value).replace(" ", "T").slice(0, 16);
}

function routeKeyForDistance(distanceKm) {
  const normalizedDistance = Number(distanceKm);
  const match = Object.entries(ADMIN_ROUTE_DISTANCE_BY_KEY).find(([, routeDistance]) => routeDistance === normalizedDistance);
  if (match) return match[0];
  if (normalizedDistance >= 170) return "epic_4";
  if (normalizedDistance <= 90) return "family_2";
  return match?.key || "classic_3";
}

function emptyWaveForm() {
  return {
    waveId: null,
    waveCode: "",
    routeKey: "classic_3",
    paceGroup: "24_27",
    startTime: "",
    capacity: 20,
  };
}

function statusTone(status) {
  return status === "paid" ? "success" : undefined;
}

function formatReminderKind(kind) {
  switch (kind) {
    case "registration_payment_14d":
      return "Auto nach 14 Tagen";
    case "registration_payment_pre_event":
      return "Auto vor Event";
    case "voucher_unused_7d":
      return "Auto nach 7 Tagen";
    case "voucher_unused_pre_event":
      return "Auto vor Event";
    case "manual_registration_payment":
      return "Manuell Zahlung";
    case "manual_unused_voucher":
      return "Manuell Gutschein";
    case "manual_account_verification":
      return "Manuell Account";
    default:
      return kind || "-";
  }
}

function formatReminderSummary(reminder) {
  if (!reminder?.last_sent_at) return "Noch kein Reminder gesendet";
  const count = reminder.count || 0;
  const lastKind = formatReminderKind(reminder.last_kind);
  return `${formatDateTime(reminder.last_sent_at)} • ${lastKind}${count > 1 ? ` • ${count}x` : ""}`;
}

function registrationSortValue(registration, key) {
  const slot = registration.slots?.[0] || {};
  switch (key) {
    case "id":
      return registration.id;
    case "account":
      return registration.registered_by?.username || "";
    case "participant":
      return slot.full_name || "";
    case "reference":
      return registration.payment?.reference_code || "";
    case "status":
      return registration.payment?.status || "";
    case "expected":
      return Number(registration.payment?.total_expected_amount ?? registration.payment?.expected_amount ?? 0);
    case "outstanding":
      return Number(registration.payment?.total_outstanding_amount ?? registration.payment?.outstanding_amount ?? 0);
    case "route":
      return `${slot.distance_km || 0}-${slot.route_key || ""}`;
    case "pace":
      return slot.pace_group || "";
    case "wave":
      return slot.wave_code || "";
    default:
      return "";
  }
}

function defaultRegistrationSortValue(registration) {
  const slot = registration.slots?.[0] || {};
  return [
    Number(slot.distance_km || 0),
    slot.route_key || "",
    slot.pace_group || "",
    slot.full_name || "",
    registration.id || 0,
  ].join("|");
}

export default function EventAdminOverview() {
  const apiUrl = getApiBaseUrl();
  const { authToken, authReady } = useUser();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState(null);
  const [selectedAddonId, setSelectedAddonId] = useState(null);
  const [checkpointQrs, setCheckpointQrs] = useState([]);
  const [qrImageMap, setQrImageMap] = useState({});
  const [showCheckpointQrs, setShowCheckpointQrs] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [notice, setNotice] = useState("");
  const [waveCapacity, setWaveCapacity] = useState(20);
  const [waveForm, setWaveForm] = useState(() => emptyWaveForm());
  const [registrationSort, setRegistrationSort] = useState({ key: "route_pace", direction: "asc" });
  const [registrationDetailOpen, setRegistrationDetailOpen] = useState(false);

  const load = async () => {
    if (!apiUrl || !authReady) return;
    if (!authToken) {
      setData(null);
      setError(EVENT_LOGIN_REQUIRED_MESSAGE);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/event2026/admin_registrations.php`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const json = await readEventApiJson(res);
      if (!res.ok || json?.status !== "success") {
        throw new Error(getEventAccessErrorMessage(res.status, json?.message || "Admin-Daten konnten nicht geladen werden."));
      }
      setData(json);
      setSelectedRegistrationId((prev) => prev ?? json.registrations?.[0]?.id ?? null);
      setSelectedAddonId((prev) => prev ?? json.addon_purchases?.[0]?.id ?? null);
      setError("");
    } catch (err) {
      setError(err.message || "Admin-Daten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [apiUrl, authReady, authToken]);

  useEffect(() => {
    if (!apiUrl || !authReady || !authToken) return;

    let cancelled = false;
    fetch(`${apiUrl}/event2026/admin_checkpoint_qrs.php`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then(async (res) => {
        const json = await readEventApiJson(res);
        if (!res.ok || json?.status !== "success") {
          throw new Error(getEventAccessErrorMessage(res.status, json?.message || "Checkpoint-QR-Codes konnten nicht geladen werden."));
        }
        if (!cancelled) {
          setCheckpointQrs(json.checkpoints || []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError((current) => current || err.message || "Checkpoint-QR-Codes konnten nicht geladen werden.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiUrl, authReady, authToken]);

  useEffect(() => {
    if (!checkpointQrs.length) {
      setQrImageMap({});
      return;
    }

    let cancelled = false;
    const origin = typeof window === "undefined" ? "https://ice-app.de" : window.location.origin;

    Promise.all(
      checkpointQrs.map(async (checkpoint) => {
        const imageUrl = await QRCode.toDataURL(`${origin}${checkpoint.scan_path}`, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 512,
          color: {
            dark: "#2f2100",
            light: "#ffffff",
          },
        });
        return [checkpoint.checkpoint_id, imageUrl];
      })
    )
      .then((entries) => {
        if (!cancelled) {
          setQrImageMap(Object.fromEntries(entries));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError((current) => current || err.message || "QR-Bilder konnten nicht erzeugt werden.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [checkpointQrs]);

  const confirmRegistrationPayment = async (registration) => {
    if (!apiUrl) return;
    setBusyAction(`confirm-registration-${registration.id}`);
    try {
      const res = await fetch(`${apiUrl}/event2026/payments_manual_confirm.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          registration_id: registration.id,
          paid_amount: registration.payment.expected_amount,
        }),
      });
      const json = await readEventApiJson(res);
      if (!res.ok || json?.status !== "success") {
        throw new Error(getEventAccessErrorMessage(res.status, json?.message || "Zahlung konnte nicht bestätigt werden."));
      }
      setNotice("Zahlung wurde als bezahlt markiert.");
      setError("");
      await load();
    } catch (err) {
      setError(err.message || "Zahlung konnte nicht bestätigt werden.");
    } finally {
      setBusyAction("");
    }
  };

  const confirmAddonPayment = async (purchase) => {
    if (!apiUrl) return;
    setBusyAction(`confirm-addon-${purchase.id}`);
    try {
      const res = await fetch(`${apiUrl}/event2026/payments_manual_confirm.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          addon_purchase_id: purchase.id,
          paid_amount: purchase.expected_amount,
        }),
      });
      const json = await readEventApiJson(res);
      if (!res.ok || json?.status !== "success") {
        throw new Error(getEventAccessErrorMessage(res.status, json?.message || "Zusatzbestellung konnte nicht bestätigt werden."));
      }
      setNotice("Zusatzbestellung wurde als bezahlt markiert.");
      setError("");
      await load();
    } catch (err) {
      setError(err.message || "Zusatzbestellung konnte nicht bestätigt werden.");
    } finally {
      setBusyAction("");
    }
  };

  const sendReminder = async ({ scope, entityType = null, entityId = null, busyKey, successMessage }) => {
    if (!apiUrl) return;
    setBusyAction(busyKey);
    try {
      const res = await fetch(`${apiUrl}/event2026/reminder_send_manual.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          scope,
          entity_type: entityType,
          entity_id: entityId,
        }),
      });
      const json = await readEventApiJson(res);
      if (!res.ok || json?.status !== "success") {
        throw new Error(getEventAccessErrorMessage(res.status, json?.message || "Reminder konnte nicht gesendet werden."));
      }
      setNotice(json.message || successMessage || "Reminder wurde gesendet.");
      setError("");
      await load();
    } catch (err) {
      setError(err.message || "Reminder konnte nicht gesendet werden.");
    } finally {
      setBusyAction("");
    }
  };

  const recomputeWaves = async () => {
    if (!apiUrl) return;
    setBusyAction("recompute-waves");
    try {
      const res = await fetch(`${apiUrl}/event2026/waves_recompute.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          capacity: Number(waveCapacity) || 20,
        }),
      });
      const json = await readEventApiJson(res);
      if (!res.ok || json?.status !== "success") {
        throw new Error(getEventAccessErrorMessage(res.status, json?.message || "Startwellen konnten nicht berechnet werden."));
      }
      setNotice(json.message || "Startwellen wurden neu berechnet.");
      setError("");
      await load();
    } catch (err) {
      setError(err.message || "Startwellen konnten nicht berechnet werden.");
    } finally {
      setBusyAction("");
    }
  };

  const editWave = (wave) => {
    setWaveForm({
      waveId: wave.id,
      waveCode: wave.wave_code || "",
      routeKey: routeKeyForDistance(wave.distance_km),
      paceGroup: wave.pace_group || "24_27",
      startTime: formatDateTimeLocalInput(wave.start_time),
      capacity: wave.capacity || 20,
    });
  };

  const saveWave = async () => {
    if (!apiUrl) return;
    const route = ROUTE_OPTIONS.find((item) => item.key === waveForm.routeKey) || ROUTE_OPTIONS[1];
    const action = waveForm.waveId ? "update" : "create";
    setBusyAction("save-wave");
    try {
      const res = await fetch(`${apiUrl}/event2026/admin_waves.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          action,
          wave_id: waveForm.waveId,
          wave_code: waveForm.waveCode,
          distance_km: ADMIN_ROUTE_DISTANCE_BY_KEY[route.key] || route.distanceKm,
          pace_group: route.paceEnabled ? waveForm.paceGroup : "family",
          start_time: waveForm.startTime,
          capacity: Number(waveForm.capacity) || 20,
        }),
      });
      const json = await readEventApiJson(res);
      if (!res.ok || json?.status !== "success") {
        throw new Error(getEventAccessErrorMessage(res.status, json?.message || "Startwelle konnte nicht gespeichert werden."));
      }
      setNotice(json.message || "Startwelle wurde gespeichert.");
      setError("");
      setWaveForm(emptyWaveForm());
      await load();
    } catch (err) {
      setError(err.message || "Startwelle konnte nicht gespeichert werden.");
    } finally {
      setBusyAction("");
    }
  };

  const deleteWave = async (wave) => {
    if (!apiUrl || !wave?.id) return;
    setBusyAction(`delete-wave-${wave.id}`);
    try {
      const res = await fetch(`${apiUrl}/event2026/admin_waves.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ action: "delete", wave_id: wave.id }),
      });
      const json = await readEventApiJson(res);
      if (!res.ok || json?.status !== "success") {
        throw new Error(getEventAccessErrorMessage(res.status, json?.message || "Startwelle konnte nicht gelöscht werden."));
      }
      setNotice(json.message || "Startwelle wurde gelöscht.");
      setError("");
      if (waveForm.waveId === wave.id) setWaveForm(emptyWaveForm());
      await load();
    } catch (err) {
      setError(err.message || "Startwelle konnte nicht gelöscht werden.");
    } finally {
      setBusyAction("");
    }
  };

  const assignSlotToWave = async (slotId, waveId) => {
    if (!apiUrl || !slotId) return;
    setBusyAction(`assign-wave-${slotId}`);
    try {
      const action = waveId ? "assign" : "unassign";
      const res = await fetch(`${apiUrl}/event2026/admin_waves.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ action, slot_id: slotId, wave_id: waveId ? Number(waveId) : null }),
      });
      const json = await readEventApiJson(res);
      if (!res.ok || json?.status !== "success") {
        throw new Error(getEventAccessErrorMessage(res.status, json?.message || "Startwelle konnte nicht zugeordnet werden."));
      }
      setNotice(json.message || "Startwelle wurde zugeordnet.");
      setError("");
      await load();
    } catch (err) {
      setError(err.message || "Startwelle konnte nicht zugeordnet werden.");
    } finally {
      setBusyAction("");
    }
  };

  const requestRegistrationSort = (key) => {
    setRegistrationSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const renderRegistrationSortHeader = (key, label) => (
    <SortButton type="button" onClick={() => requestRegistrationSort(key)}>
      <span>{label}</span>
      <span>{registrationSort.key === key ? (registrationSort.direction === "asc" ? "▲" : "▼") : "↕"}</span>
    </SortButton>
  );

  const sortedRegistrations = useMemo(() => {
    const directionFactor = registrationSort.direction === "asc" ? 1 : -1;
    return [...(data?.registrations || [])].sort((a, b) => {
      const aValue = registrationSortValue(a, registrationSort.key);
      const bValue = registrationSortValue(b, registrationSort.key);
      if (registrationSort.key === "route_pace") {
        return defaultRegistrationSortValue(a).localeCompare(defaultRegistrationSortValue(b), "de-DE", { numeric: true, sensitivity: "base" }) * directionFactor;
      }
      if (typeof aValue === "number" && typeof bValue === "number") {
        return (aValue - bValue) * directionFactor;
      }
      return String(aValue).localeCompare(String(bValue), "de-DE", { numeric: true, sensitivity: "base" }) * directionFactor;
    });
  }, [data?.registrations, registrationSort]);

  const selectedRegistration = useMemo(
    () => data?.registrations?.find((registration) => registration.id === selectedRegistrationId) || null,
    [data, selectedRegistrationId]
  );

  const selectedAddon = useMemo(
    () => data?.addon_purchases?.find((purchase) => purchase.id === selectedAddonId) || null,
    [data, selectedAddonId]
  );

  const waveSummary = useMemo(() => {
    return (data?.waves || []).map((wave) => ({
      ...wave,
      routeKey: routeKeyForDistance(wave.distance_km),
      count: wave.assigned_count || 0,
    }));
  }, [data?.waves]);

  const selectedPrimarySlot = useMemo(
    () => selectedRegistration?.slots?.[0] || null,
    [selectedRegistration]
  );
  const liveCheckpointQrs = useMemo(
    () => checkpointQrs.filter((checkpoint) => checkpoint.mode === "live"),
    [checkpointQrs]
  );
  const testCheckpointQrs = useMemo(
    () => checkpointQrs.filter((checkpoint) => checkpoint.mode === "test"),
    [checkpointQrs]
  );

  const copyToClipboard = async (value, label) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch (err) {
      setError(`${label} konnte nicht kopiert werden.`);
    }
  };

  return (
    <Page>
      <Seo
        title="Ice-Tour Admin"
        description="Administrationsbereich der Ice-Tour 2026."
        robots="noindex,nofollow"
      />
      <Header />
      <Container>
        <Card>
          <h1 style={{ marginTop: 0, marginBottom: "0.35rem" }}>Admin-Übersicht</h1>
          <p style={{ margin: 0, color: "#7c4f00" }}>
            Kompakte Listen mit Auswahlansicht für Registrierungen, Zahlungen und Gutschein-Codes.
          </p>
        </Card>

        <Card>
          <SectionHeader>
            <div>
              <h2 style={{ margin: 0 }}>Checkpoint-QR-Codes</h2>
              <SectionText>
                Hier bekommst du die Live-QR-Codes für die fünf Ice-Tour Checkpoints. Sie öffnen die Ice-App-Startseite mit dem passenden Scan-Link. Teilnehmer werden von dort automatisch in die Event-Stempelkarte weitergeleitet, alle anderen bleiben auf der Startseite.
              </SectionText>
            </div>
            <div style={{ display: "flex", gap: "0.65rem", alignItems: "center", flexWrap: "wrap" }}>
              <Badge>{liveCheckpointQrs.length} Live-Codes</Badge>
              <SectionToggle type="button" onClick={() => setShowCheckpointQrs((current) => !current)}>
                {showCheckpointQrs ? "QR-Codes einklappen" : "QR-Codes anzeigen"}
              </SectionToggle>
            </div>
          </SectionHeader>

          {showCheckpointQrs && (
            <>
              <QrGrid>
                {liveCheckpointQrs.map((checkpoint) => {
                  const origin = typeof window === "undefined" ? "https://ice-app.de" : window.location.origin;
                  const targetUrl = `${origin}${checkpoint.scan_path}`;
                  return (
                    <QrCard key={`live-${checkpoint.checkpoint_id}`}>
                      <div>
                        <strong>{checkpoint.shop_name}</strong>
                        <SectionText style={{ marginTop: "0.25rem" }}>
                          Checkpoint {checkpoint.order_index} · {checkpoint.route_labels.join(", ")}
                        </SectionText>
                      </div>
                      {qrImageMap[checkpoint.checkpoint_id] && (
                        <QrImage src={qrImageMap[checkpoint.checkpoint_id]} alt={`QR-Code für ${checkpoint.shop_name}`} />
                      )}
                      <div>
                        <InfoLabel>Scan-Link</InfoLabel>
                        <MonoField value={targetUrl} readOnly />
                      </div>
                      <div>
                        <InfoLabel>Interner QR-Code</InfoLabel>
                        <MonoField value={checkpoint.qr_code} readOnly />
                      </div>
                      <ActionRow style={{ marginBottom: 0 }}>
                        <CopyButton type="button" onClick={() => copyToClipboard(targetUrl, "Scan-Link")}>Link kopieren</CopyButton>
                        <CopyButton type="button" onClick={() => copyToClipboard(checkpoint.qr_code, "QR-Code")}>Code kopieren</CopyButton>
                      </ActionRow>
                    </QrCard>
                  );
                })}
              </QrGrid>

              {testCheckpointQrs.length > 0 && (
                <>
                  <SectionHeader style={{ marginTop: "1rem" }}>
                    <div>
                      <h2 style={{ margin: 0 }}>Test-QR-Codes</h2>
                      <SectionText>Zusätzliche Test-Checkpoints für Admin und lokale Prüfung.</SectionText>
                    </div>
                    <Badge>{testCheckpointQrs.length} Test-Codes</Badge>
                  </SectionHeader>
                  <QrGrid>
                    {testCheckpointQrs.map((checkpoint) => {
                      const origin = typeof window === "undefined" ? "https://ice-app.de" : window.location.origin;
                      const targetUrl = `${origin}${checkpoint.scan_path}`;
                      return (
                        <QrCard key={`test-${checkpoint.checkpoint_id}`}>
                          <div>
                            <strong>{checkpoint.shop_name}</strong>
                            <SectionText style={{ marginTop: "0.25rem" }}>
                              Checkpoint {checkpoint.order_index} · Testmodus
                            </SectionText>
                          </div>
                          {qrImageMap[checkpoint.checkpoint_id] && (
                            <QrImage src={qrImageMap[checkpoint.checkpoint_id]} alt={`Test-QR-Code für ${checkpoint.shop_name}`} />
                          )}
                          <MonoField value={targetUrl} readOnly />
                        </QrCard>
                      );
                    })}
                  </QrGrid>
                </>
              )}
            </>
          )}
        </Card>

        {loading && <Card>Daten werden geladen…</Card>}
        {error && <Card style={{ color: "#9f1239" }}>{error}</Card>}
        {notice && <Card style={{ color: "#166534" }}>{notice}</Card>}

        {data && (
          <>
            <Card>
              <Grid>
                <SummaryBox><strong>Registrierungen</strong><div>{data.summary.registration_count}</div></SummaryBox>
                <SummaryBox><strong>Starter</strong><div>{data.summary.participant_count}</div></SummaryBox>
                <SummaryBox><strong>Gutscheine</strong><div>{data.summary.voucher_count}</div></SummaryBox>
                <SummaryBox><strong>Zusatzbestellungen</strong><div>{data.summary.addon_purchase_count || 0}</div></SummaryBox>
                <SummaryBox><strong>Offene Zusatzbestellungen</strong><div>{data.summary.open_addon_purchase_count || 0}</div></SummaryBox>
                <SummaryBox><strong>Offene Gutscheine</strong><div>{data.summary.open_voucher_count}</div></SummaryBox>
                <SummaryBox><strong>Eingelöste Gutscheine</strong><div>{data.summary.redeemed_voucher_count}</div></SummaryBox>
                <SummaryBox><strong>Soll gesamt</strong><div>{formatEuro(data.summary.expected_amount_total)}</div></SummaryBox>
                <SummaryBox><strong>Teilnahmebeiträge</strong><div>{formatEuro(data.summary.entry_fee_amount_total)}</div></SummaryBox>
                <SummaryBox><strong>Gutschein-Verkäufe</strong><div>{formatEuro(data.summary.gift_voucher_purchase_amount_total)}</div></SummaryBox>
                <SummaryBox><strong>Gutschein-Abzüge</strong><div>{formatEuro(data.summary.voucher_discount_amount_total)}</div></SummaryBox>
                <SummaryBox><strong>Zusätzliche Spenden</strong><div>{formatEuro(data.summary.donation_amount_total)}</div></SummaryBox>
                <SummaryBox><strong>Offene Zahlungs-Reminder</strong><div>{data.summary.registration_payment_reminder_candidate_count || 0}</div></SummaryBox>
                <SummaryBox><strong>Offene Gutschein-Reminder</strong><div>{data.summary.unused_voucher_reminder_candidate_count || 0}</div></SummaryBox>
                <SummaryBox><strong>Unverifizierte Accounts</strong><div>{data.summary.account_verification_reminder_candidate_count || 0}</div></SummaryBox>
              </Grid>
            </Card>

            <Card>
              <SectionHeader>
                <div>
                  <h2 style={{ margin: 0 }}>Startwellen</h2>
                  <SectionText>
                    Startwellen manuell anlegen, Startzeit setzen und Starter per Dropdown zuordnen. Die automatische Neuberechnung ersetzt die bestehenden Wellen.
                  </SectionText>
                </div>
                <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                  <div>
                    <InfoLabel>Max. Personen pro Welle</InfoLabel>
                    <NumberField
                      type="number"
                      min="1"
                      max="100"
                      value={waveCapacity}
                      onChange={(event) => setWaveCapacity(event.target.value)}
                    />
                  </div>
                  <ActionButton type="button" disabled={busyAction !== ""} onClick={recomputeWaves}>
                    Startwellen neu berechnen
                  </ActionButton>
                </div>
              </SectionHeader>

              <DetailSection style={{ marginBottom: "1rem" }}>
                <DetailTitle>{waveForm.waveId ? `Startwelle #${waveForm.waveId} bearbeiten` : "Startwelle anlegen"}</DetailTitle>
                <Grid>
                  <div>
                    <InfoLabel>Wellencode</InfoLabel>
                    <MonoField
                      value={waveForm.waveCode}
                      onChange={(event) => setWaveForm((current) => ({ ...current, waveCode: event.target.value }))}
                      placeholder="z. B. 145-A-0830"
                    />
                  </div>
                  <div>
                    <InfoLabel>Route</InfoLabel>
                    <SelectField
                      value={waveForm.routeKey}
                      onChange={(event) => {
                        const nextRoute = ROUTE_OPTIONS.find((route) => route.key === event.target.value);
                        setWaveForm((current) => ({
                          ...current,
                          routeKey: event.target.value,
                          paceGroup: nextRoute?.paceEnabled ? current.paceGroup : "family",
                        }));
                      }}
                    >
                      {ROUTE_OPTIONS.map((route) => (
                        <option key={route.key} value={route.key}>{route.label} ({ADMIN_ROUTE_DISTANCE_BY_KEY[route.key] || route.distanceKm} km)</option>
                      ))}
                    </SelectField>
                  </div>
                  <div>
                    <InfoLabel>Tempo</InfoLabel>
                    <SelectField
                      value={ROUTE_OPTIONS.find((route) => route.key === waveForm.routeKey)?.paceEnabled ? waveForm.paceGroup : "family"}
                      disabled={!ROUTE_OPTIONS.find((route) => route.key === waveForm.routeKey)?.paceEnabled}
                      onChange={(event) => setWaveForm((current) => ({ ...current, paceGroup: event.target.value }))}
                    >
                      {ROUTE_OPTIONS.find((route) => route.key === waveForm.routeKey)?.paceEnabled ? (
                        PACE_OPTIONS.map((pace) => <option key={pace.value} value={pace.value}>{pace.label}</option>)
                      ) : (
                        <option value="family">Freies Startfenster</option>
                      )}
                    </SelectField>
                  </div>
                  <div>
                    <InfoLabel>Startzeit</InfoLabel>
                    <MonoField
                      type="datetime-local"
                      value={waveForm.startTime}
                      onChange={(event) => setWaveForm((current) => ({ ...current, startTime: event.target.value }))}
                    />
                  </div>
                  <div>
                    <InfoLabel>Kapazität</InfoLabel>
                    <NumberField
                      type="number"
                      min="1"
                      max="200"
                      value={waveForm.capacity}
                      onChange={(event) => setWaveForm((current) => ({ ...current, capacity: event.target.value }))}
                    />
                  </div>
                </Grid>
                <ActionRow style={{ marginTop: "0.9rem", marginBottom: 0 }}>
                  <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
                    <ActionButton type="button" disabled={busyAction !== ""} onClick={saveWave}>
                      {waveForm.waveId ? "Startwelle speichern" : "Startwelle anlegen"}
                    </ActionButton>
                    {waveForm.waveId && (
                      <SecondaryButton type="button" disabled={busyAction !== ""} onClick={() => setWaveForm(emptyWaveForm())}>
                        Neue Startwelle
                      </SecondaryButton>
                    )}
                  </div>
                </ActionRow>
              </DetailSection>

              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <th>Welle</th>
                      <th>Route</th>
                      <th>Tempo</th>
                      <th>Startzeit</th>
                      <th>Teilnehmer</th>
                      <th>Kapazität</th>
                      <th>Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waveSummary.map((wave) => (
                      <tr key={wave.id}>
                        <td>{wave.wave_code}</td>
                        <td>{formatRouteShortWithDistance(wave.routeKey, wave.distance_km)}</td>
                        <td>{getPaceLabel(wave.pace_group)}</td>
                        <td>{formatDateTime(wave.start_time)}</td>
                        <td>{wave.count}</td>
                        <td>{wave.capacity}</td>
                        <td>
                          <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                            <SecondaryButton type="button" disabled={busyAction !== ""} onClick={() => editWave(wave)}>Bearbeiten</SecondaryButton>
                            <SecondaryButton type="button" disabled={busyAction !== ""} onClick={() => deleteWave(wave)}>Löschen</SecondaryButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {waveSummary.length === 0 && (
                      <tr>
                        <td colSpan={7}>Noch keine Startwellen angelegt.</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </TableWrap>
            </Card>

            <Card>
              <SectionHeader>
                <div>
                  <h2 style={{ margin: 0 }}>Registrierungen</h2>
                  <SectionText>
                    Standardansicht als Tabelle. Klicke auf eine Zeile, um rechts darunter die vollständigen Details zu sehen.
                  </SectionText>
                </div>
                <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", alignItems: "center" }}>
                  <Badge>{data.registrations.length} Einträge</Badge>
                  <SecondaryButton
                    type="button"
                    disabled={busyAction !== ""}
                    onClick={() =>
                      sendReminder({
                        scope: "registration_payment",
                        busyKey: "bulk-registration-reminder",
                        successMessage: "Zahlungs-Reminder wurden gesendet.",
                      })
                    }
                  >
                    Offene Zahlungen erinnern
                  </SecondaryButton>
                  <SecondaryButton
                    type="button"
                    disabled={busyAction !== ""}
                    onClick={() =>
                      sendReminder({
                        scope: "account_verification",
                        busyKey: "bulk-account-verification-reminder",
                        successMessage: "Account-Verifizierungs-Reminder wurden gesendet.",
                      })
                    }
                  >
                    Unverifizierte Accounts erinnern
                  </SecondaryButton>
                </div>
              </SectionHeader>

              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <th>{renderRegistrationSortHeader("id", "ID")}</th>
                      <th>{renderRegistrationSortHeader("account", "Account")}</th>
                      <th>{renderRegistrationSortHeader("participant", "Teilnehmer")}</th>
                      <th>{renderRegistrationSortHeader("reference", "Referenz")}</th>
                      <th>{renderRegistrationSortHeader("status", "Status")}</th>
                      <th>{renderRegistrationSortHeader("expected", "Soll")}</th>
                      <th>{renderRegistrationSortHeader("outstanding", "Offen")}</th>
                      <th>{renderRegistrationSortHeader("route", "Route")}</th>
                      <th>{renderRegistrationSortHeader("pace", "Tempo")}</th>
                      <th>{renderRegistrationSortHeader("wave", "Welle")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRegistrations.map((registration) => {
                      const primarySlot = registration.slots?.[0];
                      return (
                        <ClickableRow
                          key={registration.id}
                          $selected={registration.id === selectedRegistrationId}
                          onClick={() => {
                            setSelectedRegistrationId(registration.id);
                            setRegistrationDetailOpen(true);
                          }}
                        >
                          <td>#{registration.id}</td>
                          <td>{registration.registered_by.username || "-"}</td>
                          <td>{primarySlot?.full_name || "-"}</td>
                          <td>{registration.payment.reference_code}</td>
                          <td><Badge $tone={statusTone(registration.payment.status)}>{registration.payment.status}</Badge></td>
                          <td>{formatEuro(registration.payment.total_expected_amount ?? registration.payment.expected_amount)}</td>
                          <td>{formatEuro(registration.payment.total_outstanding_amount ?? registration.payment.outstanding_amount)}</td>
                          <td>{primarySlot ? formatRouteShortWithDistance(primarySlot.route_key, primarySlot.distance_km) : "-"}</td>
                          <td>{primarySlot ? getPaceLabel(primarySlot.pace_group) : "-"}</td>
                          <td>{primarySlot?.wave_code || "-"}</td>
                        </ClickableRow>
                      );
                    })}
                  </tbody>
                </Table>
              </TableWrap>
            </Card>

            {selectedRegistration && registrationDetailOpen && (
              <ModalOverlay role="presentation" onClick={() => setRegistrationDetailOpen(false)}>
                <ModalDialog role="dialog" aria-modal="true" aria-labelledby="registration-detail-title" onClick={(event) => event.stopPropagation()}>
                <ModalHeader>
                  <div>
                    <h2 id="registration-detail-title" style={{ margin: 0 }}>Details Registrierung #{selectedRegistration.id}</h2>
                    <SectionText>
                      Account: <strong>{selectedRegistration.registered_by.username || "-"}</strong> · Referenz: <strong>{selectedRegistration.payment.reference_code}</strong>
                    </SectionText>
                  </div>
                  <CloseButton type="button" onClick={() => setRegistrationDetailOpen(false)}>Schließen</CloseButton>
                </ModalHeader>
                <ActionRow>
                  <div />
                  <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
                    {selectedRegistration.payment.status !== "paid" && (
                      <>
                        <SecondaryButton
                          type="button"
                          disabled={busyAction !== ""}
                          onClick={() =>
                            sendReminder({
                              scope: "registration_payment",
                              entityType: "registration",
                              entityId: selectedRegistration.id,
                              busyKey: `registration-reminder-${selectedRegistration.id}`,
                              successMessage: "Zahlungs-Reminder wurde gesendet.",
                            })
                          }
                        >
                          Zahlungs-Reminder senden
                        </SecondaryButton>
                        <ActionButton
                          type="button"
                          disabled={busyAction !== ""}
                          onClick={() => confirmRegistrationPayment(selectedRegistration)}
                        >
                          Zahlung als bezahlt markieren
                        </ActionButton>
                      </>
                    )}
                    {selectedRegistration.open_voucher_count > 0 && (
                      <SecondaryButton
                        type="button"
                        disabled={busyAction !== ""}
                        onClick={() =>
                          sendReminder({
                            scope: "unused_vouchers",
                            entityType: "registration",
                            entityId: selectedRegistration.id,
                            busyKey: `registration-voucher-reminder-${selectedRegistration.id}`,
                            successMessage: "Gutschein-Reminder wurde gesendet.",
                          })
                        }
                      >
                        Gutschein-Reminder senden
                      </SecondaryButton>
                    )}
                    {selectedPrimarySlot?.linked_user_id && selectedPrimarySlot.linked_user_is_verified === false && (
                      <SecondaryButton
                        type="button"
                        disabled={busyAction !== ""}
                        onClick={() =>
                          sendReminder({
                            scope: "account_verification",
                            entityType: "account",
                            entityId: selectedPrimarySlot.linked_user_id,
                            busyKey: `account-verification-reminder-${selectedPrimarySlot.linked_user_id}`,
                            successMessage: "Account-Verifizierungs-Reminder wurde gesendet.",
                          })
                        }
                      >
                        Verifizierungs-Mail senden
                      </SecondaryButton>
                    )}
                  </div>
                </ActionRow>

                <DetailGrid>
                  <DetailSection>
                    <DetailTitle>Zahlung</DetailTitle>
                    <InfoList>
                      <InfoRow><InfoLabel>Status</InfoLabel><InfoValue>{selectedRegistration.payment.status}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Eigener Teilnahmebeitrag</InfoLabel><InfoValue>{formatEuro(selectedRegistration.payment.entry_fee_amount)}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Gutschein-Käufe</InfoLabel><InfoValue>{formatEuro(selectedRegistration.payment.gift_voucher_purchase_amount)} ({selectedRegistration.payment.gift_voucher_quantity} Codes)</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Gutschein-Abzug</InfoLabel><InfoValue>-{formatEuro(selectedRegistration.payment.voucher_discount_amount)}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Zusätzliche Spende</InfoLabel><InfoValue>{formatEuro(selectedRegistration.payment.donation_amount)}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Spätere Zusatzbestellungen</InfoLabel><InfoValue>{selectedRegistration.payment.addon_purchase_count || 0} Bestellungen, {selectedRegistration.payment.addon_gift_voucher_quantity || 0} Codes, {formatEuro(selectedRegistration.payment.addon_expected_amount || 0)}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Soll / Ist / Offen gesamt</InfoLabel><InfoValue>{formatEuro(selectedRegistration.payment.total_expected_amount ?? selectedRegistration.payment.expected_amount)} / {formatEuro(selectedRegistration.payment.total_paid_amount ?? selectedRegistration.payment.paid_amount)} / {formatEuro(selectedRegistration.payment.total_outstanding_amount ?? selectedRegistration.payment.outstanding_amount)}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Letzter Zahlungs-Reminder</InfoLabel><InfoValue>{formatReminderSummary(selectedRegistration.reminders?.payment)}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Letzter Gutschein-Reminder</InfoLabel><InfoValue>{formatReminderSummary(selectedRegistration.reminders?.voucher)}</InfoValue></InfoRow>
                    </InfoList>
                  </DetailSection>

                  <DetailSection style={{ gridColumn: "1 / -1" }}>
                    <DetailTitle>Registrierung & Starter</DetailTitle>
                    <InfoList>
                      <InfoRow><InfoLabel>Team / Verein</InfoLabel><InfoValue>{selectedRegistration.team_name || "-"}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Bemerkung</InfoLabel><InfoValue>{selectedRegistration.notes || "-"}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Name / E-Mail</InfoLabel><InfoValue>{selectedPrimarySlot ? <>{selectedPrimarySlot.full_name}<br />{selectedPrimarySlot.email}</> : "-"}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Route</InfoLabel><InfoValue>{selectedPrimarySlot ? `${selectedPrimarySlot.route_name} (${selectedPrimarySlot.distance_km} km)` : "-"}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Tempo</InfoLabel><InfoValue>{selectedPrimarySlot ? getPaceLabel(selectedPrimarySlot.pace_group) : "-"}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Linked Account</InfoLabel><InfoValue>{selectedPrimarySlot?.linked_user_id ? <AccountLink to={`/user/${selectedPrimarySlot.linked_user_id}`}>{selectedPrimarySlot.linked_username || `User #${selectedPrimarySlot.linked_user_id}`}</AccountLink> : "-"}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Account-Verifizierung</InfoLabel><InfoValue>{selectedPrimarySlot?.linked_user_id ? (selectedPrimarySlot.linked_user_is_verified ? "verifiziert" : "nicht verifiziert") : "-"}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Letzter Verifizierungs-Reminder</InfoLabel><InfoValue>{formatReminderSummary(selectedPrimarySlot?.account_verification_reminder)}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Bekleidung</InfoLabel><InfoValue>{selectedPrimarySlot ? `${selectedPrimarySlot.clothing_interest_label}${selectedPrimarySlot.jersey_size ? `, Trikot ${selectedPrimarySlot.jersey_size}` : ""}${selectedPrimarySlot.bib_size ? `, Hose ${selectedPrimarySlot.bib_size}` : ""}` : "-"}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Live-Karte</InfoLabel><InfoValue>{selectedPrimarySlot ? (selectedPrimarySlot.public_name_consent ? "Name sichtbar" : "Name verborgen") : "-"}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Starter-Status</InfoLabel><InfoValue>{selectedPrimarySlot?.license_status || "-"}</InfoValue></InfoRow>
                      <InfoRow>
                        <InfoLabel>Startwelle</InfoLabel>
                        <InfoValue style={{ minWidth: 260 }}>
                          {selectedPrimarySlot ? (
                            <SelectField
                              value={selectedPrimarySlot.wave_id || ""}
                              disabled={busyAction !== ""}
                              onChange={(event) => assignSlotToWave(selectedPrimarySlot.id, event.target.value)}
                            >
                              <option value="">Noch nicht zugeteilt</option>
                              {(data.waves || []).map((wave) => (
                                <option key={wave.id} value={wave.id}>
                                  {wave.wave_code} · {formatDateTime(wave.start_time)} · {wave.assigned_count}/{wave.capacity}
                                </option>
                              ))}
                            </SelectField>
                          ) : "-"}
                        </InfoValue>
                      </InfoRow>
                      <InfoRow><InfoLabel>Offene Geschenk-Codes</InfoLabel><InfoValue>{selectedRegistration.open_voucher_count || 0}</InfoValue></InfoRow>
                    </InfoList>
                  </DetailSection>

                  {selectedRegistration.gift_vouchers.length > 0 && (
                    <DetailSection style={{ gridColumn: "1 / -1" }}>
                      <DetailTitle>Gutschein-Codes</DetailTitle>
                      <TableWrap>
                        <Table>
                          <thead>
                            <tr>
                              <th>Code</th>
                              <th>Status</th>
                              <th>Eingelöst durch</th>
                              <th>Zeitpunkt</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedRegistration.gift_vouchers.map((voucher) => (
                              <tr key={voucher.id}>
                                <td>{voucher.code || `#${voucher.id}`}</td>
                                <td>{voucher.status}</td>
                                <td>{voucher.redeemed_by_registration_id || "-"}</td>
                                <td>{formatDateTime(voucher.redeemed_at || voucher.created_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </TableWrap>
                    </DetailSection>
                  )}
                </DetailGrid>
                </ModalDialog>
              </ModalOverlay>
            )}

            <Card>
              <SectionHeader>
                <div>
                  <h2 style={{ margin: 0 }}>Zusatzbestellungen</h2>
                  <SectionText>
                    Ebenfalls kompakt als Tabelle. Die Detailansicht erscheint erst nach Auswahl einer Bestellung.
                  </SectionText>
                </div>
                <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", alignItems: "center" }}>
                  <Badge>{data.addon_purchases?.length || 0} Einträge</Badge>
                  <SecondaryButton
                    type="button"
                    disabled={busyAction !== ""}
                    onClick={() =>
                      sendReminder({
                        scope: "unused_vouchers",
                        busyKey: "bulk-voucher-reminder",
                        successMessage: "Gutschein-Reminder wurden gesendet.",
                      })
                    }
                  >
                    Ungenutzte Gutscheine erinnern
                  </SecondaryButton>
                </div>
              </SectionHeader>

              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Käufer</th>
                      <th>Registrierung</th>
                      <th>Referenz</th>
                      <th>Status</th>
                      <th>Codes</th>
                      <th>Soll</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.addon_purchases || []).map((purchase) => (
                      <ClickableRow
                        key={purchase.id}
                        $selected={purchase.id === selectedAddonId}
                        onClick={() => setSelectedAddonId(purchase.id)}
                      >
                        <td>#{purchase.id}</td>
                        <td>{purchase.buyer.username || purchase.buyer.name || "-"}</td>
                        <td>{purchase.registration_id ? `#${purchase.registration_id}` : "ohne eigene Teilnahme"}</td>
                        <td>{purchase.payment_reference_code}</td>
                        <td><Badge $tone={statusTone(purchase.status)}>{purchase.status}</Badge></td>
                        <td>{purchase.gift_voucher_quantity}</td>
                        <td>{formatEuro(purchase.expected_amount)}</td>
                      </ClickableRow>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            </Card>

            {selectedAddon && (
              <Card>
                <ActionRow>
                  <div>
                    <h2 style={{ margin: 0 }}>Details Zusatzbestellung #{selectedAddon.id}</h2>
                    <SectionText>
                      Käufer: <strong>{selectedAddon.buyer.username || selectedAddon.buyer.name || "-"}</strong> · Referenz: <strong>{selectedAddon.payment_reference_code}</strong>
                    </SectionText>
                  </div>
                  <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
                    {selectedAddon.open_voucher_count > 0 && (
                      <SecondaryButton
                        type="button"
                        disabled={busyAction !== ""}
                        onClick={() =>
                          sendReminder({
                            scope: "unused_vouchers",
                            entityType: "addon_purchase",
                            entityId: selectedAddon.id,
                            busyKey: `addon-voucher-reminder-${selectedAddon.id}`,
                            successMessage: "Gutschein-Reminder wurde gesendet.",
                          })
                        }
                      >
                        Gutschein-Reminder senden
                      </SecondaryButton>
                    )}
                    {selectedAddon.status !== "paid" && (
                      <ActionButton
                        type="button"
                        disabled={busyAction !== ""}
                        onClick={() => confirmAddonPayment(selectedAddon)}
                      >
                        Zusatzbestellung als bezahlt markieren
                      </ActionButton>
                    )}
                  </div>
                </ActionRow>

                <DetailGrid>
                  <DetailSection>
                    <DetailTitle>Bestellinfos</DetailTitle>
                    <InfoList>
                      <InfoRow><InfoLabel>Status</InfoLabel><InfoValue>{selectedAddon.status}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>E-Mail</InfoLabel><InfoValue>{selectedAddon.buyer.email || "-"}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Registrierung</InfoLabel><InfoValue>{selectedAddon.registration_id ? `#${selectedAddon.registration_id}` : "ohne eigene Teilnahme"}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Gutschein-Codes</InfoLabel><InfoValue>{selectedAddon.gift_voucher_quantity}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Offene Gutschein-Codes</InfoLabel><InfoValue>{selectedAddon.open_voucher_count || 0}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Soll / Ist</InfoLabel><InfoValue>{formatEuro(selectedAddon.expected_amount)} / {formatEuro(selectedAddon.paid_amount)}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Letzter Gutschein-Reminder</InfoLabel><InfoValue>{formatReminderSummary(selectedAddon.reminders?.voucher)}</InfoValue></InfoRow>
                    </InfoList>
                  </DetailSection>

                  {selectedAddon.gift_vouchers?.length > 0 && (
                    <DetailSection>
                      <DetailTitle>Freigeschaltete Codes</DetailTitle>
                      <TableWrap>
                        <Table>
                          <thead>
                            <tr>
                              <th>Code</th>
                              <th>Status</th>
                              <th>Zeitpunkt</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedAddon.gift_vouchers.map((voucher) => (
                              <tr key={`addon-voucher-${voucher.id}`}>
                                <td>{voucher.code || `#${voucher.id}`}</td>
                                <td>{voucher.status}</td>
                                <td>{formatDateTime(voucher.redeemed_at || voucher.created_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </TableWrap>
                    </DetailSection>
                  )}
                </DetailGrid>
              </Card>
            )}
          </>
        )}
      </Container>
      <Footer />
    </Page>
  );
}
