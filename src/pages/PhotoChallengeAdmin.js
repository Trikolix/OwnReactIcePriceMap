
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import Header from '../Header';
import { useUser } from '../context/UserContext';

const ASSET_BASE = (process.env.REACT_APP_ASSET_BASE_URL || 'https://ice-app.de/').replace(/\/+$/, '');
const buildAssetUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${ASSET_BASE}/${path.replace(/^\/+/, '')}`;
};

const createScheduleSlot = () => ({
  id: `slot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  startAt: '',
  durationDays: '14',
  groups: '2',
});

const createDefaultForm = () => ({
  title: '',
  description: '',
  status: 'draft',
  plannedGroupCount: 4,
  groupSize: 4,
  groupAdvancers: 2,
  luckyLoserSlots: 2,
  koBracketSize: '',
  startAt: '',
  submissionDeadline: '',
  submissionLimitPerUser: 3,
  groupSchedule: [createScheduleSlot()],
});

const NUMBER_FIELDS = new Set(['plannedGroupCount', 'groupSize', 'groupAdvancers', 'luckyLoserSlots', 'submissionLimitPerUser']);
const OPTIONAL_NUMBER_FIELDS = new Set(['koBracketSize']);

const formatDateTimeLocal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

function PhotoChallengeAdmin() {
  const { userId, isLoggedIn } = useUser();
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const isAdmin = Number(userId) === 1;

  const [challenges, setChallenges] = useState([]);
  const [challengesLoading, setChallengesLoading] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState(null);
  const [challengeImages, setChallengeImages] = useState([]);
  const [challengeImagesLoading, setChallengeImagesLoading] = useState(false);
  const [formState, setFormState] = useState(() => createDefaultForm());
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [groupActionLoading, setGroupActionLoading] = useState(false);
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
  const [showChallengeImages, setShowChallengeImages] = useState(false);

  const STATUS_LABELS = {
    draft: 'Entwurf',
    active: 'Aktiv',
    finished: 'Abgeschlossen',
    submission_open: 'Einreichphase',
    group_running: 'Gruppenphase',
    ko_running: 'KO-Phase',
  };

  const selectedChallenge = useMemo(
    () => challenges.find((challenge) => challenge.id === selectedChallengeId) || null,
    [challenges, selectedChallengeId]
  );
  const challengeConfig = overview?.challenge || selectedChallenge || null;

  const derivedPlan = useMemo(() => {
    const plannedGroups = Math.max(0, Number(formState.plannedGroupCount) || 0);
    const groupSize = Math.max(0, Number(formState.groupSize) || 0);
    const advancersPerGroup = Math.min(Math.max(0, Number(formState.groupAdvancers) || 0), groupSize);
    const luckyConfigured = Math.max(0, Number(formState.luckyLoserSlots) || 0);
    const totalImages = plannedGroups * groupSize;
    const directAdvancers = plannedGroups * advancersPerGroup;
    const maxLuckyPossible = plannedGroups * Math.max(groupSize - advancersPerGroup, 0);
    const luckyUsed = Math.min(luckyConfigured, maxLuckyPossible);
    const koParticipants = directAdvancers + luckyUsed;
    const nextPower =
      koParticipants > 0 ? 2 ** Math.ceil(Math.log2(koParticipants)) : 0;
    return {
      plannedGroups,
      groupSize,
      totalImages,
      directAdvancers,
      luckyConfigured,
      luckyUsed,
      koParticipants,
      nextPower,
      limitedLucky: luckyConfigured > luckyUsed,
      needsExpansion: nextPower > koParticipants,
    };
  }, [formState.plannedGroupCount, formState.groupSize, formState.groupAdvancers, formState.luckyLoserSlots]);

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
    setTimeout(() => setFeedback(null), 4000);
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
        if (data.status === 'success') {
          setChallengeImages(data.data || []);
        } else {
          showFeedback(data.message || 'Bilder konnten nicht geladen werden.', 'error');
        }
      } catch (err) {
        showFeedback('Bilder konnten nicht geladen werden.', 'error');
      } finally {
        setChallengeImagesLoading(false);
      }
    },
    [apiUrl, isAdmin, userId]
  );

  const loadChallengeOverview = useCallback(async (challengeId) => {
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
      if (data.status === 'success') {
        setOverview(data);
      } else {
        setOverview(null);
        showFeedback(data.message || 'Übersicht konnte nicht geladen werden.', 'error');
      }
    } catch (err) {
      setOverview(null);
      showFeedback('Übersicht konnte nicht geladen werden.', 'error');
    } finally {
      setOverviewLoading(false);
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
        if (data.status === 'success') {
          setSubmissions(data.data || []);
        } else {
          setSubmissions([]);
          showFeedback(data.message || 'Einreichungen konnten nicht geladen werden.', 'error');
        }
      } catch (err) {
        setSubmissions([]);
        showFeedback('Einreichungen konnten nicht geladen werden.', 'error');
      } finally {
        setSubmissionsLoading(false);
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
      loadChallengeOverview(selectedChallengeId);
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
      formData.append('title', formState.title);
      formData.append('description', formState.description);
      formData.append('status', formState.status);
      formData.append('group_size', formState.groupSize);
      formData.append('group_advancers', formState.groupAdvancers);
      formData.append('lucky_loser_slots', formState.luckyLoserSlots);
      if (formState.koBracketSize) {
        formData.append('ko_bracket_size', formState.koBracketSize);
      }
      if (formState.startAt) {
        formData.append('start_at', formState.startAt);
      }
      if (formState.submissionDeadline) {
        formData.append('submission_deadline', formState.submissionDeadline);
      }
      if (formState.submissionLimitPerUser !== '' && formState.submissionLimitPerUser !== null) {
        formData.append('submission_limit_per_user', formState.submissionLimitPerUser);
      }
      const schedulePayload = formState.groupSchedule
        .map((slot) => {
          const duration = Number(slot.durationDays);
          const groups = Number(slot.groups);
          const startAt = slot.startAt || formState.startAt || '';
          if (!startAt || Number.isNaN(duration) || duration <= 0 || Number.isNaN(groups) || groups <= 0) {
            return null;
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
      }

      const res = await fetch(`${apiUrl}/photo_challenge/create_challenge.php`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.status === 'success') {
        setChallenges((prev) => [data.challenge, ...prev]);
        setFormState(createDefaultForm());
        setSelectedChallengeId(data.challenge.id);
        showFeedback('Challenge angelegt.', 'success');
      } else {
        showFeedback(data.message || 'Challenge konnte nicht erstellt werden.', 'error');
      }
    } catch (err) {
      showFeedback('Challenge konnte nicht erstellt werden.', 'error');
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
      } else {
        showFeedback(data.message || 'Bild konnte nicht hinzugefügt werden.', 'error');
      }
    } catch (err) {
      showFeedback('Bild konnte nicht hinzugefügt werden.', 'error');
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
      } else {
        showFeedback(data.message || 'Bild konnte nicht entfernt werden.', 'error');
      }
    } catch (err) {
      showFeedback('Bild konnte nicht entfernt werden.', 'error');
    }
  };

  const handleSelectChallenge = (challengeId) => {
    setSelectedChallengeId(challengeId);
    setImageResults([]);
    setImageSearchPage(1);
    setImageSearchHasMore(false);
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
      } else {
        throw new Error(data.message || 'Gruppenphase konnte nicht gestartet werden.');
      }
    } catch (err) {
      showFeedback(err.message || 'Gruppenphase konnte nicht gestartet werden.', 'error');
    } finally {
      setGroupActionLoading(false);
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
      } else {
        throw new Error(data.message || 'KO-Phase konnte nicht gestartet werden.');
      }
    } catch (err) {
      showFeedback(err.message || 'KO-Phase konnte nicht gestartet werden.', 'error');
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
      } else {
        throw new Error(data.message || 'KO-Runde konnte nicht aktualisiert werden.');
      }
    } catch (err) {
      showFeedback(err.message || 'KO-Runde konnte nicht aktualisiert werden.', 'error');
    } finally {
      setKoAdvanceLoading(false);
    }
  };

  const handleFormChange = (field) => (event) => {
    let { value } = event.target;
    if (NUMBER_FIELDS.has(field)) {
      value = Number(value);
    } else if (OPTIONAL_NUMBER_FIELDS.has(field)) {
      value = value === '' ? '' : Number(value);
    }
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleScheduleChange = (slotId, field) => (event) => {
    const { value } = event.target;
    setFormState((prev) => ({
      ...prev,
      groupSchedule: prev.groupSchedule.map((slot) =>
        slot.id === slotId ? { ...slot, [field]: value } : slot
      ),
    }));
  };

  const handleAddScheduleSlot = () => {
    setFormState((prev) => ({
      ...prev,
      groupSchedule: [...prev.groupSchedule, createScheduleSlot()],
    }));
  };

  const handleRemoveScheduleSlot = (slotId) => {
    setFormState((prev) => ({
      ...prev,
      groupSchedule: prev.groupSchedule.filter((slot) => slot.id !== slotId),
    }));
  };

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
        handleGroupTimeReset(groupId);
        loadChallengeOverview(selectedChallengeId);
      } else {
        throw new Error(data.message || 'Zeiten konnten nicht gespeichert werden.');
      }
    } catch (err) {
      showFeedback(err.message || 'Zeiten konnten nicht gespeichert werden.', 'error');
    } finally {
      setGroupTimeSaving((prev) => ({ ...prev, [groupId]: false }));
    }
  };

  const handleSubmissionAction = async (submissionId, action) => {
    if (!apiUrl || !selectedChallengeId) return;
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
        loadSubmissions(selectedChallengeId);
        loadChallengeImages(selectedChallengeId);
      } else {
        throw new Error(data.message || 'Aktion fehlgeschlagen.');
      }
    } catch (err) {
      showFeedback(err.message || 'Aktion fehlgeschlagen.', 'error');
    }
  };

  const renderChallengeCard = (challenge) => (
    <ChallengeCard
      key={challenge.id}
      $active={challenge.id === selectedChallengeId}
      onClick={() => handleSelectChallenge(challenge.id)}
    >
      <h4>{challenge.title}</h4>
      <ChallengeMeta>
        <span>Status: {challenge.status}</span>
        <span>Größe: {challenge.group_size}</span>
        <span>Bilder: {challenge.image_count ?? 0}</span>
        <span>Weiter: {challenge.group_advancers ?? 2}</span>
        <span>Lucky: {challenge.lucky_loser_slots ?? 0}</span>
      </ChallengeMeta>
      <small>Erstellt am {new Date(challenge.created_at).toLocaleString()}</small>
      <ChallengeCardAction
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          handleSelectChallenge(challenge.id);
        }}
      >
        Challenge laden
      </ChallengeCardAction>
    </ChallengeCard>
  );

  const renderImageCard = (image, inChallenge) => (
    <ImageCard key={`${inChallenge ? 'assigned' : 'candidate'}-${image.image_id || image.id}`}>
      <ImagePreview src={buildAssetUrl(image.url)} alt={image.beschreibung || 'Eisfoto'} />
      <ImageInfo>
        <strong>#{image.image_id || image.id}</strong>
        <span>{image.username || 'Unbekannt'}</span>
        {image.eisdiele_name && <span>{image.eisdiele_name}</span>}
      </ImageInfo>
      {inChallenge ? (
        <ImageActionButton
          type="button"
          onClick={() => handleRemoveImage(image.image_id)}
          disabled={!['draft', 'submission_open'].includes(challengeConfig?.status)}
        >
          Entfernen
        </ImageActionButton>
      ) : (
        <ImageActionButton
          type="button"
          onClick={() => handleAddImage(image.id)}
          disabled={!['draft', 'submission_open'].includes(challengeConfig?.status)}
        >
          Hinzufügen
        </ImageActionButton>
      )}
    </ImageCard>
  );

  return (
    <PageWrapper>
      <Header />
      <Content>
        <HeroSection>
          <div>
            <h1>Eis-Fotochallenge Admin</h1>
            <p>Lege neue Fotochallenges an, wähle passende Bilder aus und bereite die Gruppenphase vor.</p>
          </div>
        </HeroSection>

        {!apiUrl && <WarningBox>API Base URL ist nicht konfiguriert.</WarningBox>}
        {!isLoggedIn && <WarningBox>Bitte melde dich an, um das Admin-Panel zu nutzen.</WarningBox>}
        {isLoggedIn && !isAdmin && (
          <WarningBox>Dieses Panel steht nur Administratoren zur Verfügung.</WarningBox>
        )}

        {feedback && <FeedbackBox $variant={feedback.variant}>{feedback.message}</FeedbackBox>}

        {apiUrl && isLoggedIn && isAdmin && (
          <>
            <PanelsWrapper>
              <PanelCard as="form" onSubmit={handleCreateChallenge}>
                <PanelHeader>
                  <h3>Neue Challenge anlegen</h3>
                </PanelHeader>
                <Field>
                  <label htmlFor="challenge-title">Titel</label>
                  <input
                    id="challenge-title"
                    type="text"
                    value={formState.title}
                    onChange={handleFormChange('title')}
                    required
                  />
                </Field>
                <Field>
                  <label htmlFor="challenge-description">Beschreibung</label>
                  <textarea
                    id="challenge-description"
                    rows="3"
                    value={formState.description}
                    onChange={handleFormChange('description')}
                  />
                </Field>
                <FieldGroup>
                  <Field>
                    <label htmlFor="challenge-status">Status</label>
                    <select
                      id="challenge-status"
                      value={formState.status}
                      onChange={handleFormChange('status')}
                    >
                      <option value="draft">Draft</option>
                      <option value="submission_open">Einreichphase</option>
                      <option value="active">Aktiv</option>
                      <option value="finished">Abgeschlossen</option>
                    </select>
                  </Field>
                  <Field>
                    <label htmlFor="challenge-group">Gruppengröße</label>
                    <input
                      id="challenge-group"
                      type="number"
                      min="2"
                      max="8"
                      value={formState.groupSize}
                      onChange={handleFormChange('groupSize')}
                    />
                  </Field>
                </FieldGroup>
                <Field>
                  <label htmlFor="challenge-planned-groups">Geplante Gruppenanzahl</label>
                  <input
                    id="challenge-planned-groups"
                    type="number"
                    min="1"
                    value={formState.plannedGroupCount}
                    onChange={handleFormChange('plannedGroupCount')}
                  />
                </Field>
                <FieldGroup>
                  <Field>
                    <label htmlFor="challenge-advancers">Weiterkommende pro Gruppe</label>
                    <input
                      id="challenge-advancers"
                      type="number"
                      min="1"
                      max={formState.groupSize}
                      value={formState.groupAdvancers}
                      onChange={handleFormChange('groupAdvancers')}
                    />
                  </Field>
                  <Field>
                    <label htmlFor="challenge-lucky">Lucky-Loser Slots</label>
                    <input
                      id="challenge-lucky"
                      type="number"
                      min="0"
                      value={formState.luckyLoserSlots}
                      onChange={handleFormChange('luckyLoserSlots')}
                    />
                  </Field>
                </FieldGroup>
                <PlanSummary>
                  <div>
                    <strong>Plan:</strong> {derivedPlan.plannedGroups} Gruppen à {derivedPlan.groupSize} Bilder ={' '}
                    {derivedPlan.totalImages} Bilder gesamt.
                  </div>
                  <div>Direkt weiter: {derivedPlan.directAdvancers} · Lucky-Loser nutzbar: {derivedPlan.luckyUsed}</div>
                  <div>
                    KO-Teilnehmer: {derivedPlan.koParticipants || '—'}{' '}
                    {derivedPlan.koParticipants
                      ? `(nächste 2er-Potenz: ${derivedPlan.nextPower || '—'})`
                      : null}
                  </div>
                  {derivedPlan.limitedLucky && (
                    <PlanSummaryNote>
                      Hinweis: Es stehen nur {derivedPlan.luckyUsed} Lucky-Loser zur Verfügung – überschüssige Slots werden
                      ignoriert.
                    </PlanSummaryNote>
                  )}
                  {derivedPlan.needsExpansion && (
                    <PlanSummaryWarning>
                      Für ein KO-Feld mit {derivedPlan.nextPower} Teilnehmern fehlen noch {derivedPlan.nextPower - derivedPlan.koParticipants}{' '}
                      Plätze. Erhöhe Lucky-Loser oder die Gruppenanzahl.
                    </PlanSummaryWarning>
                  )}
                </PlanSummary>
                <Field>
                  <label htmlFor="challenge-ko-size">Teilnehmer KO-Phase (optional)</label>
                  <input
                    id="challenge-ko-size"
                    type="number"
                    min="2"
                    step="2"
                    placeholder="z. B. 16"
                    value={formState.koBracketSize}
                    onChange={handleFormChange('koBracketSize')}
                  />
                  <FormHint>Leer lassen für automatische Berechnung (nächste 2er-Potenz, sofern möglich).</FormHint>
                </Field>
                <FieldGroup>
                  <Field>
                    <label htmlFor="challenge-submission-limit">Einsendungen pro Nutzer</label>
                    <input
                      id="challenge-submission-limit"
                      type="number"
                      min="0"
                      value={formState.submissionLimitPerUser}
                      onChange={handleFormChange('submissionLimitPerUser')}
                    />
                    <FormHint>0 bedeutet unbegrenzt.</FormHint>
                  </Field>
                  <Field>
                    <label htmlFor="challenge-submission-deadline">Einreichdeadline</label>
                    <input
                      id="challenge-submission-deadline"
                      type="datetime-local"
                      value={formState.submissionDeadline}
                      onChange={handleFormChange('submissionDeadline')}
                    />
                  </Field>
                </FieldGroup>
                <Field>
                  <label htmlFor="challenge-start">Start (optional)</label>
                  <input
                    id="challenge-start"
                    type="datetime-local"
                    value={formState.startAt}
                    onChange={handleFormChange('startAt')}
                  />
                </Field>
                <SectionTitle>Gruppen-Zeitplan</SectionTitle>
                <FormHint>
                  Definiere Start und Dauer pro Slot. Alle Gruppen eines Slots starten gleichzeitig, weitere Slots sorgen für
                  gestaffelte Starts.
                </FormHint>
                {formState.groupSchedule.length === 0 && (
                  <PlaceholderText>
                    Keine Slots angelegt – Standardwerte (2 Gruppen pro Woche, 14 Tage Dauer) werden genutzt.
                  </PlaceholderText>
                )}
                {formState.groupSchedule.length > 0 && (
                  <ScheduleList>
                    {formState.groupSchedule.map((slot, index) => (
                      <ScheduleSlot key={slot.id}>
                        <ScheduleSlotHeader>
                          <span>Slot {index + 1}</span>
                          <RemoveSlotButton type="button" onClick={() => handleRemoveScheduleSlot(slot.id)}>
                            Slot entfernen
                          </RemoveSlotButton>
                        </ScheduleSlotHeader>
                        <FieldGroup>
                          <Field>
                            <label htmlFor={`schedule-start-${slot.id}`}>Startzeit</label>
                            <input
                              id={`schedule-start-${slot.id}`}
                              type="datetime-local"
                              value={slot.startAt}
                              onChange={handleScheduleChange(slot.id, 'startAt')}
                            />
                          </Field>
                          <Field>
                            <label htmlFor={`schedule-duration-${slot.id}`}>Dauer (Tage)</label>
                            <input
                              id={`schedule-duration-${slot.id}`}
                              type="number"
                              min="1"
                              value={slot.durationDays}
                              onChange={handleScheduleChange(slot.id, 'durationDays')}
                            />
                          </Field>
                          <Field>
                            <label htmlFor={`schedule-groups-${slot.id}`}>Gruppen pro Slot</label>
                            <input
                              id={`schedule-groups-${slot.id}`}
                              type="number"
                              min="1"
                              value={slot.groups}
                              onChange={handleScheduleChange(slot.id, 'groups')}
                            />
                          </Field>
                        </FieldGroup>
                      </ScheduleSlot>
                    ))}
                  </ScheduleList>
                )}
                <SecondaryButton type="button" onClick={handleAddScheduleSlot}>
                  Slot hinzufügen
                </SecondaryButton>
                <PrimaryButton type="submit" disabled={formSubmitting}>
                  {formSubmitting ? 'Speichere...' : 'Challenge erstellen'}
                </PrimaryButton>
              </PanelCard>

              <PanelCard>
                <PanelHeader>
                  <h3>Bestehende Challenges</h3>
                  <button type="button" onClick={loadChallenges} disabled={challengesLoading}>
                    Aktualisieren
                  </button>
                </PanelHeader>
                {challengesLoading && <PlaceholderText>Lade Challenges…</PlaceholderText>}
                {!challengesLoading && !challenges.length && (
                  <PlaceholderText>Noch keine Challenges vorhanden.</PlaceholderText>
                )}
                <ChallengeList>{challenges.map(renderChallengeCard)}</ChallengeList>
              </PanelCard>
            </PanelsWrapper>

            {selectedChallenge && (
              <PanelCard>
                <PanelHeader>
                  <h3>Challenge-Fortschritt</h3>
                  <StatusBadge $status={overview?.challenge?.status || selectedChallenge.status}>
                    {STATUS_LABELS[overview?.challenge?.status || selectedChallenge.status] || 'Unbekannt'}
                  </StatusBadge>
                </PanelHeader>
                {overviewLoading && <PlaceholderText>Lade Übersicht…</PlaceholderText>}
                {!overviewLoading && overview && (
                  <>
                    <ChallengeStats>
                      <span>ID: #{overview.challenge.id}</span>
                      {challengeConfig?.group_advancers ? (
                        <span>Weiter/Gruppe: {challengeConfig.group_advancers}</span>
                      ) : null}
                      <span>Lucky Slots: {challengeConfig?.lucky_loser_slots ?? 0}</span>
                      {challengeConfig?.ko_bracket_size ? (
                        <span>KO-Feld: {challengeConfig.ko_bracket_size}</span>
                      ) : null}
                      <span>Bilder in Gruppen: {overview.groups?.reduce((sum, group) => sum + group.entries.length, 0) || 0}</span>
                      <span>KO-Duelle: {overview.ko_matches?.length || 0}</span>
                    </ChallengeStats>
                    <ActionButtonRow>
                      <SecondaryButton
                        type="button"
                        onClick={handleStartGroupPhase}
                        disabled={groupActionLoading || !['draft', 'submission_open'].includes(challengeConfig?.status)}
                      >
                        {groupActionLoading ? 'Starte…' : 'Gruppenphase aufsetzen'}
                      </SecondaryButton>
                      <SecondaryButton
                        type="button"
                        onClick={handleStartKoPhase}
                        disabled={koActionLoading || ['ko_running', 'finished', 'ko_finished', 'closed'].includes(challengeConfig?.status)}
                      >
                        {koActionLoading ? 'Starte…' : 'KO-Runde erzeugen'}
                      </SecondaryButton>
                      <SecondaryButton
                        type="button"
                        onClick={handleAdvanceKoRound}
                        disabled={koAdvanceLoading || !overview?.ko_matches?.length}
                      >
                        {koAdvanceLoading ? 'Schließe…' : 'Aktuelle KO-Runde abschließen'}
                      </SecondaryButton>
                    </ActionButtonRow>
                  </>
                )}
              </PanelCard>
            )}
            {selectedChallenge && (
              <PanelCard>
                <PanelHeader>
                  <h3>Einreichungen</h3>
                  <button type="button" onClick={() => loadSubmissions(selectedChallengeId)} disabled={submissionsLoading}>
                    Aktualisieren
                  </button>
                </PanelHeader>
                <SubmissionMeta>
                  <span>Status: {challengeConfig?.status === 'submission_open' ? 'Einreichungsphase aktiv' : 'Phase beendet'}</span>
                  <span>
                    Limit pro Nutzer:{' '}
                    {challengeConfig?.submission_limit_per_user ? challengeConfig.submission_limit_per_user : 'unbegrenzt'}
                  </span>
                  <span>
                    Deadline:{' '}
                    {challengeConfig?.submission_deadline
                      ? new Date(challengeConfig.submission_deadline).toLocaleString('de-DE')
                      : 'keine'}
                  </span>
                </SubmissionMeta>
                {submissionsLoading && <PlaceholderText>Lade Einreichungen…</PlaceholderText>}
                {!submissionsLoading && !submissions.length && (
                  <PlaceholderText>Noch keine Einreichungen vorhanden.</PlaceholderText>
                )}
                {!submissionsLoading && submissions.length > 0 && (
                  <SubmissionList>
                    {submissions.map((submission) => (
                      <SubmissionCard key={submission.id}>
                        <SubmissionImage src={buildAssetUrl(submission.url)} alt={submission.beschreibung || `Bild ${submission.image_id}`} />
                        <SubmissionInfo>
                          <strong>{submission.title || `Bild #${submission.image_id}`}</strong>
                          <span>von {submission.username || `User ${submission.nutzer_id}`}</span>
                          <small>{new Date(submission.created_at).toLocaleString()}</small>
                        </SubmissionInfo>
                        <SubmissionStatusChip
                          $variant={
                            submission.status === 'accepted'
                              ? 'voted'
                              : submission.status === 'pending'
                              ? 'open'
                              : 'closed'
                          }
                        >
                          {submission.status === 'accepted'
                            ? 'Übernommen'
                            : submission.status === 'rejected'
                            ? 'Abgelehnt'
                            : 'Wartet auf Entscheidung'}
                        </SubmissionStatusChip>
                        {submission.status === 'pending' && (
                          <SubmissionActions>
                            <SecondaryButton type="button" onClick={() => handleSubmissionAction(submission.id, 'approve')}>
                              Übernehmen
                            </SecondaryButton>
                            <InlineResetButton type="button" onClick={() => handleSubmissionAction(submission.id, 'reject')}>
                              Ablehnen
                            </InlineResetButton>
                          </SubmissionActions>
                        )}
                      </SubmissionCard>
                    ))}
                  </SubmissionList>
                )}
              </PanelCard>
            )}

            <PanelCard>
              <PanelHeader>
                <h3>Bildverwaltung</h3>
                {selectedChallenge && <span>{selectedChallenge.title}</span>}
              </PanelHeader>
              {!selectedChallenge && (
                <PlaceholderText>Bitte wähle eine Challenge, um Bilder zu verwalten.</PlaceholderText>
              )}

              {selectedChallenge && (
                <>
                  <ChallengeStats>
                    <span>Status: {selectedChallenge.status}</span>
                    <span>Gruppengröße: {selectedChallenge.group_size}</span>
                    <span>Aktuelle Bilder: {challengeImages.length}</span>
                  </ChallengeStats>

                  <SearchRow onSubmit={(e) => e.preventDefault()}>
                    <input
                      type="text"
                      placeholder="Nach Nutzer, Shop oder Beschreibung suchen"
                      value={imageSearchQuery}
                      onChange={(event) => setImageSearchQuery(event.target.value)}
                    />
                    <PrimaryButton type="button" onClick={() => handleSearchImages(1)}>
                      {imageSearchLoading ? 'Suche...' : 'Suchen'}
                    </PrimaryButton>
                  </SearchRow>

                  {imageResults.length > 0 && (
                    <SectionTitle>Gefundene Bilder</SectionTitle>
                  )}
                  <ImageGrid>
                    {imageResults.map((image) => renderImageCard(image, false))}
                  </ImageGrid>
                  {imageSearchHasMore && (
                    <SecondaryButton
                      type="button"
                      onClick={() => handleSearchImages(imageSearchPage + 1, true)}
                      disabled={imageSearchLoading}
                    >
                      Mehr laden
                    </SecondaryButton>
                  )}

                  {['draft', 'submission_open'].includes(challengeConfig?.status) ? (
                    <>
                      <SectionTitle>Ausgewählte Bilder</SectionTitle>
                      {challengeImagesLoading && <PlaceholderText>Lade zugewiesene Bilder…</PlaceholderText>}
                      {!challengeImagesLoading && challengeImages.length === 0 && (
                        <PlaceholderText>Noch keine Bilder hinzugefügt.</PlaceholderText>
                      )}
                      <ImageGrid>
                        {challengeImages.map((image) => renderImageCard(image, true))}
                      </ImageGrid>
                    </>
                  ) : (
                    <>
                      <SectionTitle>Bilder in Challenge</SectionTitle>
                      <ToggleImagesButton
                        type="button"
                        onClick={() => setShowChallengeImages((prev) => !prev)}
                      >
                        {showChallengeImages ? 'Bilder ausblenden' : 'Bilder anzeigen'}
                      </ToggleImagesButton>
                      {showChallengeImages && (
                        <ImageGrid>
                          {challengeImages.map((image) => renderImageCard(image, true))}
                        </ImageGrid>
                      )}
                    </>
                  )}
                </>
              )}
            </PanelCard>

            {overview?.groups?.length ? (
              <PanelCard>
                <PanelHeader>
                  <h3>Gruppenübersicht</h3>
                  <span>{overview.groups.length} Gruppen</span>
                </PanelHeader>
                <GroupsGrid>
                  {overview.groups.map((group) => {
                    const draft = groupTimeDrafts[group.id] ?? getGroupTimeDraft(group.id);
                    const saving = Boolean(groupTimeSaving[group.id]);
                    const hasLocalChanges = Boolean(groupTimeDrafts[group.id]);
                    // Stimmen berechnen und sortieren
                    const sortedEntries = [...group.entries].sort((a, b) => {
                      const votesA = (a.votes ?? 0);
                      const votesB = (b.votes ?? 0);
                      return votesB - votesA;
                    });
                    // IDs der weiterkommenden und Lucky Loser
                    const advancers = group.advancers || [];
                    const luckyLosers = group.lucky_losers || [];
                    return (
                      <GroupCard key={group.id}>
                        <GroupHeader>
                          <h4>{group.name}</h4>
                          <span>{group.entries.length} Bilder</span>
                        </GroupHeader>
                        <GroupEntries>
                          {sortedEntries.map((entry) => {
                            // Markierungen
                            let entryClass = '';
                            if (advancers.includes(entry.image_id)) {
                              entryClass = 'advancer';
                            } else if (luckyLosers.includes(entry.image_id)) {
                              entryClass = 'lucky-loser';
                            }
                            return (
                              <li key={entry.image_id} className={entryClass}>
                                <span>#{entry.seed}</span>
                                <img src={buildAssetUrl(entry.url)} alt={entry.beschreibung || 'Eisfoto'} />
                                <div>
                                  <strong>{entry.username || `Bild ${entry.image_id}`}</strong>
                                  {entry.beschreibung && <small>{entry.beschreibung}</small>}
                                  <small>Stimmen: {entry.votes ?? 0}</small>
                                </div>
                              </li>
                            );
                          })}
                        </GroupEntries>
                        {group.matches?.length > 0 && (
                          <>
                            <SectionTitle>Duelle</SectionTitle>
                            <MatchesList>
                              {group.matches.map((match) => (
                                <MatchRow key={match.id}>
                                  <MatchParticipants>
                                    <span>
                                      Bild #{match.image_a_id} · {match.votes_a} Stimme(n)
                                    </span>
                                    <span>vs.</span>
                                    <span>
                                      Bild #{match.image_b_id} · {match.votes_b} Stimme(n)
                                    </span>
                                  </MatchParticipants>
                                  <MatchStatus>{match.status === 'open' ? 'Offen' : 'Beendet'}</MatchStatus>
                                </MatchRow>
                              ))}
                            </MatchesList>
                          </>
                        )}
                        <GroupTimeControls>
                          <TimeField>
                            <label>Startzeit</label>
                            <input
                              type="datetime-local"
                              value={draft.startAt}
                              onChange={(event) => handleGroupTimeChange(group.id, 'startAt', event.target.value)}
                              disabled={saving}
                            />
                          </TimeField>
                          <TimeField>
                            <label>Endzeit</label>
                            <input
                              type="datetime-local"
                              value={draft.endAt}
                              onChange={(event) => handleGroupTimeChange(group.id, 'endAt', event.target.value)}
                              disabled={saving}
                            />
                          </TimeField>
                          <GroupTimeActions>
                            <SecondaryButton
                              type="button"
                              onClick={() => handleGroupTimeSave(group.id)}
                              disabled={saving}
                            >
                              {saving ? 'Speichere…' : 'Zeiten speichern'}
                            </SecondaryButton>
                            <InlineResetButton
                              type="button"
                              onClick={() => handleGroupTimeReset(group.id)}
                              disabled={saving || !hasLocalChanges}
                            >
                              Zurücksetzen
                            </InlineResetButton>
                          </GroupTimeActions>
                        </GroupTimeControls>
                      </GroupCard>
                    );
                  })}
                </GroupsGrid>
              </PanelCard>
            ) : null}

            {overview?.ko_matches?.length ? (
              <PanelCard>
                <PanelHeader>
                  <h3>KO-Runde</h3>
                  <span>{overview.ko_matches.length} offene Matches</span>
                </PanelHeader>
                {/* KO-Duelle nach Turnierphase gruppieren */}
                {(() => {
                  // Phasen-Mapping
                  // Dynamische Phasen-Erkennung nach Runden-Größe
                  const PHASE_LABELS = {
                    'round_of_16': 'Achtelfinale',
                    'quarter_final': 'Viertelfinale',
                    'semi_final': 'Halbfinale',
                    'final': 'Finale',
                    'ko': 'KO-Runde',
                  };
                  // Gruppiere nach Runde
                  const groupedByRound = {};
                  overview.ko_matches.forEach((match) => {
                    const round = match.round || 1;
                    if (!groupedByRound[round]) groupedByRound[round] = [];
                    groupedByRound[round].push(match);
                  });
                  // Sortiere Runden
                  const sortedRounds = Object.keys(groupedByRound).sort((a, b) => Number(a) - Number(b));
                  // Mapping von Match-Anzahl zu Phase
                  const roundPhaseMap = {
                    16: 'Sechtzehntelfinale',
                    8: 'Achtelfinale',
                    4: 'Viertelfinale',
                    2: 'Halbfinale',
                    1: 'Finale',
                  };
                  return sortedRounds.map((round) => {
                    const matches = groupedByRound[round];
                    const phaseLabel = roundPhaseMap[matches.length] || `Runde ${round}`;
                    return (
                      <div key={round} style={{ marginBottom: '1.5rem' }}>
                        <SectionTitle>{phaseLabel}</SectionTitle>
                        <MatchesList>
                          {matches.map((match) => (
                            <MatchRow key={match.id}>
                              <MatchParticipants>
                                <span>
                                  #{match.image_a_id} · {match.votes_a} Stimme(n)
                                </span>
                                <span>vs.</span>
                                <span>
                                  #{match.image_b_id} · {match.votes_b} Stimme(n)
                                </span>
                              </MatchParticipants>
                              <MatchStatus>{match.status === 'open' ? `Runde ${match.round}` : 'Beendet'}</MatchStatus>
                            </MatchRow>
                          ))}
                        </MatchesList>
                      </div>
                    );
                  });
                })()}
              </PanelCard>
            ) : null}
          </>
        )}
      </Content>
    </PageWrapper>
  );
}

