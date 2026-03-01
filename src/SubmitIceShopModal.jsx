import { useEffect, useState } from "react";
import styled from "styled-components";
import { Overlay, Modal, CloseButton, Heading, Input, Select, ButtonGroup, SubmitButton, Button, Message, LevelInfo } from './styles/SharedStyles';
import LocationPicker from "./components/LocationPicker";
import NewAwards from "./components/NewAwards";
import OpeningHoursEditor from "./components/OpeningHoursEditor";
import { createEmptyOpeningHours, hydrateOpeningHours } from "./utils/openingHours";

const SubmitIceShopModal = ({
  showForm,
  setShowForm,
  userId,
  refreshShops,
  userLatitude = null,
  userLongitude = null,
  existingIceShop = null,
  initialLatitude = null,
  initialLongitude = null
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
  const modalTitle = isEditMode
    ? (autoApproveChanges ? "Eisdiele bearbeiten" : "Änderung vorschlagen")
    : "Neue Eisdiele eintragen";
  const submitLabel = isEditMode
    ? (autoApproveChanges ? "Aktualisieren" : "Vorschlag senden")
    : "Einreichen";

  useEffect(() => {
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
    if (initialLatitude === null || initialLongitude === null) {
      return;
    }
    const formatCoordinate = (value) => {
      const number = typeof value === 'number' ? value : Number(value);
      if (Number.isNaN(number)) {
        return '';
      }
      return number.toFixed(6);
    };
    setLatitude(formatCoordinate(initialLatitude));
    setLongitude(formatCoordinate(initialLongitude));
  }, [showForm, existingIceShop, initialLatitude, initialLongitude]);

  const submit = async () => {
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
        closing_date: closingDate || null
      };

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
        const fallbackMessage = existingIceShop
          ? (isPending ? "Änderungsvorschlag gespeichert – wir prüfen ihn zeitnah." : "Eisdiele erfolgreich aktualisiert!")
          : "Eisdiele erfolgreich hinzugefügt!";
        setMessage(data.message || fallbackMessage);
        setSubmitted(true);
        if (!isPending && refreshShops) {
          refreshShops();
        }

        setName("");
        setAdresse("");
        setWebsite("");
        setLatitude("");
        setLongitude("");
        setOpeningHoursData(createEmptyOpeningHours());

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
          } else {
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
        <IntroText>Trage die wichtigsten Infos zur Eisdiele ein. Position und Öffnungszeiten helfen anderen Nutzerinnen und Nutzern besonders.</IntroText>
        {existingIceShop && (
          <InfoBanner $needsReview={!autoApproveChanges}>
            {autoApproveChanges
              ? "Du kannst diese Eisdiele direkt bearbeiten."
              : "Dein Vorschlag wird erst nach Freigabe übernommen."}
          </InfoBanner>
        )}
        {!submitted && (<form onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}>
          <SectionCard>
          <Group>
            <label>Name:</label>
            <Input type="text" value={name} onChange={(e) => setName(e.target.value)} required="true" />
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
                required="true"
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
                required="true"
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
            <PrimarySubmit type="submit">{submitLabel}</PrimarySubmit>
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

const SectionCard = styled.div`
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(47, 33, 0, 0.1);
  border-radius: 14px;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
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

