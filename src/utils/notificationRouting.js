export const parseNotificationExtra = (value) => {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export const buildNotificationDeeplink = (notification, userId) => {
  const data = parseNotificationExtra(notification?.zusatzdaten);

  switch (notification?.typ) {
    case "kommentar":
      if (data.checkin_id && data.eisdiele_id) {
        return `/map/activeShop/${data.eisdiele_id}?tab=checkins&focusCheckin=${data.checkin_id}`;
      }
      return null;
    case "kommentar_bewertung":
      if (data.bewertung_id && data.eisdiele_id) {
        return `/map/activeShop/${data.eisdiele_id}?tab=reviews&focusReview=${data.bewertung_id}`;
      }
      return null;
    case "kommentar_route":
      if (data.route_id && data.route_autor_id) {
        return `/user/${data.route_autor_id}?tab=routes&focusRoute=${data.route_id}`;
      }
      return null;
    case "kommentar_new_user": {
      const targetUserId = data.user_registration_id || notification?.referenz_id;
      return targetUserId ? `/user/${targetUserId}` : null;
    }
    case "new_user":
      return notification?.referenz_id ? `/user/${notification.referenz_id}` : null;
    case "team_challenge": {
      const challengeId = data.team_challenge_id || notification?.referenz_id;
      return challengeId ? `/challenge?tab=team&teamChallengeId=${challengeId}` : "/challenge?tab=team";
    }
    case "systemmeldung": {
      const targetUserId = userId || notification?.empfaenger_id;
      return targetUserId
        ? `/user/${targetUserId}?systemmeldungId=${notification?.referenz_id}&notificationId=${notification?.id}`
        : null;
    }
    case "checkin_mention": {
      const targetUserId = userId || notification?.empfaenger_id;
      return targetUserId ? `/user/${targetUserId}?mentionNotificationId=${notification?.id}` : null;
    }
    default:
      return null;
  }
};
