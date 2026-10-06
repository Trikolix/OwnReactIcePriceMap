import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIconRetina from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import {
  ArrowLeft,
  CalendarDays,
  IceCreamCone,
  Images,
  MapPin,
  Navigation,
  RefreshCw,
  Share2,
  Star,
  Users,
} from "lucide-react";
import Header from "../Header";
import { useUser } from "../context/UserContext";
import FavoritenButton from "../components/FavoritButton";
import ShopWebsite from "../components/ShopWebsite";
import CheckinCard from "../components/CheckinCard";
import ReviewCard from "../components/ReviewCard";
import RouteCard from "../components/RouteCard";
import SubmitPriceModal from "../SubmitPriceModal";
import SubmitReviewModal from "../SubmitReviewModal";
import CheckinForm from "../CheckinForm";
import SubmitRouteModal from "../SubmitRouteModal";
import SubmitIceShopModal from "../SubmitIceShopModal";
import SecondaryPlaceActions from "../components/SecondaryPlaceActions";
import ShopLoyaltyActions from "../features/loyalty/ShopLoyaltyActions";
import ShopOpeningHours from "../components/shopDetail/ShopOpeningHours";
import ShopStatistics from "../components/shopDetail/ShopStatistics";
import ShopDetailPhotoDialog from "../components/shopDetail/ShopDetailPhotoDialog";
import { getShopEditAccess, isValidShopPosition } from "../utils/shopEditing";
import {
  hasShopNumber,
  shopAssetUrl,
  shopDate,
  shopDetailTab,
  shopNumber,
  shopPrice,
  shopStatus,
} from "../utils/shopDetail";
import "leaflet/dist/leaflet.css";
import "../components/shopDetail/shopDetail.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const BATCH_SIZE = 12;
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
const RATING_LABELS = {
  kugel: "Kugeleis",
  softeis: "Softeis",
  eisbecher: "Eisbecher",
};
const PLACE_LABELS = {
  ice_shop: "Eisdiele",
  restaurant: "Restaurant / Café",
  temporary_stand: "Temporärer Eisstand",
};
const login = () => window.dispatchEvent(new CustomEvent("auth:open-login"));

function ShopPhoto({ photo, index, onOpen, more = 0, className = "" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [photo.url]);
  const src = shopAssetUrl(photo.url);
  return (
    <button
      type="button"
      className={"shopdetail-photo " + className}
      onClick={() => onOpen(index)}
      aria-label={
        "Foto " +
        (index + 1) +
        " von " +
        (photo.username || "der Community") +
        " öffnen" +
        (more ? ", " + more + " weitere Fotos" : "")
      }
    >
      {src && !failed ? (
        <img
          src={src}
          alt={
            photo.beschreibung ||
            "Eisdielenfoto von " + (photo.username || "der Community")
          }
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="shopdetail-photo-fallback">
          <Images size={28} />
          <span>Foto nicht verfügbar</span>
        </span>
      )}
      {more > 0 && <span className="shopdetail-photo-more">+{more}</span>}
    </button>
  );
}

