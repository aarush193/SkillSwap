// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getFirestore, Firestore } from "firebase/firestore";
import { getDatabase, Database } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCXoG-IfoLJ5sgK9XwmmJVFmI69KLjjglE",
  authDomain: "timebank-b1dc2.firebaseapp.com",
  projectId: "timebank-b1dc2",
  storageBucket: "timebank-b1dc2.firebasestorage.app", // Corrected to firebasestorage.app from user input
  messagingSenderId: "291438162874",
  appId: "1:291438162874:web:cbd3b64bfeafcaf7d0e383",
  measurementId: "G-HD3DTBTFL9",
  databaseURL: "https://timebank-b1dc2-default-rtdb.firebaseio.com" // Add this line for Realtime Database
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const rtdb: Database = getDatabase(app);
let analytics: Analytics | undefined;

if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.error("Failed to initialize Firebase Analytics:", error);
    // Optionally, you could set analytics to null or a mock object here
    // depending on how your app handles its absence.
  }
}

export { app, auth, db, rtdb, analytics /*, db */ };
