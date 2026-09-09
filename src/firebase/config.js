import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Cafe Firebase configuration provided by the user
export const firebaseConfig = {
  apiKey: "AIzaSyAkXufx8FsFT-HA0vsxxB6TuvOMAKzfwLE",
  authDomain: "two-hearts-cafe-1144c.firebaseapp.com",
  projectId: "two-hearts-cafe-1144c",
  storageBucket: "two-hearts-cafe-1144c.firebasestorage.app",
  messagingSenderId: "753799219299",
  appId: "1:753799219299:web:d65816128b4a9bb92c9056"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);
