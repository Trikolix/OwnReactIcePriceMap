import React from "react";
import DashBoard from "../../pages/DashBoard";
import ShopChangeRequestsAdmin from "../../pages/ShopChangeRequestsAdmin";
import Impressum from "../../pages/Impressum";
import AGB from "../../pages/AGB";
import Datenschutz from "../../pages/Datenschutz";
import Community from "../../pages/Community";
import SystemmeldungForm from "../../components/SystemmeldungForm";
import AwardsAdmin from "../../pages/AwardsAdmin";
import AdminWeeklyStats from "../../pages/AdminWeeklyStats";

export const coreRoutes = [
  { path: "/dashboard", element: <DashBoard /> },
  { path: "/impressum", element: <Impressum /> },
  { path: "/agb", element: <AGB /> },
  { path: "/datenschutz", element: <Datenschutz /> },
  { path: "/community", element: <Community /> },
  { path: "/systemmeldungenform", element: <SystemmeldungForm /> },
  { path: "/awards-admin", element: <AwardsAdmin /> },
  { path: "/shop-change-requests", element: <ShopChangeRequestsAdmin /> },
  { path: "/admin/weekly-stats", element: <AdminWeeklyStats /> },
];
