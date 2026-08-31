import { useEffect, useState } from "react";
import styled from "styled-components";
import { Overlay, Modal, CloseButton, Heading, Input, Select, ButtonGroup, SubmitButton, Button, Message, LevelInfo } from './styles/SharedStyles';
import LocationPicker from "./components/LocationPicker";
import NewAwards from "./components/NewAwards";
import OpeningHoursEditor from "./components/OpeningHoursEditor";
import { createEmptyOpeningHours, hydrateOpeningHours } from "./utils/openingHours";
import { requestRestaurantVisibility } from "./utils/placeVisibility";

const PLACE_TYPE_GUIDANCE = {
  ice_shop: {
    title: 'Eisdiele',
    description: 'Wähle diesen Typ für jeden dauerhaften Ort, an dem man Kugel- oder Softeis direkt kaufen kann.',
  },
  restaurant: {
    title: 'Restaurant/Café mit Eisangebot',
    description: 'Wähle diesen Typ, wenn kein Eis direkt verkauft wird, aber Eis als Dessert oder Eisspeise auf der Karte steht.',
  },
  temporary_stand: {
    title: 'Temporärer Eisstand',
    description: 'Wähle diesen Typ für mobile Verkaufsstände, die nur zeitweise vor Ort sind, zum Beispiel während eines Festes.',
  },
};

