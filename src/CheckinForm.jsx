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
import { Bike, Car, Footprints, HelpCircle, IceCream, MapPin } from "lucide-react";

const TYPE_OPTIONS = [
    { value: "Kugel", label: "Kugeleis", description: "Einzelne Kugeln, auch im Becher", tone: "kugel", icon: IceCream },
    { value: "Softeis", label: "Softeis", description: "Gezapftes Softeis", tone: "softeis", icon: IceCream },
    { value: "Eisbecher", label: "Eisbecher", description: "Komponierter Eisbecher / Sundae", tone: "becher", icon: IceCream },
];

const ARRIVAL_OPTIONS = [
    { value: "Fahrrad", label: "Fahrrad", tone: "bike", icon: Bike },
    { value: "Motorrad", label: "Motorrad", tone: "bike", icon: Bike },
    { value: "Zu Fuß", label: "Zu Fuß", tone: "walk", icon: Footprints },
    { value: "Auto", label: "Auto", tone: "car", icon: Car },
    { value: "Bus / Bahn", label: "Bus / Bahn", tone: "transit", icon: MapPin },
    { value: "Sonstiges", label: "Sonstiges", tone: "other", icon: HelpCircle },
];

const ARRIVAL_ICON_MAP = Object.fromEntries(ARRIVAL_OPTIONS.map((option) => [option.value, option.icon]));

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
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const [location, setLocation] = useState(null);
    const cameraInputRef = useRef(null);
    const galleryInputRef = useRef(null);

    const MAX_IMAGES = SHARED_MAX_IMAGES;
    const [showImageChooser, setShowImageChooser] = useState(false);
    const SelectedArrivalIcon = ARRIVAL_ICON_MAP[anreise] || HelpCircle;

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
            if (!localAwards || localAwards.length === 0) {
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
                        <IntroText>Bewerte dein Eis kurz und teile bei Bedarf Fotos und Notizen mit der Community.</IntroText>
                        <Section>
                            <Label>Eistyp</Label>
                            <OptionGrid>
                                {TYPE_OPTIONS.map((option) => {
                                    const Icon = option.icon;
                                    return (
                                        <OptionButton
                                            key={option.value}
                                            type="button"
                                            $active={type === option.value}
                                            $tone={option.tone}
                                            onClick={() => setType(option.value)}
                                            aria-pressed={type === option.value}
                                        >
                                            <OptionIconWrap $active={type === option.value} $tone={option.tone}>
                                                <Icon size={16} />
                                            </OptionIconWrap>
                                            <OptionTextWrap>
                                                <OptionLabel>{option.label}</OptionLabel>
                                                <OptionDescription>{option.description}</OptionDescription>
                                            </OptionTextWrap>
                                        </OptionButton>
                                    );
                                })}
                            </OptionGrid>
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
                                        <ScoreInput
                                            type="number"
                                            step="0.1"
                                            min="1.0"
                                            max="5.0"
                                            value={sorte.bewertung}
                                            placeholder="Bewertung"
                                            onChange={(e) => handleSortenChange(index, "bewertung", e.target.value)}
                                        />
                                        <Rating stars={sorte.bewertung} onRatingSelect={(value) => handleSortenChange(index, "bewertung", value.toFixed(1))} />
                                    </>
                                    )}
                                    <RemoveButton type="button" onClick={() => removeSorte(index)}>✕</RemoveButton>
                                </Row>
                            ))}
                            <AddButton type="button" onClick={addSorte}>+ Sorte hinzufügen</AddButton>
                            <SortenToggleWrap>
                                <SortenToggleLabel>
                                    <input
                                        type="checkbox"
                                        checked={showSortenBewertung}
                                        onChange={() => setShowSortenBewertung(!showSortenBewertung)}
                                    /> Sorten einzeln bewerten
                                </SortenToggleLabel>
                            </SortenToggleWrap>
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
                                        <ScoreInput
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
                                <tr>
                                    <td><Label>Preis-Leistungs-Verhältnis:</Label></td>
                                    <td>
                                        <ScoreInput
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
                                    <td>
                                        <Label>
                                            Bewertung Waffel:
                                            <InfoHint tabIndex={0} aria-label="Hinweis zur Waffel-Bewertung">
                                                <InfoHintIcon>i</InfoHintIcon>
                                                <InfoHintBubble>
                                                    Wenn du Kugel- oder Softeis im Becher isst, kannst du die Waffel-Bewertung leer lassen.
                                                </InfoHintBubble>
                                            </InfoHint>
                                        </Label>
                                    </td>
                                    <td>
                                        <ScoreInput
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
                            <ArrivalSelectRow>
                                <ArrivalIconBadge>
                                    <SelectedArrivalIcon size={16} />
                                </ArrivalIconBadge>
                                <Select value={anreise} onChange={(e) => setAnreise(e.target.value)}>
                                    <option value="">Bitte wählen</option>
                                    {ARRIVAL_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </Select>
                            </ArrivalSelectRow>
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
                            <UploadActionRow>
                                <ActionButton type="button" onClick={handleAddImagesClick}>Bilder hinzufügen</ActionButton>
                            </UploadActionRow>
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
                                        <ImageCaptionInput
                                            type="text"
                                            placeholder="Beschreibung eingeben (optional)"
                                            value={bild.beschreibung}
                                            onChange={(e) => updateBildBeschreibung(index, e.target.value)}
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
                                <ReferenceHint>
                                    Dieser Check-in wird mit <strong>{referencedCheckin.nutzer_name}'s</strong> Check-in vom {referencedCheckin.datum} verknüpft.
                                </ReferenceHint>
                            </Section>)
                        }

                        <FormButtonGroup>
                            <PrimaryAction type="submit" disabled={submitted}>{checkinId ? "Änderungen speichern" : "Check-in"}</PrimaryAction>
                            <SecondaryAction type="button" onClick={() => setShowCheckinForm(false)}>Abbrechen</SecondaryAction>
                            {checkinId && (<>
                                <DeleteButton type="button" onClick={handleDeleteClick} >
                                    Check-in löschen
                                </DeleteButton></>
                            )}
                        </FormButtonGroup>
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
const Modal = styled(SharedModal)`
    width: min(96vw, 760px);
    background: linear-gradient(180deg, #fffdf8 0%, #fff6e6 100%);
    border: 1px solid rgba(47, 33, 0, 0.12);
    border-radius: 18px;
    box-shadow: 0 18px 36px rgba(28, 20, 0, 0.2);
`;
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
const IntroText = styled.p`
    margin: -0.3rem 0 0.9rem;
    color: rgba(47, 33, 0, 0.72);
    font-size: 0.92rem;
`;

