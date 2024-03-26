// src/firebase/initFirebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyDsHCGqSYfpqEhApGJoTUzxKsW7f9iNgcE",
    authDomain: "market-simulator-f022a.firebaseapp.com",
    projectId: "market-simulator-f022a",
    storageBucket: "market-simulator-f022a.appspot.com",
    messagingSenderId: "654715398251",
    appId: "1:654715398251:web:701d4bd24e4e6f4d95692e",
    measurementId: "G-XL7WGM33W9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services that you want to use
export const analytics = getAnalytics(app);

// Export the Firebase app instance as well in case it's needed
export default app;
