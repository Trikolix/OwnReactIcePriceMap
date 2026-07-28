const getApiBase = () => import.meta.env.VITE_API_BASE_URL;

const headers = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

const request = async (path, options = {}, authToken = null) => {
  const response = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers: { ...headers(authToken), ...(options.headers || {}) },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || `HTTP ${response.status}`);
  return data;
};

export const fetchTourDeGlaceFemmeProgress = (token = null) => request('/api/tour_de_glace_femme_progress.php', {}, token);
export const fetchTourDeGlaceFemmeLeaderboard = (token = null, mode = 'stage', limit = 50) =>
  request(`/api/tour_de_glace_femme_leaderboard.php?${new URLSearchParams({ mode, limit: String(limit) })}`, {}, token);
export const submitTourDeGlaceFemmeTips = (token, tips) => request('/api/tour_de_glace_femme_submit_tips.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tips) }, token);
export const submitTourDeGlaceFemmeStageTip = (token, stageNumber, tipStageWinner) => request('/api/tour_de_glace_femme_submit_stage_tip.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage_number: stageNumber, tip_stage_winner: tipStageWinner }) }, token);
export const findTourDeGlaceFemmeEgg = (token, stageNumber, secretCode) => request('/api/tour_de_glace_femme_find_easter_egg.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage_number: stageNumber, secret_code: secretCode }) }, token);

export const fetchTourDeGlaceFemmeAdmin = (token) => request('/admin/tour_de_glace_femme.php', {}, token);
export const saveTourDeGlaceFemmeStageResult = (token, stageNumber, stageTop10) => request('/admin/tour_de_glace_femme_stage_result.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage_number: stageNumber, stage_top10: stageTop10 }) }, token);
export const saveTourDeGlaceFemmeFinalResults = (token, finalResults) => request('/admin/tour_de_glace_femme_final_results.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalResults) }, token);
