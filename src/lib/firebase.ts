import {
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

function cleanEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined;

  return value
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/,\s*$/, "")
    .trim();
}

const envValues = {
  VITE_FIREBASE_API_KEY: cleanEnvValue(env.VITE_FIREBASE_API_KEY),
  VITE_FIREBASE_AUTH_DOMAIN: cleanEnvValue(env.VITE_FIREBASE_AUTH_DOMAIN),
  VITE_FIREBASE_PROJECT_ID: cleanEnvValue(env.VITE_FIREBASE_PROJECT_ID),
  VITE_FIREBASE_STORAGE_BUCKET: cleanEnvValue(env.VITE_FIREBASE_STORAGE_BUCKET),
  VITE_FIREBASE_MESSAGING_SENDER_ID: cleanEnvValue(
    env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  ),
  VITE_FIREBASE_APP_ID: cleanEnvValue(env.VITE_FIREBASE_APP_ID),
};

const missingEnvValues = Object.entries(envValues)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const firebaseEnabled = missingEnvValues.length === 0;

export const firebaseConfigError = firebaseEnabled
  ? null
  : "Firebase configuration is incomplete. Add these variables to .env: " +
    missingEnvValues.join(", ") +
    ". Restart Vite after saving .env.";

const firebaseConfig: FirebaseOptions = {
  apiKey: envValues.VITE_FIREBASE_API_KEY as string,
  authDomain: envValues.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: envValues.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: envValues.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: envValues.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: envValues.VITE_FIREBASE_APP_ID as string,
};

let app: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firestore: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (firebaseEnabled) {
  const existingDefaultApp = getApps().find(
    (existingApp) => existingApp.name === "[DEFAULT]",
  );

  app = existingDefaultApp ?? initializeApp(firebaseConfig);
  firebaseAuth = getAuth(app);
  firestore = getFirestore(app);
  storage = getStorage(app);
}

export const auth = firebaseAuth;
export const db = firestore;
export const firebaseStorage = storage;

let persistencePromise: Promise<void> | null = null;

export function enableAuthPersistence(): Promise<void> {
  if (!auth) {
    return Promise.reject(
      new Error(
        firebaseConfigError ?? "Firebase Authentication is not initialized.",
      ),
    );
  }

  if (!persistencePromise) {
    persistencePromise = setPersistence(auth, browserLocalPersistence).catch(
      (error) => {
        persistencePromise = null;
        throw error;
      },
    );
  }

  return persistencePromise;
}

export function readableFirebaseError(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";

  const messages: Record<string, string> = {
    "auth/api-key-not-valid":
      "Firebase API key is invalid. Copy the Web API key from Firebase Console.",
    "auth/invalid-api-key":
      "Firebase API key is invalid. Copy the Web API key from Firebase Console.",
    "auth/unauthorized-domain":
      "Add this website domain in Firebase Authentication → Settings → Authorized domains.",
    "auth/operation-not-allowed":
      "Enable Email/Password and Google sign-in providers in Firebase Authentication.",
    "auth/invalid-credential":
      "The email or password is incorrect. Check your sign-in details.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/user-disabled":
      "This Firebase account is disabled. Contact a Director.",
    "auth/too-many-requests":
      "Too many sign-in attempts. Wait a moment, then try again.",
    "auth/network-request-failed":
      "The network interrupted sign-in. Check your connection and try again.",
    "auth/popup-blocked":
      "The Google sign-in popup was blocked. Allow popups and try again.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/cancelled-popup-request":
      "A Google sign-in request is already open. Finish or close it first.",
    "permission-denied":
      "Firestore denied access to this profile. Check that the signed-in user can read their own users/{UID} document.",
    unavailable:
      "Firestore is temporarily unavailable. Check your connection and try again.",
    "deadline-exceeded":
      "Firestore took too long to respond. Try again in a moment.",
    "app/firestore-profile-timeout":
      "Firestore is taking too long to load your workspace profile. Check your connection and try again.",
  };

  if (messages[code]) return messages[code];
  if (error instanceof Error && error.message) return error.message;

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return "Something went wrong. Please try again.";
}
