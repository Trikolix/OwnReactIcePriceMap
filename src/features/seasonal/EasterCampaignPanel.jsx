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
      setState((previous) => ({ ...previous, loading: true, error: null }));
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
  const totalHintsFound = progress
    ? Number(progress.total_hints_found ?? ((progress.workshop_hint_claims || 0) + (progress.daily_hint_claims || 0)))
    : 0;
  const trackedHops = Number(progress?.hop_count || 0);
  const infoText = useMemo(() => {
    if (!progress) {
      return null;
    }
    if (progress.completed) {
      return 'Die Werkstatt auf der Osterinsel ist gefunden. Der Secret Award ist gesichert.';
    }

    return `Du hast den Hasen bereits ${Number(progress.hop_count || 0)} Mal aufgescheucht. Suche auf der Karte nach einem Hasen, der hinter einem Osterei hervorblinzelt, und folge seinen Spuren zur geheimen Osterwerkstatt.`;
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
            Der Osterhase versteckt sich waehrend der Aktion hinter Osterei-Markern auf der Karte. Wenn du ihn erwischst,
            hopst er weiter und hinterlaesst neue Richtungs- oder Werkstatthinweise.
          </Lead>
          <SmallCard>
            <strong>Ziel der Jagd</strong>
            <p>Folge den Spuren bis zur Osterinsel. Dort wartet die Osterhasenwerkstatt mit einem Secret Award.</p>
          </SmallCard>
        </>
      )}

      {campaign?.status === CAMPAIGN_STATUS.ACTIVE && !isLoggedIn && (
        <>
          <Lead>
            Der Osterhase ist aktiv. Melde dich an, damit du seine Spur auf der Karte verfolgen und den Secret Award freischalten kannst.
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
                <ProgressEyebrow>{progress.completed ? 'Abgeschlossen' : 'Hasenjagd laeuft'}</ProgressEyebrow>
                <ProgressHeadline>
                  {progress.completed
                    ? 'Die Osterhasenwerkstatt wurde gefunden'
                    : `${trackedHops} Hasensprünge verfolgt`}
                </ProgressHeadline>
                {infoText && <Lead>{infoText}</Lead>}
                <ProgressMeta>
                  <span>Hasenspruenge verfolgt: {trackedHops}</span>
                  <span>Gefundene Hinweise: {totalHintsFound}</span>
                  <span>{progress.daily_hint_available ? 'Tageshinweis verfügbar' : 'Tageshinweis heute schon geholt'}</span>
                </ProgressMeta>
              </ProgressCard>

              <SmallCard>
                <strong>Tageshinweis</strong>
                <p>
                  Ein weiterer Tipp pro Tag hilft dir bei der Jagd. Mal führt er dich zu einer Hoppelrichtung, mal näher an die Werkstatt.
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
          Die Osteraktion ist abgeschlossen. Die Werkstatt ist wieder im Feiertagsnebel verschwunden und die Karte laeuft ohne aktive Hasenjagd weiter.
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
