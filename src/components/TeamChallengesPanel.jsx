import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Bell, Check, Clock3, MapPinned, Send, Target, Users, X } from "lucide-react";
import { Circle, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

const defaultIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const finalShopIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const statusLabels = {
  pending_acceptance: "Wartet auf Annahme",
  accepted: "Angenommen",
  proposal_open: "Vorschläge offen",
  proposal_submitted: "Vorschläge gesendet",
  shop_finalized: "Ziel bestätigt",
  completed: "Abgeschlossen",
  expired: "Abgelaufen",
  cancelled: "Abgebrochen",
  failed_no_shops: "Nicht genug Eisdielen",
};

const typeLabels = {
  daily: "Daily",
  weekly: "Weekly",
};

const getApiMessage = (data, fallback) => data?.message || data?.error || fallback;

async function readJsonResponse(res) {
  let data = null;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Ungültige Server-Antwort (HTTP ${res.status})`);
  }
  if (!res.ok || data?.status === "error") {
    throw new Error(getApiMessage(data, `HTTP ${res.status}`));
  }
  return data;
}

function TeamChallengesPanel({ userId, apiUrl, location, loadingLocation, locationNotice, focusChallengeId, onFocusChallengeHandled }) {
  const [listState, setListState] = useState({ active: null, received_invitations: [], sent_invitations: [], history: [] });
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userQuery, setUserQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [inviteType, setInviteType] = useState("weekly");
  const [busyAction, setBusyAction] = useState(null);
  const [selectedProposalIds, setSelectedProposalIds] = useState([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState(null);

  const activeOrFocusedId = focusChallengeId || selectedChallengeId || listState.active?.id || null;

  const fetchList = async () => {
    if (!userId || !apiUrl) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/team_challenge_list.php?user_id=${userId}`);
      const data = await readJsonResponse(res);
      setListState({
        active: data.active || null,
        received_invitations: Array.isArray(data.received_invitations) ? data.received_invitations : [],
        sent_invitations: Array.isArray(data.sent_invitations) ? data.sent_invitations : [],
        history: Array.isArray(data.history) ? data.history : [],
      });
    } catch (error) {
      setActionNotice({ type: "error", message: error.message || "Team-Challenges konnten nicht geladen werden." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [userId, apiUrl]);

  useEffect(() => {
    if (!userQuery || userQuery.trim().length < 2 || !apiUrl) {
      setSearchResults([]);
      return undefined;
    }

    const controller = new AbortController();
    setSearchingUsers(true);
    const timerId = window.setTimeout(async () => {
      try {
        const res = await fetch(`${apiUrl}/api/search_user.php?q=${encodeURIComponent(userQuery.trim())}`, { signal: controller.signal });
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data.filter((entry) => Number(entry.id) !== Number(userId)) : []);
      } catch (error) {
        if (error.name !== "AbortError") {
          setSearchResults([]);
        }
      } finally {
        setSearchingUsers(false);
      }
    }, 260);

    return () => {
      controller.abort();
      window.clearTimeout(timerId);
      setSearchingUsers(false);
    };
  }, [userQuery, apiUrl, userId]);

  const fetchDetail = async (challengeId) => {
    if (!challengeId || !userId || !apiUrl) {
      setDetail(null);
      return;
    }

    setDetailLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/team_challenge_detail.php?user_id=${userId}&team_challenge_id=${challengeId}`);
      const data = await readJsonResponse(res);
      setDetail(data.team_challenge || null);
      setSelectedChallengeId(challengeId);
      if (typeof onFocusChallengeHandled === "function" && focusChallengeId && Number(focusChallengeId) === Number(challengeId)) {
        onFocusChallengeHandled();
      }
    } catch (error) {
      setActionNotice({ type: "error", message: error.message || "Team-Challenge konnte nicht geladen werden." });
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (activeOrFocusedId) {
      fetchDetail(activeOrFocusedId);
    } else {
      setDetail(null);
    }
  }, [activeOrFocusedId, userId, apiUrl]);

  useEffect(() => {
    if (!detail) {
      setSelectedProposalIds([]);
      return;
    }
    setSelectedProposalIds(detail.proposals?.map((proposal) => proposal.shop_id) || []);
  }, [detail?.id, detail?.status]);

  const postJson = async (url, payload, successMessage = null) => {
    if (!apiUrl) return null;
    setBusyAction(url);
    setActionNotice(null);
    try {
      const res = await fetch(`${apiUrl}${url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await readJsonResponse(res);
      if (successMessage) {
        setActionNotice({ type: "success", message: successMessage });
      }
      await fetchList();
      const returnedId = data.team_challenge?.id || payload.team_challenge_id || focusChallengeId || listState.active?.id;
      if (returnedId) {
        await fetchDetail(returnedId);
      }
      return data;
    } catch (error) {
      setActionNotice({ type: "error", message: error.message || "Aktion fehlgeschlagen." });
      return null;
    } finally {
      setBusyAction(null);
    }
  };

  const handleInvite = async () => {
    if (!selectedUser) {
      setActionNotice({ type: "error", message: "Bitte wähle zuerst einen Nutzer aus." });
      return;
    }
    if (!location) {
      setActionNotice({ type: "error", message: "Für eine Team-Challenge wird dein aktueller Standort benötigt." });
      return;
    }

    const data = await postJson(
      "/api/team_challenge_invite.php",
      { user_id: userId, invitee_user_id: selectedUser.id, type: inviteType, lat: location.lat, lon: location.lon },
      `Einladung an ${selectedUser.username} wurde verschickt.`
    );

    if (data?.status === "success") {
      setSelectedUser(null);
      setUserQuery("");
      setSearchResults([]);
    }
  };

  const handleAccept = async (challengeId) => {
    if (!location) {
      setActionNotice({ type: "error", message: "Für die Annahme wird dein aktueller Standort benötigt." });
      return;
    }
    await postJson("/api/team_challenge_accept.php", { user_id: userId, team_challenge_id: challengeId, lat: location.lat, lon: location.lon }, "Team-Challenge angenommen.");
  };

  const handleDecline = async (challengeId) => {
    await postJson("/api/team_challenge_decline.php", { user_id: userId, team_challenge_id: challengeId }, "Einladung abgelehnt.");
  };

  const handleSubmitProposals = async () => {
    if (!detail?.id) return;
    if (selectedProposalIds.length < 1 || selectedProposalIds.length > 3) {
      setActionNotice({ type: "error", message: "Bitte wähle 1 bis 3 Eisdielen aus." });
      return;
    }
    await postJson("/api/team_challenge_submit_proposals.php", { user_id: userId, team_challenge_id: detail.id, shop_ids: selectedProposalIds }, "Vorschläge wurden gespeichert.");
  };

  const handleFinalize = async (shopId) => {
    if (!detail?.id) return;
    await postJson("/api/team_challenge_finalize_shop.php", { user_id: userId, team_challenge_id: detail.id, shop_id: shopId }, "Ziel-Eisdiele bestätigt.");
  };

  const handleCancel = async (challengeId) => {
    await postJson("/api/team_challenge_cancel.php", { user_id: userId, team_challenge_id: challengeId }, "Team-Challenge wurde abgebrochen.");
  };

  const toggleProposal = (shopId) => {
    setSelectedProposalIds((prev) => {
      if (prev.includes(shopId)) return prev.filter((id) => id !== shopId);
      if (prev.length >= 3) return prev;
      return [...prev, shopId];
    });
  };

  const renderNotice = (notice) => {
    if (!notice?.message) return null;
    return <NoticeBox $type={notice.type || "info"}>{notice.message}</NoticeBox>;
  };

  const renderChallengeMeta = (challenge) => (
    <MetaRow>
      <MetaBadge>{typeLabels[challenge.type] || challenge.type}</MetaBadge>
      <MetaBadge>{statusLabels[challenge.status] || challenge.status}</MetaBadge>
      {challenge.valid_until && <MetaBadge>Bis {new Date(challenge.valid_until).toLocaleString("de-DE")}</MetaBadge>}
      {challenge.radius_m && <MetaBadge>{Math.round(challenge.radius_m / 1000)} km Radius</MetaBadge>}
    </MetaRow>
  );

  const mapCandidates = detail?.status === "shop_finalized" || detail?.status === "completed" ? [] : (detail?.candidates || []);
  const mapCenter = detail?.center?.lat != null && detail?.center?.lon != null ? [detail.center.lat, detail.center.lon] : null;
  const mapFinalShop = detail?.final_shop || null;

  return (
    <PanelGrid>
      <MainColumn>
        <SectionCard>
          <SectionHead>
            <div>
              <SectionTitle>Team-Challenge</SectionTitle>
              <SectionSubline>Gemeinsam ein Ziel finden, eine Eisdiele abstimmen und innerhalb eines Zeitfensters zusammen einchecken.</SectionSubline>
            </div>
            <HeaderBadge><Users size={15} /> 2 Personen</HeaderBadge>
          </SectionHead>

          {renderNotice(locationNotice)}
          {renderNotice(actionNotice)}

          <InviteLayout>
            <InviteBox>
              <SmallHeading>Nutzer einladen</SmallHeading>
              <SubtleText>Wähle einen anderen Nutzer aus. Beim Senden wird dein aktueller Standort für die Mittelpunkt-Berechnung gespeichert.</SubtleText>
              <SearchInput
                type="text"
                placeholder="Nutzername suchen..."
                value={selectedUser ? selectedUser.username : userQuery}
                onChange={(event) => {
                  setSelectedUser(null);
                  setUserQuery(event.target.value);
                }}
              />
              {searchingUsers && <HintText>Suche läuft...</HintText>}
              {!selectedUser && searchResults.length > 0 && (
                <SearchList>
                  {searchResults.map((user) => (
                    <SearchItem
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setSelectedUser(user);
                        setUserQuery(user.username);
                        setSearchResults([]);
                      }}
                    >
                      <span>{user.username}</span>
                      {user.email && <SearchMeta>{user.email}</SearchMeta>}
                    </SearchItem>
                  ))}
                </SearchList>
              )}
              {selectedUser && (
                <SelectedUserChip>
                  <span>{selectedUser.username}</span>
                  <button type="button" onClick={() => { setSelectedUser(null); setUserQuery(""); }}>
                    <X size={14} />
                  </button>
                </SelectedUserChip>
              )}
            </InviteBox>

            <InviteBox>
              <SmallHeading>Challenge-Typ</SmallHeading>
              <TypeRow>
                {["weekly", "daily"].map((type) => (
                  <TypeButton key={type} type="button" $active={inviteType === type} onClick={() => setInviteType(type)}>
                    {typeLabels[type]}
                  </TypeButton>
                ))}
              </TypeRow>
              <HintText>
                {inviteType === "weekly"
                  ? "Weeklys laufen bis Sonntag 23:59 Uhr."
                  : "Dailys laufen bis Mitternacht, nach 18 Uhr bis morgen 23:59 Uhr."}
              </HintText>
              <PrimaryButton type="button" onClick={handleInvite} disabled={busyAction !== null || loadingLocation || !location}>
                <Send size={16} />
                Einladung senden
              </PrimaryButton>
            </InviteBox>
          </InviteLayout>
        </SectionCard>

        <SectionCard>
          <SectionHead>
            <div>
              <SectionTitle>Aktuelle Team-Challenge</SectionTitle>
              <SectionSubline>Statusgesteuerter Flow statt freier Formulare.</SectionSubline>
            </div>
            {detailLoading && <MutedText>Lade Details...</MutedText>}
          </SectionHead>

          {loading ? (
            <StateBox>Team-Challenges werden geladen...</StateBox>
          ) : !detail ? (
            <StateBox>Aktuell ist keine aktive Team-Challenge ausgewählt.</StateBox>
          ) : (
            <>
              <ChallengeCard>
                <ChallengeTitleRow>
                  <div>
                    <ChallengeTitle>{detail.inviter.username} + {detail.invitee.username}</ChallengeTitle>
                    <SubtleText>Rolle: {detail.viewer_role === "inviter" ? "Einladend" : "Eingeladen"}</SubtleText>
                  </div>
                  <StatusPill>{statusLabels[detail.status] || detail.status}</StatusPill>
                </ChallengeTitleRow>
                {renderChallengeMeta(detail)}

                {detail.failed_reason && detail.status !== "completed" && (
                  <InlineAlert>{detail.failed_reason === "not_enough_shops" ? "Im gemeinsamen Radius wurden nicht genug offene Eisdielen gefunden." : "Diese Team-Challenge ist nicht mehr aktiv."}</InlineAlert>
                )}

                {detail.status === "pending_acceptance" && detail.can_accept && (
                  <ActionRow>
                    <PrimaryButton type="button" onClick={() => handleAccept(detail.id)} disabled={busyAction !== null || !location}>
                      <Check size={16} />
                      Annehmen
                    </PrimaryButton>
                    <SecondaryButton type="button" onClick={() => handleDecline(detail.id)} disabled={busyAction !== null}>
                      Ablehnen
                    </SecondaryButton>
                  </ActionRow>
                )}

                {detail.status === "pending_acceptance" && detail.viewer_role === "inviter" && (
                  <ActionRow>
                    <MutedText>Die Einladung ist verschickt. Sobald sie angenommen wird, werden Kandidaten berechnet.</MutedText>
                    <SecondaryButton type="button" onClick={() => handleCancel(detail.id)} disabled={busyAction !== null}>
                      Einladung zurückziehen
                    </SecondaryButton>
                  </ActionRow>
                )}

                {(detail.status === "proposal_open" || detail.status === "proposal_submitted") && (
                  <>
                    <SubSectionHeading><Target size={16} /> Kandidaten und Vorschläge</SubSectionHeading>
                    <HintText>Der gemeinsame Radius wurde so weit erweitert, bis mindestens 4 offene Eisdielen gefunden wurden.</HintText>
                    <CandidateList>
                      {detail.candidates.map((candidate) => {
                        const selected = selectedProposalIds.includes(candidate.shop_id);
                        const alreadyProposed = detail.proposals.some((proposal) => proposal.shop_id === candidate.shop_id);
                        return (
                          <CandidateItem key={candidate.shop_id} $selected={selected || alreadyProposed}>
                            <div>
                              <CandidateName>{candidate.name}</CandidateName>
                              <CandidateMeta>{candidate.address}</CandidateMeta>
                              <CandidateMeta>{Math.round(candidate.distance_to_center)} m vom Mittelpunkt</CandidateMeta>
                            </div>
                            {detail.can_submit_proposals ? (
                              <ProposalToggle
                                type="button"
                                $selected={selected}
                                onClick={() => toggleProposal(candidate.shop_id)}
                                disabled={!selected && selectedProposalIds.length >= 3}
                              >
                                {selected ? "Ausgewählt" : "Wählen"}
                              </ProposalToggle>
                            ) : (
                              <ProposalState>{alreadyProposed ? "Vorgeschlagen" : "Verfügbar"}</ProposalState>
                            )}
                          </CandidateItem>
                        );
                      })}
                    </CandidateList>

                    {detail.can_submit_proposals && (
                      <ActionRow>
                        <MutedText>{selectedProposalIds.length}/3 Vorschläge gewählt.</MutedText>
                        <PrimaryButton type="button" onClick={handleSubmitProposals} disabled={busyAction !== null || selectedProposalIds.length < 1}>
                          Vorschläge senden
                        </PrimaryButton>
                      </ActionRow>
                    )}

                    {detail.proposals.length > 0 && (
                      <>
                        <SubSectionHeading><Bell size={16} /> Aktuelle Vorschläge</SubSectionHeading>
                        <CandidateList>
                          {detail.proposals.map((proposal) => (
                            <CandidateItem key={proposal.id} $selected>
                              <div>
                                <CandidateName>{proposal.shop.name}</CandidateName>
                                <CandidateMeta>{proposal.shop.address}</CandidateMeta>
                                <CandidateMeta>Vorgeschlagen von {proposal.proposed_by.username}</CandidateMeta>
                              </div>
                              {detail.can_finalize && (
                                <PrimaryButton type="button" onClick={() => handleFinalize(proposal.shop_id)} disabled={busyAction !== null}>
                                  Bestätigen
                                </PrimaryButton>
                              )}
                            </CandidateItem>
                          ))}
                        </CandidateList>
                      </>
                    )}
                  </>
                )}

                {(detail.status === "shop_finalized" || detail.status === "completed") && detail.final_shop && (
                  <>
                    <SubSectionHeading><MapPinned size={16} /> Ziel-Eisdiele</SubSectionHeading>
                    <FinalShopCard>
                      <div>
                        <CandidateName>{detail.final_shop.name}</CandidateName>
                        <CandidateMeta>{detail.final_shop.address}</CandidateMeta>
                        <CandidateMeta>Beide müssen innerhalb von {detail.completion_window_minutes} Minuten dort einchecken.</CandidateMeta>
                      </div>
                      {detail.valid_until && <StatusPill>Bis {new Date(detail.valid_until).toLocaleString("de-DE")}</StatusPill>}
                    </FinalShopCard>
                  </>
                )}

                {detail.status === "completed" && detail.checkins?.length > 0 && (
                  <>
                    <SubSectionHeading><Clock3 size={16} /> Check-ins</SubSectionHeading>
                    <CheckinList>
                      {detail.checkins.map((entry) => (
                        <li key={`${entry.user_id}-${entry.checkin_id}`}>
                          <strong>{entry.username}</strong> · {new Date(entry.checkin_date).toLocaleString("de-DE")}
                        </li>
                      ))}
                    </CheckinList>
                  </>
                )}

                {detail.can_cancel && detail.status !== "pending_acceptance" && (
                  <ActionRow>
                    <SecondaryButton type="button" onClick={() => handleCancel(detail.id)} disabled={busyAction !== null}>
                      Team-Challenge abbrechen
                    </SecondaryButton>
                  </ActionRow>
                )}
              </ChallengeCard>

              {(mapCenter || mapFinalShop) && (
                <MapWrap>
                  <MapContainer
                    center={mapFinalShop ? [mapFinalShop.lat, mapFinalShop.lon] : mapCenter}
                    zoom={detail.status === "shop_finalized" || detail.status === "completed" ? 13 : 11}
                    style={{ height: "340px", width: "100%" }}
                    scrollWheelZoom
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {mapCenter && detail.radius_m && (
                      <Circle center={mapCenter} radius={detail.radius_m} pathOptions={{ color: "#ffb522", fillColor: "#ffb522", fillOpacity: 0.08 }} />
                    )}
                    {mapCandidates.map((candidate) => (
                      <Marker key={candidate.shop_id} position={[candidate.lat, candidate.lon]} icon={defaultIcon}>
                        <Popup>
                          <strong>{candidate.name}</strong>
                          <br />
                          {candidate.address}
                        </Popup>
                      </Marker>
                    ))}
                    {mapFinalShop && (
                      <Marker position={[mapFinalShop.lat, mapFinalShop.lon]} icon={finalShopIcon}>
                        <Popup>
                          <strong>{mapFinalShop.name}</strong>
                          <br />
                          {mapFinalShop.address}
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </MapWrap>
              )}
            </>
          )}
        </SectionCard>
      </MainColumn>
      <SideColumn>
        <SectionCard>
          <SectionTitle>Einladungen</SectionTitle>
          <SectionSubline>Offene und erhaltene Team-Challenge-Einladungen.</SectionSubline>

          <SubSectionHeading><Bell size={16} /> Erhalten</SubSectionHeading>
          {listState.received_invitations.length === 0 ? (
            <MiniState>Keine offenen Einladungen.</MiniState>
          ) : (
            <CompactList>
              {listState.received_invitations.map((challenge) => (
                <CompactCard key={challenge.id} type="button" onClick={() => fetchDetail(challenge.id)}>
                  <strong>{challenge.inviter.username}</strong>
                  <span>{statusLabels[challenge.status]}</span>
                </CompactCard>
              ))}
            </CompactList>
          )}

          <SubSectionHeading><Send size={16} /> Gesendet</SubSectionHeading>
          {listState.sent_invitations.length === 0 ? (
            <MiniState>Keine offenen gesendeten Einladungen.</MiniState>
          ) : (
            <CompactList>
              {listState.sent_invitations.map((challenge) => (
                <CompactCard key={challenge.id} type="button" onClick={() => fetchDetail(challenge.id)}>
                  <strong>{challenge.invitee.username}</strong>
                  <span>{statusLabels[challenge.status]}</span>
                </CompactCard>
              ))}
            </CompactList>
          )}
        </SectionCard>

        <SectionCard>
          <SectionTitle>Verlauf</SectionTitle>
          <SectionSubline>Abgeschlossene, abgelaufene oder abgebrochene Team-Challenges.</SectionSubline>
          {listState.history.length === 0 ? (
            <MiniState>Noch kein Verlauf vorhanden.</MiniState>
          ) : (
            <CompactList>
              {listState.history.slice(0, 8).map((challenge) => (
                <CompactCard key={challenge.id} type="button" onClick={() => fetchDetail(challenge.id)}>
                  <strong>{challenge.inviter.username} + {challenge.invitee.username}</strong>
                  <span>{statusLabels[challenge.status]}</span>
                </CompactCard>
              ))}
            </CompactList>
          )}
        </SectionCard>
      </SideColumn>
    </PanelGrid>
  );
}

