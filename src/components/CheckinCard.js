import React, { useState, forwardRef, useEffect } from "react";
import styled from "styled-components";
import Rating from "./Rating";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import CheckinForm from "../CheckinForm";
import ImageGalleryWithLightbox from './ImageGalleryWithLightbox';
import CommentSection from "./CommentSection";

const CheckinCard = forwardRef(({ checkin, onSuccess, showComments = false }, ref) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const { userId } = useUser();
  const [areCommentsVisible, setAreCommentsVisible] = useState(showComments);

  useEffect(() => {
    if (showComments) {
      setAreCommentsVisible(true);
    }
  }, [showComments]);

  const anreiseIcons = {
    Fahrrad: "🚲",
    Motorrad: "🏍️",
    "Zu Fuß": "🚶",
    Auto: "🚗",
    Sonstiges: "❓"
  };

  const handleEditClick = () => {
    setShowEditModal(true);
  };


  return (
    <>
      <Card ref={ref}>
        <DateText dateTime={checkin.datum}>
          {new Date(checkin.datum).toLocaleDateString("de-DE", {
            day: "numeric",
            month: "long",
            year: "numeric", 
            hour: "numeric",
            minute: "numeric",
          })}
        </DateText>
        <ContentWrapper>
          <LeftContent>
            <strong><CleanLink to={`/user/${checkin.nutzer_id}`}>{checkin.nutzer_name}</CleanLink></strong> hat
            bei <strong><CleanLink to={`/map/activeShop/${checkin.eisdiele_id}`}>{checkin.eisdiele_name}</CleanLink></strong> eingecheckt. <TypText>(Typ: {checkin.typ})</TypText><br /><br />

            {checkin.eissorten && checkin.eissorten.length > 0 && (
              <AttributeSection>
                <strong>Sorten:</strong>
                {checkin.eissorten.map((sorte, index) => (
                  <AttributeBadge key={index}>
                    {sorte.sortenname} ({sorte.bewertung}&#9733;)
                  </AttributeBadge>
                ))}
              </AttributeSection>
            )}

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
            {(checkin.anreise && checkin.anreise !== "" || checkin.is_on_site !== 0) && (
              <ArrivalInfo>
                {checkin.anreise && checkin.anreise !== "" && (
                <ArrivalBadge>{anreiseIcons[checkin.anreise] || "📍"} Anreise: <strong>{checkin.anreise}</strong></ArrivalBadge>) }
                {checkin.is_on_site !== 0 && (<OnSiteBadge>📍 Vor Ort eingecheckt</OnSiteBadge>)}
              </ArrivalInfo>
            )}

            {checkin.kommentar && <p style={{ whiteSpace: 'pre-wrap' }}>{checkin.kommentar}</p>}
            {Number(checkin.nutzer_id) === Number(userId) && (
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
        <CommentToggle
          title={areCommentsVisible ? "Kommentare ausblenden" : "Kommentare einblenden"}
          onClick={() => setAreCommentsVisible(!areCommentsVisible)}
        >
          💬 {checkin.commentCount || 0} Kommentar(e)
        </CommentToggle>
        {areCommentsVisible && <CommentSection checkinId={checkin.id} />}
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
});

export default CheckinCard;

// ---------- Styled Components ----------

const CleanLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`;

const Card = styled.div`
  position: relative;
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s;

  &:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
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
  border-collapse: collapse;
  margin: 1rem 0;

  th, td {
    padding: 0.4rem 0.5rem;
    text-align: left;
  }

  th {
    color: #666;
    font-weight: 500;
    width: 90px;
  }

  td {
    font-weight: 500;
  }

  tr:not(:last-child) {
    border-bottom: 1px solid #eee;
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
  align-self: flex-start;
  background-color: #339af0;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #228be6;
  }
`;

const ArrivalInfo = styled.div`
  margin: 1rem 0;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
`;

const ArrivalBadge = styled.div`
  display: inline-block;
  background-color: #ffe5b4;
  color: #8a4f00;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 500;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
`;

const OnSiteBadge = styled.div`
  display: inline-block;
  background-color: #ffb4b4ff;
  color: #8a0000ff;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 500;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
`;

const DateText = styled.time`
  position: absolute;
  top: 1rem;
  right: 1.5rem;
  font-size: 0.85rem;
  color: #777;
  font-style: italic;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const CommentToggle = styled.button`
  margin-top: 0.5rem;
  background: transparent;
  border: none;
  color: #339af0;
  cursor: pointer;
  font-weight: bold;
  padding: 0.25rem 0;
  text-align: left;

  &:hover {
    text-decoration: underline;
  }
`;