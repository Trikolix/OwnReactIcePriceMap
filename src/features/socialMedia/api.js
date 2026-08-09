const getApiBase = () => import.meta.env.VITE_API_BASE_URL;

const authHeaders = (authToken) => ({
  ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
});

const parseResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `HTTP ${response.status}`);
  }
  return data;
};

export const fetchSocialMediaCandidates = async (authToken, filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  const response = await fetch(`${getApiBase()}/social_media/list_candidates.php?${params.toString()}`, {
    headers: authHeaders(authToken),
  });
  return parseResponse(response);
};

export const downloadSocialMediaPack = async (authToken, payload) => {
  const response = await fetch(`${getApiBase()}/social_media/download_pack.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(authToken),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const data = await response.json();
      message = data?.message || message;
    } catch {
      // A failed binary response may not contain JSON.
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = match?.[1] || (payload.single ? 'ice-instagram-export.png' : 'ice-instagram-export.zip');
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const fetchSocialMediaPreview = async (authToken, payload) => {
  const response = await fetch(`${getApiBase()}/social_media/download_pack.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(authToken),
    },
    body: JSON.stringify({ ...payload, single: true }),
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const data = await response.json();
      message = data?.message || message;
    } catch {
      // A failed binary response may not contain JSON.
    }
    throw new Error(message);
  }

  return URL.createObjectURL(await response.blob());
};

export const downloadSocialMediaOriginal = async (authToken, imageId) => {
  const response = await fetch(`${getApiBase()}/social_media/download_original.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(authToken),
    },
    body: JSON.stringify({ image_id: imageId }),
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const data = await response.json();
      message = data?.message || message;
    } catch {
      // A failed binary response may not contain JSON.
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = match?.[1] || `ice-original-${imageId}.jpg`;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
