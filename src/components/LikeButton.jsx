import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Heart } from "lucide-react";
import { useUser } from "../context/UserContext";
import LikeUsersModal from "./LikeUsersModal";

const LikeActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  margin-top: 0.65rem;
`;

const HeartButton = styled.button.attrs({ type: "button" })`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: ${({ $hasLiked }) => ($hasLiked ? "#c43f4c" : "#8a5600")};
  cursor: ${({ $canLike }) => ($canLike ? "pointer" : "default")};
  font-weight: 700;
  padding: 0.3rem 0.1rem 0.3rem 0;
  border-radius: 8px;
  transition: color 0.15s ease, transform 0.15s ease;

  &:hover {
    color: ${({ $canLike, $hasLiked }) => ($canLike || $hasLiked ? "#c43f4c" : "#8a5600")};
    transform: ${({ $canLike }) => ($canLike ? "translateY(-1px)" : "none")};
  }

  svg {
    fill: ${({ $hasLiked }) => ($hasLiked ? "currentColor" : "none")};
    transition: fill 0.2s;
  }
`;

const CountButton = styled.button.attrs({ type: "button" })`
  background: transparent;
  border: none;
  color: #8a5600;
  cursor: pointer;
  font-weight: 700;
  padding: 0.3rem 0;
  text-align: left;
  border-radius: 8px;

  &:hover {
    text-decoration: underline;
  }
`;

const LikeButton = ({ entityType, entityId }) => {
  const { isLoggedIn } = useUser();
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
        if (response.ok) {
          setLikesCount(data.likes_count || 0);
          setHasLiked(data.has_liked || false);
        }
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
    if (!isLoggedIn || hasLiked) return;

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
        setHasLiked(Boolean(data.has_liked));
        if (Array.isArray(data.new_awards) && data.new_awards.length > 0) {
          window.dispatchEvent(new CustomEvent("new-awards", { detail: data.new_awards }));
        }
      }
    } catch (err) {
      console.error("Failed to post like", err);
      // Revert on error
      setHasLiked(false);
      setLikesCount(prev => Math.max(0, prev - 1));
    }
  };

  if (!entityId || !entityType || isLoading) return null;

  const canLike = Boolean(isLoggedIn && !hasLiked);

  return (
    <>
      <LikeActions>
        <HeartButton
          onClick={handleLike}
          $hasLiked={hasLiked}
          $canLike={canLike}
          aria-label={hasLiked ? "Gefällt dir" : "Gefällt mir"}
          title={!isLoggedIn ? "Zum Liken einloggen" : hasLiked ? "Gefällt dir" : "Gefällt mir"}
        >
          <Heart size={18} />
        </HeartButton>
        {likesCount > 0 && (
          <CountButton onClick={handleCountClick} aria-label={`${likesCount} Likes anzeigen`}>
            {likesCount}
          </CountButton>
        )}
      </LikeActions>
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
