import React, { useState, useEffect } from 'react';
import L from 'leaflet';
import { Marker, Popup, useMap } from 'react-leaflet';

import { isSpecialTime } from '../utils/seasonal';

export const easterEggIcon = new L.Icon({
    iconUrl: '/assets/easter-egg.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
});

export const EasterEggMarker = ({ isLoggedIn, setShowLoginModal }) => {

    if (isSpecialTime() !== 'easter') {
        return null;
    }

    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const EASTER_AWARD_ID = 2; // Specific award ID for Easter

    const handleClick = () => {
        if (!isLoggedIn) {
            setShowLoginModal(true);
            return;
        }

        const formData = new URLSearchParams();
        formData.append('award_id', EASTER_AWARD_ID);

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
        <Marker 
            position={[52.5200, 13.4050]} 
            icon={easterEggIcon}
            eventHandlers={{ click: handleClick }}
        >
            <Popup>
                <div>
                    <h2>Osterei gefunden!</h2>
                    <p>Du hast ein Osterei gefunden! Frohe Ostern!</p>
                </div>
            </Popup>
        </Marker>
    );
};

const EasterBunny = () => {
  const [showBunny, setShowBunny] = useState(false);
  const [bunnyPosition, setBunnyPosition] = useState({});
  const [bunnySide, setBunnySide] = useState('left');

  useEffect(() => {
    if (isSpecialTime() !== 'easter') {
      return;
    }

    const interval = setInterval(() => {
      if (Math.random() < 0.3) { 
        setShowBunny(true);
        const side = Math.floor(Math.random() * 4);
        let pos = {};
        let sideName = 'left';
        switch (side) {
          case 0: // top
            pos = { top: '30px', left: `${Math.random() * 100}%` };
            sideName = 'top';
            break;
          case 1: // right
            pos = { top: `${Math.random() * 100}%`, right: '30px' };
            sideName = 'right';
            break;
          case 2: // bottom
            pos = { bottom: '50px', left: `${Math.random() * 100}%` };
            sideName = 'bottom';
            break;
          case 3: // left
          default:
            pos = { top: `${Math.random() * 100}%`, left: '30px' };
            sideName = 'left';
            break;
        }
        setBunnyPosition(pos);
        setBunnySide(sideName);

        setTimeout(() => {
          setShowBunny(false);
        }, 10000); 
      }
    }, 15000); 

    return () => clearInterval(interval);
  }, []);

  const handleBunnyClick = () => {
    setShowBunny(false);
    alert("Frohe Ostern! Ich habe ein paar Eier versteckt. Kannst du sie finden?");
  };

  if (!showBunny) {
    return null;
  }

  return (
    <div
      className={`easter-bunny bunny-from-${bunnySide}`}
      style={{
        position: 'absolute',
        zIndex: 1001,
        cursor: 'pointer',
        ...bunnyPosition
      }}
      onClick={handleBunnyClick}
      title="Psst... Klick mich!"
    >
      <img src="/assets/easter-bunny.png" alt="Easter Bunny" style={{ width: '120px', height: '120px' }}/>
    </div>
  );
};

export default EasterBunny;
