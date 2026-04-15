import { useState, useEffect, useMemo, useRef } from "react";
import styled from 'styled-components';
import { Overlay, Modal, CloseButton, Heading, Label, Input, Textarea, Select, ButtonGroup, SubmitButton, DeleteButton, Message, LevelInfo } from './styles/SharedStyles';
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
    const [visibilityWarning, setVisibilityWarning] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [awards, setAwards] = useState([]);
    const [levelUpInfo, setLevelUpInfo] = useState(null);
    const [selectedShops, setSelectedShops] = useState([]);
    const [allShops, setAllShops] = useState([]);
    const [shopSearch, setShopSearch] = useState("");
    const [shopsLoading, setShopsLoading] = useState(false);
    const initialShopsApplied = useRef(false);
    const shopSearchRef = useRef(null);
    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    const normalizeShop = (shop) => ({
        id: Number(shop.id),
        name: shop.name || resolveShopName(shop.id),
    });

    const resolveShopName = (id, fallbackName = "") => {
        const match = allShops.find((shop) => Number(shop.id) === Number(id));
        return match?.name || fallbackName || `Eisdiele #${id}`;
    };

    const findExistingChipName = (id) => {
        const existing = selectedShops.find((shop) => Number(shop.id) === Number(id));
        return existing?.name || resolveShopName(id);
    };

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

    useEffect(() => {
        if (!showForm) {
            initialShopsApplied.current = false;
            return;
        }
        setShopsLoading(true);
        fetch(`${apiUrl}/get_eisdielen_list.php`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setAllShops(data);
                }
            })
            .catch(() => {
                setAllShops([]);
            })
            .finally(() => setShopsLoading(false));
    }, [showForm, apiUrl]);

    useEffect(() => {
        if (!showForm || initialShopsApplied.current) return;

        let initialSelection = [];
        if (existingRoute?.eisdielen?.length) {
            initialSelection = existingRoute.eisdielen.map(normalizeShop);
        } else if (existingRoute?.eisdiele_id) {
            initialSelection = [{
                id: Number(existingRoute.eisdiele_id),
                name: existingRoute.eisdiele_name || resolveShopName(existingRoute.eisdiele_id),
            }];
        } else if (shopId) {
            initialSelection = [{
                id: Number(shopId),
                name: shopName || resolveShopName(shopId),
            }];
        }

        setSelectedShops(initialSelection);
        initialShopsApplied.current = true;
    }, [showForm, existingRoute, shopId, shopName]);

    const filteredShops = useMemo(() => {
        const term = shopSearch.trim().toLowerCase();
        if (!term) return [];
        return allShops
            .filter((shop) => {
                const alreadySelected = selectedShops.some((s) => Number(s.id) === Number(shop.id));
                if (alreadySelected) return false;
                const inName = shop.name?.toLowerCase().includes(term);
                const inAddress = shop.adresse?.toLowerCase().includes(term);
                return inName || inAddress;
            })
            .slice(0, 8);
    }, [shopSearch, allShops, selectedShops]);

    const handleAddShop = (shop) => {
        if (!shop) return;
        setSelectedShops((prev) => {
            if (prev.some((entry) => Number(entry.id) === Number(shop.id))) {
                return prev;
            }
            return [...prev, normalizeShop(shop)];
        });
        setShopSearch("");
        queueMicrotask(() => {
            shopSearchRef.current?.focus();
        });
    };

    const handleRemoveShop = (id) => {
        setSelectedShops((prev) => prev.filter((shop) => Number(shop.id) !== Number(id)));
    };

    const showShopSuggestions = shopSearch.trim().length > 0 && filteredShops.length > 0;

    const checkVisibility = async (checkUrl) => {
        if (!checkUrl) {
            setVisibilityWarning("");
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/routen/checkRouteVisibility.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: checkUrl })
            });
            const data = await response.json();
            if (data.status === 'success' && data.visibility === 'private') {
                setVisibilityWarning("Achtung: Diese Route scheint privat oder nicht erreichbar zu sein. Bitte überprüfe die Sichtbarkeitseinstellungen bei " + (checkUrl.includes("strava") ? "Strava" : checkUrl.includes("outdooractive") ? "Outdooractive" : "Komoot") + ".");
            } else {
                setVisibilityWarning("");
            }
        } catch (err) {
            // Error silently, just don't show warning
            setVisibilityWarning("");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const selectedIds = selectedShops.map((shop) => shop.id);
        if (selectedIds.length === 0) {
            setMessage("Bitte verknüpfe mindestens eine Eisdiele mit der Route.");
            return;
        }

        const routeData = {
            eisdiele_id: selectedIds[0],
            eisdiele_ids: selectedIds,
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
                setSelectedShops(selectedIds.map((id) => ({
                    id,
                    name: findExistingChipName(id)
                })), "handleSubmitSuccess");
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
            <StyledModal>
                <CloseButton onClick={() => setShowForm(false)}>×</CloseButton>
                <Heading>
                    {existingRoute ? "Route bearbeiten" : "Route einreichen"}
                </Heading>
                <IntroText>Verknüpfe Eisdielen mit deiner Route und teile die wichtigsten Tourdaten mit der Community.</IntroText>

                {!submitted && (<>
                    <Group>
                        <InlineField>
                            <InlineLabel>Routenname:</InlineLabel>
                            <InlineControl>
                                <Input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="z. B. 'Rund um Eisdiele X'"
                                    required
                                />
                            </InlineControl>
                        </InlineField>
                    </Group>

                    <FieldLabel>
                        Eisdielen entlang der Route:
                        <SelectedShopList>
                            {selectedShops.map((shop) => (
                                <ShopChip key={shop.id}>
                                    <span>{shop.name}</span>
                                    <RemoveChipButton
                                        type="button"
                                        onMouseDown={(event) => {
                                            event.preventDefault();
                                            handleRemoveShop(shop.id);
                                        }}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" || event.key === " ") {
                                                event.preventDefault();
                                                handleRemoveShop(shop.id);
                                            }
                                        }}
                                        aria-label={`${shop.name} entfernen`}
                                    >
                                        ×
                                    </RemoveChipButton>
                                </ShopChip>
                            ))}
                            {selectedShops.length === 0 && (
                                <ShopHint>Bitte mindestens eine Eisdiele auswählen.</ShopHint>
                            )}
                        </SelectedShopList>
                        <ShopSearchWrapper>
                            <Input
                                type="text"
                                value={shopSearch}
                                ref={shopSearchRef}
                                onChange={(e) => setShopSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && filteredShops.length > 0) {
                                        e.preventDefault();
                                        handleAddShop(filteredShops[0]);
                                    }
                                }}
                                placeholder="Name oder Ort eingeben, um weitere Eisdielen hinzuzufügen"
                            />
                            {shopsLoading && <ShopHelperText>Lade Eisdielen…</ShopHelperText>}
                            {!shopsLoading && showShopSuggestions && (
                                <SuggestionList>
                                    {filteredShops.map((shop) => (
                                        <li key={shop.id}>
                                            <button type="button" onClick={() => handleAddShop(shop)}>
                                                <strong>{shop.name}</strong>
                                                {shop.adresse && <small>{shop.adresse}</small>}
                                            </button>
                                        </li>
                                    ))}
                                </SuggestionList>
                            )}
                        </ShopSearchWrapper>
                    </FieldLabel>

                    <InlineField>
                        <InlineLabel>URL:</InlineLabel>
                        <InlineControl>
                            <Input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onBlur={(e) => checkVisibility(e.target.value)}
                                placeholder="URL zur Komoot / Strava / Outdooractive Route"
                                required
                            />
                            {visibilityWarning && (
                                <Message style={{ marginTop: '5px', color: '#856404', backgroundColor: '#fff3cd', borderColor: '#ffeeba' }}>{visibilityWarning}</Message>
                            )}
                        </InlineControl>
                    </InlineField>

                    <FieldLabel>
                        Beschreibung:
                        <TextArea
                            rows={3}
                            value={beschreibung}
                            onChange={(e) => setBeschreibung(e.target.value)}
                            placeholder="Hier kannst du deine Route beschreiben."
                        />
                    </FieldLabel>

                    <InlineField>
                        <InlineLabel>Typ:</InlineLabel>
                        <InlineControl>
                            <Select value={typ} onChange={(e) => setTyp(e.target.value)}>
                                <option value="Rennrad">Rennrad</option>
                                <option value="Wanderung">Wanderung</option>
                                <option value="MTB">MTB</option>
                                <option value="Gravel">Gravel</option>
                                <option value="Sonstiges">Sonstiges</option>
                            </Select>
                        </InlineControl>
                    </InlineField>

                    <InlineField>
                        <InlineLabel>Länge (km):</InlineLabel>
                        <InlineControl>
                            <Input
                                type="number"
                                step="0.1"
                                value={laenge_km}
                                onChange={(e) => setLaenge_km(e.target.value)}
                                placeholder="z. B. 42.3"
                            />
                        </InlineControl>
                    </InlineField>

                    <InlineField>
                        <InlineLabel>Höhenmeter:</InlineLabel>
                        <InlineControl>
                            <Input
                                type="number"
                                value={hoehenmeter}
                                onChange={(e) => setHoehenmeter(e.target.value)}
                                placeholder="z. B. 680"
                            />
                        </InlineControl>
                    </InlineField>

                    <InlineField>
                        <InlineLabel>Schwierigkeit:</InlineLabel>
                        <InlineControl>
                            <Select value={schwierigkeit} onChange={(e) => setSchwierigkeit(e.target.value)}>
                                <option value="Leicht">Leicht</option>
                                <option value="Mittel">Mittel</option>
                                <option value="Schwer">Schwer</option>
                            </Select>
                        </InlineControl>
                    </InlineField>

                    <FieldLabel>
                        Private Tour:
                        <Checkbox
                            type="checkbox"
                            checked={isPrivat}
                            onChange={(e) => setisPrivat(e.target.checked)}
                        />
                    </FieldLabel>

                    {userId === "1" && (
                        <FieldLabel>
                            Embed Code (Admin):
                            <TextArea
                                rows={3}
                                value={embedCode}
                                onChange={(e) => setEmbedCode(e.target.value)}
                                placeholder="<iframe ...></iframe>"
                            />
                        </FieldLabel>
                    )}
                    <ButtonGroup>
                        <PrimarySubmit type="submit" onClick={handleSubmit}>
                            {existingRoute ? "Änderungen speichern" : "Route einreichen"}
                        </PrimarySubmit>
                        <SecondarySubmit type="button" onClick={() => setShowForm(false)}>
                            Abbrechen
                        </SecondarySubmit>
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
            </StyledModal>
        </Overlay>
    ) : null;
};

