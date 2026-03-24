import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { CAMPAIGN_STATUS } from './campaigns';
import {
  claimEasterDailyHint,
  fetchEasterCampaignProgress,
} from './easterApi';

const dispatchProgressEvent = (detail) => {
  window.dispatchEvent(new CustomEvent('seasonal:easter-progress-updated', { detail }));
};

const EasterCampaignPanel = ({ campaign, isLoggedIn, onLogin }) => {
  const [state, setState] = useState({
    loading: false,
    error: null,
    data: null,
  });
  const [hintState, setHintState] = useState({
    loading: false,
    message: '',
  });

  useEffect(() => {
    if (!campaign || campaign.status !== CAMPAIGN_STATUS.ACTIVE || !isLoggedIn) {
      setState({ loading: false, error: null, data: null });
      return undefined;
    }

    let isCancelled = false;
    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const data = await fetchEasterCampaignProgress();
        if (!isCancelled) {
          setState({ loading: false, error: null, data });
        }
      } catch (error) {
        if (!isCancelled) {
          setState({ loading: false, error: error.message, data: null });
        }
      }
    };

    load();

    const handleUpdate = (event) => {
      if (isCancelled) {
        return;
      }
      if (event.detail?.data) {
        setState({ loading: false, error: null, data: event.detail.data });
      } else {
        load();
      }
    };

    window.addEventListener('seasonal:easter-progress-updated', handleUpdate);
    return () => {
      isCancelled = true;
      window.removeEventListener('seasonal:easter-progress-updated', handleUpdate);
    };
  }, [campaign, isLoggedIn]);

  const progress = state.data?.progress || null;
  const infoText = useMemo(() => {
    if (!progress) {
      return null;
    }
    if (progress.completed) {
      return 'Das Versteck ist gefunden. Der Osterhase ist gestellt.';
    }
    return `Schritt ${progress.current_step} von ${progress.total_steps}. Folge dem Hasen über die Karte bis zu seinem Versteck.`;
  }, [progress]);

  const handleDailyHintClaim = async () => {
    try {
      setHintState({ loading: true, message: '' });
      const data = await claimEasterDailyHint();
      setHintState({
        loading: false,
        message: data?.message || data?.hint?.text || 'Tageshinweis gespeichert.',
      });
      dispatchProgressEvent({ data });
    } catch (error) {
      setHintState({
        loading: false,
        message: error.message || 'Tageshinweis konnte nicht geladen werden.',
      });
    }
  };

  return (
    <PanelSection>
      <SectionTitle>{campaign?.title || 'Osteraktion'}</SectionTitle>
      {campaign?.status === CAMPAIGN_STATUS.UPCOMING && (
        <>
          <Lead>
            Der Osterhase steht schon in den Startlöchern. In der Aktion taucht er immer wieder auf der Karte auf und
            hopst nach jedem Klick weiter. Nach fünf Stationen findest du sein Versteck und sicherst dir einen Award.
          </Lead>
          <SmallCard>
            <strong>Zusatzmechanik</strong>
            <p>Ein täglicher Hasenhinweis begleitet die Jagd und macht die Aktion auch zwischen zwei Verfolgungen interessant.</p>
          </SmallCard>
        </>
      )}

      {campaign?.status === CAMPAIGN_STATUS.ACTIVE && !isLoggedIn && (
        <>
          <Lead>
            Der Osterhase ist aktiv. Melde dich an, damit du seine Spur auf der Karte verfolgen und den Award freischalten kannst.
          </Lead>
          <ActionButton type="button" onClick={onLogin}>Login / Registrieren</ActionButton>
        </>
      )}

      {campaign?.status === CAMPAIGN_STATUS.ACTIVE && isLoggedIn && (
        <>
          {state.loading && <Hint>Lade Osterfortschritt...</Hint>}
          {state.error && <Hint>{state.error}</Hint>}
          {progress && (
            <>
              <ProgressCard $done={progress.completed}>
                <ProgressEyebrow>{progress.completed ? 'Abgeschlossen' : 'Hasenjagd läuft'}</ProgressEyebrow>
                <ProgressHeadline>
                  {progress.completed
                    ? 'Das Versteck wurde gefunden'
                    : `Schritt ${progress.current_step} von ${progress.total_steps}`}
                </ProgressHeadline>
                {infoText && <Lead>{infoText}</Lead>}
                <ProgressMeta>
                  <span>Gefundene Hinweise: {Number(progress.daily_hint_claims || 0)}</span>
                  <span>{progress.daily_hint_available ? 'Tageshinweis verfügbar' : 'Tageshinweis heute schon geholt'}</span>
                </ProgressMeta>
                {!progress.completed && (
                  <MapCta to="/">
                    Zur Karte und den Hasen verfolgen
                  </MapCta>
                )}
              </ProgressCard>

              <SmallCard>
                <strong>Tageshinweis</strong>
                <p>
                  Ein zusätzlicher Tipp pro Tag unterstützt die Jagd. Er ist bewusst leicht gehalten und ergänzt die Verfolgung auf der Karte.
                </p>
                <ActionButton
                  type="button"
                  disabled={!progress.daily_hint_available || hintState.loading}
                  onClick={handleDailyHintClaim}
                >
                  {hintState.loading ? 'Wird geladen...' : progress.daily_hint_available ? 'Heutigen Hinweis holen' : 'Hinweis schon abgeholt'}
                </ActionButton>
                {hintState.message && <Hint>{hintState.message}</Hint>}
                {progress.hint?.text && !hintState.message && <Hint>{progress.hint.text}</Hint>}
              </SmallCard>
            </>
          )}
        </>
      )}

      {campaign?.status === CAMPAIGN_STATUS.RESULTS && (
        <Lead>
          Die Osteraktion ist abgeschlossen. Historische Ergebnisse oder ein Rückblick können hier später ergänzt werden,
          die aktive Spiellogik bleibt aber aus den regulären Produktpfaden entfernt.
        </Lead>
      )}
    </PanelSection>
  );
};

