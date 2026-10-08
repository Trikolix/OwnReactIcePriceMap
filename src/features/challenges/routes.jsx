import React from "react";
import Challenges from "../../pages/Challenges";
import MaintenanceBoard from "../../pages/MaintenanceBoard";
import IceDate from "../../pages/IceDate";

export const challengeRoutes = [
  { path: "/challenge", element: <Challenges /> },
  { path: "/ice-date", element: <IceDate /> },
  { path: "/ice-date/new", element: <IceDate /> },
  { path: "/ice-date/:token", element: <IceDate /> },
  { path: "/pflege", element: <MaintenanceBoard /> },
];
