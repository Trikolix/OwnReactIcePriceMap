import React, { useEffect, useMemo, useState } from "react";
import styled, { css } from "styled-components";
import { Link } from "react-router-dom";
import {
  Bike, BookLock, ExternalLink, Footprints, HelpCircle, Map, MessageCircle,
  MountainSnow, SignalHigh, SignalLow, SignalMedium
} from "lucide-react";
import { useUser } from "../context/UserContext";
import MentionFormatter from "./MentionFormatter";
import SubmitRouteForm from "../SubmitRouteModal";
import { Card } from "../styles/SharedStyles";
import CommentSection from "./CommentSection";
import UserAvatar from "./UserAvatar";
import LikeButton from "./LikeButton";

const BORDER = "rgba(47, 33, 0, 0.09)";
const ACCENT = "#ffb522";
const ACCENT_DARK = "#8a5700";
const ACCENT_SOFT = "#fff3da";
const TEXT_MUTED = "#5f4a25";

const toNumberOrNull = (value) => {
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
};

const formatDistance = (value) => {
  const number = toNumberOrNull(value);
  return number === null ? "—" : `${number.toFixed(1)} km`;
};

const formatElevation = (value) => {
  const number = toNumberOrNull(value);
  return number === null ? "—" : `${number.toLocaleString("de-DE")} hm`;
};

const formatCreatedAt = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unbekannt";
  return `${date.toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" })} · ${date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`;
};

const extractIframeSrc = (embedCode = "") => String(embedCode).match(/<iframe[^>]+src=["']([^"']+)["']/i)?.[1] || "";
const getKomootTourId = (value = "") => String(value).match(/komoot\.(?:com|de)\/(?:[a-z-]+\/)?tour\/(\d+)/i)?.[1] || "";

