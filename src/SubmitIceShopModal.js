import { useState } from "react";
import styled from "styled-components";
import LocationPicker from "./components/LocationPicker";

const SubmitIceShopModal = ({ showForm, setShowForm, userId, refreshShops, userLatitude = null, userLongitude = null}) => {
  const [name, setName] = useState("");
  const [adresse, setAdresse] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [komoot, setKomoot] = useState("");
  const [message, setMessage] = useState("");

  const submit = async () => {
    try {
      const response = await fetch("https://ice-app.4lima.de/backend/submitIceShop.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          adresse,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          openingHours,
          komoot,
          userId
        })
      });
      const data = await response.json();
      if (data.status === "success") {
        setMessage("Eisdiele erfolgreich hinzugefügt!");
        refreshShops();
      } else {
        setMessage(`Fehler: ${data.message}`);
      }
      setTimeout(() => {
        setMessage("");
        setShowForm(false);
        setName("");
        setAdresse("");
        setLatitude("");
        setLongitude("");
        setOpeningHours("{}");
        setKomoot("");
      }, 2000);
    } catch (error) {
      setMessage("Ein Fehler ist aufgetreten.");
      console.log(error);
    }
  };

  return showForm && (
    <Overlay>
      <Modal>
        <CloseX onClick={() => setShowForm(false)}>×</CloseX>
        <Title>Neue Eisdiele eintragen</Title>

        <Group>
          <label>Name:</label>
          <Input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </Group>

        <Group>
          <label>Adresse:</label>
          <Input type="text" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
        </Group>

        <LocationPicker
          latitude={ latitude || userLatitude || 50.83}
          longitude={ longitude || userLongitude || 12.92}
          setLatitude={setLatitude}
          setLongitude={setLongitude}
        />

        <GroupInline>
          <Group>
            <label>Latitude:</label>
            <CoordinateInput
              type="number"
              step="0.000001"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
            />
          </Group>
          <Group>
            <label>Longitude:</label>
            <CoordinateInput
              type="number"
              step="0.000001"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
            />
          </Group>
        </GroupInline>

        <Group>
          <label>Öffnungszeiten (optional):</label>
          <Textarea value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} rows={3} />
        </Group>

        <Group>
          <label>Komoot-Link (optional):</label>
          <Input type="text" value={komoot} onChange={(e) => setKomoot(e.target.value)} />
        </Group>

        <ButtonGroup>
          <SubmitButton onClick={submit}>Einreichen</SubmitButton>
        </ButtonGroup>

        {message && <Message>{message}</Message>}
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
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  overflow-y: auto;
`;

const Modal = styled.div`
  background-color: #fff;
  padding: 1rem;
  border-radius: 16px;
  width: 100%;
  max-width: 450px;
  max-height: 100vh;
  overflow-y: auto;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  position: relative;
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
