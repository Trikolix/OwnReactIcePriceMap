import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMediaQuery } from 'react-responsive';
import styled from 'styled-components';
import { CalendarDays, Map, Navigation, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useUser } from './context/UserContext';
import ReviewCard from './components/ReviewCard';
import CheckinCard from './components/CheckinCard';
import MetaPill from './components/RegionMetaPill';
import FavoritenButton from './components/FavoritButton';
import OpeningHours from './components/OpeningHours';
import ShopWebsite from './components/ShopWebsite';
import RouteCard from './components/RouteCard';
import SubmitRouteForm from './SubmitRouteModal';
import ShareIcon from './components/ShareButton';
import CheckinFrom from './CheckinForm';
import SubmitPriceModal from './SubmitPriceModal';
import SubmitReviewModal from './SubmitReviewModal';
import SubmitIceShopModal from './SubmitIceShopModal';
import SecondaryPlaceActions from './components/SecondaryPlaceActions';
import ShopGlance from './components/shopDetail/ShopGlance';
import ShopIdentity from './components/shopDetail/ShopIdentity';
import ShopPricesAndRatings from './components/shopDetail/ShopPricesAndRatings';
import ShopOfferingDialog from './components/shopDetail/ShopOfferingDialog';
import { FlavorChip, AttributeChip } from './components/shopDetail/ShopChips';
import { ShopPanel, ShopButton, ShopMainActions, ShopTertiaryAction } from './styles/ShopUi';
import { getShopEditAccess } from './utils/shopEditing';

const popularShopFlavors = (checkins = []) => {
  const counts = new globalThis.Map();
  checkins.forEach(checkin => (checkin.eissorten || []).forEach(flavor => {
    const name = String(flavor.sortenname || '').trim();
    if (name) counts.set(name, (counts.get(name) || 0) + 1);
  }));
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
};

const MOBILE_SHEET_SNAP_POINTS = [0.25, 0.5, 0.75, 1];
const MOBILE_SHEET_DEFAULT_SNAP_POINT = 0.5;
const MOBILE_SHEET_DRAG_THRESHOLD = 8;

const getMobileViewportHeight = () => window.visualViewport?.height || window.innerHeight;

