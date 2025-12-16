const API_BASE = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/+$/, '');

const shouldAttachAuth = (targetUrl) => {
  if (!API_BASE) return false;
  if (!targetUrl) return false;
  try {
    const normalizedTarget = targetUrl.replace(/\/+$/, '');
    return normalizedTarget.startsWith(API_BASE);
  } catch (error) {
    return false;
  }
};

const installAuthFetch = () => {
  if (typeof window === 'undefined' || window.__authFetchInstalled) {
    return;
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const options = { ...init };
    const requestUrl = typeof input === 'string' ? input : input?.url;
    const baseHeaders = init?.headers
      || (typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined)
      || {};
    const headers = new Headers(baseHeaders);
    const token = localStorage.getItem('authToken');

    if (token && !headers.has('Authorization') && shouldAttachAuth(requestUrl)) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    options.headers = headers;

    const response = await originalFetch(input, options);

    if (response.status === 401) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    return response;
  };

  window.__authFetchInstalled = true;
};

installAuthFetch();
