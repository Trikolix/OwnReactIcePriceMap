import { useEffect, useState } from 'react';
import styled from 'styled-components';
import Header from '../Header';
import { useUser } from '../context/UserContext';
import { fetchTourDeGlaceFemmeAdmin, saveTourDeGlaceFemmeFinalResults, saveTourDeGlaceFemmeStageResult } from '../features/seasonal/tourDeGlaceFemmeApi';
import { TOUR_DE_GLACE_FEMME_STARTERS } from '../features/seasonal/tourDeGlaceFemmeStarters';

const FINAL_FIELDS = [['result_gc_winner', 'GC 1'], ['result_gc_second', 'GC 2'], ['result_gc_third', 'GC 3'], ['result_green_winner', 'Grünes Trikot'], ['result_mountain_winner', 'Bergtrikot'], ['result_white_winner', 'Weißes Trikot']];

export default function TourDeGlaceFemmeAdmin() {
  const { authToken, isLoggedIn, userId } = useUser();
  const [state, setState] = useState(null);
  const [stageResults, setStageResults] = useState({});
  const [finalResults, setFinalResults] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState('');
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
    <Title>Tour de Glace Femme Admin</Title>
    <Lead>Neun vollstaendige, unterschiedliche Top 10 eintragen und danach die Gesamt- und Trikot-Ergebnisse pflegen.</Lead>
    {message && <Notice>{message}</Notice>}
    <Button type="button" onClick={load} disabled={loading}>{loading ? 'Lade...' : 'Aktualisieren'}</Button>
    <Card><h2>Endergebnisse</h2>{state && !state.award_configuration?.configured && <Notice>Vor der Finalisierung muss die Award-Reihe <strong>tour_de_glace_femme_2026</strong> mit den Leveln {state.award_configuration?.missing_levels?.join(', ') || '1 bis 6'} im Award-Admin angelegt werden.</Notice>}<Grid>{FINAL_FIELDS.map(([key, label]) => <label key={key}>{label}<input value={finalResults[key] || ''} onChange={(event) => setFinalResults((previous) => ({ ...previous, [key]: event.target.value }))} list="femme-starters" /></label>)}</Grid><Button type="button" onClick={saveFinal} disabled={saving === 'final' || (state !== null && !state.award_configuration?.configured)}>{saving === 'final' ? 'Speichert...' : 'Endergebnisse finalisieren'}</Button></Card>
    <datalist id="femme-starters">{TOUR_DE_GLACE_FEMME_STARTERS.map((starter) => <option key={`${starter.name}-${starter.team}`} value={starter.name} />)}</datalist>
    <StageGrid>{(state?.campaign?.stages || []).map((stage) => <Card key={stage.stage_number}><h2>Etappe {stage.stage_number}</h2><p>{stage.start} → {stage.finish} · {stage.start_at}</p><TopTen>{Array.from({ length: 10 }, (_, index) => <label key={index}><span>#{index + 1}</span><input value={stageResults[stage.stage_number]?.[index] || ''} onChange={(event) => setStageResults((previous) => ({ ...previous, [stage.stage_number]: Array.from({ length: 10 }, (_, position) => position === index ? event.target.value : (previous[stage.stage_number]?.[position] || '')) }))} list="femme-starters" /></label>)}</TopTen><Button type="button" onClick={() => saveStage(stage.stage_number)} disabled={saving === `stage-${stage.stage_number}`}>{saving === `stage-${stage.stage_number}` ? 'Speichert...' : 'Top 10 speichern'}</Button></Card>)}</StageGrid>
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
