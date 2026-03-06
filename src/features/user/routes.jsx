import React from "react";
import RegisterPage from "../../pages/RegisterPage";
import VerifyAccount from "../../pages/VerifyAccount";
import UserSite from "../../pages/UserSite";
import FavoritenListe from "../../pages/FavoritenListe";

export const userRoutes = [
  { path: "/register", element: <RegisterPage /> },
  { path: "/register/:inviteCode", element: <RegisterPage /> },
  { path: "/verify", element: <VerifyAccount /> },
  { path: "/user/:userId?", element: <UserSite /> },
  { path: "/favoriten", element: <FavoritenListe /> },
];
