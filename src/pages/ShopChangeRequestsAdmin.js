import Header from './../Header';
import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useUser } from "../context/UserContext";
import { formatOpeningHoursLines, hydrateOpeningHours } from "../utils/openingHours";

const statusOptions = [
  { value: "pending", label: "Offen" },
  { value: "approved", label: "Genehmigt" },
  { value: "rejected", label: "Abgelehnt" },
  { value: "all", label: "Alle" },
];

const fieldLabels = {
  name: "Name",
  adresse: "Adresse",
  website: "Website",
  openingHours: "Öffnungszeiten",
  openingHoursNote: "Öffnungszeiten-Hinweis",
  openingHoursStructured: "Öffnungszeiten (Vorschlag)",
  status: "Status",
  reopening_date: "Wiedereröffnungsdatum",
};

const ShopChangeRequestsAdmin = () => {
  const { isLoggedIn, userId } = useUser();
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const [requests, setRequests] = useState([]);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messageMap, setMessageMap] = useState({});
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const isAdmin = useMemo(() => Number(userId) === 1, [userId]);

  const fetchRequests = useCallback(async () => {
    if (!isAdmin || !apiUrl) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${apiUrl}/admin/get_shop_change_requests.php?status=${filterStatus}`
      );
      const data = await response.json();
      if (data?.requests) {
        setRequests(data.requests);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error("get_shop_change_requests", err);
      setError("Fehler beim Laden der Vorschläge.");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, filterStatus, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchRequests();
    }
  }, [fetchRequests, isAdmin]);

  const handleDecision = async (requestId, action) => {
    if (!apiUrl) return;
    setActionLoadingId(requestId);
    setError("");
    try {
      const response = await fetch(
        `${apiUrl}/admin/handle_shop_change_request.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId,
            action,
            adminId: userId,
            adminMessage: messageMap[requestId] || "",
          }),
        }
      );
      const data = await response.json();
      if (data.status === "success") {
        setMessageMap((prev) => {
          const clone = { ...prev };
          delete clone[requestId];
          return clone;
        });
        fetchRequests();
      } else {
        setError(data.message || "Aktion fehlgeschlagen.");
      }
    } catch (err) {
      console.error("handle_shop_change_request", err);
      setError("Aktion fehlgeschlagen.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderChangeValue = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "boolean") return value ? "Ja" : "Nein";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") {
      const structured = hydrateOpeningHours(value);
      const lines = formatOpeningHoursLines(structured);
      if (lines.length === 0) {
        return <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(value, null, 2)}</pre>;
      }
      return (
        <LinesList>
          {lines.map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </LinesList>
      );
    }
    return value;
  };

  const getCurrentFieldValue = (request, field) => {
    switch (field) {
      case "name":
        return request.shop_name;
      case "adresse":
        return request.shop_address;
      case "website":
        return request.shop_website;
      case "openingHours":
        return request.shop_opening_hours;
      case "openingHoursNote":
        return request.shop_opening_hours_note;
      case "openingHoursStructured":
        return request.shop_opening_hours_structured;
      case "status":
        return request.shop_status;
      case "reopening_date":
        return request.shop_reopening_date;
      default:
        return "";
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />
      <PageWrapper>
        <CenteredCard>Bitte melde dich an, um diese Seite zu sehen.</CenteredCard>
      </PageWrapper>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />
      <PageWrapper>
        <CenteredCard>Du hast keinen Zugriff auf diese Seite.</CenteredCard>
      </PageWrapper>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />
    <PageWrapper>
      <HeaderRow>
        <h1>Eisdielen-Änderungsvorschläge</h1>
        <StatusSelect
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </StatusSelect>
      </HeaderRow>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {loading ? (
        <CenteredCard>Lade Vorschläge ...</CenteredCard>
      ) : requests.length === 0 ? (
        <CenteredCard>Keine Vorschläge für diesen Status.</CenteredCard>
      ) : (
        <RequestGrid>
          {requests.map((request) => (
            <RequestCard key={request.id}>
              <CardHeader>
                <div>
                  <ShopName>{request.shop_name}</ShopName>
                  <small>
                    #{request.eisdiele_id} · {request.shop_address || "keine Adresse"}
                  </small>
                </div>
                <StatusBadge $status={request.status}>
                  {statusOptions.find((opt) => opt.value === request.status)?.label ||
                    request.status}
                </StatusBadge>
              </CardHeader>

              <MetaRow>
                <div>
                  Eingereicht von <strong>{request.requester_name}</strong>
                </div>
                <div>
                  am{" "}
                  {new Date(request.created_at).toLocaleString("de-DE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
              </MetaRow>

              {request.changes && Object.keys(request.changes).length > 0 ? (
                <ChangeList>
                  {Object.entries(request.changes).map(([field, value]) => {
                    const currentValue = getCurrentFieldValue(request, field);
                    const isChange = String(currentValue) !== String(value);
                    const isRemoval = isChange && (value === null || value === '' || value === undefined);
                    return (
                      <ChangeRow key={field}>
                        <ChangeLabel>{fieldLabels[field] || field}</ChangeLabel>
                        <ChangeValues>
                          <span>
                            <Muted>Aktuell:</Muted>{" "}
                            {renderChangeValue(currentValue)}
                          </span>
                          <span>
                            <Muted>Vorschlag:</Muted>{" "}
                            {isChange ? (
                              <ChangeHighlight $removal={isRemoval}>
                                <strong>{renderChangeValue(value)}</strong>
                              </ChangeHighlight>
                            ) : (
                              renderChangeValue(value)
                            )}
                          </span>
                        </ChangeValues>
                      </ChangeRow>
                    );
                  })}

                </ChangeList>
              ) : (
                <Muted style={{ display: "block", margin: "0.75rem 0" }}>
                  Keine Feldänderungen übermittelt.
                </Muted>
              )}

              {request.status === "pending" && (
                <>
                  <NoteTextarea
                    placeholder="Optionaler Hinweis für die Benachrichtigung …"
                    value={messageMap[request.id] || ""}
                    onChange={(e) =>
                      setMessageMap((prev) => ({ ...prev, [request.id]: e.target.value }))
                    }
                  />
                  <ButtonRow>
                    <SecondaryButton
                      type="button"
                      disabled={actionLoadingId === request.id}
                      onClick={() => handleDecision(request.id, "reject")}
                    >
                      Ablehnen
                    </SecondaryButton>
                    <PrimaryButton
                      type="button"
                      disabled={actionLoadingId === request.id}
                      onClick={() => handleDecision(request.id, "approve")}
                    >
                      Genehmigen
                    </PrimaryButton>
                  </ButtonRow>
                </>
              )}
            </RequestCard>
          ))}
        </RequestGrid>
      )}
    </PageWrapper>
    </div>
  );
};

export default ShopChangeRequestsAdmin;

const PageWrapper = styled.div`
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 1rem 2rem;
`;

const HeaderRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;

  h1 {
    margin: 0;
    font-size: 1.75rem;
  }
`;

const StatusSelect = styled.select`
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #ccc;
`;

const RequestGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const RequestCard = styled.div`
  border: 1px solid #e6e6e6;
  border-radius: 16px;
  padding: 1.25rem;
  background: #fff;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.05);
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 0.5rem;
`;

const ShopName = styled.h2`
  margin: 0;
  font-size: 1.2rem;
`;

const StatusBadge = styled.span`
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  background: ${({ $status: status }) => {
    if (status === "approved") return "rgba(46, 204, 113, 0.15)";
    if (status === "rejected") return "rgba(231, 76, 60, 0.15)";
    return "rgba(241, 196, 15, 0.2)";
  }};
  color: ${({ $status: status }) => {
    if (status === "approved") return "#1e8449";
    if (status === "rejected") return "#c0392b";
    return "#af7817";
  }};
`;

const MetaRow = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  font-size: 0.9rem;
  color: #4f4f4f;
  margin-bottom: 1rem;
  gap: 0.4rem 1rem;
`;

const ChangeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const ChangeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
`;

const ChangeLabel = styled.div`
  font-weight: 600;
  min-width: 140px;
`;

const ChangeValues = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.95rem;
`;

const Muted = styled.span`
  color: #7a7a7a;
`;

const LinesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  white-space: pre-wrap;
`;

const NoteTextarea = styled.textarea`
  width: 95%;
  min-height: 70px;
  border-radius: 10px;
  border: 1px solid #ddd;
  padding: 0.75rem;
  font-family: inherit;
  resize: vertical;
  margin-bottom: 0.75rem;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

const BaseButton = styled.button`
  border: none;
  border-radius: 10px;
  font-weight: 600;
  padding: 0.6rem 1.4rem;
  cursor: pointer;
  transition: transform 0.05s ease, opacity 0.15s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }
`;

const PrimaryButton = styled(BaseButton)`
  background: #2ecc71;
  color: white;

  &:hover:not(:disabled) {
    background: #27ae60;
  }
`;

const SecondaryButton = styled(BaseButton)`
  background: #f0f0f0;
  color: #444;

  &:hover:not(:disabled) {
    background: #e0e0e0;
  }
`;

const CenteredCard = styled.div`
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  border: 1px dashed #bbb;
  background: #fff;
`;

const ErrorBanner = styled.div`
  background: #fdecea;
  color: #a93226;
  border: 1px solid #f5b7b1;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
`;

const ChangeHighlight = styled.span`
  color: ${({ $removal }) => ($removal ? '#c0392b' : '#1e8449')};
  font-weight: bold;
`;
