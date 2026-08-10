import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { CalendarDays, Check, Copy, Link as LinkIcon, MapPinned, Share2, UserPlus, X } from "lucide-react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Header from "../Header";
import Seo from "../components/Seo";
import OpeningHours from "../components/OpeningHours";
import { useUser } from "../context/UserContext";
import { searchUsers } from "../utils/searchUsers";
import { trackEvent } from "../utils/analytics";
import { formatOpeningHoursLines, hydrateOpeningHours } from "../utils/openingHours";

const apiBase = import.meta.env.VITE_API_BASE_URL;

const readJson = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.status === "error") {
    throw new Error(data.message || `HTTP ${response.status}`);
  }
  return data;
};

const authHeaders = (authToken) => authToken ? { Authorization: `Bearer ${authToken}` } : {};

const formatDate = (value) => value ? new Date(value.replace(" ", "T")).toLocaleString("de-DE", {
  weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
}) : "–";

const toLocalInput = () => {
  const date = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  date.setHours(18, 0, 0, 0);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toApiDate = (value) => value ? value.replace("T", " ") + (value.length === 16 ? ":00" : "") : "";

const hasOpeningHours = (shop) => {
  if (!shop) return false;
  const structured = hydrateOpeningHours(shop.openingHoursStructured, shop.opening_hours_note || "");
  return formatOpeningHoursLines(structured).length > 0 || Boolean(String(shop.openingHours || "").trim());
};

const ShopOpeningHours = ({ shop }) => {
  if (!hasOpeningHours(shop)) return null;
  return <OpeningHoursCard><OpeningHours eisdiele={shop} /></OpeningHoursCard>;
};

function IceDate() {
  const { token } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userId, authToken, isLoggedIn } = useUser();
  const isCreate = location.pathname === "/ice-date/new";
  const dateId = searchParams.get("id");
  const shopId = searchParams.get("shopId");
  const isPrivateDetail = Boolean(dateId && !token);
  const [dates, setDates] = useState([]);
  const [date, setDate] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [startsAt, setStartsAt] = useState(toLocalInput);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => date?.invite_token ? `${window.location.origin}/ice-date/${date.invite_token}` : "", [date]);

  const loadDate = async () => {
    if (!apiBase) return;
    const query = token ? `?token=${encodeURIComponent(token)}` : `?id=${encodeURIComponent(dateId)}`;
    const response = await fetch(`${apiBase}/api/ice_date_detail.php${query}`, token ? {} : { headers: authHeaders(authToken) });
    const data = await readJson(response);
    setDate(data.ice_date);
  };

  const loadList = async () => {
    const response = await fetch(`${apiBase}/api/ice_date_list.php`, { headers: authHeaders(authToken) });
    const data = await readJson(response);
    setDates(Array.isArray(data.ice_dates) ? data.ice_dates : []);
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (isPrivateDetail && !isLoggedIn) {
        setDate(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        if (isCreate) {
          if (shopId) {
            const response = await fetch(`${apiBase}/api/ice_date_shop.php?shop_id=${encodeURIComponent(shopId)}`);
            const data = await readJson(response);
            if (!cancelled) setShop(data.shop);
          }
        } else if (token || dateId) {
          await loadDate();
        } else if (isLoggedIn) {
          await loadList();
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || "Eis-Date konnte nicht geladen werden.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [apiBase, authToken, dateId, isCreate, isLoggedIn, isPrivateDetail, shopId, token]);

  useEffect(() => {
    if (!apiBase || userQuery.trim().length < 2 || selectedUsers.length >= 7) {
      setUserResults([]);
      return undefined;
    }
    const controller = new AbortController();
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const results = await searchUsers(apiBase, userQuery, { signal: controller.signal });
        const selectedIds = new Set(selectedUsers.map((user) => Number(user.id)));
        setUserResults((Array.isArray(results) ? results : []).filter((user) => Number(user.id) !== Number(userId) && !selectedIds.has(Number(user.id))));
      } catch (searchError) {
        if (searchError.name !== "AbortError") setUserResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [apiBase, selectedUsers, userId, userQuery]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!isLoggedIn) {
      window.dispatchEvent(new CustomEvent("auth:open-login"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase}/api/ice_date_create.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(authToken) },
        body: JSON.stringify({
          shop_id: Number(shopId),
          starts_at: toApiDate(startsAt),
          title,
          note,
          participant_user_ids: selectedUsers.map((user) => Number(user.id)),
        }),
      });
      const data = await readJson(response);
      setDate(data.ice_date);
      setNotice("Eis-Date erstellt. Teile jetzt den Einladungslink.");
      trackEvent("ice_date", "created");
      navigate(`/ice-date?id=${data.ice_date.id}`, { replace: true });
    } catch (createError) {
      setError(createError.message || "Eis-Date konnte nicht erstellt werden.");
    } finally {
      setBusy(false);
    }
  };

  const handleRsvp = async (status) => {
    if (!isLoggedIn) {
      window.dispatchEvent(new CustomEvent("auth:open-login"));
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`${apiBase}/api/ice_date_rsvp.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(authToken) },
        body: JSON.stringify({ ice_date_id: date.id, status }),
      });
      const data = await readJson(response);
      setDate(data.ice_date);
      setNotice(status === "going" ? "Du bist dabei!" : status === "maybe" ? "Als Vielleicht vorgemerkt." : "Du bist nicht dabei.");
      trackEvent("ice_date", "rsvp", status);
    } catch (rsvpError) {
      setError(rsvpError.message || "Teilnahmestatus konnte nicht gespeichert werden.");
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setNotice("Einladungslink kopiert.");
      trackEvent("ice_date", "invite_link_copied");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Der Link konnte nicht kopiert werden.");
    }
  };

  const handleShare = async () => {
    if (!shareUrl) return;
    if (navigator.share) {
      await navigator.share({ title: date?.title || "Eis-Date", text: "Kommst du mit Eis essen?", url: shareUrl });
      trackEvent("ice_date", "invite_shared");
    } else {
      await handleCopy();
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Eis-Date wirklich absagen?")) return;
    setBusy(true);
    try {
      const response = await fetch(`${apiBase}/api/ice_date_cancel.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(authToken) },
        body: JSON.stringify({ ice_date_id: date.id }),
      });
      await readJson(response);
      setDate((previous) => ({ ...previous, status: "cancelled" }));
      setNotice("Eis-Date abgesagt.");
    } catch (cancelError) {
      setError(cancelError.message || "Eis-Date konnte nicht abgesagt werden.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <Seo title="Eis-Dates | Ice-App" description="Gemeinsam Eis essen planen, Freunde einladen und zusammen einchecken." canonical="/ice-date" />
      <Header />
      <Content>
        <HeroCard>
          <HeroTitle>Gemeinsam Eis essen</HeroTitle>
          <HeroText>Plane ein Eis-Date, lade Freunde ein und haltet euren gemeinsamen Besuch mit Check-ins fest.</HeroText>
        </HeroCard>

        {error && <Notice $tone="error">{error}</Notice>}
        {notice && <Notice $tone="success">{notice}</Notice>}

        {isCreate ? (
          <CreateCard onSubmit={handleCreate}>
            <SectionTitle>Eis-Date planen</SectionTitle>
            {shop ? (
              <>
                <ShopPreview><MapPinned size={18} /><div><strong>{shop.name}</strong><span>{shop.adresse}</span></div></ShopPreview>
                <ShopOpeningHours shop={shop} />
              </>
            ) : <Notice>Wähle zuerst eine Eisdiele auf der Karte oder über eine Challenge.</Notice>}
            <Field><label htmlFor="ice-date-start">Termin</label><input id="ice-date-start" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required /></Field>
            <Field><label htmlFor="ice-date-title">Titel <small>optional</small></label><input id="ice-date-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="z. B. Feierabendeis" maxLength={120} /></Field>
            <Field><label htmlFor="ice-date-note">Notiz <small>optional</small></label><textarea id="ice-date-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Treffpunkt oder kurze Nachricht" maxLength={2000} rows={3} /></Field>
            <Field>
              <label htmlFor="ice-date-users">Freunde einladen <small>bis zu 7 weitere Personen</small></label>
              <input id="ice-date-users" value={userQuery} onChange={(event) => setUserQuery(event.target.value)} placeholder="Nutzername suchen" />
              {searching && <Hint>Suche läuft …</Hint>}
              {userResults.length > 0 && <SearchList>{userResults.map((user) => <SearchButton key={user.id} type="button" onClick={() => { setSelectedUsers((previous) => [...previous, user]); setUserQuery(""); setUserResults([]); }}><UserPlus size={15} />{user.username}</SearchButton>)}</SearchList>}
              {selectedUsers.length > 0 && <ChipList>{selectedUsers.map((user) => <Chip key={user.id}>{user.username}<button type="button" onClick={() => setSelectedUsers((previous) => previous.filter((entry) => entry.id !== user.id))}><X size={13} /></button></Chip>)}</ChipList>}
            </Field>
            <ButtonRow><PrimaryButton type="submit" disabled={busy || !shopId}>{busy ? "Erstelle …" : "Eis-Date erstellen"}</PrimaryButton><SecondaryButton type="button" onClick={() => navigate("/ice-date")}>Abbrechen</SecondaryButton></ButtonRow>
          </CreateCard>
        ) : token || dateId ? (
          isPrivateDetail && !isLoggedIn ? <StateBox>Logge dich ein, um dieses Eis-Date zu sehen.</StateBox> : loading ? <StateBox>Lade Eis-Date …</StateBox> : date ? <DateDetail date={date} shareUrl={shareUrl} busy={busy} onRsvp={handleRsvp} onCopy={handleCopy} onShare={handleShare} onCancel={handleCancel} copied={copied} isLoggedIn={isLoggedIn} /> : <StateBox>Eis-Date nicht gefunden.</StateBox>
        ) : !isLoggedIn ? (
          <StateBox>Logge dich ein, um Eis-Dates zu planen und Einladungen zu verwalten.</StateBox>
        ) : (
          <>
            <SectionHead><div><SectionTitle>Deine Eis-Dates</SectionTitle><SectionSubline>Private Treffen mit Freunden – ohne Wettbewerbsdruck.</SectionSubline></div><PrimaryButton as={Link} to="/ice-date/new"><CalendarDays size={16} /> Neues Eis-Date</PrimaryButton></SectionHead>
            {loading ? <StateBox>Lade Eis-Dates …</StateBox> : dates.length === 0 ? <StateBox>Noch kein Eis-Date geplant. Starte direkt über eine Eisdiele oder Challenge.</StateBox> : <DateList>{dates.map((entry) => <DateCard key={entry.id} onClick={() => navigate(`/ice-date?id=${entry.id}`)}><DateCardTop><strong>{entry.title || "Eis-Date"}</strong><Status $tone={entry.status}>{entry.status === "completed" ? "Abgeschlossen" : entry.status === "cancelled" ? "Abgesagt" : `${entry.going_count} dabei`}</Status></DateCardTop><span>{entry.shop_name}</span><small>{formatDate(entry.starts_at)}</small></DateCard>)}</DateList>}
          </>
        )}
      </Content>
    </Page>
  );
}

