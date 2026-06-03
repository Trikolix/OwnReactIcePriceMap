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

const avatarFrames = {
  mint: '#2bb673',
  berry: '#d9467a',
  sky: '#2f80ed',
  sunset: 'linear-gradient(135deg, #ffb522, #ff595e)',
  royal: 'linear-gradient(135deg, #6f2dbd, #2f80ed)',
  aurora: 'linear-gradient(135deg, #2bb673, #9bf6ff, #ffc6ff)',
  gold: 'linear-gradient(135deg, #f6d365, #fda085, #ffd700)',
};

const AvatarWrapper = styled(Link)`
  width: ${(props) => props.$size || 40}px;
  height: ${(props) => props.$size || 40}px;
  border-radius: 50%;
  overflow: visible;
  flex-shrink: 0;
  background: ${(props) => props.$frameCss || getColorForName(props.$name).bg};
  color: ${(props) => getColorForName(props.$name).text};
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-size: ${(props) => (props.$size || 40) * 0.45}px;
  border: ${(props) => (props.$frameCss ? 0 : 2)}px solid ${(props) => getColorForName(props.$name).border};
  box-shadow: ${(props) => props.$frameCss ? '0 3px 12px rgba(0,0,0,0.16)' : '0 2px 8px rgba(0,0,0,0.08)'};
  padding: ${(props) => props.$frameCss ? Math.max(3, Math.round((props.$size || 40) * 0.08)) : 0}px;
  position: relative;
  box-sizing: border-box;
`;

const AvatarInner = styled.span`
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  border-radius: 50%;
  overflow: hidden;
  background: ${(props) => getColorForName(props.$name).bg};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${(props) => props.$frameCss ? 'inset 0 0 0 2px rgba(255,255,255,0.9)' : 'none'};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const LevelBadge = styled.span`
  position: absolute;
  right: ${(props) => Math.round((props.$size || 40) * -0.04)}px;
  bottom: ${(props) => Math.round((props.$size || 40) * -0.05)}px;
  min-width: ${(props) => Math.max(18, Math.round((props.$size || 40) * 0.38))}px;
  height: ${(props) => Math.max(18, Math.round((props.$size || 40) * 0.38))}px;
  padding: 0 ${(props) => Math.max(4, Math.round((props.$size || 40) * 0.08))}px;
  border-radius: 999px;
  border: 2px solid #fff;
  background: #2f2100;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: ${(props) => Math.max(10, Math.round((props.$size || 40) * 0.22))}px;
  font-weight: 800;
  line-height: 1;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  box-sizing: border-box;
`;

const UserAvatar = ({ userId, name, avatarUrl, size = 44, level = null, showLevelBadge = false, frameKey = null, onClick = null }) => {
  const src = buildAssetUrl(avatarUrl);
  const initials = getInitials(name);
  const frameCss = avatarFrames[frameKey] || null;
  const safeLevel = Number(level);
  const shouldShowLevelBadge = showLevelBadge && Number.isFinite(safeLevel) && safeLevel > 0;

  return (
    <AvatarWrapper
      to={`/user/${userId}`}
      $size={size}
      $name={name}
      $frameCss={frameCss}
      aria-label={name}
      onClick={(event) => {
        if (!onClick) return;
        event.preventDefault();
        onClick(event);
      }}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <AvatarInner $name={name} $frameCss={frameCss}>
        {src ? <img src={src} alt={name || "Avatar"} /> : initials}
      </AvatarInner>
      {shouldShowLevelBadge && <LevelBadge $size={size}>{safeLevel}</LevelBadge>}
    </AvatarWrapper>
  );
};

export default UserAvatar;
