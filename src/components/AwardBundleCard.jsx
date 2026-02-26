import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Pagination } from "swiper/modules";
import AwardCard from "./AwardCard";
import { Card as SharedCard } from "../styles/SharedStyles";

import { Link } from "react-router-dom";


const normalizeDateString = (value) => {
  if (typeof value !== "string") return value;
  return value.includes("T") ? value : value.replace(" ", "T");
};

const parseAwardDate = (value) => {
  if (!value) return null;
  const parsed = new Date(normalizeDateString(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const AwardBundleCard = ({ awards, userName, date }) => {
  const [cardHeight, setCardHeight] = useState();
  const [activeIndex, setActiveIndex] = useState(0);
  const cardRef = useRef(null);
  // Sortiere awards nach ep absteigend
  const sortedAwards = awards && awards.length > 0 ? awards.slice().sort((a, b) => (b.ep ?? 0) - (a.ep ?? 0)) : [];
  const effectiveUserId = (() => {
    if (!awards || awards.length === 0) return null;
    const last = awards[awards.length - 1];
    const first = awards[0];
    return last?.user_id ?? last?.nutzer_id ?? first?.user_id ?? first?.nutzer_id ?? null;
  })();
  const parsedDate = parseAwardDate(date);

  // Dynamische Höhe messen
  const updateHeight = () => {
    if (cardRef.current) {
      setCardHeight(cardRef.current.offsetHeight);
    }
  };

  useEffect(() => {
    if (!awards || awards.length === 0) return;
    updateHeight();
    const el = cardRef.current;
    if (el) {
      el.addEventListener('awardCardResize', updateHeight);
    }
    return () => {
      if (el) {
        el.removeEventListener('awardCardResize', updateHeight);
      }
    };
  }, [awards, activeIndex]);

  if (!awards || awards.length === 0) return null;

  return (
    <Card style={cardHeight ? { minHeight: cardHeight } : {}}>
      <CardMetaRow>
        <DateText dateTime={parsedDate ? parsedDate.toISOString() : undefined}>
          {parsedDate
            ? parsedDate.toLocaleDateString("de-DE", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "numeric",
                minute: "numeric",
              })
            : date}
        </DateText>
      </CardMetaRow>
      <ContentWrapper>
        <LeftContent>
          <strong>
            <CleanLink to={effectiveUserId ? `/user/${effectiveUserId}` : "#"}>
              {userName}
            </CleanLink>
          </strong> hat <strong>{awards.length}</strong> Awards erhalten
        </LeftContent>
      </ContentWrapper>
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={20}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        autoHeight={true}
        style={{ marginTop: "1rem", marginLeft: "-2rem", marginRight: "-2rem", marginBottom: "-3.5rem" }}
        onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
      >
        {sortedAwards.map((award, idx) => (
          <SwiperSlide key={award.id}>
            <AwardCard ref={idx === activeIndex ? cardRef : null} award={award} />
          </SwiperSlide>
        ))}
      </Swiper>
    </Card>
  );
};


export default AwardBundleCard;

const Card = styled(SharedCard)`
  padding: 1rem 1rem 1.35rem;
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
  color: rgba(47, 33, 0, 0.5);
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

const ContentWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
`;

const LeftContent = styled.div`
  flex: 1 1 300px;
  min-width: 250px;
`;

const CleanLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`;
