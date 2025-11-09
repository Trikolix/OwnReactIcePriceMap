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

const DEFAULT_FORM = {
  title: '',
  description: '',
  status: 'draft',
  groupSize: 4,
  startAt: '',
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
  const [formState, setFormState] = useState(DEFAULT_FORM);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [groupActionLoading, setGroupActionLoading] = useState(false);
  const [koActionLoading, setKoActionLoading] = useState(false);
  const [imageSearchQuery, setImageSearchQuery] = useState('');
  const [imageResults, setImageResults] = useState([]);
  const [imageSearchPage, setImageSearchPage] = useState(1);
  const [imageSearchHasMore, setImageSearchHasMore] = useState(false);
  const [imageSearchLoading, setImageSearchLoading] = useState(false);

  const STATUS_LABELS = {
    draft: 'Entwurf',
    active: 'Aktiv',
    finished: 'Abgeschlossen',
    group_running: 'Gruppenphase',
    ko_running: 'KO-Phase',
  };

  const selectedChallenge = useMemo(
    () => challenges.find((challenge) => challenge.id === selectedChallengeId) || null,
    [challenges, selectedChallengeId]
  );

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

  useEffect(() => {
    if (isAdmin) {
      loadChallenges();
    }
  }, [isAdmin, loadChallenges]);

  useEffect(() => {
    if (isAdmin && selectedChallengeId) {
      loadChallengeImages(selectedChallengeId);
      loadChallengeOverview(selectedChallengeId);
    } else {
      setChallengeImages([]);
      setOverview(null);
    }
  }, [isAdmin, selectedChallengeId, loadChallengeImages, loadChallengeOverview]);

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
      if (formState.startAt) {
        formData.append('start_at', formState.startAt);
      }

      const res = await fetch(`${apiUrl}/photo_challenge/create_challenge.php`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.status === 'success') {
        setChallenges((prev) => [data.challenge, ...prev]);
        setFormState(DEFAULT_FORM);
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

  const handleFormChange = (field) => (event) => {
    const value = field === 'groupSize' ? Number(event.target.value) : event.target.value;
    setFormState((prev) => ({ ...prev, [field]: value }));
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
        <ImageActionButton type="button" onClick={() => handleRemoveImage(image.image_id)}>
          Entfernen
        </ImageActionButton>
      ) : (
        <ImageActionButton type="button" onClick={() => handleAddImage(image.id)}>
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
                  <label htmlFor="challenge-start">Start (optional)</label>
                  <input
                    id="challenge-start"
                    type="datetime-local"
                    value={formState.startAt}
                    onChange={handleFormChange('startAt')}
                  />
                </Field>
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
                      <span>Bilder in Gruppen: {overview.groups?.reduce((sum, group) => sum + group.entries.length, 0) || 0}</span>
                      <span>KO-Duelle: {overview.ko_matches?.length || 0}</span>
                    </ChallengeStats>
                    <ActionButtonRow>
                      <SecondaryButton
                        type="button"
                        onClick={handleStartGroupPhase}
                        disabled={groupActionLoading}
                      >
                        {groupActionLoading ? 'Starte…' : 'Gruppenphase neu aufsetzen'}
                      </SecondaryButton>
                      <SecondaryButton
                        type="button"
                        onClick={handleStartKoPhase}
                        disabled={koActionLoading}
                      >
                        {koActionLoading ? 'Starte…' : 'KO-Runde erzeugen'}
                      </SecondaryButton>
                    </ActionButtonRow>
                  </>
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

                  <SectionTitle>Ausgewählte Bilder</SectionTitle>
                  {challengeImagesLoading && <PlaceholderText>Lade zugewiesene Bilder…</PlaceholderText>}
                  {!challengeImagesLoading && challengeImages.length === 0 && (
                    <PlaceholderText>Noch keine Bilder hinzugefügt.</PlaceholderText>
                  )}
                  <ImageGrid>
                    {challengeImages.map((image) => renderImageCard(image, true))}
                  </ImageGrid>
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
                  {overview.groups.map((group) => (
                    <GroupCard key={group.id}>
                      <GroupHeader>
                        <h4>{group.name}</h4>
                        <span>{group.entries.length} Bilder</span>
                      </GroupHeader>
                      <GroupEntries>
                        {group.entries.map((entry) => (
                          <li key={entry.image_id}>
                            <span>#{entry.seed}</span>
                            <img src={buildAssetUrl(entry.url)} alt={entry.beschreibung || 'Eisfoto'} />
                            <div>
                              <strong>{entry.username || `Bild ${entry.image_id}`}</strong>
                              {entry.beschreibung && <small>{entry.beschreibung}</small>}
                            </div>
                          </li>
                        ))}
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
                    </GroupCard>
                  ))}
                </GroupsGrid>
              </PanelCard>
            ) : null}

            {overview?.ko_matches?.length ? (
              <PanelCard>
                <PanelHeader>
                  <h3>KO-Runde</h3>
                  <span>{overview.ko_matches.length} offene Matches</span>
                </PanelHeader>
                <MatchesList>
                  {overview.ko_matches.map((match) => (
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
              </PanelCard>
            ) : null}
          </>
        )}
      </Content>
    </PageWrapper>
  );
}

export default PhotoChallengeAdmin;

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
