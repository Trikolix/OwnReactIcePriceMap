import React from "react";
import styled from "styled-components";
import { Bike } from "lucide-react";

const FooterWrapper = styled.footer`
  border-top: 1px solid #e5e7eb;
  width: 100%;
  background: #fff;
`;
const FooterInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 2.5rem 1rem 2.5rem 1rem;
  @media (min-width: 768px) {
    flex-direction: row;
    height: 96px;
    padding: 0 1.5rem;
    gap: 2rem;
  }
`;
const FooterBrand = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 0 2rem;
  @media (min-width: 768px) {
    flex-direction: row;
    gap: 0.5rem;
    padding: 0;
  }
`;
const FooterText = styled.p`
  text-align: center;
  font-size: 0.95rem;
  color: #64748b;
  line-height: 1.5;
`;
const FooterLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 1.2rem;
`;
const FooterLink = styled.a`
  font-size: 0.95rem;
  color: #64748b;
  text-decoration: none;
  transition: color 0.2s;
  &:hover {
    color: #1e293b;
  }
`;
const FooterSeparator = styled.span`
  display: none;
  @media (min-width: 768px) {
    display: inline-block;
    width: 1px;
    height: 24px;
    background: #e5e7eb;
    margin: 0 1rem;
    vertical-align: middle;
  }
`;

export default function Footer() {
  return (
    <FooterWrapper>
      <FooterInner>
        <FooterBrand>
          <Bike size={24} color="#ffb522" />
          <FooterText>
            © {new Date().getFullYear()} Eisdielen Tour. Alle Rechte vorbehalten.
          </FooterText>
        </FooterBrand>
        <FooterLinks>
          <FooterSeparator />
          <FooterLink href="/impressum">Impressum</FooterLink>
        </FooterLinks>
      </FooterInner>
    </FooterWrapper>
  );
}

export { FooterWrapper, FooterInner, FooterBrand, FooterText, FooterLinks, FooterLink, FooterSeparator };
