import { useState, useEffect } from "react";

export default function BewertungForm({ eisdieleId, userId }) {
  const [eisdiele, setEisdiele] = useState(null);
  const [geschmack, setGeschmack] = useState(3.0);
  const [kugelgroesse, setKugelgroesse] = useState(3.0);
  const [eiswaffel, setEiswaffel] = useState(3.0);
  const [attribute, setAttribute] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [neuesAttribut, setNeuesAttribut] = useState("");
  const [preisBestaetigen, setPreisBestaetigen] = useState(false);
  const [preis, setPreis] = useState("");
  const [bilder, setBilder] = useState([]);
  const [bewertungText, setBewertungText] = useState("");

  useEffect(() => {
    fetch(`https://ice-app.4lima.de/backend/get_eisdiele.php?eisdiele_id=1`)
      .then((res) => res.json())
      .then((data) => setEisdiele(data.eisdiele));
    
    fetch(`https://ice-app.4lima.de/backend/get_attribute.php`)
      .then((res) => res.json())
      .then((data) => setAttribute(data.map(attr => attr.name)));
      console.log(eisdiele);
  }, [eisdieleId]);

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

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append("eisdieleId", eisdieleId);
    formData.append("userId", userId);
    formData.append("geschmack", geschmack);
    formData.append("kugelgroesse", kugelgroesse);
    formData.append("eiswaffel", eiswaffel);
    formData.append("attribute", JSON.stringify(selectedAttributes));
    formData.append("preisBestaetigen", preisBestaetigen);
    if (preisBestaetigen) formData.append("preis", preis);
    bilder.forEach((bild, index) => {
      formData.append(`bild_${index}`, bild.file);
      formData.append(`beschreibung_${index}`, bild.beschreibung);
    });

    fetch("/submit_bewertung.php", {
      method: "POST",
      body: formData,
    });
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Bewerte {eisdiele ? eisdiele.name : "Lädt..."}</h1>
      <div className="mb-4">
        <label className="block font-semibold">Geschmack (1.0 - 5.0):</label>
        <input type="range" min={1.0} max={5.0} step={0.1} value={geschmack} onChange={(e) => setGeschmack(parseFloat(e.target.value))} className="w-full" />
        <span>{geschmack}</span>
      </div>
      <div className="mb-4">
        <label className="block font-semibold">Kugelgröße (1.0 - 5.0):</label>
        <input type="range" min={1.0} max={5.0} step={0.1} value={kugelgroesse} onChange={(e) => setKugelgroesse(parseFloat(e.target.value))} className="w-full" />
        <span>{kugelgroesse}</span>
      </div>
      <div className="mb-4">
        <label className="block font-semibold">Eiswaffel (1.0 - 5.0):</label>
        <input type="range" min={1.0} max={5.0} step={0.1} value={eiswaffel} onChange={(e) => setEiswaffel(parseFloat(e.target.value))} className="w-full" />
        <span>{eiswaffel}</span>
      </div>
      <div className="mb-4">
        <label className="block font-semibold">Freitext-Bewertung:</label>
        <textarea
          value={bewertungText}
          onChange={(e) => setBewertungText(e.target.value)}
          className="w-full border p-2"
          placeholder="Schreibe deine Bewertung hier..."
        />
      </div>
      <div className="mb-4">
        <p className="font-semibold">Ausgewählte Attribute:</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedAttributes.map((attr) => (
            <span key={attr} className="px-3 py-1 bg-blue-500 text-white rounded-full cursor-pointer" onClick={() => handleAttributeRemove(attr)}>
              {attr} ×
            </span>
          ))}
        </div>
        <p className="font-semibold">Verfügbare Attribute:</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {attribute.map((attr) => (
            <span key={attr} className="px-3 py-1 bg-gray-300 rounded-full cursor-pointer" onClick={() => handleAttributeSelect(attr)}>
              {attr}
            </span>
          ))}
        </div>
        <div className="mt-2 flex space-x-2">
          <input value={neuesAttribut} onChange={(e) => setNeuesAttribut(e.target.value)} placeholder="Neues Attribut" className="border p-2 flex-1" />
          <button onClick={handleNewAttribute} className="bg-blue-500 text-white px-3 py-1 rounded">Hinzufügen</button>
        </div>
      </div>
      <button onClick={handleSubmit} className="bg-green-500 text-white px-4 py-2 rounded w-full">Bewertung absenden</button>
    </div>
  );
}

