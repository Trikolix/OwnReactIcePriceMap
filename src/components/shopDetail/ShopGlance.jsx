import React from "react";
import styled from "styled-components";
import { Star } from "lucide-react";
import { primaryIceType, ICE_LABELS } from "../../utils/shopOfferings.mjs";
import { hasShopNumber, shopNumber, shopPrice } from "../../utils/shopDetail";

const Glance = styled.div`
  display: flex; flex-wrap: wrap; gap: 18px 26px; margin: 20px 0 0; color: #342d21;
  > div { display: flex; flex-direction: column; gap: 5px; }
  strong { display: flex; align-items: center; gap: 5px; font-size: 1.2rem; }
  span { font-size: .8rem; color: #756b5c; }
  svg { color: #b77a08; fill: #fff3da; }
`;
export default function ShopGlance({ data }) {
  const type = primaryIceType(data), score = data.scores?.[type];
  return <Glance className="shopdetail-glance" aria-label="Shop im Überblick">
    {type && type !== "eisbecher" && <div><strong>{shopPrice(data.preise?.[type])}</strong><span>{type === "kugel" ? "Kugelpreis" : "Softeispreis"}</span></div>}
    <div><strong>{type && hasShopNumber(score) ? <><Star size={18} aria-hidden="true" />{shopNumber(score)}</> : "Noch nicht bewertet"}</strong><span>{type ? `${ICE_LABELS[type]} · von 5` : "Keine Eisart bestätigt"}</span></div>
    <div><strong>{Number(data.statistiken?.gesamt_checkins ?? data.checkins?.length ?? 0).toLocaleString("de-DE")}</strong><span>Check-ins</span></div>
  </Glance>;
}
