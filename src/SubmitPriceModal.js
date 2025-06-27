import { useState } from "react";
import styled from 'styled-components';
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
                    additionalInfoSofteisPreis
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
                        <Input
                            type="number"
                            min="1.0"
                            max="5.0"
                            step="0.1"
                            placeholder="0.0"
                            value={kugelPreis ?? ''}
                            onChange={(e) => setKugelPreis(e.target.value)}
                        />
                        €
                    </Label>

                    <Label>
                        Zusatzbeschreibung für die Kugel:
                        <TextArea
                            rows={3}
                            value={additionalInfoKugelPreis}
                            onChange={(e) => setAdditionalInfoKugelPreis(e.target.value)}
                        />
                    </Label>

                    <Label>
                        Preis für Softeis:
                        <Input
                            type="number"
                            min="1.0"
                            max="5.0"
                            step="0.1"
                            placeholder="0.0"
                            value={softeisPreis ?? ''}
                            onChange={(e) => setSofteiPreis(e.target.value)}
                        />
                        €
                    </Label>

                    <Label>
                        Zusatzbeschreibung für Softeis:
                        <TextArea
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

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
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

const Label = styled.label`
  display: block;
  margin-top: 1rem;
  font-weight: bold;
`;

const Input = styled.input`
  width: 100px;
  padding: 0.5rem;
  margin-left: 0.5rem;
  border-radius: 8px;
  border: 1px solid #ccc;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  margin-top: 0.5rem;
  border-radius: 8px;
  border: 1px solid #ccc;
`;

const ButtonGroup = styled.div`
    text-align: center;
`;

const SubmitButton = styled.button`
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #ffb522;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;

  &:hover {
    background-color: #ffcb4c;
  }
`;

const Message = styled.p`
  margin-top: 1rem;
  font-style: italic;
`;

const LevelInfo = styled.div`
  margin-top: 1rem;
  border-top: 1px solid #eee;
  padding-top: 1rem;
`;