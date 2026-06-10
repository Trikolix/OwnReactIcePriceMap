import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronRight, Clock, Image as ImageIcon, Trophy, Upload, Vote } from 'lucide-react';
import Header from '../Header';
import { buildAssetUrl } from '../utils/assets.jsx';

const STATUS_LABELS = {
  group_running: 'Gruppenphase',
  ko_running: 'KO-Phase',
  submission_open: 'Einreichphase',
  submission_closed: 'In Auswertung',
  finished: 'Abgeschlossen',
  active: 'Aktiv',
};

const STATUS_ACTIONS = {
  group_running: 'Jetzt abstimmen',
  ko_running: 'KO-Duelle ansehen',
  submission_open: 'Bild einreichen',
  submission_closed: 'Challenge ansehen',
  finished: 'Ergebnisse ansehen',
  active: 'Challenge oeffnen',
};

const ACTIVE_STATUS_ORDER = {
  ko_running: 0,
  group_running: 1,
  submission_open: 2,
  submission_closed: 3,
  active: 4,
};

const formatDate = (value) => {
  if (!value) return 'n. a.';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'n. a.';

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const getStatusTone = (status) => {
  if (['group_running', 'ko_running'].includes(status)) return 'live';
  if (status === 'submission_open') return 'submit';
  if (status === 'finished') return 'done';
  return 'neutral';
};

const getStatusIcon = (status) => {
  if (['group_running', 'ko_running'].includes(status)) return Vote;
  if (status === 'submission_open') return Upload;
  if (status === 'finished') return Trophy;
  return Clock;
};

const getPrimaryMeta = (challenge) => {
  if (challenge.status === 'submission_open') {
    return {
      icon: CalendarDays,
      label: `Einreichen bis ${formatDate(challenge.submission_deadline)}`,
    };
  }

  if (['group_running', 'ko_running'].includes(challenge.status)) {
    return {
      icon: Vote,
      label: `Voting seit ${formatDate(challenge.start_at)}`,
    };
  }

  if (challenge.status === 'finished') {
    return {
      icon: Trophy,
      label: `Gestartet am ${formatDate(challenge.start_at)}`,
    };
  }

  return {
    icon: Clock,
    label: `Start ${formatDate(challenge.start_at)}`,
  };
};

const getCountLabel = (challenge) => {
  const count = Number(challenge.image_count ?? challenge.submission_count ?? 0);
  if (challenge.status === 'submission_open') {
    const submissions = Number(challenge.submission_count ?? 0);
    return `${submissions} Einreichung${submissions === 1 ? '' : 'en'}`;
  }
  return `${count} Bild${count === 1 ? '' : 'er'}`;
};

const getPreviewImages = (challenge) => {
  const images = Array.isArray(challenge.preview_images) ? challenge.preview_images : [];
  const winner = challenge.winner_image;
  if (!winner?.url) return images;

  return [
    winner,
    ...images.filter((image) => Number(image.image_id) !== Number(winner.image_id)),
  ].slice(0, 4);
};

const getCardDescription = (challenge) =>
  challenge.description || 'Oeffne die Challenge fuer Voting, Einreichung und Ergebnisse.';

function PhotoChallengeList() {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadChallenges = async () => {
      if (!apiUrl) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiUrl}/photo_challenge/list_public_challenges.php`);
        const data = await res.json();
        if (data.status === 'success') {
          setChallenges(Array.isArray(data.data) ? data.data : []);
        } else {
          throw new Error(data.message || 'Challenges konnten nicht geladen werden.');
        }
      } catch (err) {
        setError(err.message || 'Challenges konnten nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    };
    loadChallenges();
  }, [apiUrl]);

  const sections = useMemo(() => {
    const active = [];
    const finished = [];

    challenges.forEach((challenge) => {
      if (challenge.status === 'finished') {
        finished.push(challenge);
      } else {
        active.push(challenge);
      }
    });

    active.sort((a, b) => {
      const byStatus = (ACTIVE_STATUS_ORDER[a.status] ?? 9) - (ACTIVE_STATUS_ORDER[b.status] ?? 9);
      if (byStatus !== 0) return byStatus;
      return new Date(a.start_at || a.created_at || 0) - new Date(b.start_at || b.created_at || 0);
    });

    finished.sort((a, b) => new Date(b.start_at || b.created_at || 0) - new Date(a.start_at || a.created_at || 0));

    return { active, finished };
  }, [challenges]);

  const renderChallengeCards = (items, variant) => (
    <ChallengeGrid>
      {items.map((challenge) => (
        <ChallengeCard key={challenge.id} challenge={challenge} variant={variant} />
      ))}
    </ChallengeGrid>
  );

  return (
    <PageWrapper>
      <Header />
      <Content>
        <PageTitleBlock>
          <PageKicker>Fotochallenges</PageKicker>
          <h1>Aktuelle Fotochallenges</h1>
          <p>Alles, wo du gerade einreichen, abstimmen oder Ergebnisse ansehen kannst.</p>
        </PageTitleBlock>

        {error && <WarningBox>{error}</WarningBox>}

        {loading ? (
          <Section>
            <SectionHeader>
              <div>
                <h2>Aktive Challenges</h2>
                <span>Wird geladen...</span>
              </div>
            </SectionHeader>
            <SkeletonGrid>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </SkeletonGrid>
          </Section>
        ) : (
          <>
            <Section>
              <SectionHeader>
                <div>
                  <h2>Aktive Challenges</h2>
                  <span>{sections.active.length} laufend oder geplant</span>
                </div>
              </SectionHeader>
              {sections.active.length ? (
                renderChallengeCards(sections.active, 'active')
              ) : (
                <EmptyState>
                  <Clock size={22} />
                  <div>
                    <strong>Gerade ist keine Challenge aktiv.</strong>
                    <span>Abgeschlossene Challenges findest du direkt darunter.</span>
                  </div>
                </EmptyState>
              )}
            </Section>

            <Section>
              <SectionHeader>
                <div>
                  <h2>Abgeschlossene Challenges</h2>
                  <span>{sections.finished.length} Ergebnis{sections.finished.length === 1 ? '' : 'se'}</span>
                </div>
              </SectionHeader>
              {sections.finished.length ? (
                renderChallengeCards(sections.finished, 'finished')
              ) : (
                <EmptyState>
                  <Trophy size={22} />
                  <div>
                    <strong>Noch keine abgeschlossene Challenge.</strong>
                    <span>Sobald Ergebnisse verfuegbar sind, erscheinen sie hier.</span>
                  </div>
                </EmptyState>
              )}
            </Section>
          </>
        )}
      </Content>
    </PageWrapper>
  );
}

function ChallengeCard({ challenge, variant }) {
  const tone = getStatusTone(challenge.status);
  const StatusIcon = getStatusIcon(challenge.status);
  const primaryMeta = getPrimaryMeta(challenge);
  const MetaIcon = primaryMeta.icon;
  const previewImages = getPreviewImages(challenge);
  const action = STATUS_ACTIONS[challenge.status] || 'Details ansehen';
  const isFinished = variant === 'finished';

  return (
    <Card to={`/photo-challenge/${challenge.id}`} $tone={tone}>
      <Preview $empty={!previewImages.length}>
        {previewImages.length ? (
          <Slideshow $slideCount={previewImages.length}>
            {previewImages.map((image, index) => (
              <img
                key={`${challenge.id}-${image.image_id || index}`}
                src={buildAssetUrl(image.url)}
                alt={image.title || image.beschreibung || challenge.title}
                loading="lazy"
                style={{
                  '--slide-index': index,
                  '--slide-duration': `${Math.max(previewImages.length, 1) * 3.5}s`,
                }}
              />
            ))}
            {isFinished && challenge.winner_image?.url && <WinnerPill>Gewinnerbild</WinnerPill>}
            {previewImages.length > 1 && (
              <SlideDots aria-hidden="true">
                {previewImages.map((image, index) => (
                  <span
                    key={`${challenge.id}-dot-${image.image_id || index}`}
                    style={{
                      '--slide-index': index,
                      '--slide-duration': `${previewImages.length * 3.5}s`,
                    }}
                  />
                ))}
              </SlideDots>
            )}
          </Slideshow>
        ) : (
          <PreviewFallback>
            <ImageIcon size={28} />
          </PreviewFallback>
        )}
      </Preview>

      <CardBody>
        <CardTopline>
          <StatusBadge $tone={tone}>
            <StatusIcon size={14} />
            {STATUS_LABELS[challenge.status] || challenge.status}
          </StatusBadge>
          <CountChip>
            <ImageIcon size={14} />
            {getCountLabel(challenge)}
          </CountChip>
        </CardTopline>

        <CardTitle>{challenge.title}</CardTitle>
        <CardDescription>{getCardDescription(challenge)}</CardDescription>

        <CardMeta>
          <MetaIcon size={16} />
          <span>{primaryMeta.label}</span>
        </CardMeta>

        <CardFooter>
          <span>{action}</span>
          <ChevronRight size={18} />
        </CardFooter>
      </CardBody>
    </Card>
  );
}

export default PhotoChallengeList;

const PageWrapper = styled.div`
  min-height: 100vh;
  background: #f7f7f4;
`;

const Content = styled.main`
  width: min(1180px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 1.25rem 0 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.65rem;

  @media (max-width: 640px) {
    width: min(100% - 1rem, 1180px);
    padding-top: 0.75rem;
    gap: 1.25rem;
  }
`;

const PageTitleBlock = styled.header`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  h1 {
    margin: 0;
    color: #202024;
    font-size: clamp(1.75rem, 4vw, 2.45rem);
    line-height: 1.08;
    letter-spacing: 0;
  }

  p {
    margin: 0;
    color: #666a73;
    max-width: 62ch;
    line-height: 1.5;
  }
`;

const PageKicker = styled.span`
  color: #876200;
  font-size: 0.82rem;
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: 0;
`;

const WarningBox = styled.div`
  background: #fff7ed;
  border: 1px solid #fed7aa;
  padding: 0.85rem 1rem;
  border-radius: 8px;
  color: #9a3412;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;

  h2 {
    margin: 0;
    color: #24242a;
    font-size: 1.2rem;
    line-height: 1.2;
    letter-spacing: 0;
  }

  span {
    display: block;
    margin-top: 0.2rem;
    color: #737782;
    font-size: 0.9rem;
  }
`;

const ChallengeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 0.85rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled(Link)`
  min-width: 0;
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid ${({ $tone }) => ($tone === 'live' ? '#a7f3d0' : $tone === 'submit' ? '#fde68a' : '#e5e7eb')};
  color: inherit;
  text-decoration: none;
  box-shadow: 0 10px 24px rgba(31, 41, 55, 0.08);
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 28px rgba(31, 41, 55, 0.12);
    border-color: ${({ $tone }) => ($tone === 'live' ? '#10b981' : $tone === 'submit' ? '#d97706' : '#b8bdc7')};
  }

  &:focus-visible {
    outline: 3px solid #facc15;
    outline-offset: 3px;
  }
`;

const Preview = styled.div`
  position: relative;
  height: 250px;
  background: #e5e7eb;

  @media (max-width: 640px) {
    height: 180px;
  }
`;

const Slideshow = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    opacity: ${({ $slideCount }) => ($slideCount > 1 ? 0 : 1)};
    animation: ${({ $slideCount }) => ($slideCount > 1 ? 'photoChallengeSlide var(--slide-duration) ease-in-out infinite' : 'none')};
    animation-delay: calc(var(--slide-index) * 3.5s);
    animation-fill-mode: both;
  }

  @keyframes photoChallengeSlide {
    0%,
    24% {
      opacity: 1;
      transform: scale(1);
    }

    30%,
    100% {
      opacity: 0;
      transform: scale(1.025);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    img {
      animation: none;
      opacity: 0;
      transform: none;
    }

    img:first-child {
      opacity: 1;
    }
  }
`;

const PreviewFallback = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7c818c;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.7), transparent),
    #eef0f3;
