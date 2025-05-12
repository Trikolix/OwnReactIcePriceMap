// App.js
import React from 'react';
import { UserProvider } from './context/UserContext';
import IceCreamRadar from './IceCreamRadar';
import DashBoard from './pages/DashBoard';
import Ranking from './pages/Ranking';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import FavoritenListe from './pages/FavoritenListe';
import Impressum from './pages/Impressum';
import UserSite from './pages/UserSite';
import VerifyAccount from './pages/VerifyAccount';

const App = () => {
  return (
    <Router>
      <UserProvider>
        <Routes>
          <Route path="/" element={<IceCreamRadar />} />
          <Route path="/map" element={<IceCreamRadar />} />
          <Route path="/map/activeShop/:shopId" element={<IceCreamRadar />} />
          <Route path="/dashboard" element={<DashBoard />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/favoriten" element={<FavoritenListe />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/user/:userId?" element={<UserSite />} />
          <Route path="/verify" element={<VerifyAccount />} />
        </Routes>
      </UserProvider>
    </Router>
  );
};

export default App;