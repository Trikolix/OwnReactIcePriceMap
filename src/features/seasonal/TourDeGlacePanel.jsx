import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Bike, Flag, Info, Search, Shirt } from 'lucide-react';
import { CAMPAIGN_STATUS } from './campaigns';
import {
  fetchTourDeGlaceProgress,
  fetchTourDeGlaceLeaderboard,
  selectTourDeGlaceRiderType,
  submitTourDeGlaceStageTip,
  submitTourDeGlaceTips,
} from './tourDeGlaceApi';
import { TOUR_DE_GLACE_STARTERS, getTourDeGlaceStarterSuggestions } from './tourDeGlaceStarters';
import { useUser } from '../../context/UserContext';
import { getAwardIconSources, handleAwardIconFallback } from '../../utils/awardIcons';

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
  easter_egg: 'Etappensichtungen',
  group_checkin: 'Gruppen-Check-ins',
  route: 'Routen',
  referral: 'Geworbene Nutzer',
  challenge_completed: 'Challenges abgeschlossen',
  team_challenge_completed: 'Team-Challenges abgeschlossen',
  photo_vote: 'Foto-Votes',
};
const MULTIPLIER_LABELS = {
  daily: 'Tagesbesuche',
  likes: 'Likes',
  comments: 'Kommentare',
  checkins: 'Check-ins',
  bike: 'Fahrrad',
  routes: 'Routen',
  reviews: 'Bewertungen',
  profile: 'Profil',
  easter: 'Etappensichtungen',
  groups: 'Gruppenaktionen',
  referrals: 'Geworbene Nutzer',
  challenges: 'Challenges',
};
const JERSEY_EXPLANATIONS = {
  yellow: 'Gesamtwertung: Check-ins, Fotos, Fahrrad-Anreise, Bewertungen, Gruppenaktionen und Routen zahlen reduziert ein.',
  green: 'Sprintwertung: täglicher Besuch, Likes, Kommentare, Etappensichtungen und geworbene Nutzer bringen Punkte.',
  mountain: 'Bergwertung: Fahrrad-Anreise, Gruppen-Check-ins und Routen sind hier stark.',
  ice: 'Genusswertung: echte Eis-Check-ins, Fotos, neue Eisdielen und Bewertungen zählen besonders.',
  white: 'Nachwuchswertung: zählt nur für Nutzer mit weniger als 5 Check-ins vor Tourstart und belohnt erste Aktionen.',
};
const JERSEY_DETAILS = {
  yellow: 'Das Gelbe Trikot ist die Allround-Wertung. Es sammelt reduzierte Punkte aus vielen Bereichen und belohnt konstant aktive Nutzer.',
  green: 'Das Grüne Trikot ist die Sprintwertung. Es ist für tägliche App-Aktivität, Community-Interaktion und Einladungen gedacht, auch ohne jeden Tag Eis zu essen.',
  mountain: 'Das Bergtrikot belohnt Fahrrad-Anreise und sportliche Tour-Aktionen. Fahrradbonus und Routen wirken hier besonders stark.',
  ice: 'Das Eiscreme-Trikot ist die Genusswertung. Check-ins, Fotos, neue Eisdielen und Bewertungen zahlen hier besonders ein.',
  white: 'Das Weiße Trikot ist die Nachwuchswertung. Es zählt nur für Nutzer mit weniger als 5 Check-ins vor dem Tourstart.',
};
const NEXT_ACTIONS = {
  yellow: 'Mach einen Check-in, ergänze ein Foto, schreibe eine Bewertung oder reiche eine Route ein.',
  green: 'Öffne die Tour täglich, like Beiträge, kommentiere sinnvoll, sichte die Tagesetappe oder wirb neue Nutzer.',
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
  { action: 'Etappe gesichtet', yellow: 0, green: 10, mountain: 0, ice: 0, white: 0, note: '1x pro Etappentag' },
  { action: 'Neuen Nutzer geworben', yellow: 40, green: 100, mountain: 0, ice: 0, white: 80, note: 'nach Account-Verifizierung' },
  { action: 'Challenge abgeschlossen', yellow: 25, green: 5, mountain: 25, ice: 0, white: 35, note: 'beste 3 Challenges gesamt' },
  { action: 'Team-Challenge abgeschlossen', yellow: 40, green: 10, mountain: 55, ice: 0, white: 50, note: 'beste 3 Challenges gesamt' },
  { action: 'Check-in: Kugel oder Softeis', yellow: 10, green: 0, mountain: 0, ice: 20, white: 30, note: 'unlimitiert' },
  { action: 'Check-in: Eisbecher', yellow: 10, green: 0, mountain: 0, ice: 25, white: 30, note: 'unlimitiert' },
  { action: 'Check-in mit Foto', yellow: 3, green: 0, mountain: 0, ice: 10, white: 20, note: 'Zusatzpunkte' },
  { action: 'Neue Eisdiele beim Check-in', yellow: 0, green: 0, mountain: 0, ice: 15, white: 0, note: 'erstmals von dir besucht' },
  { action: 'Fahrrad-Anreise', yellow: 5, green: 0, mountain: 25, ice: 5, white: 0, note: 'unlimitiert' },
  { action: 'Gruppen-Check-in', yellow: 8, green: 3, mountain: 10, ice: 0, white: 10, note: 'Zusatzpunkte' },
  { action: 'Profilbild vorhanden', yellow: 0, green: 10, mountain: 0, ice: 0, white: 0, note: 'einmalig' },
  { action: 'Bewertung', yellow: 8, green: 0, mountain: 0, ice: 8, white: 20, note: 'max. 10 im Aktionszeitraum' },
  { action: 'Route eingereicht', yellow: 10, green: 0, mountain: 30, ice: 0, white: 0, note: 'max. 3 im Aktionszeitraum' },
];
const TIP_POINT_RULES = [
  ['Gesamtwertung Platz 1 exakt', '50 Punkte'],
  ['Gesamtwertung Platz 2 exakt', '25 Punkte'],
  ['Gesamtwertung Platz 3 exakt', '25 Punkte'],
  ['Fahrer in realer Top 3, aber falsche Position', '10 Punkte'],
  ['Grünes Trikot exakt', '35 Punkte'],
  ['Bergtrikot exakt', '35 Punkte'],
  ['Weißes Trikot exakt', '35 Punkte'],
];
const TIP_FIELDS = [
  ['tip_gc_winner', 'Gesamtwertung Platz 1'],
  ['tip_gc_second', 'Gesamtwertung Platz 2'],
  ['tip_gc_third', 'Gesamtwertung Platz 3'],
  ['tip_green_winner', 'Gr\u00fcnes Trikot'],
  ['tip_mountain_winner', 'Bergtrikot'],
  ['tip_white_winner', 'Wei\u00dfes Trikot'],
];
const OVERALL_TIP_FIELD_LABELS = Object.fromEntries(TIP_FIELDS);
const OVERALL_TIP_OUTCOMES = {
  exact: 'Exakt getroffen',
  top3_wrong_position: 'Top 3, falsche Position',
  miss: 'Kein Treffer',
  no_tip: 'Kein Tipp abgegeben',
};
const STAGE_TIP_OUTCOMES = {
  exact: 'Etappensieger getroffen',
  top10: 'Top 10 getroffen',
  miss: 'Nicht in den Top 10',
};
const GC_TIP_KEYS = ['tip_gc_winner', 'tip_gc_second', 'tip_gc_third'];
const normalizeTipName = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('de-DE');
const getTrendDisplay = (rankChange, rankDelta) => {
  if (rankChange === 'up') {
    return { symbol: '\u2191', label: `${rankDelta || 1}`, tone: 'up' };
  }
  if (rankChange === 'down') {
    return { symbol: '\u2193', label: `${rankDelta || 1}`, tone: 'down' };
  }
  if (rankChange === 'same') {
    return { symbol: '=', label: '', tone: 'same' };
  }
  if (rankChange === 'new') {
    return { symbol: 'Neu', label: '', tone: 'new' };
  }
  return null;
};
const RankTrend = ({ trend }) => {
  if (!trend) {
    return null;
  }
  return (
    <RankTrendBadge $tone={trend.tone}>
      <span>{trend.symbol}</span>
      {trend.label && <small>{trend.label}</small>}
    </RankTrendBadge>
  );
};