export default SubmitRouteForm;

// Keep small file-specific tweaks
const InputName = styled(Input)`
    min-width: 94%;
`;
const Group = styled.div`
    display: flex;
    flex-direction: column;
    margin-bottom: 0.5rem;
`;
const InlineField = styled.div`
    display: grid;
    grid-template-columns: 150px minmax(0, 1fr);
    gap: 0.65rem;
    align-items: center;
    margin-bottom: 0.55rem;

    @media (max-width: 700px) {
        grid-template-columns: 1fr;
        gap: 0.25rem;
    }
`;
const InlineLabel = styled.span`
    font-weight: 700;
    color: #4f3800;
    font-size: 0.92rem;
`;
const InlineControl = styled.div`
    width: 100%;
`;
const FieldLabel = styled(Label)`
    display: grid;
    gap: 0.3rem;
    margin: 0 0 0.55rem;
    color: #4f3800;
    font-weight: 700;
    font-size: 0.92rem;
`;
const Checkbox = styled.input`
    width: auto;
    margin: 0;
    justify-self: start;
`;
// Provide aliases for shared components expected by JSX
const TextArea = Textarea;
// LevelInfo is provided by SharedStyles (imported earlier) — no local override needed

const SelectedShopList = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0.5rem 0;
`;

const ShopChip = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: #fff3db;
    border-radius: 999px;
    padding: 0.25rem 0.75rem;
    font-weight: 600;
    color: #a35b00;
`;

