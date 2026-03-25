import React, { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { useUser } from "../context/UserContext";
import styled from "styled-components";
import SystemModal from "./SystemModal";
import MentionInviteModal from "./MentionInviteModal";

const NotificationBell = () => {
    const { userId } = useUser();
    const [notifications, setNotifications] = useState([]);
    const [show, setShow] = useState(false);
    const dropdownRef = useRef(null);
    const [systemModal, setSystemModal] = useState({ isOpen: false, title: "", message: "" });
    const [mentionModal, setMentionModal] = useState({ isOpen: false, data: null });

    const openSystemModal = ({ title, message }) => {
        setSystemModal({ isOpen: true, title, message });
    };

    const navigateToTeamChallenge = (notification) => {
        const data = JSON.parse(notification.zusatzdaten || '{}');
        const challengeId = data.team_challenge_id || notification.referenz_id;
        window.location.href = challengeId
            ? `/challenge?tab=team&teamChallengeId=${challengeId}`
            : '/challenge?tab=team';
    };

    const loadNotifications = async () => {
        const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/benachrichtigungen.php?action=list&nutzer_id=${userId}`
        );
        const data = await res.json();
        if (data.status === "success") {
            setNotifications(data.notifications);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShow(false);
            }
        };

        if (show) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [show]);

    useEffect(() => {
        if (userId) loadNotifications();
    }, [userId]);

    const markAsRead = async (id) => {
        try {
            await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/benachrichtigungen.php?action=markAsRead`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, nutzer_id: userId }) }
            );
            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === id ? { ...n, ist_gelesen: true } : n
                )
            );
        } catch (err) {
            console.error("Fehler beim Markieren als gelesen", err);
        }
    };

    const handleNotificationClick = async (notification) => {
        setShow(false);
        if (!notification.ist_gelesen) {
            markAsRead(notification.id);
        }
        if (notification.typ === 'kommentar') {
            const data = JSON.parse(notification.zusatzdaten || '{}');
            if (data.checkin_id && data.eisdiele_id) {
                const url = `/map/activeShop/${data.eisdiele_id}?tab=checkins&focusCheckin=${data.checkin_id}`;
                window.location.href = url;
            }
        } else if (notification.typ === 'team_challenge') {
            navigateToTeamChallenge(notification);
        } else if (notification.typ === 'kommentar_bewertung') {
            const data = JSON.parse(notification.zusatzdaten || '{}');
            if (data.bewertung_id && data.eisdiele_id) {
                const url = `/map/activeShop/${data.eisdiele_id}?tab=reviews&focusReview=${data.bewertung_id}`;
                window.location.href = url;
            }
        } else if (notification.typ === 'kommentar_route') {
            const data = JSON.parse(notification.zusatzdaten || '{}');
            if (data.route_id && data.route_autor_id) {
                const url = `/user/${data.route_autor_id}?tab=routes&focusRoute=${data.route_id}`;
                window.location.href = url;
            }
        } else if (notification.typ === 'kommentar_new_user') {
            const data = JSON.parse(notification.zusatzdaten || '{}');
            const targetUserId = data.user_registration_id || notification.referenz_id;
            if (targetUserId) {
                window.location.href = `/user/${targetUserId}`;
            }
        } else if (notification.typ === 'new_user') {
            const url = `/user/${notification.referenz_id}`;
            window.location.href = url;
        } else if (notification.typ === 'systemmeldung') {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/systemmeldung.php?action=get&id=${notification.referenz_id}`);
                const data = await res.json();

                if (data.status === 'success') {
                    openSystemModal({
                        title: data.systemmeldung.titel,
                        message: data.systemmeldung.nachricht
                    });
                } else {
                    // Fallback auf zusatzdaten
                    const fallback = JSON.parse(notification.zusatzdaten || '{}');
                    openSystemModal({
                        title: notification.text || "Systemmeldung",
                        message: fallback.message || "Keine Nachricht verfügbar"
                    });
                }
            } catch (err) {
                // Fallback bei Netzwerkfehler
                const fallback = JSON.parse(notification.zusatzdaten || '{}');
                openSystemModal({
                    title: notification.text || "Systemmeldung",
                    message: fallback.message || "Keine Nachricht verfügbar"
                });
            }
        } else if (notification.typ === 'checkin_mention') {
            // Modal öffnen mit Infos und Optionen
            const data = JSON.parse(notification.zusatzdaten || '{}');
            setMentionModal({
                isOpen: true,
                data: {
                    checkinId: data.checkin_id,
                    shopId: data.shop_id,
                    inviterName: data.username || "Unbekannt",
                    shopName: data.shop_name || data.shop || "Eisdiele",
                    date: notification.erstellt_am,
                    userId: userId
                }
            });
        }
    };

    const unreadCount = notifications.filter((n) => !n.ist_gelesen).length;

    return (<>
        <BellWrapper>
            <BellButton onClick={() => setShow(!show)}>
                <Bell size={28} color="currentColor" style={{ verticalAlign: 'middle' }} />
                {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
            </BellButton>
            {show && (
                <Dropdown ref={dropdownRef}>
                    <DropdownHeader>
                        <DropdownTitle>Benachrichtigungen</DropdownTitle>
                        <DropdownCloseButton
                            type="button"
                            onClick={() => setShow(false)}
                            aria-label="Benachrichtigungen schließen"
                        >
                            <X size={18} />
                        </DropdownCloseButton>
                    </DropdownHeader>
                    {notifications.length === 0 ? (
                        <EmptyMessage>Keine Benachrichtigungen</EmptyMessage>
                    ) : (
                        <NotificationList>
                            {notifications.map((n) => (
                                <NotificationItem
                                    key={n.id}
                                    gelesen={n.ist_gelesen}
                                    onClick={() => handleNotificationClick(n)}
                                >
                                    <Message>{n.text}</Message>
                                    <Time>
                                        {new Date(n.erstellt_am).toLocaleString("de-DE", {
                                            dateStyle: "short",
                                            timeStyle: "short",
                                        })}
                                    </Time>
                                </NotificationItem>
                            ))}
                        </NotificationList>
                    )}
                </Dropdown>
            )}
        </BellWrapper>
        <SystemModal
            isOpen={systemModal.isOpen}
            onClose={() => setSystemModal({ ...systemModal, isOpen: false })}
            title={systemModal.title}
            message={systemModal.message}
        />
        <MentionInviteModal
            open={mentionModal.isOpen}
            onClose={() => setMentionModal({ isOpen: false, data: null })}
            {...(mentionModal.data || {})}
        />
    </>
    );
};

export default NotificationBell;

// Styled Components

const BellWrapper = styled.div`
  position: relative;
  margin-right: 0;
`;

const BellButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  color: inherit;
  padding: 0;
  border-radius: 10px;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const Badge = styled.span`
  position: absolute;
  top: -7px;
  left: -7px;
  min-width: 18px;
  height: 18px;
  background: #d92d20;
  color: white;
  font-size: 11px;
  font-weight: bold;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid #fff8ea;
  box-shadow: 0 1px 3px rgba(0,0,0,0.18);
`;

const Dropdown = styled.div`
  position: absolute;
  top: 38px;
  right: 0;
  width: min(340px, calc(100vw - 24px));
  max-height: min(60vh, 420px);
  background: rgba(255, 252, 243, 0.98);
  border-radius: 16px;
  border: 1px solid rgba(47, 33, 0, 0.12);
  box-shadow: 0 16px 36px rgba(28, 20, 0, 0.2);
  overflow-y: auto;
  z-index: 5000;
  color: #2f2100;

  @media (max-width: 480px) {
    position: fixed;
    top: calc(env(safe-area-inset-top, 0px) + 76px);
    left: 0;
    right: 0;
    width: 100vw;
    max-width: 100vw;
    box-sizing: border-box;
    max-height: min(
      calc(100dvh - (env(safe-area-inset-top, 0px) + 84px)),
      66dvh
    );
    border-radius: 0 0 16px 16px;
  }
`;

const NotificationList = styled.ul`
  list-style: none;
  padding: 0.5rem;
  margin: 0;
`;

const DropdownHeader = styled.div`
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px 8px;
  background: rgba(255, 252, 243, 0.98);
  border-bottom: 1px solid rgba(47, 33, 0, 0.08);
`;

const DropdownTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 800;
  color: #2f2100;
`;

const DropdownCloseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #2f2100;
  cursor: pointer;

  &:hover {
    background: rgba(47, 33, 0, 0.07);
  }
`;

const NotificationItem = styled.li`
  padding: 10px;
  border-bottom: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 10px;
  background: ${({ gelesen }) => (gelesen ? "rgba(47, 33, 0, 0.03)" : "rgba(255, 181, 34, 0.12)")};
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 2px;

  &:hover {
    background: ${({ gelesen }) => (gelesen ? "rgba(47, 33, 0, 0.07)" : "rgba(255, 181, 34, 0.22)")};
  }

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }
`;

const Message = styled.div`
  font-size: 14px;
  color: #2f2100;
  line-height: 1.35;
`;

const Time = styled.div`
  font-size: 12px;
  color: rgba(47, 33, 0, 0.6);
  margin-top: 4px;
`;

const EmptyMessage = styled.div`
  padding: 1rem;
  text-align: center;
  font-size: 14px;
  color: rgba(47, 33, 0, 0.62);
`;
