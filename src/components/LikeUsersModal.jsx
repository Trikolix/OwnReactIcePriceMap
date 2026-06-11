import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const ModalContainer = styled.div`
  background: var(--bg-color);
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);

  h3 {
    margin: 0;
    font-size: 1.1rem;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-color);
    padding: 0;
    display: flex;
  }
`;

const UserList = styled.div`
  overflow-y: auto;
  padding: 0.5rem 0;
`;

const UserItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: var(--text-color);
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--card-bg-color);
  }
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  background-color: var(--border-color);
`;

const UserName = styled.span`
  font-weight: 500;
`;

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  color: var(--text-color-light);
`;

const LikeUsersModal = ({ isOpen, onClose, entityType, entityId }) => {
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

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
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
              <UserItem key={user.id} to={`/user/@${user.username}`} onClick={onClose}>
                <Avatar
                  src={user.profilbild ? `${import.meta.env.VITE_API_BASE_URL}/${user.profilbild}` : '/default-avatar.png'}
                  alt={user.username}
                  onError={(e) => { e.target.src = '/default-avatar.png'; }}
                />
                <UserName>{user.username}</UserName>
              </UserItem>
            ))
          ) : (
            <EmptyState>Keine Likes vorhanden.</EmptyState>
          )}
        </UserList>
      </ModalContainer>
    </Overlay>
  );
};

export default LikeUsersModal;
