import React, { useState } from "react";
import styled from "styled-components";

export default function SorteAutocomplete({ value, onChange, alleSorten }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  function normalizeSorteName(name) {
    return name
      .toLowerCase()                              // kleinbuchstaben
      .replace(/[\/\-–—]/g, " ")                  // Bindestriche, Slashes etc. zu Leerzeichen
      .replace(/\s+/g, " ")                       // mehrfache Leerzeichen vereinfachen
      .trim()                                     // trimmen
      .split(" ")                                 // in einzelne Worte aufteilen
      .sort()                                     // alphabetisch sortieren
      .join(" ");                                 // wieder zusammenfügen
  }

  const vorschlaegeEinmalig = Array.from(
    new Map(alleSorten.map(v => [normalizeSorteName(v), v])).values()
  );

  // Filter Vorschläge, max 5
  const filteredSorten = vorschlaegeEinmalig
    .filter((s) => s.toLowerCase().includes(inputValue.toLowerCase()))
    .slice(0, 10);

  function handleInputChange(e) {
    setInputValue(e.target.value);
    onChange(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  }

  function handleSelect(sorte) {
    setInputValue(sorte);
    onChange(sorte);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }

  function handleKeyDown(e) {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredSorten.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0) {
        handleSelect(filteredSorten[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div className="autocomplete-container" style={{ position: "relative" }}>
      <Input
        type="text"
        className="autocomplete-input"
        placeholder="Sortenname"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {isOpen && filteredSorten.length > 0 && (
        <ul
          className="autocomplete-suggestions"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid #ccc",
            borderTop: "none",
            maxHeight: "150px",
            overflowY: "auto",
            margin: 0,
            padding: 0,
            listStyle: "none",
            zIndex: 10,
          }}
        >
          {filteredSorten.map((sorte, index) => (
            <li
              key={index}
              onMouseDown={() => handleSelect(sorte)}
              style={{
                padding: "8px 12px",
                backgroundColor:
                  index === highlightedIndex ? "#eee" : "transparent",
                cursor: "pointer",
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {sorte}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const Input = styled.input`
  width: 95%;
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #ccc;
`;