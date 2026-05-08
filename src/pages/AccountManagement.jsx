import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import styled from 'styled-components';

const AccountManagement = () => {
  const { userId } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Wenn eingeloggt, leiten wir zum eigenen Profil weiter und hängen die Query-Parameter an
    if (userId) {
      const searchParams = new URLSearchParams(location.search);
      // Wenn wir von /account/settings kommen, setzen wir openSettings=1
      if (location.pathname.includes('/settings')) {
        searchParams.set('openSettings', '1');
      }
      // Wenn wir von /account/delete kommen, setzen wir beide Parameter
      if (location.pathname.includes('/delete')) {
        searchParams.set('openSettings', '1');
        searchParams.set('openDelete', '1');
      }
      
      navigate(`/user?${searchParams.toString()}`, { replace: true });
    } else {
      // Wenn NICHT eingeloggt, leiten wir zur Startseite weiter
      navigate('/', { replace: true });
    }
  }, [userId, navigate, location]);

  return (
    <Container>
      <p>Leite weiter...</p>
    </Container>
  );
};

export default AccountManagement;

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 2rem;
  background-color: #f5f5f5;
`;

const Card = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  text-align: center;
  max-width: 400px;
  width: 100%;

  h2 {
    margin-top: 0;
    color: #333;
  }

  p {
    color: #666;
    margin-bottom: 2rem;
  }
`;

const LoginButton = styled.button`
  background: #ffb522;
  color: #5b4520;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 999px;
  font-weight: bold;
  cursor: pointer;
  font-size: 1rem;

  &:hover {
    background: #ffc247;
  }
`;
