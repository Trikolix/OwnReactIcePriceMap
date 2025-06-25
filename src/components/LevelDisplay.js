import React from 'react';
import styled from 'styled-components';

export default function LevelDisplay({ levelInfo }) {
  if (!levelInfo) return null;

  const { level, level_name, percent_to_next, ep_current, ep_to_next } = levelInfo;
    console.log(levelInfo)
  return (
    <Container>
      <Title>Level {level}</Title>
      <LevelText>{level_name}</LevelText>
      <ProgressBarContainer>
        <ProgressBar percent={percent_to_next} />
      </ProgressBarContainer>
      <LevelText><strong>{ep_current} EP</strong> – noch <strong>{ep_to_next ?? 0}</strong> bis zum nächsten Level</LevelText>
    </Container>
  );
}

const Container = styled.div`
  padding: 1rem;
  border-radius: 12px;
  background: #f5f5f5;
  max-width: 400px;
  margin: 1rem auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  text-align: center;
`;

const LevelText = styled.p`
  font-size: 1rem;
  text-align: center;
  margin: 0.25rem 0;
`;

const ProgressBarContainer = styled.div`
  background: #ddd;
  border-radius: 8px;
  overflow: hidden;
  height: 20px;
  margin-top: 1rem;
`;

const ProgressBar = styled.div`
  background: linear-gradient(to right, #4caf50, #8bc34a);
  height: 100%;
  width: ${props => props.percent}%;
  transition: width 0.4s ease;
`;
