import React, { useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import SocialAuthButtons from "./SocialAuthButtons";
import { useUser } from "../context/UserContext";

const RegisterForm = ({ onSuccess, onClose, inviteCode = null }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [termsError, setTermsError] = useState(false);
    const [newsletterOptIn, setNewsletterOptIn] = useState(false);
    const [pendingSocialRegistration, setPendingSocialRegistration] = useState(null);
    const { login } = useUser();

    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    const resetForm = () => {
        setUsername('');
        setEmail('');
        setPassword('');
        setAcceptedTerms(false);
        setTermsError(false);
        setNewsletterOptIn(false);
        setPendingSocialRegistration(null);
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!acceptedTerms) {
            setTermsError(true);
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/userManagement/register.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    inviteCode,
                    newsletterOptIn: newsletterOptIn ? 1 : 0,
                })
            });

            const data = await response.json();
            setMessage(data.message);

            if (data.status === 'success') {
                login(data.userId, data.username, data.token, data.expires_at);
                resetForm();
                if (onSuccess) onSuccess(data);
            }
        } catch (error) {
            console.error('Registrierung fehlgeschlagen:', error);
            setMessage('Ein Fehler ist aufgetreten. Bitte erneut versuchen.');
        }
    };

    const handleCompleteSocialRegistration = async (e) => {
        e.preventDefault();

        if (!pendingSocialRegistration) return;
        if (!acceptedTerms) {
            setTermsError(true);
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/userManagement/complete_social_registration.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pendingRegistrationToken: pendingSocialRegistration.pending_registration_token,
                    username,
                    acceptedTerms,
                    newsletterOptIn: newsletterOptIn ? 1 : 0,
                })
            });

            const data = await response.json();
            setMessage(data.message);

            if (data.status === 'success') {
                resetForm();
                if (onSuccess) onSuccess(data);
            }
        } catch (error) {
            console.error('Google-Registrierung fehlgeschlagen:', error);
            setMessage('Ein Fehler ist aufgetreten. Bitte erneut versuchen.');
        }
    };

    const isSocialCompletion = Boolean(pendingSocialRegistration);

    return (
        <Form onSubmit={isSocialCompletion ? handleCompleteSocialRegistration : handleRegister}>
            <h1>{isSocialCompletion ? 'Google-Registrierung abschließen' : 'Registrieren'}</h1>

            {isSocialCompletion && (
                <InfoBox>
                    <strong>Fast geschafft.</strong> Prüfe Benutzername und E-Mail und schließe danach deine Registrierung ab.
                </InfoBox>
            )}

            <Input
                type="text"
                placeholder="Benutzername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
            />
            <Input
                type="email"
                placeholder="E-Mail-Adresse"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={isSocialCompletion}
                required
            />

            {!isSocialCompletion && (
                <Input
                    type="password"
                    placeholder="Passwort"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            )}

            <div style={{ margin: '1rem 0' }}>
                <label>
                    <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={() => {
                            setAcceptedTerms(!acceptedTerms);
                            setTermsError(false);
                        }}
                        style={{ marginRight: '0.5rem' }}
                    />
                    Ich akzeptiere die{' '}
                    <StyledLink to="/agb" target="_blank">AGB</StyledLink>,{' '}
                    <StyledLink to="/datenschutz" target="_blank">Datenschutzerklärung</StyledLink> und{' '}
                    <StyledLink to="/community" target="_blank">Community-Richtlinien</StyledLink>.
                </label>
                {termsError && <ErrorText>Bitte bestätige die Bedingungen.</ErrorText>}
                <NewsletterLabel>
                    <input
                        type="checkbox"
                        checked={newsletterOptIn}
                        onChange={() => setNewsletterOptIn(!newsletterOptIn)}
                        style={{ marginRight: '0.5rem' }}
                    />
                    Ich möchte Systemmeldungen & News per E-Mail erhalten.
                </NewsletterLabel>
            </div>

            <SubmitButton type="submit">
                {isSocialCompletion ? 'Google-Registrierung abschließen' : 'Registrieren'}
            </SubmitButton>

            {!isSocialCompletion && (
                <SocialAuthButtons
                    mode="register"
                    inviteCode={inviteCode}
                    desiredUsername={username}
                    acceptedTerms={acceptedTerms}
                    requireAcceptedTerms={false}
                    onRequiresCompletion={(payload) => {
                        setPendingSocialRegistration(payload);
                        setUsername(payload.suggested_username || '');
                        setEmail(payload.email || '');
                        setAcceptedTerms(false);
                        setTermsError(false);
                        setNewsletterOptIn(false);
                        setMessage('');
                    }}
                    onSuccess={(data) => {
                        setMessage('Registrierung über externen Account erfolgreich.');
                        if (onSuccess) onSuccess(data);
                    }}
                />
            )}

            {message && <p>{message}</p>}

            {onClose && (
                <SmallButton type="button" onClick={onClose}>
                    Schließen
                </SmallButton>
            )}
        </Form>
    );
};

export default RegisterForm;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 1rem;
`;

const SubmitButton = styled.button`
  padding: 0.75rem 1.5rem;
  margin-top: 0.5rem;
  background-color: #ffb522;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
`;

const SmallButton = styled.button`
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: rgb(148, 148, 148);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
`;

const StyledLink = styled(Link)`
  color: #0077cc;
  text-decoration: underline;
  &:hover {
    color: #005999;
  }
`;

const ErrorText = styled.p`
  color: red;
  font-size: 0.9rem;
  margin-top: 0.25rem;
`;

const NewsletterLabel = styled.label`
  display: block;
  margin-top: 0.75rem;
`;

const InfoBox = styled.div`
  padding: 0.85rem 1rem;
  border-radius: 10px;
  background: #f6f8fb;
  color: #1f2937;
  text-align: left;
  line-height: 1.4;
`;
