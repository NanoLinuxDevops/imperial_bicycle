// Firebase Configuration and Setup
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";
// Your Firebase configuration
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {

  apiKey: "AIzaSyCUIt6dy38voyepefU-CsFsSo3cr8oS22U",

  authDomain: "imperial-767c7.firebaseapp.com",

  projectId: "imperial-767c7",

  storageBucket: "imperial-767c7.firebasestorage.app",

  messagingSenderId: "636975167960",

  appId: "1:636975167960:web:af7c321665c17fe651daad",

  measurementId: "G-DJES7MX0N1"

};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const analytics = getAnalytics(app);
// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// For development - connect to emulators if running locally
if (location.hostname === 'localhost') {
  // Uncomment these lines if you want to use Firebase emulators for local development
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectAuthEmulator(auth, 'http://localhost:9099');
}

export default app;









