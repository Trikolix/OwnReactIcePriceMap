// src/Login.js
import React from 'react';
import { auth, googleProvider, facebookProvider } from './firebase';
import { signInWithPopup } from 'firebase/auth';

const Login = () => {
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      console.log('Google Token:', token);
      // Sende den Token an dein Backend
    } catch (error) {
      console.error('Error during Google login:', error);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      const token = await result.user.getIdToken();
      console.log('Facebook Token:', token);
      // Sende den Token an dein Backend
    } catch (error) {
      console.error('Error during Facebook login:', error);
    }
  };

  return (
    <div>
      <button onClick={handleGoogleLogin}>Login with Google</button>
      <button onClick={handleFacebookLogin}>Login with Facebook</button>
    </div>
  );
};

export default Login;
