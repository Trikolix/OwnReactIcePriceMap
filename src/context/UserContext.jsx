import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { disableBrowserPush, disableNativePush } from '../services/pushNotifications';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// 👉 Exportierter Kontext
const UserContext = createContext();

// 👉 Provider-Komponente
export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const sessionValidatedRef = useRef(false);

  const reloadCurrentPage = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.setTimeout(() => {
      window.location.reload();
    }, 0);
  }, []);

  // Beim Laden schauen, ob userId schon gespeichert ist
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUsername = localStorage.getItem('username');
    const storedCurrentLevel = localStorage.getItem('currentLevel');
    const storedPosition = localStorage.getItem('userPosition');
    const storedToken = localStorage.getItem('authToken');
    const storedTokenExpiry = localStorage.getItem('tokenExpiresAt');

    if (storedUserId && storedUsername && storedToken) {
      setUserId(storedUserId);
      setUsername(storedUsername);
      setCurrentLevel(storedCurrentLevel != null ? Number(storedCurrentLevel) : null);
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

    setAuthReady(true);
  }, []);

  // Erweiterte Setter-Funktion, die gleich speichert
  const updateUserPosition = (positionArray) => {
    setUserPosition(positionArray);
    localStorage.setItem('userPosition', JSON.stringify(positionArray));
  };

  const updateCurrentLevel = (level) => {
    const nextLevel = level != null ? Number(level) : null;
    setCurrentLevel(nextLevel);
    if (nextLevel != null && Number.isFinite(nextLevel)) {
      localStorage.setItem('currentLevel', String(nextLevel));
    } else {
      localStorage.removeItem('currentLevel');
    }
  };

  const login = useCallback((id, name, token, expiresAt, options = {}) => {
    const { reload = true } = options;
    const nextCurrentLevel = options.currentLevel != null ? Number(options.currentLevel) : null;
    const idAsString = id != null ? String(id) : null;
    const previousUserId = localStorage.getItem('userId');

    // Reset avatar cache when switching accounts to avoid showing the previous user's picture.
    if (previousUserId && idAsString && previousUserId !== idAsString) {
      localStorage.removeItem('avatarUrl');
      localStorage.removeItem('event2026_has_registration');
    }

    setUserId(idAsString);
    setUsername(name);
    setCurrentLevel(nextCurrentLevel);
    setIsLoggedIn(true);
    setAuthToken(token || null);
    setTokenExpiresAt(expiresAt || null);

    if (idAsString != null) {
      localStorage.setItem('userId', idAsString);
    } else {
      localStorage.removeItem('userId');
      localStorage.removeItem('avatarUrl');
    }

    if (name != null) {
      localStorage.setItem('username', name);
    } else {
      localStorage.removeItem('username');
    }

    if (nextCurrentLevel != null && Number.isFinite(nextCurrentLevel)) {
      localStorage.setItem('currentLevel', String(nextCurrentLevel));
    } else {
      localStorage.removeItem('currentLevel');
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

    if (reload) {
      reloadCurrentPage();
    }
  }, [reloadCurrentPage]);

  const logout = useCallback(async (options = {}) => {
    const { reload = true } = options;
    const storedToken = localStorage.getItem('authToken');
    const currentUserId = localStorage.getItem('userId');
    if (storedToken && API_BASE) {
      try {
        await fetch(`${API_BASE}/userManagement/logout.php`, { method: 'POST' });
      } catch (error) {
        console.warn('Logout request failed', error);
      }
    }

    if (currentUserId) {
      try {
        await disableBrowserPush(currentUserId);
      } catch (error) {
        console.warn('Browser push cleanup failed', error);
      }

      try {
        await disableNativePush(currentUserId);
      } catch (error) {
        console.warn('Native push cleanup failed', error);
      }
    }

    setUserId(null);
    setUsername(null);
    setCurrentLevel(null);
    setIsLoggedIn(false);
    setAuthToken(null);
    setTokenExpiresAt(null);
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('currentLevel');
    localStorage.removeItem('authToken');
    localStorage.removeItem('tokenExpiresAt');
    localStorage.removeItem('userPosition');
    localStorage.removeItem('avatarUrl');
    localStorage.removeItem('event2026_has_registration');
    sessionValidatedRef.current = false;

    if (reload) {
      reloadCurrentPage();
    }
  }, [reloadCurrentPage]);

  const validateSession = useCallback(async () => {
    if (!API_BASE || !authToken) return;

    try {
      const response = await fetch(`${API_BASE}/userManagement/session.php`);
      if (!response.ok) {
        throw new Error('Session invalid');
      }
      const data = await response.json();
      if (data.status === 'success') {
        login(data.userId, data.username, authToken, data.expires_at, { reload: false, currentLevel: data.currentLevel });
      } else {
        await logout({ reload: false });
      }
    } catch (error) {
      await logout({ reload: false });
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
        currentLevel,
        isLoggedIn,
        userPosition,
        authToken,
        tokenExpiresAt,
        authReady,
        login,
        logout,
        setUserPosition: updateUserPosition,
        setCurrentLevel: updateCurrentLevel
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