export default TeamChallengesPanel;

const PanelGrid = styled.div`
  display: grid;
  gap: 1rem;

  @media (min-width: 1080px) {
    grid-template-columns: minmax(0, 1.6fr) minmax(300px, 0.95fr);
    align-items: start;
  }
`;

const MainColumn = styled.div`
  display: grid;
  gap: 1rem;
`;

const SideColumn = styled.div`
  display: grid;
  gap: 1rem;
`;

const SectionCard = styled.section`
  background: rgba(255, 252, 243, 0.94);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.08);
  padding: 1rem;
`;

const SectionHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.8rem;
  flex-wrap: wrap;
  margin-bottom: 0.85rem;
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: #2f2100;
  font-size: 1.05rem;
  font-weight: 800;
`;

const SectionSubline = styled.p`
  margin: 0.15rem 0 0;
  color: rgba(47, 33, 0, 0.68);
  font-size: 0.92rem;
  line-height: 1.45;
`;

const HeaderBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.32rem 0.7rem;
  border-radius: 999px;
  background: rgba(255, 181, 34, 0.16);
  color: #7a4a00;
  font-weight: 800;
  font-size: 0.82rem;
`;

const InviteLayout = styled.div`
  display: grid;
  gap: 0.9rem;

  @media (min-width: 860px) {
    grid-template-columns: minmax(0, 1.25fr) minmax(260px, 0.75fr);
  }
`;

