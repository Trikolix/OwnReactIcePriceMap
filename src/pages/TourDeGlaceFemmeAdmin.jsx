import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import Header from '../Header';
import { useUser } from '../context/UserContext';
import { fetchTourDeGlaceFemmeAdmin, saveTourDeGlaceFemmeFinalResults, saveTourDeGlaceFemmeStageResult } from '../features/seasonal/tourDeGlaceFemmeApi';
import { TOUR_DE_GLACE_FEMME_STARTERS } from '../features/seasonal/tourDeGlaceFemmeStarters';

const FINAL_FIELDS = [
  ['result_gc_winner', 'GC 1'], ['result_gc_second', 'GC 2'], ['result_gc_third', 'GC 3'],
  ['result_green_winner', 'Grünes Trikot #1'], ['result_green_second', 'Grünes Trikot #2'], ['result_green_third', 'Grünes Trikot #3'],
  ['result_mountain_winner', 'Bergtrikot #1'], ['result_mountain_second', 'Bergtrikot #2'], ['result_mountain_third', 'Bergtrikot #3'],
  ['result_white_winner', 'Weißes Trikot #1'], ['result_white_second', 'Weißes Trikot #2'], ['result_white_third', 'Weißes Trikot #3'],
  ['result_team_winner', 'Mannschaftswertung #1', 'team'], ['result_team_second', 'Mannschaftswertung #2', 'team'], ['result_team_third', 'Mannschaftswertung #3', 'team'],
];
const TIP_FIELDS = [
  ['tip_gc_winner', 'GC Platz 1'], ['tip_gc_second', 'GC Platz 2'], ['tip_gc_third', 'GC Platz 3'],
  ['tip_green_winner', 'Grünes Trikot'], ['tip_mountain_winner', 'Bergtrikot'], ['tip_white_winner', 'Weißes Trikot'],
  ['tip_team_winner', 'Beste Mannschaft'],
];

