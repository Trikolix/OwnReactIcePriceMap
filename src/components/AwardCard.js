import React, { forwardRef } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";

const AwardCard = React.forwardRef(function AwardCard({ award }, ref) {
    const { userId } = useUser();


    return (
        <Card ref={ref}>
            <DateText dateTime={new Date(award.datum).toISOString()}>
                {new Date(award.datum).toLocaleDateString("de-DE", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                })}
            </DateText>

            <ContentWrapper>
                {/* --- Icon links --- */}
                <IconWrapper>
                    <AwardIcon
                        src={`https://ice-app.de/${award.icon_path}`}
                        alt="Award Icon"
                    />
                    <EPBadge>{award.ep} EP ✨</EPBadge>
                </IconWrapper>

                {/* --- Text rechts --- */}
                <TextContent>
                    {userId === award.user_id ? (
                        <>Du hast den Award <strong>{award.title_de}</strong> erhalten.</>
                    ) : (
                        <>
                            <strong>
                                <CleanLink to={`/user/${award.user_id}`}>
                                    {award.user_name}
                                </CleanLink>
                            </strong>{" "}
                            hat den Award <strong>{award.title_de}</strong> erhalten.
                            <p>{award.description_de}</p>
                        </>
                    )}

                </TextContent>
            </ContentWrapper>
        </Card>
    );

});

export default AwardCard;

// ---------- Styled Components ----------

const CleanLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`;

const Card = styled.div`
  position: relative;
  background: white;
  border-radius: 16px;
  border: 1px solid #eee;
  padding: 1rem;
  padding-top: 2rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s;

  &:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
`;

const TextContent = styled.div`
  flex: 1;
  font-size: 1rem;
`;

const IconWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const AwardIcon = styled.img`
  height: 150px;
`;

const EPBadge = styled.div`
  position: absolute;
  top: -10px;
  right: -10px;
  background: linear-gradient(135deg, #FFD700, #FFC107);
  color: #fff;
  font-size: 0.8rem;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 20px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  z-index: 1;
  animation: popIn 0.4s ease-out;

  @keyframes popIn {
    0% { transform: scale(0.8); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
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
