import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useMediaQuery } from 'react-responsive';
import styled from 'styled-components';
import { X } from 'lucide-react';
import { SubmitButton as SharedSubmitButton } from './styles/SharedStyles';
import { Link, useSearchParams } from 'react-router-dom';
import Rating from './components/Rating';
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

const hasValue = (value) => value !== null && value !== undefined;
const hasPriceEntry = (entry) => hasValue(entry?.preis);

const ShopDetailsView = ({ shopId, onClose, setIceCreamShops, refreshMapShops }) => {
  const [activeTab, setActiveTab] = useState('info');
  const headerRef = useRef(null);
  const startYRef = useRef(0);
  const { isLoggedIn, userId } = useUser();
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
  const [currentHeight, setCurrentHeight] = useState(window.innerHeight * 0.5);
  const [{ height }, api] = useSpring(() => ({ height: currentHeight }));
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const focusCheckinId = searchParams.get('focusCheckin');
  const focusReviewId = searchParams.get('focusReview');
  const createReferencedCheckin = searchParams.get('createReferencedCheckin');
  const openAtParam = searchParams.get('open_at');

  useEffect(() => {
    if (createReferencedCheckin) setShowCheckinForm(true);
  }, [createReferencedCheckin]);

  useEffect(() => {
    if (tabParam) setActiveTab(tabParam);
  }, [tabParam]);

  const minHeight = window.innerHeight * 0.3;
  const maxHeight = window.innerHeight * 1;

  const handleTouchStart = (e) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    const deltaY = e.touches[0].clientY - startYRef.current;
    const newHeight = Math.max(minHeight, Math.min(maxHeight, currentHeight - deltaY));
    api.start({ height: newHeight });
  };

  const handleTouchEnd = () => {
    api.start({ height: height.get() });
    setCurrentHeight(height.get());
  };

  const fetchShopData = useCallback(async (id) => {
    const requestId = ++shopRequestRef.current;
    try {
      const referenceQuery = openAtParam ? `&open_at=${encodeURIComponent(openAtParam)}` : '';
      const userQuery = userId ? `&nutzer_id=${userId}` : '';
      const response = await fetch(`${apiUrl}/get_eisdiele.php?eisdiele_id=${id}${userQuery}${referenceQuery}`);
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
  }, [apiUrl, openAtParam, userId]);

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
      style: { height },
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
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

  return (
    <>
      <ShellComponent {...shellProps}>
        {isMobile && <DragHandle aria-hidden="true" />}
        <Header ref={headerRef}>
          <HeaderMain>
            <IceShopHeader>{shopData.eisdiele.name}</IceShopHeader>
            <HeaderSubline>{shopData.eisdiele.adresse || 'Adresse nicht hinterlegt'}</HeaderSubline>
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

          </HeaderMain>
          <HeaderActions>
            <CloseButton onClick={onClose} aria-label="Details schließen">
              <X size={16} />
            </CloseButton>
            <HeaderUtilityRow>
              <ActionSlot>
                <FavoritenButton
                  eisdieleId={shopData.eisdiele.id}
                  setIceCreamShops={setIceCreamShops}
                />
              </ActionSlot>
              <ActionSlot>
                <ShareIcon path={`/map/activeShop/${shopData.eisdiele.id}`} />
              </ActionSlot>
            </HeaderUtilityRow>
          </HeaderActions>
        </Header>
        {isLoggedIn && (
          <HeaderCtaBar>
            <PrimaryButton type="button" onClick={() => setShowCheckinForm(true)}>Einchecken</PrimaryButton>
            <PrimaryButton type="button" onClick={() => setShowReviewForm(true)}>Bewerten</PrimaryButton>
          </HeaderCtaBar>
        )}
        <Tabs>
          <Tab type="button" onClick={() => setActiveTab('info')} $active={activeTab === 'info'}>Allgemein</Tab>
          <Tab type="button" onClick={() => setActiveTab('checkins')} $active={activeTab === 'checkins'}>Check-ins</Tab>
          <Tab type="button" onClick={() => setActiveTab('reviews')} $active={activeTab === 'reviews'}>Bewertungen</Tab>
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
            handleEditClick={() => setShowEditModal(true)}
          />
        </Content>
      </ShellComponent>

      {showRouteForm && (
        <SubmitRouteForm
          showForm={showRouteForm}
          setShowForm={setShowRouteForm}
          shopId={shopData.eisdiele.id}
          shopName={shopData.eisdiele.name}
          onSuccess={refreshRoutes}
        />
      )}

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

      {showReviewForm && (
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
          setShowPriceForm={setShowPriceForm}
          referencedCheckinId={createReferencedCheckin}
        />
      )}

      {showEditModal && (
        <SubmitIceShopModal
          showForm={showEditModal}
          setShowForm={setShowEditModal}
          userId={userId}
          refreshShops={refreshShop}
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
}) => {
  const checkinRefs = useRef({});
  const reviewRefs = useRef({});

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

  const calculateTimeDifference = (dateString) => {
    const currentDate = new Date();
    const pastDate = new Date(dateString);
    const diffInMilliseconds = currentDate - pastDate;
    const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));

    if (diffInDays > 365) {
      const diffInYears = Math.floor(diffInDays / 365);
      return `Vor ${diffInYears} Jahr${diffInYears > 1 ? 'en' : ''}`;
    }
    if (diffInDays > 30) {
      const diffInMonths = Math.floor(diffInDays / 30);
      return `Vor ${diffInMonths} Monat${diffInMonths > 1 ? 'en' : ''}`;
    }
    if (diffInDays === 0) {
      return 'Vor < 24 Stunden';
    }
    return `Vor ${diffInDays} Tag${diffInDays > 1 ? 'en' : ''}`;
  };

  const hasPriceData = hasPriceEntry(shopData.preise.kugel) || hasPriceEntry(shopData.preise.softeis);
  const hasRatingData = Boolean(
    hasValue(shopData.bewertungen.auswahl) ||
    hasValue(shopData.scores.kugel) ||
    hasValue(shopData.scores.softeis) ||
    hasValue(shopData.scores.eisbecher) ||
    shopData.attribute?.length > 0
  );

  if (activeTab === 'info') {
    return (
      <TabStack>
        <SectionCard>
          <InfoList>
            <InfoRow>
              <InfoLabel>Adresse</InfoLabel>
              <InfoValue>{shopData.eisdiele.adresse || 'Keine Adresse eingetragen'}</InfoValue>
            </InfoRow>
          </InfoList>
          <InlineContent>
            <OpeningHours eisdiele={shopData.eisdiele} />
            <ShopWebsite eisdiele={shopData.eisdiele} onSuccess={refreshShop} />
          </InlineContent>
          {isLoggedIn && (
            <SecondaryActionRow>
              <SuggestionButton type="button" onClick={handleEditClick}>
                Änderung vorschlagen
              </SuggestionButton>
            </SecondaryActionRow>
          )}
          <SecondaryActionRow>
            <FullscreenLink to={`/shop/${shopData.eisdiele.id}`}>
              Zur Vollansicht
            </FullscreenLink>
          </SecondaryActionRow>
        </SectionCard>

        <SectionCard>
          <SectionHead>
            <div>
              <SectionTitle>Preise</SectionTitle>
              <SectionSubline>Zuletzt gemeldete Kugel- und Softeispreise.</SectionSubline>
            </div>
          </SectionHead>
          {!hasPriceData && (
            <EmptyState>
              Es sind noch keine Preise für diese Eisdiele gemeldet.{isLoggedIn ? ' Trage gerne einen Preis ein.' : ''}
            </EmptyState>
          )}
          {hasPriceData && (
            <TableScroll>
              <Table>
                <tbody>
                  {hasPriceEntry(shopData.preise.kugel) && (
                    <tr>
                      <th>Kugelpreis</th>
                      <td>
                        <ValuePill>
                          {shopData.preise?.kugel?.preis?.toFixed(2) ?? '-'} {shopData.preise?.kugel?.waehrung_symbol ?? 'EUR'}
                        </ValuePill>{' '}
                        {shopData.preise?.kugel?.beschreibung ? <InlineMuted>({shopData.preise.kugel.beschreibung})</InlineMuted> : null}{' '}
                        <InlineMuted>({calculateTimeDifference(shopData.preise.kugel.letztes_update)} aktualisiert)</InlineMuted>
                      </td>
                    </tr>
                  )}
                  {hasPriceEntry(shopData.preise.softeis) && (
                    <tr>
                      <th>Softeispreis</th>
                      <td>
                        <ValuePill>
                          {shopData.preise?.softeis?.preis?.toFixed(2) ?? '-'} {shopData.preise?.softeis?.waehrung_symbol ?? 'EUR'}
                        </ValuePill>{' '}
                        {shopData.preise?.softeis?.beschreibung ? <InlineMuted>({shopData.preise.softeis.beschreibung})</InlineMuted> : null}{' '}
                        <InlineMuted>({calculateTimeDifference(shopData.preise.softeis.letztes_update)} aktualisiert)</InlineMuted>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </TableScroll>
          )}
          {isLoggedIn && (
            <ActionBar>
              <Button type="button" onClick={() => setShowPriceForm(true)}>Preis melden / bestätigen</Button>
            </ActionBar>
          )}
        </SectionCard>

        <SectionCard>
          <SectionHead>
            <div>
              <SectionTitle>Durchschnittliche Bewertung</SectionTitle>
              <SectionSubline>Community-Bewertungen für Sorten, Auswahl und Attribute.</SectionSubline>
            </div>
          </SectionHead>
          {!hasRatingData && (
            <EmptyState>Es sind noch keine Bewertungen für diese Eisdiele vorhanden.</EmptyState>
          )}
          {hasRatingData && (
            <TableScroll>
              <Table>
                <tbody>
                  {hasValue(shopData.scores.kugel) && (
                    <tr>
                      <th>Kugeleis</th>
                      <td><Rating stars={shopData.scores.kugel} /> <strong>{shopData.scores.kugel}</strong></td>
                    </tr>
                  )}
                  {hasValue(shopData.scores.softeis) && (
                    <tr>
                      <th>Softeis</th>
                      <td><Rating stars={shopData.scores.softeis} /> <strong>{shopData.scores.softeis}</strong></td>
                    </tr>
                  )}
                  {hasValue(shopData.scores.eisbecher) && (
                    <tr>
                      <th>Eisbecher</th>
                      <td><Rating stars={shopData.scores.eisbecher} /> <strong>{shopData.scores.eisbecher}</strong></td>
                    </tr>
                  )}
                  {hasValue(shopData.bewertungen.auswahl) && (
                    <tr>
                      <th>Auswahl</th>
                      <td>~ <strong>{shopData.bewertungen.auswahl}</strong> Sorten</td>
                    </tr>
                  )}
                  {shopData.attribute?.length > 0 && (
                    <tr>
                      <th>Attribute</th>
                      <td>
                        <AttributeSection>
                          {shopData.attribute.map((attribute) => (
                            <AttributeBadge key={`${attribute.name}-${attribute.anzahl}`}>
                              {attribute.anzahl} x {attribute.name}
                            </AttributeBadge>
                          ))}
                        </AttributeSection>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </TableScroll>
          )}
        </SectionCard>

        <SectionCard>
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
        </SectionCard>
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

const AnimatedContainer = styled(animated.div)`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background:
    radial-gradient(circle at top right, rgba(255, 218, 140, 0.28), transparent 48%),
    linear-gradient(180deg, #fffaf0 0%, #fff7e7 100%);
  box-shadow: 0 -8px 28px rgba(28, 20, 0, 0.18);
  border-radius: 18px 18px 0 0;
  display: flex;
  flex-direction: column;
  z-index: 1400;
  overflow: hidden;
  border: 1px solid rgba(47, 33, 0, 0.08);
`;

const Container = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isfullheight',
})`
  overscroll-behavior: none;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: ${({ isfullheight }) => (isfullheight ? '100%' : '50%')};
  background:
    radial-gradient(circle at top right, rgba(255, 218, 140, 0.28), transparent 48%),
    linear-gradient(180deg, #fffaf0 0%, #fff7e7 100%);
  box-shadow: 0 -8px 28px rgba(28, 20, 0, 0.18);
  border-radius: 18px 18px 0 0;
  display: flex;
  flex-direction: column;
  z-index: 1400;
  transition: height 0.3s ease;
  border: 1px solid rgba(47, 33, 0, 0.08);

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
  height: 5px;
  border-radius: 999px;
  background: rgba(47, 33, 0, 0.16);
  align-self: center;
  margin: 0.55rem 0 0.1rem;
  flex-shrink: 0;
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 0.8rem;
  padding: 0.75rem 0.9rem 0.7rem;
  background: rgba(255, 252, 243, 0.94);
  border-bottom: 1px solid rgba(47, 33, 0, 0.08);

  @media (min-width: 768px) {
    padding: 1rem;
  }
`;

const HeaderMain = styled.div`
  flex: 1;
  min-width: 0;
  padding-right: 0.2rem;
`;

const HeaderActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 0.35rem;
  flex-shrink: 0;
  max-width: 120px;
`;

const HeaderUtilityRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
`;

const ActionSlot = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 999px;
  border: 1px solid rgba(47, 33, 0, 0.08);
  background: rgba(255, 255, 255, 0.8);

  svg {
    position: static !important;
    inset: auto !important;
    width: 16px !important;
    height: 16px !important;
    color: #5b4520 !important;
  }

  button {
    position: static !important;
    top: auto !important;
    left: auto !important;
    width: 100%;
    height: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background: transparent;
    border: none;
  }

  span {
    line-height: 1;
  }
`;

const CloseButton = styled.button`
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
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
  display: flex;
  gap: 0.35rem;
  padding: 0.4rem 0.6rem;
  margin: 0.35rem 0.6rem 0;
  background: rgba(255, 252, 243, 0.88);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(28, 20, 0, 0.04);
`;

const Tab = styled.button`
  flex: 1;
  min-width: 0;
  padding: 0.5rem 0.65rem;
  background: ${({ $active }) => ($active ? '#ffb522' : 'transparent')};
  color: ${({ $active }) => ($active ? '#2f2100' : '#5c4a25')};
  border: 1px solid ${({ $active }) => ($active ? 'rgba(255, 181, 34, 0.55)' : 'transparent')};
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: ${({ $active }) => ($active ? '0 2px 8px rgba(255,181,34,0.25)' : 'none')};

  &:hover {
    background: ${({ $active }) => ($active ? '#ffbf3f' : 'rgba(255, 181, 34, 0.1)')};
  }
`;

const Content = styled.div`
  flex: 1;
  padding: 0.85rem;
  overflow-y: auto;
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

const HeaderCtaBar = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.4rem;
  margin: 0.55rem;
`;

const IceShopHeader = styled.h2`
  margin: 0;
  color: #2f2100;
  font-size: clamp(1.05rem, 1.8vw, 1.35rem);
  line-height: 1.15;
`;

const HeaderSubline = styled.p`
  margin: 0.3rem 0 0;
  color: rgba(47, 33, 0, 0.66);
  font-size: 0.88rem;
  line-height: 1.3;
`;

const TabStack = styled.div`
  display: grid;
  gap: 0.9rem;
  padding-bottom: 0.5rem;
`;

const SectionCard = styled.section`
  background: rgba(255, 252, 243, 0.94);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.06);
  padding: 1rem;
`;

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

const InlineContent = styled.div`
  display: grid;
  gap: 0.45rem;
`;

const TableScroll = styled.div`
  width: 100%;
  overflow-x: auto;
  border-radius: 14px;
  border: 1px solid rgba(47, 33, 0, 0.08);
  background: rgba(255, 255, 255, 0.8);

  @media (max-width: 640px) {
    overflow-x: visible;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 520px;

  th,
  td {
    text-align: left;
    vertical-align: top;
    padding: 0.65rem 0.75rem;
    border-bottom: 1px solid rgba(47, 33, 0, 0.07);
  }

  tr:last-child th,
  tr:last-child td {
    border-bottom: none;
  }

  th {
    width: 120px;
    color: #5f3f00;
    font-weight: 700;
    white-space: nowrap;
    background: rgba(255, 252, 243, 0.92);
  }

  td {
    color: #2f2100;
    line-height: 1.35;
    background: rgba(255, 255, 255, 0.65);
  }

  @media (max-width: 640px) {
    min-width: 0;

    tbody,
    tr,
    th,
    td {
      display: block;
      width: 100%;
    }

    tr {
      border-bottom: 1px solid rgba(47, 33, 0, 0.07);
      padding: 0.25rem 0;
    }

    tr:last-child {
      border-bottom: none;
    }

    th,
    td {
      border-bottom: none;
      padding: 0.35rem 0.6rem;
      white-space: normal;
    }

    th {
      width: auto;
      padding-bottom: 0.15rem;
      background: rgba(255, 252, 243, 0.75);
      border-radius: 8px 8px 0 0;
    }

    td {
      padding-top: 0.2rem;
      border-radius: 0 0 8px 8px;
    }
  }
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

const Button = styled(SharedSubmitButton)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin: 0;
  width: 100%;
  max-width: 320px;
  border-radius: 12px;
  border: 1px solid rgba(138, 87, 0, 0.32);
  background: linear-gradient(180deg, #fffdf7 0%, #fff3d6 100%);
  color: #5a3900;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(47, 33, 0, 0.08);

  &:hover {
    background: linear-gradient(180deg, #fff6e4 0%, #ffe9ba 100%);
    border-color: rgba(138, 87, 0, 0.44);
  }

  @media (max-width: 480px) {
    max-width: none;
  }
`;

const PrimaryButton = styled(Button)`
  width: 100%;
  max-width: none;
  border-color: rgba(255, 181, 34, 0.6);
  background: linear-gradient(180deg, #ffcf63 0%, #ffb522 100%);
  color: #2f2100;
  font-size: 0.9rem;
  padding: 0.48rem 0.82rem;
  border-radius: 10px;
  min-height: 0;
  box-shadow: 0 4px 12px rgba(255, 181, 34, 0.2);

  &:hover {
    background: linear-gradient(180deg, #ffd879 0%, #ffbf3f 100%);
  }
`;

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

const AttributeBadge = styled.span`
  background: rgba(255, 181, 34, 0.12);
  color: #7a4a00;
  border: 1px solid rgba(255, 181, 34, 0.25);
  padding: 0.28rem 0.65rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
`;

const ValuePill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  background: rgba(255, 181, 34, 0.12);
  border: 1px solid rgba(255, 181, 34, 0.22);
  color: #7a4a00;
  font-weight: 700;
`;

const InlineMuted = styled.span`
  color: rgba(47, 33, 0, 0.56);
  font-size: 0.83rem;
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
