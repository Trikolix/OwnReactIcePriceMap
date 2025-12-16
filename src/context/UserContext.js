import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

// 👉 Exportierter Kontext
const UserContext = createContext();

// 👉 Provider-Komponente
export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPosition, setUserPosition] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState(null);
  const sessionValidatedRef = useRef(false);

  // Beim Laden schauen, ob userId schon gespeichert ist
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUsername = localStorage.getItem('username');
    const storedPosition = localStorage.getItem('userPosition');
    const storedToken = localStorage.getItem('authToken');
    const storedTokenExpiry = localStorage.getItem('tokenExpiresAt');

    if (storedUserId && storedUsername && storedToken) {
      setUserId(storedUserId);
      setUsername(storedUsername);
      setIsLoggedIn(true);
    }

    if (storedToken) {
      setAuthToken(storedToken);
    }

    if (storedTokenExpiry) {
      setTokenExpiresAt(storedTokenExpiry);
    }

    if (storedPosition) {
      try {
        const parsedPos = JSON.parse(storedPosition);
        if (Array.isArray(parsedPos) && parsedPos.length === 2) {
          setUserPosition(parsedPos);
        }
      } catch (e) {
        console.error("Fehler beim Parsen der gespeicherten Position:", e);
      }
    }
  }, []);

  // Erweiterte Setter-Funktion, die gleich speichert
  const updateUserPosition = (positionArray) => {
    setUserPosition(positionArray);
    localStorage.setItem('userPosition', JSON.stringify(positionArray));
  };

  const login = useCallback((id, name, token, expiresAt) => {
    const idAsString = id != null ? String(id) : null;
    setUserId(idAsString);
    setUsername(name);
    setIsLoggedIn(true);
    setAuthToken(token || null);
    setTokenExpiresAt(expiresAt || null);

    if (idAsString != null) {
      localStorage.setItem('userId', idAsString);
    } else {
      localStorage.removeItem('userId');
    }

    if (name != null) {
      localStorage.setItem('username', name);
    } else {
      localStorage.removeItem('username');
    }

    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }

    if (expiresAt) {
      localStorage.setItem('tokenExpiresAt', expiresAt);
    } else {
      localStorage.removeItem('tokenExpiresAt');
    }

    sessionValidatedRef.current = true;
  }, []);

  const logout = useCallback(async () => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken && API_BASE) {
      try {
        await fetch(`${API_BASE}/userManagement/logout.php`, { method: 'POST' });
      } catch (error) {
        console.warn('Logout request failed', error);
      }
    }

    setUserId(null);
    setUsername(null);
    setIsLoggedIn(false);
    setAuthToken(null);
    setTokenExpiresAt(null);
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('authToken');
    localStorage.removeItem('tokenExpiresAt');
    localStorage.removeItem('userPosition');
    sessionValidatedRef.current = false;
  }, []);

  const validateSession = useCallback(async () => {
    if (!API_BASE || !authToken) return;

    try {
      const response = await fetch(`${API_BASE}/userManagement/session.php`);
      if (!response.ok) {
        throw new Error('Session invalid');
      }
      const data = await response.json();
      if (data.status === 'success') {
        login(data.userId, data.username, authToken, data.expires_at);
      } else {
        await logout();
      }
    } catch (error) {
      await logout();
    }
  }, [authToken, login, logout]);

  useEffect(() => {
    if (!authToken || sessionValidatedRef.current) {
      return;
    }
    sessionValidatedRef.current = true;
    validateSession();
  }, [authToken, validateSession]);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout]);

  return (
    <UserContext.Provider
      value={{
        userId,
        username,
        isLoggedIn,
        userPosition,
        authToken,
        tokenExpiresAt,
        login,
        logout,
        setUserPosition: updateUserPosition
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Erstelle einen benutzerdefinierten Hook, um den Context zu verwenden
export const useUser = () => {
    return useContext(UserContext);
  };