export default PhotoChallengeAdmin;

const ToggleImagesButton = styled.button`
  background: #f5f5f5;
  border: 1px solid #bbb;
  border-radius: 999px;
  padding: 0.5rem 1.2rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 1rem;
`;

const PageWrapper = styled.div`
  min-height: 100vh;
  background: #fef7ef;
`;

const Content = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
`;

const HeroSection = styled.section`
  margin-bottom: 1.5rem;

  h1 {
    margin: 0 0 0.5rem;
    font-size: 2rem;
  }

  p {
    margin: 0;
    color: #5c5c6f;
  }
`;

const WarningBox = styled.div`
  background: #fff0dd;
  border: 1px solid #ffd9aa;
  color: #7c4a00;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
`;

const FeedbackBox = styled.div`
  padding: 0.8rem 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  color: ${({ $variant }) => ($variant === 'error' ? '#7c1a1a' : '#0c473f')};
  background: ${({ $variant }) => ($variant === 'error' ? '#ffe6e6' : '#e5fff7')};
  border: 1px solid ${({ $variant }) => ($variant === 'error' ? '#f5b5b5' : '#89f0d3')};
`;

const PanelsWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const PanelCard = styled.div`
  background: #fff;
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 20px 35px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;

  h3 {
    margin: 0;
  }

  button {
    background: transparent;
    border: 1px solid #ddd;
    padding: 0.35rem 0.9rem;
    border-radius: 999px;
    cursor: pointer;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  label {
    font-weight: 600;
    color: #4a4a68;
  }

  input,
  textarea,
  select {
    border-radius: 12px;
    border: 1px solid #ddd;
    padding: 0.6rem 0.75rem;
    font-size: 1rem;
  }
`;

const FieldGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
`;

const PrimaryButton = styled.button`
  background: #ffb522;
  border: none;
  border-radius: 999px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  color: #2b1e00;
  cursor: pointer;
  align-self: flex-start;
  min-width: 200px;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled.button`
  background: transparent;
  border-radius: 999px;
  border: 1px solid #bbb;
  padding: 0.6rem 1.2rem;
  font-weight: 600;
  cursor: pointer;
  align-self: flex-start;
`;

const ChallengeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ChallengeCard = styled.button`
  border: 1px solid ${({ $active }) => ($active ? '#ffb522' : '#eceff4')};
  border-radius: 16px;
  padding: 0.85rem 1rem;
  background: ${({ $active }) => ($active ? '#fff8ea' : '#fff')};
  text-align: left;
  cursor: pointer;

  h4 {
    margin: 0 0 0.2rem;
  }

  small {
    color: #7a7a90;
  }
`;

const ChallengeCardAction = styled.button`
  margin-top: 0.5rem;
  border-radius: 999px;
  border: 1px solid #d9d9e5;
  padding: 0.35rem 0.85rem;
  background: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    border-color: #ffb522;
    color: #d98200;
  }
