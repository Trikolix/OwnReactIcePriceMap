import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { buildAssetUrl, getInitials } from '../utils/assets';

const defaultColors = [
  { bg: '#ffe7c4', text: '#a36500', border: '#fff2d7' },
  { bg: '#ffadad', text: '#a80000', border: '#ffdde5' },
  { bg: '#ffd6a5', text: '#a84e00', border: '#ffebd9' },
  { bg: '#fdffb6', text: '#7d8000', border: '#feffde' },
  { bg: '#caffbf', text: '#2d7d1f', border: '#e7ffed' },
  { bg: '#9bf6ff', text: '#006c7d', border: '#d9faff' },
  { bg: '#a0c4ff', text: '#003da8', border: '#d9e7ff' },
  { bg: '#bdb2ff', text: '#4f42a8', border: '#e2deff' },
  { bg: '#ffc6ff', text: '#a800a8', border: '#ffebff' },
];

const getColorForName = (name) => {
  if (!name) return defaultColors[0];
  const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return defaultColors[charCodeSum % defaultColors.length];
};

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.54);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5000;
  padding: 1rem;
`;

const ModalContainer = styled.div`
  background: #ffffff;
  color: #2f2100;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(47, 33, 0, 0.12);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.26);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid rgba(47, 33, 0, 0.12);
  background: #ffffff;

  h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #2f2100;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    color: #2f2100;
    padding: 0;
    display: flex;
    border-radius: 8px;

    &:hover {
      color: #8a5600;
    }
  }
`;

const UserList = styled.div`
  overflow-y: auto;
  padding: 0.5rem 0;
  background: #ffffff;
`;

const AvatarWrap = styled.div`
  display: inline-flex;
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  background: ${(props) => getColorForName(props.$name).bg};
  color: ${(props) => getColorForName(props.$name).text};
  border: 2px solid ${(props) => getColorForName(props.$name).border};
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  font-size: 18px;
  font-weight: 700;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UserName = styled.span`
  font-weight: 700;
  overflow-wrap: anywhere;
  transition: color 0.18s ease, text-decoration-color 0.18s ease;
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: 3px;
`;

const UserItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: #2f2100;
  transition: background-color 0.2s;

  &:hover,
  &:focus-visible {
    background: rgba(255, 181, 34, 0.12);
  }

  &:hover ${AvatarWrap},
  &:focus-visible ${AvatarWrap} {
    transform: translateY(-1px) scale(1.04);
    box-shadow: 0 5px 14px rgba(47, 33, 0, 0.18);
    border-color: rgba(255, 181, 34, 0.82);
  }

  &:hover ${UserName},
  &:focus-visible ${UserName} {
    color: #8a5600;
    text-decoration-color: currentColor;
  }
`;

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  color: rgba(47, 33, 0, 0.62);
  background: #ffffff;
`;

const LikeUsersModal = ({ isOpen, onClose, entityType, entityId }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL;
        const res = await fetch(`${apiUrl}/api/get_likes.php?entity_type=${entityType}&entity_id=${entityId}`);
        const data = await res.json();
        if (data.likers) {
          setUsers(data.likers);
        }
      } catch (err) {
        console.error("Failed to fetch likers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, entityType, entityId]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleUserClick = (e, userId) => {
    e.preventDefault();
    onClose();
    navigate(`/user/${userId}`);
  };

  return createPortal(
    <Overlay onClick={handleOverlayClick}>
      <ModalContainer>
        <Header>
          <h3>Gefällt {users.length} Personen</h3>
          <button onClick={onClose} aria-label="Schließen">
            <X size={24} />
          </button>
        </Header>

        <UserList>
          {loading ? (
            <EmptyState>Laden...</EmptyState>
          ) : users.length > 0 ? (
            users.map((user) => (
              <UserItem key={user.id} to={`/user/${user.id}`} onClick={(e) => handleUserClick(e, user.id)}>
                <AvatarWrap $name={user.username} aria-hidden="true">
                  {buildAssetUrl(user.avatar_path) ? (
                    <img src={buildAssetUrl(user.avatar_path)} alt="" />
                  ) : (
                    getInitials(user.username)
                  )}
                </AvatarWrap>
                <UserName>{user.username}</UserName>
              </UserItem>
            ))
          ) : (
            <EmptyState>Keine Likes vorhanden.</EmptyState>
          )}
        </UserList>
      </ModalContainer>
    </Overlay>,
    document.body
  );
};

export default LikeUsersModal;
