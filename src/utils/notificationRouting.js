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
        return `/map/activeShop/${data.eisdiele_id}?tab=checkins&focusCheckin=${data.checkin_id}${data.kommentar_id ? `&focusComment=${data.kommentar_id}` : ""}`;
      }
      return null;
    case "kommentar_bewertung":
      if (data.bewertung_id && data.eisdiele_id) {
        return `/map/activeShop/${data.eisdiele_id}?tab=reviews&focusReview=${data.bewertung_id}${data.kommentar_id ? `&focusComment=${data.kommentar_id}` : ""}`;
      }
      return null;
    case "kommentar_route":
      if (data.route_id && data.route_autor_id) {
        return `/user/${data.route_autor_id}?tab=routes&focusRoute=${data.route_id}${data.kommentar_id ? `&focusComment=${data.kommentar_id}` : ""}`;
      }
      return null;
    case "kommentar_new_user": {
      const targetUserId = data.user_registration_id || notification?.referenz_id;
      const commentId = data.kommentar_id || notification?.referenz_id;
      return targetUserId ? `/dashboard?focusNewUser=${targetUserId}${commentId ? `&focusComment=${commentId}` : ""}` : "/dashboard";
    }
    case "kommentar_award": {
      const awardId = data.user_award_id;
      const commentId = data.kommentar_id || notification?.referenz_id;
      return awardId ? `/dashboard?focusAward=${awardId}${commentId ? `&focusComment=${commentId}` : ""}` : "/dashboard";
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
    case "like": {
      const entityType = data.entity_type || "";
      const entityId = data.entity_id || 0;
      if (entityType === "checkin") {
        return `/dashboard?focusCheckin=${entityId}`;
      } else if (entityType === "bewertung") {
        return `/dashboard?focusReview=${entityId}`;
      } else if (entityType === "route") {
        return `/dashboard?focusRoute=${entityId}`;
      } else if (entityType === "kommentar") {
        return `/dashboard?focusComment=${entityId}`;
      }
      return null;
    }
    case "mention": {
      const referenceId = data.reference_id || notification?.referenz_id;
      const commentQuery = data.kommentar_id ? `&focusComment=${data.kommentar_id}` : "";

      switch (data.reference_type) {
        case "checkin_kommentar":
          return data.eisdiele_id && referenceId
            ? `/map/activeShop/${data.eisdiele_id}?tab=checkins&focusCheckin=${referenceId}${commentQuery}`
            : null;
        case "bewertung_kommentar":
          return data.eisdiele_id && referenceId
            ? `/map/activeShop/${data.eisdiele_id}?tab=reviews&focusReview=${referenceId}${commentQuery}`
            : null;
        case "route_kommentar":
          return data.route_autor_id && referenceId
            ? `/user/${data.route_autor_id}?tab=routes&focusRoute=${referenceId}${commentQuery}`
            : null;
        case "user_registration_kommentar":
          return referenceId ? `/dashboard?focusNewUser=${referenceId}${commentQuery}` : "/dashboard";
        case "user_award_kommentar":
          return referenceId ? `/dashboard?focusAward=${referenceId}${commentQuery}` : "/dashboard";
        case "checkin":
          return data.eisdiele_id && referenceId
            ? `/map/activeShop/${data.eisdiele_id}?tab=checkins&focusCheckin=${referenceId}`
            : null;
        case "route": {
          const routeOwnerId = data.route_autor_id || data.source_user_id;
          return routeOwnerId && referenceId
            ? `/user/${routeOwnerId}?tab=routes&focusRoute=${referenceId}`
            : null;
        }
        default:
          return null;
      }
    }
    default:
      return null;
  }
};
