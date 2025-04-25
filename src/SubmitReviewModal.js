import { useState, useEffect } from "react";
import styled from "styled-components";

const SubmitReviewModal = ({ showForm, setShowForm, userId, shop, refreshShops, setShowPriceForm }) => {
    console.log(shop);
    const [geschmack, setGeschmack] = useState(null);
    const [kugelgroesse, setKugelgroesse] = useState(null);
    const [waffel, setWaffel] = useState(null);
    const [auswahl, setAuswahl] = useState(null);
    const [beschreibung, setBeschreibung] = useState("");
    const [message, setMessage] = useState("");
    const [attribute, setAttribute] = useState([]);
    const [selectedAttributes, setSelectedAttributes] = useState([]);
    const [neuesAttribut, setNeuesAttribut] = useState("");

    const [submitted, setSubmitted] = useState(false);
    const [preisfrage, setPreisfrage] = useState(false);

    useEffect(() => {
        const fetchReview = async () => {
            try {
                const response = await fetch(`https://ice-app.4lima.de/backend/getReview.php?userId=${userId}&shopId=${shop.eisdiele.id}`);
                const data = await response.json();
                setAttribute(data.allAttributes.filter(attr => !data.attributes || !data.attributes.includes(attr)));
                if (data.review) {
                    setGeschmack(data.review.geschmack);
                    setKugelgroesse(data.review.kugelgroesse);
                    setWaffel(data.review.waffel);
                    setAuswahl(data.review.auswahl);
                    setBeschreibung(data.review.beschreibung);
                    setSelectedAttributes(data.attributes);
                }
            } catch (error) {
                console.error("Fehler beim Abrufen der Bewertung", error);
            }
        };
        fetchReview();
    }, [userId, shop.eisdiele.id]);

    const submit = async () => {
        try {
            const response = await fetch("https://ice-app.4lima.de/backend/submitReview.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userId,
                    shopId: shop.eisdiele.id,
                    geschmack,
                    kugelgroesse,
                    waffel,
                    auswahl,
                    beschreibung,
                    selectedAttributes
                })
            });
            const data = await response.json();
            if (data.status === "success") {
                setMessage("Bewertung erfolgreich gespeichert!");
                refreshShops();
                setSubmitted(true);
                setTimeout(() => {
                    setPreisfrage(true);
                }, 1000);
            } else {
                setMessage(`Fehler: ${data.message}`);
            }
        } catch (error) {
            setMessage("Ein Fehler ist aufgetreten.");
        }
    };

    const handleAttributeSelect = (attr) => {
        setAttribute((prev) => prev.filter((a) => a !== attr));
        setSelectedAttributes((prev) => [...prev, attr]);
    };

    const handleAttributeRemove = (attr) => {
        setSelectedAttributes((prev) => prev.filter((a) => a !== attr));
        setAttribute((prev) => [...prev, attr]);
    };

    const handleNewAttribute = () => {
        if (neuesAttribut.trim()) {
            setSelectedAttributes([...selectedAttributes, neuesAttribut]);
            setNeuesAttribut("");
        }
    };

    const openSubmitPriceForm = () => {
        setShowForm(false);
        setShowPriceForm(true);
    };

    const confirmPrice = async () => {
        try {
            const response = await fetch('https://ice-app.4lima.de/backend/submitPrice.php', {
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
            data.forEach(element => {
                if (element.status === 'success') {
                    refreshShops();
                    setMessage('Preis erfolgreich bestätigt!');
                    setTimeout(() => {
                        setShowForm(false);
                    }, 1000);
                } else {
                    setMessage(`Fehler beim Bestätigen vom Preis: ${element.message}`);
                    return;
                }
            });
        } catch (error) {

        }
    }
    return showForm ? (
        <ModalOverlay>
            <ModalContent>
                <CloseButton onClick={() => setShowForm(false)}>x</CloseButton>
                {!submitted && (<>
                    <FormTitle>{shop.eisdiele.name} bewerten</FormTitle>

                    <GridForm>
                        <label>Geschmack:</label>
                        <Input type="number" min="1.0" max="5.0" step="0.1" value={geschmack || ''} onChange={(e) => setGeschmack(parseFloat(e.target.value))} />

                        <label>Kugelgröße:</label>
                        <Input type="number" min="1.0" max="5.0" step="0.1" value={kugelgroesse || ''} onChange={(e) => setKugelgroesse(parseFloat(e.target.value))} />

                        <label>Waffel:</label>
                        <Input type="number" min="1.0" max="5.0" step="0.1" value={waffel || ''} onChange={(e) => setWaffel(parseFloat(e.target.value))} />

                        <label>Auswahl:</label>
                        <Input type="number" min="1" step="1" value={auswahl || ''} onChange={(e) => setAuswahl(parseInt(e.target.value))} />
                    </GridForm>

                    <TextAreaGroup>
                        <label>Beschreibung:</label>
                        <TextArea rows="7" value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} />
                    </TextAreaGroup>

                    <AttributeSection>
                        <BoldText>Ausgewählte Attribute:</BoldText>
                        <FlexWrap>
                            {selectedAttributes.map((attr) => (
                                <SelectedAttr key={attr} onClick={() => handleAttributeRemove(attr)}>
                                    {attr} ×
                                </SelectedAttr>
                            ))}
                        </FlexWrap>
                        <BoldText>Verfügbare Attribute:</BoldText>
                        <FlexWrap>
                            {attribute.map((attr) => (
                                <AvailableAttr key={attr} onClick={() => handleAttributeSelect(attr)}>
                                    {attr}
                                </AvailableAttr>
                            ))}
                        </FlexWrap>
                        <AddAttributeRow>
                            <Input value={neuesAttribut} onChange={(e) => setNeuesAttribut(e.target.value)} placeholder="Neues Attribut" />
                            <SubmitButton onClick={handleNewAttribute}>Hinzufügen</SubmitButton>
                        </AddAttributeRow>
                    </AttributeSection>

                    <ButtonGroup>
                        <SubmitButton onClick={submit}>Einreichen</SubmitButton>
                    </ButtonGroup>
                </>)}
                {(submitted && !preisfrage) ? (
                    <Message>Vielen Dank für dein Review!</Message>
                ) : (<Message>{message}</Message>)}

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
                            <SubmitButton onClick={() => setShowForm(false)}>Schließen</SubmitButton>
                        </ButtonGroup>
                    </>
                )}
            </ModalContent>
        </ModalOverlay>
    ) : null;
};

