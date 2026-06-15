import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Bike, Flag, IceCreamBowl, Info, Search, Shirt, Trophy } from 'lucide-react';
import { CAMPAIGN_STATUS } from './campaigns';
import {
  fetchTourDeGlaceProgress,
  fetchTourDeGlaceLeaderboard,
  selectTourDeGlaceRiderType,
  submitTourDeGlaceTips,
} from './tourDeGlaceApi';
import { useUser } from '../../context/UserContext';

const JERSEY_META = {
  yellow: { label: 'Gelb', color: '#f6c945', image: '/assets/tour-de-glace/jersey_yellow.png' },
  green: { label: 'Grün', color: '#1f9d55', image: '/assets/tour-de-glace/jersey_green.png' },
  mountain: { label: 'Berg', color: '#d93123', image: '/assets/tour-de-glace/jersey_mountain.png' },
  ice: { label: 'Eiscreme', color: '#fca2b7', image: '/assets/tour-de-glace/jersey_ice.png' },
  white: { label: 'Weiß', color: '#f4f4f4', image: '/assets/tour-de-glace/jersey_white.png' },
};

const SCORE_KEYS = ['yellow', 'green', 'mountain', 'ice', 'white'];
const ACTION_LABELS = {
  checkin: 'Check-ins',
  bike_bonus: 'Fahrradbonus',
  comment: 'Kommentare',
  like: 'Likes',
  review: 'Bewertungen',
  daily_visit: 'Tagesbesuch',
  profile_image: 'Profilbild vorhanden',
  easter_egg: 'Easter-Eggs',
  route: 'Routen',
  referral: 'Geworbene Nutzer',
  photo_vote: 'Foto-Votes',
};
const JERSEY_EXPLANATIONS = {
  yellow: 'Gesamtwertung: Check-ins, Fotos, Fahrrad-Anreise, Bewertungen, Gruppenaktionen und Routen zahlen reduziert ein.',
  green: 'Sprintwertung: täglicher Besuch, Likes, Kommentare und Easter-Eggs bringen Punkte.',
  mountain: 'Bergwertung: Fahrrad-Anreise, Gruppen-Check-ins mit Fahrrad und Routen sind hier stark.',
  ice: 'Genusswertung: echte Eis-Check-ins, Fotos, neue Eisdielen und Bewertungen zählen besonders.',
  white: 'Nachwuchswertung: zählt nur für Nutzer mit weniger als 5 Check-ins vor Tourstart und belohnt erste Aktionen.',
};
const JERSEY_DETAILS = {
  yellow: 'Das Gelbe Trikot ist die Allround-Wertung. Es sammelt reduzierte Punkte aus vielen Bereichen und belohnt konstant aktive Nutzer.',
  green: 'Das Grüne Trikot ist die Sprintwertung. Es ist für tägliche Aktivität und Community-Interaktion gedacht, auch ohne jeden Tag Eis zu essen.',
  mountain: 'Das Bergtrikot belohnt Fahrrad-Anreise und sportliche Tour-Aktionen. Fahrradbonus und Routen wirken hier besonders stark.',
  ice: 'Das Eiscreme-Trikot ist die Genusswertung. Check-ins, Fotos, neue Eisdielen und Bewertungen zahlen hier besonders ein.',
  white: 'Das Weiße Trikot ist die Nachwuchswertung. Es zählt nur für Nutzer mit weniger als 5 Check-ins vor dem Tourstart.',
};
const NEXT_ACTIONS = {
  yellow: 'Mach einen Check-in, ergänze ein Foto, schreibe eine Bewertung oder reiche eine Route ein.',
  green: 'Öffne die Tour täglich, like Beiträge, kommentiere sinnvoll oder finde das Etappen-Easter-Egg.',
  mountain: 'Setze beim Check-in die Fahrrad-Anreise oder reiche eine passende Route ein.',
  ice: 'Mach einen Eis-Check-in mit Foto, besuche eine neue Eisdiele oder bewerte eine Eisdiele.',
  white: 'Starte mit deinem ersten Check-in, Profilbild, Kommentar oder deiner ersten Bewertung während der Tour.',
};
const INFO_TEXTS = {
  officialLeader: 'Ein Nutzer kann offiziell nur ein Haupttrikot tragen. Wenn jemand mehrere Wertungen rechnerisch anführt, geht ein niedriger priorisiertes Trikot an den nächsten berechtigten Nutzer.',
  multipliers: 'Multiplikatoren gelten nur für Tour-de-Glace-Punkte, nicht für normale EP oder bestehende Awards.',
};
const POINT_RULES = [
  { action: 'Tagesbesuch der Tour-Seite', yellow: 0, green: 5, mountain: 0, ice: 0, white: 0, note: '1x pro Tag' },
  { action: 'Like auf fremden Beitrag', yellow: 0, green: 1, mountain: 0, ice: 0, white: 0, note: 'max. 20 pro Tag' },
  { action: 'Kommentar', yellow: 2, green: 5, mountain: 0, ice: 0, white: 10, note: 'max. 5 pro Tag' },
  { action: 'Easter-Egg gefunden', yellow: 0, green: 8, mountain: 0, ice: 0, white: 0, note: '1x pro Etappentag' },
  { action: 'Check-in: Kugel oder Softeis', yellow: 10, green: 0, mountain: 0, ice: 20, white: 30, note: 'unlimitiert' },
  { action: 'Check-in: Eisbecher', yellow: 10, green: 0, mountain: 0, ice: 25, white: 30, note: 'unlimitiert' },
  { action: 'Check-in mit Foto', yellow: 3, green: 0, mountain: 0, ice: 10, white: 20, note: 'Zusatzpunkte' },
  { action: 'Neue Eisdiele beim Check-in', yellow: 0, green: 0, mountain: 0, ice: 15, white: 0, note: 'erstmals von dir besucht' },
  { action: 'Fahrrad-Anreise', yellow: 5, green: 0, mountain: 25, ice: 5, white: 0, note: 'unlimitiert' },
  { action: 'Fahrrad + Gruppen-Check-in', yellow: 0, green: 0, mountain: 10, ice: 0, white: 0, note: 'Zusatzpunkte' },
  { action: 'Fahrrad + neue Eisdiele', yellow: 0, green: 0, mountain: 10, ice: 0, white: 0, note: 'Zusatzpunkte' },
  { action: 'Profilbild vorhanden', yellow: 0, green: 10, mountain: 0, ice: 0, white: 0, note: 'einmalig' },
  { action: 'Bewertung', yellow: 8, green: 0, mountain: 0, ice: 8, white: 20, note: 'max. 10 im Aktionszeitraum' },
  { action: 'Route eingereicht', yellow: 10, green: 0, mountain: 30, ice: 0, white: 0, note: 'max. 3 im Aktionszeitraum' },
];
const RIDER_DETAILS = {
  sprinter: 'Passt, wenn du oft in den Feed schaust, Likes vergibst, kommentierst und Tagesaktionen mitnimmst. Schwächer bei Fahrrad- und Bergpunkten.',
  bergfloh: 'Passt, wenn deine Check-ins häufig mit Fahrrad-Anreise oder Routen verbunden sind. Schwächer bei reinen Social-Aktionen.',
  connaisseur: 'Passt, wenn du vor allem Eis isst, neue Sorten einträgst, bewertest und neue Eisdielen ausprobierst.',
  domestique: 'Passt, wenn du andere unterstützt, kommentierst, Gruppen-Check-ins machst und Community-Aktionen magst.',
  fotograf: 'Passt, wenn du Check-ins mit Fotos machst und visuelle Beiträge stark einbringst.',
  rookie: 'Passt, wenn du neu bist oder entspannt mitmachen möchtest. Viele einfache Einstiegsaktionen bekommen solide Boni.',
};
const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const InfoHint = ({ id, label, children, text, expandedInfo, onToggle }) => (
  <InfoWrap data-tour-info>
    <InfoButton
      type="button"
      aria-label={label}
      aria-expanded={expandedInfo === id}
      onClick={(event) => {
        event.stopPropagation();
        onToggle(id);
      }}
    >
      <Info size={16} />
    </InfoButton>
    {expandedInfo === id && <InfoOverlay role="status">{children || text}</InfoOverlay>}
  </InfoWrap>
);

