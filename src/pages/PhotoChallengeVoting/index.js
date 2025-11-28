import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../../Header';
import { useUser } from '../../context/UserContext';
import {
  useKoRoundLabel,
  buildAssetUrl,
  shuffleArray
} from './utils';
import * as S from './PhotoChallengeVoting.styles';
import SubmissionPanel from './SubmissionPanel';
import Winner from './Winner';
import Group from './Group';
import KoMatches from './KoMatches';
import GroupModal from './GroupModal';
import KoModal from './KoModal';
import ImageLightbox from './ImageLightbox';

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
    if (!apiUrl || !challengeId) return;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ challenge_id: challengeId });
      if (userId) {
        params.set('nutzer_id', userId);
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

  const handleSubmitPhoto = async (imageId, title = '') => {
    if (!apiUrl || !challengeId || !userId) {
      setActionMessage('Bitte logge dich ein, um einzureichen.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('nutzer_id', userId);
      formData.append('challenge_id', challengeId);
      formData.append('image_id', imageId);
      if (title) {
        formData.append('title', title);
      }
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
        title: activeKoModalMatch.image_a_title,
        url: activeKoModalMatch.image_a_url,
        votes: activeKoModalMatch.votes_a,
      },
      {
        id: activeKoModalMatch.image_b_id,
        title: activeKoModalMatch.image_b_title,
        url: activeKoModalMatch.image_b_url,
        votes: activeKoModalMatch.votes_b,
      },
    ];
    const orientation = koModal.orientation?.[activeKoModalMatch.id] === 'swap';
    return orientation ? [baseSides[1], baseSides[0]] : baseSides;
  }, [activeKoModalMatch, koModal]);

  if (!challengeId) {
    return (
      <S.FullPage>
        <Header />
        <S.Content>
          <S.EmptyState>Bitte rufe diese Seite mit einer Challenge-ID auf.</S.EmptyState>
        </S.Content>
      </S.FullPage>
    );
  }

  return (
    <S.FullPage>
      <Header />
      <S.Content>
        <S.HeroSection>
          <div>
            <h1>{overview?.challenge ? (overview.challenge.title) : "Foto-Challenge"}</h1>
            <p>Stimme für deine Lieblingsbilder und hilf mit zu entscheiden, wer weiterkommt.</p>
          </div>
        </S.HeroSection>

        {!isLoggedIn && (
          <S.WarningBox>Bitte logge dich ein, um abstimmen zu können. Stimmen ohne Login werden nicht gezählt.</S.WarningBox>
        )}
        {error && <S.WarningBox>{error}</S.WarningBox>}
        {actionMessage && (
          <S.ActionMessage>
            {actionMessage}
            <button type="button" onClick={() => setActionMessage(null)}>
              ×
            </button>
          </S.ActionMessage>
        )}

        <SubmissionPanel
          overview={overview}
          isLoggedIn={isLoggedIn}
          submissionsRemaining={submissionsRemaining}
          userImages={userImages}
          userImagesLoading={userImagesLoading}
          submittedImageIds={submittedImageIds}
          submissionLimit={submissionLimit}
          handleSubmitPhoto={handleSubmitPhoto}
          userImagesHasMore={userImagesHasMore}
          loadUserImages={loadUserImages}
          userImagesPage={userImagesPage}
          userSubmissions={userSubmissions}
        />

        {overview?.challenge?.status !== 'submission_open' && (
          <S.PhaseSlider>
            {phases.map((phase) => (
              <S.PhasePill
                key={phase.key}
                type="button"
                $active={activePhase === phase.key}
                disabled={phase.disabled}
                onClick={() => !phase.disabled && setActivePhase(phase.key)}
              >
                {phase.label}
              </S.PhasePill>
            ))}
          </S.PhaseSlider>
        )}

        {loading && <S.PlaceholderText>Lade Challenge …</S.PlaceholderText>}

        {!loading && activePhase === 'winner' && overview?.winner && (
          <Winner winner={overview.winner} />
        )}

        {!loading && overview?.challenge?.status !== 'submission_open' && activePhase === 'group' && (
          <Group groups={groupsSorted} openGroupModal={openGroupModal} />
        )}

        {!loading &&
          overview?.challenge?.status !== 'submission_open' &&
          activePhase !== 'group' &&
          activePhase !== 'winner' &&
          <KoMatches
            koMatches={overview.ko_matches}
            openKoModal={openKoModal}
            getKoRoundLabel={getKoRoundLabel}
            activePhase={activePhase}
            koMatchesByRound={koMatchesByRound}
          />
        }

        <GroupModal
          groupModal={groupModal}
          activeModalGroup={activeModalGroup}
          closeGroupModal={closeGroupModal}
          goPrevModalMatch={goPrevModalMatch}
          advanceModalMatch={advanceModalMatch}
          activeModalMatch={activeModalMatch}
          modalSides={modalSides}
          handleModalVote={handleModalVote}
          setImagePreview={setImagePreview}
          isLoggedIn={isLoggedIn}
        />

        <KoModal
          koModal={koModal}
          activeKoModalMatch={activeKoModalMatch}
          closeKoModal={closeKoModal}
          goPrevKoModalMatch={goPrevKoModalMatch}
          goNextKoModalMatch={goNextKoModalMatch}
          koModalSides={koModalSides}
          handleKoModalVote={handleKoModalVote}
          getKoRoundLabel={getKoRoundLabel}
          setImagePreview={setImagePreview}
          isLoggedIn={isLoggedIn}
        />

        <ImageLightbox imagePreview={imagePreview} setImagePreview={setImagePreview} />

      </S.Content>
    </S.FullPage>
  );
}

export default PhotoChallengeVoting;