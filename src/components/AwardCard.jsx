import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { Sparkles } from "lucide-react";
import { useUser } from "../context/UserContext";
import { getActiveAwardEffectTier } from "../shared/awardEffects";
import { getAwardIconSources, handleAwardIconFallback } from "../utils/awardIcons";
import { ActivityCard as Card, ActivityHeader, ActivityMetaRow as CardMetaRow, ActivityDate as DateText, ActivitySocialActions as ActionRow, ActivityCommentButton as CommentToggle, ActivityUserHeader, ActivityHeaderText, ActivityLink as CleanLink, ShopButton, SHOP_COLORS } from "../styles/ShopUi";
import { formatActivityDate } from '../utils/activityFeed';
import UserAvatar from './UserAvatar';
import CommentSection from "./CommentSection";
import LikeButton from "./LikeButton";
import { MessageCircle } from "lucide-react";

const normalizeDateString = (value) => {
  if (typeof value !== "string") return value;
  return value.includes("T") ? value : value.replace(" ", "T");
};

const parseAwardDate = (value) => {
  if (!value) return null;
  const parsed = new Date(normalizeDateString(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const AwardCard = React.forwardRef(function AwardCard({ award, showComments = false, focusCommentId = null }, ref) {
    const { userId } = useUser();
    const awardDate = parseAwardDate(award?.datum);
    const iconSources = getAwardIconSources(award?.icon_path, 512);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [areCommentsVisible, setAreCommentsVisible] = useState(showComments);
    const lightboxRef = useRef(null);
    const epicTier = getActiveAwardEffectTier(award?.ep);

    useEffect(() => {
      if (showComments) {
        setAreCommentsVisible(true);
      }
    }, [showComments]);

    useEffect(() => {
      if (!isLightboxOpen) return undefined;
      const previous = document.activeElement;
      lightboxRef.current?.querySelector('button')?.focus();
      const onKeyDown = (event) => {
        if (event.key === "Escape") {
          setIsLightboxOpen(false);
        }
        if (event.key === 'Tab') {
          event.preventDefault(); lightboxRef.current?.querySelector('button')?.focus();
        }
      };
      window.addEventListener("keydown", onKeyDown);
      return () => { window.removeEventListener("keydown", onKeyDown); previous?.focus?.(); };
    }, [isLightboxOpen]);

    useEffect(() => {
      if (!ref || !ref.current) return;
      const event = new Event("awardCardResize", { bubbles: true });
      ref.current.dispatchEvent(event);
      const swiperEl = ref.current.closest(".swiper");
      if (swiperEl?.swiper && typeof swiperEl.swiper.updateAutoHeight === "function") {
        swiperEl.swiper.updateAutoHeight();
      }
    }, [areCommentsVisible, ref]);


    return (
      <>
        <Card
          $epicTier={epicTier}
          ref={ref}
        >
          <ActivityHeader>
            <ActivityUserHeader>
              <UserAvatar userId={award.user_id} name={award.user_name} avatarUrl={award.avatar_url} />
              <ActivityHeaderText>{Number(userId) === Number(award.user_id)
                ? 'Du hast einen Award erhalten.'
                : <><strong><CleanLink to={`/user/${award.user_id}`}>{award.user_name}</CleanLink></strong> hat einen Award erhalten.</>}
              </ActivityHeaderText>
            </ActivityUserHeader>
            <CardMetaRow>
              <DateText dateTime={awardDate ? awardDate.toISOString() : undefined}>
                {formatActivityDate(awardDate)}
              </DateText>
            </CardMetaRow>
          </ActivityHeader>
          <ContentWrapper>
            {/* --- Icon links --- */}
            <IconWrapper>
              <IconButton
                $epicTier={epicTier}
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                aria-label={`Award ${award?.title_de || ""} groß anzeigen`}
              >
                <AwardIcon
                  $epicTier={epicTier}
                  src={iconSources.src || ""}
                  data-fallback-src={iconSources.fallbackSrc || ""}
                  onError={handleAwardIconFallback}
                  loading="lazy"
                  decoding="async"
                  alt="Award Icon"
                />
              </IconButton>
              <EPBadge $epicTier={epicTier}>{award.ep} EP <Sparkles size={16} style={{ marginLeft: 2, verticalAlign: "bottom" }} /></EPBadge>
            </IconWrapper>

            {/* --- Text rechts --- */}
            <TextContent>
              <strong>{award.title_de}</strong>
              <p>{award.description_de}</p>
            </TextContent>
          </ContentWrapper>
          <ActionRow>
            <LikeButton
              entityType="user_award"
              entityId={award.id}
              initialLikesCount={award.likes_count}
              initialHasLiked={award.has_liked}
            />
            <CommentToggle
              aria-expanded={areCommentsVisible}
              title={areCommentsVisible ? "Kommentare ausblenden" : "Kommentare einblenden"}
              onClick={(event) => {
                event.preventDefault();
                setAreCommentsVisible((prev) => !prev);
              }}
            >
              <MessageCircle size={18} /> {award.commentCount || 0} Kommentar(e)
            </CommentToggle>
          </ActionRow>
          {areCommentsVisible && (
            <CommentSection
              userAwardId={award.id}
              type="award"
              focusCommentId={focusCommentId}
              focusLatestComment={Boolean(showComments)}
            />
          )}
        </Card>
        {isLightboxOpen && typeof document !== "undefined" && createPortal(
          <LightboxOverlay onClick={() => setIsLightboxOpen(false)}>
            <LightboxCard ref={lightboxRef} role="dialog" aria-modal="true" aria-label={`Award ${award.title_de}`} onClick={(event) => event.stopPropagation()}>
              <LightboxClose type="button" onClick={() => setIsLightboxOpen(false)}>
                Schließen
              </LightboxClose>
              <LightboxImage
                $epicTier={epicTier}
                src={iconSources.src || ""}
                data-fallback-src={iconSources.fallbackSrc || ""}
                onError={handleAwardIconFallback}
                alt={award?.title_de ? `Award ${award.title_de}` : "Award"}
              />
              <LightboxMeta>
                <LightboxTitle>{award?.title_de || "Award"}</LightboxTitle>
                <LightboxDescription>
                  {award?.description_de || "Keine Beschreibung vorhanden."}
                </LightboxDescription>
                <LightboxFooter>
                  <strong>{award?.ep ?? 0} EP</strong>
                  <span>
                    {awardDate
                      ? `Vergeben am ${awardDate.toLocaleDateString("de-DE")}`
                      : award?.datum || ""}
                  </span>
                </LightboxFooter>
              </LightboxMeta>
            </LightboxCard>
          </LightboxOverlay>,
          document.body
        )}
      </>
    );

});

export default AwardCard;

// ---------- Styled Components ----------



const SHIMMER_KEYFRAMES = `
  @keyframes awardShimmerSweep {
    0% { transform: translateX(-140%) skewX(-18deg); opacity: 0; }
    18% { opacity: 0.22; }
    45% { opacity: 0.52; }
    100% { transform: translateX(220%) skewX(-18deg); opacity: 0; }
  }

  @keyframes awardShimmerSweepSecondary {
    0% { transform: translateX(-180%) skewX(16deg); opacity: 0; }
    28% { opacity: 0.12; }
    52% { opacity: 0.3; }
    100% { transform: translateX(240%) skewX(16deg); opacity: 0; }
  }
`;



const ContentWrapper = styled.div`
  display: flex;
  align-items: flex-start; gap: 16px; margin-top: 16px;
`;

const TextContent = styled.div`
  flex: 1;
  min-width: 0;
  font-size: 1rem;
  line-height: 1.5;

  p {
    margin: 0.35rem 0 0;
  }

  @container activity (max-width: 420px) {
    font-size: 0.92rem;
    line-height: 1.3;
  }
`;

const IconWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const IconButton = styled.button`
  border: none;
  padding: 0;
  background: transparent;
  cursor: zoom-in;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &::after {
    content: "";
    position: absolute;
    inset: -18%;
    pointer-events: none;
    opacity: ${({ $epicTier }) => ($epicTier === "base" ? 0 : 1)};
    background: linear-gradient(
      105deg,
      transparent 0%,
      transparent 30%,
      rgba(255, 255, 255, ${({ $epicTier }) => ($epicTier === "mythic" ? 0.22 : $epicTier === "legendary" ? 0.14 : 0.1)}) 42%,
      rgba(255, 246, 205, ${({ $epicTier }) => ($epicTier === "mythic" ? 0.96 : $epicTier === "legendary" ? 0.8 : 0.58)}) 50%,
      rgba(255, 255, 255, ${({ $epicTier }) => ($epicTier === "mythic" ? 0.3 : $epicTier === "legendary" ? 0.18 : 0.12)}) 58%,
      transparent 66%,
      transparent 100%
    );
    animation: ${({ $epicTier }) =>
      $epicTier === "base"
        ? "none"
        : $epicTier === "mythic"
          ? "awardShimmerSweep 2.7s linear infinite"
          : $epicTier === "legendary"
            ? "awardShimmerSweep 3.2s linear infinite"
            : "awardShimmerSweep 4.2s linear infinite"};
  }

  &::before {
    content: "";
    position: absolute;
    inset: -22%;
    pointer-events: none;
    opacity: ${({ $epicTier }) => ($epicTier === "mythic" ? 1 : 0)};
    background:
      linear-gradient(
        72deg,
        transparent 0%,
        transparent 40%,
        rgba(255, 255, 255, 0.14) 47%,
        rgba(255, 230, 160, 0.44) 52%,
        rgba(255, 255, 255, 0.08) 58%,
        transparent 68%,
        transparent 100%
      );
    animation: ${({ $epicTier }) => ($epicTier === "mythic" ? "awardShimmerSweepSecondary 1.9s linear infinite" : "none")};
  }

  ${SHIMMER_KEYFRAMES}
  @media (prefers-reduced-motion: reduce) { &::before, &::after { animation: none; } }
`;

const AwardIcon = styled.img`
  width: 132px; height: 132px; object-fit: contain;
  position: relative;
  z-index: 1;
  transition: filter 220ms ease;
  ${({ $epicTier }) => $epicTier !== "base" && `
    filter: drop-shadow(0 0 12px rgba(255, 214, 122, 0.34)) saturate(1.06) contrast(1.03);
  `}
  ${({ $epicTier }) => $epicTier === "legendary" && `
    filter: drop-shadow(0 0 18px rgba(255, 197, 86, 0.44)) drop-shadow(0 0 28px rgba(255, 176, 58, 0.18)) saturate(1.12) contrast(1.05);
  `}
  ${({ $epicTier }) => $epicTier === "mythic" && `
    filter: drop-shadow(0 0 24px rgba(255, 196, 92, 0.52)) drop-shadow(0 0 44px rgba(255, 166, 48, 0.28)) brightness(1.08) saturate(1.18) contrast(1.08);
  `}

  @container activity (max-width: 420px) {
    width: 88px; height: 88px;
  }
`;

const LightboxOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 5000;
  background: rgba(0, 0, 0, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const LightboxCard = styled.div`
  position: relative;
  background: #ffffff;
  border-radius: 12px;
  padding: 0.9rem;
  max-width: min(92vw, 760px);
  max-height: 92vh;
  overflow: auto;
`;

const LightboxImage = styled.img`
  display: block;
  max-width: 100%;
  max-height: min(62vh, 620px);
  width: 100%;
  height: auto;
  border-radius: 8px;
  object-fit: contain;
  position: relative;
  z-index: 1;
  transition: filter 220ms ease;
  ${({ $epicTier }) => $epicTier !== "base" && `
    filter: drop-shadow(0 0 18px rgba(255, 214, 122, 0.36)) saturate(1.06) contrast(1.03);
  `}
  ${({ $epicTier }) => $epicTier === "legendary" && `
    filter: drop-shadow(0 0 24px rgba(255, 197, 86, 0.46)) drop-shadow(0 0 34px rgba(255, 176, 58, 0.2)) saturate(1.12) contrast(1.05);
  `}
  ${({ $epicTier }) => $epicTier === "mythic" && `
    filter: drop-shadow(0 0 30px rgba(255, 196, 92, 0.56)) drop-shadow(0 0 56px rgba(255, 166, 48, 0.3)) brightness(1.1) saturate(1.2) contrast(1.08);
  `}
`;

const LightboxClose = styled(ShopButton)`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
`;

const LightboxMeta = styled.div`
  margin-top: 0.85rem;
  color: #2f2100;
`;

const LightboxTitle = styled.h3`
  margin: 0;
  padding-right: 4.8rem;
`;

const LightboxDescription = styled.p`
  margin: 0.4rem 0 0;
  color: rgba(47, 33, 0, 0.72);
`;

const LightboxFooter = styled.div`
  margin-top: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  color: rgba(47, 33, 0, 0.78);
  font-size: 0.9rem;
`;

const EPBadge = styled.div`
  position: absolute;
  top: -10px;
  right: -10px;
  display: inline-flex; align-items: center; background: ${SHOP_COLORS.accent};
  color: ${SHOP_COLORS.text}; border: 1px solid #e8a20c;
  font-size: 0.8rem;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 20px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  z-index: 4;
  animation: popIn 0.4s ease-out;

  @container activity (max-width: 420px) {
    top: -6px;
    right: -6px;
    font-size: 0.68rem;
    padding: 3px 6px;
  }

  @keyframes popIn {
    0% { transform: scale(0.8); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;
