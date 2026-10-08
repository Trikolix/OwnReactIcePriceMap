import styled from "styled-components";
import { Link } from "react-router-dom";

export const SHOP_COLORS = { text: "#342d21", muted: "#756b5c", border: "#e7dfcf", accent: "#ffb522", soft: "#fff3da" };

export const ShopPanel = styled.section`
  padding: 20px; background: #fff; color: ${SHOP_COLORS.text};
  border: 1px solid ${SHOP_COLORS.border}; border-radius: 18px; min-width: 0;
  h2 { display: flex; align-items: center; gap: 9px; margin: 0 0 16px; font-size: 1.08rem; }
  p { line-height: 1.5; }
  .star-rating { font-size: 1.2rem; }
  .star-container { margin-top: 0; height: 1.2em; }
`;
export const ShopButton = styled.button.attrs(props => ({ type: props.type || "button" }))`
  box-sizing: border-box;
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  min-height: 44px; padding: 10px 14px; border: 1px solid #ddd4c2;
  border-radius: 10px; background: ${({ $primary }) => $primary ? SHOP_COLORS.accent : "#fff"};
  color: ${SHOP_COLORS.text}; font: inherit; font-size: .9rem; font-weight: 600; cursor: pointer;
  text-decoration: none; overflow-wrap: anywhere;
  &:hover { background: ${({ $primary }) => $primary ? "#f3a80e" : "#f8f4eb"}; }
  &:focus-visible { outline: 3px solid #986b0e; outline-offset: 3px; }
  &:disabled { opacity: .6; cursor: wait; }
`;
export const ShopMainActions = styled.div.attrs({ 'data-shop-actions': true })`
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
  max-width: 380px; gap: 8px; margin-top: 18px; min-width: 0; flex-shrink: 0;
  > button { min-width: 0; }
  > :only-child { grid-column: 1 / -1; }
`;
export const ShopTertiaryAction = styled(Link)`
  grid-column: 1 / -1; justify-self: start;
  display: inline-flex; align-items: center; gap: 6px; min-height: 44px;
  padding: 0 4px; color: ${SHOP_COLORS.muted}; font-size: .84rem;
  text-decoration: none;
  &:hover { text-decoration: underline; }
  &:focus-visible { outline: 3px solid #986b0e; outline-offset: 3px; }
`;
export const ShopChip = styled.span`
  display: inline-flex; align-items: center; gap: 5px; max-width: 100%;
  padding: 6px 10px; border: 1px solid #ebdbb9; border-radius: 999px;
  background: ${SHOP_COLORS.soft}; color: #78560e; font-size: .82rem;
  line-height: 1.4; text-decoration: none; overflow-wrap: anywhere;
  &[href] { min-height: 44px; box-sizing: border-box; }
  &[href]:hover { background: #ffe5ad; }
  &[href]:focus-visible { outline: 3px solid #986b0e; outline-offset: 3px; }
`;
export const ShopChipLink = styled(ShopChip).attrs({ as: Link })``;
export const ActivityChip = styled(ShopChip)`
  box-sizing: border-box; min-height: 32px; font-size: .82rem;
  /* The pill stays small while linked chips retain a 44px hit area. */
  &[href] {
    position: relative; isolation: isolate; min-height: 44px;
    padding: 12px 10px; border: 0; background: transparent;
  }
  &[href]::before {
    content: ''; position: absolute; inset: 6px 0; z-index: -1;
    border: 1px solid #ebdbb9; border-radius: inherit; background: ${SHOP_COLORS.soft};
  }
  &[href]:hover { background: transparent; }
  &[href]:hover::before { background: #ffe5ad; }
`;
export const ActivityChipLink = styled(ActivityChip).attrs({ as: Link })``;
export const ActivityCard = styled.article.attrs({ 'data-activity-card': true })`
  container-type: inline-size; container-name: activity;
  box-sizing: border-box;
  position: relative; padding: 20px; margin: 0 0 12px; min-width: 0;
  border: 1px solid ${SHOP_COLORS.border}; border-radius: 18px;
  background: #fff; color: ${SHOP_COLORS.text};
  overflow-wrap: anywhere;
  > * { min-width: 0; }
  button { min-height: 44px; min-width: 44px; }
  :is(button, a):focus-visible { outline: 3px solid #986b0e; outline-offset: 3px; }
  table { max-width: 100%; font-size: .86rem; }
  .star-rating { font-size: 1.25rem; }
  .star-container { margin-top: 0; height: 1.2em; }
`;
export const ActivityLayout = styled.div.attrs({ 'data-activity-layout': true })`
  display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; margin: 12px 0;
  /* 678px content + 40px padding + 2px border = 720px card width. */
  @container activity (min-width: 678px) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: start;
    &:has(> :only-child) { grid-template-columns: minmax(0, 1fr); }
  }
`;
export const ActivityText = styled.div.attrs({ 'data-activity-text': true })`
  min-width: 0; order: 1;
  @container activity (min-width: 678px) { order: 0; }
`;
export const ActivityMedia = styled.div.attrs({ 'data-activity-media': true })`
  min-width: 0; width: 100%; order: 0;
  @container activity (min-width: 678px) { order: 1; }
`;
export const ActivityMetaRow = styled.div.attrs({ 'data-activity-meta': true })`
  display: flex; justify-content: flex-end; min-width: 0;
`;
export const ActivityDate = styled.time`
  display: inline-flex; align-items: center; gap: 4px; max-width: 100%;
  color: ${SHOP_COLORS.muted}; font-size: .78rem; line-height: 1.4;
  overflow-wrap: anywhere;
`;
export const ActivityUserHeader = styled.div.attrs({ 'data-activity-identity': true })`
  display: flex; align-items: center; gap: 12px; min-width: 0;
`;
export const ActivityHeader = styled.div.attrs({ 'data-activity-header': true })`
  display: grid; grid-template-columns: minmax(0, 1fr); align-items: center;
  gap: 4px; margin-bottom: 12px; min-width: 0;
  > ${ActivityMetaRow} { grid-row: 1; }
  > :not(${ActivityMetaRow}) { grid-row: 2; min-width: 0; }
  @container activity (min-width: 600px) {
    grid-template-columns: minmax(0, 1fr) auto; column-gap: 16px;
    > ${ActivityMetaRow} { grid-row: 1; grid-column: 2; max-width: 220px; }
    > :not(${ActivityMetaRow}) { grid-row: 1; grid-column: 1; }
  }
`;
export const ActivityHeaderText = styled.div`
  flex: 1; min-width: 0; line-height: 1.5;
`;
export const ActivityLink = styled(Link)`
  color: inherit; text-decoration: none;
  &:hover { color: #78560e; text-decoration: underline; }
`;
export const ActivitySocialActions = styled.div.attrs({ 'data-activity-social': true })`
  display: flex; align-items: center; flex-wrap: wrap; gap: 12px;
  margin-top: 8px; border-top: 1px solid ${SHOP_COLORS.border};
  > div { margin-top: 0; }
`;
export const ActivitySocialButton = styled.button.attrs({ type: 'button' })`
  box-sizing: border-box;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  flex-shrink: 0;
  min-height: 44px; min-width: 44px; padding: 8px; border: 0; border-radius: 8px;
  background: transparent; color: ${SHOP_COLORS.muted}; font: inherit; font-size: .85rem;
  font-weight: 600; line-height: 1.4; text-decoration: none; cursor: pointer;
  transition: color .15s ease, transform .15s ease;
  svg { flex-shrink: 0; }
  &:hover:not(:disabled) {
    color: ${SHOP_COLORS.text};
    transform: scale(1.04);
  }
  &:focus-visible { outline: 3px solid #986b0e; outline-offset: 3px; }
  &:disabled { cursor: default; }
  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover { transform: none; }
  }
`;
export const ActivityCommentButton = ActivitySocialButton;
export const ActivityAvatarRow = styled.div`
  display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;
`;
