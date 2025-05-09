import React, { useState, useEffect } from "react";
import styled from "styled-components";
import NewAwards from "./components/NewAwards";

const CheckinForm = ({ shopId, shopName, userId, showCheckinForm, setShowCheckinForm, checkinId = null, onSuccess}) => {
    const [type, setType] = useState("Kugel");
    const [sorten, setSorten] = useState([{ name: "", bewertung: "" }]);
    const [showSortenBewertung, setShowSortenBewertung] = useState(false);
    const [geschmackbewertung, setGeschmackbewertung] = useState(null);
    const [waffelbewertung, setWaffelbewertung] = useState(null);
    const [größenbewertung, setGrößenbewertung] = useState(null);
    const [preisleistungsbewertung, setPreisleistungsbewertung] = useState(null);
    const [kommentar, setKommentar] = useState("");
    const [bild, setBild] = useState(null);
    const [currentBildUrl, setCurrentBildUrl] = useState(null);
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [awards, setAwards] = useState([]);
    const [isAllowed, setIsAllowed] = useState(true);
    const apiUrl = process.env.REACT_APP_API_BASE_URL;

    useEffect(() => {
            const fetchCheckinData = async () => {
                try {
                    const response = await fetch(`${apiUrl}/get_checkin.php?checkin_id=${checkinId}`);
                    const data = await response.json();
    
                    if (data.error) {
                        setMessage(data.error);
                        return;
                    }
    
                    if (parseInt(data.checkin.nutzer_id, 10) !== parseInt(userId, 10)) {
                        setMessage("You aren't allowed to edit this checkin!");
                        setIsAllowed(false);
                        return;
                    }
    
                    const checkin = data.checkin;
                    setType(checkin.typ);
                    setGeschmackbewertung(checkin.geschmackbewertung);
                    setWaffelbewertung(checkin.waffelbewertung);
                    setGrößenbewertung(checkin.größenbewertung);
                    setPreisleistungsbewertung(checkin.preisleistungsbewertung);
                    setKommentar(checkin.kommentar);
                    setCurrentBildUrl(checkin.bild_url);
                    setSorten(data.sorten.map(sorte => ({ name: sorte.sortenname, bewertung: sorte.bewertung })));
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
            formData.append("bild", bild);
            formData.append("sorten", JSON.stringify(sorten));
            if (checkinId) formData.append("checkin_id", checkinId);

            const response = await fetch(
                checkinId 
                    ? `${apiUrl}/update_checkin.php` 
                    : `${apiUrl}/checkin_upload.php`,
                {
                    method: "POST",
                    body: formData
                }
            );

            const data = await response.json();
            console.log(data);
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
                                {showSortenBewertung && (
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
                        <tbody>
                            <tr>
                                <td><Label>Bewertung Geschmack:</Label></td>
                                <td>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        min="1.0"
                                        max="5.0"
                                        value={geschmackbewertung}
                                        onChange={(e) => setGeschmackbewertung(e.target.value)}
                                    />
                                </td>
                            </tr>
                            <tr style={{ display: type === "Kugel" ? "table-row" : "none" }}>
                                <td><Label>Bewertung Größe:</Label></td>
                                <td>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        min="1.0"
                                        max="5.0"
                                        value={größenbewertung}
                                        onChange={(e) => setGrößenbewertung(e.target.value)}
                                    />
                                </td>
                            </tr>
                            <tr style={{ display: type !== "Kugel" ? "table-row" : "none" }}>
                                <td><Label>Preis-Leistungs-Verhältnis:</Label></td>
                                <td>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        min="1.0"
                                        max="5.0"
                                        value={preisleistungsbewertung}
                                        onChange={(e) => setPreisleistungsbewertung(e.target.value)}
                                    />
                                </td>
                            </tr>
                            {type !== "Eisbecher" && (<tr>
                                <td><Label>Bewertung Waffel:</Label></td>
                                <td>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        min="1.0"
                                        max="5.0"
                                        value={waffelbewertung}
                                        onChange={(e) => setWaffelbewertung(e.target.value)}
                                    />
                                </td>
                            </tr>)}
                        </tbody>
                    </Table>

                    <Section>
                        <Label>Kommentar</Label>
                        <Textarea
                            rows="5"
                            value={kommentar}
                            onChange={(e) => setKommentar(e.target.value)}
                        />
                    </Section>

                    <Section>
                        <Label>Bild hochladen</Label>
                        {currentBildUrl && (
                                    <CurrentImage src={`https://ice-app.de/${currentBildUrl}`} alt="Aktuelles Bild" />
                                )}
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setBild(e.target.files[0])}
                        />
                    </Section>
                    <ButtonGroup>
                        <Button type="submit">{checkinId ? "Änderungen speichern" : "Check-in"}</Button>
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
    vertical-align: top;
  }

  td:first-child {
    width: 70%;
  }

  td:last-child {
    width: 30%;
  }
`;

const CurrentImage = styled.img`
  max-width: 100%;
  max-height: 200px;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
`;