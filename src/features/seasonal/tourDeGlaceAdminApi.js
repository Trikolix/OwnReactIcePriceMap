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

export const fetchTourDeGlaceAdminState = async (authToken) => {
  const response = await fetch(`${getApiBase()}/admin/tour_de_glace.php`, {
    headers: authHeaders(authToken),
  });
  return toJson(response);
};

export const saveTourDeGlaceStageResult = async (authToken, stageNumber, stageTop10) => {
  const cleanTop10 = Array.isArray(stageTop10)
    ? Array.from({ length: 10 }, (_, index) => String(stageTop10[index] || '').trim())
    : [];
  const response = await fetch(`${getApiBase()}/admin/tour_de_glace_stage_result.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(authToken),
    },
    body: JSON.stringify({
      stage_number: stageNumber,
      stage_winner: cleanTop10[0] || '',
      stage_top10: cleanTop10,
    }),
  });
  return toJson(response);
};

export const downloadTourDeGlaceStoryPack = async (authToken, pack = 'all', limit = 5) => {
  const params = new URLSearchParams({
    pack,
    limit: String(limit),
  });
  const response = await fetch(`${getApiBase()}/admin/tour_de_glace_story_pack.php?${params.toString()}`, {
    headers: authHeaders(authToken),
  });
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const data = await response.json();
      message = data?.message || message;
    } catch {
      // ZIP endpoint may not return JSON for all server errors.
    }
    throw new Error(message);
  }
  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] || `ice_tour_de_glace_${pack}_stories.zip`;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
