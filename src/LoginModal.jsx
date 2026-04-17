import React, { useState } from "react";
import styled from "styled-components";
import { SubmitButton, Input } from './styles/SharedStyles';
import { useUser } from './context/UserContext';
import { Link } from 'react-router-dom';
import SocialAuthButtons from "./components/SocialAuthButtons";

const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_-]{2,19}$/;

const LoginModal = ({ setShowLoginModal, initialMode = 'login' }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(initialMode === 'register');
  const [isResetMode, setIsResetMode] = useState(false);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const { isLoggedIn, login } = useUser();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [pendingSocialRegistration, setPendingSocialRegistration] = useState(null);

  const resetForm = () => {
    setMessage('');
    setUsername('');
    setPassword('');
    setEmail('');
    setAcceptedTerms(false);
    setTermsError(false);
    setNewsletterOptIn(false);
    setPendingSocialRegistration(null);
  };

  const handleLogin = async () => {
    try {
      const response = await fetch(`${apiUrl}/userManagement/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        login(data.userId, data.username, data.token, data.expires_at);
        setMessage('Login erfolgreich!');
        setLoginSuccess(true);
        setTimeout(() => {
          setShowLoginModal(false);
          setMessage('');
          setPassword('');
          setLoginSuccess(false);
        }, 2000);
      } else {
        setMessage(`Login fehlgeschlagen: ${data.message}`);
      }
    } catch (error) {
      console.error("Error during login:", error);
      setMessage('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    }
  };

  const handleRegister = async () => {
    if (!acceptedTerms) {
      setTermsError(true);
      return;
    }

    if (!usernameRegex.test(username)) {
      setMessage('Benutzername: 3-20 Zeichen, nur Buchstaben, Zahlen, _ und -, muss mit Buchstabe beginnen.');
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
          newsletterOptIn: newsletterOptIn ? 1 : 0
        })
      });

      const data = await response.json();
      setMessage(data.message);
      if (data.status === 'success') {
        resetForm();
        setMessage(data.message);
        setIsRegisterMode(false);
      }
    } catch (error) {
      setMessage('Ein Fehler ist aufgetreten. Bitte erneut versuchen.');
    }
  };

  const handleCompleteSocialRegistration = async () => {
    if (!pendingSocialRegistration) return;

    if (!acceptedTerms) {
      setTermsError(true);
      return;
    }

    if (!usernameRegex.test(username)) {
      setMessage('Benutzername: 3-20 Zeichen, nur Buchstaben, Zahlen, _ und -, muss mit Buchstabe beginnen.');
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
          newsletterOptIn: newsletterOptIn ? 1 : 0
        })
      });

      const data = await response.json();
      setMessage(data.message);
      if (data.status === 'success') {
        login(data.userId, data.username, data.token, data.expires_at);
        resetForm();
        setLoginSuccess(true);
        setTimeout(() => {
          setShowLoginModal(false);
          setMessage('');
          setPassword('');
          setLoginSuccess(false);
        }, 1200);
      }
    } catch (error) {
      setMessage('Ein Fehler ist aufgetreten. Bitte erneut versuchen.');
    }
  };

  const handlePasswordReset = async () => {
    try {
      const response = await fetch(`${apiUrl}/userManagement/reset_password_request.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });

      const data = await response.json();
      setResetMessage(data.message);
      if (data.status === 'success') {
        setResetEmail('');
      }
    } catch (error) {
      console.error("Fehler beim Passwort-Reset:", error);
      setResetMessage("Ein Fehler ist aufgetreten. Bitte erneut versuchen.");
    }
  };

  const closeLoginForm = () => {
    setShowLoginModal(false);
    resetForm();
    setIsRegisterMode(false);
  };

  const isSocialCompletion = Boolean(pendingSocialRegistration);
  const modalTitle = isResetMode ? "Passwort zurücksetzen" : isRegisterMode ? "Registrieren" : "Login";
  const resetHint = resetMessage || "Du bekommst eine E-Mail mit einem Link, um dein Passwort zurückzusetzen.";
  const loginHint = isLoggedIn && !isRegisterMode ? `Willkommen zurück, ${username}!` : "";

  return (
    <ModalOverlay>
      <ModalCard>
        <CloseX onClick={closeLoginForm}>x</CloseX>
        <Title>{modalTitle}</Title>

        {loginSuccess ? (
          <MessageBlock>
            {message && <StatusText>{message}</StatusText>}
            {loginHint && <SubtleText>{loginHint}</SubtleText>}
          </MessageBlock>
        ) : (
          <>
            <Form onSubmit={(e) => {
              e.preventDefault();
              if (isResetMode) {
                handlePasswordReset();
              } else if (isSocialCompletion) {
                handleCompleteSocialRegistration();
              } else if (isRegisterMode) {
                handleRegister();
              } else {
                handleLogin();
              }
            }}>
              {isSocialCompletion && (
                <HintText>Fast geschafft. Bitte bestätige die Bedingungen und schließe deine Google-Registrierung ab.</HintText>
              )}

              {!isResetMode && (
                <ModalInput
                  type="text"
                  placeholder={isRegisterMode ? "Benutzername (ohne Leerzeichen)" : "Benutzername oder E-Mail"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              )}

              {isRegisterMode && (
                <ModalInput
                  type="email"
                  placeholder="E-Mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly={isSocialCompletion}
                  required
                />
              )}

              {!isResetMode && !isSocialCompletion && (
                <ModalInput
                  type="password"
                  placeholder="Passwort"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              )}

              {!isRegisterMode && !isResetMode && (
                <InlineRow>
                  <InlineTextButton
                    type="button"
                    onClick={() => setIsResetMode(true)}
                  >
                    Passwort vergessen?
                  </InlineTextButton>
                </InlineRow>
              )}

              {isResetMode && (
                <>
                  <ModalInput
                    type="email"
                    placeholder="E-Mail-Adresse"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                  <HintText>{resetHint}</HintText>
                </>
              )}

              {isRegisterMode && (
                <CheckboxGroup>
                  <CheckboxLabel>
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={() => {
                        setAcceptedTerms(!acceptedTerms);
                        setTermsError(false);
                      }}
                    />
                    <span>
                      Ich akzeptiere die{' '}
                      <StyledLink to="/agb" target="_blank">AGB</StyledLink>,{' '}
                      <StyledLink to="/datenschutz" target="_blank">Datenschutzerklärung</StyledLink> und{' '}
                      <StyledLink to="/community" target="_blank">Community-Richtlinien</StyledLink>.
                    </span>
                  </CheckboxLabel>
                  {termsError && <ErrorText>Bitte bestätige die Bedingungen.</ErrorText>}
                  <CheckboxLabel>
                    <input
                      type="checkbox"
                      checked={newsletterOptIn}
                      onChange={() => setNewsletterOptIn(!newsletterOptIn)}
                    />
                    <span>Ich möchte Systemmeldungen & News (Newsletter, Aktionen, wichtige Infos) per E-Mail erhalten.</span>
                  </CheckboxLabel>
                </CheckboxGroup>
              )}

              <PrimaryAction type="submit">
                {isResetMode ? "Passwort zurücksetzen" : isSocialCompletion ? "Google-Registrierung abschließen" : isRegisterMode ? "Registrieren" : "Login"}
              </PrimaryAction>
            </Form>

            {!isResetMode && !isSocialCompletion && (
              <SocialAuthButtons
                mode={isRegisterMode ? "register" : "login"}
                desiredUsername={isRegisterMode ? username : ""}
                acceptedTerms={acceptedTerms}
                requireAcceptedTerms={false}
                onRequiresCompletion={(payload) => {
                  setPendingSocialRegistration(payload);
                  setIsRegisterMode(true);
                  setUsername(payload.suggested_username || '');
                  setEmail(payload.email || '');
                  setAcceptedTerms(false);
                  setTermsError(false);
                  setNewsletterOptIn(false);
                  setPassword('');
                  setMessage('');
                }}
                onSuccess={() => {
                  setMessage(isRegisterMode ? "Registrierung erfolgreich." : "Login erfolgreich!");
                  if (isRegisterMode) {
                    setIsRegisterMode(false);
                    resetForm();
                    return;
                  }

                  setLoginSuccess(true);
                  setTimeout(() => {
                    setShowLoginModal(false);
                    setMessage('');
                    setPassword('');
                    setLoginSuccess(false);
                  }, 1200);
                }}
              />
            )}

            {message && <StatusText>{message}</StatusText>}
            {loginHint && <SubtleText>{loginHint}</SubtleText>}

            {isResetMode ? (
              <SwitchLine>
                <SwitchTextButton onClick={() => setIsResetMode(false)}>Zurück zum Login</SwitchTextButton>
              </SwitchLine>
            ) : !isRegisterMode ? (
              <SwitchLine>Noch keinen Account? <SwitchTextButton onClick={() => setIsRegisterMode(true)}>Registrieren</SwitchTextButton></SwitchLine>
            ) : (
              <SwitchLine>Bereits registriert? <SwitchTextButton onClick={() => {
                setIsRegisterMode(false);
                setPendingSocialRegistration(null);
              }}>Zurück zum Login</SwitchTextButton></SwitchLine>
            )}

            <FooterAction onClick={closeLoginForm}>Schließen</FooterAction>
          </>
        )}
      </ModalCard>
    </ModalOverlay>
  );
};

