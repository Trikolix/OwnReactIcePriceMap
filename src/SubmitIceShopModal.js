import { useState } from "react";
import styled from "styled-components";
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
        <CloseX onClick={() => setShowForm(false)}>×</CloseX>
        <Title>{existingIceShop ? "Eisdiele bearbeiten" : "Neue Eisdiele eintragen"}</Title>
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
          <ButtonGroup><SmallerButton type="button" onClick={handleGeocode}>Position aus Adresse bestimmen</SmallerButton></ButtonGroup>

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

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100dvh;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1002;
  overflow-y: auto;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
`;

const Modal = styled.div`
  background-color: #fff;
  padding: 1rem;
  padding-bottom: calc(2.5rem + env(safe-area-inset-bottom)); /* für Button & iPhone-Navigation */
  border-radius: 16px;
  width: 95vw;
  max-width: 450px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  position: relative;
  box-sizing: border-box;
  scroll-padding-bottom: 100px; /* falls Fokus z. B. auf Input-Elementen ist */
  
  @media (max-height: 600px) {
    max-height: 95vh;
    padding: 0.5rem;
    padding-bottom: calc(2.5rem + env(safe-area-inset-bottom));
  }
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
`;

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

const Input = styled.input`
  padding: 0.5rem;
  font-size: 1rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  margin-top: 0.25rem;
`;

const CoordinateInput = styled(Input)`
  width: 90%;
`;

const Textarea = styled.textarea`
  padding: 0.5rem;
  font-size: 1rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  margin-top: 0.25rem;
  resize: vertical;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const SubmitButton = styled.button`
  background-color: #ffb522;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
`;
const SmallerButton = styled.button`
  background-color: #ffb522;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
`;

const CloseX = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
`;

const Message = styled.p`
  margin-top: 1rem;
  font-style: italic;
  color: #555;
`;

const LevelInfo = styled.div`
  margin-top: 1rem;
  border-top: 1px solid #eee;
  padding-top: 1rem;
`;
