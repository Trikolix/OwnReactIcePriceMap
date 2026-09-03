const getApiBase = () => import.meta.env.VITE_API_BASE_URL;

const authHeaders = (authToken) => ({
  ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
});

const parseResponse = async (response) => {
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    const firstBrace = text.indexOf('{');
    if (firstBrace !== -1) {
      try {
        data = JSON.parse(text.slice(firstBrace));
      } catch {}
    }
    if (!data) {
      const cleanText = text.replace(/<[^>]*>/g, '').trim();
      throw new Error(cleanText || `HTTP ${response.status}`);
    }
  }
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

export const fetchCheckinShareManifest = async (authToken, checkinId, signal) => {
  const response = await fetch(`${getApiBase()}/social_media/checkin_share.php?checkin_id=${encodeURIComponent(checkinId)}`, {
    headers: authHeaders(authToken),
    signal,
  });
  return parseResponse(response);
};

export const fetchCheckinShareImage = async (authToken, payload, signal) => {
  const response = await fetch(`${getApiBase()}/social_media/checkin_share.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(authToken),
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const data = await response.json();
      message = data?.message || message;
    } catch {
      // Non-JSON response
    }
    throw new Error(message);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType && !contentType.includes('image')) {
    const text = await response.text();
    let message = text.replace(/<[^>]*>/g, '').trim();
    try {
      const data = JSON.parse(text);
      message = data?.message || data?.error || message;
    } catch {}
    throw new Error(message || 'Server lieferte kein gültiges PNG-Bild.');
  }

  const blob = await response.blob();
  if (blob.size === 0) {
    throw new Error('Das generierte Bild ist leer (0 Bytes).');
  }

  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = match?.[1] || `ice-story-${payload.checkin_id}.png`;

  return { blob, filename };
};