const Row = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto auto;
    gap: 0.55rem;
    align-items: center;
    padding-bottom: 0.35rem;

    @media (max-width: 760px) {
        grid-template-columns: minmax(0, 1fr);
        align-items: stretch;
    }
`;

const RemoveButton = styled.button`
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(217, 83, 79, 0.35);
    color: #b4332f;
    border-radius: 10px;
    min-width: 42px;
    min-height: 40px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
`;

const AddButton = styled.button`
    background: rgba(255, 181, 34, 0.16);
    color: #7a4a00;
    border: 1px solid rgba(255, 181, 34, 0.35);
    padding: 0.5rem 0.7rem;
    border-radius: 10px;
    font-weight: 700;
    cursor: pointer;

    &:hover {
        background: rgba(255, 181, 34, 0.26);
    }
`;

const Table = styled.table`
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    border: 1px solid rgba(47, 33, 0, 0.1);
    border-radius: 14px;
    overflow: visible;
    background: rgba(255, 255, 255, 0.78);
    margin-bottom: 1rem;

    td {
        padding: 0.55rem 0.6rem;
        border-bottom: 1px solid rgba(47, 33, 0, 0.08);
        vertical-align: middle;
    }

    tr:last-child td {
        border-bottom: none;
    }

    @media (max-width: 760px) {
        display: block;

        tbody {
            display: grid;
            gap: 0.35rem;
            padding: 0.45rem;
        }

        tr {
            display: grid;
            gap: 0.35rem;
            background: rgba(255, 255, 255, 0.8);
            border: 1px solid rgba(47, 33, 0, 0.08);
            border-radius: 10px;
            padding: 0.45rem;
        }

        td {
            border: none;
            padding: 0;
        }
    }
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

const ScoreInput = styled(Input)`
    width: 100%;
    max-width: 130px;
    box-sizing: border-box;
    border-radius: 10px;
    border: 1px solid rgba(47, 33, 0, 0.2);
`;

const UploadActionRow = styled.div`
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
`;

const ActionButton = styled(Button)`
    color: #2f2100;
    border-radius: 11px;
    border: 1px solid rgba(255, 181, 34, 0.6);
    background: linear-gradient(180deg, #ffd36f 0%, #ffb522 100%);

    &:hover {
        background: linear-gradient(180deg, #ffd97f 0%, #ffbf3f 100%);
    }
`;

const ImageCaptionInput = styled(Input)`
    margin: 0.5rem 0;
    width: 90%;
`;

const SortenToggleWrap = styled.div`
    margin-top: 0.45rem;
`;

const SortenToggleLabel = styled.label`
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    color: #4f3800;
    font-size: 0.9rem;
`;

const OptionGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.55rem;
`;

const OptionButton = styled.button`
    border: 1px solid ${({ $active }) => ($active ? 'rgba(255, 181, 34, 0.55)' : 'rgba(47, 33, 0, 0.12)')};
    background: ${({ $active }) => ($active ? 'rgba(255, 181, 34, 0.16)' : 'rgba(255, 255, 255, 0.86)')};
    border-radius: 12px;
    padding: 0.55rem 0.65rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    text-align: left;
    color: #2f2100;
    font-weight: 600;
    transition: background-color 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;

    &:hover {
        background: rgba(255, 181, 34, 0.12);
    }

    &:focus-visible {
        outline: 2px solid rgba(255, 181, 34, 0.55);
        outline-offset: 2px;
    }