const InviteBox = styled.div`
  display: grid;
  gap: 0.65rem;
  padding: 0.9rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(47, 33, 0, 0.08);
`;

const SmallHeading = styled.h3`
  margin: 0;
  color: #2f2100;
  font-size: 0.98rem;
`;

const SearchInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 0.78rem 0.9rem;
  border-radius: 12px;
  border: 1px solid rgba(47, 33, 0, 0.16);
  background: #fff;
  color: #2f2100;
`;

const SearchList = styled.div`
  border-radius: 14px;
  border: 1px solid rgba(47, 33, 0, 0.08);
  background: #fff;
  overflow: hidden;
`;

const SearchItem = styled.button`
  width: 100%;
  text-align: left;
  padding: 0.8rem 0.9rem;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(47, 33, 0, 0.06);
  cursor: pointer;
  color: #2f2100;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #fff6e6;
  }
`;

const SearchMeta = styled.div`
  color: rgba(47, 33, 0, 0.55);
  font-size: 0.78rem;
  margin-top: 0.2rem;
`;

const SelectedUserChip = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: fit-content;
  max-width: 100%;
  padding: 0.42rem 0.7rem;
  border-radius: 999px;
  background: rgba(255, 181, 34, 0.16);
  border: 1px solid rgba(255, 181, 34, 0.32);
  color: #7a4a00;
  font-weight: 700;

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    cursor: pointer;
    color: inherit;
    padding: 0;
  }
`;