`;

const WinnerPill = styled.span`
  position: absolute;
  left: 0.65rem;
  bottom: 0.65rem;
  padding: 0.28rem 0.55rem;
  border-radius: 8px;
  background: rgba(17, 24, 39, 0.78);
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 700;
`;

const SlideDots = styled.div`
  position: absolute;
  right: 0.65rem;
  bottom: 0.65rem;
  z-index: 1;
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.22rem;
  border-radius: 8px;
  background: rgba(17, 24, 39, 0.42);

  span {
    width: 0.38rem;
    height: 0.38rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.56);
    animation: photoChallengeDot var(--slide-duration) ease-in-out infinite;
    animation-delay: calc(var(--slide-index) * 3.5s);
    animation-fill-mode: both;
  }

  @keyframes photoChallengeDot {
    0%,
    24% {
      background: #ffffff;
      transform: scale(1.18);
    }

    30%,
    100% {
      background: rgba(255, 255, 255, 0.56);
      transform: scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`;

const CardBody = styled.div`
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`;

const CardTopline = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  width: fit-content;
  border-radius: 8px;
  padding: 0.25rem 0.5rem;
  font-size: 0.78rem;
  font-weight: 750;
  color: ${({ $tone }) => ($tone === 'live' ? '#047857' : $tone === 'submit' ? '#92400e' : $tone === 'done' ? '#4b5563' : '#52525b')};
  background: ${({ $tone }) => ($tone === 'live' ? '#ecfdf5' : $tone === 'submit' ? '#fffbeb' : $tone === 'done' ? '#f3f4f6' : '#f4f4f5')};
`;

const CountChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: #6b7280;
  font-size: 0.82rem;
  font-weight: 650;
`;

const CardTitle = styled.h3`
  margin: 0;
  color: #202024;
  font-size: 1.08rem;
  line-height: 1.25;
  letter-spacing: 0;
`;

const CardDescription = styled.p`
  margin: 0;
  color: #626773;
  font-size: 0.92rem;
  line-height: 1.42;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardMeta = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  color: #5b6170;
  font-size: 0.88rem;
`;

const CardFooter = styled.div`
  margin-top: auto;
  padding-top: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  color: #7c5800;
  font-weight: 800;
`;

const EmptyState = styled.div`
  min-height: 92px;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem;
  border: 1px dashed #cfd3dc;
  border-radius: 8px;
  background: #ffffff;
  color: #667085;

  strong {
    display: block;
    color: #2f333b;
    margin-bottom: 0.15rem;
  }

  span {
    display: block;
  }
`;

const SkeletonGrid = styled(ChallengeGrid)``;

const SkeletonCard = styled.div`
  height: 320px;
  border-radius: 8px;
  background:
    linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent),
    #e9ebef;
  background-size: 200% 100%, 100% 100%;
  animation: shimmer 1.2s infinite;

  @keyframes shimmer {
    from {
      background-position: 200% 0, 0 0;
    }
    to {
      background-position: -200% 0, 0 0;
    }
  }
`;
