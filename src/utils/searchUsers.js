export async function searchUsers(apiUrl, query, options = {}) {
  const trimmedQuery = String(query || "").trim();
  if (!apiUrl || trimmedQuery.length < 2) return [];

  const response = await fetch(
    `${apiUrl}/api/search_user.php?q=${encodeURIComponent(trimmedQuery)}`,
    options.signal ? { signal: options.signal } : undefined
  );
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}
