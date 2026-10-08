import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { Check, Eye, MapPinned, X } from "lucide-react";
import { Overlay } from "./styles/SharedStyles";
import { useUser } from "./context/UserContext";
import NewAwards from "./components/NewAwards";
import MentionTextarea from "./components/MentionTextarea";

const SubmitRouteForm = ({ showForm, setShowForm, shopId, shopName, existingRoute = null, onSuccess }) => {
  const { userId } = useUser();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const nameInputRef = useRef(null);
  const shopSearchRef = useRef(null);
  const initialShopsApplied = useRef(false);
  const closeTimer = useRef(null);
  const [url, setUrl] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [typ, setTyp] = useState("Rennrad");
  const [isPrivat, setIsPrivat] = useState(false);
  const [name, setName] = useState("");
  const [laengeKm, setLaengeKm] = useState("");
  const [hoehenmeter, setHoehenmeter] = useState("");
  const [schwierigkeit, setSchwierigkeit] = useState("Leicht");
  const [embedCode, setEmbedCode] = useState("");
  const [message, setMessage] = useState("");
  const [visibilityWarning, setVisibilityWarning] = useState("");
  const [checkingVisibility, setCheckingVisibility] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [awards, setAwards] = useState([]);
  const [levelUpInfo, setLevelUpInfo] = useState(null);
  const [selectedShops, setSelectedShops] = useState([]);
  const [allShops, setAllShops] = useState([]);
  const [shopSearch, setShopSearch] = useState("");
  const [shopsLoading, setShopsLoading] = useState(false);

  const resolveShopName = (id, fallbackName = "") => allShops.find((shop) => Number(shop.id) === Number(id))?.name || fallbackName || `Eisdiele #${id}`;
  const normalizeShop = (shop) => ({ id: Number(shop.id), name: shop.name || resolveShopName(shop.id) });
  const closeDialog = () => setShowForm(false);

  useEffect(() => {
    if (!showForm) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !saving) closeDialog();
    };
    document.addEventListener("keydown", onKeyDown);
    const frame = window.requestAnimationFrame(() => nameInputRef.current?.focus());
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.cancelAnimationFrame(frame);
    };
  }, [showForm, saving]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (!showForm) return;
    if (existingRoute) {
      setUrl(existingRoute.url || "");
      setName(existingRoute.name || "");
      setBeschreibung(existingRoute.beschreibung || "");
      setTyp(existingRoute.typ || "Rennrad");
      setIsPrivat(String(existingRoute.ist_oeffentlich) !== "1");
      setLaengeKm(existingRoute.laenge_km || "");
      setHoehenmeter(existingRoute.hoehenmeter || "");
      setSchwierigkeit(existingRoute.schwierigkeit || "Leicht");
      setEmbedCode(existingRoute.embed_code || "");
    }
  }, [existingRoute, showForm]);

  useEffect(() => {
    if (!showForm) {
      initialShopsApplied.current = false;
      return;
    }
    setShopsLoading(true);
    fetch(`${apiUrl}/get_eisdielen_list.php`)
      .then((response) => response.json())
      .then((data) => setAllShops(Array.isArray(data) ? data : []))
      .catch(() => setAllShops([]))
      .finally(() => setShopsLoading(false));
  }, [showForm, apiUrl]);

  useEffect(() => {
    if (!showForm || initialShopsApplied.current) return;
    let initialSelection = [];
    if (existingRoute?.eisdielen?.length) initialSelection = existingRoute.eisdielen.map(normalizeShop);
    else if (existingRoute?.eisdiele_id) initialSelection = [{ id: Number(existingRoute.eisdiele_id), name: existingRoute.eisdiele_name || resolveShopName(existingRoute.eisdiele_id) }];
    else if (shopId) initialSelection = [{ id: Number(shopId), name: shopName || resolveShopName(shopId) }];
    setSelectedShops(initialSelection);
    initialShopsApplied.current = true;
  }, [showForm, existingRoute, shopId, shopName]);

  const filteredShops = useMemo(() => {
    const term = shopSearch.trim().toLowerCase();
    if (!term) return [];
    return allShops.filter((shop) => !selectedShops.some((selected) => Number(selected.id) === Number(shop.id)) && (shop.name?.toLowerCase().includes(term) || shop.adresse?.toLowerCase().includes(term))).slice(0, 8);
  }, [shopSearch, allShops, selectedShops]);

  const addShop = (shop) => {
    if (!shop) return;
    setSelectedShops((current) => current.some((entry) => Number(entry.id) === Number(shop.id)) ? current : [...current, normalizeShop(shop)]);
    setShopSearch("");
    queueMicrotask(() => shopSearchRef.current?.focus());
  };
  const removeShop = (id) => setSelectedShops((current) => current.filter((shop) => Number(shop.id) !== Number(id)));
  const getRouteProviderName = (checkUrl) => {
    const normalized = String(checkUrl || "").toLowerCase();
    if (normalized.includes("strava")) return "Strava";
    if (normalized.includes("outdooractive")) return "Outdooractive";
    if (normalized.includes("komoot")) return "Komoot";
    return "dem Routenanbieter";
  };

  const checkVisibility = async (checkUrl) => {
    if (!checkUrl) { setVisibilityWarning(""); return "unknown"; }
    try {
      setCheckingVisibility(true);
      const response = await fetch(`${apiUrl}/routen/checkRouteVisibility.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: checkUrl }) });
      const data = await response.json();
      if (data.status === "success" && data.visibility === "private") {
        setVisibilityWarning(`Diese Route scheint privat oder nicht erreichbar zu sein. Prüfe die Sichtbarkeit bei ${getRouteProviderName(checkUrl)}.`);
        return "private";
      }
      setVisibilityWarning("");
      return data.visibility || "unknown";
    } catch {
      setVisibilityWarning("");
      return "unknown";
    } finally {
      setCheckingVisibility(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedShops.length) {
      setMessage("Bitte wähle mindestens einen Eis-Stopp aus.");
      return;
    }
    setMessage("");
    const visibility = await checkVisibility(url);
    if (visibility === "private") {
      setMessage("Bitte mache die Route öffentlich oder reiche bei Komoot den Teilen-Link inklusive Freigabe-Token ein.");
      return;
    }
    const selectedIds = selectedShops.map((shop) => shop.id);
    const routeData = {
      eisdiele_id: selectedIds[0], eisdiele_ids: selectedIds, nutzer_id: userId, url, name, beschreibung, typ,
      ist_oeffentlich: isPrivat ? 0 : 1, laenge_km: laengeKm, hoehenmeter, schwierigkeit,
    };
    if (Number(userId) === 1) routeData.embed_code = embedCode;
    if (existingRoute) routeData.id = existingRoute.id;
    try {
      setSaving(true);
      const endpoint = existingRoute ? `${apiUrl}/routen/updateRoute.php` : `${apiUrl}/routen/submitRoute.php`;
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(routeData) });
      const result = await response.json();
      if (result.status !== "success") throw new Error(result.message || "Route konnte nicht gespeichert werden.");
      setMessage(existingRoute ? "Route erfolgreich aktualisiert!" : "Route erfolgreich hinzugefügt!");
      setSubmitted(true);
      onSuccess?.();
      if (result.level_up) setLevelUpInfo({ level: result.new_level, level_name: result.level_name });
      if (result.new_awards?.length) setAwards(result.new_awards);
      if (!result.level_up && !result.new_awards?.length) closeTimer.current = window.setTimeout(closeDialog, 1600);
    } catch (error) {
      setMessage(`Fehler: ${error.message || "Route konnte nicht gespeichert werden."}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Möchtest du diese Route wirklich löschen? Das Löschen kann nicht rückgängig gemacht werden.")) return;
    try {
      setSaving(true);
      const response = await fetch(`${apiUrl}/routen/deleteRoute.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: existingRoute.id, nutzer_id: userId }) });
      const result = await response.json();
      if (result.status !== "success") throw new Error(result.message);
      setMessage("Route erfolgreich gelöscht!");
      setSubmitted(true);
      onSuccess?.();
      closeTimer.current = window.setTimeout(closeDialog, 1400);
    } catch (error) {
      setMessage(`Fehler beim Löschen: ${error.message || "Unbekannter Fehler"}`);
    } finally {
      setSaving(false);
    }
  };

  if (!showForm) return null;
  const showSuggestions = shopSearch.trim().length > 0 && filteredShops.length > 0;
  return (
    <Overlay onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) closeDialog(); }}>
      <StyledModal role="dialog" aria-modal="true" aria-labelledby="route-form-title">
        <CloseButton type="button" onClick={closeDialog} disabled={saving} aria-label="Dialog schließen"><X size={22} /></CloseButton>
        <DialogHeader><DialogEyebrow>{existingRoute ? "Deine Tour" : "Teile deine Tour"}</DialogEyebrow><h2 id="route-form-title">{existingRoute ? "Route bearbeiten" : "Route einreichen"}</h2><p>Verknüpfe deine Tour mit Eisdielen und mache sie für andere leicht auffindbar.</p></DialogHeader>

        {!submitted ? <RouteForm onSubmit={handleSubmit}>
          <FormSection><SectionHeading><MapPinned size={18} />Route</SectionHeading>
            <Field><label htmlFor="route-name">Routenname <RequiredMark aria-hidden="true">*</RequiredMark></label><input id="route-name" ref={nameInputRef} type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="z. B. Seenrunde mit Eis-Pause" required /></Field>
            <Field><label htmlFor="route-url">Link zur Route <RequiredMark aria-hidden="true">*</RequiredMark></label><input id="route-url" type="url" value={url} onChange={(event) => { setUrl(event.target.value); setVisibilityWarning(""); }} onBlur={(event) => checkVisibility(event.target.value)} placeholder="Komoot, Strava oder Outdooractive" required aria-describedby={visibilityWarning ? "route-visibility-warning" : undefined} />
              <HelperText>{checkingVisibility ? "Route wird geprüft …" : "Unterstützt Komoot, Strava und Outdooractive."}</HelperText>
              {visibilityWarning && <Warning id="route-visibility-warning"><Eye size={17} />{visibilityWarning}</Warning>}
            </Field>
          </FormSection>

          <FormSection><SectionHeading><Check size={18} />Eis-Stopps</SectionHeading><SectionHint>Wähle mindestens eine Eisdiele entlang deiner Route aus.</SectionHint>
            <SelectedShopList>{selectedShops.map((shop) => <ShopChip key={shop.id}><span>{shop.name}</span><RemoveChipButton type="button" onClick={() => removeShop(shop.id)} aria-label={`${shop.name} entfernen`}>×</RemoveChipButton></ShopChip>)}</SelectedShopList>
            <ShopSearchWrapper><input ref={shopSearchRef} type="search" value={shopSearch} onChange={(event) => setShopSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && filteredShops.length) { event.preventDefault(); addShop(filteredShops[0]); } }} placeholder="Name oder Ort eingeben" aria-label="Eisdiele hinzufügen" aria-describedby="route-stops-hint" />
              {shopsLoading && <HelperText>Lade Eisdielen …</HelperText>}
              {showSuggestions && <SuggestionList>{filteredShops.map((shop) => <li key={shop.id}><button type="button" onClick={() => addShop(shop)}><strong>{shop.name}</strong>{shop.adresse && <small>{shop.adresse}</small>}</button></li>)}</SuggestionList>}
            </ShopSearchWrapper>
            <StopValidationInput value={selectedShops.length ? "Ausgewählt" : ""} readOnly required aria-label="Mindestens ein Eis-Stopp auswählen" onInvalid={() => setMessage("Bitte wähle mindestens einen Eis-Stopp aus.")} />
            <HelperText id="route-stops-hint">{selectedShops.length ? `${selectedShops.length} Eis-Stopp${selectedShops.length === 1 ? "" : "s"} ausgewählt` : "Noch kein Eis-Stopp ausgewählt."}</HelperText>
          </FormSection>

          <FormSection><SectionHeading>Tourdaten</SectionHeading><DetailsGrid>
            <Field><label htmlFor="route-type">Routentyp</label><select id="route-type" value={typ} onChange={(event) => setTyp(event.target.value)}><option value="Rennrad">Rennrad</option><option value="Wanderung">Wanderung</option><option value="MTB">MTB</option><option value="Gravel">Gravel</option><option value="Sonstiges">Sonstiges</option></select></Field>
            <Field><label htmlFor="route-difficulty">Schwierigkeit</label><select id="route-difficulty" value={schwierigkeit} onChange={(event) => setSchwierigkeit(event.target.value)}><option value="Leicht">Leicht</option><option value="Mittel">Mittel</option><option value="Schwer">Schwer</option></select></Field>
            <Field><label htmlFor="route-distance">Länge in km</label><input id="route-distance" type="number" min="0" step="0.1" value={laengeKm} onChange={(event) => setLaengeKm(event.target.value)} placeholder="z. B. 42,3" /></Field>
            <Field><label htmlFor="route-elevation">Höhenmeter</label><input id="route-elevation" type="number" min="0" step="1" value={hoehenmeter} onChange={(event) => setHoehenmeter(event.target.value)} placeholder="z. B. 680" /></Field>
          </DetailsGrid>
            <Field><label htmlFor="route-description">Beschreibung <Optional>optional</Optional></label><MentionTextarea id="route-description" rows={3} value={beschreibung} onChange={(event) => setBeschreibung(event.target.value)} placeholder="Was macht diese Tour besonders?" padding="12px" borderRadius="10px" border="1px solid rgba(47, 33, 0, 0.18)" /></Field>
          </FormSection>

          <FormSection><SectionHeading>Sichtbarkeit</SectionHeading><VisibilityOption><input id="route-private" type="checkbox" checked={isPrivat} onChange={(event) => setIsPrivat(event.target.checked)} /><label htmlFor="route-private"><strong>Private Tour</strong><span>Nur du kannst sie in deiner Routenliste sehen.</span></label></VisibilityOption></FormSection>
          {Number(userId) === 1 && <FormSection><SectionHeading>Einbettung (Admin)</SectionHeading><Field><label htmlFor="route-embed">Embed-Code <Optional>optional</Optional></label><textarea id="route-embed" rows={3} value={embedCode} onChange={(event) => setEmbedCode(event.target.value)} placeholder="<iframe …></iframe>" /></Field></FormSection>}
          <FormFooter><FormMessage role="status" aria-live="polite">{message}</FormMessage><FooterActions><CancelButton type="button" onClick={closeDialog} disabled={saving}>Abbrechen</CancelButton><SaveButton type="submit" disabled={saving || checkingVisibility}>{saving ? "Wird gespeichert …" : existingRoute ? "Änderungen speichern" : "Route einreichen"}</SaveButton></FooterActions></FormFooter>
          {existingRoute && <DeleteRouteButton type="button" onClick={handleDelete} disabled={saving}>Route löschen</DeleteRouteButton>}
        </RouteForm> : <SuccessState role="status" aria-live="polite"><Check size={28} /><strong>{message}</strong>{levelUpInfo && <p>Level-Up: Level {levelUpInfo.level} – {levelUpInfo.level_name}</p>}<NewAwards awards={awards} /></SuccessState>}
      </StyledModal>
    </Overlay>
  );
};

export default SubmitRouteForm;

const StyledModal = styled.div`position: relative; width: min(94vw, 680px); max-height: min(90dvh, 820px); overflow-y: auto; border-radius: 20px; background: #fffdf8; box-shadow: 0 20px 60px rgba(24, 16, 0, .3); @media (max-width: 600px) { align-self: flex-end; width: 100%; max-height: 92dvh; border-radius: 20px 20px 0 0; }`;
const CloseButton = styled.button`position: absolute; top: .85rem; right: .85rem; display: grid; place-items: center; width: 38px; height: 38px; border: 0; border-radius: 50%; background: rgba(47,33,0,.06); color: #2f2100; cursor: pointer; &:hover { background: #fff3da; } &:focus-visible { outline: 3px solid rgba(255,181,34,.4); }`;
const DialogHeader = styled.header`padding: 1.5rem 3.75rem 1.1rem 1.5rem; border-bottom: 1px solid rgba(47,33,0,.09); h2 { margin: .2rem 0 .35rem; color: #2f2100; font-size: 1.45rem; } p { margin: 0; color: rgba(47,33,0,.67); line-height: 1.4; }`;
const DialogEyebrow = styled.span`color: #8a5700; font-size: .75rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase;`;
const RouteForm = styled.form`padding: 1.15rem 1.5rem 1.5rem;`;
const FormSection = styled.section`padding: 1rem 0; border-bottom: 1px solid rgba(47,33,0,.09); &:first-child { padding-top: 0; }`;
const SectionHeading = styled.h3`display: flex; align-items: center; gap: .45rem; margin: 0 0 .35rem; color: #2f2100; font-size: 1rem;`;
const SectionHint = styled.p`margin: 0 0 .7rem; color: rgba(47,33,0,.65); font-size: .88rem;`;
const Field = styled.div`display: grid; gap: .35rem; margin-top: .8rem; label { color: #4f3800; font-size: .88rem; font-weight: 800; } input, select, textarea { box-sizing: border-box; width: 100%; min-height: 42px; border: 1px solid rgba(47,33,0,.18); border-radius: 10px; background: #fff; padding: .65rem .75rem; color: #2f2100; font: inherit; &:focus { outline: 3px solid rgba(255,181,34,.24); border-color: #ffb522; } } textarea { min-height: auto; resize: vertical; }`;
const RequiredMark = styled.span`color: #b91c1c;`;
const Optional = styled.span`margin-left: .25rem; color: rgba(47,33,0,.52); font-weight: 600;`;
const HelperText = styled.p`margin: .05rem 0 0; color: rgba(47,33,0,.58); font-size: .78rem;`;
const Warning = styled.div`display: flex; gap: .45rem; align-items: flex-start; margin-top: .4rem; border: 1px solid #f2cf69; border-radius: 9px; background: #fff8dd; padding: .6rem .7rem; color: #735400; font-size: .84rem; line-height: 1.35;`;
const SelectedShopList = styled.div`display: flex; flex-wrap: wrap; gap: .45rem; margin: .65rem 0;`;
const ShopChip = styled.span`display: inline-flex; align-items: center; gap: .35rem; border-radius: 999px; background: #fff3da; color: #8a5700; padding: .32rem .45rem .32rem .7rem; font-size: .85rem; font-weight: 700;`;
const RemoveChipButton = styled.button`display: grid; place-items: center; width: 22px; height: 22px; border: 0; border-radius: 50%; background: rgba(138,87,0,.13); color: inherit; font-size: 1.1rem; line-height: 1; cursor: pointer; &:hover { background: rgba(138,87,0,.24); } &:focus-visible { outline: 3px solid rgba(255,181,34,.35); }`;
const ShopSearchWrapper = styled.div`position: relative; input { box-sizing: border-box; width: 100%; min-height: 42px; border: 1px solid rgba(47,33,0,.18); border-radius: 10px; background: #fff; padding: .65rem .75rem; color: #2f2100; font: inherit; &:focus { outline: 3px solid rgba(255,181,34,.24); border-color: #ffb522; } }`;
const SuggestionList = styled.ul`position: absolute; z-index: 2; top: calc(100% + .3rem); right: 0; left: 0; max-height: 230px; overflow-y: auto; margin: 0; padding: .3rem; border: 1px solid rgba(47,33,0,.14); border-radius: 10px; background: #fff; box-shadow: 0 10px 28px rgba(47,33,0,.15); list-style: none; button { display: grid; width: 100%; gap: .15rem; border: 0; border-radius: 7px; background: transparent; padding: .55rem; color: #2f2100; text-align: left; cursor: pointer; &:hover, &:focus-visible { background: #fff3da; outline: none; } small { color: rgba(47,33,0,.62); } }`;
const StopValidationInput = styled.input`position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none;`;
const DetailsGrid = styled.div`display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 .75rem; @media (max-width: 500px) { grid-template-columns: 1fr; }`;
const VisibilityOption = styled.div`display: flex; align-items: flex-start; gap: .65rem; padding: .7rem; border: 1px solid rgba(47,33,0,.13); border-radius: 10px; background: #fff; input { width: 18px; height: 18px; margin-top: .1rem; accent-color: #d99100; } label { display: grid; gap: .1rem; color: #2f2100; cursor: pointer; } span { color: rgba(47,33,0,.62); font-size: .83rem; }`;
const FormFooter = styled.footer`position: sticky; bottom: -1.5rem; z-index: 1; display: flex; justify-content: space-between; gap: 1rem; align-items: center; margin: 1.1rem -1.5rem 0; padding: .85rem 1.5rem calc(.85rem + env(safe-area-inset-bottom)); border-top: 1px solid rgba(47,33,0,.1); background: rgba(255,253,248,.96); backdrop-filter: blur(10px); @media (max-width: 520px) { align-items: stretch; flex-direction: column; }`;
const FormMessage = styled.p`min-height: 1.2em; margin: 0; color: #8a5700; font-size: .82rem; font-weight: 700;`;
const FooterActions = styled.div`display: flex; gap: .55rem; flex: 0 0 auto; @media (max-width: 520px) { display: grid; grid-template-columns: 1fr 1fr; }`;
const buttonBase = `min-height: 42px; border-radius: 10px; padding: .65rem .85rem; font: inherit; font-size: .87rem; font-weight: 800; cursor: pointer; &:disabled { cursor: wait; opacity: .6; } &:focus-visible { outline: 3px solid rgba(255,181,34,.4); outline-offset: 2px; }`;
const CancelButton = styled.button`${buttonBase}; border: 1px solid rgba(47,33,0,.16); background: #fff; color: #5f4a25; &:hover:not(:disabled) { background: #fff8e8; }`;
const SaveButton = styled.button`${buttonBase}; border: 1px solid rgba(255,181,34,.75); background: #ffb522; color: #2f2100; &:hover:not(:disabled) { background: #ffc34a; }`;
const DeleteRouteButton = styled.button`margin-top: 1rem; border: 0; background: transparent; color: #b91c1c; padding: .35rem 0; font: inherit; font-size: .82rem; font-weight: 700; cursor: pointer; text-decoration: underline; &:focus-visible { outline: 3px solid rgba(255,181,34,.35); }`;
const SuccessState = styled.div`display: grid; place-items: center; gap: .65rem; padding: 3rem 1.5rem; color: #2f2100; text-align: center; svg { color: #217a42; } p { margin: 0; color: #5f4a25; }`;
