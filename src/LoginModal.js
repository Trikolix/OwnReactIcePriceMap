import React, { useState } from "react";
import styled from "styled-components";
import { SubmitButton, Input } from './styles/SharedStyles';
import { useUser } from './context/UserContext';
import { Link } from 'react-router-dom';

const LoginModal = ({ setShowLoginModal }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const { userId, isLoggedIn, login } = useUser();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');

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
      console.log(data);
      if (data.status === 'success') {
        // Verwende den vom Server zurückgegebenen username statt der Eingabe
        const actualUsername = data.username;
        login(data.userId, actualUsername);
        console.log(userId);
        setMessage('Login erfolgreich!');

        localStorage.setItem('userId', data.userId);
        localStorage.setItem('username', actualUsername);

        // Schließen Sie das Modal nach 2 Sekunden
        setTimeout(() => {
          setShowLoginModal(false);
          setMessage('');
          setPassword('');
        }, 2000);
      } else {
        setMessage(`Login fehlgeschlagen: ${data.message}`);
      }
    } catch (error) {
      console.error("Error during login:", error); // Debugging
      setMessage('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    }
  };

  const handleRegister = async () => {
    if (!acceptedTerms) {
      setTermsError(true);
      return;
    }

    // Validierung für Leerzeichen im Benutzernamen
    if (username.includes(' ')) {
      setMessage('Benutzername darf keine Leerzeichen enthalten.');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/userManagement/register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password
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

  const resetForm = () => {
    setMessage('');
    setUsername('');
    setPassword('');
    setEmail('');
  };

  const closeLoginForm = () => {
    setShowLoginModal(false);
    resetForm();
    setIsRegisterMode(false);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: '1002' }}>
      <div className="modal-content" style={{ position: 'relative', zIndex: '1002' }}>
        <CloseX onClick={closeLoginForm}>x</CloseX>
        <h2>{isResetMode ? "Passwort zurücksetzen" : isRegisterMode ? "Registrieren" : "Login"}</h2>

        <form onSubmit={(e) => {
          e.preventDefault();
          if (isResetMode) {
            handlePasswordReset();
          } else if (isRegisterMode) {
            handleRegister();
          } else {
            handleLogin();
          }
        }}>
          {!isResetMode && (<Input
            type="text"
            placeholder={isRegisterMode ? "Benutzername (ohne Leerzeichen)" : "Benutzername oder E-Mail"}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />)}
          {isRegisterMode && (<Input
              type="email"
              placeholder="E-Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          )}
          {!isResetMode && (<><Input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          /><br /></>)}
          {!isRegisterMode && !isResetMode && (
                <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsResetMode(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0077cc',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Passwort vergessen?
                  </button>
                </p>
              )}

          {isResetMode && (
            <>
              <Input
                type="email"
                placeholder="E-Mail-Adresse"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
              <p style={{ fontSize: '0.9rem' }}>
                { resetMessage || "Du bekommst eine E-Mail mit einem Link, um dein Passwort zurückzusetzen."}
              </p>
            </>
          )}
          {isRegisterMode && (
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
            </div>)}

          <SubmitButton type="submit">{isResetMode ? "Passwort zurücksetzen" : isRegisterMode ? "Registrieren" : "Login"}</SubmitButton>
        </form>

        <p>{message}</p>
        {isLoggedIn && !isRegisterMode && <p>Willkommen zurück, {username}!</p>}

        {isResetMode ? (
          <p>
            <SmallButton onClick={() => setIsResetMode(false)}>Zurück zum Login</SmallButton>
          </p>
        ) : !isRegisterMode ? (
          <p>Noch keinen Account? <SmallButton onClick={() => setIsRegisterMode(true)}>Registrieren</SmallButton></p>
        ) : (
          <p>Bereits registriert? <SmallButton onClick={() => setIsRegisterMode(false)}>Zurück zum Login</SmallButton></p>
        )}

        <SmallButton onClick={closeLoginForm}>Schließen</SmallButton>
      </div>
    </div>
  );
};

export default LoginModal;

const CloseX = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
`;


const SmallButton = styled.button`
  padding: 0.5rem 0.5rem;
  background-color:rgb(148, 148, 148);
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

// SubmitButton and Input are imported from SharedStyles