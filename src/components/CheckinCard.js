import React, { useState } from "react";
import styled from "styled-components";
import Rating from "./Rating";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import CheckinForm from "../CheckinForm";
import ImageGalleryWithLightbox from './ImageGalleryWithLightbox';

const CheckinCard = ({ checkin, onSuccess }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const { userId } = useUser();

  const handleEditClick = () => {
    setShowEditModal(true);
  };


  return (
    <>
      {console.log('checkincard', checkin)}
      <Card>
        <ContentWrapper>
          <LeftContent>
            <strong><CleanLink to={`/user/${checkin.nutzer_id}`}>{checkin.nutzer_name}</CleanLink></strong> hat am{" "}{new Date(checkin.datum).toLocaleDateString()}{" "}
            bei <strong><CleanLink to={`/map/activeShop/${checkin.eisdiele_id}`}>{checkin.eisdiele_name}</CleanLink></strong> eingecheckt. <TypText>(Typ: {checkin.typ})</TypText><br /><br />

            <AttributeSection>
              <strong>Sorten:</strong>
              {checkin.eissorten.map((sorte, index) => (
                <AttributeBadge key={index}>{sorte.sortenname} ({sorte.bewertung}&#9733;)</AttributeBadge>
              ))}
            </AttributeSection>

            <Table>
              {checkin.geschmackbewertung !== null && (<tr>
                <th>Geschmack:</th>
                <td>
                  <Rating stars={checkin.geschmackbewertung} />{" "}
                  <strong>{checkin.geschmackbewertung}</strong>
                </td>
              </tr>)}
              {checkin.größenbewertung !== null && checkin.typ === "Kugel" && (<tr>
                <th>Größe:</th>
                <td>
                  <Rating stars={checkin.größenbewertung} />{" "}
                  <strong>{checkin.größenbewertung}</strong>
                </td>
              </tr>)}
              {checkin.preisleistungsbewertung !== null && (<tr>
                <th>Preis-Leistung:</th>
                <td>
                  <Rating stars={checkin.preisleistungsbewertung} />{" "}
                  <strong>{checkin.preisleistungsbewertung}</strong>
                </td>
              </tr>)}
              {checkin.waffelbewertung !== null && (<tr>
                <th>Waffel:</th>
                <td>
                  <Rating stars={checkin.waffelbewertung} />{" "}
                  <strong>{checkin.waffelbewertung}</strong>
                </td>
              </tr>)}
            </Table>

            {checkin.kommentar && <p style={{ whiteSpace: 'pre-wrap' }}>{checkin.kommentar}</p>}
            {parseInt(checkin.nutzer_id, 10) === parseInt(userId, 10) && (
              <EditButton onClick={handleEditClick}>Bearbeiten</EditButton>
            )}
          </LeftContent>
          <RightContent>
            <ImageGalleryWithLightbox
              images={checkin.bilder.map(b => ({
                url: `https://ice-app.de/${b.url}`,
                beschreibung: b.beschreibung
              }))}
              fallbackTitle={`${checkin.eissorten.map(s => s.sortenname).join(', ')} Eis bei ${checkin.eisdiele_name}`}
            />
          </RightContent>
        </ContentWrapper>
      </Card>



      {showEditModal && (
        <CheckinForm
          checkinId={checkin.id}
          shopId={checkin.eisdiele_id}
          shopName={checkin.eisdiele_name}
          userId={userId}
          showCheckinForm={showEditModal}
          setShowCheckinForm={setShowEditModal}
          onSuccess={onSuccess}
        />
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
  display: flex;
  overflow-x: auto;
  gap: 8px;
  padding-bottom: 8px;
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