import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { MapPin, Trophy } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import {
  fetchTourDeGlaceFemmeLeaderboard,
  fetchTourDeGlaceFemmeProgress,
  submitTourDeGlaceFemmeStageTip,
  submitTourDeGlaceFemmeTips,
} from './tourDeGlaceFemmeApi';
import { getTourDeGlaceFemmeStarterSuggestions, getTourDeGlaceFemmeTeamSuggestions } from './tourDeGlaceFemmeStarters';

const TIP_FIELDS = [
  ['tip_gc_winner', 'Gesamtwertung – Platz 1'], ['tip_gc_second', 'Gesamtwertung – Platz 2'], ['tip_gc_third', 'Gesamtwertung – Platz 3'],
  ['tip_green_winner', 'Siegerin Grünes Trikot'], ['tip_mountain_winner', 'Siegerin Bergtrikot'], ['tip_white_winner', 'Siegerin Weißes Trikot'],
  ['tip_team_winner', 'Beste Mannschaft', 'team'],
];
const TIP_LABELS = Object.fromEntries(TIP_FIELDS);
const OUTCOMES = { exact: 'Exakt getroffen', top3_wrong_position: 'Top 3, falsche Position', rank_1: 'Rang 1', rank_2: 'Rang 2', rank_3: 'Rang 3', miss: 'Kein Treffer', no_tip: 'Kein Tipp' };
const TOUR_DE_GLACE_FEMME_LOGO = '/assets/tour-de-glace/TourDeGlaceFemmes.png';
const parseLocalDateTime = (value) => new Date(value.replace(' ', 'T'));
const formatStageStart = (value) => `${parseLocalDateTime(value).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} Uhr`;
const formatStageDeadline = (stage) => {
  const deadline = stage.tip_deadline_at ? parseLocalDateTime(stage.tip_deadline_at) : new Date(parseLocalDateTime(stage.start_at).getTime() - 5 * 60 * 1000);
  return `${deadline.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`;
};
const rankTrend = (entry) => {
  if (!entry || entry.rank_change == null) return { label: '—', description: 'Noch kein Vergleich verfügbar.' };
  if (entry.rank_change === 'new') return { label: 'NEU', description: 'Erstmals in der Rangliste.' };
  if (entry.rank_change === 'up') return { label: `▲ ${entry.rank_delta}`, description: `${entry.rank_delta} Plätze gestiegen` };
  if (entry.rank_change === 'down') return { label: `▼ ${entry.rank_delta}`, description: `${entry.rank_delta} Plätze gefallen` };
  return { label: '—', description: 'Rang unverändert' };
};

const RiderInput = ({ id, label, value, onChange, disabled }) => {
  const [focused, setFocused] = useState(false);
  const suggestions = getTourDeGlaceFemmeStarterSuggestions(value);
  return <Field>
    <label htmlFor={id}>{label}</label>
    <SuggestWrap>
      <input id={id} value={value} disabled={disabled} autoComplete="off" onChange={(event) => onChange(event.target.value)} onFocus={() => setFocused(true)} onBlur={() => window.setTimeout(() => setFocused(false), 120)} />
      {!disabled && focused && suggestions.length > 0 && <SuggestList>
        {suggestions.map((starter) => <button key={`${starter.name}-${starter.team}`} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(starter.name); setFocused(false); }}>
          <strong>{starter.name}</strong><span>{starter.team}</span>
        </button>)}
      </SuggestList>}
    </SuggestWrap>
  </Field>;
};

const TeamInput = ({ id, label, value, onChange, disabled }) => {
  const [focused, setFocused] = useState(false);
  const suggestions = getTourDeGlaceFemmeTeamSuggestions(value);
  return <Field>
    <label htmlFor={id}>{label}</label>
    <SuggestWrap>
      <input id={id} value={value} disabled={disabled} autoComplete="off" onChange={(event) => onChange(event.target.value)} onFocus={() => setFocused(true)} onBlur={() => window.setTimeout(() => setFocused(false), 120)} />
      {!disabled && focused && suggestions.length > 0 && <SuggestList>
        {suggestions.map((team) => <button key={team} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(team); setFocused(false); }}>
          <strong>{team}</strong>
        </button>)}
      </SuggestList>}
    </SuggestWrap>
  </Field>;
};

