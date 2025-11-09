import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { buildAssetUrl, getInitials } from "../utils/assets";

const AvatarWrapper = styled(Link)`
  width: ${(props) => props.$size || 40}px;
  height: ${(props) => props.$size || 40}px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #ffe7c4;
  color: #a36500;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-size: ${(props) => (props.$size || 40) * 0.45}px;
  border: 2px solid #fff2d7;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UserAvatar = ({ userId, name, avatarUrl, size = 44 }) => {
  const src = buildAssetUrl(avatarUrl);
  const initials = getInitials(name);

  return (
    <AvatarWrapper to={`/user/${userId}`} $size={size} aria-label={name}>
      {src ? <img src={src} alt={name || "Avatar"} /> : initials}
    </AvatarWrapper>
  );
};

export default UserAvatar;
