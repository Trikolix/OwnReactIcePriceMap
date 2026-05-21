import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { MapPin } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { getApiBaseUrl } from "../../shared/api/client";
import { readEventApiJson } from "./eventAuthMessages";

export default function ActiveSelfRideCta() {
  const location = useLocation();
  const { isLoggedIn, authToken } = useUser();
  const apiBase = getApiBaseUrl();
  const [activeRide, setActiveRide] = useState(null);

  const isSelfRideStampCard = location.pathname === "/event-stamp-card"
    && new URLSearchParams(location.search).get("mode") === "self_ride";

  useEffect(() => {
    if (!isLoggedIn || !apiBase) {
      setActiveRide(null);
      return undefined;
    }

    let cancelled = false;
    const controller = new AbortController();

    fetch(`${apiBase}/event2026/self_ride.php`, {
      signal: controller.signal,
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    })
      .then(async (response) => {
        const json = await readEventApiJson(response);
        if (!response.ok || json?.status !== "success") {
          return null;
        }
        return json?.today_ride?.stamping_open ? json.today_ride : null;
      })
      .then((ride) => {
        if (!cancelled) {
          setActiveRide(ride);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setActiveRide(null);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [apiBase, authToken, isLoggedIn, location.pathname, location.search]);

  if (!activeRide || isSelfRideStampCard) {
    return null;
  }

  const expiresAt = activeRide.expires_at
    ? new Date(activeRide.expires_at.replace(" ", "T")).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <FloatingLink to="/event-stamp-card?mode=self_ride">
      <IconWrap>
        <MapPin size={18} />
      </IconWrap>
      <TextWrap>
        <strong>Self-Ride aktiv</strong>
        <span>{expiresAt ? `Stempelkarte bis ${expiresAt} Uhr` : "Stempelkarte öffnen"}</span>
      </TextWrap>
    </FloatingLink>
  );
}

const FloatingLink = styled(Link)`
  position: fixed;
  right: max(0.85rem, env(safe-area-inset-right));
  bottom: max(0.85rem, env(safe-area-inset-bottom));
  z-index: 1900;
  display: inline-flex;
  align-items: center;
  gap: 0.62rem;
  max-width: min(360px, calc(100vw - 1.7rem));
  padding: 0.62rem 0.78rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 181, 34, 0.72);
  background: rgba(47, 33, 0, 0.95);
  color: #fff8ea;
  text-decoration: none;
  box-shadow: 0 14px 36px rgba(47, 33, 0, 0.24);
  box-sizing: border-box;

  @media (max-width: 640px) {
    left: max(0.72rem, env(safe-area-inset-left));
    right: max(0.72rem, env(safe-area-inset-right));
    justify-content: center;
  }
`;

const IconWrap = styled.span`
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ffb522;
  color: #2f2100;
`;

const TextWrap = styled.span`
  min-width: 0;
  display: grid;
  gap: 0.08rem;

  strong {
    font-size: 0.92rem;
    line-height: 1.1;
  }

  span {
    color: #ffe7ad;
    font-size: 0.78rem;
    line-height: 1.15;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;
