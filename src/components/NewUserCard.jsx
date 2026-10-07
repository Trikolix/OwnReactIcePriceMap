import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { MessageCircle, Sparkles, UserPlus } from "lucide-react";
import UserAvatar from "./UserAvatar";
import CommentSection from "./CommentSection";
import LikeButton from "./LikeButton";
import { ActivityCard as Card, ActivityHeader, ActivityMetaRow as CardMetaRow, ActivityDate as DateText, ActivityUserHeader as HeaderRow, ActivityHeaderText as HeaderContent, ActivitySocialActions as SocialActionRow, ActivityCommentButton as CommentToggle, ActivityLink, ShopButton, ActivityChip, SHOP_COLORS } from "../styles/ShopUi";
import { formatActivityDate } from '../utils/activityFeed';

const NewUserCard = ({ user, showComments = false, focusCommentId = null }) => {
  const [areCommentsVisible, setAreCommentsVisible] = useState(showComments);

  useEffect(() => {
    if (showComments) {
      setAreCommentsVisible(true);
    }
  }, [showComments]);

  if (!user) return null;

  return (
    <StyledCard>
      <ActivityHeader>
        <HeaderRow>
          <UserAvatar
            userId={user.id}
            name={user.username}
            avatarUrl={user.avatar_url}
          />
          <HeaderContent>
            <BadgeRow>
              <Badge>
                <UserPlus size={14} />
                Neu registriert
              </Badge>
              {Number(user.current_level) > 0 && (
                <Badge $variant="soft">
                  <Sparkles size={14} />
                  Level {user.current_level}
                </Badge>
              )}
            </BadgeRow>
            <Headline>
              <StrongLink to={`/user/${user.id}`}>{user.username}</StrongLink> ist neu bei ice-app.de
            </Headline>
            <Subline>
              Begrüße den neuen Nutzer oder gib Tipps für gute Eisdielen in deiner Region.
            </Subline>
          </HeaderContent>
        </HeaderRow>
        <CardMetaRow>
          <DateText dateTime={user.erstellt_am}>{formatActivityDate(user.erstellt_am)}</DateText>
        </CardMetaRow>
      </ActivityHeader>

      <ActionRow>
        <ProfileLink $primary to={`/user/${user.id}`}>Profil ansehen</ProfileLink>
      </ActionRow>

      <SocialActionRow>
        <LikeButton
          entityType="user_registration"
          entityId={user.id}
          initialLikesCount={user.likes_count}
          initialHasLiked={user.has_liked}
        />
        <CommentToggle
          aria-expanded={areCommentsVisible}
          title={areCommentsVisible ? "Kommentare ausblenden" : "Kommentare einblenden"}
          onClick={() => setAreCommentsVisible((prev) => !prev)}
        >
          <MessageCircle size={18} style={{ marginRight: 2, verticalAlign: "text-bottom" }} /> {user.commentCount || 0} Kommentar(e)
        </CommentToggle>
      </SocialActionRow>
      {areCommentsVisible && (
        <CommentSection
          userRegistrationId={user.id}
          type="user_registration"
          focusCommentId={focusCommentId}
          focusLatestComment={Boolean(showComments)}
        />
      )}
    </StyledCard>
  );
};

export default NewUserCard;

const StyledCard = Card;
const BadgeRow = styled.div`display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;`;
const Badge = ActivityChip;
const Headline = styled.p`margin: 0; font-size: 1rem; line-height: 1.5;`;
const Subline = styled.p`margin: 6px 0 0; color: ${SHOP_COLORS.muted}; font-size: .9rem; line-height: 1.5;`;
const StrongLink = styled(ActivityLink)`font-weight: 700;`;
const ActionRow = styled.div`display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px;`;
const ProfileLink = styled(ShopButton).attrs({ as: Link })``;
