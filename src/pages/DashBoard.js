import Header from './../Header';
import React, { useState } from 'react';
import { useUser } from './../context/UserContext';
import styled from "styled-components";

function DashBoard() {
    const { userId, isLoggedIn, login, logout } = useUser();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#ffb522' }}>
          <Header/>
          <Container>
            <Title>Dashboard</Title>
            </Container>
          </div>
    )
}

export default DashBoard;

const Container = styled.div`
  padding: 1rem;
  background-color: white;
  height: 100vh;
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-align: center;
`;