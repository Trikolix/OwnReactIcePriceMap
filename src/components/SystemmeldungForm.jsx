import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Eye, Mail, Plus, Send, Trash2 } from "lucide-react";
import { useUser } from "../context/UserContext";
import Header from "../Header";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const FORCE_MAIL_CONFIRM_TEXT = "EMAIL AN ALLE";

const emptyButton = () => ({ label: "", url: "" });

const defaultForm = () => ({
  title: "",
  message: "## Kurzfassung\n\nSchreibe hier die Nachricht, die im Overlay angezeigt wird.\n\n- Wichtiger Punkt\n- Noch ein Punkt",
  link_url: "",
  link_label: "",
  email_subject: "",
  email_heading: "",
  email_body: "Hallo zusammen,\n\n## Neues in der Ice-App\n\nHier kommt ein Update.\n\n[button: Ice-App öffnen](https://ice-app.de)",
  email_buttons: [],
  mail_send_mode: "subscribers",
  force_mail_all_confirmed: false,
  force_mail_all_confirm_text: "",
});

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isSafeHttpUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function absoluteIceAppUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://ice-app.de${raw.startsWith("/") ? raw : `/${raw}`}`;
}

function renderInlineMarkdownHtml(text) {
  const tokens = [];
  let nextText = String(text || "").replace(/\[button:\s*([^\]]+)\]\((https?:\/\/[^)\s]+)\)/gi, (match, label, url) => {
    if (!isSafeHttpUrl(url)) return escapeHtml(match);
    const key = `%%ICEAPP_TOKEN_${tokens.length}%%`;
    tokens.push([
      key,
      `<a href="${escapeHtml(url)}" style="display:inline-flex;align-items:center;background:#2d1d00;color:#ffffff;text-decoration:none;font-weight:800;padding:12px 16px;border-radius:10px;margin:4px 0;">${escapeHtml(label.trim())}</a>`,
    ]);
    return key;
  });

  nextText = nextText.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/gi, (match, label, url) => {
    if (!isSafeHttpUrl(url)) return escapeHtml(match);
    const key = `%%ICEAPP_TOKEN_${tokens.length}%%`;
    tokens.push([
      key,
      `<a href="${escapeHtml(url)}" style="color:#b45309;text-decoration:underline;">${escapeHtml(label.trim())}</a>`,
    ]);
    return key;
  });

  let safe = escapeHtml(nextText).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  tokens.forEach(([key, html]) => {
    safe = safe.replaceAll(key, html);
  });
  return safe;
}

function parseMarkdownBlocks(markdown) {
  const lines = String(markdown || "").trim().split(/\r?\n/);
  const blocks = [];
  let paragraph = [];
  let listItems = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join("\n") });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: "list", items: listItems });
      listItems = [];
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", level: Math.min(3, headingMatch[1].length), text: headingMatch[2].trim() });
      return;
    }
    const listMatch = trimmed.match(/^-\s+(.+)$/);
    if (listMatch) {
      flushParagraph();
      listItems.push(listMatch[1].trim());
      return;
    }
    flushList();
    paragraph.push(trimmed);
  });

  flushParagraph();
  flushList();
  return blocks;
}

function renderMarkdownContent(markdown) {
  const blocks = parseMarkdownBlocks(markdown);
  if (!blocks.length) return '<p style="margin:0;color:#7a5200;">Vorschau erscheint hier.</p>';
  return blocks.map((block) => {
    if (block.type === "heading") {
      const size = block.level === 1 ? "22px" : block.level === 2 ? "19px" : "17px";
      return `<h2 style="margin:18px 0 8px;font-size:${size};line-height:1.25;color:#2d1d00;">${escapeHtml(block.text)}</h2>`;
    }
    if (block.type === "list") {
      return `<ul style="margin:0 0 16px;padding-left:22px;">${block.items.map((item) => `<li style="margin:0 0 7px;">${renderInlineMarkdownHtml(item)}</li>`).join("")}</ul>`;
    }
    return `<p style="margin:0 0 14px;">${renderInlineMarkdownHtml(block.text).replace(/\n/g, "<br>")}</p>`;
  }).join("");
}

