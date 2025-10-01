import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";

const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
        case "leicht": return "#4caf50"; // grün
        case "mittel": return "#ff9800"; // orange
        case "schwer": return "#f44336"; // rot
        default: return "#9e9e9e";
    }
};

const ChallengesAwarded = ({ challenge }) => {
    if (!challenge || challenge.length === 0) return null;

    return (
        <AwardsSection>
            <h3>Du hast eine Challenge abgeschlossen:</h3>
            <ul>
                <ChallengeCard key={challenge.id} color={getDifficultyColor(challenge.difficulty)}>
                    <CardContent>
                        <div>
                            <h3><CleanLink to={`/map/activeShop/${challenge.shop_id}`}>{challenge.shop_name}</CleanLink></h3>
                            <p>{challenge.shop_adress}</p>
                            <DifficultyLabel>{challenge.difficulty} – {challenge.type === "daily" ? "Daily" : "Weekly"}</DifficultyLabel>
                            <Countdown>Abgeschlossen am: {challenge.completed_at ? new Date(challenge.completed_at).toLocaleString() : "–"}</Countdown>
                        </div>
                        <Trophy>🏆</Trophy>
                    </CardContent>
                </ChallengeCard>
            </ul>
        </AwardsSection>
    );
};

export default ChallengesAwarded;

const CleanLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`;

const AwardsSection = styled.div`
  margin-top: 1rem;
  border-top: 1px solid #eee;
  padding-top: 1rem;
`;

const ChallengeCard = styled.div`
  background: #fff;
  border-left: 8px solid ${(props) => props.color || "#ccc"};
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);

  @media (max-width: 600px) {
    padding: 12px;
  }
`;

const DifficultyLabel = styled.div`
  font-size: 14px;
  font-weight: bold;
  margin-top: 10px;
`;

const CardContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
`;

const Trophy = styled.div`
  font-size: 46px;
  margin-left: 10px;
`;

const Countdown = styled.div`
  font-size: 13px;
  color: #666;
  margin-top: 5px;
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
