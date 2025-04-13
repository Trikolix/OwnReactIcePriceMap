import { useState } from "react";

import LocationPicker from "./components/LocationPicker"

const SubmitIceShopModal = ({ showForm, setShowForm, userId, refreshShops, userLatitude, userLongitude }) => {
  const [name, setName] = useState("");
  const [adresse, setAdresse] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [openingHours, setOpeningHours] = useState("");
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
        refreshShops();
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
      console.log(error);
    }
  };

  return showForm && (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button style={styles.closeX} onClick={() => setShowForm(false)}>×</button>
        <h2 style={styles.title}>Neue Eisdiele eintragen</h2>

        <div style={styles.group}>
          <label>Name:</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={styles.input} />
        </div>

        <div style={styles.group}>
          <label>Adresse:</label>
          <input type="text" value={adresse} onChange={(e) => setAdresse(e.target.value)} style={styles.input} />
        </div>

        <LocationPicker
          latitude={latitude || userLatitude || 50.83}
          longitude={longitude || userLongitude || 12.92}
          setLatitude={setLatitude}
          setLongitude={setLongitude}
        />
        
        <div style={styles.groupInline}>
          <div style={styles.group}>
            <label>Latitude:</label>
            <input type="number" step="0.000001" value={latitude} onChange={(e) => setLatitude(e.target.value)} style={styles.inputCoordinate} />
          </div>
          <div style={styles.group}>
            <label>Longitude:</label>
            <input type="number" step="0.000001" value={longitude} onChange={(e) => setLongitude(e.target.value)} style={styles.inputCoordinate} />
          </div>
        </div>

        <div style={styles.group}>
          <label>Öffnungszeiten (optional):</label>
          <textarea value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} rows={3} style={styles.textarea} />
        </div>

        <div style={styles.group}>
          <label>Komoot-Link (optional):</label>
          <input type="text" value={komoot} onChange={(e) => setKomoot(e.target.value)} style={styles.input} />
        </div>

        <div style={styles.buttonGroup}>
          <button style={styles.submitButton} onClick={submit}>Einreichen</button>
        </div>

        {message && <p style={styles.message}>{message}</p>}
      </div>
    </div>
  )
};

export default SubmitIceShopModal;

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "1rem", // sorgt dafür, dass Modal nicht am Rand klebt
    zIndex: 1000,
    overflowY: "auto" // falls Inhalt größer als Viewport
  },
  modal: {
    backgroundColor: "#fff",
    padding: "1rem",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "450px",
    maxHeight: "90vh", // begrenzt Höhe auf kleinen Screens
    overflowY: "auto", // erlaubt Scrollen im Modal
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.2)",
    position: "relative",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    marginBottom: "0.5rem"
  },
  group: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "0.5rem"
  },
  groupInline: {
    display: "flex",
    gap: "1rem",
    marginBottom: "0.5rem"
  },
  input: {
    padding: "0.5rem",
    fontSize: "1rem",
    borderRadius: "8px",
    border: "1px solid #ccc",
    marginTop: "0.25rem"
  },
  inputCoordinate: {
    padding: "0.5rem",
    fontSize: "1rem",
    borderRadius: "8px",
    border: "1px solid #ccc",
    marginTop: "0.25rem",
    width: "90%"
  },
  textarea: {
    padding: "0.5rem",
    fontSize: "1rem",
    borderRadius: "8px",
    border: "1px solid #ccc",
    marginTop: "0.25rem",
    resize: "vertical"
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "center",
    gap: "1rem",
    marginTop: "0.5rem"
  },
  submitButton: {
    backgroundColor: "#ffb522",
    color: "white",
    border: "none",
    padding: "0.6rem 1.2rem",
    borderRadius: "8px",
    fontSize: "1rem",
    cursor: "pointer"
  },
  closeX: {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer"
  },
  message: {
    marginTop: "1rem",
    fontStyle: "italic",
    color: "#555"
  }
};