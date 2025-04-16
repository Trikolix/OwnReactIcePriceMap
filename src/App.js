// App.js
import React from 'react';
import { UserProvider } from './context/UserContext';
import IceCreamRadar from './IceCreamRadar';
import DashBoard from './pages/DashBoard';
import Ranking from './pages/Ranking';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FavoritenListe from './pages/FavoritenListe';

const App = () => {
  return (
    <Router>
      <UserProvider>
        <Routes>
          <Route path="/" element={<IceCreamRadar />} />
          <Route path="/map" element={<IceCreamRadar />} />
          <Route path="/dashboard" element={<DashBoard />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/favoriten" element={<FavoritenListe />} />
        </Routes>
      </UserProvider>
    </Router>
  );
};

export default App;