`;

const ChallengeMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.35rem;
`;

const PlaceholderText = styled.p`
  margin: 0;
  color: #777;
`;

const ChallengeStats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-weight: 600;
`;

const SearchRow = styled.form`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;

  input {
    flex: 1;
    min-width: 200px;
    border-radius: 12px;
    border: 1px solid #ddd;
    padding: 0.6rem 0.75rem;
  }
`;

const SectionTitle = styled.h4`
  margin: 1rem 0 0.5rem;
`;

const PlanSummary = styled.div`
  border: 1px solid #ffe0b3;
  background: #fffaf0;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.95rem;
  color: #4a3b1a;
`;

const PlanSummaryNote = styled.small`
  color: #7a6b4b;
`;

const PlanSummaryWarning = styled.small`
  color: #b61919;
  font-weight: 600;
`;

const FormHint = styled.p`
  margin: -0.3rem 0 0.5rem;
  color: #777;
  font-size: 0.9rem;
`;

const ScheduleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ScheduleSlot = styled.div`
  border: 1px solid #eceff4;
  border-radius: 12px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ScheduleSlotHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #4a4a68;
`;

const RemoveSlotButton = styled.button`
  border: none;
  background: transparent;
  color: #c0392b;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.2rem 0.5rem;
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
`;

const ImageCard = styled.div`
  border: 1px solid #eee;
  border-radius: 16px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: #fff;