export default EasterCampaignPanel;

const PanelSection = styled.section`
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 1rem;
  margin-top: 1rem;
`;

const SectionTitle = styled.h3`
  margin: 0 0 0.75rem;
  text-align: center;
`;

const Lead = styled.p`
  margin: 0.4rem 0 0;
  line-height: 1.5;
`;

const ProgressCard = styled.div`
  border-radius: 14px;
  padding: 1rem;
  background: ${({ $done }) => ($done ? '#eef8ec' : 'linear-gradient(135deg, #fff7de, #ffe8b5)')};
  color: #352100;
`;

const ProgressEyebrow = styled.div`
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 800;
  color: #865000;
`;

const ProgressHeadline = styled.h4`
  margin: 0.35rem 0 0;
  font-size: 1.2rem;
`;

const ProgressMeta = styled.div`
  margin-top: 0.75rem;
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  font-weight: 700;
  font-size: 0.88rem;
`;

const SmallCard = styled.div`
  margin-top: 0.85rem;
  border-radius: 12px;
  background: #fff8ea;
  padding: 0.9rem;

  p {
    margin: 0.45rem 0 0;
    line-height: 1.45;
  }
`;

const ActionButton = styled.button`
  margin-top: 0.8rem;
  border: none;
  border-radius: 999px;
  padding: 0.65rem 1rem;
  background: #ffb522;
  color: #2b1d00;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

const MapCta = styled(Link)`
  display: inline-flex;
  margin-top: 0.85rem;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  border-radius: 999px;
  padding: 0.65rem 1rem;
  background: #2b1d00;
  color: #fff6df;
  font-weight: 800;
`;

const Hint = styled.p`
  margin: 0.75rem 0 0;
  color: #6f5b3a;
`;
