import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarDays, MapPinned, Plus, RefreshCcw, Trophy } from 'lucide-react';
import Header from '../Header';
import LoginModal from '../LoginModal';
import Seo from '../components/Seo';
import { useUser } from '../context/UserContext';
import TeamChallengesPanel from '../components/TeamChallengesPanel';
import ChallengeMap from '../components/ChallengeMap';
import { ChallengeDialog } from '../components/ChallengeUI';
import { Action, CardActions, CardTop, Chip, Content, DifficultyOptions, Disclosure, Fields, Layout, LocationStatus, Muted, NoticeView, Options, Panel, PanelHead, RadioOption, RangeField, Row, Shell, ShopTitle, Stack, TargetCard, Time, Toggle, Toolbar, TrophyButton, TrophyGrid } from '../components/ChallengePageUI';
import useChallengeResource from '../hooks/useChallengeResource';
import useChallengeLocation from '../hooks/useChallengeLocation';
import { berlinDay, challengeState, DIFFICULTIES, formatChallengeDate, missingStandardSlots, normalizeChallenge, normalizeTeamList, occupiedSlot, parseChallengeDate, readChallengeResponse, slotLabel, sortChallenges, teamChallengeState, timeRemaining, tomorrowDay, typeLabel, upsertChallenge, weeklyDeadline } from '../utils/challengePlanning.mjs';
import { formatOpeningHoursLines, hydrateOpeningHours } from '../utils/openingHours';
import { trackEvent } from '../utils/analytics';
const EMPTY = [],
  EMPTY_TEAM = {
    active: [],
    received: [],
    sent: [],
    history: []
  };