const AWARD_SHORT_DESCRIPTIONS = {
  '72-1': 'an 3 Etappentagen aktiv',
  '72-2': 'an 7 Etappentagen aktiv',
  '72-3': 'an 15 Etappentagen aktiv',
  '73-1': '3 Etappen gesichtet',
};
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
const formatStageStart = (value) => {
  if (!value) return '';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
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

const MIN_RIDER_SUGGEST_CHARS = 2;

const RiderSuggestInput = ({ id, label, value, onChange, disabled = false }) => {
  const [focused, setFocused] = useState(false);
  const canSuggest = value.trim().length >= MIN_RIDER_SUGGEST_CHARS;
  const suggestions = canSuggest ? getTourDeGlaceStarterSuggestions(value, 8) : [];
  const showSuggestions = focused && TOUR_DE_GLACE_STARTERS.length > 0 && suggestions.length > 0;

  return (
    <TipField htmlFor={id}>
      <span>{label}</span>
      <SuggestWrap>
        <input
          id={id}
          value={value}
          autoComplete="off"
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
        />
        {!disabled && showSuggestions && (
          <SuggestList>
            {suggestions.map((starter) => (
              <SuggestOption
                key={`${starter.name}-${starter.team}`}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(starter.name);
                  setFocused(false);
                }}
              >
                <strong>{starter.name}</strong>
                <span>{starter.team}</span>
              </SuggestOption>
            ))}
          </SuggestList>
        )}
      </SuggestWrap>
    </TipField>
  );
};