export default function IceShopDetailPage() {
  const { shopId } = useParams();
  const { isLoggedIn, userId, authToken } = useUser();
  const location = useLocation(),
    navigate = useNavigate();
  const [data, setData] = useState(null),
    [loading, setLoading] = useState(true),
    [refreshing, setRefreshing] = useState(false),
    [error, setError] = useState("");
  const [showPriceForm, setShowPriceForm] = useState(false),
    [showReviewForm, setShowReviewForm] = useState(false),
    [showCheckinForm, setShowCheckinForm] = useState(false),
    [showRouteForm, setShowRouteForm] = useState(false),
    [showEditModal, setShowEditModal] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(null),
    [limits, setLimits] = useState({
      checkins: BATCH_SIZE,
      reviews: BATCH_SIZE,
      photos: BATCH_SIZE,
      routes: BATCH_SIZE,
    });
  const [shareMessage, setShareMessage] = useState(""),
    [shareError, setShareError] = useState(false),
    [sharing, setSharing] = useState(false);
  const requestAbort = useRef(null),
    requestVersion = useRef(0),
    postRefs = useRef({}),
    tabsRef = useRef(null),
    previousShop = useRef(shopId),
    scrollToTabs = useRef(false),
    heroRef = useRef(null);
  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const openCheckin = params.get("openCheckin");

  const fetchShop = useCallback(
    async (initial = false) => {
      requestAbort.current?.abort();
      const controller = new AbortController(),
        version = ++requestVersion.current;
      requestAbort.current = controller;
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, 20000);
      setError("");
      initial ? setLoading(true) : setRefreshing(true);
      try {
        const response = await fetch(
          API_BASE +
            "/get_eisdiele_details.php?eisdiele_id=" +
            encodeURIComponent(shopId) +
            "&nutzer_id=" +
            (userId || ""),
          {
            credentials: "include",
            headers: authToken ? { Authorization: "Bearer " + authToken } : {},
            signal: controller.signal,
          },
        );
        const result = await response.json();
        if (!response.ok || !result?.eisdiele || result.status === "error")
          throw new Error(
            result.message || "Die Eisdiele konnte nicht geladen werden.",
          );
        if (version === requestVersion.current) setData(result);
      } catch (failure) {
        if (
          version === requestVersion.current &&
          (failure.name !== "AbortError" || timedOut)
        )
          setError(
            timedOut
              ? "Das Laden dauert zu lange. Bitte versuche es erneut."
              : "Die Eisdiele konnte nicht geladen werden. Bitte versuche es erneut.",
          );
      } finally {
        clearTimeout(timer);
        if (version === requestVersion.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [shopId, userId, authToken],
  );
  const refreshShop = useCallback(() => fetchShop(false), [fetchShop]);
  useEffect(() => {
    setData(null);
    setPhotoIndex(null);
    setLimits({
      checkins: BATCH_SIZE,
      reviews: BATCH_SIZE,
      photos: BATCH_SIZE,
      routes: BATCH_SIZE,
    });
    setShareMessage("");
    fetchShop(true);
    return () => {
      requestAbort.current?.abort();
      requestVersion.current++;
    };
  }, [fetchShop]);
  useEffect(() => {
    if (previousShop.current !== shopId) {
      setShowPriceForm(false);
      setShowReviewForm(false);
      setShowCheckinForm(false);
      setShowRouteForm(false);
      setShowEditModal(false);
      previousShop.current = shopId;
    }
  }, [shopId]);
  useEffect(() => {
    if (openCheckin && isLoggedIn) setShowCheckinForm(true);
  }, [openCheckin, isLoggedIn, shopId]);

  const shop = data?.eisdiele,
    isIceShop = (shop?.place_type || "ice_shop") === "ice_shop";
  const tab = shopDetailTab(params, isIceShop),
    section = ["checkins", "reviews"].includes(tab) ? "community" : tab;
  const checkins = data?.checkins || [],
    reviews = data?.reviews || [],
    photos = data?.foto_galerie || [],
    routes = data?.routen || [];
  const items =
    tab === "checkins"
      ? checkins
      : tab === "reviews"
        ? reviews
        : tab === "routes"
          ? routes
          : photos;
  const focusId = params.get(
    tab === "checkins"
      ? "focusCheckin"
      : tab === "reviews"
        ? "focusReview"
        : tab === "routes"
          ? "focusRoute"
          : "",
  );
  const focusIndex = focusId
    ? items.findIndex((item) => String(item.id) === focusId)
    : -1;
  const shown = Math.max(limits[tab] || BATCH_SIZE, focusIndex + 1);
  useEffect(() => {
    if (scrollToTabs.current) {
      const hero = heroRef.current,
        tabs = tabsRef.current;
      if (hero && tabs)
        window.scrollTo({
          top:
            hero.getBoundingClientRect().bottom +
            window.scrollY +
            parseFloat(getComputedStyle(tabs).marginTop),
          left: 0,
          behavior: "auto",
        });
      scrollToTabs.current = false;
    }
  }, [tab]);
  useEffect(() => {
    if (!focusId || !data) return;
    const frame = requestAnimationFrame(() => {
      const target = postRefs.current[tab + ":" + focusId];
      if (target) {
        target.scrollIntoView({
          block: "start",
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth",
        });
        target.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [tab, focusId, data]);

  const selectTab = (target) => {
    scrollToTabs.current =
      target !== tab &&
      (tabsRef.current?.getBoundingClientRect().top ?? 1) <= 0;
    const next = new URLSearchParams(location.search);
    next.set("tab", target);
    [
      "focusCheckin",
      "focusReview",
      "focusRoute",
      "focusComment",
      "openCheckin",
    ].forEach((key) => next.delete(key));
    setPhotoIndex(null);
    navigate({ pathname: location.pathname, search: "?" + next });
  };
  const authenticated = (action) => (isLoggedIn ? action() : login());
  const startCheckin = () => authenticated(() => setShowCheckinForm(true));
  const share = async () => {
    setSharing(true);
    setShareMessage("");
    setShareError(false);
    const url = window.location.origin + "/shop/" + shopId;
    try {
      if (navigator.share)
        await navigator.share({
          title: shop.name,
          text: "Entdecke " + shop.name + " auf Ice-App",
          url,
        });
      else {
        await navigator.clipboard.writeText(url);
        setShareMessage("Link kopiert.");
      }
    } catch (failure) {
      if (failure.name !== "AbortError") {
        setShareError(true);
        setShareMessage(url);
      }
    } finally {
      setSharing(false);
    }
  };

  if (!data || !shop)
    return (
      <div className="shopdetail-shell">
        <Header />
        <main className="shopdetail-main">
          <Link className="shopdetail-back" to="/map">
            <ArrowLeft size={17} /> Zur Karte
          </Link>
          <section className="shopdetail-state shopdetail-panel">
            <h1>
              {loading ? "Eisdiele wird geladen …" : "Eisdiele nicht verfügbar"}
            </h1>
            <p role={error ? "alert" : "status"}>
              {error || "Einen Moment, die Informationen werden geladen."}
            </p>
            {!loading && (
              <button
                className="shopdetail-button shopdetail-button-primary"
                onClick={() => fetchShop(true)}
              >
                Erneut versuchen
              </button>
            )}
          </section>
        </main>
      </div>
    );

  const status = shopStatus(shop),
    prices = data.preise || {},
    scores = data.scores || {},
    statistics = data.statistiken || {};
  const ratings = Object.entries(RATING_LABELS).filter(([key]) =>
    hasShopNumber(scores[key]),
  );
  const primaryPrice = hasShopNumber(prices.kugel?.preis)
    ? ["Kugelpreis", prices.kugel]
    : hasShopNumber(prices.softeis?.preis)
      ? ["Softeispreis", prices.softeis]
      : ["Kugelpreis", null];
  const primaryRating = ratings[0],
    popular = data.beliebte_sorten?.meistgegessen || [],
    attributes = data.attribute || [];
  const positionValid = isValidShopPosition(shop.latitude, shop.longitude);
  const destination = positionValid
    ? shop.latitude + "," + shop.longitude
    : [shop.name, shop.adresse].filter(Boolean).join(", ");
  const tabs = [
    { key: "overview", target: "overview", label: "Übersicht" },
    {
      key: "community",
      target: "checkins",
      label: "Beiträge",
      count: checkins.length + (isIceShop ? reviews.length : 0),
    },
    { key: "photos", target: "photos", label: "Fotos", count: photos.length },
    ...(isIceShop
      ? [
          {
            key: "routes",
            target: "routes",
            label: "Routen",
            count: routes.length,
          },
        ]
      : []),
    { key: "stats", target: "stats", label: "Statistik" },
  ];
  const navigateTabs = (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const buttons = [...tabsRef.current.querySelectorAll("[role=tab]")],
      index = buttons.indexOf(event.target);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? buttons.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) %
            buttons.length;
    buttons[next].click();
    buttons[next].focus();
  };
  const moreButton = (count) =>
    shown < count && (
      <button
        className="shopdetail-button shopdetail-load-more"
        onClick={() =>
          setLimits((old) => ({
            ...old,
            [tab]: Math.max(old[tab] || BATCH_SIZE, shown) + BATCH_SIZE,
          }))
        }
      >
        Weitere{" "}
        {tab === "photos" ? "Fotos" : tab === "routes" ? "Routen" : "Beiträge"}{" "}
        anzeigen <span>({count - shown} weitere)</span>
      </button>
    );
  const contributionList = (type) => (
    <>
      {focusId && focusIndex < 0 && (
        <p role="status" className="shopdetail-note">
          Der verlinkte Beitrag ist nicht mehr verfügbar.
        </p>
      )}
      {!items.length ? (
        <div className="shopdetail-empty">
          <h3>
            {type === "routes"
              ? "Noch keine Routen"
              : type === "reviews"
                ? "Noch keine Bewertungen"
                : "Noch keine Check-ins"}
          </h3>
          <p>
            {type === "routes"
              ? "Teile eine Route, die an dieser Eisdiele vorbeiführt."
              : type === "reviews"
                ? "Wie gefällt dir diese Eisdiele?"
                : "Teile deinen ersten Eis-Besuch."}
          </p>
          <button
            className="shopdetail-button"
            onClick={() =>
              type === "checkins"
                ? startCheckin()
                : authenticated(() =>
                    type === "reviews"
                      ? setShowReviewForm(true)
                      : setShowRouteForm(true),
                  )
            }
          >
            {type === "routes"
              ? "Route einreichen"
              : type === "reviews"
                ? "Bewertung abgeben"
                : "Eis einchecken"}
          </button>
        </div>
      ) : (
        <div className="shopdetail-feed-cards">
          {items.slice(0, shown).map((item) => {
            const focused = String(item.id) === focusId;
            const commentProps = {
              showComments: focused,
              focusCommentId: focused ? params.get("focusComment") : null,
            };
            return (
              <article
                key={type + ":" + item.id}
                className="shopdetail-feed-card"
                tabIndex={-1}
                data-focused={focused || undefined}
                ref={(element) => {
                  if (element) postRefs.current[type + ":" + item.id] = element;
                  else delete postRefs.current[type + ":" + item.id];
                }}
              >
                {type === "checkins" ? (
                  <CheckinCard
                    checkin={item}
                    onSuccess={refreshShop}
                    {...commentProps}
                  />
                ) : type === "reviews" ? (
                  <ReviewCard
                    review={item}
                    onSuccess={refreshShop}
                    {...commentProps}
                  />
                ) : (
                  <RouteCard
                    route={item}
                    shopId={shop.id}
                    shopName={shop.name}
                    onSuccess={refreshShop}
                    {...commentProps}
                  />
                )}
              </article>
            );
          })}
        </div>
      )}
      {moreButton(items.length)}
    </>
  );

  return (
    <div className="shopdetail-shell">
      <Header />
      <main className="shopdetail-main">
        <div className="shopdetail-topline">
          <Link className="shopdetail-back" to={"/map/activeShop/" + shop.id}>
            <ArrowLeft size={17} /> Zur Karte
          </Link>
          <button
            className="shopdetail-button shopdetail-refresh"
            disabled={refreshing}
            onClick={refreshShop}
          >
            <RefreshCw
              size={17}
              className={refreshing ? "shopdetail-spin" : ""}
            />
            {refreshing ? "Aktualisiert …" : "Aktualisieren"}
          </button>
        </div>
        {error && (
          <div className="shopdetail-error" role="alert">
            <span>{error}</span>
            <button
              className="shopdetail-button"
              onClick={refreshShop}
              disabled={refreshing}
            >
              Erneut versuchen
            </button>
          </div>
        )}
        <section
          className="shopdetail-hero"
          ref={heroRef}
          aria-labelledby="shopdetail-name"
        >
          <div className="shopdetail-hero-top">
            <div className="shopdetail-heading">
              <div className="shopdetail-badges">
                <span
                  className={
                    "shopdetail-status shopdetail-status-" + status.tone
                  }
                >
                  {status.label}
                </span>
                {!isIceShop && (
                  <span className="shopdetail-place-type">
                    {PLACE_LABELS[shop.place_type] || "Eis-Ort"}
                  </span>
                )}
              </div>
              <h1 id="shopdetail-name">{shop.name}</h1>
              <p className="shopdetail-address">
                <MapPin size={17} aria-hidden="true" />
                <span>{shop.adresse || "Adresse noch nicht hinterlegt"}</span>
              </p>
            </div>
            <div className="shopdetail-utilities">
              {isLoggedIn && (
                <FavoritenButton
                  key={shop.id + ":" + userId}
                  eisdieleId={shop.id}
                />
              )}
              <button
                className="shopdetail-button shopdetail-icon-button"
                onClick={share}
                disabled={sharing}
                aria-label="Eisdiele teilen"
                title="Eisdiele teilen"
              >
                <Share2 size={20} />
              </button>
            </div>
          </div>
          <div className="shopdetail-hero-bottom">
            <div className="shopdetail-hero-body">
              <div className="shopdetail-glance">
                {isIceShop && (
                  <div>
                    <strong>
                      {primaryPrice[1] ? shopPrice(primaryPrice[1]) : "–"}
                    </strong>
                    <span>
                      {primaryPrice[1] ? primaryPrice[0] : "Preis fehlt"}
                    </span>
                  </div>
                )}
                {isIceShop && (
                  <div>
                    <strong>
                      <Star size={17} aria-hidden="true" />
                      {primaryRating
                        ? shopNumber(scores[primaryRating[0]])
                        : "–"}
                    </strong>
                    <span>
                      {primaryRating
                        ? primaryRating[1] + " · von 5"
                        : "Noch keine Wertung"}
                    </span>
                  </div>
                )}
                <div>
                  <strong>
                    {Number(
                      statistics.gesamt_checkins ?? checkins.length,
                    ).toLocaleString("de-DE")}
                  </strong>
                  <span>Check-ins</span>
                </div>
              </div>
              <div className="shopdetail-actions">
                <button
                  className="shopdetail-button shopdetail-button-primary"
                  onClick={startCheckin}
                >
                  <IceCreamCone size={18} /> Eis einchecken
                </button>
                <a
                  className="shopdetail-button"
                  href={
                    "https://www.google.com/maps/search/?api=1&query=" +
                    encodeURIComponent(destination)
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation size={18} /> Route dorthin
                </a>
                {isIceShop && (
                  <Link
                    className="shopdetail-button"
                    to={"/ice-date/new?shopId=" + shop.id}
                  >
                    <CalendarDays size={18} /> Eis-Date planen
                  </Link>
                )}
              </div>
            </div>
            {photos.length > 0 && (
              <ShopPhoto
                className="shopdetail-hero-photo"
                photo={photos[0]}
                index={0}
                onOpen={setPhotoIndex}
                more={photos.length - 1}
              />
            )}
          </div>
          {shareMessage &&
            (shareError ? (
              <div className="shopdetail-share-error">
                <p role="alert">
                  Der Link konnte nicht automatisch geteilt werden. Du kannst
                  ihn hier kopieren:
                </p>
                <input
                  aria-label="Link zur Eisdiele"
                  value={shareMessage}
                  readOnly
                  onFocus={(event) => event.target.select()}
                />
              </div>
            ) : (
              <p className="shopdetail-success" role="status">
                {shareMessage}
              </p>
            ))}
        </section>
        <div
          className="shopdetail-tabs"
          role="tablist"
          aria-label="Eisdielenbereiche"
          ref={tabsRef}
          onKeyDown={navigateTabs}
        >
          {tabs.map((item) => (
            <button
              role="tab"
              key={item.key}
              id={"shopdetail-tab-" + item.key}
              aria-selected={section === item.key}
              aria-controls="shopdetail-content"
              tabIndex={section === item.key ? 0 : -1}
              onClick={() => selectTab(item.target)}
            >
              {item.label}
              {item.count !== undefined && <span>{item.count}</span>}
            </button>
          ))}
        </div>
        <div
          id="shopdetail-content"
          className="shopdetail-content"
          role="tabpanel"
          aria-labelledby={"shopdetail-tab-" + section}
          tabIndex={0}
        >
          {section === "overview" && (
            <div className="shopdetail-stack">
              {shop.loyalty_program && (
                <div className="shopdetail-loyalty">
                  <ShopLoyaltyActions shop={shop} />
                </div>
              )}
              <div className="shopdetail-grid">
                <section className="shopdetail-panel">
                  <ShopOpeningHours shop={shop} />
                  {shop.website && (
                    <div className="shopdetail-website">
                      <ShopWebsite
                        eisdiele={shop}
                        onSuccess={refreshShop}
                        showSubmitAction={false}
                      />
                    </div>
                  )}
                  {isLoggedIn && data.persoenliche_statistiken && (
                    <p className="shopdetail-personal">
                      <strong>Deine Besuche:</strong>{" "}
                      {data.persoenliche_statistiken.eigene_checkins || 0}
                      {data.persoenliche_statistiken.letzter_besuch
                        ? " · zuletzt " +
                          shopDate(data.persoenliche_statistiken.letzter_besuch)
                        : ""}
                    </p>
                  )}
                </section>
                {isIceShop && (
                  <section className="shopdetail-panel">
                    <h2>
                      <IceCreamCone size={20} aria-hidden="true" /> Preise &
                      Bewertungen
                    </h2>
                    <dl className="shopdetail-prices">
                      {[
                        ["Kugel", prices.kugel],
                        ["Softeis", prices.softeis],
                      ].map(([label, entry]) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>
                            <strong>{shopPrice(entry)}</strong>
                            {entry?.letztes_update && (
                              <span>
                                Gemeldet am {shopDate(entry.letztes_update)}
                              </span>
                            )}
                            {entry?.beschreibung && (
                              <span>{entry.beschreibung}</span>
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    {ratings.length ? (
                      <ul className="shopdetail-ratings">
                        {ratings.map(([key, label]) => (
                          <li key={key}>
                            <span>{label}</span>
                            <strong>
                              <Star size={15} aria-hidden="true" />{" "}
                              {shopNumber(scores[key])} / 5
                            </strong>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="shopdetail-muted">
                        Noch keine Community-Bewertungen vorhanden.
                      </p>
                    )}
                    {hasShopNumber(data.bewertungen?.auswahl) && (
                      <p className="shopdetail-muted">
                        Auswahl: etwa {shopNumber(data.bewertungen.auswahl, 0)}{" "}
                        Sorten
                      </p>
                    )}
                    <div className="shopdetail-actions">
                      <button
                        className="shopdetail-button"
                        onClick={() =>
                          authenticated(() => setShowPriceForm(true))
                        }
                      >
                        Preis melden
                      </button>
                      <button
                        className="shopdetail-button"
                        onClick={() =>
                          authenticated(() => setShowReviewForm(true))
                        }
                      >
                        Bewertung abgeben
                      </button>
                    </div>
                  </section>
                )}
                <section className="shopdetail-panel">
                  <h2>
                    <MapPin size={20} aria-hidden="true" /> Standort
                  </h2>
                  {positionValid ? (
                    <div className="shopdetail-map">
                      <MapContainer
                        center={[Number(shop.latitude), Number(shop.longitude)]}
                        zoom={15}
                        scrollWheelZoom={false}
                        style={{ height: "100%", width: "100%" }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker
                          position={[
                            Number(shop.latitude),
                            Number(shop.longitude),
                          ]}
                          icon={defaultIcon}
                        >
                          <Popup>{shop.name}</Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  ) : (
                    <p className="shopdetail-muted">
                      Noch keine Kartenposition hinterlegt.
                    </p>
                  )}
                  <div className="shopdetail-regions">
                    {shop.landkreis &&
                      (shop.landkreis_id ? (
                        <Link to={"/region/landkreis/" + shop.landkreis_id}>
                          {shop.landkreis}
                        </Link>
                      ) : (
                        <span>{shop.landkreis}</span>
                      ))}
                    {shop.bundesland &&
                      (shop.bundesland_id ? (
                        <Link to={"/region/bundesland/" + shop.bundesland_id}>
                          {shop.bundesland}
                        </Link>
                      ) : (
                        <span>{shop.bundesland}</span>
                      ))}
                    {shop.land && <span>{shop.land}</span>}
                  </div>
                </section>
                <section className="shopdetail-panel">
                  <h2>
                    <Users size={20} aria-hidden="true" /> Aus der Community
                  </h2>
                  {popular.length ? (
                    <>
                      <h3>Beliebte Sorten</h3>
                      <ol className="shopdetail-ranking">
                        {popular.slice(0, 3).map((flavor, index) => (
                          <li key={flavor.sortenname + ":" + index}>
                            <span>{flavor.sortenname}</span>
                            <strong>{flavor.anzahl}×</strong>
                          </li>
                        ))}
                      </ol>
                    </>
                  ) : (
                    <p className="shopdetail-muted">
                      Noch keine Sorten gemeldet. Was schmeckt dir hier
                      besonders?
                    </p>
                  )}
                  {attributes.length > 0 && (
                    <>
                      <h3>Häufig genannte Merkmale</h3>
                      <div className="shopdetail-attributes">
                        {attributes.slice(0, 6).map((attribute, index) => (
                          <span key={index}>
                            {attribute.name} <small>{attribute.anzahl}×</small>
                          </span>
                        ))}
                      </div>
                      {attributes.length > 6 && (
                        <details className="shopdetail-disclosure">
                          <summary>
                            Weitere Merkmale ({attributes.length - 6})
                          </summary>
                          <div className="shopdetail-attributes">
                            {attributes.slice(6).map((attribute, index) => (
                              <span key={index}>
                                {attribute.name}{" "}
                                <small>{attribute.anzahl}×</small>
                              </span>
                            ))}
                          </div>
                        </details>
                      )}
                    </>
                  )}
                  <div className="shopdetail-actions">
                    <button
                      className="shopdetail-button"
                      onClick={() => selectTab("checkins")}
                    >
                      Beiträge lesen
                    </button>
                    <button
                      className="shopdetail-button"
                      onClick={() => selectTab("stats")}
                    >
                      Statistik ansehen
                    </button>
                  </div>
                </section>
              </div>
              {photos.length > 0 && (
                <section className="shopdetail-panel">
                  <div className="shopdetail-section-heading">
                    <h2>
                      <Images size={20} aria-hidden="true" /> Fotos von Besuchen
                    </h2>
                    <button
                      className="shopdetail-button"
                      onClick={() => selectTab("photos")}
                    >
                      Alle Fotos ({photos.length})
                    </button>
                  </div>
                  <div className="shopdetail-preview-photos">
                    {photos.slice(0, 3).map((photo, index) => (
                      <ShopPhoto
                        key={photo.id}
                        photo={photo}
                        index={index}
                        onOpen={setPhotoIndex}
                        more={index === 2 ? photos.length - 3 : 0}
                      />
                    ))}
                  </div>
                </section>
              )}
              <details className="shopdetail-panel shopdetail-maintenance">
                <summary>Angaben verbessern & Betreiberzugang</summary>
                <div className="shopdetail-stack">
                  <p className="shopdetail-muted">
                    Hilf mit, die Informationen aktuell zu halten.
                  </p>
                  <div className="shopdetail-actions">
                    <button
                      className="shopdetail-button"
                      onClick={() =>
                        authenticated(() => setShowEditModal(true))
                      }
                    >
                      {getShopEditAccess(shop, userId).canEditDirectly
                        ? "Eintrag bearbeiten"
                        : "Änderung vorschlagen"}
                    </button>
                  </div>
                  <SecondaryPlaceActions place={shop} onChanged={refreshShop} />
                  {!shop.loyalty_program && <ShopLoyaltyActions shop={shop} />}
                </div>
              </details>
            </div>
          )}
          {section === "community" && (
            <section className="shopdetail-panel">
              <div className="shopdetail-section-heading">
                <div>
                  <h2>Besuche{isIceShop ? " & Bewertungen" : ""}</h2>
                  <p className="shopdetail-muted">
                    Besuche und Erfahrungen aus der Community.
                  </p>
                </div>
                <button
                  className="shopdetail-button shopdetail-button-primary"
                  onClick={() =>
                    tab === "reviews"
                      ? authenticated(() => setShowReviewForm(true))
                      : startCheckin()
                  }
                >
                  {tab === "reviews" ? "Bewertung abgeben" : "Eis einchecken"}
                </button>
              </div>
              <div
                className="shopdetail-feed-filters"
                role="group"
                aria-label="Beitragsart"
              >
                <button
                  aria-pressed={tab === "checkins"}
                  onClick={() => selectTab("checkins")}
                >
                  Check-ins <span>{checkins.length}</span>
                </button>
                {isIceShop && (
                  <button
                    aria-pressed={tab === "reviews"}
                    onClick={() => selectTab("reviews")}
                  >
                    Bewertungen <span>{reviews.length}</span>
                  </button>
                )}
              </div>
              {contributionList(tab)}
            </section>
          )}
          {section === "photos" && (
            <section className="shopdetail-panel">
              <div className="shopdetail-section-heading">
                <div>
                  <h2>Fotos von Besuchen</h2>
                  <p className="shopdetail-muted">
                    Fotos der Community. Tippe auf ein Bild, um es zu
                    vergrößern.
                  </p>
                </div>
              </div>
              {photos.length ? (
                <>
                  <div className="shopdetail-photo-grid">
                    {photos.slice(0, shown).map((photo, index) => (
                      <figure key={photo.id}>
                        <ShopPhoto
                          photo={photo}
                          index={index}
                          onOpen={setPhotoIndex}
                        />
                        <figcaption>
                          <strong>{photo.username || "Community"}</strong>
                          <time dateTime={photo.datum}>
                            {shopDate(photo.datum)}
                          </time>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                  {moreButton(photos.length)}
                </>
              ) : (
                <div className="shopdetail-empty">
                  <Images size={32} aria-hidden="true" />
                  <h3>Noch keine Fotos</h3>
                  <p>Teile ein Foto bei deinem nächsten Check-in.</p>
                  <button className="shopdetail-button" onClick={startCheckin}>
                    Eis einchecken
                  </button>
                </div>
              )}
            </section>
          )}
          {isIceShop && section === "routes" && (
            <section className="shopdetail-panel">
              <div className="shopdetail-section-heading">
                <div>
                  <h2>Eis-Routen</h2>
                  <p className="shopdetail-muted">
                    Öffentliche Routen und deine eigenen privaten Routen.
                  </p>
                </div>
                <button
                  className="shopdetail-button"
                  onClick={() => authenticated(() => setShowRouteForm(true))}
                >
                  Route einreichen
                </button>
              </div>
              {contributionList("routes")}
            </section>
          )}
          {section === "stats" && <ShopStatistics data={data} />}
        </div>
      </main>
      {showEditModal && (
        <SubmitIceShopModal
          showForm={showEditModal}
          setShowForm={setShowEditModal}
          userId={userId}
          existingIceShop={shop}
          refreshShops={refreshShop}
        />
      )}
      {isIceShop && showPriceForm && (
        <SubmitPriceModal
          shop={data}
          userId={userId}
          showPriceForm={showPriceForm}
          setShowPriceForm={setShowPriceForm}
          onSuccess={refreshShop}
        />
      )}
      {isIceShop && showReviewForm && (
        <SubmitReviewModal
          shop={data}
          userId={userId}
          showForm={showReviewForm}
          setShowForm={setShowReviewForm}
          setShowPriceForm={setShowPriceForm}
          onSuccess={refreshShop}
        />
      )}
      {showCheckinForm && (
        <CheckinForm
          shopId={shop.id}
          shopName={shop.name}
          userId={userId}
          showCheckinForm={showCheckinForm}
          setShowCheckinForm={setShowCheckinForm}
          onSuccess={refreshShop}
          shop={data}
          contextType={shop.place_type || "ice_shop"}
          setShowPriceForm={setShowPriceForm}
        />
      )}
      {isIceShop && showRouteForm && (
        <SubmitRouteModal
          showForm={showRouteForm}
          setShowForm={setShowRouteForm}
          shopId={shop.id}
          shopName={shop.name}
          onSuccess={refreshShop}
        />
      )}
      {photoIndex !== null && photos[photoIndex] && (
        <ShopDetailPhotoDialog
          photos={photos}
          index={photoIndex}
          onIndexChange={setPhotoIndex}
          onClose={() => setPhotoIndex(null)}
        />
      )}
    </div>
  );
}
