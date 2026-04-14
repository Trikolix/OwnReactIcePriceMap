import React, { useEffect } from 'react';
import { UserProvider } from './context/UserContext';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { coreRoutes } from './features/core/routes';
import { eventRoutes } from './features/event/routes';
import { mapRoutes } from './features/map/routes';
import { challengeRoutes } from './features/challenges/routes';
import { photoChallengeRoutes } from './features/photoChallenge/routes';
import { userRoutes } from './features/user/routes';
import AppUpdateBanner from './components/AppUpdateBanner';
import PushBootstrap from './components/PushBootstrap';

const allRoutes = [
  ...coreRoutes,
  ...mapRoutes,
  ...challengeRoutes,
  ...photoChallengeRoutes,
  ...userRoutes,
  ...eventRoutes,
];

const ScrollToTopOnRouteChange = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search]);

  return null;
};

const App = () => {
  return (
    <Router>
      <UserProvider>
        <ScrollToTopOnRouteChange />
        <PushBootstrap />
        <AppUpdateBanner />
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
