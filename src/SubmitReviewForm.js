import { useState, useEffect } from "react";

const SubmitReviewForm = ({ showForm, setShowForm, userId, shopId, shopName }) => {
    const [geschmack, setGeschmack] = useState(null);
    const [kugelgroesse, setKugelgroesse] = useState(null);
    const [waffel, setWaffel] = useState(null);
    const [auswahl, setAuswahl] = useState(null);
    const [beschreibung, setBeschreibung] = useState("");
    const [message, setMessage] = useState("");
    const [attribute, setAttribute] = useState([]);
    const [selectedAttributes, setSelectedAttributes] = useState([]);
    const [neuesAttribut, setNeuesAttribut] = useState("");

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

        fetch(`https://ice-app.4lima.de/backend/get_attribute.php`)
            .then((res) => res.json())
            .then((data) => setAttribute(data.map(attr => attr.name)));
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
                    beschreibung,
                    selectedAttributes
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

    return showForm ? (
        <div className="modal-overlay">
            <div className="modal-content"  style={{ position: 'relative'}}>
                <button className="close-button" style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', outlineStyle: 'none' }} onClick={() => setShowForm(false)}>x</button>
                <h2 className="form-title">{shopName} bewerten</h2>
                <div className="form-group"><label>Geschmack:</label> <input type="number" min="1.0" max="5.0" step="0.1" style={styles.input} value={geschmack || ''} onChange={(e) => setGeschmack(parseFloat(e.target.value))} /></div>
                <div className="form-group"><label>Kugelgröße:</label> <input type="number" min="1.0" max="5.0" step="0.1" style={styles.input} value={kugelgroesse || ''} onChange={(e) => setKugelgroesse(parseFloat(e.target.value))} /></div>
                <div className="form-group"><label>Waffel:</label> <input type="number" min="1.0" max="5.0" step="0.1" style={styles.input} value={waffel || ''} onChange={(e) => setWaffel(parseFloat(e.target.value))} /></div>
                <div className="form-group"><label>Auswahl:</label> <input type="number" min="1" max="10" step="1" style={styles.input} value={auswahl || ''} onChange={(e) => setAuswahl(parseInt(e.target.value))} /></div>
                <div className="form-group"><label>Beschreibung:</label> <textarea rows="7" cols="35" style={styles.input} value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} /></div>
                <div className="mb-4">
                    <p className="font-semibold">Ausgewählte Attribute:</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {selectedAttributes.map((attr) => (
                            <span key={attr} style={styles.selectedAttributes} onClick={() => handleAttributeRemove(attr)}>
                                {attr} ×
                            </span>
                        ))}
                    </div>
                    <p className="font-semibold">Verfügbare Attribute:</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {attribute.map((attr) => (
                            <span key={attr} style={styles.notSelectedAttributes} onClick={() => handleAttributeSelect(attr)}>
                                {attr}
                            </span>
                        ))}
                    </div>
                    <div className="mt-2 flex space-x-2">
                        <input value={neuesAttribut} onChange={(e) => setNeuesAttribut(e.target.value)} placeholder="Neues Attribut" style={styles.input} />
                        <button onClick={handleNewAttribute} >Hinzufügen</button>
                    </div>
                </div><br />
                <div className="button-group">
                    <button className="submit-button" onClick={submit} style={{ backgroundColor: '#3b82f6', color: 'white', paddingLeft: '12px', paddingRight: '12px', paddingTop: '4px', paddingBottom: '4px', borderRadius: '4px' }}>Einreichen</button>
                </div>
                <p className="message">{message}</p>
            </div>
        </div>
    ) : null;
};

export default SubmitReviewForm;

const styles = {
    input: {
        border: '1px solid #e5e7eb',
        padding: '3px',
        flex: '1'
    },
    selectedAttributes: {
        paddingLeft: '12px',
        paddingRight: '12px',
        paddingTop: '4px',
        paddingBottom: '4px',
        backgroundColor: '#3b82f6',
        color: 'white',
        borderRadius: '9999px',
        cursor: 'pointer',
        display: 'inline-block'
    },
    notSelectedAttributes: {
        padding: '4px 12px',
        backgroundColor: '#d1d5db',
        borderRadius: '9999px',
        cursor: 'pointer',
        display: 'inline-block'
    }
}