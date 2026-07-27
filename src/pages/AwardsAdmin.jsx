import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  AlertCircle, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
  Gift, Image as ImageIcon, Pencil, Plus, Search, SlidersHorizontal, Upload, X,
} from "lucide-react";
import Header from "../Header";
import { useUser } from "../context/UserContext";
import { getApiBaseUrl } from "../shared/api/client";
import { getAwardIconSources, handleAwardIconFallback } from "../utils/awardIcons";

const Page = styled.main`
  min-height: 100vh;
  background: #f6f7fb;
  color: #172033;
`;
const Container = styled.div`
  width: min(1180px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 1.25rem 0 3rem;
  @media (max-width: 520px) { width: min(100% - 1rem, 1180px); padding-top: 0.75rem; }
`;
const Card = styled.section`
  background: #fff;
  border: 1px solid #e4e8f1;
  border-radius: 16px;
  padding: clamp(1rem, 2vw, 1.4rem);
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
`;
const Overview = styled(Card)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  h1 { margin: 0; font-size: clamp(1.45rem, 4vw, 2rem); }
  p { margin: 0.35rem 0 0; color: #526075; }
  @media (max-width: 620px) { align-items: stretch; flex-direction: column; }
`;
const Metrics = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.9rem;
`;
const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  gap: 0.28rem;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  color: ${({ $tone }) => $tone === "warning" ? "#9a4b0b" : $tone === "success" ? "#17603a" : "#304b99"};
  background: ${({ $tone }) => $tone === "warning" ? "#fff3db" : $tone === "success" ? "#dcfce7" : "#edf2ff"};
  font-size: 0.79rem;
  font-weight: 700;
`;
const Button = styled.button`
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border: 1px solid ${({ $variant }) => $variant === "secondary" ? "#cfd8e8" : "#14532d"};
  border-radius: 10px;
  padding: 0.55rem 0.85rem;
  background: ${({ $variant }) => $variant === "secondary" ? "#fff" : "#14532d"};
  color: ${({ $variant }) => $variant === "secondary" ? "#243049" : "#fff"};
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  &:hover:not(:disabled) { filter: brightness(0.96); }
  &:disabled { cursor: not-allowed; opacity: 0.58; }
  &:focus-visible { outline: 3px solid #86efac; outline-offset: 2px; }
  @media (max-width: 620px) { width: ${({ $mobileFull }) => $mobileFull ? "100%" : "auto"}; }
`;
const IconButton = styled.button`
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #cfd8e8;
  border-radius: 10px;
  background: #fff;
  color: #243049;
  cursor: pointer;
  &:focus-visible { outline: 3px solid #86efac; outline-offset: 2px; }
`;
const Toolbar = styled(Card)`
  padding: 0.85rem;
`;
const ToolbarTop = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.65rem;
  @media (max-width: 620px) { grid-template-columns: 1fr auto; }
`;
const Field = styled.label`
  display: grid;
  gap: 0.35rem;
  color: #334155;
  font-size: 0.9rem;
  font-weight: 700;
  min-width: 0;
`;
const Input = styled.input`
  box-sizing: border-box;
  width: 100%;
  min-height: 44px;
  border: 1px solid ${({ $invalid }) => $invalid ? "#dc2626" : "#bfc9dc"};
  border-radius: 10px;
  padding: 0.58rem 0.7rem;
  background: #fff;
  color: #172033;
  font: inherit;
  &:focus { border-color: #2563eb; outline: 3px solid #bfdbfe; outline-offset: 1px; }
`;
const Select = styled.select`
  box-sizing: border-box;
  width: 100%;
  min-height: 44px;
  border: 1px solid #bfc9dc;
  border-radius: 10px;
  padding: 0.58rem 0.7rem;
  background: #fff;
  font: inherit;
  &:focus { border-color: #2563eb; outline: 3px solid #bfdbfe; outline-offset: 1px; }
`;
const Textarea = styled.textarea`
  box-sizing: border-box;
  width: 100%;
  min-height: 98px;
  resize: vertical;
  border: 1px solid ${({ $invalid }) => $invalid ? "#dc2626" : "#bfc9dc"};
  border-radius: 10px;
  padding: 0.58rem 0.7rem;
  font: inherit;
  &:focus { border-color: #2563eb; outline: 3px solid #bfdbfe; outline-offset: 1px; }
`;
const SearchField = styled.div`
  position: relative;
  svg { position: absolute; top: 50%; left: 0.75rem; transform: translateY(-50%); color: #64748b; pointer-events: none; }
  input { padding-left: 2.55rem; }
`;
const FilterPanel = styled.div`
  display: grid;
  grid-template-columns: minmax(170px, 1fr) minmax(150px, 180px);
  gap: 0.7rem;
  margin-top: 0.7rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e4e8f1;
  @media (max-width: 620px) { grid-template-columns: 1fr; }
`;
const Notice = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  margin-bottom: 1rem;
  border: 1px solid ${({ $kind }) => $kind === "error" ? "#fecaca" : "#bbf7d0"};
  border-radius: 12px;
  padding: 0.8rem 0.9rem;
  background: ${({ $kind }) => $kind === "error" ? "#fff5f5" : "#f0fdf4"};
  color: ${({ $kind }) => $kind === "error" ? "#9f1239" : "#166534"};
`;
const AwardList = styled.div`display: grid; gap: 0.7rem;`;
const AwardCard = styled.article`
  overflow: hidden;
  border: 1px solid #dce3ee;
  border-radius: 14px;
  background: #fff;
`;
const AwardSummary = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.9rem;
  @media (max-width: 620px) { align-items: flex-start; }
`;
const AwardIdentity = styled.div`
  min-width: 0;
  strong { display: block; font-size: 1rem; overflow-wrap: anywhere; }
  small { display: block; margin-top: 0.18rem; color: #64748b; }
`;
const AwardActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.45rem;
  @media (max-width: 620px) { gap: 0.3rem; ${Button} { padding: 0.5rem 0.65rem; } }
`;
const AwardDetails = styled.div`
  padding: 0 0.9rem 0.9rem;
  border-top: 1px solid #e4e8f1;
`;
const LevelRow = styled.div`
  display: grid;
  grid-template-columns: 60px minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.8rem 0;
  border-bottom: 1px dashed #d7deea;
  &:last-child { border-bottom: 0; }
  @media (max-width: 620px) {
    grid-template-columns: 58px minmax(0, 1fr);
    ${AwardActions} { grid-column: 1 / -1; justify-content: stretch; }
    ${AwardActions} ${Button} { flex: 1; }
  }
`;
const LevelIcon = styled.img`
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 10px;
  background: #edf1f6;
`;
const LevelContent = styled.div`
  min-width: 0;
  strong, p { overflow-wrap: anywhere; }
  p { margin: 0.2rem 0 0; color: #526075; font-size: 0.9rem; }
  small { color: #64748b; }
`;
const Empty = styled.div`
  padding: 2rem 1rem;
  text-align: center;
  color: #64748b;
`;
const Pagination = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 1rem;
  color: #526075;
  @media (max-width: 520px) { align-items: stretch; flex-direction: column; }
`;
const PagerActions = styled.div`display: flex; gap: 0.45rem;`;
const DialogBackdrop = styled.div`
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.58); z-index: 70;
`;
const DialogWrap = styled.div`
  position: fixed; inset: 0; z-index: 80; display: flex; justify-content: flex-end; pointer-events: none;
  @media (max-width: 720px) { display: block; }
`;
const EditorPanel = styled(DialogPanel)`
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  width: min(680px, 100vw);
  height: 100%;
  background: #fff;
  box-shadow: -12px 0 30px rgba(15, 23, 42, 0.2);
  @media (max-width: 720px) { width: 100%; }
`;
const CenteredDialogWrap = styled.div`
  position: fixed; inset: 0; z-index: 80; display: grid; place-items: center; padding: 1rem; pointer-events: none;
  @media (max-width: 620px) { padding: 0; }
`;
const CenteredPanel = styled(DialogPanel)`
  pointer-events: auto;
  width: min(680px, 100%);
  max-height: min(780px, calc(100vh - 2rem));
  overflow: auto;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.28);
  @media (max-width: 620px) { width: 100%; max-height: 100vh; height: 100vh; border-radius: 0; }
`;
const EditorHeader = styled.header`
  display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;
  padding: 1.1rem 1.2rem; border-bottom: 1px solid #e4e8f1;
  h2 { margin: 0; font-size: 1.25rem; }
  p { margin: 0.22rem 0 0; color: #64748b; }
`;
const EditorBody = styled.form`
  flex: 1; overflow: auto; padding: 1.2rem;
  @media (max-width: 720px) { padding-bottom: 6.5rem; }
`;
const SectionTitle = styled.h3`
  margin: 1.25rem 0 0.65rem;
  font-size: 1rem;
  &:first-child { margin-top: 0; }
`;
const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
  .full { grid-column: 1 / -1; }
  @media (max-width: 520px) { grid-template-columns: 1fr; .full { grid-column: auto; } }
`;
const FieldError = styled.small`color: #b91c1c; font-weight: 600;`;
const Helper = styled.small`color: #64748b; font-weight: 400;`;
const IconUpload = styled.div`
  display: grid; grid-template-columns: 80px minmax(0, 1fr); gap: 0.75rem; align-items: center;
  padding: 0.75rem; border: 1px solid #dce3ee; border-radius: 12px;
`;
const UploadPreview = styled.div`
  display: grid; place-items: center; width: 76px; height: 76px; overflow: hidden; border-radius: 10px; background: #f1f5f9; color: #64748b;
  img { width: 100%; height: 100%; object-fit: cover; }
`;
const CheckboxLine = styled.label`
  display: flex; align-items: center; gap: 0.55rem; margin-top: 0.55rem; color: #475569; font-size: 0.9rem; font-weight: 600;
  input { width: 18px; height: 18px; }
`;
const PreviewCard = styled.div`
  display: grid; grid-template-columns: 80px minmax(0, 1fr); gap: 0.8rem; align-items: center;
  padding: 0.85rem; border: 1px solid #d9e8d9; border-radius: 12px; background: #f8fff9;
  h4 { margin: 0; } p { margin: 0.25rem 0; color: #516170; } small { color: #166534; font-weight: 700; }
`;
const EditorFooter = styled.footer`
  display: flex; justify-content: flex-end; gap: 0.65rem; padding: 0.85rem 1.2rem; border-top: 1px solid #e4e8f1; background: #fff;
  @media (max-width: 720px) { position: absolute; right: 0; bottom: 0; left: 0; ${Button} { flex: 1; } }
`;
const GrantContent = styled.div`padding: 1.2rem; h2 { margin: 0; }`;
const DialogClose = styled(IconButton)`position: absolute; top: 0.7rem; right: 0.7rem; z-index: 1;`;
const RecipientList = styled.ul`
  display: grid; gap: 0.45rem; margin: 0.7rem 0; padding: 0; list-style: none;
  li { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 0.15rem 0.6rem; padding: 0.65rem; border: 1px solid #e2e8f0; border-radius: 10px; }
  small { grid-column: 1 / -1; color: #64748b; }
`;
const SuggestionList = styled.div`
  overflow: hidden; margin-top: 0.3rem; border: 1px solid #cbd5e1; border-radius: 10px;
  button { width: 100%; display: flex; justify-content: space-between; gap: 0.6rem; border: 0; border-bottom: 1px solid #e2e8f0; padding: 0.7rem; background: #fff; text-align: left; font: inherit; cursor: pointer; }
  button:last-child { border-bottom: 0; } button:hover, button:focus-visible { background: #f1f5f9; outline: none; }
`;
const SelectedUser = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-top: 0.6rem; padding: 0.5rem 0.6rem; border-radius: 9px; background: #eaf7ed; color: #175e39;
`;
const LightboxPanel = styled(CenteredPanel)`
  width: fit-content; max-width: min(92vw, 820px); padding: 0.75rem;
  img { display: block; max-width: min(88vw, 780px); max-height: 82vh; border-radius: 10px; }
`;

function authHeaders(authToken) { return authToken ? { Authorization: `Bearer ${authToken}` } : {}; }
function emptyLevel(level = "1") { return { level: String(level), threshold: "", ep: "0", title_de: "", description_de: "", iconFile: null, originalIcon: null, removeIcon: false }; }
function levelEditorData(levelData) { return { ...emptyLevel(levelData.level), threshold: String(levelData.threshold ?? ""), ep: String(levelData.ep ?? 0), title_de: levelData.title_de ?? "", description_de: levelData.description_de ?? "", originalIcon: levelData.icon_path ?? null }; }
function dateText(value) { return value ? new Date(value).toLocaleDateString("de-DE") : "—"; }

export default function AwardsAdmin() {
  const { userId, authToken, isLoggedIn } = useUser();
  const apiBase = getApiBaseUrl();
  const isAdmin = Number(userId) === 1;
  const [awards, setAwards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, page_size: 24, total: 0, total_pages: 1 });
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [pageSize, setPageSize] = useState(24);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedAwardIds, setExpandedAwardIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [editor, setEditor] = useState(null);
  const [editorErrors, setEditorErrors] = useState({});
  const [editorSaving, setEditorSaving] = useState(false);
  const [previewSrc, setPreviewSrc] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const [grantDialog, setGrantDialog] = useState(null);
  const [grantRecipients, setGrantRecipients] = useState([]);
  const [grantPagination, setGrantPagination] = useState({ page: 1, total_pages: 1, total: 0 });
  const [grantRecipientsLoading, setGrantRecipientsLoading] = useState(false);
  const [grantSearch, setGrantSearch] = useState("");
  const [grantSuggestions, setGrantSuggestions] = useState([]);
  const [selectedGrantUser, setSelectedGrantUser] = useState(null);
  const [grantShowPopup, setGrantShowPopup] = useState(true);
  const [grantLoading, setGrantLoading] = useState(false);
  const [grantError, setGrantError] = useState("");
  const [grantInfo, setGrantInfo] = useState("");

  const loadAwards = useCallback(async (overrides = {}) => {
    if (!apiBase || !authToken) return;
    const params = new URLSearchParams({
      paginated: "1",
      q: overrides.searchTerm ?? searchTerm,
      category: overrides.categoryFilter ?? categoryFilter,
      page: String(overrides.page ?? pagination.page),
      page_size: String(overrides.pageSize ?? pageSize),
    });
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBase}/awards/get_awards.php?${params}`, { headers: authHeaders(authToken) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Awards konnten nicht geladen werden.");
      setAwards(Array.isArray(data.items) ? data.items : []);
      setCategories(Array.isArray(data.categories) ? data.categories : []);
      setPagination(data.pagination || { page: 1, page_size: pageSize, total: 0, total_pages: 1 });
    } catch (err) { setError(err.message || "Awards konnten nicht geladen werden."); }
    finally { setLoading(false); }
  }, [apiBase, authToken, categoryFilter, pageSize, pagination.page, searchTerm]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadAwards(), searchTerm ? 220 : 0);
    return () => window.clearTimeout(timer);
  }, [loadAwards, searchTerm]);

  useEffect(() => {
    if (!editor) { setPreviewSrc(""); return undefined; }
    if (editor.level.iconFile) {
      const url = URL.createObjectURL(editor.level.iconFile);
      setPreviewSrc(url);
      return () => URL.revokeObjectURL(url);
    }
    if (editor.level.removeIcon) { setPreviewSrc(""); return undefined; }
    const icon = getAwardIconSources(editor.level.originalIcon, 512);
    setPreviewSrc(icon.src || icon.fallbackSrc || "");
    return undefined;
  }, [editor]);

  useEffect(() => {
    const firstInvalidField = Object.keys(editorErrors)[0];
    if (!firstInvalidField) return;
    document.getElementById(`award-editor-${firstInvalidField}`)?.focus();
  }, [editorErrors]);

  useEffect(() => {
    if (!grantDialog || grantSearch.trim().length < 2) { setGrantSuggestions([]); return undefined; }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ award_id: String(grantDialog.award.id), level: String(grantDialog.level.level), recipients: "0", query: grantSearch.trim() });
        const response = await fetch(`${apiBase}/awards/get_award_assignment_data.php?${params}`, { headers: authHeaders(authToken) });
        const data = await response.json();
        if (!response.ok || data.success !== true) throw new Error(data?.error || "Nutzersuche fehlgeschlagen.");
        if (!cancelled) setGrantSuggestions(Array.isArray(data.users) ? data.users : []);
      } catch (err) { if (!cancelled) setGrantError(err.message || "Nutzersuche fehlgeschlagen."); }
    }, 240);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [apiBase, authToken, grantDialog, grantSearch]);

  const stats = useMemo(() => ({
    awards: pagination.total,
    levels: awards.reduce((sum, award) => sum + (award.levels?.length || 0), 0),
    incomplete: awards.filter((award) => !award.levels?.length || award.levels.some((level) => !level.title_de)).length,
  }), [awards, pagination.total]);

  const openCreate = () => { setEditor({ mode: "create", award: { code: "", category: "" }, level: emptyLevel() }); setEditorErrors({}); };
  const openEditLevel = (award, level) => { setEditor({ mode: "edit", isNewLevel: false, award: { id: award.id, code: award.code ?? "", category: award.category ?? "" }, level: levelEditorData(level) }); setEditorErrors({}); };
  const openAddLevel = (award) => {
    const numericLevels = (award.levels || []).map((level) => Number(level.level)).filter(Number.isFinite);
    const next = numericLevels.length ? Math.max(...numericLevels) + 1 : 1;
    setEditor({ mode: "edit", isNewLevel: true, award: { id: award.id, code: award.code ?? "", category: award.category ?? "" }, level: emptyLevel(next) });
    setEditorErrors({});
  };
  const clearEditorError = (key) => setEditorErrors((current) => {
    const next = { ...current };
    delete next[key];
    return next;
  });
  const updateEditorAward = (key, value) => { setEditor((current) => ({ ...current, award: { ...current.award, [key]: value } })); clearEditorError(key); };
  const updateEditorLevel = (key, value) => { setEditor((current) => ({ ...current, level: { ...current.level, [key]: value } })); clearEditorError(key); };
  const toggleExpanded = (id) => setExpandedAwardIds((current) => current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]);

  const validateEditor = () => {
    const errors = {};
    const { award, level } = editor;
    if (!award.code.trim()) errors.code = "Bitte einen Award-Code angeben.";
    if (!level.level || Number(level.level) < 1 || !Number.isInteger(Number(level.level))) errors.level = "Das Level muss mindestens 1 sein.";
    if (level.threshold === "" || Number(level.threshold) < 0) errors.threshold = "Die Schwelle darf nicht negativ sein.";
    if (level.ep !== "" && Number(level.ep) < 0) errors.ep = "EP dürfen nicht negativ sein.";
    if (!level.title_de.trim()) errors.title_de = "Bitte einen Titel angeben.";
    setEditorErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchJson = async (url, options) => {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok || data.success !== true) {
      const err = new Error(data?.error || "Die Änderung konnte nicht gespeichert werden.");
      err.fieldErrors = data?.errors || {};
      throw err;
    }
    return data;
  };

  const submitEditor = async (event) => {
    event.preventDefault();
    if (!validateEditor()) return;
    setEditorSaving(true); setEditorErrors({}); setError("");
    try {
      const { award, level } = editor;
      const formData = new FormData();
      formData.append("code", award.code.trim());
      formData.append("category", award.category.trim());
      formData.append("level", level.level);
      formData.append("threshold", level.threshold);
      formData.append("ep", level.ep || "0");
      formData.append("title_de", level.title_de.trim());
      formData.append("description_de", level.description_de.trim());
      if (level.iconFile) formData.append("icon_file", level.iconFile);
      if (level.removeIcon) formData.append("remove_icon", "true");
      if (editor.isNewLevel) formData.append("create_only", "true");
      if (editor.mode === "create") {
        await fetchJson(`${apiBase}/awards/create_award_with_level.php`, { method: "POST", headers: authHeaders(authToken), body: formData });
        setInfo("Award und erstes Level wurden angelegt.");
        setEditor(null);
        await loadAwards({ page: 1 });
      } else {
        const awardData = new FormData();
        awardData.append("award_id", award.id);
        awardData.append("code", award.code.trim());
        awardData.append("category", award.category.trim());
        await fetchJson(`${apiBase}/awards/save_award.php`, { method: "POST", headers: authHeaders(authToken), body: awardData });
        formData.append("award_id", award.id);
        await fetchJson(`${apiBase}/awards/save_award_level.php`, { method: "POST", headers: authHeaders(authToken), body: formData });
        setInfo("Award und Level wurden gespeichert.");
        setEditor(null);
        await loadAwards();
      }
    } catch (err) {
      if (err.fieldErrors && Object.keys(err.fieldErrors).length) setEditorErrors(err.fieldErrors);
      else setEditorErrors({ form: err.message || "Speichern fehlgeschlagen." });
    } finally { setEditorSaving(false); }
  };

  const loadGrantRecipients = async (dialog = grantDialog, page = 1) => {
    if (!dialog) return;
    setGrantRecipientsLoading(true); setGrantError("");
    try {
      const params = new URLSearchParams({ award_id: String(dialog.award.id), level: String(dialog.level.level), recipients_page: String(page), recipients_page_size: "10" });
      const response = await fetch(`${apiBase}/awards/get_award_assignment_data.php?${params}`, { headers: authHeaders(authToken) });
      const data = await response.json();
      if (!response.ok || data.success !== true) throw new Error(data?.error || "Vergabehistorie konnte nicht geladen werden.");
      setGrantRecipients(Array.isArray(data.recipients) ? data.recipients : []);
      setGrantPagination(data.recipient_pagination || { page: 1, total_pages: 1, total: 0 });
    } catch (err) { setGrantError(err.message || "Vergabehistorie konnte nicht geladen werden."); }
    finally { setGrantRecipientsLoading(false); }
  };
  const openGrant = (award, level) => {
    const dialog = { award, level };
    setGrantDialog(dialog); setGrantRecipients([]); setGrantSearch(""); setGrantSuggestions([]); setSelectedGrantUser(null); setGrantShowPopup(true); setGrantError(""); setGrantInfo("");
    loadGrantRecipients(dialog, 1);
  };
  const submitGrant = async (event) => {
    event.preventDefault();
    if (!grantDialog || !selectedGrantUser) return;
    setGrantLoading(true); setGrantError(""); setGrantInfo("");
    try {
      const data = await fetchJson(`${apiBase}/awards/grant_award.php`, {
        method: "POST", headers: { "Content-Type": "application/json", ...authHeaders(authToken) },
        body: JSON.stringify({ award_id: Number(grantDialog.award.id), level: Number(grantDialog.level.level), user_id: Number(selectedGrantUser.user_id), show_popup: grantShowPopup }),
      });
      setGrantInfo(data.created ? `${selectedGrantUser.username} hat den Award erhalten.` : `${selectedGrantUser.username} besitzt diesen Award bereits.`);
      setGrantSearch(""); setGrantSuggestions([]); setSelectedGrantUser(null);
      await loadGrantRecipients(grantDialog, 1);
    } catch (err) { setGrantError(err.message || "Award konnte nicht vergeben werden."); }
    finally { setGrantLoading(false); }
  };

  if (!isLoggedIn) return <Page><Header /><Container><Card>Bitte einloggen.</Card></Container></Page>;
  if (!isAdmin) return <Page><Header /><Container><Card>Kein Zugriff. Diese Seite ist nur für Admins.</Card></Container></Page>;

  return <Page>
    <Header />
    <Container>
      <Overview>
        <div>
          <h1>Award-Verwaltung</h1>
          <p>Awards, Level und Einzelvergaben in einem klaren Arbeitsbereich verwalten.</p>
          <Metrics>
            <Badge>{stats.awards} Awards</Badge><Badge>{stats.levels} Level auf dieser Seite</Badge>
            {stats.incomplete > 0 && <Badge $tone="warning"><AlertCircle size={14} />{stats.incomplete} benötigen Aufmerksamkeit</Badge>}
          </Metrics>
        </div>
        <Button type="button" onClick={openCreate} $mobileFull><Plus size={18} />Award erstellen</Button>
      </Overview>
      {error && <Notice $kind="error" role="alert"><AlertCircle size={19} />{error}</Notice>}
      {info && <Notice role="status"><Check size={19} />{info}</Notice>}
      <Toolbar>
        <ToolbarTop>
          <Field aria-label="Awards durchsuchen">
            <SearchField><Search size={18} /><Input value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setPagination((current) => ({ ...current, page: 1 })); }} placeholder="ID, Code, Kategorie, Titel oder Beschreibung suchen" /></SearchField>
          </Field>
          <Button type="button" $variant="secondary" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen}><SlidersHorizontal size={18} /><span className="sr-only">Filter</span>Filter</Button>
        </ToolbarTop>
        {filtersOpen && <FilterPanel>
          <Field>Kategorie
            <Select value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setPagination((current) => ({ ...current, page: 1 })); }}>
              <option value="">Alle Kategorien</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </Select>
          </Field>
          <Field>Einträge pro Seite
            <Select value={pageSize} onChange={(event) => { const nextSize = Number(event.target.value); setPageSize(nextSize); setPagination((current) => ({ ...current, page: 1 })); }}>
              <option value={24}>24</option><option value={50}>50</option><option value={100}>100</option>
            </Select>
          </Field>
        </FilterPanel>}
      </Toolbar>
      <Card aria-busy={loading}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", marginBottom: "0.85rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Awards {loading ? "werden geladen …" : `(${pagination.total})`}</h2>
          <small style={{ color: "#64748b" }}>Seite {pagination.page} von {pagination.total_pages}</small>
        </div>
        <AwardList>
          {!loading && awards.length === 0 && <Empty>Keine Awards für diese Suche gefunden.</Empty>}
          {awards.map((award) => {
            const expanded = expandedAwardIds.includes(award.id);
            const levels = award.levels || [];
            const incomplete = levels.length === 0 || levels.some((level) => !level.title_de);
            return <AwardCard key={award.id}>
              <AwardSummary>
                <AwardIdentity>
                  <strong>{award.code || "Unbenannter Award"}</strong>
                  <small>ID {award.id}{award.category ? ` · ${award.category}` : " · Ohne Kategorie"}</small>
                  <Metrics style={{ marginTop: "0.45rem" }}><Badge>{levels.length} {levels.length === 1 ? "Level" : "Level"}</Badge><Badge $tone={incomplete ? "warning" : "success"}>{incomplete ? (levels.length ? "Unvollständig" : "Ohne Level") : "Bereit"}</Badge></Metrics>
                </AwardIdentity>
                <AwardActions>
                  <Button type="button" $variant="secondary" onClick={() => levels[0] ? openEditLevel(award, levels[0]) : openAddLevel(award)}><Pencil size={16} />Bearbeiten</Button>
                  <Button type="button" $variant="secondary" onClick={() => toggleExpanded(award.id)} aria-expanded={expanded}>{expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}{expanded ? "Details schließen" : "Details"}</Button>
                </AwardActions>
              </AwardSummary>
              {expanded && <AwardDetails>
                {levels.length === 0 && <Empty>Noch kein Level vorhanden. <Button type="button" onClick={() => openAddLevel(award)}><Plus size={16} />Level hinzufügen</Button></Empty>}
                {levels.map((level) => {
                  const icon = getAwardIconSources(level.icon_path, 512);
                  return <LevelRow key={`${award.id}-${level.level}`}>
                    <IconButton type="button" disabled={!icon.src && !icon.fallbackSrc} onClick={() => setLightbox({ src: icon.fallbackSrc || icon.src, alt: `Icon für ${level.title_de || `Level ${level.level}`}` })} aria-label={icon.src || icon.fallbackSrc ? `Icon groß anzeigen: ${level.title_de || `Level ${level.level}`}` : `Kein Icon vorhanden: ${level.title_de || `Level ${level.level}`}`}>
                      {icon.src ? <LevelIcon src={icon.src} data-fallback-src={icon.fallbackSrc || ""} onError={handleAwardIconFallback} alt="" /> : <ImageIcon aria-hidden="true" />}
                    </IconButton>
                    <LevelContent><strong>Level {level.level} · {level.title_de || "Ohne Titel"}</strong><small>Schwelle {level.threshold} · {level.ep || 0} EP</small><p>{level.description_de || "Keine Beschreibung hinterlegt."}</p></LevelContent>
                    <AwardActions><Button type="button" $variant="secondary" onClick={() => openEditLevel(award, level)}><Pencil size={16} />Level bearbeiten</Button><Button type="button" onClick={() => openGrant(award, level)}><Gift size={16} />Vergeben</Button></AwardActions>
                  </LevelRow>;
                })}
                {levels.length > 0 && <Button type="button" $variant="secondary" onClick={() => openAddLevel(award)}><Plus size={16} />Level hinzufügen</Button>}
              </AwardDetails>}
            </AwardCard>;
          })}
        </AwardList>
        <Pagination aria-label="Seitennavigation">
          <span>{pagination.total} Treffer</span>
          <PagerActions>
            <Button type="button" $variant="secondary" disabled={pagination.page <= 1 || loading} onClick={() => { const page = Math.max(1, pagination.page - 1); setPagination((current) => ({ ...current, page })); }}><ChevronLeft size={18} />Zurück</Button>
            <Button type="button" $variant="secondary" disabled={pagination.page >= pagination.total_pages || loading} onClick={() => { const page = Math.min(pagination.total_pages, pagination.page + 1); setPagination((current) => ({ ...current, page })); }}>Weiter<ChevronRight size={18} /></Button>
          </PagerActions>
        </Pagination>
      </Card>
    </Container>

    <Dialog open={Boolean(editor)} onClose={() => !editorSaving && setEditor(null)}>
      <DialogBackdrop />
      <DialogWrap>
        {editor && <EditorPanel>
          <EditorHeader><div><DialogTitle as="h2">{editor.mode === "create" ? "Award erstellen" : "Award und Level bearbeiten"}</DialogTitle><p>{editor.mode === "create" ? "Lege den Award und sein erstes Level in einem Schritt an." : `Award-ID ${editor.award.id} · Änderungen werden direkt im Award-Kontext gespeichert.`}</p></div><DialogClose type="button" onClick={() => setEditor(null)} disabled={editorSaving} aria-label="Editor schließen"><X size={20} /></DialogClose></EditorHeader>
          <EditorBody id="award-editor-form" onSubmit={submitEditor}>
            {editorErrors.form && <Notice $kind="error" role="alert"><AlertCircle size={18} />{editorErrors.form}</Notice>}
            <SectionTitle>Grunddaten</SectionTitle>
            <FormGrid>
              <Field>Award-Code *<Input id="award-editor-code" value={editor.award.code} $invalid={Boolean(editorErrors.code)} onChange={(event) => updateEditorAward("code", event.target.value)} aria-invalid={Boolean(editorErrors.code)} />{editorErrors.code ? <FieldError>{editorErrors.code}</FieldError> : <Helper>Interner, eindeutiger Schlüssel des Awards.</Helper>}</Field>
              <Field>Kategorie<Input id="award-editor-category" value={editor.award.category} $invalid={Boolean(editorErrors.category)} onChange={(event) => updateEditorAward("category", event.target.value)} />{editorErrors.category && <FieldError>{editorErrors.category}</FieldError>}</Field>
            </FormGrid>
            <SectionTitle>Level</SectionTitle>
            <FormGrid>
              <Field>Level *<Input id="award-editor-level" type="number" min="1" inputMode="numeric" value={editor.level.level} $invalid={Boolean(editorErrors.level)} onChange={(event) => updateEditorLevel("level", event.target.value)} aria-invalid={Boolean(editorErrors.level)} />{editorErrors.level && <FieldError>{editorErrors.level}</FieldError>}</Field>
              <Field>Schwelle *<Input id="award-editor-threshold" type="number" min="0" inputMode="numeric" value={editor.level.threshold} $invalid={Boolean(editorErrors.threshold)} onChange={(event) => updateEditorLevel("threshold", event.target.value)} aria-invalid={Boolean(editorErrors.threshold)} />{editorErrors.threshold ? <FieldError>{editorErrors.threshold}</FieldError> : <Helper>0 ist zulässig.</Helper>}</Field>
              <Field>EP<Input id="award-editor-ep" type="number" min="0" inputMode="numeric" value={editor.level.ep} $invalid={Boolean(editorErrors.ep)} onChange={(event) => updateEditorLevel("ep", event.target.value)} aria-invalid={Boolean(editorErrors.ep)} />{editorErrors.ep && <FieldError>{editorErrors.ep}</FieldError>}</Field>
              <Field>Titel (DE) *<Input id="award-editor-title_de" value={editor.level.title_de} $invalid={Boolean(editorErrors.title_de)} onChange={(event) => updateEditorLevel("title_de", event.target.value)} aria-invalid={Boolean(editorErrors.title_de)} />{editorErrors.title_de && <FieldError>{editorErrors.title_de}</FieldError>}</Field>
              <Field className="full">Beschreibung (DE)<Textarea id="award-editor-description_de" value={editor.level.description_de} onChange={(event) => updateEditorLevel("description_de", event.target.value)} /></Field>
              <Field className="full">Icon
                <IconUpload><UploadPreview>{previewSrc ? <img src={previewSrc} alt="Icon-Vorschau" /> : <ImageIcon size={26} aria-label="Noch kein Icon ausgewählt" />}</UploadPreview><div><Input id="award-editor-icon_file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => updateEditorLevel("iconFile", event.target.files?.[0] || null)} $invalid={Boolean(editorErrors.icon_file)} />{editor.level.iconFile && <Helper>Ausgewählt: {editor.level.iconFile.name}</Helper>}<Helper>Empfohlen: quadratisches Motiv; PNG, JPG, WebP oder GIF.</Helper>{editor.level.originalIcon && <CheckboxLine><input type="checkbox" checked={editor.level.removeIcon} onChange={(event) => updateEditorLevel("removeIcon", event.target.checked)} />Bestehendes Icon entfernen</CheckboxLine>}{editorErrors.icon_file && <FieldError>{editorErrors.icon_file}</FieldError>}</div></IconUpload>
              </Field>
            </FormGrid>
            <SectionTitle>Vorschau</SectionTitle>
            <PreviewCard><UploadPreview>{previewSrc ? <img src={previewSrc} alt="" /> : <ImageIcon size={26} />}</UploadPreview><div><h4>{editor.level.title_de || "Level-Titel"}</h4><p>{editor.level.description_de || "Die Beschreibung erscheint hier als Vorschau."}</p><small>Level {editor.level.level || "–"} · {editor.level.ep || 0} EP · Schwelle {editor.level.threshold || 0}</small></div></PreviewCard>
          </EditorBody>
          <EditorFooter><Button type="button" $variant="secondary" onClick={() => setEditor(null)} disabled={editorSaving}>Abbrechen</Button><Button type="submit" form="award-editor-form" disabled={editorSaving}>{editorSaving ? "Speichert …" : "Speichern"}</Button></EditorFooter>
        </EditorPanel>}
      </DialogWrap>
    </Dialog>

    <Dialog open={Boolean(grantDialog)} onClose={() => !grantLoading && setGrantDialog(null)}>
      <DialogBackdrop /><CenteredDialogWrap>{grantDialog && <CenteredPanel><DialogClose type="button" onClick={() => setGrantDialog(null)} aria-label="Vergabe schließen"><X size={20} /></DialogClose><GrantContent><DialogTitle as="h2">Award vergeben</DialogTitle><p style={{ color: "#526075" }}>{grantDialog.level.title_de || grantDialog.award.code} · Level {grantDialog.level.level} · {grantDialog.level.ep || 0} EP</p>{grantError && <Notice $kind="error" role="alert"><AlertCircle size={18} />{grantError}</Notice>}{grantInfo && <Notice role="status"><Check size={18} />{grantInfo}</Notice>}<SectionTitle>Bereits vergeben ({grantPagination.total || 0})</SectionTitle>{grantRecipientsLoading ? <p>Vergabehistorie wird geladen …</p> : <RecipientList>{grantRecipients.map((recipient) => <li key={recipient.user_id}><strong>{recipient.username}</strong><span>ID {recipient.user_id}</span><small>Vergeben am {dateText(recipient.awarded_at)} · {recipient.shown_at ? "Popup angezeigt" : "Popup noch offen"}</small></li>)}{grantRecipients.length === 0 && <li>Noch niemand hat dieses Level erhalten.</li>}</RecipientList>}{grantPagination.total_pages > 1 && <PagerActions><Button type="button" $variant="secondary" disabled={grantPagination.page <= 1} onClick={() => loadGrantRecipients(grantDialog, grantPagination.page - 1)}><ChevronLeft size={16} />Neuere</Button><Button type="button" $variant="secondary" disabled={grantPagination.page >= grantPagination.total_pages} onClick={() => loadGrantRecipients(grantDialog, grantPagination.page + 1)}>Ältere<ChevronRight size={16} /></Button></PagerActions>}<form onSubmit={submitGrant}><SectionTitle>Nutzer:in auswählen</SectionTitle><Field>Nutzername suchen<Input value={grantSearch} onChange={(event) => { setGrantSearch(event.target.value); setSelectedGrantUser(null); }} placeholder="Mindestens 2 Zeichen" autoFocus /></Field>{grantSuggestions.length > 0 && <SuggestionList>{grantSuggestions.map((candidate) => <button key={candidate.user_id} type="button" onClick={() => { setSelectedGrantUser(candidate); setGrantSearch(candidate.username); setGrantSuggestions([]); }}><strong>{candidate.username}</strong><span>ID {candidate.user_id}</span></button>)}</SuggestionList>}{selectedGrantUser && <SelectedUser><span><strong>{selectedGrantUser.username}</strong> · ID {selectedGrantUser.user_id}</span><IconButton type="button" onClick={() => { setSelectedGrantUser(null); setGrantSearch(""); }} aria-label="Ausgewählte Person entfernen"><X size={17} /></IconButton></SelectedUser>}<CheckboxLine><input type="checkbox" checked={grantShowPopup} onChange={(event) => setGrantShowPopup(event.target.checked)} />Beim nächsten Login als Award-Popup anzeigen</CheckboxLine><Helper>Ist der Schalter aus, wird der Award ohne offenes Popup im Profil hinterlegt.</Helper><div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}><Button type="submit" disabled={!selectedGrantUser || grantLoading}>{grantLoading ? "Vergibt …" : "Award vergeben"}</Button></div></form></GrantContent></CenteredPanel>}</CenteredDialogWrap>
    </Dialog>

    <Dialog open={Boolean(lightbox)} onClose={() => setLightbox(null)}><DialogBackdrop /><CenteredDialogWrap>{lightbox && <LightboxPanel><DialogClose type="button" onClick={() => setLightbox(null)} aria-label="Bildansicht schließen"><X size={20} /></DialogClose><img src={lightbox.src} alt={lightbox.alt} /></LightboxPanel>}</CenteredDialogWrap></Dialog>
  </Page>;
}
