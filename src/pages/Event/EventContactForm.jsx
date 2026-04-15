import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { Mail, Send } from "lucide-react";
import { getApiBaseUrl } from "../../shared/api/client";
import { EVENT_PAYMENT_CONTACT_EMAIL } from "./eventConfig";

const FormCard = styled.div`
  background: #fff;
  border-radius: 20px;
  border: 1px solid rgba(47, 33, 0, 0.08);
  box-shadow: 0 12px 28px rgba(28, 20, 0, 0.08);
  padding: 1.2rem;
`;

const Intro = styled.p`
  color: #7c4f00;
  line-height: 1.6;
  margin: 0.85rem 0 0;
`;

const Form = styled.form`
  margin-top: 1rem;
`;

const Grid = styled.div`
  display: grid;
  gap: 0.9rem;
  grid-template-columns: 1fr;

  @media (min-width: 760px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  color: #5f4200;
  font-weight: 700;
  font-size: 0.95rem;
`;

const inputStyles = `
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(138, 87, 0, 0.18);
  background: #fffdf8;
  color: #2f2100;
  padding: 0.8rem 0.9rem;
  box-sizing: border-box;
  font: inherit;
  transition: border-color 150ms ease, box-shadow 150ms ease;

  &:focus {
    outline: none;
    border-color: #ffb522;
    box-shadow: 0 0 0 3px rgba(255, 181, 34, 0.18);
  }
`;

const Input = styled.input`
  ${inputStyles}
`;

const Textarea = styled.textarea`
  ${inputStyles}
  min-height: 160px;
  resize: vertical;
`;

const HiddenTrap = styled.div`
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
`;

const InlineNote = styled.p`
  color: rgba(47, 33, 0, 0.7);
  line-height: 1.55;
  margin: 0.8rem 0 0;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
`;

const SubmitButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  border-radius: 12px;
  background: #ffb522;
  color: #fff;
  font: inherit;
  font-weight: 800;
  padding: 0.82rem 1.15rem;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(255, 181, 34, 0.24);

  &:disabled {
    cursor: wait;
    opacity: 0.75;
  }
`;

const MailFallback = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #8a5700;
  text-decoration: none;
  font-weight: 700;
`;

const PrivacyRow = styled.label`
  display: flex;
  gap: 0.7rem;
  align-items: flex-start;
  margin-top: 1rem;
  color: #5f4200;
  line-height: 1.5;
`;

const Checkbox = styled.input`
  margin-top: 0.2rem;
`;

const LegalLink = styled(Link)`
  color: #8a5700;
  font-weight: 700;
`;

const Banner = styled.div`
  margin-top: 1rem;
  border-radius: 14px;
  padding: 0.9rem 1rem;
  line-height: 1.5;
  border: 1px solid ${({ $tone }) => ($tone === "danger" ? "rgba(190, 24, 93, 0.18)" : "rgba(22, 101, 52, 0.2)")};
  background: ${({ $tone }) => ($tone === "danger" ? "#fff1f2" : "#f0fdf4")};
  color: ${({ $tone }) => ($tone === "danger" ? "#9f1239" : "#166534")};
`;

const initialFormState = {
  name: "",
  email: "",
  organisation: "",
  phone: "",
  message: "",
  website: "",
  privacyAccepted: false,
};

