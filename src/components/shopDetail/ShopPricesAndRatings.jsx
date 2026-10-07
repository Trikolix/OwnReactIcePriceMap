import React from "react";
import styled from "styled-components";
import { ChevronDown, IceCreamCone } from "lucide-react";
import Rating from "../Rating";
import { ShopPanel, ShopButton } from "../../styles/ShopUi";
import { ICE_TYPES, ICE_LABELS, iceOfferings, offeringDescription } from "../../utils/shopOfferings.mjs";
import { hasShopNumber, shopNumber, shopPrice, shopDate } from "../../utils/shopDetail";

const Panel = styled(ShopPanel)`
  container-type: inline-size; container-name: shop-prices;
  h2 { margin-bottom: 8px; }
`;
const IceRow = styled.div`
  display: grid; grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas: "type price" "rating rating"; gap: 6px 12px;
  padding: 12px 0; min-width: 0; border-bottom: 1px solid #eee5d5;
  &:last-child { border-bottom: 0; }
  .ice-label { grid-area: type; align-self: center; font-size: .94rem; }
  .ice-price { grid-area: price; align-self: center; text-align: right; font-size: .94rem; }
  .ice-rating { grid-area: rating; display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
  .ice-rating strong { font-size: .88rem; white-space: nowrap; }
  .star-rating { font-size: 1.05rem; }
  .empty-value { color: #756b5c; font-size: .82rem; }
  @container shop-prices (min-width: 420px) {
    grid-template-columns: minmax(0, 1fr) auto minmax(90px, auto);
    grid-template-areas: "type rating price"; align-items: center;
  }
`;
const Disclosure = styled.details`
  font-size: .84rem; color: #756b5c;
  summary { display: flex; align-items: center; gap: 6px; min-height: 44px; cursor: pointer; list-style: none; }
  summary::-webkit-details-marker { display: none; }
  summary svg { flex-shrink: 0; transition: transform .15s; }
  &[open] summary svg { transform: rotate(180deg); }
  summary:focus-visible { outline: 3px solid #986b0e; outline-offset: 3px; }
  dl { margin: 0 0 12px; }
  dl > div { margin: 8px 0 12px; }
  dt { color: #342d21; font-weight: 600; }
  dd { margin: 4px 0 0; line-height: 1.5; overflow-wrap: anywhere; }
  small { display: block; margin-top: 3px; }
`;
const Notices = styled.div`
  margin-top: 8px; padding: 8px 10px; border-radius: 8px; background: #fff5df;
  p { margin: 0; color: #78560e; font-size: .82rem; line-height: 1.5; }
  p + p { margin-top: 5px; }
`;
const Meta = styled.div`
  display: flex; align-items: start; justify-content: space-between; flex-wrap: wrap; gap: 0 12px;
  > small { color: #756b5c; font-size: .8rem; line-height: 44px; }
  details { flex: 1; min-width: 120px; }
`;
const Actions = styled.div`
  display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 8px;
  padding-top: 8px; margin-top: 4px; border-top: 1px solid #eee5d5;
  > :only-child { grid-column: 1 / -1; justify-self: start; }
`;
const CorrectionButton = styled(ShopButton)`
  padding: 6px 2px; border-color: transparent; background: transparent;
  justify-self: end; text-align: right; min-width: 0;
  color: #756b5c; font-size: .84rem; font-weight: 500; line-height: 1.35;
  &:only-child { text-align: left; }
  &:hover { background: transparent; text-decoration: underline; }
`;

export default function ShopPricesAndRatings({ data, onPrice, onReport }) {
  const offerings = iceOfferings(data);
  const visible = ICE_TYPES.filter(type => offerings[type].state !== "not_offered");
  const hidden = ICE_TYPES.filter(type => offerings[type].state === "not_offered");
  const details = visible.filter(type => type !== "eisbecher" &&
    (data.preise?.[type]?.letztes_update || data.preise?.[type]?.beschreibung));
  const notices = ICE_TYPES.flatMap(type => {
    const entry = offerings[type];
    if (entry.discrepancy) return [`${ICE_LABELS[type]}: Die Community meldet ein abweichendes Angebot zur Betreiberangabe.`];
    if (entry.source === "inferred") return [`${ICE_LABELS[type]}: Vermutlich nicht angeboten · aus Check-ins abgeleitet.`];
    if (entry.source === "conflict") return [`${ICE_LABELS[type]}: Angebot unklar · widersprüchliche Meldungen.`];
    return [];
  });
  return (
    <Panel data-shop-prices aria-label="Preise und Bewertungen">
      <h2><IceCreamCone size={20} aria-hidden="true" />Preise & Bewertungen</h2>
      <div>{visible.map(type => (
        <IceRow key={type} data-ice-type={type}>
          <strong className="ice-label">{ICE_LABELS[type]}</strong>
          {type !== "eisbecher" && <div className="ice-price">
            {hasShopNumber(data.preise?.[type]?.preis)
              ? <strong>{shopPrice(data.preise[type])}</strong>
              : <span className="empty-value">Preis fehlt</span>}
          </div>}
          <div className="ice-rating" role="group" aria-label={`Bewertung für ${ICE_LABELS[type]}`}>
            {hasShopNumber(data.scores?.[type])
              ? <><Rating stars={Number(data.scores[type])} /><strong>{shopNumber(data.scores[type])} / 5</strong></>
              : <span className="empty-value">Noch nicht bewertet</span>}
          </div>
        </IceRow>
      ))}</div>
      {notices.length > 0 && <Notices>{notices.map(notice => <p key={notice}>{notice}</p>)}</Notices>}
      <Meta>
        {details.length > 0 && <Disclosure data-price-details>
          <summary><ChevronDown size={15} aria-hidden="true" />Preisdetails</summary>
          <dl>{details.map(type => <div key={type}>
            <dt>{ICE_LABELS[type]}</dt>
            <dd>{data.preise[type].beschreibung}
              {data.preise[type].letztes_update && <small>Gemeldet am {shopDate(data.preise[type].letztes_update)}</small>}
            </dd>
          </div>)}</dl>
        </Disclosure>}
        {hasShopNumber(data.bewertungen?.auswahl) && <small>Etwa {shopNumber(data.bewertungen.auswahl, 0)} Sorten</small>}
      </Meta>
      {hidden.length > 0 && <Disclosure>
        <summary><ChevronDown size={15} aria-hidden="true" />Weitere Eisarten ({hidden.length})</summary>
        <dl>{hidden.map(type => <div key={type}><dt>{ICE_LABELS[type]}</dt><dd>{offeringDescription(offerings[type])}</dd></div>)}</dl>
      </Disclosure>}
      <Actions>
        {visible.some(type => type !== "eisbecher") && onPrice && <ShopButton onClick={onPrice}>Preis melden</ShopButton>}
        {onReport && <CorrectionButton onClick={onReport}>Angebot korrigieren</CorrectionButton>}
      </Actions>
    </Panel>
  );
}
