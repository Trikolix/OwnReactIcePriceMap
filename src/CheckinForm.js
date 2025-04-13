import React, { useState } from "react";
import styled from "styled-components";

const CheckinForm = ({ shop, shopId, userId, onSubmit, setShowCheckinForm }) => {
    const [type, setType] = useState("Kugel");
    const [sorten, setSorten] = useState([{ name: "", bewertung: "" }]);
    const [showSortenBewertung, setShowSortenBewertung] = useState(false);
    const [gesamtbewertung, setGesamtbewertung] = useState(null);
    const [waffelbewertung, setWaffelbewertung] = useState(null);
    const [größenbewertung, setGrößenbewertung] = useState(null);
    const [kommentar, setKommentar] = useState("");
    const [bild, setBild] = useState(null);
    const [message, setMessage] = useState('');

    const handleSortenChange = (index, field, value) => {
        const updated = [...sorten];
        updated[index][field] = value;
        setSorten(updated);
    };

    const addSorte = () => setSorten([...sorten, { name: "", bewertung: "" }]);
    const removeSorte = (index) => {
        setSorten(sorten.filter((_, i) => i !== index));
    };

    const submit = async () => {
        try {
            const response = await fetch("https://ice-app.4lima.de/backend/checkin_upload.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userId,
                    shopId,
                    type,
                    sorten,
                    gesamtbewertung: parseFloat(gesamtbewertung),
                    waffelbewertung: parseFloat(waffelbewertung),
                    größenbewertung: parseFloat(größenbewertung),
                    kommentar,
                    bild
                })
            });
            const data = await response.json();
            console.log(data);
            if (data.status === "success") {
                setMessage("Bewertung erfolgreich gespeichert!");
            } else {
                setMessage(`Fehler: ${data.message}`);
            }
            setTimeout(() => {
                setMessage("");
                setShowCheckinForm(false);
            }, 2000);
        } catch (error) {
            setMessage("Ein Fehler ist aufgetreten.");
        }
    };

    return (
        <Overlay>
            <Modal>
                <CloseButton onClick={() => setShowCheckinForm(false)}>×</CloseButton>
                <Form onSubmit={submit}>
                    <Heading>Eis-Checkin für {shop.eisdiele.name}</Heading>
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

                    <Section>
                        <Label>Bewertung Geschmack</Label>
                        <Input
                            type="number"
                            step="0.1"
                            min="1.0"
                            max="5.0"
                            value={gesamtbewertung}
                            onChange={(e) => setGesamtbewertung(e.target.value)}
                        />
                    </Section>

                    <Section>
                        <Label>Bwertung Waffel</Label>
                        <Input
                            type="number"
                            step="0.1"
                            min="1.0"
                            max="5.0"
                            value={waffelbewertung}
                            onChange={(e) => setWaffelbewertung(e.target.value)}
                        />
                    </Section>

                    <Section>
                        <Label>Bewertung Größe</Label>
                        <Input
                            type="number"
                            step="0.1"
                            min="1.0"
                            max="5.0"
                            value={größenbewertung}
                            onChange={(e) => setGrößenbewertung(e.target.value)}
                        />
                    </Section>

                    <Section>
                        <Label>Kommentar</Label>
                        <Textarea
                            rows="3"
                            value={kommentar}
                            onChange={(e) => setKommentar(e.target.value)}
                        />
                    </Section>

                    <Section>
                        <Label>Bild hochladen</Label>
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setBild(e.target.files[0])}
                        />
                    </Section>

                    <Button type="submit">Check-in</Button>
                    <Message>{message}</Message>
                </Form>
            </Modal>
        </Overlay>
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
  z-index: 1000;
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

const Form = styled.form`
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-weight: bold;
  margin-bottom: 0.4rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #ccc;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #ccc;
`;

const Textarea = styled.textarea`
  width: 100%;
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