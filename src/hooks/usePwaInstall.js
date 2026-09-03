import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

// Modul-Level Speicherung, damit frühe beforeinstallprompt-Events beim Laden nicht verloren gehen
let globalDeferredPrompt = null;
const promptListeners = new Set();

const notifyPromptListeners = () => {
  promptListeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.warn('Error in prompt listener:', err);
    }
  });
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Verhindert das automatische unkontrollierte Erscheinen des Mini-Infobars im Browser
    e.preventDefault();
    globalDeferredPrompt = e;
    notifyPromptListeners();
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    notifyPromptListeners();
  });
}

/**
 * Prüft, ob die App bereits als installierte PWA oder native App (Capacitor) läuft.
 */
export const isStandaloneApp = () => {
  if (typeof window === 'undefined') return false;

  try {
    if (Capacitor.isNativePlatform()) return true;
  } catch (e) {
    // ignore
  }

  // 1. Web Standalone (Android Chrome, Desktop Chrome/Edge)
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  if (window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches) {
    return true;
  }
  if (window.matchMedia && window.matchMedia('(display-mode: minimal-ui)').matches) {
    return true;
  }

  // 2. iOS Safari Standalone
  if (window.navigator && window.navigator.standalone === true) {
    return true;
  }

  // 3. Android TWA / WebView Referrer
  if (typeof document !== 'undefined' && document.referrer && document.referrer.includes('android-app://')) {
    return true;
  }

  return false;
};

/**
 * Erkennt Apple iOS / iPadOS Geräte (Safari).
 */
export const isIosDevice = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(ua);
  const isIpadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return isIos || isIpadOs;
};

export const usePwaInstall = () => {
  const [isStandalone, setIsStandalone] = useState(isStandaloneApp);
  const [hasPrompt, setHasPrompt] = useState(Boolean(globalDeferredPrompt));
  const [isIos] = useState(isIosDevice);
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    const update = () => {
      setIsStandalone(isStandaloneApp());
      setHasPrompt(Boolean(globalDeferredPrompt));
    };

    update();
    promptListeners.add(update);

    // Auf Display-Mode-Wechsel reagieren
    let mql = null;
    const handleMql = (e) => {
      setIsStandalone(Boolean(e?.matches) || isStandaloneApp());
    };

    if (typeof window !== 'undefined' && window.matchMedia) {
      mql = window.matchMedia('(display-mode: standalone)');
      if (mql.addEventListener) {
        mql.addEventListener('change', handleMql);
      } else if (mql.addListener) {
        mql.addListener(handleMql);
      }
    }

    return () => {
      promptListeners.delete(update);
      if (mql) {
        if (mql.removeEventListener) {
          mql.removeEventListener('change', handleMql);
        } else if (mql.removeListener) {
          mql.removeListener(handleMql);
        }
      }
    };
  }, []);

  const installApp = useCallback(async () => {
    if (isStandalone) {
      return { outcome: 'already-installed' };
    }

    // 1. Wenn der native Prompt von Android/Chrome bereitsteht:
    if (globalDeferredPrompt) {
      try {
        const promptEvent = globalDeferredPrompt;
        globalDeferredPrompt = null;
        setHasPrompt(false);
        promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          setIsStandalone(true);
        }
        return choiceResult;
      } catch (err) {
        console.warn('PWA install prompt error:', err);
      }
    }

    // 2. Auf iOS oder wenn kein nativer Prompt verfügbar ist:
    setShowIosModal(true);
    return { outcome: 'instructions-shown' };
  }, [isStandalone]);

  // Installierbar wenn nicht bereits im Standalone-Modus
  const canInstall = !isStandalone;

  return {
    canInstall,
    isStandalone,
    hasPrompt,
    isIos,
    installApp,
    showIosModal,
    setShowIosModal,
  };
};
