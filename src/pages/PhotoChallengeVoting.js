import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import Header from '../Header';
import { useUser } from '../context/UserContext';

const KO_ROUND_LABELS = {
  1: 'Achtelfinale',
  2: 'Viertelfinale',
  3: 'Halbfinale',
  4: 'Finale',
};

const ASSET_BASE = (process.env.REACT_APP_ASSET_BASE_URL || 'https://ice-app.de/').replace(/\/+$/, '');
const buildAssetUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return `${ASSET_BASE}/${path.replace(/^\/+/, '')}`;
};

const shuffleArray = (items = []) => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

function PhotoChallengeVoting() {
  const { challengeId } = useParams();
  const { userId, isLoggedIn } = useUser();
  const apiUrl = process.env.REACT_APP_API_BASE_URL;

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activePhase, setActivePhase] = useState('group');
  const [actionMessage, setActionMessage] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [groupModal, setGroupModal] = useState(null); // { groupId, mode, matchOrder, matchIndex, orientation }
  const requestIdRef = React.useRef(0);

  const fetchOverview = useCallback(async () => {
    if (!apiUrl || !challengeId || !userId) return;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ challenge_id: challengeId });
      if (userId) {
        console.log(userId);
        params.set('nutzer_id', userId);
        console.log(params.toString());
      }
      const res = await fetch(`${apiUrl}/photo_challenge/get_challenge_overview.php?${params.toString()}`);
      const data = await res.json();
      if (data.status === 'success') {
        if (requestId !== requestIdRef.current) return;
        const normalizedGroups = (data.groups || []).map((group) => {
          const matches = (group.matches || []).map((match) => {
            const hasVoted =
              typeof match.has_voted === 'boolean'
                ? match.has_voted
                : match.user_choice !== null && match.user_choice !== undefined;
            return {
              ...match,
              has_voted: hasVoted,
              user_choice: match.user_choice ?? null,
            };
          });
          const votes = typeof group.user_votes === 'number' ? group.user_votes : matches.filter((match) => match.has_voted).length;
          return {
            ...group,
            matches,
            user_votes: votes,
          };
        });
        setOverview({
          ...data,
          groups: normalizedGroups,
        });
      } else {
        throw new Error(data.message || 'Challenge konnte nicht geladen werden.');
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setOverview(null);
      setError(err.message || 'Challenge konnte nicht geladen werden.');
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [apiUrl, challengeId, userId]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview, refreshKey]);

  useEffect(() => {
    if (!overview) return;
    if (overview.challenge?.status === 'group_running') {
      setActivePhase('group');
    } else if (overview.challenge?.status === 'ko_running') {
      const maxRound = Math.max(0, ...(overview.ko_matches || []).map((match) => Number(match.round) || 0));
      if (maxRound > 0) {
        setActivePhase(`ko_round_${maxRound}`);
      }
    }
  }, [overview]);

  const phases = useMemo(() => {
    const base = [{ key: 'group', label: 'Gruppenphase' }];
    const koRounds = new Set((overview?.ko_matches || []).map((match) => Number(match.round)));
    [1, 2, 3, 4].forEach((round) => {
      base.push({
        key: `ko_round_${round}`,
        label: KO_ROUND_LABELS[round] || `Runde ${round}`,
        disabled: !koRounds.has(round),
      });
    });
    return base;
  }, [overview?.ko_matches]);

  const handleVote = async (matchId, imageId, options = {}) => {
    if (!isLoggedIn || !userId) {
      setActionMessage('Bitte logge dich ein, um abzustimmen.');
      return;
    }
    if (!apiUrl) return;
    try {
      const formData = new FormData();
      formData.append('match_id', matchId);
      formData.append('image_id', imageId);
      formData.append('nutzer_id', userId);
      const res = await fetch(`${apiUrl}/photo_challenge/vote.php`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.status === 'success') {
        setActionMessage('Stimme gespeichert – danke!');
        if (typeof options.onSuccess === 'function') {
          options.onSuccess();
        }
        setRefreshKey((val) => val + 1);
      } else {
        throw new Error(data.message || 'Voting fehlgeschlagen.');
      }
    } catch (err) {
      const message = err.message || 'Voting fehlgeschlagen.';
      setActionMessage(message);
      if (options?.onDuplicate && /schon.*abgestimmt|bereits abgestimmt|Duplicate entry/i.test(message)) {
        options.onDuplicate();
      }
    }
  };

  const groupsSorted = useMemo(() => {
    return (overview?.groups || []).slice().sort((a, b) => a.position - b.position);
  }, [overview?.groups]);

  const koMatchesByRound = useMemo(() => {
    const map = new Map();
    (overview?.ko_matches || []).forEach((match) => {
      const round = Number(match.round) || 0;
      if (!map.has(round)) {
        map.set(round, []);
      }
      map.get(round).push(match);
    });
    map.forEach((matches) => {
      matches.sort((a, b) => a.position - b.position);
    });
    return map;
  }, [overview?.ko_matches]);

  const activeModalGroup = useMemo(() => {
    if (!groupModal) return null;
    return groupsSorted.find((group) => group.id === groupModal.groupId) || null;
  }, [groupModal, groupsSorted]);

  const activeModalMatch = useMemo(() => {
    if (!groupModal || groupModal.mode !== 'active' || !activeModalGroup) return null;
    const matchId = groupModal.matchOrder[groupModal.matchIndex];
    return activeModalGroup.matches.find((match) => match.id === matchId) || null;
  }, [groupModal, activeModalGroup]);

  const openGroupModal = (group) => {
    if (group.status === 'upcoming') {
      setGroupModal({ groupId: group.id, mode: 'upcoming' });
      return;
    }
    if (group.status === 'finished') {
      setGroupModal({ groupId: group.id, mode: 'finished' });
      return;
    }
    if (!group.matches?.length) {
      setActionMessage('Für diese Gruppe sind noch keine Duelle verfügbar.');
      return;
    }
    const matchOrder = shuffleArray(group.matches.map((match) => match.id));
    const orientation = {};
    group.matches.forEach((match) => {
      orientation[match.id] = Math.random() < 0.5 ? 'swap' : 'keep';
    });
    setGroupModal({
      groupId: group.id,
      mode: 'active',
      matchOrder,
      matchIndex: 0,
      orientation,
    });
  };

  const closeGroupModal = () => setGroupModal(null);

  const goToMatch = useCallback((direction, { closeOnEnd = false } = {}) => {
    setGroupModal((prev) => {
      if (!prev) return prev;
      const total = prev.matchOrder?.length || 0;
      if (total === 0) return null;
      const nextIndex = prev.matchIndex + direction;
      if (nextIndex < 0) {
        return { ...prev, matchIndex: 0 };
      }
      if (nextIndex >= total) {
        if (closeOnEnd) {
          setActionMessage('Alle Duelle dieser Gruppe wurden bearbeitet.');
          return null;
        }
        return { ...prev, matchIndex: total - 1 };
      }
      return { ...prev, matchIndex: nextIndex };
    });
  }, []);

  const advanceModalMatch = useCallback(
    (closeOnEnd = true) => goToMatch(1, { closeOnEnd }),
    [goToMatch]
  );

  const goPrevModalMatch = useCallback(() => goToMatch(-1), [goToMatch]);
  const goNextModalMatch = useCallback(() => goToMatch(1, { closeOnEnd: false }), [goToMatch]);

  useEffect(() => {
    if (!groupModal || groupModal.mode !== 'active') return;
    if (!activeModalGroup) {
      setGroupModal(null);
      return;
    }
    if (!activeModalMatch) {
      const total = groupModal.matchOrder?.length || 0;
      if (groupModal.matchIndex >= total - 1) {
        advanceModalMatch(true);
      } else {
        goNextModalMatch();
      }
    }
  }, [groupModal, activeModalGroup, activeModalMatch, advanceModalMatch, goNextModalMatch]);

  const handleModalVote = (match, imageId) => {
    handleVote(match.id, imageId, {
      onSuccess: () => advanceModalMatch(true),
      onDuplicate: () => advanceModalMatch(true),
    });
  };

  const modalSides = useMemo(() => {
    if (!activeModalMatch || groupModal?.mode !== 'active') return [];
    const baseSides = [
      {
        id: activeModalMatch.image_a_id,
        url: activeModalMatch.image_a_url,
        votes: activeModalMatch.votes_a,
      },
      {
        id: activeModalMatch.image_b_id,
        url: activeModalMatch.image_b_url,
        votes: activeModalMatch.votes_b,
      },
    ];
    const orientation = groupModal?.orientation?.[activeModalMatch.id] === 'swap';
    return orientation ? [baseSides[1], baseSides[0]] : baseSides;
  }, [activeModalMatch, groupModal]);

  const renderGroupCard = (group) => {
    const totalMatches = group.matches.length;
    const completedMatches = group.user_votes ?? group.matches.filter((match) => match.has_voted).length;
    return (
      <GroupCard key={group.id}>
        <GroupHeader type="button" onClick={() => openGroupModal(group)}>
          <div>
            <h3>{group.name}</h3>
            <small>{group.entries.length} Bilder</small>
          </div>
          <ProgressTag>
            {completedMatches}/{totalMatches} Votes
          </ProgressTag>
        </GroupHeader>
        <StatusLine>{group.status_label}</StatusLine>
      </GroupCard>
    );
  };

  const renderKoMatches = () => {
    if (!overview?.ko_matches?.length) {
      return <EmptyState>Die KO-Runde hat noch nicht begonnen.</EmptyState>;
    }
    const activeRound = Number(activePhase.replace('ko_round_', ''));
    const matchesInRound = shuffleArray(koMatchesByRound.get(activeRound) || []);
    if (!matchesInRound.length) {
      return <EmptyState>Für diese Phase liegen keine Duelle vor.</EmptyState>;
    }
    return (
      <KoGrid>
        {matchesInRound.map((match) => {
          const swap = Math.random() < 0.5;
          const sides = swap
            ? [
                {
                  id: match.image_b_id,
                  url: match.image_b_url,
                  votes: match.votes_b,
                },
                {
                  id: match.image_a_id,
                  url: match.image_a_url,
                  votes: match.votes_a,
                },
              ]
            : [
                {
                  id: match.image_a_id,
                  url: match.image_a_url,
                  votes: match.votes_a,
                },
                {
                  id: match.image_b_id,
                  url: match.image_b_url,
                  votes: match.votes_b,
                },
              ];
          return (
            <KoCard key={match.id}>
              <small>{KO_ROUND_LABELS[match.round] || `Runde ${match.round}`}</small>
              <KoPair>
                {sides.map((side) => (
                  <VoteOption
                    key={side.id}
                    type="button"
                    onClick={() => handleVote(match.id, side.id)}
                    disabled={match.status !== 'open'}
                    $selected={match.user_choice === side.id}
                  >
                    <VoteImage src={buildAssetUrl(side.url)} alt={`Bild ${side.id}`} />
                    <VoteMeta>
                      <strong>#{side.id}</strong>
                      <span>{side.votes} Stimme(n)</span>
                    </VoteMeta>
                  </VoteOption>
                ))}
              </KoPair>
            </KoCard>
          );
        })}
      </KoGrid>
    );
  };

  if (!challengeId) {
    return (
      <FullPage>
        <Header />
        <Content>
          <EmptyState>Bitte rufe diese Seite mit einer Challenge-ID auf.</EmptyState>
        </Content>
      </FullPage>
    );
  }

  return (
    <FullPage>
      <Header />
      <Content>
        <HeroSection>
          <div>
            <h1>{overview?.challenge ? (overview.challenge.title) : "Foto-Challenge"}</h1>
            <p>Stimme für deine Lieblingsbilder und hilf mit zu entscheiden, wer weiterkommt.</p>
          </div>
        </HeroSection>

        {!isLoggedIn && (
          <WarningBox>Bitte logge dich ein, um abstimmen zu können. Stimmen ohne Login werden nicht gezählt.</WarningBox>
        )}
        {error && <WarningBox>{error}</WarningBox>}
        {actionMessage && (
          <ActionMessage>
            {actionMessage}
            <button type="button" onClick={() => setActionMessage(null)}>
              ×
            </button>
          </ActionMessage>
        )}

        <PhaseSlider>
          {phases.map((phase) => (
            <PhasePill
              key={phase.key}
              type="button"
              $active={activePhase === phase.key}
              disabled={phase.disabled}
              onClick={() => !phase.disabled && setActivePhase(phase.key)}
            >
              {phase.label}
            </PhasePill>
          ))}
        </PhaseSlider>

        {loading && <PlaceholderText>Lade Challenge …</PlaceholderText>}

        {!loading && activePhase === 'group' && (
          <GroupsGrid>{groupsSorted.length ? groupsSorted.map(renderGroupCard) : <EmptyState>Noch keine Gruppen.</EmptyState>}</GroupsGrid>
        )}

        {!loading && activePhase !== 'group' && renderKoMatches()}

        {groupModal && activeModalGroup && (
          <ModalOverlay>
            <ModalCard>
              <ModalHeader>
                <div>
                  <h3>{activeModalGroup.name}</h3>
                  <small>
                    {groupModal.mode === 'active' && activeModalGroup.matches.length
                      ? `Duell ${groupModal.matchIndex + 1} / ${activeModalGroup.matches.length}`
                      : groupModal.mode === 'upcoming'
                      ? `Startet am ${
                          activeModalGroup.start_at
                            ? new Date(activeModalGroup.start_at).toLocaleDateString('de-DE')
                            : 'bald'
                        }`
                      : 'Voting beendet'}
                  </small>
                </div>
                <CloseModalButton type="button" onClick={closeGroupModal}>
                  ×
                </CloseModalButton>
              </ModalHeader>
              {groupModal.mode === 'active' && (
                <ModalNavRow>
                  <NavButton type="button" onClick={goPrevModalMatch} disabled={!groupModal || groupModal.matchIndex === 0}>
                    Zurück
                  </NavButton>
                  <NavButton
                    type="button"
                    onClick={() => advanceModalMatch(false)}
                    disabled={
                      !groupModal || groupModal.matchIndex >= groupModal.matchOrder.length - 1
                    }
                  >
                    Weiter
                  </NavButton>
                </ModalNavRow>
              )}
              <ModalBody>
                {groupModal.mode === 'active' && activeModalMatch && (
                  <ModalVoteWrapper>
                    {modalSides.map((side) => (
                      <ModalVoteOption
                        key={side.id}
                        type="button"
                        onClick={() => handleModalVote(activeModalMatch, side.id)}
                        disabled={activeModalMatch.status !== 'open'}
                        $selected={activeModalMatch.user_choice === side.id}
                      >
                        <ModalVoteImage src={buildAssetUrl(side.url)} alt={`Bild ${side.id}`} />
                        <VoteMeta>
                          <strong>Bild #{side.id}</strong>
                          {activeModalMatch.user_choice === side.id ? (
                            <span>Deine aktuelle Stimme</span>
                          ) : (
                            <span>Stimme ändern</span>
                          )}
                        </VoteMeta>
                      </ModalVoteOption>
                    ))}
                  </ModalVoteWrapper>
                )}
              {groupModal.mode === 'upcoming' && (
                  <PreviewGrid>
                    {activeModalGroup.entries.map((entry) => (
                      <PreviewCard key={entry.image_id}>
                        <PreviewImage src={buildAssetUrl(entry.url)} alt={entry.beschreibung || `Bild ${entry.image_id}`} />
                        <PreviewMeta>
                          <strong>Bild #{entry.image_id}</strong>
                        </PreviewMeta>
                      </PreviewCard>
                    ))}
                  </PreviewGrid>
                )}
                {groupModal.mode === 'finished' && (
                  <ResultsList>
                    {activeModalGroup.results && activeModalGroup.results.length ? (
                      activeModalGroup.results.map((result) => (
                        <ResultItem key={result.image_id}>
                          <ResultInfo>
                            <ResultImage src={buildAssetUrl(result.url)} alt={`Bild ${result.image_id}`} />
                            <div>
                              <strong>Bild #{result.image_id}</strong><br />
                              <small>{result.username || 'Unbekannt'}</small>
                            </div>
                          </ResultInfo>
                          <ResultWins>{result.wins} Siege</ResultWins>
                        </ResultItem>
                      ))
                    ) : (
                      <EmptyState>Keine Ergebnisse verfügbar.</EmptyState>
                    )}
                  </ResultsList>
                )}
              </ModalBody>
            </ModalCard>
          </ModalOverlay>
        )}
      </Content>
    </FullPage>
  );
}

