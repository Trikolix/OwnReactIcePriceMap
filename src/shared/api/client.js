const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export const getApiBaseUrl = () => API_BASE;

export const buildApiUrl = (path) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
};

export const apiFetch = async (path, options = {}) => {
  const response = await fetch(buildApiUrl(path), options);
  return response;
};

export const apiFetchJson = async (path, options = {}) => {
  const response = await apiFetch(path, options);
  const data = await response.json();
  return { response, data };
};
