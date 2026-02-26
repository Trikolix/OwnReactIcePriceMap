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
`;

export default function LiabilityWaiver() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <LinkButton type="button" onClick={() => setOpen(true)}>
                Teilnahmebedingungen
            </LinkButton>
            {open && (
                <Overlay onClick={() => setOpen(false)}>
                    <Modal onClick={e => e.stopPropagation()}>
                        <ModalHeader>Haftungsfreistellung & Teilnahmebedingungen</ModalHeader>
                        <ModalContent>
                            <p>
                                Ich, der/die Teilnehmer/in, bestätige hiermit, dass ich an der
                                Eisdielen Tour auf eigene Gefahr, eigene Rechnung und eigenes Risiko
                                teilnehme.
                            </p>
                            <h4 style={{ fontWeight: 600, marginTop: 18 }}>1. Haftungsausschluss</h4>
                            <p>
                                Der Veranstalter, seine Vertreter und Helfer haften nicht für
                                Schäden jeglicher Art, die durch die Teilnahme an der Veranstaltung
                                entstehen, es sei denn, sie beruhen auf Vorsatz oder grober
                                Fahrlässigkeit. Dies gilt für Personen-, Sach- und Vermögensschäden.
                                Ausgenommen von diesem Haftungsausschluss sind Schäden aus der
                                Verletzung des Lebens, des Körpers oder der Gesundheit, die auf einer
                                fahrlässigen Pflichtverletzung des Veranstalters oder einer
                                vorsätzlichen oder fahrlässigen Pflichtverletzung eines gesetzlichen
                                Vertreters oder Erfüllungsgehilfen des Veranstalters beruhen.
                            </p>
                            <h4 style={{ fontWeight: 600, marginTop: 18 }}>2. Verkehrsregeln</h4>
                            <p>
                                Ich bestätige, dass ich mich während der gesamten Veranstaltung an die
                                geltende Straßenverkehrsordnung (StVO) halten werde. Die Strecke ist
                                nicht für den öffentlichen Verkehr gesperrt. Ich fahre auf eigenes
                                Risiko und nehme Rücksicht auf andere Verkehrsteilnehmer.
                            </p>
                            <h4 style={{ fontWeight: 600, marginTop: 18 }}>3. Kein Renncharakter</h4>
                            <p>
                                Die Eisdielen Tour ist ausdrücklich kein Rennen, sondern eine
                                Radtouristikfahrt (RTF). Es geht um den gemeinsamen Spaß am Radfahren
                                und nicht um das Erreichen von Höchstgeschwindigkeiten. Ich verpflichte
                                mich, auf Wettkampfverhalten zu verzichten.
                            </p>
                            <h4 style={{ fontWeight: 600, marginTop: 18 }}>4. Fairer und respektvoller Umgang</h4>
                            <p>
                                Ich verpflichte mich zu einem fairen, respektvollen und rücksichtsvollen
                                Umgang mit anderen Teilnehmern, Organisatoren, Helfern und
                                Verkehrsteilnehmern.
                            </p>
                            <h4 style={{ fontWeight: 600, marginTop: 18 }}>5. Ausrüstung</h4>
                            <p>
                                Ich bestätige, dass mein Fahrrad in einem verkehrssicheren Zustand ist.
                                Das Tragen eines Helms ist während der gesamten Fahrt Pflicht.
                            </p>
                            <h4 style={{ fontWeight: 600, marginTop: 18 }}>6. Gesundheitlicher Zustand</h4>
                            <p>
                                Ich erkläre, dass ich körperlich gesund bin und mein
                                Gesundheitszustand die Teilnahme an der Veranstaltung zulässt. Ich habe
                                mich ausreichend auf die Belastung vorbereitet.
                            </p>
                            <h4 style={{ fontWeight: 600, marginTop: 18 }}>7. Foto- und Veröffentlichungsrechte</h4>
                            <p>
                                Ich erkläre mich damit einverstanden, dass während der Veranstaltung Fotos und
                                Videoaufnahmen von mir angefertigt werden dürfen. Diese Aufnahmen dürfen vom
                                Veranstalter für die Berichterstattung, Öffentlichkeitsarbeit und zu Werbezwecken
                                (z.B. Website, Social Media, Presse) unentgeltlich verwendet und veröffentlicht werden.
                                Sollte ich nach der Veranstaltung mit der Veröffentlichung bestimmter Bilder nicht
                                einverstanden sein, kann ich mich jederzeit an den Veranstalter wenden, um eine Löschung
                                oder Unkenntlichmachung der betreffenden Aufnahmen zu veranlassen.
                            </p>
                            <p>
                                Mit der Akzeptanz dieser Bedingungen bestätige ich, die
                                Haftungsfreistellung vollständig gelesen und verstanden zu haben und
                                erkenne sie als verbindlich an.
                            </p>
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
