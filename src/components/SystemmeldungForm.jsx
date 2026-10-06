import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { Eye, Mail, Send, Save, Plus, X, ChevronRight } from 'lucide-react';
import Header from '../Header';
import { useUser } from '../context/UserContext';
import { SystemMessagePreview } from './SystemModal';
import { SYSTEM_MESSAGE_MAX, systemMessageRequest, validateSystemMessage, notifyNotificationsChanged } from '../utils/systemMessages';

const emptyForm = () => ({ title: '', message: '', link_url: '', link_label: '', email_subject: '', email_heading: '', email_body: '',
  email_buttons: [], mail_send_mode: 'subscribers', push_web: false, push_android: false });
const stateLabels = { draft: 'Entwurf', published: 'Veröffentlicht', withdrawn: 'Zurückgezogen' };
const deliveryLabels = { pending: 'eingereiht', sending: 'in Bearbeitung', retry: 'erneuter Versuch geplant', sent: 'zum Versand angenommen', accepted: 'zum Versand angenommen',
  failed: 'fehlgeschlagen', uncertain: 'unklar', cancelled: 'gestoppt', skipped: 'übersprungen' };

function Modal({ title, open, onClose, children, actions, busy = false }) {
  return <Dialog open={open} onClose={() => !busy && onClose()} className="system-message-dialog">
    <Backdrop /><ModalPosition><ModalPanel>
      <ModalHeader><DialogTitle>{title}</DialogTitle><Button type="button" onClick={onClose} disabled={busy} aria-label="Dialog schließen"><X size={20} /></Button></ModalHeader>
      <ModalBody>{children}</ModalBody>{actions && <ModalFooter>{actions}</ModalFooter>}
    </ModalPanel></ModalPosition>
  </Dialog>;
}

