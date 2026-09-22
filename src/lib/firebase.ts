import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  Auth,
  User 
} from 'firebase/auth';
import { initializeFirestore, Firestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyCul37i4tY3R9eFRmmuqB1NfsynueCcSBk",
  authDomain: "kinora-62da7.firebaseapp.com",
  databaseURL: "https://kinora-62da7-default-rtdb.firebaseio.com",
  projectId: "kinora-62da7",
  storageBucket: "kinora-62da7.firebasestorage.app",
  messagingSenderId: "6150387430",
  appId: "1:6150387430:web:fb300bb290cf839754ed27",
  measurementId: "G-CMSS31N9T3"
};

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth: Auth = getAuth(app);
const db: Firestore = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
});

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

export { app, auth, db };
