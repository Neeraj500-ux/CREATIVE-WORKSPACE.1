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

const firebaseConfig: FirebaseOptions = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

const requiredConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
];

export const firebaseEnabled = requiredConfig.every(Boolean);

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firestore: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (firebaseEnabled) {
  firebaseApp = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);

  firebaseAuth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);
  storage = getStorage(firebaseApp);
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
    typeof error === "object" &&
    error !== null &&
    "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";

  const messages: Record<string, string> = {
    "auth/invalid-credential":
      "Email ya password galat hai.",
    "auth/invalid-email":
      "Valid email address enter karein.",
    "auth/user-disabled":
      "Ye account inactive hai. Director se contact karein.",
    "auth/too-many-requests":
      "Bahut zyada attempts ho gaye. Thodi der baad try karein.",
    "auth/network-request-failed":
      "Network connection failed. Internet check karein.",
    "auth/operation-not-allowed":
      "Firebase Console me Email/Password login enable karein.",
    "auth/invalid-api-key":
      "Firebase API key galat hai.",
    "permission-denied":
      "Firestore permission denied. Security Rules check karein.",
  };

  return (
    messages[code] ??
    (error instanceof Error
      ? error.message
      : "Login failed. Please try again.")
  );
}