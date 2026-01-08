import React from "react";
import styled from "styled-components";
import { Bike } from "lucide-react";

const HeaderWrapper = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  border-bottom: 1px solid #e5e7eb;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(8px);
`;
const HeaderInner = styled.div`
  display: flex;
  height: 56px;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
`;
const Brand = styled.a`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: inherit;
`;
const BrandText = styled.span`
  font-weight: bold;
  font-size: 1.2rem;
`;
const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 1rem;
`;
const Button = styled.a`
  display: inline-block;
  padding: 0.4em 1.2em;
  background: #ffb522;
  color: #fff;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.2s;
  &:hover {
    background: #ffb522;
  }
`;

export default function Header() {
  return (
    <HeaderWrapper>
      <HeaderInner>
        <Brand href="/#/rad-event">
          <Bike size={24} color="#ffb522" />
          <BrandText>Eisdielen Tour</BrandText>
        </Brand>
        <Nav>
          <Button href="/#/event-registration">Jetzt Anmelden</Button>
        </Nav>
      </HeaderInner>
    </HeaderWrapper>
  );
}

export { HeaderWrapper, HeaderInner, Brand, BrandText, Nav, Button };
