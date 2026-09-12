import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Capacitor } from "@capacitor/core";
import { auth, db } from "./config";

/**
 * Check if running in native Android/iOS Capacitor environment
 */
export const isNativeApp = () => {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
};

// Default Master Staff PIN
export const DEFAULT_PIN = "2012";
const PIN_LOCAL_KEY = "twohearts_admin_pin";
const SETTINGS_COLLECTION = "cafe_settings";
const SECURITY_DOC = "security";

export const STAFF_SESSION_KEY = "twohearts_staff_session";
// Session expires after 24 hours of inactivity or until explicit logout (Native App only)
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Save staff session.
 * STRICT POLICY:
 * - Website versions: NO CACHING. Every access to the admin website must prompt for the PIN.
 * - Native App: Cached in storage to allow 24/7 background order monitoring service.
 */
export const saveStaffSession = (user) => {
  if (!user) return;
  // Website version strictly has NO CACHING - every access requires entering the PIN
  if (!isNativeApp()) {
    return;
  }
  try {
    const sessionData = {
      user: {
        email: user.email || "staff@twoheartscafe.com",
        uid: user.uid || "pin_session",
        displayName: user.displayName || "Cafe Staff"
      },
      savedAt: Date.now(),
      lastActive: Date.now()
    };
    sessionStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(sessionData));
    localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(sessionData));
  } catch (err) {
    console.warn("Could not save staff session to storage:", err);
  }
};

/**
 * Retrieve current active staff session.
 * STRICT POLICY:
 * - Website versions: NO CACHING. Always returns null so PIN is required every time.
 * - Native App: Returns cached user session for continuous background operation.
 */
export const getStaffSession = () => {
  if (typeof window === "undefined") return null;

  // Website version strictly has NO CACHING: every time someone accesses the admin link, they must enter the PIN
  if (!isNativeApp()) {
    try {
      sessionStorage.removeItem(STAFF_SESSION_KEY);
      localStorage.removeItem(STAFF_SESSION_KEY);
    } catch {}
    return null;
  }

  try {
    // 1. Check sessionStorage (active tab / refreshed tab)
    const sessionStr = sessionStorage.getItem(STAFF_SESSION_KEY);
    if (sessionStr) {
      const data = JSON.parse(sessionStr);
      if (data && data.user) {
        data.lastActive = Date.now();
        sessionStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(data));
        return data.user;
      }
    }

    // 2. Check localStorage (handles mobile PWA background memory reloads & switching apps)
    const localStr = localStorage.getItem(STAFF_SESSION_KEY);
    if (localStr) {
      const localData = JSON.parse(localStr);
      if (localData && localData.user) {
        const lastActive = localData.lastActive || localData.savedAt || 0;
        const elapsed = Date.now() - lastActive;

        if (elapsed < SESSION_MAX_AGE_MS) {
          // Valid active session: sync to sessionStorage for tab fast access
          localData.lastActive = Date.now();
          sessionStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(localData));
          localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(localData));
          return localData.user;
        } else {
          // Expired session (> 24 hours of inactivity)
          clearStaffSession();
        }
      }
    }
  } catch (err) {
    console.warn("Could not parse staff session:", err);
  }

  return null;
};

/**
 * Explicitly clear staff session (called on user logout)
 */
export const clearStaffSession = () => {
  try {
    sessionStorage.removeItem(STAFF_SESSION_KEY);
    localStorage.removeItem(STAFF_SESSION_KEY);
  } catch {}
};

/**
 * Retrieve the current admin PIN (from Firestore with fallback to localStorage & DEFAULT_PIN)
 */
export const getAdminPin = async () => {
  const cached = localStorage.getItem(PIN_LOCAL_KEY);
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SECURITY_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data()?.pin) {
      const remotePin = String(snap.data().pin);
      localStorage.setItem(PIN_LOCAL_KEY, remotePin);
      return remotePin;
    }
  } catch (err) {
    console.warn("Could not retrieve remote PIN from Firestore (using local):", err);
  }
  return cached || DEFAULT_PIN;
};

/**
 * Change the admin PIN after verifying the old PIN
 */
export const changeAdminPin = async (currentPin, newPin) => {
  const storedPin = await getAdminPin();

  if (String(currentPin).trim() !== String(storedPin).trim()) {
    return { success: false, error: "Current PIN is incorrect. Verification failed." };
  }

  const cleanNew = String(newPin).trim();
  if (cleanNew.length < 4) {
    return { success: false, error: "New PIN must be at least 4 digits long." };
  }

  if (!/^\d+$/.test(cleanNew)) {
    return { success: false, error: "New PIN must contain only numbers." };
  }

  if (cleanNew === storedPin) {
    return { success: false, error: "New PIN cannot be identical to your current PIN." };
  }

  // Update local storage
  localStorage.setItem(PIN_LOCAL_KEY, cleanNew);

  // Sync to Firestore
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SECURITY_DOC);
    await setDoc(docRef, { pin: cleanNew, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn("Firestore pin sync warning (saved locally):", err);
  }

  return { success: true };
};

/**
 * Staff PIN Quick Unlock
 * Verifies PIN and returns mock staff user session
 */
export const loginWithPin = async (enteredPin) => {
  const correctPin = await getAdminPin();
  if (String(enteredPin).trim() === String(correctPin).trim()) {
    const mockStaffUser = { email: "staff@twoheartscafe.com", uid: "pin_session" };
    saveStaffSession(mockStaffUser);
    return { user: mockStaffUser, error: null };
  }
  return { user: null, error: "Incorrect PIN. Please try again." };
};

/**
 * Sign in with email and password via Firebase
 */
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    saveStaffSession(userCredential.user);
    return { user: userCredential.user, error: null };
  } catch (err) {
    return { user: null, error: err.message };
  }
};

/**
 * Register a new staff / owner account
 */
export const registerWithEmail = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    saveStaffSession(userCredential.user);
    return { user: userCredential.user, error: null };
  } catch (err) {
    return { user: null, error: err.message };
  }
};

/**
 * Explicit staff sign out (clears persistent session requiring PIN on next launch)
 */
export const logoutUser = async () => {
  clearStaffSession();
  try {
    await signOut(auth);
  } catch (err) {
    console.warn("SignOut warning:", err);
  }
};

/**
 * Subscribe to auth state:
 * Restores active staff session and tracks Firebase auth state.
 * (Native app only - website version strictly requires PIN every time)
 */
export const subscribeAuth = (onAuthChange) => {
  if (isNativeApp()) {
    const existingUser = getStaffSession();
    if (existingUser) {
      onAuthChange(existingUser);
    }

    const unsubscribeFirebase = onAuthStateChanged(auth, (user) => {
      if (user) {
        saveStaffSession(user);
        onAuthChange(user);
      } else {
        const activeSession = getStaffSession();
        onAuthChange(activeSession);
      }
    });

    return () => {
      unsubscribeFirebase();
    };
  }

  // Website version: strictly do not auto-login, require PIN entry every time
  return () => {};
};
