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
import { getTourDeGlaceFemmeStarterSuggestions } from './tourDeGlaceFemmeStarters';

const TIP_FIELDS = [
  ['tip_gc_winner', 'Gesamtwertung Platz 1'], ['tip_gc_second', 'Gesamtwertung Platz 2'], ['tip_gc_third', 'Gesamtwertung Platz 3'],
  ['tip_green_winner', 'Grünes Trikot'], ['tip_mountain_winner', 'Bergtrikot'], ['tip_white_winner', 'Weißes Trikot'],
];
const TIP_LABELS = Object.fromEntries(TIP_FIELDS);
const OUTCOMES = { exact: 'Exakt getroffen', top3_wrong_position: 'Top 3, falsche Position', miss: 'Kein Treffer', no_tip: 'Kein Tipp' };
const TOUR_DE_GLACE_FEMME_LOGO = '/assets/tour-de-glace/TourDeGlaceFemmes.png';

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

export default function TourDeGlaceFemmePanel({ campaign, isLoggedIn, onLogin }) {
  const { authToken } = useUser();
  const [activeTab, setActiveTab] = useState('tips');
  const [data, setData] = useState(null);
  const [tips, setTips] = useState({});
  const [stageValues, setStageValues] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingStage, setSavingStage] = useState(null);
  const [fullLeaderboard, setFullLeaderboard] = useState({ loading: false, entries: null, error: '' });
  const [selectedEntry, setSelectedEntry] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const next = await fetchTourDeGlaceFemmeProgress(authToken);
      setData(next);
      setTips(Object.fromEntries(TIP_FIELDS.map(([key]) => [key, next.tips?.[key] || ''])));
      setStageValues(Object.fromEntries((next.stage_tips || []).map((stage) => [stage.stage_number, stage.tip_stage_winner || ''])));
    } catch (error) {
      setMessage(error.message || 'Tour de Glace Femme konnte nicht geladen werden.');
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
    if (duplicateGcTips) return setMessage('Eine Fahrerin darf in der GC Top 3 nur einmal getippt werden.');
    try {
      await submitTourDeGlaceFemmeTips(authToken, tips);
      setMessage('Vorabtipps gespeichert.');
      await load();
    } catch (error) { setMessage(error.message || 'Vorabtipps konnten nicht gespeichert werden.'); }
  };

  const saveStage = async (stageNumber) => {
    if (!isLoggedIn) return onLogin?.();
    const value = String(stageValues[stageNumber] || '').trim();
    if (!value) return setMessage('Bitte tippe eine Etappensiegerin.');
    setSavingStage(stageNumber);
    try {
      await submitTourDeGlaceFemmeStageTip(authToken, stageNumber, value);
      setMessage(`Etappentipp ${stageNumber} gespeichert.`);
      await load();
    } catch (error) { setMessage(error.message || 'Etappentipp konnte nicht gespeichert werden.'); }
    finally { setSavingStage(null); }
  };

  return <Panel>
    <Header>
      <Brand><img src={TOUR_DE_GLACE_FEMME_LOGO} alt="Tour de Glace Femmes" /><div><h2>Tour de Glace Femme 2026</h2><p>Vorabtipps, neun Etappen und tägliche Easter-Egg-Boni in einer kombinierten Wertung.</p></div></Brand>
      <Status>{final ? 'Nachlese' : data?.campaign?.phase === 'pre' ? 'Tipps offen' : 'Läuft'}</Status>
    </Header>
    {!isLoggedIn && <LoginHint><strong>Login erforderlich für die Teilnahme.</strong><button type="button" onClick={onLogin}>Login / Registrieren</button></LoginHint>}
    {message && <Notice>{message}</Notice>}
    {loading && <Muted>Lade Tour de Glace Femme...</Muted>}
    <Tabs>
      <Tab type="button" $active={activeTab === 'tips'} onClick={() => setActiveTab('tips')}>Tippspiel</Tab>
      <Tab type="button" $active={activeTab === 'stages'} onClick={() => setActiveTab('stages')}>Etappen</Tab>
    </Tabs>

    {activeTab === 'tips' && <Stack>
      {final && <ResultsBox>
        <div><h3>Gesamtwertung ausgewertet</h3><Muted>Vorab- und Etappentipps ergeben zusammen die Schlussrangliste.</Muted></div>
        <Summary>
          <Tile><span>Deine Gesamtpunkte</span><strong>{data?.combined_summary?.points || 0}</strong><small>{data?.combined_rank ? `Rang #${data.combined_rank.rank}` : 'Kein Tipp abgegeben'}</small></Tile>
          <Tile><span>Vorabtipps</span><strong>{data?.combined_summary?.overall_points || 0}</strong><small>GC und Trikots</small></Tile>
          <Tile><span>Etappentipps</span><strong>{data?.combined_summary?.stage_points || 0}</strong><small>inklusive Egg-Bonus</small></Tile>
        </Summary>
        <Muted>Bei gleicher Punktzahl wird der Platz geteilt.</Muted>
        {fullLeaderboard.loading && <Muted>Vollständige Rangliste wird geladen...</Muted>}
        {fullLeaderboard.error && <Notice>{fullLeaderboard.error}</Notice>}
        {!fullLeaderboard.loading && !fullLeaderboard.error && <Ranking>{leaderboard.map((entry) => <RankingRow key={entry.user_id} type="button" onClick={() => setSelectedEntry(entry)}><span>#{entry.rank}</span><strong>{entry.username}</strong><span>{entry.points} Punkte</span></RankingRow>)}</Ranking>}
      </ResultsBox>}
      <Form onSubmit={saveTips}>
        <FormHeader><h3>{final ? 'Deine abgegebenen Vorabtipps' : 'Vorabtipps'}</h3><small>GC 1-3 exakt: 50/25/25 Punkte, richtige GC-Fahrerin auf falscher Position: 10 Punkte, Trikot: 35 Punkte.</small></FormHeader>
        {TIP_FIELDS.map(([key, label]) => <RiderInput key={key} id={`femme-${key}`} label={label} value={tips[key] || ''} onChange={(value) => setTips((previous) => ({ ...previous, [key]: value }))} disabled={tipsClosed} />)}
        {duplicateGcTips && <Notice>Die GC Top 3 darf keine Fahrerin doppelt enthalten.</Notice>}
        {!tipsClosed && <ActionButton type="submit">Vorabtipps speichern</ActionButton>}
      </Form>
    </Stack>}

    {activeTab === 'stages' && <Stack>
      <ResultsBox>
        <div><h3>Directrice Sportive</h3><Muted>Etappensiegerin tippen. Die Top 10 bringen 25/18/14/11/9/7/5/4/3/2 EP; mit gefundenem Egg werden erzielte EP um 25 % erhöht.</Muted></div>
        <Summary>
          <Tile><span>Deine Etappen-EP</span><strong>{data?.stage_tip_summary?.points || 0}</strong><small>{data?.stage_tip_rank ? `Rang #${data.stage_tip_rank.rank}` : 'Noch kein Rang'}</small></Tile>
          <Tile><span>Siegerinnen</span><strong>{data?.stage_tip_summary?.winner_hits || 0}</strong><small>exakt getroffen</small></Tile>
          <Tile><span>Top 10</span><strong>{data?.stage_tip_summary?.top10_hits || 0}</strong><small>gewertete Tipps</small></Tile>
        </Summary>
        {!final && <Ranking>{leaderboard.map((entry) => <RankingRow key={entry.user_id} as="div"><span>#{entry.rank}</span><strong>{entry.username}</strong><span>{entry.points} EP</span></RankingRow>)}</Ranking>}
      </ResultsBox>
      {data?.easter_egg && <EggHint><MapPin size={20}/><div><strong>Etappen-Egg bereit</strong><span>Finde es auf der Karte, damit dein heutiger Treffertipp den 1,25-fachen Bonus bekommt.</span></div></EggHint>}
      <StageList>{(data?.stage_tips || []).map((stage) => <StageCard key={stage.stage_number} $closed={stage.closed}>
        <StageMeta><strong>Etappe {stage.stage_number}</strong><span>{stage.start_location} → {stage.finish_location}</span><small>Start: {new Date(stage.start_at.replace(' ', 'T')).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</small>{stage.has_result && <em>{stage.scored ? `Platz #${stage.predicted_rank}: ${stage.base_ep} EP${stage.egg_bonus_ep ? ` + ${stage.egg_bonus_ep} Egg` : ''} = ${stage.final_ep} EP` : `Siegerin: ${stage.stage_winner} · 0 EP`}</em>}</StageMeta>
        <StageControl><RiderInput id={`femme-stage-${stage.stage_number}`} label="Etappensiegerin" value={stageValues[stage.stage_number] || ''} onChange={(value) => setStageValues((previous) => ({ ...previous, [stage.stage_number]: value }))} disabled={stage.closed || savingStage === stage.stage_number} />{!stage.closed && <ActionButton type="button" onClick={() => saveStage(stage.stage_number)} disabled={savingStage === stage.stage_number}>{savingStage === stage.stage_number ? 'Speichert...' : 'Speichern'}</ActionButton>}</StageControl>
      </StageCard>)}</StageList>
    </Stack>}

    {selectedEntry && <Overlay onClick={() => setSelectedEntry(null)}><Dialog role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><Close type="button" onClick={() => setSelectedEntry(null)} aria-label="Details schließen">×</Close><DialogHeader><div><h3>{selectedEntry.username}</h3><span>Rang #{selectedEntry.rank}</span></div><strong>{selectedEntry.points} Punkte</strong></DialogHeader><Summary><Tile><span>Vorabtipps</span><strong>{selectedEntry.overall_points}</strong><small>GC und Trikots</small></Tile><Tile><span>Etappentipps</span><strong>{selectedEntry.stage_points}</strong><small>inklusive Egg-Bonus</small></Tile></Summary><h4>Vorabtipps</h4><Details>{(selectedEntry.overall_breakdown || []).map((item) => <DetailRow key={item.key} $positive={item.points > 0}><div><strong>{TIP_LABELS[item.key]}</strong><span>Tipp: {item.tip || '-'}</span><span>Ergebnis: {item.result || '-'}</span></div><div><strong>{item.points} P</strong><small>{OUTCOMES[item.outcome] || 'Nicht gewertet'}</small></div></DetailRow>)}</Details><h4>Etappentipps</h4><Details>{(selectedEntry.stage_breakdown || []).map((item) => <DetailRow key={item.stage_number} $positive={item.points > 0}><div><strong>Etappe {item.stage_number}</strong><span>{item.start_location} → {item.finish_location}</span><span>Tipp: {item.tip || '-'}</span><span>{item.predicted_rank ? `Offiziell: #${item.predicted_rank} ${item.official_result}` : `Siegerin: ${item.result || '-'}`}</span></div><div><strong>{item.points} EP</strong><small>{item.predicted_rank ? `Platz #${item.predicted_rank}` : 'Nicht Top 10'}{item.egg_bonus_ep ? ` · +${item.egg_bonus_ep} Egg` : ''}</small></div></DetailRow>)}</Details></Dialog></Overlay>}
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
const FormHeader = styled.div`h3{margin:0} small{display:block;margin-top:.28rem;color:#5b6270;font-weight:600;line-height:1.4}`;
const Field = styled.div`display:grid; gap:.3rem; label{font-weight:800;color:#303746} input{width:100%; box-sizing:border-box; border:1px solid #cfd6df; border-radius:6px; padding:.55rem .6rem; font:inherit} input:disabled{background:#f4f6f8;color:#68707c}`;
const SuggestWrap = styled.div`position:relative;`;
const SuggestList = styled.div`position:absolute; z-index:20; top:calc(100% + 3px); left:0; right:0; display:grid; max-height:190px; overflow:auto; border:1px solid #cfd6df; border-radius:6px; background:#fff; box-shadow:0 8px 20px rgba(0,0,0,.14); padding:.25rem; button{border:0;background:transparent;text-align:left;padding:.45rem;display:grid;gap:.1rem;cursor:pointer;border-radius:5px} button:hover{background:#f3f6fb} span{color:#5b6270;font-size:.78rem;font-weight:600}`;
const ActionButton = styled.button`justify-self:start; border:0; border-radius:6px; background:#1f6feb; color:#fff; padding:.55rem .75rem; font:inherit; font-weight:800; cursor:pointer; &:disabled{opacity:.55;cursor:default}`;
const Summary = styled.div`display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:.55rem;`;
const Tile = styled.div`display:grid;gap:.12rem;border:1px solid #e1e5eb;border-radius:7px;background:#f7f8fa;padding:.6rem;span,small{color:#5b6270;font-weight:700}strong{font-size:1.25rem}`;
const Ranking = styled.div`display:grid;gap:.35rem;`;
const RankingRow = styled.button`display:grid;grid-template-columns:70px minmax(0,1fr) auto;gap:.5rem;align-items:center;width:100%;border:1px solid transparent;border-radius:7px;background:#f4f6fa;color:#202124;padding:.55rem .6rem;text-align:left;font:inherit;cursor:pointer;&:hover{border-color:#9db9e8}strong{overflow-wrap:anywhere}`;
const LoginHint = styled.div`display:flex;justify-content:space-between;align-items:center;gap:.6rem;margin-top:.8rem;border:1px solid #cfe0ff;border-radius:8px;background:#f5f9ff;padding:.7rem;button{border:0;border-radius:6px;background:#1f6feb;color:#fff;padding:.45rem .6rem;font:inherit;font-weight:800;cursor:pointer}`;
const Notice = styled.div`border-radius:7px;background:#fff3cd;color:#6f4b00;padding:.55rem .65rem;font-weight:700;`;
const Muted = styled.p`margin:0;color:#5b6270;font-weight:600;line-height:1.4;`;
const EggHint = styled.div`display:flex;gap:.65rem;align-items:flex-start;border:1px solid #d8c8f0;border-radius:8px;background:#fbf8ff;padding:.7rem;color:#43226b;div{display:grid;gap:.16rem}span{color:#5b6270;font-weight:600}`;
const StageList = styled.div`display:grid;gap:.65rem;`;
const StageCard = styled.article`display:grid;grid-template-columns:minmax(190px,.8fr) minmax(0,1fr);gap:.75rem;border:1px solid ${({ $closed }) => $closed ? '#e1e5eb' : '#cfe0ff'};border-radius:8px;background:${({ $closed }) => $closed ? '#f7f8fa' : '#fff'};padding:.7rem;@media(max-width:680px){grid-template-columns:1fr}`;
const StageMeta = styled.div`display:grid;align-content:start;gap:.18rem;span,small{color:#5b6270;font-weight:600}em{font-style:normal;color:#166534;font-weight:800;font-size:.82rem}`;
const StageControl = styled.div`display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.55rem;align-items:end;@media(max-width:520px){grid-template-columns:1fr}`;
const Overlay = styled.div`position:fixed;inset:0;z-index:2600;display:grid;place-items:center;background:rgba(22,28,38,.58);padding:1rem;`;
const Dialog = styled.div`position:relative;display:grid;gap:.8rem;width:min(760px,100%);max-height:84vh;overflow:auto;border-radius:10px;background:#fff;padding:1rem;box-shadow:0 24px 70px rgba(0,0,0,.28);h4{margin:.2rem 0 0}`;
const Close = styled.button`position:absolute;top:.5rem;right:.6rem;width:32px;height:32px;border:0;border-radius:50%;background:#eef1f5;font-size:1.35rem;cursor:pointer;`;
const DialogHeader = styled.div`display:flex;justify-content:space-between;gap:1rem;padding-right:2rem;h3{margin:0}span{color:#5b6270;font-weight:700}>strong{font-size:1.2rem;white-space:nowrap}`;
const Details = styled.div`display:grid;gap:.45rem;`;
const DetailRow = styled.article`display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.7rem;align-items:center;border:1px solid ${({ $positive }) => $positive ? '#b8dfc2' : '#e1e5eb'};border-radius:7px;background:${({ $positive }) => $positive ? '#f2fbf4' : '#f7f8fa'};padding:.6rem;>div{display:grid;gap:.13rem;min-width:0}>div:last-child{justify-items:end;text-align:right}span,small{color:#5b6270;overflow-wrap:anywhere}@media(max-width:520px){grid-template-columns:1fr;>div:last-child{justify-items:start;text-align:left}}`;
