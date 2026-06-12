import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Eye, EyeOff, ImagePlus, Trash2 } from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";
import Seo from "../../components/Seo";
import { useUser } from "../../context/UserContext";
import { getApiBaseUrl } from "../../shared/api/client";
import { buildAssetUrl } from "../../utils/assets.jsx";
import { EVENT_LOGIN_REQUIRED_MESSAGE, getEventAccessErrorMessage, readEventApiJson } from "./eventAuthMessages";

const Page = styled.div`
  min-height: 100vh;
  background: var(--event-bg);
`;

const Container = styled.div`
  width: min(96%, 1180px);
  margin: 0 auto;
  padding: 1rem;
`;

const Card = styled.div`
  background: #fffdfa;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(255, 181, 34, 0.08);
  padding: 1.1rem;
  margin-bottom: 1rem;
`;

const FormGrid = styled.div`
  display: grid;
  gap: 0.8rem;
  grid-template-columns: 1fr;

  @media (min-width: 860px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Field = styled.label`
  display: grid;
  gap: 0.35rem;
  color: #7c4f00;
  font-weight: 700;
`;

const Input = styled.input`
  border: 1px solid #ead7ab;
  border-radius: 10px;
  padding: 0.62rem 0.75rem;
  font: inherit;
  color: #2d1d00;
  background: #fffef9;
  box-sizing: border-box;
`;

const TextArea = styled.textarea`
  min-height: 92px;
  border: 1px solid #ead7ab;
  border-radius: 10px;
  padding: 0.62rem 0.75rem;
  font: inherit;
  color: #2d1d00;
  background: #fffef9;
  resize: vertical;
  box-sizing: border-box;
`;

const ActionButton = styled.button`
  border: none;
  border-radius: 8px;
  padding: 0.65rem 0.95rem;
  background: #ffb522;
  color: white;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled.button`
  border: 1px solid #ecd49b;
  border-radius: 8px;
  padding: 0.6rem 0.85rem;
  background: #fff5df;
  color: #7c4f00;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
`;

const GalleryGrid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
`;

const ImpressionCard = styled.article`
  border: 1px solid #f3e5bd;
  border-radius: 14px;
  overflow: hidden;
  background: #fffaf0;
`;

const PreviewImage = styled.img`
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  display: block;
  background: #fff3c2;
`;

const CardBody = styled.div`
  display: grid;
  gap: 0.7rem;
  padding: 0.9rem;
`;

const StatusBadge = styled.span`
  width: fit-content;
  border-radius: 999px;
  padding: 0.22rem 0.55rem;
  background: ${({ $published }) => ($published ? "#dcfce7" : "#fee2e2")};
  color: ${({ $published }) => ($published ? "#166534" : "#9f1239")};
  font-weight: 800;
  font-size: 0.82rem;
`;

const Notice = styled(Card)`
  color: ${({ $tone }) => ($tone === "error" ? "#9f1239" : "#166534")};
