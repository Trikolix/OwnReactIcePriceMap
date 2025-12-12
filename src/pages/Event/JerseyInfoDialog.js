import React, { useState } from "react";
import styled from "styled-components";

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const Modal = styled.div`
  background: #fffdfa;
  border-radius: 12px;
  box-shadow: 0 4px 32px rgba(0,0,0,0.18);
  max-width: 600px;
  width: 95vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  position: relative;
`;
const ModalHeader = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 1.2rem;
`;
const ModalContent = styled.div`
  overflow-y: auto;
  max-height: 50vh;
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
  transition: background 0.2s;
  &:hover {
    background: #ffcb47;
  }
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
const JerseyImage = styled.img`
  width: 100%;
  max-width: 500px;
  border-radius: 10px;
  margin: 0 auto 1.5rem auto;
  display: block;
`;

const sizeChart = [
  { size: 2, internationaleGroesse: "XS", konfektionsgroesseHerren: 42, konfektionsgroesseDamen: 36, brustumfangCm: "82-86" },
  { size: 3, internationaleGroesse: "S", konfektionsgroesseHerren: 44, konfektionsgroesseDamen: 38, brustumfangCm: "86-90" },
  { size: 4, internationaleGroesse: "S", konfektionsgroesseHerren: 46, konfektionsgroesseDamen: 40, brustumfangCm: "90-94" },
  { size: 5, internationaleGroesse: "M", konfektionsgroesseHerren: 48, konfektionsgroesseDamen: 42, brustumfangCm: "94-98" },
  { size: 6, internationaleGroesse: "M", konfektionsgroesseHerren: 50, konfektionsgroesseDamen: 44, brustumfangCm: "98-102" },
  { size: 7, internationaleGroesse: "L", konfektionsgroesseHerren: 52, konfektionsgroesseDamen: 46, brustumfangCm: "102-106" },
  { size: 8, internationaleGroesse: "L", konfektionsgroesseHerren: 54, konfektionsgroesseDamen: 46, brustumfangCm: "106-110" },
  { size: 9, internationaleGroesse: "XL", konfektionsgroesseHerren: 56, konfektionsgroesseDamen: 48, brustumfangCm: "110-114" },
  { size: 10, internationaleGroesse: "XL", konfektionsgroesseHerren: 58, konfektionsgroesseDamen: 50, brustumfangCm: "114-118" },
  { size: 11, internationaleGroesse: "XXL", konfektionsgroesseHerren: 60, konfektionsgroesseDamen:52, brustumfangCm: "118-122" },
  { size: 12, internationaleGroesse: "XXL", konfektionsgroesseHerren: 62, konfektionsgroesseDamen: "", brustumfangCm: "122-126" },
  { size: 14, internationaleGroesse: "3XL", konfektionsgroesseHerren: 66, konfektionsgroesseDamen: "", brustumfangCm: "126 -134" },
];

export default function JerseyInfoDialog() {
  const [open, setOpen] = useState(false);
  // Dummy image, replace with real one if available
  const jerseyImageUrl = "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=600&q=80";
  return (
    <>
      <LinkButton type="button" onClick={() => setOpen(true)}>
        exklusives Radtrikot bestellen (€69/Stk.)
      </LinkButton>
      {open && (
        <Overlay onClick={() => setOpen(false)}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalHeader>Exklusives Eisdielen Tour Radtrikot</ModalHeader>
            <ModalContent>
              <JerseyImage src={jerseyImageUrl} alt="Radtrikot" />
              <div style={{ marginBottom: 18 }}>
                <strong>Größentabelle</strong>
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
                    {sizeChart.map(row => (
                      <tr key={row.size}>
                        <Td>{row.size}</Td>
                        <Td>{row.internationaleGroesse}</Td>
                        <Td>{row.konfektionsgroesseHerren}</Td>
                        <Td>{row.konfektionsgroesseDamen}</Td>
                        <Td>{row.brustumfangCm}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div>
                <strong>Bestell- & Lieferinformationen</strong>
                <ul style={{ margin: '0.5em 0 0 1.2em', color: '#6b5b2b', fontSize: '0.98em' }}>
                  <li>Die Bestellungen werden gesammelt und die Produktion startet ca. 4 Wochen vor der Veranstaltung.</li>
                  <li>Die Trikots sind spätestens 1 Woche vor dem Event fertig.</li>
                  <li><strong>Abholung/Lieferung:</strong>
                    <ul style={{ margin: '0.3em 0 0 1.2em' }}>
                      <li>Kostenlose Abholung in Chemnitz.</li>
                      <li>Kostenlose Lieferung im 15km-Umkreis von Chemnitz.</li>
                      <li>Alternative Ausgabe am Eventtag vor Ort.</li>
                    </ul>
                  </li>
                </ul>
              </div>
            </ModalContent>
            <ModalFooter>
              <CloseButton type="button" onClick={() => setOpen(false)}>
                Schließen
              </CloseButton>
            </ModalFooter>
          </Modal>
        </Overlay>
      )}
    </>
  );
}
