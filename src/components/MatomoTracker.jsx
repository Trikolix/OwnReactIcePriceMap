import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const MatomoTracker = () => {
  const location = useLocation();
  const scriptInjected = useRef(false);

  useEffect(() => {
    const matomoUrl = import.meta.env.VITE_MATOMO_URL;
    const siteId = import.meta.env.VITE_MATOMO_SITE_ID;

    // Only inject and track if Matomo variables are set
    if (!matomoUrl || !siteId) {
      return;
    }

    window._paq = window._paq || [];

    // Track cookieless
    window._paq.push(['disableCookies']);

    // Inject Matomo script on first mount
    if (!scriptInjected.current) {
      // Base tracking code
      const u = matomoUrl.endsWith('/') ? matomoUrl : `${matomoUrl}/`;
      window._paq.push(['setTrackerUrl', u + 'matomo.php']);
      window._paq.push(['setSiteId', siteId]);

      const d = document;
      const g = d.createElement('script');
      const s = d.getElementsByTagName('script')[0];
      
      g.type = 'text/javascript';
      g.async = true;
      g.defer = true;
      g.src = u + 'matomo.js';
      
      if (s && s.parentNode) {
        s.parentNode.insertBefore(g, s);
      } else {
        document.head.appendChild(g);
      }
      
      scriptInjected.current = true;
    }

    // Track page view on route change
    // Using current href ensures we get the full path with search params etc.
    window._paq.push(['setCustomUrl', window.location.href]);
    window._paq.push(['setDocumentTitle', document.title]);
    window._paq.push(['trackPageView']);
    window._paq.push(['enableLinkTracking']);

  }, [location.pathname, location.search]);

  return null;
};

export default MatomoTracker;
