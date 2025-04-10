import { useState, useEffect } from "react";

const SubmitReviewForm = ({ showForm, setShowForm, userId, shop, refreshShops }) => {
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
                const response = await fetch(`https://ice-app.4lima.de/backend/getReview.php?userId=${userId}&shopId=${shop.eisdiele.id}`);
                const data = await response.json();
                setAttribute(data.allAttributes.filter(attr => !data.attributes || !data.attributes.includes(attr)));
                if (data.review) {
                    setGeschmack(data.review.geschmack);
                    setKugelgroesse(data.review.kugelgroesse);
                    setWaffel(data.review.waffel);
                    setAuswahl(data.review.auswahl);
                    setBeschreibung(data.review.beschreibung);
                    setSelectedAttributes(data.attributes);                    
                }
            } catch (error) {
                console.error("Fehler beim Abrufen der Bewertung", error);
            }
        };
        fetchReview();
    }, [userId, shop.eisdiele.id]);

    const submit = async () => {
        try {
            const response = await fetch("https://ice-app.4lima.de/backend/submitReview.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userId,
                    shopId: shop.eisdiele.id,
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
                refreshShops();
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
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <button style={styles.closeButton} onClick={() => setShowForm(false)}>x</button>
                <h2 style={styles.formTitle}>{shop.eisdiele.name} bewerten</h2>

                <div style={styles.gridForm}>
                    <label>Geschmack:</label>
                    <input type="number" min="1.0" max="5.0" step="0.1" style={styles.input} value={geschmack || ''} onChange={(e) => setGeschmack(parseFloat(e.target.value))} />

                    <label>Kugelgröße:</label>
                    <input type="number" min="1.0" max="5.0" step="0.1" style={styles.input} value={kugelgroesse || ''} onChange={(e) => setKugelgroesse(parseFloat(e.target.value))} />

                    <label>Waffel:</label>
                    <input type="number" min="1.0" max="5.0" step="0.1" style={styles.input} value={waffel || ''} onChange={(e) => setWaffel(parseFloat(e.target.value))} />

                    <label>Auswahl:</label>
                    <input type="number" min="1" step="1" style={styles.input} value={auswahl || ''} onChange={(e) => setAuswahl(parseInt(e.target.value))} />
                </div>

                <div style={styles.textAreaGroup}>
                    <label>Beschreibung:</label>
                    <textarea rows="7" cols="35" style={styles.input} value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} />
                </div>

                <div style={styles.attributeSection}>
                    <p style={styles.boldText}>Ausgewählte Attribute:</p>
                    <div style={styles.flexWrap}>
                        {selectedAttributes.map((attr) => (
                            <span key={attr} style={styles.selectedAttributes} onClick={() => handleAttributeRemove(attr)}>
                                {attr} ×
                            </span>
                        ))}
                    </div>
                    <p style={styles.boldText}>Verfügbare Attribute:</p>
                    <div style={styles.flexWrap}>
                        {attribute.map((attr) => (
                            <span key={attr} style={styles.notSelectedAttributes} onClick={() => handleAttributeSelect(attr)}>
                                {attr}
                            </span>
                        ))}
                    </div>
                    <div style={styles.addAttributeRow}>
                        <input value={neuesAttribut} onChange={(e) => setNeuesAttribut(e.target.value)} placeholder="Neues Attribut" style={styles.input} />
                        <button onClick={handleNewAttribute} style={styles.submitButton}>Hinzufügen</button>
                    </div>
                </div>

                <div style={styles.buttonGroup}>
                    <button onClick={submit} style={styles.submitButton}>Einreichen</button>
                </div>
                <p style={styles.message}>{message}</p>
            </div>
        </div>
    ) : null;
};

export default SubmitReviewForm;

const styles = {
    modalOverlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '600px',
        position: 'relative',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    },
    closeButton: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'none',
        border: 'none',
        fontSize: '1.2rem',
        cursor: 'pointer',
        outlineStyle: 'none'
    },
    formTitle: {
        fontSize: '1.5rem',
        marginBottom: '1rem'
    },
    gridForm: {
        display: 'grid',
        gridTemplateColumns: '150px 1fr',
        gap: '8px 16px',
        marginBottom: '1rem',
        alignItems: 'center'
    },
    textAreaGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '1rem'
    },
    input: {
        border: '1px solid #e5e7eb',
        padding: '6px',
        borderRadius: '4px',
        fontSize: '1rem',
        width: '100%',
        boxSizing: 'border-box'
    },
    selectedAttributes: {
        padding: '4px 12px',
        backgroundColor: '#ffb522',
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
    },
    flexWrap: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '8px'
    },
    addAttributeRow: {
        display: 'flex',
        gap: '8px',
        marginTop: '8px'
    },
    addButton: {
        padding: '6px 12px',
        backgroundColor: '#ffb522',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    },
    submitButton: {
        backgroundColor: '#ffb522',
        color: 'white',
        padding: '6px 12px',
        borderRadius: '4px',
        border: 'none',
        cursor: 'pointer'
    },
    buttonGroup: {
        marginTop: '1rem',
        textAlign: 'center'
    },
    boldText: {
        fontWeight: '600',
        marginTop: '1rem',
        marginBottom: '0.5rem'
    },
    attributeSection: {
        marginBottom: '1rem'
    },
    message: {
        marginTop: '1rem',
        textAlign: 'center'
    }
};