export default LoginModal;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: grid;
  place-items: center;
  background: rgba(15, 10, 0, 0.5);
  backdrop-filter: blur(2px);
  padding: 1rem;
`;

const ModalCard = styled.div`
  width: min(460px, 100%);
  max-height: min(90dvh, 760px);
  overflow-y: auto;
  background: linear-gradient(180deg, #fffdf8 0%, #fff6e6 100%);
  border: 1px solid rgba(47, 33, 0, 0.14);
  border-radius: 18px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.28);
  padding: 1.2rem;
  position: relative;
`;

const Title = styled.h2`
  margin: 0 2rem 0.9rem 0;
  color: #2f2100;
  font-size: 1.25rem;
`;

const Form = styled.form`
  display: grid;
  gap: 0.62rem;
`;

const ModalInput = styled(Input)`
  width: 100%;
  box-sizing: border-box;
  border-radius: 12px;
  border: 1px solid rgba(47, 33, 0, 0.22);
  padding: 0.65rem 0.75rem;
  font-size: 0.95rem;
  background: rgba(255, 255, 255, 0.95);
`;

const PrimaryAction = styled(SubmitButton)`
  width: 100%;
  margin: 0.3rem 0 0;
  color: #2f2100;
  background: linear-gradient(180deg, #ffd36f 0%, #ffb522 100%);
  border: 1px solid rgba(255, 181, 34, 0.65);
  border-radius: 12px;

  &:hover {
    background: linear-gradient(180deg, #ffd97f 0%, #ffbf3f 100%);
  }
`;

const MessageBlock = styled.div`
  display: grid;
  gap: 0.35rem;
`;

const StatusText = styled.p`
  margin: 0.35rem 0 0;
  font-size: 0.92rem;
  color: #5f3f00;
`;

const SubtleText = styled.p`
  margin: 0;
  color: rgba(47, 33, 0, 0.72);
  font-size: 0.9rem;
`;

const HintText = styled.p`
  margin: 0.1rem 0 0;
  color: rgba(47, 33, 0, 0.72);
  font-size: 0.88rem;
  line-height: 1.35;
`;

const InlineRow = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-top: -0.1rem;
`;

const InlineTextButton = styled.button`
  background: none;
  border: none;
  color: #8a5700;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  font-size: 0.9rem;
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 1rem 0;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #3f2b00;
  width: 100%;

  input {
    margin-top: 0.18rem;
  }

  & > span {
    text-align: left;
    flex: 1;
    line-height: 1.35;
  }
`;

const CloseX = styled.button`
  position: absolute;
  top: 0.65rem;
  right: 0.65rem;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  border: 1px solid rgba(47, 33, 0, 0.12);
  background: rgba(255, 255, 255, 0.86);
  color: #5b4520;
  font-size: 1.3rem;
  line-height: 1;
  cursor: pointer;

  &:hover {
    background: rgba(255, 181, 34, 0.16);
  }
`;

const SwitchLine = styled.p`
  margin: 0.55rem 0 0;
  font-size: 0.9rem;
  color: rgba(47, 33, 0, 0.76);
`;

const SwitchTextButton = styled.button`
  background: none;
  border: none;
  color: #8a5700;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  font-size: 0.9rem;
`;

const FooterAction = styled.button`
  width: 100%;
  margin-top: 0.55rem;
  padding: 0.56rem 0.8rem;
  border: 1px solid rgba(47, 33, 0, 0.2);
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.82);
  color: #4b3500;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.95);
  }
`;

const StyledLink = styled(Link)`
  color: #8a5700;
  text-decoration: underline;
  &:hover {
    color: #6f4300;
  }
`;

const ErrorText = styled.p`
  margin: 0.1rem 0 0;
  color: #c62828;
  font-size: 0.86rem;
`;
