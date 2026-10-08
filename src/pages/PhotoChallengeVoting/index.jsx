import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../../Header';
import { Button, ActionRow, Notice, ChallengeDialog } from '../../components/ChallengeUI';
import { photoStatusLabel, photoDateValue } from '../../utils/photoChallengePresentation';
import NewAwards from '../../components/NewAwards';
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
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activePhase, setActivePhase] = useState('group');
  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [mutationBusy, setMutationBusy] = useState(false);
  const mutationRef = React.useRef(false);
  const contextRef = React.useRef('');
  contextRef.current = `${challengeId}:${userId || ''}`;
  const [submissionOpen, setSubmissionOpen] = useState(false);
  const [newAwards, setNewAwards] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [groupModal, setGroupModal] = useState(null); // { groupId, mode, matchOrder, matchIndex, orientation }
  const [koModal, setKoModal] = useState(null); // { round, matchIds, matchIndex, orientation }
  const [imagePreview, setImagePreview] = useState(null); // { url, label }
  const [userImages, setUserImages] = useState([]);
  const [userImagesLoading, setUserImagesLoading] = useState(false);
  const [userImagesError, setUserImagesError] = useState(null);
  const [userImagesHasMore, setUserImagesHasMore] = useState(false);
  const [userImagesPage, setUserImagesPage] = useState(1);
  const getKoRoundLabel = useKoRoundLabel(overview);
  const requestIdRef = React.useRef(0);
  const challengeFlags = overview?.challenge_flags || {};
  const showCountryBadges = Boolean(overview?.challenge?.is_country_challenge);
  const isSubmissionStage = Boolean(
    challengeFlags.submission_is_open_effective || challengeFlags.submission_is_closed_effective
  );

  useEffect(() => {
    setOverview(null); setSubmissionOpen(false); setGroupModal(null); setKoModal(null); setImagePreview(null);
    setActionError(null); setActionMessage(null); setNewAwards([]); setUserImages([]); setUserImagesError(null);
  }, [challengeId, userId]);

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
      const context = contextRef.current;
      setUserImagesLoading(true); setUserImagesError(null);
      try {
        const params = new URLSearchParams({
          nutzer_id: userId,
          challenge_id: challengeId,
          page: String(page),
        });
        const res = await fetch(`${apiUrl}/photo_challenge/list_user_images.php?${params.toString()}`);
        const data = await res.json();
        if (context !== contextRef.current) return;
        if (data.status === 'success') {
          setUserImages((prev) => (append ? [...prev, ...(data.data || [])] : data.data || []));
          setUserImagesHasMore(Boolean(data.data && data.data.length === (data.meta?.limit || 30)));
          setUserImagesPage(page);
        } else {
          throw new Error(data.message || 'Bilder konnten nicht geladen werden.');
        }
      } catch (err) {
        if (context !== contextRef.current) return;
        setUserImagesError(err.message || 'Deine Fotos konnten nicht geladen werden.');
        if (!append) {
          setUserImages([]);
        }
        setUserImagesHasMore(false);
      } finally {
        if (context === contextRef.current) setUserImagesLoading(false);
      }
    },
    [apiUrl, challengeId, userId]
  );

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview, refreshKey]);

  useEffect(() => {
    if (!overview) return;
    if (challengeFlags.submission_is_open_effective || challengeFlags.submission_is_closed_effective) {
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
  }, [overview?.challenge?.id, overview?.challenge?.status, challengeFlags.submission_is_open_effective, challengeFlags.submission_is_closed_effective]);

  useEffect(() => {
    if (isSubmissionStage && isLoggedIn) {
      loadUserImages();
    } else {
      setUserImages([]);
    }
  }, [isSubmissionStage, isLoggedIn, loadUserImages]);

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

  const postAction = async (endpoint, fields) => {
    if (mutationRef.current || !apiUrl || !userId) return null;
    mutationRef.current = true; setMutationBusy(true); setActionError(null);
    const context = contextRef.current;
    try {
      const form = new FormData();
      Object.entries(fields).forEach(([key, value]) => { if (value !== null && value !== undefined) form.append(key, value); });
      const response = await fetch(`${apiUrl}/photo_challenge/${endpoint}`, { method: 'POST', body: form });
      const data = await response.json();
      if (context !== contextRef.current) return null;
      if (!response.ok || data.status !== 'success') throw new Error(data.message || 'Die Aktion konnte nicht gespeichert werden.');
      return data;
    } catch (error) {
      if (context === contextRef.current) setActionError(error.message || 'Verbindung fehlgeschlagen. Bitte versuche es erneut.');
      return null;
    } finally { mutationRef.current = false; setMutationBusy(false); }
  };

  const handleVote = async (matchId, imageId, options = {}) => {
    if (!isLoggedIn || !userId) {
      setActionMessage('Bitte logge dich ein, um abzustimmen.');
      return;
    }
    if (!apiUrl) return;
    if (matchId !== undefined && options.currentChoice === imageId) {
      setActionMessage('Das ist bereits deine aktuelle Stimme.');
      return;
    }
    const data = await postAction('vote.php', { match_id: matchId, image_id: imageId, nutzer_id: userId });
    if (!data) return;
    setActionMessage(data.message || 'Stimme gespeichert – danke!');
    setNewAwards(Array.isArray(data.new_awards) ? data.new_awards : []);
    // Update locally before advancing, so the next button cannot submit the same duel again.
    setOverview(previous => previous && ({ ...previous,
      groups: (previous.groups || []).map(group => {
        const matches = group.matches.map(match => String(match.id) === String(matchId) ? { ...match, has_voted: true, user_choice: imageId } : match);
        return { ...group, matches, user_votes: matches.filter(match => match.has_voted).length };
      }),
      ko_matches: (previous.ko_matches || []).map(match => String(match.id) === String(matchId) ? { ...match, has_voted: true, user_choice: imageId } : match),
    }));
    if (data.vote_action === 'updated') options.onUpdate?.(data);
    else if (data.vote_action !== 'unchanged') options.onSuccess?.();
    setRefreshKey(value => value + 1);
  };

  const groupsSorted = useMemo(() => {
    const getGroupPriority = (group) => {
      const totalMatches = Array.isArray(group.matches) ? group.matches.length : 0;
      const completedMatches =
        typeof group.user_votes === 'number'
          ? group.user_votes
          : (group.matches || []).filter((match) => match.has_voted).length;
      const hasOpenVotes = group.status !== 'finished' && group.status !== 'upcoming' && totalMatches > 0 && completedMatches < totalMatches;
      const isRunningButDone = group.status !== 'finished' && group.status !== 'upcoming' && totalMatches > 0 && completedMatches >= totalMatches;

      if (hasOpenVotes) return 0;
      if (isRunningButDone) return 1;
      if (group.status === 'upcoming') return 2;
      if (group.status === 'finished') return 3;
      return 4;
    };

    return (overview?.groups || [])
      .slice()
      .sort((a, b) => {
        const priorityDiff = getGroupPriority(a) - getGroupPriority(b);
        if (priorityDiff !== 0) return priorityDiff;
        return (a.position || 0) - (b.position || 0);
      });
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
    const shuffled = shuffleArray(group.matches);
    const matchOrder = [...shuffled.filter(match => match.status === 'open' && !match.has_voted), ...shuffled.filter(match => match.status !== 'open' || match.has_voted)].map(match => match.id);
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
      currentChoice: match.user_choice,
      onSuccess: () => {
        const group = overview?.groups.find(item => String(item.id) === String(groupModal?.groupId));
        const index = groupModal?.matchOrder.findIndex(id => String(id) !== String(match.id) && group?.matches.some(item => String(item.id) === String(id) && item.status === 'open' && !item.has_voted && item.user_choice == null));
        if (index >= 0) setGroupModal(previous => ({ ...previous, matchIndex: index }));
        else { setGroupModal(null); setActionMessage('Alle offenen Duelle dieser Gruppe beantwortet. Danke!'); }
      },
      onUpdate: () => undefined,
    });
  };

  const handleKoModalVote = (match, imageId) => {
    handleVote(match.id, imageId, {
      currentChoice: match.user_choice,
      onSuccess: () => {
        const index = koModal?.matchIds.findIndex(id => String(id) !== String(match.id) && overview?.ko_matches.some(item => String(item.id) === String(id) && item.status === 'open' && !item.has_voted && item.user_choice == null));
        if (index >= 0) setKoModal(previous => ({ ...previous, matchIndex: index }));
        else { setKoModal(null); setActionMessage('Alle offenen Duelle dieser Runde beantwortet. Danke!'); }
      },
      onUpdate: () => undefined,
    });
  };

  const handleSubmitPhoto = async (imageId, title = '', file = null) => {
    const data = await postAction('submit_image.php', { nutzer_id: userId, challenge_id: challengeId,
      image_id: file ? null : imageId, image: file, title });
    if (!data) return false;
    setActionMessage('Dein Foto wurde eingereicht.'); setRefreshKey(value => value + 1); return true;
  };
  const handleDeleteSubmission = async submissionId => {
    const data = await postAction('delete_submission.php', { nutzer_id: userId, submission_id: submissionId });
    if (!data) return false;
    setActionMessage('Dein Foto wurde aus der Challenge entfernt.'); setRefreshKey(value => value + 1); return true;
  };
  const handleUpdateSubmissionTitle = async (submissionId, title = '') => {
    const data = await postAction('update_submission.php', { nutzer_id: userId, submission_id: submissionId, title });
    if (!data) return false;
    setActionMessage('Der Foto-Titel wurde gespeichert.'); setRefreshKey(value => value + 1); return true;
  };

  useEffect(() => {
    const deadline = photoDateValue(overview?.challenge?.submission_deadline);
    let timer;
    if (challengeFlags.submission_is_open_effective && deadline) {
      const remaining = deadline.getTime() - Date.now();
      if (remaining >= 0 && remaining < 2147483000) timer = setTimeout(() => fetchOverview(), remaining + 100);
    }
    const refresh = () => { if (document.visibilityState === 'visible') fetchOverview(); };
    document.addEventListener('visibilitychange', refresh);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', refresh); };
  }, [fetchOverview, overview?.challenge?.submission_deadline, challengeFlags.submission_is_open_effective]);

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
        title: activeModalMatch.image_a_title,
        country_name: activeModalMatch.image_a_country_name,
        country_code: activeModalMatch.image_a_country_code,
        url: activeModalMatch.image_a_url,
        votes: activeModalMatch.votes_a,
      },
      {
        id: activeModalMatch.image_b_id,
        title: activeModalMatch.image_b_title,
        country_name: activeModalMatch.image_b_country_name,
        country_code: activeModalMatch.image_b_country_code,
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
        country_name: activeKoModalMatch.image_a_country_name,
        country_code: activeKoModalMatch.image_a_country_code,
        url: activeKoModalMatch.image_a_url,
        votes: activeKoModalMatch.votes_a,
      },
      {
        id: activeKoModalMatch.image_b_id,
        title: activeKoModalMatch.image_b_title,
        country_name: activeKoModalMatch.image_b_country_name,
        country_code: activeKoModalMatch.image_b_country_code,
        url: activeKoModalMatch.image_b_url,
        votes: activeKoModalMatch.votes_b,
      },
    ];
    const orientation = koModal.orientation?.[activeKoModalMatch.id] === 'swap';
    return orientation ? [baseSides[1], baseSides[0]] : baseSides;
  }, [activeKoModalMatch, koModal]);

  const detailStatus = overview?.challenge?.status || '';
  const detailStatusLabel = photoStatusLabel(detailStatus);
  const detailStatusHint = detailStatus === 'finished'
    ? 'Die Ergebnisse stehen fest.'
    : isSubmissionStage
    ? challengeFlags.submission_is_open_effective ? 'Reiche deinen Eis-Moment ein.' : 'Die Fotos werden für die Abstimmung vorbereitet.'
    : 'Deine Stimme entscheidet, wer weiterkommt.';

  const login = () => {
    setGroupModal(null); setKoModal(null); setSubmissionOpen(false);
    requestAnimationFrame(() => window.dispatchEvent(new CustomEvent('auth:open-login')));
  };
  const startVoting = () => {
    if (detailStatus === 'group_running') {
      const group = groupsSorted.find(item => item.status !== 'finished' && item.status !== 'upcoming' && item.matches.some(match => match.status === 'open' && !match.has_voted))
        || groupsSorted.find(item => item.status !== 'finished' && item.status !== 'upcoming');
      if (group) openGroupModal(group);
    } else {
      const matches = (overview?.ko_matches || []).filter(match => match.status === 'open').sort((a, b) => a.round - b.round || a.position - b.position);
      const match = matches.find(item => !item.has_voted && item.user_choice == null) || matches[0];
      if (match) openKoModal(match.round, match.id);
    }
  };
  const hasOpenVotes = detailStatus === 'group_running'
    ? groupsSorted.some(group => !['upcoming', 'finished'].includes(group.status) && group.matches.some(match => match.status === 'open'))
    : (overview?.ko_matches || []).some(match => match.status === 'open');

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
        <Button as={Link} $secondary to="/photo-challenge" style={{ marginBottom: 16 }}>Zur Übersicht</Button>
        <S.HeroSection>
          <S.HeroCopy>
            <S.HeroEyebrow>Foto-Challenge</S.HeroEyebrow>
            <h1>{overview?.challenge ? (overview.challenge.title) : "Foto-Challenge"}</h1>
            <S.HeroDescription>
              {overview?.challenge?.description || 'Stimme für deine Lieblingsbilder und hilf mit zu entscheiden, wer weiterkommt.'}
            </S.HeroDescription>
          </S.HeroCopy>
          <S.HeroStatusPanel>
            <S.HeroStatusChip $status={detailStatus}>{detailStatusLabel}</S.HeroStatusChip>
            <span>{detailStatusHint}</span>
          </S.HeroStatusPanel>
        </S.HeroSection>

        <S.Journey aria-label="Ablauf der Foto-Challenge">{['Einreichen', 'Abstimmen', 'Ergebnisse'].map((label, index) => <li key={label} aria-current={(isSubmissionStage ? 0 : detailStatus === 'finished' ? 2 : 1) === index ? 'step' : undefined}>{index + 1}. {label}</li>)}</S.Journey>
        <ActionRow style={{ marginBottom: 20 }}>
          {challengeFlags.submission_is_open_effective && <Button disabled={loading || submissionsRemaining === 0} onClick={() => isLoggedIn ? setSubmissionOpen(true) : login()}>Foto einreichen</Button>}
          {['group_running', 'ko_running'].includes(detailStatus) && hasOpenVotes && <Button disabled={loading} onClick={() => isLoggedIn ? startVoting() : login()}>Jetzt abstimmen</Button>}
          {!isLoggedIn && <Button $secondary onClick={login}>Einloggen und mitmachen</Button>}
        </ActionRow>
        {error && <Notice $error role="alert">{error} <Button $secondary onClick={fetchOverview}>Erneut versuchen</Button></Notice>}
        {actionError && <Notice $error role="alert">{actionError}</Notice>}
        {actionMessage && (
          <S.ActionMessage>
            {actionMessage}
            <button type="button" onClick={() => setActionMessage(null)}>
              ×
            </button>
          </S.ActionMessage>
        )}

        <ChallengeDialog open={newAwards.length > 0} title="Neue Auszeichnungen" onClose={() => setNewAwards([])}><NewAwards awards={newAwards} /></ChallengeDialog>

        <SubmissionPanel
          key={`${challengeId}:${userId || "guest"}`}
          dialogOpen={submissionOpen} setDialogOpen={setSubmissionOpen}
          mutationBusy={mutationBusy} actionError={actionError}
          overview={overview}
          challengeFlags={challengeFlags}
          isLoggedIn={isLoggedIn}
          submissionsRemaining={submissionsRemaining}
          userImages={userImages}
          userImagesLoading={userImagesLoading} userImagesError={userImagesError}
          submittedImageIds={submittedImageIds}
          submissionLimit={submissionLimit}
          handleSubmitPhoto={handleSubmitPhoto}
          handleDeleteSubmission={handleDeleteSubmission}
          handleUpdateSubmissionTitle={handleUpdateSubmissionTitle}
          userImagesHasMore={userImagesHasMore}
          loadUserImages={loadUserImages}
          userImagesPage={userImagesPage}
          userSubmissions={userSubmissions}
          setImagePreview={setImagePreview}
        />

        {!isSubmissionStage && (
          <S.PhaseSlider>
            {phases.map((phase) => (
              <S.PhasePill
                key={phase.key}
                type="button"
                $active={activePhase === phase.key} aria-pressed={activePhase === phase.key}
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
          <Winner winner={overview.winner} thirdPlace={overview.third_place} />
        )}

        {!loading && !isSubmissionStage && activePhase === 'group' && (
          <Group
            groups={groupsSorted}
            openGroupModal={openGroupModal}
            showCountryBadges={showCountryBadges}
          />
        )}

        {!loading &&
          !isSubmissionStage &&
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
          mutationBusy={mutationBusy} actionError={actionError} onLogin={login}
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
          showCountryBadges={showCountryBadges}
        />

        <KoModal
          mutationBusy={mutationBusy} actionError={actionError} onLogin={login}
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
          showCountryBadges={showCountryBadges}
        />

        <ImageLightbox imagePreview={imagePreview} setImagePreview={setImagePreview} />

      </S.Content>
    </S.FullPage>
  );
}

export default PhotoChallengeVoting;
