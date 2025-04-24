import React, { useState } from "react";
import { useUser } from './context/UserContext';

const LoginModal = ({ setShowLoginModal }) => {
    const [message, setMessage] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { userId, isLoggedIn, login } = useUser();

    const handleLogin = async () => {
        try {
          const response = await fetch('https://ice-app.4lima.de/backend/login.php', {
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
            login(data.userId);
            console.log(userId);
            setMessage('Login erfolgreich!');
    
            localStorage.setItem('userId', data.userId);
    
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

      const closeLoginForm = () => {
        setShowLoginModal(false);
        setMessage('');
        setUsername('');
        setPassword('');
      };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ position: 'relative', zIndex: '1002' }}>
                <button className="close-button" style={{ position: 'relative', top: '-10px', right: '-150px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', outlineStyle: 'none' }} onClick={() => closeLoginForm()}>x</button>
                <h2>Login</h2>
                <form
                    onSubmit={(e) => {
                        e.preventDefault(); // Verhindert das Neuladen der Seite
                        handleLogin();
                    }}
                >
                    <input
                        type="text"
                        placeholder="Benutzername"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Passwort"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    /><br />
                    <button type="submit">Login</button>
                </form>
                <p>{message}</p>
                {isLoggedIn && <p>Willkommen zurück, {username}!</p>}
                <button onClick={() => closeLoginForm()}>Schließen</button>
            </div>
        </div>
    );
}

export default LoginModal;