function buildMailPreviewHtml(form, includeSettingsHint) {
  const heading = form.email_heading || form.title || "Mail-Ueberschrift";
  const buttons = (form.email_buttons || []).filter((button) => button.label?.trim() && isSafeHttpUrl(absoluteIceAppUrl(button.url)));
  const settingsHint = includeSettingsHint
    ? `<div style="border-top:1px solid #f3dfad;background:#fff8e8;padding:18px 28px;color:#8a6a24;font-size:13px;line-height:1.45;">Du erhältst diese Nachricht, weil du Ice-App News abonniert hast. Deine Benachrichtigungseinstellungen kannst du jederzeit in der Ice-App ändern: <a href="https://ice-app.de/account/settings" style="color:#9a6500;text-decoration:underline;">Benachrichtigungseinstellungen öffnen</a>.</div>`
    : "";
  const buttonHtml = buttons.length
    ? `<div style="display:block;margin:8px 0 22px;">${buttons.map((button) => `<a href="${escapeHtml(absoluteIceAppUrl(button.url))}" style="display:inline-block;background:#2d1d00;color:#ffffff;text-decoration:none;font-weight:800;padding:13px 18px;border-radius:10px;margin:0 8px 8px 0;">${escapeHtml(button.label.trim())}</a>`).join("")}</div>`
    : "";

  return `<!doctype html><html><body style="margin:0;background:#fff7e8;font-family:Arial,Helvetica,sans-serif;color:#2d1d00;">
    <div style="max-width:680px;margin:0 auto;padding:28px 16px;">
      <div style="background:#fffdfa;border:1px solid #f3dfad;border-radius:18px;overflow:hidden;box-shadow:0 8px 24px rgba(124,79,0,0.10);">
        <div style="background:#ffb522;color:#2d1d00;padding:24px 28px;">
          <div style="font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;">Ice-App</div>
          <h1 style="margin:8px 0 0;font-size:28px;line-height:1.18;">${escapeHtml(heading)}</h1>
        </div>
        <div style="padding:28px;line-height:1.6;font-size:16px;">
          ${renderMarkdownContent(form.email_body)}
          ${buttonHtml}
        </div>
        ${settingsHint}
      </div>
    </div>
  </body></html>`;
}

function buildOverlayPreviewHtml(form) {
  const link = form.link_url?.trim();
  const linkHtml = link
    ? `<div style="display:flex;justify-content:center;margin-top:18px;"><a href="${escapeHtml(link)}" style="background:#ffb522;color:#2d1d00;border:1px solid rgba(255,181,34,.5);padding:11px 16px;border-radius:10px;text-decoration:none;font-weight:800;">${escapeHtml(form.link_label || "Ansehen")}</a></div>`
    : "";

  return `<!doctype html><html><body style="margin:0;background:#fff7e8;font-family:Arial,Helvetica,sans-serif;color:#2d1d00;">
    <div style="min-height:100vh;display:grid;place-items:center;padding:18px;box-sizing:border-box;">
      <div style="width:min(100%,520px);background:#fffdf8;border:1px solid rgba(47,33,0,.12);border-radius:18px;box-shadow:0 20px 48px rgba(47,33,0,.18);padding:26px 23px;">
        <h1 style="margin:0 0 12px;font-size:22px;line-height:1.28;color:#2f2100;">${escapeHtml(form.title || "Systemmeldung")}</h1>
        <div style="color:#5f4a1f;line-height:1.55;font-size:16px;">${renderMarkdownContent(form.message)}</div>
        ${linkHtml}
      </div>
    </div>
  </body></html>`;
}

