import { useState } from "react";
import styled from "styled-components";
import { Overlay, Modal, CloseButton, Heading, Input, Select, Textarea, ButtonGroup, SubmitButton, Button, Message, LevelInfo } from './styles/SharedStyles';
import LocationPicker from "./components/LocationPicker";
import NewAwards from "./components/NewAwards";

const SubmitIceShopModal = ({
  showForm,
  setShowForm,
  userId,
  refreshShops,
  userLatitude = null,
  userLongitude = null,
  existingIceShop = null
}) => {
  const [name, setName] = useState(existingIceShop?.name || "");
  const [adresse, setAdresse] = useState(existingIceShop?.adresse || "");
  const [website, setWebsite] = useState(existingIceShop?.website || "");
  const [latitude, setLatitude] = useState(existingIceShop?.latitude || "");
  const [longitude, setLongitude] = useState(existingIceShop?.longitude || "");
  const [openingHours, setOpeningHours] = useState(existingIceShop?.openingHours || "");
  const [status, setStatus] = useState(existingIceShop?.status || 'open');
  const [reopeningDate, setReopeningDate] = useState(existingIceShop?.reopening_date || '');
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [awards, setAwards] = useState([]);
  const [levelUpInfo, setLevelUpInfo] = useState(null);
  const apiUrl = process.env.REACT_APP_API_BASE_URL;

  const submit = async () => {
    try {
      const endpoint = existingIceShop
        ? `${apiUrl}/updateIceShop.php`
        : `${apiUrl}/submitIceShop.php`;

      const body = {
        name,
        adresse,
        website,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        openingHours,
        userId
      };

      if (existingIceShop) {
        body.shopId = existingIceShop.id;
        // Status und Reopening-Date nur beim Update mitsenden
        body.status = status;
        body.reopening_date = reopeningDate;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.status === "success") {
        setMessage(existingIceShop ? "Eisdiele erfolgreich aktualisiert!" : "Eisdiele erfolgreich hinzugefügt!");
        setSubmitted(true);
        if (refreshShops) {refreshShops();}

        setName("");
        setAdresse("");
        setWebsite("");
        setLatitude("");
        setLongitude("");
        setOpeningHours("{}");

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
        setMessage(`Fehler: ${data.message}`);
      }

    } catch (error) {
      setMessage("Ein Fehler ist aufgetreten.");
      console.log(error);
    }
  };

  const handleGeocode = async () => {
    if (!adresse) return;

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

  return showForm && (
    <Overlay>
      <Modal>
        <CloseButton onClick={() => setShowForm(false)}>×</CloseButton>
        <Heading>{existingIceShop ? "Eisdiele bearbeiten" : "Neue Eisdiele eintragen"}</Heading>
        {!submitted && (<form onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}>
          <Group>
            <label>Name:</label>
            <Input type="text" value={name} onChange={(e) => setName(e.target.value)} required="true" />
          </Group>

          <Group>
            <label>Adresse:</label>
            <Input type="text" value={adresse} onChange={(e) => setAdresse(e.target.value)} onBlur={handleAddressBlur} />
          </Group>

          <LocationPicker
            latitude={latitude || userLatitude || 50.83}
            longitude={longitude || userLongitude || 12.92}
            setLatitude={setLatitude}
            setLongitude={setLongitude}
          />
          <ButtonGroup><SmallButton type="button" onClick={handleGeocode}>Position aus Adresse bestimmen</SmallButton></ButtonGroup>

          <GroupInline>
            <Group>
              <label>Latitude:</label>
              <CoordinateInput
                type="number"
                step="0.000001"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required="true"
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
              />
            </Group>
          </GroupInline>

          <Group>
            <label>Öffnungszeiten (optional):</label>
            <Textarea value={openingHours} placeholder="z.B. Mo-Fr: 12-18 Uhr" onChange={(e) => setOpeningHours(e.target.value)} rows={3} />
          </Group>

          <Group>
            <label>Website (optional):</label>
            <Input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </Group>

          {existingIceShop && (
            <>
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
            </>
          )}

          <ButtonGroup>
            <SubmitButton type="submit">{existingIceShop ? "Aktualisieren" : "Einreichen"}</SubmitButton>
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
      </Modal>
    </Overlay>
  );
};

export default SubmitIceShopModal;

// Keep GroupInline and CoordinateInput file-specific
const Group = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 0.5rem;
`;

const GroupInline = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
`;

const CoordinateInput = styled(Input)`
  width: 90%;
`;

// Local size tweaks for buttons
const SmallButton = styled(Button)`
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  border-radius: 6px;
`;

