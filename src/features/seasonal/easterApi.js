const getApiBase = () => import.meta.env.VITE_API_BASE_URL;

const toJson = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || data?.message || `HTTP ${response.status}`);
  }
  return data;
};

const createJsonRequest = (url, payload) => {
  if (!payload) {
    return fetch(url);
  }

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
};

export const fetchEasterCampaignProgress = async (payload = null) => {
  const response = await createJsonRequest(`${getApiBase()}/api/easter_bunny_progress.php`, payload);
  return toJson(response);
};

export const advanceEasterBunnyHop = async (payload = null) => {
  const response = await fetch(`${getApiBase()}/api/easter_bunny_hop.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload || {}),
  });
  return toJson(response);
};

export const claimEasterDailyHint = async () => {
  const response = await fetch(`${getApiBase()}/api/easter_bunny_daily_hint.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  return toJson(response);
};

export const discoverEasterWorkshop = async () => {
  const response = await fetch(`${getApiBase()}/api/easter_workshop_discover.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  return toJson(response);
};
