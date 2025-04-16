import Header from './../Header';
import React, { useState } from 'react';
import { useUser } from './../context/UserContext';

function DashBoard() {
    const { userId, isLoggedIn, login, logout } = useUser();
    const [showSubmitNewIceShop, setShowSubmitNewIceShop] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [zeigeFavoriten, setZeigeFavoriten] = useState(false);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#ffb522' }}>
          <Header
            setShowSubmitNewIceShop={setShowSubmitNewIceShop}
            setShowLoginModal={setShowLoginModal}
            setZeigeFavoriten={setZeigeFavoriten}
          />
          </div>
    )
}

export default DashBoard;