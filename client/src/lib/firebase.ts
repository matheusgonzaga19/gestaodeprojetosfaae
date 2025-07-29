import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onIdTokenChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
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
