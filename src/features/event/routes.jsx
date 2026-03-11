import React from "react";
import { Navigate } from "react-router-dom";
import RadEvent from "../../pages/Event/RadEvent";
import EventRegistration from "../../pages/Event/EventRegistration";
import EventGiftPurchase from "../../pages/Event/EventGiftPurchase";
import EventLiveMap from "../../pages/Event/EventLiveMap";
import EventMyRegistration from "../../pages/Event/EventMyRegistration";
import EventRegistrationSummary from "../../pages/Event/EventRegistrationSummary";
import EventStampCard from "../../pages/Event/EventStampCard";
import EventAdminOverview from "../../pages/Event/EventAdminOverview";

export const eventRoutes = [
  { path: "/ice-tour", element: <RadEvent /> },
  { path: "/rad-event", element: <Navigate to="/ice-tour" replace /> },
  { path: "/eis-tour", element: <Navigate to="/ice-tour" replace /> },
  { path: "/event-registration", element: <EventRegistration /> },
  { path: "/event-gifts", element: <EventGiftPurchase /> },
  { path: "/event-live", element: <EventLiveMap /> },
  { path: "/event-me", element: <EventMyRegistration /> },
  { path: "/event-stamp-card", element: <EventStampCard /> },
  { path: "/event-admin", element: <EventAdminOverview /> },
  { path: "/event-registration-summary", element: <EventRegistrationSummary /> },
];
