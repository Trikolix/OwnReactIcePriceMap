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
import AdminPushStats from "../../pages/AdminPushStats";
import SummerCampaignAdmin from "../../pages/SummerCampaignAdmin";
import TourDeGlaceAdmin from "../../pages/TourDeGlaceAdmin";

export const coreRoutes = [
  { path: "/dashboard", element: <DashBoard /> },
  { path: "/impressum", element: <Impressum /> },
  { path: "/agb", element: <AGB /> },
  { path: "/datenschutz", element: <Datenschutz /> },
  { path: "/community", element: <Community /> },
  { path: "/systemmeldungenform", element: <SystemmeldungForm /> },
  { path: "/awards-admin", element: <AwardsAdmin /> },
  { path: "/summer-campaign-admin", element: <SummerCampaignAdmin /> },
  { path: "/admin/summer-campaign", element: <SummerCampaignAdmin /> },
  { path: "/shop-change-requests", element: <ShopChangeRequestsAdmin /> },
  { path: "/admin/weekly-stats", element: <AdminWeeklyStats /> },
  { path: "/admin/push-stats", element: <AdminPushStats /> },
  { path: "/admin/tour-de-glace", element: <TourDeGlaceAdmin /> },
];
