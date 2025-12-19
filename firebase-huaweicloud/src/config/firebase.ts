import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAYB1eaz-23-DMfExWP0Dt2GL7494JM5Pk",
  authDomain: "temp-doc.firebaseapp.com",
  projectId: "temp-doc",
  storageBucket: "temp-doc.firebasestorage.app",
  messagingSenderId: "220923361824",
  appId: "1:220923361824:web:60e635e8be10b986e29a45",
  measurementId: "G-5C9QXBV18X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
