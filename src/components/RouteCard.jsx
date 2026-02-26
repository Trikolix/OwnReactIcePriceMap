import React, { useMemo, useState } from "react";
import styled, { css } from "styled-components";
import { useUser } from "../context/UserContext";
import { Link } from "react-router-dom";
import SubmitRouteForm from "../SubmitRouteModal";
import { Card } from "../styles/SharedStyles";
import CommentSection from "./CommentSection";
import UserAvatar from "./UserAvatar";
import {
  Bike, MountainSnow, Footprints, SignalHigh, SignalMedium, SignalLow, BookLock, HelpCircle,
  ExternalLink, MessageCircle
} from "lucide-react";

const BORDER = "#ebe9f5";
const ACCENT = "#ffb522";
const ACCENT_DARK = "#d99100";
const ACCENT_SOFT = "#fff3da";
const TEXT_MUTED = "#4a4a68";

const toNumberOrNull = (value) => {
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const formatDistance = (value) => {
  const num = toNumberOrNull(value);
  return num === null ? "—" : `${num.toFixed(1)} km`;
};

const formatElevation = (value) => {
  const num = toNumberOrNull(value);
  return num === null ? "—" : `${num.toLocaleString("de-DE")} hm`;
};

const formatCreatedAt = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unbekannt";
  }
  const datePart = date.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} • ${timePart}`;
};

const RouteCard = ({ route, shopId, shopName, onSuccess, showComments = false }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const { userId } = useUser();

  const routeShops = useMemo(() => {
    if (route.eisdielen && route.eisdielen.length) {
      return route.eisdielen;
    }
    if (route.eisdiele_name) {
      return [{ id: route.eisdiele_id, name: route.eisdiele_name }];
    }
    return [];
  }, [route.eisdielen, route.eisdiele_id, route.eisdiele_name]);

  const contextShopId = shopId || routeShops[0]?.id || null;
  const contextShopName = shopName || routeShops[0]?.name || null;

  const isOwner = Number(route.nutzer_id) === Number(userId);
  const isPrivate = String(route.ist_oeffentlich) !== "1";
  const hasEmbed = Boolean(route.embed_code && route.embed_code.trim() !== "");
  const eisdielenCount = routeShops.length;
  const [areCommentsVisible, setAreCommentsVisible] = useState(showComments);

  const toggleEmbed = () => setShowEmbed((prev) => !prev);

  return (
    <>
      <StyledCard>
        <DateText dateTime={route.erstellt_am}>{formatCreatedAt(route.erstellt_am)}</DateText>

        <HeaderRow>
          <div>
            <RouteName>{route.name || "Unbenannte Route"}</RouteName>
            <MetaRow>
              {route.typ && (() => {
                let Icon = null;
                switch ((route.typ || '').toLowerCase()) {
                  case 'rennrad':
                    Icon = Bike;
                    break;
                  case 'mtb':
                    Icon = MountainSnow;
                    break;
                  case 'gravel':
                    Icon = Bike;
                    break;
                  case 'wanderung':
                    Icon = Footprints;
                    break;
                  default:
                    Icon = HelpCircle;
                }
                return (
                  <MetaBadge style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {Icon && <Icon size={16} style={{ marginRight: 6 }} />}
                    {route.typ}
                  </MetaBadge>
                );
              })()}
              {route.schwierigkeit && (() => {
                let Icon = null, color = ACCENT_DARK, bg = ACCENT_SOFT, border = ACCENT_DARK;
                switch ((route.schwierigkeit || '').toLowerCase()) {
                  case 'leicht':
                    Icon = SignalLow;
                    color = '#219150';
                    bg = '#eafbe9';
                    border = '#219150';
                    break;
                  case 'mittel':
                    Icon = SignalMedium;
                    color = '#cfa600ff'; // dark yellow for contrast
                    bg = '#fffbe6';
                    border = '#cfa600ff';
                    break;
                  case 'schwer':
                    Icon = SignalHigh;
                    color = '#b91c1c';
                    bg = '#fff0f0';
                    border = '#b91c1c';
                    break;
                  default:
                    Icon = null;
                }
                return (
                  <MetaBadge style={{ color, background: bg, border: `1.5px solid ${border}`, display: 'inline-flex', alignItems: 'center' }}>
                    {Icon && <Icon size={16} style={{ marginRight: 6, color: border }} />}
                    {route.schwierigkeit}
                  </MetaBadge>
                );
              })()}
              {isPrivate && (
                <MetaBadge $variant="outline">
                  <BookLock size={16} style={{ marginRight: 5, verticalAlign: 'text-bottom' }} />
                  Privat
                </MetaBadge>
              )}
            </MetaRow>
          </div>
          <AuthorInfo>
            <UserAvatar
              userId={route.nutzer_id}
              name={route.username || route.nutzer_name}
              avatarUrl={route.avatar_url}
              size={48}
            />
            <AuthorText>
              von{" "}
              <UserLink to={`/user/${route.nutzer_id}`}>
                {route.username || route.nutzer_name || "Unbekannt"}
              </UserLink>
            </AuthorText>
          </AuthorInfo>
        </HeaderRow>

        {route.beschreibung && <Description>{route.beschreibung}</Description>}

        <StatsRow>
          <Stat>
            <StatLabel>Länge</StatLabel>
            <StatValue>{formatDistance(route.laenge_km)}</StatValue>
          </Stat>
          <Stat>
            <StatLabel>Höhenmeter</StatLabel>
            <StatValue>{formatElevation(route.hoehenmeter)}</StatValue>
          </Stat>
          <Stat>
            <StatLabel>Eisdielen</StatLabel>
            <StatValue>{eisdielenCount}</StatValue>
          </Stat>
        </StatsRow>

        {routeShops.length > 0 && (
          <ShopList>
            Eisdielen: {routeShops.map((shop) => (
              <ShopPill key={`${route.id}-${shop.id}`} to={`/map/activeShop/${shop.id}`}>
                {shop.name}
              </ShopPill>
            ))}
          </ShopList>
        )}

        <ActionsRow>
          {hasEmbed && (
            <ActionButton type="button" onClick={toggleEmbed} aria-pressed={showEmbed}>
              {showEmbed ? "Route ausblenden" : "Route anzeigen"}
            </ActionButton>
          )}

          {route.url && (
            <ActionLink href={route.url} target="_blank" rel="noopener noreferrer">
              Zu Route
              <ExternalLink size={20} style={{ marginLeft: 5, verticalAlign: 'text-bottom' }} />
            </ActionLink>
          )}

          {isOwner && (
            <ActionButton type="button" onClick={() => setShowEditModal(true)}>
              Bearbeiten
            </ActionButton>
          )}
        </ActionsRow>

        {showEmbed && hasEmbed && (
          <EmbedWrapper dangerouslySetInnerHTML={{ __html: route.embed_code }} />
        )}
        <CommentToggle
          title={areCommentsVisible ? "Kommentare ausblenden" : "Kommentare einblenden"}
          onClick={() => setAreCommentsVisible(!areCommentsVisible)}
        >
          <MessageCircle size={18} style={{ marginRight: 2, verticalAlign: 'text-bottom' }} /> {route.commentCount || 0} Kommentar(e)
        </CommentToggle>
        {areCommentsVisible && <CommentSection routeId={route.id} type="route" />}
      </StyledCard>

      {showEditModal && (
        <SubmitRouteForm
          shopId={contextShopId}
          shopName={contextShopName}
          showForm={showEditModal}
          setShowForm={setShowEditModal}
          existingRoute={route}
          onSuccess={onSuccess}
        />
      )}
    </>
  );
};

export default RouteCard;

// ---------- Styled Components ----------

const StyledCard = styled(Card)`
  border: 1px solid ${BORDER};
  border-radius: 22px;
  box-shadow: 0 18px 40px rgba(15, 18, 63, 0.08);
  padding: 2rem 2rem 1.5rem;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