const RemoveChipButton = styled.button`
    border: none;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
`;

const ShopSearchWrapper = styled.div`
    position: relative;
`;

const ShopHint = styled.span`
    color: #777;
    font-size: 0.9rem;
`;

const ShopHelperText = styled.p`
    font-size: 0.75rem;
    color: #777;
    margin-top: 0.25rem;
`;

const SuggestionList = styled.ul`
    position: absolute;
    top: calc(100% + 0.25rem);
    left: 0;
    right: 0;
    list-style: none;
    background: #fff;
    border: 1px solid #eee;
    border-radius: 8px;
    max-height: 240px;
    overflow-y: auto;
    padding: 0.25rem 0;
    z-index: 5;

    li {
        margin: 0;
    }

    li button {
        width: 100%;
        background: transparent;
        border: none;
        text-align: left;
        padding: 0.5rem 0.75rem;
        cursor: pointer;
    }

    li button:hover {
        background: #fff7e6;
    }

    li button small {
        display: block;
        color: #777;
    }
`;

const StyledModal = styled(Modal)`
    width: min(96vw, 760px);
    background: linear-gradient(180deg, #fffdf8 0%, #fff6e6 100%);
    border: 1px solid rgba(47, 33, 0, 0.12);
    border-radius: 18px;
    box-shadow: 0 18px 36px rgba(28, 20, 0, 0.2);

    input:not([type="checkbox"]),
    select,
    textarea {
        width: 100%;
        box-sizing: border-box;
        margin: 0;
        border-radius: 12px;
        border: 1px solid rgba(47, 33, 0, 0.2);
        min-height: 42px;
    }

    textarea {
        min-height: 96px;
        resize: vertical;
    }
`;

const IntroText = styled.p`
    margin: -0.2rem 0 0.8rem;
    color: rgba(47, 33, 0, 0.72);
    font-size: 0.92rem;
`;

const PrimarySubmit = styled(SubmitButton)`
    color: #2f2100;
    border: 1px solid rgba(255, 181, 34, 0.6);
    border-radius: 12px;
    background: linear-gradient(180deg, #ffd36f 0%, #ffb522 100%);
`;

const SecondarySubmit = styled(SubmitButton)`
    color: #5d3a00;
    border: 1px solid rgba(47, 33, 0, 0.2);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.85);
`;
