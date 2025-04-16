import React, { createContext, useState, useEffect, useContext } from 'react';

// 👉 Exportierter Kontext
const UserContext = createContext();

// 👉 Provider-Komponente
export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPosition, setUserPosition] = useState(null);

  // Beim Laden schauen, ob userId schon gespeichert ist
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
      setIsLoggedIn(true);
    }
  }, []);

  // Login-Funktion
  const login = (id) => {
    setUserId(id);
    setIsLoggedIn(true);
    localStorage.setItem('userId', id);
  };

  // Logout-Funktion
  const logout = () => {
    setUserId(null);
    setIsLoggedIn(false);
    localStorage.removeItem('userId');
  };

  return (
    <UserContext.Provider value={{ userId, isLoggedIn, userPosition, login, logout, setUserPosition }}>
      {children}
    </UserContext.Provider>
  );
};

// Erstelle einen benutzerdefinierten Hook, um den Context zu verwenden
export const useUser = () => {
    return useContext(UserContext);
  };