import React, { useState } from "react";
import styled from "styled-components";
import Rating from "./Rating";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";

const CheckinCard = ({ checkin, onEdit }) => {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const { userId } = useUser();

    return (
        <>
            <Card>
                <ContentWrapper>
                    <LeftContent>
                        <strong><CleanLink to={`/user/${checkin.nutzer_id}`}>{checkin.nutzer_name}</CleanLink></strong> hat am{" "}{new Date(checkin.datum).toLocaleDateString()}{" "}
                         bei <strong>{checkin.eisdiele_name}</strong> eingecheckt. <TypText>(Typ: {checkin.typ})</TypText><br /><br />

                        <AttributeSection>
                        <strong>Sorten:</strong>
                            {checkin.eissorten.map((sorte, index) => (
                                <AttributeBadge key={index}>{sorte}</AttributeBadge>
                            ))}
                        </AttributeSection>

                        <Table>
                            <tr>
                                <th>Geschmack:</th>
                                <td>
                                    <Rating stars={checkin.geschmackbewertung} />{" "}
                                    <strong>{checkin.geschmackbewertung}</strong>
                                </td>
                            </tr>
                            <tr>
                                <th>Waffel:</th>
                                <td>
                                    <Rating stars={checkin.waffelbewertung} />{" "}
                                    <strong>{checkin.waffelbewertung}</strong>
                                </td>
                            </tr>
                            <tr>
                                <th>Größe:</th>
                                <td>
                                    <Rating stars={checkin.größenbewertung} />{" "}
                                    <strong>{checkin.größenbewertung}</strong>
                                </td>
                            </tr>
                        </Table>

                        {checkin.kommentar && <p>{checkin.kommentar}</p>}
                        {parseInt(checkin.nutzer_id, 10) === parseInt(userId, 10) && (
                            <></>// <EditButton onClick={() => onEdit(checkin.id)}>Bearbeiten</EditButton>
                        )}
                    </LeftContent>

                    {checkin.bild_url && (
                        <RightContent>
                            <Thumbnail
                                src={`https://ice-app.de/${checkin.bild_url}`}
                                alt="Checkin Bild"
                                onClick={() => setLightboxOpen(true)}
                            />
                        </RightContent>
                    )}
                </ContentWrapper>
            </Card>

            {lightboxOpen && (
                <LightboxOverlay onClick={() => setLightboxOpen(false)}>
                    <LightboxContent onClick={(e) => e.stopPropagation()}>
                        <LightboxImage
                            src={`https://ice-app.de/${checkin.bild_url}`}
                            alt="Checkin Bild"
                        />
                        <LightboxTitle>
                        {checkin.eissorten.join(", ")} Eis bei {checkin.eisdiele_name}
                        </LightboxTitle>
                    </LightboxContent>
                </LightboxOverlay>
            )}
        </>
    );
};

export default CheckinCard;

// ---------- Styled Components ----------

const CleanLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`;

const Card = styled.div`
  background: #f9f9f9;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const ContentWrapper = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
`;

const LeftContent = styled.div`
  flex: 1 1 300px;
  min-width: 250px;
`;

const RightContent = styled.div`
  flex: 0 0 auto;
`;

const Table = styled.table`
  border-spacing: 0.5rem 0.25rem;
  margin-top: 1rem;
  margin-bottom: 1rem;

  th {
    text-align: left;
    vertical-align: top;
    white-space: nowrap;
    color: #555;
    font-weight: normal;
    padding-right: 0.5rem;
  }

  td {
    vertical-align: top;
  }
`;

const Thumbnail = styled.img`
  max-width: 150px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: scale(1.05);
  }
`;

const AttributeSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const AttributeBadge = styled.span`
  background-color: #e0f3ff;
  color: #0077b6;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const TypText = styled.em`
  font-size: 0.85rem;
  color: #777;
`;

const EditButton = styled.button`
  background-color: #0077b6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-top: 1rem;

  &:hover {
    background-color: #005f8a;
  }
`;

// ---------- Lightbox ----------

const LightboxOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
`;

const LightboxContent = styled.div`
  max-width: 90%;
  max-height: 90%;
  text-align: center;
`;

const LightboxImage = styled.img`
  max-width: 100%;
  max-height: 80vh;
  border-radius: 8px;
`;

const LightboxTitle = styled.div`
  color: white;
  margin-top: 1rem;
  font-size: 1rem;
  font-weight: bold;
`;

