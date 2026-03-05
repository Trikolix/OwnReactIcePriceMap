import { useEffect, useState } from 'react';
import { APP_BUILD_ID, APP_VERSION } from '../generated/buildInfo';

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

async function fetchRemoteVersion() {
  const response = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`version.json not reachable (${response.status})`);
  }
  return response.json();
}

export function useAppVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [remoteInfo, setRemoteInfo] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const runCheck = async () => {
      try {
        const remote = await fetchRemoteVersion();
        if (cancelled) {
          return;
        }
        setRemoteInfo(remote);
        const hasBuildMismatch = remote?.buildId && remote.buildId !== APP_BUILD_ID;
        const hasVersionMismatch = remote?.appVersion && remote.appVersion !== APP_VERSION;
        if (hasBuildMismatch || hasVersionMismatch) {
          setUpdateAvailable(true);
        }
      } catch {
        // Silent fail: version check should never break app usage.
      }
    };

    runCheck();
    const intervalId = window.setInterval(runCheck, CHECK_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return {
    updateAvailable,
    remoteInfo,
    currentBuildId: APP_BUILD_ID,
    currentVersion: APP_VERSION,
  };
}
