import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Lock, MapPin, ScanLine, Sparkles, Trophy } from 'lucide-react';
import { CAMPAIGN_STATUS } from './campaigns';
import { fetchSummerCampaignProgress } from './summerApi';
import { useUser } from '../../context/UserContext';
import { getAwardIconSources, handleAwardIconFallback } from '../../utils/awardIcons';

const SummerCampaignPanel = ({ campaign, isLoggedIn, onLogin }) => {
  const { authToken } = useUser();
  const [state, setState] = useState({
    loading: false,
    error: '',
    data: null,
  });

  useEffect(() => {
    if (!campaign || campaign.status !== CAMPAIGN_STATUS.ACTIVE) {
      setState({ loading: false, error: '', data: null });
      return undefined;
    }

    let cancelled = false;
    const load = async () => {
      setState((previous) => ({ ...previous, loading: true, error: '' }));
      try {
        const data = await fetchSummerCampaignProgress(authToken);
        if (!cancelled) {
          setState({ loading: false, error: '', data });
        }
      } catch (error) {
        if (!cancelled) {
          setState({ loading: false, error: error.message || 'Sommeraktion konnte nicht geladen werden.', data: null });
        }
      }
    };

    load();
    const handleUpdate = () => load();
    window.addEventListener('seasonal:summer-progress-updated', handleUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener('seasonal:summer-progress-updated', handleUpdate);
    };
  }, [campaign, authToken]);

  const shops = state.data?.shops || [];
  const summary = state.data?.summary || { total: 0, collected: 0, missing: 0, checkins: 0 };
  const categoryRows = useMemo(() => Object.entries(state.data?.categories || {}), [state.data]);
  const completion = summary.total > 0 ? Math.round((summary.collected / summary.total) * 100) : 0;

  return (
    <PanelSection>
      <HeaderRow>
        <div>
          <SectionTitle>{campaign?.title || 'Sommer-Sammelaktion 2026'}</SectionTitle>
          <Lead>
            Scanne die Flyer-Codes in teilnehmenden Eisdielen und fuelle dein Sammelalbum. Ein Check-in vor Ort macht die Karte vollstaendig.
          </Lead>
        </div>
        <Badge><Sparkles size={16} /> {completion}%</Badge>
      </HeaderRow>

      {!isLoggedIn && (
        <GuestBox>
          <strong>Scans werden nach dem Login gespeichert.</strong>
          <p>Du kannst einen Flyer-Code scannen und dich danach anmelden. Die App merkt sich den Scan lokal und traegt ihn nach.</p>
          <ActionButton type="button" onClick={onLogin}>Login / Registrieren</ActionButton>
        </GuestBox>
      )}

      {state.loading && <Hint>Lade Sammelalbum...</Hint>}
      {state.error && <Hint>{state.error}</Hint>}

      {!state.loading && !state.error && shops.length === 0 && (
        <Hint>Noch keine teilnehmenden Eisdielen konfiguriert.</Hint>
      )}

      {shops.length > 0 && (
        <>
          <ProgressBar aria-label={`Fortschritt ${completion} Prozent`}>
            <ProgressFill style={{ width: `${completion}%` }} />
          </ProgressBar>
          <StatsRow>
            <Stat><ScanLine size={16} /> {summary.collected}/{summary.total} gesammelt</Stat>
            <Stat><MapPin size={16} /> {summary.checkins} mit Check-in bestaetigt</Stat>
            <Stat><Trophy size={16} /> {summary.missing} offen</Stat>
          </StatsRow>

          {categoryRows.length > 0 && (
            <CategoryList>
              {categoryRows.map(([name, stats]) => (
                <CategoryPill key={name} $complete={stats.collected >= stats.total}>
                  {name}: {stats.collected}/{stats.total}
                </CategoryPill>
              ))}
            </CategoryList>
          )}

          <AlbumGrid>
            {shops.map((shop) => (
              <AlbumCard key={shop.id} $collected={shop.collected} $complete={shop.checkin_confirmed}>
                <CardIcon $collected={shop.collected}>
                  {shop.collected && shop.award_icon ? (
                    <AwardThumb
                      src={getAwardIconSources(shop.award_icon, 512).src || ''}
                      data-fallback-src={getAwardIconSources(shop.award_icon, 512).fallbackSrc || ''}
                      onError={handleAwardIconFallback}
                      alt={shop.award_title || shop.shop_name}
                    />
                  ) : shop.collected ? <Sparkles size={26} /> : <Lock size={24} />}
                </CardIcon>
                <CardBody>
                  <CardCategory>{shop.category}</CardCategory>
                  <CardTitle>{shop.collected ? (shop.award_title || shop.shop_name) : 'Noch nicht freigeschaltet'}</CardTitle>
                  <CardMeta>
                    {shop.collected
                      ? (shop.checkin_confirmed ? 'Scan + Check-in bestaetigt' : 'Gescannt - Check-in Bonus offen')
                      : 'Flyer-Code vor Ort scannen'}
                  </CardMeta>
                  {shop.collected && (
                    <ShopLink to={`/map/activeShop/${shop.shop_id}`}>Zur Eisdiele</ShopLink>
                  )}
                </CardBody>
              </AlbumCard>
            ))}
          </AlbumGrid>
        </>
      )}
    </PanelSection>
  );
};

