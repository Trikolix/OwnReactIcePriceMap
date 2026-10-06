import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Camera, ChevronRight, Clock, Trophy, Vote } from 'lucide-react';
import Header from '../Header';
import { useUser } from '../context/UserContext';
import { buildAssetUrl } from '../utils/assets.jsx';
import { Page, PageHeading, Button, Notice } from '../components/ChallengeUI';
import { photoStatusLabel, photoDate } from '../utils/photoChallengePresentation';

const Shell = styled.div`min-height: 100vh; background: #fff8ed;`;
const Section = styled.section`margin: 28px 0; h2 { margin-bottom: 16px; }`;
const Grid = styled.div`display: grid; gap: 20px; grid-template-columns: minmax(0, 1fr); @media(min-width: 640px) { grid-template-columns: repeat(2, minmax(0, 1fr)); } @media(min-width: 1024px) { grid-template-columns: repeat(3, minmax(0, 1fr)); }`;
const PhotoCard = styled(Link)`display: flex; flex-direction: column; min-width: 0; overflow: hidden; border: 1px solid #eadfc9; border-radius: 18px; background: #fffdf8; text-decoration: none; color: inherit;
  &:hover { border-color: #d8b977; } &:focus-visible { outline: 3px solid #835500; outline-offset: 3px; }
`;
const Cover = styled.div`aspect-ratio: 16/10; flex-shrink: 0; overflow: hidden; background: #f0e8d8; display: grid; place-items: center; position: relative; color: #9d8051;
 img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; } span { position: absolute; bottom: 12px; left: 12px; background: #fffdf8ee; padding: 6px 10px; border-radius: 8px; font-weight: 700; }
`;
const Body = styled.div`display: flex; flex-direction: column; gap: 12px; padding: 20px; flex: 1; h3 { font-size: 20px; } p { margin: 0; color: #756951; line-height: 1.5; }`;
const Description = styled.p`display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;`;
const Badge = styled.span`align-self: flex-start; padding: 5px 10px; border-radius: 8px; background: ${p => p.$vote ? '#e8f2e1' : '#fff0ce'}; font-size: 13px; font-weight: 750;`;
const Meta = styled.p`display: flex; gap: 8px; align-items: center; font-size: 14px;`;
const Action = styled.div`display: flex; justify-content: space-between; align-items: center; min-height: 44px; padding: 10px 12px; margin-top: auto; background: #fff0ce; border-radius: 10px; font-weight: 750;`;

export default function PhotoChallengeList() {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { userId } = useUser();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const load = useCallback(async (signal) => {
    setLoading(true); setError(null);
    try {
      const response = await fetch(`${apiUrl}/photo_challenge/list_public_challenges.php${userId ? `?nutzer_id=${userId}` : ''}`, { signal });
      const data = await response.json();
      if (!response.ok || data.status !== 'success') throw new Error(data.message || 'Foto-Challenges konnten nicht geladen werden.');
      setChallenges(Array.isArray(data.data) ? data.data : []);
    } catch (err) { if (err.name !== 'AbortError') setError(err.message); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [apiUrl, userId]);
  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, [load]);
  const sections = useMemo(() => ({
    active: challenges.filter(item => item.status !== 'finished').sort((a, b) => {
      const order = { ko_running: 0, group_running: 1, submission_open: 2, submission_closed: 3 };
      return (order[a.status] ?? 4) - (order[b.status] ?? 4) || new Date(a.start_at || a.created_at || 0) - new Date(b.start_at || b.created_at || 0);
    }),
    finished: challenges.filter(item => item.status === 'finished').sort((a, b) => new Date(b.start_at || b.created_at || 0) - new Date(a.start_at || a.created_at || 0)),
  }), [challenges]);
  const renderCards = items => <Grid>{items.map(item => {
    const done = item.status === 'finished'; const voting = ['group_running', 'ko_running'].includes(item.status);
    const image = done && item.winner_image?.url ? item.winner_image : item.preview_images?.[0];
    const Icon = done ? Trophy : voting ? Vote : Camera;
    const action = done ? 'Ergebnisse ansehen' : voting ? 'Jetzt abstimmen' : item.status === 'submission_open' ? 'Foto einreichen' : 'Challenge ansehen';
    return <PhotoCard key={item.id} to={`/photo-challenge/${item.id}`}>
      <Cover>{image?.url ? <img src={buildAssetUrl(image.url)} alt={image.title || item.title} loading="lazy" /> : <Camera size={40} aria-hidden="true" />}{done && item.winner_image && <span>🏆 Gewinnerfoto</span>}</Cover>
      <Body><Badge $vote={voting}>{photoStatusLabel(item.status)}</Badge><h3>{item.title}</h3>
        {item.description && <Description>{item.description}</Description>}
        <Meta><Clock size={17} aria-hidden="true" />{item.status === 'submission_open' ? `Einreichen bis ${photoDate(item.submission_deadline)}` : voting ? item.vote_progress?.is_complete ? 'Alle offenen Duelle beantwortet' : item.vote_progress ? `${item.vote_progress.remaining_votes ?? item.vote_progress.available_votes ?? 0} offene Duelle` : 'Abstimmung läuft'  : done ? 'Die Ergebnisse stehen fest' : 'Die nächste Phase wird vorbereitet'}</Meta>
        <Meta>{Number(item.status === 'submission_open' ? item.submission_count ?? 0 : item.image_count ?? 0)} {item.status === 'submission_open' ? 'Einreichungen' : 'Bilder'}</Meta>
        <Action><span><Icon size={17} aria-hidden="true" /> {action}</span><ChevronRight size={19} aria-hidden="true" /></Action>
      </Body>
    </PhotoCard>;
  })}</Grid>;
  return <Shell><Header /><Page>
    <PageHeading><div><h1>Foto-Challenges</h1><p>Dein Eis-Moment. Deine Stimme. Entdecke die schönsten Fotos.</p></div></PageHeading>
    {error && <Notice $error role="alert">{error} <Button $secondary onClick={() => load()}>Erneut versuchen</Button></Notice>}
    {loading && <Notice role="status">Foto-Challenges werden geladen …</Notice>}
    {!loading && <>
      <Section><h2>Mitmachen <small>({sections.active.length})</small></h2>{sections.active.length ? renderCards(sections.active) : <Notice>Zurzeit läuft keine Foto-Challenge. Schau bald wieder vorbei.</Notice>}</Section>
      <Section><h2>Abgeschlossen <small>({sections.finished.length})</small></h2>{sections.finished.length ? renderCards(sections.finished) : <p>Hier findest du bald die Gewinner vergangener Challenges.</p>}</Section>
    </>}
  </Page></Shell>;
}
