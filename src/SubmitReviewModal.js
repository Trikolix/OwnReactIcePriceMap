import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import NewAwards from "./components/NewAwards";
import ImageChooserModal from "./components/ImageChooserModal";
import { compressImageFile as sharedCompressImageFile, isMobileDevice as sharedIsMobileDevice, MAX_IMAGES as SHARED_MAX_IMAGES } from "./utils/imageUtils";

const SubmitReviewModal = ({ showForm, setShowForm, userId, shop, setShowPriceForm, onSuccess }) => {
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
    const [bilder, setBilder] = useState([]); // [{ file, previewUrl, beschreibung }]
    const [deletedBildIds, setDeletedBildIds] = useState([]);

    const cameraInputRef = useRef(null);
    const galleryInputRef = useRef(null);

    // Konfiguration via shared utils
    const MAX_IMAGES = SHARED_MAX_IMAGES;
    const [showImageChooser, setShowImageChooser] = useState(false);

    const [submitted, setSubmitted] = useState(false);
    const [preisfrage, setPreisfrage] = useState(false);
    const [showAllAttributes, setShowAllAttributes] = useState(false)
    const [awards, setAwards] = useState([]);
    const apiUrl = process.env.REACT_APP_API_BASE_URL;
    const [location, setLocation] = useState(null);

    // Läuft beim Laden der Seite automatisch
    useEffect(() => {
        let watchId;

        if (!navigator.geolocation) {
            console.warn("Geolocation not supported");
            return;
        }

        // Erstversuch: getCurrentPosition mit schnellem Timeout
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                });
            },
            (err) => {
                console.warn("Geolocation initial failed:", err);
            },
            { enableHighAccuracy: false, timeout: 5000 }
        );

        // Hintergrund: watchPosition läuft weiter, falls Nutzer später Freigabe gibt
        watchId = navigator.geolocation.watchPosition(
            (pos) => {
                setLocation({
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                });
            },
            (err) => {
                // optional: nur für Debug
                console.warn("watchPosition error:", err);
            },
            { enableHighAccuracy: false, maximumAge: 0 }
        );

        return () => {
            if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    useEffect(() => {
        const fetchReview = async () => {
            try {
                const response = await fetch(`${apiUrl}/review/getReview.php?userId=${userId}&shopId=${shop.eisdiele.id}`);
                const data = await response.json();
                setAttribute(data.allAttributes.filter(attr => !data.attributes || !data.attributes.includes(attr)));
                if (data.review) {
                    setGeschmack(data.review.geschmack);
                    setKugelgroesse(data.review.kugelgroesse);
                    setWaffel(data.review.waffel);
                    setAuswahl(data.review.auswahl);
                    setBeschreibung(data.review.beschreibung);
                    setSelectedAttributes(data.attributes);

                    setBilder(data.bilder.map(b => ({
                        id: b.id,
                        url: `https://ice-app.de/${b.url}`,
                        beschreibung: b.beschreibung || "",
                        isExisting: true
                    })));
                }
            } catch (error) {
                console.error("Fehler beim Abrufen der Bewertung", error);
            }
        };
        fetchReview();
    }, [userId, shop.eisdiele.id, apiUrl]);

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


    const submit = async () => {
        try {
            const formData = new FormData();
            formData.append("userId", userId);
            formData.append("shopId", shop.eisdiele.id);
            formData.append("geschmack", geschmack);
            formData.append("kugelgroesse", kugelgroesse);
            formData.append("waffel", waffel);
            formData.append("auswahl", auswahl);
            formData.append("beschreibung", beschreibung);
            selectedAttributes.forEach(attr => formData.append('selectedAttributes[]', attr));
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
            formData.append("deleted_bild_ids", JSON.stringify(deletedBildIds));

            if (location) {
                formData.append("lat", location.lat);
                formData.append("lon", location.lon);
            } else {
                console.info("Kein Standort, Bewertung ohne Standort gespeichert.");
            }

            const response = await fetch(`${apiUrl}/review/submitReview.php`,
                {
                    method: "POST",
                    body: formData
                }
            );
            const data = await response.json();
            if (data.status === "success") {
                setMessage("Bewertung erfolgreich gespeichert!");
                onSuccess && onSuccess();
                setSubmitted(true);
                setTimeout(() => {
                    if (askForPriceUpdate(shop.preise)) {
                        setPreisfrage(true);
                    } else {
                        setShowForm(false);
                    }
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
                    setShowForm(false);
                }, 2000);
            }
        } catch (error) {

        }
    }

    const handleAddImagesClick = () => {
        const mobile = sharedIsMobileDevice();
        if (!mobile) {
            if (galleryInputRef.current) galleryInputRef.current.click();
            return;
        }
        setShowImageChooser(true);
    };

    const handleBildUpload = async (e) => {
        const files = Array.from(e.target.files || []);

        // Enforce max images
        const currentCount = bilder.length;
        if (currentCount >= MAX_IMAGES) {
            alert(`Maximal ${MAX_IMAGES} Bilder erlaubt.`);
            return;
        }

        const availableSlots = MAX_IMAGES - currentCount;
        const toProcess = files.slice(0, availableSlots);

        const processed = [];
        for (const file of toProcess) {
            // Skip duplicates
            if (bilder.some(b => b.file?.name === file.name && b.file?.size === file.size)) continue;
            try {
                const compressed = await sharedCompressImageFile(file);
                const previewUrl = URL.createObjectURL(compressed);
                processed.push({ file: compressed, previewUrl, beschreibung: '' });
            } catch (err) {
                console.warn('Bildkompression fehlgeschlagen, benutze Original', err);
                const previewUrl = URL.createObjectURL(file);
                processed.push({ file, previewUrl, beschreibung: '' });
            }
        }

        if (processed.length > 0) {
            setBilder(prev => {
                const merged = [...prev, ...processed];
                return merged.slice(0, MAX_IMAGES);
            });
        }
    };

    const updateBildBeschreibung = (index, value) => {
        const updated = [...bilder];
        updated[index].beschreibung = value;
        setBilder(updated);
    };

    const removeBild = (index) => {
        const updated = [...bilder];
        const [removed] = updated.splice(index, 1);
        setBilder(updated);

        if (removed.isExisting && removed.id) {
            setDeletedBildIds(prev => [...prev, removed.id]);
        }
    };

    return showForm ? (
        <ModalOverlay>
            <ModalContent>
                <CloseButton onClick={() => setShowForm(false)}>x</CloseButton>
                {!submitted && (<>
                    <FormTitle>{shop.eisdiele.name} bewerten</FormTitle>

                    <GridForm>
                        <label>Auswahl:</label>
                        <Input type="number" min="1" step="1" value={auswahl || ''} placeholder="Anzahl Sorten" onChange={(e) => setAuswahl(parseInt(e.target.value))} />
                    </GridForm>

                    <TextAreaGroup>
                        <label>Bewertung:</label>
                        <TextArea rows="7" value={beschreibung} placeholder="Beschreibe wie du die Eisdiele im allgemeinen findest. Ambiente, Lage, Service etc. Für Geschmacksberichte gibt es die Check-in Funktion." onChange={(e) => setBeschreibung(e.target.value)} />
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
                            {(showAllAttributes ? attribute : attribute.slice(0, 5)).map((attr) => (
                                <AvailableAttr key={attr} onClick={() => handleAttributeSelect(attr)}>
                                    {attr}
                                </AvailableAttr>
                            ))}
                            {attribute.length > 5 && (
                                <AvailableAttr onClick={() => setShowAllAttributes(!showAllAttributes)}>
                                    {showAllAttributes ? "..." : "..."}
                                </AvailableAttr>
                            )}
                        </FlexWrap>
                        <AddAttributeRow>
                            <Input value={neuesAttribut} onChange={(e) => setNeuesAttribut(e.target.value)} placeholder="Neues Attribut" />
                            <SubmitButton onClick={handleNewAttribute}>Hinzufügen</SubmitButton>
                        </AddAttributeRow>
                    </AttributeSection>
                    <Section>
                        <Label>Bilder hochladen</Label>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            capture="environment"
                            style={{ display: 'none' }}
                            ref={cameraInputRef}
                            onChange={(e) => { handleBildUpload(e); e.target.value = ''; }}
                        />
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            style={{ display: 'none' }}
                            ref={galleryInputRef}
                            onChange={(e) => { handleBildUpload(e); e.target.value = ''; }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <SubmitButton type="button" onClick={handleAddImagesClick}>Bilder hinzufügen</SubmitButton>
                        </div>
                        {showImageChooser && (
                            <ImageChooserModal
                                onClose={() => setShowImageChooser(false)}
                                onChooseCamera={() => { if (cameraInputRef.current) cameraInputRef.current.click(); }}
                                onChooseGallery={() => { if (galleryInputRef.current) galleryInputRef.current.click(); }}
                            />
                        )}
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
                        <SubmitButton onClick={submit}>Einreichen</SubmitButton>
                    </ButtonGroup>
                </>)}
                {(submitted && !preisfrage) ? (
                    <Message>Vielen Dank für dein Review!</Message>
                ) : (<Message>{message}</Message>)}
                <NewAwards awards={awards} />

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
    height: 100dvh;
    width: 100vw;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1001;
`;

const ModalContent = styled.div`
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
    grid-template-columns: 30% 30% 30%;
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

const Section = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  font-weight: bold;
  margin-bottom: 0.4rem;
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