const TourDeGlacePanel = ({ campaign, isLoggedIn, onLogin, archived = false }) => {
  const { authToken } = useUser();
  const [activeTab, setActiveTab] = useState('overview');
  const [state, setState] = useState({ loading: false, error: '', data: null });
  const [tips, setTips] = useState({});
  const [stageTips, setStageTips] = useState({});
  const [savingStageTip, setSavingStageTip] = useState(null);
  const [message, setMessage] = useState('');
  const [selectedJersey, setSelectedJersey] = useState('yellow');
  const [selectedLeaderboardEntry, setSelectedLeaderboardEntry] = useState(null);
  const [selectedOverallTipEntry, setSelectedOverallTipEntry] = useState(null);
  const [selectedStageTipEntry, setSelectedStageTipEntry] = useState(null);
  const [selectedAward, setSelectedAward] = useState(null);
  const [expandedInfo, setExpandedInfo] = useState(null);
  const [expandedLeaderboards, setExpandedLeaderboards] = useState({});
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [overallTipLeaderboardState, setOverallTipLeaderboardState] = useState({ loading: false, error: '', entries: null });
  const [stageTipLeaderboardState, setStageTipLeaderboardState] = useState({ loading: false, error: '', entries: null });

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
      setStageTips(Object.fromEntries((data?.stage_tips || []).map((tip) => [
        String(tip.stage_number),
        tip.tip_stage_winner || '',
      ])));
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
          setStageTips(Object.fromEntries((data?.stage_tips || []).map((tip) => [
            String(tip.stage_number),
            tip.tip_stage_winner || '',
          ])));
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
  const pointRules = Array.isArray(data?.point_rules) && data.point_rules.length > 0 ? data.point_rules : POINT_RULES;
  const myScores = data?.my_scores || {};
  const myBreakdown = data?.my_breakdown || {};
  const myRanks = data?.my_ranks || {};
  const compactLeaderboards = data?.leaderboards || {};
  const leaders = data?.leaders || {};
  const stageTipSummary = data?.stage_tip_summary || {};
  const stageTipRank = data?.stage_tip_rank || null;
  const stageTipLeaderboard = stageTipLeaderboardState.entries || compactLeaderboards.stage_tips || [];
  const overallTipSummary = data?.overall_tip_summary || null;
  const overallTipRank = data?.overall_tip_rank || null;
  const overallTipLeaderboard = overallTipLeaderboardState.entries || compactLeaderboards.overall_tips || [];
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
  const officialPhase = data?.campaign?.official_phase || phase;
  const isPreviewPhase = officialPhase === 'pre';
  const canUseTourActions = officialPhase === 'active' || Boolean(data?.campaign?.shadow_test);
  const tipDeadline = data?.campaign?.tip_deadline
    ? new Date(String(data.campaign.tip_deadline).replace(' ', 'T'))
    : null;
  const tipsClosed = tipDeadline instanceof Date
    && !Number.isNaN(tipDeadline.getTime())
    && new Date() > tipDeadline;
  const tipsReadOnly = tipsClosed || Boolean(data?.final_results);
  const duplicateTipNames = useMemo(() => {
    const seen = new Map();
    const duplicates = new Set();
    GC_TIP_KEYS.forEach((key) => {
      const rawName = String(tips[key] || '').trim().replace(/\s+/g, ' ');
      if (!rawName) {
        return;
      }
      const normalizedName = normalizeTipName(rawName);
      if (seen.has(normalizedName)) {
        duplicates.add(seen.get(normalizedName));
      } else {
        seen.set(normalizedName, rawName);
      }
    });
    return Array.from(duplicates);
  }, [tips]);
  const hasDuplicateTips = duplicateTipNames.length > 0;
  const duplicateTipMessage = hasDuplicateTips
    ? `Ein Fahrer darf in der Gesamtwertung nur einmal auf Platz 1, 2 oder 3 getippt werden. Doppelt: ${duplicateTipNames.join(', ')}.`
    : '';

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
    if (!data?.final_results || activeTab !== 'tips') {
      return undefined;
    }

    let cancelled = false;
    setOverallTipLeaderboardState({ loading: true, error: '', entries: null });
    fetchTourDeGlaceLeaderboard(authToken, 'overall_tips', 0)
      .then((result) => {
        if (!cancelled) {
          setOverallTipLeaderboardState({ loading: false, error: '', entries: result.leaderboard || [] });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setOverallTipLeaderboardState({
            loading: false,
            error: error.message || 'Tippspiel-Rangliste konnte nicht geladen werden.',
            entries: null,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, authToken, data?.final_results]);

  useEffect(() => {
    if (!data?.final_results || activeTab !== 'eggs') {
      return undefined;
    }

    let cancelled = false;
    setStageTipLeaderboardState({ loading: true, error: '', entries: null });
    fetchTourDeGlaceLeaderboard(authToken, 'stage_tips', 0)
      .then((result) => {
        if (!cancelled) {
          setStageTipLeaderboardState({ loading: false, error: '', entries: result.leaderboard || [] });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setStageTipLeaderboardState({
            loading: false,
            error: error.message || 'Etappentipp-Rangliste konnte nicht geladen werden.',
            entries: null,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, authToken, data?.final_results]);

  useEffect(() => {
    if (!data?.final_results) {
      setOverallTipLeaderboardState({ loading: false, error: '', entries: null });
      setSelectedOverallTipEntry(null);
      setStageTipLeaderboardState({ loading: false, error: '', entries: null });
      setSelectedStageTipEntry(null);
    }
  }, [data?.final_results]);

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

  const handleStageTipChange = (stageNumber, value) => {
    setStageTips((previous) => ({ ...previous, [String(stageNumber)]: value }));
  };

  const handleSubmitStageTip = async (stageNumber) => {
    if (!isLoggedIn) {
      onLogin?.();
      return;
    }
    setMessage('');
    const tipValue = String(stageTips[String(stageNumber)] || '').trim();
    if (!tipValue) {
      setMessage('Bitte gib einen Etappensieger ein.');
      return;
    }
    setSavingStageTip(stageNumber);
    try {
      await submitTourDeGlaceStageTip(authToken, stageNumber, tipValue);
      setMessage(`Etappentipp ${stageNumber} gespeichert.`);
      await load();
    } catch (error) {
      setMessage(error.message || 'Etappentipp konnte nicht gespeichert werden.');
    } finally {
      setSavingStageTip(null);
    }
  };

  const handleSubmitTips = async (event) => {
    event.preventDefault();
    if (!isLoggedIn) {
      onLogin?.();
      return;
    }
    setMessage('');
    if (hasDuplicateTips) {
      setMessage(duplicateTipMessage);
      return;
    }
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
          <Lead>{archived
            ? 'Der komplette Tour-Rückblick mit offiziellen Ergebnissen, Ranglisten, Tippspiel und Awards.'
            : 'Fahrertyp wählen, Tipps abgeben und während der Tour Punkte für fünf Trikots sammeln.'}</Lead>
        </div>
        <Badge><Flag size={16} /> {phaseLabel}</Badge>
      </HeaderRow>

      {!isLoggedIn && !archived && (
        <GuestBox>
          <strong>Login erforderlich für Teilnahme.</strong>
          <p>Regeln und Ranglisten sind sichtbar, Punkte, Tipps und Etappensichtungen werden nach dem Login gespeichert.</p>
          <ActionButton type="button" onClick={onLogin}>Login / Registrieren</ActionButton>
        </GuestBox>
      )}

      {archived && (
        <ArchiveIntro>
          <strong>Tour beendet · Ergebnisarchiv</strong>
          <span>Die Aktionspunkte, offiziellen Trikotwertungen und Tippspiel-Ergebnisse bleiben als Nachlese erhalten. Neue Punkte und Tipps können nicht mehr abgegeben werden.</span>
        </ArchiveIntro>
      )}

      {state.loading && <Hint>Lade Tour de Glace...</Hint>}
      {state.error && <Hint>{state.error}</Hint>}
      {message && <Message>{message}</Message>}

      {data && (
        <>
          <Tabs>
            {[
              ['overview', 'Übersicht'],
              ...(!archived ? [['rider', 'Fahrertyp']] : []),
              ['tips', 'Tippspiel'],
              ['eggs', 'Sichtungen'],
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
                <span>{archived ? 'Abgeschlossenes Ergebnisarchiv' : selectedRiderType ? `Dein Fahrertyp: ${riderTypes[selectedRiderType]?.name || selectedRiderType}` : 'Noch kein Fahrertyp gewählt'}</span>
              </InfoBand>
              {archived && data.final_results && (
                <FinalResultsBox>
                  <SubHeading>Offizielle Tour-Ergebnisse</SubHeading>
                  <FinalResultsGrid>
                    <FinalResultItem $accent={JERSEY_META.yellow.color}>
                      <span>Gesamtwertung</span>
                      <strong>1. {data.final_results.result_gc_winner}</strong>
                      <small>2. {data.final_results.result_gc_second} · 3. {data.final_results.result_gc_third}</small>
                    </FinalResultItem>
                    <FinalResultItem $accent={JERSEY_META.green.color}>
                      <span>Grünes Trikot</span>
                      <strong>{data.final_results.result_green_winner}</strong>
                    </FinalResultItem>
                    <FinalResultItem $accent={JERSEY_META.mountain.color}>
                      <span>Bergtrikot</span>
                      <strong>{data.final_results.result_mountain_winner}</strong>
                    </FinalResultItem>
                    <FinalResultItem $accent={JERSEY_META.white.color}>
                      <span>Weißes Trikot</span>
                      <strong>{data.final_results.result_white_winner}</strong>
                    </FinalResultItem>
                  </FinalResultsGrid>
                </FinalResultsBox>
              )}
              {isPreviewPhase && (
                <PreviewBox>
                  <strong>Preview bis zum Tourstart</strong>
                  <span>Das Tippspiel ist geöffnet. Die erste Etappensichtung ist bereits sichtbar; Punktewertung und Tagesaktionen starten am 04.07.2026 um 00:00 Uhr.</span>
                </PreviewBox>
              )}
              <GroupRideBox>
                <Bike size={18} />
                <span>Der geplante Group-Ride zum Finale der Aktion am 26.07 musste leider krankheitsbedingt abgesagt werden.</span>
              </GroupRideBox>
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
                            $interactive
                            $highlight={selectedRank?.user_id === entry.user_id}
                            $selected={selectedLeaderboardEntry?.user_id === entry.user_id}
                            onClick={() => setSelectedLeaderboardEntry(entry)}
                          >
                            <RankCell>
                              <span>#{entry.rank}</span>
                              <RankTrend trend={getTrendDisplay(entry.rank_change, entry.rank_delta)} />
                            </RankCell>
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
                <span>{canUseTourActions ? `Noch ${data.profile?.rider_type_changes_remaining ?? 3} Wechsel übrig.` : 'Auswahl und Wechsel sind ab dem Tourstart möglich.'}</span>
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
                              <span key={name}>{MULTIPLIER_LABELS[name] || name}: {value}x</span>
                            ))}
                        </OverlayMultiplierList>
                      </InfoHint>
                    </RiderTitleRow>
                    <p>{rider.description}</p>
                    <ActionButton
                      type="button"
                      disabled={!canUseTourActions || selectedRiderType === key || (data.profile && (data.profile.rider_type_changes_remaining ?? 0) <= 0)}
                      onClick={() => handleSelectRider(key)}
                    >
                      {!canUseTourActions ? 'Ab Tourstart' : selectedRiderType === key ? 'Gewählt' : selectedRiderType ? 'Wechseln' : 'Auswählen'}
                    </ActionButton>
                  </RiderCard>
                ))}
              </RiderGrid>
            </Stack>
          )}

          {activeTab === 'tips' && (
            <Stack>
              {data.final_results && (
                <StageTipLeaderboardBox>
                  <div>
                    <SubHeading>Gesamtwertung ausgewertet</SubHeading>
                    <Hint>Die offiziellen Gesamt- und Trikot-Ergebnisse sind eingetragen. Diese Punkte zählen nur für das Tippspiel.</Hint>
                  </div>
                  <StageTipSummaryGrid>
                    <SummaryTile>
                      <span>Deine Tipp-Punkte</span>
                      <strong>{overallTipSummary?.points || 0}</strong>
                      <small>{overallTipRank ? `Rang #${overallTipRank.rank}` : 'Kein Tipp abgegeben'}</small>
                    </SummaryTile>
                    <SummaryTile>
                      <span>Exakte Treffer</span>
                      <strong>{overallTipSummary?.exact_hits || 0}</strong>
                      <small>GC und Trikots</small>
                    </SummaryTile>
                    <SummaryTile>
                      <span>GC Top 3</span>
                      <strong>{overallTipSummary?.gc_top3_hits || 0}</strong>
                      <small>richtige Fahrer</small>
                    </SummaryTile>
                  </StageTipSummaryGrid>
                  <Hint>Bei gleicher Punktzahl wird der Platz geteilt.</Hint>
                  {overallTipLeaderboardState.loading && <Hint>Vollständige Tipp-Rangliste wird geladen...</Hint>}
                  {overallTipLeaderboardState.error && <Hint>{overallTipLeaderboardState.error}</Hint>}
                  {!overallTipLeaderboardState.loading && !overallTipLeaderboardState.error && overallTipLeaderboard.length > 0 && (
                    <StageTipRankingList>
                      {overallTipLeaderboard.map((entry) => (
                        <RankingRow
                          key={`overall-tip-${entry.user_id}`}
                          type="button"
                          $interactive
                          onClick={() => setSelectedOverallTipEntry(entry)}
                        >
                          <RankCell><span>#{entry.rank}</span></RankCell>
                          <strong>{entry.username}</strong>
                          <span>{entry.points} Punkte</span>
                        </RankingRow>
                      ))}
                    </StageTipRankingList>
                  )}
                  {!overallTipLeaderboardState.loading && !overallTipLeaderboardState.error && overallTipLeaderboard.length === 0 && (
                    <Hint>Es wurden noch keine Tipps abgegeben.</Hint>
                  )}
                </StageTipLeaderboardBox>
              )}
              <TipForm onSubmit={handleSubmitTips}>
              <TipHeader>
                <SubHeading>{data.final_results ? 'Deine abgegebenen Tipps' : 'Tippspiel'}</SubHeading>
                <InfoHint id="tip-point-rules" label="Punkte-Regeln für das Tippspiel anzeigen" expandedInfo={expandedInfo} onToggle={toggleInfo}>
                  <strong>Punkte-Regeln</strong>
                  <TipRulesList>
                    {TIP_POINT_RULES.map(([rule, points]) => (
                      <li key={rule}>
                        <span>{rule}</span>
                        <strong>{points}</strong>
                      </li>
                    ))}
                  </TipRulesList>
                  <small>Bei gleicher Punktzahl wird der Platz geteilt.</small>
                </InfoHint>
              </TipHeader>
              <Hint>
                {data.final_results
                  ? 'Die Tipps sind ausgewertet und können nicht mehr geändert werden.'
                  : tipsClosed
                  ? 'Die Tippabgabe ist geschlossen.'
                  : 'Tipps können bis 04.07.2026, 16:30 Uhr geändert werden.'}
              </Hint>
              {duplicateTipMessage && <Hint>{duplicateTipMessage}</Hint>}
              {TIP_FIELDS.map(([key, label]) => (
                <RiderSuggestInput
                  key={key}
                  id={`tour-tip-${key}`}
                  label={label}
                  value={tips[key] || ''}
                  onChange={(value) => handleTipChange(key, value)}
                  disabled={tipsReadOnly}
                />
              ))}
                {!data.final_results && (
                  <ActionButton type="submit" disabled={tipsReadOnly || hasDuplicateTips}>Tipps speichern</ActionButton>
                )}
              </TipForm>
            </Stack>
          )}

          {activeTab === 'eggs' && (
            <Stack>
              <InfoBand>
                <strong>{data.found_easter_eggs || 0} Etappen gesichtet</strong>
                <span>{data.sighted_stages?.length ? 'Deine gesichteten Etappen' : 'Noch keine Etappe gesichtet'}</span>
              </InfoBand>
              {data.sighted_stages?.length > 0 && (
                <SightedStageList>
                  {data.sighted_stages.map((stage) => (
                    <SightedStageItem key={stage.id || stage.stage_number}>
                      <strong>Etappe {stage.stage_number}</strong>
                      <span>{stage.start_location} → {stage.finish_location}</span>
                    </SightedStageItem>
                  ))}
                </SightedStageList>
              )}
              {data.easter_egg ? (
                <EggBox>
                  <Search size={20} />
                  <div>
                    <strong>Etappe {data.easter_egg.stage_number}: {data.easter_egg.start_location} → {data.easter_egg.finish_location}</strong>
                    <p>{data.easter_egg.found ? 'Diese Etappe hast du bereits gesichtet.' : data.easter_egg.hint_text}</p>
                    {!data.easter_egg.found && (
                      <Hint>Öffne die Karte und tippe den Tour-Marker am Etappenziel an.</Hint>
                    )}
                  </div>
                </EggBox>
              ) : (
                <Hint>Aktuell ist keine Etappensichtung verfügbar.</Hint>
              )}
              <StageTipLeaderboardBox>
                <div>
                  <SubHeading>Directeur Sportif</SubHeading>
                  <Hint>Tippe für jede Etappe einen Fahrer bei dem du denkst, dass er die Etappe gewinnt. Falls er gewinnt bekommst du 100 Punkte. Aber auch wenn er in den Top 10 landet, erhälst du Punkte.</Hint>
                </div>
              <StageTipSummaryGrid>
                  <SummaryTile>
                    <span>Deine Tipp-EP</span>
                    <strong>{stageTipSummary.points || 0}</strong>
                    <small>{stageTipRank ? `Rang #${stageTipRank.rank}` : 'Noch kein Rang'}</small>
                  </SummaryTile>
                  <SummaryTile>
                    <span>Sieger</span>
                    <strong>{stageTipSummary.winner_hits || 0}</strong>
                    <small>exakte Treffer</small>
                  </SummaryTile>
                  <SummaryTile>
                    <span>Top 10</span>
                    <strong>{stageTipSummary.top10_hits || 0}</strong>
                    <small>gewertete Tipps</small>
                </SummaryTile>
              </StageTipSummaryGrid>
              {data.final_results && <Hint>Bei gleicher EP-Zahl wird der Platz geteilt.</Hint>}
              {data.final_results && stageTipLeaderboardState.loading && <Hint>Vollständige Etappentipp-Rangliste wird geladen...</Hint>}
              {data.final_results && stageTipLeaderboardState.error && <Hint>{stageTipLeaderboardState.error}</Hint>}
                {(!data.final_results || (!stageTipLeaderboardState.loading && !stageTipLeaderboardState.error)) && stageTipLeaderboard.length > 0 && (
                  <StageTipRankingList>
                    {stageTipLeaderboard.map((entry) => (
                      <RankingRow
                        key={`stage-tip-${entry.user_id}`}
                        as={data.final_results ? undefined : 'div'}
                        type={data.final_results ? 'button' : undefined}
                        $interactive={Boolean(data.final_results)}
                        onClick={data.final_results ? () => setSelectedStageTipEntry(entry) : undefined}
                      >
                        <RankCell>
                          <span>#{entry.rank}</span>
                          <RankTrend trend={getTrendDisplay(entry.rank_change, entry.rank_delta)} />
                        </RankCell>
                        <strong>{entry.username}</strong>
                        <span>{entry.points} EP</span>
                      </RankingRow>
                    ))}
                  </StageTipRankingList>
                )}
              {data.final_results && !stageTipLeaderboardState.loading && !stageTipLeaderboardState.error && stageTipLeaderboard.length === 0 && (
                <Hint>Es wurden noch keine Etappentipps abgegeben.</Hint>
              )}
              </StageTipLeaderboardBox>
              <StageTipsPanel>
                <SubHeading>Etappensieger tippen</SubHeading>
                <Hint>Jeder Etappentipp kann bis zum Start der jeweiligen Etappe gespeichert werden.</Hint>
                <StageTipList>
                  {(data.stage_tips || []).map((stageTip) => {
                    const stageNumber = Number(stageTip.stage_number);
                    const closed = Boolean(stageTip.closed);
                    const value = stageTips[String(stageNumber)] ?? stageTip.tip_stage_winner ?? '';
                    return (
                      <StageTipItem key={stageNumber} $closed={closed}>
                        <StageTipMeta>
                          <strong>Etappe {stageNumber}</strong>
                          <span>{stageTip.start_location} → {stageTip.finish_location}</span>
                          <small>Start: {formatStageStart(stageTip.start_at)}</small>
                          {stageTip.has_result && (
                            <StageTipStatus $correct={Boolean(stageTip.scored)}>
                              {stageTip.scored
                                ? `#${stageTip.predicted_rank} · ${stageTip.base_ep} EP${stageTip.egg_bonus_ep ? ` + ${stageTip.egg_bonus_ep} Egg = ${stageTip.final_ep} EP` : ''}`
                                : `Sieger: ${stageTip.stage_winner} · 0 EP`}
                            </StageTipStatus>
                          )}
                        </StageTipMeta>
                        <StageTipControls>
                          <RiderSuggestInput
                            id={`tour-stage-tip-${stageNumber}`}
                            label="Etappensieger"
                            value={value}
                            onChange={(nextValue) => handleStageTipChange(stageNumber, nextValue)}
                            disabled={closed || savingStageTip === stageNumber}
                          />
                          <ActionButton
                            type="button"
                            disabled={closed || savingStageTip === stageNumber || !String(value).trim()}
                            onClick={() => handleSubmitStageTip(stageNumber)}
                          >
                            {closed ? 'Geschlossen' : savingStageTip === stageNumber ? 'Speichert...' : 'Speichern'}
                          </ActionButton>
                        </StageTipControls>
                      </StageTipItem>
                    );
                  })}
                </StageTipList>
              </StageTipsPanel>
            </Stack>
          )}

          {activeTab === 'awards' && (
            <AwardGrid>
              {data.awards?.length ? data.awards.map((award) => {
                const iconSources = getAwardIconSources(award.icon_path, 512);
                return (
                  <AwardItem
                    key={`${award.award_id}-${award.level}`}
                    type="button"
                    $achieved={Boolean(award.achieved)}
                    onClick={() => setSelectedAward({ ...award, iconSources })}
                  >
                    <AwardImageWrap $achieved={Boolean(award.achieved)}>
                      {iconSources.src ? (
                        <AwardImage
                          src={iconSources.src}
                          data-fallback-src={iconSources.fallbackSrc || ''}
                          onError={handleAwardIconFallback}
                          loading="lazy"
                          decoding="async"
                          alt={award.title_de || 'Award'}
                        />
                      ) : (
                        <Search size={22} />
                      )}
                    </AwardImageWrap>
                    <span>{award.title_de}</span>
                    <small>{AWARD_SHORT_DESCRIPTIONS[`${award.award_id}-${award.level}`] || award.description_de}</small>
                    <AwardStatus $achieved={Boolean(award.achieved)}>
                      {award.achieved ? 'Erreicht' : `Noch offen${award.threshold ? ` · Schwelle ${award.threshold}` : ''}`}
                    </AwardStatus>
                  </AwardItem>
                );
              }) : (
                <Hint>Award-Daten konnten noch nicht geladen werden.</Hint>
              )}
            </AwardGrid>
          )}

          {selectedAward && (
            <AwardDetailOverlay onClick={() => setSelectedAward(null)}>
              <AwardDetailCard
                role="dialog"
                aria-modal="true"
                aria-labelledby="tour-award-detail-title"
                onClick={(event) => event.stopPropagation()}
              >
                <AwardDetailClose type="button" onClick={() => setSelectedAward(null)} aria-label="Award-Details schließen">
                  ×
                </AwardDetailClose>
                <AwardDetailImageWrap $achieved={Boolean(selectedAward.achieved)}>
                  {selectedAward.iconSources?.src ? (
                    <AwardDetailImage
                      src={selectedAward.iconSources.src}
                      data-fallback-src={selectedAward.iconSources.fallbackSrc || ''}
                      onError={handleAwardIconFallback}
                      alt={selectedAward.title_de || 'Award'}
                    />
                  ) : (
                    <Search size={54} />
                  )}
                </AwardDetailImageWrap>
                <AwardDetailText>
                  <AwardStatus $achieved={Boolean(selectedAward.achieved)}>
                    {selectedAward.achieved ? 'Erreicht' : `Noch offen${selectedAward.threshold ? ` · Schwelle ${selectedAward.threshold}` : ''}`}
                  </AwardStatus>
                  <h3 id="tour-award-detail-title">{selectedAward.title_de}</h3>
                  <p>{selectedAward.description_de || 'Keine Beschreibung vorhanden.'}</p>
                  {selectedAward.awarded_at && (
                    <small>Vergeben am {new Date(selectedAward.awarded_at).toLocaleDateString()}</small>
                  )}
                </AwardDetailText>
              </AwardDetailCard>
            </AwardDetailOverlay>
          )}

          {selectedOverallTipEntry && (
            <AwardDetailOverlay onClick={() => setSelectedOverallTipEntry(null)}>
              <OverallTipDetailCard
                role="dialog"
                aria-modal="true"
                aria-labelledby="tour-overall-tip-detail-title"
                onClick={(event) => event.stopPropagation()}
              >
                <AwardDetailClose type="button" onClick={() => setSelectedOverallTipEntry(null)} aria-label="Tipp-Details schließen">
                  ×
                </AwardDetailClose>
                <OverallTipDetailHeader>
                  <div>
                    <h3 id="tour-overall-tip-detail-title">{selectedOverallTipEntry.username}</h3>
                    <span>Rang #{selectedOverallTipEntry.rank}</span>
                  </div>
                  <strong>{selectedOverallTipEntry.points} Punkte</strong>
                </OverallTipDetailHeader>
                <StageTipSummaryGrid>
                  <SummaryTile>
                    <span>Exakte Treffer</span>
                    <strong>{selectedOverallTipEntry.exact_hits || 0}</strong>
                    <small>GC und Trikots</small>
                  </SummaryTile>
                  <SummaryTile>
                    <span>GC Top 3</span>
                    <strong>{selectedOverallTipEntry.gc_top3_hits || 0}</strong>
                    <small>richtige Fahrer</small>
                  </SummaryTile>
                </StageTipSummaryGrid>
                <OverallTipBreakdownList>
                  {(selectedOverallTipEntry.breakdown || []).map((item) => (
                    <OverallTipBreakdownRow key={item.key} $points={Number(item.points || 0)}>
                      <div>
                        <strong>{OVERALL_TIP_FIELD_LABELS[item.key] || item.key}</strong>
                        <span>Tipp: {item.tip || 'Kein Tipp abgegeben'}</span>
                        <span>Ergebnis: {item.result || '-'}</span>
                      </div>
                      <div>
                        <strong>{item.points || 0} Punkte</strong>
                        <small>{OVERALL_TIP_OUTCOMES[item.outcome] || 'Nicht gewertet'}</small>
                      </div>
                    </OverallTipBreakdownRow>
                  ))}
                </OverallTipBreakdownList>
              </OverallTipDetailCard>
            </AwardDetailOverlay>
          )}

          {selectedStageTipEntry && (
            <AwardDetailOverlay onClick={() => setSelectedStageTipEntry(null)}>
              <OverallTipDetailCard
                role="dialog"
                aria-modal="true"
                aria-labelledby="tour-stage-tip-detail-title"
                onClick={(event) => event.stopPropagation()}
              >
                <AwardDetailClose type="button" onClick={() => setSelectedStageTipEntry(null)} aria-label="Etappentipp-Details schließen">
                  ×
                </AwardDetailClose>
                <OverallTipDetailHeader>
                  <div>
                    <h3 id="tour-stage-tip-detail-title">{selectedStageTipEntry.username}</h3>
                    <span>Rang #{selectedStageTipEntry.rank}</span>
                  </div>
                  <strong>{selectedStageTipEntry.points} EP</strong>
                </OverallTipDetailHeader>
                <StageTipSummaryGrid>
                  <SummaryTile>
                    <span>Sieger</span>
                    <strong>{selectedStageTipEntry.winner_hits || 0}</strong>
                    <small>exakte Treffer</small>
                  </SummaryTile>
                  <SummaryTile>
                    <span>Top 3</span>
                    <strong>{selectedStageTipEntry.top3_hits || 0}</strong>
                    <small>richtige Fahrer</small>
                  </SummaryTile>
                  <SummaryTile>
                    <span>Top 10</span>
                    <strong>{selectedStageTipEntry.top10_hits || 0}</strong>
                    <small>gewertete Tipps</small>
                  </SummaryTile>
                </StageTipSummaryGrid>
                <OverallTipBreakdownList>
                  {(selectedStageTipEntry.breakdown || []).map((item) => (
                    <OverallTipBreakdownRow key={item.stage_number} $points={Number(item.points || 0)}>
                      <div>
                        <strong>Etappe {item.stage_number}</strong>
                        {item.start_location && item.finish_location && <span>{item.start_location} → {item.finish_location}</span>}
                        <span>Tipp: {item.tip || 'Kein Tipp abgegeben'}</span>
                        <span>Sieger: {item.result || '-'}</span>
                      </div>
                      <div>
                        <strong>{item.points || 0} EP</strong>
                        <small>
                          {STAGE_TIP_OUTCOMES[item.outcome] || 'Nicht gewertet'}
                          {item.predicted_rank ? ` · Platz #${item.predicted_rank}` : ''}
                          {item.egg_bonus_ep ? ` · +${item.egg_bonus_ep} Egg` : ''}
                        </small>
                      </div>
                    </OverallTipBreakdownRow>
                  ))}
                </OverallTipBreakdownList>
              </OverallTipDetailCard>
            </AwardDetailOverlay>
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
                    {pointRules.map((rule) => (
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

const ArchiveIntro = styled.div`
  display: grid;
  gap: 0.25rem;
  margin-top: 0.85rem;
  border: 1px solid #cbdcf3;
  border-radius: 10px;
  background: #f3f8ff;
  color: #17436f;
  padding: 0.85rem;

  span {
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

const FinalResultsBox = styled.section`
  display: grid;
  gap: 0.7rem;
  border: 1px solid #d7dce4;
  border-radius: 10px;
  background: #ffffff;
  padding: 0.85rem;
`;

const FinalResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
  gap: 0.55rem;
`;

const FinalResultItem = styled.div`
  display: grid;
  gap: 0.2rem;
  border-left: 4px solid ${({ $accent }) => $accent};
  border-radius: 7px;
  background: #f7f8fa;
  padding: 0.6rem 0.65rem;

  span,
  small {
    color: #5b6270;
  }

  span {
    font-size: 0.78rem;
    font-weight: 800;
  }

  strong {
    color: #202124;
    overflow-wrap: anywhere;
  }

  small {
    line-height: 1.35;
  }
`;

const PreviewBox = styled(InfoBand)`
  background: #fff7e6;
  border: 1px solid #f4d38c;
  color: #6f4b00;
`;

const StageBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #17436f;
  font-weight: 800;
`;

const GroupRideBox = styled(StageBox)`
  border-radius: 10px;
  background: #f7eded;
  border: 1px solid #e6c8c8;
  color: #89261d;
  padding: 0.75rem;
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
  grid-template-columns: minmax(70px, auto) minmax(0, 1fr) auto;
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
  cursor: ${({ $interactive }) => ($interactive ? 'pointer' : 'default')};
  transition: background 0.16s ease, border-color 0.16s ease, transform 0.16s ease;

  strong {
    overflow-wrap: anywhere;
  }

  ${({ $interactive }) => $interactive && `
    &:hover {
      border-color: #78a8e7;
      background: #eef5ff;
      transform: translateY(-1px);
    }
  `}

  &:active {
    transform: ${({ $interactive }) => ($interactive ? 'translateY(0)' : 'none')};
  }

  &:focus-visible {
    outline: 3px solid rgba(31, 111, 235, 0.35);
    outline-offset: 2px;
  }
`;

const RankCell = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
`;

const RankTrendBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  min-width: 1.9rem;
  border-radius: 999px;
  padding: 0.12rem 0.35rem;
  font-size: 0.7rem;
  font-weight: 900;
  background: ${({ $tone }) => {
    if ($tone === 'up') return 'rgba(15, 124, 47, 0.12)';
    if ($tone === 'down') return 'rgba(191, 38, 0, 0.12)';
    if ($tone === 'new') return 'rgba(255, 181, 34, 0.18)';
    if ($tone === 'same') return 'rgba(30, 64, 175, 0.14)';
    return 'rgba(47, 33, 0, 0.08)';
  }};
  color: ${({ $tone }) => {
    if ($tone === 'up') return '#0f7c2f';
    if ($tone === 'down') return '#bf2600';
    if ($tone === 'new') return '#8a5a00';
    if ($tone === 'same') return '#1d4ed8';
    return '#6f5b3a';
  }};

  small {
    font-size: 0.66rem;
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

  input {
    width: 100%;
    border: 1px solid #cfd6df;
    border-radius: 8px;
    padding: 0.6rem 0.7rem;
    font: inherit;
    box-sizing: border-box;
  }
`;

const TipHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;

  ${SubHeading} {
    margin: 0;
  }
`;

const TipField = styled.label`
  display: grid;
  gap: 0.3rem;
  color: #303746;
  font-weight: 800;
`;

const SuggestWrap = styled.div`
  position: relative;
`;

const SuggestList = styled.div`
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  right: 0;
  z-index: 30;
  display: grid;
  gap: 0.2rem;
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid #cfd6df;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 10px 24px rgba(24, 39, 75, 0.14);
  padding: 0.3rem;
`;

const SuggestOption = styled.button`
  display: grid;
  gap: 0.12rem;
  width: 100%;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #202124;
  padding: 0.45rem 0.55rem;
  text-align: left;
  cursor: pointer;

  strong {
    font-size: 0.92rem;
  }

  span {
    color: #5b6270;
    font-size: 0.8rem;
    font-weight: 700;
  }

  &:hover,
  &:focus-visible {
    background: #eef5ff;
    outline: none;
  }
`;

const TipRulesList = styled.ul`
  display: grid;
  gap: 0.35rem;
  margin: 0.55rem 0 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    border-radius: 6px;
    background: #f5f7fb;
    color: #303746;
    padding: 0.35rem 0.45rem;
  }
`;

const SightedStageList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
`;

const SightedStageItem = styled.div`
  display: grid;
  gap: 0.1rem;
  border: 1px solid #d7dce4;
  border-radius: 8px;
  background: #ffffff;
  padding: 0.5rem 0.65rem;

  strong {
    color: #202124;
    font-size: 0.86rem;
  }

  span {
    color: #5b6270;
    font-size: 0.78rem;
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

const StageTipLeaderboardBox = styled.section`
  display: grid;
  gap: 0.75rem;
  border: 1px solid #d7dce4;
  border-radius: 10px;
  background: #ffffff;
  padding: 0.85rem;

  ${Hint} {
    margin-top: 0;
  }
`;

const StageTipSummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.55rem;
`;

const SummaryTile = styled.div`
  display: grid;
  gap: 0.12rem;
  border: 1px solid #e1e5eb;
  border-radius: 8px;
  background: #f7f8fa;
  padding: 0.65rem;

  span,
  small {
    color: #5b6270;
    font-weight: 700;
  }

  strong {
    color: #202124;
    font-size: 1.35rem;
  }
`;

const StageTipRankingList = styled.div`
  display: grid;
  gap: 0.35rem;
`;

const StageTipsPanel = styled.section`
  border: 1px solid #d7dce4;
  border-radius: 10px;
  background: #ffffff;
  padding: 0.85rem;

  ${Hint} {
    margin-top: 0;
  }
`;

const StageTipList = styled.div`
  display: grid;
  gap: 0.65rem;
  margin-top: 0.8rem;
`;

const StageTipItem = styled.article`
  display: grid;
  grid-template-columns: minmax(190px, 0.7fr) minmax(0, 1fr);
  gap: 0.75rem;
  border: 1px solid ${({ $closed }) => ($closed ? '#e1e5eb' : '#cfe0ff')};
  border-radius: 8px;
  background: ${({ $closed }) => ($closed ? '#f7f8fa' : '#fafdff')};
  padding: 0.7rem;

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const StageTipMeta = styled.div`
  display: grid;
  align-content: start;
  gap: 0.18rem;

  strong {
    color: #202124;
  }

  span,
  small {
    color: #5b6270;
    font-weight: 700;
  }
`;

const StageTipControls = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.55rem;
  align-items: end;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const StageTipStatus = styled.strong`
  justify-self: start;
  border-radius: 999px;
  background: ${({ $correct }) => ($correct ? '#dcfce7' : '#fff3cd')};
  color: ${({ $correct }) => ($correct ? '#166534' : '#6f4b00')};
  padding: 0.18rem 0.48rem;
  font-size: 0.76rem;
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
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
`;

const AwardItem = styled.button`
  display: grid;
  grid-template-columns: 82px 1fr;
  gap: 0.3rem 0.75rem;
  align-items: start;
  width: 100%;
  border: 1px solid ${({ $achieved }) => ($achieved ? '#6ec58d' : '#d7dce4')};
  border-radius: 8px;
  background: ${({ $achieved }) => ($achieved ? '#effaf2' : '#ffffff')};
  color: #303746;
  padding: 0.75rem;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover,
  &:focus-visible {
    border-color: ${({ $achieved }) => ($achieved ? '#43a967' : '#aeb7c4')};
    box-shadow: 0 8px 20px rgba(31, 77, 44, 0.1);
    outline: none;
    transform: translateY(-1px);
  }

  span {
    font-weight: 800;
  }

  small {
    grid-column: 2;
    color: inherit;
    line-height: 1.35;
  }
`;

const AwardImageWrap = styled.div`
  grid-row: span 3;
  width: 76px;
  height: 76px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #f3f5f8;
  color: #7a828e;
  overflow: hidden;
  filter: ${({ $achieved }) => ($achieved ? 'none' : 'grayscale(1)')};
  opacity: ${({ $achieved }) => ($achieved ? 1 : 0.48)};
`;

const AwardImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AwardStatus = styled.strong`
  grid-column: 2;
  justify-self: start;
  border-radius: 999px;
  background: ${({ $achieved }) => ($achieved ? '#2d8f47' : '#e2e5ea')};
  color: ${({ $achieved }) => ($achieved ? '#ffffff' : '#68707c')};
  padding: 0.18rem 0.5rem;
  font-size: 0.72rem;
`;

const AwardDetailOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2500;
  display: grid;
  place-items: center;
  background: rgba(22, 28, 38, 0.58);
  padding: 1rem;
`;

const AwardDetailCard = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: minmax(150px, 220px) minmax(0, 1fr);
  gap: 1.25rem;
  width: min(720px, 100%);
  max-height: min(84vh, 680px);
  overflow-y: auto;
  border-radius: 12px;
  background: #ffffff;
  padding: 1.25rem;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
    justify-items: center;
    padding: 1rem;
  }
`;

const OverallTipDetailCard = styled.div`
  position: relative;
  display: grid;
  gap: 0.75rem;
  width: min(640px, 100%);
  max-height: min(78vh, 620px);
  overflow-y: auto;
  border: 1px solid #d7dce4;
  border-radius: 8px;
  background: #ffffff;
  padding: 1rem;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.26);

  @media (max-width: 520px) {
    width: min(100%, 460px);
    max-height: 84vh;
    padding: 0.9rem;
  }
`;

const OverallTipDetailHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding-right: 2rem;

  h3,
  p {
    margin: 0;
  }

  h3 {
    color: #202124;
  }

  span {
    color: #5b6270;
    font-weight: 700;
  }

  > strong {
    color: #202124;
    font-size: 1.2rem;
    white-space: nowrap;
  }
`;

const OverallTipBreakdownList = styled.div`
  display: grid;
  gap: 0.5rem;
`;

const OverallTipBreakdownRow = styled.article`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.8rem;
  align-items: center;
  border: 1px solid ${({ $points }) => ($points > 0 ? '#b8dfc2' : '#e1e5eb')};
  border-radius: 8px;
  background: ${({ $points }) => ($points > 0 ? '#f2fbf4' : '#f7f8fa')};
  padding: 0.65rem;

  > div {
    display: grid;
    gap: 0.16rem;
    min-width: 0;
  }

  > div:last-child {
    justify-items: end;
    text-align: right;
  }

  strong {
    color: #202124;
  }

  span,
  small {
    color: #5b6270;
    overflow-wrap: anywhere;
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;

    > div:last-child {
      justify-items: start;
      text-align: left;
    }
  }
`;

const AwardDetailClose = styled.button`
  position: absolute;
  top: 0.55rem;
  right: 0.65rem;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #eef1f5;
  color: #303746;
  font-size: 1.45rem;
  line-height: 1;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background: #dce3ec;
    outline: none;
  }
`;

const AwardDetailImageWrap = styled.div`
  display: grid;
  place-items: center;
  align-self: start;
  width: min(220px, 72vw);
  aspect-ratio: 1;
  border-radius: 12px;
  background: #f3f5f8;
  color: #7a828e;
  overflow: hidden;
  filter: ${({ $achieved }) => ($achieved ? 'none' : 'grayscale(1)')};
  opacity: ${({ $achieved }) => ($achieved ? 1 : 0.52)};
`;

const AwardDetailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AwardDetailText = styled.div`
  display: grid;
  align-content: start;
  gap: 0.7rem;
  padding-right: 1.6rem;

  h3 {
    margin: 0;
    color: #202124;
    font-size: clamp(1.25rem, 4vw, 1.8rem);
  }

  p {
    margin: 0;
    color: #303746;
    line-height: 1.55;
    white-space: pre-line;
  }

  small {
    color: #5b6270;
    font-weight: 700;
  }

  ${AwardStatus} {
    grid-column: auto;
  }

  @media (max-width: 620px) {
    padding-right: 0;
  }
`;
