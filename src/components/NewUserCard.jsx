import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { MessageCircle, Sparkles, UserPlus } from "lucide-react";
import UserAvatar from "./UserAvatar";
import CommentSection from "./CommentSection";
import { Card, CommentToggle } from "../styles/SharedStyles";

const formatCreatedAt = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unbekannt";
  }
  return date.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const NewUserCard = ({ user, showComments = false }) => {
  const [areCommentsVisible, setAreCommentsVisible] = useState(showComments);

  useEffect(() => {
    if (showComments) {
      setAreCommentsVisible(true);
    }
  }, [showComments]);

  if (!user) return null;

  return (
    <StyledCard>
      <CardMetaRow>
        <DateText dateTime={user.erstellt_am}>{formatCreatedAt(user.erstellt_am)}</DateText>
      </CardMetaRow>

      <HeaderRow>
        <UserAvatar
          userId={user.id}
          name={user.username}
          avatarUrl={user.avatar_url}
          size={52}
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

      <ActionRow>
        <ProfileLink to={`/user/${user.id}`}>Profil ansehen</ProfileLink>
      </ActionRow>

      <CommentToggle
        title={areCommentsVisible ? "Kommentare ausblenden" : "Kommentare einblenden"}
        onClick={() => setAreCommentsVisible((prev) => !prev)}
      >
        <MessageCircle size={18} style={{ marginRight: 2, verticalAlign: "text-bottom" }} /> {user.commentCount || 0} Kommentar(e)
      </CommentToggle>
      {areCommentsVisible && <CommentSection userRegistrationId={user.id} type="user_registration" />}
    </StyledCard>
  );
};

export default NewUserCard;

const StyledCard = styled(Card)`
  background:
    radial-gradient(circle at top right, rgba(255, 181, 34, 0.14), transparent 42%),
    rgba(255, 255, 255, 0.96);
`;

const CardMetaRow = styled.div`
  position: absolute;
  top: 1rem;
  right: 1.25rem;
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0;
  z-index: 1;
  pointer-events: none;

  @media (max-width: 640px) {
    position: static;
    justify-content: flex-end;
    margin-bottom: 0.45rem;
    pointer-events: auto;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
`;

const HeaderContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-bottom: 0.45rem;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ $variant }) => ($variant === "soft" ? "#7a4b00" : "#8c4600")};
  background: ${({ $variant }) => ($variant === "soft" ? "rgba(255, 181, 34, 0.10)" : "rgba(255, 181, 34, 0.18)")};
  border: 1px solid rgba(255, 181, 34, 0.28);
`;

const Headline = styled.p`
  margin: 0;
  font-size: 1rem;
  line-height: 1.35;
  color: #2f2100;
`;

const Subline = styled.p`
  margin: 0.35rem 0 0;
  color: rgba(47, 33, 0, 0.68);
  font-size: 0.9rem;
  line-height: 1.35;
`;

const StrongLink = styled(Link)`
  color: inherit;
  text-decoration: none;
  font-weight: 800;

  &:hover {
    color: #8a5600;
    text-decoration: underline;
  }
`;

const ActionRow = styled.div`
  margin-top: 0.85rem;
  display: flex;
  justify-content: flex-start;
`;

const ProfileLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 0.8rem;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 700;
  color: #6c4300;
  background: rgba(255, 181, 34, 0.12);
  border: 1px solid rgba(255, 181, 34, 0.28);

  &:hover {
    background: rgba(255, 181, 34, 0.2);
  }
`;

const DateText = styled.time`
  position: static;
  font-size: 0.8rem;
  color: rgba(47, 33, 0, 0.5);
  font-style: italic;
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 999px;
  padding: 0.2rem 0.6rem;

  @media (max-width: 640px) {
    margin-bottom: 0;
    font-size: 0.78rem;
    line-height: 1.2;
  }
`;