const getShopCoordinates = (shop) => {
  const latitude = Number(shop?.latitude);
  const longitude = Number(shop?.longitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    ? { latitude, longitude }
    : null;
};

const buildMapsUrl = (shop) => {
  const coordinates = getShopCoordinates(shop);
  const destination = coordinates
    ? `${coordinates.latitude},${coordinates.longitude}`
    : shop?.adresse;

  if (!destination) {
    return null;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
};

const buildKomootUrl = (shop) => {
  const coordinates = getShopCoordinates(shop);
  if (coordinates) {
    const { latitude, longitude } = coordinates;
    return `https://www.komoot.com/de-de/plan/@${latitude},${longitude},13.500z?p[0]&p[1][loc]=${latitude},${longitude}&sport=racebike`;
  }

  return shop?.adresse
    ? `https://www.komoot.com/discover/${encodeURIComponent(shop.adresse)}`
    : null;
};

const ShopDetailsView = ({ shopId, onClose, setIceCreamShops, refreshMapShops }) => {
  const [activeTab, setActiveTab] = useState('info');
  const headerRef = useRef(null);
  const startYRef = useRef(0);
  const { isLoggedIn, userId, authToken } = useUser();
  const [showOfferingDialog, setShowOfferingDialog] = useState(false);
  const [shareNotice, setShareNotice] = useState(null);
  useEffect(() => setShareNotice(null), [shopId]);
  useEffect(() => {
    if (!shareNotice || shareNotice.error) return;
    const timer = setTimeout(() => setShareNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [shareNotice]);
  useEffect(() => setShowOfferingDialog(false), [shopId]);
  const [routes, setRoutes] = useState([]);
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showCheckinForm, setShowCheckinForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [shopData, setShopData] = useState(null);
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const shopRequestRef = useRef(0);
  const routesRequestRef = useRef(0);
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const [sheetHeight, setSheetHeight] = useState(() => getMobileViewportHeight() * MOBILE_SHEET_DEFAULT_SNAP_POINT);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const sheetSnapPointRef = useRef(MOBILE_SHEET_DEFAULT_SNAP_POINT);
  const sheetHeightRef = useRef(sheetHeight);
  const dragStartHeightRef = useRef(sheetHeight);
  const lastYRef = useRef(0);
  const hasDraggedSheetRef = useRef(false);
  const isSheetDragActiveRef = useRef(false);
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const focusCheckinId = searchParams.get('focusCheckin');
  const focusReviewId = searchParams.get('focusReview');
  const createReferencedCheckin = searchParams.get('createReferencedCheckin');
  const openCheckin = searchParams.get('openCheckin');
  const openAtParam = searchParams.get('open_at');

  useEffect(() => {
    if (createReferencedCheckin) setShowCheckinForm(true);
  }, [createReferencedCheckin]);

  useEffect(() => {
    if (openCheckin && isLoggedIn) setShowCheckinForm(true);
  }, [openCheckin, isLoggedIn]);

  useEffect(() => {
    if (tabParam) setActiveTab(tabParam);
  }, [tabParam]);

  useEffect(() => {
    const handleResize = () => {
      const nextHeight = getMobileViewportHeight() * sheetSnapPointRef.current;

      sheetHeightRef.current = nextHeight;
      dragStartHeightRef.current = nextHeight;
      setSheetHeight(nextHeight);
    };

    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);

  const getMobileSheetBounds = () => ({
    minHeight: getMobileViewportHeight() * MOBILE_SHEET_SNAP_POINTS[0],
    maxHeight: getMobileViewportHeight() * MOBILE_SHEET_SNAP_POINTS[MOBILE_SHEET_SNAP_POINTS.length - 1],
  });

  const getClosestMobileSheetSnapPoint = (rawHeight) => {
    const viewportHeight = getMobileViewportHeight();
    const currentRatio = rawHeight / viewportHeight;
    return MOBILE_SHEET_SNAP_POINTS.reduce((nearest, snapPoint) => (
      Math.abs(snapPoint - currentRatio) < Math.abs(nearest - currentRatio) ? snapPoint : nearest
    ), MOBILE_SHEET_DEFAULT_SNAP_POINT);
  };

  const handleSheetDragStart = (e) => {
    if (e.target.closest('button, a, input, textarea, select, [role="button"]')) {
      isSheetDragActiveRef.current = false;
      return;
    }

    isSheetDragActiveRef.current = true;
    setIsDraggingSheet(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    startYRef.current = e.clientY;
    lastYRef.current = startYRef.current;
    dragStartHeightRef.current = sheetHeightRef.current;
    hasDraggedSheetRef.current = false;
  };

  const handleSheetDragMove = (e) => {
    if (!isSheetDragActiveRef.current) {
      return;
    }

    const nextY = e.clientY;
    const deltaY = nextY - startYRef.current;
    const { minHeight, maxHeight } = getMobileSheetBounds();
    const newHeight = Math.max(minHeight, Math.min(maxHeight, dragStartHeightRef.current - deltaY));

    if (Math.abs(deltaY) > MOBILE_SHEET_DRAG_THRESHOLD) {
      hasDraggedSheetRef.current = true;
    }

    lastYRef.current = nextY;
    sheetHeightRef.current = newHeight;
    if (e.cancelable) {
      e.preventDefault();
    }
    setSheetHeight(newHeight);
  };

  const handleSheetDragEnd = (e) => {
    if (!isSheetDragActiveRef.current) {
      return;
    }

    const endY = Number.isFinite(e.clientY) ? e.clientY : lastYRef.current;
    const deltaY = endY - startYRef.current;
    isSheetDragActiveRef.current = false;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDraggingSheet(false);

    if (!hasDraggedSheetRef.current && Math.abs(deltaY) <= MOBILE_SHEET_DRAG_THRESHOLD) {
      return;
    }

    const { minHeight, maxHeight } = getMobileSheetBounds();
    const rawHeight = Math.max(minHeight, Math.min(maxHeight, dragStartHeightRef.current - deltaY));
    const snapPoint = getClosestMobileSheetSnapPoint(rawHeight);
    const snapHeight = getMobileViewportHeight() * snapPoint;

    sheetSnapPointRef.current = snapPoint;
    sheetHeightRef.current = snapHeight;
    dragStartHeightRef.current = snapHeight;
    lastYRef.current = endY;
    hasDraggedSheetRef.current = false;
    setSheetHeight(snapHeight);
  };

  const fetchShopData = useCallback(async (id) => {
    const requestId = ++shopRequestRef.current;
    try {
      const referenceQuery = openAtParam ? `&open_at=${encodeURIComponent(openAtParam)}` : '';
      const userQuery = userId ? `&nutzer_id=${userId}` : '';
      const response = await fetch(`${apiUrl}/get_eisdiele.php?eisdiele_id=${id}${userQuery}${referenceQuery}`, { credentials: "include", headers: authToken ? { Authorization: `Bearer ${authToken}` } : {} });
      const data = await response.json();
      if (requestId !== shopRequestRef.current) {
        return;
      }
      setShopData(data);
    } catch (err) {
      if (requestId !== shopRequestRef.current) {
        return;
      }
      console.error('Fehler beim Abrufen der Shop-Details via URL:', err);
    }
  }, [apiUrl, openAtParam, userId, authToken]);

  const fetchRoutes = useCallback(async (id, currentUserId) => {
    const requestId = ++routesRequestRef.current;
    try {
      let url = `${apiUrl}/routen/getRoutes.php?eisdiele_id=${id}`;
      if (currentUserId) {
        url += `&nutzer_id=${currentUserId}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      if (requestId !== routesRequestRef.current) {
        return;
      }
      setRoutes(data);
    } catch (err) {
      if (requestId !== routesRequestRef.current) {
        return;
      }
      console.error('Fehler beim Abrufen der Routen via URL:', err);
    }
  }, [apiUrl]);

  useEffect(() => {
    if (!shopId) return;
    setShopData(null);
    setRoutes([]);
    fetchShopData(shopId);
    fetchRoutes(shopId, userId);
  }, [shopId, userId, fetchShopData, fetchRoutes]);

  const refreshShop = () => {
    if (shopData?.eisdiele?.id) {
      fetchShopData(shopData.eisdiele.id);
    }
  };

  const refreshRoutes = () => {
    if (shopId) {
      fetchRoutes(shopId, userId);
    }
  };

  const ShellComponent = isMobile ? AnimatedContainer : Container;
  const shellProps = isMobile
    ? {
      style: { height: sheetHeight },
      $isDragging: isDraggingSheet,
    }
    : {};
  const dragHandleProps = isMobile
    ? {
      onPointerDown: handleSheetDragStart,
      onPointerMove: handleSheetDragMove,
      onPointerUp: handleSheetDragEnd,
      onPointerCancel: handleSheetDragEnd,
    }
    : {};

  if (!shopData) {
    return (
      <Container>
        <LoadingWrap>
          <LoadingCard>
            <LoadingTitle>Eisdiele wird geladen...</LoadingTitle>
            <LoadingText>Details, Preise und Community-Aktivität werden vorbereitet.</LoadingText>
          </LoadingCard>
        </LoadingWrap>
      </Container>
    );
  }

  const isCoreIceShop = (shopData.eisdiele.place_type || 'ice_shop') === 'ice_shop';
  const authenticated = action => isLoggedIn ? action() : window.dispatchEvent(new CustomEvent("auth:open-login"));

  return (
    <>
      <ShellComponent data-shop-sideview {...shellProps}>
        {isMobile && <DragHandle aria-hidden="true" {...dragHandleProps} />}
        <Header data-shop-drag ref={headerRef} {...dragHandleProps}>
          <ShopIdentity shop={shopData.eisdiele} compact headingId="map-shop-name"
            utilities={<>
              {isLoggedIn && <FavoritenButton key={shopData.eisdiele.id + ":" + userId}
                eisdieleId={shopData.eisdiele.id} setIceCreamShops={setIceCreamShops} />}
              <ShareIcon path={`/map/activeShop/${shopData.eisdiele.id}`} onFeedback={setShareNotice} />
              <CloseButton data-shop-close onClick={onClose} aria-label="Details schließen" title="Details schließen">
                <X size={20} aria-hidden="true" />
              </CloseButton>
            </>} />
          {shareNotice && <ShareNotice role={shareNotice.error ? "alert" : "status"}>
            {shareNotice.message}
            {shareNotice.error && <input readOnly aria-label="Link zur Eisdiele" value={shareNotice.url} onFocus={event => event.target.select()} />}
          </ShareNotice>}
        </Header>
        <SummaryArea><ShopGlance data={shopData} /></SummaryArea>
        <HeaderCtaBar>
          <PrimaryButton onClick={() => authenticated(() => setShowCheckinForm(true))}>Einchecken</PrimaryButton>
          {isCoreIceShop && <Button onClick={() => authenticated(() => setShowReviewForm(true))}>Bewerten</Button>}
          {isCoreIceShop && (
            <ShopTertiaryAction to={`/ice-date/new?shopId=${shopData.eisdiele.id}`}>
              <CalendarDays size={15} /> Eis-Date planen
            </ShopTertiaryAction>
          )}
        </HeaderCtaBar>
        <Tabs>
          <Tab type="button" onClick={() => setActiveTab('info')} $active={activeTab === 'info'}>Allgemein</Tab>
          <Tab type="button" onClick={() => setActiveTab('checkins')} $active={activeTab === 'checkins'}>Check-ins</Tab>
          {isCoreIceShop && <Tab type="button" onClick={() => setActiveTab('reviews')} $active={activeTab === 'reviews'}>Bewertungen</Tab>}
        </Tabs>

        <Content>
          <ShopDetailsContent
            activeTab={activeTab}
            shopData={shopData}
            isLoggedIn={isLoggedIn}
            setShowPriceForm={setShowPriceForm}
            refreshShop={refreshShop}
            setShowCheckinForm={setShowCheckinForm}
            setShowRouteForm={setShowRouteForm}
            setShowReviewForm={setShowReviewForm}
            routes={routes}
            refreshRoutes={refreshRoutes}
            focusCheckinId={focusCheckinId}
            focusReviewId={focusReviewId}
            onReport={() => isLoggedIn ? setShowOfferingDialog(true) : window.dispatchEvent(new CustomEvent("auth:open-login"))}
            handleEditClick={() => setShowEditModal(true)}
          />
        </Content>
      </ShellComponent>

      {isCoreIceShop && showRouteForm && (
        <SubmitRouteForm
          showForm={showRouteForm}
          setShowForm={setShowRouteForm}
          shopId={shopData.eisdiele.id}
          shopName={shopData.eisdiele.name}
          onSuccess={refreshRoutes}
        />
      )}

      {showOfferingDialog && <ShopOfferingDialog data={shopData} onClose={() => setShowOfferingDialog(false)} onChanged={refreshShop} />}
      {showPriceForm && (
        <SubmitPriceModal
          shop={shopData}
          userId={userId}
          showPriceForm={showPriceForm}
          setShowPriceForm={setShowPriceForm}
          onSuccess={() => {
            refreshShop();
            refreshMapShops();
          }}
        />
      )}

      {isCoreIceShop && showReviewForm && (
        <SubmitReviewModal
          shop={shopData}
          userId={userId}
          showForm={showReviewForm}
          setShowForm={setShowReviewForm}
          setShowPriceForm={setShowPriceForm}
          onSuccess={() => {
            refreshShop();
            refreshMapShops();
          }}
        />
      )}

      {showCheckinForm && (
        <CheckinFrom
          shopId={shopData.eisdiele.id}
          shopName={shopData.eisdiele.name}
          userId={userId}
          showCheckinForm={showCheckinForm}
          setShowCheckinForm={setShowCheckinForm}
          onSuccess={refreshShop}
          shop={shopData}
          contextType={shopData.eisdiele.place_type || 'ice_shop'}
          setShowPriceForm={setShowPriceForm}
          referencedCheckinId={createReferencedCheckin}
        />
      )}

      {showEditModal && (
        <SubmitIceShopModal
          showForm={showEditModal}
          setShowForm={setShowEditModal}
          userId={userId}
          refreshShops={() => {
            refreshShop();
            refreshMapShops?.();
          }}
          existingIceShop={shopData.eisdiele}
        />
      )}
    </>
  );
};

const ShopDetailsContent = ({
  activeTab,
  shopData,
  isLoggedIn,
  setShowPriceForm,
  refreshShop,
  setShowCheckinForm,
  setShowRouteForm,
  setShowReviewForm,
  routes,
  refreshRoutes,
  focusCheckinId,
  focusReviewId,
  handleEditClick,
  onReport,
}) => {
  const checkinRefs = useRef({});
  const reviewRefs = useRef({});
  const { userId } = useUser();

  useEffect(() => {
    if (
      activeTab === 'checkins' &&
      focusCheckinId &&
      shopData?.checkins?.length &&
      checkinRefs.current[focusCheckinId]
    ) {
      checkinRefs.current[focusCheckinId].scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (
      activeTab === 'reviews' &&
      focusReviewId &&
      shopData?.reviews?.length &&
      reviewRefs.current[focusReviewId]
    ) {
      reviewRefs.current[focusReviewId].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeTab, shopData?.checkins, shopData?.reviews, focusCheckinId, focusReviewId]);

  const mapsUrl = buildMapsUrl(shopData.eisdiele);
  const komootUrl = buildKomootUrl(shopData.eisdiele);
  const isCoreIceShop = (shopData.eisdiele.place_type || 'ice_shop') === 'ice_shop';

  if (activeTab === 'info') {
    return (
      <TabStack>
        <SectionCard>
          <InfoList>
            <InfoRow>
              <InfoLabel>Adresse</InfoLabel>
              <InfoValue>
                <AddressContent>
                  <AddressText>{shopData.eisdiele.adresse || 'Keine Adresse eingetragen'}</AddressText>
                  {(mapsUrl || komootUrl) && (
                    <AddressActionRow>
                      {mapsUrl && (
                        <AddressLink href={mapsUrl} target="_blank" rel="noopener noreferrer">
                          <Map size={14} />
                          Maps
                        </AddressLink>
                      )}
                      {komootUrl && (
                        <AddressLink href={komootUrl} target="_blank" rel="noopener noreferrer">
                          <Navigation size={14} />
                          Komoot
                        </AddressLink>
                      )}
                    </AddressActionRow>
                  )}
                </AddressContent>
              </InfoValue>
            </InfoRow>
          </InfoList>
            <HeaderMeta>
              {shopData.eisdiele.land && <MetaPill>{shopData.eisdiele.land}</MetaPill>}
              {shopData.eisdiele.bundesland && shopData.eisdiele.bundesland_id ? (
                <MetaPill as={Link} to={`/region/bundesland/${shopData.eisdiele.bundesland_id}`}>
                  {shopData.eisdiele.bundesland}
                </MetaPill>
              ) : (
                shopData.eisdiele.bundesland && <MetaPill>{shopData.eisdiele.bundesland}</MetaPill>
              )}
              {shopData.eisdiele.landkreis && shopData.eisdiele.landkreis_id ? (
                <MetaPill as={Link} to={`/region/landkreis/${shopData.eisdiele.landkreis_id}`}>
                  {shopData.eisdiele.landkreis}
                </MetaPill>
              ) : (
                shopData.eisdiele.landkreis && <MetaPill>{shopData.eisdiele.landkreis}</MetaPill>
              )}
            </HeaderMeta>
          <InlineContent>
            <OpeningHours eisdiele={shopData.eisdiele} />
            <ShopWebsite eisdiele={shopData.eisdiele} onSuccess={refreshShop} />
          </InlineContent>
          <SecondaryPlaceActions
            place={shopData.eisdiele}
            onChanged={() => {
              refreshShop();
              refreshMapShops?.();
            }}
          />
          {isLoggedIn && (
            <SecondaryActionRow>
              <SuggestionButton type="button" onClick={handleEditClick}>
                {getShopEditAccess(shopData.eisdiele, userId).canEditDirectly ? 'Eintrag bearbeiten' : 'Änderung vorschlagen'}
              </SuggestionButton>
            </SecondaryActionRow>
          )}
          <SecondaryActionRow>
            <FullscreenLink to={`/shop/${shopData.eisdiele.id}`}>
              Zur Vollansicht
            </FullscreenLink>
          </SecondaryActionRow>
        </SectionCard>

        <ShopPricesAndRatings data={shopData}
          onPrice={() => isLoggedIn ? setShowPriceForm(true) : window.dispatchEvent(new CustomEvent("auth:open-login"))}
          onReport={onReport} />
        <ShopPanel><h2>Aus der Community</h2>
          <AttributeSection>{(shopData.attribute || []).map(attribute => <AttributeChip key={attribute.id || attribute.name} attribute={attribute} />)}</AttributeSection>
          <h3>Beliebte Sorten</h3>
          <AttributeSection>{popularShopFlavors(shopData.checkins).map(name => <FlavorChip key={name} name={name} />)}</AttributeSection>
        </ShopPanel>

        {isCoreIceShop && <SectionCard>
          <SectionHead>
            <div>
              <SectionTitle>Routen</SectionTitle>
              <SectionSubline>Öffentliche Routen (Komoot, Strava, etc.) mit Stopps bei dieser Eisdiele.</SectionSubline>
            </div>
            <CountPill>{routes.length}</CountPill>
          </SectionHead>
          {routes.length < 1 && <EmptyState>Es sind noch keine öffentlichen Routen für die Eisdiele vorhanden.</EmptyState>}
          {isLoggedIn && (
            <ActionBar>
              <Button type="button" onClick={() => setShowRouteForm(true)}>Neue Route einreichen</Button>
            </ActionBar>
          )}
          <FeedStack>
            {routes.map((route, index) => (
              <RouteCard
                key={route.id || index}
                route={route}
                shopId={shopData.eisdiele.id}
                shopName={shopData.eisdiele.name}
                onSuccess={refreshRoutes}
              />
            ))}
          </FeedStack>
        </SectionCard>}
      </TabStack>
    );
  }

  if (activeTab === 'checkins') {
    return (
      <TabStack>
        <SectionCard>
          <SectionHead>
            <div>
              <SectionTitle>Check-ins</SectionTitle>
              <SectionSubline>Alle eingetragenen Eis-Besuche für diese Eisdiele.</SectionSubline>
            </div>
            <CountPill>{shopData.checkins?.length || 0}</CountPill>
          </SectionHead>
          {isLoggedIn && (
            <ActionBar>
              <Button type="button" onClick={() => setShowCheckinForm(true)}>Eis geschleckert</Button>
            </ActionBar>
          )}
          {shopData.checkins.length <= 0 && <EmptyState>Es wurden noch keine Eis-Besuche eingecheckt.</EmptyState>}
        </SectionCard>

        <FeedStack>
          {shopData.checkins?.map((checkin) => (
            <div key={checkin.id} ref={(el) => { checkinRefs.current[checkin.id] = el; }}>
              <CheckinCard
                checkin={checkin}
                onSuccess={refreshShop}
                showComments={checkin.id.toString() === focusCheckinId?.toString()}
              />
            </div>
          ))}
        </FeedStack>
      </TabStack>
    );
  }

  if (activeTab === 'reviews') {
    return (
      <TabStack>
        <SectionCard>
          <SectionHead>
            <div>
              <SectionTitle>Bewertungen</SectionTitle>
              <SectionSubline>Community-Reviews mit Bildern und Kommentaren.</SectionSubline>
            </div>
            <CountPill>{shopData.reviews?.length || 0}</CountPill>
          </SectionHead>
          {isLoggedIn && (
            <ActionBar>
              <Button type="button" onClick={() => setShowReviewForm(true)}>Eisdiele bewerten</Button>
            </ActionBar>
          )}
          {shopData.reviews.length <= 0 && <EmptyState>Es wurden noch keine Reviews abgegeben.</EmptyState>}
        </SectionCard>

        <FeedStack>
          {shopData.reviews?.map((review, index) => (
            <div key={review.id} ref={(el) => { reviewRefs.current[review.id] = el; }}>
              <ReviewCard
                key={index}
                review={review}
                setShowReviewForm={setShowReviewForm}
                showComments={review.id.toString() === focusReviewId?.toString()}
              />
            </div>
          ))}
        </FeedStack>
      </TabStack>
    );
  }

  return null;
};

export default ShopDetailsView;

const AnimatedContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== '$isDragging',
})`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background:
    #faf9f6;
  box-shadow: 0 -8px 28px rgba(28, 20, 0, 0.18);
  border-radius: 18px 18px 0 0;
  display: flex;
  flex-direction: column;
  z-index: 1400;
  overflow: hidden;
  border: 1px solid rgba(47, 33, 0, 0.08);
  transition: ${({ $isDragging }) => ($isDragging ? 'none' : 'height 0.24s ease')};
  button { min-width: 44px; min-height: 44px; }
  :is(button, a, summary):focus-visible { outline: 3px solid #986b0e; outline-offset: 3px; }
`;

const Container = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isfullheight',
})`
  box-sizing: border-box;
  overscroll-behavior: none;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: ${({ isfullheight }) => (isfullheight ? '100%' : '50%')};
  background:
    #faf9f6;
  box-shadow: 0 -8px 28px rgba(28, 20, 0, 0.18);
  border-radius: 18px 18px 0 0;
  display: flex;
  flex-direction: column;
  z-index: 1400;
  transition: height 0.3s ease;
  border: 1px solid rgba(47, 33, 0, 0.08);
  button { min-width: 44px; min-height: 44px; }
  :is(button, a, summary):focus-visible { outline: 3px solid #986b0e; outline-offset: 3px; }

  @media (min-width: 768px) {
    width: clamp(420px, 42vw, 720px);
    height: 100%;
    top: 0;
    bottom: auto;
    left: 0;
    right: auto;
    border-radius: 0 18px 18px 0;
    box-shadow: 12px 0 28px rgba(28, 20, 0, 0.14);
  }
`;

const DragHandle = styled.div`
  width: 52px;
  height: 26px;
  align-self: center;
  margin: 0.2rem 0 0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;

  &::before {
    content: '';
    width: 52px;
    height: 5px;
    border-radius: 999px;
    background: rgba(47, 33, 0, 0.16);
  }
`;

const Header = styled.div`
  box-sizing: border-box;
  flex-shrink: 0;
  padding: 0.75rem 0.9rem 0.7rem;
  background: #fff;
  border-bottom: 1px solid rgba(47, 33, 0, 0.08);
  touch-action: none;

  @media (min-width: 768px) {
    padding: 1rem;
    touch-action: auto;
  }
`;

const CloseButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 1px solid rgba(47, 33, 0, 0.08);
  background: rgba(255, 255, 255, 0.8);
  color: #5b4520;
  cursor: pointer;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  &:hover {
    background: rgba(255, 181, 34, 0.12);
  }
`;

const Tabs = styled.div`
  box-sizing: border-box;
  display: flex;
  gap: 0.35rem;
  padding: 0.4rem 0.6rem;
  margin: 0.35rem 0.6rem 0;
  background: #faf9f6;
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 14px;
  box-shadow: none;
`;

const Tab = styled.button`
  min-height: 44px;
  flex: 1;
  min-width: 0;
  padding: 0.5rem 0.65rem;
  background: ${({ $active }) => ($active ? '#fff1c9' : 'transparent')};
  color: ${({ $active }) => ($active ? '#2f2100' : '#5c4a25')};
  border: 1px solid ${({ $active }) => ($active ? 'rgba(255, 181, 34, 0.55)' : 'transparent')};
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: none;

  &:hover {
    background: ${({ $active }) => ($active ? '#ffbf3f' : 'rgba(255, 181, 34, 0.1)')};
  }
`;

const Content = styled.div`
  box-sizing: border-box;
  flex: 1;
  padding: 0.85rem;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;

  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(47, 33, 0, 0.14);
    border-radius: 999px;
  }
`;

const HeaderMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.45rem;
`;

const HeaderCtaBar = styled(ShopMainActions)`
  max-width: none;
  margin: 0.55rem;
`;

const ShareNotice = styled.div`
  margin-top: 8px; color: #756b5c; font-size: .82rem; line-height: 1.4;
  input { box-sizing: border-box; width: 100%; min-height: 44px; margin-top: 6px; padding: 8px; border: 1px solid #ddd4c2; border-radius: 8px; font: inherit; }
`;

const TabStack = styled.div`
  display: grid;
  gap: 0.9rem;
  padding-bottom: 0.5rem;
`;

const SectionCard = styled(ShopPanel)`padding: 18px;`;
const SummaryArea = styled.div`padding: 0 18px 10px; background: #fff; .shopdetail-glance { margin-top: 8px; gap: 12px 20px; }`;

const SectionHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.7rem;
  margin-bottom: 0.85rem;
`;

const SectionTitle = styled.h3`
  margin: 0;
  color: #2f2100;
  font-size: 1.03rem;
`;

const SectionSubline = styled.p`
  margin: 0.25rem 0 0;
  color: rgba(47, 33, 0, 0.62);
  font-size: 0.87rem;
`;

const CountPill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: rgba(255, 181, 34, 0.14);
  border: 1px solid rgba(255, 181, 34, 0.28);
  color: #7a4a00;
  font-weight: 700;
`;

const InfoList = styled.div`
  display: grid;
  gap: 0.45rem;
  margin-bottom: 0.8rem;
`;

const InfoRow = styled.div`
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 0.5rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0.15rem;
  }
`;

const InfoLabel = styled.span`
  color: #5f3f00;
  font-weight: 700;
  font-size: 0.9rem;
`;

const InfoValue = styled.span`
  color: #2f2100;
  font-size: 0.92rem;
  line-height: 1.35;
`;

const AddressContent = styled.div`
  display: grid;
  gap: 0.45rem;
  min-width: 0;
`;

const AddressText = styled.span`
  min-width: 0;
  overflow-wrap: anywhere;
`;

const AddressActionRow = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.3rem;
`;

const AddressLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  min-height: 1.8rem;
  padding: 0.28rem 0.5rem;
  border-radius: 9px;
  border: 1px solid rgba(138, 87, 0, 0.24);
  background: rgba(255, 255, 255, 0.76);
  color: #6f4300;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    background: rgba(255, 181, 34, 0.14);
    border-color: rgba(138, 87, 0, 0.36);
    color: #4d3000;
  }
`;

const InlineContent = styled.div`
  display: grid;
  gap: 0.45rem;
`;



const ActionBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem;
  margin-top: 0.85rem;
`;

const SecondaryActionRow = styled.div`
  margin-top: 0.7rem;
`;

const Button = styled(ShopButton)`max-width: 100%;`;

const PrimaryButton = styled(ShopButton).attrs({ $primary: true })`width: 100%;`;

const SuggestionButton = styled.button`
  background: none;
  border: none;
  color: #8a5700;
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  font-weight: 600;

  &:hover {
    color: #6f4300;
  }
`;

const FullscreenLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #7a4a00;
  font-weight: 700;
  text-decoration: none;
  font-size: 0.92rem;
  padding: 0.1rem 0;

  &:hover {
    color: #5a3900;
  }

  &::after {
    content: '›';
    font-size: 1rem;
    line-height: 1;
  }
`;

const AttributeSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
`;




const EmptyState = styled.div`
  border-radius: 14px;
  border: 1px dashed rgba(47, 33, 0, 0.12);
  background: rgba(255, 255, 255, 0.55);
  color: rgba(47, 33, 0, 0.62);
  padding: 0.85rem 0.9rem;
  font-size: 0.92rem;
  line-height: 1.35;
`;

const FeedStack = styled.div`
  display: grid;
  gap: 0.8rem;
`;

const LoadingWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 1rem;
`;

const LoadingCard = styled.div`
  width: min(92%, 460px);
  background: rgba(255, 252, 243, 0.96);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.08);
  padding: 1rem;
`;

const LoadingTitle = styled.h3`
  margin: 0;
  color: #2f2100;
`;

const LoadingText = styled.p`
  margin: 0.35rem 0 0;
  color: rgba(47, 33, 0, 0.64);
`;
