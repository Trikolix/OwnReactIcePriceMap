import { useState } from "react";
const SubmitPriceForm = ({ shop, shopId, userId, showPriceForm, setShowPriceForm }) => {

    const [kugelPreis, setKugelPreis] = useState(shop.preise?.kugel?.preis? shop.preise.kugel.preis : null);
    const [additionalInfoKugelPreis, setAdditionalInfoKugelPreis] = useState(shop.preise?.kugel?.beschreibung? shop.preise.kugel.beschreibung : null);
    const [softeisPreis, setSofteiPreis] = useState(shop.preise?.softeis?.preis? shop.preise.softeis.preis : null);
    const [additionalInfoSofteisPreis, setAdditionalInfoSofteisPreis] = useState(shop.preise?.softeis?.beschreibung? shop.preise.softeis.beschreibung : null);
    const [message, setMessage] = useState('');
    console.log(shop);

    const submit = async () => {
        try {
            const response = await fetch('https://ice-app.4lima.de/backend/submitPrice.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    shopId: shopId,
                    userId: userId,
                    kugelPreis,
                    additionalInfoKugelPreis,
                    softeisPreis,
                    additionalInfoSofteisPreis
                })
            });
            console.log(JSON.stringify({
                shopId: shop.eisdielen_id,
                userId: userId,
                kugelPreis,
                additionalInfoKugelPreis,
                softeisPreis,
                additionalInfoSofteisPreis}));
            const data = await response.json();
            console.log(data);
            data.forEach(element => {
                if (element.status === 'success') {
                    setMessage('Preis erfolgreich gemeldet!');
                } else {
                    setMessage(`Fehler bei Meldung von Preis: ${element.message}`);
                    return;
                }
            });
            setTimeout(() => {
                setMessage('');
                setShowPriceForm(false);
                setKugelPreis(null);
                setAdditionalInfoKugelPreis(null);
                setSofteiPreis(null);
                setAdditionalInfoSofteisPreis(null);
            }, 2000);
        } catch (error) {

        }
    }
    return showPriceForm ? (
        <div className="modal-overlay">
            <div className="modal-content" style={{position: "relative"}}>
                <button className="close-button" style={{position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', outlineStyle: 'none'}}onClick={() => setShowPriceForm(false)}>x</button>
                <h2>Preis für {shop.eisdielen_name} einreichen</h2>
                <div><b>Preis pro Kugel:<input
                    type="number"
                    min="1.0"
                    max="5.0"
                    step="0.1"
                    placeholder="0.0"
                    value={kugelPreis ? kugelPreis : ''}
                    onChange={(e) => setKugelPreis(e.target.value)}
                />€</b></div>
                <div><b>Zusatzbeschreibung für die Kugel:</b> <textarea rows="3" cols="35" value={additionalInfoKugelPreis} onChange={(e) => setAdditionalInfoKugelPreis(e.target.value)} /></div>
                <div><b>Preis für Softeis:<input
                    type="number"
                    min="1.0"
                    max="5.0"
                    step="0.1"
                    placeholder="0.0"
                    value={softeisPreis ? softeisPreis : ''}
                    onChange={(e) => setSofteiPreis(e.target.value)}
                />€</b></div>
                <div><b>Zusatzbeschreibung für Softeis:</b> <textarea rows="3" cols="30" value={additionalInfoSofteisPreis} onChange={(e) => setAdditionalInfoSofteisPreis(e.target.value)} /></div>
                <button onClick={submit}>Einreichen</button>
                <p>{message}</p>
                <button onClick={() => setShowPriceForm(false)}>Schließen</button>
            </div>
        </div>) : null;
};

export default SubmitPriceForm;