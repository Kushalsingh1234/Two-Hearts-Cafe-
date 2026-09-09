import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { auth } from "./config";

// Master Staff PIN for quick counter unlock
const MASTER_PIN = "2012";

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
 * Staff PIN Quick Unlock (for kitchen counter tablets)
 */
export const loginWithPin = (enteredPin) => {
  if (enteredPin === MASTER_PIN) {
    const mockStaffUser = { email: "staff@twoheartscafe.com", uid: "pin_session" };
    localStorage.setItem("twohearts_staff_session", JSON.stringify(mockStaffUser));
    return { user: mockStaffUser, error: null };
  }
  return { user: null, error: "Incorrect PIN. Please try again." };
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
 * Listen to auth state
 */
export const subscribeAuth = (onAuthChange) => {
  const localSession = localStorage.getItem("twohearts_staff_session");
  if (localSession) {
    try {
      onAuthChange(JSON.parse(localSession));
    } catch {}
  }

  return onAuthStateChanged(auth, (user) => {
    if (user) {
      onAuthChange(user);
    } else if (!localStorage.getItem("twohearts_staff_session")) {
      onAuthChange(null);
    }
  });
};
