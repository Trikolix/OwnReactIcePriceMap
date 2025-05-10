import React, { useState } from "react";
import styled from "styled-components";
import { useUser } from './context/UserContext';

const LoginModal = ({ setShowLoginModal }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const { userId, isLoggedIn, login } = useUser();
  const apiUrl = process.env.REACT_APP_API_BASE_URL;

  const handleLogin = async () => {
    try {
      const response = await fetch(`${apiUrl}/login.php`, {
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
        login(data.userId, username);
        console.log(userId);
        setMessage('Login erfolgreich!');

        localStorage.setItem('userId', data.userId);
        localStorage.setItem('username', username);

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
    try {
      const response = await fetch(`${apiUrl}/register.php`, {
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
        <h2>{isRegisterMode ? "Registrieren" : "Login"}</h2>

        <form onSubmit={(e) => {
          e.preventDefault();
          isRegisterMode ? handleRegister() : handleLogin();
        }}>
          <input
            type="text"
            placeholder="Benutzername"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          {isRegisterMode && (
            <input
              type="email"
              placeholder="E-Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          )}
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          /><br />


          <SubmitButton type="submit">{isRegisterMode ? "Registrieren" : "Login"}</SubmitButton>
        </form>

        <p>{message}</p>
        {isLoggedIn && !isRegisterMode && <p>Willkommen zurück, {username}!</p>}

        {!isRegisterMode ? (
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
  padding: 0.5rem 0.5rem;
  background-color:rgb(148, 148, 148);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
`;