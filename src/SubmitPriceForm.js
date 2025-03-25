import { useState } from "react";
const SubmitPriceForm = ({ shop, userId, showPriceForm, setShowPriceForm }) => {

    const [kugelPreis, setKugelPreis] = useState(null);
    const [softeisPreis, setSofteiPreis] = useState(null);
    const [message, setMessage] = useState('');

    const submit = async () => {
        try {
            const response = await fetch('https://ice-app.4lima.de/backend/submitPrice.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    shopId: shop.eisdielen_id,
                    userId: userId,
                    kugelPreis,
                    softeisPreis
                })
            });
            const data = await response.json();
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
                setSofteiPreis(null);
            }, 2000);
        } catch (error) {

        }
    }
    return showPriceForm ? (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Preis für {shop.eisdielen_name} einreichen</h2>
                <div><b>Kugelpreis:<input
                    type="number"
                    min="1.0"
                    max="5.0"
                    step="0.1"
                    placeholder="0.0"
                    value={kugelPreis ? kugelPreis : ''}
                    onChange={(e) => setKugelPreis(e.target.value)}
                />€</b></div>
                <div><b>Kugelpreis:<input
                    type="number"
                    min="1.0"
                    max="5.0"
                    step="0.1"
                    placeholder="0.0"
                    value={softeisPreis ? softeisPreis : ''}
                    onChange={(e) => setSofteiPreis(e.target.value)}
                />€</b></div>
                <button onClick={submit}>Einreichen</button>
                <p>{message}</p>
                <button onClick={() => setShowPriceForm(false)}>Schließen</button>
            </div>
        </div>) : null;
};

export default SubmitPriceForm;