import { useState } from "react";

const SubmitIceShopForm = ({ showForm, setShowForm, userId }) => {
    const [name, setName] = useState("");
    const [adresse, setAdresse] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [openingHours, setOpeningHours] = useState("" );
    const [komoot, setKomoot] = useState("");
    const [message, setMessage] = useState("");

    const submit = async () => {
        try {
            const response = await fetch("https://ice-app.4lima.de/backend/submitIceShop.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    adresse,
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    openingHours,
                    komoot,
                    userId
                })
            });
            const data = await response.json();
            if (data.status === "success") {
                setMessage("Eisdiele erfolgreich hinzugefügt!");
            } else {
                setMessage(`Fehler: ${data.message}`);
            }
            setTimeout(() => {
                setMessage("");
                setShowForm(false);
                setName("");
                setAdresse("");
                setLatitude("");
                setLongitude("");
                setOpeningHours("{}");
                setKomoot("");
            }, 2000);
        } catch (error) {
            setMessage("Ein Fehler ist aufgetreten.");
        }
    };

    return showForm ? (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2 className="form-title">Neue Eisdiele eintragen</h2>
                <div className="form-group"><label>Name:</label> <input type="text" value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="form-group"><label>Adresse:</label> <input type="text" value={adresse} onChange={(e) => setAdresse(e.target.value)} /></div>
                <div className="form-group"><label>Latitude:</label> <input type="number" step="0.000001" value={latitude} onChange={(e) => setLatitude(e.target.value)} /></div>
                <div className="form-group"><label>Longitude:</label> <input type="number" step="0.000001" value={longitude} onChange={(e) => setLongitude(e.target.value)} /></div>
                <div className="form-group"><label>Öffnungszeiten (optional):</label> <textarea value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} /></div>
                <div className="form-group"><label>Komoot-Link (optional):</label> <input type="text" value={komoot} onChange={(e) => setKomoot(e.target.value)} /></div>
                <div className="button-group">
                    <button className="submit-button" onClick={submit}>Einreichen</button>
                    <button className="close-button" onClick={() => setShowForm(false)}>Schließen</button>
                </div>
                <p className="message">{message}</p>
            </div>
        </div>
    ) : null;
};

export default SubmitIceShopForm;
