import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { CheckCircle2, ScanLine, Trophy, Users } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { getAwardIconSources, handleAwardIconFallback } from '../../utils/awardIcons';
import { fetchSummerCampaignResults } from './summerApi';

const formatDate = (value) => value && new Intl.DateTimeFormat('de-DE', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
}).format(new Date(`${value.slice(0, 10)}T12:00:00Z`));

export const SummerCampaignResults = ({ data, userId, onClose }) => {
  const { campaign, summary, ranking, shops } = data;
  const ownResult = ranking.find((entry) => Number(entry.user_id) === Number(userId));

  return (
    <Results>
      <Intro>
        Die Sommer-Sammelaktion lief vom <strong>{formatDate(campaign.starts_at)}</strong> bis zum{' '}
        <strong>{formatDate(campaign.ends_at)}</strong>. In {summary.total_shops} Eisdielen konnten
        Flyer-Codes gescannt und Sammelkarten freigeschaltet werden. Danke an alle, die mitgesammelt haben!
      </Intro>

      <Stats aria-label="Sommeraktion in Zahlen">
        <Stat><Users size={20} /><strong>{summary.participants}</strong><span>Teilnehmende</span></Stat>
        <Stat><ScanLine size={20} /><strong>{summary.collected}</strong><span>Gesammelte Karten</span></Stat>
        <Stat><CheckCircle2 size={20} /><strong>{summary.confirmed}</strong><span>Mit Check-in bestätigt</span></Stat>
        <Stat><Trophy size={20} /><strong>{summary.complete_albums}</strong><span>Vollständige Alben</span></Stat>
      </Stats>

      {ownResult && (
        <OwnResult>
          Dein Ergebnis: <strong>Platz {ownResult.rank}</strong> mit{' '}
          <strong>{ownResult.scan_count}/{summary.total_shops} Karten</strong>, davon{' '}
          <strong>{ownResult.checkin_count} mit Check-in bestätigt</strong>.
          {ownResult.album_complete && ' Dein Album ist vollständig!'}
        </OwnResult>
      )}

      <Title>Abschlussrangliste</Title>
      <Note>
        Gewertet werden unterschiedliche Sammelkarten. Bei gleicher Kartenanzahl entscheiden die
        Check-in-Bestätigungen; bei Gleichstand wird der Platz geteilt. Ein vollständiges Album enthält
        alle {summary.total_shops} Karten mit Check-in-Bestätigung.
      </Note>
      {ranking.length === 0 ? (
        <Note>Für diese Aktion wurden keine Sammelkarten erfasst.</Note>
      ) : (
        <Table>
          <caption>Alle Teilnehmenden der Sommer-Sammelaktion</caption>
          <thead>
            <tr><th scope="col">Platz</th><th scope="col">Teilnehmende</th><th scope="col">Karten</th><th scope="col">Mit Check-in</th></tr>
          </thead>
          <tbody>
            {ranking.map((entry) => (
              <ResultRow key={entry.user_id} $own={Number(entry.user_id) === Number(userId)}>
                <td><Rank $podium={entry.rank <= 3}>#{entry.rank}</Rank></td>
                <th scope="row">
                  <ProfileLink to={`/user/${entry.user_id}`} onClick={onClose}>{entry.username}</ProfileLink>
                  {entry.album_complete && <CompleteLabel><Trophy size={13} /> Album vollständig</CompleteLabel>}
                </th>
                <td><strong>{entry.scan_count}</strong><Total>/{summary.total_shops}</Total></td>
                <td>{entry.checkin_count}</td>
              </ResultRow>
            ))}
          </tbody>
        </Table>
      )}

      <Title>Die Sammelkarten im Überblick</Title>
      <Note>
        Jede Karte zählt pro Person einmal. Bestätigt bedeutet: Karte gesammelt und ein Check-in
        bei derselben Eisdiele im Aktionszeitraum eingetragen.
      </Note>
      <ShopList>
        {shops.map((shop) => {
          const icon = shop.award_icon ? getAwardIconSources(shop.award_icon, 128) : null;
          return (
            <ShopItem key={shop.summer_shop_id}>
              <ShopIdentity>
                {icon?.src && (
                  <CardImage src={icon.src} data-fallback-src={icon.fallbackSrc || ''}
                    onError={handleAwardIconFallback} alt="" loading="lazy" />
                )}
                <ProfileLink to={`/map/activeShop/${shop.shop_id}`} onClick={onClose}>{shop.shop_name}</ProfileLink>
              </ShopIdentity>
              <ShopCounts>
                <strong>{shop.scan_count}× gesammelt</strong>
                <span>{shop.checkin_count}× bestätigt</span>
              </ShopCounts>
            </ShopItem>
          );
        })}
      </ShopList>
    </Results>
  );
};

