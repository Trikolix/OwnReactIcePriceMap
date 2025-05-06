import React, { useState } from "react";
import styled from "styled-components";
import { useUser } from "../context/UserContext";
// import EditRouteForm from "../EditRouteForm"; // Angenommen, du hast ein Bearbeitungsformular für Routen

const RouteCard = ({ route }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const { userId } = useUser();

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  return (
    <>
      <Card>
        <ContentWrapper>
          <LeftContent>
            <strong>Route von <UserLink to={`/user/${route.nutzer_id}`}>Nutzer {route.nutzer_id}</UserLink></strong>
            <TypText>({route.typ})</TypText>
            <br />
            <strong>Beschreibung:</strong> {route.beschreibung || "Keine Beschreibung verfügbar."}
            <br />
            <strong>Erstellt am:</strong> {new Date(route.erstellt_am).toLocaleDateString()}<br />
            {parseInt(route.nutzer_id, 10) === parseInt(userId, 10) && (
              <EditButton onClick={handleEditClick}>Bearbeiten</EditButton>
            )}
          </LeftContent>
          <RightContent>
            <IframeContainer dangerouslySetInnerHTML={{ __html: route.url }} />
          </RightContent>
        </ContentWrapper>
      </Card>

      {showEditModal && (<></>
//        <EditRouteForm
//          routeId={route.id}
//          shopName={route.eisdiele_id} // Angenommen, du hast einen Shop-Namen oder eine ID
//          showRouteForm={showEditModal}
//          setShowRouteForm={setShowEditModal}
//        />
      )}
    </>
  );
};

export default RouteCard;

// ---------- Styled Components ----------

const UserLink = styled.a`
  text-decoration: none;
  color: inherit;
  cursor: pointer;
`;

const Card = styled.div`
  background: #f9f9f9;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const ContentWrapper = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
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
  margin-top: 1rem;

  &:hover {
    background-color: #005f8a;
  }
`;
