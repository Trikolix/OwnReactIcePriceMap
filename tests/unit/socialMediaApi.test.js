import {
  downloadSocialMediaPack,
  fetchSocialMediaCandidates,
  fetchSocialMediaPreview,
} from '../../src/features/socialMedia/api';

describe('social media admin API', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads candidates with filters and bearer authentication', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'success', data: [], pagination: { total: 0 } }),
    });

    await fetchSocialMediaCandidates('token-123', {
      search: 'Mia',
      page: 2,
      limit: 24,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/social_media/list_candidates.php?'),
      expect.objectContaining({
        headers: { Authorization: 'Bearer token-123' },
      }),
    );
    expect(global.fetch.mock.calls[0][0]).toContain('search=Mia');
    expect(global.fetch.mock.calls[0][0]).toContain('page=2');
  });

  it('reports binary export errors returned by the backend', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ message: 'Bitte mindestens ein Bild auswählen.' }),
    });

    await expect(downloadSocialMediaPack('token-123', { image_ids: [] }))
      .rejects.toThrow('Bitte mindestens ein Bild auswählen.');
  });

  it('requests a generated single-slide preview', async () => {
    global.URL.createObjectURL = jest.fn(() => 'blob:preview');
    global.fetch.mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['png']),
    });

    const previewUrl = await fetchSocialMediaPreview('token-123', {
      image_ids: [42],
      format: 'feed',
      mode: 'composite',
      slide: 'review',
    });

    expect(previewUrl).toBe('blob:preview');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/social_media/download_pack.php'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          image_ids: [42],
          format: 'feed',
          mode: 'composite',
          slide: 'review',
          single: true,
        }),
      }),
    );
  });
});
