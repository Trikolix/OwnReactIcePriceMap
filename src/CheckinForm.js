import React, { useState, useEffect } from "react";
import styled from "styled-components";
import NewAwards from "./components/NewAwards";
import Rating from "./components/Rating";
import { Rat } from "lucide-react";

const CheckinForm = ({ shopId, shopName, userId, showCheckinForm, setShowCheckinForm, checkinId = null, onSuccess }) => {
    const [type, setType] = useState("Kugel");
    const [sorten, setSorten] = useState([{ name: "", bewertung: "" }]);
    const [showSortenBewertung, setShowSortenBewertung] = useState(false);
    const [geschmackbewertung, setGeschmackbewertung] = useState(null);
    const [waffelbewertung, setWaffelbewertung] = useState(null);
    const [größenbewertung, setGrößenbewertung] = useState(null);
    const [preisleistungsbewertung, setPreisleistungsbewertung] = useState(null);
    const [kommentar, setKommentar] = useState("");
    const [bilder, setBilder] = useState([]); // [{ file, previewUrl, beschreibung }]
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [awards, setAwards] = useState([]);
    const [isAllowed, setIsAllowed] = useState(true);
    const apiUrl = process.env.REACT_APP_API_BASE_URL;

    useEffect(() => {
        const fetchCheckinData = async () => {
            try {
                const response = await fetch(`${apiUrl}/checkin/get_checkin.php?checkin_id=${checkinId}`);
                const checkin = await response.json();

                if (checkin.error) {
                    setMessage(checkin.error);
                    return;
                }

                if (parseInt(checkin.nutzer_id, 10) !== parseInt(userId, 10)) {
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
                setSubmitted(true);
                if (onSuccess) onSuccess();
                if (data.new_awards && data.new_awards.length > 0) {
                    setAwards(data.new_awards);
                } else {
                    setTimeout(() => {
                        setShowCheckinForm(false);
                    }, 2000);
                }
            } else {
                setMessage(`Fehler: ${data.message}`);
            }
        } catch (error) {
            setMessage(`Ein Fehler ist aufgetreten: ${error}`);
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
        const bild = bilder[index];
        const updated = [...bilder];
        updated.splice(index, 1);
        setBilder(updated);
    };

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
                                    <Input
                                        type="text"
                                        placeholder="Sortenname"
                                        value={sorte.name}
                                        onChange={(e) => handleSortenChange(index, "name", e.target.value)}
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
                            <Button type="submit">{checkinId ? "Änderungen speichern" : "Check-in"}</Button>
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
                <NewAwards awards={awards} />
            </Modal>
        </Overlay>) : null
    );
};

export default CheckinForm;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
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