function DateDetail({ date, shareUrl, busy, onRsvp, onCopy, onShare, onCancel, copied, isLoggedIn }) {
  const viewerStatus = date.viewer_status;
  return <DetailCard>
    <DetailTop><div><Kicker>{date.status === "completed" ? "Gemeinsamer Check-in" : "Eis-Date"}</Kicker><DetailTitle>{date.title || "Eis-Date"}</DetailTitle></div><Status $tone={date.status}>{date.status === "planned" ? `${date.going_count} dabei` : date.status === "completed" ? "Abgeschlossen" : "Abgesagt"}</Status></DetailTop>
    <ShopPreview><MapPinned size={18} /><div><strong>{date.shop_name}</strong><span>{date.shop_address}</span></div></ShopPreview>
    <ShopOpeningHours shop={{
      openingHours: date.shop_opening_hours,
      openingHoursStructured: date.shop_opening_hours_structured,
      opening_hours_note: date.shop_opening_hours_note,
      status: date.shop_status,
      reopening_date: date.shop_reopening_date,
      is_open_now: date.shop_is_open_now,
    }} />
    <InfoGrid><InfoItem><CalendarDays size={16} /><span>{formatDate(date.starts_at)}</span></InfoItem><InfoItem><Check size={16} /><span>{date.checkin_count} von {date.participants.length} eingecheckt</span></InfoItem></InfoGrid>
    {date.note && <Note>{date.note}</Note>}
    <ParticipantList>{date.participants.map((participant) => <Participant key={participant.user_id}><span>{participant.username}{participant.role === "organizer" ? " · Organisation" : ""}</span><Status $tone={participant.status}>{participant.status === "going" ? "Dabei" : participant.status === "maybe" ? "Vielleicht" : participant.status === "declined" ? "Nicht dabei" : "Eingeladen"}</Status></Participant>)}</ParticipantList>
    {date.status === "planned" && <ButtonRow><PrimaryButton type="button" onClick={() => onRsvp("going")} disabled={busy || !isLoggedIn} $active={viewerStatus === "going"}><Check size={16} /> Dabei</PrimaryButton><SecondaryButton type="button" onClick={() => onRsvp("maybe")} disabled={busy || !isLoggedIn} $active={viewerStatus === "maybe"}>Vielleicht</SecondaryButton><GhostButton type="button" onClick={() => onRsvp("declined")} disabled={busy || !isLoggedIn} $active={viewerStatus === "declined"}>Nicht dabei</GhostButton></ButtonRow>}
    {!isLoggedIn && <Hint>Zum Antworten bitte einloggen.</Hint>}
    <ShareBox><strong>Einladung teilen</strong><span>Freunde können den Link öffnen und nach dem Login zusagen.</span><ButtonRow><SecondaryButton type="button" onClick={onShare}><Share2 size={15} /> Teilen</SecondaryButton><SecondaryButton type="button" onClick={onCopy}><Copy size={15} /> {copied ? "Kopiert" : "Link kopieren"}</SecondaryButton></ButtonRow><LinkPreview><LinkIcon size={14} />{shareUrl}</LinkPreview></ShareBox>
    {date.is_organizer && date.status === "planned" && <CancelButton type="button" onClick={onCancel} disabled={busy}>Eis-Date absagen</CancelButton>}
  </DetailCard>;
}