const TourDeGlacePanel = ({ campaign, isLoggedIn, onLogin }) => {
  const { authToken } = useUser();
  const [activeTab, setActiveTab] = useState('overview');
  const [state, setState] = useState({ loading: false, error: '', data: null });
  const [tips, setTips] = useState({});
  const [message, setMessage] = useState('');
  const [selectedJersey, setSelectedJersey] = useState('yellow');
  const [selectedLeaderboardEntry, setSelectedLeaderboardEntry] = useState(null);
  const [expandedInfo, setExpandedInfo] = useState(null);
  const [expandedLeaderboards, setExpandedLeaderboards] = useState({});
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const load = async () => {
    setState((previous) => ({ ...previous, loading: true, error: '' }));
    try {
      const data = await fetchTourDeGlaceProgress(authToken);
      setState({ loading: false, error: '', data });
      setTips({
        tip_gc_winner: data?.tips?.tip_gc_winner || '',
        tip_gc_second: data?.tips?.tip_gc_second || '',
        tip_gc_third: data?.tips?.tip_gc_third || '',
        tip_green_winner: data?.tips?.tip_green_winner || '',
        tip_mountain_winner: data?.tips?.tip_mountain_winner || '',
        tip_white_winner: data?.tips?.tip_white_winner || '',
      });
    } catch (error) {
      setState({ loading: false, error: error.message || 'Tour de Glace konnte nicht geladen werden.', data: null });
    }
  };

  useEffect(() => {
    if (!campaign || ![CAMPAIGN_STATUS.ACTIVE, CAMPAIGN_STATUS.UPCOMING, CAMPAIGN_STATUS.RESULTS].includes(campaign.status)) {
      return undefined;
    }
    let cancelled = false;
    const run = async () => {
      setState((previous) => ({ ...previous, loading: true, error: '' }));
      try {
        const data = await fetchTourDeGlaceProgress(authToken);
        if (!cancelled) {
          setState({ loading: false, error: '', data });
          setTips({
            tip_gc_winner: data?.tips?.tip_gc_winner || '',
            tip_gc_second: data?.tips?.tip_gc_second || '',
            tip_gc_third: data?.tips?.tip_gc_third || '',
            tip_green_winner: data?.tips?.tip_green_winner || '',
            tip_mountain_winner: data?.tips?.tip_mountain_winner || '',
            tip_white_winner: data?.tips?.tip_white_winner || '',
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({ loading: false, error: error.message || 'Tour de Glace konnte nicht geladen werden.', data: null });
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [campaign, authToken]);

  useEffect(() => {
    const handleTourUpdate = () => {
      load();
    };
    window.addEventListener('seasonal:tour-de-glace-progress-updated', handleTourUpdate);
    return () => {
      window.removeEventListener('seasonal:tour-de-glace-progress-updated', handleTourUpdate);
    };
  }, [authToken]);

  const data = state.data;
  const phase = data?.campaign?.phase || campaign?.status;
  const riderTypes = data?.rider_types || {};
  const myScores = data?.my_scores || {};
  const myBreakdown = data?.my_breakdown || {};
  const myRanks = data?.my_ranks || {};
  const compactLeaderboards = data?.leaderboards || {};
  const leaders = data?.leaders || {};
  const selectedRiderType = data?.profile?.rider_type || null;
  const currentStage = data?.stage;
  const selectedMeta = JERSEY_META[selectedJersey] || JERSEY_META.yellow;
  const selectedLeaderboard = expandedLeaderboards[selectedJersey] || compactLeaderboards[selectedJersey] || [];
  const selectedRank = myRanks[selectedJersey] || null;
  const selectedEntryBreakdown = selectedLeaderboardEntry?.breakdown?.[selectedJersey] || null;
  const selectedBreakdown = selectedEntryBreakdown || myBreakdown[selectedJersey] || {};
  const selectedBreakdownUser = selectedEntryBreakdown ? selectedLeaderboardEntry : selectedRank;
  const selectedLeader = leaders[selectedJersey]?.official || null;
  const selectedRawLeader = leaders[selectedJersey]?.raw || null;

  useEffect(() => {
    if (!data?.my_scores) return;
    const bestJersey = SCORE_KEYS.reduce((best, key) => (
      Number(data.my_scores[key] || 0) > Number(data.my_scores[best] || 0) ? key : best
    ), 'yellow');
    setSelectedJersey(Number(data.my_scores[bestJersey] || 0) > 0 ? bestJersey : 'yellow');
  }, [data?.campaign?.phase]);

  useEffect(() => {
    setSelectedLeaderboardEntry(null);
  }, [selectedJersey, data?.campaign?.phase]);

  useEffect(() => {
    if (!expandedInfo) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (event.target?.closest?.('[data-tour-info]')) {
        return;
      }
      setExpandedInfo(null);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setExpandedInfo(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [expandedInfo]);

  const phaseLabel = useMemo(() => {
    if (phase === 'pre') return 'Vorabphase';
    if (phase === 'active') return 'Aktionsphase';
    if (phase === 'results') return 'Ergebnisse';
    return 'Demnächst';
  }, [phase]);

  const handleSelectRider = async (riderType) => {
    if (!isLoggedIn) {
      onLogin?.();
      return;
    }
    setMessage('');
    try {
      const nextData = await selectTourDeGlaceRiderType(authToken, riderType);
      setState({ loading: false, error: '', data: nextData });
      setMessage(selectedRiderType ? 'Fahrertyp gewechselt.' : 'Fahrertyp gespeichert.');
    } catch (error) {
      setMessage(error.message || 'Fahrertyp konnte nicht gespeichert werden.');
    }
  };

  const handleTipChange = (key, value) => {
    setTips((previous) => ({ ...previous, [key]: value }));
  };

  const handleSubmitTips = async (event) => {
    event.preventDefault();
    if (!isLoggedIn) {
      onLogin?.();
      return;
    }
    setMessage('');
    try {
      await submitTourDeGlaceTips(authToken, tips);
      setMessage('Tipps gespeichert.');
      await load();
    } catch (error) {
      setMessage(error.message || 'Tipps konnten nicht gespeichert werden.');
    }
  };

  const handleLoadMoreLeaderboard = async () => {
    setLeaderboardLoading(true);
    setMessage('');
    try {
      const result = await fetchTourDeGlaceLeaderboard(authToken, selectedJersey, 20);
      setExpandedLeaderboards((previous) => ({
        ...previous,
        [selectedJersey]: result.leaderboard || [],
      }));
    } catch (error) {
      setMessage(error.message || 'Ranking konnte nicht geladen werden.');
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const toggleInfo = (key) => {
    setExpandedInfo((previous) => (previous === key ? null : key));
  };

  return (
    <PanelSection>
      <HeaderRow>
        <div>
          <SectionTitle>Tour de Glace 2026</SectionTitle>
          <Lead>Fahrertyp wählen, Tipps abgeben und während der Tour Punkte für fünf Trikots sammeln.</Lead>
        </div>
        <Badge><Flag size={16} /> {phaseLabel}</Badge>
      </HeaderRow>

      {!isLoggedIn && (
        <GuestBox>
          <strong>Login erforderlich für Teilnahme.</strong>
          <p>Regeln und Ranglisten sind sichtbar, Punkte, Tipps und Easter-Eggs werden nach dem Login gespeichert.</p>
          <ActionButton type="button" onClick={onLogin}>Login / Registrieren</ActionButton>
        </GuestBox>
      )}

      {state.loading && <Hint>Lade Tour de Glace...</Hint>}
      {state.error && <Hint>{state.error}</Hint>}
      {message && <Message>{message}</Message>}

      {data && (
        <>
          <Tabs>
            {[
              ['overview', 'Übersicht'],
              ['rider', 'Fahrertyp'],
              ['tips', 'Tippspiel'],
              ['eggs', 'Easter-Eggs'],
              ['awards', 'Awards'],
              ['rules', 'Regeln'],
            ].map(([key, label]) => (
              <TabButton key={key} type="button" $active={activeTab === key} onClick={() => setActiveTab(key)}>
                {label}
              </TabButton>
            ))}
          </Tabs>

          {activeTab === 'overview' && (
            <Stack>
              <InfoBand>
                <strong>{formatDateTime(data.campaign.start)} bis {formatDateTime(data.campaign.end)}</strong>
                <span>{selectedRiderType ? `Dein Fahrertyp: ${riderTypes[selectedRiderType]?.name || selectedRiderType}` : 'Noch kein Fahrertyp gewählt'}</span>
              </InfoBand>
              {currentStage && (
                <StageBox>
                  <Bike size={18} />
                  <span>Etappe {currentStage.stage_number}: {currentStage.start} → {currentStage.finish}</span>
                </StageBox>
              )}
              <ScoreGrid>
                {SCORE_KEYS.map((key) => (
                  <ScoreTile
                    key={key}
                    role="button"
                    tabIndex={0}
                    $color={JERSEY_META[key].color}
                    $active={selectedJersey === key}
                    onClick={() => setSelectedJersey(key)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedJersey(key);
                      }
                    }}
                  >
                    <ScoreHeader>
                      <small>{JERSEY_META[key].label}</small>
                      <InfoHint
                        id={`score-${key}`}
                        label={`Info zu ${JERSEY_META[key].label}`}
                        text={JERSEY_DETAILS[key]}
                        expandedInfo={expandedInfo}
                        onToggle={toggleInfo}
                      />
                    </ScoreHeader>
                    <JerseyImageWrap>
                      <JerseyImage
                        src={JERSEY_META[key].image}
                        alt=""
                        onLoad={(event) => {
                          const fallback = event.currentTarget.nextElementSibling;
                          if (fallback) fallback.style.display = 'none';
                        }}
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                      <JerseyFallback $color={JERSEY_META[key].color}><Shirt size={22} /></JerseyFallback>
                    </JerseyImageWrap>
                    <strong>{myScores[key] || 0} EP</strong>
                    <ScoreMeta>{myRanks[key] ? `Du: #${myRanks[key].rank}` : 'Noch kein Rang'}</ScoreMeta>
                    <ScoreMeta>
                      {leaders[key]?.official
                        ? `Träger: ${leaders[key].official.username}`
                        : leaders[key]?.raw
                          ? `Rechnerisch: ${leaders[key].raw.username}`
                          : 'Noch offen'}
                    </ScoreMeta>
                  </ScoreTile>
                ))}
              </ScoreGrid>
              <JerseyDetailPanel $color={selectedMeta.color}>
                <DetailHeader>
                  <DetailTitleGroup>
                    <DetailJerseyImage
                      src={selectedMeta.image}
                      alt=""
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                    />
                    <DetailTitle>{selectedMeta.label}-Wertung</DetailTitle>
                    <DetailLead>{JERSEY_EXPLANATIONS[selectedJersey]}</DetailLead>
                  </DetailTitleGroup>
                  <InfoHint
                    id={`detail-${selectedJersey}`}
                    label="Wertungsdetails anzeigen"
                    text={`${JERSEY_DETAILS[selectedJersey]} Fahrertypen verändern diese Tour-Punkte je nach Aktionstyp. ${NEXT_ACTIONS[selectedJersey]}`}
                    expandedInfo={expandedInfo}
                    onToggle={toggleInfo}
                  />
                </DetailHeader>

                <DetailGrid>
                  <BreakdownSection>
                    <SubHeading>
                      {selectedEntryBreakdown
                        ? `Punkte von ${selectedLeaderboardEntry.username}`
                        : 'Deine Punkte'}
                    </SubHeading>
                    {!isLoggedIn ? (
                      <EmptyState>Logge dich ein, um deine Punkteaufschlüsselung und deinen Rang zu sehen.</EmptyState>
                    ) : Object.keys(selectedBreakdown).length > 0 ? (
                      <BreakdownList>
                        {Object.entries(selectedBreakdown)
                          .sort(([, left], [, right]) => Number(right) - Number(left))
                          .map(([actionType, points]) => (
                            <BreakdownRow key={actionType}>
                              <span>{ACTION_LABELS[actionType] || actionType}</span>
                              <strong>+{points}</strong>
                            </BreakdownRow>
                          ))}
                      </BreakdownList>
                    ) : (
                      <EmptyState>Noch keine Punkte in {selectedMeta.label}. {NEXT_ACTIONS[selectedJersey]}</EmptyState>
                    )}
                    {selectedBreakdownUser && (
                      <CurrentRank>
                        {selectedEntryBreakdown ? selectedLeaderboardEntry.username : 'Du'}: #{selectedBreakdownUser.rank}, {selectedBreakdownUser.points} Punkte
                      </CurrentRank>
                    )}
                  </BreakdownSection>

                  <RankingSection>
                    <RankingHeading>
                      <SubHeading>Ranking</SubHeading>
                      <InfoHint
                        id="officialLeader"
                        label="Info zum offiziellen Trikotträger"
                        text={INFO_TEXTS.officialLeader}
                        expandedInfo={expandedInfo}
                        onToggle={toggleInfo}
                      />
                    </RankingHeading>
                    {selectedLeaderboard.length > 0 ? (
                      <RankingList>
                        {selectedLeaderboard.map((entry) => (
                          <RankingRow
                            key={`${selectedJersey}-${entry.user_id}`}
                            type="button"
                            $highlight={selectedRank?.user_id === entry.user_id}
                            $selected={selectedLeaderboardEntry?.user_id === entry.user_id}
                            onClick={() => setSelectedLeaderboardEntry(entry)}
                          >
                            <span>#{entry.rank}</span>
                            <strong>{entry.username}</strong>
                            <span>{entry.points}</span>
                          </RankingRow>
                        ))}
                      </RankingList>
                    ) : (
                      <EmptyState>In dieser Wertung gibt es noch keine Einträge.</EmptyState>
                    )}
                    {selectedRank && !selectedLeaderboard.some((entry) => entry.user_id === selectedRank.user_id) && (
                      <CurrentRank>Du: #{selectedRank.rank}, {selectedRank.points} Punkte</CurrentRank>
                    )}
                    {selectedLeaderboard.length < 20 && (
                      <SecondaryButton type="button" disabled={leaderboardLoading} onClick={handleLoadMoreLeaderboard}>
                        {leaderboardLoading ? 'Lade...' : 'Mehr anzeigen'}
                      </SecondaryButton>
                    )}
                    {selectedLeader && selectedRawLeader && selectedLeader.user_id !== selectedRawLeader.user_id && (
                      <InlineInfo>Offiziell: {selectedLeader.username}. Rechnerisch: {selectedRawLeader.username}.</InlineInfo>
                    )}
                  </RankingSection>
                </DetailGrid>
              </JerseyDetailPanel>
            </Stack>
          )}

          {activeTab === 'rider' && (
            <Stack>
              <InfoBand>
                <strong>Bis zu 3 Wechsel möglich</strong>
                <span>Noch {data.profile?.rider_type_changes_remaining ?? 3} Wechsel übrig.</span>
              </InfoBand>
              <RiderGrid>
                {Object.entries(riderTypes).map(([key, rider]) => (
                  <RiderCard key={key} $active={selectedRiderType === key}>
                    <RiderTitleRow>
                      <strong>{rider.name}</strong>
                      <InfoHint id={`rider-${key}`} label={`Info zu ${rider.name}`} expandedInfo={expandedInfo} onToggle={toggleInfo}>
                        <strong>{rider.name}</strong>
                        <p>{RIDER_DETAILS[key]}</p>
                        <small>{INFO_TEXTS.multipliers}</small>
                        <OverlayMultiplierList>
                          {Object.entries(rider.multipliers || {})
                            .filter(([, value]) => Number(value) !== 1)
                            .map(([name, value]) => (
                              <span key={name}>{name}: {value}x</span>
                            ))}
                        </OverlayMultiplierList>
                      </InfoHint>
                    </RiderTitleRow>
                    <p>{rider.description}</p>
                    <ActionButton
                      type="button"
                      disabled={selectedRiderType === key || (data.profile && (data.profile.rider_type_changes_remaining ?? 0) <= 0)}
                      onClick={() => handleSelectRider(key)}
                    >
                      {selectedRiderType === key ? 'Gewählt' : selectedRiderType ? 'Wechseln' : 'Auswählen'}
                    </ActionButton>
                  </RiderCard>
                ))}
              </RiderGrid>
            </Stack>
          )}

          {activeTab === 'tips' && (
            <TipForm onSubmit={handleSubmitTips}>
              <Hint>Tipps können bis 03.07.2026, 23:59 Uhr geändert werden.</Hint>
              {[
                ['tip_gc_winner', 'Gesamtwertung Platz 1'],
                ['tip_gc_second', 'Gesamtwertung Platz 2'],
                ['tip_gc_third', 'Gesamtwertung Platz 3'],
                ['tip_green_winner', 'Grünes Trikot'],
                ['tip_mountain_winner', 'Bergtrikot'],
                ['tip_white_winner', 'Weißes Trikot'],
              ].map(([key, label]) => (
                <label key={key}>
                  <span>{label}</span>
                  <input value={tips[key] || ''} onChange={(event) => handleTipChange(key, event.target.value)} />
                </label>
              ))}
              <ActionButton type="submit">Tipps speichern</ActionButton>
            </TipForm>
          )}

          {activeTab === 'eggs' && (
            <Stack>
              <InfoBand>
                <strong>{data.found_easter_eggs || 0} Easter-Eggs gefunden</strong>
                <span>Etappen-Easter-Eggs bleiben 48 Stunden verfügbar.</span>
              </InfoBand>
              {data.easter_egg ? (
                <EggBox>
                  <Search size={20} />
                  <div>
                    <strong>Etappe {data.easter_egg.stage_number}: {data.easter_egg.start_location} → {data.easter_egg.finish_location}</strong>
                    <p>{data.easter_egg.found ? 'Heute bereits gefunden.' : data.easter_egg.hint_text}</p>
                    {!data.easter_egg.found && (
                      <Hint>Öffne die Karte und sammle den Tour-Marker am Etappenziel ein.</Hint>
                    )}
                  </div>
                </EggBox>
              ) : (
                <Hint>Aktuell ist kein Etappen-Easter-Egg verfügbar.</Hint>
              )}
            </Stack>
          )}

          {activeTab === 'awards' && (
            <AwardGrid>
              <AwardItem><Trophy size={18} /><span>Etappenstarter</span><small>an 1 Etappentag aktiv</small></AwardItem>
              <AwardItem><Trophy size={18} /><span>Etappenjäger</span><small>an 7 Etappentagen aktiv</small></AwardItem>
              <AwardItem><Trophy size={18} /><span>Grand Tour Finisher</span><small>an 15 Etappentagen aktiv</small></AwardItem>
              <AwardItem><IceCreamBowl size={18} /><span>Goldene Kugel</span><small>Gewinner Eiscreme-Trikot</small></AwardItem>
              <AwardItem><Search size={18} /><span>Tour-Spürnase</span><small>3 Easter-Eggs gefunden</small></AwardItem>
              <AwardItem><Flag size={18} /><span>App-Orakel</span><small>mindestens einen Tipp richtig</small></AwardItem>
            </AwardGrid>
          )}

          {activeTab === 'rules' && (
            <Stack>
              <RulesList>
                <li>Punkte zählen nur während der aktiven Tourphase; ein Fahrertyp ist optional.</li>
                <li>Die Tabelle zeigt die Basiswerte. Mit Fahrertyp werden passende Multiplikatoren auf Tour-Punkte angewendet, ohne Fahrertyp gilt Faktor 1,0.</li>
                <li>Multiplikatoren gelten nur für Tour-Punkte, nicht für normale App-EP oder bestehende Awards.</li>
                <li>Der Fahrertyp kann nach der ersten Auswahl noch bis zu 3 mal gewechselt werden.</li>
                <li>Das Weiße Trikot zählt nur für Nutzer mit weniger als 5 Check-ins vor dem 04.07.2026.</li>
                <li>Am Ende kann ein Nutzer nur ein offizielles Haupttrikot gewinnen.</li>
                <li>Tippspiel-Punkte bleiben eine Nebenwertung und beeinflussen die Trikots nicht.</li>
              </RulesList>

              <PointRulesWrap>
                <SubHeading>Punkte je Aktion</SubHeading>
                <PointRulesTable>
                  <thead>
                    <tr>
                      <th>Aktion</th>
                      <th>Gelb</th>
                      <th>Grün</th>
                      <th>Berg</th>
                      <th>Eiscreme</th>
                      <th>Weiß</th>
                      <th>Limit / Hinweis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {POINT_RULES.map((rule) => (
                      <tr key={rule.action}>
                        <td>{rule.action}</td>
                        <td>{rule.yellow || '-'}</td>
                        <td>{rule.green || '-'}</td>
                        <td>{rule.mountain || '-'}</td>
                        <td>{rule.ice || '-'}</td>
                        <td>{rule.white || '-'}</td>
                        <td>{rule.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </PointRulesTable>
              </PointRulesWrap>
            </Stack>
          )}
        </>
      )}
    </PanelSection>
  );
};

export default TourDeGlacePanel;

const PanelSection = styled.section`
  background: #ffffff;
  border-radius: 12px;
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
  color: #202124;
`;

const Lead = styled.p`
  margin: 0;
  color: #5b6270;
  line-height: 1.45;
`;

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  background: #eef5ff;
  color: #17436f;
  padding: 0.4rem 0.7rem;
  font-weight: 800;
  white-space: nowrap;
`;

const GuestBox = styled.div`
  margin-top: 0.85rem;
  padding: 0.85rem;
  border-radius: 10px;
  background: #fff8ea;
  color: #4d3500;

  p {
    margin: 0.35rem 0 0;
    line-height: 1.4;
  }
`;

const ActionButton = styled.button`
  border: none;
  border-radius: 8px;
  padding: 0.6rem 0.85rem;
  background: #1f6feb;
  color: #ffffff;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    cursor: default;
    opacity: 0.55;
  }
`;

const Hint = styled.p`
  margin: 0.75rem 0 0;
  color: #5b6270;
`;

const Message = styled(Hint)`
  color: #14532d;
  font-weight: 800;
`;

const Tabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 1rem;
`;

const TabButton = styled.button`
  border: 1px solid ${({ $active }) => ($active ? '#1f6feb' : '#d7dce4')};
  border-radius: 8px;
  background: ${({ $active }) => ($active ? '#eaf2ff' : '#ffffff')};
  color: #202124;
  padding: 0.45rem 0.65rem;
  font-weight: 800;
  cursor: pointer;
`;

const Stack = styled.div`
  display: grid;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const InfoBand = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.6rem;
  border-radius: 10px;
  background: #f5f7fb;
  padding: 0.75rem;
  color: #303746;
`;

const StageBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #17436f;
  font-weight: 800;
`;

const ScoreGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.5rem;

  @media (max-width: 560px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const ScoreTile = styled.div`
  border-radius: 8px;
  border: 1px solid #d7dce4;
  border-top: 5px solid ${({ $color }) => $color};
  padding: 0.65rem;
  text-align: center;
  background: ${({ $active }) => ($active ? '#f5f7fb' : '#ffffff')};
  box-shadow: ${({ $active }) => ($active ? '0 0 0 2px rgba(31, 111, 235, 0.18)' : 'none')};
  cursor: pointer;
  font: inherit;
  color: inherit;

  small {
    display: block;
    color: #5b6270;
    font-weight: 800;
  }

  strong {
    display: block;
    margin-top: 0.2rem;
    font-size: 1.3rem;
  }

  &:hover {
    border-color: #aeb9c8;
  }

  &:focus-visible {
    outline: 3px solid rgba(31, 111, 235, 0.35);
    outline-offset: 2px;
  }
`;

const ScoreHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.35rem;
  align-items: center;
`;

const ScoreMeta = styled.span`
  display: block;
  margin-top: 0.22rem;
  color: #5b6270;
  font-size: 0.78rem;
  font-weight: 700;
`;

const InfoButton = styled.button`
  width: 1.8rem;
  height: 1.8rem;
  border: 1px solid #cfd6df;
  border-radius: 999px;
  background: #ffffff;
  color: #303746;
  display: inline-grid;
  place-items: center;
  cursor: pointer;
  flex: 0 0 auto;

  &:hover {
    background: #eef5ff;
    border-color: #9db9e8;
  }
`;

const InfoWrap = styled.span`
  position: relative;
  display: inline-flex;
`;

const InfoOverlay = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 10050;
  width: min(360px, calc(100vw - 2rem));
  max-width: calc(100vw - 2rem);
  max-height: min(72vh, 520px);
  overflow-y: auto;
  border: 1px solid #cfe0ff;
  border-radius: 8px;
  background: #ffffff;
  color: #17436f;
  box-shadow: 0 10px 26px rgba(23, 67, 111, 0.18);
  padding: 0.65rem 0.75rem;
  transform: translate(-50%, -50%);
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.4;
  text-align: left;

  p {
    margin: 0.35rem 0 0;
  }

  small {
    display: block;
    margin-top: 0.45rem;
    color: #426284;
    line-height: 1.35;
  }

  @media (max-width: 520px) {
    top: auto;
    right: 1rem;
    left: 1rem;
    bottom: 1rem;
    width: auto;
    max-height: min(70vh, 420px);
    transform: none;
  }
`;

const InlineInfo = styled.div`
  margin-top: 0.55rem;
  border-radius: 8px;
  background: #eef5ff;
  color: #17436f;
  padding: 0.6rem 0.7rem;
  font-size: 0.88rem;
  line-height: 1.4;
`;

const JerseyImageWrap = styled.div`
  position: relative;
  width: min(104px, 100%);
  aspect-ratio: 1 / 1;
  margin: 0.55rem auto 0;
  display: grid;
  place-items: center;
`;

const JerseyFallback = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: white;
  color: #202124;
  opacity: 0.92;
`;

const JerseyImage = styled.img`
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
`;

const JerseyDetailPanel = styled.section`
  border-radius: 10px;
  border: 1px solid #d7dce4;
  border-top: 5px solid ${({ $color }) => $color};
  padding: 0.9rem;
`;

const DetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-start;
`;

const DetailTitleGroup = styled.div`
  display: grid;
  grid-template-columns: minmax(92px, 120px) 1fr;
  gap: 0.15rem 0.8rem;
  align-items: center;
  min-width: 0;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }
`;

const DetailJerseyImage = styled.img`
  grid-row: span 2;
  width: min(120px, 32vw);
  height: min(120px, 32vw);
  object-fit: contain;
  display: block;
`;

const DetailTitle = styled.h4`
  margin: 0;
  color: #202124;
  font-size: 1rem;
`;

const DetailLead = styled.p`
  margin: 0.3rem 0 0;
  color: #5b6270;
  line-height: 1.4;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1rem;
  margin-top: 0.9rem;

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const BreakdownSection = styled.div``;

const RankingSection = styled.div``;

const SubHeading = styled.h5`
  margin: 0 0 0.55rem;
  color: #202124;
  font-size: 0.9rem;
`;

const BreakdownList = styled.div`
  display: grid;
  gap: 0.4rem;
`;

const BreakdownRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  border-radius: 8px;
  background: #f5f7fb;
  padding: 0.5rem 0.6rem;
`;

const EmptyState = styled.div`
  border-radius: 8px;
  background: #f5f7fb;
  color: #5b6270;
  padding: 0.65rem;
  line-height: 1.4;
`;

const CurrentRank = styled.div`
  margin-top: 0.6rem;
  border-radius: 8px;
  background: #fff8ea;
  color: #4d3500;
  padding: 0.5rem 0.6rem;
  font-weight: 800;
`;

const RankingHeading = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: center;
`;

const RankingList = styled.div`
  display: grid;
  gap: 0.35rem;
`;

const RankingRow = styled.button`
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  gap: 0.5rem;
  align-items: center;
  width: 100%;
  border: 1px solid ${({ $selected }) => ($selected ? '#1f6feb' : 'transparent')};
  border-radius: 8px;
  background: ${({ $highlight, $selected }) => ($selected ? '#eef5ff' : ($highlight ? '#fff8ea' : '#f5f7fb'))};
  color: #202124;
  padding: 0.5rem 0.6rem;
  font: inherit;
  text-align: left;
  cursor: pointer;

  strong {
    overflow-wrap: anywhere;
  }

  &:hover {
    border-color: #9db9e8;
  }

  &:focus-visible {
    outline: 3px solid rgba(31, 111, 235, 0.35);
    outline-offset: 2px;
  }
`;

const SecondaryButton = styled.button`
  margin-top: 0.65rem;
  border: 1px solid #cfd6df;
  border-radius: 8px;
  background: #ffffff;
  color: #202124;
  padding: 0.5rem 0.75rem;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

const RiderGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
`;

const RiderCard = styled.article`
  border: 1px solid ${({ $active }) => ($active ? '#1f6feb' : '#d7dce4')};
  border-radius: 8px;
  padding: 0.85rem;
  background: ${({ $active }) => ($active ? '#eaf2ff' : '#ffffff')};

  p {
    min-height: 3rem;
    color: #5b6270;
  }
`;

const RiderTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: center;
`;

const OverlayMultiplierList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.65rem;

  span {
    border-radius: 999px;
    background: #f5f7fb;
    color: #303746;
    padding: 0.22rem 0.45rem;
    font-size: 0.78rem;
    font-weight: 800;
  }
`;

const TipForm = styled.form`
  display: grid;
  gap: 0.75rem;
  margin-top: 1rem;

  label {
    display: grid;
    gap: 0.3rem;
    color: #303746;
    font-weight: 800;
  }

  input {
    border: 1px solid #cfd6df;
    border-radius: 8px;
    padding: 0.6rem 0.7rem;
    font: inherit;
  }
`;

const EggBox = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.75rem;
  align-items: flex-start;
  border-radius: 10px;
  background: #f5f7fb;
  padding: 0.85rem;

  p {
    margin: 0.35rem 0 0;
    color: #5b6270;
  }
`;

const RulesList = styled.ul`
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding-left: 1.2rem;
  color: #303746;
`;

const PointRulesWrap = styled.div`
  overflow-x: auto;
  border: 1px solid #d7dce4;
  border-radius: 10px;
  padding: 0.8rem;
  background: #ffffff;
`;

const PointRulesTable = styled.table`
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
  font-size: 0.86rem;

  th,
  td {
    padding: 0.5rem;
    border-bottom: 1px solid #edf0f4;
    text-align: center;
  }

  th:first-child,
  td:first-child {
    min-width: 190px;
    text-align: left;
  }

  th:last-child,
  td:last-child {
    min-width: 150px;
    color: #5b6270;
    text-align: left;
  }

  th {
    background: #f5f7fb;
    color: #303746;
    font-weight: 800;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
`;

const AwardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
`;

const AwardItem = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.25rem 0.5rem;
  align-items: center;
  border: 1px solid #d7dce4;
  border-radius: 8px;
  padding: 0.75rem;

  span {
    font-weight: 800;
  }

  small {
    grid-column: 2;
    color: #5b6270;
  }
`;
