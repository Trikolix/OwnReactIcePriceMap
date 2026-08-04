import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Header from '../Header';
import AwardCard from '../components/AwardCard';
import NewUserCard from '../components/NewUserCard';

const TARGET_TYPES = new Set(['award', 'new_user']);

const buildDashboardFocusUrl = (type, id, focusCommentId) => {
  const params = new URLSearchParams();
  if (type === 'award') params.set('focusAward', id);
  if (type === 'new_user') params.set('focusNewUser', id);
  if (focusCommentId) params.set('focusComment', focusCommentId);
  return `/dashboard?${params.toString()}`;
};

function DashboardTarget() {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const location = useLocation();
  const navigate = useNavigate();
  const [target, setTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const queryParams = new URLSearchParams(location.search);
  const type = queryParams.get('type') || '';
  const id = queryParams.get('id') || '';
  const focusCommentId = queryParams.get('focusComment');

  useEffect(() => {
    const controller = new AbortController();

    if (!TARGET_TYPES.has(type) || !id) {
      setError(new Error('Ungültiges Dashboard-Ziel.'));
      setLoading(false);
      return () => controller.abort();
    }

    setLoading(true);
    setError(null);
    setTarget(null);

    fetch(`${apiUrl}/activity_feed.php?mode=target&type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const json = await response.json().catch(() => ({}));
        if (!response.ok || !json.target) {
          throw new Error('Das Dashboard-Item konnte nicht gefunden werden.');
        }
        return json;
      })
      .then((json) => {
        if (json.meta?.historical === false) {
          navigate(buildDashboardFocusUrl(type, id, focusCommentId), { replace: true });
          return;
        }
        setTarget(json.target);
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setError(requestError);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [apiUrl, type, id, focusCommentId, navigate]);

  return (
    <Page>
      <Header />
      <Container>
        <BackLink to="/dashboard">← Zum Aktivitäten-Dashboard</BackLink>
        <Title>Aktivität</Title>

        {loading && <Message>Lade das Dashboard-Item…</Message>}
        {error && (
          <Message role="alert">
            {error.message} <BackLink to="/dashboard">Zum Dashboard</BackLink>
          </Message>
        )}

        {!loading && !error && target?.typ === 'award' && (
          <AwardCard
            award={target.data}
            showComments={Boolean(focusCommentId)}
            focusCommentId={focusCommentId}
          />
        )}
        {!loading && !error && target?.typ === 'new_user' && (
          <NewUserCard
            user={target.data}
            showComments={Boolean(focusCommentId)}
            focusCommentId={focusCommentId}
          />
        )}
      </Container>
    </Page>
  );
}

export default DashboardTarget;

const Page = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(255, 218, 140, 0.35), transparent 40%),
    linear-gradient(180deg, #fff9ef 0%, #fff4da 100%);
`;

const Container = styled.main`
  width: min(96%, 1200px);
  margin: 0 auto;
  padding: 1rem 0 3rem;
`;

const Title = styled.h2`
  margin: 0.75rem 0 1rem;
  text-align: center;
  color: #2f2100;
`;

const Message = styled.div`
  padding: 1rem;
  border: 1px solid rgba(47, 33, 0, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.75);
  color: #6b5327;
  text-align: center;
`;

const BackLink = styled(Link)`
  color: #6c4300;
  font-weight: 700;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;
