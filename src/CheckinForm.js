import React, { useState, useEffect } from "react";
import styled from "styled-components";
import NewAwards from "./components/NewAwards";
import Rating from "./components/Rating";
import SorteAutocomplete from "./components/SorteAutocomplete";
import ChallengesAwarded from "./components/ChallengesAwarded";

const CheckinForm = ({ shopId, shopName, userId, showCheckinForm, setShowCheckinForm, checkinId = null, onSuccess, setShowPriceForm, shop }) => {
    const [type, setType] = useState("Kugel");
    const [sorten, setSorten] = useState([{ name: "", bewertung: "" }]);
    const [showSortenBewertung, setShowSortenBewertung] = useState(false);
    const [geschmackbewertung, setGeschmackbewertung] = useState(null);
    const [waffelbewertung, setWaffelbewertung] = useState(null);
    const [größenbewertung, setGrößenbewertung] = useState(null);
    const [preisleistungsbewertung, setPreisleistungsbewertung] = useState(null);
    const [kommentar, setKommentar] = useState("");
    const [anreise, setAnreise] = useState("");
    const [bilder, setBilder] = useState([]); // [{ file, previewUrl, beschreibung }]
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [awards, setAwards] = useState([]);
    const [levelUpInfo, setLevelUpInfo] = useState(null);
    const [challenges, setChallenges] = useState([]);
    const [isAllowed, setIsAllowed] = useState(true);
    const [alleSorten, setAlleSorten] = useState([]);
    const [preisfrage, setPreisfrage] = useState(false);
    const apiUrl = process.env.REACT_APP_API_BASE_URL;

    const getUserLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) return reject("Geolocation nicht unterstützt.");
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
                (err) => reject(err.message)
            );
        });
    };

    const askForPriceUpdate = (preise) => {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Helper: prüft, ob ein Eintrag null ist oder dessen letztes_update zu alt ist
        const isNullOrTooOld = (eintrag) => {
            if (!eintrag) return true;
            const updateDate = new Date(eintrag.letztes_update);
            return isNaN(updateDate.getTime()) || updateDate < sevenDaysAgo;
        };

        return isNullOrTooOld(preise.kugel) && isNullOrTooOld(preise.softeis);
    };

    useEffect(() => {
        const fetchCheckinData = async () => {
            try {
                const response = await fetch(`${apiUrl}/checkin/get_checkin.php?checkin_id=${checkinId}`);
                const checkin = await response.json();

                if (checkin.error) {
                    setMessage(checkin.error);
                    return;
                }

                if (Number(checkin.nutzer_id) !== Number(userId)) {
                    setMessage("You aren't allowed to edit this checkin!");
                    setIsAllowed(false);
                    return;
                }

                setType(checkin.typ);
                setGeschmackbewertung(checkin.geschmackbewertung);
                setWaffelbewertung(checkin.waffelbewertung);
                setGrößenbewertung(checkin.größenbewertung);
                setPreisleistungsbewertung(checkin.preisleistungsbewertung);
                setKommentar(checkin.kommentar);
                setAnreise(checkin.anreise || "");
                setBilder(checkin.bilder.map(b => ({
                    id: b.id,
                    url: `https://ice-app.de/${b.url}`,
                    beschreibung: b.beschreibung || "",
                    isExisting: true
                })));
                setSorten(checkin.eissorten.map(sorte => ({ name: sorte.sortenname, bewertung: sorte.bewertung })));
            } catch (error) {
                setMessage(`Ein Fehler ist aufgetreten: ${error}`);
            }
        };

        if (checkinId) {
            setShowSortenBewertung(true);
            fetchCheckinData();
        }
        fetch(`${apiUrl}/checkin/sorten.php`)
            .then((res) => res.json())
            .then((data) => {
                setAlleSorten(data);
            })
            .catch((error) => {
                console.error("Fehler beim Laden der Sorten:", error);
            });
    }, [checkinId, userId, apiUrl]);

    const handleSortenChange = (index, field, value) => {
        const updated = [...sorten];
        updated[index][field] = value;
        setSorten(updated);
    };

    const addSorte = () => setSorten([...sorten, { name: "", bewertung: "" }]);
    const removeSorte = (index) => {
        setSorten(sorten.filter((_, i) => i !== index));
    };

    const submit = async (e) => {
        e.preventDefault();

        if (submitted) return; // verhindert mehrfaches Absenden
        setSubmitted(true);    // sofort blockieren

        try {
            const formData = new FormData();
            formData.append("userId", userId);
            formData.append("shopId", shopId);
            formData.append("type", type);
            formData.append("geschmackbewertung", geschmackbewertung);
            formData.append("waffelbewertung", waffelbewertung);
            formData.append("größenbewertung", größenbewertung);
            formData.append("preisleistungsbewertung", preisleistungsbewertung);
            formData.append("kommentar", kommentar);
            formData.append("sorten", JSON.stringify(sorten));
            formData.append("anreise", anreise);
            bilder.forEach((bild, index) => {
                if (!bild.isExisting) {
                    formData.append(`bilder[]`, bild.file);
                    formData.append(`beschreibungen[]`, bild.beschreibung);
                }
            });
            formData.append("bestehende_bilder", JSON.stringify(
                bilder.filter(b => b.isExisting).map(b => ({
                    id: b.id,
                    beschreibung: b.beschreibung
                }))
            ));
            if (checkinId) formData.append("checkin_id", checkinId);

            try {
                const location = await getUserLocation();
                formData.append("lat", location.lat);
                formData.append("lon", location.lon);
            } catch (e) {
                console.warn("Kein Standort verfügbar, Checkin wird ohne Vor-Ort-Bonus gespeichert.");
            }

            const response = await fetch(
                checkinId
                    ? `${apiUrl}/checkin/update_checkin.php`
                    : `${apiUrl}/checkin/checkin_upload.php`,
                {
                    method: "POST",
                    body: formData
                }
            );

            const data = await response.json();
            if (data.status === "success") {
                if (checkinId) {
                    setMessage("Checkin erfolgreich aktualisiert!");
                } else {
                    setMessage("Checkin erfolgreich gespeichert!");
                }

                if (onSuccess) onSuccess();
                console.log("Server-Antwort:", data);
                console.log((data.completed_challenge !== null));
                if (data.level_up || (data.new_awards && data.new_awards.length > 0) || (data.completed_challenge !== null)) {
                    if (data.level_up) {
                        setLevelUpInfo({
                            level: data.new_level,
                            level_name: data.level_name,
                        });
                    }
                    if (data.new_awards?.length > 0) {
                        setAwards(data.new_awards);
                    }
                    if (data.completed_challenge !== null) {
                        console.log("Abgeschlossene Challenges:", data.completed_challenge);
                        setChallenges(data.completed_challenge);
                    }

                    if (shop && askForPriceUpdate(shop.preise)) {
                        setPreisfrage(true);
                    }

                } else {
                    if (shop && askForPriceUpdate(shop.preise)) {
                        setPreisfrage(true);
                    } else {
                        setTimeout(() => {
                            setShowCheckinForm(false);
                        }, 2000);
                    }
                }
            } else {
                setMessage(`Fehler: ${data.message}`);
            }
        } catch (error) {
            setMessage(`Ein Fehler ist aufgetreten: ${error}`);
            setSubmitted(false); // erneutes Absenden erlauben
        }
    };

    const handleDeleteClick = async () => {
        const confirmDelete = window.confirm("Möchtest du diesen Check-in wirklich löschen? Das Löschen kann nicht rückgängig gemacht werden.");
        if (!confirmDelete) return;

        try {
            const response = await fetch(`${apiUrl}/checkin/delete_checkin.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: checkinId,
                    nutzer_id: userId,
                }),
            });

            const result = await response.json();

            if (result.status === "success") {
                if (onSuccess) onSuccess();
                setSubmitted(true);
                setMessage("Checkin erfolgreich gelöscht!");
                setTimeout(() => {
                    setShowCheckinForm(false);
                }, 2000);

            } else {
                setMessage("Fehler beim Löschen: " + result.message);
            }
        } catch (error) {
            console.error("Fehler beim Löschen:", error);
            alert("Ein unbekannter Fehler ist aufgetreten.");
        }
    };

    const handleBildUpload = (e) => {
        const files = Array.from(e.target.files);
        const neueBilder = files.map(file => ({
            file,
            previewUrl: URL.createObjectURL(file),
            beschreibung: ""
        }));
        setBilder(prev => [...prev, ...neueBilder]);
    };

    const updateBildBeschreibung = (index, value) => {
        const updated = [...bilder];
        updated[index].beschreibung = value;
        setBilder(updated);
    };

    const removeBild = (index) => {
        const updated = [...bilder];
        updated.splice(index, 1);
        setBilder(updated);
    };

    const openSubmitPriceForm = () => {
        setShowCheckinForm(false);
        setShowPriceForm(true);
    };

    const confirmPrice = async () => {
        try {
            const response = await fetch(`${apiUrl}/submitPrice.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    shopId: shop.eisdiele.id,
                    userId: userId,
                    kugelPreis: shop.preise?.kugel?.preis ? shop.preise.kugel.preis : null,
                    additionalInfoKugelPreis: shop.preise?.kugel?.beschreibung ? shop.preise.kugel.beschreibung : null,
                    softeisPreis: shop.preise?.softeis?.preis ? shop.preise.softeis.preis : null,
                    additionalInfoSofteisPreis: shop.preise?.softeis?.beschreibung ? shop.preise.softeis.beschreibung : null
                })
            });
            const data = await response.json();
            let localAwards = null;
            data.forEach(element => {
                if (element.typ) {
                    if (element.status === 'success') {
                        onSuccess();
                        setSubmitted(true);
                        setMessage('Preis erfolgreich gemeldet!');
                    } else {
                        setMessage(`Fehler bei Meldung von Preis: ${element.message}`);
                        return;
                    }
                } else if (element.new_awards) {
                    setAwards(element.new_awards);
                    localAwards = element.new_awards;
                }
            });
            if (localAwards && localAwards.length !== 0) {
                console.log("Neue Auszeichnungen:", localAwards);
            } else {
                setTimeout(() => {
                    setShowCheckinForm(false);
                }, 2000);
            }
        } catch (error) {

        }
    }

    return (showCheckinForm ? (
        <Overlay>
            <Modal>
                <CloseButton onClick={() => setShowCheckinForm(false)}>×</CloseButton>
                {isAllowed && (<>
                    {!submitted && (<Form onSubmit={submit}>
                        <Heading>Eis-Checkin für {shopName} {checkinId && ("bearbeiten")}</Heading>
                        <Section>
                            <Label>Eistyp</Label>
                            <Select value={type} onChange={(e) => setType(e.target.value)}>
                                <option value="Kugel">Kugel</option>
                                <option value="Softeis">Softeis</option>
                                <option value="Eisbecher">Eisbecher</option>
                            </Select>
                        </Section>

                        <Section>
                            <Label>Sorten</Label>
                            {sorten.map((sorte, index) => (
                                <Row key={index}>
                                    <SorteAutocomplete
                                        value={sorte.name}
                                        onChange={(val) => handleSortenChange(index, "name", val)}
                                        placeholder="Sortenname"
                                        alleSorten={alleSorten[type] || []}
                                    />
                                    {showSortenBewertung && (<>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            min="1.0"
                                            max="5.0"
                                            value={sorte.bewertung}
                                            placeholder="Bewertung"
                                            onChange={(e) => handleSortenChange(index, "bewertung", e.target.value)}
                                            style={{ width: "100px" }}
                                        />
                                        <Rating stars={sorte.bewertung} onRatingSelect={(value) => handleSortenChange(index, "bewertung", value.toFixed(1))} />
                                    </>
                                    )}
                                    <RemoveButton type="button" onClick={() => removeSorte(index)}>✕</RemoveButton>
                                </Row>
                            ))}
                            <AddButton type="button" onClick={addSorte}>+ Sorte hinzufügen</AddButton>
                            <div style={{ marginTop: "0.5rem" }}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={showSortenBewertung}
                                        onChange={() => setShowSortenBewertung(!showSortenBewertung)}
                                    /> Sorten einzeln bewerten
                                </label>
                            </div>
                        </Section>

                        <Table>
                            <colgroup>
                                <StyledCol1 />
                                <StyledCol2 />
                                <StyledCol3 />
                            </colgroup>
                            <tbody>
                                <tr>
                                    <td><Label>Bewertung Geschmack:</Label></td>
                                    <td>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            min="1.0"
                                            max="5.0"
                                            placeholder="1.0 - 5.0"
                                            value={geschmackbewertung}
                                            onChange={(e) => setGeschmackbewertung(e.target.value)}
                                        />
                                    </td>
                                    <td><Rating stars={geschmackbewertung} onRatingSelect={(value) => setGeschmackbewertung(value.toFixed(1))} /></td>
                                </tr>
                                <tr style={{ display: type === "Kugel" ? "table-row" : "none" }}>
                                    <td><Label>Bewertung Größe:</Label></td>
                                    <td>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            min="1.0"
                                            max="5.0"
                                            placeholder="1.0 - 5.0"
                                            value={größenbewertung}
                                            onChange={(e) => setGrößenbewertung(e.target.value)}
                                        />
                                    </td>
                                    <td><Rating stars={größenbewertung} onRatingSelect={(value) => setGrößenbewertung(value.toFixed(1))} /></td>
                                </tr>
                                <tr style={{ display: type !== "Kugel" ? "table-row" : "none" }}>
                                    <td><Label>Preis-Leistungs-Verhältnis:</Label></td>
                                    <td>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            min="1.0"
                                            max="5.0"
                                            placeholder="1.0 - 5.0"
                                            value={preisleistungsbewertung}
                                            onChange={(e) => setPreisleistungsbewertung(e.target.value)}
                                        />
                                    </td>
                                    <td><Rating stars={preisleistungsbewertung} onRatingSelect={(value) => setPreisleistungsbewertung(value.toFixed(1))} /></td>
                                </tr>
                                {type !== "Eisbecher" && (<tr>
                                    <td><Label>Bewertung Waffel:</Label></td>
                                    <td>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            min="1.0"
                                            max="5.0"
                                            placeholder="1.0 - 5.0"
                                            value={waffelbewertung}
                                            onChange={(e) => setWaffelbewertung(e.target.value)}
                                        />
                                    </td>
                                    <td><Rating stars={waffelbewertung} onRatingSelect={(value) => setWaffelbewertung(value.toFixed(1))} /></td>
                                </tr>)}
                            </tbody>
                        </Table>

                        <Section>
                            <Label>Wie bist du zur Eisdiele gekommen?</Label>
                            <Select value={anreise} onChange={(e) => setAnreise(e.target.value)}>
                                <option value="">Bitte wählen</option>
                                <option value="Fahrrad">Fahrrad</option>
                                <option value="Motorrad">Motorrad</option>
                                <option value="Zu Fuß">Zu Fuß</option>
                                <option value="Auto">Auto</option>
                                <option value="Bus / Bahn">Bus / Bahn</option>
                                <option value="Sonstiges">Sonstiges</option>
                            </Select>
                        </Section>

                        <Section>
                            <Label>Kommentar</Label>
                            <Textarea
                                rows="5"
                                value={kommentar}
                                placeholder="Beschreibe wie dein Eis geschmeckt hat. Was hat dich überzeugt, wo ist Verbesserungspotential?"
                                onChange={(e) => setKommentar(e.target.value)}
                            />
                        </Section>
                        <Section>
                            <Label>Bilder hochladen</Label>
                            <Input type="file" accept="image/*" multiple onChange={handleBildUpload} />
                            <BilderContainer>
                                {bilder.map((bild, index) => (
                                    <div key={index}>
                                        <BildVorschau
                                            src={bild.previewUrl || bild.url}
                                            alt={`Bild ${index + 1}`}
                                        />
                                        <Input
                                            type="text"
                                            placeholder="Beschreibung eingeben (optional)"
                                            value={bild.beschreibung}
                                            onChange={(e) => updateBildBeschreibung(index, e.target.value)}
                                            style={{ margin: "0.5rem 0", width: "90%" }}
                                        />
                                        <DeleteButton type="button" onClick={() => removeBild(index)}>
                                            Bild entfernen
                                        </DeleteButton>
                                    </div>
                                ))}
                            </BilderContainer>
                        </Section>
                        <ButtonGroup>
                            <Button type="submit" disabled={submitted}>{checkinId ? "Änderungen speichern" : "Check-in"}</Button>
                            <Button type="button" onClick={() => setShowCheckinForm(false)}>Abbrechen</Button>
                            {checkinId && (<><br />
                                <DeleteButton type="button" onClick={handleDeleteClick} >
                                    Check-in löschen
                                </DeleteButton></>
                            )}
                        </ButtonGroup>
                    </Form>)}
                </>)}
                <Message>{message}</Message>
                {preisfrage && (
                    <>
                        <Text>Stimmt der Preis von <strong>{shop.eisdiele.name}</strong> noch?</Text>
                        <p>
                            Kugelpreis: <strong>{shop.preise?.kugel?.preis ?? "keine Meldung"} €</strong><br />
                            Softeispreis: <strong>{shop.preise?.softeis?.preis ?? "keine Meldung"} €</strong>
                        </p>
                        <ButtonGroup>
                            {(shop.preise?.kugel?.preis || shop.preise?.softeis?.preis) && (
                                <SubmitButton onClick={confirmPrice}>Stimmt noch</SubmitButton>)}
                            <SubmitButton onClick={() => openSubmitPriceForm()}>Änderung vorschlagen</SubmitButton>
                            <SubmitButton onClick={() => setShowCheckinForm(false)}>Schließen</SubmitButton>
                        </ButtonGroup>
                    </>
                )}
                {levelUpInfo && (
                    <LevelInfo>
                        <h2>🎉 Level-Up!</h2>
                        <p>Du hast <strong>Level {levelUpInfo.level}</strong> erreicht!</p>
                        <p><em>{levelUpInfo.level_name}</em></p>
                    </LevelInfo>
                )}
                <NewAwards awards={awards} />
                <ChallengesAwarded challenge={challenges} />
            </Modal>
        </Overlay>) : null
    );
};

