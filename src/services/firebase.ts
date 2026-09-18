import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  type Auth,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const env = import.meta.env as Record<string, string | undefined>;

const cleanEnvValue = (value: string | undefined) => {
  if (!value) return undefined;

  return value
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/,\s*$/, "");
};

const firebaseConfig: FirebaseOptions = {
  apiKey: cleanEnvValue(env.VITE_FIREBASE_API_KEY),
  authDomain: cleanEnvValue(env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: cleanEnvValue(env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnvValue(env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnvValue(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnvValue(env.VITE_FIREBASE_APP_ID),
};

const requiredValues = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
];

export const firebaseEnabled = requiredValues.every(
  (value) => typeof value === "string" && value.length > 0,
);

let app: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firestore: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (firebaseEnabled) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  firebaseAuth = getAuth(app);
  firestore = getFirestore(app);
  storage = getStorage(app);
}

export const auth = firebaseAuth;
export const db = firestore;
export const firebaseStorage = storage;

export async function enableAuthPersistence() {
  if (auth) {
    await setPersistence(auth, browserLocalPersistence);
  }
}

export function readableFirebaseError(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";

  const messages: Record<string, string> = {
    "auth/api-key-not-valid":
      "Firebase API key is invalid. Copy the exact Web API key from Firebase Console.",
    "auth/invalid-api-key":
      "Firebase API key is invalid. Copy the exact Web API key from Firebase Console.",
    "auth/unauthorized-domain":
      "Add localhost and 127.0.0.1 in Firebase Authentication → Settings → Authorized domains.",
    "auth/operation-not-allowed":
      "Enable Email/Password and Google sign-in providers in Firebase Authentication.",
    "auth/invalid-credential":
      "The email or password is not correct.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/user-disabled":
      "This account is inactive. Contact a Director.",
    "auth/too-many-requests":
      "Too many attempts. Please wait a moment and try again.",
    "auth/network-request-failed":
      "Network connection failed. Check your connection and retry.",
    "auth/popup-blocked":
      "Google popup was blocked. Allow popups and try again.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/cancelled-popup-request":
      "Another Google sign-in request is already open.",
  };

  return (
    messages[code] ??
    (error instanceof Error
      ? error.message
      : "Something went wrong. Please try again.")
  );
}