export default SubmitReviewModal;

// --- Styled Components ---

const ModalOverlay = styled.div`
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
`;

const ModalContent = styled.div`
    background-color: #fff;
    padding: 1rem;
    border-radius: 16px;
    width: 100%;
    max-width: 450px;
    max-height: 100vh;
    overflow-y: auto;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    position: relative;
`;

const CloseButton = styled.button`
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    outline: none;
`;

const FormTitle = styled.h2`
    font-size: 1.5rem;
    margin-bottom: 1rem;
`;

const GridForm = styled.div`
    display: grid;
    grid-template-columns: 150px 1fr;
    gap: 8px 16px;
    margin-bottom: 1rem;
    align-items: center;
`;

const TextAreaGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 1rem;
`;

const Input = styled.input`
    border: 1px solid #e5e7eb;
    padding: 6px;
    border-radius: 4px;
    font-size: 1rem;
    width: 100%;
    box-sizing: border-box;
`;

const TextArea = styled.textarea`
    border: 1px solid #e5e7eb;
    padding: 6px;
    border-radius: 4px;
    font-size: 1rem;
    width: 100%;
    box-sizing: border-box;
`;

const SelectedAttr = styled.span`
    padding: 4px 12px;
    background-color: #ffb522;
    color: white;
    border-radius: 9999px;
    cursor: pointer;
    display: inline-block;
`;

const AvailableAttr = styled.span`
    padding: 4px 12px;
    background-color: #d1d5db;
    border-radius: 9999px;
    cursor: pointer;
    display: inline-block;
`;

const FlexWrap = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
`;

const AddAttributeRow = styled.div`
    display: flex;
    gap: 8px;
    margin-top: 8px;
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

const ButtonGroup = styled.div`
    margin-top: 1rem;
    text-align: center;
`;

const BoldText = styled.p`
    font-weight: 600;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
`;

const AttributeSection = styled.div`
    margin-bottom: 1rem;
`;

const Message = styled.p`
    margin-top: 1rem;
    text-align: center;
`;

const Text = styled.p`
    font-size: 1.1rem;
    margin-top: 1rem;
`;
