import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Header from '../Header';
import { useUser } from '../context/UserContext';

const PIE_COLORS = ['#f97316', '#0f766e', '#0ea5e9', '#eab308', '#8b5cf6', '#ef4444', '#14b8a6'];

const parseDistribution = (value) => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Verteilung konnte nicht geparst werden:', error);
    return [];
  }
};

const formatDateLabel = (value) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
};

const formatDistributionLabel = (entry, fallbackKey, fallbackValue) => ({
  label: entry?.[fallbackKey] || fallbackValue,
  value: Number(entry?.anzahl) || 0,
});

function AdminWeeklyStats() {
  const { userId, isLoggedIn } = useUser();
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const isAdmin = Number(userId) === 1;

  useEffect(() => {
    if (!isLoggedIn || !isAdmin || !apiUrl) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiUrl}/admin/get_weekly_stats.php`);
        if (!response.ok) {
          throw new Error(`Weekly stats request failed with status ${response.status}`);
        }

        const json = await response.json();
        const rows = Array.isArray(json?.weeks) ? json.weeks : [];

        if (!cancelled) {
          setWeeks(rows);
        }
      } catch (fetchError) {
        console.error('Fehler beim Laden der Admin-Statistiken:', fetchError);
        if (!cancelled) {
          setError(fetchError);
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
  }, [apiUrl, isAdmin, isLoggedIn]);

  const chartData = useMemo(() => (
    weeks.map((week) => ({
      ...week,
      label: formatDateLabel(week.start_datum),
      neue_nutzer: Number(week.neue_nutzer) || 0,
      checkins: Number(week.checkins) || 0,
      aktive_nutzer: Number(week.aktive_nutzer) || 0,
      gesamt_eisdielen: Number(week.gesamt_eisdielen) || 0,
      gesamt_checkins: Number(week.gesamt_checkins) || 0,
      gesamt_nutzer: Number(week.gesamt_nutzer) || 0,
    }))
  ), [weeks]);

  const latestWeek = weeks.length > 0 ? weeks[weeks.length - 1] : null;

  const latestCheckinTypeData = useMemo(() => (
    parseDistribution(latestWeek?.verteilung_checkins_typ).map((entry) =>
      formatDistributionLabel(entry, 'typ', 'Unbekannt')
    )
  ), [latestWeek]);

  const latestTravelData = useMemo(() => (
    parseDistribution(latestWeek?.verteilung_anreise).map((entry) =>
      formatDistributionLabel(entry, 'anreise', 'Unbekannt')
    )
  ), [latestWeek]);

  const latestImageData = useMemo(() => (
    parseDistribution(latestWeek?.verteilung_bild).map((entry) =>
      formatDistributionLabel(entry, 'bild_status', 'Unbekannt')
    )
  ), [latestWeek]);

  const summary = [
    { label: 'Neue Nutzer', value: Number(latestWeek?.neue_nutzer) || 0 },
    { label: 'Check-ins', value: Number(latestWeek?.checkins) || 0 },
    { label: 'Aktive Nutzer', value: Number(latestWeek?.aktive_nutzer) || 0 },
    { label: 'Gesamt Nutzer', value: Number(latestWeek?.gesamt_nutzer) || 0 },
  ];

  const renderTrendChart = (title, color, dataKey, type = 'bar') => (
    <ChartCard>
      <ChartTitle>{title}</ChartTitle>
      <ChartWrap>
        <ResponsiveContainer width="100%" height="100%">
          {type === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eadfcb" />
              <XAxis dataKey="label" stroke="#7c6f63" />
              <YAxis allowDecimals={false} stroke="#7c6f63" />
              <Tooltip />
              <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eadfcb" />
              <XAxis dataKey="label" stroke="#7c6f63" />
              <YAxis allowDecimals={false} stroke="#7c6f63" />
              <Tooltip />
              <Bar dataKey={dataKey} fill={color} radius={[10, 10, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </ChartWrap>
    </ChartCard>
  );

  const renderPieChart = (title, data) => (
    <ChartCard>
      <ChartTitle>{title}</ChartTitle>
      <ChartWrap>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={52}
              outerRadius={88}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`${entry.label}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [value, 'Anzahl']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartWrap>
    </ChartCard>
  );

  if (!isLoggedIn || !isAdmin) {
    return (
      <Page>
        <Header />
        <Content>
          <HeroCard>
            <HeroTitle>Admin Wochenstatistik</HeroTitle>
            <HeroText>Kein Zugriff auf diese Ansicht.</HeroText>
          </HeroCard>
        </Content>
      </Page>
    );
  }

  return (
    <Page>
      <Header />
      <Content>
        <HeroCard>
          <HeroEyebrow>Nur Admin</HeroEyebrow>
          <HeroTitle>Wochenstatistik</HeroTitle>
          <HeroText>
            Verlauf der Community-Aktivität und Verteilungen der letzten erfassten Woche.
          </HeroText>
          {latestWeek && (
            <HeroMeta>
              Letzte Woche: {formatDateLabel(latestWeek.start_datum)} bis {formatDateLabel(latestWeek.end_datum)}
            </HeroMeta>
          )}
        </HeroCard>

        {loading ? (
          <StateCard>Lade Wochenstatistik...</StateCard>
        ) : error ? (
          <StateCard>Fehler beim Laden der Wochenstatistik.</StateCard>
        ) : weeks.length === 0 ? (
          <StateCard>Keine Wochenstatistiken gefunden.</StateCard>
        ) : (
          <>
            <SummaryGrid>
              {summary.map((item) => (
                <SummaryCard key={item.label}>
                  <SummaryLabel>{item.label}</SummaryLabel>
                  <SummaryValue>{item.value}</SummaryValue>
                </SummaryCard>
              ))}
            </SummaryGrid>

            <SectionTitle>Verlauf</SectionTitle>
            <ChartGrid>
              {renderTrendChart('Neue Nutzer pro Woche', '#2563eb', 'neue_nutzer')}
              {renderTrendChart('Check-ins pro Woche', '#16a34a', 'checkins')}
              {renderTrendChart('Aktive Nutzer pro Woche', '#f59e0b', 'aktive_nutzer')}
              {renderTrendChart('Gesamtanzahl Eisdielen', '#db2777', 'gesamt_eisdielen', 'line')}
              {renderTrendChart('Gesamtanzahl Check-ins', '#7c3aed', 'gesamt_checkins', 'line')}
              {renderTrendChart('Gesamtanzahl Nutzer', '#0f766e', 'gesamt_nutzer', 'line')}
            </ChartGrid>

            <SectionTitle>Letzte Woche</SectionTitle>
            <ChartGrid>
              {renderPieChart('Verteilung nach Check-in-Typ', latestCheckinTypeData)}
              {renderPieChart('Verteilung der Anreise', latestTravelData)}
              {renderPieChart('Mit oder ohne Bild', latestImageData)}
            </ChartGrid>
          </>
        )}
      </Content>
    </Page>
  );
}