const getShareToken = (value = "") => {
  const decoded = String(value || "").replace(/&amp;/g, "&");
  try {
    return new URL(decoded).searchParams.get("share_token") || "";
  } catch {
    const match = decoded.match(/[?&]share_token=([^&#"']+)/i);
    return match?.[1] ? decodeURIComponent(match[1]) : "";
  }
};

const buildRouteEmbedMarkup = (route) => {
  const embedCode = route.embed_code?.trim() || "";
  const routeUrl = String(route.url || "");
  const isKomootEmbed = embedCode.includes("komoot.") || routeUrl.includes("komoot.");
  if (!embedCode && !isKomootEmbed) return "";
  if (!isKomootEmbed) return embedCode;

  const tourId = getKomootTourId(routeUrl) || getKomootTourId(extractIframeSrc(embedCode));
  const shareToken = route.komoot_share_token || getShareToken(routeUrl) || getShareToken(extractIframeSrc(embedCode)) || getShareToken(embedCode);
  if (!tourId || !shareToken) return "";

  return `<iframe src="https://www.komoot.com/de-de/tour/${tourId}/embed?share_token=${encodeURIComponent(shareToken)}&layout=map" width="100%" height="440" frameborder="0" scrolling="no" title="Route auf Komoot"></iframe>`;
};

const getTypeIcon = (type = "") => {
  switch (type.toLowerCase()) {
    case "rennrad":
    case "gravel": return Bike;
    case "mtb": return MountainSnow;
    case "wanderung": return Footprints;
    default: return HelpCircle;
  }
};

const getDifficulty = (difficulty = "") => {
  switch (difficulty.toLowerCase()) {
    case "leicht": return { Icon: SignalLow, color: "#217a42", background: "#eafbe9" };
    case "mittel": return { Icon: SignalMedium, color: "#8d6900", background: "#fff8dd" };
    case "schwer": return { Icon: SignalHigh, color: "#b91c1c", background: "#fff0f0" };
    default: return null;
  }
};

const RouteCard = ({ route, shopId, shopName, onSuccess, showComments = false, focusCommentId = null }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [areCommentsVisible, setAreCommentsVisible] = useState(showComments);
  const { userId } = useUser();

  const routeShops = useMemo(() => {
    if (route.eisdielen?.length) return route.eisdielen;
    return route.eisdiele_name ? [{ id: route.eisdiele_id, name: route.eisdiele_name }] : [];
  }, [route.eisdielen, route.eisdiele_id, route.eisdiele_name]);

  const embedMarkup = useMemo(() => buildRouteEmbedMarkup(route), [route]);
  const hasEmbed = Boolean(embedMarkup);
  const isOwner = Number(route.nutzer_id) === Number(userId);
  const isPrivate = String(route.ist_oeffentlich) !== "1";
  const TypeIcon = getTypeIcon(route.typ);
  const difficulty = getDifficulty(route.schwierigkeit);
  const contextShopId = shopId || routeShops[0]?.id || null;
  const contextShopName = shopName || routeShops[0]?.name || null;

  useEffect(() => {
    if (showComments) setAreCommentsVisible(true);
  }, [showComments]);

  useEffect(() => {
    if (!showEmbed || !embedMarkup.includes("strava-embed-placeholder")) return;
    document.getElementById("strava-embed-script")?.remove();
    const script = document.createElement("script");
    script.id = "strava-embed-script";
    script.src = "https://strava-embeds.com/embed.js";
    script.async = true;
    document.body.appendChild(script);
  }, [showEmbed, embedMarkup]);

  return (
    <>
      <StyledCard>
        <CardHeader>
          <TitleArea>
            <RouteName>{route.name || "Unbenannte Route"}</RouteName>
            <BadgeRow>
              {route.typ && <Badge><TypeIcon size={15} />{route.typ}</Badge>}
              {difficulty && <Badge $color={difficulty.color} $background={difficulty.background}><difficulty.Icon size={15} />{route.schwierigkeit}</Badge>}
              {isPrivate && <Badge $variant="private"><BookLock size={15} />Privat</Badge>}
            </BadgeRow>
          </TitleArea>
          <AuthorMeta>
            <UserAvatar userId={route.nutzer_id} name={route.username || route.nutzer_name} avatarUrl={route.avatar_url} size={40} />
            <div>
              <AuthorLine>von <UserLink to={`/user/${route.nutzer_id}`}>{route.username || route.nutzer_name || "Unbekannt"}</UserLink></AuthorLine>
              <DateText dateTime={route.erstellt_am}>{formatCreatedAt(route.erstellt_am)}</DateText>
            </div>
          </AuthorMeta>
        </CardHeader>

        {route.beschreibung && <Description><MentionFormatter text={route.beschreibung} /></Description>}

        <StatsRow aria-label="Tourdaten">
          <Stat><StatLabel>Länge</StatLabel><StatValue>{formatDistance(route.laenge_km)}</StatValue></Stat>
          <Stat><StatLabel>Höhenmeter</StatLabel><StatValue>{formatElevation(route.hoehenmeter)}</StatValue></Stat>
          <Stat><StatLabel>Eis-Stopps</StatLabel><StatValue>{routeShops.length}</StatValue></Stat>
        </StatsRow>

        {routeShops.length > 0 && (
          <StopsSection>
            <StopsHeading>Eis-Stopps <span>({routeShops.length})</span></StopsHeading>
            <StopsList>{routeShops.map((shop) => <ShopPill key={`${route.id}-${shop.id}`} to={`/map/activeShop/${shop.id}`}>{shop.name}</ShopPill>)}</StopsList>
          </StopsSection>
        )}

        <PrimaryActions>
          {route.url && <PrimaryLink href={route.url} target="_blank" rel="noopener noreferrer">Externe Route öffnen <ExternalLink size={17} /></PrimaryLink>}
          {hasEmbed && <SecondaryButton type="button" onClick={() => setShowEmbed((visible) => !visible)} aria-expanded={showEmbed}><Map size={18} />{showEmbed ? "Karte ausblenden" : "Karte anzeigen"}</SecondaryButton>}
          {isOwner && <EditButton type="button" onClick={() => setShowEditModal(true)}>Bearbeiten</EditButton>}
        </PrimaryActions>

        {showEmbed && hasEmbed && <EmbedWrapper dangerouslySetInnerHTML={{ __html: embedMarkup }} />}

        <SocialActions>
          <LikeButton entityType="route" entityId={route.id} initialLikesCount={route.likes_count} initialHasLiked={route.has_liked} compact />
          <CommentToggle type="button" aria-expanded={areCommentsVisible} onClick={() => setAreCommentsVisible((visible) => !visible)}>
            <MessageCircle size={18} />{route.commentCount || 0} Kommentar{Number(route.commentCount) === 1 ? "" : "e"}
          </CommentToggle>
        </SocialActions>
        {areCommentsVisible && <CommentSection routeId={route.id} type="route" focusCommentId={focusCommentId} focusLatestComment={Boolean(showComments)} />}
      </StyledCard>

      {showEditModal && <SubmitRouteForm shopId={contextShopId} shopName={contextShopName} showForm={showEditModal} setShowForm={setShowEditModal} existingRoute={route} onSuccess={onSuccess} />}
    </>
  );
};

export default RouteCard;

const StyledCard = styled(Card)`
  margin: 0;
  padding: clamp(1rem, 2.4vw, 1.5rem);
  border: 1px solid ${BORDER};
  background: radial-gradient(circle at top right, rgba(255, 181, 34, 0.1), transparent 38%), rgba(255, 255, 255, 0.97);
`;
const CardHeader = styled.header`
  display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start;
  @media (max-width: 600px) { flex-direction: column; }
`;
const TitleArea = styled.div`min-width: 0;`;
const RouteName = styled.h3`margin: 0; color: #2f2100; font-size: clamp(1.2rem, 2vw, 1.45rem); line-height: 1.2;`;
const BadgeRow = styled.div`display: flex; flex-wrap: wrap; gap: 0.45rem; margin-top: 0.65rem;`;
const Badge = styled.span`
  display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.28rem 0.6rem; border-radius: 999px;
  font-size: 0.8rem; font-weight: 700; color: ${({ $color }) => $color || ACCENT_DARK}; background: ${({ $background }) => $background || ACCENT_SOFT};
  border: 1px solid ${({ $color }) => $color || "rgba(217, 145, 0, 0.7)"};
  ${({ $variant }) => $variant === "private" && css`color: #5f4a25; background: #fff; border-color: rgba(47, 33, 0, 0.2);`}
`;
const AuthorMeta = styled.div`display: flex; align-items: center; gap: 0.55rem; flex: 0 0 auto; color: ${TEXT_MUTED}; @media (max-width: 600px) { order: -1; }`;
const AuthorLine = styled.div`font-size: 0.88rem; font-weight: 600; white-space: nowrap;`;
const UserLink = styled(Link)`color: ${ACCENT_DARK}; text-decoration: none; &:hover { text-decoration: underline; } &:focus-visible { outline: 3px solid rgba(255, 181, 34, 0.35); border-radius: 3px; }`;
const DateText = styled.time`display: block; margin-top: 0.1rem; color: rgba(47, 33, 0, 0.58); font-size: 0.75rem; white-space: nowrap;`;
const Description = styled.p`margin: 1rem 0; color: ${TEXT_MUTED}; white-space: pre-wrap; line-height: 1.45;`;
const StatsRow = styled.div`display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.65rem; @media (max-width: 480px) { gap: 0.45rem; }`;
const Stat = styled.div`padding: 0.72rem; min-width: 0; border-radius: 12px; background: ${ACCENT_SOFT};`;
const StatLabel = styled.div`font-size: 0.76rem; color: #6f6f8d;`;
const StatValue = styled.div`margin-top: 0.12rem; color: #2f2100; font-size: clamp(0.92rem, 3vw, 1.08rem); font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
const StopsSection = styled.section`margin-top: 1rem;`;
const StopsHeading = styled.h4`margin: 0 0 0.5rem; color: #2f2100; font-size: 0.9rem; span { color: ${TEXT_MUTED}; font-weight: 600; }`;
const StopsList = styled.div`display: flex; flex-wrap: wrap; gap: 0.45rem;`;
const ShopPill = styled(Link)`padding: 0.35rem 0.65rem; border-radius: 999px; border: 1px solid rgba(255, 181, 34, 0.6); background: rgba(255, 181, 34, 0.1); color: ${ACCENT_DARK}; font-size: 0.82rem; text-decoration: none; &:hover { background: rgba(255, 181, 34, 0.2); } &:focus-visible { outline: 3px solid rgba(255, 181, 34, 0.35); }`;
const PrimaryActions = styled.div`display: flex; flex-wrap: wrap; gap: 0.55rem; margin-top: 1.15rem;`;
const baseAction = css`display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; min-height: 38px; padding: 0.5rem 0.7rem; border-radius: 9px; font: inherit; font-size: 0.82rem; font-weight: 800; cursor: pointer; transition: transform .15s ease, background .15s ease; &:hover { transform: translateY(-1px); } &:focus-visible { outline: 3px solid rgba(255, 181, 34, 0.4); outline-offset: 2px; }`;
const PrimaryLink = styled.a`${baseAction}; background: ${ACCENT}; color: #2f2100; text-decoration: none; border: 1px solid rgba(255, 181, 34, .75); &:hover { background: #ffc34a; }`;
const SecondaryButton = styled.button`${baseAction}; background: #fff; color: ${ACCENT_DARK}; border: 1px solid rgba(47, 33, 0, .16); &:hover { background: #fff8e8; }`;
const EditButton = styled.button`${baseAction}; background: transparent; color: #6b4a00; border: 1px solid transparent; &:hover { background: rgba(255, 181, 34, .12); }`;
const EmbedWrapper = styled.div`margin-top: 1rem; overflow: hidden; border-radius: 14px; border: 1px solid ${BORDER}; iframe, .strava-embed-placeholder { display: block; width: 100%; min-height: 320px; border: 0; }`;
const SocialActions = styled.div`display: flex; align-items: center; flex-wrap: wrap; gap: 0.9rem; min-height: 28px; margin-top: 0.85rem; padding-top: 0.65rem; border-top: 1px solid ${BORDER};`;
const CommentToggle = styled.button`display: inline-flex; align-items: center; gap: 0.3rem; min-height: 28px; padding: 0; border: 0; border-radius: 6px; background: transparent; color: ${ACCENT_DARK}; font: inherit; font-size: .85rem; font-weight: 700; line-height: 1; cursor: pointer; &:hover { text-decoration: underline; } &:focus-visible { outline: 3px solid rgba(255, 181, 34, .35); }`;
