import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Check, MapPinned, Trophy, Users, X } from 'lucide-react';
import UserAvatar from './UserAvatar';
import SearchSelect from './iceDate/SearchSelect';
import { ChallengeDialog } from './ChallengeUI';
import ChallengeMap from './ChallengeMap';
import { Action, CardActions, CardTop, Chip, DifficultyOptions, Disclosure, Fields, Layout, LocationStatus, Muted, NoticeView, Options, Panel, PanelHead, RadioOption, Row, ShopTitle, Stack, TargetCard, Time, Toggle, TrophyButton, TrophyGrid } from './ChallengePageUI';
import useChallengeResource from '../hooks/useChallengeResource';
import { completionDuration, DIFFICULTIES, formatChallengeDate, parseChallengeDate, readChallengeResponse, TEAM_ACTIVE_STATUSES, TEAM_STATUS_LABELS, teamChallengeState, teamCheckinProgress, timeRemaining, typeLabel } from '../utils/challengePlanning.mjs';
const PersonRow = styled.div`display:flex;gap:10px;align-items:center;min-width:0;>div{min-width:0;flex:1;overflow-wrap:anywhere;}`;
const SelectRow = styled(PersonRow)`>button{flex:1;min-width:0;display:grid;gap:3px;text-align:left;justify-content:stretch;
  strong{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}}`;
const People = styled.div`display:grid;gap:12px;margin:12px 0;`;
const Candidate = styled.div`border-top:1px solid #e7dfcf;padding:12px 0;min-width:0;&:last-child{padding-bottom:0;}`;
const ProgressRow = styled(PersonRow)`display:grid;grid-template-columns:44px minmax(0,1fr);border-top:1px solid #e7dfcf;padding:10px 0;
  >span{grid-column:2;justify-self:start;}@media(min-width:768px){grid-template-columns:44px minmax(0,1fr) auto;>span{grid-column:auto;}}`;
