import React, { useState } from "react";
import styled from "styled-components";
import { useUser } from "../context/UserContext";
import { Link } from "react-router-dom";
import SubmitRouteForm  from "../SubmitRouteModal";

const RouteCard = ({ route, shopId, shopName, onSuccess }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const { userId } = useUser();

  const handleEditClick = () => {
    setShowEditModal(true);
    console.log("handleEditClick", showEditModal);
  };
  var routeDisplayMap = {};
  routeDisplayMap["Wanderung"] = "Wanderung";
  routeDisplayMap["Rennrad"] = "Rennrad Route";
  routeDisplayMap["MTB"] = "MTB Route";
  routeDisplayMap["Gravel"] = "Gravel Route";
  routeDisplayMap["Sonstiges"] = "Sonstiges";

  return (
    <>
      <Card>
        <ContentWrapper>
          <LeftContent>
            <h3>{routeDisplayMap[route.typ]} von <strong><UserLink to={`/user/${route.nutzer_id}`}>{route.username}</UserLink></strong>
            <TypText> (Erstellt am: {new Date(route.erstellt_am).toLocaleDateString()})</TypText></h3>
            {route.beschreibung && <p>{route.beschreibung}</p>}
            {parseInt(route.nutzer_id, 10) === parseInt(userId, 10) && (
              <EditButton onClick={handleEditClick}>Bearbeiten</EditButton>
            )}
          </LeftContent>
          <RightContent>
            <IframeContainer dangerouslySetInnerHTML={{ __html: route.url }} />
          </RightContent>
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
  background: #f9f9f9;
  border-radius: 12px;
  padding: 0.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const ContentWrapper = styled.div`
  gap: 1.5rem;
`;

const LeftContent = styled.div`
  flex: 1 1 300px;
  min-width: 250px;
`;

const RightContent = styled.div`
  flex: 0 0 auto;
`;

const IframeContainer = styled.div`
  width: 100%;
  height: 440px;
  border: none;
  overflow: hidden;

  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
`;

const TypText = styled.em`
  font-size: 0.85rem;
  color: #777;
`;

const EditButton = styled.button`
  background-color: #0077b6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-bottom: 1rem;

  &:hover {
    background-color: #005f8a;
  }
`;