const SummerCampaignResultsPanel = ({ onClose }) => {
  const { userId } = useUser();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ loading: true, error: '', data: null });

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, error: '', data: null });
    fetchSummerCampaignResults()
      .then((data) => {
        if (!cancelled) setState({ loading: false, error: '', data });
      })
      .catch((error) => {
        if (!cancelled) setState({ loading: false, error: error.message || 'Die Sommer-Auswertung konnte nicht geladen werden.', data: null });
      });
    return () => { cancelled = true; };
  }, [attempt]);

  if (state.loading) return <Note role="status">Lade Sommer-Auswertung...</Note>;
  if (state.error) return (
    <div>
      <Note role="alert">{state.error}</Note>
      <RetryButton type="button" onClick={() => setAttempt((previous) => previous + 1)}>Erneut laden</RetryButton>
    </div>
  );
  return <SummerCampaignResults data={state.data} userId={userId} onClose={onClose} />;
};

export default SummerCampaignResultsPanel;

const Results = styled.section`
  color: #2f2100;
  text-align: left;
`;

const Intro = styled.p`
  margin: 0 0 1rem;
  line-height: 1.6;
  color: #5b4520;
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.65rem;
  @media (max-width: 600px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`;

const Stat = styled.div`
  display: grid;
  justify-items: start;
  align-content: start;
  gap: 0.3rem;
  padding: 0.85rem;
  border: 1px solid #f0dfb8;
  border-radius: 12px;
  background: #fff8ea;
  svg { color: #a56800; }
  strong { font-size: 1.65rem; line-height: 1.2; }
  span { font-size: 0.82rem; color: #6f5b3a; }
`;

const OwnResult = styled.p`
  padding: 0.85rem;
  border-radius: 10px;
  background: #e9f7ef;
  color: #14532d;
  line-height: 1.6;
`;

const Title = styled.h3`
  margin: 1.5rem 0 0.4rem;
  font-size: 1.08rem;
`;

const Note = styled.p`
  margin: 0.5rem 0 0.85rem;
  color: #677080;
  font-size: 0.86rem;
  line-height: 1.55;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  caption { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  th, td { padding: 0.65rem 0.5rem; text-align: left; border-bottom: 1px solid #edf0f4; }
  thead th { color: #677080; font-size: 0.78rem; font-weight: 700; background: #f7f8fa; }
  th:nth-child(n + 3), td:nth-child(n + 3) { text-align: right; }
  tbody th { overflow-wrap: anywhere; }
  @media (max-width: 480px) {
    font-size: 0.8rem;
    th, td { padding: 0.6rem 0.3rem; }
    thead th { font-size: 0.7rem; }
  }
`;

const ResultRow = styled.tr`
  background: ${({ $own }) => ($own ? '#e9f7ef' : 'transparent')};
`;

const Rank = styled.span`
  font-weight: 800;
  color: ${({ $podium }) => ($podium ? '#9b6500' : '#677080')};
`;

const Total = styled.span`
  color: #858b95;
  font-size: 0.78rem;
`;

const ProfileLink = styled(Link)`
  color: #40321a;
  font-weight: 700;
  text-decoration: none;
  overflow-wrap: anywhere;
  &:hover, &:focus-visible { text-decoration: underline; }
`;

const CompleteLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
  color: #267144;
  font-size: 0.72rem;
  font-weight: 600;
  svg { flex-shrink: 0; }
`;

const ShopList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const ShopItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 0;
  border-bottom: 1px solid #edf0f4;
`;

const ShopIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  font-size: 0.88rem;
`;

const CardImage = styled.img`
  width: 48px;
  height: 48px;
  object-fit: contain;
  flex-shrink: 0;
`;

const ShopCounts = styled.div`
  display: grid;
  gap: 0.2rem;
  flex-shrink: 0;
  text-align: right;
  font-size: 0.78rem;
  span { color: #677080; }
`;

const RetryButton = styled.button`
  border: 0;
  border-radius: 8px;
  padding: 0.6rem 0.85rem;
  background: #ffb522;
  color: #2f2100;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
`;
