import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Camera, Check, ChevronRight, Download, Plus, Search, Sparkles } from 'lucide-react';
import { Page, PageHeading, Card, Button, Field, Notice, ActionRow, Stack, Disclosure, ChallengeDialog } from '../components/ChallengeUI';
import { photoDate, photoStatusLabel } from '../utils/photoChallengePresentation';
import { suggestPhotoPlan, evaluatePhotoPlan, photoSchedulePreview } from '../utils/photoChallengePlanning';
import { buildAssetUrl } from '../utils/assets.jsx';
import ImageLightbox from './PhotoChallengeVoting/ImageLightbox';
import Winner from './PhotoChallengeVoting/Winner';

const Shell = styled.div`background: #fff8ed; min-height: calc(100dvh - 80px);`;
const Workspace = styled.div`display: grid; gap: 24px; min-width: 0; @media(min-width: 1024px) { grid-template-columns: 230px minmax(0, 1fr); }`;
const Nav = styled.nav`display: none; @media(min-width: 1024px) { display: grid; gap: 6px; align-content: start; position: sticky; top: 16px; align-self: start; } button { justify-content: flex-start; text-align: left; }`;
const MobileNav = styled.select`width: 100%; min-height: 44px; font: inherit; font-size: 16px; padding: 10px; border: 1px solid #d9cdb6; background: #fffdf8; border-radius: 12px; @media(min-width: 1024px) { display: none; }`;
const Two = styled.div`display: grid; gap: 16px; @media(min-width: 768px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }`;
const Grid = styled.div`display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; @media(min-width: 768px) { grid-template-columns: repeat(3, minmax(0, 1fr)); }`;
const ImageCard = styled.div`min-width: 0; border: 1px solid #eadfc9; border-radius: 14px; padding: 10px; background: #fffdf8; display: grid; align-content: start; gap: 10px;
  img { width: 100%; aspect-ratio: 1; object-fit: contain; background: #f2eadb; border-radius: 10px; }
  p { margin: 0; font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; } strong { overflow-wrap: anywhere; } button { width: 100%; }
  label { display: flex; align-items: center; gap: 8px; min-height: 44px; font-size: 14px; } input[type=checkbox] { width: 20px; height: 20px; flex-shrink: 0; }
`;
const PictureButton = styled.button`border: 0; padding: 0; background: transparent; cursor: zoom-in; min-height: 44px; border-radius: 10px; &:focus-visible { outline: 3px solid #835500; outline-offset: 3px; }`;
const ChallengeRow = styled.button`width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 14px; border: 1px solid #eadfc9; border-radius: 14px; padding: 18px; background: #fffdf8; text-align: left; color: #2f2100; font: inherit; cursor: pointer;
 strong { display: block; font-size: 18px; overflow-wrap: anywhere; } small { display: block; margin-top: 6px; color: #756951; } &:focus-visible { outline: 3px solid #835500; outline-offset: 3px; }
`;
const Stats = styled.div`display: flex; flex-wrap: wrap; gap: 10px; span { padding: 10px 12px; background: #f5eddd; border-radius: 10px; font-size: 14px; }`;
const PlainList = styled.ul`padding-left: 20px; line-height: 1.7; margin: 0; overflow-wrap: anywhere;`;
const MatchRow = styled.div`display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 12px 0; border-bottom: 1px solid #eadfc9; > span { margin-left: auto; }`;
const CheckLabel = styled.label`display: flex; gap: 10px; align-items: center; min-height: 44px; font-weight: 650; input { width: 20px; height: 20px; }`;
const views = [['overview', 'Überblick'], ['images', 'Teilnehmer auswählen'], ['planning', 'Turnier planen'], ['voting', 'Abstimmung'], ['results', 'Ergebnisse'], ['settings', 'Einstellungen']];
const defaultView = status => status === 'submission_closed' ? 'images' : ['group_running', 'ko_running'].includes(status) ? 'voting' : status === 'finished' ? 'results' : 'overview';
const stringify = value => JSON.stringify(value);
const inputDate = value => String(value || '').replace(' ', 'T').slice(0, 16);

function SubmissionFields({ form, setForm, disabled = false, title = false }) {
  const change = key => event => setForm(previous => ({ ...previous, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.type === 'number' ? Number(event.target.value) : event.target.value }));
  return <Stack>
    {title && <><Field>Titel<input required value={form.title || ''} onChange={change('title')} disabled={disabled} /></Field><Field>Beschreibung<textarea value={form.description || ''} onChange={change('description')} disabled={disabled} /></Field></>}
    <Two><Field>Einreichen bis<input type="datetime-local" value={form.submissionDeadline || ''} onChange={change('submissionDeadline')} disabled={disabled} /><small>Danach können Teilnehmer ihre Fotos nicht mehr ändern.</small></Field>
      <Field>Fotos pro Person<input type="number" min="0" value={form.submissionLimitPerUser} onChange={change('submissionLimitPerUser')} disabled={disabled} /><small>Null bedeutet unbegrenzt.</small></Field></Two>
    <CheckLabel><input type="checkbox" checked={Boolean(form.allowDirectUploads)} onChange={change('allowDirectUploads')} disabled={disabled} />Neue Fotos direkt hochladen erlauben</CheckLabel>
    <Disclosure><summary>Weitere Einreichregeln</summary><Stack>
      <Field>Vorhandene Fotos ab<input type="datetime-local" value={form.minImageCreatedAt || ''} onChange={change('minImageCreatedAt')} disabled={disabled} /><small>Leer lassen, um auch ältere Fotos zuzulassen.</small></Field>
      <Field>Startdatum<input type="datetime-local" value={form.startAt || ''} onChange={change('startAt')} disabled={disabled} /><small>Optionales Startdatum der Challenge. Die Einreichphase öffnest du ausdrücklich.</small></Field>
    </Stack></Disclosure>
  </Stack>;
}