export default function SystemmeldungForm() {
  const { userId } = useUser();
  const isAdmin = Number(userId) === 1;
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [step, setStep] = useState('app');
  const [dirty, setDirty] = useState(false);
  const [fields, setFields] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState({ mail_html: '', counts: null });
  const [previewError, setPreviewError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [forceConfirmed, setForceConfirmed] = useState(false);
  const [forceText, setForceText] = useState('');
  const [withdraw, setWithdraw] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [uncertainPublication, setUncertainPublication] = useState(false);
  const pendingPublish = useRef(null);
  const published = editing?.state === 'published';
  const locked = saving || testing || publishing || preparing || uncertainPublication;

  const report = err => { setError(err.message || 'Aktion fehlgeschlagen.'); setFields(err.fields || {}); };
  const loadHistory = async (page = 1) => {
    setHistoryLoading(true);
    try {
      const data = await systemMessageRequest(`list&page=${page}`);
      setHistory(data.systemmeldungen); setPagination(data.pagination);
    } catch (err) { report(err); } finally { setHistoryLoading(false); }
  };
  useEffect(() => { if (isAdmin) loadHistory(); }, [isAdmin]);
  useEffect(() => {
    if (!dirty && !uncertainPublication) return;
    const prevent = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', prevent);
    return () => window.removeEventListener('beforeunload', prevent);
  }, [dirty, uncertainPublication]);
  useEffect(() => {
    if (!isAdmin) return;
    const controller = new AbortController();
    setPreviewLoading(true); setPreviewError('');
    const timer = setTimeout(async () => {
      try { setPreview(await systemMessageRequest('preview', form, controller.signal)); }
      catch (err) { if (err.name !== 'AbortError') setPreviewError(err.message); }
      finally { if (!controller.signal.aborted) setPreviewLoading(false); }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [form, isAdmin]);

  const update = (key, value) => {
    if (locked) return;
    setForm(current => ({ ...current, [key]: value })); setDirty(true);
    setFields(current => ({ ...current, [key]: undefined })); setSuccess('');
  };
  const reset = () => {
    setForm(emptyForm()); setEditing(null); setDirty(false); setFields({}); setStep('app');
    pendingPublish.current = null; setUncertainPublication(false); setForceConfirmed(false); setForceText('');
  };
  const canReplace = () => !locked && (!dirty || window.confirm('Ungespeicherte Änderungen verwerfen?'));
  const edit = row => {
    if (!canReplace()) return;
    setEditing(row); setForm(row.form); setDirty(false); setFields({}); setError(''); setSuccess(''); setStep('app');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const save = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const body = published ? { id: editing.id, title: form.title, message: form.message, link_url: form.link_url, link_label: form.link_label }
        : { ...form, id: editing?.id ?? null };
      const result = await systemMessageRequest(published ? 'update' : 'save_draft', body);
      setEditing(current => ({ ...current, id: result.systemmeldung_id, state: published ? 'published' : 'draft' }));
      setDirty(false); setFields({}); setSuccess(published ? 'App-Inhalt korrigiert. E-Mail und Push behalten ihren Versandinhalt.' : 'Entwurf gespeichert.');
      if (published) notifyNotificationsChanged();
      await loadHistory(pagination.page);
    } catch (err) { report(err); } finally { setSaving(false); }
  };
  const testMail = async () => {
    setTesting(true); setError(''); setSuccess('');
    try { const data = await systemMessageRequest('test_email', form); setSuccess(`Testmail an ${data.recipient} zum Versand angenommen.`); }
    catch (err) { report(err); } finally { setTesting(false); }
  };
  const preparePublish = async () => {
    if (pendingPublish.current) { setConfirm(pendingPublish.current); return; }
    const validation = validateSystemMessage(form);
    setFields(validation); setError('');
    if (Object.keys(validation).length) { setError('Bitte die markierten Eingaben prüfen.'); setStep(validation.title || validation.message || validation.link_url ? 'app' : 'email'); return; }
    setPreparing(true);
    try {
      const data = await systemMessageRequest('preview', form);
      setForceConfirmed(false); setForceText('');
      setConfirm({ ...form, id: editing?.id ?? null, request_key: crypto.randomUUID(), expected_counts: data.counts, mail_html: data.mail_html });
    } catch (err) { report(err); } finally { setPreparing(false); }
  };
  const publish = async () => {
    const payload = pendingPublish.current || { ...confirm, force_mail_all_confirmed: forceConfirmed, force_mail_all_confirm_text: forceText };
    pendingPublish.current = payload;
    setPublishing(true); setError('');
    try {
      const { mail_html, ...body } = payload;
      const result = await systemMessageRequest('publish', body);
      setConfirm(null); reset(); setSuccess(`Veröffentlicht: ${result.counts.in_app} App-Empfänger, ${result.counts.email} E-Mails und ${result.counts.web + result.counts.android} Push-Jobs eingereiht.`);
      notifyNotificationsChanged(); await loadHistory(1);
    } catch (err) {
      report(err);
      if (err.status && err.status < 500) {
        pendingPublish.current = null; setUncertainPublication(false);
        if (err.counts) setConfirm(current => ({ ...current, expected_counts: err.counts }));
        else setConfirm(null);
      } else {
        setUncertainPublication(true);
        setError('Veröffentlichung konnte nicht bestätigt werden. Wiederhole denselben Vorgang, um den Status sicher zu klären.');
      }
    } finally { setPublishing(false); }
  };
  const doWithdraw = async () => {
    setWithdrawing(true); setError('');
    try {
      await systemMessageRequest('withdraw', { id: withdraw.id });
      if (editing?.id === withdraw.id) reset();
      setWithdraw(null); setSuccess('Meldung zurückgezogen. Ausstehende Versandjobs wurden gestoppt.');
      notifyNotificationsChanged(); await loadHistory(pagination.page);
    } catch (err) { report(err); } finally { setWithdrawing(false); }
  };
  const field = (key, label, placeholder, rows) => <Field as="div" key={key}>
    <label htmlFor={`system-${key}`}>{label}</label>{rows ? <Textarea id={`system-${key}`} rows={rows} value={form[key]} maxLength={SYSTEM_MESSAGE_MAX[key]} placeholder={placeholder}
      aria-invalid={!!fields[key]} aria-describedby={fields[key] ? `error-${key}` : undefined} onChange={event => update(key, event.target.value)} /> :
      <Input id={`system-${key}`} value={form[key]} maxLength={SYSTEM_MESSAGE_MAX[key]} placeholder={placeholder} aria-invalid={!!fields[key]}
        aria-describedby={fields[key] ? `error-${key}` : undefined} onChange={event => update(key, event.target.value)} />}
    {fields[key] && <FieldError id={`error-${key}`}>{fields[key]}</FieldError>}
  </Field>;
  const appPreview = source => <SystemMessagePreview title={source.title} message={source.message} linkUrl={source.link_url} linkLabel={source.link_label} />;
  const mailPreview = html => html ? <MailFrame title="E-Mail-Vorschau" srcDoc={html} sandbox="" /> : <Hint>E-Mail-Vorschau wird geladen.</Hint>;
  const previewContent = <><PreviewTabs><Button type="button" $active={step !== 'email'} onClick={() => setStep('app')}>In-App</Button>
    <Button type="button" $active={step === 'email'} onClick={() => setStep('email')}>E-Mail</Button></PreviewTabs>
    {step === 'email' ? <>{previewLoading && <Hint>Vorschau wird aktualisiert …</Hint>}{previewError ? <Notice $error role="alert">{previewError}</Notice> : mailPreview(preview.mail_html)}</> : appPreview(form)}</>;

  if (!isAdmin) return <Page>Du hast keine Berechtigung, Systemmeldungen zu verwalten.</Page>;
  return <><Header /><Page>
    <Heading><div><Kicker>ADMIN · KOMMUNIKATION</Kicker><h1>{published ? 'App-Inhalt korrigieren' : 'Systemmeldung schreiben'}</h1>
      <Hint>{published ? 'Bereits eingereihte E-Mails und Push-Nachrichten bleiben unverändert.' : 'Inhalte vorbereiten, Vorschau prüfen und anschließend veröffentlichen.'}</Hint></div>
      <Button type="button" onClick={() => { if (canReplace()) reset(); }} disabled={locked}>Neue Meldung</Button></Heading>
    {error && <Notice $error role="alert">{error}</Notice>}{success && <Notice role="status">{success}</Notice>}
    <Layout><Card><Steps aria-label="Bearbeitungsbereiche">{[['app','1 · In-App'],['email','2 · E-Mail'],['send','3 · Versand']].map(([value,label]) =>
      <StepButton key={value} type="button" $active={step === value} aria-current={step === value ? 'step' : undefined} onClick={() => setStep(value)}>{label}</StepButton>)}</Steps>
      <fieldset disabled={locked || published && step !== 'app'}>
        {step === 'app' && <><h2>Nachricht in der App</h2>{field('title','Titel','Was gibt es Neues?')}
          {field('message','App-Nachricht','Schreibe eine kurze, verständliche Nachricht.',10)}<Hint>Markdown: ## Überschrift, - Liste, **fett**, [Link](https://…).</Hint>
          <Pair>{field('link_label','Buttonbeschriftung (optional)','Mehr erfahren')}{field('link_url','Buttonziel (optional)','/map oder https://…')}</Pair></>}
        {step === 'email' && <><h2>E-Mail-Inhalt</h2><Hint>Vorschau und Testmail verwenden das tatsächliche Versandtemplate.</Hint>
          <Button type="button" onClick={() => {
            if (!form.email_body || window.confirm('Individuell bearbeiteten E-Mail-Text durch den App-Text ersetzen?')) {
              setForm(current => ({ ...current, email_subject: current.title ? `Ice-App: ${current.title}` : '', email_heading: current.title, email_body: current.message })); setDirty(true);
            }
          }}>App-Text übernehmen</Button>
          {field('email_subject','Betreff',form.title ? `Ice-App: ${form.title}` : 'Ice-App: …')}{field('email_heading','Mailüberschrift',form.title || 'Überschrift')}
          {field('email_body','Mailtext','Deine Nachricht an die E-Mail-Empfänger.',12)}<Hint>Zusätzlich möglich: ![Bildbeschreibung](https://…) und [button: Text](https://…).</Hint>
          <h3>Zusätzliche Buttons</h3>{form.email_buttons.map((button,index) => <ButtonFields key={index}>
            <Field><span>Beschriftung {index+1}</span><Input value={button.label} maxLength={100} onChange={event => update('email_buttons',form.email_buttons.map((item,i) => i === index ? {...item,label:event.target.value} : item))} /></Field>
            <Field><span>Link {index+1}</span><Input value={button.url} maxLength={255} placeholder="/map oder https://…" onChange={event => update('email_buttons',form.email_buttons.map((item,i) => i === index ? {...item,url:event.target.value} : item))} /></Field>
            <Button type="button" aria-label={`Button ${index+1} entfernen`} onClick={() => update('email_buttons',form.email_buttons.filter((_,i) => i !== index))}><X size={18}/></Button></ButtonFields>)}
          {fields.email_buttons && <FieldError>{fields.email_buttons}</FieldError>}
          <Button type="button" disabled={form.email_buttons.length >= 5} onClick={() => update('email_buttons',[...form.email_buttons,{label:'',url:''}])}><Plus size={16}/> Button hinzufügen</Button></>}
        {step === 'send' && <><h2>Kanäle und Empfänger</h2><Channel><strong>In-App</strong><Hint>Alle bestehenden Nutzer erhalten die Meldung in ihrer Glocke.</Hint></Channel>
          <h3>E-Mail</h3>{[['subscribers','Nur Abonnenten','Beachtet die Einstellung für News und Systemmeldungen.'],['none','Keine E-Mail','Veröffentlichung nur über die weiteren ausgewählten Kanäle.'],['all','E-Mail an alle','Ignoriert E-Mail-Einstellungen. Erfordert eine zusätzliche Bestätigung.']].map(([value,label,hint]) =>
            <Choice key={value}><input type="radio" aria-label={label} name="mail-mode" value={value} checked={form.mail_send_mode === value} onChange={() => update('mail_send_mode',value)}/><div><strong>{label}</strong><Hint>{hint}</Hint></div></Choice>)}
          {fields.mail_send_mode && <FieldError>{fields.mail_send_mode}</FieldError>}
          <h3>Push (optional)</h3>{[['push_web','Browser'],['push_android','Android']].map(([key,label]) => <Choice key={key}><input type="checkbox" aria-label={label} checked={form[key]} onChange={event => update(key,event.target.checked)}/><div><strong>{label}</strong><Hint>Beachtet die News-Push-Einstellung und aktivierte Geräte.</Hint></div></Choice>)}
          <Counts counts={preview.counts} stale={previewLoading || !!previewError}/></>}
      </fieldset>
      <ActionBar><Button type="button" onClick={save} disabled={locked}><Save size={17}/>{saving ? 'Speichern …' : published ? 'App-Korrektur speichern' : 'Entwurf speichern'}</Button>
        <MobilePreviewButton type="button" onClick={() => setPreviewOpen(true)}><Eye size={17}/> Vorschau</MobilePreviewButton>
        {!published && <Primary type="button" disabled={saving || testing || publishing || preparing} onClick={preparePublish}><Send size={17}/>{preparing ? 'Prüfen …' : uncertainPublication ? 'Veröffentlichung prüfen' : 'Veröffentlichen'}</Primary>}</ActionBar>
    </Card><PreviewAside><Card><h2>Vorschau</h2>{previewContent}
      {!published && <Button type="button" onClick={testMail} disabled={locked || !form.email_body.trim()}><Mail size={17}/>{testing ? 'Testmail wird versendet …' : 'Testmail an Admin'}</Button>}</Card></PreviewAside></Layout>
    <History><Heading><div><h2>Bisherige Meldungen</h2><Hint>Entwürfe, Veröffentlichungen und Versandstatus.</Hint></div><Button type="button" disabled={historyLoading} onClick={() => loadHistory(pagination.page)}>Aktualisieren</Button></Heading>
      {historyLoading && <Hint role="status">Historie wird geladen …</Hint>}{!historyLoading && !history.length && <Hint>Noch keine Meldungen.</Hint>}
      {history.map(row => <HistoryRow key={row.id}><details><summary><ChevronRight size={16} aria-hidden="true"/><strong>{row.titel || 'Unbenannter Entwurf'}</strong><Badge>{stateLabels[row.state] || row.state}</Badge>
        <time>{new Date(row.erstellt_am).toLocaleDateString('de-DE')}</time></summary><Detail><p>{row.nachricht}</p>
          {Object.entries(row.delivery_stats).map(([channel,stats]) => <p key={channel}><strong>{channel === 'in_app' ? 'In-App' : channel === 'email' ? 'E-Mail' : channel === 'web' ? 'Browser' : 'Android'}: </strong>
            {channel === 'in_app' ? `${stats.read} von ${stats.total} gelesen` : Object.entries(stats).map(([status,count]) => `${count} ${deliveryLabels[status] || status}`).join(' · ')}</p>)}
          {row.form.email_body && <details><summary>Ursprünglicher E-Mail-Inhalt</summary><pre>{row.form.email_body}</pre></details>}
          {row.state === 'published' && <Hint>Korrekturen betreffen ausschließlich die App-Anzeige.</Hint>}</Detail></details>
        {row.state !== 'withdrawn' && <RowActions><Button type="button" disabled={locked} onClick={() => edit(row)}>{row.state === 'draft' ? 'Entwurf bearbeiten' : 'App-Inhalt korrigieren'}</Button>
          <Danger type="button" disabled={locked} onClick={() => setWithdraw(row)}>Zurückziehen</Danger></RowActions>}</HistoryRow>)}
      <Pager><Button type="button" disabled={historyLoading || pagination.page <= 1} onClick={() => loadHistory(pagination.page-1)}>Zurück</Button><span>Seite {pagination.page} von {pagination.pages}</span>
        <Button type="button" disabled={historyLoading || pagination.page >= pagination.pages} onClick={() => loadHistory(pagination.page+1)}>Weiter</Button></Pager>
    </History>
  </Page>
    <Modal title="Vorschau" open={previewOpen} onClose={() => setPreviewOpen(false)}>{previewContent}{!published && <Button type="button" onClick={testMail} disabled={locked || !form.email_body.trim()}>Testmail an Admin</Button>}</Modal>
    <Modal title="Veröffentlichung bestätigen" open={!!confirm} onClose={() => setConfirm(null)} busy={publishing || uncertainPublication}
      actions={<><Button type="button" disabled={publishing || uncertainPublication} onClick={() => setConfirm(null)}>Abbrechen</Button><Primary type="button" onClick={publish}
        disabled={publishing || confirm?.mail_send_mode === 'all' && !pendingPublish.current && (!forceConfirmed || forceText !== 'EMAIL AN ALLE')}>{publishing ? 'Veröffentlichen …' : uncertainPublication ? 'Erneut prüfen' : 'Jetzt veröffentlichen'}</Primary></>}>
      {confirm && <><Counts counts={confirm.expected_counts}/>{error && <Notice $error role="alert">{error}</Notice>}
        <h3>In-App-Inhalt</h3>{appPreview(confirm)}{confirm.mail_send_mode !== 'none' && <><h3>E-Mail: {confirm.email_subject || `Ice-App: ${confirm.title}`}</h3>{mailPreview(confirm.mail_html)}</>}
        {(confirm.push_web || confirm.push_android) && <p>Push-Inhalt: „{confirm.title}“ · {confirm.push_web && 'Browser '}{confirm.push_android && 'Android'}</p>}
        {confirm.mail_send_mode === 'all' && <><Notice $error>E-Mail an alle ignoriert die Abonnementeinstellung.</Notice><Choice><input type="checkbox" checked={forceConfirmed} disabled={publishing || uncertainPublication} onChange={event => setForceConfirmed(event.target.checked)}/><span>Ich bestätige den Versand an alle Nutzer mit gültiger E-Mail-Adresse.</span></Choice>
          <Field><span>Zur Bestätigung EMAIL AN ALLE eingeben</span><Input value={forceText} disabled={publishing || uncertainPublication} onChange={event => setForceText(event.target.value)}/></Field></>}</>}
    </Modal>
    <Modal title="Meldung zurückziehen" open={!!withdraw} onClose={() => setWithdraw(null)} busy={withdrawing} actions={<><Button type="button" disabled={withdrawing} onClick={() => setWithdraw(null)}>Abbrechen</Button><Danger type="button" disabled={withdrawing} onClick={doWithdraw}>Zurückziehen</Danger></>}>
      <p>„{withdraw?.titel || 'Entwurf'}“ wird in der App ausgeblendet. Ausstehende Versandjobs werden gestoppt. Bereits zum Versand übergebene Nachrichten können nicht zurückgeholt werden.</p>
    </Modal>
  </>;
}

function Counts({ counts, stale = false }) {
  return <CountBox aria-live="polite">{counts ? <><strong>{stale ? 'Empfängerzahlen werden aktualisiert …' : 'Empfängerübersicht'}</strong><div>
    <span>In-App <b>{counts.in_app}</b></span><span>E-Mail <b>{counts.email}</b></span><span>Browsergeräte <b>{counts.web}</b></span><span>Androidgeräte <b>{counts.android}</b></span>
  </div></> : 'Empfängerzahlen werden geladen …'}</CountBox>;
}

const Page = styled.main`max-width:1280px;margin:auto;padding:28px 24px 48px;color:#2f2100;box-sizing:border-box;h1{font-size:clamp(24px,3vw,32px);margin:6px 0 10px}h2{font-size:20px;margin:0 0 16px}h3{font-size:16px;margin:24px 0 12px}button,input,textarea{font:inherit}button:focus-visible,input:focus-visible,textarea:focus-visible,summary:focus-visible{outline:3px solid #b86e00;outline-offset:3px}@media(max-width:600px){padding:20px 12px 32px}`;
const Heading = styled.div`display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:24px;flex-wrap:wrap;`;
const Kicker = styled.div`font-size:11px;font-weight:700;letter-spacing:.1em;color:#856a37;`;
const Hint = styled.p`color:#796747;font-size:13px;line-height:1.5;margin:6px 0 14px;`;
const Layout = styled.div`display:grid;gap:24px;align-items:start;@media(min-width:1024px){grid-template-columns:minmax(0,1.2fr) minmax(0,1fr)}`;
const Card = styled.section`background:#fffdf8;border:1px solid #eadfc8;border-radius:18px;padding:24px;min-width:0;box-sizing:border-box;fieldset{border:0;padding:0;margin:0;min-width:0}@media(max-width:600px){padding:16px}`;
const Steps = styled.nav`display:flex;gap:6px;border-bottom:1px solid #eadfc8;margin:0 0 24px;padding-bottom:12px;`;
const Button = styled.button`display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:10px 14px;border:1px solid #dcccaf;border-radius:10px;background:${p=>p.$active?'#fff0c5':'#fffdf8'};color:#2f2100;cursor:pointer;font:inherit;font-weight:600;font-size:14px;box-sizing:border-box;flex-shrink:0;&:hover{background:#fff0d2}&:disabled{opacity:.55;cursor:default}`;
const StepButton = styled(Button)`flex:1;flex-shrink:1;padding:8px 4px;border-color:${p=>p.$active?'#e9ae2f':'transparent'};font-size:13px;`;
const Primary = styled(Button)`background:#ffb522;border-color:#ecaa21;&:hover{background:#ffc448}`;
const Danger = styled(Button)`color:#a13628;border-color:#dfb5ad;&:hover{background:#fff0ed}`;
const Field = styled.label`display:grid;gap:7px;font-size:13px;font-weight:600;margin:18px 0;min-width:0;`;
const Input = styled.input`width:100%;min-height:44px;box-sizing:border-box;border:1px solid #dcccaf;border-radius:9px;padding:11px 12px;background:#fff;color:#2f2100;&[aria-invalid=true]{border-color:#bb3e2d}`;
const Textarea = styled.textarea`width:100%;box-sizing:border-box;border:1px solid #dcccaf;border-radius:9px;padding:12px;background:#fff;color:#2f2100;resize:vertical;line-height:1.55;&[aria-invalid=true]{border-color:#bb3e2d}`;
const Pair = styled.div`display:grid;gap:12px;@media(min-width:650px){grid-template-columns:1fr 1fr}`;
const ButtonFields = styled.div`display:grid;align-items:center;gap:8px;grid-template-columns:minmax(0,1fr) 44px;label:first-child{grid-column:1/-1}label{margin:6px 0}`;
const Choice = styled.label`display:flex;gap:12px;align-items:flex-start;border:1px solid #e6dcc7;border-radius:12px;padding:14px;margin:10px 0;cursor:pointer;font-size:14px;input{width:18px;height:18px;flex-shrink:0;margin:2px 0;accent-color:#b86e00}p{margin:5px 0 0}`;
const Channel = styled.div`border-radius:12px;background:#fff2cb;padding:14px;font-size:14px;p{margin-bottom:0}`;
const CountBox = styled.div`background:#f5f1e8;padding:16px;border-radius:12px;font-size:13px;margin:18px 0;div{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}span{display:flex;justify-content:space-between;gap:8px}`;
const ActionBar = styled.div`display:flex;flex-wrap:wrap;gap:10px;margin:24px -24px -24px;padding:16px 24px;border-top:1px solid #eadfc8;background:#fffdf8;border-radius:0 0 18px 18px;position:sticky;bottom:0;z-index:2;@media(max-width:600px){margin:20px -16px -16px;padding:12px 16px;padding-bottom:max(12px,env(safe-area-inset-bottom));button{flex:1;flex-shrink:1}}`;
const PreviewAside = styled.aside`position:sticky;top:20px;max-height:calc(100dvh - 40px);overflow:auto;min-width:0;@media(max-width:1023px){display:none}`;
const MobilePreviewButton = styled(Button)`@media(min-width:1024px){display:none}`;
const PreviewTabs = styled.div`display:flex;gap:8px;margin-bottom:18px;`;
const MailFrame = styled.iframe`width:100%;height:440px;max-height:65dvh;border:1px solid #eadfc8;border-radius:12px;box-sizing:border-box;margin-bottom:12px;background:white;`;
const Notice = styled.div`border-radius:12px;padding:14px 16px;margin:14px 0;background:${p=>p.$error?'#fff0ed':'#edf5e8'};color:${p=>p.$error?'#9a3325':'#315623'};font-size:14px;line-height:1.5;`;
const FieldError = styled.span`color:#a13628;font-size:12px;`;
const History = styled(Card)`margin-top:28px;`;
const HistoryRow = styled.div`border-top:1px solid #eadfc8;padding:16px 0;details[open]>summary>svg{transform:rotate(90deg)}summary{cursor:pointer;display:flex;gap:10px;align-items:center;flex-wrap:wrap;min-height:44px;font-size:14px;svg{flex-shrink:0}strong{overflow-wrap:anywhere}time{color:#796747;font-size:12px;margin-left:auto}}`;
const Badge = styled.span`font-size:11px;background:#f5eedf;padding:5px 9px;border-radius:20px;white-space:nowrap;`;
const Detail = styled.div`font-size:13px;color:#796747;overflow-wrap:anywhere;p,pre{white-space:pre-wrap}pre{font:inherit}summary{font-size:13px}`;
const RowActions = styled.div`display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;`;
const Pager = styled.div`display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:16px;font-size:12px;`;
const Backdrop = styled(DialogBackdrop)`position:fixed;inset:0;background:rgba(47,33,0,.42);z-index:4000;`;
const ModalPosition = styled.div`position:fixed;inset:0;display:flex;justify-content:center;align-items:center;padding:12px;z-index:4001;box-sizing:border-box;`;
const ModalPanel = styled(DialogPanel)`display:flex;flex-direction:column;background:#fffdf8;color:#2f2100;border-radius:18px;width:min(100%,700px);max-height:calc(100dvh - 24px);box-shadow:0 24px 64px #2f210030;overflow:hidden;font-family:inherit;button,input{font:inherit}h3{font-size:15px}p{line-height:1.5}`;
const ModalHeader = styled.div`display:flex;justify-content:space-between;align-items:center;gap:16px;padding:16px 20px;border-bottom:1px solid #eadfc8;h2{font-size:18px;margin:0}`;
const ModalBody = styled.div`padding:20px;overflow-y:auto;overscroll-behavior:contain;min-height:0;`;
const ModalFooter = styled.div`display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px;padding:14px 20px max(14px,env(safe-area-inset-bottom));border-top:1px solid #eadfc8;`;
