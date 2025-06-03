import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { useUser } from "./../context/UserContext";

const ReviewCard = ({ review, setShowReviewForm }) => {
  const { userId } = useUser();

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("de-DE");

  return (
    <Card>
      <DateText dateTime={review.erstellt_am}>
          {new Date(review.erstellt_am).toLocaleDateString("de-DE", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </DateText>
      <Header>
        <strong><CleanLink to={`/user/${review.nutzer_id}`}>{review.nutzer_name}</CleanLink></strong> hat{" "}
        <strong><CleanLink to={`/map/activeShop/${review.eisdiele_id}`}>{review.eisdiele_name}</CleanLink></strong> bewertet.{" "}
      </Header>

      <Table>
        {review.auswahl !== null && (
          <tr>
            <th>Auswahl:</th>
            <td>
              ~<strong>{review.auswahl}</strong> Sorten
            </td>
          </tr>
        )}
      </Table>

      {review.beschreibung && <p style={{ whiteSpace: 'pre-wrap' }}>{review.beschreibung}</p>}

      {review.bewertung_attribute?.length > 0 && (
        <AttributeSection>
          {review.bewertung_attribute.map((attr, i) => (
            <AttributeBadge key={i}>{attr}</AttributeBadge>
          ))}
        </AttributeSection>
      )}

      {Number(review.nutzer_id) === Number(userId) && setShowReviewForm && (
        <EditButton onClick={() => setShowReviewForm(true)}>Bearbeiten</EditButton>
      )}
    </Card>
  );
};

export default ReviewCard;

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

const Header = styled.div`
  margin-bottom: 1rem;
`;

const Table = styled.table`
  border-spacing: 0.5rem 0.25rem;
  margin-bottom: 1rem;

  th {
    text-align: left;
    vertical-align: top;
    white-space: nowrap;
    padding-right: 0.5rem;
    font-weight: normal;
    color: #555;
  }

  td {
    vertical-align: top;
  }
`;

const AttributeSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const AttributeBadge = styled.span`
  background-color: #e0f3ff;
  color: #0077b6;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
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