export default PhotoChallengeVoting;

const FullPage = styled.div`
  min-height: 100vh;
  background: #fefaf3;
`;

const Content = styled.main`
  max-width: 1100px;
  margin: 0 auto;
  padding: 1rem;
`;

const HeroSection = styled.header`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-direction: column;

  h1 {
    margin: 0;
    font-size: 2rem;
  }

  p {
    margin: 0.2rem 0 0;
    color: #6a6381;
  }
`;

const WarningBox = styled.div`
  background: #fff1e6;
  border: 1px solid #ffd7ba;
  padding: 0.8rem 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  color: #8f3d00;
`;

const ActionMessage = styled.div`
  background: #e5fff4;
  border: 1px solid #6de0bb;
  color: #046747;
  padding: 0.75rem 1rem;
  border-radius: 999px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  button {
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 1.1rem;
    color: inherit;
  }
`;

const PhaseSlider = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const PhasePill = styled.button`
  border: 1px solid ${({ $active }) => ($active ? '#ffb522' : '#e5e7f0')};
  border-radius: 999px;
  padding: 0.6rem 1.2rem;
  background: ${({ $active }) => ($active ? '#fff3d4' : '#fff')};
  color: ${({ $active }) => ($active ? '#a55a00' : '#5b5f75')};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  font-weight: 600;
`;

const GroupsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
`;

const GroupCard = styled.div`
  background: #fff;
  border-radius: 18px;
  border: 1px solid #f0f0f5;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 15px 40px rgba(20, 21, 56, 0.08);
`;

const GroupHeader = styled.button`
  border: none;
  background: transparent;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
  cursor: pointer;

  h3 {
    margin: 0;
  }

  small {
    color: #7a7a90;
  }
`;

const ProgressTag = styled.span`
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
  background: #f5f5f9;
  font-weight: 600;
  color: #6d6d85;
  font-size: 0.9rem;
`;

const StatusLine = styled.p`
  margin: -0.5rem 0 0;
  font-size: 0.9rem;
  color: #8a7f9b;
`;

const VoteOption = styled.button`
  border-radius: 18px;
  border: 2px solid ${({ $selected }) => ($selected ? '#ffb522' : 'transparent')};
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  background: #fff;
  padding: 0.5rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  cursor: pointer;
  opacity: ${({ disabled }) => (disabled ? 0.75 : 1)};
`;

const VoteImage = styled.img`
  width: 64px;
  height: 64px;
  border-radius: 12px;
  object-fit: cover;
`;

const VoteMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;

  strong {
    font-size: 0.95rem;
  }

  span {
    font-size: 0.85rem;
    color: #7a7a90;
  }
`;

const KoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
`;

const KoCard = styled.div`
  background: #fff;
  border-radius: 16px;
  border: 1px solid #ececf3;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: 0 15px 40px rgba(15, 18, 63, 0.08);

  small {
    color: #7a7a90;
  }
`;

const KoPair = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const EmptyState = styled.div`
  border-radius: 18px;
  border: 1px dashed #dcdde6;
  padding: 2rem;
  text-align: center;
  color: #77768c;
  margin: 1rem 0;
`;

const PlaceholderText = styled.p`
  color: #777;
`;

const ModalNavRow = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 0 1.5rem;
  margin-bottom: 0.5rem;
`;

const NavButton = styled.button`
  flex: 1;
  min-width: 0;
  border-radius: 999px;
  border: 1px solid #d7d7e6;
  padding: 0.55rem 1.2rem;
  background: #fff;
  font-weight: 600;
  cursor: pointer;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};

  &:hover:not(:disabled) {
    border-color: #ffb522;
    color: #a85b00;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(14, 17, 42, 0.65);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  z-index: 999;
`;

const ModalCard = styled.div`
  background: #fff;
  border-radius: 24px;
  width: min(1100px, calc(100vw - 0.5rem));
  max-height: calc(100vh - 1rem);
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem 0.5rem;
  gap: 1rem;

  h3 {
    margin: 0;
  }

  small {
    color: #7a7a90;
  }
`;

