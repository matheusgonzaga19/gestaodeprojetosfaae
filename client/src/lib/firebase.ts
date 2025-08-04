import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onIdTokenChanged,
} from 'firebase/auth';

function requiredEnv(key: keyof ImportMetaEnv) {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

const firebaseConfig = {
  apiKey: requiredEnv('FIREBASE_API_KEY'),
  authDomain: requiredEnv('FIREBASE_AUTH_DOMAIN'),
  projectId: requiredEnv('FIREBASE_AUTH_DOMAIN'),
  storageBucket: requiredEnv('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requiredEnv('FIREBASE_MESSAGING_SENDER_ID'),
  appId: requiredEnv('FIREBASE_APP_ID'),
  measurementId: requiredEnv('FIREBASE_MEASUREMENT_ID'),
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  const token = await result.user.getIdToken();
  localStorage.setItem('firebaseIdToken', token);
  return token;
}

export async function logout() {
  await signOut(auth);
  localStorage.removeItem('firebaseIdToken');
}

export function onAuthTokenChanged(callback: (token: string | null) => void) {
  return onIdTokenChanged(auth, async (user) => {
    const token = user ? await user.getIdToken() : null;
    if (token) {
      localStorage.setItem('firebaseIdToken', token);
    } else {
      localStorage.removeItem('firebaseIdToken');
    }
    callback(token);
  });
}
