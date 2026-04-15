export const getSubmitPriceErrorMessage = (response, data) => {
  if (Array.isArray(data)) {
    const errorEntry = data.find(
      (entry) =>
        entry?.status === "error" ||
        (entry?.typ && entry?.status && entry.status !== "success")
    );
    if (errorEntry?.message) {
      return errorEntry.message;
    }
  }

  if (data?.status === "error" || data?.error) {
    return data.message || data.error;
  }

  if (!response.ok) {
    return data?.message || data?.error || `HTTP ${response.status}`;
  }

  return null;
};