const ModalBody = styled.div`
  padding: 1rem 1.5rem 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
`;

const ModalVoteWrapper = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  height: calc(100vh - 320px);
  @media (max-width: 720px) {
    grid-template-columns: 1fr;
    grid-auto-rows: calc((100vh - 320px) / 2);
  }
`;

const ModalVoteOption = styled(VoteOption)`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0.75rem;
  min-height: 0;
  height: 100%;
  ${({ disabled }) =>
    disabled
      ? `
    cursor: default;
    pointer-events: none;
  `
      : ''}
  ${({ $selected }) =>
    $selected
      ? `
    border-color: #ff8c42;
    box-shadow: 0 0 0 3px rgba(255, 140, 66, 0.25);
  `
      : ''}
`;

const ModalVoteImage = styled.img`
  width: 100%;
  border-radius: 16px;
  object-fit: contain;
  background: #f7f7fa;
  flex: 1;
  margin-bottom: 0.5rem;
  max-height: calc(100% - 48px);
`;

const CloseModalButton = styled.button`
  border: none;
  background: transparent;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
`;

const PreviewGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  scroll-snap-type: x mandatory;
  @media (min-width: 720px) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    overflow: visible;
    padding-bottom: 0;
  }
`;

const PreviewCard = styled.div`
  border: 1px solid #eee;
  border-radius: 16px;
  padding: 0.75rem;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 240px;
  scroll-snap-align: start;
`;

const PreviewImage = styled.img`
  width: 100%;
  border-radius: 12px;
  object-fit: contain;
  background: #f8f8fb;
  aspect-ratio: 4 / 3;
  flex: 1;
`;

const PreviewMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  color: #6a6882;
`;

const ResultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ResultItem = styled.div`
  border: 1px solid #eee;
  border-radius: 14px;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
`;

const ResultInfo = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
`;

const ResultImage = styled.img`
  width: 56px;
  height: 56px;
  border-radius: 12px;
  object-fit: cover;
  background: #f1f1f6;
`;

const ResultWins = styled.span`
  font-weight: 700;
  color: #c35b00;
`;
