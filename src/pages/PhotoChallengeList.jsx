import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import Header from '../Header';

const STATUS_LABELS = {
  group_running: 'Gruppenphase',
  ko_running: 'KO-Phase',
  submission_open: 'Einreichphase',
  submission_closed: 'Planung laeuft',
  finished: 'Abgeschlossen',
  draft: 'In Vorbereitung',
  active: 'Aktiv',
};

const STATUS_ACTIONS = {
  group_running: 'Jetzt abstimmen',
  ko_running: 'KO-Duelle ansehen',
  submission_open: 'Zur Challenge',
  submission_closed: 'Planung ansehen',
  finished: 'Ergebnisse ansehen',
  draft: 'Vorschau ansehen',
  active: 'Challenge oeffnen',
};

const LIVE_STATUSES = ['group_running', 'ko_running', 'submission_open', 'submission_closed'];

const statusOrder = (status) => {
  if (LIVE_STATUSES.includes(status)) return 0;
  if (status === 'finished') return 2;
  return 1;
};

const formatDate = (value) => {
  if (!value) {
    return 'n. a.';
  }

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
};

const getChallengeMetaItems = (challenge) => {
  if (challenge.status === 'submission_open') {
    return [
      `Gestartet am: ${formatDate(challenge.start_at)}`,
      `Einreichung bis: ${formatDate(challenge.submission_deadline)}`,
    ];
  }

  return [
    `Start: ${formatDate(challenge.start_at)}`,
    `Bilder: ${challenge.image_count ?? 0}`,
  ];
};

const getStatusTone = (status) => {
  if (['group_running', 'ko_running'].includes(status)) return 'live';
  if (['submission_open', 'submission_closed'].includes(status)) return 'warm';
  if (status === 'finished') return 'muted';
  return 'neutral';
};

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
    const buckets = {
      running: [],
      upcoming: [],
      finished: [],
    };

    challenges
      .slice()
      .sort((a, b) => statusOrder(a.status) - statusOrder(b.status) || new Date(b.created_at) - new Date(a.created_at))
      .forEach((challenge) => {
        if (LIVE_STATUSES.includes(challenge.status)) {
          buckets.running.push(challenge);
        } else if (challenge.status === 'finished') {
          buckets.finished.push(challenge);
        } else {
          buckets.upcoming.push(challenge);
        }
      });

    return buckets;
  }, [challenges]);

  const featuredChallenge = useMemo(() => {
    return sections.running[0] || sections.upcoming[0] || sections.finished[0] || null;
  }, [sections]);

  const totalCount = challenges.length;
  const stats = [
    { label: 'Laufend', value: sections.running.length },
    { label: 'Geplant', value: sections.upcoming.length },
    { label: 'Abgeschlossen', value: sections.finished.length },
  ];

  const renderChallengeCards = (items) => {
    if (!items.length) {
      return <PlaceholderText>Keine Challenges in diesem Bereich.</PlaceholderText>;
    }

    return (
      <ChallengeGrid>
        {items.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            to={`/photo-challenge/${challenge.id}`}
            $tone={getStatusTone(challenge.status)}
          >
            <CardAccent $tone={getStatusTone(challenge.status)} />
            <CardHeader>
              <h3>{challenge.title}</h3>
              <StatusBadge $status={challenge.status}>
                {STATUS_LABELS[challenge.status] || challenge.status}
              </StatusBadge>
            </CardHeader>
            {challenge.description && <p>{challenge.description}</p>}
            <CardMeta>
              {getChallengeMetaItems(challenge).map((item) => (
                <CardMetaChip key={item}>{item}</CardMetaChip>
              ))}
            </CardMeta>
            <CardFooter>
              <CardAction>{STATUS_ACTIONS[challenge.status] || 'Details ansehen'}</CardAction>
              <CardArrow aria-hidden="true">-&gt;</CardArrow>
            </CardFooter>
          </ChallengeCard>
        ))}
      </ChallengeGrid>
    );
  };

  return (
    <PageWrapper>
      <Header />
      <Content>
        <HeroSection>
          <HeroCopy>
            <HeroEyebrow>Community Voting</HeroEyebrow>
            <h1>Fotochallenges</h1>
            <p>Der Einstieg in laufende Abstimmungen, kommende Wettbewerbe und vergangene Ergebnisse.</p>
            <HeroStats>
              {stats.map((item) => (
                <HeroStatCard key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </HeroStatCard>
              ))}
            </HeroStats>
          </HeroCopy>
          <HeroSpotlight>
            {featuredChallenge ? (
              <SpotlightCard
                to={`/photo-challenge/${featuredChallenge.id}`}
                $tone={getStatusTone(featuredChallenge.status)}
              >
                <SpotlightLabel>Im Fokus</SpotlightLabel>
                <StatusBadge $status={featuredChallenge.status}>
                  {STATUS_LABELS[featuredChallenge.status] || featuredChallenge.status}
                </StatusBadge>
                <h2>{featuredChallenge.title}</h2>
                <p>
                  {featuredChallenge.description ||
                    'Oeffne die Challenge und steige direkt in Voting, Einreichung oder Ergebnisse ein.'}
                </p>
                <SpotlightMeta>
                  {getChallengeMetaItems(featuredChallenge).map((item) => (
                    <CardMetaChip key={item}>{item}</CardMetaChip>
                  ))}
                </SpotlightMeta>
                <SpotlightFooter>
                  <span>{STATUS_ACTIONS[featuredChallenge.status] || 'Challenge oeffnen'}</span>
                  <strong>
                    {totalCount} Challenge{totalCount === 1 ? '' : 's'} online
                  </strong>
                </SpotlightFooter>
              </SpotlightCard>
            ) : (
              <HeroEmptyState>Noch keine oeffentliche Challenge verfuegbar.</HeroEmptyState>
            )}
          </HeroSpotlight>
        </HeroSection>

        {error && <WarningBox>{error}</WarningBox>}
        {loading && <PlaceholderText>Lade Challenges...</PlaceholderText>}

        {!loading && (
          <>
            {!!sections.running.length && (
              <Section>
                <SectionHeader>Aktuelle Challenges</SectionHeader>
                {renderChallengeCards(sections.running)}
              </Section>
            )}

            {!!sections.upcoming.length && (
              <Section>
                <SectionHeader>Bevorstehende Challenges</SectionHeader>
                {renderChallengeCards(sections.upcoming)}
              </Section>
            )}

            {!!sections.finished.length && (
              <Section>
                <SectionHeader>Abgeschlossene Challenges</SectionHeader>
                {renderChallengeCards(sections.finished)}
              </Section>
            )}

            {!sections.running.length && !sections.upcoming.length && !sections.finished.length && (
              <Section>
                <SectionHeader>Oeffentliche Challenges</SectionHeader>
                <PlaceholderText>Derzeit sind noch keine Challenges veroeffentlicht.</PlaceholderText>
              </Section>
            )}
          </>
        )}
      </Content>
    </PageWrapper>
  );
}

