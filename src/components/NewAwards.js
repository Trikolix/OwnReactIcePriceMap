import React from "react";
import styled from "styled-components";

const NewAwards = ({ awards }) => {
  if (!awards || awards.length === 0) return null;

  return (
    <AwardsSection>
      <h3>Du hast neue Auszeichnungen erhalten:</h3>
      <ul>
        {awards.map((award, index) => (
          <AwardItem key={index}>
            <AwardIcon
              src={`https://ice-app.4lima.de/${award.icon}`}
              alt="Award Icon"
            />
            <AwardText>{award.message}</AwardText>
          </AwardItem>
        ))}
      </ul>
    </AwardsSection>
  );
};

export default NewAwards;

const AwardsSection = styled.div`
  margin-top: 1rem;
  border-top: 1px solid #eee;
  padding-top: 1rem;
`;

const AwardItem = styled.li`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const AwardIcon = styled.img`
  height: 100px;
  margin-right: 0.75rem;
`;

const AwardText = styled.span`
  font-size: 0.95rem;
`;
