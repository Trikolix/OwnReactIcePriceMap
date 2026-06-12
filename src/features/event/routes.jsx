import React from "react";
import { Navigate } from "react-router-dom";
import RadEvent from "../../pages/Event/RadEvent";
import EventRegistration from "../../pages/Event/EventRegistration";
// import EventGiftPurchase from "../../pages/Event/EventGiftPurchase";
import EventLiveMap from "../../pages/Event/EventLiveMap";
import EventMyRegistration from "../../pages/Event/EventMyRegistration";
import EventRegistrationSummary from "../../pages/Event/EventRegistrationSummary";
import EventStampCard from "../../pages/Event/EventStampCard";
import EventAdminOverview from "../../pages/Event/EventAdminOverview";
import EventAdminMail from "../../pages/Event/EventAdminMail";
import EventSupportPage from "../../pages/Event/EventSupportPage";
import EventParticipantInfo from "../../pages/Event/EventParticipantInfo";
import EventImpressions from "../../pages/Event/EventImpressions";
import EventAdminImpressions from "../../pages/Event/EventAdminImpressions";
import EventSelfRide from "../../pages/Event/EventSelfRide";

export const eventRoutes = [
  { path: "/ice-tour", element: <RadEvent /> },
  { path: "/ice-tour-2026.html", element: <Navigate to="/ice-tour" replace /> },
  { path: "/ice-tour-impressionen", element: <EventImpressions /> },
  { path: "/ice-tour-selbst-fahren", element: <EventSelfRide /> },
  { path: "/ice-tour-selber-fahren", element: <Navigate to="/ice-tour-selbst-fahren" replace /> },
  { path: "/ice-tour-unterstuetzen", element: <EventSupportPage /> },
  { path: "/rad-event", element: <Navigate to="/ice-tour" replace /> },
  { path: "/eis-tour", element: <Navigate to="/ice-tour" replace /> },
  { path: "/event-registration", element: <EventRegistration /> },
  // { path: "/event-gifts", element: <EventGiftPurchase /> },
  { path: "/event-live", element: <EventLiveMap /> },
  { path: "/event-me", element: <EventMyRegistration /> },
  { path: "/event-my-registration", element: <EventMyRegistration view="registration" /> },
  { path: "/event-info", element: <EventParticipantInfo /> },
  { path: "/event-stamp-card", element: <EventStampCard /> },
  { path: "/event-admin", element: <EventAdminOverview /> },
  { path: "/event-admin-impressions", element: <EventAdminImpressions /> },
  { path: "/event-admin-mails", element: <EventAdminMail /> },
  { path: "/event-registration-summary", element: <EventRegistrationSummary /> },
];
