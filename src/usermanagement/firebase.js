// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCZ1m3M7iIz8yWK9toxfmcN6NB1qulmueE",
    authDomain: "iceapp-787d8.firebaseapp.com",
    projectId: "iceapp-787d8",
    storageBucket: "iceapp-787d8.firebasestorage.app",
    messagingSenderId: "602941630393",
    appId: "1:602941630393:web:0d0dc1da6413a4e4523868"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// const googleProvider = new GoogleAuthProvider();
// const facebookProvider = new FacebookAuthProvider();

export { auth };
