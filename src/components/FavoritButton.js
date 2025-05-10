import { useEffect, useState } from "react";
import "./FavoritButton.css";
import { useUser } from "./../context/UserContext";

const FavoritenButton = ({ eisdieleId, setIceCreamShops }) => {
    const [favorisiert, setFavorisiert] = useState(false);
    const [loading, setLoading] = useState(false);
    const { isLoggedIn, userId } = useUser();
    const apiUrl = process.env.REACT_APP_API_BASE_URL;

    if (!isLoggedIn) {}

    // Favoritenstatus bei Mount laden
    useEffect(() => {
        if (!isLoggedIn) return;

        fetch(`${apiUrl}/is_favorit.php?nutzer_id=${userId}&eisdiele_id=${eisdieleId}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.favorit === true) {
                    setFavorisiert(true);
                }
            })
            .catch((err) => {
                console.error("Fehler beim Laden des Favoritenstatus:", err);
            });
    }, [userId, eisdieleId, isLoggedIn, apiUrl]);

    const handleToggle = () => {
        if (!isLoggedIn) {
            alert("Bitte logge dich ein, um Favoriten zu nutzen.");
            return;
        }

        setLoading(true);
        fetch(`${apiUrl}/favoriten_toggle.php?nutzer_id=${userId}&eisdiele_id=${eisdieleId}`)
            .then(res => res.json())
            .then(data => {
                console.log(data);
                if (data.status === "added") {
                    setFavorisiert(true);
                    setIceCreamShops(prev =>
                        prev.map(shop =>
                          shop.id === eisdieleId ? { ...shop, is_favorit: data.is_favorit } : shop
                        )
                    );
                } else if (data.status === "removed") {
                    setFavorisiert(false);
                    setIceCreamShops(prev =>
                        prev.map(shop =>
                          shop.id === eisdieleId ? { ...shop, is_favorit: data.is_favorit } : shop
                        )
                    );
                }
            })
            .finally(() => setLoading(false));
    };

    return (
        <button
            className="favoriten-button"
            onClick={handleToggle}
            title={favorisiert ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
            disabled={loading}
        >
            <span style={{ fontSize: "20px", color: favorisiert ? "gold" : "#888" }}>
                {favorisiert ? "★" : "☆"}
            </span>
        </button>
    );
};

export default FavoritenButton;