const SubmitIceShopModal = ({
  showForm,
  setShowForm,
  userId,
  refreshShops,
  userLatitude = null,
  userLongitude = null,
  existingIceShop = null,
  initialLatitude = null,
  initialLongitude = null,
  initialName = "",
  initialAddress = "",
  initialWebsite = "",
  initialExternalSource = null,
  initialOpeningHoursStructured = null,
  initialOpeningHoursNote = "",
  initialPlaceType = "ice_shop",
  onSubmitSuccess = null,
  autoCloseAfterSuccess = true
}) => {
  const [name, setName] = useState(existingIceShop?.name || "");
  const [adresse, setAdresse] = useState(existingIceShop?.adresse || "");
  const [website, setWebsite] = useState(existingIceShop?.website || "");
  const [latitude, setLatitude] = useState(existingIceShop?.latitude || "");
  const [longitude, setLongitude] = useState(existingIceShop?.longitude || "");
  const [openingHoursData, setOpeningHoursData] = useState(() =>
    hydrateOpeningHours(existingIceShop?.openingHoursStructured, existingIceShop?.opening_hours_note || "")
  );
  const [status, setStatus] = useState(existingIceShop?.status || 'open');
  const [reopeningDate, setReopeningDate] = useState(existingIceShop?.reopening_date || '');
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [awards, setAwards] = useState([]);
  const [levelUpInfo, setLevelUpInfo] = useState(null);
  const [closingDate, setClosingDate] = useState(existingIceShop?.closing_date || "");
  const [selectedExternalSource, setSelectedExternalSource] = useState(initialExternalSource || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placeType, setPlaceType] = useState(existingIceShop?.place_type || initialPlaceType || 'ice_shop');
  const [temporaryDuration, setTemporaryDuration] = useState(existingIceShop?.place_type === 'temporary_stand' ? 'date' : 'today');
  const [temporaryEndDate, setTemporaryEndDate] = useState(existingIceShop?.active_until ? String(existingIceShop.active_until).slice(0, 10) : '');
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const isEditMode = Boolean(existingIceShop);
  const isAdmin = Number(userId) === 1;
  const isOwner = isEditMode && Number(existingIceShop?.user_id) === Number(userId);
  const createdAt = existingIceShop?.erstellt_am ? new Date(existingIceShop.erstellt_am) : null;
  const createdAtMs = createdAt ? createdAt.getTime() : null;
  const isRecentOwner = Boolean(
    isOwner &&
    createdAtMs &&
    !Number.isNaN(createdAtMs) &&
    (Date.now() - createdAtMs <= 6 * 60 * 60 * 1000)
  );
  const autoApproveChanges = isEditMode ? (isAdmin || isRecentOwner) : true;
  const coordinatesLocked = isEditMode && !isAdmin;
  const placeTypeLabel = placeType === 'restaurant' ? 'Restaurant/Café' : placeType === 'temporary_stand' ? 'Temporärer Stand' : 'Eisdiele';
  const modalTitle = isEditMode
    ? (autoApproveChanges ? `${placeTypeLabel} bearbeiten` : "Änderung vorschlagen")
    : placeType === 'ice_shop' ? 'Neue Eisdiele eintragen' : `${placeTypeLabel} eintragen`;
  const submitLabel = isEditMode
    ? (autoApproveChanges ? "Aktualisieren" : "Vorschlag senden")
    : "Einreichen";

  const formatCoordinate = (value) => {
    const number = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(number)) {
      return '';
    }
    return number.toFixed(6);
  };

  useEffect(() => {
    if (!existingIceShop) {
      return;
    }
    setName(existingIceShop.name || "");
    setAdresse(existingIceShop.adresse || "");
    setWebsite(existingIceShop.website || "");
    setLatitude(existingIceShop.latitude || "");
    setLongitude(existingIceShop.longitude || "");
    setStatus(existingIceShop.status || 'open');
    setReopeningDate(existingIceShop.reopening_date || '');
    setClosingDate(existingIceShop.closing_date || '');
    setSelectedExternalSource(null);
    setPlaceType(existingIceShop.place_type || 'ice_shop');
    setTemporaryDuration(existingIceShop.place_type === 'temporary_stand' ? 'date' : 'today');
    setTemporaryEndDate(existingIceShop.active_until ? String(existingIceShop.active_until).slice(0, 10) : '');
    setOpeningHoursData(
      hydrateOpeningHours(
        existingIceShop?.openingHoursStructured,
        existingIceShop?.opening_hours_note || ""
      )
    );
  }, [existingIceShop]);

  useEffect(() => {
    if (!showForm || existingIceShop) {
      return;
    }
    setName(initialName || "");
    setAdresse(initialAddress || "");
    setWebsite(initialWebsite || "");
    setLatitude(initialLatitude === null ? "" : formatCoordinate(initialLatitude));
    setLongitude(initialLongitude === null ? "" : formatCoordinate(initialLongitude));
    setOpeningHoursData(
      hydrateOpeningHours(initialOpeningHoursStructured, initialOpeningHoursNote || "")
    );
    setStatus('open');
    setReopeningDate('');
    setClosingDate('');
    setSelectedExternalSource(initialExternalSource || null);
    setPlaceType(initialPlaceType || 'ice_shop');
    setTemporaryDuration('today');
    setTemporaryEndDate('');
  }, [
    showForm,
    existingIceShop,
    initialLatitude,
    initialLongitude,
    initialName,
    initialAddress,
    initialWebsite,
    initialExternalSource,
    initialOpeningHoursStructured,
    initialOpeningHoursNote,
    initialPlaceType,
  ]);

  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const resolveTemporaryEnd = () => {
    const date = new Date();
    if (temporaryDuration === 'tomorrow') date.setDate(date.getDate() + 1);
    const datePart = temporaryDuration === 'date' ? temporaryEndDate : formatLocalDate(date);
    return datePart ? `${datePart} 23:59:59` : null;
  };

  const submit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      setAwards([]);
      setLevelUpInfo(null);
      const endpoint = existingIceShop
        ? `${apiUrl}/updateIceShop.php`
        : `${apiUrl}/submitIceShop.php`;

      const body = {
        name,
        adresse,
        website,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        openingHoursStructured: openingHoursData,
        userId,
        closing_date: closingDate || null,
        place_type: placeType,
      };
      if (placeType === 'temporary_stand') {
        body.active_until = resolveTemporaryEnd();
        if (!body.active_until) {
          setMessage('Bitte wähle aus, wie lange der Stand sichtbar sein soll.');
          return;
        }
      } else if (existingIceShop) {
        body.active_until = null;
      }

      if (!existingIceShop && selectedExternalSource) {
        body.external_source = selectedExternalSource;
      }

      if (existingIceShop) {
        body.shopId = existingIceShop.id;
        // Status, Reopening-Date und Closing-Date nur beim Update mitsenden
        body.status = status;
        body.reopening_date = reopeningDate;
        body.closing_date = closingDate || null;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.status === "success" || data.status === "pending") {
        const isPending = data.status === "pending";
        const maintenanceHint = data?.maintenance_task_resolved?.bonus_ep
          ? ` +${data.maintenance_task_resolved.bonus_ep} Pflege-EP`
          : "";
        const fallbackMessage = existingIceShop
          ? (isPending ? "Änderungsvorschlag gespeichert – wir prüfen ihn zeitnah." : "Eisdiele erfolgreich aktualisiert!")
          : `${placeTypeLabel} erfolgreich hinzugefügt!`;
        setMessage((data.message || fallbackMessage) + maintenanceHint);
        setSubmitted(true);
        const becameRestaurant = placeType === 'restaurant'
          && (!existingIceShop || existingIceShop.place_type !== 'restaurant');
        if (!isPending && becameRestaurant) {
          requestRestaurantVisibility();
        }
        if (!isPending && refreshShops) {
          refreshShops();
        }
        if (!isPending && onSubmitSuccess) {
          onSubmitSuccess(body, data);
        }

        setName("");
        setAdresse("");
        setWebsite("");
        setLatitude("");
        setLongitude("");
        setOpeningHoursData(createEmptyOpeningHours());
        setSelectedExternalSource(null);

        if (!isPending) {
          if (data.level_up || data.new_awards && data.new_awards.length > 0) {
            if (data.level_up) {
              setLevelUpInfo({
                level: data.new_level,
                level_name: data.level_name,
              });
            }
            if (data.new_awards?.length > 0) {
              setAwards(data.new_awards);
            }
          } else if (autoCloseAfterSuccess) {
            setTimeout(() => {
              setMessage("");
              setShowForm(false);
            }, 2000);
          }
        } else {
          setTimeout(() => {
            setMessage("");
            setShowForm(false);
          }, 2500);
        }

      } else {
        setMessage(`Fehler: ${data.message}`);
      }

    } catch (error) {
      setMessage("Ein Fehler ist aufgetreten.");
      console.log(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGeocode = async () => {
    if (!adresse || coordinatesLocked) return;

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(adresse)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setLatitude(parseFloat(lat));
        setLongitude(parseFloat(lon));
      } else {
        alert("Adresse konnte nicht gefunden werden.");
      }
    } catch (error) {
      console.error("Geocoding Fehler:", error);
    }
  };
  const handleAddressBlur = () => {
    if (!latitude && !longitude) {
      handleGeocode();
    }
  };

  const handleReverseGeocode = async () => {
    if (!latitude || !longitude) return;

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=de`);
      const data = await response.json();
      if (data?.address) {
        const address = data.address;
        const street = [address.road, address.house_number].filter(Boolean).join(" ").trim();
        const locality = address.city
          ?? address.town
          ?? address.village
          ?? address.municipality
          ?? address.hamlet
          ?? "";
        const postcode = address.postcode ? `${address.postcode} ` : "";
        const country = address.country ?? "";
        const composed = [street, `${postcode}${locality}`.trim(), country].filter(Boolean).join(", ");
        setAdresse(composed || data.display_name || "");
      } else if (data?.display_name) {
        setAdresse(data.display_name);
      } else {
        setMessage("Adresse konnte nicht aus der Position ermittelt werden.");
      }
    } catch (error) {
      console.error("Reverse-Geocoding Fehler:", error);
      setMessage("Reverse-Geocoding fehlgeschlagen.");
    }
  };

  return showForm && (
    <Overlay>
      <StyledModal>
        <CloseButton onClick={() => setShowForm(false)}>×</CloseButton>
        <Heading>{modalTitle}</Heading>
        <IntroText>Trage die wichtigsten Infos zu diesem öffentlichen Eis-Ort ein. Position und Öffnungszeiten helfen anderen Nutzerinnen und Nutzern besonders.</IntroText>
        {existingIceShop && (
          <InfoBanner $needsReview={!autoApproveChanges}>
            {autoApproveChanges
              ? "Du kannst diesen Eis-Ort direkt bearbeiten."
              : "Dein Vorschlag wird erst nach Freigabe übernommen."}
          </InfoBanner>
        )}
        {!submitted && (<form onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}>
          {(!existingIceShop || autoApproveChanges) && (
            <SectionCard>
              <Group>
                <label>Welche Art von Eis-Ort ist das?</label>
                <Select value={placeType} onChange={(event) => setPlaceType(event.target.value)}>
                  <option value="ice_shop">Eisdiele – Kugel- oder Softeis direkt kaufen</option>
                  <option value="restaurant">Restaurant/Café – Eis nur als Dessert</option>
                  <option value="temporary_stand">Temporärer Eisstand – nur zeitweise vor Ort</option>
                </Select>
                <PlaceTypeGuidance $type={placeType} role="note">
                  <strong>{PLACE_TYPE_GUIDANCE[placeType].title}</strong>
                  <span>{PLACE_TYPE_GUIDANCE[placeType].description}</span>
                </PlaceTypeGuidance>
              </Group>
              {placeType === 'temporary_stand' && (
                <Group>
                  <label>Auf der Karte sichtbar:</label>
                  <Select value={temporaryDuration} onChange={(event) => setTemporaryDuration(event.target.value)}>
                    <option value="today">Nur heute</option>
                    <option value="tomorrow">Bis morgen</option>
                    <option value="date">Bis zu einem Datum</option>
                  </Select>
                  {temporaryDuration === 'date' && (
                    <Input
                      type="date"
                      min={formatLocalDate(new Date())}
                      value={temporaryEndDate}
                      onChange={(event) => setTemporaryEndDate(event.target.value)}
                      required
                    />
                  )}
                </Group>
              )}
            </SectionCard>
          )}
          {!existingIceShop && selectedExternalSource && (
            <SectionCard>
              <SearchHeading>Discovery-Import</SearchHeading>
              <SearchHint>
                Dieser Eintrag stammt aus der Karten-Discovery. Bitte prüfe Name, Position und Öffnungszeiten vor dem Speichern.
              </SearchHint>
              {selectedExternalSource && (
                <SelectedExternalSource>
                  Externer Treffer verknüpft: <strong>{selectedExternalSource.name}</strong>
                </SelectedExternalSource>
              )}
            </SectionCard>
          )}

          <SectionCard>
          <Group>
            <label>Name:</label>
            <Input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </Group>

          <Group>
            <label>Adresse:</label>
            <Input type="text" value={adresse} onChange={(e) => setAdresse(e.target.value)} onBlur={handleAddressBlur} />
          </Group>
          </SectionCard>

          <SectionCard>
          <LocationPicker
            latitude={latitude || userLatitude || 50.83}
            longitude={longitude || userLongitude || 12.92}
            setLatitude={setLatitude}
            setLongitude={setLongitude}
            readOnly={coordinatesLocked}
          />
          <ButtonGroup>
            <UtilityButton
              type="button"
              onClick={handleGeocode}
              disabled={coordinatesLocked}
            >
              Position aus Adresse bestimmen
            </UtilityButton>
            <UtilityButton
              type="button"
              onClick={handleReverseGeocode}
              disabled={!latitude || !longitude}
            >
              Adresse aus Position übernehmen
            </UtilityButton>
          </ButtonGroup>
          {coordinatesLocked && (
            <CoordinateNotice>
              Koordinaten können aktuell nur vom Administrator angepasst werden.
            </CoordinateNotice>
          )}

          <GroupInline>
            <Group>
              <label>Latitude:</label>
              <CoordinateInput
                type="number"
                step="0.000001"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
                disabled={coordinatesLocked}
              />
            </Group>
            <Group>
              <label>Longitude:</label>
              <CoordinateInput
                type="number"
                step="0.000001"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
                disabled={coordinatesLocked}
              />
            </Group>
          </GroupInline>
          </SectionCard>

          <SectionCard>
          <Group>
            <label>Öffnungszeiten (optional):</label>
            <OpeningHoursEditor value={openingHoursData} onChange={setOpeningHoursData} />
          </Group>

          <Group>
            <label>Website (optional):</label>
            <Input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </Group>
          </SectionCard>

          {existingIceShop && (
            <SectionCard>
              <Group>
                <label>Status:</label>
                <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="open">open</option>
                  <option value="seasonal_closed">seasonal_closed</option>
                  <option value="permanent_closed">permanent_closed</option>
                </Select>
              </Group>
              <Group>
                <label>Wiedereröffnungsdatum (optional):</label>
                <Input type="date" value={reopeningDate} onChange={(e) => setReopeningDate(e.target.value)} />
              </Group>
              <Group>
                <label>Saison-Ende (optional):</label>
                <Input type="date" value={closingDate} onChange={(e) => setClosingDate(e.target.value)} />
              </Group>
            </SectionCard>
          )}

          <ButtonGroup>
            <PrimarySubmit type="submit" disabled={isSubmitting}>{submitLabel}</PrimarySubmit>
          </ButtonGroup>
        </form>)}

  {message && <Message>{message}</Message>}
        {levelUpInfo && (
          <LevelInfo>
            <h2>🎉 Level-Up!</h2>
            <p>Du hast <strong>Level {levelUpInfo.level}</strong> erreicht!</p>
            <p><em>{levelUpInfo.level_name}</em></p>
          </LevelInfo>
        )}
        <NewAwards awards={awards} />
      </StyledModal>
    </Overlay>
  );
};

export default SubmitIceShopModal;

// Keep GroupInline and CoordinateInput file-specific
const Group = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 0.6rem;

  label {
    font-weight: 700;
    color: #4f3800;
    margin-bottom: 0.2rem;
    font-size: 0.92rem;
  }
`;

const GroupInline = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 0.1rem;

  @media (max-width: 720px) {
    flex-direction: column;
    gap: 0.6rem;
  }
`;

const CoordinateInput = styled(Input)`
  width: 90%;
  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
`;

// Local size tweaks for buttons
const StyledModal = styled(Modal)`
  width: min(96vw, 760px);
  background: linear-gradient(180deg, #fffdf8 0%, #fff6e6 100%);
  border: 1px solid rgba(47, 33, 0, 0.12);
  border-radius: 18px;
  box-shadow: 0 18px 36px rgba(28, 20, 0, 0.2);
`;

const IntroText = styled.p`
  margin: -0.2rem 0 0.8rem;
  color: rgba(47, 33, 0, 0.72);
  font-size: 0.92rem;
`;

const SearchHeading = styled.h3`
  margin: 0 0 0.35rem;
  color: #4f3800;
  font-size: 1rem;
`;

const SearchHint = styled.p`
  margin: 0 0 0.75rem;
  color: rgba(47, 33, 0, 0.72);
  font-size: 0.9rem;
`;

const SearchRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 140px auto;
  gap: 0.6rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const SearchMeta = styled.p`
  margin: 0 0 0.7rem;
  color: rgba(47, 33, 0, 0.72);
  font-size: 0.86rem;
`;

const SelectedExternalSource = styled.p`
  margin: 0.75rem 0 0;
  color: #6b4b00;
  font-size: 0.9rem;
`;

const ExternalResultList = styled.div`
  display: grid;
  gap: 0.7rem;
  margin-top: 0.85rem;
`;

const ExternalResultItem = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.8rem;
  padding: 0.75rem;
  border-radius: 12px;
  border: 1px solid rgba(47, 33, 0, 0.1);
  background: rgba(255, 255, 255, 0.88);

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const ExternalResultTitle = styled.div`
  color: #2f2100;
  font-weight: 700;
`;

const ExternalResultMeta = styled.div`
  margin-top: 0.2rem;
  color: rgba(47, 33, 0, 0.68);
  font-size: 0.88rem;
`;

const ExternalActions = styled.div`
  display: grid;
  gap: 0.45rem;
  align-content: start;
`;

const ExternalBadge = styled.span`
  display: inline-flex;
  margin-top: 0.4rem;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  background: ${({ $tone }) => $tone === 'new' ? '#e8f7e9' : $tone === 'existing' ? '#e7efff' : '#fff2d9'};
  color: ${({ $tone }) => $tone === 'new' ? '#1f6f43' : $tone === 'existing' ? '#2453c2' : '#9a5a00'};
`;

const SectionCard = styled.div`
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(47, 33, 0, 0.1);
  border-radius: 14px;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
`;

const PlaceTypeGuidance = styled.div`
  display: grid;
  gap: 0.18rem;
  margin-top: 0.55rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid ${({ $type }) => $type === 'restaurant'
    ? 'rgba(79, 70, 165, 0.18)'
    : $type === 'temporary_stand'
      ? 'rgba(36, 112, 58, 0.18)'
      : 'rgba(176, 116, 0, 0.2)'};
  border-radius: 10px;
  background: ${({ $type }) => $type === 'restaurant'
    ? 'rgba(238, 240, 255, 0.72)'
    : $type === 'temporary_stand'
      ? 'rgba(232, 248, 236, 0.72)'
      : 'rgba(255, 239, 199, 0.72)'};
  color: #3f3218;
  line-height: 1.4;

  strong {
    font-size: 0.88rem;
  }

  span {
    font-size: 0.82rem;
    color: rgba(47, 33, 0, 0.72);
  }
`;

const UtilityButton = styled(Button)`
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  border-radius: 8px;
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const PrimarySubmit = styled(SubmitButton)`
  width: 100%;
  margin: 0;
  color: #2f2100;
  border: 1px solid rgba(255, 181, 34, 0.6);
  border-radius: 12px;
  background: linear-gradient(180deg, #ffd36f 0%, #ffb522 100%);
`;

const InfoBanner = styled.div`
  margin: 0.5rem 0 1rem;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  background: ${({ $needsReview }) => $needsReview ? '#fff5db' : '#e1faea'};
  color: ${({ $needsReview }) => $needsReview ? '#7a5c00' : '#1f6f43'};
`;

const CoordinateNotice = styled.p`
  margin: 0.25rem auto 0.75rem;
  font-size: 0.85rem;
  color: #666;
  text-align: center;
`;

