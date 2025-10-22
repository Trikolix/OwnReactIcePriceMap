import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Overlay as SharedOverlay, Modal as SharedModal, Input as SharedInput, Button as SharedButton, CloseButton as SharedCloseButton } from '../styles/SharedStyles';
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
        return <SharedOverlay><SharedModal><p>Token wird geprüft …</p></SharedModal></SharedOverlay>;
    }

    if (!validToken) {
        return (
            <SharedOverlay>
                <SharedModal>
                    <Title>Passwort zurücksetzen</Title>
                    <ErrorText>{error}</ErrorText>
                    <SharedButton onClick={() => navigate("/")}>Zurück zur Startseite</SharedButton>
                </SharedModal>
            </SharedOverlay>
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
        <SharedOverlay>
            <SharedModal>
                <SharedCloseButton onClick={onClose}>x</SharedCloseButton>
                <Title>Neues Passwort setzen</Title>
                <form onSubmit={handleSubmit}>
                    <SharedInput
                        type="password"
                        placeholder="Neues Passwort"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <SharedInput
                        type="password"
                        placeholder="Passwort bestätigen"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    {error && <ErrorText>{error}</ErrorText>}
                    <SharedButton type="submit">Passwort setzen</SharedButton>
                </form>
            </SharedModal>
        </SharedOverlay>
    );
};

export default ResetPasswordModal;

const Title = styled.h2`
    margin-top: 0;
    margin-bottom: 1rem;
    text-align: center;
`;

const ErrorText = styled.p`
    color: red;
    font-size: 0.95rem;
`;