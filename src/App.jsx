import React, { useEffect } from 'react';
import { UserProvider } from './context/UserContext';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { coreRoutes } from './features/core/routes';
import { eventRoutes } from './features/event/routes';
import { socialMediaRoutes } from './features/socialMedia/routes';
import { mapRoutes } from './features/map/routes';
import { challengeRoutes } from './features/challenges/routes';
import { photoChallengeRoutes } from './features/photoChallenge/routes';
import { userRoutes } from './features/user/routes';
import AppUpdateBanner from './components/AppUpdateBanner';
import PushBootstrap from './components/PushBootstrap';
import PushOptInOverlay from './components/PushOptInOverlay';
import CookieBanner from './components/CookieBanner';
import GuestMotivation from './components/GuestMotivation';
import MatomoTracker from './components/MatomoTracker';
import ActiveSelfRideCta from './pages/Event/ActiveSelfRideCta';


const allRoutes = [
  ...coreRoutes,
  ...mapRoutes,
  ...challengeRoutes,
  ...photoChallengeRoutes,
  ...userRoutes,
  ...eventRoutes,
  ...socialMediaRoutes,
];

const ScrollToTopOnRouteChange = () => {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isDashboardFocusNavigation = location.pathname === '/dashboard'
      && (params.has('focusAward') || params.has('focusNewUser'));

    if (isDashboardFocusNavigation) {
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search]);

  return null;
};

const App = () => {
  return (
    <Router>
      <UserProvider>
        <ScrollToTopOnRouteChange />
        <MatomoTracker />
        <PushBootstrap />
        <PushOptInOverlay />
        <AppUpdateBanner />
        <CookieBanner />
        <GuestMotivation />
        <ActiveSelfRideCta />
        <Routes>
          {allRoutes.map((routeDef) => (
            <Route key={routeDef.path} path={routeDef.path} element={routeDef.element} />
          ))}
        </Routes>
      </UserProvider>
    </Router>
  );
};

export default App;
