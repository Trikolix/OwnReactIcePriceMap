import React from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import "./loyalty.css";

export default function ShopLoyaltyActions({ shop }) {
  const { isLoggedIn } = useUser();
  const program = shop.loyalty_program,
    permissions = shop.business_permissions;
  if (!program && !isLoggedIn) return null;
  return (
    <div className="loyalty-panel" style={{ margin: "16px 0 0", padding: 14 }}>
      {program && (
        <>
          <strong>Kundenkarte</strong>
          <p>
            {program.stamp_target}{" "}
            {program.unit === "purchase" ? "Käufe" : "bezahlte Kugeln"} ={" "}
            {program.reward}
          </p>
          <Link className="loyalty-button" to={`/kundenkarten?shop=${shop.id}`}>
            Kundenkarte öffnen
          </Link>
        </>
      )}
      {isLoggedIn && (
        <p style={{ marginBottom: 0 }}>
          <Link
            to={
              permissions?.can_stamp
                ? `/betreiber/${shop.id}`
                : `/betreiber/antrag/${shop.id}`
            }
          >
            {permissions?.can_stamp
              ? permissions.can_edit_business
                ? "Als Betreiber verwalten"
                : "Thekenmodus öffnen"
              : "Deine Eisdiele? Betreiberzugang beantragen"}
          </Link>
        </p>
      )}
    </div>
  );
}
