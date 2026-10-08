import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Heart } from "lucide-react";
import { useUser } from "../context/UserContext";
import LikeUsersModal from "./LikeUsersModal";
import { ActivitySocialButton, SHOP_COLORS } from "../styles/ShopUi";

const LikeActions = styled.div`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 0;
  margin-top: ${({ $compact }) => ($compact ? "0" : "0.65rem")};
  min-height: 44px;
`;

const HeartButton = styled(ActivitySocialButton)`
  justify-content: flex-end;
  padding-right: 3px;
  color: ${({ $hasLiked }) => ($hasLiked ? "#c43f4c" : SHOP_COLORS.muted)};
  cursor: ${({ $canLike }) => ($canLike ? "pointer" : "default")};
  &:hover:not(:disabled) {
    color: ${({ $hasLiked }) => ($hasLiked ? "#b43644" : SHOP_COLORS.text)};
  }
  svg {
    fill: ${({ $hasLiked }) => ($hasLiked ? "currentColor" : "none")};
    transition: fill 0.2s;
  }
`;

const CountButton = styled(ActivitySocialButton)`
  justify-content: flex-start;
  padding-left: 3px;
  font-variant-numeric: tabular-nums;
`;

const LikeButton = ({ entityType, entityId, initialLikesCount = null, initialHasLiked = null, compact = false }) => {
  const { isLoggedIn } = useUser();
  const hasInitialLikeState = initialLikesCount !== null && initialHasLiked !== null;
  const [likesCount, setLikesCount] = useState(() => Number(initialLikesCount ?? 0));
  const [hasLiked, setHasLiked] = useState(() => Boolean(initialHasLiked));
  const [isLoading, setIsLoading] = useState(!hasInitialLikeState);
  const [showLikersModal, setShowLikersModal] = useState(false);
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (!entityId || !entityType) return;
    if (hasInitialLikeState) {
      setLikesCount(Number(initialLikesCount || 0));
      setHasLiked(Boolean(initialHasLiked));
      setIsLoading(false);
      return;
    }

    const fetchLikeState = async () => {
      setIsLoading(true);
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
  }, [apiUrl, entityId, entityType, hasInitialLikeState, initialHasLiked, initialLikesCount]);

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
      <LikeActions $compact={compact}>
        <HeartButton
          onClick={handleLike}
          $hasLiked={hasLiked}
          $canLike={canLike}
          aria-label={hasLiked ? "Gefällt dir" : "Gefällt mir"}
          title={!isLoggedIn ? "Zum Liken einloggen" : hasLiked ? "Gefällt dir" : "Gefällt mir"}
        >
          <Heart size={18} aria-hidden="true" />
        </HeartButton>
        <CountButton onClick={handleCountClick} disabled={likesCount === 0} aria-label={`${likesCount} Likes anzeigen`}>
          {likesCount}
        </CountButton>
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
