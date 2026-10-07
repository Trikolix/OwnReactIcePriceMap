import React, { useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import OpeningHours from "./OpeningHours";
import ShopWebsite from "./ShopWebsite";
import SubmitIceShopModal from "../SubmitIceShopModal";
import { ActivityCard as Card, ActivityHeader, ActivityMetaRow as CardMetaRow, ActivityDate as DateText, ActivityUserHeader as Header, ActivityHeaderText as HeaderText, ActivityLink as CleanLink, ShopButton } from "../styles/ShopUi";
import { formatActivityDate } from '../utils/activityFeed';
import UserAvatar from "./UserAvatar";
import { getShopEditAccess } from "../utils/shopEditing";


const ShopCard = ({ iceShop, onSuccess }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editShopData, setEditShopData] = useState(iceShop);
  const [isLoadingEditShop, setIsLoadingEditShop] = useState(false);
  const { userId, isLoggedIn } = useUser();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

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
      <ActivityHeader>
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
        <CardMetaRow>
          <DateText dateTime={iceShop.erstellt_am}>
            {formatActivityDate(iceShop.erstellt_am)}
          </DateText>
        </CardMetaRow>
      </ActivityHeader>
      <Details>
        <div><strong>Adresse:</strong> {iceShop.adresse || "Keine Adresse eingetragen"}</div>
        <OpeningHours eisdiele={iceShop} />
        <ShopWebsite eisdiele={iceShop} showSubmitAction={false} />
      </Details>
      <Actions>
      <ShopButton as={Link} to={`/shop/${iceShop.id}`} $primary>Eisdiele ansehen</ShopButton>
      {isLoggedIn && (
        <SuggestionLink type="button" onClick={handleEditClick} disabled={isLoadingEditShop}>
          {isLoadingEditShop ? "Lade Details..." : getShopEditAccess(iceShop, userId).canEditDirectly ? "Eintrag bearbeiten" : "Änderung vorschlagen"}
        </SuggestionLink>
      )}
      </Actions>
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

const Details = styled.div`display: grid; gap: 12px; line-height: 1.5; min-width: 0;`;
const Actions = styled.div`display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px;`;
const SuggestionLink = ShopButton;

