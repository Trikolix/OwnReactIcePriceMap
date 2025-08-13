import React, { createContext, useState, useEffect, useContext } from 'react';

// 👉 Exportierter Kontext
const UserContext = createContext();

// 👉 Provider-Komponente
export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPosition, setUserPosition] = useState(null);

  // Beim Laden schauen, ob userId schon gespeichert ist
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUsername = localStorage.getItem('username');
    const storedPosition = localStorage.getItem('userPosition');

    if (storedUserId && storedUsername) {
      setUserId(storedUserId);
      setUsername(storedUsername);
      setIsLoggedIn(true);
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

  // Login-Funktion
  const login = (id, username) => {
    setUserId(id);
    setUsername(username);
    setIsLoggedIn(true);
    localStorage.setItem('userId', id);
    localStorage.setItem('username', username);
  };

  // Logout-Funktion
  const logout = () => {
    setUserId(null);
    setUsername(null);
    setIsLoggedIn(false);
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('userPosition');
  };

  return (
    <UserContext.Provider
      value={{
        userId,
        username,
        isLoggedIn,
        userPosition,
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