export default SummerCampaignPanel;

const PanelSection = styled.section`
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 1rem;
  margin-top: 1rem;
  text-align: left;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
`;

const SectionTitle = styled.h3`
  margin: 0 0 0.35rem;
  color: #2f2100;
`;

const Lead = styled.p`
  margin: 0;
  color: #5b4520;
  line-height: 1.45;
`;

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  background: #e9f7ef;
  color: #14532d;
  padding: 0.4rem 0.7rem;
  font-weight: 800;
  white-space: nowrap;
`;

const GuestBox = styled.div`
  margin-top: 0.85rem;
  padding: 0.85rem;
  border-radius: 12px;
  background: #fff8ea;
  color: #4d3500;

  p {
    margin: 0.35rem 0 0;
    line-height: 1.4;
  }
`;

const ActionButton = styled.button`
  margin-top: 0.7rem;
  border: none;
  border-radius: 10px;
  padding: 0.65rem 0.9rem;
  background: #ffb522;
  color: #2b1d00;
  font-weight: 800;
  cursor: pointer;
`;

const Hint = styled.p`
  margin: 0.8rem 0 0;
  color: #6f5b3a;
`;

const ProgressBar = styled.div`
  margin-top: 0.9rem;
  height: 10px;
  border-radius: 999px;
  background: #f0eadb;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #23a55a, #ffb522);
`;

const StatsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.8rem;
`;

const Stat = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  background: rgba(47, 33, 0, 0.05);
  padding: 0.35rem 0.65rem;
  color: #5b4520;
  font-weight: 700;
  font-size: 0.85rem;
`;

const CategoryList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.75rem;
`;

const CategoryPill = styled.span`
  border-radius: 999px;
  padding: 0.3rem 0.6rem;
  background: ${({ $complete }) => ($complete ? '#e9f7ef' : '#fff4dd')};
  color: ${({ $complete }) => ($complete ? '#14532d' : '#7a4a00')};
  font-size: 0.8rem;
  font-weight: 800;
`;

const AlbumGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(145px, 1fr));
  gap: 0.75rem;
  margin-top: 0.9rem;
`;

const AlbumCard = styled.article`
  min-height: 190px;
  border-radius: 8px;
  border: 1px solid ${({ $complete, $collected }) => ($complete ? '#7bc894' : $collected ? '#ffd581' : '#e2dfd4')};
  background: ${({ $complete, $collected }) => (
    $complete
      ? 'linear-gradient(180deg, #f1fbf4, #ffffff)'
      : $collected
        ? 'linear-gradient(180deg, #fff6dc, #ffffff)'
        : 'linear-gradient(180deg, #f2f0e9, #ffffff)'
  )};
  padding: 0.8rem;
  display: grid;
  gap: 0.55rem;
  align-content: start;
`;

const CardIcon = styled.div`
  width: 58px;
  height: 58px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: ${({ $collected }) => ($collected ? '#ffcf69' : '#ddd8ca')};
  color: ${({ $collected }) => ($collected ? '#5b3600' : '#706a5c')};
`;

const AwardThumb = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 10px;
  object-fit: cover;
  display: block;
`;

const CardBody = styled.div`
  min-width: 0;
`;

const CardCategory = styled.div`
  color: #7a4a00;
  font-size: 0.74rem;
  font-weight: 800;
  text-transform: uppercase;
`;

const CardTitle = styled.h4`
  margin: 0.25rem 0 0;
  color: #2f2100;
  font-size: 0.96rem;
  line-height: 1.2;
`;

const CardMeta = styled.div`
  margin-top: 0.35rem;
  color: rgba(47, 33, 0, 0.66);
  font-size: 0.78rem;
  line-height: 1.3;
`;

const ShopLink = styled(Link)`
  display: inline-flex;
  margin-top: 0.55rem;
  color: #14532d;
  font-weight: 800;
  font-size: 0.82rem;
  text-decoration: none;
`;