const TypeRow = styled.div`
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

const TypeButton = styled.button`
  padding: 0.68rem 0.95rem;
  border-radius: 12px;
  border: 1px solid ${({ $active }) => ($active ? "rgba(255, 181, 34, 0.5)" : "rgba(47, 33, 0, 0.12)")};
  background: ${({ $active }) => ($active ? "rgba(255, 181, 34, 0.16)" : "rgba(255, 255, 255, 0.88)")};
  color: #2f2100;
  font-weight: 800;
  cursor: pointer;
`;

const NoticeBox = styled.div`
  margin-bottom: 0.8rem;
  border-radius: 12px;
  padding: 0.8rem 0.9rem;
  border: 1px solid transparent;
  background: ${({ $type }) => ($type === "error" ? "#ffe9e9" : $type === "success" ? "#e8f7ec" : "#eef5ff")};
  border-color: ${({ $type }) => ($type === "error" ? "#f5b5b5" : $type === "success" ? "#b9e0c3" : "#bfd6ff")};
  color: ${({ $type }) => ($type === "error" ? "#8b1e1e" : $type === "success" ? "#185c2b" : "#1e3f7a")};
`;

const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  background: #ffb522;
  color: #2f2100;
  padding: 0.78rem 1rem;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-weight: 800;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled(PrimaryButton)`
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(47, 33, 0, 0.14);
  color: #5b4520;
