import React from "react";
import { Link } from "react-router-dom";
import { ShopChip } from "../../styles/ShopUi";
import { flavorPath, attributePath } from "../../utils/shopOfferings.mjs";

export function FlavorChip({ name, type, children }) {
  return <ShopChip as={Link} to={flavorPath(name, type)} aria-label={`Sorten-Details für ${name}`}>{name}{children}</ShopChip>;
}
export function AttributeChip({ attribute }) {
  const path = attributePath(attribute.id);
  return <ShopChip as={path ? Link : "span"} to={path || undefined} aria-label={path ? `Eisdielen mit dem Attribut ${attribute.name} auf der Karte ansehen` : undefined}>{attribute.name}{attribute.anzahl != null && <small>{attribute.anzahl}×</small>}</ShopChip>;
}
