import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const MentionLink = styled(Link)`
  color: #2b6cb0;
  text-decoration: none;
  font-weight: 500;
  &:hover {
    text-decoration: underline;
  }
`;

const MentionFormatter = ({ text }) => {
  if (!text) return null;

  const parts = text.split(/(@[a-zA-Z0-9_.-]+)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          return (
            <MentionLink key={i} to={`/user/${part}`}>
              {part}
            </MentionLink>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

export default MentionFormatter;
