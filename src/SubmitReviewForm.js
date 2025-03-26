import { useState, useEffect } from "react";

const SubmitReviewForm = ({ showForm, setShowForm, userId, shopId }) => {
    const [geschmack, setGeschmack] = useState(null);
    const [kugelgroesse, setKugelgroesse] = useState(null);
    const [waffel, setWaffel] = useState(null);
    const [auswahl, setAuswahl] = useState(null);
    const [beschreibung, setBeschreibung] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const fetchReview = async () => {
            try {
                const response = await fetch(`https://ice-app.4lima.de/backend/getReview.php?userId=${userId}&shopId=${shopId}`);
                console.log(`https://ice-app.4lima.de/backend/getReview.php?userId=${userId}&shopId=${shopId}`);
                const data = await response.json();
                console.log(data);
                if (data) {
                    setGeschmack(data.geschmack);
                    setKugelgroesse(data.kugelgroesse);
                    setWaffel(data.waffel);
                    setAuswahl(data.auswahl);
                    setBeschreibung(data.beschreibung);
                }
            } catch (error) {
                console.error("Fehler beim Abrufen der Bewertung", error);
            }
        };
        fetchReview();
    }, [userId, shopId]);

    const submit = async () => {
        try {
            const response = await fetch("https://ice-app.4lima.de/backend/submitReview.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userId,
                    shopId,
                    geschmack,
                    kugelgroesse,
                    waffel,
                    auswahl,
                    beschreibung
                })
            });
            const data = await response.json();
            if (data.status === "success") {
                setMessage("Bewertung erfolgreich gespeichert!");
            } else {
                setMessage(`Fehler: ${data.message}`);
            }
            setTimeout(() => {
                setMessage("");
                setShowForm(false);
            }, 2000);
        } catch (error) {
            setMessage("Ein Fehler ist aufgetreten.");
        }
    };

    return showForm ? (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2 className="form-title">Eisdiele bewerten</h2>
                <div className="form-group"><label>Geschmack:</label> <input type="number" min="1.0" max="5.0" step="0.1" value={geschmack || '' } onChange={(e) => setGeschmack(parseFloat(e.target.value))} /></div>
                <div className="form-group"><label>Kugelgröße:</label> <input type="number" min="1.0" max="5.0" step="0.1" value={kugelgroesse || ''} onChange={(e) => setKugelgroesse(parseFloat(e.target.value))} /></div>
                <div className="form-group"><label>Waffel:</label> <input type="number" min="1.0" max="5.0" step="0.1" value={waffel || ''} onChange={(e) => setWaffel(parseFloat(e.target.value))} /></div>
                <div className="form-group"><label>Auswahl:</label> <input type="number" min="1" max="10" step="1" value={auswahl || ''} onChange={(e) => setAuswahl(parseInt(e.target.value))} /></div>
                <div className="form-group"><label>Beschreibung:</label> <textarea rows="7" cols="35" value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} /></div>
                <div className="button-group">
                    <button className="submit-button" onClick={submit}>Einreichen</button>
                    <button className="close-button" onClick={() => setShowForm(false)}>Schließen</button>
                </div>
                <p className="message">{message}</p>
            </div>
        </div>
    ) : null;
};

export default SubmitReviewForm;