`;

const HintText = styled.div`
  color: rgba(47, 33, 0, 0.64);
  font-size: 0.84rem;
  line-height: 1.4;
`;

const SubtleText = styled.div`
  color: rgba(47, 33, 0, 0.72);
  line-height: 1.45;
  font-size: 0.9rem;
`;

const ChallengeCard = styled.div`
  display: grid;
  gap: 0.9rem;
  background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,250,239,0.95));
  border-radius: 18px;
  border: 1px solid rgba(47, 33, 0, 0.08);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.04);
  padding: 1rem;
`;

const ChallengeTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const ChallengeTitle = styled.h3`
  margin: 0;
  color: #2f2100;
  font-size: 1.08rem;
`;

const StatusPill = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 0.28rem 0.68rem;
  border-radius: 999px;
  background: rgba(255, 181, 34, 0.16);
  border: 1px solid rgba(255, 181, 34, 0.28);
  color: #6c4500;
  font-size: 0.8rem;
  font-weight: 800;
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const MetaBadge = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.62rem;
  border-radius: 999px;
  background: rgba(47, 33, 0, 0.05);
  color: #5b4520;
  font-size: 0.8rem;
  font-weight: 700;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
  align-items: center;
`;

const SubSectionHeading = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: #6b5327;
  font-size: 0.9rem;
  font-weight: 800;