`;

const OptionIconWrap = styled.span`
    width: 26px;
    height: 26px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid;
    background: ${({ $active, $tone }) =>
        $active
            ? ($tone === 'softeis'
                ? 'rgba(56, 189, 248, 0.22)'
                : $tone === 'becher'
                    ? 'rgba(167, 139, 250, 0.22)'
                    : $tone === 'car'
                        ? 'rgba(251, 146, 60, 0.22)'
                        : $tone === 'walk'
                            ? 'rgba(74, 222, 128, 0.22)'
                            : $tone === 'bike'
                                ? 'rgba(96, 165, 250, 0.22)'
                                : $tone === 'transit'
                                    ? 'rgba(52, 211, 153, 0.22)'
                                    : $tone === 'none'
                                        ? 'rgba(148, 163, 184, 0.25)'
                                        : 'rgba(255, 181, 34, 0.22)')
            : 'rgba(255, 255, 255, 0.7)'};
    border-color: ${({ $active, $tone }) =>
        $active
            ? ($tone === 'softeis'
                ? 'rgba(2, 132, 199, 0.35)'
                : $tone === 'becher'
                    ? 'rgba(109, 40, 217, 0.35)'
                    : $tone === 'car'
                        ? 'rgba(194, 65, 12, 0.35)'
                        : $tone === 'walk'
                            ? 'rgba(22, 163, 74, 0.35)'
                            : $tone === 'bike'
                                ? 'rgba(37, 99, 235, 0.35)'
                                : $tone === 'transit'
                                    ? 'rgba(5, 150, 105, 0.35)'
                                    : $tone === 'none'
                                        ? 'rgba(100, 116, 139, 0.35)'
                                        : 'rgba(217, 119, 6, 0.35)')
            : 'rgba(47, 33, 0, 0.2)'};
    color: ${({ $active, $tone }) =>
        $active
            ? ($tone === 'softeis'
                ? '#0369a1'
                : $tone === 'becher'
                    ? '#6d28d9'
                    : $tone === 'car'
                        ? '#9a3412'
                        : $tone === 'walk'
                            ? '#15803d'
                            : $tone === 'bike'
                                ? '#1d4ed8'
                                : $tone === 'transit'
                                    ? '#047857'
                                    : $tone === 'none'
                                        ? '#64748b'
                                        : '#9a3412')
            : '#5f4a25'};
`;

const OptionTextWrap = styled.span`
    display: inline-flex;
    flex-direction: column;
    gap: 0.06rem;
`;

const OptionLabel = styled.span`
    font-size: 0.9rem;
    line-height: 1.2;
`;

const OptionDescription = styled.span`
    font-size: 0.73rem;
    color: rgba(47, 33, 0, 0.65);
    font-weight: 500;
`;

const TypeHelperBox = styled.div`
    margin-top: 0.55rem;
    border: 1px solid rgba(47, 33, 0, 0.12);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.76);
    color: #5a3f1a;
    font-size: 0.82rem;
    padding: 0.45rem 0.6rem;
`;

const InfoHint = styled.span`
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: 0.35rem;
    cursor: help;
    outline: none;
    z-index: 30;

    &:hover > span:last-child,
    &:focus-visible > span:last-child {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
    }
`;

const InfoHintIcon = styled.span`
    width: 17px;
    height: 17px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.72rem;
    font-weight: 800;
    line-height: 1;
    background: rgba(96, 165, 250, 0.2);
    border: 1px solid rgba(37, 99, 235, 0.28);
    color: #1d4ed8;
`;

const InfoHintBubble = styled.span`
    position: absolute;
    left: 50%;
    top: calc(100% + 0.35rem);
    transform: translate(-50%, -6px);
    width: min(280px, 72vw);
    padding: 0.45rem 0.55rem;
    border-radius: 9px;
    background: rgba(17, 24, 39, 0.94);
    color: #fff;
    font-size: 0.76rem;
    font-weight: 500;
    line-height: 1.3;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
    z-index: 20;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.16s ease, transform 0.16s ease;
`;

const ArrivalSelectRow = styled.div`
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.55rem;
    align-items: center;
`;

const ArrivalIconBadge = styled.span`
    width: 34px;
    height: 34px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 181, 34, 0.16);
    border: 1px solid rgba(255, 181, 34, 0.32);
    color: #7d4b00;
`;

const FormButtonGroup = styled(ButtonGroup)`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
`;

const PrimaryAction = styled(Button)`
    color: #2f2100;
    border-radius: 11px;
    border: 1px solid rgba(255, 181, 34, 0.6);
    background: linear-gradient(180deg, #ffd36f 0%, #ffb522 100%);

    &:hover {
        background: linear-gradient(180deg, #ffd97f 0%, #ffbf3f 100%);
    }
`;

const SecondaryAction = styled(Button)`
    color: #5d3a00;
    border-radius: 11px;
    border: 1px solid rgba(47, 33, 0, 0.22);
    background: rgba(255, 255, 255, 0.85);

    &:hover {
        background: rgba(255, 255, 255, 0.96);
    }
`;

const ReferenceHint = styled.p`
    margin: 0;
    font-style: italic;
    color: rgba(47, 33, 0, 0.68);
`;

const Text = styled.p``;
