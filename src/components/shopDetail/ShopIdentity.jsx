import React from "react";
import styled from "styled-components";
import { MapPin } from "lucide-react";
import { SHOP_COLORS } from "../../styles/ShopUi";
import { shopStatus } from "../../utils/shopDetail";

const Identity = styled.div.attrs({ "data-shop-identity": true })`
  min-width: 0;
`;
const TopLine = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  margin-bottom: 10px;
`;
const Badges = styled.div`
  display: flex; align-items: center; flex-wrap: wrap; gap: 6px; min-width: 0;
`;
const Badge = styled.span`
  padding: 5px 8px; border-radius: 6px; font-size: .74rem; line-height: 1.35;
  color: ${({ $tone }) => $tone === "open" ? "#326129" : $tone === "seasonal" ? "#78510c" : "#625b50"};
  background: ${({ $tone }) => $tone === "open" ? "#e9f3e7" : $tone === "seasonal" ? "#fff1d1" : "#f0efeb"};
`;
const Utilities = styled.div.attrs({ "data-shop-utilities": true })`
  display: flex; align-items: center; gap: 6px; flex-shrink: 0;
  > button {
    position: static; inset: auto; display: inline-flex; align-items: center; justify-content: center;
    flex-shrink: 0; box-sizing: border-box; width: 44px; height: 44px; min-width: 44px;
    margin: 0; padding: 0; border: 1px solid ${SHOP_COLORS.border}; border-radius: 10px;
    background: #fff; color: ${SHOP_COLORS.muted}; box-shadow: none; cursor: pointer;
    transition: background .15s, color .15s;
    &:hover { background: #fff3da; color: #78560e; transform: none; }
    &:focus-visible { outline: 3px solid #986b0e; outline-offset: 3px; }
    &[aria-pressed="true"] { background: #fff3da; border-color: #e6c77d; }
    &:disabled { opacity: .6; cursor: wait; }
  }
  svg { width: 20px; height: 20px; }
  > button[data-shop-close] { margin-left: 4px; border-color: transparent; background: transparent; }
  > button[data-shop-close]:hover { background: #f4f0e7; }
`;
const Name = styled.h1`
  && {
    margin: 0 0 6px; color: ${SHOP_COLORS.text}; font-weight: 700;
    font-size: ${({ $compact }) => $compact ? "clamp(1.1rem, 2vw, 1.35rem)" : "clamp(1.45rem, 3.5vw, 2.1rem)"};
    line-height: 1.25; letter-spacing: -.02em; overflow-wrap: anywhere;
  }
`;
const Address = styled.p`
  && {
    display: flex; align-items: flex-start; gap: 6px; margin: 0;
    color: ${SHOP_COLORS.muted}; font-size: .85rem; line-height: 1.45; overflow-wrap: anywhere;
  }
  svg { flex-shrink: 0; margin-top: 2px; }
`;

export default function ShopIdentity({ shop, compact = false, headingId, category, utilities }) {
  const status = shopStatus(shop);
  return (
    <Identity>
      <TopLine>
        <Badges>
          <Badge $tone={status.tone}>{status.label}</Badge>
          {category && <Badge>{category}</Badge>}
        </Badges>
        <Utilities>{utilities}</Utilities>
      </TopLine>
      <Name as={compact ? "h2" : "h1"} id={headingId} $compact={compact}>{shop.name}</Name>
      <Address><MapPin size={15} aria-hidden="true" /><span>{shop.adresse || "Adresse noch nicht hinterlegt"}</span></Address>
    </Identity>
  );
}
