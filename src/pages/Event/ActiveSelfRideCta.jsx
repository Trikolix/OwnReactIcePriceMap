import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { MapPin, Minus } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { getApiBaseUrl } from "../../shared/api/client";
import { readEventApiJson } from "./eventAuthMessages";

const STORAGE_KEY = "eventSelfRideCtaMinimized";

function readMinimizedPreference() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeMinimizedPreference(value) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "true" : "false");
  } catch {
    // The CTA should still work when browser storage is unavailable.
  }
}

export default function ActiveSelfRideCta() {
  const location = useLocation();
  const { isLoggedIn, authToken } = useUser();
  const apiBase = getApiBaseUrl();
  const [activeRide, setActiveRide] = useState(null);
  const [isMinimized, setIsMinimized] = useState(readMinimizedPreference);

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

  const minimize = () => {
    writeMinimizedPreference(true);
    setIsMinimized(true);
  };

  const expand = () => {
    writeMinimizedPreference(false);
    setIsMinimized(false);
  };

  if (isMinimized) {
    return (
      <MiniButton
        type="button"
        onClick={expand}
        aria-label="Self-Ride CTA wieder anzeigen"
        title="Self-Ride CTA wieder anzeigen"
      >
        <MapPin size={18} />
      </MiniButton>
    );
  }

  return (
    <FloatingShell>
      <FloatingLink to="/event-stamp-card?mode=self_ride">
        <IconWrap>
          <MapPin size={18} />
        </IconWrap>
        <TextWrap>
          <strong>Self-Ride Ice-Tour aktiv</strong>
          <span>Zur Stempelkarte</span>
        </TextWrap>
      </FloatingLink>
      <MinimizeButton
        type="button"
        onClick={minimize}
        aria-label="Self-Ride CTA minimieren"
        title="Minimieren"
      >
        <Minus size={16} />
      </MinimizeButton>
    </FloatingShell>
  );
}

const FloatingBase = styled.div`
  position: fixed;
  right: max(0.85rem, env(safe-area-inset-right));
  bottom: max(0.85rem, env(safe-area-inset-bottom));
  z-index: 1900;
`;

const FloatingShell = styled(FloatingBase)`
  display: inline-flex;
  align-items: center;
  max-width: min(360px, calc(100vw - 1.7rem));
  border-radius: 999px;
  border: 1px solid rgba(255, 181, 34, 0.72);
  background: rgba(47, 33, 0, 0.95);
  color: #fff8ea;
  box-shadow: 0 14px 36px rgba(47, 33, 0, 0.24);
  box-sizing: border-box;
  overflow: hidden;

  @media (max-width: 640px) {
    left: max(0.72rem, env(safe-area-inset-left));
    right: max(0.72rem, env(safe-area-inset-right));
  }
`;

const FloatingLink = styled(Link)`
  min-width: 0;
  flex: 1 1 auto;
  display: inline-flex;
  align-items: center;
  gap: 0.62rem;
  padding: 0.62rem 0.48rem 0.62rem 0.78rem;
  color: inherit;
  text-decoration: none;
  box-sizing: border-box;

  @media (max-width: 640px) {
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

const MinimizeButton = styled.button`
  flex: 0 0 auto;
  width: 42px;
  align-self: stretch;
  border: 0;
  border-left: 1px solid rgba(255, 181, 34, 0.28);
  background: transparent;
  color: #ffe7ad;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background: rgba(255, 181, 34, 0.14);
    color: #ffffff;
    outline: none;
  }
`;

const MiniButton = styled(FloatingBase).attrs({ as: "button" })`
  right: max(0rem, env(safe-area-inset-right));
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid rgba(255, 181, 34, 0.78);
  border-right: 0;
  border-radius: 999px 0 0 999px;
  background: rgba(47, 33, 0, 0.95);
  color: #ffb522;
  box-shadow: 0 12px 28px rgba(47, 33, 0, 0.24);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &::after {
    content: "";
    position: absolute;
    right: 8px;
    top: 8px;
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #ff5630;
    box-shadow: 0 0 0 2px rgba(47, 33, 0, 0.95);
  }

  &:hover,
  &:focus-visible {
    background: #ffb522;
    color: #2f2100;
    outline: none;
  }

  @media (max-width: 640px) {
    bottom: max(0.72rem, env(safe-area-inset-bottom));
  }
`;
