import styled from 'styled-components';

const RegionMetaPill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  background: rgba(47, 33, 0, 0.04);
  border: 1px solid rgba(47, 33, 0, 0.08);
  color: #5b4520;
  font-size: 0.78rem;
  font-weight: 700;
  text-decoration: none;

  &:hover {
    background: rgba(255, 181, 34, 0.14);
    color: #2f2100;
  }
`;

export default RegionMetaPill;
