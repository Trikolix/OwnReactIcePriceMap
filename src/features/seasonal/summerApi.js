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

export const fetchSummerCampaignProgress = async (authToken = null) => {
  const response = await fetch(`${getApiBase()}/api/summer_campaign_progress.php`, {
    headers: authHeaders(authToken),
  });
  return toJson(response);
};

export const fetchSummerAdminState = async (authToken) => {
  const response = await fetch(`${getApiBase()}/admin/summer_campaign.php`, {
    headers: authHeaders(authToken),
  });
  return toJson(response);
};

export const searchSummerAdminShops = async (authToken, query) => {
  const response = await fetch(`${getApiBase()}/admin/summer_campaign.php?q=${encodeURIComponent(query)}`, {
    headers: authHeaders(authToken),
  });
  return toJson(response);
};

export const postSummerAdminAction = async (authToken, payload) => {
  const isFormData = payload instanceof FormData;
  const response = await fetch(`${getApiBase()}/admin/summer_campaign.php`, {
    method: 'POST',
    headers: isFormData
      ? authHeaders(authToken)
      : {
        'Content-Type': 'application/json',
        ...authHeaders(authToken),
      },
    body: isFormData ? payload : JSON.stringify(payload),
  });
  return toJson(response);
};
