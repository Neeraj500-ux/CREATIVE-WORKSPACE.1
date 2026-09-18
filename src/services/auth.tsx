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
} from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
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

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const AUTH_BOOT_TIMEOUT = 8_000;

type FirestoreProfile = Partial<UserProfile> & {
  email?: string | null;
  active?: boolean;
};

async function getFirebaseProfile(
  firebaseUser: FirebaseUser,
): Promise<UserProfile | null> {
  if (!db) return null;

  const snapshot = await getDoc(doc(db, "users", firebaseUser.uid));

  if (!snapshot.exists()) return null;

  const data = snapshot.data() as FirestoreProfile;

  return {
    ...data,
    id: firebaseUser.uid,
    organizationId: data.organizationId ?? "",
    name: data.name ?? firebaseUser.displayName ?? "Workspace User",
    email: data.email ?? firebaseUser.email ?? "",
    role: (data.role as UserProfile["role"]) ?? "employee",
    title: data.title ?? "Team Member",
    initials: data.initials ?? "WU",
    active: data.active !== false,
    status: data.status ?? "active",
    projectIds: Array.isArray(data.projectIds) ? data.projectIds : [],
    permissions: Array.isArray(data.permissions) ? data.permissions : [],
  } as UserProfile;
}

async function getActiveProfile(firebaseUser: FirebaseUser) {
  const profile = await getFirebaseProfile(firebaseUser);

  if (!profile || profile.active === false) {
    throw new Error(
      "Your Firebase account does not have an active workspace profile.",
    );
  }

  return profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const firebaseAuth = auth;

    if (!firebaseEnabled || !firebaseAuth) {
      setUser(null);
      setAuthError("Firebase is not configured. Check your .env file.");
      setLoading(false);
      return;
    }

    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    let settled = false;

    const bootTimer = window.setTimeout(() => {
      if (disposed || settled) return;

      settled = true;
      setLoading(false);
      setUser(null);
      setAuthError(
        "Firebase authentication took too long to respond. Check your internet connection and Firebase configuration.",
      );
    }, AUTH_BOOT_TIMEOUT);

    const finishBoot = () => {
      if (settled) return;

      settled = true;
      window.clearTimeout(bootTimer);

      if (!disposed) {
        setLoading(false);
      }
    };

    void enableAuthPersistence().catch((error) => {
      if (!disposed) {
        setAuthError(readableFirebaseError(error));
      }
    });

    try {
      unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
        void (async () => {
          if (disposed) return;

          setAuthError(null);

          if (!firebaseUser) {
            setUser(null);
            finishBoot();
            return;
          }

          try {
            const profile = await getActiveProfile(firebaseUser);

            if (!disposed) {
              setUser(profile);
            }
          } catch (error) {
            if (!disposed) {
              setUser(null);
              setAuthError(readableFirebaseError(error));
            }
          } finally {
            finishBoot();
          }
        })();
      });
    } catch (error) {
      setAuthError(readableFirebaseError(error));
      setUser(null);
      finishBoot();
    }

    return () => {
      disposed = true;
      window.clearTimeout(bootTimer);
      unsubscribe?.();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      firebaseMode: firebaseEnabled,
      authError,

      login: async (email, password) => {
        const firebaseAuth = auth;
        const cleanEmail = email.trim();

        setAuthError(null);

        if (!cleanEmail || !password) {
          throw new Error("Enter your email and password.");
        }

        if (!firebaseEnabled || !firebaseAuth) {
          const message =
            "Firebase is not configured. Check your .env file.";
          setAuthError(message);
          throw new Error(message);
        }

        try {
          const result = await signInWithEmailAndPassword(
            firebaseAuth,
            cleanEmail,
            password,
          );

          try {
            const profile = await getActiveProfile(result.user);
            setUser(profile);
          } catch (profileError) {
            await signOut(firebaseAuth).catch(() => undefined);
            throw profileError;
          }
        } catch (error) {
          const message = readableFirebaseError(error);
          setAuthError(message);
          throw new Error(message);
        }
      },

      loginWithGoogle: async () => {
        const firebaseAuth = auth;

        setAuthError(null);

        if (!firebaseEnabled || !firebaseAuth) {
          const message =
            "Firebase is not configured. Check your .env file.";
          setAuthError(message);
          throw new Error(message);
        }

        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: "select_account" });

          const result = await signInWithPopup(firebaseAuth, provider);
          try {
            const profile = await getActiveProfile(result.user);
            setUser(profile);
          } catch (profileError) {
            await signOut(firebaseAuth).catch(() => undefined);
            throw profileError;
          }
        } catch (error) {
          const message = readableFirebaseError(error);
          setAuthError(message);
          throw new Error(message);
        }
      },

      resetPassword: async (email) => {
        const firebaseAuth = auth;
        const cleanEmail = email.trim();

        if (!cleanEmail) {
          throw new Error("Enter your email address.");
        }

        if (!firebaseEnabled || !firebaseAuth) {
          throw new Error(
            "Firebase is not configured. Check your .env file.",
          );
        }

        try {
          await sendPasswordResetEmail(firebaseAuth, cleanEmail);
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
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
