import React, { useEffect, useMemo, useState } from "react";
import styled, { css } from "styled-components";
import {
  Bike, BookLock, ExternalLink, Footprints, HelpCircle, Map, MessageCircle,
  MountainSnow, SignalHigh, SignalLow, SignalMedium
} from "lucide-react";
import { useUser } from "../context/UserContext";
import MentionFormatter from "./MentionFormatter";
import SubmitRouteForm from "../SubmitRouteModal";
import { ActivityCard as Card, ActivityHeader, ActivityChipLink, ActivityChip, ShopButton, SHOP_COLORS, ActivityMetaRow, ActivityDate, ActivityUserHeader, ActivityHeaderText, ActivityLink as UserLink, ActivitySocialActions as SocialActions, ActivityCommentButton as CommentToggle } from "../styles/ShopUi";
import { formatActivityDate } from '../utils/activityFeed';
import CommentSection from "./CommentSection";
import UserAvatar from "./UserAvatar";
import LikeButton from "./LikeButton";

const BORDER = SHOP_COLORS.border;
const ACCENT_SOFT = "#fff3da";
const TEXT_MUTED = SHOP_COLORS.muted;

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
      <Card>
        <ActivityHeader>
          <ActivityUserHeader>
            <UserAvatar userId={route.nutzer_id} name={route.username || route.nutzer_name} avatarUrl={route.avatar_url} />
            <ActivityHeaderText><strong><UserLink to={`/user/${route.nutzer_id}`}>{route.username || route.nutzer_name || "Unbekannt"}</UserLink></strong> hat eine Route geteilt.</ActivityHeaderText>
          </ActivityUserHeader>
          <ActivityMetaRow><ActivityDate dateTime={route.erstellt_am}>{formatActivityDate(route.erstellt_am)}</ActivityDate></ActivityMetaRow>
        </ActivityHeader>
          <TitleArea>
            <RouteName>{route.name || "Unbenannte Route"}</RouteName>
            <BadgeRow>
              {route.typ && <Badge><TypeIcon size={15} />{route.typ}</Badge>}
              {difficulty && <Badge $color={difficulty.color} $background={difficulty.background}><difficulty.Icon size={15} />{route.schwierigkeit}</Badge>}
              {isPrivate && <Badge $variant="private"><BookLock size={15} />Privat</Badge>}
            </BadgeRow>
          </TitleArea>

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
          {route.url && <PrimaryLink $primary href={route.url} target="_blank" rel="noopener noreferrer">Externe Route öffnen <ExternalLink size={17} /></PrimaryLink>}
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
      </Card>

      {showEditModal && <SubmitRouteForm shopId={contextShopId} shopName={contextShopName} showForm={showEditModal} setShowForm={setShowEditModal} existingRoute={route} onSuccess={onSuccess} />}
    </>
  );
};

export default RouteCard;

const TitleArea = styled.div`min-width: 0;`;
const RouteName = styled.h3`margin: 0; color: #2f2100; font-size: clamp(1.2rem, 2vw, 1.45rem); line-height: 1.2;`;
const BadgeRow = styled.div`display: flex; flex-wrap: wrap; gap: 0.45rem; margin-top: 0.65rem;`;
const Badge = styled(ActivityChip)`
  color: ${({ $color }) => $color || '#78560e'}; background: ${({ $background }) => $background || SHOP_COLORS.soft};
  ${({ $variant }) => $variant === 'private' && css`color: ${SHOP_COLORS.muted}; background: #fff; border-color: ${SHOP_COLORS.border};`}
`;
const Description = styled.p`margin: 1rem 0; color: ${TEXT_MUTED}; white-space: pre-wrap; line-height: 1.45;`;
const StatsRow = styled.div`display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.65rem; @media (max-width: 480px) { gap: 0.45rem; }`;
const Stat = styled.div`padding: 0.72rem; min-width: 0; border-radius: 12px; background: ${ACCENT_SOFT};`;
const StatLabel = styled.div`font-size: .76rem; color: ${SHOP_COLORS.muted};`;
const StatValue = styled.div`margin-top: 0.12rem; color: #2f2100; font-size: clamp(0.92rem, 3vw, 1.08rem); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
const StopsSection = styled.section`margin-top: 1rem;`;
const StopsHeading = styled.h4`margin: 0 0 0.5rem; color: #2f2100; font-size: 0.9rem; span { color: ${TEXT_MUTED}; font-weight: 600; }`;
const StopsList = styled.div`display: flex; flex-wrap: wrap; gap: 0.45rem;`;
const ShopPill = ActivityChipLink;
const PrimaryActions = styled.div`display: flex; flex-wrap: wrap; gap: 0.55rem; margin-top: 1.15rem;`;
const PrimaryLink = styled(ShopButton).attrs({ as: 'a' })``;
const SecondaryButton = ShopButton;
const EditButton = ShopButton;
const EmbedWrapper = styled.div`margin-top: 1rem; overflow: hidden; border-radius: 14px; border: 1px solid ${BORDER}; iframe, .strava-embed-placeholder { display: block; width: 100%; min-height: 320px; border: 0; }`;
