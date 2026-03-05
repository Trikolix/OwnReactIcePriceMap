import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
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
        <Card ref={ref}>
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
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                aria-label={`Award ${award?.title_de || ""} groß anzeigen`}
              >
                <AwardIcon
                  src={iconSources.src || ""}
                  data-fallback-src={iconSources.fallbackSrc || ""}
                  onError={handleAwardIconFallback}
                  loading="lazy"
                  decoding="async"
                  alt="Award Icon"
                />
              </IconButton>
              <EPBadge>{award.ep} EP <Sparkles size={16} style={{ marginLeft: 2, verticalAlign: "bottom" }} /></EPBadge>
            </IconWrapper>

            {/* --- Text rechts --- */}
            <TextContent>
              {userId === award.user_id ? (
                <>Du hast den Award <strong>{award.title_de}</strong> erhalten.</>
              ) : (
                <>
                  <strong>
                    <CleanLink to={`/user/${award.user_id}`}>
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
                src={iconSources.src || ""}
                data-fallback-src={iconSources.fallbackSrc || ""}
                onError={handleAwardIconFallback}
                alt={award?.title_de ? `Award ${award.title_de}` : "Award"}
              />
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

const Card = styled(SharedCard)`
  padding: 1rem;
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
`;

const AwardIcon = styled.img`
  height: 150px;

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
  padding: 0.8rem;
  max-width: min(92vw, 860px);
  max-height: 92vh;
`;

const LightboxImage = styled.img`
  display: block;
  max-width: min(88vw, 820px);
  max-height: 82vh;
  width: auto;
  height: auto;
  border-radius: 8px;
`;

const LightboxClose = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  border: none;
  border-radius: 8px;
  background: #111827;
  color: #fff;
  padding: 0.35rem 0.6rem;
  cursor: pointer;
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
