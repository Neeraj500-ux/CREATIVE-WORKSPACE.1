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
import { cloneSeed } from "../data/seed";
import type { UserProfile } from "../types";
import {
  auth,
  db,
  enableAuthPersistence,
  firebaseConfigError,
  firebaseEnabled,
  readableFirebaseError,
} from "../lib/firebase";

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

const AUTH_BOOT_TIMEOUT_MS = 10_000;
const PROFILE_READ_TIMEOUT_MS = 7_000;
const DEMO_PASSWORD = "demo123";

function isLocalHost() {
  return (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  );
}

function resolveDemoProfile(email: string): UserProfile | null {
  const target = email.trim().toLowerCase();
  if (!target) return null;

  return (
    cloneSeed().users.find(
      (profile) =>
        profile.email.trim().toLowerCase() === target &&
        profile.active !== false,
    ) ?? null
  );
}

type FirestoreProfile = Partial<UserProfile> & {
  email?: string | null;
  active?: boolean;
};

const teamLeaderRole = "team_leader" as UserProfile["role"];

const roleAliases: Record<string, UserProfile["role"]> = {
  director: "director",
  super_admin: "director",
  manager: "manager",
  admin: "manager",
  team_lead: teamLeaderRole,
  team_leader: teamLeaderRole,
  leader: teamLeaderRole,
  employee: "employee",
  client: "client",
};

function normalizeWorkspaceRole(value: unknown): UserProfile["role"] | null {
  if (typeof value !== "string") return null;

  const roleKey = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return roleAliases[roleKey] ?? null;
}

