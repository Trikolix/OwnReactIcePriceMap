import React from 'react';
import RegisterForm from '../components/RegisterForm';
import { useParams } from 'react-router-dom';
import Header from "../Header";
import { useUser } from "../context/UserContext";

const RegisterPage = () => {
    const { inviteCode } = useParams();
    const { isLoggedIn } = useUser();

    return (
        <>
            <Header />
            <div style={styles.container}>
                {isLoggedIn ? (
                    <div style={styles.messageBox}>
                        <h2>Du bist bereits eingeloggt.</h2>
                    </div>
                ) : (
                    <div style={styles.formBox}>
                        <RegisterForm inviteCode={inviteCode} />
                    </div>
                )}
            </div>
        </>
    );
};

const styles = {
  container: {
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  formBox: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
  },
  messageBox: {
    textAlign: 'center',
  },
};

export default RegisterPage;
