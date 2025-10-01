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
        <strong><CleanLink to={`/user/${iceShop.user_id}`}>{iceShop.nutzer_name}</CleanLink></strong> hat die Eisdiele{" "}
        <strong><CleanLink to={`/map/activeShop/${iceShop.id}`}>{iceShop.name}</CleanLink></strong> erstellt.{" "}
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

const Header = styled.div`
  margin-bottom: 1rem;
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

