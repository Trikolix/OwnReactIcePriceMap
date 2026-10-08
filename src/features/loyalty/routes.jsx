import React from "react";
import CustomerCardsPage from "./CustomerCardsPage";
import {
  OperatorOverviewPage,
  OperatorClaimPage,
  OperatorShopPage,
} from "./OperatorPages";
import OperatorAdminPage from "./OperatorAdminPage";
export const loyaltyRoutes = [
  { path: "/kundenkarten", element: <CustomerCardsPage /> },
  { path: "/kundenkarten/:cardId", element: <CustomerCardsPage /> },
  { path: "/betreiber", element: <OperatorOverviewPage /> },
  { path: "/betreiber/antrag/:shopId", element: <OperatorClaimPage /> },
  { path: "/betreiber/:shopId", element: <OperatorShopPage /> },
  { path: "/admin/betreiber", element: <OperatorAdminPage /> },
];
