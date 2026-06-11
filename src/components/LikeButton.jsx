import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Heart } from "lucide-react";
import { useUser } from "../context/UserContext";
import LikeUsersModal from "./LikeUsersModal";

const ButtonWrapper = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  color: ${({ $hasLiked }) => ($hasLiked ? "var(--accent-color)" : "var(--text-color)")};
  font-size: 0.875rem;
  transition: all 0.2s;

  &:hover {
    color: var(--accent-color);
  }

  &:disabled {
    cursor: default;
    opacity: 0.7;
  }

  svg {
    fill: ${({ $hasLiked }) => ($hasLiked ? "var(--accent-color)" : "none")};
    transition: fill 0.2s;
  }
`;

const LikeButton = ({ entityType, entityId }) => {
  const { userId, isLoggedIn } = useUser();
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLikersModal, setShowLikersModal] = useState(false);
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (!entityId || !entityType) return;

    const fetchLikeState = async () => {
      try {
        const response = await fetch(`${apiUrl}/likes.php?entity_type=${entityType}&entity_id=${entityId}`);
        const data = await response.json();
        setLikesCount(data.likes_count || 0);
        setHasLiked(data.has_liked || false);
      } catch (err) {
        console.error("Failed to fetch like status", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLikeState();
  }, [apiUrl, entityId, entityType]);

  const handleCountClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (likesCount > 0) {
      setShowLikersModal(true);
    }
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isLoggedIn || hasLiked) return; // Prevent unlike for now

    // Optimistic update
    setHasLiked(true);
    setLikesCount(prev => prev + 1);

    try {
      const response = await fetch(`${apiUrl}/likes.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          action: "like"
        }),
      });

      const data = await response.json();
      if (data.error || !data.success) {
        // Revert on error
        setHasLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        setLikesCount(data.likes_count);
      }
    } catch (err) {
      console.error("Failed to post like", err);
      // Revert on error
      setHasLiked(false);
      setLikesCount(prev => Math.max(0, prev - 1));
    }
  };

  if (!entityId || !entityType || isLoading) return null;

  return (
    <>
    <ButtonWrapper onClick={handleLike} $hasLiked={hasLiked} disabled={!isLoggedIn || hasLiked} aria-label="Like">
      <Heart size={18} />
      {likesCount > 0 && <span onClick={handleCountClick} style={{ cursor: "pointer", textDecoration: "underline" }}>{likesCount}</span>}
    </ButtonWrapper>
      <LikeUsersModal
        isOpen={showLikersModal}
        onClose={(e) => {
          if (e) {
            e.stopPropagation();
            e.preventDefault();
          }
          setShowLikersModal(false);
        }}
        entityType={entityType}
        entityId={entityId}
      />
    </>
  );
};

export default LikeButton;
