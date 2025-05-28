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
      <Header>
        <strong><CleanLink to={`/user/${review.nutzer_id}`}>{review.nutzer_name}</CleanLink></strong> hat{" "}
        <strong><CleanLink to={`/map/activeShop/${review.eisdiele_id}`}>{review.eisdiele_name}</CleanLink></strong> bewertet.{" "}
        <DateText>(vom {formatDate(review.erstellt_am)})</DateText>
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
  background: #f9f9f9;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const Header = styled.div`
  margin-bottom: 1rem;
`;

const DateText = styled.em`
  font-size: 0.85rem;
  color: #777;
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
  background-color: #0077b6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    background-color: #005f8a;
  }
`;