`;

const CandidateList = styled.div`
  display: grid;
  gap: 0.7rem;
`;

const CandidateItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 0.9rem;
  border-radius: 14px;
  border: 1px solid ${({ $selected }) => ($selected ? "rgba(255, 181, 34, 0.35)" : "rgba(47, 33, 0, 0.08)")};
  background: ${({ $selected }) => ($selected ? "rgba(255, 244, 221, 0.9)" : "rgba(255, 255, 255, 0.84)")};

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const CandidateName = styled.div`
  color: #2f2100;
  font-size: 0.95rem;
  font-weight: 800;
`;

const CandidateMeta = styled.div`
  color: rgba(47, 33, 0, 0.65);
  font-size: 0.82rem;
  margin-top: 0.14rem;
  line-height: 1.35;
`;

const ProposalToggle = styled.button`
  border: 1px solid ${({ $selected }) => ($selected ? "rgba(35,165,90,0.35)" : "rgba(47, 33, 0, 0.12)")};
  background: ${({ $selected }) => ($selected ? "#e8f7ec" : "#fff")};
  color: ${({ $selected }) => ($selected ? "#185c2b" : "#5b4520")};
  border-radius: 10px;
  padding: 0.58rem 0.8rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ProposalState = styled.div`
  color: #7a4a00;
  font-size: 0.82rem;
  font-weight: 800;
`;

