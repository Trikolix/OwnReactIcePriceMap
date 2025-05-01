import React, { useState } from "react";
import { useUser } from './context/UserContext';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

const LoginModal = ({ setShowLoginModal }) => {
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegisterMode, setIsRegisterMode] = useState(false);

    const { login, isLoggedIn } = useUser();

    const auth = getAuth();

    const handleFirebaseLogin = async () => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            login(user.uid, email); // nutze deine Context-Funktion
            localStorage.setItem('userId', user.uid);
            localStorage.setItem('username', email);

            setMessage('Login erfolgreich!');
            setTimeout(() => setShowLoginModal(false), 2000);
        } catch (error) {
            setMessage(`Fehler beim Login: ${error.message}`);
        }
    };

    const handleFirebaseRegister = async () => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            login(user.uid, email);
            localStorage.setItem('userId', user.uid);
            localStorage.setItem('username', email);

            setMessage('Registrierung erfolgreich!');
            setTimeout(() => setShowLoginModal(false), 2000);
        } catch (error) {
            setMessage(`Fehler bei der Registrierung: ${error.message}`);
        }
    };

    const closeLoginForm = () => {
        setShowLoginModal(false);
        setMessage('');
        setEmail('');
        setPassword('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isRegisterMode) {
            handleFirebaseRegister();
        } else {
            handleFirebaseLogin();
        }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: '1002' }}>
            <div className="modal-content" style={{ position: 'relative', zIndex: '1002' }}>
                <button className="close-button" onClick={closeLoginForm}>x</button>
                <h2>{isRegisterMode ? 'Registrieren' : 'Login'}</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="E-Mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Passwort"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <br />
                    <button type="submit">{isRegisterMode ? 'Registrieren' : 'Login'}</button>
                </form>
                <p>{message}</p>
                {isLoggedIn && <p>Willkommen zurück, {email}!</p>}
                <button onClick={() => setIsRegisterMode(!isRegisterMode)}>
                    {isRegisterMode ? 'Zum Login wechseln' : 'Neu hier? Registrieren'}
                </button>
                <button onClick={closeLoginForm}>Schließen</button>
            </div>
        </div>
    );
};

export default LoginModal;
