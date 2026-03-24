const getApiBase = () => import.meta.env.VITE_API_BASE_URL;

const toJson = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || data?.message || `HTTP ${response.status}`);
  }
  return data;
};

export const fetchEasterCampaignProgress = async () => {
  const response = await fetch(`${getApiBase()}/api/easter_bunny_progress.php`);
  return toJson(response);
};

export const advanceEasterBunnyHop = async () => {
  const response = await fetch(`${getApiBase()}/api/easter_bunny_hop.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
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
