import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

let deferredPrompt = null;
let installedThisSession = false;
const listeners = new Set();
const notify = () => listeners.forEach(listener => listener());
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); deferredPrompt = event; notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null; installedThisSession = true; notify();
  });
}
export const isStandaloneApp = () => typeof window !== 'undefined' && (
  Capacitor.isNativePlatform() || installedThisSession || window.navigator.standalone === true
  || ['standalone', 'minimal-ui', 'fullscreen'].some(mode => window.matchMedia?.(`(display-mode: ${mode})`).matches)
);
export const isIosDevice = () => typeof navigator !== 'undefined' && (
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
);

export function usePwaInstall() {
  const [isStandalone, setStandalone] = useState(isStandaloneApp);
  const [hasPrompt, setHasPrompt] = useState(Boolean(deferredPrompt));
  const [showInstructions, setShowInstructions] = useState(false);
  useEffect(() => {
    const update = () => { setStandalone(isStandaloneApp()); setHasPrompt(Boolean(deferredPrompt)); };
    listeners.add(update);
    const media = window.matchMedia?.('(display-mode: standalone)');
    media?.addEventListener?.('change', update);
    update();
    return () => { listeners.delete(update); media?.removeEventListener?.('change', update); };
  }, []);
  const installApp = useCallback(async () => {
    if (isStandalone) return { outcome: 'already-installed' };
    if (deferredPrompt) {
      const prompt = deferredPrompt;
      deferredPrompt = null; notify();
      try {
        await prompt.prompt();
        // Acceptance is not proof of completion; wait for appinstalled/display-mode.
        return await prompt.userChoice;
      } catch { /* Offer the browser's manual installation steps. */ }
    }
    setShowInstructions(true);
    return { outcome: 'instructions-shown' };
  }, [isStandalone]);
  return { isStandalone, canInstall: !isStandalone, hasPrompt, isIos: isIosDevice(),
    installApp, showInstructions, setShowInstructions };
}