export default function EventContactForm({
  title = "Kontakt zur Ice-Tour",
  description = "Schreibe uns direkt über das Formular. Wir melden uns anschließend per E-Mail zurück.",
  sourcePage = "ice-tour",
}) {
  const apiUrl = getApiBaseUrl();
  const [formState, setFormState] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const formDisabled = useMemo(() => !apiUrl || submitting, [apiUrl, submitting]);

  const handleFieldChange = (field, value) => {
    setFormState((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!apiUrl) {
      setError("Das Kontaktformular ist aktuell nicht erreichbar. Bitte schreibe uns direkt per E-Mail.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");
    setFieldErrors({});

    try {
      const response = await fetch(`${apiUrl}/event2026/contact_request.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formState.name,
          email: formState.email,
          organisation: formState.organisation,
          phone: formState.phone,
          message: formState.message,
          privacyAccepted: formState.privacyAccepted,
          website: formState.website,
          sourcePage,
        }),
      });

      const result = await response.json();
      if (!response.ok || result.status !== "success") {
        if (result?.field_errors && typeof result.field_errors === "object") {
          setFieldErrors(result.field_errors);
        }
        throw new Error(result?.message || "Deine Anfrage konnte gerade nicht gesendet werden.");
      }

      setFormState(initialFormState);
      setSuccess(result.message || "Deine Anfrage wurde gesendet.");
    } catch (submitError) {
      setError(submitError.message || "Deine Anfrage konnte gerade nicht gesendet werden.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormCard id="ice-tour-kontaktformular">
      <h2 style={{ margin: 0 }}>{title}</h2>
      <Intro>{description}</Intro>

      <Form onSubmit={handleSubmit} noValidate>
        <Grid>
          <Field>
            Name *
            <Input
              value={formState.name}
              onChange={(event) => handleFieldChange("name", event.target.value)}
              aria-invalid={Boolean(fieldErrors.name)}
              maxLength={120}
              required
            />
          </Field>
          <Field>
            E-Mail *
            <Input
              type="email"
              value={formState.email}
              onChange={(event) => handleFieldChange("email", event.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              maxLength={190}
              required
            />
          </Field>
          <Field>
            Organisation / Firma
            <Input
              value={formState.organisation}
              onChange={(event) => handleFieldChange("organisation", event.target.value)}
              maxLength={160}
            />
          </Field>
          <Field>
            Telefonnummer
            <Input
              value={formState.phone}
              onChange={(event) => handleFieldChange("phone", event.target.value)}
              maxLength={40}
            />
          </Field>
        </Grid>

        <Field style={{ marginTop: "0.9rem" }}>
          Nachricht *
          <Textarea
            value={formState.message}
            onChange={(event) => handleFieldChange("message", event.target.value)}
            aria-invalid={Boolean(fieldErrors.message)}
            maxLength={4000}
            required
          />
        </Field>

        <HiddenTrap aria-hidden="true">
          <label htmlFor={`website-${sourcePage}`}>Website</label>
          <input
            id={`website-${sourcePage}`}
            name="website"
            tabIndex="-1"
            autoComplete="off"
            value={formState.website}
            onChange={(event) => handleFieldChange("website", event.target.value)}
          />
        </HiddenTrap>

        <PrivacyRow>
          <Checkbox
            type="checkbox"
            checked={formState.privacyAccepted}
            onChange={(event) => handleFieldChange("privacyAccepted", event.target.checked)}
            required
          />
          <span>
            Ich habe die <LegalLink to="/datenschutz" target="_blank" rel="noreferrer">Datenschutzerklärung</LegalLink> und das <LegalLink to="/impressum" target="_blank" rel="noreferrer">Impressum</LegalLink> gelesen und stimme der Verarbeitung meiner Angaben zur Bearbeitung meiner Anfrage zu. *
          </span>
        </PrivacyRow>

        {(fieldErrors.name || fieldErrors.email || fieldErrors.message || fieldErrors.privacyAccepted) && (
          <InlineNote>
            Bitte prüfe deine Angaben. Pflichtfelder und Zustimmung zum Datenschutz müssen vollständig sein.
          </InlineNote>
        )}

        {error && <Banner $tone="danger">{error}</Banner>}
        {success && <Banner $tone="success">{success}</Banner>}

        <ActionRow>
          <SubmitButton type="submit" disabled={formDisabled}>
            <Send size={18} />
            {submitting ? "Anfrage wird gesendet..." : "Anfrage senden"}
          </SubmitButton>
          <MailFallback href={`mailto:${EVENT_PAYMENT_CONTACT_EMAIL}?subject=Ice-Tour%20Kontaktanfrage`}>
            <Mail size={16} />
            Alternativ direkt per E-Mail
          </MailFallback>
        </ActionRow>
      </Form>
    </FormCard>
  );
}
