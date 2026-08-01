import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import Header from '../Header';
import { useUser } from '../context/UserContext';
import {
  downloadTourDeGlaceStoryPack,
  fetchTourDeGlaceAdminState,
  saveTourDeGlaceFinalResults,
  saveTourDeGlaceStageResult,
} from '../features/seasonal/tourDeGlaceAdminApi';
import {
  TOUR_DE_GLACE_STARTERS,
  normalizeTourDeGlaceStarterSearch,
} from '../features/seasonal/tourDeGlaceStarters';

const JERSEY_LABELS = {
  yellow: 'Gelb',
  green: 'Grün',
  mountain: 'Berg',
  ice: 'Eiscreme',
  white: 'Weiß',
};

const TIP_LABELS = {
  tip_gc_winner: 'GC 1',
  tip_gc_second: 'GC 2',
  tip_gc_third: 'GC 3',
  tip_green_winner: 'Grün',
  tip_mountain_winner: 'Berg',
  tip_white_winner: 'Weiß',
};

const FINAL_RESULT_FIELDS = [
  ['result_gc_winner', 'GC 1'],
  ['result_gc_second', 'GC 2'],
  ['result_gc_third', 'GC 3'],
  ['result_green_winner', 'Grünes Trikot'],
  ['result_mountain_winner', 'Bergtrikot'],
  ['result_white_winner', 'Weißes Trikot'],
];

const ACTION_LABELS = {
  checkin_scoop_softice: 'Kugel/Softeis',
  checkin_sundae: 'Eisbecher',
  checkin_photo: 'Foto',
  new_shop_checkin: 'Neue Eisdiele',
  bike_bonus: 'Fahrradbonus',
  group_checkin: 'Gruppen-Check-in',
  daily_visit: 'Tagesbesuch',
  like: 'Like',
  comment: 'Kommentar',
  easter_egg: 'Etappensichtung',
  referral: 'Geworbener Nutzer',
  challenge_completed: 'Challenge',
  team_challenge_completed: 'Team-Challenge',
  review: 'Bewertung',
  route: 'Route',
  profile_image: 'Profilbild',
};

const formatNumber = (value) => new Intl.NumberFormat('de-DE').format(Number(value || 0));
const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
const normalizeStageTop10 = (result) => {
  const top10 = Array.isArray(result?.stage_top10)
    ? result.stage_top10
    : (Array.isArray(result?.top10) ? result.top10 : []);
  const values = top10.length > 0 ? top10 : [result?.stage_winner || ''];
  return Array.from({ length: 10 }, (_, index) => String(values[index] || ''));
};
const KNOWN_TEAMS = Array.from(new Set(TOUR_DE_GLACE_STARTERS.map((starter) => starter.team).filter(Boolean)))
  .sort((left, right) => right.length - left.length);

