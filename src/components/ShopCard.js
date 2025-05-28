import React, { useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { useUser } from "./../context/UserContext";
import OpeningHours from "./OpeningHours";
import ShopWebsite from "./ShopWebsite";
import SubmitIceShopModal from "../SubmitIceShopModal";


const ShopCard = ({ iceShop, onSuccess }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const { userId } = useUser();

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("de-DE");

  const handleEditClick = () => {
    setShowEditModal(true);
    console.log("handleEditClick", showEditModal);
  };

  return (<>

    <Card>
      <Header>
        <strong><CleanLink to={`/user/${iceShop.user_id}`}>{iceShop.nutzer_name}</CleanLink></strong> hat die Eisdiele{" "}
        <strong><CleanLink to={`/map/activeShop/${iceShop.id}`}>{iceShop.name}</CleanLink></strong> erstellt.{" "}
        <DateText>(am {formatDate(iceShop.erstellt_am)})</DateText>
      </Header>
      <strong>Adresse:</strong> {iceShop.adresse || "keine Adresse eingetagen"}<br />
      <OpeningHours eisdiele={iceShop} />
      <ShopWebsite eisdiele={iceShop} />
      {(Number(userId) === 1 || (Number(userId) === Number(iceShop.user_id) && (new Date() - new Date(iceShop.erstellt_am)) < 6 * 60 * 60 * 1000)) && (
        <EditButton onClick={handleEditClick}>Bearbeiten</EditButton>
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

const Card = styled.div`
  background: #f9f9f9;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const Header = styled.div`
  margin-bottom: 1rem;
`;

const DateText = styled.em`
  font-size: 0.85rem;
  color: #777;
`;

const EditButton = styled.button`
  background-color: #0077b6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    background-color: #005f8a;
  }
`;