export default IceDate;

const Page = styled.div`min-height:100vh;background:linear-gradient(180deg,#fffaf0 0%,#fff7e7 100%);`;
const Content = styled.main`width:min(96%,760px);margin:0 auto;padding:1rem 0 2rem;`;
const HeroCard = styled.section`background:#fffdf6;border:1px solid rgba(47,33,0,.08);border-radius:18px;padding:1.1rem;margin-bottom:1rem;box-shadow:0 10px 28px rgba(28,20,0,.07);`;
const HeroTitle = styled.h1`margin:0;color:#2f2100;font-size:clamp(1.45rem,3vw,2rem);`;
const HeroText = styled.p`margin:.45rem 0 0;color:rgba(47,33,0,.7);line-height:1.5;`;
const SectionTitle = styled.h2`margin:0;color:#2f2100;font-size:1.15rem;`;
const SectionSubline = styled.p`margin:.25rem 0 0;color:rgba(47,33,0,.65);`;
const SectionHead = styled.div`display:flex;justify-content:space-between;align-items:flex-start;gap:.8rem;margin:0 0 1rem;flex-wrap:wrap;`;
const CreateCard = styled.form`display:grid;gap:.85rem;background:#fffdf6;border:1px solid rgba(47,33,0,.08);border-radius:18px;padding:1rem;box-shadow:0 10px 28px rgba(28,20,0,.07);`;
const DetailCard = styled.article`display:grid;gap:.85rem;background:#fffdf6;border:1px solid rgba(47,33,0,.08);border-radius:18px;padding:1rem;box-shadow:0 10px 28px rgba(28,20,0,.07);`;
const DetailTop = styled.div`display:flex;justify-content:space-between;gap:.8rem;align-items:flex-start;`;
const Kicker = styled.div`font-size:.78rem;text-transform:uppercase;letter-spacing:.06em;color:#97630b;font-weight:800;`;
const DetailTitle = styled.h2`margin:.2rem 0 0;color:#2f2100;`;
const ShopPreview = styled.div`display:flex;gap:.6rem;align-items:flex-start;padding:.75rem;border-radius:13px;background:#fff8e6;color:#6d4900;& > div{display:grid;gap:.15rem;} span{font-size:.88rem;color:rgba(47,33,0,.65);}`;
const OpeningHoursCard = styled.div`padding:.7rem .75rem;border-radius:13px;background:rgba(255,248,230,.72);color:#5b4520;font-size:.88rem;line-height:1.45;& strong{color:#6d4900;}`;
const Field = styled.div`display:grid;gap:.35rem;position:relative;label{font-weight:800;color:#503000;font-size:.92rem;}small{font-weight:500;color:#8a6a37;}input,textarea{font:inherit;border:1px solid rgba(80,48,0,.2);border-radius:10px;padding:.65rem;background:#fff;color:#2f2100;}textarea{resize:vertical;}`;
const SearchList = styled.div`display:grid;gap:.25rem;margin-top:.35rem;`;
const SearchButton = styled.button`display:flex;align-items:center;gap:.4rem;border:1px solid rgba(80,48,0,.12);background:#fff8e6;padding:.55rem .7rem;border-radius:9px;text-align:left;color:#503000;cursor:pointer;`;
const ChipList = styled.div`display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.4rem;`;
const Chip = styled.span`display:inline-flex;align-items:center;gap:.35rem;padding:.35rem .55rem;border-radius:999px;background:#e9f5ec;color:#205b32;font-size:.85rem;button{display:inline-flex;border:0;background:transparent;cursor:pointer;color:inherit;padding:0;}`;
const InfoGrid = styled.div`display:flex;gap:.65rem;flex-wrap:wrap;`;
const InfoItem = styled.div`display:flex;align-items:center;gap:.35rem;border-radius:999px;background:rgba(255,181,34,.14);padding:.4rem .65rem;color:#6d4900;font-size:.88rem;`;
const Note = styled.p`margin:0;padding:.7rem;border-left:3px solid #ffb522;background:#fff8e6;color:#5b4520;white-space:pre-wrap;`;
const ParticipantList = styled.div`display:grid;gap:.4rem;`;
const Participant = styled.div`display:flex;justify-content:space-between;gap:.6rem;align-items:center;padding:.55rem .65rem;border-radius:10px;background:rgba(47,33,0,.04);font-size:.9rem;`;
const Status = styled.span`display:inline-flex;white-space:nowrap;padding:.25rem .55rem;border-radius:999px;font-size:.76rem;font-weight:800;background:${({$tone}) => $tone === "completed" || $tone === "going" ? "#e7f6eb" : $tone === "cancelled" || $tone === "declined" ? "#fbe9e9" : "#fff2cd"};color:${({$tone}) => $tone === "completed" || $tone === "going" ? "#23643a" : $tone === "cancelled" || $tone === "declined" ? "#8a2d2d" : "#735000"};`;
const ShareBox = styled.div`display:grid;gap:.35rem;border-top:1px solid rgba(47,33,0,.1);padding-top:.85rem;span{font-size:.86rem;color:rgba(47,33,0,.65);}`;
const LinkPreview = styled.div`display:flex;gap:.35rem;align-items:center;overflow:hidden;color:#1652b8;font-size:.78rem;white-space:nowrap;text-overflow:ellipsis;`;
const DateList = styled.div`display:grid;gap:.65rem;`;
const DateCard = styled.button`display:grid;gap:.25rem;text-align:left;border:1px solid rgba(47,33,0,.1);border-radius:14px;padding:.8rem;background:#fffdf6;color:#2f2100;cursor:pointer;&:hover{border-color:#ffb522;}`;
const DateCardTop = styled.div`display:flex;justify-content:space-between;gap:.6rem;align-items:center;`;
const StateBox = styled.div`padding:1rem;border-radius:14px;background:rgba(255,255,255,.75);border:1px solid rgba(47,33,0,.08);color:#6c5830;`;
const Notice = styled.div`padding:.75rem .85rem;border-radius:12px;background:${({$tone}) => $tone === "error" ? "#ffe9e9" : "#e8f7ec"};color:${({$tone}) => $tone === "error" ? "#8b1e1e" : "#185c2b"};margin-bottom:.75rem;`;
const Hint = styled.p`margin:0;color:#7b6339;font-size:.85rem;`;
const ButtonRow = styled.div`display:flex;gap:.55rem;flex-wrap:wrap;align-items:center;`;
const PrimaryButton = styled.button`display:inline-flex;align-items:center;justify-content:center;gap:.35rem;border:0;border-radius:11px;padding:.65rem .85rem;background:#ffb522;color:#2f2100;font-weight:800;text-decoration:none;cursor:pointer;opacity:${({disabled}) => disabled ? .6 : 1};`;
const SecondaryButton = styled.button`display:inline-flex;align-items:center;justify-content:center;gap:.35rem;border:1px solid rgba(80,48,0,.2);border-radius:11px;padding:.6rem .8rem;background:#fff;color:#503000;font-weight:700;cursor:pointer;opacity:${({disabled}) => disabled ? .6 : 1};`;
const GhostButton = styled(SecondaryButton)`background:transparent;`;
const CancelButton = styled.button`border:0;background:transparent;color:#9a3131;text-decoration:underline;text-align:left;cursor:pointer;justify-self:start;`;
