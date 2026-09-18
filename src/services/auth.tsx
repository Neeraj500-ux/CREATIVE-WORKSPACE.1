import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";
import type { UserProfile } from "../types";

import {
  auth,
  db,
  enableAuthPersistence,
  firebaseEnabled,
  readableFirebaseError,
} from "./firebase";

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  firebaseMode: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});

type FirestoreProfile = Partial<UserProfile> & {
  email?: string | null;
  active?: boolean;
};

async function getFirebaseProfile(
  firebaseUser: FirebaseUser,
): Promise<UserProfile | null> {
  if (!db) return null;

  const profileSnapshot = await getDoc(
    doc(db, "users", firebaseUser.uid),
  );

  if (!profileSnapshot.exists()) {
    return null;
  }

  const data = profileSnapshot.data() as FirestoreProfile;

  return {
    ...data,
    id: firebaseUser.uid,
    email: data.email ?? firebaseUser.email ?? "",
    active: data.active !== false,
  } as UserProfile;
}

async function getValidatedProfile(firebaseUser: FirebaseUser) {
  if (!auth) {
    throw new Error("Firebase authentication is not configured.");
  }

  const profile = await getFirebaseProfile(firebaseUser);

  if (!profile || profile.active === false) {
    await signOut(auth).catch(() => undefined);

    throw new Error(
      "Your Firebase account does not have an active workspace profile.",
    );
  }

  return profile;
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseEnabled || !auth) {
      setAuthError(
        "Firebase configured nahi hai. .env file check karein.",
      );
      setLoading(false);
      return;
    }

    let disposed = false;

    void enableAuthPersistence().catch((error) => {
      if (!disposed) {
        setAuthError(readableFirebaseError(error));
      }
    });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      void (async () => {
        if (disposed) return;

        setLoading(true);
        setAuthError(null);

        if (!firebaseUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        try {
          const profile = await getFirebaseProfile(firebaseUser);

          if (disposed) return;

          if (!profile || profile.active === false) {
            setUser(null);
            setAuthError(
              "Active workspace profile nahi mila.",
            );
            return;
          }

          setUser(profile);
        } catch (error) {
          if (!disposed) {
            setUser(null);
            setAuthError(readableFirebaseError(error));
          }
        } finally {
          if (!disposed) {
            setLoading(false);
          }
        }
      })();
    });

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      firebaseMode: firebaseEnabled,
      authError,

      login: async (email, password) => {
        setAuthError(null);

        const cleanEmail = email.trim();

        if (!cleanEmail || !password) {
          throw new Error("Email aur password enter karein.");
        }

        if (!firebaseEnabled || !auth) {
          const message =
            "Firebase configured nahi hai. .env file check karein.";

          setAuthError(message);
          throw new Error(message);
        }

        try {
          const result = await signInWithEmailAndPassword(
            auth,
            cleanEmail,
            password,
          );

          const profile = await getValidatedProfile(result.user);

          setUser(profile);
        } catch (error) {
          const message = readableFirebaseError(error);
          setAuthError(message);
          throw new Error(message);
        }
      },

      loginWithGoogle: async () => {
        setAuthError(null);

        if (!firebaseEnabled || !auth) {
          const message =
            "Firebase configured nahi hai. .env file check karein.";

          setAuthError(message);
          throw new Error(message);
        }

        try {
          const result = await signInWithPopup(
            auth,
            googleProvider,
          );

          const profile = await getValidatedProfile(result.user);

          setUser(profile);
        } catch (error) {
          const message = readableFirebaseError(error);
          setAuthError(message);
          throw new Error(message);
        }
      },

      resetPassword: async (email) => {
        const cleanEmail = email.trim();

        if (!cleanEmail) {
          throw new Error("Email address enter karein.");
        }

        if (!firebaseEnabled || !auth) {
          throw new Error(
            "Firebase configured nahi hai. .env file check karein.",
          );
        }

        try {
          await sendPasswordResetEmail(auth, cleanEmail);
        } catch (error) {
          const message = readableFirebaseError(error);
          setAuthError(message);
          throw new Error(message);
        }
      },

      logout: async () => {
        if (auth) {
          await signOut(auth);
        }

        setUser(null);
      },
    }),
    [authError, loading, user],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}