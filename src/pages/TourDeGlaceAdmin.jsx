import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import Header from '../Header';
import { useUser } from '../context/UserContext';
import {
  downloadTourDeGlaceStoryPack,
  fetchTourDeGlaceAdminState,
  saveTourDeGlaceStageResult,
} from '../features/seasonal/tourDeGlaceAdminApi';

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

export default function TourDeGlaceAdmin() {
  const { userId, authToken, isLoggedIn } = useUser();
  const isAdmin = Number(userId) === 1;
  const [state, setState] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState('');
  const [stageResults, setStageResults] = useState({});
  const [savingStageResult, setSavingStageResult] = useState(null);
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
        result.stage_winner || '',
      ])));
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

  const handleStageResultChange = (stageNumber, value) => {
    setStageResults((previous) => ({ ...previous, [String(stageNumber)]: value }));
  };

  const handleSaveStageResult = async (stageNumber) => {
    const winner = String(stageResults[String(stageNumber)] || '').trim();
    if (!winner) {
      setError('Bitte Etappensieger eintragen.');
      return;
    }
    setSavingStageResult(stageNumber);
    setError('');
    setInfo('');
    try {
      await saveTourDeGlaceStageResult(authToken, stageNumber, winner);
      setInfo(`Etappenergebnis ${stageNumber} gespeichert.`);
      await load();
    } catch (err) {
      setError(err.message || 'Etappenergebnis konnte nicht gespeichert werden.');
    } finally {
      setSavingStageResult(null);
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
                  return (
                    <StageResultCard key={stageNumber}>
                      <strong>Etappe {stageNumber}</strong>
                      <span>{result.start_location} → {result.finish_location}</span>
                      <small>Start: {formatDateTime(result.start_at)}</small>
                      <input
                        value={stageResults[String(stageNumber)] || ''}
                        onChange={(event) => handleStageResultChange(stageNumber, event.target.value)}
                        placeholder="Realer Etappensieger"
                      />
                      <Button
                        type="button"
                        onClick={() => handleSaveStageResult(stageNumber)}
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
                        <td>
                          {tip.stage_winner
                            ? <ResultPill $correct={Boolean(tip.is_correct)}>{tip.is_correct ? 'Richtig' : 'Falsch'}</ResultPill>
                            : 'Offen'}
                        </td>
                        <td>{formatDateTime(tip.updated_at)}</td>
                      </tr>
                    ))}
                    {(!state.stage_tips || state.stage_tips.length === 0) && <EmptyRow colSpan={6}>Noch keine Etappensieger-Tipps vorhanden.</EmptyRow>}
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

const ResultPill = styled.span`
  display: inline-flex;
  border-radius: 999px;
  background: ${({ $correct }) => ($correct ? '#dcfce7' : '#fee2e2')};
  color: ${({ $correct }) => ($correct ? '#166534' : '#991b1b')};
  padding: 0.2rem 0.55rem;
  font-weight: 800;
`;
