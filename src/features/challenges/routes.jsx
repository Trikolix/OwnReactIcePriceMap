import React from "react";
import Challenges from "../../pages/Challenges";
import MaintenanceBoard from "../../pages/MaintenanceBoard";

export const challengeRoutes = [
  { path: "/challenge", element: <Challenges /> },
  { path: "/pflege", element: <MaintenanceBoard /> },
];