`;

const ImagePreview = styled.img`
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 12px;
`;

const ImageInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;

  strong {
    font-size: 0.9rem;
  }
`;

const ImageActionButton = styled.button`
  border-radius: 12px;
  border: 1px solid #ffb522;
  background: #fff8ea;
  padding: 0.45rem 0.75rem;
  font-weight: 600;
  cursor: pointer;
`;

const StatusBadge = styled.span`
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.9rem;
  background: ${({ $status }) =>
    $status === 'ko_running'
      ? '#ffe6ef'
      : $status === 'group_running'
      ? '#e8f7ff'
      : '#f2f2f7'};
  color: ${({ $status }) =>
    $status === 'ko_running'
      ? '#b01254'
      : $status === 'group_running'
      ? '#0b5d8b'
      : '#555'};
`;

const ActionButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const GroupsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
`;

const GroupCard = styled.div`
  border: 1px solid #eee;
  border-radius: 16px;
  padding: 1rem;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const GroupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  h4 {
    margin: 0;
  }
  span {
    font-size: 0.85rem;
    color: #777;
  }
`;

const GroupEntries = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  li {
    display: grid;
    grid-template-columns: auto 48px 1fr;
    gap: 0.5rem;
    align-items: center;
    border-radius: 8px;
    transition: background 0.2s;
  }

  li.advancer {
    background: #e6ffe6;
    border: 1px solid #4caf50;
  }

  li.lucky-loser {
    background: #fffbe6;
    border: 1px solid #ffd700;
  }

  img {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    object-fit: cover;
  }

  strong {
    display: block;
  }

  small {
    color: #777;
  }
`;

const MatchesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const MatchRow = styled.div`
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  padding: 0.5rem 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafafa;
`;

const MatchParticipants = styled.div`
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  font-size: 0.9rem;
`;

const MatchStatus = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: #666;
`;

const GroupTimeControls = styled.div`
  margin-top: 0.5rem;
  border-top: 1px solid #f1f1f6;
  padding-top: 0.75rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
`;

const TimeField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  label {
    font-weight: 600;
    color: #4a4a68;
  }

  input {
    border-radius: 12px;
    border: 1px solid #ddd;
    padding: 0.5rem 0.75rem;
  }
`;

const GroupTimeActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
`;

const InlineResetButton = styled.button`
  border: none;
  background: transparent;
  color: #b53b12;
  cursor: pointer;
  font-weight: 600;
  padding: 0.35rem 0.5rem;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SubmissionMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.9rem;
  color: #55536b;
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
  grid-template-columns: 80px 1fr auto;
  gap: 0.75rem;
  align-items: center;
  background: #fff;
  @media (max-width: 700px) {
    grid-template-columns: 60px 1fr;
    grid-auto-rows: auto;
  }
`;

const SubmissionImage = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 12px;
  object-fit: cover;
  background: #f1f1f6;
  @media (max-width: 700px) {
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

  span {
    color: #6a6882;
  }

  small {
    color: #9a97b3;
  }
`;

const SubmissionActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  justify-self: end;
  @media (max-width: 700px) {
    grid-column: 1 / -1;
    flex-direction: row;
    justify-content: flex-end;
  }
`;

const SubmissionStatusChip = styled.span`
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${({ $variant }) =>
    $variant === 'closed'
      ? '#f2f2f7'
      : $variant === 'open'
      ? '#fff4e6'
      : '#e6f6ea'};
  color: ${({ $variant }) =>
    $variant === 'closed'
      ? '#666278'
      : $variant === 'open'
      ? '#a85b00'
      : '#2e7d32'};
`;