function parseButtons(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function SystemmeldungForm() {
  const { userId } = useUser();
  const isAdmin = Number(userId) === 1;
  const [form, setForm] = useState(() => defaultForm());
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [meldungen, setMeldungen] = useState([]);
  const [meta, setMeta] = useState(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/systemmeldung.php?action=list`);
      const data = await res.json();
      if (data.status === "success") {
        setMeldungen(data.systemmeldungen || []);
        setMeta(data.meta || null);
      }
    } catch (err) {
      setError("Systemmeldungen konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadHistory();
  }, [isAdmin]);

  const mailPreviewHtml = useMemo(
    () => buildMailPreviewHtml(form, form.mail_send_mode === "subscribers"),
    [form]
  );
  const overlayPreviewHtml = useMemo(() => buildOverlayPreviewHtml(form), [form]);

  const recipientLabel = useMemo(() => {
    if (form.mail_send_mode === "none") return "Keine E-Mail";
    if (form.mail_send_mode === "all") return `${meta?.email_all ?? 0} Nutzer mit E-Mail, Einstellungen werden ignoriert`;
    return `${meta?.email_subscribers ?? 0} Nutzer mit aktivierten News/Systemmeldungen`;
  }, [form.mail_send_mode, meta]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateButton = (index, key, value) => {
    setForm((current) => ({
      ...current,
      email_buttons: current.email_buttons.map((button, buttonIndex) => (
        buttonIndex === index ? { ...button, [key]: value } : button
      )),
    }));
  };

  const addButton = () => {
    setForm((current) => ({
      ...current,
      email_buttons: current.email_buttons.length >= 5 ? current.email_buttons : [...current.email_buttons, emptyButton()],
    }));
  };

  const removeButton = (index) => {
    setForm((current) => ({
      ...current,
      email_buttons: current.email_buttons.filter((_, buttonIndex) => buttonIndex !== index),
    }));
  };

  const resetForm = () => {
    setForm(defaultForm());
    setEditingId(null);
  };

  const startEditing = (meldung) => {
    setEditingId(meldung.id);
    setForm({
      title: meldung.titel || "",
      message: meldung.nachricht || "",
      link_url: meldung.link_url || "",
      link_label: meldung.link_label || "",
      email_subject: meldung.email_subject || `Ice-App: ${meldung.titel || ""}`,
      email_heading: meldung.email_heading || meldung.titel || "",
      email_body: meldung.email_body || meldung.nachricht || "",
      email_buttons: parseButtons(meldung.email_buttons),
      mail_send_mode: "subscribers",
      force_mail_all_confirmed: false,
      force_mail_all_confirm_text: "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");

    try {
      const url = editingId
        ? `${API_BASE}/systemmeldung.php?action=update`
        : `${API_BASE}/systemmeldung.php?action=create`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...form }),
      });
      const data = await res.json();
      if (data.status !== "success") {
        throw new Error(data.message || "Fehler beim Speichern");
      }

      if (editingId) {
        setSuccess("Systemmeldung aktualisiert.");
      } else {
        setSuccess(`Systemmeldung erstellt. Benachrichtigungen: ${data.notification_count ?? 0}. E-Mails: ${data.mail?.sent ?? 0}/${data.mail?.total ?? 0}.`);
        resetForm();
      }
      await loadHistory();
    } catch (err) {
      setError(err.message || "Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  };

  const sendTestMail = async () => {
    setSendingTest(true);
    setSuccess("");
    setError("");
    try {
      const res = await fetch(`${API_BASE}/systemmeldung.php?action=test_email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.status !== "success") {
        throw new Error(data.message || "Testmail konnte nicht versendet werden.");
      }
      setSuccess(`Testmail wurde an ${data.recipient || meta?.admin_email || "Admin"} versendet.`);
    } catch (err) {
      setError(err.message || "Testmail konnte nicht versendet werden.");
    } finally {
      setSendingTest(false);
    }
  };

  const deleteMeldung = async (id) => {
    if (!window.confirm("Systemmeldung wirklich loeschen?")) return;
    await fetch(`${API_BASE}/systemmeldung.php?action=delete&id=${id}`);
    loadHistory();
  };

  if (!isAdmin) {
    return <InfoBox>Du hast keine Berechtigung, Systemmeldungen zu verwalten.</InfoBox>;
  }

  return (
    <>
      <Header />
      <Page>
        <HeroCard>
          <div>
            <Kicker>Admin</Kicker>
            <h1>{editingId ? "Systemmeldung bearbeiten" : "Systemmeldung schreiben"}</h1>
            <p>Formatiere Overlay und E-Mail getrennt, prüfe beide Vorschauen und versende Testmails an den Admin.</p>
          </div>
          <SummaryBadge>{meta?.all_users ?? 0} In-App Empfaenger</SummaryBadge>
        </HeroCard>

        {success && <StateCard>{success}</StateCard>}
        {error && <StateCard $error>{error}</StateCard>}

        <Form onSubmit={handleSubmit}>
          <Grid>
            <Card>
              <SectionHeader>
                <div>
                  <SectionTitle>Benachrichtigung</SectionTitle>
                  <SectionText>Diese Nachricht sehen alle Nutzer in der App und im Overlay nach Klick auf die Benachrichtigung.</SectionText>
                </div>
                <Eye size={20} />
              </SectionHeader>

              <FieldBlock>
                <Label>Titel</Label>
                <Input value={form.title} onChange={(event) => updateField("title", event.target.value)} required maxLength={160} />
              </FieldBlock>

              <FieldBlock>
                <Label>Overlay-Nachricht</Label>
                <Textarea value={form.message} onChange={(event) => updateField("message", event.target.value)} rows={10} required />
                <Hint>Markdown: `## Ueberschrift`, `- Listenpunkt`, `**fett**`, `[Link](https://...)`.</Hint>
              </FieldBlock>

              <ButtonGrid>
                <FieldBlock>
                  <Label>Overlay-Button</Label>
                  <Input value={form.link_label} onChange={(event) => updateField("link_label", event.target.value)} placeholder="z.B. Jetzt ansehen" />
                </FieldBlock>
                <FieldBlock>
                  <Label>Overlay-Link</Label>
                  <Input value={form.link_url} onChange={(event) => updateField("link_url", event.target.value)} placeholder="/challenge oder https://..." />
                </FieldBlock>
              </ButtonGrid>
            </Card>

            <Card>
              <SectionHeader>
                <div>
                  <SectionTitle>Overlay-Vorschau</SectionTitle>
                  <SectionText>So wirkt die Meldung im In-App-Overlay.</SectionText>
                </div>
              </SectionHeader>
              <PreviewFrame title="Overlay Vorschau" srcDoc={overlayPreviewHtml} sandbox="" />
            </Card>

            <Card>
              <SectionHeader>
                <div>
                  <SectionTitle>E-Mail</SectionTitle>
                  <SectionText>Standard: E-Mail nur an Nutzer mit aktivierten News/Systemmeldungen.</SectionText>
                </div>
                <Mail size={20} />
              </SectionHeader>

              <FieldBlock>
                <Label>Betreff</Label>
                <Input value={form.email_subject} onChange={(event) => updateField("email_subject", event.target.value)} placeholder={form.title ? `Ice-App: ${form.title}` : "Ice-App: ..."} maxLength={180} />
              </FieldBlock>

              <FieldBlock>
                <Label>Mail-Ueberschrift</Label>
                <Input value={form.email_heading} onChange={(event) => updateField("email_heading", event.target.value)} placeholder={form.title || "Ueberschrift"} maxLength={180} />
              </FieldBlock>

              <FieldBlock>
                <Label>Mailtext</Label>
                <Textarea value={form.email_body} onChange={(event) => updateField("email_body", event.target.value)} rows={12} />
                <Hint>Markdown: `## Ueberschrift`, `- Listenpunkt`, `**fett**`, `[Link](https://...)`, `[button: Text](https://...)`.</Hint>
              </FieldBlock>
            </Card>

            <Card>
              <SectionHeader>
                <div>
                  <SectionTitle>Zusätzliche Mail-Buttons</SectionTitle>
                  <SectionText>Optional am Ende der E-Mail, maximal fünf Buttons.</SectionText>
                </div>
                <SecondaryButton type="button" onClick={addButton} disabled={form.email_buttons.length >= 5}>
                  <Plus size={16} />
                  Button hinzufügen
                </SecondaryButton>
              </SectionHeader>

              <ButtonList>
                {form.email_buttons.map((button, index) => (
                  <ButtonRow key={index}>
                    <FieldBlock>
                      <Label>Text</Label>
                      <Input value={button.label} onChange={(event) => updateButton(index, "label", event.target.value)} />
                    </FieldBlock>
                    <FieldBlock>
                      <Label>URL</Label>
                      <Input value={button.url} onChange={(event) => updateButton(index, "url", event.target.value)} placeholder="https://ice-app.de/challenge" />
                    </FieldBlock>
                    <RemoveButton type="button" onClick={() => removeButton(index)}>
                      <Trash2 size={16} />
                      Entfernen
                    </RemoveButton>
                  </ButtonRow>
                ))}
              </ButtonList>
            </Card>

            <Card>
              <SectionHeader>
                <div>
                  <SectionTitle>E-Mail-Vorschau</SectionTitle>
                  <SectionText>HTML-Vorschau inklusive Markdown, Buttons und Hinweistext.</SectionText>
                </div>
              </SectionHeader>
              <PreviewMeta>
                <span>Betreff</span>
                <strong>{form.email_subject || (form.title ? `Ice-App: ${form.title}` : "Noch kein Betreff")}</strong>
              </PreviewMeta>
              <PreviewFrame title="E-Mail Vorschau" srcDoc={mailPreviewHtml} sandbox="" />
            </Card>

            <Card>
              <SectionTitle>Versand</SectionTitle>
              <RadioGrid>
                <RadioCard $active={form.mail_send_mode === "subscribers"}>
                  <input type="radio" name="mailMode" checked={form.mail_send_mode === "subscribers"} onChange={() => updateField("mail_send_mode", "subscribers")} />
                  <div>
                    <strong>In-App an alle, E-Mail nach Einstellung</strong>
                    <span>{meta?.email_subscribers ?? 0} Mail-Empfänger</span>
                  </div>
                </RadioCard>
                <RadioCard $active={form.mail_send_mode === "none"}>
                  <input type="radio" name="mailMode" checked={form.mail_send_mode === "none"} onChange={() => updateField("mail_send_mode", "none")} />
                  <div>
                    <strong>Nur In-App</strong>
                    <span>Keine E-Mail versenden.</span>
                  </div>
                </RadioCard>
                <RadioCard $active={form.mail_send_mode === "all"}>
                  <input type="radio" name="mailMode" checked={form.mail_send_mode === "all"} onChange={() => updateField("mail_send_mode", "all")} />
                  <div>
                    <strong>E-Mail an alle</strong>
                    <span>{meta?.email_all ?? 0} Mail-Empfänger, Einstellungen werden ignoriert.</span>
                  </div>
                </RadioCard>
              </RadioGrid>

              {form.mail_send_mode === "all" && (
                <DangerBox>
                  <CheckboxLabel>
                    <input type="checkbox" checked={form.force_mail_all_confirmed} onChange={(event) => updateField("force_mail_all_confirmed", event.target.checked)} />
                    Ich bestätige, dass diese E-Mail unabhängig von den Nutzer-Einstellungen an alle Nutzer mit E-Mail-Adresse gesendet wird.
                  </CheckboxLabel>
                  <FieldBlock>
                    <Label>Bestätigungstext</Label>
                    <Input value={form.force_mail_all_confirm_text} onChange={(event) => updateField("force_mail_all_confirm_text", event.target.value)} placeholder={FORCE_MAIL_CONFIRM_TEXT} />
                  </FieldBlock>
                </DangerBox>
              )}

              <SendSummary>
                <span>In-App</span>
                <strong>{meta?.all_users ?? 0} Nutzer</strong>
              </SendSummary>
              <SendSummary>
                <span>E-Mail</span>
                <strong>{recipientLabel}</strong>
              </SendSummary>

              <ActionRow>
                <SecondaryButton type="button" onClick={sendTestMail} disabled={sendingTest || loading}>
                  <Mail size={16} />
                  {sendingTest ? "Sendet..." : `Testmail an Admin${meta?.admin_email ? ` (${meta.admin_email})` : ""}`}
                </SecondaryButton>
                <ActionButton type="submit" disabled={loading || sendingTest}>
                  <Send size={16} />
                  {loading ? "Speichern..." : editingId ? "Änderungen speichern" : "Systemmeldung erstellen"}
                </ActionButton>
                {editingId && <SecondaryButton type="button" onClick={resetForm}>Abbrechen</SecondaryButton>}
              </ActionRow>
            </Card>
          </Grid>
        </Form>

        <Card>
          <SectionHeader>
            <div>
              <SectionTitle>Historie</SectionTitle>
              <SectionText>Bereits erstellte Systemmeldungen können bearbeitet oder gelöscht werden.</SectionText>
            </div>
          </SectionHeader>
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Titel</th>
                  <th>Overlay</th>
                  <th>E-Mail</th>
                  <th>Erstellt</th>
                  <th>Status</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {meldungen.map((meldung) => (
                  <tr key={meldung.id}>
                    <td>{meldung.id}</td>
                    <td>{meldung.titel}</td>
                    <td>{meldung.nachricht}</td>
                    <td>{meldung.email_subject || "-"}</td>
                    <td>{meldung.erstellt_am}</td>
                    <td>{meldung.benachrichtigungen_gelesen} / {meldung.benachrichtigungen_total} gelesen</td>
                    <td>
                      <InlineActions>
                        <SecondaryButton type="button" onClick={() => startEditing(meldung)}>Bearbeiten</SecondaryButton>
                        <DeleteButton type="button" onClick={() => deleteMeldung(meldung.id)}>Löschen</DeleteButton>
                      </InlineActions>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        </Card>
      </Page>
    </>
  );
}

const Page = styled.main`
  width: min(96%, 1180px);
  margin: 0 auto;
  padding: 1rem 0 2rem;
`;

const HeroCard = styled.section`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  flex-wrap: wrap;
  background: #fffdfa;
  border-radius: 14px;
  border: 1px solid #f3e5bd;
  box-shadow: 0 2px 8px rgba(255, 181, 34, 0.08);
  padding: 1.2rem;
  margin-bottom: 1rem;

  h1 {
    margin: 0.2rem 0 0;
    color: #2d1d00;
  }

  p {
    margin: 0.45rem 0 0;
    color: #7c4f00;
    line-height: 1.45;
  }
`;

const Kicker = styled.div`
  color: #9a6500;
  font-weight: 900;
  text-transform: uppercase;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
`;

const Grid = styled.div`
  display: grid;
  gap: 1rem;
`;

const Card = styled.section`
  background: #fffdfa;
  border-radius: 12px;
  border: 1px solid #f3e5bd;
  box-shadow: 0 2px 8px rgba(255, 181, 34, 0.08);
  padding: 1.1rem;
  margin-bottom: 1rem;
`;

const StateCard = styled(Card)`
  color: ${({ $error }) => ($error ? "#9f1239" : "#166534")};
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: 0.9rem;
  color: #7c4f00;
`;

const SectionTitle = styled.h2`
  margin: 0 0 0.35rem;
  color: #2d1d00;
  font-size: 1.08rem;
`;

const SectionText = styled.p`
  margin: 0;
  color: #7c4f00;
  line-height: 1.45;
`;

const Form = styled.form`
  display: block;
`;

const FieldBlock = styled.label`
  display: grid;
  gap: 0.35rem;
  margin-bottom: 0.85rem;
`;

const Label = styled.span`
  color: #7c4f00;
  font-weight: 800;
`;

const Input = styled.input`
  width: 100%;
  border: 1px solid #ead7ab;
  border-radius: 10px;
  padding: 0.7rem 0.8rem;
  font: inherit;
  color: #2d1d00;
  background: #fffef9;
  box-sizing: border-box;
`;

const Textarea = styled.textarea`
  width: 100%;
  border: 1px solid #ead7ab;
  border-radius: 10px;
  padding: 0.7rem 0.8rem;
  font: inherit;
  color: #2d1d00;
  background: #fffef9;
  box-sizing: border-box;
  resize: vertical;
`;

const Hint = styled.span`
  color: #8a6a24;
  font-size: 0.86rem;
`;

const ButtonGrid = styled.div`
  display: grid;
  gap: 0.8rem;

  @media (min-width: 760px) {
    grid-template-columns: minmax(160px, 0.7fr) minmax(260px, 1.3fr);
  }
`;

const PreviewFrame = styled.iframe`
  display: block;
  width: 100%;
  height: min(680px, 76vh);
  border: 1px solid #ead7ab;
  border-radius: 14px;
  background: #fff7e8;
`;

const PreviewMeta = styled.div`
  display: grid;
  gap: 0.25rem;
  border: 1px solid #f3e5bd;
  border-radius: 12px;
  background: #fffaf0;
  padding: 0.8rem;
  margin-bottom: 0.85rem;
  color: #2d1d00;

  span {
    color: #7c4f00;
    font-weight: 800;
    font-size: 0.86rem;
  }
`;

const ButtonList = styled.div`
  display: grid;
  gap: 0.8rem;
`;

const ButtonRow = styled.div`
  display: grid;
  gap: 0.75rem;
  align-items: end;

  @media (min-width: 820px) {
    grid-template-columns: minmax(180px, 0.7fr) minmax(280px, 1.3fr) auto;
  }
`;

const RadioGrid = styled.div`
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  margin-bottom: 1rem;
`;

const RadioCard = styled.label`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.65rem;
  align-items: start;
  border: 1px solid ${({ $active }) => ($active ? "#ffb522" : "#f3e5bd")};
  border-radius: 12px;
  background: ${({ $active }) => ($active ? "#fff3c2" : "#fffaf0")};
  padding: 0.8rem;
  cursor: pointer;

  span {
    display: block;
    margin-top: 0.22rem;
    color: #7c4f00;
    font-size: 0.9rem;
  }
`;

const DangerBox = styled.div`
  border: 1px solid #fecaca;
  border-radius: 12px;
  background: #fff1f2;
  padding: 0.9rem;
  margin-bottom: 1rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  gap: 0.45rem;
  align-items: flex-start;
  color: #7c1d1d;
  font-weight: 800;
  margin-bottom: 0.8rem;
`;

const SendSummary = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border: 1px solid #f3e5bd;
  border-radius: 12px;
  background: #fffaf0;
  padding: 0.85rem;
  margin: 0.75rem 0;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 0.7rem;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 1rem;
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border: none;
  border-radius: 10px;
  padding: 0.72rem 1rem;
  background: #ffb522;
  color: #2d1d00;
  font-weight: 900;
  cursor: pointer;

  &:disabled {
    opacity: 0.65;
    cursor: wait;
  }
`;

const SecondaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border: 1px solid #ecd49b;
  border-radius: 10px;
  padding: 0.65rem 0.95rem;
  background: #fff5df;
  color: #7c4f00;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

const RemoveButton = styled(SecondaryButton)`
  color: #9f1239;
`;

const DeleteButton = styled(SecondaryButton)`
  color: #9f1239;
`;

const SummaryBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: #fff3c2;
  border: 1px solid #f3e5bd;
  color: #7c4f00;
  font-weight: 800;
`;

const TableWrap = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;

  th,
  td {
    border-bottom: 1px solid #f3e5bd;
    padding: 0.65rem 0.55rem;
    text-align: left;
    vertical-align: top;
  }

  th {
    color: #7c4f00;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  td:nth-child(3) {
    max-width: 340px;
    white-space: pre-line;
  }
`;

const InlineActions = styled.div`
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
`;

const InfoBox = styled.div`
  margin: 2rem auto;
  padding: 1rem;
  max-width: 500px;
  text-align: center;
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
  border-radius: 8px;
`;
