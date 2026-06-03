import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  Award,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  IceCreamBowl,
  Map,
  MapPinned,
  Route,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { useUser } from "../context/UserContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const REMIND_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

const steps = [
  {
    icon: Map,
    title: "Karte & Filter",
    text: "Starte auf der Karte, finde Eisdielen in deiner Nähe und stelle ein, ob du Preise, Ratings, Favoriten oder Öffnungszeiten sehen willst.",
    actionLabel: "Zur Karte",
    route: "/map",
  },
  {
    icon: IceCreamBowl,
    title: "Check-in anlegen",
    text: "Wenn du Eis gegessen hast, legst du einen Check-in an. Deine Sorten- und Eisbewertung fließt in die Kugel-, Softeis- und Eisbecher-Ratings ein.",
    actionLabel: "Eisdiele suchen",
    route: "/map",
  },
  {
    icon: Star,
    title: "Eisdiele bewerten",
    text: "Zusätzlich zum gegessenen Eis kannst du eine Eisdiele einmalig bewerten: Auswahl, Lage, Sitzplätze, Service und alles, was den Besuch ausmacht.",
    actionLabel: "Bewertung starten",
    route: "/map",
  },
  {
    icon: Award,
    title: "Feed & Awards",
    text: "Im ActivityFeed siehst du Check-ins, Kommentare, neue Nutzer, Routen und verdiente Awards der Community.",
    actionLabel: "Feed ansehen",
    route: "/dashboard",
  },
  {
    icon: Sparkles,
    title: "Challenges & Aktionen",
    text: "Challenges schicken dich zu neuen Eisdielen. Foto-Challenges, Nutzer des Monats und saisonale Aktionen bringen zusätzliche Abwechslung.",
    actionLabel: "Challenges öffnen",
    route: "/challenge",
  },
  {
    icon: BarChart3,
    title: "Statistiken, Routen & Profil",
    text: "Entdecke Preis- und Regionenstatistiken, teile gute Rad- oder Wanderrouten und richte dein Profil mit Avatar, Social Links und Benachrichtigungen ein.",
    actionLabel: "Profil öffnen",
    route: "/account/settings",
  },
];

const storageKeyForUser = (userId) => `iceapp:onboarding:${userId}`;

const readState = (userId) => {
  if (!userId || typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(storageKeyForUser(userId)) || "{}");
  } catch {
    return {};
  }
};

const writeState = (userId, patch) => {
  if (!userId || typeof localStorage === "undefined") return;
  localStorage.setItem(storageKeyForUser(userId), JSON.stringify({
    ...readState(userId),
    ...patch,
  }));
};

const shouldWaitAfterDismiss = (state) => {
  if (!state?.dismissedAt) return false;
  return Date.now() - Number(state.dismissedAt) < REMIND_AFTER_MS;
};

