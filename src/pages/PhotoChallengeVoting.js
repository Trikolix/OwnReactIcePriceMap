import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import Header from '../Header';
import { useUser } from '../context/UserContext';

const describeRoundByParticipants = (count) => {
  if (!count || count <= 0) return null;
  if (count <= 2) return 'Finale';
  if (count === 4) return 'Halbfinale';
  if (count === 8) return 'Viertelfinale';
  if (count === 16) return 'Achtelfinale';
  if (count === 32) return 'Sechzehntelfinale';
  if (count === 64) return 'Zweiunddreißigstelfinale';
  return `${count}-er Runde`;
};

const useKoRoundLabel = (overview) => {
  const firstRoundParticipants = useMemo(() => {
    const firstRoundMatches = (overview?.ko_matches || []).filter((match) => (Number(match.round) || 0) === 1);
    return firstRoundMatches.length * 2;
  }, [overview?.ko_matches]);

  return useCallback(
    (roundNumber) => {
      if (!firstRoundParticipants) return `KO-Runde ${roundNumber}`;
      const divisor = Math.max(0, roundNumber - 1);
      const participants = Math.max(1, Math.floor(firstRoundParticipants / 2 ** divisor));
      return describeRoundByParticipants(participants) || `KO-Runde ${roundNumber}`;
    },
    [firstRoundParticipants]
  );
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
  const [koModal, setKoModal] = useState(null); // { round, matchIds, matchIndex, orientation }
  const [imagePreview, setImagePreview] = useState(null); // { url, label }
  const [userImages, setUserImages] = useState([]);
  const [userImagesLoading, setUserImagesLoading] = useState(false);
  const [userImagesHasMore, setUserImagesHasMore] = useState(false);
  const [userImagesPage, setUserImagesPage] = useState(1);
  const getKoRoundLabel = useKoRoundLabel(overview);
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

  const loadUserImages = useCallback(
    async (page = 1, append = false) => {
      if (!apiUrl || !userId) return;
      setUserImagesLoading(true);
      try {
        const params = new URLSearchParams({
          nutzer_id: userId,
          page: String(page),
        });
        const res = await fetch(`${apiUrl}/photo_challenge/list_user_images.php?${params.toString()}`);
        const data = await res.json();
        if (data.status === 'success') {
          setUserImages((prev) => (append ? [...prev, ...(data.data || [])] : data.data || []));
          setUserImagesHasMore(Boolean(data.data && data.data.length === (data.meta?.limit || 30)));
          setUserImagesPage(page);
        } else {
          throw new Error(data.message || 'Bilder konnten nicht geladen werden.');
        }
      } catch (err) {
        if (!append) {
          setUserImages([]);
        }
        setUserImagesHasMore(false);
      } finally {
        setUserImagesLoading(false);
      }
    },
    [apiUrl, userId]
  );

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview, refreshKey]);

  useEffect(() => {
    if (!overview) return;
    if (overview.challenge?.status === 'submission_open') {
      setActivePhase('submission');
      return;
    }
    if (overview.challenge?.status === 'finished' && overview.winner) {
      setActivePhase((prev) => (prev === 'winner' ? prev : 'winner'));
      return;
    }
    if (overview.challenge?.status === 'group_running') {
      setActivePhase('group');
    } else if (overview.challenge?.status === 'ko_running') {
      const maxRound = Math.max(0, ...(overview.ko_matches || []).map((match) => Number(match.round) || 0));
      if (maxRound > 0) {
        setActivePhase(`ko_round_${maxRound}`);
      }
    }
  }, [overview]);

  useEffect(() => {
    if (overview?.challenge?.status === 'submission_open' && isLoggedIn) {
      loadUserImages();
    } else {
      setUserImages([]);
    }
  }, [overview?.challenge?.status, isLoggedIn, loadUserImages]);

  const phases = useMemo(() => {
    const base = [];
    base.push({ key: 'group', label: 'Gruppenphase' });
    const koRounds = Array.from(
      new Set((overview?.ko_matches || []).map((match) => Number(match.round) || 0))
    )
      .filter((round) => round > 0)
      .sort((a, b) => a - b);
    koRounds.forEach((round) => {
      base.push({
        key: `ko_round_${round}`,
        label: getKoRoundLabel(round),
        disabled: false,
      });
    });
    if (overview?.winner) {
      base.push({ key: 'winner', label: 'Gewinner' });
    }
    return base;
  }, [overview?.ko_matches, getKoRoundLabel]);

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

  const activeKoModalMatch = useMemo(() => {
    if (!koModal) return null;
    const matchId = koModal.matchIds?.[koModal.matchIndex];
    if (!matchId) return null;
    return (overview?.ko_matches || []).find((match) => match.id === matchId) || null;
  }, [koModal, overview?.ko_matches]);

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

  const openKoModal = (round, matchId) => {
    const matchesInRound = (koMatchesByRound.get(round) || []).slice().sort((a, b) => a.position - b.position);
    if (!matchesInRound.length) return;
    const matchIds = matchesInRound.map((match) => match.id);
    const orientation = {};
    matchesInRound.forEach((match) => {
      orientation[match.id] = Math.random() < 0.5 ? 'swap' : 'keep';
    });
    const startIndex = Math.max(0, matchIds.indexOf(matchId));
    setKoModal({
      round,
      matchIds,
      matchIndex: startIndex,
      orientation,
    });
  };

  const closeKoModal = () => setKoModal(null);

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

  const goKoMatch = useCallback((direction, { closeOnEnd = false } = {}) => {
    setKoModal((prev) => {
      if (!prev) return prev;
      const total = prev.matchIds?.length || 0;
      if (total === 0) return null;
      const nextIndex = prev.matchIndex + direction;
      if (nextIndex < 0) {
        return { ...prev, matchIndex: 0 };
      }
      if (nextIndex >= total) {
        if (closeOnEnd) {
          return null;
        }
        return { ...prev, matchIndex: total - 1 };
      }
      return { ...prev, matchIndex: nextIndex };
    });
  }, []);

  const goPrevKoModalMatch = useCallback(() => goKoMatch(-1), [goKoMatch]);
  const goNextKoModalMatch = useCallback(() => goKoMatch(1, { closeOnEnd: false }), [goKoMatch]);
  const advanceKoModalMatch = useCallback(
    (closeOnEnd = true) => goKoMatch(1, { closeOnEnd }),
    [goKoMatch]
  );

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

  useEffect(() => {
    if (!koModal) return;
    if (!activeKoModalMatch) {
      setKoModal(null);
    }
  }, [koModal, activeKoModalMatch]);

  const handleModalVote = (match, imageId) => {
    handleVote(match.id, imageId, {
      onSuccess: () => advanceModalMatch(true),
      onDuplicate: () => advanceModalMatch(true),
    });
  };

  const handleKoModalVote = (match, imageId) => {
    handleVote(match.id, imageId, {
      onSuccess: () => advanceKoModalMatch(true),
      onDuplicate: () => advanceKoModalMatch(true),
    });
  };

  const handleSubmitPhoto = async (imageId) => {
    if (!apiUrl || !challengeId || !userId) {
      setActionMessage('Bitte logge dich ein, um einzureichen.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('nutzer_id', userId);
      formData.append('challenge_id', challengeId);
      formData.append('image_id', imageId);
      const res = await fetch(`${apiUrl}/photo_challenge/submit_image.php`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.status === 'success') {
        setActionMessage('Einreichung gespeichert – danke!');
        setRefreshKey((val) => val + 1);
      } else {
        throw new Error(data.message || 'Einreichung fehlgeschlagen.');
      }
    } catch (err) {
      setActionMessage(err.message || 'Einreichung fehlgeschlagen.');
    }
  };

  const submissionLimit = overview?.challenge?.submission_limit_per_user
    ? Number(overview.challenge.submission_limit_per_user)
    : null;
  const userSubmissions = overview?.user_submissions || [];
  const submissionsRemaining =
    submissionLimit !== null && submissionLimit !== undefined
      ? Math.max(0, submissionLimit - userSubmissions.length)
      : null;
  const submittedImageIds = new Set(userSubmissions.map((item) => item.image_id));

  const renderSubmissionPanel = () => {
    if (overview?.challenge?.status !== 'submission_open') return null;
    return (
      <SubmissionPanel>
        <h2>Einreichephase</h2>
        {overview.challenge.submission_deadline && (
          <p>
            Einreichungen möglich bis{' '}
            <strong>{new Date(overview.challenge.submission_deadline).toLocaleString('de-DE')}</strong>.
          </p>
        )}
        {submissionLimit ? (
          <p>
            Du kannst insgesamt {submissionLimit} Bild(er) einreichen. Verfügbar:{' '}
            <strong>{submissionsRemaining}</strong>
          </p>
        ) : (
          <p>Du kannst beliebig viele deiner Bilder einreichen.</p>
        )}
        {!isLoggedIn && <WarningBox>Bitte logge dich ein, um Bilder einzureichen.</WarningBox>}
        {isLoggedIn && (
          <>
            <SubmissionImagesWrapper>
              <h3>Deine Bilder</h3>
              {userImagesLoading && <PlaceholderText>Lade Bilder…</PlaceholderText>}
              {!userImagesLoading && !userImages.length && <PlaceholderText>Du hast noch keine Bilder hochgeladen.</PlaceholderText>}
              <SubmissionGrid>
                {userImages.map((image) => {
                  const alreadySubmitted = submittedImageIds.has(image.id);
                  const disabled =
                    Boolean(submissionLimit !== null && submissionsRemaining === 0) || alreadySubmitted;
                  return (
                    <SubmissionImageCard key={image.id} $disabled={disabled}>
                      <SubmissionImageThumb src={buildAssetUrl(image.url)} alt={image.beschreibung || `Bild ${image.id}`} />
                      {image.beschreibung && <small>{image.beschreibung}</small>}
                      <SubmitButton
                        type="button"
                        onClick={() => handleSubmitPhoto(image.id)}
                        disabled={disabled}
                      >
                        {alreadySubmitted ? 'Bereits eingereicht' : 'Einreichen'}
                      </SubmitButton>
                    </SubmissionImageCard>
                  );
                })}
              </SubmissionGrid>
              {userImagesHasMore && (
                <SubmitButton
                  type="button"
                  onClick={() => loadUserImages(userImagesPage + 1, true)}
                  disabled={userImagesLoading}
                >
                  Mehr laden
                </SubmitButton>
              )}
            </SubmissionImagesWrapper>
            <SubmissionImagesWrapper>
              <h3>Deine Einreichungen</h3>
              {!userSubmissions.length && <PlaceholderText>Noch keine Einreichungen.</PlaceholderText>}
              {!!userSubmissions.length && (
                <SubmissionList>
                  {userSubmissions.map((submission) => (
                    <SubmissionCard key={`user-sub-${submission.id}`}>
                      <SubmissionImage
                        src={buildAssetUrl(submission.url)}
                        alt={submission.beschreibung || `Bild ${submission.image_id}`}
                      />
                      <SubmissionInfo>
                        <strong>Bild #{submission.image_id}</strong>
                        <small>{new Date(submission.created_at).toLocaleString()}</small>
                      </SubmissionInfo>
                      <SubmissionStatusChip $variant={submission.status}>
                        {submission.status === 'accepted'
                          ? 'Übernommen'
                          : submission.status === 'rejected'
                          ? 'Abgelehnt'
                          : 'Wartet auf Prüfung'}
                      </SubmissionStatusChip>
                    </SubmissionCard>
                  ))}
                </SubmissionList>
              )}
            </SubmissionImagesWrapper>
          </>
        )}
      </SubmissionPanel>
    );
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

  const koModalSides = useMemo(() => {
    if (!activeKoModalMatch || !koModal) return [];
    const baseSides = [
      {
        id: activeKoModalMatch.image_a_id,
        url: activeKoModalMatch.image_a_url,
        votes: activeKoModalMatch.votes_a,
      },
      {
        id: activeKoModalMatch.image_b_id,
        url: activeKoModalMatch.image_b_url,
        votes: activeKoModalMatch.votes_b,
      },
    ];
    const orientation = koModal.orientation?.[activeKoModalMatch.id] === 'swap';
    return orientation ? [baseSides[1], baseSides[0]] : baseSides;
  }, [activeKoModalMatch, koModal]);

  const renderGroupCard = (group) => {
    const totalMatches = group.matches.length;
    const completedMatches = group.user_votes ?? group.matches.filter((match) => match.has_voted).length;
    const statusVariant = group.status === 'finished' ? 'closed' : group.status === 'upcoming' ? 'upcoming' : 'open';
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
        <StatusChip $variant={statusVariant}>{group.status_label}</StatusChip>
      </GroupCard>
    );
  };

  const renderKoMatches = () => {
    if (!overview?.ko_matches?.length) {
      return <EmptyState>Die KO-Runde hat noch nicht begonnen.</EmptyState>;
    }
    const activeRound = Number(activePhase.replace('ko_round_', ''));
    const matchesInRound = koMatchesByRound.get(activeRound) || [];
    if (!matchesInRound.length) {
      return <EmptyState>Für diese Phase liegen keine Duelle vor.</EmptyState>;
    }
    return (
      <KoGrid>
        {matchesInRound.map((match) => (
            <KoCardButton key={match.id} type="button" onClick={() => openKoModal(match.round, match.id)}>
            <small>{getKoRoundLabel(match.round)}</small>
            <KoPairPreview>
              <KoThumb>
                <VoteImage src={buildAssetUrl(match.image_a_url)} alt={`Bild ${match.image_a_id}`} />
                <VoteMeta>
                  <strong>#{match.image_a_id}</strong>
                  {match.status !== 'open' ? <span>{match.votes_a} Stimme(n)</span> : <span>Noch geheim</span>}
                </VoteMeta>
              </KoThumb>
              <KoThumb>
                <VoteImage src={buildAssetUrl(match.image_b_url)} alt={`Bild ${match.image_b_id}`} />
                <VoteMeta>
                  <strong>#{match.image_b_id}</strong>
                  {match.status !== 'open' ? <span>{match.votes_b} Stimme(n)</span> : <span>Noch geheim</span>}
                </VoteMeta>
              </KoThumb>
            </KoPairPreview>
            <StatusChip
              $variant={
                match.status !== 'open'
                  ? 'closed'
                  : match.user_choice
                  ? 'voted'
                  : 'open'
              }
            >
              {match.status === 'open'
                ? match.user_choice
                  ? 'Du hast hier bereits abgestimmt'
                  : 'Voting läuft – tippe zum Abstimmen'
                : 'Voting beendet – Ergebnisse ansehen'}
            </StatusChip>
          </KoCardButton>
        ))}
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

        {renderSubmissionPanel()}

        {overview?.challenge?.status !== 'submission_open' && (
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
        )}

        {loading && <PlaceholderText>Lade Challenge …</PlaceholderText>}

        {!loading && activePhase === 'winner' && overview?.winner && (
          <WinnerSection>
            <WinnerCard>
              <WinnerBadge>Champion</WinnerBadge>
              <WinnerImageWrapper>
                <WinnerImage src={buildAssetUrl(overview.winner.url)} alt={overview.winner.beschreibung || `Bild ${overview.winner.image_id}`} />
              </WinnerImageWrapper>
              <WinnerMeta>
                <h2>Bild #{overview.winner.image_id}</h2>
                <p>von {overview.winner.username || 'Unbekannt'}</p>
                {overview.winner.beschreibung && <small>{overview.winner.beschreibung}</small>}
                <WinnerSubline>Entschieden in Runde {overview.winner.round}</WinnerSubline>
              </WinnerMeta>
            </WinnerCard>
          </WinnerSection>
        )}

        {!loading && overview?.challenge?.status !== 'submission_open' && activePhase === 'group' && (
          <GroupsGrid>{groupsSorted.length ? groupsSorted.map(renderGroupCard) : <EmptyState>Noch keine Gruppen.</EmptyState>}</GroupsGrid>
        )}

        {!loading &&
          overview?.challenge?.status !== 'submission_open' &&
          activePhase !== 'group' &&
          activePhase !== 'winner' &&
          renderKoMatches()}

        {groupModal && activeModalGroup && (
          <ModalOverlay>
            <ModalCard>
              <ModalHeader>
                <div>
                  <h3>{activeModalGroup.name}</h3>
                  <StatusChip
                    $variant={
                      groupModal.mode === 'active'
                        ? 'open'
                        : groupModal.mode === 'upcoming'
                        ? 'upcoming'
                        : 'closed'
                    }
                  >
                    {groupModal.mode === 'active' && activeModalGroup.matches.length
                      ? `Duell ${groupModal.matchIndex + 1} / ${activeModalGroup.matches.length}`
                      : groupModal.mode === 'upcoming'
                      ? `Startet am ${
                          activeModalGroup.start_at
                            ? new Date(activeModalGroup.start_at).toLocaleDateString('de-DE')
                            : 'bald'
                        }`
                      : 'Voting beendet'}
                  </StatusChip>
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
                            <ResultImageButton
                              type="button"
                              onClick={() =>
                                setImagePreview({
                                  url: result.url,
                                  label: `Bild #${result.image_id}`,
                                })
                              }
                            >
                              <ResultImage src={buildAssetUrl(result.url)} alt={`Bild ${result.image_id}`} />
                            </ResultImageButton>
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
        {koModal && activeKoModalMatch && (
          <ModalOverlay>
            <ModalCard>
              <ModalHeader>
                <div>
                  <h3>{getKoRoundLabel(activeKoModalMatch.round)}</h3>
                  <small>
                    Duell {koModal.matchIndex + 1} / {koModal.matchIds.length}
                  </small>
                </div>
                <CloseModalButton type="button" onClick={closeKoModal}>
                  ×
                </CloseModalButton>
              </ModalHeader>
              <ModalNavRow>
                <NavButton type="button" onClick={goPrevKoModalMatch} disabled={!koModal || koModal.matchIndex === 0}>
                  Zurück
                </NavButton>
                <NavButton
                  type="button"
                  onClick={() => goNextKoModalMatch()}
                  disabled={!koModal || koModal.matchIndex >= koModal.matchIds.length - 1}
                >
                  Weiter
                </NavButton>
              </ModalNavRow>
              <ModalBody>
                <ModalVoteWrapper>
                  {koModalSides.map((side) => (
                    <ModalVoteOption
                      key={side.id}
                      type="button"
                      onClick={() => handleKoModalVote(activeKoModalMatch, side.id)}
                      disabled={activeKoModalMatch.status !== 'open'}
                      $selected={activeKoModalMatch.user_choice === side.id}
                    >
                      <ModalVoteImage src={buildAssetUrl(side.url)} alt={`Bild ${side.id}`} />
                      <VoteMeta>
                        <strong>Bild #{side.id}</strong>
                        {activeKoModalMatch.user_choice === side.id ? (
                          <span>Deine aktuelle Stimme</span>
                        ) : (
                          <span>Tippe zum Abstimmen</span>
                        )}
                      </VoteMeta>
                    </ModalVoteOption>
                  ))}
                </ModalVoteWrapper>
                {activeKoModalMatch.status !== 'open' && (
                  <ResultsList>
                    {koModalSides.map((side) => (
                      <ResultItem key={side.id}>
                        <ResultInfo>
                          <ResultImageButton
                            type="button"
                            onClick={() =>
                              setImagePreview({
                                url: side.url,
                                label: `Bild #${side.id}`,
                              })
                            }
                          >
                            <ResultImage src={buildAssetUrl(side.url)} alt={`Bild ${side.id}`} />
                          </ResultImageButton>
                          <div>
                            <strong>Bild #{side.id}</strong>
                          </div>
                        </ResultInfo>
                        <ResultWins>{side.votes} Stimme(n)</ResultWins>
                      </ResultItem>
                    ))}
                  </ResultsList>
                )}
              </ModalBody>
            </ModalCard>
          </ModalOverlay>
        )}
        {imagePreview && (
          <LightboxOverlay onClick={() => setImagePreview(null)}>
            <LightboxCard onClick={(event) => event.stopPropagation()}>
              <LightboxCloseRow>
                <CloseModalButton type="button" onClick={() => setImagePreview(null)}>
                  ×
                </CloseModalButton>
              </LightboxCloseRow>
              <LightboxImage src={buildAssetUrl(imagePreview.url)} alt={imagePreview.label || 'Bild in voller Größe'} />
              {imagePreview.label && <LightboxCaption>{imagePreview.label}</LightboxCaption>}
            </LightboxCard>
          </LightboxOverlay>
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
  justify-content: center;
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

const StatusChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${({ $variant }) =>
    $variant === 'closed'
      ? '#f2f2f7'
      : $variant === 'upcoming'
      ? '#fff4e6'
      : $variant === 'voted'
      ? '#e6f6ea'
      : '#e5fff4'};
  color: ${({ $variant }) =>
    $variant === 'closed'
      ? '#666278'
      : $variant === 'upcoming'
      ? '#a85b00'
      : $variant === 'voted'
      ? '#2e7d32'
      : '#046747'};
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

const KoCardButton = styled.button`
  background: #fff;
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: 0 15px 40px rgba(15, 18, 63, 0.08);
  border: 1px solid #ececf3;
  cursor: pointer;
  text-align: left;

  small {
    color: #7a7a90;
  }
`;

const KoPairPreview = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
`;

const KoThumb = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const WinnerSection = styled.section`
  margin-bottom: 2rem;
`;

const WinnerCard = styled.div`
  background: linear-gradient(135deg, #ffc757, #ff5ca4);
  border-radius: 32px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.08);
`;

const WinnerBadge = styled.span`
  padding: 0.4rem 1.2rem;
  border-radius: 999px;
  background: #ffd98dff;
  font-weight: 700;
  color: #000000ff;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const WinnerImageWrapper = styled.div`
  width: min(90vw, 520px);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
`;

const WinnerImage = styled.img`
  width: 100%;
  height: auto;
  display: block;
`;

const WinnerMeta = styled.div`
  text-align: center;
  color: #4a3c2f;

  h2 {
    margin: 0;
    font-size: 2rem;
  }

  p {
    margin: 0.2rem 0;
    font-size: 1.1rem;
    font-weight: 600;
  }

  small {
    color: #816c62;
  }
`;

const WinnerSubline = styled.span`
  display: block;
  margin-top: 0.75rem;
  color: #a24d00;
  font-weight: 600;
`;

const SubmissionPanel = styled.section`
  background: #fff;
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SubmissionImagesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SubmissionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
`;

const SubmissionImageCard = styled.div`
  border: 1px solid ${({ $disabled }) => ($disabled ? '#f0f0f0' : '#ececf3')};
  border-radius: 16px;
  padding: 0.75rem;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
`;

const SubmissionImageThumb = styled.img`
  width: 100%;
  border-radius: 12px;
  height: 140px;
  object-fit: cover;
  background: #f7f7fa;
`;

const SubmissionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SubmissionCard = styled.div`
  border: 1px solid #ececf3;
  border-radius: 16px;
  padding: 0.75rem;
  display: grid;
  grid-template-columns: 70px 1fr auto;
  gap: 0.75rem;
  align-items: center;
  background: #fff;
  @media (max-width: 640px) {
    grid-template-columns: 60px 1fr;
  }
`;

const SubmissionImage = styled.img`
  width: 70px;
  height: 70px;
  border-radius: 12px;
  object-fit: cover;
  background: #f1f1f6;
  @media (max-width: 640px) {
    width: 60px;
    height: 60px;
  }
`;

const SubmissionInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;

  strong {
    font-size: 1rem;
  }

  small {
    color: #7d7b92;
  }
`;

const SubmissionStatusChip = styled.span`
  justify-self: end;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${({ $variant }) =>
    $variant === 'accepted'
      ? '#e6f6ea'
      : $variant === 'pending'
      ? '#fff4e6'
      : '#f2f2f7'};
  color: ${({ $variant }) =>
    $variant === 'accepted'
      ? '#2e7d32'
      : $variant === 'pending'
      ? '#a85b00'
      : '#666278'};
`;

const SubmitButton = styled.button`
  border-radius: 12px;
  border: 1px solid #bbb;
  background: #fff;
  padding: 0.45rem 0.75rem;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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

const LightboxOverlay = styled(ModalOverlay)`
  padding: 2rem;
`;

const LightboxCard = styled.div`
  position: relative;
  background: #fff;
  border-radius: 20px;
  padding: 1rem 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  max-width: min(90vw, 720px);
  max-height: calc(100vh - 3rem);
`;

const LightboxCloseRow = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
`;

const LightboxImage = styled.img`
  max-width: 100%;
  max-height: calc(100vh - 220px);
  border-radius: 16px;
  object-fit: contain;
  background: #f8f8fb;
`;

const LightboxCaption = styled.span`
  font-weight: 600;
  color: #5a5673;
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
  overflow: auto;
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

const ResultImageButton = styled.button`
  border: none;
  background: transparent;
  padding: 0;
  cursor: zoom-in;
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