export default function TourDeGlaceFemmeAdmin() {
  const { authToken, isLoggedIn, userId } = useUser();
  const [state, setState] = useState(null);
  const [stageResults, setStageResults] = useState({});
  const [finalResults, setFinalResults] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState('');
  const [activeTab, setActiveTab] = useState('results');
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const isAdmin = Number(userId) === 1;
  const load = async () => {
    if (!authToken || !isAdmin) return;
    setLoading(true);
    try {
      const data = await fetchTourDeGlaceFemmeAdmin(authToken);
      setState(data);
      setFinalResults(Object.fromEntries(FINAL_FIELDS.map(([key]) => [key, data.final_results?.[key] || ''])));
      setStageResults(Object.fromEntries((data.campaign?.stages || []).map((stage) => [stage.stage_number, Array.from({ length: 10 }, (_, index) => data.stage_results?.find((result) => Number(result.stage_number) === Number(stage.stage_number))?.top10?.[index] || '')])));
    } catch (error) { setMessage(error.message || 'Admin-Daten konnten nicht geladen werden.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [authToken, isAdmin]);
  const tipParticipants = useMemo(() => {
    const participants = new Map();
    const ensureParticipant = (tip) => {
      const userId = Number(tip.user_id);
      if (!participants.has(userId)) participants.set(userId, { userId, username: tip.username, tourTips: null, stageTips: {} });
      return participants.get(userId);
    };
    (state?.tips || []).forEach((tip) => { ensureParticipant(tip).tourTips = tip; });
    (state?.stage_tips || []).forEach((tip) => { ensureParticipant(tip).stageTips[Number(tip.stage_number)] = tip; });
    return [...participants.values()]
      .map((participant) => ({
        ...participant,
        tourTipCount: TIP_FIELDS.filter(([key]) => String(participant.tourTips?.[key] || '').trim()).length,
        stageTipCount: Object.values(participant.stageTips).filter((tip) => String(tip.tip_stage_winner || '').trim()).length,
      }))
      .sort((left, right) => left.username.localeCompare(right.username, 'de-DE'));
  }, [state]);
  const saveStage = async (stageNumber) => {
    setSaving(`stage-${stageNumber}`);
    try { await saveTourDeGlaceFemmeStageResult(authToken, stageNumber, stageResults[stageNumber] || []); setMessage(`Etappenergebnis ${stageNumber} gespeichert.`); await load(); }
    catch (error) { setMessage(error.message || 'Etappenergebnis konnte nicht gespeichert werden.'); }
    finally { setSaving(''); }
  };
  const saveFinal = async () => {
    setSaving('final');
    try {
      const result = await saveTourDeGlaceFemmeFinalResults(authToken, finalResults);
      const created = (result.award_grants || []).reduce((count, grant) => count + (grant.created_levels?.length || 0), 0);
      setMessage(created > 0 ? `Endergebnisse gespeichert. ${created} Award-Level wurden vergeben.` : 'Endergebnisse gespeichert. Die kombinierte Schlusswertung ist aktualisiert.');
      await load();
    }
    catch (error) { setMessage(error.message || 'Endergebnisse konnten nicht gespeichert werden.'); }
    finally { setSaving(''); }
  };
  if (!isLoggedIn || !isAdmin) return <Page><Header /><Main><Card>Kein Zugriff.</Card></Main></Page>;
  return <Page><Header /><Main>
    <Title>Tour de Glace Femmes Admin</Title>
    <Lead>Neun vollständige, unterschiedliche Top 10 eintragen und danach die Gesamt-, Trikot- und Mannschafts-Ergebnisse pflegen.</Lead>
    {message && <Notice>{message}</Notice>}
    <Button type="button" onClick={load} disabled={loading}>{loading ? 'Lade...' : 'Aktualisieren'}</Button>
    <Tabs><Tab type="button" $active={activeTab === 'results'} onClick={() => setActiveTab('results')}>Ergebnisse</Tab><Tab type="button" $active={activeTab === 'tips'} onClick={() => setActiveTab('tips')}>Tippabgaben ({tipParticipants.length})</Tab></Tabs>
    {activeTab === 'results' && <>
      <Card><h2>Endergebnisse</h2>{state && !state.award_configuration?.configured && <Notice>Vor der Finalisierung muss die Award-Reihe <strong>tour_de_glace_femme_2026</strong> mit den Leveln {state.award_configuration?.missing_levels?.join(', ') || '1 bis 6'} im Award-Admin angelegt werden.</Notice>}<Grid>{FINAL_FIELDS.map(([key, label, type]) => <label key={key}>{label}<input value={finalResults[key] || ''} onChange={(event) => setFinalResults((previous) => ({ ...previous, [key]: event.target.value }))} list={type === 'team' ? undefined : 'femme-starters'} /></label>)}</Grid><Button type="button" onClick={saveFinal} disabled={saving === 'final' || (state !== null && !state.award_configuration?.configured)}>{saving === 'final' ? 'Speichert...' : 'Endergebnisse finalisieren'}</Button></Card>
      <datalist id="femme-starters">{TOUR_DE_GLACE_FEMME_STARTERS.map((starter) => <option key={`${starter.name}-${starter.team}`} value={starter.name} />)}</datalist>
      <StageGrid>{(state?.campaign?.stages || []).map((stage) => <Card key={stage.stage_number}><h2>Etappe {stage.stage_number}</h2><p>{stage.start} → {stage.finish} · {stage.start_at}</p><TopTen>{Array.from({ length: 10 }, (_, index) => <label key={index}><span>#{index + 1}</span><input value={stageResults[stage.stage_number]?.[index] || ''} onChange={(event) => setStageResults((previous) => ({ ...previous, [stage.stage_number]: Array.from({ length: 10 }, (_, position) => position === index ? event.target.value : (previous[stage.stage_number]?.[position] || '')) }))} list="femme-starters" /></label>)}</TopTen><Button type="button" onClick={() => saveStage(stage.stage_number)} disabled={saving === `stage-${stage.stage_number}`}>{saving === `stage-${stage.stage_number}` ? 'Speichert...' : 'Top 10 speichern'}</Button></Card>)}</StageGrid>
    </>}
    {activeTab === 'tips' && <Card><h2>Abgegebene Tipps</h2><p>Wähle einen Nutzer, um alle bisher gespeicherten Tour- und Etappentipps zu sehen.</p>{tipParticipants.length === 0 ? <Empty>Es wurden noch keine Tipps abgegeben.</Empty> : <TipTable><thead><tr><th>Nutzer</th><th>Tour-Tipps</th><th>Etappentipps</th></tr></thead><tbody>{tipParticipants.map((participant) => <tr key={participant.userId}><td><ParticipantButton type="button" onClick={() => setSelectedParticipant(participant)}>{participant.username}</ParticipantButton></td><td>{participant.tourTipCount} / 7</td><td>{participant.stageTipCount} / 9</td></tr>)}</tbody></TipTable>}</Card>}
    {selectedParticipant && <Overlay onClick={() => setSelectedParticipant(null)}><Dialog role="dialog" aria-modal="true" aria-labelledby="participant-tips-title" onClick={(event) => event.stopPropagation()}><Close type="button" onClick={() => setSelectedParticipant(null)} aria-label="Details schließen">×</Close><h2 id="participant-tips-title">{selectedParticipant.username}</h2><DialogSection><h3>Tour-Tipps ({selectedParticipant.tourTipCount} / 7)</h3><TipGrid>{TIP_FIELDS.map(([key, label]) => <div key={key}><strong>{label}</strong><span>{selectedParticipant.tourTips?.[key] || 'Kein Tipp abgegeben'}</span></div>)}</TipGrid></DialogSection><DialogSection><h3>Etappentipps ({selectedParticipant.stageTipCount} / 9)</h3><StageTipGrid>{(state?.campaign?.stages || []).map((stage) => <div key={stage.stage_number}><strong>Etappe {stage.stage_number}</strong><span>{selectedParticipant.stageTips[stage.stage_number]?.tip_stage_winner || 'Kein Tipp abgegeben'}</span></div>)}</StageTipGrid></DialogSection></Dialog></Overlay>}
  </Main></Page>;
}

const Page = styled.div`min-height:100vh;background:#f5f7fb;`;
const Main = styled.main`width:min(1100px,calc(100% - 2rem));margin:0 auto;padding:1.25rem 0 3rem;display:grid;gap:.85rem;`;
const Title = styled.h1`margin:0;color:#202124;font-size:1.55rem;`;
const Lead = styled.p`margin:0;color:#5b6270;font-weight:600;`;
const Card = styled.section`display:grid;gap:.75rem;border:1px solid #d7dce4;border-radius:8px;background:#fff;padding:.9rem;box-shadow:0 2px 8px rgba(0,0,0,.04);h2,p{margin:0}p{color:#5b6270;font-weight:600}`;
const Grid = styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.6rem;label{display:grid;gap:.25rem;font-weight:800}input{border:1px solid #cfd6df;border-radius:6px;padding:.5rem;font:inherit}`;
const StageGrid = styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:.8rem;`;
const TopTen = styled.div`display:grid;gap:.35rem;label{display:grid;grid-template-columns:32px 1fr;gap:.4rem;align-items:center;font-weight:800}input{border:1px solid #cfd6df;border-radius:6px;padding:.45rem;font:inherit}`;
const Button = styled.button`justify-self:start;border:0;border-radius:6px;background:#1f6feb;color:#fff;padding:.55rem .75rem;font:inherit;font-weight:800;cursor:pointer;&:disabled{opacity:.55;cursor:default}`;
const Notice = styled.div`border-radius:7px;background:#fff3cd;color:#6f4b00;padding:.6rem;font-weight:700;`;
const Tabs = styled.div`display:flex;gap:.35rem;border-bottom:1px solid #d7dce4;`;
const Tab = styled.button`border:0;border-bottom:3px solid ${({ $active }) => $active ? '#1f6feb' : 'transparent'};background:transparent;color:#303746;padding:.55rem .7rem;font:inherit;font-weight:800;cursor:pointer;`;
const TipTable = styled.table`width:100%;border-collapse:collapse;th,td{padding:.55rem;text-align:left;border-bottom:1px solid #e7eaf0}th{color:#5b6270;font-size:.84rem}td:not(:first-child),th:not(:first-child){text-align:center}@media(max-width:520px){font-size:.9rem;th,td{padding:.45rem .25rem}}`;
const ParticipantButton = styled.button`border:0;background:transparent;color:#174ea6;padding:0;font:inherit;font-weight:800;cursor:pointer;text-align:left;&:hover{text-decoration:underline}`;
const Empty = styled.p`margin:0;color:#5b6270;font-weight:600;`;
const Overlay = styled.div`position:fixed;inset:0;z-index:2500;display:grid;place-items:center;background:rgba(22,28,38,.58);padding:1rem;`;
const Dialog = styled.section`position:relative;width:min(680px,100%);max-height:calc(100vh - 2rem);overflow:auto;display:grid;gap:.9rem;border-radius:8px;background:#fff;padding:1rem;box-shadow:0 16px 40px rgba(0,0,0,.28);h2,h3{margin:0}h2{padding-right:2rem}`;
const Close = styled.button`position:absolute;top:.6rem;right:.6rem;border:0;border-radius:6px;background:#edf1f6;color:#303746;width:2rem;height:2rem;font-size:1.35rem;line-height:1;cursor:pointer;`;
const DialogSection = styled.section`display:grid;gap:.5rem;`;
const TipGrid = styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.5rem;div{display:grid;gap:.18rem;border:1px solid #e1e5eb;border-radius:7px;background:#f7f8fa;padding:.55rem}span{color:#5b6270;font-weight:600;overflow-wrap:anywhere}`;
const StageTipGrid = styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.5rem;div{display:grid;gap:.18rem;border:1px solid #e1e5eb;border-radius:7px;background:#f7f8fa;padding:.55rem}span{color:#5b6270;font-weight:600;overflow-wrap:anywhere}`;