export default AdminWeeklyStats;

const Page = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(249, 115, 22, 0.18), transparent 26%),
    linear-gradient(180deg, #fff8ef 0%, #f7efdf 100%);
`;

const Content = styled.main`
  width: min(1200px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 1.5rem 0 3rem;
`;

const HeroCard = styled.section`
  background: linear-gradient(135deg, #fff3d5 0%, #ffffff 100%);
  border: 1px solid rgba(124, 111, 99, 0.14);
  border-radius: 28px;
  padding: 1.5rem;
  box-shadow: 0 18px 50px rgba(92, 72, 43, 0.08);
`;

const HeroEyebrow = styled.div`
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #b45309;
  margin-bottom: 0.35rem;
`;

const HeroTitle = styled.h1`
  margin: 0;
  color: #33251a;
  font-size: clamp(2rem, 5vw, 3.2rem);
`;

const HeroText = styled.p`
  margin: 0.75rem 0 0;
  color: #6f6258;
  font-size: 1rem;
`;

const HeroMeta = styled.p`
  margin: 0.8rem 0 0;
  color: #8b6f47;
  font-weight: 700;
`;

const StateCard = styled.div`
  margin-top: 1.25rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  padding: 1.4rem;
  color: #5e5145;
  border: 1px solid rgba(124, 111, 99, 0.12);
`;

const SummaryGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-top: 1.25rem;
`;

const SummaryCard = styled.article`
  background: #fff;
  border-radius: 24px;
  padding: 1.15rem 1.2rem;
  border: 1px solid rgba(124, 111, 99, 0.12);
  box-shadow: 0 12px 32px rgba(92, 72, 43, 0.06);
`;

const SummaryLabel = styled.div`
  color: #7c6f63;
  font-size: 0.88rem;
`;

const SummaryValue = styled.div`
  margin-top: 0.35rem;
  color: #2d2118;
  font-size: 2rem;
  font-weight: 800;
`;

const SectionTitle = styled.h2`
  margin: 1.8rem 0 0.9rem;
  color: #33251a;
  font-size: 1.35rem;
`;

const ChartGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
`;

const ChartCard = styled.article`
  background: rgba(255, 255, 255, 0.92);
  border-radius: 24px;
  padding: 1rem;
  border: 1px solid rgba(124, 111, 99, 0.12);
  box-shadow: 0 14px 36px rgba(92, 72, 43, 0.06);
`;

const ChartTitle = styled.h3`
  margin: 0 0 0.75rem;
  color: #3f3126;
  font-size: 1rem;
`;

const ChartWrap = styled.div`
  width: 100%;
  height: 320px;
`;
