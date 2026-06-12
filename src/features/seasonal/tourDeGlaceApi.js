const getApiBase = () => import.meta.env.VITE_API_BASE_URL;

const authHeaders = (authToken) => ({
  ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
});

const toJson = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `HTTP ${response.status}`);
  }
  return data;
};

export const fetchTourDeGlaceProgress = async (authToken = null) => {
  const response = await fetch(`${getApiBase()}/api/tour_de_glace_progress.php`, {
    headers: authHeaders(authToken),
  });
  return toJson(response);
};

export const selectTourDeGlaceRiderType = async (authToken, riderType) => {
  const response = await fetch(`${getApiBase()}/api/tour_de_glace_select_rider_type.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(authToken),
    },
    body: JSON.stringify({ rider_type: riderType }),
  });
  return toJson(response);
};

export const submitTourDeGlaceTips = async (authToken, tips) => {
  const response = await fetch(`${getApiBase()}/api/tour_de_glace_submit_tips.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(authToken),
    },
    body: JSON.stringify(tips),
  });
  return toJson(response);
};

export const findTourDeGlaceEasterEgg = async (authToken, stageNumber, secretCode) => {
  const response = await fetch(`${getApiBase()}/api/tour_de_glace_find_easter_egg.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(authToken),
    },
    body: JSON.stringify({ stage_number: stageNumber, secret_code: secretCode }),
  });
  return toJson(response);
};

export const fetchTourDeGlaceLeaderboard = async (authToken = null, jersey = 'yellow', limit = 20) => {
  const params = new URLSearchParams({
    jersey,
    limit: String(limit),
  });
  const response = await fetch(`${getApiBase()}/api/tour_de_glace_leaderboard.php?${params.toString()}`, {
    headers: authHeaders(authToken),
  });
  return toJson(response);
};
