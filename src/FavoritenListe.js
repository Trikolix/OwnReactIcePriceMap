import React, { useEffect, useState } from "react";

function FavoritenListe({ userId, isLoggedIn }) {
  const [favoriten, setFavoriten] = useState([]);

  useEffect(() => {
    if (!isLoggedIn) return;

    fetch(`https://ice-app.4lima.de/backend/favoriten_liste.php?nutzer_id=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setFavoriten(data);
      })
      .catch((err) => {
        console.error("Fehler beim Laden der Favoriten:", err);
      });
  }, [userId, isLoggedIn]);

  if (!isLoggedIn) {
    return <p>Bitte melde dich an, um deine Favoriten zu sehen.</p>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Deine Lieblings-Eisdielen 🍦</h2>
      {favoriten.length === 0 ? (
        <p>Du hast noch keine Favoriten gespeichert.</p>
      ) : (
        <ul className="space-y-4">
          {favoriten.map((eisdiele) => (
            <li key={eisdiele.id} className="p-4 rounded shadow bg-white">
              <h3 className="text-lg font-bold">{eisdiele.name}</h3>
              <p>{eisdiele.adresse}</p>
              {/* Weitere Infos wie Öffnungszeiten oder Bewertungen können hier folgen */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FavoritenListe;