export default PhotoChallengeList;

const PageWrapper = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(255, 233, 196, 0.8), transparent 28%),
    #fef7ef;
`;

const Content = styled.main`
  max-width: 1100px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
`;

const HeroSection = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
  gap: 1.25rem;
  align-items: start;
  padding: 1.25rem;
  border-radius: 30px;
  background:
    radial-gradient(circle at top left, rgba(255, 214, 142, 0.9), transparent 35%),
    linear-gradient(135deg, #fff8ed 0%, #fff3d8 100%);
  box-shadow: 0 22px 50px rgba(47, 32, 13, 0.08);

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 0.9rem;
    padding: 1rem;
  }
`;

const HeroCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;

  h1 {
    margin: 0;
    font-size: clamp(2rem, 4vw, 3rem);
    color: #2f2130;
  }

  p {
    margin: 0;
    color: #6a6381;
    max-width: 54ch;
    font-size: 0.98rem;
  }
`;

const HeroEyebrow = styled.span`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  border-radius: 999px;
  padding: 0.35rem 0.8rem;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 181, 34, 0.35);
  color: #9a5a00;
  font-weight: 700;
  font-size: 0.82rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const HeroStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.55rem;
  margin-top: 0.25rem;

  @media (max-width: 640px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const HeroStatCard = styled.div`
  padding: 0.7rem 0.75rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(255, 218, 164, 0.8);
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;

  strong {
    font-size: 1.2rem;
    line-height: 1;
    color: #2d2745;
  }

  span {
    color: #7a6d68;
    font-size: 0.78rem;
    font-weight: 600;
    line-height: 1.2;
  }

  @media (max-width: 640px) {
    padding: 0.55rem 0.5rem;

    strong {
      font-size: 1.05rem;
    }

    span {
      font-size: 0.72rem;
    }
  }
`;

const HeroSpotlight = styled.div`
  min-width: 0;
  align-self: stretch;
`;

const SpotlightCard = styled(Link)`
  height: auto;
  text-decoration: none;
  color: inherit;
  border-radius: 26px;
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: ${({ $tone }) =>
    $tone === 'live'
      ? 'linear-gradient(160deg, #fffdf6 0%, #effff5 100%)'
      : $tone === 'warm'
      ? 'linear-gradient(160deg, #fffdf7 0%, #fff2da 100%)'
      : $tone === 'muted'
      ? 'linear-gradient(160deg, #ffffff 0%, #f4f3f8 100%)'
      : 'linear-gradient(160deg, #ffffff 0%, #f8f7fc 100%)'};
  border: 1px solid rgba(230, 220, 202, 0.95);
  box-shadow: 0 18px 40px rgba(35, 31, 52, 0.09);

  h2 {
    margin: 0;
    font-size: 1.45rem;
    color: #2d2745;
  }

  p {
    margin: 0;
    color: #625d76;
    line-height: 1.45;
  }

  @media (max-width: 900px) {
    padding: 1rem;
  }
`;

const SpotlightLabel = styled.span`
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #8c5b00;
`;

const SpotlightMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const SpotlightFooter = styled.div`
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-end;
  color: #4b455f;
  font-weight: 600;

  strong {
    color: #8b5b00;
    font-size: 0.92rem;
  }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const HeroEmptyState = styled.div`
  height: 100%;
  min-height: 220px;
  border-radius: 24px;
  border: 1px dashed #e1d6c6;
  background: rgba(255, 255, 255, 0.66);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #776f7f;
  padding: 1rem;
`;

const WarningBox = styled.div`
  background: #fff1e6;
  border: 1px solid #ffd7ba;
  padding: 0.8rem 1rem;
  border-radius: 12px;
  color: #8f3d00;
`;

const Section = styled.section`
  background: #fff;
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SectionHeader = styled.h2`
  margin: 0;
  font-size: 1.4rem;
  color: #352f44;
`;

const PlaceholderText = styled.p`
  margin: 0;
  color: #777;
`;

const ChallengeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
`;

const ChallengeCard = styled(Link)`
  position: relative;
  padding: 1rem;
  border-radius: 18px;
  border: 1px solid #ececf3;
  background: ${({ $tone }) =>
    $tone === 'live'
      ? 'linear-gradient(180deg, #ffffff 0%, #fbfff8 100%)'
      : $tone === 'warm'
      ? 'linear-gradient(180deg, #ffffff 0%, #fffaf2 100%)'
      : '#fff'};
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  box-shadow: 0 12px 28px rgba(20, 21, 56, 0.07);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 32px rgba(20, 21, 56, 0.12);
  }

  h3 {
    margin: 0;
    font-size: 1.2rem;
    color: #2d2745;
  }

  p {
    margin: 0;
    color: #615c76;
    font-size: 0.95rem;
    white-space: pre-line;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

const CardAccent = styled.div`
  position: absolute;
  inset: 0 auto auto 0;
  width: 100%;
  height: 4px;
  background: ${({ $tone }) =>
    $tone === 'live'
      ? 'linear-gradient(90deg, #17b26a, #7ce2b1)'
      : $tone === 'warm'
      ? 'linear-gradient(90deg, #ffb522, #ffd884)'
      : $tone === 'muted'
      ? 'linear-gradient(90deg, #c9cad5, #e8e8ee)'
      : 'linear-gradient(90deg, #d6d3e5, #f0eef8)'};
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
`;

const StatusBadge = styled.span`
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  background: ${({ $status }) =>
    $status === 'finished'
      ? '#f2f2f7'
      : ['group_running', 'ko_running'].includes($status)
      ? '#e5fff4'
      : '#fff5e0'};
  color: ${({ $status }) =>
    $status === 'finished'
      ? '#6a6a7d'
      : ['group_running', 'ko_running'].includes($status)
      ? '#046747'
      : '#a55a00'};
`;

const CardMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const CardMetaChip = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: #f6f5fa;
  border: 1px solid #eceaf4;
  padding: 0.35rem 0.7rem;
  font-size: 0.85rem;
  color: #7d7b92;
`;

const CardFooter = styled.div`
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.35rem;
`;

const CardAction = styled.span`
  font-weight: 700;
  color: #9a5a00;
`;

const CardArrow = styled.span`
  font-size: 1.15rem;
  color: #9a5a00;
`;
