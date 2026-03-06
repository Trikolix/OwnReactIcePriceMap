import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { buildAssetUrl, getInitials } from "../utils/assets";

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

const AvatarWrapper = styled(Link)`
  width: ${(props) => props.$size || 40}px;
  height: ${(props) => props.$size || 40}px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: ${(props) => getColorForName(props.$name).bg};
  color: ${(props) => getColorForName(props.$name).text};
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-size: ${(props) => (props.$size || 40) * 0.45}px;
  border: 2px solid ${(props) => getColorForName(props.$name).border};
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
    <AvatarWrapper to={`/user/${userId}`} $size={size} $name={name} aria-label={name}>
      {src ? <img src={src} alt={name || "Avatar"} /> : initials}
    </AvatarWrapper>
  );
};

export default UserAvatar;