import React, { useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";

const RegisterForm = ({ onSuccess, onClose, inviteLink = null }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [termsError, setTermsError] = useState(false);

    const apiUrl = process.env.REACT_APP_API_BASE_URL;

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
                    inviteLink // wird optional mitgesendet
                })
            });

            const data = await response.json();
            setMessage(data.message);

            if (data.status === 'success') {
                // Formular zurücksetzen
                setUsername('');
                setEmail('');
                setPassword('');
                setAcceptedTerms(false);

                if (onSuccess) onSuccess();
            }
        } catch (error) {
            console.error('Registrierung fehlgeschlagen:', error);
            setMessage('Ein Fehler ist aufgetreten. Bitte erneut versuchen.');
        }
    };

    return (
        <Form onSubmit={handleRegister}>
            <h1>Registrieren</h1>
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
                required
            />
            <Input
                type="password"
                placeholder="Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />

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
            </div>

            <SubmitButton type="submit">Registrieren</SubmitButton>

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
`

const Input = styled.input`
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 1rem;
`

// Styled Components
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