`;

const initialForm = {
  title: "",
  caption: "",
  sort_order: 0,
  is_published: true,
  image: null,
};

export default function EventAdminImpressions() {
  const apiUrl = getApiBaseUrl();
  const { authToken, authReady } = useUser();
  const [eventInfo, setEventInfo] = useState(null);
  const [impressions, setImpressions] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const headers = useMemo(
    () => (authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    [authToken]
  );

  const applyPayload = (json) => {
    setEventInfo(json.event || null);
    setImpressions(json.impressions || []);
  };

  const load = async () => {
    if (!apiUrl || !authReady) return;
    if (!authToken) {
      setLoading(false);
      setError(EVENT_LOGIN_REQUIRED_MESSAGE);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/event2026/admin_impressions.php`, { headers });
      const json = await readEventApiJson(res);
      if (!res.ok || json?.status !== "success") {
        throw new Error(getEventAccessErrorMessage(res.status, json?.message || "Impressionen konnten nicht geladen werden."));
      }
      applyPayload(json);
      setError("");
    } catch (err) {
      setError(err.message || "Impressionen konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [apiUrl, authReady, authToken]);

  const upload = async (event) => {
    event.preventDefault();
    if (!form.image || !apiUrl) {
      setError("Bitte wähle ein Bild aus.");
      return;
    }

    const body = new FormData();
    body.append("image", form.image);
    body.append("title", form.title);
    body.append("caption", form.caption);
    body.append("sort_order", String(form.sort_order || 0));
    body.append("is_published", form.is_published ? "1" : "0");

    setBusyAction("upload");
    try {
      const res = await fetch(`${apiUrl}/event2026/admin_impressions.php`, {
        method: "POST",
        headers,
        body,
      });
      const json = await readEventApiJson(res);
      if (!res.ok || json?.status !== "success") {
        throw new Error(getEventAccessErrorMessage(res.status, json?.message || "Bild konnte nicht hochgeladen werden."));
      }
      applyPayload(json);
      setForm(initialForm);
      setNotice("Bild wurde gespeichert.");
      setError("");
    } catch (err) {
      setError(err.message || "Bild konnte nicht hochgeladen werden.");
    } finally {
      setBusyAction("");
    }
  };

  const updateImpression = async (impression, patch = {}) => {
    setBusyAction(`update-${impression.id}`);
    try {
      const res = await fetch(`${apiUrl}/event2026/admin_impressions.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          action: "update",
          id: impression.id,
          title: patch.title ?? impression.title,
          caption: patch.caption ?? impression.caption,
          sort_order: patch.sort_order ?? impression.sort_order,
          is_published: patch.is_published ?? impression.is_published,
        }),
      });
      const json = await readEventApiJson(res);
      if (!res.ok || json?.status !== "success") {
        throw new Error(getEventAccessErrorMessage(res.status, json?.message || "Impression konnte nicht gespeichert werden."));
      }
      applyPayload(json);
      setNotice("Impression wurde gespeichert.");
      setError("");
    } catch (err) {
      setError(err.message || "Impression konnte nicht gespeichert werden.");
    } finally {
      setBusyAction("");
    }
  };

  const deleteImpression = async (impression) => {
    if (!window.confirm("Diese Impression wirklich löschen?")) return;
    setBusyAction(`delete-${impression.id}`);
    try {
      const res = await fetch(`${apiUrl}/event2026/admin_impressions.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ action: "delete", id: impression.id }),
      });
      const json = await readEventApiJson(res);
      if (!res.ok || json?.status !== "success") {
        throw new Error(getEventAccessErrorMessage(res.status, json?.message || "Impression konnte nicht gelöscht werden."));
      }
      applyPayload(json);
      setNotice("Impression wurde gelöscht.");
      setError("");
    } catch (err) {
      setError(err.message || "Impression konnte nicht gelöscht werden.");
    } finally {
      setBusyAction("");
    }
  };

  return (
    <Page>
      <Seo title="Ice-Tour Impressionen Admin" description="Impressionen der Ice-Tour verwalten." robots="noindex,nofollow" />
      <Header />
      <Container>
        <Card>
          <h1 style={{ marginTop: 0, marginBottom: "0.35rem" }}>Impressionen verwalten</h1>
          <p style={{ margin: 0, color: "#7c4f00" }}>
            Bilder für {eventInfo?.name || "die Ice-Tour"} hochladen, sortieren und veröffentlichen.
          </p>
        </Card>

        {error && <Notice $tone="error">{error}</Notice>}
        {notice && <Notice>{notice}</Notice>}
        {loading && <Card>Daten werden geladen…</Card>}

        {!loading && (
          <>
            <Card as="form" onSubmit={upload}>
              <h2 style={{ marginTop: 0 }}>Neues Bild</h2>
              <FormGrid>
                <Field>
                  Bild
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => setForm((current) => ({ ...current, image: event.target.files?.[0] || null }))}
                  />
                </Field>
                <Field>
                  Titel
                  <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
                </Field>
                <Field style={{ gridColumn: "1 / -1" }}>
                  Beschreibung
                  <TextArea value={form.caption} onChange={(event) => setForm((current) => ({ ...current, caption: event.target.value }))} />
                </Field>
                <Field>
                  Sortierung
                  <Input
                    type="number"
                    value={form.sort_order}
                    onChange={(event) => setForm((current) => ({ ...current, sort_order: event.target.value }))}
                  />
                </Field>
                <Field>
                  <span>Veröffentlichen</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#2d1d00", fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={form.is_published}
                      onChange={(event) => setForm((current) => ({ ...current, is_published: event.target.checked }))}
                    />
                    Öffentlich auf der Impressionen-Seite anzeigen
                  </span>
                </Field>
              </FormGrid>
              <div style={{ marginTop: "1rem" }}>
                <ActionButton type="submit" disabled={busyAction !== ""}>
                  <ImagePlus size={18} />
                  Bild hochladen
                </ActionButton>
              </div>
            </Card>

            <Card>
              <h2 style={{ marginTop: 0 }}>Bilder</h2>
              {impressions.length === 0 ? (
                <p style={{ marginBottom: 0, color: "#7c4f00" }}>Noch keine Impressionen angelegt.</p>
              ) : (
                <GalleryGrid>
                  {impressions.map((impression) => (
                    <EditableImpressionCard
                      key={impression.id}
                      impression={impression}
                      busy={busyAction !== ""}
                      onSave={updateImpression}
                      onDelete={deleteImpression}
                    />
                  ))}
                </GalleryGrid>
              )}
            </Card>
          </>
        )}
      </Container>
      <Footer />
    </Page>
  );
}

function EditableImpressionCard({ impression, busy, onSave, onDelete }) {
  const [draft, setDraft] = useState(() => ({
    title: impression.title || "",
    caption: impression.caption || "",
    sort_order: impression.sort_order || 0,
  }));

  useEffect(() => {
    setDraft({
      title: impression.title || "",
      caption: impression.caption || "",
      sort_order: impression.sort_order || 0,
    });
  }, [impression]);

  return (
    <ImpressionCard>
      <PreviewImage src={buildAssetUrl(impression.image_url)} alt={impression.title || "Ice-Tour Impression"} />
      <CardBody>
        <StatusBadge $published={impression.is_published}>
          {impression.is_published ? "Veröffentlicht" : "Entwurf"}
        </StatusBadge>
        <Field>
          Titel
          <Input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
        </Field>
        <Field>
          Beschreibung
          <TextArea value={draft.caption} onChange={(event) => setDraft((current) => ({ ...current, caption: event.target.value }))} />
        </Field>
        <Field>
          Sortierung
          <Input
            type="number"
            value={draft.sort_order}
            onChange={(event) => setDraft((current) => ({ ...current, sort_order: event.target.value }))}
          />
        </Field>
        <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap" }}>
          <ActionButton type="button" disabled={busy} onClick={() => onSave(impression, draft)}>
            Speichern
          </ActionButton>
          <SecondaryButton type="button" disabled={busy} onClick={() => onSave(impression, { is_published: !impression.is_published })}>
            {impression.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
            {impression.is_published ? "Verbergen" : "Veröffentlichen"}
          </SecondaryButton>
          <SecondaryButton type="button" disabled={busy} onClick={() => onDelete(impression)}>
            <Trash2 size={16} />
            Löschen
          </SecondaryButton>
        </div>
      </CardBody>
    </ImpressionCard>
  );
}