const normalizeDetail = data => {
  if (!data.team_challenge?.id) throw new Error('Die Team-Challenge konnte nicht gelesen werden.');
  return data.team_challenge;
};
const otherPerson = challenge => challenge.viewer_role === 'inviter' ? challenge.invitee : challenge.inviter;
const participantName = (person, userId) => Number(person?.id) === Number(userId) ? 'Du' : person?.username || 'Teilnehmer';
export default function TeamChallengesPanel({
  userId,
  apiUrl,
  resource,
  geo,
  now,
  openRequest,
  focusChallengeId,
  onSelectChallenge
}) {
  const [selectedId, setSelectedId] = useState(null),
    [inviteOpen, setInviteOpen] = useState(false),
    [inviteType, setInviteType] = useState('weekly'),
    [difficulty, setDifficulty] = useState('leicht');
  const [selectedUser, setSelectedUser] = useState(null),
    [query, setQuery] = useState(''),
    [searchResults, setSearchResults] = useState([]),
    [searching, setSearching] = useState(false),
    [searchError, setSearchError] = useState(null),
    [searchAttempt, setSearchAttempt] = useState(0);
  const [busy, setBusy] = useState(null),
    [notice, setNotice] = useState(null),
    [cancel, setCancel] = useState(null),
    [trophyCount, setTrophyCount] = useState(6),
    [historyCount, setHistoryCount] = useState(6);
  const [candidateId, setCandidateId] = useState(null),
    [mapOpen, setMapOpen] = useState(0);
  const currentSection = useRef(null),
    previousRequest = useRef(0);
  const active = resource.data.active.filter(challenge => TEAM_ACTIVE_STATUSES.includes(teamChallengeState(challenge, now)));
  const received = resource.data.received.filter(challenge => active.some(item => String(item.id) === String(challenge.id)));
  const sent = resource.data.sent.filter(challenge => active.some(item => String(item.id) === String(challenge.id)));
  const ongoing = active.filter(challenge => challenge.status !== 'pending_acceptance');
  const chosenId = focusChallengeId || selectedId || received[0]?.id || ongoing[0]?.id || sent[0]?.id || null;
  const detail = useChallengeResource(chosenId ? `${apiUrl}/api/team_challenge_detail.php?user_id=${userId}&team_challenge_id=${chosenId}` : null, normalizeDetail, null);
  const current = String(detail.data?.id) === String(chosenId) ? detail.data : null;
  const status = current ? teamChallengeState(current, now) : null;
  const expired = status === 'expired';
  const canAct = Boolean(current) && !expired && !busy && !detail.loading;
  const completed = useMemo(() => resource.data.history.filter(challenge => challenge.status === 'completed').sort((a, b) => (parseChallengeDate(b.completed_at)?.getTime() || 0) - (parseChallengeDate(a.completed_at)?.getTime() || 0)), [resource.data.history]);
  const history = resource.data.history.filter(challenge => challenge.status !== 'completed');
  const stats = useMemo(() => ({
    partners: new Set(completed.map(challenge => otherPerson(challenge)?.id).filter(Boolean)).size,
    shops: new Set(completed.map(challenge => challenge.final_shop?.id).filter(Boolean)).size
  }), [completed]);
  useEffect(() => {
    if (openRequest !== previousRequest.current) {
      previousRequest.current = openRequest;
      if (openRequest) {
        setNotice(null);
        setInviteOpen(true);
      }
    }
  }, [openRequest]);
  useEffect(() => {
    setCandidateId(null);
  }, [chosenId]);
  useEffect(() => {
    const trimmed = query.trim();
    if (!inviteOpen || trimmed.length < 2) {
      setSearchResults([]);
      setSearching(false);
      setSearchError(null);
      return undefined;
    }
    const controller = new AbortController();
    let cancelled = false;
    setSearching(true);
    setSearchError(null);
    const timer = setTimeout(async () => {
      try {
        const result = await readChallengeResponse(await fetch(`${apiUrl}/api/search_user.php?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal
        }));
        if (!Array.isArray(result)) throw new Error('Die Nutzersuche konnte nicht gelesen werden.');
        if (!cancelled) setSearchResults(result.filter(person => Number(person.id) !== Number(userId)));
      } catch (error) {
        if (!cancelled && error.name !== 'AbortError') {
          setSearchResults([]);
          setSearchError(error.message);
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 260);
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [inviteOpen, query, apiUrl, userId, searchAttempt]);
  const select = id => {
    setSelectedId(id);
    onSelectChallenge?.(id);
    requestAnimationFrame(() => {
      currentSection.current?.scrollIntoView({
        block: 'nearest'
      });
      currentSection.current?.focus({
        preventScroll: true
      });
    });
  };
  const post = async (endpoint, payload, successMessage, {
    needsLocation = false
  } = {}) => {
    if (busy) return null;
    setBusy(endpoint);
    setNotice(null);
    try {
      const position = needsLocation ? geo.location || (await geo.requestLocation()) : null;
      const result = await readChallengeResponse(await fetch(`${apiUrl}/api/${endpoint}.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...payload,
          ...(position ? {
            lat: position.lat,
            lon: position.lon
          } : {})
        })
      }));
      setNotice({
        type: 'success',
        message: successMessage
      });
      await resource.reload({
        silent: true
      });
      const id = result.team_challenge?.id || payload.team_challenge_id;
      if (id) {
        setSelectedId(id);
        onSelectChallenge?.(id);
        if (String(id) === String(chosenId)) await detail.reload({
          silent: true
        });
      }
      return result;
    } catch (error) {
      setNotice({
        type: 'error',
        message: error.message
      });
      return null;
    } finally {
      setBusy(null);
    }
  };
  const invite = async () => {
    if (!selectedUser || active.length >= 3) return;
    const result = await post('team_challenge_invite', {
      user_id: userId,
      invitee_user_id: selectedUser.id,
      type: inviteType,
      difficulty
    }, `Einladung an ${selectedUser.username} verschickt.`, {
      needsLocation: true
    });
    if (result) {
      setInviteOpen(false);
      setSelectedUser(null);
      setQuery('');
      setSearchResults([]);
    }
  };
  const accept = id => post('team_challenge_accept', {
    user_id: userId,
    team_challenge_id: id
  }, 'Team-Challenge angenommen.', {
    needsLocation: true
  });
  const decline = id => post('team_challenge_decline', {
    user_id: userId,
    team_challenge_id: id
  }, 'Einladung abgelehnt.');
  const finalize = shopId => post('team_challenge_finalize_shop', {
    user_id: userId,
    team_challenge_id: current.id,
    shop_id: shopId
  }, 'Euer Ziel steht fest.');
  const confirmCancel = async () => {
    const result = await post('team_challenge_cancel', {
      user_id: userId,
      team_challenge_id: cancel.id
    }, 'Team-Challenge abgesagt.');
    if (result) setCancel(null);
  };
  const progress = current ? teamCheckinProgress(current, now) : null;
  const finalShop = current?.final_shop;
  const mapPoints = useMemo(() => finalShop ? [{
    id: finalShop.id,
    shopId: finalShop.id,
    name: finalShop.name,
    address: finalShop.address,
    lat: finalShop.lat,
    lon: finalShop.lon,
    difficulty: current.difficulty
  }] : (current?.candidates || []).map(candidate => ({
    id: candidate.shop_id,
    shopId: candidate.shop_id,
    name: candidate.name,
    address: candidate.address,
    lat: Number(candidate.lat),
    lon: Number(candidate.lon),
    difficulty: current?.difficulty
  })), [current, finalShop]);
  const mapCenter = current?.center && Number.isFinite(current.center.lat) && Number.isFinite(current.center.lon) ? current.center : null;
  const summary = challenge => <SelectRow key={challenge.id}><UserAvatar userId={otherPerson(challenge)?.id} name={otherPerson(challenge)?.username} avatarUrl={otherPerson(challenge)?.avatar_url} />
    <Toggle title={otherPerson(challenge)?.username} $active={String(chosenId) === String(challenge.id)} aria-pressed={String(chosenId) === String(challenge.id)} onClick={() => select(challenge.id)}><strong>{otherPerson(challenge)?.username || 'Team-Challenge'}</strong><Muted as="span">{TEAM_STATUS_LABELS[challenge.status]} · {typeLabel(challenge.type)} · {DIFFICULTIES[challenge.difficulty]?.label}</Muted></Toggle></SelectRow>;
  return <><NoticeView notice={notice} /><Layout><Stack>
    <Panel><PanelHead><h2><Users size={19} aria-hidden="true" />Deine Team-Challenges</h2><Chip>{active.length} / 3 Plätze belegt</Chip></PanelHead>
      {resource.loading ? <Muted role="status">Team-Challenges werden geladen …</Muted> : resource.error ? <><NoticeView notice={{
              type: 'error',
              message: resource.error
            }} /><Action onClick={() => resource.reload()}>Erneut versuchen</Action></> : <Stack>
        {received.length > 0 && <><h3>Einladungen an dich ({received.length})</h3>{received.map(summary)}</>}
        {ongoing.length > 0 && <><h3>Laufende Aufgaben</h3>{ongoing.map(summary)}</>}
        {sent.length > 0 && <><h3>Gesendete Einladungen</h3>{sent.map(summary)}</>}
        {!active.length && <><Muted>Lade jemanden ein und entdeckt gemeinsam eine neue Eisdiele.</Muted><Row><Action $primary onClick={() => setInviteOpen(true)}>Team-Challenge starten</Action></Row></>}
        <Muted>Bis zu drei Team-Challenges gleichzeitig. Offene Einladungen zählen mit.</Muted>
      </Stack>}
    </Panel>
    {(chosenId || detail.error) && <Panel ref={currentSection} tabIndex={-1} aria-label="Ausgewählte Team-Challenge" data-team-detail={current?.id}>
      {detail.loading || !current && !detail.error ? <Muted role="status">Details werden geladen …</Muted> : detail.error ? <><NoticeView notice={{
              type: 'error',
              message: detail.error
            }} /><Action onClick={() => detail.reload()}>Erneut versuchen</Action></> : current && <>
        <CardTop><Chip $color={DIFFICULTIES[current.difficulty]?.color}>{typeLabel(current.type)} · {DIFFICULTIES[current.difficulty]?.label}</Chip>
          <Time dateTime={parseChallengeDate(current.completed_at || current.valid_until)?.toISOString()}>{status === 'completed' ? `Geschafft ${formatChallengeDate(current.completed_at)}` : TEAM_ACTIVE_STATUSES.includes(status) ? `Noch ${timeRemaining(current.valid_until, now)}` : formatChallengeDate(current.valid_until)}</Time></CardTop>
        <h2>{TEAM_STATUS_LABELS[status] || 'Team-Challenge'}</h2>
        {status === 'completed' && <Muted style={{
              marginTop: 6
            }}>Erstellt {formatChallengeDate(current.created_at)}{completionDuration(current) && ` · Dauer: ${completionDuration(current)}`}</Muted>}
        <People>{[current.inviter, current.invitee].filter(Boolean).map(person => <PersonRow key={person.id}><UserAvatar userId={person.id} name={person.username} avatarUrl={person.avatar_url} /><div><strong>{participantName(person, userId)}</strong>{Number(person.id) === Number(userId) && <Muted>{person.username}</Muted>}</div></PersonRow>)}</People>
        {status === 'pending_acceptance' && current.can_accept && <><Muted>{current.inviter.username} lädt dich ein. Nach deiner Annahme werden gemeinsame Ziele gesucht.</Muted>
          <CardActions><Action $primary disabled={!canAct} onClick={() => accept(current.id)}><Check size={17} aria-hidden="true" />Annehmen</Action><Action disabled={!canAct} onClick={() => decline(current.id)}>Ablehnen</Action></CardActions><NoticeView notice={geo.notice} /></>}
        {status === 'pending_acceptance' && current.viewer_role === 'inviter' && <Muted>Die Einladung ist verschickt. {current.invitee.username} ist als Nächstes dran.</Muted>}
        {['accepted', 'proposal_submitted'].includes(status) && <Muted>{status === 'accepted' ? 'Eure Ziele werden vorbereitet.' : 'Die Vorschläge wurden gesendet. Warte auf die Zielbestätigung.'}</Muted>}
        {status === 'proposal_open' && <><Muted>{current.can_finalize ? 'Wähle die Eisdiele für eure gemeinsame Challenge.' : `${current.invitee.username} wählt als Nächstes euer Ziel.`}</Muted>
          {(current.candidates || []).map(candidate => <Candidate key={candidate.shop_id}><ShopTitle><Link to={`/shop/${candidate.shop_id}`}>{candidate.name}</Link></ShopTitle><Muted>{candidate.address}</Muted><Muted>{Math.round(Number(candidate.distance_to_center) || 0)} m vom gemeinsamen Mittelpunkt</Muted>
            <CardActions>{current.can_finalize && <Action $primary disabled={!canAct} onClick={() => finalize(candidate.shop_id)}>Als Ziel festlegen</Action>}
              <Action onClick={() => {
                    setCandidateId(candidate.shop_id);
                    setMapOpen(value => value + 1);
                  }}><MapPinned size={17} aria-hidden="true" />Auf Karte ansehen</Action></CardActions></Candidate>)}
        </>}
        {finalShop && <TargetCard style={{
              marginTop: 12
            }}><ShopTitle><Link to={`/shop/${finalShop.id}`}>{finalShop.name}</Link></ShopTitle><Muted>{finalShop.address}</Muted>
          <CardActions><Action as={Link} $primary={status === 'shop_finalized'} to={`/shop/${finalShop.id}${status === 'shop_finalized' ? '?openCheckin=1' : ''}`}>{status === 'shop_finalized' ? 'Einchecken' : 'Eisdiele ansehen'}</Action><Action onClick={() => {
                  setCandidateId(finalShop.id);
                  setMapOpen(value => value + 1);
                }}>Auf Karte ansehen</Action></CardActions>
        </TargetCard>}
        {['shop_finalized', 'completed'].includes(status) && <div style={{
              marginTop: 14
            }}><PanelHead><h3>{status === 'completed' ? 'Gemeinsam geschafft!' : 'Gemeinsame Check-ins'}</h3><Chip>{status === 'completed' ? 2 : progress.recent.length} / 2</Chip></PanelHead>
          <Muted>Checkt beide bei eurem Ziel ein. Eure Check-ins dürfen höchstens {progress.windowMinutes} Minuten auseinanderliegen.</Muted>
          {status === 'shop_finalized' && progress.deadline && <Muted style={{
                marginTop: 6
              }}>Für den nächsten gemeinsamen Check-in bleiben {timeRemaining(progress.deadline, now)}.</Muted>}
          {status === 'shop_finalized' && progress.needsRetry && <NoticeView notice={{
                type: 'info',
                message: `Ein früherer Check-in liegt außerhalb des gemeinsamen Zeitfensters. Erneut einchecken, damit eure Check-ins höchstens ${progress.windowMinutes} Minuten auseinanderliegen.`
              }} />}
          {[current.inviter, current.invitee].filter(Boolean).map(person => {
                const entry = progress.entries.find(checkin => Number(checkin.user_id) === Number(person.id)),
                  recent = progress.recent.some(checkin => Number(checkin.user_id) === Number(person.id));
                return <ProgressRow key={person.id}><UserAvatar userId={person.id} name={person.username} avatarUrl={person.avatar_url} /><div><strong>{participantName(person, userId)}</strong>{entry && <Muted>{formatChallengeDate(entry.checkin_date)}</Muted>}</div><Chip>{status === 'completed' || recent ? 'Eingecheckt' : entry ? 'Erneut einchecken' : 'Noch offen'}</Chip></ProgressRow>;
              })}
        </div>}
        {status === 'failed_no_shops' && <Muted>Im gemeinsamen Entfernungsbereich wurden keine passenden Eisdielen gefunden. Ihr könnt eine neue Challenge starten.</Muted>}
        {['expired', 'cancelled'].includes(status) && <Muted>Diese Challenge ist {status === 'expired' ? 'abgelaufen' : 'abgesagt'}. Ihr könnt eine neue Team-Challenge starten.</Muted>}
        {current.can_cancel && TEAM_ACTIVE_STATUSES.includes(status) && <Disclosure><summary>Weitere Aktionen</summary><Row><Action disabled={!canAct} onClick={() => setCancel(current)}>{status === 'pending_acceptance' ? 'Einladung zurückziehen' : 'Team-Challenge abbrechen'}</Action></Row></Disclosure>}
      </>}
    </Panel>}
  </Stack><ChallengeMap points={mapPoints} selectedId={candidateId} onSelect={setCandidateId} center={mapCenter} radius={current?.radius_m} innerRadius={current?.min_radius_m} forceOpen={mapOpen} /><Stack style={{
        gridColumn: '1 / -1'
      }}>
    <Panel><PanelHead><h2><Trophy size={19} aria-hidden="true" />Gemeinsame Erfolge</h2><Chip>{completed.length} abgeschlossen</Chip></PanelHead>
      {completed.length ? <Stack><Muted>{stats.partners} Partner · {stats.shops} Eisdielen</Muted><TrophyGrid>{completed.slice(0, trophyCount).map(challenge => <TrophyButton key={challenge.id} onClick={() => select(challenge.id)}><Trophy size={23} aria-hidden="true" /><strong>{challenge.final_shop?.name || 'Team-Challenge'}</strong><span>mit {otherPerson(challenge)?.username}</span><span>{formatChallengeDate(challenge.completed_at, true)}</span></TrophyButton>)}</TrophyGrid>{completed.length > trophyCount && <Row><Action onClick={() => setTrophyCount(value => value + 6)}>Mehr anzeigen ({completed.length - trophyCount})</Action></Row>}</Stack> : <Muted>Eure abgeschlossenen Challenges erscheinen hier.</Muted>}
    </Panel>
    <Panel><Disclosure><summary>Verlauf ({history.length})</summary><Stack>{history.length ? history.slice(0, historyCount).map(summary) : <Muted>Noch keine abgelaufenen oder abgesagten Challenges.</Muted>}{history.length > historyCount && <Action onClick={() => setHistoryCount(value => value + 6)}>Mehr anzeigen</Action>}</Stack></Disclosure></Panel>
    <Panel><Disclosure><summary>So funktioniert’s</summary><ul><li>Lade genau eine andere Person ein und wähle Zeitraum und Schwierigkeit.</li><li>Nach der Annahme werden Ziele rund um euren gemeinsamen Mittelpunkt gesucht.</li><li>Die eingeladene Person legt eure Ziel-Eisdiele fest.</li><li>Checkt beide vor Ort ein. Das angezeigte gemeinsame Zeitfenster beginnt mit dem ersten passenden Check-in.</li><li>Erfolgreiche Team-Challenges bringen Extra-EP und können Awards freischalten.</li></ul></Disclosure></Panel>
  </Stack></Layout>
    <ChallengeDialog open={inviteOpen} onClose={() => setInviteOpen(false)} title="Neue Team-Challenge" busy={Boolean(busy)} footer={<Action $primary disabled={Boolean(busy) || !selectedUser || active.length >= 3 || resource.loading || Boolean(resource.error)} onClick={invite}>{busy ? 'Einladung wird verschickt …' : active.length >= 3 ? 'Alle drei Plätze belegt' : 'Einladung senden'}</Action>}>
      <Stack><NoticeView notice={notice} />{resource.error && <><NoticeView notice={{
            type: 'error',
            message: resource.error
          }} /><Action onClick={() => resource.reload()}>Erneut versuchen</Action></>}{active.length >= 3 && <NoticeView notice={{
          type: 'info',
          message: 'Du hast bereits drei aktive Team-Challenges. Schließe eine ab oder ziehe eine offene Einladung zurück.'
        }} />}
        <Fields><legend>Mit wem?</legend>{selectedUser ? <PersonRow><UserAvatar userId={selectedUser.id} name={selectedUser.username} avatarUrl={selectedUser.avatar_url} /><div><strong>{selectedUser.username}</strong></div><Action aria-label={`${selectedUser.username} entfernen`} onClick={() => {
              setSelectedUser(null);
              setQuery('');
            }}><X size={18} aria-hidden="true" /></Action></PersonRow> : <SearchSelect id="team-user-search" label="Nutzername oder E-Mail" placeholder="Person suchen …" query={query} onQuery={setQuery} items={searchResults} onChoose={setSelectedUser} loading={searching} error={searchError} onRetry={() => setSearchAttempt(value => value + 1)} emptyText={query.trim().length < 2 ? 'Mindestens zwei Zeichen eingeben.' : 'Keine passenden Nutzer gefunden.'} disabled={Boolean(busy)} autoFocus />}</Fields>
        <Fields><legend>Zeitraum</legend><Options>{['weekly', 'daily'].map(type => <RadioOption key={type}><input type="radio" name="team-type" checked={inviteType === type} onChange={() => setInviteType(type)} /><strong>{typeLabel(type)}</strong></RadioOption>)}</Options></Fields>
        <DifficultyOptions value={difficulty} onChange={setDifficulty} individual={false} />
        <Fields><legend>Standort</legend><LocationStatus geo={geo} /><Muted>Aus euren Standorten wird nach der Annahme ein gemeinsamer Mittelpunkt bestimmt.</Muted></Fields>
      </Stack>
    </ChallengeDialog>
    <ChallengeDialog open={Boolean(cancel)} onClose={() => setCancel(null)} title={cancel?.status === 'pending_acceptance' ? 'Einladung zurückziehen?' : 'Team-Challenge abbrechen?'} busy={Boolean(busy)} compact footer={<><Action disabled={Boolean(busy)} onClick={() => setCancel(null)}>Behalten</Action><Action $primary disabled={Boolean(busy)} onClick={confirmCancel}>{busy ? 'Wird abgesagt …' : cancel?.status === 'pending_acceptance' ? 'Ja, zurückziehen' : 'Ja, abbrechen'}</Action></>}>
      <Muted>Die Challenge mit {cancel && otherPerson(cancel)?.username} wird für euch beide abgesagt.</Muted><NoticeView notice={notice?.type === 'error' ? notice : null} />
    </ChallengeDialog>
  </>;
}
