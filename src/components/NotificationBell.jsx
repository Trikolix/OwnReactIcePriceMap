import React, { useEffect, useRef, useState } from "react";
import { Bell, X, CheckCheck, Trash2 } from "lucide-react";
import { useUser } from "../context/UserContext";
import styled from "styled-components";
import SystemModal from "./SystemModal";
import MentionInviteModal from "./MentionInviteModal";
import { buildNotificationDeeplink, parseNotificationExtra } from "../utils/notificationRouting";

const NotificationBell = () => {
    const { userId } = useUser();
    const [notifications, setNotifications] = useState([]);
    const [show, setShow] = useState(false);
    const dropdownRef = useRef(null);
    const touchTimerRef = useRef(null);
    const suppressNextClickRef = useRef(false);
    const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const [deleteErrorId, setDeleteErrorId] = useState(null);
    const [systemModal, setSystemModal] = useState({ isOpen: false, title: "", message: "", linkUrl: "", linkLabel: "" });
    const [mentionModal, setMentionModal] = useState({ isOpen: false, data: null });

    const openSystemModal = ({ title, message, linkUrl = "", linkLabel = "" }) => {
        setSystemModal({ isOpen: true, title, message, linkUrl, linkLabel });
    };

    const resetDeleteState = () => {
        setConfirmingDeleteId(null);
        setPendingDeleteId(null);
        setDeleteErrorId(null);
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
                resetDeleteState();
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

    useEffect(() => {
        return () => {
            if (touchTimerRef.current) {
                clearTimeout(touchTimerRef.current);
            }
        };
    }, []);

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

    const markAllAsRead = async () => {
        try {
            await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/benachrichtigungen.php?action=markAllAsRead`,
                { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nutzer_id: userId }) }
            );
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, ist_gelesen: true }))
            );
        } catch (err) {
            console.error("Fehler beim Markieren aller als gelesen", err);
        }
    };

    const armDeleteNotification = (event, id) => {
        event?.preventDefault();
        event?.stopPropagation();
        setConfirmingDeleteId(id);
        setDeleteErrorId(null);
    };

    const cancelDeleteNotification = (event) => {
        event?.preventDefault();
        event?.stopPropagation();
        setConfirmingDeleteId(null);
        setDeleteErrorId(null);
    };

    const handleTouchStart = (notification) => {
        if (touchTimerRef.current) {
            clearTimeout(touchTimerRef.current);
        }

        touchTimerRef.current = setTimeout(() => {
            suppressNextClickRef.current = true;
            setConfirmingDeleteId(notification.id);
            setDeleteErrorId(null);
            touchTimerRef.current = null;
        }, 600);
    };

    const cancelLongPress = () => {
        if (touchTimerRef.current) {
            clearTimeout(touchTimerRef.current);
            touchTimerRef.current = null;
        }
    };

    const handleDeleteNotification = async (event, notification) => {
        event?.preventDefault();
        event?.stopPropagation();

        if (pendingDeleteId === notification.id) {
            return;
        }

        const previousNotifications = notifications;
        setPendingDeleteId(notification.id);
        setDeleteErrorId(null);
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));

        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/benachrichtigungen.php?action=hide`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: notification.id, nutzer_id: userId })
                }
            );
            const data = await res.json();
            if (data.status !== "success") {
                throw new Error(data.message || "Benachrichtigung konnte nicht gelöscht werden");
            }
            setConfirmingDeleteId(null);
            setPendingDeleteId(null);
        } catch (err) {
            console.error("Fehler beim Löschen der Benachrichtigung", err);
            setNotifications(previousNotifications);
            setPendingDeleteId(null);
            setConfirmingDeleteId(notification.id);
            setDeleteErrorId(notification.id);
        }
    };

    const handleNotificationClick = async (notification) => {
        if (suppressNextClickRef.current) {
            suppressNextClickRef.current = false;
            return;
        }

        if (confirmingDeleteId === notification.id || pendingDeleteId === notification.id) {
            return;
        }

        setShow(false);
        resetDeleteState();
        if (!notification.ist_gelesen) {
            markAsRead(notification.id);
        }
        if (notification.typ === 'systemmeldung') {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/systemmeldung.php?action=get&id=${notification.referenz_id}`);
                const data = await res.json();

                if (data.status === 'success') {
                    openSystemModal({
                        title: data.systemmeldung.titel,
                        message: data.systemmeldung.nachricht,
                        linkUrl: data.systemmeldung.link_url,
                        linkLabel: data.systemmeldung.link_label
                    });
                } else {
                    // Fallback auf zusatzdaten
                    const fallback = parseNotificationExtra(notification.zusatzdaten);
                    openSystemModal({
                        title: notification.text || "Systemmeldung",
                        message: fallback.message || "Keine Nachricht verfügbar",
                        linkUrl: fallback.link_url,
                        linkLabel: fallback.link_label
                    });
                }
                } catch (err) {
                // Fallback bei Netzwerkfehler
                const fallback = parseNotificationExtra(notification.zusatzdaten);
                openSystemModal({
                    title: notification.text || "Systemmeldung",
                    message: fallback.message || "Keine Nachricht verfügbar",
                    linkUrl: fallback.link_url,
                    linkLabel: fallback.link_label
                });
                }
        } else if (notification.typ === 'checkin_mention') {
            // Modal öffnen mit Infos und Optionen
            const data = parseNotificationExtra(notification.zusatzdaten);
            if (!data.shop_id && !data.eisdiele_id) {
                const target = buildNotificationDeeplink(notification, userId);
                if (target) window.location.href = target;
                return;
            }
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
        } else {
            const target = buildNotificationDeeplink(notification, userId);
            if (target) {
                window.location.href = target;
            }
        }
    };

    const unreadCount = notifications.filter((n) => !n.ist_gelesen).length;

    return (<>
        <BellWrapper>
            <BellButton onClick={() => {
                setShow(!show);
                resetDeleteState();
            }}>
                <Bell size={28} color="currentColor" style={{ verticalAlign: 'middle' }} />
                {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
            </BellButton>
            {show && (
                <Dropdown ref={dropdownRef}>
                    <DropdownHeader>
                        <DropdownTitle>Benachrichtigungen</DropdownTitle>
                        <HeaderActions>
                            {unreadCount > 0 && (
                                <DropdownActionButton
                                    type="button"
                                    onClick={markAllAsRead}
                                    title="Alle als gelesen markieren"
                                    aria-label="Alle als gelesen markieren"
                                >
                                    <CheckCheck size={18} />
                                </DropdownActionButton>
                            )}
                            <DropdownCloseButton
                                type="button"
                                onClick={() => {
                                    setShow(false);
                                    resetDeleteState();
                                }}
                                aria-label="Benachrichtigungen schließen"
                            >
                                <X size={18} />
                            </DropdownCloseButton>
                        </HeaderActions>
                    </DropdownHeader>
                    {notifications.length === 0 ? (
                        <EmptyMessage>Keine Benachrichtigungen</EmptyMessage>
                    ) : (
                        <NotificationList>
                            {notifications.map((n) => (
                                <NotificationItem
                                    key={n.id}
                                    $gelesen={n.ist_gelesen}
                                    $confirming={confirmingDeleteId === n.id}
                                    $pending={pendingDeleteId === n.id}
                                    $error={deleteErrorId === n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    onTouchStart={() => handleTouchStart(n)}
                                    onTouchEnd={cancelLongPress}
                                    onTouchMove={cancelLongPress}
                                    onTouchCancel={cancelLongPress}
                                    onContextMenu={(event) => confirmingDeleteId === n.id && event.preventDefault()}
                                >
                                    <NotificationContent>
                                        <Message>{n.text}</Message>
                                        <Time>
                                            {new Date(n.erstellt_am).toLocaleString("de-DE", {
                                                dateStyle: "short",
                                                timeStyle: "short",
                                            })}
                                        </Time>
                                        {deleteErrorId === n.id && (
                                            <DeleteError>Benachrichtigung konnte nicht gelöscht werden.</DeleteError>
                                        )}
                                        {confirmingDeleteId === n.id && (
                                            <ConfirmationRow>
                                                <ConfirmDeleteButton
                                                    type="button"
                                                    onClick={(event) => handleDeleteNotification(event, n)}
                                                    disabled={pendingDeleteId === n.id}
                                                >
                                                    Löschen
                                                </ConfirmDeleteButton>
                                                <CancelDeleteButton
                                                    type="button"
                                                    onClick={cancelDeleteNotification}
                                                    disabled={pendingDeleteId === n.id}
                                                >
                                                    Abbrechen
                                                </CancelDeleteButton>
                                            </ConfirmationRow>
                                        )}
                                    </NotificationContent>
                                    <ItemActions>
                                        <DeleteIconButton
                                            type="button"
                                            onClick={(event) => armDeleteNotification(event, n.id)}
                                            disabled={pendingDeleteId === n.id}
                                            title="Benachrichtigung löschen"
                                            aria-label="Benachrichtigung löschen"
                                        >
                                            <Trash2 size={16} />
                                        </DeleteIconButton>
                                    </ItemActions>
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
            linkUrl={systemModal.linkUrl}
            linkLabel={systemModal.linkLabel}
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

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const DropdownActionButton = styled.button`
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
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px;
  border-bottom: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 10px;
  background: ${({ $gelesen, $confirming, $error }) => {
    if ($error) return "rgba(217, 45, 32, 0.17)";
    if ($confirming) return "rgba(217, 45, 32, 0.12)";
    return $gelesen ? "rgba(47, 33, 0, 0.03)" : "rgba(255, 181, 34, 0.12)";
  }};
  cursor: ${({ $confirming, $pending }) => ($confirming || $pending ? "default" : "pointer")};
  opacity: ${({ $pending }) => ($pending ? 0.62 : 1)};
  transition: background 0.2s, opacity 0.2s;
  margin-bottom: 2px;

  &:hover {
    background: ${({ $gelesen, $confirming, $error }) => {
      if ($error) return "rgba(217, 45, 32, 0.22)";
      if ($confirming) return "rgba(217, 45, 32, 0.16)";
      return $gelesen ? "rgba(47, 33, 0, 0.07)" : "rgba(255, 181, 34, 0.22)";
    }};
  }

  &:hover button,
  &:focus-within button {
    opacity: 1;
    pointer-events: auto;
  }

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  @media (max-width: 480px) {
    padding: 12px 10px;
  }
`;

const NotificationContent = styled.div`
  min-width: 0;
  flex: 1;
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

const ItemActions = styled.div`
  display: flex;
  align-items: flex-start;
  flex: 0 0 auto;
`;

const DeleteIconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 8px;
  background: rgba(47, 33, 0, 0.04);
  color: rgba(47, 33, 0, 0.58);
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition: background 0.18s, color 0.18s, opacity 0.18s;

  &:hover,
  &:focus-visible {
    background: rgba(217, 45, 32, 0.1);
    color: #b42318;
    opacity: 1;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  @media (max-width: 480px) {
    opacity: 0;
  }
`;

const ConfirmationRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 9px;
`;

const ConfirmDeleteButton = styled.button`
  border: none;
  border-radius: 8px;
  padding: 6px 10px;
  background: #d92d20;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

const CancelDeleteButton = styled.button`
  border: 1px solid rgba(47, 33, 0, 0.16);
  border-radius: 8px;
  padding: 6px 10px;
  background: #fffaf0;
  color: #2f2100;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

const DeleteError = styled.div`
  margin-top: 7px;
  color: #b42318;
  font-size: 12px;
  font-weight: 700;
`;

const EmptyMessage = styled.div`
  padding: 1rem;
  text-align: center;
  font-size: 14px;
  color: rgba(47, 33, 0, 0.62);
`;
