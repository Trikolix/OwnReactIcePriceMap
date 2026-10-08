import { useCallback, useEffect, useRef, useState } from 'react';
import { APP_BUILD_ID, APP_VERSION } from '../generated/buildInfo';

export const CHECK_INTERVAL_MS = 5 * 60 * 1000;
export const HIDDEN_RELOAD_DELAY_MS = 1500;
const RELOAD_ATTEMPT_STORAGE_KEY = 'ice-app:update-reload-attempt';

async function fetchRemoteVersion() {
  const response = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`version.json not reachable (${response.status})`);
  }
  return response.json();
}

function getRemoteBuild(remote) {
  if (remote?.buildId) {
    return String(remote.buildId);
  }
  if (remote?.appVersion) {
    return `version:${remote.appVersion}`;
  }
  return null;
}

function getCurrentBuild() {
  return APP_BUILD_ID || `version:${APP_VERSION}`;
}

function readReloadAttempt() {
  try {
    return window.sessionStorage.getItem(RELOAD_ATTEMPT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeReloadAttempt(buildId) {
  try {
    window.sessionStorage.setItem(RELOAD_ATTEMPT_STORAGE_KEY, buildId);
  } catch {
    // Storage may be disabled. The reload itself remains safe; only the loop guard is unavailable.
  }
}

function clearReloadAttempt() {
  try {
    window.sessionStorage.removeItem(RELOAD_ATTEMPT_STORAGE_KEY);
  } catch {
    // Ignore storage restrictions.
  }
}

function isUserEditing() {
  const activeElement = document.activeElement;
  return Boolean(activeElement?.matches?.(
    'input:not([type="button"]):not([type="submit"]):not([type="reset"]), textarea, select, [contenteditable="true"]',
  ));
}

export function useAppVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [reloadFailed, setReloadFailed] = useState(false);
  const [remoteInfo, setRemoteInfo] = useState(null);
  const pendingBuildRef = useRef(null);
  const reloadTimerRef = useRef(null);
  const cancelledRef = useRef(false);

  const reloadNow = useCallback(({ automatic = false } = {}) => {
    const pendingBuild = pendingBuildRef.current;
    if (!pendingBuild || navigator.onLine === false) {
      return false;
    }

    if (automatic && readReloadAttempt() === pendingBuild) {
      setReloadFailed(true);
      return false;
    }

    if (automatic) {
      writeReloadAttempt(pendingBuild);
    }

    window.location.reload();
    return true;
  }, []);

  useEffect(() => {
    cancelledRef.current = false;

    const clearScheduledReload = () => {
      if (reloadTimerRef.current !== null) {
        window.clearTimeout(reloadTimerRef.current);
        reloadTimerRef.current = null;
      }
    };

    const scheduleReloadWhenHidden = () => {
      clearScheduledReload();
      if (!document.hidden || !pendingBuildRef.current || navigator.onLine === false) {
        return;
      }

      reloadTimerRef.current = window.setTimeout(() => {
        reloadTimerRef.current = null;
        if (!cancelledRef.current && document.hidden && !isUserEditing()) {
          reloadNow({ automatic: true });
        }
      }, HIDDEN_RELOAD_DELAY_MS);
    };

    const runCheck = async () => {
      try {
        const remote = await fetchRemoteVersion();
        if (cancelledRef.current) {
          return;
        }

        setRemoteInfo(remote);
        const remoteBuild = getRemoteBuild(remote);
        const currentBuild = getCurrentBuild();
        const hasVersionMismatch = Boolean(remoteBuild && remoteBuild !== currentBuild);

        if (!hasVersionMismatch) {
          pendingBuildRef.current = null;
          clearReloadAttempt();
          setUpdateAvailable(false);
          setReloadFailed(false);
          return;
        }

        pendingBuildRef.current = remoteBuild;
        setUpdateAvailable(true);
        setReloadFailed(readReloadAttempt() === remoteBuild);
        scheduleReloadWhenHidden();
      } catch {
        // A version check must never interrupt normal app usage.
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        scheduleReloadWhenHidden();
      } else {
        clearScheduledReload();
        runCheck();
      }
    };

    const handleFocus = () => runCheck();
    const handleOnline = () => {
      runCheck();
      scheduleReloadWhenHidden();
    };

    runCheck();
    const intervalId = window.setInterval(runCheck, CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    return () => {
      cancelledRef.current = true;
      window.clearInterval(intervalId);
      clearScheduledReload();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [reloadNow]);

  return {
    updateAvailable,
    reloadFailed,
    remoteInfo,
    reloadNow: () => reloadNow(),
    currentBuildId: APP_BUILD_ID,
    currentVersion: APP_VERSION,
  };
}
