import React from 'react';
import styled from 'styled-components';
import { Bell, Mail, Monitor, Smartphone } from 'lucide-react';

const channels = [
  { key: 'in_app', label: 'In-App', unit: 'Empfängern', icon: Bell },
  { key: 'email', label: 'E-Mail', unit: 'E-Mails', icon: Mail },
  { key: 'web', label: 'Browser-Push', unit: 'Push-Jobs', icon: Monitor },
  { key: 'android', label: 'Android-Push', unit: 'Push-Jobs', icon: Smartphone },
];
const statuses = {
  pending: { label: 'Eingereiht', tone: 'neutral' },
  sending: { label: 'In Bearbeitung', tone: 'info' },
  retry: { label: 'Erneuter Versuch geplant', tone: 'warning' },
  failed: { label: 'Fehlgeschlagen', tone: 'danger' },
  uncertain: { label: 'Versandergebnis unklar', tone: 'warning' },
  cancelled: { label: 'Gestoppt', tone: 'neutral' },
  skipped: { label: 'Übersprungen', tone: 'neutral' },
};
const colors = {
  neutral: { background: '#f3eee5', color: '#756348' },
  info: { background: '#eaf2fb', color: '#315f8e' },
  warning: { background: '#fff1d5', color: '#8b590c' },
  danger: { background: '#fff0eb', color: '#a0392b' },
};
const number = value => Math.max(0, Math.floor(Number(value) || 0));
const format = value => value.toLocaleString('de-DE');

export default function SystemMessageDeliveryStats({ stats = {}, state }) {
  const available = channels.filter(channel => stats?.[channel.key]);
  if (!available.length) return state === 'draft' ? null : <Empty>Für diese Meldung liegen keine Versandstatistiken vor.</Empty>;

  return <Section aria-label="Versandstatistik">
    <Title>Versandübersicht</Title>
    <Grid>{available.map(({ key, label, unit, icon: Icon }) => {
      const counts = Object.fromEntries(Object.entries(stats[key]).map(([status, count]) => [status, number(count)]));
      const inApp = key === 'in_app';
      const total = inApp ? counts.total || 0 : Object.values(counts).reduce((sum, count) => sum + count, 0);
      const completed = inApp ? Math.min(counts.read || 0, total) : (counts.accepted || 0) + (counts.sent || 0);
      const completedLabel = inApp ? 'gelesen' : 'zum Versand angenommen';
      const percent = total ? Math.round(completed / total * 100) : 0;
      const remaining = inApp
        ? [{ key: 'unread', label: 'Noch ungelesen', count: total - completed, tone: 'neutral' }]
        : Object.entries(counts).filter(([status, count]) => count > 0 && status !== 'accepted' && status !== 'sent')
          .sort(([a], [b]) => {
            const order = Object.keys(statuses);
            return (order.indexOf(a) === -1 ? order.length : order.indexOf(a)) - (order.indexOf(b) === -1 ? order.length : order.indexOf(b));
          }).map(([status, count]) => ({ key: status, count, ...(statuses[status] || { label: status, tone: 'neutral' }) }));

      return <ChannelCard key={key} aria-label={`${label}: Versandstatistik`}>
        <ChannelHeading><IconBox><Icon size={18} aria-hidden="true" /></IconBox><h4>{label}</h4></ChannelHeading>
        <Metric><strong>{format(completed)}</strong><span>{completedLabel}</span></Metric>
        <ProgressCaption><span>Von {format(total)} {unit}</span><b>{percent} %</b></ProgressCaption>
        <Progress role="progressbar" aria-label={`${label}: ${completedLabel}`} aria-valuemin={0} aria-valuemax={total || 1}
          aria-valuenow={completed} aria-valuetext={`${format(completed)} von ${format(total)} ${completedLabel}`}>
          <ProgressFill $percent={percent} />
        </Progress>
        {remaining.length > 0 && <StatusList>{remaining.map(item => <StatusRow key={item.key}>
          <dt><StatusDot $tone={item.tone} aria-hidden="true" />{item.label}</dt>
          <dd><StatusCount $tone={item.tone}>{format(item.count)}</StatusCount></dd>
        </StatusRow>)}</StatusList>}
      </ChannelCard>;
    })}</Grid>
    {available.some(channel => channel.key !== 'in_app') && <Footnote>„Zum Versand angenommen“ bestätigt die Übergabe an den Versanddienst.</Footnote>}
  </Section>;
}

const Section = styled.section`margin: 20px 0; color: #2f2100;`;
const Title = styled.h3`&& { margin: 0 0 12px; font-size: 14px; font-weight: 700; }`;
const Grid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 230px), 1fr)); gap: 12px;
`;
const ChannelCard = styled.section`
  min-width: 0; padding: 16px; border: 1px solid #eadfc8; border-radius: 14px; background: #fffdf8;
  box-sizing: border-box; font-variant-numeric: tabular-nums;
`;
const ChannelHeading = styled.div`
  display: flex; align-items: center; gap: 8px; margin-bottom: 16px;
  h4 { margin: 0; font-size: 14px; font-weight: 700; color: #5c4520; }
`;
const IconBox = styled.span`
  display: grid; place-items: center; width: 32px; height: 32px; flex-shrink: 0;
  border-radius: 10px; background: #fff3d9; color: #966214;
`;
const Metric = styled.div`
  display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 8px; margin-bottom: 14px;
  strong { color: #2f2100; font-size: 30px; line-height: 1.1; letter-spacing: -.03em; }
  span { color: #796747; font-size: 12px; line-height: 1.4; }
`;
const ProgressCaption = styled.div`
  display: flex; justify-content: space-between; align-items: baseline; gap: 8px;
  color: #796747; font-size: 12px; line-height: 1.4; margin-bottom: 7px;
  b { color: #50703c; white-space: nowrap; }
`;
const Progress = styled.div`height: 6px; border-radius: 99px; overflow: hidden; background: #eee7d9;`;
const ProgressFill = styled.div`width: ${p => p.$percent}%; height: 100%; background: #739451; border-radius: inherit;`;
const StatusList = styled.dl`display: grid; gap: 8px; margin: 14px 0 0; padding-top: 12px; border-top: 1px solid #eee7d9;`;
const StatusRow = styled.div`
  display: flex; justify-content: space-between; align-items: baseline; gap: 10px; font-size: 12px; line-height: 1.4;
  dt { display: flex; align-items: baseline; gap: 7px; color: #796747; min-width: 0; }
  dd { margin: 0; flex-shrink: 0; }
`;
const StatusDot = styled.span`width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; background: ${p => colors[p.$tone].color};`;
const StatusCount = styled.span`
  display: inline-block; min-width: 28px; padding: 3px 7px; border-radius: 6px; text-align: center;
  box-sizing: border-box; font-weight: 700; background: ${p => colors[p.$tone].background}; color: ${p => colors[p.$tone].color};
`;
const Footnote = styled.p`&& { margin: 12px 0 0; font-size: 12px; line-height: 1.5; color: #796747; }`;
const Empty = styled.p`&& { color: #796747; font-size: 13px; line-height: 1.5; }`;
