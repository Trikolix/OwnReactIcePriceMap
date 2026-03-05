import React from 'react';
import { UserProvider } from './context/UserContext';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { coreRoutes } from './features/core/routes';
import { eventRoutes } from './features/event/routes';
import { mapRoutes } from './features/map/routes';
import { challengeRoutes } from './features/challenges/routes';
import { photoChallengeRoutes } from './features/photoChallenge/routes';
import { userRoutes } from './features/user/routes';
import AppUpdateBanner from './components/AppUpdateBanner';

const allRoutes = [
  ...coreRoutes,
  ...mapRoutes,
  ...challengeRoutes,
  ...photoChallengeRoutes,
  ...userRoutes,
  ...eventRoutes,
];

const App = () => {
  return (
    <Router>
      <UserProvider>
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
