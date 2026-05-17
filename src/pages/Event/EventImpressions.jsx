import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Camera, ChevronLeft, ChevronRight, X } from "lucide-react";
import Header, { Button } from "./Header";
import Footer from "./Footer";
import Seo from "../../components/Seo";
import { getApiBaseUrl } from "../../shared/api/client";
import { buildAssetUrl } from "../../utils/assets.jsx";

const PageWrapper = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(255, 218, 140, 0.35), transparent 40%),
    linear-gradient(180deg, #fff9ef 0%, #fff4da 100%);
  color: #2f2100;
`;

const Section = styled.section`
  padding: 1.2rem 0;
`;

const Container = styled.div`
  width: min(96%, 1120px);
  margin: 0 auto;
`;

const HeroCard = styled.div`
  background: rgba(255, 252, 243, 0.96);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 24px;
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.08);
  padding: 1.4rem;
  text-align: center;
`;

const HeroTitle = styled.h1`
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.2rem);
  font-weight: 900;
`;

const HeroText = styled.p`
  max-width: 780px;
  margin: 0.75rem auto 0;
  color: rgba(47, 33, 0, 0.72);
  line-height: 1.6;
`;

const GalleryGrid = styled.div`
  column-count: 1;
  column-gap: 1rem;

  @media (min-width: 680px) {
    column-count: 2;
  }

  @media (min-width: 1020px) {
    column-count: 3;
  }
`;

const ImageCard = styled.button`
  width: 100%;
  display: inline-block;
  break-inside: avoid;
  margin: 0 0 1rem;
  padding: 0;
  border: 1px solid rgba(138, 87, 0, 0.12);
  border-radius: 18px;
  background: #fff;
  color: inherit;
  text-align: left;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(28, 20, 0, 0.08);
`;

const GalleryImage = styled.img`
  width: 100%;
  display: block;
  background: #fff7e5;
`;

const ImageBody = styled.div`
  padding: 0.9rem 1rem 1rem;
`;

const ImageTitle = styled.h2`
  margin: 0;
  font-size: 1.05rem;
`;

const ImageText = styled.p`
  margin: 0.35rem 0 0;
  color: #7c4f00;
  line-height: 1.5;
`;

const EventMeta = styled.span`
  display: inline-flex;
  margin-top: 0.65rem;
  border-radius: 999px;
  padding: 0.25rem 0.6rem;
  background: #fff3c2;
  color: #8a5700;
  font-size: 0.82rem;
  font-weight: 800;
`;

const EmptyState = styled.div`
  background: #fffdfa;
  border: 1px solid #f0d79a;
  border-radius: 18px;
  padding: 2rem 1.2rem;
  text-align: center;
  color: #7c4f00;
  box-shadow: 0 10px 24px rgba(28, 20, 0, 0.06);
`;

const LightboxOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(22, 16, 0, 0.88);
  display: grid;
  place-items: center;
  padding: 1rem;
`;

const Lightbox = styled.div`
  width: min(100%, 1100px);
  max-height: 92vh;
  display: grid;
  gap: 0.75rem;
`;

const LightboxStage = styled.div`
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) 46px;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 720px) {
    grid-template-columns: 40px minmax(0, 1fr) 40px;
    gap: 0.35rem;
  }
`;

const LightboxImage = styled.img`
  max-width: 100%;
  max-height: 78vh;
  object-fit: contain;
  justify-self: center;
  border-radius: 12px;
  background: #fff;
`;

const LightboxCaption = styled.div`
  color: #fff7e5;
  text-align: center;
  line-height: 1.45;
`;

const CloseButton = styled.button`
  justify-self: end;
  width: 42px;
  height: 42px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const NavButton = styled.button`
  width: 46px;
  height: 46px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }

  @media (max-width: 720px) {
    width: 40px;
    height: 40px;
  }
