import { useState, useEffect } from "react";
import styled from 'styled-components';
import { useUser } from './context/UserContext';

const SubmitRouteForm = ({ showForm, setShowForm, shopId, shopName, existingRoute = null }) => {

    const [url, setUrl] = useState("");
    const [beschreibung, setBeschreibung] = useState("");
    const [typ, setTyp] = useState("Wanderung");
    const [isPrivat, setisPrivat] = useState(false);
    const { userId } = useUser();
    const [message, setMessage] = useState("");

    // Wenn bestehende Route übergeben, Felder vorausfüllen
    useEffect(() => {
        if (existingRoute) {
            setUrl(existingRoute.url || "");
            setBeschreibung(existingRoute.beschreibung || "");
            setTyp(existingRoute.typ || "Wanderung");
            setisPrivat(!existingRoute.ist_oeffentlich);
        }
    }, [existingRoute]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const routeData = {
            eisdiele_id: shopId,
            nutzer_id: userId,
            url,
            beschreibung,
            typ,
            ist_oeffentlich: isPrivat ? 0 : 1,
        };

        // Bei Bearbeitung ID hinzufügen
        if (existingRoute) {
            routeData.id = existingRoute.id;
        }

        const endpoint = existingRoute
            ? "https://ice-app.4lima.de/backend/routen/updateRoute.php"
            : "https://ice-app.4lima.de/backend/routen/submitRoute.php";

        try {
            const response  = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(routeData),
            });

            const result = await response.json();
            if (result.status === "success") {
                setMessage(existingRoute ? "Route erfolgreich aktualisiert!" : "Route erfolgreich hinzugefügt!");
                setUrl("");
                setBeschreibung("");
                setTyp("Wanderung");
                setisPrivat(false);                
                setTimeout(() => {
                    setShowForm(false);
                }, 2000);
            } else {
                setMessage(`Fehler: ${result.message}`);
            }
        } catch (error) {
            console.error("Fehler beim Einreichen der Route:", error);
            setMessage("Fehler beim Einreichen der Route ist aufgetreten.");
        }
    };

    return showForm ? (
        <Overlay>
            <Modal>
                <CloseButton onClick={() => setShowForm(false)}>×</CloseButton>
                <Heading>
                    {existingRoute ? "Route bearbeiten" : `Route für ${shopName} einreichen`}
                </Heading>

                <Label>
                    Embedded Komoot Route:
                    <TextArea
                        rows={3}
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Bei Komoot auf 'Teilen' klicken -> 'Einbetten' -> In voller Breite einbetten / Höhe und Breite 100% x 440 -> Code zum Einbetten kopieren"
                        required
                    />
                </Label>

                <Label>
                    Beschreibung:
                    <TextArea
                        rows={3}
                        value={beschreibung}
                        onChange={(e) => setBeschreibung(e.target.value)}
                        placeholder="Hier kannst du deine Route beschreiben."
                    />
                </Label>

                <Label>
                    Typ: 
                    <Select value={typ} onChange={(e) => setTyp(e.target.value)}>
                        <option value="Wanderung">Wanderung</option>
                        <option value="Rennrad">Rennrad</option>
                        <option value="MTB">MTB</option>
                        <option value="Gravel">Gravel</option>
                        <option value="Sonstiges">Sonstiges</option>
                    </Select>
                </Label>

                <Label>
                    Private Tour:
                    <Checkbox
                        type="checkbox"
                        checked={isPrivat}
                        onChange={(e) => setisPrivat(e.target.checked)}
                    />
                </Label>
                <ButtonGroup>
                    <SubmitButton type="submit" onClick={handleSubmit}>
                        {existingRoute ? "Änderungen speichern" : "Route einreichen"}
                    </SubmitButton>
                    <SubmitButton type="button" onClick={() => setShowForm(false)}>
                        Abbrechen
                    </SubmitButton>
                </ButtonGroup>
                <Message>{message}</Message>
            </Modal>
        </Overlay>) : null;
};

export default SubmitRouteForm;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
`;

const Modal = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  position: relative;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
`;

const Heading = styled.h2`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-top: 1rem;
  font-weight: bold;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  margin-top: 0.5rem;
  border-radius: 8px;
  border: 1px solid #ccc;
`;

const Select = styled.select`
  padding: 0.5rem;
  margin-bottom: 1rem;
  margin-left: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const ButtonGroup = styled.div`
    text-align: center;
`;

const SubmitButton = styled.button`
  margin: 10px 10px -15px 10px;
  padding: 0.75rem 1.5rem;
  background-color: #ffb522;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;

  &:hover {
    background-color: #ffcb4c;
  }
`;

const Message = styled.p`
  margin-top: 1rem;
  font-style: italic;
`;

const Checkbox = styled.input`
  margin-right: 0.5rem;
`;