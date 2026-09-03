// @vitest-environment jsdom
import '../setup.js';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useUser: vi.fn(),
}));

vi.mock('../../src/context/UserContext', () => ({
  useUser: mocks.useUser,
}));

vi.mock('../../src/components/LikeButton', () => ({
  default: () => <button type="button">Gefällt mir</button>,
}));

vi.mock('../../src/components/UserAvatar', () => ({
  default: () => <span aria-hidden="true">Avatar</span>,
}));

vi.mock('../../src/components/ImageGalleryWithLightbox', () => ({
  default: () => <div>Galerie</div>,
}));

vi.mock('../../src/components/CommentSection', () => ({
  default: () => <div>Kommentare</div>,
}));

vi.mock('../../src/CheckinForm', () => ({
  default: () => <div>Check-in bearbeiten</div>,
}));

vi.mock('../../src/components/CheckinShareComposer', () => ({
  default: ({ onClose }) => (
    <div role="dialog" aria-label="Story Composer">
      <button type="button" onClick={onClose}>Schließen</button>
    </div>
  ),
}));

import CheckinCard from '../../src/components/CheckinCard';

const checkin = {
  id: 91,
  nutzer_id: 7,
  nutzer_name: 'Eisfreund',
  avatar_url: '',
  datum: '2026-08-20T10:00:00',
  eisdiele_id: 12,
  eisdiele_name: 'Gelateria Test',
  typ: 'Kugel',
  eissorten: [],
  geschmackbewertung: null,
  größenbewertung: null,
  preisleistungsbewertung: null,
  waffelbewertung: null,
  anreise: '',
  is_on_site: 0,
  kommentar: '',
  bilder: [],
  likes_count: 0,
  has_liked: false,
  commentCount: 0,
};

function renderCard(value = checkin) {
  return render(<MemoryRouter><CheckinCard checkin={value} /></MemoryRouter>);
}

describe('CheckinCard share action', () => {
  beforeEach(() => {
    mocks.useUser.mockReturnValue({ userId: 7 });
  });

  it('uses the same shared action style as the comment button and opens the composer', () => {
    renderCard();

    const comments = screen.getByRole('button', { name: /Kommentar/ });
    const share = screen.getByRole('button', { name: 'Story teilen' });
    expect(share.className).toBe(comments.className);

    fireEvent.click(share);
    expect(screen.getByRole('dialog', { name: 'Story Composer' })).not.toBeNull();
  });

  it('does not offer sharing on another user’s check-in', () => {
    renderCard({ ...checkin, nutzer_id: 8 });
    expect(screen.queryByRole('button', { name: 'Story teilen' })).toBeNull();
  });
});
