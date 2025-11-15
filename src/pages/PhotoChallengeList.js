import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import Header from '../Header';

const STATUS_LABELS = {
  group_running: 'Gruppenphase',
  ko_running: 'KO-Phase',
  submission_open: 'Einreichphase',
  finished: 'Abgeschlossen',
  draft: 'In Vorbereitung',
  active: 'Aktiv',
};

const statusOrder = (status) => {
  if (['group_running', 'ko_running', 'submission_open'].includes(status)) return 0;
  if (status === 'finished') return 2;
  return 1;
};

function PhotoChallengeList() {
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
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
        if (['group_running', 'ko_running', 'submission_open'].includes(challenge.status)) {
          buckets.running.push(challenge);
        } else if (challenge.status === 'finished') {
          buckets.finished.push(challenge);
        } else {
          buckets.upcoming.push(challenge);
        }
      });
    return buckets;
  }, [challenges]);

  const renderChallengeCards = (items) => {
    if (!items.length) {
      return <PlaceholderText>Keine Challenges in diesem Bereich.</PlaceholderText>;
    }
    return (
      <ChallengeGrid>
        {items.map((challenge) => (
          <ChallengeCard key={challenge.id} to={`/photo-challenge/${challenge.id}`}>
            <CardHeader>
              <h3>{challenge.title}</h3>
              <StatusBadge $status={challenge.status}>{STATUS_LABELS[challenge.status] || challenge.status}</StatusBadge>
            </CardHeader>
            {challenge.description && <p>{challenge.description}</p>}
            <CardMeta>
              <span>Start: {challenge.start_at ? new Date(challenge.start_at).toLocaleDateString('de-DE') : 'n. a.'}</span>
              <span>Bilder: {challenge.image_count ?? 0}</span>
            </CardMeta>
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
          <div>
            <h1>Fotochallenges</h1>
            <p>Stöbere durch laufende, kommende und vergangene Wettbewerbe.</p>
          </div>
        </HeroSection>
        {error && <WarningBox>{error}</WarningBox>}
        {loading && <PlaceholderText>Lade Challenges…</PlaceholderText>}
        {!loading && (
          <>
            <Section>
              <SectionHeader>Aktuelle Challenges</SectionHeader>
              {renderChallengeCards(sections.running)}
            </Section>
            <Section>
              <SectionHeader>Bevorstehende Challenges</SectionHeader>
              {renderChallengeCards(sections.upcoming)}
            </Section>
            <Section>
              <SectionHeader>Abgeschlossene Challenges</SectionHeader>
              {renderChallengeCards(sections.finished)}
            </Section>
          </>
        )}
      </Content>
    </PageWrapper>
  );
}

export default PhotoChallengeList;

const PageWrapper = styled.div`
  min-height: 100vh;
  background: #fef7ef;
`;

const Content = styled.main`
  max-width: 1100px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const HeroSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  h1 {
    margin: 0;
    font-size: 2rem;
  }

  p {
    margin: 0;
    color: #6a6381;
  }
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
  padding: 1rem;
  border-radius: 18px;
  border: 1px solid #ececf3;
  background: #fff;
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: 0 12px 28px rgba(20, 21, 56, 0.07);
  transition: transform 0.15s ease, box-shadow 0.15s ease;

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
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
`;

const StatusBadge = styled.span`
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
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
  font-size: 0.85rem;
  color: #7d7b92;
`;
