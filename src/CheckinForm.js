import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import {
    Overlay as SharedOverlay,
    Modal as SharedModal,
    CloseButton as SharedCloseButton,
    Heading as SharedHeading,
    Form as SharedForm,
    Section as SharedSection,
    Label as SharedLabel,
    Input as SharedInput,
    Select as SharedSelect,
    Textarea as SharedTextarea,
    Button as SharedButton,
    SubmitButton as SharedSubmitButton,
    ButtonGroup as SharedButtonGroup,
    BilderContainer as SharedBilderContainer,
    BildVorschau as SharedBildVorschau,
    DeleteButton as SharedDeleteButton,
    Message as SharedMessage,
    LevelInfo as SharedLevelInfo,
} from './styles/SharedStyles';
import NewAwards from "./components/NewAwards";
import Rating from "./components/Rating";
import SorteAutocomplete from "./components/SorteAutocomplete";
import ChallengesAwarded from "./components/ChallengesAwarded";
import UserMentionMultiSelect from "./components/UserMentionField";
import ImageChooserModal from "./components/ImageChooserModal";
import { compressImageFile as sharedCompressImageFile, isMobileDevice as sharedIsMobileDevice, MAX_IMAGES as SHARED_MAX_IMAGES } from "./utils/imageUtils";

const CheckinForm = ({ shopId, shopName, userId, showCheckinForm, setShowCheckinForm, checkinId = null, onSuccess, setShowPriceForm, shop, referencedCheckinId }) => {
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
    const [mentionedUsers, setMentionedUsers] = useState([]);
    const [referencedCheckin, setReferencedCheckin] = useState(null);
    const apiUrl = process.env.REACT_APP_API_BASE_URL;
    const [location, setLocation] = useState(null);
    const cameraInputRef = useRef(null);
    const galleryInputRef = useRef(null);

    const MAX_IMAGES = SHARED_MAX_IMAGES;
    const [showImageChooser, setShowImageChooser] = useState(false);

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
        if (referencedCheckinId) {
            fetch(`${apiUrl}/checkin/get_checkin.php?checkin_id=${referencedCheckinId}`)
                .then(res => res.json())
                .then(data => {
                    if (!data.error) {
                        setReferencedCheckin(data);
                    }
                })
                .catch(err => console.error("Fehler beim Laden des Referenz-Checkins:", err));
        }
    }, [referencedCheckinId, apiUrl]);

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
                if (checkin.preisleistungsbewertung == null && checkin.größenbewertung != null) {
                    setPreisleistungsbewertung(checkin.größenbewertung);
                } else {
                    setPreisleistungsbewertung(checkin.preisleistungsbewertung);
                }
                setKommentar(checkin.kommentar);
                setAnreise(checkin.anreise || "");
                setBilder(checkin.bilder.map(b => ({
                    id: b.id,
                    url: `https://ice-app.de/${b.url}`,
                    beschreibung: b.beschreibung || "",
                    isExisting: true
                })));
                setSorten(checkin.eissorten.map(sorte => ({ name: sorte.sortenname, bewertung: sorte.bewertung })));
            } catch (err) {
                console.error("Fehler beim Laden des Checkins:", err);
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
            formData.append("mentionedUsers", JSON.stringify(mentionedUsers.map(u => u.id)));
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
            if (referencedCheckinId) formData.append("referencedCheckinId", referencedCheckinId);
            if (referencedCheckin && referencedCheckin.group_id !== null) formData.append("group_id", referencedCheckin.group_id);
            if (referencedCheckin && referencedCheckin.datum) formData.append("datum", referencedCheckin.datum);
            if (location) {
                formData.append("lat", location.lat);
                formData.append("lon", location.lon);
            } else {
                console.info("Kein Standort, Checkin ohne Bonus.");
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
            // Skip duplicates by name+size
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
        if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
        setBilder(updated);
    };

    const handleAddImagesClick = () => {
        const mobile = sharedIsMobileDevice();
        if (!mobile) {
            if (galleryInputRef.current) galleryInputRef.current.click();
            return;
        }
        // show modal on mobile
        setShowImageChooser(true);
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
                                            style={{ width: "70%" }}
                                        />
                                    </td>
                                    <td><Rating stars={geschmackbewertung} onRatingSelect={(value) => setGeschmackbewertung(value.toFixed(1))} /></td>
                                </tr>
                                <tr>
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
                                            style={{ width: "70%" }}
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
                                            style={{ width: "70%" }}
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
                            {/* Zwei versteckte File-Inputs: Kamera (capture) und Galerie (kein capture). */}
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
                            {/* Ein Button öffnet eine Auswahl (Kamera/Galerie). Auf Mobilgeräten
                                zeigt sich die entsprechende Option; auf Desktop eine JS-Prompt zur Auswahl. */}
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <Button type="button" onClick={handleAddImagesClick}>Bilder hinzufügen</Button>
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
                        {!referencedCheckin ?
                            (<Section>
                                <Label>Du warst mit jemanden anderen Eis essen? Erwähne ihn und lade ihn ein sein Checkin zu teilen!</Label>
                                <UserMentionMultiSelect onChange={setMentionedUsers} />
                            </Section>) :
                            (<Section>
                                <p style={{ fontStyle: "italic", color: "#666" }}>
                                    Dieser Check-in wird mit <strong>{referencedCheckin.nutzer_name}'s</strong> Check-in vom {referencedCheckin.datum} verknüpft.
                                </p>
                            </Section>)
                        }

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
// Re-export some shared styled names for backwards compatibility in this file
const Overlay = SharedOverlay;
const Modal = SharedModal;
const CloseButton = SharedCloseButton;
const Heading = SharedHeading;
const Form = SharedForm;
const Section = SharedSection;
const Label = SharedLabel;
const Input = SharedInput;
const Select = SharedSelect;
const Textarea = SharedTextarea;
const Button = SharedButton;
const ButtonGroup = SharedButtonGroup;
const BilderContainer = SharedBilderContainer;
const BildVorschau = SharedBildVorschau;
const DeleteButton = SharedDeleteButton;
const Message = SharedMessage;
const LevelInfo = SharedLevelInfo;

// map shared SubmitButton
const SubmitButton = SharedSubmitButton;

// Small local helpers that existed previously and are referenced in JSX
const Row = styled.div`
    display: flex;
    gap: 1rem;
    align-items: center;
    padding-bottom: 0.2rem;
`;

const RemoveButton = styled.button`
    background: transparent;
    border: none;
    color: #d9534f;
    font-size: 1.2rem;
    cursor: pointer;
`;

const AddButton = styled.button`
    background: #ffb522;
    color: white;
    border: none;
    padding: 0.4rem 0.6rem;
    border-radius: 6px;
    cursor: pointer;
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
`;

const StyledCol1 = styled.col`
    width: 50%;
`;
const StyledCol2 = styled.col`
    width: 20%;
    align-items: left;
`;
const StyledCol3 = styled.col`
    width: 30%;
    padding-left: 1.5rem;
    text-align: right;
    align-items: right;
    align-content: right;
`;

const Text = styled.p``;