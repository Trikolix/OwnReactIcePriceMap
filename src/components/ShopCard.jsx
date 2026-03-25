import React, { useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import OpeningHours from "./OpeningHours";
import ShopWebsite from "./ShopWebsite";
import SubmitIceShopModal from "../SubmitIceShopModal";
import { Card } from "../styles/SharedStyles";
import UserAvatar from "./UserAvatar";


const ShopCard = ({ iceShop, onSuccess }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editShopData, setEditShopData] = useState(iceShop);
  const [isLoadingEditShop, setIsLoadingEditShop] = useState(false);
  const { userId, isLoggedIn } = useUser();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("de-DE");

  const handleEditClick = async () => {
    setIsLoadingEditShop(true);
    try {
      const userQuery = userId ? `&nutzer_id=${userId}` : "";
      const response = await fetch(`${apiUrl}/get_eisdiele.php?eisdiele_id=${iceShop.id}${userQuery}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setEditShopData(data?.eisdiele || iceShop);
    } catch (error) {
      console.error("Fehler beim Laden der Eisdielen-Details für das Bearbeitungsmodal:", error);
      setEditShopData(iceShop);
    } finally {
      setIsLoadingEditShop(false);
      setShowEditModal(true);
    }
  };

  return (<>

    <Card>
      <CardMetaRow>
        <DateText dateTime={iceShop.erstellt_am}>
          {new Date(iceShop.erstellt_am).toLocaleDateString("de-DE", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "numeric",
              minute: "numeric",
            })}
        </DateText>
      </CardMetaRow>
      <Header>
        <UserAvatar
          userId={iceShop.user_id}
          name={iceShop.nutzer_name}
          avatarUrl={iceShop.avatar_url}
        />
        <HeaderText>
          <strong><CleanLink to={`/user/${iceShop.user_id}`}>{iceShop.nutzer_name}</CleanLink></strong> hat die Eisdiele{" "}
          <strong><CleanLink to={`/map/activeShop/${iceShop.id}`}>{iceShop.name}</CleanLink></strong> erstellt.{" "}
        </HeaderText>
      </Header>
      <strong>Adresse:</strong> {iceShop.adresse || "keine Adresse eingetagen"}<br />
      <OpeningHours eisdiele={iceShop} />
      <ShopWebsite eisdiele={iceShop} />
      {isLoggedIn && (
        <SuggestionLink type="button" onClick={handleEditClick} disabled={isLoadingEditShop}>
          {isLoadingEditShop ? "Lade Details..." : "Änderung vorschlagen"}
        </SuggestionLink>
      )}
    </Card>

    {showEditModal && (
      <SubmitIceShopModal
        showForm={showEditModal}
        setShowForm={setShowEditModal}
        userId={userId}
        refreshShops={onSuccess}
        existingIceShop={editShopData}
      />
    )}
  </>
  );
};

export default ShopCard;

const CleanLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const HeaderText = styled.div`
  line-height: 1.4;
`;

const CardMetaRow = styled.div`
  position: absolute;
  top: 1rem;
  right: 1.25rem;
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0;
  z-index: 1;
  pointer-events: none;

  @media (max-width: 640px) {
    position: static;
    justify-content: flex-end;
    margin-bottom: 0.5rem;
    pointer-events: auto;
  }
`;

const DateText = styled.time`
  position: static;
  font-size: 0.85rem;
  color: rgba(47, 33, 0, 0.56);
  font-style: italic;
  user-select: none;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 999px;
  padding: 0.2rem 0.65rem;

  @media (max-width: 640px) {
    margin-bottom: 0;
    justify-content: flex-end;
    font-size: 0.78rem;
    line-height: 1.2;
    flex-wrap: wrap;
  }
`;

const SuggestionLink = styled.button`
  margin-top: 0.75rem;
  background: none;
  border: none;
  color: #4f4f4f;
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  font-weight: 500;

  &:hover {
    color: #1f1f1f;
  }

  &:disabled {
    opacity: 0.65;
    cursor: wait;
  }
`;

