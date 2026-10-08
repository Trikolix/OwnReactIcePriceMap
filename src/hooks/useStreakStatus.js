import { useEffect, useState } from 'react';

export function publishStreakUpdate(userId, data = {}) {
  window.dispatchEvent(new CustomEvent('streak-updated', { detail: { ...data, userId: String(userId) } }));
}

export default function useStreakStatus(userId, viewerId, settle = false) {
  const [result, setResult] = useState(null);
  const key = `${viewerId || ''}:${userId || ''}`;
  useEffect(() => {
    setResult(null);
    if (!userId) return undefined;
    let disposed = false;
    let revision = 0;
    let resolvedUserId = String(userId);
    let boundaryTimer;
    let animationTimer;
    const controller = new AbortController();
    const refresh = async () => {
      const request = ++revision;
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/streak_status.php?user_id=${encodeURIComponent(userId)}`, {
          method: settle && String(userId) === String(viewerId) ? 'POST' : 'GET', signal: controller.signal,
        });
        if (!response.ok) return;
        const data = await response.json();
        if (disposed || request !== revision) return;
        resolvedUserId = String(data.user_id);
        setResult(previous => ({ ...data, key, events: previous?.key === key ? previous.events : [] }));
        clearTimeout(boundaryTimer);
        // Also refresh inactive streaks at the next Berlin midnight.
        const seconds = data.refresh_after_seconds || data.streaks?.day?.seconds_left || 3600;
        boundaryTimer = setTimeout(refresh, Math.max(1, seconds + 1) * 1000);
      } catch (error) {
        if (error.name !== 'AbortError') console.warn('Streak konnte nicht aktualisiert werden', error);
      }
    };
    const onUpdate = event => {
      if (event.detail.userId !== String(userId) && event.detail.userId !== resolvedUserId) return;
      ++revision;
      const { streaks, streak_events: events = [] } = event.detail;
      if (streaks) setResult(previous => ({ ...previous, key, streaks, events }));
      clearTimeout(animationTimer);
      animationTimer = setTimeout(() => setResult(previous => previous?.key === key ? { ...previous, events: [] } : previous), 1400);
      refresh();
    };
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    refresh();
    window.addEventListener('streak-updated', onUpdate);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      disposed = true; controller.abort(); clearTimeout(boundaryTimer); clearTimeout(animationTimer);
      window.removeEventListener('streak-updated', onUpdate);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [key, userId, viewerId, settle]);
  return result?.key === key ? result : null;
}