export default CheckinForm;

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

const Form = styled.form`
`;

const Section = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  font-weight: bold;
  margin-bottom: 0.4rem;
`;

const Input = styled.input`
  width: 95%;
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #ccc;
`;

const Select = styled.select`
  width: 95%;
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #ccc;
`;

const Textarea = styled.textarea`
  width: 95%;
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #ccc;
`;

const Button = styled.button`
  background: #ffb522;
  color: white;
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: bold;
  cursor: pointer;

  &:hover {
    background: #ffcb4c;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const AddButton = styled.button`
  background: #ffb522;
  color: white;
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 0.4rem;
  margin-top: 0.5rem;
  cursor: pointer;

  &:hover {
    background: #ffcb4c;
  }
`;

const RemoveButton = styled.button`
  background: transparent;
  border: none;
  color: red;
  font-size: 1.2rem;
  cursor: pointer;
`;

const Row = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  align-items: center;
`;

const Message = styled.p`
  margin-top: 1rem;
  font-style: italic;
`;

const Table = styled.table`
  border-spacing: 0;
  margin-bottom: 1rem;

  td {
    padding: 0.1rem;
    vertical-align: middle;
  }
  td:nth-child(3) {
    padding-left: 2rem;
  }
`;

const StyledCol1 = styled.col`
  width: 50%;
`;

const StyledCol2 = styled.col`
  width: 20%;
`;

const StyledCol3 = styled.col`
  width: 30%;
  padding-left: 1.5rem;
`;

const BilderContainer = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 1rem;
  padding: 0.5rem 0;

  /* Optional für schöneres Scrollverhalten */
  scroll-snap-type: x mandatory;

  & > div {
    flex: 0 0 auto;
    scroll-snap-align: start;
    border: 1px solid #ccc;
    padding: 0.5rem;
    border-radius: 8px;
    background: white;
    min-width: 180px;
    max-width: 220px;
  }
`;

const BildVorschau = styled.img`
  max-height: 120px;
  width: auto;
  display: block;
  margin: 0 auto;
`;


const DeleteButton = styled.button`
  background: #f44336;
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    background: #d32f2f;
  }
`;

const Text = styled.p`
    font-size: 1.1rem;
    margin-top: 1rem;
`;

const SubmitButton = styled.button`
    background-color: #ffb522;
    color: white;
    padding: 6px 12px;
    margin: 0px 3px 0px 3px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
`;

const LevelInfo = styled.div`
  margin-top: 1rem;
  border-top: 1px solid #eee;
  padding-top: 1rem;
`;