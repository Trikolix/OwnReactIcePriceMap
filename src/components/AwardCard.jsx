import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { getActiveAwardEffectTier } from "../shared/awardEffects";
import { getAwardIconSources, handleAwardIconFallback } from "../utils/awardIcons";
import { Card as SharedCard } from "../styles/SharedStyles";

const normalizeDateString = (value) => {
  if (typeof value !== "string") return value;
  return value.includes("T") ? value : value.replace(" ", "T");
};

const parseAwardDate = (value) => {
  if (!value) return null;
  const parsed = new Date(normalizeDateString(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const AwardCard = React.forwardRef(function AwardCard({ award }, ref) {
    const { userId } = useUser();
    const awardDate = parseAwardDate(award?.datum);
    const iconSources = getAwardIconSources(award?.icon_path, 512);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const epicTier = getActiveAwardEffectTier(award?.ep);

    useEffect(() => {
      if (!isLightboxOpen) return undefined;
      const onKeyDown = (event) => {
        if (event.key === "Escape") {
          setIsLightboxOpen(false);
        }
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [isLightboxOpen]);


    return (
      <>
        <Card
          $epicTier={epicTier}
          ref={ref}
          role="button"
          tabIndex={0}
          onClick={() => setIsLightboxOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setIsLightboxOpen(true);
            }
          }}
          aria-label={`Award ${award?.title_de || ""} im Vollbild anzeigen`}
        >
          <CardMetaRow>
            <DateText dateTime={awardDate ? awardDate.toISOString() : undefined}>
              {awardDate
                ? awardDate.toLocaleDateString("de-DE", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  })
                : award?.datum}
            </DateText>
          </CardMetaRow>

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
              {userId === award.user_id ? (
                <>Du hast den Award <strong>{award.title_de}</strong> erhalten.</>
              ) : (
                <>
                  <strong>
                    <CleanLink
                      to={`/user/${award.user_id}`}
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      {award.user_name}
                    </CleanLink>
                  </strong>{" "}
                  hat den Award <strong>{award.title_de}</strong> erhalten.
                </>
              )}
              <p>{award.description_de}</p>
            </TextContent>
          </ContentWrapper>
        </Card>
        {isLightboxOpen && typeof document !== "undefined" && createPortal(
          <LightboxOverlay onClick={() => setIsLightboxOpen(false)}>
            <LightboxCard onClick={(event) => event.stopPropagation()}>
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

const CleanLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`;

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

const Card = styled(SharedCard)`
  padding: 1rem;
  cursor: zoom-in;
`;

const CardMetaRow = styled.div`
  position: absolute;
  top: 1rem;
  right: 1.25rem;
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0;
  z-index: 1;
  pointer-events: none;

  @media (max-width: 640px) {
    position: static;
    justify-content: flex-end;
    margin-bottom: 0.4rem;
    pointer-events: auto;
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    flex-wrap: nowrap;
    align-items: flex-start;
    gap: 0.8rem;
  }
`;

const TextContent = styled.div`
  flex: 1;
  min-width: 220px;
  font-size: 1rem;

  p {
    margin: 0.35rem 0 0;
  }

  @media (max-width: 640px) {
    min-width: 0;
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
`;

const AwardIcon = styled.img`
  height: 150px;
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

  @media (max-width: 640px) {
    height: 92px;
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

const LightboxClose = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  border: none;
  border-radius: 8px;
  background: #111827;
  color: #fff;
  padding: 0.35rem 0.6rem;
  cursor: pointer;
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
  background: linear-gradient(135deg, #FFD700, #FFC107);
  color: #fff;
  font-size: 0.8rem;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 20px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  z-index: 1;
  animation: popIn 0.4s ease-out;

  @media (max-width: 640px) {
    top: -6px;
    right: -6px;
    font-size: 0.68rem;
    padding: 3px 6px;
  }

  @keyframes popIn {
    0% { transform: scale(0.8); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
`;

const DateText = styled.time`
  position: static;
  font-size: 0.85rem;
  color: rgba(47, 33, 0, 0.5);
  font-style: italic;
  user-select: none;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 999px;
  padding: 0.2rem 0.65rem;

  @media (max-width: 640px) {
    margin-bottom: 0;
    justify-content: flex-end;
    font-size: 0.78rem;
    line-height: 1.2;
    flex-wrap: wrap;
  }
`;
