import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const ResetPasswordModal = ({ resetToken, onClose }) => {
    const [validToken, setValidToken] = useState(null); // null: prüft noch
    const [error, setError] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const validateToken = async () => {
            try {
                console.log(resetToken);
                const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/userManagement/validate_reset_token.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: resetToken })
                });
                const data = await res.json();
                if (data.valid) {
                    setValidToken(true);
                } else {
                    setValidToken(false);
                    setError(data.message || 'Token ungültig oder abgelaufen.');
                }
            } catch (err) {
                setValidToken(false);
                setError('Fehler bei der Token-Prüfung.');
            }
        };

        validateToken();
    }, [resetToken]);

    if (validToken === null) {
        return <Overlay><Modal><p>Token wird geprüft …</p></Modal></Overlay>;
    }

    if (!validToken) {
        return (
            <Overlay>
                <Modal>
                    <Title>Passwort zurücksetzen</Title>
                    <ErrorText>{error}</ErrorText>
                    <Button onClick={() => navigate("/")}>Zurück zur Startseite</Button>
                </Modal>
            </Overlay>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwörter stimmen nicht überein.');
            return;
        }
        if (password.length < 6) {
            setError("Das Passwort muss mindestens 6 Zeichen lang sein.");
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/userManagement/reset_password.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: resetToken, password })
            });

            const data = await response.json();

            if (data.status === 'success') {
                alert("Passwort erfolgreich geändert!");
                onClose(); // Modal schließen
                setTimeout(() => {
                    navigate("/login");
                }, 100); // kleiner Delay von 100ms
            } else {
                setError(data.message || 'Fehler beim Zurücksetzen des Passworts.');
            }
        } catch (err) {
            setError("Verbindungsfehler.");
        }
    };

    return (
        <Overlay>
            <Modal>
                <CloseX onClick={onClose}>x</CloseX>
                <Title>Neues Passwort setzen</Title>
                <form onSubmit={handleSubmit}>
                    <Input
                        type="password"
                        placeholder="Neues Passwort"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <Input
                        type="password"
                        placeholder="Passwort bestätigen"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    {error && <ErrorText>{error}</ErrorText>}
                    <Button type="submit">Passwort setzen</Button>
                </form>
            </Modal>
        </Overlay>
    );
};

export default ResetPasswordModal;


const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1003;
`;

const Modal = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 5px 25px rgba(0,0,0,0.2);
`;

const Title = styled.h2`
  margin-top: 0;
  margin-bottom: 1rem;
  text-align: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  border: 1px solid #ccc;
`;

const Button = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: #f26c4f;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background-color: #d95c3f;
  }
`;

const ErrorText = styled.p`
  color: red;
  font-size: 0.9rem;
`;

const CloseX = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
`;