export default function PhotoChallengeAdminWorkspace(p) {
  const [params, setParams] = useSearchParams();
  const routeNavigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState(0);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [imageFilter, setImageFilter] = useState('pending');
  const [imageSearch, setImageSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [batchProgress, setBatchProgress] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const initialCreate = useRef(p.createForm);
  const navRef = useRef(null);
  const challenge = p.challenge;
  const status = challenge?.status;
  const view = views.some(([key]) => key === params.get('view')) ? params.get('view') : defaultView(status);
  const editing = ['draft', 'submission_open', 'submission_closed'].includes(status);
  const dirty = Boolean(p.baseline && stringify(p.form) !== stringify(p.baseline));
  const groupDirty = Object.entries(p.groupDrafts).some(([id, value]) => stringify(value) !== stringify(p.getGroupDraft(Number(id))));
  const unsaved = dirty || groupDirty;
  const locked = busy || p.createBusy || p.planningBusy || p.phaseBusy || Object.values(p.groupSaving).some(Boolean);
  const loaded = challenge && Number(p.overview?.challenge?.id) === Number(p.selectedChallengeId) && !p.overviewLoading;
  const count = p.images.length;
  const proposal = useMemo(() => suggestPhotoPlan(count), [count]);
  const plan = useMemo(() => evaluatePhotoPlan(count, p.form), [count, p.form]);
  const schedule = useMemo(() => photoSchedulePreview(p.form, plan.groups), [p.form, plan.groups]);
  const pool = new Set(p.images.map(image => Number(image.image_id || image.id)));
  const visibleImages = (imageFilter === 'pool' ? p.images : p.submissions.filter(item => imageFilter === 'all' || item.status === imageFilter)).filter(item => `${item.title || item.beschreibung || ''} ${item.username || ''}`.toLowerCase().includes(imageSearch.toLowerCase()));
  const publicUrl = challenge ? `/photo-challenge/${challenge.id}` : '/photo-challenge';
  useEffect(() => { setSelected([]); setImageFilter('pending'); setError(null); }, [p.selectedChallengeId]);
  useEffect(() => {
    const beforeUnload = event => { if (unsaved || (createOpen && stringify(p.createForm) !== stringify(initialCreate.current))) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', beforeUnload); return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [unsaved, createOpen, p.createForm]);
  const updateUrl = (id, nextView, replace = false) => {
    const next = new URLSearchParams(params);
    if (id) next.set('challengeId', String(id)); else next.delete('challengeId');
    if (nextView) next.set('view', nextView); else next.delete('view');
    setParams(next, { replace });
  };
  const discard = () => { if (p.baseline) p.setForm(p.baseline); p.setGroupDrafts({}); };
  const navigate = action => {
    if (locked) return;
    if (unsaved) setConfirm({ title: 'Ungespeicherte Änderungen', text: 'Möchtest du weiter bearbeiten oder die Änderungen verwerfen?', label: 'Änderungen verwerfen', cancel: 'Weiter bearbeiten', action: async () => { discard(); action(); return true; } });
    else action();
  };
  useEffect(() => {
    const guardLink = event => {
      const link = event.target.closest?.('a[href]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
      const destination = new URL(link.href, location.href);
      if (destination.origin !== location.origin || (!unsaved && !locked)) return;
      event.preventDefault(); event.stopPropagation();
      navigate(() => routeNavigate(destination.pathname + destination.search + destination.hash));
    };
    document.addEventListener('click', guardLink, true);
    return () => document.removeEventListener('click', guardLink, true);
  }, [unsaved, locked, routeNavigate, p.baseline]);

  // Restore the previous URL while asking about drafts on browser back/forward.
  useEffect(() => {
    const id = Number(params.get('challengeId')) || null;
    const nextNav = { id, view: params.get('view') };
    if (navRef.current && (id !== navRef.current.id || nextNav.view !== navRef.current.view) && unsaved && !confirm) {
      const previous = navRef.current;
      updateUrl(previous.id, previous.view, true);
      setConfirm({ title: 'Ungespeicherte Änderungen', text: 'Deine Änderungen sind noch nicht gespeichert.', label: 'Änderungen verwerfen', cancel: 'Weiter bearbeiten', action: async () => { discard(); navRef.current = nextNav; if (id) p.onSelect(id); updateUrl(id, nextNav.view); return true; } });
      return;
    }
    navRef.current = nextNav;
    if (id && id !== Number(p.selectedChallengeId) && !unsaved) p.onSelect(id);
  }, [params.toString()]);
  const run = async action => {
    if (busyRef.current) return false;
    busyRef.current = true; setBusy(true); setError(null);
    try { return await action(); }
    catch (err) { setError(err.message || 'Die Aktion ist fehlgeschlagen.'); return false; }
    finally { busyRef.current = false; setBusy(false); }
  };
  const ask = (title, text, label, action) => setConfirm({ title, text, label, action });
  const save = async settings => run(async () => {
    const result = await (settings ? p.onSaveSettings() : p.onSavePlan());
    if (!result) setError('Die Änderungen konnten nicht gespeichert werden. Bitte prüfe die Meldung und versuche es erneut.');
    return result;
  });
  const processReview = async action => {
    const items = selected.filter(id => p.submissions.some(item => item.id === id && item.status === 'pending'));
    const failures = []; setBatchProgress({ done: 0, total: items.length });
    for (let i = 0; i < items.length; i++) {
      if (await p.onReview(items[i], action) !== true) failures.push(items[i]);
      setBatchProgress({ done: i + 1, total: items.length });
    }
    setSelected(failures);
    if (failures.length) setError(`${failures.length} Entscheidungen konnten nicht gespeichert werden. Diese Fotos bleiben ausgewählt.`);
    return failures.length === 0;
  };
  const review = action => run(() => processReview(action));
  const selectAll = () => setSelected(p.submissions.filter(item => item.status === 'pending' && (!imageSearch || `${item.title || ''} ${item.username || ''}`.toLowerCase().includes(imageSearch.toLowerCase()))).map(item => item.id));
  const closeCreate = () => {
    if (stringify(p.createForm) !== stringify(initialCreate.current)) setConfirm({ title: 'Entwurf verwerfen?', text: 'Deine Eingaben wurden noch nicht gespeichert.', label: 'Entwurf verwerfen', cancel: 'Weiter ausfüllen', action: async () => { p.setCreateForm(initialCreate.current); setCreateOpen(false); setCreateStep(0); return true; } });
    else setCreateOpen(false);
  };
  const validateCreation = () => {
    if (!p.createForm.title.trim()) return 'Bitte gib der Foto-Challenge einen Titel.';
    if (p.createForm.status === 'submission_open' && !p.createForm.submissionDeadline) return 'Setze eine Einreichfrist, bevor du die Einreichungen öffnest.';
    if (p.createForm.startAt && p.createForm.submissionDeadline && p.createForm.submissionDeadline <= p.createForm.startAt) return 'Die Einreichfrist muss nach dem Startdatum liegen.';
    if (p.createForm.minImageCreatedAt && p.createForm.submissionDeadline && p.createForm.minImageCreatedAt > p.createForm.submissionDeadline) return 'Das Mindestdatum der Fotos muss vor der Einreichfrist liegen.';
    if (!Number.isInteger(Number(p.createForm.submissionLimitPerUser)) || Number(p.createForm.submissionLimitPerUser) < 0) return 'Die Anzahl der Fotos muss eine ganze Zahl ab null sein.';
    return null;
  };
  const create = async () => {
    const message = validateCreation(); if (message) { setError(message); return; }
    await run(async () => { const id = await p.onCreate({ preventDefault() {} }); if (id) { setCreateOpen(false); setCreateStep(0); updateUrl(id, 'overview'); return true; } setError('Die Challenge konnte nicht angelegt werden. Deine Eingaben bleiben erhalten.'); return false; });
  };
  const matches = list => <Stack style={{ gap: 8 }}>{(list || []).map(match => <MatchRow key={match.id}>
    <Button $secondary onClick={() => setLightbox({ url: match.image_a_url, label: match.image_a_title || `Foto ${match.image_a_id}` })}>{match.image_a_title || `Foto ${match.image_a_id}`}</Button>
    <span>gegen</span><Button $secondary onClick={() => setLightbox({ url: match.image_b_url, label: match.image_b_title || `Foto ${match.image_b_id}` })}>{match.image_b_title || `Foto ${match.image_b_id}`}</Button>
    <span>{match.votes_a || 0} : {match.votes_b || 0} · {match.status === 'open' ? 'Offen' : 'Beendet'}</span>
  </MatchRow>)}</Stack>;
  const downloads = <Disclosure><summary><Download size={17} aria-hidden="true" /> Story-Grafiken herunterladen</summary><ActionRow>{[['groups', 'Gruppen'], ['ko', 'KO-Duelle'], ['results', 'Ergebnisse'], ['all', 'Alle Grafiken']].map(([pack, label]) => <Button key={pack} $secondary disabled={locked || (pack === 'groups' ? !p.overview?.groups?.length : pack === 'ko' ? !(p.overview?.ko_matches || []).some(match => match.status === 'open') : pack === 'results' ? !(p.overview?.winner || p.overview?.groups?.some(group => group.status === 'finished')) : !p.overview?.groups?.length && !p.overview?.ko_matches?.length)} onClick={() => navigate(() => p.onDownload(pack))}>{label}</Button>)}</ActionRow></Disclosure>;
  if (!p.isLoggedIn || !p.isAdmin) return <Shell><Page $wide><h1>Foto-Challenges verwalten</h1><Notice>{p.isLoggedIn ? 'Dieser Bereich steht nur Administratoren zur Verfügung.' : 'Logge dich ein, um Foto-Challenges zu verwalten.'}</Notice>{!p.isLoggedIn && <Button onClick={() => window.dispatchEvent(new CustomEvent('auth:open-login'))}>Einloggen</Button>}</Page></Shell>;
  return <Shell><Page $wide>
    <PageHeading><div><h1>Foto-Challenges verwalten</h1><p>Einreichen, Teilnehmer auswählen und die Abstimmung begleiten.</p></div><Button disabled={locked} onClick={() => { setError(null); setCreateOpen(true); }}><Plus size={19} aria-hidden="true" />Neue Foto-Challenge</Button></PageHeading>
    {(error || p.feedback) && <Notice $error={Boolean(error || p.feedback?.variant === 'error')} role={error || p.feedback?.variant === 'error' ? 'alert' : 'status'}>{error || p.feedback.message}<Button $secondary onClick={() => { setError(null); p.clearFeedback(); }}>Meldung schließen</Button></Notice>}
    {!p.apiUrl && <Notice $error>Die Verbindung konnte nicht hergestellt werden.</Notice>}
    {!params.get('challengeId') ? <Stack>
      <Two><Field><span><Search size={17} aria-hidden="true" /> Challenge suchen</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Titel eingeben" /></Field><Field>Status<select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">Alle Challenges</option>{['draft','submission_open','submission_closed','group_running','ko_running','finished','active'].map(value => <option key={value} value={value}>{photoStatusLabel(value)}</option>)}</select></Field></Two>
      {p.challengesLoading && <Notice role="status">Challenges werden geladen …</Notice>}
      {p.challenges.filter(item => item.title.toLowerCase().includes(search.toLowerCase()) && (statusFilter === 'all' || item.status === statusFilter)).map(item => <ChallengeRow key={item.id} onClick={() => navigate(() => { p.onSelect(item.id); updateUrl(item.id, defaultView(item.status)); })}>
        <div><strong>{item.title}</strong><small>{photoStatusLabel(item.status)} · {item.image_count || 0} Teilnehmerbilder</small></div><ChevronRight aria-hidden="true" />
      </ChallengeRow>)}
      {!p.challengesLoading && !p.challenges.length && <Notice>Noch keine Foto-Challenge angelegt. Starte mit „Neue Foto-Challenge“.</Notice>}
    </Stack> : <Stack>
      <ActionRow><Button $secondary disabled={locked} onClick={() => navigate(() => updateUrl(null, null))}>Alle Foto-Challenges</Button><Button as={Link} $secondary to={publicUrl}>Teilnehmeransicht öffnen</Button><Button $secondary disabled={locked} onClick={() => navigate(p.onRefresh)}>Aktualisieren</Button>{unsaved && <span>Ungespeicherte Änderungen</span>}</ActionRow>
      {challenge && <div><h2>{challenge.title}</h2><p>{photoStatusLabel(status)}</p></div>}
      {!loaded ? <Notice role="status">{p.overviewLoading ? 'Arbeitsbereich wird geladen …' : 'Der Arbeitsbereich konnte nicht geladen werden. Prüfe die Challenge-Auswahl oder versuche es mit „Aktualisieren“ erneut.'}</Notice> : <Workspace>
        <Nav aria-label="Challenge verwalten">{views.map(([key, label]) => <Button key={key} $secondary={view !== key} disabled={locked} aria-current={view === key ? 'page' : undefined} onClick={() => navigate(() => updateUrl(challenge.id, key))}>{label}</Button>)}</Nav>
        <Stack><MobileNav aria-label="Bereich auswählen" value={view} disabled={locked} onChange={event => { const next = event.target.value; navigate(() => updateUrl(challenge.id, next)); }}>{views.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</MobileNav>
        {view === 'overview' && <Card><Stack><h2>Der nächste Schritt</h2><Stats><span>{p.submissions.length} Einreichungen</span><span>{count} Teilnehmerbilder</span><span>{p.submissions.filter(item => item.status === 'pending').length} noch zu prüfen</span></Stats>
          {status === 'draft' ? <><p>Lege die Einreichregeln fest. Öffne danach die Challenge für Teilnehmer.</p><Button onClick={() => navigate(() => updateUrl(challenge.id, 'settings'))}>Einreichungen vorbereiten</Button></>
          : status === 'submission_open' ? <><p>Fotos können bis {photoDate(challenge.submission_deadline)} eingereicht werden. Nach Ende der Frist wählst du die Teilnehmer aus.</p><Button onClick={() => navigate(() => updateUrl(challenge.id, 'images'))}>Einreichungen ansehen</Button>{p.canCloseSubmissions && <Button $secondary disabled={locked} onClick={() => ask('Einreichphase schließen?', 'Danach können Teilnehmer ihre Fotos nicht mehr ändern.', 'Einreichphase schließen', () => p.onCloseSubmissions())}>Einreichphase schließen</Button>}</>
          : status === 'submission_closed' ? <><p>Prüfe die eingereichten Fotos und stelle das Teilnehmerfeld zusammen.</p><Button onClick={() => navigate(() => updateUrl(challenge.id, 'images'))}>Teilnehmer auswählen</Button></>
          : ['group_running','ko_running'].includes(status) ? <><p>Die Abstimmung läuft. Hier prüfst du den Fortschritt und wechselst bewusst in die nächste Phase.</p><Button onClick={() => navigate(() => updateUrl(challenge.id, 'voting'))}>Abstimmung begleiten</Button></>
          : <><p>Die Challenge ist abgeschlossen oder befindet sich in Vorbereitung.</p><Button onClick={() => navigate(() => updateUrl(challenge.id, 'results'))}>Ergebnisse ansehen</Button></>}
        </Stack></Card>}
        {view === 'images' && <Stack>
          <Card><Stack><h2>Teilnehmer auswählen</h2><Stats><span>{count} Bilder im Teilnehmerfeld</span><span>{p.submissions.filter(item => item.status === 'pending').length} noch zu prüfen</span></Stats>
          {status !== 'submission_closed' && <Notice>{editing ? 'Die endgültige Prüfung ist nach Ende der Einreichphase möglich.' : 'Das Teilnehmerfeld ist seit Beginn der Abstimmung gesperrt.'}</Notice>}
          <Two><Field>Fotos suchen<input value={imageSearch} onChange={event => setImageSearch(event.target.value)} placeholder="Titel oder Nutzer" /></Field><Field>Anzeige<select value={imageFilter} onChange={event => setImageFilter(event.target.value)}><option value="pending">Noch zu prüfen</option><option value="all">Alle Einreichungen</option><option value="accepted">Übernommen</option><option value="rejected">Abgelehnt</option><option value="pool">Teilnehmerfeld</option></select></Field></Two>
          {imageFilter !== 'pool' && status === 'submission_closed' && <ActionRow><Button $secondary disabled={locked} onClick={selectAll}>Offene Fotos auswählen</Button><Button $secondary disabled={locked || !selected.length} onClick={() => setSelected([])}>Auswahl aufheben</Button>
            <Button disabled={locked || !selected.length} onClick={() => review('approve')}>{selected.length} übernehmen</Button><Button $secondary disabled={locked || !selected.length} onClick={() => ask('Fotos ablehnen?', `${selected.length} ausgewählte Fotos werden nicht für die Abstimmung übernommen.`, 'Auswahl ablehnen', () => processReview('reject'))}>Auswahl ablehnen</Button></ActionRow>}
          {batchProgress && <Notice role="status">{batchProgress.done} von {batchProgress.total} Entscheidungen verarbeitet.</Notice>}
          {(p.submissionsLoading || p.imagesLoading) && <Notice role="status">Fotos werden geladen …</Notice>}
          <Grid>{visibleImages.map(item => {
            const id = item.image_id || item.id; return <ImageCard key={`${imageFilter}:${item.id || id}`}>
              <PictureButton aria-label={`Foto ${item.title || id} vergrößern`} onClick={() => setLightbox({ url: item.url, label: item.title || `Foto ${id}` })}><img src={buildAssetUrl(item.url)} alt={item.title || 'Challenge-Foto'} loading="lazy" /></PictureButton>
              <strong>{item.title || `Foto ${id}`}</strong><p>{item.username || ''}</p><p>{imageFilter === 'pool' ? 'Im Teilnehmerfeld' : item.status === 'accepted' ? 'Übernommen' : item.status === 'rejected' ? 'Abgelehnt' : 'Wartet auf Prüfung'}</p>
              {imageFilter !== 'pool' && item.status === 'pending' && status === 'submission_closed' && <label><input type="checkbox" checked={selected.includes(item.id)} disabled={locked} onChange={event => setSelected(previous => event.target.checked ? [...previous, item.id] : previous.filter(value => value !== item.id))} />Foto auswählen</label>}
              {imageFilter === 'pool' && editing && <Button $secondary disabled={locked} onClick={() => ask('Foto aus dem Teilnehmerfeld entfernen?', 'Das ursprüngliche Foto und die Einreichung bleiben erhalten.', 'Foto entfernen', () => p.onRemoveImage(id))}>Entfernen</Button>}
            </ImageCard>;
          })}</Grid>
          {!p.submissionsLoading && !p.imagesLoading && !visibleImages.length && <Notice>{imageFilter === 'pending' ? 'Keine offenen Einreichungen. Unter „Teilnehmerfeld“ findest du die ausgewählten Fotos.' : 'Keine Fotos passen zu dieser Auswahl.'}</Notice>}
          {editing && <Button onClick={() => navigate(() => updateUrl(challenge.id, 'planning'))}>Weiter zum Turnierplan</Button>}
          </Stack></Card>
          <Disclosure><summary>Weitere vorhandene Fotos hinzufügen</summary><Stack>
            <Field>Nach Nutzer, Eis-Ort oder Beschreibung suchen<input value={p.imageQuery} onChange={event => p.setImageQuery(event.target.value)} disabled={!editing || locked} /></Field><Button disabled={!editing || locked || p.imageSearchBusy} onClick={() => p.onImageSearch(1)}>Fotos suchen</Button>
            <Grid>{p.imageResults.map(item => <ImageCard key={item.id}><PictureButton aria-label={`Foto ${item.id} vergrößern`} onClick={() => setLightbox({ url: item.url, label: item.beschreibung || `Foto ${item.id}` })}><img src={buildAssetUrl(item.url)} alt={item.beschreibung || 'Eisfoto'} loading="lazy" /></PictureButton><p>{item.beschreibung}</p><Button $secondary disabled={!editing || locked || pool.has(Number(item.id))} onClick={() => run(() => p.onAddImage(item.id))}>{pool.has(Number(item.id)) ? 'Bereits im Teilnehmerfeld' : 'Hinzufügen'}</Button></ImageCard>)}</Grid>
            {p.imageHasMore && <Button $secondary disabled={p.imageSearchBusy} onClick={() => p.onImageSearch(p.imagePage + 1, true)}>Mehr Fotos laden</Button>}
          </Stack></Disclosure>
        </Stack>}
        {view === 'planning' && <Stack>
          <Card><Stack><h2>Turnier planen</h2><p>{count} ausgewählte Fotos bilden das Teilnehmerfeld.</p>
            {proposal.valid ? <Notice><strong>Vorschlag: {proposal.plannedGroupCount} Gruppen mit je {proposal.groupSize} Fotos</strong><p>{proposal.groupAdvancers} pro Gruppe kommen direkt weiter; {proposal.luckyLoserSlots} zusätzliche Plätze ergeben ein KO-Feld mit {proposal.koBracketSize} Fotos.</p><Button disabled={!editing || locked} onClick={() => p.setForm(previous => ({ ...previous, groupSize: proposal.groupSize, plannedGroupCount: proposal.plannedGroupCount, groupAdvancers: proposal.groupAdvancers, luckyLoserSlots: proposal.luckyLoserSlots, koBracketSize: proposal.koBracketSize }))}><Sparkles size={18} aria-hidden="true" />Vorschlag übernehmen</Button></Notice>
            : <Notice $error>Für {count} Fotos gibt es keine passende Aufteilung. {proposal.lower ? `${proposal.lower} oder ${proposal.upper}` : `Mindestens ${proposal.upper}`} Teilnehmerbilder würden passen. Passe das Teilnehmerfeld bewusst an.</Notice>}
            <Stats><span>{plan.groups} Gruppen</span><span>{p.form.groupSize} Fotos pro Gruppe</span><span>{plan.direct} direkt weiter</span><span>{plan.ko} im KO-Feld</span></Stats>
            <Disclosure><summary>Details anpassen</summary><Two>{[['groupSize','Fotos pro Gruppe',2,8],['groupAdvancers','Weiterkommende pro Gruppe',1,Number(p.form.groupSize)],['luckyLoserSlots','Zusätzliche Qualifikationsplätze',0,null],['koBracketSize','Fotos im KO-Feld',2,null]].map(([key,label,min,max]) => <Field key={key}>{label}<input type="number" min={min} max={max || undefined} value={p.form[key]} disabled={!editing || locked} onChange={event => p.setForm(previous => ({ ...previous, [key]: event.target.value === '' && key === 'koBracketSize' ? '' : Number(event.target.value) }))} /><small>{key === 'koBracketSize' ? 'Leer lassen für automatische Berechnung. Eine gerade Zahl reicht.' : key === 'luckyLoserSlots' ? 'Die besten übrigen Fotos erhalten eine zweite Chance.' : 'Wird beim Start der Gruppenphase festgelegt.'}</small></Field>)}</Two></Disclosure>
          </Stack></Card>
          <Card><Stack><h2>Zeitplan</h2><Field>Start für den Zeitplan<input type="datetime-local" value={p.form.startAt || ''} disabled={!editing || locked} onChange={event => p.setForm(previous => ({ ...previous, startAt: event.target.value }))} /></Field>
            {(p.form.groupSchedule || []).map((slot, index) => <Card key={slot.id}><Stack><h3>Zeitblock {index + 1}</h3><Two>{[['startAt','Start','datetime-local'],['durationDays','Dauer in Tagen','number'],['groups','Gleichzeitig startende Gruppen','number']].map(([key,label,type]) => <Field key={key}>{label}<input type={type} min={type === 'number' ? 1 : undefined} value={slot[key]} disabled={!editing || locked} onChange={event => p.setForm(previous => ({ ...previous, groupSchedule: previous.groupSchedule.map(value => value.id === slot.id ? { ...value, [key]: event.target.value } : value) }))} /></Field>)}</Two><Button $secondary disabled={!editing || locked} onClick={() => p.setForm(previous => ({ ...previous, groupSchedule: previous.groupSchedule.filter(value => value.id !== slot.id) }))}>Zeitblock entfernen</Button></Stack></Card>)}
            <Button $secondary disabled={!editing || locked} onClick={() => p.setForm(previous => ({ ...previous, groupSchedule: [...(previous.groupSchedule || []), { id: `new-${Date.now()}`, startAt: previous.startAt || '', durationDays: '14', groups: '2' }] }))}>Zeitblock hinzufügen</Button>
            <Disclosure><summary>Vorschau der Gruppentermine</summary>{schedule.length ? <PlainList>{schedule.map((slot,index) => <li key={index}>Gruppe {index + 1}: {photoDate(slot.start)} bis {photoDate(slot.end)}</li>)}</PlainList> : <p>Vervollständige den Zeitplan, um die Termine zu sehen.</p>}</Disclosure>
            {!!plan.errors.length && <Notice $error><PlainList>{plan.errors.map(message => <li key={message}>{message}</li>)}</PlainList></Notice>}
            <ActionRow><Button disabled={!editing || locked || Boolean(plan.errors.length)} onClick={() => save(false)}>Planung speichern</Button><Button $secondary disabled={locked} onClick={() => navigate(() => updateUrl(challenge.id,'overview'))}>Zum Überblick</Button></ActionRow>
          </Stack></Card>
          <Card><Stack><h2>Prüfen und starten</h2><p>{count} Fotos · {plan.groups} Gruppen · {plan.direct} direkte Qualifikationsplätze · {plan.extra} zusätzliche Plätze · {plan.ko} Fotos im KO-Feld</p>
            {!!schedule.length && <p>Gruppentermine: {photoDate(schedule[0].start)} bis {photoDate(schedule.reduce((latest, slot) => slot.end > latest ? slot.end : latest, schedule[0].end))}. Die Termine jeder Gruppe findest du in der Vorschau.</p>}
            {unsaved && <Notice>Speichere deine Änderungen, bevor du die Abstimmung startest.</Notice>}
            {status !== 'submission_closed' && <Notice>Der Start ist nach Ende der Einreichphase möglich.</Notice>}
            {status === 'submission_closed' && p.submissions.some(item => item.status === 'pending') && <Notice>Prüfe alle offenen Einreichungen, bevor du startest.</Notice>}
            <Button disabled={locked || unsaved || status !== 'submission_closed' || Boolean(plan.errors.length) || p.submissions.some(item => item.status === 'pending')} onClick={() => ask('Gruppenabstimmung starten?', `${count} Fotos werden auf ${plan.groups} Gruppen verteilt. Teilnehmerfeld und Turnierregeln sind danach gesperrt.`, 'Gruppenabstimmung starten', () => p.onStartGroups())}>Gruppenabstimmung starten</Button>
          </Stack></Card>
        </Stack>}
        {view === 'settings' && <Card><Stack><h2>Challenge-Einstellungen</h2>{!editing && <Notice>Seit Beginn der Abstimmung sind die Einreichregeln gesperrt.</Notice>}
          <SubmissionFields title form={p.form} setForm={p.setForm} disabled={!editing || locked} />
          <ActionRow><Button disabled={!editing || locked} onClick={() => save(true)}>Änderungen speichern</Button>
            {p.canReopenSubmissions && <Button $secondary disabled={locked || !p.form.submissionDeadline} onClick={() => ask('Einreichungen öffnen?', 'Teilnehmer können danach Fotos einreichen und bis zur Frist ändern.', 'Einreichungen öffnen', () => p.onSaveSettings('submission_open'))}>Einreichungen öffnen</Button>}
            {status === 'submission_open' && <Button $secondary disabled={locked} onClick={() => ask('Zurück zum Entwurf?', 'Die Challenge wird wieder als Entwurf vorbereitet.', 'Als Entwurf speichern', () => p.onSaveSettings('draft'))}>Als Entwurf speichern</Button>}
          </ActionRow>
        </Stack></Card>}
        {(view === 'voting' || view === 'results') && <Stack>
          {view === 'voting' && <Card><Stack><h2>Abstimmung begleiten</h2><p>{photoStatusLabel(status)}</p>
            {status === 'group_running' && <Button disabled={locked || !(p.overview?.groups?.length) || p.overview.groups.some(group => group.status !== 'finished')} onClick={() => ask('KO-Abstimmung starten?', 'Die Gruppenergebnisse werden für das KO-Feld übernommen.', 'KO-Abstimmung starten', () => p.onStartKo())}>KO-Abstimmung starten</Button>}
            {status === 'ko_running' && <Button disabled={locked} onClick={() => ask('Diese Runde abschließen?', 'Die aktuellen Stimmen bestimmen die Weiterkommenden. Das Ergebnis dieser Runde steht danach fest.', 'Runde abschließen', () => p.onAdvanceKo())}>Runde abschließen</Button>}
          </Stack></Card>}
          {view === 'results' && p.overview?.winner && <Winner winner={p.overview.winner} thirdPlace={p.overview.third_place} />}
          {(p.overview?.groups || []).map(group => {
            const draft = p.groupDrafts[group.id] || p.getGroupDraft(group.id);
            return <Card key={group.id}><Stack><h3>{group.name}</h3><p>{photoDate(group.start_at)} bis {photoDate(group.end_at)}</p>
              <PlainList>{[...(group.results || group.entries || [])].map(item => <li key={item.image_id}>{item.title || `Foto ${item.image_id}`} · {item.votes || 0} Stimmen{item.is_advancer || group.advancers?.includes(item.image_id) ? ' · Weitergekommen' : ''}{item.is_lucky_loser || group.lucky_losers?.includes(item.image_id) ? ' · Zusatzplatz' : ''}</li>)}</PlainList>
              <Disclosure><summary>Duelle ansehen</summary>{matches(group.matches)}</Disclosure>
              {view === 'voting' && <Disclosure><summary>Gruppentermine korrigieren</summary><Stack><Two><Field>Start<input type="datetime-local" value={draft.startAt} disabled={locked} onChange={event => p.onGroupChange(group.id,'startAt',event.target.value)} /></Field><Field>Ende<input type="datetime-local" value={draft.endAt} disabled={locked} onChange={event => p.onGroupChange(group.id,'endAt',event.target.value)} /></Field></Two><ActionRow><Button disabled={locked || !draft.startAt || !draft.endAt || draft.endAt <= draft.startAt} onClick={() => run(() => p.onSaveGroup(group.id))}>Zeiten speichern</Button><Button $secondary disabled={locked} onClick={() => p.onResetGroup(group.id)}>Zurücksetzen</Button></ActionRow></Stack></Disclosure>}
            </Stack></Card>;
          })}
          {p.overview?.ko_matches?.length > 0 && <Card><Stack><h3>KO-Duelle</h3>{matches(p.overview.ko_matches)}</Stack></Card>}
          {downloads}
          <Disclosure><summary>Abstimmungsstatistik</summary>{(p.overview?.vote_stats || []).length ? <PlainList>{p.overview.vote_stats.map((item,index) => <li key={item.nutzer_id || index}>{item.username || item.nutzername || 'Nutzer'}: {item.votes_count ?? item.vote_count ?? item.total_votes ?? 0} Stimmen{item.last_vote_at && ` · Zuletzt: ${photoDate(item.last_vote_at)}`}</li>)}</PlainList> : <p>Noch keine Stimmen vorhanden.</p>}</Disclosure>
        </Stack>}
        </Stack>
      </Workspace>}
    </Stack>}
    <ChallengeDialog open={createOpen} onClose={closeCreate} title="Neue Foto-Challenge" busy={locked} footer={<>
      <Button $secondary disabled={locked} onClick={() => createStep ? setCreateStep(createStep - 1) : closeCreate()}>{createStep ? 'Zurück' : 'Abbrechen'}</Button>
      <Button disabled={locked} onClick={() => { if (createStep < 2) { if (createStep === 0 && !p.createForm.title.trim()) { setError('Bitte gib einen Titel ein.'); return; } setError(null); setCreateStep(createStep + 1); } else create(); }}>{locked ? 'Wird angelegt …' : createStep < 2 ? 'Weiter' : p.createForm.status === 'submission_open' ? 'Anlegen und Einreichungen öffnen' : 'Als Entwurf anlegen'}</Button>
    </>}><Stack><p>Schritt {createStep + 1} von 3 · {['Thema','Einreichregeln','Prüfen'][createStep]}</p>
      {createStep === 0 && <><Field>Titel<input autoComplete="off" value={p.createForm.title} onChange={event => p.setCreateForm(previous => ({ ...previous, title: event.target.value }))} aria-invalid={!p.createForm.title && Boolean(error)} /></Field><Field>Beschreibung<textarea value={p.createForm.description} onChange={event => p.setCreateForm(previous => ({ ...previous, description: event.target.value }))} /><small>Erkläre kurz, welche Fotos du suchst.</small></Field></>}
      {createStep === 1 && <SubmissionFields form={p.createForm} setForm={p.setCreateForm} disabled={locked} />}
      {createStep === 2 && <><Card><Stack><h3>{p.createForm.title}</h3><p>{p.createForm.description}</p><p>Einreichen bis: {photoDate(p.createForm.submissionDeadline)}</p><p>{Number(p.createForm.submissionLimitPerUser) === 0 ? 'Unbegrenzt viele Fotos' : `${p.createForm.submissionLimitPerUser} Fotos`} pro Person · Direkte Uploads {p.createForm.allowDirectUploads ? 'erlaubt' : 'deaktiviert'}</p></Stack></Card>
        <Field>Nach dem Anlegen<select value={p.createForm.status} onChange={event => p.setCreateForm(previous => ({ ...previous, status: event.target.value }))}><option value="draft">Als Entwurf vorbereiten</option><option value="submission_open">Einreichungen öffnen</option></select></Field>
      </>}
      {(error || p.feedback?.variant === 'error') && <Notice $error role="alert">{error || p.feedback.message}</Notice>}
    </Stack></ChallengeDialog>
    <ChallengeDialog open={Boolean(confirm)} onClose={() => { if (!busy) setConfirm(null); }} title={confirm?.title || 'Bestätigen'} busy={busy || p.phaseBusy || p.planningBusy} footer={<>
      <Button $secondary disabled={busy || p.phaseBusy || p.planningBusy} onClick={() => setConfirm(null)}>{confirm?.cancel || 'Abbrechen'}</Button>
      <Button disabled={busy || p.phaseBusy || p.planningBusy} onClick={async () => { const action = confirm?.action; if (action) { const result = busyRef.current ? false : await run(action); if (result) setConfirm(null); } }}>{busy ? 'Wird verarbeitet …' : confirm?.label || 'Bestätigen'}</Button>
    </>}><p>{confirm?.text}</p>{(error || p.feedback?.variant === 'error') && <Notice $error role="alert">{error || p.feedback.message}</Notice>}</ChallengeDialog>
    <ImageLightbox imagePreview={lightbox} setImagePreview={setLightbox} />
  </Page></Shell>;
}
