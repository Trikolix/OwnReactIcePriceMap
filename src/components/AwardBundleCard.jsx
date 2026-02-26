import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Pagination } from "swiper/modules";
import AwardCard from "./AwardCard";

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

const Card = styled.div`
  position: relative;
  background: white;
  border-radius: 16px;
  border: 1px solid #eee;
  padding: 2rem;
  padding-bottom: -3rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s;

  &:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
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
