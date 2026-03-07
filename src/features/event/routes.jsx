import React from "react";
import { Navigate } from "react-router-dom";
import RadEvent from "../../pages/Event/RadEvent";
import EventRegistration from "../../pages/Event/EventRegistration";
import EventLiveMap from "../../pages/Event/EventLiveMap";
import EventMyRegistration from "../../pages/Event/EventMyRegistration";
import EventInviteClaim from "../../pages/Event/EventInviteClaim";
import EventRegistrationSummary from "../../pages/Event/EventRegistrationSummary";

export const eventRoutes = [
  { path: "/ice-tour", element: <RadEvent /> },
  { path: "/rad-event", element: <Navigate to="/ice-tour" replace /> },
  { path: "/eis-tour", element: <Navigate to="/ice-tour" replace /> },
  { path: "/event-registration", element: <EventRegistration /> },
  { path: "/event-live", element: <EventLiveMap /> },
  { path: "/event-me", element: <EventMyRegistration /> },
  { path: "/event-invite/:token", element: <EventInviteClaim /> },
  { path: "/event-registration-summary", element: <EventRegistrationSummary /> },
];
