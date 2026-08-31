import React, { useState } from 'react';
import styled from 'styled-components';
import { useUser } from '../context/UserContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const PLACE_LABELS = {
  restaurant: 'Restaurant/Café',
  temporary_stand: 'Temporärer Stand',
};

const SecondaryPlaceActions = ({ place, onChanged }) => {
  const { isLoggedIn, userId } = useUser();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const placeType = place?.place_type || 'ice_shop';

  if (placeType === 'ice_shop') return null;

  const post = async (path, payload) => {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Die Aktion konnte nicht ausgeführt werden.');
      setMessage(data.message || 'Gespeichert.');
      onChanged?.();
    } catch (error) {
      setMessage(error.message || 'Die Aktion konnte nicht ausgeführt werden.');
    } finally {
      setBusy(false);
    }
  };

  const reportPlace = () => {
    const details = window.prompt('Was stimmt mit diesem Eis-Ort nicht? (optional)');
    if (details === null) return;
    post('place/report.php', {
      place_id: place.id,
      reason: placeType === 'temporary_stand' ? 'already_closed' : 'wrong_details',
      details,
    });
  };

  const closeStand = () => {
    if (!window.confirm('Diesen Stand vorzeitig schließen? Er verschwindet sofort von Karte und Suche.')) return;
    post('place/close_temporary.php', { place_id: place.id });
  };

  return (
    <Panel>
      <strong>{PLACE_LABELS[placeType]}</strong>
      {placeType === 'temporary_stand' && place.active_until && (
        <span>Geplant bis {new Date(place.active_until).toLocaleString('de-DE')} aktiv.</span>
      )}
      {isLoggedIn && (
        <Actions>
          {placeType === 'temporary_stand' && (Number(place.user_id) === Number(userId) || Number(userId) === 1) && !place.closed_early_at && (
            <button type="button" disabled={busy} onClick={closeStand}>Stand vorzeitig schließen</button>
          )}
          <button type="button" disabled={busy} onClick={reportPlace}>Ort melden</button>
        </Actions>
      )}
      {message && <Message>{message}</Message>}
    </Panel>
  );
};

export default SecondaryPlaceActions;

const Panel = styled.div`
  display: grid;
  gap: 0.5rem;
  padding: 0.85rem;
  border: 1px solid #d9e4f0;
  border-radius: 12px;
  background: #f7fafc;
  color: #334155;
  font-size: 0.9rem;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  button {
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 0.45rem 0.7rem;
    background: white;
    color: #334155;
    cursor: pointer;
  }
`;

const Message = styled.span`
  color: #475569;
`;
