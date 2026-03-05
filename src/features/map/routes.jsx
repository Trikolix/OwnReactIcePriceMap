import React from "react";
import IceCreamRadar from "../../IceCreamRadar";
import RoutesPage from "../../pages/Routes";
import Ranking from "../../pages/Ranking";
import Statistics from "../../pages/Statistics";

export const mapRoutes = [
  { path: "/", element: <IceCreamRadar /> },
  { path: "/map", element: <IceCreamRadar /> },
  { path: "/map/activeShop/:shopId", element: <IceCreamRadar /> },
  { path: "/login", element: <IceCreamRadar /> },
  { path: "/resetToken/:token", element: <IceCreamRadar /> },
  { path: "/routes", element: <RoutesPage /> },
  { path: "/ranking", element: <Ranking /> },
  { path: "/statistics", element: <Statistics /> },
];