`;

function eventYear(impression) {
  const date = impression.event_date || "";
  return date.slice(0, 4) || "2026";
}

export default function EventImpressions() {
  const apiUrl = getApiBaseUrl();
  const [impressions, setImpressions] = useState([]);
  const [eventInfo, setEventInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${apiUrl}/event2026/impressions.php`)
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok || json?.status !== "success") {
          throw new Error(json?.message || "Impressionen konnten nicht geladen werden.");
        }
        if (!cancelled) {
          setEventInfo(json.event || null);
          setImpressions(json.impressions || []);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Impressionen konnten nicht geladen werden.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

  const activeImage = activeImageIndex !== null ? impressions[activeImageIndex] : null;
  const activeImageSrc = activeImage ? buildAssetUrl(activeImage.image_url) : null;
  const hasMultipleImages = impressions.length > 1;

  const openImage = (index) => {
    setActiveImageIndex(index);
  };

  const closeImage = () => {
    setActiveImageIndex(null);
  };

  const showPreviousImage = () => {
    setActiveImageIndex((current) => {
      if (current === null || impressions.length === 0) return current;
      return (current - 1 + impressions.length) % impressions.length;
    });
  };

  const showNextImage = () => {
    setActiveImageIndex((current) => {
      if (current === null || impressions.length === 0) return current;
      return (current + 1) % impressions.length;
    });
  };

  useEffect(() => {
    if (activeImageIndex === null) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeImage();
      if (event.key === "ArrowLeft") showPreviousImage();
      if (event.key === "ArrowRight") showNextImage();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeImageIndex, impressions.length]);

  const seoDescription = useMemo(
    () => `Impressionen und Bilder der ${eventInfo?.name || "Ice-Tour 2026"} in Chemnitz.`,
    [eventInfo]
  );

  return (
    <PageWrapper>
      <Seo
        title="Ice-Tour Impressionen | Bilder der Ice-Tour 2026"
        description={seoDescription}
        canonical="/ice-tour-impressionen"
        keywords={["Ice-Tour Impressionen", "Ice-Tour Bilder", "Ice-Tour 2026", "Chemnitz", "Eis-Tour"]}
      />
      <Header />
      <Section style={{ paddingTop: "1rem" }}>
        <Container>
          <HeroCard>
            <Camera size={34} color="#ffb522" />
            <HeroTitle>Impressionen der Ice-Tour</HeroTitle>
            <HeroText>
              Bilder, Momente und Eindrücke von der Ice-Tour 2026. Künftige Events werden hier ebenfalls gesammelt.
            </HeroText>
            <div style={{ marginTop: "1rem" }}>
              <Button href="/ice-tour" style={{ background: "#fff", color: "#8a5700", border: "1px solid #ffb522" }}>
                Zum Rückblick
              </Button>
            </div>
          </HeroCard>
        </Container>
      </Section>

      <Section>
        <Container>
          {loading && <EmptyState>Impressionen werden geladen…</EmptyState>}
          {!loading && error && <EmptyState>{error}</EmptyState>}
          {!loading && !error && impressions.length === 0 && (
            <EmptyState>
              <strong>Noch keine Impressionen veröffentlicht.</strong>
              <p style={{ marginBottom: 0 }}>Die Bilder der Ice-Tour werden hier ergänzt, sobald sie ausgewählt sind.</p>
            </EmptyState>
          )}
          {!loading && !error && impressions.length > 0 && (
            <GalleryGrid>
              {impressions.map((impression, index) => {
                const imageSrc = buildAssetUrl(impression.image_url);
                return (
                  <ImageCard key={impression.id} type="button" onClick={() => openImage(index)}>
                    <GalleryImage src={imageSrc} alt={impression.title || "Ice-Tour Impression"} loading="lazy" />
                    <ImageBody>
                      {impression.title && <ImageTitle>{impression.title}</ImageTitle>}
                      {impression.caption && <ImageText>{impression.caption}</ImageText>}
                      <EventMeta>{impression.event_name || "Ice-Tour"} · {eventYear(impression)}</EventMeta>
                    </ImageBody>
                  </ImageCard>
                );
              })}
            </GalleryGrid>
          )}
        </Container>
      </Section>

      {activeImage && (
        <LightboxOverlay role="presentation" onClick={closeImage}>
          <Lightbox role="dialog" aria-modal="true" aria-label="Impression ansehen" onClick={(event) => event.stopPropagation()}>
            <CloseButton type="button" aria-label="Schließen" onClick={closeImage}>
              <X size={22} />
            </CloseButton>
            <LightboxStage>
              <NavButton type="button" aria-label="Vorheriges Bild" onClick={showPreviousImage} disabled={!hasMultipleImages}>
                <ChevronLeft size={26} />
              </NavButton>
              <LightboxImage src={activeImageSrc} alt={activeImage.title || "Ice-Tour Impression"} />
              <NavButton type="button" aria-label="Nächstes Bild" onClick={showNextImage} disabled={!hasMultipleImages}>
                <ChevronRight size={26} />
              </NavButton>
            </LightboxStage>
            {(activeImage.title || activeImage.caption) && (
              <LightboxCaption>
                {activeImage.title && <strong>{activeImage.title}</strong>}
                {activeImage.caption && <div>{activeImage.caption}</div>}
                {hasMultipleImages && <div>{activeImageIndex + 1} / {impressions.length}</div>}
              </LightboxCaption>
            )}
          </Lightbox>
        </LightboxOverlay>
      )}

      <Footer />
    </PageWrapper>
  );
}
