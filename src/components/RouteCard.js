import React, { useState } from "react";
import styled from "styled-components";
import { useUser } from "../context/UserContext";
import { Link } from "react-router-dom";
import SubmitRouteForm from "../SubmitRouteModal";

const RouteCard = ({ route, shopId, shopName, onSuccess }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const { userId } = useUser();

  const handleEditClick = () => {
    setShowEditModal(true);
    console.log("handleEditClick", showEditModal);
  };

  const routeDisplayMap = {
    Wanderung: "Wanderung",
    Rennrad: "Rennrad Route",
    MTB: "MTB Route",
    Gravel: "Gravel Route",
    Sonstiges: "Sonstiges",
  };

  const renderRouteInfo = () => {
    return (
      <>
        {route.laenge_km && (
          <InfoText>Länge: {route.laenge_km} km</InfoText>
        )}
        {route.hoehenmeter && (
          <InfoText>Höhenmeter: {route.hoehenmeter} m</InfoText>
        )}
        {route.schwierigkeit && (
          <InfoText>Schwierigkeit: {route.schwierigkeit}</InfoText>
        )}
      </>
    );
  };

  const renderRouteEmbed = () => {
    if (route.embed_code && route.embed_code.trim() !== "") {
      return (
        <IframeContainer dangerouslySetInnerHTML={{ __html: route.embed_code }} />
      );
    } else if (route.url) {
      return (
        <RouteLink href={route.url} target="_blank" rel="noopener noreferrer">
          {route.name || "Route anzeigen"}
        </RouteLink>
      );
    }
    return null;
  };

  return (
    <>
      <Card>
        <DateText dateTime={route.erstellt_am}>
          {new Date(route.erstellt_am).toLocaleDateString("de-DE", {
            day: "numeric",
            month: "long",
            year: "numeric", 
            hour: "numeric",
            minute: "numeric",
          })}
        </DateText>
        <ContentWrapper>
          <LeftContent>
            <TitleWrapper>
              <RouteType>{routeDisplayMap[route.typ]}: <strong>{route.name}</strong></RouteType>
              <AuthorDate>
                von <UserLink to={`/user/${route.nutzer_id}`}>{route.username || route.nutzer_name}</UserLink>{" "}
              </AuthorDate>
            </TitleWrapper>

            {renderRouteEmbed()}

            {renderRouteInfo()}

            {route.beschreibung && <Description>{route.beschreibung}</Description>}

            {Number(route.nutzer_id) === Number(userId) && (
              <EditButton onClick={handleEditClick}>Bearbeiten</EditButton>
            )}
          </LeftContent>
        </ContentWrapper>
      </Card>

      {showEditModal && (
        <SubmitRouteForm
          shopId={shopId}
          shopName={shopName}
          showForm={showEditModal}
          setShowForm={setShowEditModal}
          existingRoute={route}
          onSuccess={onSuccess}
        />
      )}
    </>
  );
};

export default RouteCard;

// ---------- Styled Components ----------

const UserLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  cursor: pointer;
`;

const Card = styled.div`
  position: relative;
  background: white;
  border-radius: 16px;
  border: 1px solid #eee;
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
  gap: 1.5rem;
`;

const LeftContent = styled.div`
  flex: 1 1 300px;
  min-width: 250px;
`;

const IframeContainer = styled.div`
  width:  100%;
  height: 300px;
  border: none;
  overflow: hidden;

  iframe {
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 8px;
  }
`;

const TitleWrapper = styled.div`
  margin-bottom: 0.25rem;
`;

const RouteType = styled.div`
  font-weight: 700;
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 0.15rem;
`;

const RouteLink = styled.a`
  font-weight: 700;
  font-size: 1.25rem;
  color: #0077b6;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const AuthorDate = styled.div`
  font-size: 0.85rem;
  color: #777;
  margin-bottom: 0.7rem;
`;

const InfoText = styled.p`
  margin: 0.1rem 0;
  font-size: 0.9rem;
  color: #444;
`;

const Description = styled.p`
  white-space: pre-wrap;
  font-size: 1rem;
  margin-bottom: 0.8rem;
  color: #222;
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
