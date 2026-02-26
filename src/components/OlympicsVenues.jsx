import L from 'leaflet';
import { Marker, Popup } from 'react-leaflet';

import { isSpecialTime } from '../utils/seasonal';

export const olympicsIcon = new L.Icon({
  iconUrl: '/assets/olympia.png',
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -44],
});

const OLYMPICS_AWARD_ID = 3;

const OLYMPIC_VENUES = [
  { name: 'Stadio San Siro', position: [45.4781, 9.1240] },
  { name: 'Stadio Olimpico del Ghiaccio', position: [46.5444, 12.1331] },
  { name: 'Stelvio Ski Centre (Bormio)', position: [46.4600, 10.3600] },
  { name: 'Südtirol Arena (Anterselva/Antholz)', position: [46.8849, 12.1535] },
  { name: 'Arena von Verona', position: [45.4390, 10.9944] },
];

export const OlympicsVenueMarkers = ({ isLoggedIn, setShowLoginModal }) => {
  if (isSpecialTime() !== 'olympics') {
    return null;
  }

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const handleClick = () => {
    const formData = new URLSearchParams();
    formData.append('award_id', OLYMPICS_AWARD_ID);

    fetch(`${apiUrl}/grant_secret_award.php`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (data.success && data.achievements && data.achievements.length > 0) {
          const event = new CustomEvent('new-awards', { detail: data.achievements });
          window.dispatchEvent(event);
        }
      })
      .catch(error => console.error('Error granting award:', error));
  };

  return (
    <>
      {OLYMPIC_VENUES.map((venue) => (
        <Marker
          key={venue.name}
          position={venue.position}
          icon={olympicsIcon}
          eventHandlers={{ click: handleClick }}
        >
          <Popup>
            <div style={{ textAlign: 'center'}}>
              <div style={{ marginBottom: '-20px' }}>
                <img
                  src="/assets/olympia.png"
                  alt="Olympia"
                  style={{ width: '100px', height: '100px' }}
                />
              </div>
              <h2>Eis-Winter-Olympia 2026</h2>
              <p>Du hast die Spielstätte<br/><strong>{venue.name}</strong><br/>gefunden!</p>
              {isLoggedIn? <p>Frohe Spiele!</p> : <><p>Bitte melde dich an, um deine olympische Auszeichnung zu erhalten.</p><button onClick={() => setShowLoginModal(true)}>Anmelden</button></>}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

export default OlympicsVenueMarkers;
