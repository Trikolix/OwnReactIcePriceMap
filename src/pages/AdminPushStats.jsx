import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Header from "../Header";
import { useUser } from "../context/UserContext";

const toDateInputValue = (date) => date.toISOString().slice(0, 10);

const defaultStartDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return toDateInputValue(date);
};

const numberValue = (value) => Number(value || 0);

const normalizeStatsRows = (rows = []) => rows.map((row) => ({
  ...row,
  expected: numberValue(row.expected),
  provider_accepted: numberValue(row.provider_accepted),
  confirmed: numberValue(row.confirmed),
  clicked: numberValue(row.clicked),
  failed: numberValue(row.failed),
  pending: numberValue(row.pending),
}));

export default function AdminPushStats() {
  const { userId, isLoggedIn } = useUser();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const isAdmin = [1, 2].includes(Number(userId));

  const [start, setStart] = useState(defaultStartDate);
  const [end, setEnd] = useState(() => toDateInputValue(new Date()));
  const [channel, setChannel] = useState("all");
  const [type, setType] = useState("all");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!apiUrl || !isLoggedIn || !isAdmin) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    const params = new URLSearchParams({ start, end, channel, type });

    const loadStats = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${apiUrl}/admin/push_stats.php?${params.toString()}`);
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.message || `Push stats request failed with status ${response.status}`);
        }
        if (!cancelled) {
          setData(json);
        }
      } catch (fetchError) {
        console.error("Fehler beim Laden der Push-Statistiken:", fetchError);
        if (!cancelled) {
          setError(fetchError.message || "Fehler beim Laden der Push-Statistiken.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadStats();
    return () => {
      cancelled = true;
    };
  }, [apiUrl, channel, end, isAdmin, isLoggedIn, start, type]);

  const summary = useMemo(() => ({
    expected: numberValue(data?.summary?.expected),
    provider_accepted: numberValue(data?.summary?.provider_accepted),
    confirmed: numberValue(data?.summary?.confirmed),
    clicked: numberValue(data?.summary?.clicked),
    failed: numberValue(data?.summary?.failed),
    pending: numberValue(data?.summary?.pending),
  }), [data]);

  const byDay = useMemo(() => normalizeStatsRows(data?.by_day).map((row) => ({
    ...row,
    label: row.day,
  })), [data]);

  const byChannel = useMemo(() => normalizeStatsRows(data?.by_channel), [data]);
  const byType = useMemo(() => normalizeStatsRows(data?.by_type), [data]);
  const availableTypes = Array.isArray(data?.types) ? data.types : [];

  const deliveryRate = summary.expected > 0
    ? Math.round((summary.confirmed / summary.expected) * 100)
    : 0;
  const clickRate = summary.confirmed > 0
    ? Math.round((summary.clicked / summary.confirmed) * 100)
    : 0;

  if (!isLoggedIn || !isAdmin) {
    return (
      <Page>
        <Header />
        <Content>
          <Hero>
            <HeroTitle>Push-Statistik</HeroTitle>
            <HeroText>Kein Zugriff auf diese Ansicht.</HeroText>
          </Hero>
        </Content>
      </Page>
    );
  }

  return (
    <Page>
      <Header />
      <Content>
        <Hero>
          <HeroEyebrow>Nur Admin</HeroEyebrow>
          <HeroTitle>Push-Statistik</HeroTitle>
          <HeroText>Auswertung pro Gerät für Web Push und Android Push.</HeroText>
          <Filters>
            <FilterField>
              <label htmlFor="push-start">Von</label>
              <input id="push-start" type="date" value={start} onChange={(event) => setStart(event.target.value)} />
            </FilterField>
            <FilterField>
              <label htmlFor="push-end">Bis</label>
              <input id="push-end" type="date" value={end} onChange={(event) => setEnd(event.target.value)} />
            </FilterField>
            <FilterField>
              <label htmlFor="push-channel">Kanal</label>
              <select id="push-channel" value={channel} onChange={(event) => setChannel(event.target.value)}>
                <option value="all">Alle</option>
                <option value="web">Web</option>
                <option value="android">Android</option>
              </select>
            </FilterField>
            <FilterField>
              <label htmlFor="push-type">Typ</label>
              <select id="push-type" value={type} onChange={(event) => setType(event.target.value)}>
                <option value="all">Alle</option>
                {availableTypes.map((entry) => (
                  <option key={entry} value={entry}>{entry}</option>
                ))}
              </select>
            </FilterField>
          </Filters>
        </Hero>

        {loading ? (
          <StateCard>Lade Push-Statistiken...</StateCard>
        ) : error ? (
          <StateCard>{error}</StateCard>
        ) : (
          <>
            <SummaryGrid>
              <Metric label="Erwartet" value={summary.expected} />
              <Metric label="Provider akzeptiert" value={summary.provider_accepted} />
              <Metric label="Bestätigt" value={summary.confirmed} helper={`${deliveryRate}% der erwarteten Deliveries`} />
              <Metric label="Geklickt" value={summary.clicked} helper={`${clickRate}% der bestätigten Deliveries`} />
              <Metric label="Fehlgeschlagen" value={summary.failed} />
              <Metric label="Ausstehend" value={summary.pending} />
            </SummaryGrid>

            <ChartGrid>
              <ChartCard>
                <ChartTitle>Verlauf</ChartTitle>
                <ChartWrap>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={byDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d9e2df" />
                      <XAxis dataKey="label" stroke="#51615d" />
                      <YAxis allowDecimals={false} stroke="#51615d" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="expected" name="Erwartet" stroke="#2563eb" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="confirmed" name="Bestätigt" stroke="#0f766e" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="clicked" name="Geklickt" stroke="#d97706" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="failed" name="Fehler" stroke="#dc2626" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartWrap>
              </ChartCard>
              <ChartCard>
                <ChartTitle>Kanäle</ChartTitle>
                <ChartWrap>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byChannel}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d9e2df" />
                      <XAxis dataKey="channel" stroke="#51615d" />
                      <YAxis allowDecimals={false} stroke="#51615d" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="expected" name="Erwartet" fill="#2563eb" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="confirmed" name="Bestätigt" fill="#0f766e" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="clicked" name="Geklickt" fill="#d97706" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="failed" name="Fehler" fill="#dc2626" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartWrap>
              </ChartCard>
            </ChartGrid>

            <SectionTitle>Nach Typ</SectionTitle>
            <DataTable>
              <thead>
                <tr>
                  <th>Typ</th>
                  <th>Erwartet</th>
                  <th>Provider</th>
                  <th>Bestätigt</th>
                  <th>Geklickt</th>
                  <th>Fehler</th>
                  <th>Ausstehend</th>
                </tr>
              </thead>
              <tbody>
                {byType.length === 0 ? (
                  <tr><td colSpan="7">Keine Push-Deliveries im gewählten Zeitraum.</td></tr>
                ) : byType.map((row) => (
                  <tr key={row.type}>
                    <td>{row.type}</td>
                    <td>{row.expected}</td>
                    <td>{row.provider_accepted}</td>
                    <td>{row.confirmed}</td>
                    <td>{row.clicked}</td>
                    <td>{row.failed}</td>
                    <td>{row.pending}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>

            <SectionTitle>Letzte Fehler</SectionTitle>
            <DataTable>
              <thead>
                <tr>
                  <th>Zeit</th>
                  <th>Kanal</th>
                  <th>Nutzer</th>
                  <th>Typ</th>
                  <th>Status</th>
                  <th>Fehler</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recent_failures || []).length === 0 ? (
                  <tr><td colSpan="6">Keine Fehler im gewählten Zeitraum.</td></tr>
                ) : data.recent_failures.map((row) => (
                  <tr key={row.id}>
                    <td>{row.created_at}</td>
                    <td>{row.channel}</td>
                    <td>{row.username || "-"}</td>
                    <td>{row.type}</td>
                    <td>{row.provider_status_code || "-"}</td>
                    <td>{row.last_error || row.provider_response || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </>
        )}
      </Content>
    </Page>
  );
}

function Metric({ label, value, helper = "" }) {
  return (
    <MetricCard>
      <MetricLabel>{label}</MetricLabel>
      <MetricValue>{value}</MetricValue>
      {helper && <MetricHelper>{helper}</MetricHelper>}
    </MetricCard>
  );
}

const Page = styled.div`
  min-height: 100vh;
  background: linear-gradient(180deg, #f5fbf8 0%, #eef4f1 100%);
`;

const Content = styled.main`
  width: min(1220px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 1.5rem 0 3rem;
`;

const Hero = styled.section`
  background: #ffffff;
  border: 1px solid rgba(15, 118, 110, 0.14);
  border-radius: 18px;
  padding: 1.4rem;
  box-shadow: 0 16px 38px rgba(30, 58, 52, 0.08);
`;

const HeroEyebrow = styled.div`
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  margin-bottom: 0.35rem;
`;

const HeroTitle = styled.h1`
  margin: 0;
  color: #17231f;
  font-size: 2.25rem;
`;

const HeroText = styled.p`
  margin: 0.55rem 0 0;
  color: #53645f;
`;

const Filters = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.8rem;
  margin-top: 1.1rem;
`;

const FilterField = styled.div`
  display: grid;
  gap: 0.35rem;

  label {
    color: #53645f;
    font-weight: 700;
    font-size: 0.88rem;
  }

  input,
  select {
    min-height: 42px;
    border: 1px solid rgba(83, 100, 95, 0.22);
    border-radius: 8px;
    padding: 0.55rem 0.7rem;
    background: #fbfdfc;
    color: #17231f;
    font-weight: 600;
  }
`;

const StateCard = styled.div`
  margin-top: 1rem;
  padding: 1.2rem;
  background: #ffffff;
  border: 1px solid rgba(83, 100, 95, 0.14);
  border-radius: 12px;
  color: #53645f;
`;

const SummaryGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 0.9rem;
  margin-top: 1rem;
`;

const MetricCard = styled.article`
  background: #ffffff;
  border: 1px solid rgba(83, 100, 95, 0.14);
  border-radius: 12px;
  padding: 1rem;
`;

const MetricLabel = styled.div`
  color: #53645f;
  font-size: 0.86rem;
  font-weight: 700;
`;

const MetricValue = styled.div`
  margin-top: 0.35rem;
  color: #17231f;
  font-size: 2rem;
  font-weight: 850;
`;

const MetricHelper = styled.div`
  margin-top: 0.25rem;
  color: #0f766e;
  font-size: 0.82rem;
  font-weight: 700;
`;

const ChartGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(330px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const ChartCard = styled.article`
  background: #ffffff;
  border: 1px solid rgba(83, 100, 95, 0.14);
  border-radius: 12px;
  padding: 1rem;
`;

const ChartTitle = styled.h2`
  margin: 0 0 0.8rem;
  color: #17231f;
  font-size: 1.05rem;
`;

const ChartWrap = styled.div`
  width: 100%;
  height: 320px;
`;

const SectionTitle = styled.h2`
  margin: 1.5rem 0 0.75rem;
  color: #17231f;
  font-size: 1.25rem;
`;

const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: #ffffff;
  border: 1px solid rgba(83, 100, 95, 0.14);
  border-radius: 12px;
  overflow: hidden;

  th,
  td {
    padding: 0.75rem;
    border-bottom: 1px solid rgba(83, 100, 95, 0.12);
    text-align: left;
    color: #17231f;
    vertical-align: top;
  }

  th {
    background: #edf7f4;
    color: #30443e;
    font-size: 0.84rem;
  }

  td {
    font-size: 0.9rem;
  }
`;
