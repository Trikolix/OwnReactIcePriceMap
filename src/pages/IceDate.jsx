import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { CalendarDays, Check, Copy, IceCreamCone, MapPin, Share2, X } from "lucide-react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Header from "../Header";
import Seo from "../components/Seo";
import OpeningHours from "../components/OpeningHours";
import UserAvatar from "../components/UserAvatar";
import CheckinForm from "../CheckinForm";
import SearchSelect from "../components/iceDate/SearchSelect";
import { useUser } from "../context/UserContext";
import { trackEvent } from "../utils/analytics";
import { ShopButton, ShopPanel, SHOP_COLORS } from "../styles/ShopUi";
import { ICE_DATE_DRAFT_KEY, RSVP_LABELS, defaultStart, formatDate, groupDates, localDateInput, readDraft, reservationCounts, toApiDate } from "../utils/iceDate.mjs";

const apiBase = import.meta.env.VITE_API_BASE_URL;
const authHeaders = token => token ? { Authorization: `Bearer ${token}` } : {};
const readJson = async response => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.status === "error") throw new Error(data.message || "Die Anfrage ist fehlgeschlagen. Bitte versuche es erneut.");
  return data;
};
const login = () => window.dispatchEvent(new CustomEvent("auth:open-login"));

export default function IceDate() {
  const { token } = useParams(), location = useLocation(), navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { userId, authToken, isLoggedIn } = useUser();
  const isCreate = location.pathname === "/ice-date/new";
  const dateId = params.get("id"), paramShopId = params.get("shopId");
  const isDetail = Boolean(token || dateId), privateGuest = isDetail && !token && !isLoggedIn;
  const [draft] = useState(() => readDraft(sessionStorage));
  const [shopId, setShopId] = useState(() => paramShopId || draft?.shopId || "");
  const [startsAt, setStartsAt] = useState(() => draft?.startsAt || defaultStart());
  const [title, setTitle] = useState(() => draft?.title || ""), [note, setNote] = useState(() => draft?.note || "");
  const [selectedUsers, setSelectedUsers] = useState(() => draft?.selectedUsers || []);
  const [shop, setShop] = useState(null), [shopLoading, setShopLoading] = useState(false), [shopError, setShopError] = useState("");
  const [choosingShop, setChoosingShop] = useState(!shopId), [shopQuery, setShopQuery] = useState("");
  const [places, setPlaces] = useState([]), [placesLoading, setPlacesLoading] = useState(false), [placesError, setPlacesError] = useState("");
  const [userQuery, setUserQuery] = useState(""), [userResults, setUserResults] = useState([]), [searching, setSearching] = useState(false), [userError, setUserError] = useState("");
  const [dates, setDates] = useState([]), [date, setDate] = useState(null), [loading, setLoading] = useState(true), [loadError, setLoadError] = useState("");
  const [error, setError] = useState(""), [notice, setNotice] = useState(""), [busy, setBusy] = useState(false);
  const [shareBusy, setShareBusy] = useState(false), [shareError, setShareError] = useState(""), [copied, setCopied] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false), [reload, setReload] = useState(0), [shopRetry, setShopRetry] = useState(0), [userRetry, setUserRetry] = useState(0);
  const [extrasOpen, setExtrasOpen] = useState(Boolean(draft?.title || draft?.note));
  const errorRef = useRef(null);
  const draftActive = useRef(isCreate);
  const shareUrl = date?.invite_token ? `${window.location.origin}/ice-date/${date.invite_token}` : "";
  const visiblePlaces = useMemo(() => {
    const query = shopQuery.trim().toLocaleLowerCase("de");
    return places.filter(place => !query || `${place.name} ${place.adresse || ""}`.toLocaleLowerCase("de").includes(query)).slice(0, query ? 20 : 8);
  }, [places, shopQuery]);
  const grouped = useMemo(() => groupDates(dates), [dates]);
  const minStart = localDateInput(new Date()), maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  const saveDraft = () => {
    try { sessionStorage.setItem(ICE_DATE_DRAFT_KEY, JSON.stringify({ shopId, startsAt, title, note, selectedUsers: selectedUsers.map(({ id, username }) => ({ id, username })) })); } catch {}
  };
  const clearDraft = () => { try { sessionStorage.removeItem(ICE_DATE_DRAFT_KEY); } catch {} };
  useEffect(() => { draftActive.current = isCreate; }, [isCreate]);
  useEffect(() => { if (isCreate && draftActive.current) saveDraft(); }, [isCreate, shopId, startsAt, title, note, selectedUsers]);
  useEffect(() => {
    if (isCreate && paramShopId) { setShopId(paramShopId); setChoosingShop(false); }
  }, [isCreate, paramShopId]);
  useEffect(() => { if (userId) setSelectedUsers(users => users.filter(user => Number(user.id) !== Number(userId))); }, [userId]);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);
  useEffect(() => {
    if (isCreate) return;
    const refresh = () => setReload(value => value + 1);
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [isCreate]);

  useEffect(() => {
    if (!isCreate || !shopId) { setShop(null); setShopLoading(false); setShopError(""); return; }
    const controller = new AbortController();
    setShopLoading(true); setShopError("");
    const timer = window.setTimeout(async () => {
      try {
        const query = new URLSearchParams({ shop_id: shopId });
        if (startsAt) query.set("starts_at", toApiDate(startsAt));
        const data = await readJson(await fetch(`${apiBase}/api/ice_date_shop.php?${query}`, { signal: controller.signal }));
        if (!controller.signal.aborted) setShop(data.shop);
      } catch (requestError) {
        if (!controller.signal.aborted) setShopError(requestError.message);
      } finally { if (!controller.signal.aborted) setShopLoading(false); }
    }, 200);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [isCreate, shopId, startsAt, shopRetry]);

  useEffect(() => {
    if (!isCreate || !choosingShop) return;
    const controller = new AbortController();
    setPlacesLoading(true); setPlacesError("");
    (async () => {
      try {
        const data = await readJson(await fetch(`${apiBase}/get_eisdielen_list.php`, { signal: controller.signal }));
        if (!Array.isArray(data)) throw new Error("Eisdielen konnten nicht geladen werden.");
        if (!controller.signal.aborted) setPlaces(data.filter(place => !place.place_type || place.place_type === "ice_shop"));
      } catch (requestError) {
        if (!controller.signal.aborted) setPlacesError(requestError.message);
      } finally { if (!controller.signal.aborted) setPlacesLoading(false); }
    })();
    return () => controller.abort();
  }, [isCreate, choosingShop, shopRetry]);

  useEffect(() => {
    setUserResults([]); setUserError("");
    if (!isCreate || userQuery.trim().length < 2 || selectedUsers.length >= 7) { setSearching(false); return; }
    const controller = new AbortController();
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const data = await readJson(await fetch(`${apiBase}/api/search_user.php?q=${encodeURIComponent(userQuery.trim())}`, { signal: controller.signal }));
        const selected = new Set(selectedUsers.map(user => Number(user.id)));
        if (!controller.signal.aborted) setUserResults((Array.isArray(data) ? data : []).filter(user => Number(user.id) !== Number(userId) && !selected.has(Number(user.id))));
      } catch (requestError) {
        if (!controller.signal.aborted) setUserError(requestError.message);
      } finally { if (!controller.signal.aborted) setSearching(false); }
    }, 250);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [isCreate, userQuery, selectedUsers, userId, userRetry]);

  useEffect(() => {
    setLoadError(""); setShareError(""); setCopied(false);
    if (isCreate || privateGuest || (!isDetail && !isLoggedIn)) { setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true);
    (async () => {
      try {
        const query = token ? `?token=${encodeURIComponent(token)}` : `?id=${encodeURIComponent(dateId)}`;
        const endpoint = isDetail ? `api/ice_date_detail.php${query}` : "api/ice_date_list.php";
        const data = await readJson(await fetch(`${apiBase}/${endpoint}`, { headers: authHeaders(authToken), signal: controller.signal }));
        if (controller.signal.aborted) return;
        if (isDetail) {
          if (!data.ice_date) throw new Error("Eis-Date nicht gefunden.");
          setDate(data.ice_date);
        } else setDates(Array.isArray(data.ice_dates) ? data.ice_dates : []);
      } catch (requestError) {
        if (!controller.signal.aborted) setLoadError(requestError.message);
      } finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [isCreate, privateGuest, isDetail, isLoggedIn, token, dateId, authToken, reload]);

  const chooseShop = place => {
    setShopId(String(place.id)); setShop(null); setChoosingShop(false); setShopQuery("");
    const next = new URLSearchParams(params); next.set("shopId", String(place.id)); setParams(next, { replace: true });
    window.requestAnimationFrame(() => document.getElementById("ice-date-when")?.focus());
  };
  const removeUser = id => {
    setSelectedUsers(users => users.filter(entry => Number(entry.id) !== Number(id)));
    window.requestAnimationFrame(() => document.getElementById("ice-date-users")?.focus());
  };
  const resetFeedback = () => { setError(""); setNotice(""); };
  const resetForm = () => {
    setShopId(""); setShop(null); setStartsAt(defaultStart()); setTitle(""); setNote(""); setSelectedUsers([]);
    setExtrasOpen(false); setChoosingShop(true); setShopQuery(""); setUserQuery("");
  };
  const handleCreate = async event => {
    event.preventDefault(); saveDraft();
    if (!isLoggedIn) { login(); return; }
    if (!shop || Number(shop.id) !== Number(shopId) || shopError) { setError("Bitte wähle eine gültige Eisdiele."); return; }
    setBusy(true); resetFeedback();
    try {
      const data = await readJson(await fetch(`${apiBase}/api/ice_date_create.php`, {
        method: "POST", headers: { "Content-Type": "application/json", ...authHeaders(authToken) },
        body: JSON.stringify({ shop_id: Number(shopId), starts_at: toApiDate(startsAt), title, note, participant_user_ids: selectedUsers.map(user => Number(user.id)) }),
      }));
      draftActive.current = false; clearDraft(); setDate(data.ice_date); setNotice("Eis-Date erstellt. Lade jetzt deine Freunde ein.");
      trackEvent("ice_date", "created");
      navigate(`/ice-date?id=${data.ice_date.id}`, { replace: true, state: { created: true } });
      resetForm();
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };
  const handleRsvp = async status => {
    if (!isLoggedIn) { login(); return; }
    setBusy(true); resetFeedback();
    try {
      const data = await readJson(await fetch(`${apiBase}/api/ice_date_rsvp.php`, {
        method: "POST", headers: { "Content-Type": "application/json", ...authHeaders(authToken) },
        body: JSON.stringify({ ice_date_id: date.id, status, ...(token ? { invite_token: token } : {}) }),
      }));
      setDate(data.ice_date); setNotice(status === "going" ? "Du bist dabei!" : status === "maybe" ? "Dein Platz ist als Vielleicht reserviert." : "Du bist nicht dabei.");
      trackEvent("ice_date", "rsvp", status);
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };
  const handleCopy = async () => {
    if (!shareUrl) return;
    setShareError("");
    try {
      await navigator.clipboard.writeText(shareUrl); setCopied(true);
      trackEvent("ice_date", "invite_link_copied");
    } catch { setShareError("Kopieren hat nicht funktioniert. Du kannst den Link unten markieren und selbst kopieren."); }
  };
  const handleShare = async () => {
    if (!shareUrl || shareBusy) return;
    setShareBusy(true); setShareError("");
    try {
      if (navigator.share) {
        await navigator.share({ title: date.title || `Eis-Date bei ${date.shop_name}`, text: "Kommst du mit Eis essen?", url: shareUrl });
        trackEvent("ice_date", "invite_shared");
      } else await handleCopy();
    } catch (requestError) {
      if (requestError.name !== "AbortError") setShareError("Teilen hat nicht funktioniert. Kopiere stattdessen den Einladungslink.");
    } finally { setShareBusy(false); }
  };
  const handleCancel = async () => {
    setBusy(true); resetFeedback();
    try {
      await readJson(await fetch(`${apiBase}/api/ice_date_cancel.php`, {
        method: "POST", headers: { "Content-Type": "application/json", ...authHeaders(authToken) }, body: JSON.stringify({ ice_date_id: date.id }),
      }));
      setDate(previous => ({ ...previous, status: "cancelled", can_checkin: false })); setNotice("Eis-Date abgesagt.");
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };
  const heading = isCreate ? "Eis-Date planen" : isDetail ? "Eis-Date" : "Deine Eis-Dates";
  const selectedShop = shop && Number(shop.id) === Number(shopId) ? shop : null;
  const currentDate = date && (token ? date.invite_token === token : String(date.id) === dateId) ? date : null;

  return <Page>
    <Seo title={`${heading} | Ice-App`} description="Gemeinsam Eis essen planen, Freunde einladen und zusammen einchecken." canonical="/ice-date" />
    <Header />
    <Content data-ice-date>
      <PageHead><div><h1>{heading}</h1>{!isDetail && <Subline>{isCreate ? "Eisdiele wählen, Termin festlegen und Freunde einladen." : "Gemeinsame Treffen und deine Einladungen."}</Subline>}</div></PageHead>
      {(isCreate || isDetail) && <PageTools><BackLink to="/ice-date">Zu deinen Eis-Dates</BackLink>{isDetail && <QuietButton onClick={() => setReload(value => value + 1)} disabled={loading}>Aktualisieren</QuietButton>}</PageTools>}
      {error && <Notice ref={errorRef} tabIndex={-1} role="alert" $error>{error}</Notice>}
      {notice && <Notice role="status">{notice}</Notice>}
      {isCreate ? <CreateCard as="form" onSubmit={handleCreate} aria-label="Eis-Date planen">
        <Section aria-labelledby="ice-date-where"><SectionHeading id="ice-date-where"><MapPin size={19} /> Wo</SectionHeading>
          {selectedShop && <ShopPreview><MapPin size={19} aria-hidden="true" /><div><Link to={`/shop/${shopId}`}><strong>{selectedShop.name}</strong><span>{selectedShop.adresse}</span></Link></div><QuietButton onClick={() => setChoosingShop(value => !value)} aria-expanded={choosingShop}>Ändern</QuietButton></ShopPreview>}
          {choosingShop && <SearchSelect id="ice-date-shop" label="Eisdiele suchen" placeholder="Name oder Adresse" query={shopQuery} onQuery={setShopQuery} items={visiblePlaces}
            onChoose={chooseShop} loading={placesLoading} error={placesError} onRetry={() => setShopRetry(value => value + 1)} emptyText="Keine passende Eisdiele gefunden. Versuche einen anderen Namen oder Ort." />}
          {shopId && !selectedShop && shopLoading && <Hint role="status">Eisdiele wird geladen …</Hint>}
          {shopError && <InlineError><span role="alert">{shopError}</span><ShopButton onClick={() => setShopRetry(value => value + 1)}>Erneut laden</ShopButton><QuietButton onClick={() => setChoosingShop(true)}>Andere Eisdiele wählen</QuietButton></InlineError>}
        </Section>
        <Section aria-labelledby="ice-date-when"><SectionHeading id="ice-date-when" tabIndex={-1}><CalendarDays size={19} /> Wann</SectionHeading>
          <Field><label htmlFor="ice-date-start">Datum & Uhrzeit</label><input id="ice-date-start" type="datetime-local" value={startsAt} onChange={event => setStartsAt(event.target.value)} required min={minStart} max={localDateInput(maxDate)} /></Field>
          {selectedShop && <OpeningInfo shop={selectedShop} checking={shopLoading || selectedShop.opening_reference !== toApiDate(startsAt)} />}
        </Section>
        <Section aria-labelledby="ice-date-who"><SectionHeading id="ice-date-who">Wer</SectionHeading>
          <Hint>Oder teile nach dem Erstellen den Einladungslink.</Hint>
          <SearchSelect id="ice-date-users" label="Freunde direkt einladen (optional)" placeholder="Nutzername suchen" query={userQuery} onQuery={setUserQuery} items={userResults} onChoose={user => { setSelectedUsers(users => [...users, user]); setUserQuery(""); }}
            loading={searching} error={userError} onRetry={() => setUserRetry(value => value + 1)} disabled={selectedUsers.length >= 7}
            emptyText={userQuery.trim().length >= 2 ? "Keine passenden Nutzer gefunden." : userQuery.length ? "Gib mindestens zwei Zeichen ein." : ""} />
          {selectedUsers.length > 0 && <ChipList aria-label="Direkt eingeladene Freunde">{selectedUsers.map(user => <Chip key={user.id}><span>{user.username}</span><RemoveButton onClick={() => removeUser(user.id)} aria-label={`${user.username} entfernen`}><X size={17} /></RemoveButton></Chip>)}</ChipList>}
          <Hint>{1 + selectedUsers.length} von 8 Plätzen reserviert (inkl. dir).{selectedUsers.length === 7 && " Entferne jemanden, um andere Freunde einzuladen."}</Hint>
        </Section>
        <Disclosure open={extrasOpen} onToggle={event => setExtrasOpen(event.currentTarget.open)}><summary>Titel & Nachricht hinzufügen <small>optional</small></summary><DisclosureFields>
          <Field><label htmlFor="ice-date-title">Titel</label><input id="ice-date-title" value={title} onChange={event => setTitle(event.target.value)} placeholder="z. B. Feierabendeis" maxLength={120} /></Field>
          <Field><label htmlFor="ice-date-note">Nachricht</label><textarea id="ice-date-note" value={note} onChange={event => setNote(event.target.value)} placeholder="Treffpunkt oder kurze Nachricht" maxLength={2000} rows={3} /></Field>
        </DisclosureFields></Disclosure>
        <ButtonRow><ShopButton type="submit" $primary disabled={busy || !selectedShop || Boolean(shopError)}>{busy ? "Wird erstellt …" : isLoggedIn ? "Eis-Date erstellen" : "Anmelden & erstellen"}</ShopButton><QuietButton onClick={() => { draftActive.current = false; clearDraft(); resetForm(); resetFeedback(); navigate("/ice-date"); }}>Abbrechen</QuietButton></ButtonRow>
      </CreateCard> : privateGuest || (!isDetail && !isLoggedIn) ? <Card><SectionHeading>Gemeinsam Eis essen</SectionHeading><Hint>Melde dich an, um deine Eis-Dates und Einladungen zu sehen.</Hint><ShopButton $primary onClick={login}>Anmelden</ShopButton></Card>
      : loading && (isDetail ? !currentDate : dates.length === 0) ? <Card role="status">Eis-Dates werden geladen …</Card>
      : loadError ? <Card><p role="alert">{loadError}</p><ShopButton onClick={() => setReload(value => value + 1)}>Erneut laden</ShopButton></Card>
      : isDetail && currentDate ? <DateDetail date={currentDate} shareUrl={shareUrl} busy={busy} shareBusy={shareBusy} shareError={shareError} copied={copied} isLoggedIn={isLoggedIn} created={location.state?.created}
          onRsvp={handleRsvp} onShare={handleShare} onCopy={handleCopy} onCancel={handleCancel} onCheckin={() => setShowCheckin(true)} />
      : <><ListHead><ShopButton as={Link} to="/ice-date/new" $primary><CalendarDays size={17} /> Neues Eis-Date</ShopButton><QuietButton onClick={() => setReload(value => value + 1)} disabled={loading}>Aktualisieren</QuietButton></ListHead>
        {dates.length === 0 ? <Card><SectionHeading>Das nächste Eis schmeckt zusammen.</SectionHeading><Hint>Wähle eine Eisdiele und lade deine Freunde ein.</Hint></Card>
        : <><DateGroup title="Kommende Treffen" dates={grouped.upcoming} empty="Gerade ist kein Treffen geplant." /><DateGroup title="Vergangene & abgesagte Treffen" dates={grouped.past} /></>}
      </>}
    </Content>
    {showCheckin && date && <CheckinForm shopId={date.shop_id} shopName={date.shop_name} userId={userId} showCheckinForm={showCheckin} setShowCheckinForm={setShowCheckin}
      onSuccess={() => setReload(value => value + 1)} />}
  </Page>;
}

function OpeningInfo({ shop, checking = false }) {
  const state = shop.is_open_at_start;
  return <OpeningContainer>
    <OpeningState $state={checking ? null : state} role="status">{checking ? "Öffnungszeiten zum Termin werden geprüft …" : state === true ? "Laut Öffnungszeiten zum Termin geöffnet" : state === false ? "Zum Termin voraussichtlich geschlossen – bitte prüfe die Öffnungszeiten." : "Öffnungszeiten zum Termin nicht bekannt."}</OpeningState>
    <Disclosure><summary>Alle Öffnungszeiten</summary><OpeningHours eisdiele={{ ...shop, is_open_now: undefined }} /></Disclosure>
  </OpeningContainer>;
}

function DateDetail({ date, shareUrl, busy, shareBusy, shareError, copied, isLoggedIn, created, onRsvp, onShare, onCopy, onCancel, onCheckin }) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const shareRef = useRef(null);
  useEffect(() => { if (created) shareRef.current?.focus(); }, [created, date.id]);
  const counts = reservationCounts(date);
  const reserved = date.is_organizer || ["invited", "going", "maybe"].includes(date.viewer_status);
  const full = counts.free === 0 && !reserved;
  const shop = { name: date.shop_name, openingHours: date.shop_opening_hours, openingHoursStructured: date.shop_opening_hours_structured,
    opening_hours_note: date.shop_opening_hours_note, status: date.shop_status, reopening_date: date.shop_reopening_date, is_open_at_start: date.shop_is_open_at_start };
  const invitation = date.status === "planned" && <ShareBox aria-labelledby="ice-date-invite"><SectionHeading id="ice-date-invite">Einladung teilen</SectionHeading>
    <Hint>Freunde können über den Link nach dem Login teilnehmen.</Hint>
    <ButtonRow><ShopButton ref={shareRef} $primary={date.is_organizer} onClick={onShare} disabled={shareBusy}><Share2 size={17} /> Einladung teilen</ShopButton><ShopButton onClick={onCopy} disabled={shareBusy}><Copy size={17} /> {copied ? "Kopiert" : "Link kopieren"}</ShopButton></ButtonRow>
    {copied && <Hint role="status">Einladungslink kopiert.</Hint>}{shareError && <InlineError role="alert">{shareError}</InlineError>}
    {shareError && <Field><label htmlFor="ice-date-invite-link">Einladungslink</label><input id="ice-date-invite-link" readOnly value={shareUrl} onFocus={event => event.target.select()} /></Field>}
  </ShareBox>;
  return <Card as="article" data-ice-date-detail>
    <DetailTop><div><Kicker>{date.status === "completed" ? "Gemeinsamer Besuch" : "Eis-Date"}</Kicker><DetailTitle>{date.title || `Eis-Date bei ${date.shop_name}`}</DetailTitle></div><Status $tone={date.status}>{date.status === "planned" ? `${date.going_count} dabei` : date.status === "completed" ? "Abgeschlossen" : "Abgesagt"}</Status></DetailTop>
    <DateTime><CalendarDays size={19} aria-hidden="true" /><strong>{formatDate(date.starts_at)}</strong></DateTime>
    <ShopPreview><MapPin size={19} aria-hidden="true" /><div><Link to={`/shop/${date.shop_id}`}><strong>{date.shop_name}</strong><span>{date.shop_address}</span></Link></div></ShopPreview>
    <OpeningInfo shop={shop} />
    {date.note && <Note>{date.note}</Note>}
    {date.status === "planned" && <>
      <Hint>{counts.free > 0 ? `${counts.free} ${counts.free === 1 ? "Platz frei" : "Plätze frei"} · ${counts.reserved} von ${counts.capacity} reserviert.` : `Alle ${counts.capacity} Plätze sind reserviert.`} Auch Einladungen und „Vielleicht“ zählen.</Hint>
      {date.is_organizer && invitation}
      <Section aria-labelledby="ice-date-response"><SectionHeading id="ice-date-response">Deine Antwort{date.viewer_status ? `: ${RSVP_LABELS[date.viewer_status]}` : ""}</SectionHeading>
        {!isLoggedIn ? <><Hint>Melde dich an, um zu antworten. Du kommst danach hierher zurück.</Hint><ShopButton $primary onClick={login}>Anmelden & antworten</ShopButton></>
        : <><RsvpRow>{["going", "maybe", "declined"].map(status => <ShopButton key={status} onClick={() => onRsvp(status)} disabled={busy || (full && status !== "declined")}
          aria-pressed={date.viewer_status === status} $primary={date.viewer_status === status || (!date.viewer_status && status === "going")}>{RSVP_LABELS[status]}</ShopButton>)}</RsvpRow>
          {full && <Hint>Du kannst zusagen, sobald ein Platz frei wird.</Hint>}</>}
      </Section>
    </>}
    <Section aria-labelledby="ice-date-participants"><SectionHeading id="ice-date-participants">Teilnehmende</SectionHeading>
      <ParticipantList>{date.participants.map(participant => <Participant key={participant.user_id}>
        <UserAvatar userId={participant.user_id} name={participant.username} avatarUrl={participant.avatar_url} size={44} />
        <ParticipantName><strong>{participant.username}</strong>{participant.role === "organizer" && <small>Organisation</small>}</ParticipantName>
        <Status $tone={participant.status}>{RSVP_LABELS[participant.status]}</Status>
      </Participant>)}</ParticipantList>
    </Section>
    {date.status === "planned" && <Section aria-labelledby="ice-date-checkins"><SectionHeading id="ice-date-checkins"><IceCreamCone size={19} /> Gemeinsam einchecken</SectionHeading>
      <Hint>Nach eurer Zusage zählen Check-ins an dieser Eisdiele automatisch zum Treffen – 24 Stunden vor und nach dem Termin.</Hint>
      {date.checkin_count > 0 && <Hint>{date.checkin_count} gemeinsame Check-ins gespeichert.</Hint>}
      {isLoggedIn && date.can_checkin && <ShopButton $primary onClick={onCheckin}>Jetzt einchecken</ShopButton>}
    </Section>}
    {date.status === "completed" && <Notice role="status"><Check size={18} /> Ihr habt euren gemeinsamen Besuch mit {date.checkin_count} Check-ins festgehalten.</Notice>}
    {date.status === "cancelled" && <Hint>Dieses Treffen wurde abgesagt. Die Angaben bleiben hier erhalten.</Hint>}
    {!date.is_organizer && invitation}
    {date.is_organizer && date.status === "planned" && <CancelArea>
      {confirmCancel ? <><p>Eis-Date wirklich absagen? Die eingeladenen Freunde werden benachrichtigt.</p><ButtonRow><DangerButton onClick={onCancel} disabled={busy}>Ja, Eis-Date absagen</DangerButton><ShopButton onClick={() => setConfirmCancel(false)} disabled={busy}>Treffen behalten</ShopButton></ButtonRow></>
      : <DangerButton onClick={() => setConfirmCancel(true)} disabled={busy}>Eis-Date absagen</DangerButton>}
    </CancelArea>}
  </Card>;
}

function DateGroup({ title, dates, empty }) {
  if (!dates.length && !empty) return null;
  return <ListSection><SectionHeading>{title}</SectionHeading>{dates.length ? <DateList>{dates.map(date => <DateCard key={date.id} to={`/ice-date?id=${date.id}`}>
    <DateCardTop><strong>{date.title || date.shop_name}</strong><Status $tone={date.status}>{date.status === "completed" ? "Abgeschlossen" : date.status === "cancelled" ? "Abgesagt" : `${date.going_count} dabei`}</Status></DateCardTop>
    {date.title && <span>{date.shop_name}</span>}<DateCardTime><CalendarDays size={16} aria-hidden="true" />{formatDate(date.starts_at)}</DateCardTime>
    {date.viewer_status && <small>Deine Antwort: {RSVP_LABELS[date.viewer_status]}</small>}
  </DateCard>)}</DateList> : <Hint>{empty}</Hint>}</ListSection>;
}

const Page = styled.div`min-height:100vh;background:#fff8ee;color:${SHOP_COLORS.text};`;
const Content = styled.main`max-width:800px;margin:0 auto;padding:22px 16px 40px;overflow-wrap:anywhere;
  *,*::before,*::after{box-sizing:border-box;}button,a,input,textarea,summary{touch-action:manipulation;}
  :is(button,a,input,textarea,summary):focus-visible{outline:3px solid #986b0e;outline-offset:3px;}
  @media(max-width:390px){padding:18px 12px 32px;}
`;
const PageHead = styled.div`display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:8px;min-width:0;
  >div{min-width:0;}h1{margin:0;font-size:clamp(1.4rem,4vw,1.9rem);font-weight:700;line-height:1.2;}
  @media(max-width:480px){flex-wrap:wrap;}`;
const Subline = styled.p`margin:8px 0 0;color:${SHOP_COLORS.muted};font-size:.92rem;line-height:1.5;`;
const QuietButton = styled(ShopButton)`border-color:transparent;background:transparent;color:${SHOP_COLORS.muted};padding:9px 10px;`;
const PageTools = styled.div`display:flex;justify-content:space-between;align-items:center;gap:8px;margin:4px 0 8px;`;
const BackLink = styled(Link)`display:inline-flex;align-items:center;min-height:44px;color:${SHOP_COLORS.muted};font-size:.87rem;`;
const Card = styled(ShopPanel)`display:grid;gap:18px;margin-top:12px;
  h2{margin:0;}p{margin:0;}>*{min-width:0;}
  @media(max-width:390px){padding:16px;}`;
const CreateCard = styled(Card)`gap:18px;`;
const Section = styled.section`display:grid;gap:12px;min-width:0;`;
const SectionHeading = styled.h2`&&{display:flex;align-items:center;gap:8px;font-size:1.04rem;font-weight:650;margin:0;line-height:1.35;}`;
const Hint = styled.p`margin:0;color:${SHOP_COLORS.muted};font-size:.85rem;line-height:1.5;`;
const Field = styled.div`display:grid;gap:6px;min-width:0;label{font-size:.9rem;font-weight:600;}
  input,textarea{width:100%;min-width:0;min-height:44px;border:1px solid #ddd4c2;border-radius:10px;padding:10px 12px;background:#fff;color:inherit;font:inherit;}
  textarea{resize:vertical;}input[readonly]{font-size:.82rem;}
`;
const ShopPreview = styled.div`display:flex;gap:10px;align-items:center;padding:12px;border-radius:12px;background:#fbf7ef;min-width:0;
  >svg{flex-shrink:0;color:#866527;} >div{display:grid;gap:5px;flex:1;min-width:0;}
  a{color:inherit;text-decoration:none;display:grid;align-content:center;gap:5px;min-height:44px;}strong{font-weight:600;}
  span{color:${SHOP_COLORS.muted};font-size:.85rem;line-height:1.4;}button{flex-shrink:0;}
`;
const Disclosure = styled.details`min-width:0;summary{min-height:44px;cursor:pointer;align-content:center;color:${SHOP_COLORS.muted};font-size:.86rem;line-height:1.4;}
  small{font-size:.8rem;margin-left:6px;}[open] summary{margin-bottom:8px;}
`;
const DisclosureFields = styled.div`display:grid;gap:12px;padding-top:10px;`;
const OpeningContainer = styled.div`display:grid;gap:2px;min-width:0;`;
const OpeningState = styled.p`margin:0;color:${({ $state }) => $state === false ? "#915b16" : $state === true ? "#386945" : SHOP_COLORS.muted};font-size:.84rem;line-height:1.5;`;
const ChipList = styled.div`display:flex;gap:8px;flex-wrap:wrap;min-width:0;`;
const Chip = styled.div`display:inline-flex;align-items:center;max-width:100%;gap:8px;padding-left:12px;background:#fff3da;border:1px solid #ebdbb9;border-radius:12px;font-size:.87rem;span{min-width:0;}`;
const RemoveButton = styled(ShopButton)`min-width:44px;padding:0;border:0;border-radius:10px;background:transparent;flex-shrink:0;`;
const ButtonRow = styled.div`display:flex;gap:8px;flex-wrap:wrap;align-items:center;>*{max-width:100%;}`;
const RsvpRow = styled.div`display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;button{padding:10px 8px;min-width:0;}button[aria-pressed=true]{box-shadow:inset 0 0 0 1px #946813;}`;
const Notice = styled.div`display:flex;align-items:flex-start;gap:8px;padding:12px 14px;border-radius:12px;margin:12px 0;background:${({ $error }) => $error ? "#fff0ec" : "#eff7ef"};color:${({ $error }) => $error ? "#923c28" : "#386945"};line-height:1.5;font-size:.9rem;svg{flex-shrink:0;margin-top:2px;}`;
const InlineError = styled.div`display:flex;gap:8px;align-items:center;flex-wrap:wrap;color:#923c28;font-size:.86rem;line-height:1.5;`;
const DetailTop = styled.div`display:flex;align-items:flex-start;justify-content:space-between;gap:10px;>div{min-width:0;}`;
const DetailTitle = styled.h2`&&{display:block;margin:5px 0 0;font-size:clamp(1.2rem,3vw,1.6rem);font-weight:700;line-height:1.25;}`;
const Kicker = styled.span`color:${SHOP_COLORS.muted};font-size:.79rem;`;
const Status = styled.span`display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;max-width:100%;padding:5px 8px;border-radius:999px;font-size:.76rem;line-height:1.35;
  background:${({ $tone }) => ["completed","going"].includes($tone) ? "#eaf5ec" : ["cancelled","declined"].includes($tone) ? "#f8eeeb" : "#fff3da"};
  color:${({ $tone }) => ["completed","going"].includes($tone) ? "#386945" : ["cancelled","declined"].includes($tone) ? "#923c28" : "#78560e"};
`;
const DateTime = styled.div`display:flex;align-items:flex-start;gap:8px;font-size:1rem;line-height:1.5;svg{flex-shrink:0;margin-top:3px;}`;
const Note = styled.p`padding:12px;border-left:3px solid #ffb522;background:#fffaf0;border-radius:0 8px 8px 0;white-space:pre-wrap;font-size:.92rem;`;
const ParticipantList = styled.div`display:grid;gap:8px;`;
const Participant = styled.div`display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:10px;align-items:center;padding:8px 0;min-width:0;border-bottom:1px solid #f0e9dd;&:last-child{border-bottom:0;}`;
const ParticipantName = styled.div`display:grid;gap:4px;min-width:0;strong{font-size:.91rem;font-weight:600;}small{font-size:.76rem;color:${SHOP_COLORS.muted};}`;
const ShareBox = styled.section`display:grid;gap:12px;padding:16px;border:1px solid #ebdbb9;border-radius:12px;background:#fffcf5;min-width:0;`;
const CancelArea = styled.div`display:grid;gap:10px;border-top:1px solid ${SHOP_COLORS.border};padding-top:12px;font-size:.9rem;`;
const DangerButton = styled(ShopButton)`color:#923c28;border-color:#eed5ca;background:transparent;justify-self:start;`;
const ListHead = styled.div`display:flex;justify-content:space-between;gap:8px;align-items:center;margin:16px 0;`;
const ListSection = styled.section`display:grid;gap:12px;margin:24px 0;`;
const DateList = styled.div`display:grid;gap:10px;`;
const DateCard = styled(Link)`display:grid;gap:8px;padding:16px;border:1px solid ${SHOP_COLORS.border};border-radius:14px;background:#fff;color:inherit;text-decoration:none;
  min-width:0;&:hover{border-color:#bf9d57;}span,small{font-size:.85rem;color:${SHOP_COLORS.muted};}`;
const DateCardTop = styled.div`display:flex;justify-content:space-between;gap:10px;align-items:flex-start;strong{min-width:0;font-weight:650;}`;
const DateCardTime = styled.div`display:flex;gap:7px;align-items:center;font-size:.9rem;svg{flex-shrink:0;}`;
