
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from '../Header';
import PhotoChallengeAdminWorkspace from './PhotoChallengeAdminWorkspace';
import { useSearchParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const createDefaultCreateForm = () => ({
  title: '',
  description: '',
  status: 'draft',
  startAt: '',
  minImageCreatedAt: '',
  submissionDeadline: '',
  submissionLimitPerUser: 3,
  allowDirectUploads: false,
});

const createDefaultPlanningForm = () => ({
  plannedGroupCount: 4,
  groupSize: 4,
  groupAdvancers: 2,
  luckyLoserSlots: 2,
  koBracketSize: '',
  startAt: '',
  minImageCreatedAt: '',
  submissionDeadline: '',
  submissionLimitPerUser: 3,
  allowDirectUploads: false,
  groupSchedule: [],
});

const formatDateTimeLocal = (value) => {
  if (!value) return '';
  // API timestamps are Berlin wall time. Keep them when editing, regardless of the browser timezone.
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(value) && !/[Z+]/.test(value)) return value.replace(' ', 'T').slice(0, 16);
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const parts = Object.fromEntries(new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

const parseGroupScheduleSlots = (rawSchedule) => {
  if (!rawSchedule) return [];
  let schedule = rawSchedule;
  if (typeof schedule === 'string') {
    try {
      schedule = JSON.parse(schedule);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(schedule) || schedule.length === 0) {
    return [];
  }
  return schedule.map((slot, index) => ({
    id: `loaded-slot-${Date.now()}-${index}`,
    startAt: formatDateTimeLocal(slot.start_at || slot.startAt || ''),
    durationDays: String(slot.duration_days ?? slot.durationDays ?? 14),
    groups: String(slot.groups ?? slot.group_count ?? slot.groupCount ?? 1),
  }));
};

const buildPlanningFormFromChallenge = (challenge) => {
  if (!challenge) return createDefaultPlanningForm();
  const groupSize = Number(challenge.group_size) || 4;
  const imageCount = Number(challenge.image_count) || 0;
  const plannedGroupCount = groupSize > 0 ? Math.max(1, Math.ceil(imageCount / groupSize)) : 1;
  return {
    title: challenge.title || '',
    description: challenge.description || '',
    plannedGroupCount,
    groupSize,
    groupAdvancers: Number(challenge.group_advancers ?? 2) || 2,
    luckyLoserSlots: Number(challenge.lucky_loser_slots ?? 0) || 0,
    koBracketSize: challenge.ko_bracket_size ? Number(challenge.ko_bracket_size) : '',
    startAt: formatDateTimeLocal(challenge.start_at),
    minImageCreatedAt: formatDateTimeLocal(challenge.min_image_created_at),
    submissionDeadline: formatDateTimeLocal(challenge.submission_deadline),
    submissionLimitPerUser:
      challenge.submission_limit_per_user !== null && challenge.submission_limit_per_user !== undefined
        ? Number(challenge.submission_limit_per_user)
        : 3,
    allowDirectUploads: Boolean(challenge.allow_direct_uploads),
    groupSchedule: parseGroupScheduleSlots(challenge.group_schedule),
  };
};

function PhotoChallengeAdmin() {
  const { userId, isLoggedIn } = useUser();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const isAdmin = Number(userId) === 1;

  const [challenges, setChallenges] = useState([]);
  const [challengesLoading, setChallengesLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [selectedChallengeId, setSelectedChallengeId] = useState(() => Number(searchParams.get('challengeId')) || null);
  const selectedIdRef = useRef(selectedChallengeId);
  selectedIdRef.current = selectedChallengeId;
  const [planningBaseline, setPlanningBaseline] = useState(null);
  const [challengeImages, setChallengeImages] = useState([]);
  const [challengeImagesLoading, setChallengeImagesLoading] = useState(false);
  const [createFormState, setCreateFormState] = useState(() => createDefaultCreateForm());
  const [formState, setFormState] = useState(() => createDefaultPlanningForm());
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [planningSaveLoading, setPlanningSaveLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [groupActionLoading, setGroupActionLoading] = useState(false);
  const [closeSubmissionLoading, setCloseSubmissionLoading] = useState(false);
  const [koActionLoading, setKoActionLoading] = useState(false);
  const [koAdvanceLoading, setKoAdvanceLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [imageSearchQuery, setImageSearchQuery] = useState('');
  const [imageResults, setImageResults] = useState([]);
  const [imageSearchPage, setImageSearchPage] = useState(1);
  const [imageSearchHasMore, setImageSearchHasMore] = useState(false);
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [groupTimeDrafts, setGroupTimeDrafts] = useState({});
  const [groupTimeSaving, setGroupTimeSaving] = useState({});
  const selectedChallenge = useMemo(
    () => challenges.find((challenge) => Number(challenge.id) === Number(selectedChallengeId)) || null,
    [challenges, selectedChallengeId]
  );
  const challengeConfig = (Number(overview?.challenge?.id) === Number(selectedChallengeId) ? overview?.challenge : null) || selectedChallenge || null;
  const challengeStatus = challengeConfig?.status || null;
  const challengeRawStatus = challengeConfig?.status_raw || challengeConfig?.status || null;
  const isPlanningPhase = challengeStatus === 'submission_closed';
  const submissionDeadlinePassed = Boolean(challengeConfig?.submission_deadline_passed);
  const canCloseSubmissionPhase =
    challengeRawStatus === 'submission_open' && (challengeConfig?.submission_deadline ? submissionDeadlinePassed : true);
  const canReopenSubmissionPhase = ['draft', 'submission_closed'].includes(challengeRawStatus);

  useEffect(() => {
    if (!challengeConfig) return;
    const loadedForm = buildPlanningFormFromChallenge(challengeConfig);
    setFormState(loadedForm);
    setPlanningBaseline(loadedForm);
  }, [challengeConfig?.id, challengeStatus]);

  const getGroupTimeDraft = useCallback(
    (groupId) => {
      const group = overview?.groups?.find((entry) => entry.id === groupId);
      return {
        startAt: formatDateTimeLocal(group?.start_at),
        endAt: formatDateTimeLocal(group?.end_at),
      };
    },
    [overview?.groups]
  );

  useEffect(() => {
    setGroupTimeDrafts({});
    setGroupTimeSaving({});
  }, [overview?.challenge?.id, overview?.groups?.length]);

  const showFeedback = (message, variant = 'info') => {
    setFeedback({ message, variant });

  };

  const loadChallenges = useCallback(async () => {
    if (!apiUrl || !isAdmin) return;
    setChallengesLoading(true);
    try {
      const res = await fetch(`${apiUrl}/photo_challenge/list_challenges.php?nutzer_id=${userId}`);
      const data = await res.json();
      if (data.status === 'success') {
        setChallenges(data.data || []);
        if (!selectedChallengeId && data.data?.length) {
          setSelectedChallengeId(data.data[0].id);
        }
      } else {
        showFeedback(data.message || 'Challenges konnten nicht geladen werden.', 'error');
      }
    } catch (err) {
      showFeedback('Challenges konnten nicht geladen werden.', 'error');
    } finally {
      setChallengesLoading(false);
    }
  }, [apiUrl, isAdmin, userId, selectedChallengeId]);

  const loadChallengeImages = useCallback(
    async (challengeId) => {
      if (!apiUrl || !isAdmin || !challengeId) return;
      setChallengeImagesLoading(true);
      try {
        const res = await fetch(
          `${apiUrl}/photo_challenge/list_challenge_images.php?nutzer_id=${userId}&challenge_id=${challengeId}`
        );
        const data = await res.json();
        if (Number(selectedIdRef.current) !== Number(challengeId)) return;
        if (data.status === 'success') {
          setChallengeImages(data.data || []);
        } else {
          showFeedback(data.message || 'Bilder konnten nicht geladen werden.', 'error');
        }
      } catch (err) {
        if (Number(selectedIdRef.current) !== Number(challengeId)) return;
        showFeedback('Bilder konnten nicht geladen werden.', 'error');
      } finally {
        if (Number(selectedIdRef.current) === Number(challengeId)) setChallengeImagesLoading(false);
      }
    },
    [apiUrl, isAdmin, userId]
  );

  const loadChallengeOverview = useCallback(async (challengeId, hydrateForm = false) => {
    if (!apiUrl || !challengeId) return;
    setOverviewLoading(true);
    try {
      const params = new URLSearchParams({
        challenge_id: challengeId,
      });
      if (userId) {
        params.set('nutzer_id', userId);
      }
      const res = await fetch(`${apiUrl}/photo_challenge/get_challenge_overview.php?${params.toString()}`);
      const data = await res.json();
      if (Number(selectedIdRef.current) !== Number(challengeId)) return;
      if (data.status === 'success') {
        setOverview(data);
        if (hydrateForm) {
          const loadedForm = buildPlanningFormFromChallenge(data.challenge);
          setFormState(loadedForm); setPlanningBaseline(loadedForm);
        }
      } else {
        setOverview(null);
        showFeedback(data.message || 'Übersicht konnte nicht geladen werden.', 'error');
      }
    } catch (err) {
      if (Number(selectedIdRef.current) !== Number(challengeId)) return;
      setOverview(null);
      showFeedback('Übersicht konnte nicht geladen werden.', 'error');
    } finally {
      if (Number(selectedIdRef.current) === Number(challengeId)) setOverviewLoading(false);
    }
  }, [apiUrl, userId]);

  const loadSubmissions = useCallback(
    async (challengeId) => {
      if (!apiUrl || !isAdmin || !challengeId) return;
      setSubmissionsLoading(true);
      try {
        const params = new URLSearchParams({
          nutzer_id: userId,
          challenge_id: challengeId,
        });
        const res = await fetch(`${apiUrl}/photo_challenge/list_submissions.php?${params.toString()}`);
        const data = await res.json();
        if (Number(selectedIdRef.current) !== Number(challengeId)) return;
        if (data.status === 'success') {
          setSubmissions(data.data || []);
        } else {
          setSubmissions([]);
          showFeedback(data.message || 'Einreichungen konnten nicht geladen werden.', 'error');
        }
      } catch (err) {
        if (Number(selectedIdRef.current) !== Number(challengeId)) return;
        setSubmissions([]);
        showFeedback('Einreichungen konnten nicht geladen werden.', 'error');
      } finally {
        if (Number(selectedIdRef.current) === Number(challengeId)) setSubmissionsLoading(false);
      }
    },
    [apiUrl, isAdmin, userId]
  );

  useEffect(() => {
    if (isAdmin) {
      loadChallenges();
    }
  }, [isAdmin, loadChallenges]);

  useEffect(() => {
    if (isAdmin && selectedChallengeId) {
      loadChallengeImages(selectedChallengeId);
      loadChallengeOverview(selectedChallengeId, true);
      loadSubmissions(selectedChallengeId);
    } else {
      setChallengeImages([]);
      setOverview(null);
      setSubmissions([]);
    }
  }, [isAdmin, selectedChallengeId, loadChallengeImages, loadChallengeOverview, loadSubmissions]);

  const handleCreateChallenge = async (event) => {
    event.preventDefault();
    if (!apiUrl || !isAdmin) return;
    setFormSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('nutzer_id', userId);
      formData.append('title', createFormState.title);
      formData.append('description', createFormState.description);
      formData.append('status', createFormState.status);
      if (createFormState.startAt) {
        formData.append('start_at', createFormState.startAt);
      }
      if (createFormState.minImageCreatedAt) {
        formData.append('min_image_created_at', createFormState.minImageCreatedAt);
      }
      if (createFormState.submissionDeadline) {
        formData.append('submission_deadline', createFormState.submissionDeadline);
      }
      if (createFormState.submissionLimitPerUser !== '' && createFormState.submissionLimitPerUser !== null) {
        formData.append('submission_limit_per_user', createFormState.submissionLimitPerUser);
      }
      formData.append('allow_direct_uploads', createFormState.allowDirectUploads ? 1 : 0);

      const res = await fetch(`${apiUrl}/photo_challenge/create_challenge.php`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.status === 'success') {
        setChallenges((prev) => [data.challenge, ...prev]);
        setCreateFormState(createDefaultCreateForm());
        setSelectedChallengeId(data.challenge.id);
        showFeedback('Challenge angelegt.', 'success');
        return data.challenge.id;
      } else {
        showFeedback(data.message || 'Challenge konnte nicht erstellt werden.', 'error');
      }
    } catch (err) {
      showFeedback('Challenge konnte nicht erstellt werden.', 'error');
      return false;
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSearchImages = async (page = 1, append = false) => {
    if (!apiUrl || !isAdmin) return;
    setImageSearchLoading(true);
    try {
      const params = new URLSearchParams({
        nutzer_id: userId,
        page: String(page),
      });
      if (imageSearchQuery.trim()) {
        params.set('query', imageSearchQuery.trim());
      }
      const res = await fetch(`${apiUrl}/photo_challenge/search_images.php?${params.toString()}`);
      const data = await res.json();
      if (data.status === 'success') {
        setImageResults((prev) => (append ? [...prev, ...(data.data || [])] : data.data || []));
        setImageSearchPage(page);
        setImageSearchHasMore(Boolean(data.meta?.has_more));
      } else {
        showFeedback(data.message || 'Bilder konnten nicht gesucht werden.', 'error');
      }
    } catch (err) {
      showFeedback('Bilder konnten nicht gesucht werden.', 'error');
    } finally {
      setImageSearchLoading(false);
    }
  };

  const handleAddImage = async (imageId) => {
    if (!selectedChallengeId || !apiUrl || !isAdmin) {
      showFeedback('Bitte zuerst eine Challenge auswählen.', 'error');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('nutzer_id', userId);
      formData.append('challenge_id', selectedChallengeId);
      formData.append('image_ids[]', imageId);
      const res = await fetch(`${apiUrl}/photo_challenge/add_images.php`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.status === 'success') {
        setChallengeImages(data.data || []);
        return true;
      } else {
        showFeedback(data.message || 'Bild konnte nicht hinzugefügt werden.', 'error');
      }
    } catch (err) {
      showFeedback('Bild konnte nicht hinzugefügt werden.', 'error');
      return false;
    }
  };

  const handleRemoveImage = async (imageId) => {
    if (!selectedChallengeId || !apiUrl || !isAdmin) return;
    try {
      const formData = new FormData();
      formData.append('nutzer_id', userId);
      formData.append('challenge_id', selectedChallengeId);
      formData.append('image_id', imageId);
      const res = await fetch(`${apiUrl}/photo_challenge/remove_image.php`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.status === 'success') {
        setChallengeImages(data.data || []);
        return true;
      } else {
        showFeedback(data.message || 'Bild konnte nicht entfernt werden.', 'error');
      }
    } catch (err) {
      showFeedback('Bild konnte nicht entfernt werden.', 'error');
      return false;
    }
  };

  const handleSelectChallenge = (challengeId) => {
    setOverview(null); setChallengeImages([]); setSubmissions([]); setOverviewLoading(true);
    setSelectedChallengeId(challengeId);
    setImageResults([]);
    setImageSearchPage(1);
    setImageSearchHasMore(false);
  };

  const handleStoryDownload = (pack) => {
    if (!apiUrl || !selectedChallengeId || !userId) {
      showFeedback('Bitte zuerst eine Challenge auswählen.', 'error');
      return;
    }
    const params = new URLSearchParams({
      challenge_id: String(selectedChallengeId),
      nutzer_id: String(userId),
      pack,
    });
    window.location.href = `${apiUrl}/photo_challenge/download_story_pack.php?${params.toString()}`;
  };

  const handleStartGroupPhase = async () => {
    if (!selectedChallengeId || !apiUrl) return;
    setGroupActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('nutzer_id', userId);
      formData.append('challenge_id', selectedChallengeId);
      const res = await fetch(`${apiUrl}/photo_challenge/start_group_phase.php`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.status === 'success') {
        showFeedback('Gruppenphase gestartet.', 'success');
        loadChallengeOverview(selectedChallengeId);
        loadChallenges();
        return true;
      } else {
        throw new Error(data.message || 'Gruppenphase konnte nicht gestartet werden.');
      }
    } catch (err) {
      showFeedback(err.message || 'Gruppenphase konnte nicht gestartet werden.', 'error');
      return false;
    } finally {
      setGroupActionLoading(false);
    }
  };

  const handleCloseSubmissionPhase = async () => {
    if (!selectedChallengeId || !apiUrl) return;
    setCloseSubmissionLoading(true);
    try {
      const formData = new FormData();
      formData.append('nutzer_id', userId);
      formData.append('challenge_id', selectedChallengeId);
      const res = await fetch(`${apiUrl}/photo_challenge/close_submission_phase.php`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.status !== 'success') {
        throw new Error(data.message || 'Einreichphase konnte nicht geschlossen werden.');
      }
      showFeedback(data.message || 'Einreichphase wurde geschlossen.', 'success');
      loadChallengeOverview(selectedChallengeId);
      loadChallenges();
      loadSubmissions(selectedChallengeId);
      loadChallengeImages(selectedChallengeId);
      return true;
    } catch (err) {
      showFeedback(err.message || 'Einreichphase konnte nicht geschlossen werden.', 'error');
      return false;
    } finally {
      setCloseSubmissionLoading(false);
    }
  };

  const handleStartKoPhase = async () => {
    if (!selectedChallengeId || !apiUrl) return;
    setKoActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('nutzer_id', userId);
      formData.append('challenge_id', selectedChallengeId);
      const res = await fetch(`${apiUrl}/photo_challenge/start_ko_phase.php`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.status === 'success') {
        showFeedback('KO-Phase gestartet.', 'success');
        loadChallengeOverview(selectedChallengeId);
        loadChallenges();
        return true;
      } else {
        throw new Error(data.message || 'KO-Phase konnte nicht gestartet werden.');
      }
    } catch (err) {
      showFeedback(err.message || 'KO-Phase konnte nicht gestartet werden.', 'error');
      return false;
    } finally {
      setKoActionLoading(false);
    }
  };

  const handleAdvanceKoRound = async () => {
    if (!selectedChallengeId || !apiUrl) return;
    setKoAdvanceLoading(true);
    try {
      const formData = new FormData();
      formData.append('nutzer_id', userId);
      formData.append('challenge_id', selectedChallengeId);
      const res = await fetch(`${apiUrl}/photo_challenge/advance_ko_round.php`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.status === 'success') {
        showFeedback(data.message || 'KO-Runde aktualisiert.', 'success');
        loadChallengeOverview(selectedChallengeId);
        loadChallenges();
        return true;
      } else {
        throw new Error(data.message || 'KO-Runde konnte nicht aktualisiert werden.');
      }
    } catch (err) {
      showFeedback(err.message || 'KO-Runde konnte nicht aktualisiert werden.', 'error');
      return false;
    } finally {
      setKoAdvanceLoading(false);
    }
  };

  const handleSavePlanningConfig = async (nextStatus = null) => {
    if (!apiUrl || !selectedChallengeId || !isAdmin) return;
    setPlanningSaveLoading(true);
    try {
      const formData = new FormData();
      formData.append('nutzer_id', userId);
      formData.append('challenge_id', selectedChallengeId);
      formData.append('title', formState.title);
      formData.append('description', formState.description || '');
      formData.append('allow_direct_uploads', formState.allowDirectUploads ? 1 : 0);
      if (nextStatus) formData.append('status', nextStatus);
      formData.append('group_size', formState.groupSize);
      formData.append('group_advancers', formState.groupAdvancers);
      formData.append('lucky_loser_slots', formState.luckyLoserSlots);
      formData.append('ko_bracket_size', formState.koBracketSize ?? '');
      formData.append('start_at', formState.startAt || '');
      formData.append('min_image_created_at', formState.minImageCreatedAt || '');
      formData.append('submission_deadline', formState.submissionDeadline || '');
      formData.append('submission_limit_per_user', formState.submissionLimitPerUser ?? '');

      const schedulePayload = (formState.groupSchedule || [])
        .map((slot) => {
          const duration = Number(slot.durationDays);
          const groups = Number(slot.groups);
          const startAt = slot.startAt || formState.startAt || '';
          if (!startAt || !Number.isInteger(duration) || duration <= 0 || !Number.isInteger(groups) || groups <= 0) {
            throw new Error('Vervollständige alle Zeitblöcke, bevor du speicherst.');
          }
          return {
            start_at: startAt,
            duration_days: duration,
            groups,
          };
        })
        .filter(Boolean);
      if (schedulePayload.length) {
        formData.append('group_schedule', JSON.stringify(schedulePayload));
      } else {
        formData.append('group_schedule', '');
      }

      const res = await fetch(`${apiUrl}/photo_challenge/update_challenge.php`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.status !== 'success') {
        throw new Error(data.message || 'Planung konnte nicht gespeichert werden.');
      }
      showFeedback(data.message || 'Planung gespeichert.', 'success');
      await Promise.all([loadChallenges(), loadChallengeOverview(selectedChallengeId)]);
      setPlanningBaseline(formState);
      return true;
    } catch (err) {
      showFeedback(err.message || 'Planung konnte nicht gespeichert werden.', 'error');
      return false;
    } finally {
      setPlanningSaveLoading(false);
    }
  };

  const handleSaveSubmissionPhaseSettings = (nextStatus = null) => handleSavePlanningConfig(nextStatus);

  const handleGroupTimeChange = (groupId, field, value) => {
    setGroupTimeDrafts((prev) => {
      const base = prev[groupId] ?? getGroupTimeDraft(groupId);
      return {
        ...prev,
        [groupId]: {
          ...base,
          [field]: value,
        },
      };
    });
  };

  const handleGroupTimeReset = (groupId) => {
    setGroupTimeDrafts((prev) => {
      const next = { ...prev };
      delete next[groupId];
      return next;
    });
  };

  const handleGroupTimeSave = async (groupId) => {
    if (!apiUrl || !selectedChallengeId) return;
    const draft = groupTimeDrafts[groupId] ?? getGroupTimeDraft(groupId);
    setGroupTimeSaving((prev) => ({ ...prev, [groupId]: true }));
    try {
      const formData = new FormData();
      formData.append('nutzer_id', userId);
      formData.append('challenge_id', selectedChallengeId);
      formData.append('group_id', groupId);
      formData.append('start_at', draft.startAt || '');
      formData.append('end_at', draft.endAt || '');
      const res = await fetch(`${apiUrl}/photo_challenge/update_group_times.php`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.status === 'success') {
        showFeedback('Gruppenzeiten aktualisiert.', 'success');
        await loadChallengeOverview(selectedChallengeId);
        handleGroupTimeReset(groupId);
        return true;
      } else {
        throw new Error(data.message || 'Zeiten konnten nicht gespeichert werden.');
      }
    } catch (err) {
      showFeedback(err.message || 'Zeiten konnten nicht gespeichert werden.', 'error');
      return false;
    } finally {
      setGroupTimeSaving((prev) => ({ ...prev, [groupId]: false }));
    }
  };

  const handleSubmissionAction = async (submissionId, action) => {
    if (!apiUrl || !selectedChallengeId) return;
    if (!isPlanningPhase) {
      showFeedback('Einreichungen können erst in der Planungsphase nach Einreichschluss final geprüft werden.', 'error');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('nutzer_id', userId);
      formData.append('submission_id', submissionId);
      formData.append('action', action);
      const res = await fetch(`${apiUrl}/photo_challenge/review_submission.php`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.status === 'success') {
        showFeedback(data.message, 'success');
        await Promise.all([loadSubmissions(selectedChallengeId), loadChallengeImages(selectedChallengeId)]);
        return true;
      } else {
        throw new Error(data.message || 'Aktion fehlgeschlagen.');
      }
    } catch (err) {
      showFeedback(err.message || 'Aktion fehlgeschlagen.', 'error');
      return false;
    }
  };

  return <><Header /><PhotoChallengeAdminWorkspace
    isLoggedIn={isLoggedIn} isAdmin={isAdmin} apiUrl={apiUrl}
    challenges={challenges} challengesLoading={challengesLoading} selectedChallengeId={selectedChallengeId}
    onSelect={handleSelectChallenge} challenge={challengeConfig} overview={overview} overviewLoading={overviewLoading}
    createForm={createFormState} setCreateForm={setCreateFormState} createBusy={formSubmitting} onCreate={handleCreateChallenge}
    form={formState} setForm={setFormState} baseline={planningBaseline} planningBusy={planningSaveLoading}
    onSavePlan={handleSavePlanningConfig} onSaveSettings={handleSaveSubmissionPhaseSettings}
    images={challengeImages} imagesLoading={challengeImagesLoading} submissions={submissions} submissionsLoading={submissionsLoading}
    onReview={handleSubmissionAction} onAddImage={handleAddImage} onRemoveImage={handleRemoveImage}
    imageQuery={imageSearchQuery} setImageQuery={setImageSearchQuery} imageResults={imageResults}
    imageSearchBusy={imageSearchLoading} imageHasMore={imageSearchHasMore} imagePage={imageSearchPage} onImageSearch={handleSearchImages}
    onStartGroups={handleStartGroupPhase} onCloseSubmissions={handleCloseSubmissionPhase} onStartKo={handleStartKoPhase} onAdvanceKo={handleAdvanceKoRound}
    phaseBusy={groupActionLoading || closeSubmissionLoading || koActionLoading || koAdvanceLoading}
    canCloseSubmissions={canCloseSubmissionPhase} canReopenSubmissions={canReopenSubmissionPhase}
    groupDrafts={groupTimeDrafts} getGroupDraft={getGroupTimeDraft} onGroupChange={handleGroupTimeChange}
    onSaveGroup={handleGroupTimeSave} onResetGroup={handleGroupTimeReset} groupSaving={groupTimeSaving} setGroupDrafts={setGroupTimeDrafts}
    onDownload={handleStoryDownload} feedback={feedback} clearFeedback={() => setFeedback(null)}
    onRefresh={() => { loadChallenges(); if (selectedChallengeId) { loadChallengeOverview(selectedChallengeId, true); loadSubmissions(selectedChallengeId); loadChallengeImages(selectedChallengeId); } }}
  /></>;
}

export default PhotoChallengeAdmin;