export default function TourDeGlaceFemmePanel({ campaign, isLoggedIn, onLogin, archived = false }) {
  const { authToken } = useUser();
  const [activeTab, setActiveTab] = useState('tips');
  const [data, setData] = useState(null);
  const [tips, setTips] = useState({});
  const [stageValues, setStageValues] = useState({});
  const [message, setMessage] = useState('');
  const [tipsMessage, setTipsMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingStage, setSavingStage] = useState(null);
  const [fullLeaderboard, setFullLeaderboard] = useState({ loading: false, entries: null, error: '' });
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [ranking, setRanking] = useState({ loading: false, entries: [], current: null, error: '' });
  const [selectedRankingEntry, setSelectedRankingEntry] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const next = await fetchTourDeGlaceFemmeProgress(authToken);
      setData(next);
      setTips(Object.fromEntries(TIP_FIELDS.map(([key]) => [key, next.tips?.[key] || ''])));
      setStageValues(Object.fromEntries((next.stage_tips || []).map((stage) => [stage.stage_number, stage.tip_stage_winner || ''])));
    } catch (error) {
      setMessage(error.message || 'Tour de Glace Femmes konnte nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [authToken]);
  useEffect(() => {
    const handleMapEggUpdate = () => load();
    window.addEventListener('seasonal:tour-de-glace-femme-progress-updated', handleMapEggUpdate);
    return () => window.removeEventListener('seasonal:tour-de-glace-femme-progress-updated', handleMapEggUpdate);
  }, [authToken]);
  useEffect(() => {
    if (!data?.final_results) return undefined;
    let cancelled = false;
    setFullLeaderboard({ loading: true, entries: null, error: '' });
    fetchTourDeGlaceFemmeLeaderboard(authToken, 'combined', 0)
      .then((result) => !cancelled && setFullLeaderboard({ loading: false, entries: result.leaderboard || [], error: '' }))
      .catch((error) => !cancelled && setFullLeaderboard({ loading: false, entries: null, error: error.message || 'Rangliste konnte nicht geladen werden.' }));
    return () => { cancelled = true; };
  }, [authToken, data?.final_results]);
  useEffect(() => {
    if (activeTab !== 'ranking' || !data) return undefined;
    let cancelled = false;
    setRanking({ loading: true, entries: [], current: null, error: '' });
    fetchTourDeGlaceFemmeLeaderboard(authToken, data.final_results ? 'combined' : 'stage', 10)
      .then((result) => !cancelled && setRanking({ loading: false, entries: result.leaderboard || [], current: result.current_user_rank || null, error: '' }))
      .catch((error) => !cancelled && setRanking({ loading: false, entries: [], current: null, error: error.message || 'Rangliste konnte nicht geladen werden.' }));
    return () => { cancelled = true; };
  }, [activeTab, authToken, data]);

  const final = Boolean(data?.final_results);
  const tipsClosed = final || data?.campaign?.phase !== 'pre';
  const leaderboard = final ? (fullLeaderboard.entries || []) : (data?.leaderboard || []);
  const duplicateGcTips = useMemo(() => {
    const values = ['tip_gc_winner', 'tip_gc_second', 'tip_gc_third'].map((key) => String(tips[key] || '').trim().toLocaleLowerCase('de-DE')).filter(Boolean);
    return new Set(values).size !== values.length;
  }, [tips]);

  const saveTips = async (event) => {
    event.preventDefault();
    if (!isLoggedIn) return onLogin?.();
    if (duplicateGcTips) return;
    try {
      await submitTourDeGlaceFemmeTips(authToken, tips);
      setTipsMessage('Tour-Tipps gespeichert.');
      await load();
    } catch (error) { setTipsMessage(error.message || 'Tour-Tipps konnten nicht gespeichert werden.'); }
  };

  const updateTip = (key, value) => {
    setTips((previous) => ({ ...previous, [key]: value }));
    setTipsMessage('');
  };

  const saveStage = async (stageNumber) => {
    if (!isLoggedIn) return onLogin?.();
    const value = String(stageValues[stageNumber] || '').trim();
    if (!value) return setMessage('Bitte tippe eine Etappensiegerin.');
    setSavingStage(stageNumber);
    try {
      await submitTourDeGlaceFemmeStageTip(authToken, stageNumber, value);
      setMessage('');
      await load();
    } catch (error) { setMessage(error.message || 'Etappentipp konnte nicht gespeichert werden.'); }
    finally { setSavingStage(null); }
  };

  return <Panel>
    <Header>
      <Brand><img src={TOUR_DE_GLACE_FEMME_LOGO} alt="Tour de Glace Femmes" /><div><h2>Tour de Glace Femmes 2026</h2><p>Ein Tippspiel zur Tour de France Femmes. Tippe bis zum Start der Tour de France Femmes die ersten drei Plätze der Gesamtwertung und vor jeder Etappe deine Favoritin für den Tagessieg. Finde die Easter-Eggs auf der Karte, für kleine Boni.</p></div></Brand>
      <Status>{final ? 'Nachlese' : data?.campaign?.phase === 'pre' ? 'Tipps offen' : 'Läuft'}</Status>
    </Header>
    {!isLoggedIn && !archived && <LoginHint><strong>Login erforderlich für die Teilnahme.</strong><button type="button" onClick={onLogin}>Login / Registrieren</button></LoginHint>}
    {archived && <ArchiveHint><strong>Tour beendet · Ergebnisarchiv</strong><span>Die abgegebenen Tipps, Etappenergebnisse und die kombinierte Rangliste bleiben als Nachlese sichtbar.</span></ArchiveHint>}
    {message && <Notice>{message}</Notice>}
    {loading && <Muted>Lade Tour de Glace Femmes...</Muted>}
    <Tabs>
      <Tab type="button" $active={activeTab === 'tips'} onClick={() => setActiveTab('tips')}>Tour-Tipps</Tab>
      <Tab type="button" $active={activeTab === 'stages'} onClick={() => setActiveTab('stages')}>Etappentipps</Tab>
      <Tab type="button" $active={activeTab === 'ranking'} onClick={() => setActiveTab('ranking')}>Rangliste</Tab>
    </Tabs>

    {activeTab === 'tips' && <Stack>
      {final && <ResultsBox>
        <div><h3>Gesamtwertung ausgewertet</h3><Muted>Vorab- und Etappentipps ergeben zusammen die Schlussrangliste.</Muted></div>
        <Summary>
          <Tile><span>Deine Gesamtpunkte</span><strong>{data?.combined_summary?.points || 0}</strong><small>{data?.combined_rank ? `Rang #${data.combined_rank.rank}` : 'Kein Tipp abgegeben'}</small></Tile>
          <Tile><span>Gesamtwertung &amp; Trikots</span><strong>{data?.combined_summary?.overall_points || 0}</strong><small>GC und Trikots</small></Tile>
          <Tile><span>Etappentipps</span><strong>{data?.combined_summary?.stage_points || 0}</strong><small>inklusive Egg-Bonus</small></Tile>
        </Summary>
        <Muted>Bei gleicher Punktzahl wird der Platz geteilt.</Muted>
        {fullLeaderboard.loading && <Muted>Vollständige Rangliste wird geladen...</Muted>}
        {fullLeaderboard.error && <Notice>{fullLeaderboard.error}</Notice>}
        {!fullLeaderboard.loading && !fullLeaderboard.error && <Ranking>{leaderboard.map((entry) => <RankingRow key={entry.user_id} type="button" onClick={() => setSelectedEntry(entry)}><span>#{entry.rank}</span><strong>{entry.username}</strong><span>{entry.points} Punkte</span></RankingRow>)}</Ranking>}
      </ResultsBox>}
      <Form onSubmit={saveTips}>
        <FormHeader>
          <h3>Gesamtwertung &amp; Trikots</h3>
          <Muted>Tippe bis zum Start der ersten Etappe die drei bestplatzierten Fahrerinnen der Gesamtwertung sowie die Siegerinnen des Grünen, Berg- und Weißen Trikots und die beste Mannschaft.</Muted>
          <PointHint>
            <span><strong>GC-Platz 1 exakt:</strong> 50 EP</span>
            <span><strong>GC-Platz 2 exakt:</strong> 30 EP</span>
            <span><strong>GC-Platz 3 exakt:</strong> 20 EP</span>
            <span><strong>Richtige Top-3-Fahrerin auf anderer Position:</strong> 10 EP</span>
            <span><strong>Trikot-Tipp auf Rang 1 / 2 / 3:</strong> 35 / 15 / 10 EP</span>
            <span><strong>Mannschaftswertung Rang 1 / 2 / 3:</strong> 25 / 10 / 5 EP</span>
          </PointHint>
        </FormHeader>
        {TIP_FIELDS.map(([key, label, type]) => (type === 'team'
          ? <TeamInput key={key} id={`femme-${key}`} label={label} value={tips[key] || ''} onChange={(value) => updateTip(key, value)} disabled={tipsClosed} />
          : <RiderInput key={key} id={`femme-${key}`} label={label} value={tips[key] || ''} onChange={(value) => updateTip(key, value)} disabled={tipsClosed} />
        ))}
        {!tipsClosed && <ActionButton type="submit">Tour-Tipps speichern</ActionButton>}
        {duplicateGcTips && <TipSaveNotice $error>Für die Plätze 1 bis 3 darf jede Fahrerin nur einmal gewählt werden.</TipSaveNotice>}
        {tipsMessage && !tipsClosed && <TipSaveNotice $error={tipsMessage !== 'Tour-Tipps gespeichert.'}>{tipsMessage}</TipSaveNotice>}
        <DeadlineHint>{tipsClosed ? 'Die Tour-Tipps sind geschlossen. Deine abgegebenen Tipps bleiben hier sichtbar.' : 'Deine Tour-Tipps können bis zum Start der ersten Etappe geändert werden.'}</DeadlineHint>
      </Form>
    </Stack>}

    {activeTab === 'stages' && <Stack>
      <ResultsBox>
        <div>
          <h3>Etappensiegerin tippen</h3>
          <Muted>Tippe vor jeder Etappe, welche Fahrerin den Tagessieg holt. Dein Tipp kann bis kurz vor dem jeweiligen Etappenstart abgegeben oder geändert werden.</Muted>
          <PointHint>Je nach Platzierung deiner getippten Fahrerin erhältst du 25 / 18 / 14 / 11 / 9 / 7 / 5 / 4 / 3 / 2 EP. Findest du am Etappentag das verstecke Easter-Egg auf der Karte, werden deine erzielten Etappen-EP um 25 % erhöht.</PointHint>
        </div>
        <Summary>
          <Tile><span>Etappen-EP</span><strong>{data?.stage_tip_summary?.points || 0}</strong><small>{data?.stage_tip_rank ? `Aktuell Rang #${data.stage_tip_rank.rank}` : 'Noch keine Platzierung'}</small></Tile>
          <Tile><span>Volltreffer</span><strong>{data?.stage_tip_summary?.winner_hits || 0}</strong><small>Etappensiegerinnen exakt getippt</small></Tile>
          <Tile><span>Top-10-Treffer</span><strong>{data?.stage_tip_summary?.top10_hits || 0}</strong><small>Mit Etappen-EP belohnt</small></Tile>
        </Summary>
        {!final && <Ranking>{leaderboard.map((entry) => <RankingRow key={entry.user_id} as="div"><span>#{entry.rank}</span><strong>{entry.username}</strong><span>{entry.points} EP</span></RankingRow>)}</Ranking>}
      </ResultsBox>
      {data?.easter_egg && <EggHint><MapPin size={20}/><div><strong>Etappen-Egg bereit</strong><span>Finde es auf der Karte, damit dein heutiger Treffertipp den 1,25-fachen Bonus bekommt.</span></div></EggHint>}
      <StageList>{(data?.stage_tips || []).map((stage) => {
        const hasTip = Boolean(String(stage.tip_stage_winner || '').trim());
        return <StageCard key={stage.stage_number} $closed={stage.closed}>
          <StageMeta>
            <strong>Etappe {stage.stage_number}</strong>
            <span>{stage.start_location} → {stage.finish_location}</span>
            <small><strong>Start:</strong> {formatStageStart(stage.start_at)}</small>
            {stage.has_result && <em>{stage.scored ? `Platz #${stage.predicted_rank}: ${stage.base_ep} EP${stage.egg_bonus_ep ? ` + ${stage.egg_bonus_ep} Egg` : ''} = ${stage.final_ep} EP` : `Siegerin: ${stage.stage_winner} · 0 EP`}</em>}
          </StageMeta>
          <StageControl>
            <RiderInput id={`femme-stage-${stage.stage_number}`} label="Dein Tipp auf die Etappensiegerin" value={stageValues[stage.stage_number] || ''} onChange={(value) => setStageValues((previous) => ({ ...previous, [stage.stage_number]: value }))} disabled={stage.closed || savingStage === stage.stage_number} />
            {!stage.closed && <ActionButton type="button" onClick={() => saveStage(stage.stage_number)} disabled={savingStage === stage.stage_number}>{savingStage === stage.stage_number ? 'Speichert...' : 'Tipp speichern'}</ActionButton>}
            <StageTipStatus $closed={stage.closed}>
              {stage.closed ? <><strong>Tippabgabe geschlossen</strong>{!hasTip && <span>Kein Tipp abgegeben</span>}</> : <>{hasTip && <strong>Tipp gespeichert</strong>}<span>Bis {formatStageDeadline(stage)} änderbar</span></>}
            </StageTipStatus>
          </StageControl>
        </StageCard>;
      })}</StageList>
    </Stack>}

    {activeTab === 'ranking' && <Stack>
      <ResultsBox>
        <div><h3>Gesamtwertung</h3><Muted>Die Rangliste kombiniert deine EP aus Tour-Tipps, Etappentipps und Tages-Egg-Boni. Sie wird nach jeder ausgewerteten Etappe aktualisiert.</Muted></div>
        {ranking.loading && <Muted>Rangliste wird geladen...</Muted>}
        {ranking.error && <Notice>{ranking.error}</Notice>}
        {!ranking.loading && !ranking.error && ranking.entries.length === 0 && <Muted>Die erste Rangliste erscheint nach der Auswertung von Etappe 1.</Muted>}
        {!ranking.loading && !ranking.error && ranking.entries.length > 0 && <>
          <Summary>
            <Tile><span>Dein Rang</span><strong>{ranking.current ? `#${ranking.current.rank}` : '—'}</strong><small>{rankTrend(ranking.current).description}</small></Tile>
            <Tile><span>Deine EP</span><strong>{ranking.current ? `${ranking.current.points} EP` : '0 EP'}</strong><small>{ranking.current?.egg_bonus_ep ? `davon ${ranking.current.egg_bonus_ep} Bonus-EP` : 'Noch keine Bonus-EP'}</small></Tile>
            <Tile><span>Deine Treffer</span><strong>{ranking.current ? `${ranking.current.winner_hits || 0} Volltreffer` : '0 Volltreffer'}</strong><small>{ranking.current ? `${ranking.current.top10_hits || 0} Top-10-Tipps` : 'Noch keine Top-10-Tipps'}</small></Tile>
          </Summary>
          <RankHint>Die Veränderung zeigt den Vergleich zur Rangliste nach der vorherigen Etappenauswertung.</RankHint>
          <Ranking>{ranking.entries.map((entry) => <FemmeRankingRow key={entry.user_id} type="button" $own={entry.user_id === ranking.current?.user_id} onClick={() => setSelectedRankingEntry(entry)}><Trend $tone={entry.rank_change} title={rankTrend(entry).description}>{rankTrend(entry).label}</Trend><span>#{entry.rank}</span><Avatar>{String(entry.username || '?').slice(0, 1).toUpperCase()}</Avatar><div><strong>{entry.username}{entry.user_id === ranking.current?.user_id && <OwnLabel>Du</OwnLabel>}</strong><small>{entry.winner_hits || 0} Volltreffer · {entry.top10_hits || 0} Top-10-Treffer</small></div><strong>{entry.points} EP</strong></FemmeRankingRow>)}</Ranking>
          {ranking.current && !ranking.entries.some((entry) => entry.user_id === ranking.current.user_id) && <><OwnPosition>Deine Position</OwnPosition><FemmeRankingRow type="button" $own onClick={() => setSelectedRankingEntry(ranking.current)}><Trend $tone={ranking.current.rank_change} title={rankTrend(ranking.current).description}>{rankTrend(ranking.current).label}</Trend><span>#{ranking.current.rank}</span><Avatar>{String(ranking.current.username || '?').slice(0, 1).toUpperCase()}</Avatar><div><strong>{ranking.current.username}<OwnLabel>Du</OwnLabel></strong><small>{ranking.current.winner_hits || 0} Volltreffer · {ranking.current.top10_hits || 0} Top-10-Treffer</small></div><strong>{ranking.current.points} EP</strong></FemmeRankingRow></>}
        </>}
      </ResultsBox>
    </Stack>}

    {selectedEntry && <Overlay onClick={() => setSelectedEntry(null)}><Dialog role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><Close type="button" onClick={() => setSelectedEntry(null)} aria-label="Details schließen">×</Close><DialogHeader><div><h3>{selectedEntry.username}</h3><span>Rang #{selectedEntry.rank}</span></div><strong>{selectedEntry.points} Punkte</strong></DialogHeader><Summary><Tile><span>Gesamtwertung &amp; Trikots</span><strong>{selectedEntry.overall_points}</strong><small>GC und Trikots</small></Tile><Tile><span>Etappentipps</span><strong>{selectedEntry.stage_points}</strong><small>inklusive Egg-Bonus</small></Tile></Summary><h4>Gesamtwertung &amp; Trikots</h4><Details>{(selectedEntry.overall_breakdown || []).map((item) => <DetailRow key={item.key} $positive={item.points > 0}><div><strong>{TIP_LABELS[item.key]}</strong><span>Tipp: {item.tip || '-'}</span><span>Ergebnis: {item.result || '-'}</span></div><div><strong>{item.points} P</strong><small>{OUTCOMES[item.outcome] || 'Nicht gewertet'}</small></div></DetailRow>)}</Details><h4>Etappentipps</h4><Details>{(selectedEntry.stage_breakdown || []).map((item) => <DetailRow key={item.stage_number} $positive={item.points > 0}><div><strong>Etappe {item.stage_number}</strong><span>{item.start_location} → {item.finish_location}</span><span>Tipp: {item.tip || '-'}</span><span>{item.predicted_rank ? `Offiziell: #${item.predicted_rank} ${item.official_result}` : `Siegerin: ${item.result || '-'}`}</span></div><div><strong>{item.points} EP</strong><small>{item.predicted_rank ? `Platz #${item.predicted_rank}` : 'Nicht Top 10'}{item.egg_bonus_ep ? ` · +${item.egg_bonus_ep} Egg` : ''}</small></div></DetailRow>)}</Details></Dialog></Overlay>}
    {selectedRankingEntry && <Overlay onClick={() => setSelectedRankingEntry(null)}><Dialog role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><Close type="button" onClick={() => setSelectedRankingEntry(null)} aria-label="Details schließen">×</Close><DialogHeader><div><h3>{selectedRankingEntry.username}</h3><span>Rang #{selectedRankingEntry.rank}</span></div><strong>{selectedRankingEntry.points} EP</strong></DialogHeader><Details><DetailRow $positive><div><strong>Etappentipps</strong><span>Erzielte EP aus allen ausgewerteten Etappen</span></div><div><strong>{selectedRankingEntry.stage_points ?? selectedRankingEntry.points} EP</strong></div></DetailRow><DetailRow $positive={Boolean(selectedRankingEntry.egg_bonus_ep)}><div><strong>Tages-Egg-Boni</strong><span>Gefundene Eggs: {selectedRankingEntry.egg_count || 0}/9</span></div><div><strong>{selectedRankingEntry.egg_bonus_ep || 0} EP</strong></div></DetailRow><DetailRow $positive={Boolean(selectedRankingEntry.overall_points)}><div><strong>Tour-Tipps</strong><span>{final ? 'Gesamtwertung und Trikots' : 'Noch nicht ausgewertet'}</span></div><div><strong>{final ? `${selectedRankingEntry.overall_points || 0} EP` : '—'}</strong></div></DetailRow><DetailRow $positive><div><strong>Treffer</strong><span>Exakte Etappensiegerinnen und Top-10-Tipps</span></div><div><strong>{selectedRankingEntry.winner_hits || 0} / {selectedRankingEntry.top10_hits || 0}</strong></div></DetailRow></Details></Dialog></Overlay>}
  </Panel>;
}

const Panel = styled.section`background:#fff; border-radius:12px; box-shadow:0 4px 16px rgba(0,0,0,.08); padding:1rem; margin-top:1rem; color:#202124;`;
const Header = styled.header`display:flex; justify-content:space-between; gap:1rem; align-items:flex-start; h2,p{margin:0} h2{font-size:1.25rem} p{margin-top:.3rem;color:#5b6270;font-weight:600}@media(max-width:520px){flex-direction:column}`;
const Brand = styled.div`display:flex;align-items:center;gap:.75rem;min-width:0;img{width:72px;height:72px;flex:0 0 auto;object-fit:contain}@media(max-width:520px){align-items:flex-start;img{width:60px;height:60px}}`;
const Status = styled.strong`white-space:nowrap; border-radius:999px; background:#e8f0fe; color:#174ea6; padding:.28rem .55rem; font-size:.78rem;`;
const Tabs = styled.div`display:flex; gap:.4rem; margin:1rem 0 .8rem; border-bottom:1px solid #e1e5eb;`;
const Tab = styled.button`border:0; border-bottom:3px solid ${({ $active }) => $active ? '#1f6feb' : 'transparent'}; background:transparent; padding:.5rem .7rem; color:#303746; font:inherit; font-weight:800; cursor:pointer;`;
const Stack = styled.div`display:grid; gap:.8rem;`;
const Form = styled.form`display:grid; gap:.75rem; border:1px solid #d7dce4; border-radius:8px; background:#fff; padding:.8rem;`;
const ResultsBox = styled.section`display:grid; gap:.75rem; border:1px solid #d7dce4; border-radius:8px; background:#fff; padding:.8rem;`;
const FormHeader = styled.div`display:grid;gap:.38rem;h3{margin:0}`;
const PointHint = styled.div`display:grid;gap:.18rem;color:#4b5563;font-size:.88rem;font-weight:600;line-height:1.4;strong{color:#303746}`;
const DeadlineHint = styled.p`margin:0;color:#5b6270;font-size:.88rem;font-weight:600;line-height:1.4;`;
const TipSaveNotice = styled.div`border-radius:7px;background:${({ $error }) => $error ? '#fff3cd' : '#edf9f0'};color:${({ $error }) => $error ? '#6f4b00' : '#176238'};padding:.55rem .65rem;font-weight:700;`;
const Field = styled.div`display:grid; gap:.3rem; label{font-weight:800;color:#303746} input{width:100%; box-sizing:border-box; border:1px solid #cfd6df; border-radius:6px; padding:.55rem .6rem; font:inherit} input:disabled{background:#f4f6f8;color:#68707c}`;
const SuggestWrap = styled.div`position:relative;`;
const SuggestList = styled.div`position:absolute; z-index:20; top:calc(100% + 3px); left:0; right:0; display:grid; max-height:190px; overflow:auto; border:1px solid #cfd6df; border-radius:6px; background:#fff; box-shadow:0 8px 20px rgba(0,0,0,.14); padding:.25rem; button{border:0;background:transparent;text-align:left;padding:.45rem;display:grid;gap:.1rem;cursor:pointer;border-radius:5px} button:hover{background:#f3f6fb} span{color:#5b6270;font-size:.78rem;font-weight:600}`;
const ActionButton = styled.button`justify-self:start; border:0; border-radius:6px; background:#1f6feb; color:#fff; padding:.55rem .75rem; font:inherit; font-weight:800; cursor:pointer; &:disabled{opacity:.55;cursor:default}`;
const Summary = styled.div`display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:.55rem;`;
const Tile = styled.div`display:grid;gap:.12rem;border:1px solid #e1e5eb;border-radius:7px;background:#f7f8fa;padding:.6rem;span,small{color:#5b6270;font-weight:700}strong{font-size:1.25rem}`;
const Ranking = styled.div`display:grid;gap:.35rem;`;
const RankingRow = styled.button`display:grid;grid-template-columns:minmax(70px,auto) minmax(0,1fr) auto;gap:.5rem;align-items:center;width:100%;border:1px solid transparent;border-radius:8px;background:#f5f7fb;color:#202124;padding:.5rem .6rem;text-align:left;font:inherit;cursor:pointer;strong{overflow-wrap:anywhere}&:hover{border-color:#9db9e8}&:focus-visible{outline:3px solid rgba(31,111,235,.35);outline-offset:2px}`;
const RankHint = styled.p`margin:0;color:#5b6270;font-size:.84rem;font-weight:600;line-height:1.4;`;
const FemmeRankingRow = styled.button`display:grid;grid-template-columns:42px 38px 32px minmax(0,1fr) auto;gap:.45rem;align-items:center;width:100%;border:1px solid ${({ $own }) => $own ? '#ee7aa4' : 'transparent'};border-left:4px solid ${({ $own }) => $own ? '#e75a8d' : 'transparent'};border-radius:8px;background:${({ $own }) => $own ? '#fff1f5' : '#f5f7fb'};color:#202124;padding:.5rem .6rem;text-align:left;font:inherit;cursor:pointer;&:hover{border-color:#9db9e8}&:focus-visible{outline:3px solid rgba(31,111,235,.35);outline-offset:2px}div{display:grid;gap:.12rem;min-width:0}small{color:#5b6270;font-weight:600;overflow-wrap:anywhere}strong{overflow-wrap:anywhere}@media(max-width:520px){grid-template-columns:38px 32px 28px minmax(0,1fr) auto;gap:.28rem;font-size:.9rem;small{font-size:.76rem}}`;
const Trend = styled.span`display:inline-flex;align-items:center;justify-content:center;min-width:1.9rem;border-radius:999px;background:${({ $tone }) => $tone === 'up' ? 'rgba(15,124,47,.12)' : $tone === 'down' ? 'rgba(191,38,0,.12)' : $tone === 'new' ? 'rgba(255,181,34,.18)' : 'rgba(30,64,175,.1)'};color:${({ $tone }) => $tone === 'up' ? '#0f7c2f' : $tone === 'down' ? '#bf2600' : $tone === 'new' ? '#8a5a00' : '#1d4ed8'};padding:.12rem .35rem;font-size:.7rem;font-weight:900;white-space:nowrap;`;
const Avatar = styled.span`display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#dbeafe;color:#174ea6;font-size:.78rem;font-weight:900;`;
const OwnLabel = styled.em`margin-left:.35rem;border-radius:999px;background:#f7c6d6;color:#8f1749;padding:.1rem .32rem;font-size:.68rem;font-style:normal;font-weight:800;vertical-align:middle;`;
const OwnPosition = styled.h4`margin:.45rem 0 0;padding-top:.7rem;border-top:1px solid #e1e5eb;`;
const LoginHint = styled.div`display:flex;justify-content:space-between;align-items:center;gap:.6rem;margin-top:.8rem;border:1px solid #cfe0ff;border-radius:8px;background:#f5f9ff;padding:.7rem;button{border:0;border-radius:6px;background:#1f6feb;color:#fff;padding:.45rem .6rem;font:inherit;font-weight:800;cursor:pointer}`;
const ArchiveHint = styled.div`display:grid;gap:.2rem;margin-top:.8rem;border:1px solid #cbdcf3;border-radius:8px;background:#f3f8ff;color:#17436f;padding:.7rem;span{line-height:1.4}`;
const Notice = styled.div`border-radius:7px;background:#fff3cd;color:#6f4b00;padding:.55rem .65rem;font-weight:700;`;
const Muted = styled.p`margin:0;color:#5b6270;font-weight:600;line-height:1.4;`;
const EggHint = styled.div`display:flex;gap:.65rem;align-items:flex-start;border:1px solid #d8c8f0;border-radius:8px;background:#fbf8ff;padding:.7rem;color:#43226b;div{display:grid;gap:.16rem}span{color:#5b6270;font-weight:600}`;
const StageList = styled.div`display:grid;gap:.65rem;`;
const StageCard = styled.article`display:grid;grid-template-columns:minmax(190px,.8fr) minmax(0,1fr);gap:.75rem;border:1px solid ${({ $closed }) => $closed ? '#e1e5eb' : '#cfe0ff'};border-radius:8px;background:${({ $closed }) => $closed ? '#f7f8fa' : '#fff'};padding:.7rem;@media(max-width:680px){grid-template-columns:1fr}`;
const StageMeta = styled.div`display:grid;align-content:start;gap:.18rem;span,small{color:#5b6270;font-weight:600}em{font-style:normal;color:#166534;font-weight:800;font-size:.82rem}`;
const StageControl = styled.div`display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.55rem;align-items:end;@media(max-width:520px){grid-template-columns:1fr}`;
const StageTipStatus = styled.div`grid-column:1/-1;display:flex;flex-wrap:wrap;gap:.35rem .7rem;color:${({ $closed }) => $closed ? '#6b7280' : '#176238'};font-size:.86rem;font-weight:700;line-height:1.35;span{color:#5b6270}`;
const Overlay = styled.div`position:fixed;inset:0;z-index:2500;display:grid;place-items:center;background:rgba(22,28,38,.58);padding:1rem;`;
const Dialog = styled.div`position:relative;display:grid;gap:.9rem;width:min(760px,100%);max-height:min(84vh,720px);overflow-y:auto;border-radius:12px;background:#fff;padding:1.25rem;box-shadow:0 24px 70px rgba(0,0,0,.28);h4{margin:.2rem 0 0}@media(max-width:520px){padding:1rem}`;
const Close = styled.button`position:absolute;top:.55rem;right:.65rem;width:32px;height:32px;border:0;border-radius:50%;background:#eef1f5;color:#202124;font-size:1.35rem;cursor:pointer;&:focus-visible{outline:3px solid rgba(31,111,235,.35);outline-offset:2px}`;
const DialogHeader = styled.div`display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding-right:2rem;h3{margin:0;color:#202124}span{color:#5b6270;font-weight:700}>strong{color:#202124;font-size:1.2rem;white-space:nowrap}`;
const Details = styled.div`display:grid;gap:.45rem;`;
const DetailRow = styled.article`display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.8rem;align-items:center;border:1px solid ${({ $positive }) => $positive ? '#b8dfc2' : '#e1e5eb'};border-radius:8px;background:${({ $positive }) => $positive ? '#f2fbf4' : '#f7f8fa'};padding:.65rem;>div{display:grid;gap:.16rem;min-width:0}>div:last-child{justify-items:end;text-align:right}strong{color:#202124}span,small{color:#5b6270;overflow-wrap:anywhere}@media(max-width:520px){grid-template-columns:1fr;>div:last-child{justify-items:start;text-align:left}}`;
