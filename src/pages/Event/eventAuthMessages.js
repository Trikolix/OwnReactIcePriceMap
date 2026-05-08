export const EVENT_LOGIN_REQUIRED_MESSAGE = "Logge dich ein, um die Seite betrachten zu können.";
export const EVENT_FORBIDDEN_MESSAGE = "Dir fehlen die nötigen Rechte, um die Seite zu sehen.";

export function getEventAccessErrorMessage(status, fallbackMessage = "Daten konnten nicht geladen werden.") {
  if (status === 401) return EVENT_LOGIN_REQUIRED_MESSAGE;
  if (status === 403) return EVENT_FORBIDDEN_MESSAGE;
  return fallbackMessage;
}

export async function readEventApiJson(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}
