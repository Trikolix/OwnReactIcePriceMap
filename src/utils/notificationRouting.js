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

const buildDashboardTargetUrl = (type, id, commentId = null) => {
  if (!type || !id) return null;
  const params = new URLSearchParams({ type, id: String(id) });
  if (commentId) params.set('focusComment', String(commentId));
  return `/dashboard/target?${params.toString()}`;
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
      return buildDashboardTargetUrl('new_user', targetUserId, commentId) || "/dashboard";
    }
    case "kommentar_award": {
      const awardId = data.user_award_id;
      const commentId = data.kommentar_id || notification?.referenz_id;
      return buildDashboardTargetUrl('award', awardId, commentId) || "/dashboard";
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
        const checkinId = data.checkin_id || entityId;
        return data.eisdiele_id && checkinId
          ? `/map/activeShop/${data.eisdiele_id}?tab=checkins&focusCheckin=${checkinId}`
          : null;
      } else if (entityType === "bewertung") {
        const reviewId = data.bewertung_id || entityId;
        return data.eisdiele_id && reviewId
          ? `/map/activeShop/${data.eisdiele_id}?tab=reviews&focusReview=${reviewId}`
          : null;
      } else if (entityType === "route") {
        const routeId = data.route_id || entityId;
        return data.route_autor_id && routeId
          ? `/user/${data.route_autor_id}?tab=routes&focusRoute=${routeId}`
          : null;
      } else if (entityType === "kommentar") {
        const commentId = data.kommentar_id || entityId;
        const commentQuery = commentId ? `&focusComment=${commentId}` : "";
        if (data.checkin_id && data.eisdiele_id) {
          return `/map/activeShop/${data.eisdiele_id}?tab=checkins&focusCheckin=${data.checkin_id}${commentQuery}`;
        }
        if (data.bewertung_id && data.eisdiele_id) {
          return `/map/activeShop/${data.eisdiele_id}?tab=reviews&focusReview=${data.bewertung_id}${commentQuery}`;
        }
        if (data.route_id && data.route_autor_id) {
          return `/user/${data.route_autor_id}?tab=routes&focusRoute=${data.route_id}${commentQuery}`;
        }
        if (data.user_registration_id) {
          return buildDashboardTargetUrl('new_user', data.user_registration_id, data.kommentar_id);
        }
        if (data.user_award_id) {
          return buildDashboardTargetUrl('award', data.user_award_id, data.kommentar_id);
        }
        return null;
      } else if (entityType === "user_registration") {
        const targetUserId = data.user_registration_id || entityId;
        return buildDashboardTargetUrl('new_user', targetUserId);
      } else if (entityType === "user_award") {
        const awardId = data.user_award_id || entityId;
        return buildDashboardTargetUrl('award', awardId);
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
          return buildDashboardTargetUrl('new_user', referenceId, data.kommentar_id) || "/dashboard";
        case "user_award_kommentar":
          return buildDashboardTargetUrl('award', referenceId, data.kommentar_id) || "/dashboard";
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