export default function UserOnboardingTour() {
  const { userId, isLoggedIn, authReady, authToken } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [profileState, setProfileState] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [pushPromptVisible, setPushPromptVisible] = useState(false);
  const [forcedRunId, setForcedRunId] = useState(0);

  const currentStep = steps[activeStep];
  const isLastStep = activeStep === steps.length - 1;
  const progressLabel = `${activeStep + 1} / ${steps.length}`;

  const requestHeaders = useMemo(() => (
    authToken ? { Authorization: `Bearer ${authToken}` } : {}
  ), [authToken]);

  useEffect(() => {
    const handlePushVisibility = (event) => {
      setPushPromptVisible(Boolean(event.detail?.visible));
    };

    const handleManualStart = () => {
      setActiveStep(0);
      setForcedRunId((value) => value + 1);
      setVisible(true);
    };

    window.addEventListener("iceapp:push-opt-in-visibility", handlePushVisibility);
    window.addEventListener("iceapp:onboarding:start", handleManualStart);
    return () => {
      window.removeEventListener("iceapp:push-opt-in-visibility", handlePushVisibility);
      window.removeEventListener("iceapp:onboarding:start", handleManualStart);
    };
  }, []);

  useEffect(() => {
    if (!authReady || !isLoggedIn || !userId || !API_BASE) {
      setVisible(false);
      setProfileState(null);
      return;
    }

    let cancelled = false;
    setLoadingProfile(true);

    fetch(`${API_BASE}/api/get_user_profile.php`, { headers: requestHeaders })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((profile) => {
        if (cancelled) return;
        setProfileState(profile);

        const localState = readState(userId);
        const completed = Boolean(localState.completed) || Boolean(profile?.onboarding_completed_at);
        const canShow = Boolean(profile?.onboarding_eligible)
          && !completed
          && !shouldWaitAfterDismiss(localState)
          && !pushPromptVisible;

        if (canShow) {
          window.setTimeout(() => {
            if (!cancelled) {
              setActiveStep(0);
              setVisible(true);
            }
          }, 900);
        }
      })
      .catch((error) => {
        console.warn("Onboarding-Profil konnte nicht geladen werden:", error);
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authReady, isLoggedIn, userId, requestHeaders, pushPromptVisible, forcedRunId]);

  useEffect(() => {
    if (!visible) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  const persistAction = async (action) => {
    if (!API_BASE) return;
    try {
      await fetch(`${API_BASE}/api/update_user_profile.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...requestHeaders,
        },
        body: JSON.stringify({ onboarding_action: action }),
      });
    } catch (error) {
      console.warn(`Onboarding-${action} konnte nicht serverseitig gespeichert werden:`, error);
    }
  };

  const handleDismiss = () => {
    writeState(userId, { dismissedAt: Date.now() });
    persistAction("dismiss");
    setVisible(false);
  };

  const handleComplete = () => {
    const completedAt = new Date().toISOString();
    writeState(userId, { completed: true, completedAt });
    persistAction("complete");
    setVisible(false);
  };

  const handlePrimaryAction = () => {
    if (currentStep.route && currentStep.route !== `${location.pathname}${location.search}`) {
      navigate(currentStep.route);
    }
  };

  if (!visible || !isLoggedIn || !userId || loadingProfile) return null;

  const Icon = currentStep.icon;

  return createPortal(
    <Overlay role="presentation">
      <Dialog role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <CloseButton type="button" onClick={handleDismiss} aria-label="Onboarding schließen">
          <X size={20} />
        </CloseButton>

        <HeaderRow>
          <IconWrap aria-hidden="true">
            <Icon size={30} />
          </IconWrap>
          <HeaderText>
            <Kicker>Willkommen in der Ice-App</Kicker>
            <Title id="onboarding-title">{currentStep.title}</Title>
          </HeaderText>
        </HeaderRow>

        <Text>{currentStep.text}</Text>

        <StepGrid aria-label="Onboarding Schritte">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <StepDot
                key={step.title}
                type="button"
                $active={index === activeStep}
                $complete={index < activeStep}
                onClick={() => setActiveStep(index)}
                aria-label={`Schritt ${index + 1}: ${step.title}`}
              >
                <StepIcon size={16} />
              </StepDot>
            );
          })}
        </StepGrid>

        <MetaRow>
          <span>{progressLabel}</span>
          {profileState?.onboarding_activity && (
            <span>
              {profileState.onboarding_activity.checkins} Check-ins
            </span>
          )}
        </MetaRow>

        <Actions>
          <SecondaryButton type="button" onClick={handleDismiss}>
            Später
          </SecondaryButton>
          <RouteButton type="button" onClick={handlePrimaryAction}>
            <MapPinned size={18} />
            {currentStep.actionLabel}
          </RouteButton>
        </Actions>

        <FooterActions>
          <NavButton
            type="button"
            onClick={() => setActiveStep((step) => Math.max(0, step - 1))}
            disabled={activeStep === 0}
          >
            <ChevronLeft size={18} />
            Zurück
          </NavButton>
          {isLastStep ? (
            <PrimaryButton type="button" onClick={handleComplete}>
              <CheckCircle2 size={18} />
              Fertig
            </PrimaryButton>
          ) : (
            <PrimaryButton
              type="button"
              onClick={() => setActiveStep((step) => Math.min(steps.length - 1, step + 1))}
            >
              Weiter
              <ChevronRight size={18} />
            </PrimaryButton>
          )}
        </FooterActions>

        <DeepLinks>
          <DeepLink to="/statistics" onClick={() => setVisible(false)}>
            <BarChart3 size={16} />
            Statistiken
          </DeepLink>
          <DeepLink to="/routes" onClick={() => setVisible(false)}>
            <Route size={16} />
            Routen
          </DeepLink>
        </DeepLinks>
      </Dialog>
    </Overlay>,
    document.body
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 4300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(20, 16, 8, 0.54);
  backdrop-filter: blur(2px);
`;

const Dialog = styled.div`
  position: relative;
  width: min(520px, 100%);
  border-radius: 18px;
  border: 1px solid rgba(47, 33, 0, 0.14);
  background: #fffdf8;
  box-shadow: 0 22px 48px rgba(0, 0, 0, 0.3);
  padding: 1.35rem;
  color: #2f2100;

  @media (max-width: 520px) {
    padding: 1rem;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 0.8rem;
  right: 0.8rem;
  width: 2.1rem;
  height: 2.1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid rgba(47, 33, 0, 0.12);
  background: rgba(255, 255, 255, 0.92);
  color: #5b4520;
  cursor: pointer;

  &:hover {
    background: rgba(255, 181, 34, 0.16);
  }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding-right: 2.4rem;
`;

const IconWrap = styled.div`
  width: 58px;
  height: 58px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: #fff2d2;
  color: #9b5f00;
`;

const HeaderText = styled.div`
  min-width: 0;
`;

const Kicker = styled.p`
  margin: 0 0 0.2rem;
  color: rgba(47, 33, 0, 0.68);
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
`;

const Title = styled.h2`
  margin: 0;
  color: #2f2100;
  font-size: 1.5rem;
  line-height: 1.18;

  @media (max-width: 420px) {
    font-size: 1.25rem;
  }
`;

const Text = styled.p`
  margin: 1rem 0 1.1rem;
  color: #4b3500;
  font-size: 1rem;
  line-height: 1.52;
`;

const StepGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.45rem;
`;

const StepDot = styled.button`
  min-width: 0;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid ${({ $active }) => ($active ? "rgba(255, 181, 34, 0.9)" : "rgba(47, 33, 0, 0.12)")};
  background: ${({ $active, $complete }) => ($active ? "#ffb522" : $complete ? "#fff2d2" : "#fff")};
  color: ${({ $active }) => ($active ? "#2f2100" : "#7a5a00")};
  cursor: pointer;

  &:hover {
    background: ${({ $active }) => ($active ? "#ffc247" : "#fff7e8")};
  }
`;

const MetaRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 0.65rem 0 1rem;
  color: rgba(47, 33, 0, 0.66);
  font-size: 0.86rem;
  font-weight: 700;
`;

const Actions = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr);
  gap: 0.7rem;

  @media (max-width: 460px) {
    grid-template-columns: 1fr;
  }
`;

const buttonBase = `
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border-radius: 10px;
  padding: 0.65rem 0.9rem;
  font-weight: 800;
  font-size: 0.96rem;
  cursor: pointer;
`;

const PrimaryButton = styled.button`
  ${buttonBase}
  border: 1px solid rgba(255, 181, 34, 0.8);
  background: #ffb522;
  color: #2f2100;

  &:hover:enabled {
    background: #ffc247;
  }
`;

const SecondaryButton = styled.button`
  ${buttonBase}
  border: 1px solid rgba(47, 33, 0, 0.14);
  background: #ffffff;
  color: #5b4520;

  &:hover {
    background: #fff7e8;
  }
`;

const RouteButton = styled.button`
  ${buttonBase}
  border: 1px solid rgba(47, 33, 0, 0.14);
  background: #fff2d2;
  color: #4b3500;

  &:hover {
    background: #ffe6ad;
  }
`;

const FooterActions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.7rem;
  margin-top: 0.75rem;
`;

const NavButton = styled(SecondaryButton)`
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const DeepLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.8rem;
  flex-wrap: wrap;
  margin-top: 0.9rem;
`;

const DeepLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #7a4c00;
  font-size: 0.88rem;
  font-weight: 800;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;
