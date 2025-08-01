import { useState, useEffect } from "react";
import styled from 'styled-components';
import { useUser } from './context/UserContext';
import NewAwards from "./components/NewAwards";

const SubmitRouteForm = ({ showForm, setShowForm, shopId, shopName, existingRoute = null, onSuccess }) => {

    const [url, setUrl] = useState("");
    const [beschreibung, setBeschreibung] = useState("");
    const [typ, setTyp] = useState("Rennrad");
    const [isPrivat, setisPrivat] = useState(false);
    const [name, setName] = useState("");
    const [laenge_km, setLaenge_km] = useState("");
    const [hoehenmeter, setHoehenmeter] = useState("");
    const [schwierigkeit, setSchwierigkeit] = useState("leicht");
    const [embedCode, setEmbedCode] = useState("");
    const { userId } = useUser();
    const [message, setMessage] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [awards, setAwards] = useState([]);
    const [levelUpInfo, setLevelUpInfo] = useState(null);
    const apiUrl = process.env.REACT_APP_API_BASE_URL;

    // Wenn bestehende Route übergeben, Felder vorausfüllen
    useEffect(() => {
        if (existingRoute) {
            setUrl(existingRoute.url || "");
            setName(existingRoute.name || "");
            setBeschreibung(existingRoute.beschreibung || "");
            setTyp(existingRoute.typ || "Rennrad");
            setisPrivat(!existingRoute.ist_oeffentlich);
            setLaenge_km(existingRoute.laenge_km || "");
            setHoehenmeter(existingRoute.hoehenmeter || "");
            setSchwierigkeit(existingRoute.schwierigkeit || "Leicht");
            setEmbedCode(existingRoute.embed_code || "");
        }
    }, [existingRoute, userId]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const routeData = {
            eisdiele_id: shopId,
            nutzer_id: userId,
            url,
            name,
            beschreibung,
            typ,
            ist_oeffentlich: isPrivat ? 0 : 1,
            laenge_km,
            hoehenmeter,
            schwierigkeit,
        };

        if (userId === "1") {
            routeData.embed_code = embedCode;
        }

        // Bei Bearbeitung ID hinzufügen
        if (existingRoute) {
            routeData.id = existingRoute.id;
        }

        const endpoint = existingRoute
            ? `${apiUrl}/routen/updateRoute.php`
            : `${apiUrl}/routen/submitRoute.php`;

        try {
            const response = await fetch(endpoint, {
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
                setTyp("Rennrad");
                setName("");
                setLaenge_km("");
                setHoehenmeter("");
                setSchwierigkeit("leicht");
                setEmbedCode("");
                setisPrivat(false);
                setSubmitted(true);
                if (onSuccess) onSuccess();
                if (result.level_up || result.new_awards && result.new_awards.length > 0) {
                    if (result.level_up) {
                      setLevelUpInfo({
                        level: result.new_level,
                        level_name: result.level_name,
                      });
                    }
                    if (result.new_awards?.length > 0) {
                      setAwards(result.new_awards);
                    }
                } else {
                    setTimeout(() => {
                        setShowForm(false);
                    }, 2000);
                }
            } else {
                setMessage(`Fehler: ${result.message}`);
            }
        } catch (error) {
            console.error("Fehler beim Einreichen der Route:", error);
            setMessage("Fehler beim Einreichen der Route ist aufgetreten.");
        }
    };

    const handleDeleteClick = async () => {
        const confirmDelete = window.confirm("Möchtest du diese Route wirklich löschen? Das Löschen kann nicht rückgängig gemacht werden.");
        if (!confirmDelete) return;

        try {
            const response = await fetch(`${apiUrl}/routen/deleteRoute.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: existingRoute.id,
                    nutzer_id: userId,
                }),
            });

            const result = await response.json();

            if (result.status === "success") {
                setMessage("Route erfolgreich gelöscht!");
                setUrl("");
                setBeschreibung("");
                setTyp("Wanderung");
                setisPrivat(false);
                setSubmitted(true);
                if (onSuccess) onSuccess();
                setTimeout(() => {
                    setShowForm(false);
                }, 2000);
            } else {
                setMessage("Fehler beim Löschen: " + result.message);
            }
        } catch (error) {
            console.error("Fehler beim Löschen:", error);
            alert("Ein unbekannter Fehler ist aufgetreten.");
        }
    };

    return showForm ? (
        <Overlay>
            <Modal>
                <CloseButton onClick={() => setShowForm(false)}>×</CloseButton>
                <Heading>
                    {existingRoute ? "Route bearbeiten" : `Route für ${shopName} einreichen`}
                </Heading>

                {!submitted && (<>
                    <Group>
                        <Label>
                            Routenname:
                            <InputName
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="z. B. 'Rund um Eisdiele X'"
                                required
                            />
                        </Label>
                    </Group>

                    <Label>
                        URL:
                        <TextArea
                            rows={2}
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="URL zur Komoot / Stava / Outdooractive Route"
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
                            <option value="Rennrad">Rennrad</option>
                            <option value="Wanderung">Wanderung</option>
                            <option value="MTB">MTB</option>
                            <option value="Gravel">Gravel</option>
                            <option value="Sonstiges">Sonstiges</option>
                        </Select>
                    </Label>

                    <Label>
                        Länge (km):
                        <Input
                            type="number"
                            step="0.1"
                            value={laenge_km}
                            onChange={(e) => setLaenge_km(e.target.value)}
                            placeholder="z. B. 42.3"
                        />
                    </Label>

                    <Label>
                        Höhenmeter:
                        <Input
                            type="number"
                            value={hoehenmeter}
                            onChange={(e) => setHoehenmeter(e.target.value)}
                            placeholder="z. B. 680"
                        />
                    </Label>

                    <Label>
                        Schwierigkeit:
                        <Select value={schwierigkeit} onChange={(e) => setSchwierigkeit(e.target.value)}>
                            <option value="Leicht">Leicht</option>
                            <option value="Mittel">Mittel</option>
                            <option value="Schwer">Schwer</option>
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

                    {userId === "1" && (
                        <Label>
                            Embed Code (Admin):
                            <TextArea
                                rows={3}
                                value={embedCode}
                                onChange={(e) => setEmbedCode(e.target.value)}
                                placeholder="<iframe ...></iframe>"
                            />
                        </Label>
                    )}
                    <ButtonGroup>
                        <SubmitButton type="submit" onClick={handleSubmit}>
                            {existingRoute ? "Änderungen speichern" : "Route einreichen"}
                        </SubmitButton>
                        <SubmitButton type="button" onClick={() => setShowForm(false)}>
                            Abbrechen
                        </SubmitButton>
                        {existingRoute && (<><br />
                            <DeleteButton type="button" onClick={handleDeleteClick} >
                                Route löschen
                            </DeleteButton></>
                        )}
                    </ButtonGroup></>)}
                <Message>{message}</Message>
                {levelUpInfo && (
                  <LevelInfo>
                    <h2>🎉 Level-Up!</h2>
                    <p>Du hast <strong>Level {levelUpInfo.level}</strong> erreicht!</p>
                    <p><em>{levelUpInfo.level_name}</em></p>
                  </LevelInfo>
                )}
                <NewAwards awards={awards} />
            </Modal>
        </Overlay>) : null;
};

export default SubmitRouteForm;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  height: 100dvh;
  width: 100vw;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
`;

const Modal = styled.div`
  background-color: #fff;
  padding: 1rem;
  border-radius: 16px;
  width: 95vw;
  max-width: 550px;
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
  width: 95%;
  padding: 0.5rem;
  margin-top: 0.5rem;
  border-radius: 8px;
  border: 1px solid #ccc;
`;

const Select = styled.select`
  padding: 0.5rem;
  margin-left: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const ButtonGroup = styled.div`
    text-align: center;
    margin-bottom: 35px;
`;

const SubmitButton = styled.button`
  margin: 10px 10px -15px 10px;
  padding: 0.75rem 1rem;
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

const DeleteButton = styled(SubmitButton)`
  background-color: #d9534f;
  margin-top: 20px;
  margin-bottom: -50px;
  padding: 0.5rem 0.75rem;
  position: absolute;
  bottom: 60px;
  right: 0px;
  &:hover {
    background-color:rgb(216, 37, 31);
  }
`

const Message = styled.p`
  margin-top: 1rem;
  font-style: italic;
`;

const Checkbox = styled.input`
  margin-right: 0.5rem;
`;
const Input = styled.input`
  padding: 0.5rem;
  font-size: 1rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  margin-left: 0.25rem;
  margin-top: 0.25rem;
`;
const InputName = styled(Input)`
  min-width: 94%;
  `;
const Group = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 0.5rem;
`;
const LevelInfo = styled.div`
  margin-top: 1rem;
  border-top: 1px solid #eee;
  padding-top: 1rem;
`;