`;

const RouteName = styled.h3`
  margin: 0;
  font-size: 1.4rem;
  color: #2c2c54;
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

const MetaBadge = styled.span`
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${({ $variant }) => ($variant === "outline" ? "transparent" : ACCENT_SOFT)};
  color: ${({ $variant }) => ($variant === "outline" ? ACCENT_DARK : ACCENT_DARK)};
  border: 1px solid  ${ACCENT_DARK};
`;

const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: ${TEXT_MUTED};
  font-weight: 600;
`;

const AuthorText = styled.span`
  font-size: 0.95rem;
  color: ${TEXT_MUTED};
`;

const UserLink = styled(Link)`
  color: ${ACCENT_DARK};
  text-decoration: none;
  font-weight: 600;

  &:hover {
    text-decoration: underline;
  }
`;

const Description = styled.p`
  margin-bottom: 1rem 0;
  color: ${TEXT_MUTED};
  white-space: pre-wrap;
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
`;

const Stat = styled.div`
  background: ${ACCENT_SOFT};
  border-radius: 14px;
  padding: 12px;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: #6f6f8d;
`;

const StatValue = styled.div`
  font-weight: 600;
  font-size: 1.1rem;
  color: #2a2a3f;
`;

const ShopList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
  align-items: baseline;
  font-weight: 600;
`;

const ShopPill = styled(Link)`
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 181, 34, 0.5);
  color: ${ACCENT_DARK};
  background: rgba(255, 181, 34, 0.15);
  font-size: 0.85rem;

  &:hover {
    background: rgba(255, 181, 34, 0.25);
  }
`;

const ActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 1rem;

  > * {
    flex-shrink: 0;
  }
`;

const actionButtonStyles = css`
  border-radius: 12px;
  padding: 10px 16px;
  font-weight: 600;
  background: ${ACCENT};
  color: #fff;
  border: 1px solid ${ACCENT_DARK};
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 150px;
  text-align: center;
  line-height: 1;

  &:hover {
    background: ${ACCENT_DARK};
    transform: translateY(-1px);
  }
`;

const ActionButton = styled.button`
  ${actionButtonStyles};
`;

const ActionLink = styled.a`
    position: absolute;
    right: 20px;
    bottom: 20px;
    text-decoration: none;
    color: ${ACCENT};
    font-weight: 600;
    &:hover {
      color: ${ACCENT_DARK}
    }
`;

const EmbedWrapper = styled.div`
  margin-bottom: 1rem;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid ${BORDER};

  iframe {
    width: 100%;
    min-height: 320px;
    border: none;
  }
`;

const DateText = styled.time`
  position: absolute;
  top: 1rem;
  right: 1.5rem;
  font-size: 0.85rem;
  color: #777;
  font-style: italic;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

export const CommentToggle = styled.button`
  margin-top: 0.5rem;
  background: transparent;
  border: none;
  color: #ffb522;
  cursor: pointer;
  font-weight: bold;
  padding: 0.25rem 0;
  text-align: left;

  &:hover {
    text-decoration: underline;
  }
`;
