import { useCallback, useEffect, useRef, useState } from 'react';

export default function usePendingShopChanges({ apiUrl, authToken, isAdmin, isLoggedIn, menuOpen }) {
  const [count, setCount] = useState(0);
  const refreshRef = useRef(null);
  useEffect(() => {
    setCount(0);
    if (!apiUrl || !isAdmin || !isLoggedIn) return;
    let active = true;
    let requestId = 0;
    const controller = new AbortController();
    const refresh = async () => {
      const currentRequest = ++requestId;
      try {
        const response = await fetch(`${apiUrl}/admin/get_shop_change_request_count.php`, {
          credentials: 'include', signal: controller.signal,
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        const data = await response.json();
        if (!response.ok || data.status !== 'success' || !Number.isInteger(data.pending_count) || data.pending_count < 0) {
          throw new Error('Ungültige Antwort für offene Änderungsvorschläge.');
        }
        if (active && currentRequest === requestId) setCount(data.pending_count);
      } catch (error) {
        if (active && error.name !== 'AbortError') console.error('Änderungsvorschläge-Badge konnte nicht aktualisiert werden:', error);
      }
    };
    const refreshVisible = () => { if (!document.hidden) refresh(); };
    refreshRef.current = refresh;
    refresh();
    const interval = window.setInterval(refreshVisible, 60000);
    window.addEventListener('shop-change-requests-updated', refresh);
    window.addEventListener('focus', refreshVisible);
    document.addEventListener('visibilitychange', refreshVisible);
    return () => {
      active = false;
      controller.abort();
      refreshRef.current = null;
      window.clearInterval(interval);
      window.removeEventListener('shop-change-requests-updated', refresh);
      window.removeEventListener('focus', refreshVisible);
      document.removeEventListener('visibilitychange', refreshVisible);
    };
  }, [apiUrl, authToken, isAdmin, isLoggedIn]);
  const refresh = useCallback(() => refreshRef.current?.(), []);
  useEffect(() => { if (menuOpen) refresh(); }, [menuOpen, refresh]);
  return count;
}
