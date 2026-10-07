import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y } from 'swiper/modules';
import 'swiper/css';
import { ShopButton, SHOP_COLORS } from '../styles/ShopUi';

export default function ActivityCarousel({ children, label, entryLabel, initialIndex = 0 }) {
  const slides = React.Children.toArray(children);
  const startIndex = Math.max(0, Math.min(initialIndex, slides.length - 1));
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const swiperRef = useRef(null);
  useEffect(() => {
    swiperRef.current?.slideTo(startIndex, 0);
  }, [startIndex]);
  useEffect(() => {
    const swiper = swiperRef.current;
    const card = swiper?.slides[activeIndex]?.firstElementChild;
    if (!swiper || !card) return;
    let frame = null;
    const observer = new ResizeObserver(() => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        if (!swiper.destroyed && Math.abs(swiper.wrapperEl.offsetHeight - swiper.slides[activeIndex].offsetHeight) > 1) swiper.updateAutoHeight(0);
      });
    });
    observer.observe(card);
    return () => { observer.disconnect(); if (frame !== null) cancelAnimationFrame(frame); };
  }, [activeIndex, slides.length]);
  if (!slides.length) return null;
  const navigate = direction => {
    const swiper = swiperRef.current;
    if (direction < 0) swiper?.slidePrev(); else swiper?.slideNext();
  };
  return <Region role="region" aria-label={label}>
    <Swiper modules={[A11y]} a11y={{ enabled: true, slideLabelMessage: '{{index}} von {{slidesLength}}', containerRoleDescriptionMessage: 'Karussell', itemRoleDescriptionMessage: entryLabel }}
      spaceBetween={20} slidesPerView={1} autoHeight initialSlide={startIndex}
      onSwiper={swiper => { swiperRef.current = swiper; }} onSlideChange={swiper => setActiveIndex(swiper.activeIndex)}>
      {slides.map((slide, index) => <SwiperSlide key={slide.key ?? index} inert={index === activeIndex ? undefined : ''} aria-hidden={index !== activeIndex}>{slide}</SwiperSlide>)}
    </Swiper>
    {slides.length > 1 && <Controls onKeyDown={event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); navigate(event.key === 'ArrowLeft' ? -1 : 1);
      }
    }}>
      <ShopButton disabled={activeIndex === 0} onClick={() => navigate(-1)} aria-label={`Vorheriger ${entryLabel}`}><ChevronLeft size={18} /></ShopButton>
      <span role="status" aria-live="polite">{activeIndex + 1} / {slides.length}</span>
      <ShopButton disabled={activeIndex >= slides.length - 1} onClick={() => navigate(1)} aria-label={`Nächster ${entryLabel}`}><ChevronRight size={18} /></ShopButton>
    </Controls>}
  </Region>;
}
const Region = styled.div`
  min-width: 0; margin-top: 16px; border-top: 1px solid ${SHOP_COLORS.border};
  .swiper { width: 100%; min-width: 0; }
  .swiper-slide > [data-activity-card] { margin: 0; padding: 16px 0 0; border: 0; border-radius: 0; }
  /* Embedded cards have no side padding; their content width equals their card width. */
  .swiper-slide > [data-activity-card] [data-activity-layout] { grid-template-columns: minmax(0, 1fr); }
  .swiper-slide > [data-activity-card] [data-activity-text] { order: 1; }
  .swiper-slide > [data-activity-card] [data-activity-media] { order: 0; }
  @container activity (min-width: 720px) {
    .swiper-slide > [data-activity-card] [data-activity-layout] {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      &:has(> :only-child) { grid-template-columns: minmax(0, 1fr); }
    }
    .swiper-slide > [data-activity-card] [data-activity-text] { order: 0; }
    .swiper-slide > [data-activity-card] [data-activity-media] { order: 1; }
  }
`;
const Controls = styled.div`
  display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 16px;
  button { min-width: 44px; padding: 8px; }
  span { min-width: 64px; text-align: center; font-size: .85rem; color: ${SHOP_COLORS.muted}; }
`;
