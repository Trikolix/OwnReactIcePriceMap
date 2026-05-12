import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { MapPin, ScanLine, Sparkles, Trophy } from 'lucide-react';
import { CAMPAIGN_STATUS } from './campaigns';
import { fetchSummerCampaignProgress } from './summerApi';
import { useUser } from '../../context/UserContext';
import { getAwardIconSources, handleAwardIconFallback } from '../../utils/awardIcons';

const SummerCampaignPanel = ({ campaign, isLoggedIn, onLogin }) => {
  const { authToken } = useUser();
  const [selectedShop, setSelectedShop] = useState(null);
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
  const completion = summary.total > 0 ? Math.round((summary.collected / summary.total) * 100) : 0;

  return (
    <PanelSection>
      <HeaderRow>
        <div>
          <SectionTitle>{campaign?.title || 'Sommer-Sammelaktion 2026'}</SectionTitle>
          <Lead>
            Scanne die Flyer-Codes in teilnehmenden Eisdielen und fülle dein Sammelalbum. Ein Check-in vor Ort macht die Karte vollständig.
          </Lead>
        </div>
        <Badge><Sparkles size={16} /> {completion}%</Badge>
      </HeaderRow>

      {!isLoggedIn && (
        <GuestBox>
          <strong>Scans werden nach dem Login gespeichert.</strong>
          <p>Du kannst einen Flyer-Code scannen und dich danach anmelden. Die App merkt sich den Scan lokal und trägt ihn nach.</p>
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
            <Stat><MapPin size={16} /> {summary.checkins} mit Check-in bestätigt</Stat>
            <Stat><Trophy size={16} /> {summary.missing} offen</Stat>
          </StatsRow>

          <AlbumGrid>
            {shops.map((shop) => {
              const awardIconSources = shop.award_icon ? getAwardIconSources(shop.award_icon, 512) : null;
              const imageAlt = shop.award_title || `Sammelkarte ${shop.shop_name}`;

              return (
                <AlbumCard key={shop.id}>
                  <AwardImageButton type="button" onClick={() => setSelectedShop(shop)} aria-label={`Details zu ${shop.shop_name} anzeigen`}>
                    {awardIconSources?.src ? (
                      <AwardThumb
                        src={awardIconSources.src}
                        data-fallback-src={awardIconSources.fallbackSrc || ''}
                        onError={handleAwardIconFallback}
                        alt={imageAlt}
                        $collected={shop.collected}
                      />
                    ) : (
                      <AwardFallback $collected={shop.collected}>
                        <Sparkles size={42} />
                      </AwardFallback>
                    )}
                  </AwardImageButton>
                  <ShopLink to={`/map/activeShop/${shop.shop_id}`}>{shop.shop_name}</ShopLink>
                </AlbumCard>
              );
            })}
          </AlbumGrid>
        </>
      )}

      {selectedShop && (
        <DetailOverlay onClick={() => setSelectedShop(null)}>
          <DetailDialog onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="summer-award-detail-title">
            <DetailClose type="button" onClick={() => setSelectedShop(null)} aria-label="Details schließen">x</DetailClose>
            <DetailImageWrap>
              {selectedShop.award_icon ? (
                <AwardThumb
                  src={getAwardIconSources(selectedShop.award_icon, 512).src || ''}
                  data-fallback-src={getAwardIconSources(selectedShop.award_icon, 512).fallbackSrc || ''}
                  onError={handleAwardIconFallback}
                  alt={selectedShop.award_title || `Sammelkarte ${selectedShop.shop_name}`}
                  $collected={selectedShop.collected}
                />
              ) : (
                <AwardFallback $collected={selectedShop.collected}>
                  <Sparkles size={48} />
                </AwardFallback>
              )}
            </DetailImageWrap>
            <DetailTitle id="summer-award-detail-title">{selectedShop.shop_name}</DetailTitle>
            {selectedShop.award_title && <DetailMeta>{selectedShop.award_title}</DetailMeta>}
            <DetailStatus $collected={selectedShop.collected}>
              {selectedShop.collected ? 'Freigeschaltet' : 'Noch nicht freigeschaltet'}
            </DetailStatus>
            <DetailSection>
              <DetailLabel>Kategorien</DetailLabel>
              {selectedShop.categories?.length > 0 ? (
                <DetailPills>
                  {selectedShop.categories.map((category) => <DetailPill key={category}>{category}</DetailPill>)}
                </DetailPills>
              ) : (
                <DetailMeta>Keine Kategorien zugeordnet.</DetailMeta>
              )}
            </DetailSection>
            <DetailSection>
              <DetailLabel>Adresse</DetailLabel>
              <DetailMeta>{selectedShop.shop_address || 'Keine Adresse hinterlegt.'}</DetailMeta>
            </DetailSection>
            <DetailActions>
              <DetailLink to={`/map/activeShop/${selectedShop.shop_id}`}>Zur Eisdiele</DetailLink>
            </DetailActions>
          </DetailDialog>
        </DetailOverlay>
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

const AlbumGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
  gap: 1rem 0.85rem;
  margin-top: 1rem;
`;

const AlbumCard = styled.article`
  display: grid;
  justify-items: center;
  gap: 0.55rem;
  min-width: 0;
`;

const AwardImageButton = styled.button`
  width: 100%;
  max-width: 168px;
  aspect-ratio: 1 / 1;
  border: none;
  border-radius: 12px;
  padding: 0;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: #f1eee6;
  box-shadow: 0 6px 18px rgba(47, 33, 0, 0.08);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(47, 33, 0, 0.13);
  }
`;

const AwardThumb = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  filter: ${({ $collected }) => ($collected ? 'none' : 'grayscale(1) saturate(0)')};
  opacity: ${({ $collected }) => ($collected ? 1 : 0.35)};
`;

const AwardFallback = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: ${({ $collected }) => ($collected ? '#7a4a00' : '#8a857a')};
  background: ${({ $collected }) => ($collected ? '#fff1ca' : '#e7e4dc')};
  filter: ${({ $collected }) => ($collected ? 'none' : 'grayscale(1) saturate(0)')};
  opacity: ${({ $collected }) => ($collected ? 1 : 0.6)};
`;

const ShopLink = styled(Link)`
  color: #2f2100;
  font-weight: 800;
  font-size: 0.9rem;
  line-height: 1.2;
  text-align: center;
  text-decoration: none;
  overflow-wrap: anywhere;

  &:hover {
    color: #7a4a00;
    text-decoration: underline;
  }
`;

const DetailOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 3600;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(20, 14, 4, 0.54);
`;

const DetailDialog = styled.div`
  position: relative;
  width: min(420px, 94vw);
  max-height: min(760px, 92vh);
  overflow-y: auto;
  border-radius: 14px;
  background: #ffffff;
  padding: 1rem;
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.24);
`;

const DetailClose = styled.button`
  position: absolute;
  top: 0.65rem;
  right: 0.65rem;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 999px;
  background: rgba(47, 33, 0, 0.08);
  color: #2f2100;
  font-size: 1.15rem;
  font-weight: 800;
  cursor: pointer;
`;

const DetailImageWrap = styled.div`
  width: min(220px, 70vw);
  aspect-ratio: 1 / 1;
  margin: 0 auto 0.85rem;
  border-radius: 14px;
  overflow: hidden;
  background: #f1eee6;
`;

const DetailTitle = styled.h4`
  margin: 0;
  color: #2f2100;
  font-size: 1.15rem;
  text-align: center;
`;

const DetailMeta = styled.div`
  margin-top: 0.35rem;
  color: rgba(47, 33, 0, 0.68);
  font-size: 0.9rem;
  line-height: 1.4;
  text-align: center;
`;

const DetailStatus = styled.div`
  width: fit-content;
  margin: 0.75rem auto 0;
  border-radius: 999px;
  padding: 0.3rem 0.65rem;
  background: ${({ $collected }) => ($collected ? '#dff4e6' : '#e7e4dc')};
  color: ${({ $collected }) => ($collected ? '#14532d' : '#5f5a50')};
  font-size: 0.78rem;
  font-weight: 800;
`;

const DetailSection = styled.div`
  margin-top: 1rem;
`;

const DetailLabel = styled.div`
  margin-bottom: 0.4rem;
  color: #5b4520;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
`;

const DetailPills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`;

const DetailPill = styled.span`
  border-radius: 999px;
  padding: 0.28rem 0.58rem;
  background: #fff4dd;
  color: #7a4a00;
  font-size: 0.8rem;
  font-weight: 800;
`;

const DetailActions = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1.1rem;
`;

const DetailLink = styled(Link)`
  border-radius: 10px;
  background: #ffb522;
  color: #2b1d00;
  padding: 0.65rem 0.95rem;
  font-weight: 800;
  text-decoration: none;
`;
