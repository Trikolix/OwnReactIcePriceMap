import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import './Rating.css';

const Rating = ({ stars, onRatingSelect }) => {
  const maxStars = 5;
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const isInteractive = typeof onRatingSelect === 'function';

  const calculateValueFromEvent = (event) => {
    const rect = containerRef.current.getBoundingClientRect();
    const clientX =
      event.touches?.[0]?.clientX ??
      event.clientX;

    const offsetX = clientX - rect.left;
    const ratio = Math.min(Math.max(offsetX / rect.width, 0), 1); // 0 - 1
    const rawValue = ratio * maxStars;
    const clamped = Math.max(1.0, rawValue);
    return Math.round(clamped * 10) / 10;
  };

  const handleStart = (e) => {
    if (!isInteractive) return;
    setIsDragging(true);
    onRatingSelect(calculateValueFromEvent(e));
  };

  const handleMove = (e) => {
    if (!isInteractive || !isDragging) return;
    e.preventDefault();
    onRatingSelect(calculateValueFromEvent(e));
  };

  const handleEnd = () => {
    if (!isInteractive) return;
    setIsDragging(false);
  };

  const starArray = Array.from({ length: maxStars }, (_, index) => {
    const starValue = index + 1;
    const isFilled = starValue <= stars;
    const isPartial = !isFilled && starValue - 1 < stars;

    let width = '0%';
    if (isFilled) {
      width = '100%';
    } else if (isPartial) {
      width = `${(stars - (starValue - 1)) * 100}%`;
    }

    return (
      <span key={index} className="star-container" style={{ position: 'relative' }}>
        <span className="star empty">&#9733;</span>
        <span
          className="star filled"
          style={{
            width,
            position: 'absolute',
            top: 0,
            left: 0,
            overflow: 'hidden',
            color: 'gold',
            pointerEvents: 'none',
          }}
        >
          &#9733;
        </span>
      </span>
    );
  });

  return (
    <div
      className="star-rating"
      ref={containerRef}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      style={{
        cursor: isInteractive ? 'pointer' : 'default',
        touchAction: isInteractive ? 'none' : 'auto', // verhindert Scrollen nur bei Interaktivität
      }}
    >
      {starArray}
    </div>
  );
};


Rating.propTypes = {
    stars: PropTypes.number.isRequired,
};

export default Rating;
