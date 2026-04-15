import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useUser } from "../context/UserContext";

const popupFeatures = "width=540,height=720,menubar=no,toolbar=no,status=no,resizable=yes,scrollbars=yes";

const providerLabels = {
  google: "Mit Google fortfahren",
};

const SocialAuthButtons = ({
  mode = "register",
  inviteCode = null,
  acceptedTerms = false,
  requireAcceptedTerms = false,
  onRequireTerms = null,
  onSuccess = null,
}) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { login } = useUser();
  const popupRef = useRef(null);
  const [message, setMessage] = useState("");
  const [pendingProvider, setPendingProvider] = useState("");
  const apiOrigin = apiUrl ? new URL(apiUrl, window.location.origin).origin : "";

  useEffect(() => {
    const handleMessage = (event) => {
      if (apiOrigin && event.origin !== apiOrigin) return;

      const payload = event.data;
      if (!payload || payload.type !== "ice-social-auth") return;

      setPendingProvider("");

      if (payload.status === "success") {
        login(payload.userId, payload.username, payload.token, payload.expires_at);
        setMessage("");
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close();
        }
        if (onSuccess) onSuccess(payload);
        return;
      }

      setMessage(payload.message || "Social Login konnte nicht abgeschlossen werden.");
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [apiOrigin, login, onSuccess]);

  const startAuth = (provider) => {
    if (!apiUrl) {
      setMessage("API-Konfiguration fehlt.");
      return;
    }

    if (requireAcceptedTerms && !acceptedTerms) {
      if (onRequireTerms) onRequireTerms();
      setMessage("Bitte bestätige zuerst AGB, Datenschutz und Community-Richtlinien.");
      return;
    }

    setMessage("");
    setPendingProvider(provider);

    const url = new URL(`${apiUrl}/userManagement/oauth_start.php`, window.location.origin);
    url.searchParams.set("provider", provider);
    url.searchParams.set("mode", mode);
    url.searchParams.set("origin", window.location.origin);
    if (inviteCode) {
      url.searchParams.set("inviteCode", inviteCode);
    }

    popupRef.current = window.open(url.toString(), `ice-social-${provider}`, popupFeatures);
    if (!popupRef.current) {
      setPendingProvider("");
      setMessage("Das Anmeldefenster wurde blockiert. Bitte Popups für diese Seite erlauben.");
    }
  };

  return (
    <Wrapper>
      <Divider>
        <DividerLine />
        <DividerText>oder</DividerText>
        <DividerLine />
      </Divider>

      <ButtonsGrid>
        <SocialButton type="button" onClick={() => startAuth("google")} disabled={pendingProvider !== ""}>
          {pendingProvider === "google" ? "Google öffnet..." : providerLabels.google}
        </SocialButton>
      </ButtonsGrid>

      <Hint>
        Externe Anbieter bestätigen nur deine Identität. Nutzerkonto, Session und Profildaten bleiben in der Ice-App.
      </Hint>

      {message ? <Message role="status">{message}</Message> : null}
    </Wrapper>
  );
};

export default SocialAuthButtons;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const DividerLine = styled.div`
  flex: 1;
  height: 1px;
  background: rgba(0, 0, 0, 0.12);
`;

const DividerText = styled.span`
  font-size: 0.9rem;
  color: #666;
`;

const ButtonsGrid = styled.div`
  display: grid;
  gap: 0.75rem;
`;

const SocialButton = styled.button`
  padding: 0.85rem 1rem;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: #f7f8fa;
  color: #222;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.65;
    cursor: wait;
  }
`;

const Hint = styled.p`
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.45;
  color: #5d6470;
`;

const Message = styled.p`
  margin: 0;
  color: #b42318;
  font-size: 0.95rem;
`;
