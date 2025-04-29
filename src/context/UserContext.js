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
    if (storedUserId && storedUsername) {
      setUserId(storedUserId);
      setUsername(storedUsername);
      setIsLoggedIn(true);
    }
  }, []);

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
  };

  return (
    <UserContext.Provider value={{ userId, username, isLoggedIn, userPosition, login, logout, setUserPosition }}>
      {children}
    </UserContext.Provider>
  );
};

// Erstelle einen benutzerdefinierten Hook, um den Context zu verwenden
export const useUser = () => {
    return useContext(UserContext);
  };