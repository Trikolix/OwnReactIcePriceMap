import React, { useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { useUser } from "./../context/UserContext";
import OpeningHours from "./OpeningHours";
import ShopWebsite from "./ShopWebsite";
import SubmitIceShopModal from "../SubmitIceShopModal";
import { Card } from "../styles/SharedStyles";
import UserAvatar from "./UserAvatar";


const ShopCard = ({ iceShop, onSuccess }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const { userId, isLoggedIn } = useUser();

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("de-DE");

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  return (<>

    <Card>
      <DateText dateTime={iceShop.erstellt_am}>
        {new Date(iceShop.erstellt_am).toLocaleDateString("de-DE", {
            day: "numeric",
            month: "long",
            year: "numeric", 
            hour: "numeric",
            minute: "numeric",
          })}
      </DateText>
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
        <SuggestionLink type="button" onClick={handleEditClick}>
          Änderung vorschlagen
        </SuggestionLink>
      )}
    </Card>

    {showEditModal && (
      <SubmitIceShopModal
        showForm={showEditModal}
        setShowForm={setShowEditModal}
        userId={userId}
        refreshShops={onSuccess}
        existingIceShop={iceShop}
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
  margin-bottom: 1rem;
`;

const HeaderText = styled.div`
  line-height: 1.4;
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
`;

