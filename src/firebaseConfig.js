// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBQOWOL0nXHwo-0DdGCNukJ0p4otHfefZQ",
  authDomain: "lfst-finance-app.firebaseapp.com",
  projectId: "lfst-finance-app",
  storageBucket: "lfst-finance-app.firebasestorage.app",
  messagingSenderId: "481299220328",
  appId: "1:481299220328:web:6f280b924c2aea9328b8dd",
  measurementId: "G-DY5MLMFXM4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firestore
export const db = getFirestore(app);
export default app;
