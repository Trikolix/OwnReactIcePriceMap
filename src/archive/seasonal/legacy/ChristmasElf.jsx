import React, { useState, useEffect } from 'react';
import L from 'leaflet';
import { Marker, Popup, useMap } from 'react-leaflet';

import { isSpecialTime } from '../utils/seasonal';

export const secretWorkshopIcon = new L.Icon({
    iconUrl: '/assets/santa-workshop.png',
    iconSize: [70,70],
    iconAnchor: [35, 70],
    popupAnchor: [0, -70],
});

export const SecretWorkshopMarker = ({ isLoggedIn, setShowLoginModal }) => {
    if (isSpecialTime() !== 'christmas') {
        return null;
    }

    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const CHRISTMAS_AWARD_ID = 1; // Specific award ID for Christmas

    const handleClick = () => {
        if (!isLoggedIn) {
            setShowLoginModal(true);
            return;
        }

        const formData = new URLSearchParams();
        formData.append('award_id', CHRISTMAS_AWARD_ID);

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
            position={[78.223566, 15.65355993]} 
            icon={secretWorkshopIcon}
            eventHandlers={{ click: handleClick }}
        >
            <Popup>
                <div>
                    <h2>Geheime Eis-Werkstatt des Weihnachtsmanns</h2>
                    <p>Du hast sie gefunden! Frohe Weihnachten!</p>
                </div>
            </Popup>
        </Marker>
    );
};


const ChristmasElf = () => {
  const [showElf, setShowElf] = useState(false);
  const [elfPosition, setElfPosition] = useState({});
  const [elfSide, setElfSide] = useState('left');

  useEffect(() => {
    if (isSpecialTime() !== 'christmas') {
      return;
    }

    const interval = setInterval(() => {
      if (Math.random() < 0.3) { 
        setShowElf(true);
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
        setElfPosition(pos);
        setElfSide(sideName);

        setTimeout(() => {
          setShowElf(false);
        }, 10000); 
      }
    }, 15000); 

    return () => clearInterval(interval);
  }, []);

  const handleElfClick = () => {
    setShowElf(false);
    alert("Hilf mir, die Eis-Werkstatt des Weihnachtsmanns zu finden! Sie ist irgendwo in der Arktis versteckt.");
  };

  if (!showElf) {
    return null;
  }

  return (
    <div
      className={`christmas-elf elf-from-${elfSide}`}
      style={{
        position: 'absolute',
        zIndex: 1001,
        cursor: 'pointer',
        ...elfPosition
      }}
      onClick={handleElfClick}
      title="Psst... Klick mich!"
    >
      <img src="/assets/christmas_elf.png" alt="Christmas Elf" style={{ width: '80px', height: '80px' }}/>
    </div>
  );
};

export default ChristmasElf;
