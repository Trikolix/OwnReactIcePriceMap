import React from "react";
import styled from "styled-components";
import { Sparkles } from "lucide-react";

const NewAwards = ({ awards }) => {
  if (!awards || awards.length === 0) return null;

  return (
    <AwardsSection>
      <h3>Du hast neue Auszeichnungen erhalten:</h3>
      <ul>
        {awards.map((award, index) => (
          <AwardItem key={index}>
            <IconWrapper>
              <AwardIcon
                src={`https://ice-app.de/${award.icon}`}
                alt="Award Icon"
              />
              <EPBadge>{award.ep} EP <Sparkles size={16} style={{ marginLeft: 2, verticalAlign: 'bottom' }} /></EPBadge>
            </IconWrapper>
            <AwardText>{award.message}</AwardText>
          </AwardItem>
        ))}
      </ul>
    </AwardsSection>
  );
};

export default NewAwards;

const AwardsSection = styled.div`
`;

const AwardItem = styled.li`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  margin-left: -2.5rem;
`;

const IconWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const AwardIcon = styled.img`
  height: 130px;
  margin-right: 0.75rem;
  margin-top: 0.5rem;
  border-radius: 8px;
`;

const AwardText = styled.span`
  font-size: 0.95rem;
`;

const EPBadge = styled.div`
  position: absolute;
  top: 6px;
  right: 6px;
  background: linear-gradient(135deg, #FFD700, #FFC107);
  color: #fff;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  z-index: 1;
  animation: popIn 0.4s ease-out;

  @keyframes popIn {
    0% { transform: scale(0.8); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
`;
