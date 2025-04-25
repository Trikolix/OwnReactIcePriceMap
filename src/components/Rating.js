import React from 'react';
import PropTypes from 'prop-types';
import './Rating.css';

const Rating = ({ stars }) => {
    const maxStars = 5;
    const starArray = Array.from({ length: maxStars }, (_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= stars;
        const isPartial = !isFilled && starValue - 1 < stars;

        let width = '0%';
        if (isFilled) {
            width = '100%'
        } else if (isPartial) {
            width = `${(stars - (starValue - 1)) * 100}%`;
        }
        return (
            <span key={index} className="star-container">
                <span className="star empty">&#9733;</span>
                <span className="star filled" style={{ width }}>
                    &#9733;
                </span>
            </span>
        );
    });

    return <div className="star-rating">{starArray}</div>;
};

Rating.propTypes = {
    stars: PropTypes.number.isRequired,
};

export default Rating;