const stripResultNoise = (value) => String(value || '')
  .replace(/^\s*\d{1,2}\s*(?:[.)-]|\s)\s*/u, '')
  .replace(/\s+(?:\+?\d{1,2}:)?\d{1,2}:\d{2}(?::\d{2})?\s*$/u, '')
  .replace(/\s+\+\d+(?:['’]\d{2}")?\s*$/u, '')
  .replace(/\s+\d+\s*(?:pts?|Punkte)\s*$/iu, '')
  .trim();

const parseStageResultTop10 = (rawText) => {
  const text = String(rawText || '');
  if (!text.trim()) {
    return [];
  }

  const normalizedText = normalizeTourDeGlaceStarterSearch(text);
  const knownMatches = TOUR_DE_GLACE_STARTERS
    .map((starter) => ({
      name: starter.name,
      index: normalizedText.indexOf(normalizeTourDeGlaceStarterSearch(starter.name)),
    }))
    .filter((entry) => entry.index >= 0)
    .sort((left, right) => left.index - right.index);

  const parsed = [];
  const seen = new Set();
  knownMatches.forEach((entry) => {
    const key = normalizeTourDeGlaceStarterSearch(entry.name);
    if (!seen.has(key) && parsed.length < 10) {
      parsed.push(entry.name);
      seen.add(key);
    }
  });
  if (parsed.length >= 10) {
    return parsed;
  }

  text.split(/\r?\n/u).forEach((line) => {
    if (parsed.length >= 10) {
      return;
    }
    const cells = line.split(/\t|;/u).map((cell) => cell.trim()).filter(Boolean);
    let candidate = '';
    if (cells.length >= 2 && /^\d{1,2}[.)]?$/.test(cells[0])) {
      candidate = cells[1];
    } else {
      candidate = stripResultNoise(line);
      const normalizedCandidate = normalizeTourDeGlaceStarterSearch(candidate);
      const team = KNOWN_TEAMS.find((teamName) => normalizedCandidate.includes(normalizeTourDeGlaceStarterSearch(teamName)));
      if (team) {
        const teamIndex = normalizedCandidate.indexOf(normalizeTourDeGlaceStarterSearch(team));
        const beforeTeam = candidate.slice(0, Math.max(0, teamIndex)).trim();
        if (beforeTeam) {
          candidate = beforeTeam;
        }
      }
    }

    candidate = stripResultNoise(candidate);
    const key = normalizeTourDeGlaceStarterSearch(candidate);
    if (key && key.split(' ').length >= 2 && candidate.length <= 80 && !seen.has(key)) {
      parsed.push(candidate);
      seen.add(key);
    }
  });

  return parsed.slice(0, 10);
};

export default function TourDeGlaceAdmin() {
  const { userId, authToken, isLoggedIn } = useUser();
  const isAdmin = Number(userId) === 1;
  const [state, setState] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState('');
  const [stageResults, setStageResults] = useState({});
  const [stageResultPaste, setStageResultPaste] = useState({});
  const [savingStageResult, setSavingStageResult] = useState(null);
  const [finalResults, setFinalResults] = useState({});
  const [savingFinalResults, setSavingFinalResults] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const load = async () => {
    if (!authToken || !isAdmin) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchTourDeGlaceAdminState(authToken);
      setState(data);
      setStageResults(Object.fromEntries((data.stage_results || []).map((result) => [
        String(result.stage_number),
        normalizeStageTop10(result),
      ])));
      setFinalResults(Object.fromEntries(FINAL_RESULT_FIELDS.map(([key]) => [key, data.final_results?.[key] || ''])));
    } catch (err) {
      setError(err.message || 'Tour-de-Glace Admin-Daten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [authToken, isAdmin]);

  const totalPoints = useMemo(() => {
    const points = state?.summary?.points || {};
    return Object.values(points).reduce((sum, value) => sum + Number(value || 0), 0);
  }, [state]);

  const handleDownload = async (pack) => {
    setDownloadLoading(pack);
    setError('');
    setInfo('');
    try {
      await downloadTourDeGlaceStoryPack(authToken, pack, 5);
      setInfo('Story-ZIP wurde erstellt.');
    } catch (err) {
      setError(err.message || 'Story-ZIP konnte nicht erstellt werden.');
    } finally {
      setDownloadLoading('');
    }
  };

  const handleStageResultChange = (stageNumber, rankIndex, value) => {
    setStageResults((previous) => {
      const key = String(stageNumber);
      const existingResult = (state?.stage_results || []).find((result) => Number(result.stage_number) === Number(stageNumber));
      const baseTop10 = previous[key] || normalizeStageTop10(existingResult);
      const nextTop10 = Array.from({ length: 10 }, (_, index) => String(baseTop10[index] || ''));
      nextTop10[rankIndex] = value;
      return { ...previous, [key]: nextTop10 };
    });
  };

  const handleStageResultPasteText = (stageNumber, value) => {
    setStageResultPaste((previous) => ({ ...previous, [String(stageNumber)]: value }));
    const parsedTop10 = parseStageResultTop10(value);
    if (parsedTop10.length === 0) {
      return;
    }
    setStageResults((previous) => {
      const key = String(stageNumber);
      const existingResult = (state?.stage_results || []).find((result) => Number(result.stage_number) === Number(stageNumber));
      const baseTop10 = previous[key] || normalizeStageTop10(existingResult);
      const nextTop10 = Array.from({ length: 10 }, (_, index) => String(baseTop10[index] || ''));
      parsedTop10.forEach((name, index) => {
        nextTop10[index] = name;
      });
      return { ...previous, [key]: nextTop10 };
    });
  };

  const handleSaveStageResult = async (stageNumber, event) => {
    const key = String(stageNumber);
    const existingResult = (state?.stage_results || []).find((result) => Number(result.stage_number) === Number(stageNumber));
    const resultCard = event?.currentTarget?.closest('[data-stage-result-card]');
    const inputTop10 = Array.from(resultCard?.querySelectorAll('[data-stage-result-rank]') || [])
      .sort((left, right) => Number(left.dataset.stageResultRank) - Number(right.dataset.stageResultRank))
      .map((input) => input.value);
    const stateTop10 = stageResults[key] || normalizeStageTop10(existingResult);
    const top10 = Array.from({ length: 10 }, (_, index) => String(inputTop10[index] ?? stateTop10[index] ?? '').trim());
    if (!top10[0]) {
      setError('Bitte Etappensieger eintragen.');
      return;
    }
    setSavingStageResult(stageNumber);
    setError('');
    setInfo('');
    try {
      await saveTourDeGlaceStageResult(authToken, stageNumber, top10);
      setInfo(`Etappenergebnis ${stageNumber} gespeichert.`);
      setStageResultPaste((previous) => ({ ...previous, [key]: '' }));
      await load();
    } catch (err) {
      setError(err.message || 'Etappenergebnis konnte nicht gespeichert werden.');
    } finally {
      setSavingStageResult(null);
    }
  };

  const handleSaveFinalResults = async () => {
    setSavingFinalResults(true);
    setError('');
    setInfo('');
    try {
      await saveTourDeGlaceFinalResults(authToken, finalResults);
      setInfo('Gesamt- und Trikot-Ergebnisse gespeichert. Die Tippspiel-Punkte wurden neu berechnet.');
      await load();
    } catch (err) {
      setError(err.message || 'Gesamt- und Trikot-Ergebnisse konnten nicht gespeichert werden.');
    } finally {
      setSavingFinalResults(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <Page>
        <Header />
        <Container><Card>Bitte einloggen.</Card></Container>
      </Page>
    );
  }

  if (!isAdmin) {
    return (
      <Page>
        <Header />
        <Container><Card>Kein Zugriff. Diese Seite ist nur für Admins.</Card></Container>
      </Page>
    );
  }

  return (
    <Page>
      <Header />
      <Container>
        <HeroCard>
          <Title>Tour de Glace Admin</Title>
          <Muted>Tipps, Fahrertypen, Punkte-Events und Instagram-Storys für die Trikotwertungen.</Muted>
          <ButtonRow>
            <Button type="button" onClick={load} disabled={loading}>{loading ? 'Lade...' : 'Aktualisieren'}</Button>
          </ButtonRow>
        </HeroCard>

        {error && <Notice $tone="error">{error}</Notice>}
        {info && <Notice $tone="success">{info}</Notice>}

        <Tabs>
          {[
            ['overview', 'Übersicht'],
            ['tips', 'Tipps'],
            ['riders', 'Fahrertypen'],
            ['events', 'Punkte/Events'],
            ['stories', 'Story-Downloads'],
          ].map(([key, label]) => (
            <TabButton key={key} type="button" $active={activeTab === key} onClick={() => setActiveTab(key)}>
              {label}
            </TabButton>
          ))}
        </Tabs>

        {loading && <Card>Lade Tour-de-Glace Daten...</Card>}

        {!loading && state && activeTab === 'overview' && (
          <>
            <StatsGrid>
              <StatCard><span>Aktive Nutzer</span><strong>{formatNumber(state.summary?.active_users)}</strong></StatCard>
              <StatCard><span>Tour-Punkte</span><strong>{formatNumber(totalPoints)}</strong></StatCard>
              <StatCard><span>Tipps</span><strong>{formatNumber(state.summary?.tips_count)}</strong></StatCard>
              <StatCard><span>Fahrertypen</span><strong>{formatNumber(state.summary?.rider_count)}</strong></StatCard>
              <StatCard><span>Etappensichtungen</span><strong>{formatNumber(state.summary?.stage_sightings)}</strong></StatCard>
            </StatsGrid>
            <Card>
              <SectionTitle>Offizielle Trikotträger</SectionTitle>
              <JerseyGrid>
                {Object.entries(JERSEY_LABELS).map(([key, label]) => {
                  const leader = state.leaders?.[key]?.official;
                  const raw = state.leaders?.[key]?.raw;
                  return (
                    <JerseyCard key={key}>
                      <strong>{label}</strong>
                      <span>{leader ? `${leader.username} · ${formatNumber(leader.points)} Punkte` : 'Noch offen'}</span>
                      {leader && raw && leader.user_id !== raw.user_id && (
                        <small>Rechnerisch: {raw.username}</small>
                      )}
                    </JerseyCard>
                  );
                })}
              </JerseyGrid>
            </Card>
          </>
        )}

        {!loading && state && activeTab === 'tips' && (
          <>
            <Card>
              <SectionTitle>Offizielle Gesamt- und Trikot-Ergebnisse</SectionTitle>
              <Muted>Nach dem Speichern werden die Tippspiel-Punkte automatisch berechnet. Änderungen werden direkt neu ausgewertet.</Muted>
              <FinalResultGrid>
                {FINAL_RESULT_FIELDS.map(([key, label]) => (
                  <label key={key}>
                    <span>{label}</span>
                    <input
                      value={finalResults[key] || ''}
                      onChange={(event) => setFinalResults((previous) => ({ ...previous, [key]: event.target.value }))}
                      placeholder="Fahrername"
                      list="tour-de-glace-starters"
                    />
                  </label>
                ))}
              </FinalResultGrid>
              <datalist id="tour-de-glace-starters">
                {TOUR_DE_GLACE_STARTERS.map((starter) => <option key={starter.name} value={starter.name} />)}
              </datalist>
              <Button type="button" onClick={handleSaveFinalResults} disabled={savingFinalResults}>
                {savingFinalResults ? 'Speichert...' : 'Ergebnisse speichern und Tipps werten'}
              </Button>
            </Card>
            <Card>
              <SectionTitle>Gesamt- und Trikot-Tipps</SectionTitle>
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <th>Nutzer</th>
                      {Object.values(TIP_LABELS).map((label) => <th key={label}>{label}</th>)}
                      <th>Abgabe</th>
                      <th>Geändert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(state.tips || []).map((tip) => (
                      <tr key={tip.user_id}>
                        <td><strong>{tip.username}</strong></td>
                        {Object.keys(TIP_LABELS).map((key) => <td key={key}>{tip[key] || '-'}</td>)}
                        <td>{formatDateTime(tip.submitted_at)}</td>
                        <td>{formatDateTime(tip.updated_at)}</td>
                      </tr>
                    ))}
                    {(!state.tips || state.tips.length === 0) && <EmptyRow colSpan={9}>Noch keine Tipps vorhanden.</EmptyRow>}
                  </tbody>
                </Table>
              </TableWrap>
            </Card>

            <Card>
              <SectionTitle>Etappensieger-Ergebnisse</SectionTitle>
              <StageResultGrid>
                {(state.stage_results || []).map((result) => {
                  const stageNumber = Number(result.stage_number);
                  const top10 = stageResults[String(stageNumber)] || normalizeStageTop10(result);
                  return (
                    <StageResultCard key={stageNumber} data-stage-result-card>
                      <strong>Etappe {stageNumber}</strong>
                      <span>{result.start_location} → {result.finish_location}</span>
                      <small>Start: {formatDateTime(result.start_at)}</small>
                      <StageResultPaste
                        value={stageResultPaste[String(stageNumber)] || ''}
                        onChange={(event) => handleStageResultPasteText(stageNumber, event.target.value)}
                        placeholder="Top-10-Ergebnisliste hier einfügen"
                        rows={4}
                      />
                      <StageTop10Grid>
                        {Array.from({ length: 10 }, (_, index) => (
                          <label key={index}>
                            <span>{index + 1}</span>
                            <input
                              data-stage-result-rank={index}
                              value={top10[index] || ''}
                              onChange={(event) => handleStageResultChange(stageNumber, index, event.target.value)}
                              placeholder={index === 0 ? 'Etappensieger' : `Platz ${index + 1}`}
                            />
                          </label>
                        ))}
                      </StageTop10Grid>
                      <Button
                        type="button"
                        onClick={(event) => handleSaveStageResult(stageNumber, event)}
                        disabled={savingStageResult === stageNumber}
                      >
                        {savingStageResult === stageNumber ? 'Speichert...' : 'Speichern'}
                      </Button>
                    </StageResultCard>
                  );
                })}
              </StageResultGrid>
            </Card>

            <Card>
              <SectionTitle>Etappensieger-Tipps</SectionTitle>
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <th>Etappe</th>
                      <th>Nutzer</th>
                      <th>Tipp</th>
                      <th>Ergebnis</th>
                      <th>Rang</th>
                      <th>EP</th>
                      <th>Status</th>
                      <th>Geändert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(state.stage_tips || []).map((tip) => (
                      <tr key={`${tip.stage_number}-${tip.user_id}`}>
                        <td>{tip.stage_number}</td>
                        <td><strong>{tip.username}</strong></td>
                        <td>{tip.tip_stage_winner || '-'}</td>
                        <td>{tip.stage_winner || '-'}</td>
                        <td>{tip.predicted_rank ? `#${tip.predicted_rank}` : '-'}</td>
                        <td>{tip.has_result ? `${formatNumber(tip.final_ep)} EP` : '-'}</td>
                        <td>
                          {tip.stage_winner
                            ? <ResultPill $correct={Boolean(tip.scored)}>{tip.scored ? (tip.has_stage_egg ? 'Gewertet + Egg' : 'Gewertet') : '0 EP'}</ResultPill>
                            : 'Offen'}
                        </td>
                        <td>{formatDateTime(tip.updated_at)}</td>
                      </tr>
                    ))}
                    {(!state.stage_tips || state.stage_tips.length === 0) && <EmptyRow colSpan={8}>Noch keine Etappensieger-Tipps vorhanden.</EmptyRow>}
                  </tbody>
                </Table>
              </TableWrap>
            </Card>
          </>
        )}

        {!loading && state && activeTab === 'riders' && (
          <>
            <Card>
              <SectionTitle>Fahrertyp-Verteilung</SectionTitle>
              <DistributionList>
                {(state.rider_distribution || []).map((entry) => (
                  <DistributionRow key={entry.rider_type}>
                    <span>{entry.label}</span>
                    <strong>{formatNumber(entry.count)}</strong>
                  </DistributionRow>
                ))}
              </DistributionList>
            </Card>
            <Card>
              <SectionTitle>Gewählte Fahrertypen</SectionTitle>
              <TableWrap>
                <Table>
                  <thead><tr><th>Nutzer</th><th>Fahrertyp</th><th>Wechsel</th><th>Gewählt</th><th>Geändert</th></tr></thead>
                  <tbody>
                    {(state.riders || []).map((rider) => (
                      <tr key={rider.user_id}>
                        <td><strong>{rider.username}</strong></td>
                        <td>{rider.rider_type_label}</td>
                        <td>{rider.rider_type_changes}</td>
                        <td>{formatDateTime(rider.selected_at)}</td>
                        <td>{formatDateTime(rider.updated_at)}</td>
                      </tr>
                    ))}
                    {(!state.riders || state.riders.length === 0) && <EmptyRow colSpan={5}>Noch keine Fahrertypen gewählt.</EmptyRow>}
                  </tbody>
                </Table>
              </TableWrap>
            </Card>
          </>
        )}

        {!loading && state && activeTab === 'events' && (
          <Card>
            <SectionTitle>Letzte Punkte-Events</SectionTitle>
            <TableWrap>
              <Table>
                <thead><tr><th>Zeit</th><th>Nutzer</th><th>Aktion</th><th>Kategorie</th><th>Punkte</th></tr></thead>
                <tbody>
                  {(state.recent_events || []).map((event) => (
                    <tr key={event.id}>
                      <td>{formatDateTime(event.created_at)}</td>
                      <td><strong>{event.username}</strong></td>
                      <td>{ACTION_LABELS[event.action_type] || event.action_type}</td>
                      <td>{event.action_category}</td>
                      <td>{formatNumber(event.points_total)}</td>
                    </tr>
                  ))}
                  {(!state.recent_events || state.recent_events.length === 0) && <EmptyRow colSpan={5}>Noch keine Punkte-Events vorhanden.</EmptyRow>}
                </tbody>
              </Table>
            </TableWrap>
          </Card>
        )}

        {!loading && state && activeTab === 'stories' && (
          <Card>
            <SectionTitle>Instagram-Storys</SectionTitle>
            <Muted>ZIP-Pakete mit 1080x1920 PNGs für die aktuellen Trikotstände und Teilnahme-Motivation.</Muted>
            <DownloadGrid>
              <DownloadCard>
                <strong>Alle Storys</strong>
                <span>Overview, fünf Trikotwertungen und Mitmach-Story.</span>
                <Button type="button" onClick={() => handleDownload('all')} disabled={Boolean(downloadLoading)}>
                  {downloadLoading === 'all' ? 'Erstelle...' : 'Alle Storys downloaden'}
                </Button>
              </DownloadCard>
              <DownloadCard>
                <strong>Rankings</strong>
                <span>Overview und je Trikot eine Ranking-Story.</span>
                <Button type="button" onClick={() => handleDownload('rankings')} disabled={Boolean(downloadLoading)}>
                  {downloadLoading === 'rankings' ? 'Erstelle...' : 'Ranking-Stories'}
                </Button>
              </DownloadCard>
              <DownloadCard>
                <strong>Teilnahme</strong>
                <span>Motivierende Story mit nächsten Aktionen.</span>
                <Button type="button" onClick={() => handleDownload('participation')} disabled={Boolean(downloadLoading)}>
                  {downloadLoading === 'participation' ? 'Erstelle...' : 'Mitmach-Story'}
                </Button>
              </DownloadCard>
            </DownloadGrid>
          </Card>
        )}
      </Container>
    </Page>
  );
}

const Page = styled.div`
  min-height: 100vh;
  background: #fff7df;
`;

const Container = styled.main`
  width: min(1180px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 2rem 0 4rem;
`;

const Card = styled.section`
  background: #fff;
  border-radius: 16px;
  padding: 1.4rem;
  margin-bottom: 1.2rem;
  box-shadow: 0 18px 35px rgba(0, 0, 0, 0.08);
`;

const HeroCard = styled(Card)`
  border-top: 6px solid #ffb522;
`;

const Title = styled.h1`
  margin: 0 0 0.4rem;
`;

const SectionTitle = styled.h2`
  margin: 0 0 1rem;
`;

const Muted = styled.p`
  margin: 0 0 1rem;
  color: #676070;
`;

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const Button = styled.button`
  border: none;
  border-radius: 999px;
  background: #ffb522;
  color: #2f2100;
  padding: 0.75rem 1.2rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const Notice = styled.div`
  padding: 0.85rem 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  color: ${({ $tone }) => ($tone === 'error' ? '#7c1a1a' : '#0c473f')};
  background: ${({ $tone }) => ($tone === 'error' ? '#ffe6e6' : '#e5fff7')};
  border: 1px solid ${({ $tone }) => ($tone === 'error' ? '#f5b5b5' : '#89f0d3')};
`;

const Tabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 1.2rem;
`;

const TabButton = styled.button`
  border-radius: 999px;
  border: 1px solid ${({ $active }) => ($active ? '#ffb522' : '#ddd')};
  background: ${({ $active }) => ($active ? '#fff0c4' : '#fff')};
  color: #2f2100;
  padding: 0.65rem 1rem;
  font-weight: 700;
  cursor: pointer;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.2rem;
`;

const StatCard = styled(Card)`
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  span {
    color: #676070;
  }

  strong {
    font-size: 2rem;
    color: #2f2100;
  }
`;

const JerseyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.85rem;
`;

const JerseyCard = styled.div`
  border: 1px solid #f0e1b8;
  border-radius: 12px;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  small {
    color: #7a5a00;
  }
`;


const TableWrap = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;

  th,
  td {
    text-align: left;
    border-bottom: 1px solid #f0edf2;
    padding: 0.7rem;
    vertical-align: top;
  }

  th {
    color: #4a3b1a;
    background: #fffaf0;
  }
`;

const EmptyRow = ({ children, colSpan }) => (
  <tr>
    <td colSpan={colSpan}>{children}</td>
  </tr>
);

const DistributionList = styled.div`
  display: grid;
  gap: 0.65rem;
`;

const DistributionRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border: 1px solid #f0e1b8;
  border-radius: 12px;
  padding: 0.75rem 0.9rem;
`;

const DownloadGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
`;

const DownloadCard = styled.div`
  border: 1px solid #f0e1b8;
  border-radius: 14px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  span {
    color: #676070;
  }
`;

const StageResultGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 0.85rem;
`;

const FinalResultGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;

  label {
    display: grid;
    gap: 0.35rem;
    color: #2f2100;
    font-weight: 700;
  }

  input {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #ddd4bd;
    border-radius: 8px;
    padding: 0.65rem 0.75rem;
    font: inherit;
  }
`;

const StageResultCard = styled.div`
  display: grid;
  gap: 0.4rem;
  border: 1px solid #f0e1b8;
  border-radius: 12px;
  padding: 0.85rem;

  span,
  small {
    color: #676070;
  }

  input {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #ddd4bd;
    border-radius: 8px;
    padding: 0.65rem 0.75rem;
    font: inherit;
  }
`;

const StageResultPaste = styled.textarea`
  width: 100%;
  min-height: 96px;
  box-sizing: border-box;
  border: 1px solid #d8c9a8;
  border-radius: 8px;
  background: #fffdf7;
  color: #2f2100;
  padding: 0.65rem 0.75rem;
  font: inherit;
  resize: vertical;

  &:focus {
    border-color: #ffb522;
    outline: 3px solid rgba(255, 181, 34, 0.25);
  }
`;

const StageTop10Grid = styled.div`
  display: grid;
  gap: 0.35rem;

  label {
    display: grid;
    grid-template-columns: 1.6rem minmax(0, 1fr);
    gap: 0.35rem;
    align-items: center;
  }

  label > span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 6px;
    background: #fff0c4;
    color: #2f2100;
    font-size: 0.78rem;
    font-weight: 800;
  }
`;

const ResultPill = styled.span`
  display: inline-flex;
  border-radius: 999px;
  background: ${({ $correct }) => ($correct ? '#dcfce7' : '#fee2e2')};
  color: ${({ $correct }) => ($correct ? '#166534' : '#991b1b')};
  padding: 0.2rem 0.55rem;
  font-weight: 800;
`;
