import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD8QCty87P075OsXycE5dWclXFzcywpd0o",
  authDomain: "telbin.firebaseapp.com",
  projectId: "telbin",
  storageBucket: "telbin.firebasestorage.app",
  messagingSenderId: "303025158806",
  appId: "1:303025158806:web:6b12ba8368493bcc99a0b7",
  measurementId: "G-54CTE31TFL"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);