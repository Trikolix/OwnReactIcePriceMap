import CheckinCard from './../components/CheckinCard';
import styled from "styled-components";
import { useState } from "react";
import { Link } from "react-router-dom";

const GroupCheckinCard = ({ checkins, onSuccess }) => {
  const [expanded, setExpanded] = useState(false);

  const first = checkins[0];
  const allNames = checkins.map((c) => c.nutzer_name).join(", ");

  return (
    <Card>
      <DateText dateTime={first.datum}>
        {new Date(first.datum).toLocaleDateString("de-DE", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
        })}
      </DateText>

      <ContentWrapper>
        <LeftContent>
          <strong>{allNames}</strong> waren gemeinsam bei{" "}
          <strong>
            <CleanLink to={`/map/activeShop/${first.eisdiele_id}`}>
              {first.eisdiele_name}
            </CleanLink>
          </strong>{" "}
          🍦
        </LeftContent>
      </ContentWrapper>

      <ExpandButton onClick={() => setExpanded(!expanded)}>
        {expanded ? "Details ausblenden" : "Details anzeigen"}
      </ExpandButton>

      {expanded && (
        <div style={{ marginTop: "1rem", marginLeft: "-2rem", marginRight: "-2rem" }}>
          {checkins.map((c) => (
            <CheckinCard key={c.id} checkin={c} onSuccess={onSuccess} showComments={false} />
          ))}
        </div>
      )}
    </Card>
  );
};

export default GroupCheckinCard;

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

const ContentWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
`;

const LeftContent = styled.div`
  flex: 1 1 300px;
  min-width: 250px;
`;

const CleanLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`;

const ExpandButton = styled.button`
  align-self: flex-start;
  background-color: #ffb522;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #db9d20ff;
  }
`;