function withTimeout<T>(
  request: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(message);
      Object.assign(error, { code: "app/firestore-profile-timeout" });
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([request, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

async function getFirebaseProfile(
  firebaseUser: FirebaseUser,
): Promise<UserProfile> {
  if (!db) {
    throw new Error(
      firebaseConfigError ?? "Firestore is not initialized. Check Firebase setup.",
    );
  }

  const snapshot = await withTimeout(
    getDoc(doc(db, "users", firebaseUser.uid)),
    PROFILE_READ_TIMEOUT_MS,
    "Firestore is taking too long to load your workspace profile. Check your connection and try again.",
  );

  if (!snapshot.exists()) {
    throw new Error(
      "No workspace profile was found for this Firebase account. In Firestore, the document ID under users must exactly match the UID in Authentication → Users.",
    );
  }

  const data = snapshot.data() as FirestoreProfile;
  const role = normalizeWorkspaceRole(data.role);

  if (!role) {
    throw new Error(
      "This workspace profile has a missing or unsupported role. Use director, manager, team_leader, employee, or client.",
    );
  }

  const status = String(data.status ?? "").trim().toLowerCase();
  const inactiveStatuses = ["inactive", "disabled", "deactivated"];

  if (data.active !== true || inactiveStatuses.includes(status)) {
    throw new Error(
      data.active === false || inactiveStatuses.includes(status)
        ? "This workspace profile is inactive. Ask a Director to activate it."
        : "This workspace profile is missing active: true. Add active as a Boolean field in Firestore.",
    );
  }

  const profileEmail = String(
    data.email ?? firebaseUser.email ?? "",
  ).trim();

  if (
    firebaseUser.email &&
    profileEmail &&
    profileEmail.toLowerCase() !== firebaseUser.email.toLowerCase()
  ) {
    throw new Error(
      "The workspace profile email does not match the signed-in Firebase account.",
    );
  }

  const displayName = data.name ?? firebaseUser.displayName ?? "Workspace User";
  const generatedInitials =
    displayName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "WU";

  return {
    ...data,
    id: firebaseUser.uid,
    organizationId: data.organizationId ?? "",
    name: displayName,
    email: profileEmail,
    role,
    title: data.title ?? "Team Member",
    initials: data.initials ?? generatedInitials,
    active: true,
    status: data.status ?? "active",
    projectIds: Array.isArray(data.projectIds) ? data.projectIds : [],
    permissions: Array.isArray(data.permissions) ? data.permissions : [],
  } as UserProfile;
}

type CachedProfileRequest = {
  promise: Promise<UserProfile>;
  expiresAt: number;
};

const profileCache = new Map<string, CachedProfileRequest>();

function getActiveProfile(firebaseUser: FirebaseUser): Promise<UserProfile> {
  const uid = firebaseUser.uid;
  const cached = profileCache.get(uid);

  if (cached && (cached.expiresAt === Number.POSITIVE_INFINITY || cached.expiresAt > Date.now())) {
    return cached.promise;
  }

  if (cached) profileCache.delete(uid);

  const entry: CachedProfileRequest = {
    promise: Promise.resolve(null as unknown as UserProfile),
    expiresAt: Number.POSITIVE_INFINITY,
  };
  const request = getFirebaseProfile(firebaseUser)
    .then((profile) => {
      entry.expiresAt = Date.now() + 1_500;
      return profile;
    })
    .catch((error) => {
      if (profileCache.get(uid) === entry) profileCache.delete(uid);
      throw error;
    });

  entry.promise = request;
  profileCache.set(uid, entry);

  return request;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const firebaseAuth = auth;

    if (!firebaseEnabled || !firebaseAuth) {
      setUser(null);
      setAuthError(null);
      setLoading(false);
      return;
    }

    let disposed = false;
    let settled = false;
    let authEventVersion = 0;
    let unsubscribe: (() => void) | undefined;

    const bootTimer = window.setTimeout(() => {
      if (disposed || settled) return;

      settled = true;
      setUser(null);
      setLoading(false);
      setAuthError(
        "Firebase authentication took too long to respond. Check your internet connection and Firebase configuration.",
      );
    }, AUTH_BOOT_TIMEOUT_MS);

    const finishBoot = () => {
      if (settled) return;

      settled = true;
      window.clearTimeout(bootTimer);
      if (!disposed) setLoading(false);
    };

    const startAuthListener = async () => {
      try {
        await enableAuthPersistence();
        if (disposed) return;

        unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
          const eventVersion = ++authEventVersion;
          if (disposed) return;

          if (!firebaseUser) {
            setUser(null);
            setAuthError(null);
            finishBoot();
            return;
          }

          setAuthError(null);

          void getActiveProfile(firebaseUser)
            .then((profile) => {
              if (
                !disposed &&
                eventVersion === authEventVersion &&
                firebaseAuth.currentUser?.uid === firebaseUser.uid
              ) {
                setUser(profile);
              }
            })
            .catch((error) => {
              if (
                !disposed &&
                eventVersion === authEventVersion &&
                firebaseAuth.currentUser?.uid === firebaseUser.uid
              ) {
                setUser(null);
                setAuthError(readableFirebaseError(error));
              }
            })
            .finally(finishBoot);
        });
      } catch (error) {
        if (!disposed) {
          setUser(null);
          setAuthError(readableFirebaseError(error));
          finishBoot();
        }
      }
    };

    void startAuthListener();

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

        const demoProfile = resolveDemoProfile(cleanEmail);
        const localDemoAllowed =
          isLocalHost() && demoProfile !== null && password === DEMO_PASSWORD;

        if (localDemoAllowed && demoProfile) {
          setUser(demoProfile);
          return;
        }

        if (!firebaseEnabled || !firebaseAuth) {
          const message =
            firebaseConfigError ??
            "Firebase is not configured. Check your .env file and restart Vite.";
          setAuthError(message);
          throw new Error(message);
        }

        try {
          await enableAuthPersistence();

          const result = await signInWithEmailAndPassword(
            firebaseAuth,
            cleanEmail,
            password,
          );

          try {
            const profile = await getActiveProfile(result.user);
            setUser(profile);
          } catch (profileError) {
            profileCache.delete(result.user.uid);
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
            firebaseConfigError ??
            "Firebase is not configured. Check your .env file and restart Vite.";
          setAuthError(message);
          throw new Error(message);
        }

        try {
          await enableAuthPersistence();

          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: "select_account" });

          const result = await signInWithPopup(firebaseAuth, provider);

          try {
            const profile = await getActiveProfile(result.user);
            setUser(profile);
          } catch (profileError) {
            profileCache.delete(result.user.uid);
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

        setAuthError(null);

        if (!cleanEmail) {
          throw new Error("Enter your email address.");
        }

        if (!firebaseEnabled || !firebaseAuth) {
          const message =
            firebaseConfigError ??
            "Firebase is not configured. Check your .env file and restart Vite.";
          setAuthError(message);
          throw new Error(message);
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
        const currentUid = auth?.currentUser?.uid;

        if (auth) {
          await signOut(auth);
        }

        if (currentUid) profileCache.delete(currentUid);
        setUser(null);
        setAuthError(null);
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
