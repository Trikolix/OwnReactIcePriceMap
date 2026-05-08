import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import styled from "styled-components";
import Header from "./Header";
import Footer from "./Footer";
import Seo from "../../components/Seo";
import { getApiBaseUrl } from "../../shared/api/client";
import { useUser } from "../../context/UserContext";
import {
  EVENT_LOGIN_REQUIRED_MESSAGE,
  getEventAccessErrorMessage,
  readEventApiJson,
} from "./eventAuthMessages";

const emptyButton = () => ({ label: "", url: "" });

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

function renderInlineMarkdownHtml(text) {
  const tokens = [];
  let nextText = String(text || "").replace(/\[button:\s*([^\]]+)\]\((https?:\/\/[^)\s]+)\)/gi, (match, label, url) => {
    if (!isSafeHttpUrl(url)) return escapeHtml(match);
    const key = `%%ICEAPP_TOKEN_${tokens.length}%%`;
    tokens.push([
      key,
      `<a href="${escapeHtml(url)}" style="display:inline-block;background:#2d1d00;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 18px;border-radius:10px;margin:4px 0;">${escapeHtml(label.trim())}</a>`,
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

function parseMailMarkdownBlocks(markdown) {
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

function buildPreviewHtml({ heading, body, buttons, includeSettingsHint }) {
  const blocks = parseMailMarkdownBlocks(body);
  const safeHeading = escapeHtml(heading || "Mail-Überschrift");
  const safeSettingsUrl = "https://ice-app.de/account/settings";
  let content = "";

  blocks.forEach((block) => {
    if (block.type === "heading") {
      const fontSize = block.level === 1 ? "23px" : block.level === 2 ? "20px" : "18px";
      content += `<h2 style="margin:22px 0 10px;font-size:${fontSize};line-height:1.25;color:#2d1d00;">${escapeHtml(block.text)}</h2>`;
    } else if (block.type === "list") {
      content += '<ul style="margin:0 0 18px;padding-left:22px;">';
      block.items.forEach((item) => {
        content += `<li style="margin:0 0 8px;">${renderInlineMarkdownHtml(item)}</li>`;
      });
      content += "</ul>";
    } else {
      content += `<p style="margin:0 0 16px;">${renderInlineMarkdownHtml(block.text).replace(/\n/g, "<br>")}</p>`;
    }
  });

  const validButtons = (buttons || []).filter((button) => button.label?.trim() && isSafeHttpUrl(button.url));
  if (validButtons.length > 0) {
    content += '<div style="display:block;margin:8px 0 22px;">';
    validButtons.forEach((button) => {
      content += `<a href="${escapeHtml(button.url)}" style="display:inline-block;background:#2d1d00;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 18px;border-radius:10px;margin:0 8px 8px 0;">${escapeHtml(button.label.trim())}</a>`;
    });
    content += "</div>";
  }

  const settingsFooter = includeSettingsHint
    ? `<div style="border-top:1px solid #f3dfad;background:#fff8e8;padding:18px 28px;color:#8a6a24;font-size:13px;line-height:1.45;">Du erhältst diese Nachricht, weil du Ice-App News abonniert hast. Deine Benachrichtigungseinstellungen kannst du jederzeit in der Ice-App ändern: <a href="${safeSettingsUrl}" style="color:#9a6500;text-decoration:underline;">Benachrichtigungseinstellungen öffnen</a>.</div>`
    : "";

  return `<!doctype html><html><body style="margin:0;background:#fff7e8;font-family:Arial,Helvetica,sans-serif;color:#2d1d00;">
    <div style="max-width:680px;margin:0 auto;padding:28px 16px;">
      <div style="background:#fffdfa;border:1px solid #f3dfad;border-radius:18px;overflow:hidden;box-shadow:0 8px 24px rgba(124,79,0,0.10);">
        <div style="background:#ffb522;color:#2d1d00;padding:24px 28px;">
          <div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Ice-Tour</div>
          <h1 style="margin:8px 0 0;font-size:28px;line-height:1.18;">${safeHeading}</h1>
        </div>
        <div style="padding:28px;line-height:1.6;font-size:16px;">
          ${content || '<p style="margin:0 0 16px;color:#7a5200;">Mailtext erscheint hier.</p>'}
        </div>
        ${settingsFooter}
      </div>
    </div>
  </body></html>`;
}

export default function EventAdminMail() {
  const apiUrl = getApiBaseUrl();
  const { authToken, authReady, isLoggedIn, userId } = useUser();
  const isAdmin = Number(userId) === 1;
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    sendMode: "test",
    testEmail: "",
    subject: "",
    heading: "",
    body: "Hallo zusammen,\n\n## Aktuelles zur Ice-Tour\n\nHier kommt ein Update zur Ice-Tour.\n\n[button: Zum Teilnehmerbereich](https://ice-app.de/event-me)",
    includeSettingsHintForTest: false,
    buttons: [],
  });

  useEffect(() => {
    if (!apiUrl || !authReady) return;
    if (!isLoggedIn || !authToken) {
      setMeta(null);
      setError(EVENT_LOGIN_REQUIRED_MESSAGE);
      setLoading(false);
      return;
    }
    if (!isAdmin) {
      setMeta(null);
      setError("Nur Admins können diese Seite öffnen.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch(`${apiUrl}/event2026/admin_bulk_mail.php`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then(async (res) => {
        const json = await readEventApiJson(res);
        if (!res.ok || json?.status !== "success") {
          throw new Error(getEventAccessErrorMessage(res.status, json?.message || "Mail-Daten konnten nicht geladen werden."));
        }
        if (!cancelled) {
          setMeta(json);
          setForm((current) => ({
            ...current,
            testEmail: current.testEmail || json.admin_email || "",
          }));
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Mail-Daten konnten nicht geladen werden.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiUrl, authReady, authToken, isAdmin, isLoggedIn]);

  const recipientLabel = useMemo(() => {
    if (form.sendMode === "test") return form.testEmail || "Test-E-Mail";
    if (form.sendMode === "newsletter") return `${meta?.counts?.newsletter ?? 0} Newsletter-Abonnenten`;
    return `${meta?.counts?.all ?? 0} Teilnehmer`;
  }, [form.sendMode, form.testEmail, meta?.counts?.all, meta?.counts?.newsletter]);

  const previewHtml = useMemo(() => buildPreviewHtml({
    heading: form.heading,
    body: form.body,
    buttons: form.buttons,
    includeSettingsHint: form.sendMode === "newsletter" || (form.sendMode === "test" && form.includeSettingsHintForTest),
  }), [form.body, form.buttons, form.heading, form.includeSettingsHintForTest, form.sendMode]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateButton = (index, key, value) => {
    setForm((current) => ({
      ...current,
      buttons: current.buttons.map((button, buttonIndex) => (
        buttonIndex === index ? { ...button, [key]: value } : button
      )),
    }));
  };

  const addButton = () => {
    setForm((current) => ({
      ...current,
      buttons: current.buttons.length >= 5 ? current.buttons : [...current.buttons, emptyButton()],
    }));
  };

  const removeButton = (index) => {
    setForm((current) => ({
      ...current,
      buttons: current.buttons.filter((_, buttonIndex) => buttonIndex !== index),
    }));
  };

  const sendMail = async () => {
    if (!apiUrl || !authToken) return;
    setSending(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`${apiUrl}/event2026/admin_bulk_mail.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          send_mode: form.sendMode,
          test_email: form.testEmail,
          subject: form.subject,
          heading: form.heading,
          body: form.body,
          include_settings_hint_for_test: form.includeSettingsHintForTest,
          buttons: form.buttons,
        }),
      });
      const json = await readEventApiJson(res);
      if (!res.ok || json?.status !== "success") {
        throw new Error(getEventAccessErrorMessage(res.status, json?.message || "Mail konnte nicht versendet werden."));
      }
      const failedSuffix = json.failed_count > 0 ? ` ${json.failed_count} fehlgeschlagen.` : "";
      setNotice(`${json.message} ${json.sent_count}/${json.recipient_count} versendet.${failedSuffix}`);
    } catch (err) {
      setError(err.message || "Mail konnte nicht versendet werden.");
    } finally {
      setSending(false);
    }
  };

  if (authReady && (!isLoggedIn || !isAdmin)) {
    return <Navigate to="/ice-tour" replace />;
  }

  return (
    <Page>
      <Seo title="Ice-Tour Admin Mail" description="Admin-Mailversand für Ice-Tour Teilnehmer." robots="noindex,nofollow" />
      <Header />
      <Container>
        <HeroCard>
          <div>
            <Kicker>Ice-Tour Admin</Kicker>
            <h1>Teilnehmer-Mail schreiben</h1>
            <p>Versende schön formatierte HTML-Mails an Testempfänger, Newsletter-Abonnenten oder alle Teilnehmer.</p>
          </div>
          <AdminLink href="/event-admin">Zur Admin-Übersicht</AdminLink>
        </HeroCard>

        {loading && <Card>Daten werden geladen...</Card>}
        {error && <StateCard $error>{error}</StateCard>}
        {notice && <StateCard>{notice}</StateCard>}

        {isAdmin && (
        <Grid>
          <Card>
            <SectionTitle>Empfänger</SectionTitle>
            <RadioGrid>
              <RadioCard $active={form.sendMode === "test"}>
                <input
                  type="radio"
                  name="sendMode"
                  checked={form.sendMode === "test"}
                  onChange={() => updateField("sendMode", "test")}
                />
                <div>
                  <strong>Test-Mail</strong>
                  <span>Nur an eine einzelne Adresse senden.</span>
                </div>
              </RadioCard>
              <RadioCard $active={form.sendMode === "newsletter"}>
                <input
                  type="radio"
                  name="sendMode"
                  checked={form.sendMode === "newsletter"}
                  onChange={() => updateField("sendMode", "newsletter")}
                />
                <div>
                  <strong>Newsletter-Abonnenten</strong>
                  <span>{meta?.counts?.newsletter ?? 0} Empfänger mit aktivierten News.</span>
                </div>
              </RadioCard>
              <RadioCard $active={form.sendMode === "all"}>
                <input
                  type="radio"
                  name="sendMode"
                  checked={form.sendMode === "all"}
                  onChange={() => updateField("sendMode", "all")}
                />
                <div>
                  <strong>Alle Teilnehmer</strong>
                  <span>{meta?.counts?.all ?? 0} eindeutige Teilnehmer-E-Mails.</span>
                </div>
              </RadioCard>
            </RadioGrid>

            {form.sendMode === "test" && (
              <FieldBlock>
                <Label>Test-E-Mail</Label>
                <Input
                  type="email"
                  value={form.testEmail}
                  onChange={(event) => updateField("testEmail", event.target.value)}
                  placeholder="deine-mail@example.com"
                />
                <CheckboxLabel>
                  <input
                    type="checkbox"
                    checked={form.includeSettingsHintForTest}
                    onChange={(event) => updateField("includeSettingsHintForTest", event.target.checked)}
                  />
                  Hinweis zu Benachrichtigungseinstellungen in Test-Mail anzeigen
                </CheckboxLabel>
              </FieldBlock>
            )}

            <PreviewBox>
              <strong>Aktueller Versand:</strong>
              <span>{recipientLabel}</span>
              {form.sendMode === "newsletter" && <small>Die Mail enthält den Hinweis zu den Benachrichtigungseinstellungen.</small>}
              {form.sendMode === "all" && <small>Die Mail enthält keinen Hinweis zu Benachrichtigungseinstellungen.</small>}
            </PreviewBox>
          </Card>

          <Card>
            <SectionTitle>Inhalt</SectionTitle>
            <FieldBlock>
              <Label>Betreff</Label>
              <Input value={form.subject} onChange={(event) => updateField("subject", event.target.value)} maxLength={160} />
            </FieldBlock>
            <FieldBlock>
              <Label>Mail-Überschrift</Label>
              <Input value={form.heading} onChange={(event) => updateField("heading", event.target.value)} maxLength={160} />
            </FieldBlock>
            <FieldBlock>
              <Label>Text</Label>
              <Textarea
                value={form.body}
                onChange={(event) => updateField("body", event.target.value)}
                rows={11}
                placeholder={"Hallo zusammen,\n\nhier kommt ein Update zur Ice-Tour..."}
              />
              <Hint>
                Unterstützt Markdown: `## Überschrift`, `- Listenpunkt`, `**fett**`, `[Link](https://...)` und
                `[button: Button-Text](https://...)` für Buttons direkt an dieser Stelle.
              </Hint>
            </FieldBlock>
          </Card>

          <Card>
            <SectionHeader>
              <div>
                <SectionTitle>Zusätzliche Buttons</SectionTitle>
                <SectionText>
                  Optional: Diese Buttons werden am Ende der Mail ergänzt. Für Buttons an einer bestimmten Stelle nutze im Text `[button: Text](https://...)`.
                </SectionText>
              </div>
              <SecondaryButton type="button" onClick={addButton} disabled={form.buttons.length >= 5}>Button hinzufügen</SecondaryButton>
            </SectionHeader>
            <ButtonList>
              {form.buttons.map((button, index) => (
                <ButtonRow key={index}>
                  <FieldBlock>
                    <Label>Button-Text</Label>
                    <Input value={button.label} onChange={(event) => updateButton(index, "label", event.target.value)} />
                  </FieldBlock>
                  <FieldBlock>
                    <Label>URL</Label>
                    <Input value={button.url} onChange={(event) => updateButton(index, "url", event.target.value)} placeholder="https://ice-app.de/event-me" />
                  </FieldBlock>
                  <RemoveButton type="button" onClick={() => removeButton(index)}>Entfernen</RemoveButton>
                </ButtonRow>
              ))}
            </ButtonList>
          </Card>

          <Card>
            <SectionHeader>
              <div>
                <SectionTitle>Live HTML-Vorschau</SectionTitle>
                <SectionText>
                  Vorschau des HTML-Mail-Layouts inklusive Markdown-Formatierungen, Inline-Buttons und Benachrichtigungshinweis.
                </SectionText>
              </div>
            </SectionHeader>
            <PreviewMeta>
              <span>Betreff</span>
              <strong>{form.subject || "Noch kein Betreff"}</strong>
            </PreviewMeta>
            <PreviewFrame
              title="Live HTML Email Vorschau"
              srcDoc={previewHtml}
              sandbox=""
            />
          </Card>

          <Card>
            <SectionTitle>Versenden</SectionTitle>
            <SectionText>
              Sende zuerst eine Test-Mail an dich selbst. Danach kannst du auf Newsletter-Abonnenten oder alle Teilnehmer umstellen.
            </SectionText>
            <SendSummary>
              <span>Empfänger</span>
              <strong>{recipientLabel}</strong>
            </SendSummary>
            <ActionButton type="button" onClick={sendMail} disabled={sending || loading}>
              {sending ? "Wird gesendet..." : form.sendMode === "test" ? "Test-Mail senden" : "Mail senden"}
            </ActionButton>
          </Card>
        </Grid>
        )}
      </Container>
      <Footer />
    </Page>
  );
}

const Page = styled.div`
  min-height: 100vh;
  background: var(--event-bg);
`;

const Container = styled.main`
  width: min(96%, 1120px);
  margin: 0 auto;
  padding: 1rem;
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
  }
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
`;

const StateCard = styled(Card)`
  margin-bottom: 1rem;
  color: ${({ $error }) => ($error ? "#9f1239" : "#166534")};
`;

const Kicker = styled.div`
  color: #9a6500;
  font-weight: 900;
  text-transform: uppercase;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: 0.9rem;
`;

const SectionTitle = styled.h2`
  margin: 0 0 0.8rem;
  color: #2d1d00;
  font-size: 1.08rem;
`;

const SectionText = styled.p`
  margin: 0.25rem 0 0;
  color: #7c4f00;
  line-height: 1.45;
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

const RadioGrid = styled.div`
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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

const CheckboxLabel = styled.label`
  display: flex;
  gap: 0.45rem;
  align-items: center;
  color: #7c4f00;
  font-weight: 700;
`;

const PreviewBox = styled.div`
  display: grid;
  gap: 0.3rem;
  border: 1px solid #f3e5bd;
  border-radius: 12px;
  background: #fffaf0;
  padding: 0.8rem;
  color: #2d1d00;

  small {
    color: #7c4f00;
  }
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

const PreviewFrame = styled.iframe`
  display: block;
  width: 100%;
  height: min(760px, 82vh);
  border: 1px solid #ead7ab;
  border-radius: 14px;
  background: #fff7e8;
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

const ActionButton = styled.button`
  border: none;
  border-radius: 10px;
  padding: 0.72rem 1rem;
  background: #ffb522;
  color: #2d1d00;
  font-weight: 900;
  cursor: pointer;

  &:disabled {
    opacity: 0.7;
    cursor: wait;
  }
`;

const SecondaryButton = styled.button`
  border: 1px solid #ecd49b;
  border-radius: 10px;
  padding: 0.65rem 0.95rem;
  background: #fff5df;
  color: #7c4f00;
  font-weight: 800;
  cursor: pointer;
`;

const RemoveButton = styled(SecondaryButton)`
  color: #9f1239;
`;

const SendSummary = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border: 1px solid #f3e5bd;
  border-radius: 12px;
  background: #fffaf0;
  padding: 0.85rem;
  margin: 0.9rem 0;
`;

const AdminLink = styled.a`
  border: 1px solid #ecd49b;
  border-radius: 10px;
  padding: 0.65rem 0.95rem;
  background: #fff5df;
  color: #7c4f00;
  font-weight: 800;
  text-decoration: none;
`;
