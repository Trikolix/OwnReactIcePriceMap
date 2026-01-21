import React, { useState } from "react";
import styled from "styled-components";
import jerseyImage from './jersey.png';

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
  max-width: 800px;
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

export default function JerseyInfoDialog({ showImageOnly = false, linkOnly = false }) {
  const [open, setOpen] = useState(false);

  // Bild als Thumbnail, öffnet Modal bei Klick
  if (showImageOnly) {
    return (
      <JerseyImage
        src={jerseyImage}
        alt="Radtrikot"
        style={{ maxWidth: 120, cursor: 'pointer', marginBottom: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}
        onClick={() => setOpen(true)}
        title="Bild vergrößern"
      />
      // Modal folgt unten
      // ...
      // Modal wird unterhalb gerendert, wenn open==true
      // (siehe unten)
      // Modal-Rendering folgt nach allen returns
    );
  }

  // Nur Link anzeigen (z.B. unterhalb der Checkbox)
  if (linkOnly) {
    return (
      <>
        <LinkButton type="button" onClick={() => setOpen(true)}>
          Größentabelle & Infos anzeigen
        </LinkButton>
        {open && (
          <Overlay onClick={() => setOpen(false)}>
            <Modal onClick={e => e.stopPropagation()}>
              <ModalHeader>Exklusives Eisdielen Tour Radtrikot</ModalHeader>
              <ModalContent>
                <JerseyImage src={jerseyImage} alt="Radtrikot" />
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

  // Standard: Link wie bisher (zurückkompatibel)
  return (
    <>
      <LinkButton type="button" onClick={() => setOpen(true)}>
        exklusives Radtrikot bestellen (69€)
      </LinkButton>
      {/* Modal folgt unten */}
      {open && (
        <Overlay onClick={() => setOpen(false)}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalHeader>Exklusives Eisdielen Tour Radtrikot</ModalHeader>
            <ModalContent>
              <JerseyImage src={jerseyImage} alt="Radtrikot" />
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

  // Modal für showImageOnly und linkOnly
  // (wird außerhalb der returns gerendert, damit Modal immer angezeigt wird, wenn open==true)
}
