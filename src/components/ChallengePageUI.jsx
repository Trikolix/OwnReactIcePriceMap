import React from 'react';
import styled from 'styled-components';
import { ShopButton, ShopPanel, SHOP_COLORS } from '../styles/ShopUi';
import { DIFFICULTIES, formatChallengeDate } from '../utils/challengePlanning.mjs';
export const Shell = styled.div`background:#fffaf2;min-height:100dvh;color:${SHOP_COLORS.text};`;
export const Content = styled.main.attrs({
  'data-challenge-page': true
})`
  max-width:1440px;margin:0 auto;padding:24px clamp(12px,3vw,32px) 40px;box-sizing:border-box;
  &, *, *::before, *::after{box-sizing:border-box;}
  h1,h2,h3{color:inherit;text-align:left;text-shadow:none;overflow-wrap:anywhere;}
  h1{margin:0;font-size:clamp(25px,4vw,32px);}h3{margin:0;font-size:1.05rem;}
  p{margin:0;line-height:1.5;}a,button,input,summary{&:focus-visible{outline:3px solid #986b0e;outline-offset:3px;}}
  input{font-size:16px;}button,a,summary{touch-action:manipulation;}
`;
export const Toolbar = styled.div`display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:18px 0;`;
export const Row = styled.div`display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-width:0;`;
export const Stack = styled.div`display:grid;gap:14px;min-width:0;`;
export const Layout = styled.div`display:grid;grid-template-columns:minmax(0,1fr);gap:20px;align-items:start;
  @media(min-width:1080px){grid-template-columns:minmax(0,1fr) minmax(300px,.65fr);}`;
export const Panel = styled(ShopPanel)`padding:18px;h2{margin:0;font-size:1.08rem;}p{margin:0;}`;
export const PanelHead = styled.div`display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px;`;
export const Action = styled(ShopButton)`min-width:44px;max-width:100%;font-weight:650;
  &:disabled{cursor:default;}
`;
export const Toggle = styled(Action)`border-color:${p => p.$active ? '#dda22a' : SHOP_COLORS.border};background:${p => p.$active ? SHOP_COLORS.soft : '#fff'};`;
export const Muted = styled.p`color:${SHOP_COLORS.muted};font-size:.88rem;line-height:1.5;overflow-wrap:anywhere;`;
export const Notice = styled.div.attrs(p => ({
  role: p.$error ? 'alert' : 'status'
}))`
  border:1px solid ${p => p.$error ? '#edc4b7' : SHOP_COLORS.border};border-radius:12px;padding:12px 14px;margin-bottom:14px;
  background:${p => p.$error ? '#fff0eb' : '#f5f5e9'};font-size:.9rem;line-height:1.5;overflow-wrap:anywhere;
  ul{margin:8px 0 0;padding-left:20px;}
`;
export const Chip = styled.span`display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;background:${p => p.$color ? p.$color + '12' : SHOP_COLORS.soft};
  color:${p => p.$color || '#78560e'};font-weight:650;font-size:.78rem;line-height:1.4;overflow-wrap:anywhere;`;
export const CardTop = styled.div`display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px;
  @media(max-width:479px){align-items:flex-start;>time{flex-basis:100%;text-align:right;order:-1;}}`;
export const Time = styled.time`color:${p => p.$urgent ? '#9a5100' : SHOP_COLORS.muted};font-size:.8rem;line-height:1.4;`;
export const TargetCard = styled(Panel)`border-color:${p => p.$selected ? '#d79a24' : SHOP_COLORS.border};box-shadow:${p => p.$selected ? '0 0 0 1px #e6b34b' : 'none'};`;
export const ShopTitle = styled.h3`margin:0 0 4px!important;line-height:1.35;
  a{color:inherit;text-decoration:none;display:inline-flex;align-items:center;min-height:44px;}
  a:hover{text-decoration:underline;}`;
export const CardActions = styled(Row)`margin-top:12px;align-items:stretch;>a,>button{flex:1 1 auto;}
  @media(max-width:359px){>a,>button{flex:1 1 100%;}}`;
export const Disclosure = styled.details`
  min-width:0;summary{display:list-item;min-height:44px;align-content:center;cursor:pointer;font-size:.85rem;color:${SHOP_COLORS.muted};font-weight:600;}
  summary:hover{color:${SHOP_COLORS.text};}summary:focus-visible{border-radius:6px;}[role=group]{padding:4px 0;}
  p,li{font-size:.88rem;line-height:1.55;}ul{padding-left:20px;margin:0 0 10px;}
`;
export const Fields = styled.fieldset`min-width:0;margin:0;border:0;padding:0;display:grid;gap:10px;legend{font-weight:700;padding:0;margin-bottom:10px;}`;
export const Options = styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(min(120px,100%),1fr));gap:8px;`;
export const RadioOption = styled.label`
  display:flex;align-items:center;gap:8px;min-height:44px;padding:10px 12px;border:1px solid ${SHOP_COLORS.border};border-radius:10px;background:#fff;font-size:.9rem;cursor:pointer;
  input{accent-color:#a26908;flex-shrink:0;margin:0;width:18px;height:18px;}strong,small{display:block;}small{font-size:.78rem;color:${SHOP_COLORS.muted};margin-top:2px;}
  &:has(input:checked){background:${SHOP_COLORS.soft};border-color:#d79a24;} &:focus-within{outline:3px solid #986b0e;outline-offset:2px;}
`;
export const RangeField = styled.label`display:grid;gap:8px;font-size:.9rem;input{width:100%;min-height:44px;accent-color:#a26908;}`;
export const TrophyGrid = styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(min(120px,100%),1fr));gap:10px;`;
export const TrophyButton = styled(Action)`display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:5px;padding:12px;
  svg{color:#b78709;}strong{font-size:.86rem;overflow-wrap:anywhere;}span{font-size:.78rem;color:${SHOP_COLORS.muted};}`;
export function NoticeView({
  notice
}) {
  return notice?.message ? <Notice $error={notice.type === 'error'}>{notice.message}{notice.details?.length > 0 && <ul>{notice.details.map((line, i) => <li key={i}>{line}</li>)}</ul>}</Notice> : null;
}
export function LocationStatus({
  geo
}) {
  return <Stack>
    <Muted>{geo.loading ? 'Standort wird bestimmt …' : geo.location ? `Standort bereit${Number.isFinite(geo.accuracy) ? ` · Genauigkeit ca. ${Math.round(geo.accuracy)} m` : ''}${geo.updatedAt ? ` · ${formatChallengeDate(geo.updatedAt)}` : ''}` : 'Für neue Ziele und Team-Einladungen wird dein Standort benötigt.'}</Muted>
    <NoticeView notice={geo.notice} />
    <Row><Action type="button" disabled={geo.loading} onClick={() => geo.requestLocation().catch(() => {})}>{geo.loading ? 'Standort wird bestimmt …' : geo.location ? 'Standort aktualisieren' : 'Standort verwenden'}</Action></Row>
  </Stack>;
}
export function DifficultyOptions({
  value,
  onChange,
  individual = true
}) {
  return <Fields><legend>Schwierigkeit</legend><Options>{Object.entries(DIFFICULTIES).filter(([key]) => individual || key !== 'individuell').map(([key, meta]) => <RadioOption key={key}><input type="radio" name="difficulty" value={key} checked={value === key} onChange={() => onChange(key)} /><span><strong>{meta.label}</strong><small>{meta.range}</small></span></RadioOption>)}</Options></Fields>;
}