function normalizeSolo(data) {
  if (!Array.isArray(data)) throw new Error('Challenges konnten nicht gelesen werden.');
  return data.map(normalizeChallenge);
}
function distanceLabel(location, challenge) {
  if (!location || challenge.shop_lat == null || challenge.shop_lon == null) return null;
  const radians = value => value * Math.PI / 180,
    dLat = radians(challenge.shop_lat - location.lat),
    dLon = radians(challenge.shop_lon - location.lon);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(location.lat)) * Math.cos(radians(challenge.shop_lat)) * Math.sin(dLon / 2) ** 2;
  const distance = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return distance < 1000 ? `${Math.round(distance)} m entfernt` : `${(distance / 1000).toFixed(1).replace('.', ',')} km entfernt`;
}
function rangeLabel(challenge) {
  return challenge.difficulty === 'individuell' && challenge.custom_min_distance_m != null && challenge.custom_max_distance_m != null ? `${Number(challenge.custom_min_distance_m) / 1000}–${Number(challenge.custom_max_distance_m) / 1000} km` : DIFFICULTIES[challenge.difficulty]?.range;
}
function OpeningHours({
  challenge,
  upcoming
}) {
  const structured = hydrateOpeningHours(challenge.openingHoursStructured, challenge.opening_hours_note || '');
  const lines = formatOpeningHoursLines(structured);
  const fallback = lines.length ? lines : String(challenge.openingHours || '').split(';').map(line => line.trim()).filter(Boolean);
  const status = challenge.is_open_now === true ? 'Jetzt geöffnet' : challenge.is_open_now === false ? 'Jetzt geschlossen' : 'Öffnungsstatus unbekannt';
  if (!fallback.length) return <Muted style={{
    marginTop: 8
  }}>Öffnungszeiten unbekannt</Muted>;
  return <Disclosure><summary>{upcoming ? 'Öffnungszeiten' : `${status} · Öffnungszeiten`}</summary><ul>{fallback.map((line, index) => <li key={index}>{line}</li>)}</ul></Disclosure>;
}
function SoloCard({
  challenge,
  now,
  location,
  selected,
  onMap,
  onRecreate,
  busy,
  archive = false
}) {
  const future = challengeState(challenge, now) === 'upcoming',
    difficulty = DIFFICULTIES[challenge.difficulty];
  const timeLabel = archive ? `Abgeschlossen ${formatChallengeDate(challenge.completed_at)}` : future ? `Ab ${formatChallengeDate(challenge.valid_from)}` : `Noch ${timeRemaining(challenge.valid_until, now)}`;
  return <TargetCard as="article" $selected={selected} data-solo-challenge={challenge.id}>
    <CardTop><Chip $color={difficulty?.color}>{typeLabel(challenge.type)} · {difficulty?.label || challenge.difficulty}</Chip>
      <Time dateTime={parseChallengeDate(archive ? challenge.completed_at : future ? challenge.valid_from : challenge.valid_until)?.toISOString()} $urgent={!archive && !future && parseChallengeDate(challenge.valid_until)?.getTime() - now <= 7200000} title={archive ? undefined : `Gültig bis ${formatChallengeDate(challenge.valid_until)}`}>{timeLabel}</Time></CardTop>
    <ShopTitle><Link to={`/shop/${challenge.shop_id}`}>{challenge.shop_name || 'Ziel-Eisdiele'}</Link></ShopTitle>
    <Muted>{challenge.shop_address || 'Adresse unbekannt'}</Muted>
    <Muted style={{
      marginTop: 6
    }}>{[distanceLabel(location, challenge), rangeLabel(challenge) && `Zielbereich ${rangeLabel(challenge)}`].filter(Boolean).join(' · ')}</Muted>
    {!archive && <OpeningHours challenge={challenge} upcoming={future} />}
    <CardActions>
      <Action as={Link} $primary={!future && !archive} to={`/shop/${challenge.shop_id}${future || archive ? '' : '?openCheckin=1'}`}>{future || archive ? 'Eisdiele ansehen' : 'Einchecken'}</Action>
      <Action onClick={() => onMap(challenge)}><MapPinned size={17} aria-hidden="true" />Auf Karte ansehen</Action>
    </CardActions>
    {!archive && <Disclosure><summary>Weitere Aktionen</summary><Row role="group" aria-label="Weitere Challenge-Aktionen">
      <Action onClick={() => onRecreate(challenge)} disabled={busy || challenge.recreated}><RefreshCcw size={16} aria-hidden="true" />{challenge.recreated ? 'Neuversuch verwendet' : 'Einmal neu generieren'}</Action>
      <Action as={Link} to={`/ice-date/new?shopId=${challenge.shop_id}&challengeId=${challenge.id}`}>Eis-Date planen</Action>
    </Row><Muted>Ein Neuversuch ersetzt das Ziel. Zeitraum und Schwierigkeit bleiben erhalten.</Muted></Disclosure>}
  </TargetCard>;
}
export default function Challenges() {
  const {
      userId,
      isLoggedIn,
      authReady
    } = useUser(),
    apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [params, setParams] = useSearchParams(),
    tab = params.get('tab') === 'team' ? 'team' : 'solo';
  const solo = useChallengeResource(isLoggedIn && userId ? `${apiUrl}/api/challenge_list.php?nutzer_id=${userId}` : null, normalizeSolo, EMPTY);
  const team = useChallengeResource(isLoggedIn && userId ? `${apiUrl}/api/team_challenge_list.php?user_id=${userId}` : null, normalizeTeamList, EMPTY_TEAM);
  const geo = useChallengeLocation();
  const [now, setNow] = useState(Date.now()),
    previousNow = useRef(now);
  const [view, setView] = useState('active'),
    [generator, setGenerator] = useState(false),
    [teamDialogRequest, setTeamDialogRequest] = useState(0),
    [showLogin, setShowLogin] = useState(false);
  const [type, setType] = useState('daily'),
    [forTomorrow, setForTomorrow] = useState(false),
    [difficulty, setDifficulty] = useState('leicht');
  const [minKm, setMinKm] = useState(15),
    [maxKm, setMaxKm] = useState(45),
    [busy, setBusy] = useState(null),
    [notice, setNotice] = useState(null);
  const [bulkProgress, setBulkProgress] = useState(null),
    [results, setResults] = useState(null),
    [trophy, setTrophy] = useState(null),
    [trophyCount, setTrophyCount] = useState(6);
  const [selectedId, setSelectedId] = useState(null),
    [mapOpen, setMapOpen] = useState(0),
    [mapExtra, setMapExtra] = useState(null);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const before = previousNow.current;
    previousNow.current = now;
    if (before !== now && (berlinDay(before) !== berlinDay(now) || solo.data.some(challenge => challengeState(challenge, before) !== challengeState(challenge, now)) || team.data.active.some(challenge => teamChallengeState(challenge, before) !== teamChallengeState(challenge, now)))) {
      solo.reload({
        silent: true
      });
      team.reload({
        silent: true
      });
    }
  }, [now, solo.data, solo.reload, team.data.active, team.reload]);
  const active = useMemo(() => sortChallenges(solo.data.filter(challenge => challengeState(challenge, now) === 'active')), [solo.data, now]);
  const upcoming = useMemo(() => sortChallenges(solo.data.filter(challenge => challengeState(challenge, now) === 'upcoming')), [solo.data, now]);
  const completed = useMemo(() => solo.data.filter(challenge => challenge.completed).sort((a, b) => (parseChallengeDate(b.completed_at)?.getTime() || 0) - (parseChallengeDate(a.completed_at)?.getTime() || 0)), [solo.data]);
  const visible = view === 'upcoming' ? upcoming : active;
  const invitationCount = team.data.received.filter(challenge => teamChallengeState(challenge, now) === 'pending_acceptance').length;
  const missing = missingStandardSlots(solo.data, now),
    occupied = occupiedSlot(solo.data, {
      type,
      difficulty,
      forTomorrow
    }, now);
  const occupiedLabel = occupied ? occupied.completed ? 'Für diesen Zeitraum abgeschlossen' : challengeState(occupied, now) === 'upcoming' ? 'Für morgen geplant' : 'Bereits aktiv' : null;
  const mapPoints = useMemo(() => (mapExtra && !visible.some(challenge => String(challenge.id) === String(mapExtra.id)) ? [...visible, mapExtra] : visible).map(challenge => ({
    id: challenge.id,
    shopId: challenge.shop_id,
    name: challenge.shop_name,
    address: challenge.shop_address,
    lat: challenge.shop_lat,
    lon: challenge.shop_lon,
    difficulty: challenge.difficulty
  })), [visible, mapExtra]);
  const changeTab = next => {
    setTeamDialogRequest(0);
    const copy = new URLSearchParams(params);
    if (next === 'team') copy.set('tab', 'team');else {
      copy.delete('tab');
      copy.delete('teamChallengeId');
    }
    setParams(copy, {
      replace: true
    });
  };
  const openGenerator = (tomorrow = view === 'upcoming') => {
    setType('daily');
    setForTomorrow(tomorrow);
    setDifficulty('leicht');
    setNotice(null);
    setGenerator(true);
  };
  const showOnMap = challenge => {
    setSelectedId(challenge.id);
    setMapExtra(challenge);
    setView(challengeState(challenge, now) === 'upcoming' ? 'upcoming' : 'active');
    setResults(null);
    setTrophy(null);
    setMapOpen(value => value + 1);
  };
  const create = async (combination, position, old = null) => {
    const body = new FormData();
    Object.entries({
      nutzer_id: userId,
      lat: position.lat,
      lon: position.lon,
      type: combination.type,
      difficulty: combination.difficulty
    }).forEach(([key, value]) => body.append(key, String(value)));
    if (combination.forTomorrow) body.append('for_tomorrow', 'true');
    if (old) body.append('challenge_id', String(old.id));
    if (combination.difficulty === 'individuell') {
      body.append('custom_min_km', String(old ? Number(old.custom_min_distance_m) / 1000 : minKm));
      body.append('custom_max_km', String(old ? Number(old.custom_max_distance_m) / 1000 : maxKm));
    }
    const data = await readChallengeResponse(await fetch(`${apiUrl}/api/challenge_generate.php`, {
      method: 'POST',
      body
    }));
    if (data.status !== 'success') throw new Error(data.message || 'Challenge konnte nicht erstellt werden.');
    const challenge = normalizeChallenge(data);
    if (challenge.id == null) throw new Error('Die Serverantwort enthält kein Challenge-Ziel. Bitte lade die Übersicht erneut.');
    solo.setData(previous => upsertChallenge(previous, challenge));
    trackEvent('challenge', old ? 'regenerated' : 'generated', `${combination.type}-${combination.difficulty}`);
    return challenge;
  };
  const finish = created => {
    setResults(created);
    setSelectedId(created[0].id);
    setView(challengeState(created[0], Date.now()) === 'upcoming' ? 'upcoming' : 'active');
  };
  const generate = async (old = null) => {
    if (busy || !old && occupied || solo.loading || solo.error) return;
    setBusy(old ? `recreate:${old.id}` : 'create');
    setNotice(null);
    try {
      const position = geo.location || (await geo.requestLocation());
      const combination = old ? {
        type: old.type,
        difficulty: old.difficulty,
        forTomorrow: challengeState(old, now) === 'upcoming'
      } : {
        type,
        difficulty,
        forTomorrow: type === 'daily' && forTomorrow
      };
      const challenge = await create(combination, position, old);
      setGenerator(false);
      finish([challenge]);
    } catch (error) {
      setNotice({
        type: 'error',
        message: error.message
      });
    } finally {
      setBusy(null);
    }
  };
  const generateAll = async () => {
    if (busy || !missing.length || solo.loading || solo.error) return;
    setBusy('bulk');
    setNotice(null);
    const created = [],
      failures = [];
    try {
      const position = geo.location || (await geo.requestLocation()),
        combinations = [...missing];
      for (let i = 0; i < combinations.length; i++) {
        setBulkProgress({
          done: i,
          total: combinations.length
        });
        try {
          created.push(await create(combinations[i], position));
        } catch (error) {
          failures.push(`${slotLabel(combinations[i])}: ${error.message}`);
        }
      }
      setNotice({
        type: failures.length ? created.length ? 'info' : 'error' : 'success',
        message: `${created.length} Challenges erstellt${failures.length ? `, ${failures.length} fehlgeschlagen` : '.'}`,
        details: failures
      });
      if (created.length && !failures.length) {
        setGenerator(false);
        finish(created);
      }
    } catch (error) {
      setNotice({
        type: 'error',
        message: error.message
      });
    } finally {
      setBulkProgress(null);
      setBusy(null);
    }
  };
  const typeEnd = type === 'weekly' ? weeklyDeadline(now) : `${forTomorrow ? tomorrowDay(now) : berlinDay(now)} 23:59:59`;
  return <Shell><Seo title="Challenges | Ice-App" description="Entdecke neue Eisdielen mit täglichen und wöchentlichen Solo- und Team-Challenges." canonical="/challenge" /><Header />
    <Content><h1>Challenges</h1><Muted style={{
        marginTop: 6
      }}>Entdecke neue Eisdielen und sammle gemeinsam oder allein Extra-EP.</Muted>
      <Toolbar><Row role="group" aria-label="Challenge-Art"><Toggle $active={tab === 'solo'} aria-pressed={tab === 'solo'} onClick={() => changeTab('solo')}>Solo</Toggle>
        <Toggle $active={tab === 'team'} aria-pressed={tab === 'team'} onClick={() => changeTab('team')}>Team{invitationCount > 0 && <Chip aria-label={`${invitationCount} offene Einladungen`}>{invitationCount}</Chip>}</Toggle></Row>
        <Action $primary onClick={() => {
          if (!isLoggedIn) {
            setShowLogin(true);
            return;
          }
          if (tab === 'team') setTeamDialogRequest(value => value + 1);else openGenerator();
        }}><Plus size={18} aria-hidden="true" />{tab === 'team' ? 'Neue Team-Challenge' : 'Neue Challenge'}</Action>
      </Toolbar>
      {!authReady ? <Panel><Muted>Deine Anmeldung wird geprüft …</Muted></Panel> : !isLoggedIn ? <Panel><PanelHead><h2>Dein nächstes Eisziel wartet</h2></PanelHead><Muted>Melde dich an, um Challenges zu starten und deine Erfolge zu sehen.</Muted><CardActions><Action $primary onClick={() => setShowLogin(true)}>Anmelden</Action></CardActions></Panel> : tab === 'team' ? <TeamChallengesPanel userId={userId} apiUrl={apiUrl} resource={team} geo={geo} now={now} openRequest={teamDialogRequest} focusChallengeId={params.get('teamChallengeId')} onSelectChallenge={id => {
        const copy = new URLSearchParams(params);
        copy.set('teamChallengeId', String(id));
        setParams(copy, {
          replace: true
        });
      }} /> : <><NoticeView notice={!generator ? notice : null} /><Layout><Stack><Panel>
          <PanelHead><h2>Deine Challenges</h2><Row role="group" aria-label="Challenge-Zeitraum"><Toggle $active={view === 'active'} aria-pressed={view === 'active'} onClick={() => setView('active')}>Aktiv ({active.length})</Toggle><Toggle $active={view === 'upcoming'} aria-pressed={view === 'upcoming'} onClick={() => setView('upcoming')}>Morgen ({upcoming.length})</Toggle></Row></PanelHead>
          {solo.loading ? <Muted role="status">Challenges werden geladen …</Muted> : solo.error ? <><NoticeView notice={{
                  type: 'error',
                  message: solo.error
                }} /><Action onClick={() => solo.reload()}>Erneut versuchen</Action></> : visible.length ? <Stack>{visible.map(challenge => <SoloCard key={challenge.id} challenge={challenge} now={now} location={geo.location} selected={String(challenge.id) === String(selectedId)} onMap={showOnMap} onRecreate={generate} busy={Boolean(busy)} />)}</Stack> : <Stack><Muted>{view === 'upcoming' ? 'Für morgen hast du noch keine Challenge geplant.' : 'Du hast gerade keine laufende Challenge.'}</Muted><Row><Action $primary onClick={() => openGenerator()}>Challenge {view === 'upcoming' ? 'für morgen planen' : 'starten'}</Action></Row></Stack>}
        </Panel></Stack><ChallengeMap points={mapPoints} selectedId={selectedId} location={geo.location} forceOpen={mapOpen} onSelect={id => setSelectedId(id)} /><Stack style={{
            gridColumn: '1 / -1'
          }}>
        <Panel><PanelHead><h2><Trophy size={19} aria-hidden="true" />Deine Erfolge</h2><Chip>{completed.length} abgeschlossen</Chip></PanelHead>
          {completed.length ? <><TrophyGrid>{completed.slice(0, trophyCount).map(challenge => <TrophyButton key={challenge.id} onClick={() => setTrophy(challenge)}><Trophy size={23} aria-hidden="true" /><strong>{challenge.shop_name}</strong><span>{formatChallengeDate(challenge.completed_at, true)}</span><Chip $color={DIFFICULTIES[challenge.difficulty]?.color}>{typeLabel(challenge.type)} · {DIFFICULTIES[challenge.difficulty]?.label}</Chip></TrophyButton>)}</TrophyGrid>{completed.length > trophyCount && <Row style={{
                  marginTop: 12
                }}><Action onClick={() => setTrophyCount(value => value + 6)}>Mehr anzeigen ({completed.length - trophyCount})</Action></Row>}</> : <Muted>Dein erster erfolgreicher Check-in wird hier gefeiert.</Muted>}
        </Panel>
        <Panel><Disclosure><summary>So funktioniert’s</summary><ul><li>Du erhältst ein zufälliges Ziel im gewählten Entfernungsbereich.</li><li>Tägliche Challenges gelten am gewählten Tag, wöchentliche bis zum angezeigten Enddatum.</li><li>Checke vor Ort ein, höchstens 300 Meter von der Eisdiele entfernt.</li><li>Erfolgreiche Challenges bringen Extra-EP und können Awards freischalten.</li><li>Du kannst das Ziel jeder Challenge einmal neu generieren.</li></ul></Disclosure></Panel>
        </Stack></Layout></>}
    </Content>
    <ChallengeDialog open={generator} onClose={() => setGenerator(false)} title="Neue Challenge" busy={Boolean(busy)} footer={<Action $primary disabled={Boolean(busy) || solo.loading || Boolean(solo.error) || Boolean(occupied)} onClick={() => generate()}>{busy === 'bulk' ? `Erstelle ${bulkProgress ? `${bulkProgress.done + 1} von ${bulkProgress.total}` : 'Challenges'} …` : busy ? 'Challenge wird erstellt …' : occupiedLabel || 'Challenge erstellen'}</Action>}>
      <Stack><NoticeView notice={notice} />{solo.error && <><NoticeView notice={{
            type: 'error',
            message: 'Lade deine Challenges erneut, bevor du eine neue erstellst.'
          }} /><Action onClick={() => solo.reload()}>Erneut versuchen</Action></>}
        <Fields><legend>Zeitraum</legend><Options>{['daily', 'weekly'].map(value => <RadioOption key={value}><input type="radio" name="challenge-type" checked={type === value} onChange={() => setType(value)} /><strong>{typeLabel(value)}</strong></RadioOption>)}</Options>
          {type === 'daily' && <Options>{[false, true].map(value => <RadioOption key={String(value)}><input type="radio" name="challenge-day" checked={forTomorrow === value} onChange={() => setForTomorrow(value)} /><strong>{value ? 'Morgen' : 'Heute'}</strong></RadioOption>)}</Options>}
          <Muted><CalendarDays size={14} aria-hidden="true" /> {type === 'daily' && forTomorrow ? 'Ab morgen 00:00 Uhr · ' : ''}Gültig bis {formatChallengeDate(typeEnd)}</Muted>
        </Fields>
        <DifficultyOptions value={difficulty} onChange={setDifficulty} />
        {difficulty === 'individuell' && <Fields><legend>Distanzbereich</legend><RangeField>Untere Grenze: {minKm} km<input type="range" min={15} max={60} step={1} value={minKm} onChange={event => {
              const value = Number(event.target.value);
              setMinKm(value);
              setMaxKm(previous => Math.max(previous, value + 5));
            }} /></RangeField>
          <RangeField>Obere Grenze: {maxKm} km<input type="range" min={45} max={100} step={1} value={maxKm} onChange={event => {
              const value = Number(event.target.value);
              setMaxKm(value);
              setMinKm(previous => Math.min(previous, value - 5));
            }} /></RangeField><Muted>Mindestens 5 km Abstand zwischen den Grenzen.</Muted></Fields>}
        {occupied && <NoticeView notice={{
          type: 'info',
          message: `${occupiedLabel}: ${occupied.shop_name}.`
        }} />}
        <Fields><legend>Standort</legend><LocationStatus geo={geo} /></Fields>
        <Disclosure><summary>Weitere Optionen</summary><Stack><Muted>Alle fehlenden Standardkombinationen für heute, morgen und die laufende Woche. Individuelle Challenges sind nicht enthalten.</Muted>
          <ul>{missing.map(combination => <li key={slotLabel(combination)}>{slotLabel(combination)}</li>)}</ul>
          <Action disabled={Boolean(busy) || solo.loading || Boolean(solo.error) || !missing.length} onClick={generateAll}>{busy === 'bulk' ? `Erstelle ${bulkProgress ? `${bulkProgress.done + 1} von ${bulkProgress.total}` : 'Challenges'} …` : `Alle fehlenden generieren (${missing.length})`}</Action>
        </Stack></Disclosure>
      </Stack>
    </ChallengeDialog>
    <ChallengeDialog open={Boolean(results)} onClose={() => setResults(null)} title={results?.length > 1 ? `${results.length} Challenges erstellt` : 'Dein neues Eisziel'} compact>
      {results && <Stack>{results.map(challenge => <SoloCard key={challenge.id} challenge={challenge} now={now} location={geo.location} onMap={showOnMap} onRecreate={generate} busy={Boolean(busy)} />)}</Stack>}
    </ChallengeDialog>
    <ChallengeDialog open={Boolean(trophy)} onClose={() => setTrophy(null)} title="Challenge geschafft!" compact>
      {trophy && <Stack><Trophy size={32} color="#b78709" aria-hidden="true" /><SoloCard challenge={trophy} now={now} location={geo.location} archive onMap={showOnMap} /></Stack>}
    </ChallengeDialog>
    {showLogin && <LoginModal setShowLoginModal={setShowLogin} reloadAfterLogin={false} />}
  </Shell>;
}
