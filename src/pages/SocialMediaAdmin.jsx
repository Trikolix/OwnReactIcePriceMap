import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import Header from '../Header';
import { useUser } from '../context/UserContext';
import { buildAssetUrl } from '../utils/assets.jsx';
import {
  downloadSocialMediaPack,
  downloadSocialMediaOriginal,
  fetchSocialMediaCandidates,
  fetchSocialMediaPreview,
} from '../features/socialMedia/api';

const PAGE_SIZE = 24;

const formatDate = (value) => {
  if (!value) return 'Kein Datum';
  const date = new Date(value.replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('de-DE');
};

const SocialMediaAdmin = () => {
  const { userId, isLoggedIn, authReady, authToken } = useUser();
  const isAdmin = Number(userId) === 1;
  const [filters, setFilters] = useState({ search: '', type: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [selectedIds, setSelectedIds] = useState([]);
  const [format, setFormat] = useState('story');
  const [mode, setMode] = useState('composite');
  const [includeReviewSlide, setIncludeReviewSlide] = useState(true);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [previewSlide, setPreviewSlide] = useState('photo');
  const [previewFormat, setPreviewFormat] = useState('story');
  const [previewMode, setPreviewMode] = useState('composite');
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewDownloading, setPreviewDownloading] = useState(false);
  const [originalDownloading, setOriginalDownloading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadCandidates = useCallback(async () => {
    if (!authToken || !isAdmin) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchSocialMediaCandidates(authToken, {
        ...filters,
        page,
        limit: PAGE_SIZE,
      });
      setItems(Array.isArray(data.data) ? data.data : []);
      setPagination(data.pagination || { total: 0, pages: 0 });
    } catch (loadError) {
      setError(loadError.message || 'Foto-Kandidaten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [authToken, filters, isAdmin, page]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  useEffect(() => {
    setSelectedIds([]);
  }, [filters, page]);

  useEffect(() => {
    if (!previewItem || !authToken) return undefined;

    let active = true;
    let objectUrl = '';
    setPreviewLoading(true);
    setPreviewError('');
    setPreviewUrl('');

    fetchSocialMediaPreview(authToken, {
      image_ids: [previewItem.image_id],
      format: previewFormat,
      mode: previewMode,
      slide: previewSlide,
    })
      .then((url) => {
        objectUrl = url;
        if (active) setPreviewUrl(url);
        else URL.revokeObjectURL(url);
      })
      .catch((previewLoadError) => {
        if (active) setPreviewError(previewLoadError.message || 'Vorschau konnte nicht erzeugt werden.');
      })
      .finally(() => {
        if (active) setPreviewLoading(false);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [authToken, previewFormat, previewItem, previewMode, previewSlide]);

  const updateFilter = (key, value) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const toggleSelected = (imageId) => {
    setSelectedIds((current) => (
      current.includes(imageId) ? current.filter((id) => id !== imageId) : [...current, imageId]
    ));
  };

  const selectAll = () => {
    setSelectedIds(items.map((item) => item.image_id));
  };

  const openPreview = (item) => {
    setPreviewItem(item);
    setPreviewSlide('photo');
    setPreviewFormat(format);
    setPreviewMode(mode);
    setPreviewError('');
  };

  const closePreview = () => {
    setPreviewItem(null);
    setPreviewUrl('');
    setPreviewError('');
  };

  const handleDownload = async () => {
    if (selectedIds.length === 0) {
      setError('Bitte mindestens ein Bild auswählen.');
      return;
    }
    setDownloading(true);
    setError('');
    setNotice('');
    try {
      await downloadSocialMediaPack(authToken, {
        image_ids: selectedIds,
        format,
        mode,
        include_review_slide: includeReviewSlide,
      });
      setNotice(`${selectedIds.length} Bild${selectedIds.length === 1 ? '' : 'er'} wurden als ZIP heruntergeladen.`);
    } catch (downloadError) {
      setError(downloadError.message || 'Export konnte nicht erzeugt werden.');
    } finally {
      setDownloading(false);
    }
  };

  const handleSingleDownload = async (item, options = {}) => {
    const selectedFormat = options.format || format;
    const selectedMode = options.mode || mode;
    const selectedSlide = options.slide || 'photo';
    setBusyId(item.image_id);
    setError('');
    try {
      await downloadSocialMediaPack(authToken, {
        image_ids: [item.image_id],
        format: selectedFormat,
        mode: selectedMode,
        slide: selectedSlide,
        include_review_slide: false,
        single: true,
      });
      setNotice('PNG wurde heruntergeladen.');
    } catch (downloadError) {
      setError(downloadError.message || 'PNG konnte nicht heruntergeladen werden.');
    } finally {
      setBusyId(null);
    }
  };

  const handlePreviewDownload = async () => {
    if (!previewItem) return;
    setPreviewDownloading(true);
    setPreviewError('');
    try {
      await downloadSocialMediaPack(authToken, {
        image_ids: [previewItem.image_id],
        format: previewFormat,
        mode: previewMode,
        slide: previewSlide,
        include_review_slide: false,
        single: true,
      });
      setNotice('Ausgewählte PNG-Variante wurde heruntergeladen.');
    } catch (downloadError) {
      setPreviewError(downloadError.message || 'PNG konnte nicht heruntergeladen werden.');
    } finally {
      setPreviewDownloading(false);
    }
  };

  const handleOriginalDownload = async () => {
    if (!previewItem) return;
    setOriginalDownloading(true);
    setPreviewError('');
    try {
      await downloadSocialMediaOriginal(authToken, previewItem.image_id);
      setNotice('Originalbild wurde heruntergeladen.');
    } catch (downloadError) {
      setPreviewError(downloadError.message || 'Originalbild konnte nicht heruntergeladen werden.');
    } finally {
      setOriginalDownloading(false);
    }
  };

  if (!authReady) {
    return <Page><Header /><Main><Panel>Admin-Bereich wird geladen …</Panel></Main></Page>;
  }

  if (!isLoggedIn || !isAdmin) {
    return <Page><Header /><Main><Panel>Kein Zugriff. Diese Seite ist nur für Admins.</Panel></Main></Page>;
  }

  return (
    <Page>
      <Header />
      <Main>
        <PageHeader>
          <div>
            <Eyebrow>Social Media</Eyebrow>
            <Title>Instagram-Fotoexport</Title>
            <Intro>Check-in-Fotos auswählen, mit Ice-App-Infos versehen und als fertige Instagram-Bilder herunterladen.</Intro>
          </div>
          <Count>{pagination.total || 0} Kandidaten</Count>
        </PageHeader>

        <Panel>
          <FilterGrid>
            <label>
              Suche
              <input value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Nutzer oder Eisdiele" />
            </label>
            <label>
              Check-in-Typ
              <select value={filters.type} onChange={(event) => updateFilter('type', event.target.value)}>
                <option value="">Alle Typen</option>
                <option value="Kugel">Kugel</option>
                <option value="Softeis">Softeis</option>
                <option value="Eisbecher">Eisbecher</option>
              </select>
            </label>
            <label>
              Von
              <input type="date" value={filters.from} onChange={(event) => updateFilter('from', event.target.value)} />
            </label>
            <label>
              Bis
              <input type="date" value={filters.to} onChange={(event) => updateFilter('to', event.target.value)} />
            </label>
          </FilterGrid>
        </Panel>

        <Panel>
          <ExportToolbar>
            <ToolbarTitle>Export</ToolbarTitle>
            <label>
              Format
              <select value={format} onChange={(event) => setFormat(event.target.value)}>
                <option value="story">Story · 1080×1920</option>
                <option value="feed">Feed · 1080×1350</option>
              </select>
            </label>
            <label>
              Ausgabe
              <select value={mode} onChange={(event) => setMode(event.target.value)}>
                <option value="composite">Fertiges Bild</option>
                <option value="overlay">Info-Box als Overlay-PNG</option>
              </select>
            </label>
            <CheckboxLabel>
              <input type="checkbox" checked={includeReviewSlide} onChange={(event) => setIncludeReviewSlide(event.target.checked)} />
              Karten-/Bewertungs-Slide
            </CheckboxLabel>
            <ToolbarActions>
              <SecondaryButton type="button" onClick={selectAll}>Alle auswählen</SecondaryButton>
              <PrimaryButton type="button" onClick={handleDownload} disabled={downloading || selectedIds.length === 0}>
                {downloading ? 'Erzeuge ZIP …' : `ZIP herunterladen (${selectedIds.length})`}
              </PrimaryButton>
            </ToolbarActions>
          </ExportToolbar>
          <Hint>Alle angezeigten Check-in-Fotos können direkt exportiert werden. Ausführliche Check-in-Texte werden nicht veröffentlicht.</Hint>
        </Panel>

        {error && <Message $error>{error}</Message>}
        {notice && <Message>{notice}</Message>}

        {loading ? (
          <Panel>Foto-Kandidaten werden geladen …</Panel>
        ) : items.length === 0 ? (
          <Panel>Keine passenden Foto-Kandidaten gefunden.</Panel>
        ) : (
          <CardGrid>
            {items.map((item) => {
              const isSelected = selectedIds.includes(item.image_id);
              return (
                <PhotoCard key={item.image_id} $selected={isSelected}>
                  <CardImageWrap
                    onClick={() => openPreview(item)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') openPreview(item);
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Vorschau für das Foto von ${item.username} bei ${item.shop_name} öffnen`}
                  >
                    <CardImage src={buildAssetUrl(item.image_url)} alt={`Check-in-Foto von ${item.username}`} />
                    <SelectOverlay onClick={(event) => event.stopPropagation()}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelected(item.image_id)} aria-label={`Bild ${item.image_id} auswählen`} />
                      Export
                    </SelectOverlay>
                    <PreviewBadge>Vorschau</PreviewBadge>
                  </CardImageWrap>
                  <CardBody>
                    <CardTitle>{item.shop_name}</CardTitle>
                    <CardMeta>@{item.username} · {formatDate(item.checkin_date)}</CardMeta>
                    <CardMeta>{item.checkin_type}{item.flavours?.length ? ` · ${item.flavours.slice(0, 2).join(', ')}` : ''}</CardMeta>
                    <RatingLine>
                      {item.ratings?.length ? `${item.ratings.length} Einzelbewertung${item.ratings.length === 1 ? '' : 'en'}` : 'Keine Bewertung'}
                      {item.shop_latitude !== null && item.shop_longitude !== null ? ' · Standort vorhanden' : ' · Kein Standort'}
                    </RatingLine>
                    <CardActions>
                      <ActionButton type="button" onClick={() => handleSingleDownload(item)} disabled={busyId === item.image_id}>PNG laden</ActionButton>
                    </CardActions>
                  </CardBody>
                </PhotoCard>
              );
            })}
          </CardGrid>
        )}

        {pagination.pages > 1 && (
          <Pagination>
            <SecondaryButton type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>← Zurück</SecondaryButton>
            <span>Seite {page} von {pagination.pages}</span>
            <SecondaryButton type="button" onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))} disabled={page >= pagination.pages}>Weiter →</SecondaryButton>
          </Pagination>
        )}

        {previewItem && (
          <PreviewBackdrop onClick={closePreview} role="presentation">
            <PreviewDialog role="dialog" aria-modal="true" aria-label="Instagram-Vorschau" onClick={(event) => event.stopPropagation()}>
              <PreviewHeader>
                <div>
                  <Eyebrow>Vorschau</Eyebrow>
                  <PreviewTitle>{previewItem.shop_name}</PreviewTitle>
                  <PreviewMeta>{previewItem.username} · {formatDate(previewItem.checkin_date)}</PreviewMeta>
                </div>
                <CloseButton type="button" onClick={closePreview} aria-label="Vorschau schließen">×</CloseButton>
              </PreviewHeader>

              <PreviewContent>
                <PreviewImageFrame>
                  <PreviewImage
                    src={previewUrl || buildAssetUrl(previewItem.image_url)}
                    alt={`Instagram-Vorschau von ${previewItem.shop_name}`}
                  />
                  {previewLoading && <PreviewLoading>Vorschau wird erzeugt …</PreviewLoading>}
                </PreviewImageFrame>

                <PreviewControls>
                  <label>
                    Format
                    <select value={previewFormat} onChange={(event) => setPreviewFormat(event.target.value)}>
                      <option value="story">Story · 1080×1920</option>
                      <option value="feed">Feed · 1080×1350</option>
                    </select>
                  </label>
                  <label>
                    Slide
                    <select value={previewSlide} onChange={(event) => setPreviewSlide(event.target.value)}>
                      <option value="photo">Foto-Slide</option>
                      <option value="review" disabled={!previewItem.ratings?.length && (previewItem.shop_latitude === null || previewItem.shop_longitude === null)}>
                        Karten-/Bewertungs-Slide
                      </option>
                    </select>
                  </label>
                  <label>
                    Ausgabe
                    <select value={previewMode} onChange={(event) => setPreviewMode(event.target.value)}>
                      <option value="composite">Fertiges Bild</option>
                      <option value="overlay">Transparentes Overlay</option>
                    </select>
                  </label>
                  <PreviewHint>
                    {previewSlide === 'review' && !previewItem.ratings?.length && (previewItem.shop_latitude === null || previewItem.shop_longitude === null)
                      ? 'Für diesen Check-in sind weder Bewertungen noch ein Kartenstandort vorhanden.'
                      : 'Die Vorschau wird mit den ausgewählten Exportoptionen neu erzeugt.'}
                  </PreviewHint>
                  {previewError && <Message $error>{previewError}</Message>}
                  <PrimaryButton type="button" onClick={handlePreviewDownload} disabled={previewLoading || previewDownloading || Boolean(previewError)}>
                    {previewDownloading ? 'PNG wird geladen …' : 'Diese Variante herunterladen'}
                  </PrimaryButton>
                  <SecondaryButton type="button" onClick={handleOriginalDownload} disabled={originalDownloading}>
                    {originalDownloading ? 'Originalbild wird geladen …' : 'Originalbild herunterladen'}
                  </SecondaryButton>
                </PreviewControls>
              </PreviewContent>
            </PreviewDialog>
          </PreviewBackdrop>
        )}
      </Main>
    </Page>
  );
};

const Page = styled.div`min-height: 100vh; background: #fffaf0; color: #2f2100;`;
const Main = styled.main`max-width: 1240px; margin: 0 auto; padding: 2rem 1rem 4rem;`;
const Panel = styled.section`background: #fff; border: 1px solid #f1dfb7; border-radius: 18px; padding: 1.1rem; margin-bottom: 1rem; box-shadow: 0 8px 24px rgba(92, 59, 10, .06);`;
const PageHeader = styled.div`display: flex; justify-content: space-between; align-items: end; gap: 1rem; margin-bottom: 1.25rem;`;
const Eyebrow = styled.div`text-transform: uppercase; letter-spacing: .12em; color: #bd7811; font-size: .76rem; font-weight: 800;`;
const Title = styled.h1`margin: .25rem 0 .4rem; font-size: clamp(1.8rem, 4vw, 2.7rem);`;
const Intro = styled.p`margin: 0; color: #735b35; max-width: 700px;`;
const Count = styled.span`background: #fff0c4; color: #7f4e06; border-radius: 999px; padding: .5rem .8rem; font-weight: 700; white-space: nowrap;`;
const FilterGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: .75rem; label, select, input { width: 100%; } label { display: grid; gap: .35rem; color: #735b35; font-size: .82rem; font-weight: 700; } select, input { box-sizing: border-box; border: 1px solid #e8d3a5; border-radius: 10px; background: #fffdf8; color: #2f2100; padding: .65rem .7rem; font: inherit; }`;
const ExportToolbar = styled.div`display: flex; align-items: end; flex-wrap: wrap; gap: .75rem; label { display: grid; gap: .3rem; color: #735b35; font-size: .82rem; font-weight: 700; } select { border: 1px solid #e8d3a5; border-radius: 10px; padding: .65rem .7rem; background: #fffdf8; color: #2f2100; font: inherit; }`;
const ToolbarTitle = styled.strong`font-size: 1.05rem; margin-right: .25rem;`;
const ToolbarActions = styled.div`display: flex; flex-wrap: wrap; gap: .5rem; margin-left: auto;`;
const CheckboxLabel = styled.label`display: flex !important; align-items: center; gap: .45rem !important; padding-bottom: .65rem; white-space: nowrap; input { width: auto; }`;
const Hint = styled.p`margin: .85rem 0 0; color: #806b4a; font-size: .85rem;`;
const Message = styled.div`margin: .75rem 0; padding: .75rem 1rem; border-radius: 12px; background: ${(props) => props.$error ? '#ffe7e2' : '#e5f6e8'}; color: ${(props) => props.$error ? '#9b2b1f' : '#256638'};`;
const CardGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;`;
const PhotoCard = styled.article`overflow: hidden; background: #fff; border: 2px solid ${(props) => props.$selected ? '#f0a500' : '#f1dfb7'}; border-radius: 16px; box-shadow: 0 8px 20px rgba(92, 59, 10, .06);`;
const CardImageWrap = styled.div`position: relative; aspect-ratio: 4 / 3; background: #f4ead3; cursor: pointer; &:focus-visible { outline: 3px solid #f0a500; outline-offset: -3px; }`;
const CardImage = styled.img`display: block; width: 100%; height: 100%; object-fit: cover;`;
const SelectOverlay = styled.label`position: absolute; top: .55rem; left: .55rem; display: flex; align-items: center; gap: .35rem; padding: .35rem .5rem; border-radius: 999px; background: rgba(255,255,255,.92); font-size: .78rem; font-weight: 700; color: #503000; input { accent-color: #f0a500; }`;
const PreviewBadge = styled.span`position: absolute; top: .55rem; right: .55rem; padding: .35rem .5rem; border-radius: 999px; background: rgba(47,33,0,.72); color: #fffaf0; font-size: .72rem; font-weight: 800; pointer-events: none;`;
const CardBody = styled.div`padding: .9rem;`;
const CardTitle = styled.h2`margin: 0 0 .35rem; font-size: 1.05rem;`;
const CardMeta = styled.div`color: #735b35; font-size: .83rem; margin-top: .2rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
const RatingLine = styled.div`margin-top: .65rem; color: #8a6b38; font-size: .78rem;`;
const CardActions = styled.div`display: flex; flex-wrap: wrap; gap: .45rem; margin-top: .8rem;`;
const buttonBase = `border: 0; border-radius: 9px; padding: .5rem .65rem; font: inherit; font-size: .78rem; font-weight: 800; cursor: pointer; &:disabled { cursor: wait; opacity: .55; }`;
const ActionButton = styled.button`${buttonBase} background: #e5f6e8; color: #256638;`;
const PrimaryButton = styled.button`${buttonBase} background: #f0a500; color: #fff; padding: .68rem .85rem;`;
const SecondaryButton = styled.button`${buttonBase} background: #fff7e1; color: #7d520c; border: 1px solid #edcf91;`;
const Pagination = styled.div`display: flex; justify-content: center; align-items: center; gap: .75rem; margin-top: 1.25rem; color: #735b35; font-weight: 700;`;
const PreviewBackdrop = styled.div`position: fixed; inset: 0; z-index: 3000; display: grid; place-items: center; overflow-y: auto; padding: 1rem; background: rgba(47, 33, 0, .68);`;
const PreviewDialog = styled.div`width: min(980px, 100%); max-height: calc(100dvh - 2rem); overflow: auto; background: #fffaf0; border: 1px solid #f1dfb7; border-radius: 20px; box-shadow: 0 24px 80px rgba(0, 0, 0, .3); padding: 1rem;`;
const PreviewHeader = styled.div`display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; padding: .25rem .25rem .9rem;`;
const PreviewTitle = styled.h2`margin: .2rem 0 .25rem; font-size: clamp(1.35rem, 3vw, 2rem);`;
const PreviewMeta = styled.div`color: #735b35; font-size: .88rem;`;
const CloseButton = styled.button`${buttonBase} width: 2.25rem; height: 2.25rem; padding: 0; background: #f2eadc; color: #725c3d; font-size: 1.5rem; line-height: 1;`;
const PreviewContent = styled.div`display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(230px, .65fr); gap: 1rem; align-items: start; @media (max-width: 720px) { grid-template-columns: 1fr; }`;
const PreviewImageFrame = styled.div`position: relative; display: grid; place-items: center; min-height: 320px; max-height: 76vh; overflow: hidden; border-radius: 14px; background: #eadfc9;`;
const PreviewImage = styled.img`display: block; max-width: 100%; max-height: 76vh; width: auto; height: auto; object-fit: contain;`;
const PreviewLoading = styled.div`position: absolute; left: 50%; bottom: 1rem; transform: translateX(-50%); padding: .5rem .75rem; border-radius: 999px; background: rgba(255,255,255,.92); color: #503000; font-size: .82rem; font-weight: 700; white-space: nowrap;`;
const PreviewControls = styled.div`display: grid; gap: .8rem; align-content: start; padding: .35rem; label { display: grid; gap: .35rem; color: #735b35; font-size: .82rem; font-weight: 700; } select { box-sizing: border-box; width: 100%; border: 1px solid #e8d3a5; border-radius: 10px; background: #fffdf8; color: #2f2100; padding: .65rem .7rem; font: inherit; }`;
const PreviewHint = styled.p`margin: 0; color: #806b4a; font-size: .84rem; line-height: 1.45;`;

export default SocialMediaAdmin;
