import React from "react";
import styled from "styled-components";
import Rating from "./Rating"; // ggf. Pfad anpassen

const ReviewCard = ({ review }) => {
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("de-DE");

  return (
    <Card>
      <Header>
        <strong>{review.nutzer_name}</strong> hat{" "}
        <strong>{review.eisdiele_name}</strong> bewertet.{" "}
        <DateText>(vom {formatDate(review.erstellt_am)})</DateText>
      </Header>

      <Table>
        {review.geschmack !== null && (
          <tr>
            <th>Geschmack:</th>
            <td>
              <Rating stars={review.geschmack} />{" "}
              <strong>{review.geschmack}</strong>
            </td>
          </tr>
        )}
        {review.kugelgroesse !== null && (
          <tr>
            <th>Größe:</th>
            <td>
              <Rating stars={review.kugelgroesse} />{" "}
              <strong>{review.kugelgroesse}</strong>
            </td>
          </tr>
        )}
        {review.waffel !== null && (
          <tr>
            <th>Waffel:</th>
            <td>
              <Rating stars={review.waffel} />{" "}
              <strong>{review.waffel}</strong>
            </td>
          </tr>
        )}
        {review.auswahl !== null && (
          <tr>
            <th>Auswahl:</th>
            <td>
              ~<strong>{review.auswahl}</strong> Sorten
            </td>
          </tr>
        )}
      </Table>

      {review.beschreibung && <p>{review.beschreibung}</p>}

      {review.bewertung_attribute?.length > 0 && (
        <AttributeSection>
          {review.bewertung_attribute.map((attr, i) => (
            <AttributeBadge key={i}>{attr}</AttributeBadge>
          ))}
        </AttributeSection>
      )}
    </Card>
  );
};

export default ReviewCard;

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
`;

const AttributeBadge = styled.span`
  background-color: #e0f3ff;
  color: #0077b6;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
`;

