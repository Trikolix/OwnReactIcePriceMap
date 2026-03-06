import React from "react";
import PhotoChallengeAdmin from "../../pages/PhotoChallengeAdmin";
import PhotoChallengeVoting from "../../pages/PhotoChallengeVoting";
import PhotoChallengeList from "../../pages/PhotoChallengeList";

export const photoChallengeRoutes = [
  { path: "/photo-challenge", element: <PhotoChallengeList /> },
  { path: "/photo-challenge-admin", element: <PhotoChallengeAdmin /> },
  { path: "/photo-challenge/:challengeId", element: <PhotoChallengeVoting /> },
];
