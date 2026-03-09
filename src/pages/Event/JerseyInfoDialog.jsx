import React, { useState } from "react";
import styled from "styled-components";
import jerseyImage from "./jersey.png";

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Modal = styled.div`
  background: #fffdfa;
  border-radius: 12px;
  box-shadow: 0 4px 32px rgba(0, 0, 0, 0.18);
  max-width: 980px;
  width: 95vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  padding: 2rem 1.5rem 1.5rem;
  position: relative;
`;

const ModalHeader = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 1.2rem;
`;

const ModalContent = styled.div`
  overflow-y: auto;
  color: #6b5b2b;
  font-size: 1rem;
  margin-bottom: 1.5rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const CloseButton = styled.button`
  background: #ffb522;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.5em 1.2em;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
`;

const LinkButton = styled.button`
  background: none;
  border: none;
  color: #ffb522;
  text-decoration: underline;
  font-size: 1em;
  cursor: pointer;
  padding: 0;
  display: inline;
  text-align: left;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.2rem;
`;

const Th = styled.th`
  text-align: left;
  padding: 0.4em 0.6em;
  background: #fff3c2;
  color: #b48a2c;
  font-weight: 600;
`;

const Td = styled.td`
  padding: 0.4em 0.6em;
  border-bottom: 1px solid #ffe6a1;
`;

const PreviewGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
  @media (min-width: 860px) {
    grid-template-columns: 1.2fr 1fr;
  }
`;

const JerseyImage = styled.img`
  width: 100%;
  max-width: 520px;
  border-radius: 10px;
  display: block;
`;

const BibGrid = styled.div`
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
`;

const Placeholder = styled.div`
  min-height: 140px;
  border: 1px dashed #d5b870;
  border-radius: 10px;
  background: linear-gradient(135deg, #fff8e7 0%, #fff2c7 100%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0.8rem;
  font-weight: 700;
  color: #8a5700;
  text-align: center;
`;

const SectionTitle = styled.h3`
  margin: 0 0 0.7rem;
`;

const jerseySizeChart = [
  { size: 2, intl: "XS", men: 42, women: 36, chest: "82-86" },
  { size: 3, intl: "S", men: 44, women: 38, chest: "86-90" },
  { size: 4, intl: "S", men: 46, women: 40, chest: "90-94" },
  { size: 5, intl: "M", men: 48, women: 42, chest: "94-98" },
  { size: 6, intl: "M", men: 50, women: 44, chest: "98-102" },
  { size: 7, intl: "L", men: 52, women: 46, chest: "102-106" },
  { size: 8, intl: "L", men: 54, women: 46, chest: "106-110" },
  { size: 9, intl: "XL", men: 56, women: 48, chest: "110-114" },
  { size: 10, intl: "XL", men: 58, women: 50, chest: "114-118" },
  { size: 11, intl: "XXL", men: 60, women: 52, chest: "118-122" },
  { size: 12, intl: "XXL", men: 62, women: "", chest: "122-126" },
  { size: 14, intl: "3XL", men: 66, women: "", chest: "126-134" },
];

const bibSizeChart = [
  { size: 2, men: 42, hips: "86-90" },
  { size: 3, men: 44, hips: "90-94" },
  { size: 4, men: 46, hips: "94-98" },
  { size: 5, men: 48, hips: "98-102" },
  { size: 6, men: 50, hips: "102-106" },
  { size: 7, men: 52, hips: "106-110" },
  { size: 8, men: 54, hips: "110-114" },
  { size: 9, men: 56, hips: "114-118" },
  { size: 10, men: 58, hips: "118-122" },
  { size: 11, men: 60, hips: "122-126" },
  { size: 12, men: 62, hips: "126-130" },
];

function KitInfoModal({ onClose }) {
  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(event) => event.stopPropagation()}>
        <ModalHeader>Bekleidungsinfos: Trikot und Set</ModalHeader>
        <ModalContent>
          <PreviewGrid>
            <div>
              <SectionTitle>Trikot</SectionTitle>
              <JerseyImage src={jerseyImage} alt="Radtrikot" />
            </div>
            <div>
              <SectionTitle>Hose / Bib-Shorts</SectionTitle>
              <BibGrid>
                <Placeholder>Hose vorne</Placeholder>
                <Placeholder>Hose Seite</Placeholder>
                <Placeholder>Hose Rückseite</Placeholder>
              </BibGrid>
            </div>
          </PreviewGrid>

          <SectionTitle>Größentabelle Trikot</SectionTitle>
          <Table>
            <thead>
              <tr>
                <Th>Größe</Th>
                <Th>Internationale Größe</Th>
                <Th>Konfektionsgröße Herren</Th>
                <Th>Konfektionsgröße Damen</Th>
                <Th>Brustumfang (cm)</Th>
              </tr>
            </thead>
            <tbody>
              {jerseySizeChart.map((row) => (
                <tr key={`jersey-${row.size}`}>
                  <Td>{row.size}</Td>
                  <Td>{row.intl}</Td>
                  <Td>{row.men}</Td>
                  <Td>{row.women}</Td>
                  <Td>{row.chest}</Td>
                </tr>
              ))}
            </tbody>
          </Table>

          <SectionTitle>Größentabelle Hose</SectionTitle>
          <Table>
            <thead>
              <tr>
                <Th>Größe bei owayo</Th>
                <Th>Konfektionsgröße Herren</Th>
                <Th>Hüftumfang (B) in cm</Th>
              </tr>
            </thead>
            <tbody>
              {bibSizeChart.map((row) => (
                <tr key={`bib-${row.size}`}>
                  <Td>{row.size}</Td>
                  <Td>{row.men}</Td>
                  <Td>{row.hips}</Td>
                </tr>
              ))}
            </tbody>
          </Table>

          <SectionTitle>Bestell- und Lieferinfos</SectionTitle>
          <ul style={{ margin: "0.5em 0 0 1.2em", color: "#6b5b2b", fontSize: "0.98em" }}>
            <li>Das Trikot hat einen Richtpreis von ca. 75 EUR.</li>
            <li>Das Set aus Trikot und Hose hat einen Richtpreis von ca. 175 EUR.</li>
            <li>In der Registrierung wird zunächst nur Interesse erfasst, keine verbindliche Bestellung.</li>
            <li>Die finale Bestellung erfolgt gesammelt zu einem späteren Zeitpunkt.</li>
          </ul>
        </ModalContent>
        <ModalFooter>
          <CloseButton type="button" onClick={onClose}>
            Schließen
          </CloseButton>
        </ModalFooter>
      </Modal>
    </Overlay>
  );
}

export default function JerseyInfoDialog({ linkOnly = false }) {
  const [open, setOpen] = useState(false);

  if (linkOnly) {
    return (
      <>
        <LinkButton type="button" onClick={() => setOpen(true)}>
          Größen, Bilder und Set-Infos anzeigen
        </LinkButton>
        {open && <KitInfoModal onClose={() => setOpen(false)} />}
      </>
    );
  }

  return (
    <>
      <LinkButton type="button" onClick={() => setOpen(true)}>
        Bekleidungsinfos anzeigen
      </LinkButton>
      {open && <KitInfoModal onClose={() => setOpen(false)} />}
    </>
  );
}
