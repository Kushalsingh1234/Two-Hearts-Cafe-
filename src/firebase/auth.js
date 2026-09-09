import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./config";

// Default Master Staff PIN
export const DEFAULT_PIN = "2012";
const PIN_LOCAL_KEY = "twohearts_admin_pin";
const SETTINGS_COLLECTION = "cafe_settings";
const SECURITY_DOC = "security";

// Purge any lingering staff sessions on module load so the admin link always asks for the PIN
try {
  localStorage.removeItem("twohearts_staff_session");
  sessionStorage.removeItem("twohearts_staff_session");
} catch {}

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
 * IMPORTANT: In-memory session only. Never cached in localStorage,
 * ensuring that every time someone opens the admin link from the browser,
 * it prompts for the PIN.
 */
export const loginWithPin = async (enteredPin) => {
  const correctPin = await getAdminPin();
  if (String(enteredPin).trim() === String(correctPin).trim()) {
    const mockStaffUser = { email: "staff@twoheartscafe.com", uid: "pin_session" };
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
    return { user: userCredential.user, error: null };
  } catch (err) {
    return { user: null, error: err.message };
  }
};

/**
 * Sign out
 */
export const logoutUser = async () => {
  localStorage.removeItem("twohearts_staff_session");
  try {
    await signOut(auth);
  } catch (err) {
    console.warn("SignOut warning:", err);
  }
};

/**
 * Subscribe to auth state:
 * Ensures no persistent session bypasses the PIN gate when opening the admin link.
 */
export const subscribeAuth = (onAuthChange) => {
  // Purge any saved session from local storage so fresh browser openings ask for PIN
  localStorage.removeItem("twohearts_staff_session");
  return () => {};
};
