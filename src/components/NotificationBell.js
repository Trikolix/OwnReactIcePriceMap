import React, { useEffect, useRef, useState } from "react";
import { useUser } from "../context/UserContext";
import styled from "styled-components";

const NotificationBell = () => {
    const { userId } = useUser();
    const [notifications, setNotifications] = useState([]);
    const [show, setShow] = useState(false);
    const dropdownRef = useRef(null);

    const loadNotifications = async () => {
        const res = await fetch(
            `${process.env.REACT_APP_API_BASE_URL}/benachrichtigungen.php?action=list&nutzer_id=${userId}`
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
                `${process.env.REACT_APP_API_BASE_URL}/benachrichtigungen.php?action=markAsRead`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, nutzer_id: userId }) }
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

    const handleNotificationClick = (notification)  => {
        if (!notification.ist_gelesen) {
            markAsRead(notification.id);
        }
        if (notification.typ === 'kommentar') {
            const data = JSON.parse(notification.zusatzdaten || '{}');
            if (data.checkin_id && data.eisdiele_id) {
                const url = `/#/map/activeShop/${data.eisdiele_id}?tab=checkins&focusCheckin=${data.checkin_id}`;
                window.location.href = url;
            }
        } else if (notification.typ === 'new_user') {
            const url = `/#/user/${notification.referenz_id}`;
            window.location.href = url;
        }
    };

    const unreadCount = notifications.filter((n) => !n.ist_gelesen).length;

    return (
        <BellWrapper>
            <BellButton onClick={() => setShow(!show)}>
                🔔
                {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
            </BellButton>
            {show && (
                <Dropdown ref={dropdownRef}>
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
    );
};

export default NotificationBell;

// Styled Components

const BellWrapper = styled.div`
  position: relative;
  margin-left: 15px;
`;

const BellButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  position: relative;
`;

const Badge = styled.span`
  position: absolute;
  top: -6px;
  right: -10px;
  background: red;
  color: white;
  font-size: 12px;
  font-weight: bold;
  border-radius: 50%;
  padding: 2px 6px;
`;

const Dropdown = styled.div`
  position: absolute;
  top: 36px;
  right: 0;
  width: 300px;
  max-height: 400px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
  z-index: 1100;
`;

const NotificationList = styled.ul`
  list-style: none;
  padding: 0.5rem;
  margin: 0;
`;

const NotificationItem = styled.li`
  padding: 10px;
  border-bottom: 1px solid #eee;
  background: ${({ gelesen }) => (gelesen ? "#f8f8f8" : "#fff8e1")};
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: ${({ gelesen }) => (gelesen ? "#efefef" : "#fff2b3")};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const Message = styled.div`
  font-size: 14px;
  color: #333;
`;

const Time = styled.div`
  font-size: 12px;
  color: #888;
  margin-top: 4px;
`;

const EmptyMessage = styled.div`
  padding: 1rem;
  text-align: center;
  font-size: 14px;
  color: #888;
`;
