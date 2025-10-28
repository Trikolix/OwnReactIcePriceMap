import CheckinCard from './../components/CheckinCard';
import styled from "styled-components";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Pagination } from "swiper/modules";

const GroupCheckinCard = ({ checkins, onSuccess }) => {
    const first = checkins[0];
    const allNames = formatNames(checkins);
    function formatNames(checkins) {
        if (checkins.length === 1) {
            return formatName(checkins[0]);
        }

        if (checkins.length === 2) {
            return (
                <>
                    {formatName(checkins[0])} und {formatName(checkins[1])}
                </>
            );
        }

        return (
            <>
                {checkins.slice(0, -1).map((c, i) => (
                    <span key={c.nutzer_id}>
                        {formatName(c)}
                        {i < checkins.length - 2 && ", "}
                    </span>
                ))}{" "}
                und {formatName(checkins[checkins.length - 1])}
            </>
        );
    }

    function formatName(checkin) {
        return (
            <strong>
                <CleanLink to={`/user/${checkin.nutzer_id}`}>
                    {checkin.nutzer_name}
                </CleanLink>
            </strong>
        );
    }

    const cardRef = useRef(null);
    const [cardHeight, setCardHeight] = useState();
    const [activeIndex, setActiveIndex] = useState(0);

    // Höhe messen
    const updateHeight = () => {
        if (cardRef.current) {
            setCardHeight(cardRef.current.offsetHeight);
        }
    };

    useEffect(() => {
        updateHeight();
        const el = cardRef.current;
        if (el) {
            el.addEventListener('checkinCardResize', updateHeight);
        }
        return () => {
            if (el) {
                el.removeEventListener('checkinCardResize', updateHeight);
            }
        };
    }, [checkins, activeIndex]);

    return (
        <Card style={cardHeight ? { minHeight: cardHeight } : {}}>
            <DateText dateTime={first.datum}>
                {new Date(first.datum).toLocaleDateString("de-DE", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                })}
            </DateText>
            <ContentWrapper>
                <LeftContent>
                    {allNames} waren gemeinsam bei{" "}
                    <strong>
                        <CleanLink to={`/map/activeShop/${first.eisdiele_id}`}>
                            {first.eisdiele_name}
                        </CleanLink>
                    </strong>{" "}
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
                {checkins.map((c, idx) => (
                    <SwiperSlide key={c.id}>
                        <CheckinCard ref={idx === activeIndex ? cardRef : null} checkin={c} onSuccess={onSuccess} showComments={false} />
                    </SwiperSlide>
                ))}
            </Swiper>
        </Card>
    );
};


export default GroupCheckinCard;

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
