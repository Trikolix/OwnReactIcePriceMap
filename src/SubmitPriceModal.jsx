import { useState } from "react";
import styled from 'styled-components';
import { Overlay, Modal, CloseButton, Heading, Label, Input, Textarea, ButtonGroup, SubmitButton, Message, LevelInfo } from './styles/SharedStyles';
import NewAwards from './components/NewAwards.jsx'
import { getSubmitPriceErrorMessage } from "./utils/submitPriceResponse";
const SubmitPriceModal = ({ shop, userId, showPriceForm, setShowPriceForm, onSuccess }) => {

    const [kugelPreis, setKugelPreis] = useState(shop.preise?.kugel?.preis ? shop.preise.kugel.preis : null);
    const [additionalInfoKugelPreis, setAdditionalInfoKugelPreis] = useState(shop.preise?.kugel?.beschreibung ? shop.preise.kugel.beschreibung : null);
    const [softeisPreis, setSofteiPreis] = useState(shop.preise?.softeis?.preis ? shop.preise.softeis.preis : null);
    const [additionalInfoSofteisPreis, setAdditionalInfoSofteisPreis] = useState(shop.preise?.softeis?.beschreibung ? shop.preise.softeis.beschreibung : null);
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [awards, setAwards] = useState([]);
    const [levelUpInfo, setLevelUpInfo] = useState(null);
    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    const [waehrung, setWaehrung] = useState(shop.eisdiele.waehrung_id ?? 1);
    const [waehrungSymbol, setWaehrungSymbol] = useState(shop.eisdiele.waehrung_symbol ?? '€');
    const hasSecondCurrency = shop.eisdiele.waehrung_symbol && shop.eisdiele.waehrung_symbol !== '€';

    const toggleWaehrung = () => {
        if (shop.eisdiele.waehrung_symbol !== '€') {
            if (waehrungSymbol === shop.eisdiele.waehrung_symbol) {
                setSofteiPreis(null);
                setKugelPreis(null);
                setWaehrungSymbol('€');
                setWaehrung(1); // ID für Euro
            } else {
                setSofteiPreis(null);
                setKugelPreis(null);
                setWaehrungSymbol(shop.eisdiele.waehrung_symbol);
                setWaehrung(shop.eisdiele.waehrung_id);
            }
        }
    };

    const submit = async () => {
        try {
            const response = await fetch(`${apiUrl}/submitPrice.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    shopId: shop.eisdiele.id,
                    userId: userId,
                    kugelPreis,
                    additionalInfoKugelPreis,
                    softeisPreis,
                    additionalInfoSofteisPreis,
                    waehrung
                })
            });
            const data = await response.json();
            const errorMessage = getSubmitPriceErrorMessage(response, data);
            if (errorMessage) {
                setMessage(`Fehler bei Meldung von Preis: ${errorMessage}`);
                return;
            }

            let localAwards = null;
            let maintenanceBonus = 0;
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
                } else if (element.maintenance_task_resolved?.bonus_ep) {
                    maintenanceBonus = element.maintenance_task_resolved.bonus_ep;
                } else if (element.level_up) {
                    setLevelUpInfo({
                        level: element.new_level,
                        level_name: element.level_name,
                    });
                }
            });
            if (maintenanceBonus > 0) {
                setMessage(`Preis erfolgreich gemeldet! +${maintenanceBonus} Pflege-EP`);
            }
            if (!localAwards || localAwards.length === 0) {
                setTimeout(() => {
                    setMessage('');
                    setShowPriceForm(false);
                    setKugelPreis(null);
                    setAdditionalInfoKugelPreis(null);
                    setSofteiPreis(null);
                    setAdditionalInfoSofteisPreis(null);
                }, 2000);
            }
        } catch (error) {
            setMessage(`Fehler bei Meldung von Preis: ${error.message || 'Ein Fehler ist aufgetreten.'}`);
        }
    }
    return showPriceForm ? (
        <Overlay>
            <StyledModal>
                <CloseButton onClick={() => setShowPriceForm(false)}>×</CloseButton>
                <Heading>Preis für {shop.eisdiele.name} einreichen</Heading>
                <IntroText>Bitte trage den aktuell beobachteten Preis ein. Du kannst optional eine kurze Notiz ergänzen.</IntroText>
                {!submitted && (<>
                    <SectionCard>
                        <Label>Preis pro Kugel</Label>
                        <PriceInputRow>
                            <PriceInput
                                type="number"
                                min="0.1"
                                max="20.0"
                                step="0.1"
                                placeholder="z. B. 1.80"
                                value={kugelPreis ?? ''}
                                onChange={(e) => setKugelPreis(e.target.value)}
                            />
                            <CurrencyPill
                                type="button"
                                onClick={toggleWaehrung}
                                disabled={!hasSecondCurrency}
                                title={hasSecondCurrency ? 'Währung wechseln' : 'Nur Euro verfügbar'}
                            >
                                {waehrungSymbol}
                            </CurrencyPill>
                        </PriceInputRow>
                        <StyledTextarea
                            rows={3}
                            value={additionalInfoKugelPreis ?? ''}
                            placeholder="Optional: Bechergröße, Angebot, Sondergröße ..."
                            onChange={(e) => setAdditionalInfoKugelPreis(e.target.value)}
                        />
                    </SectionCard>

                    <SectionCard>
                        <Label>Preis für Softeis</Label>
                        <PriceInputRow>
                            <PriceInput
                                type="number"
                                min="0.1"
                                max="20.0"
                                step="0.1"
                                placeholder="z. B. 2.40"
                                value={softeisPreis ?? ''}
                                onChange={(e) => setSofteiPreis(e.target.value)}
                            />
                            <CurrencyPill
                                type="button"
                                onClick={toggleWaehrung}
                                disabled={!hasSecondCurrency}
                                title={hasSecondCurrency ? 'Währung wechseln' : 'Nur Euro verfügbar'}
                            >
                                {waehrungSymbol}
                            </CurrencyPill>
                        </PriceInputRow>
                        <StyledTextarea
                            rows={3}
                            value={additionalInfoSofteisPreis ?? ''}
                            placeholder="Optional: Portionsgröße, Topping, Besonderheit ..."
                            onChange={(e) => setAdditionalInfoSofteisPreis(e.target.value)}
                        />
                    </SectionCard>
                    <ButtonGroup>
                        <PrimarySubmit type="button" onClick={submit}>Einreichen</PrimarySubmit>
                    </ButtonGroup>
                </>)}
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
        </Overlay>) : null;
};

export default SubmitPriceModal;
// File-specific overrides using shared components
const StyledModal = styled(Modal)`
    width: min(96vw, 560px);
    background: linear-gradient(180deg, #fffdf8 0%, #fff6e6 100%);
    border: 1px solid rgba(47, 33, 0, 0.12);
    border-radius: 18px;
    box-shadow: 0 18px 36px rgba(28, 20, 0, 0.2);
`;

const IntroText = styled.p`
    margin: -0.15rem 0 1rem;
    color: rgba(47, 33, 0, 0.7);
    font-size: 0.92rem;
`;

const SectionCard = styled.div`
    display: grid;
    gap: 0.45rem;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(47, 33, 0, 0.1);
    border-radius: 14px;
    padding: 0.75rem;
    margin-bottom: 0.75rem;
`;

const PriceInputRow = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.5rem;
    align-items: center;
`;

const PriceInput = styled(Input)`
    width: 100%;
    box-sizing: border-box;
    border-radius: 12px;
    border: 1px solid rgba(47, 33, 0, 0.2);
    padding: 0.62rem 0.72rem;
`;

const StyledTextarea = styled(Textarea)`
    width: 100%;
    box-sizing: border-box;
    border-radius: 12px;
    border: 1px solid rgba(47, 33, 0, 0.2);
    padding: 0.62rem 0.72rem;
`;

const CurrencyPill = styled.button`
    min-width: 52px;
    height: 40px;
    border-radius: 10px;
    border: 1px solid rgba(47, 33, 0, 0.24);
    background: rgba(255, 181, 34, 0.18);
    color: #5d3a00;
    font-weight: 800;
    cursor: pointer;

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const PrimarySubmit = styled(SubmitButton)`
    width: 100%;
    margin: 0;
    border-radius: 12px;
    color: #2f2100;
    border: 1px solid rgba(255, 181, 34, 0.6);
    background: linear-gradient(180deg, #ffd36f 0%, #ffb522 100%);

    &:hover {
        background: linear-gradient(180deg, #ffd97f 0%, #ffbf3f 100%);
    }
`;

// large submit styling is provided globally via SharedStyles SubmitButton
