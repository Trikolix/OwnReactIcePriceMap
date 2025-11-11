// App.js
import React from 'react';
import { UserProvider } from './context/UserContext';
import IceCreamRadar from './IceCreamRadar';
import DashBoard from './pages/DashBoard';
import Statistics from './pages/Statistics';
import Ranking from './pages/Ranking';
import RoutesPage from './pages/Routes';
import PhotoChallengeAdmin from './pages/PhotoChallengeAdmin';
import PhotoChallengeVoting from './pages/PhotoChallengeVoting';
import ShopChangeRequestsAdmin from './pages/ShopChangeRequestsAdmin';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import FavoritenListe from './pages/FavoritenListe';
import Impressum from './pages/Impressum';
import UserSite from './pages/UserSite';
import VerifyAccount from './pages/VerifyAccount';
import AGB from './pages/AGB';
import Datenschutz from './pages/Datenschutz';
import Community from './pages/Community';
import RegisterPage from './pages/RegisterPage';
import Challenges from './pages/Challenges';
import SystemmeldungForm from './components/SystemmeldungForm';

const App = () => {
  return (
    <Router>
      <UserProvider>
        <Routes>
          <Route path="/" element={<IceCreamRadar />} />
          <Route path="/map" element={<IceCreamRadar />} />
          <Route path="/map/activeShop/:shopId" element={<IceCreamRadar />} />
          <Route path="/login" element={<IceCreamRadar />} />
          <Route path="/resetToken/:token" element={<IceCreamRadar />} />
          <Route path="/dashboard" element={<DashBoard />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/favoriten" element={<FavoritenListe />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/user/:userId?" element={<UserSite />} />
          <Route path="/verify" element={<VerifyAccount />} />
          <Route path="/agb" element={<AGB />} />
          <Route path="/datenschutz" element={<Datenschutz />} />
          <Route path="/community" element={<Community />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/:inviteCode" element={<RegisterPage />} />
          <Route path="/challenge" element={<Challenges />} />
          <Route path="/systemmeldungenform" element={<SystemmeldungForm />} />
          <Route path="/photo-challenge-admin" element={<PhotoChallengeAdmin />} />
          <Route path="/shop-change-requests" element={<ShopChangeRequestsAdmin />} />
          <Route path="/photo-challenge/:challengeId" element={<PhotoChallengeVoting />} />
        </Routes>
      </UserProvider>
    </Router>
  );
};

export default App;