const FinalShopCard = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-start;
  flex-wrap: wrap;
  padding: 0.95rem;
  border-radius: 16px;
  background: rgba(232, 247, 236, 0.75);
  border: 1px solid rgba(35, 165, 90, 0.26);
`;

const CheckinList = styled.ul`
  margin: 0;
  padding-left: 1rem;
  color: #5b4520;
  line-height: 1.5;
`;

const InlineAlert = styled.div`
  border-radius: 12px;
  padding: 0.75rem 0.85rem;
  background: #fff4dd;
  color: #7a4a00;
  border: 1px solid rgba(255, 181, 34, 0.3);
`;

const MapWrap = styled.div`
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid rgba(47, 33, 0, 0.1);
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.08);
`;

const StateBox = styled.div`
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(47, 33, 0, 0.08);
  padding: 1rem;
  color: #6c5830;
`;

const CompactList = styled.div`
  display: grid;
  gap: 0.55rem;
  margin-top: 0.8rem;
`;

const CompactCard = styled.button`
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
  align-items: center;
  padding: 0.8rem 0.85rem;
  border-radius: 14px;
  border: 1px solid rgba(47, 33, 0, 0.08);
  background: rgba(255, 255, 255, 0.84);
  cursor: pointer;
  color: #2f2100;
  text-align: left;

  span {
    color: rgba(47, 33, 0, 0.62);
    font-size: 0.8rem;
    font-weight: 700;
  }
`;

const MiniState = styled.div`
  margin-top: 0.75rem;
  color: rgba(47, 33, 0, 0.62);
  font-size: 0.9rem;
`;

const MutedText = styled.div`
  color: rgba(47, 33, 0, 0.58);
  font-size: 0.84rem;
`;
