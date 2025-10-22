import { useState } from "react";
import styled from 'styled-components';
import { Overlay, Modal, CloseButton, Heading, Label, Input, Textarea, ButtonGroup, SubmitButton, Message, LevelInfo } from './styles/SharedStyles';
import NewAwards from './components/NewAwards.js'
const SubmitPriceModal = ({ shop, userId, showPriceForm, setShowPriceForm, onSuccess }) => {

    const [kugelPreis, setKugelPreis] = useState(shop.preise?.kugel?.preis ? shop.preise.kugel.preis : null);
    const [additionalInfoKugelPreis, setAdditionalInfoKugelPreis] = useState(shop.preise?.kugel?.beschreibung ? shop.preise.kugel.beschreibung : null);
    const [softeisPreis, setSofteiPreis] = useState(shop.preise?.softeis?.preis ? shop.preise.softeis.preis : null);
    const [additionalInfoSofteisPreis, setAdditionalInfoSofteisPreis] = useState(shop.preise?.softeis?.beschreibung ? shop.preise.softeis.beschreibung : null);
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [awards, setAwards] = useState([]);
    const [levelUpInfo, setLevelUpInfo] = useState(null);
    const apiUrl = process.env.REACT_APP_API_BASE_URL;

    const [waehrung, setWaehrung] = useState(shop.eisdiele.waehrung_id ?? 1);
    const [waehrungSymbol, setWaehrungSymbol] = useState(shop.eisdiele.waehrung_symbol ?? '€');
    console.log(shop);

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
            console.log(JSON.stringify({
                shopId: shop.eisdiele.id,
                userId: userId,
                kugelPreis,
                additionalInfoKugelPreis,
                softeisPreis,
                additionalInfoSofteisPreis
            }));
            const data = await response.json();
            console.log(data);
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
                } else if (element.level_up) {
                    setLevelUpInfo({
                        level: element.new_level,
                        level_name: element.level_name,
                    });
                }
            });
            if (localAwards && localAwards.length !== 0) {
                console.log("Neue Auszeichnungen:", localAwards);
            } else {
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

        }
    }
    return showPriceForm ? (
        <Overlay>
            <Modal>
                <CloseButton onClick={() => setShowPriceForm(false)}>×</CloseButton>
                <Heading>Preis für {shop.eisdiele.name} einreichen</Heading>
                {!submitted && (<>
                    <Label>
                        Preis pro Kugel:
                        <NarrowInput
                            type="number"
                            min="1.0"
                            max="5.0"
                            step="0.1"
                            placeholder="0.0"
                            value={kugelPreis ?? ''}
                            onChange={(e) => setKugelPreis(e.target.value)}
                        />
                        <span onClick={toggleWaehrung} style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                            {waehrungSymbol}
                        </span>
                    </Label>

                    <Label>
                        Zusatzbeschreibung für die Kugel:
                        <Textarea
                            rows={3}
                            value={additionalInfoKugelPreis}
                            onChange={(e) => setAdditionalInfoKugelPreis(e.target.value)}
                        />
                    </Label>

                    <Label>
                        Preis für Softeis:
                        <NarrowInput
                            type="number"
                            min="1.0"
                            max="5.0"
                            step="0.1"
                            placeholder="0.0"
                            value={softeisPreis ?? ''}
                            onChange={(e) => setSofteiPreis(e.target.value)}
                        />
                        <span onClick={toggleWaehrung} style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                            {waehrungSymbol}
                        </span>
                    </Label>

                    <Label>
                        Zusatzbeschreibung für Softeis:
                        <Textarea
                            rows={3}
                            value={additionalInfoSofteisPreis}
                            onChange={(e) => setAdditionalInfoSofteisPreis(e.target.value)}
                        />
                    </Label>
                    <ButtonGroup>
                        <SubmitButton onClick={submit}>Einreichen</SubmitButton>
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
            </Modal>
        </Overlay>) : null;
};

export default SubmitPriceModal;
// File-specific overrides using shared components
const NarrowInput = styled(Input)`
    width: 40px;
    padding: 0.5rem;
    margin-left: 0.5rem;
    margin-right: 0.5rem;
    border-radius: 8px;
    border: 1px solid #ccc;
`;

const TextArea = styled(Textarea)`
    width: 100%;
    padding: 0.5rem;
    margin-top: 0.5rem;
    border-radius: 8px;
    border: 1px solid #ccc;
`;

const LocalButtonGroup = styled.div`
    text-align: center;
`;

// large submit styling is provided globally via SharedStyles SubmitButton
