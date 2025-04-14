import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAZ6iQLGjvy0Fe1__5rhKQtIRsOnnv5u0Q",
  authDomain: "connect-more-flutter.firebaseapp.com",
  projectId: "connect-more-flutter",
  storageBucket: "connect-more-flutter.firebasestorage.app",
  messagingSenderId: "94803931328",
  appId: "1:94803931328:web:dd26f0b5f361e2d650bd25"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);

export default app; 