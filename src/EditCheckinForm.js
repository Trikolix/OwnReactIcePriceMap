import React, { useState, useEffect } from "react";
import styled from "styled-components";
import NewAwards from "./components/NewAwards";
import { useUser } from './context/UserContext';

const EditCheckinForm = ({ checkinId, shopName, showCheckinForm, setShowCheckinForm }) => {
    const [type, setType] = useState("Kugel");
    const [sorten, setSorten] = useState([{ name: "", bewertung: "" }]);
    const [showSortenBewertung, setShowSortenBewertung] = useState(true);
    const [geschmackbewertung, setGeschmackbewertung] = useState("");
    const [waffelbewertung, setWaffelbewertung] = useState("");
    const [größenbewertung, setGrößenbewertung] = useState("");
    const [kommentar, setKommentar] = useState("");
    const [bild, setBild] = useState(null);
    const [currentBildUrl, setCurrentBildUrl] = useState(null);
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [awards, setAwards] = useState([]);
    const [eisdielenId, seteisdielenId] = useState(null);
    const [isAllowed, setIsAllowed] = useState(true);
    const { userId } = useUser();

    useEffect(() => {
        const fetchCheckinData = async () => {
            try {
                const response = await fetch(`https://ice-app.de/backend/get_checkin.php?checkin_id=${checkinId}`);
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
                seteisdielenId(checkin.eisdiele_id);
                setGeschmackbewertung(checkin.geschmackbewertung);
                setWaffelbewertung(checkin.waffelbewertung);
                setGrößenbewertung(checkin.größenbewertung);
                setKommentar(checkin.kommentar);
                setCurrentBildUrl(checkin.bild_url);
                setSorten(data.sorten.map(sorte => ({ name: sorte.sortenname, bewertung: sorte.bewertung })));
            } catch (error) {
                setMessage(`Ein Fehler ist aufgetreten: ${error}`);
            }
        };

        if (checkinId) {
            fetchCheckinData();
        }
    }, [checkinId, userId]);

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
            formData.append("checkin_id", checkinId);
            formData.append("userId", userId);
            formData.append("shopId", eisdielenId);
            formData.append("type", type);
            formData.append("geschmackbewertung", geschmackbewertung);
            formData.append("waffelbewertung", waffelbewertung);
            formData.append("größenbewertung", größenbewertung);
            formData.append("kommentar", kommentar);
            if (bild) {
                formData.append("bild", bild);
            }
            formData.append("sorten", JSON.stringify(sorten));

            const response = await fetch("https://ice-app.de/backend/update_checkin.php", {
                method: "POST",
                body: formData
            });

            const data = await response.json();
            if (data.status === "success") {
                setMessage("Bewertung erfolgreich aktualisiert!");
                setSubmitted(true);
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
                {isAllowed ? (
                    !submitted ? (
                        <Form onSubmit={submit}>
                            <Heading>Eis-Checkin für {shopName} bearbeiten</Heading>
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
                                    <tr>
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
                                    <tr>
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
                                    </tr>
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
                                <Label>Bild</Label>
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
                                <Button type="submit">Speichern</Button>
                            </ButtonGroup>
                        </Form>
                    ) : (
                        <Message>{message}</Message>
                    )
                ) : (
                    <Message>{message}</Message>
                )}
                <NewAwards awards={awards} />
            </Modal>
        </Overlay>
    ) : null);
};

export default EditCheckinForm;

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

const CurrentImage = styled.img`
  max-width: 100%;
  max-height: 200px;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
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
