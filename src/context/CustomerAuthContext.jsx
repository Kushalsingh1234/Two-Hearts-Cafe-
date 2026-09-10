import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { db, auth } from "../firebase/config";

const CustomerAuthContext = createContext(null);

const CUSTOMER_SESSION_KEY = "twohearts_customer_user_v1";
const ALL_CUSTOMERS_KEY = "twohearts_all_customers_registry_v1";
const ADDRESSES_STORAGE_KEY = "twohearts_customer_addresses_v1";
const SETTINGS_STORAGE_KEY = "twohearts_account_settings_v1";

// Helper: Purge any fake or dummy placeholder addresses
export const sanitizeAddresses = (list) => {
  if (!Array.isArray(list)) return [];
  return list.filter((addr) => {
    if (!addr || typeof addr !== "object") return false;
    if (typeof addr.id === "string" && (addr.id.includes("default") || addr.id.includes("fake") || addr.id.includes("mock"))) return false;
    if (addr.phone === "9876543210") return false;
    if (typeof addr.address === "string" && (addr.address.includes("Aryabhatt") || addr.address.includes("Shivam Vihar Colony, Delhi-Meerut"))) return false;
    return true;
  });
};

// Helper: Purge any fake payment methods
export const sanitizePaymentMethods = (list) => {
  if (!Array.isArray(list)) return [];
  return list.filter((pm) => {
    if (!pm || typeof pm !== "object") return false;
    if (pm.upiId === "user@okhdfcbank" || pm.last4 === "4242" || pm.id === "pm_upi_1" || pm.id === "pm_card_1") return false;
    return true;
  });
};

export function CustomerAuthProvider({ children }) {
  // 1. Current logged-in customer session
  const [customerUser, setCustomerUser] = useState(() => {
    try {
      const saved = localStorage.getItem(CUSTOMER_SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 2. Saved Addresses state (starts EMPTY - real addresses only)
  const [savedAddresses, setSavedAddresses] = useState(() => {
    try {
      // Purge any legacy global key holding fake addresses
      const legacy = localStorage.getItem(ADDRESSES_STORAGE_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        const clean = sanitizeAddresses(parsed);
        if (clean.length === 0) {
          localStorage.removeItem(ADDRESSES_STORAGE_KEY);
        } else {
          localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(clean));
        }
      }

      // Check current user's real saved addresses
      const savedUser = localStorage.getItem(CUSTOMER_SESSION_KEY);
      if (savedUser) {
        const u = JSON.parse(savedUser);
        const userKey = u?.phone || u?.email;
        if (userKey) {
          const stored = localStorage.getItem(`twohearts_addresses_${userKey}`);
          if (stored) {
            return sanitizeAddresses(JSON.parse(stored));
          }
          if (u.addresses && Array.isArray(u.addresses)) {
            return sanitizeAddresses(u.addresses);
          }
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // Sync addresses per customer
  useEffect(() => {
    try {
      const clean = sanitizeAddresses(savedAddresses);
      if (customerUser?.phone || customerUser?.email) {
        const userKey = customerUser.phone || customerUser.email;
        localStorage.setItem(`twohearts_addresses_${userKey}`, JSON.stringify(clean));

        // Sync to remote Firestore customer record
        try {
          if (customerUser.email) {
            setDoc(doc(db, "customers", customerUser.email.toLowerCase()), { addresses: clean }, { merge: true });
          }
          if (customerUser.phone) {
            setDoc(doc(db, "customers", customerUser.phone), { addresses: clean }, { merge: true });
          }
        } catch (e) {}
      }
    } catch (err) {
      console.warn("Error saving addresses:", err);
    }
  }, [savedAddresses, customerUser]);

  // When customer changes, load their real addresses
  useEffect(() => {
    if (!customerUser) {
      setSavedAddresses([]);
      return;
    }
    const userKey = customerUser.phone || customerUser.email;
    if (userKey) {
      const stored = localStorage.getItem(`twohearts_addresses_${userKey}`);
      if (stored) {
        setSavedAddresses(sanitizeAddresses(JSON.parse(stored)));
      } else if (customerUser.addresses && Array.isArray(customerUser.addresses)) {
        setSavedAddresses(sanitizeAddresses(customerUser.addresses));
      } else {
        setSavedAddresses([]);
      }
    }
  }, [customerUser?.phone, customerUser?.email]);

  // 3. Settings state (Notification preferences & Payment methods)
  const [notificationSettings, setNotificationSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return saved
        ? JSON.parse(saved)
        : {
            smsUpdates: true,
            promoOffers: true,
            whatsappTracking: true,
            emailReceipts: true
          };
    } catch {
      return {
        smsUpdates: true,
        promoOffers: true,
        whatsappTracking: true,
        emailReceipts: true
      };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(notificationSettings));
    } catch (err) {
      console.warn("Error saving settings:", err);
    }
  }, [notificationSettings]);

  // Real linked payment methods (starts EMPTY - only real user-added methods)
  const [savedPaymentMethods, setSavedPaymentMethods] = useState(() => {
    try {
      const saved = localStorage.getItem("twohearts_customer_pm_v1");
      if (!saved) return [];
      return sanitizePaymentMethods(JSON.parse(saved));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("twohearts_customer_pm_v1", JSON.stringify(savedPaymentMethods));
    } catch (err) {
      console.warn("Error saving payment methods:", err);
    }
  }, [savedPaymentMethods]);

  // 4. Auth Modal global state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [onAuthSuccessCallback, setOnAuthSuccessCallback] = useState(null);

  // 5. Pending Google Profile state (when user signs in with Gmail and needs to provide Name, Mobile, Email)
  const [pendingProfile, setPendingProfile] = useState(null); // { uid, name, email, phone, photoURL }

  // Sync customer session to localStorage
  useEffect(() => {
    try {
      if (customerUser) {
        localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(customerUser));
      } else {
        localStorage.removeItem(CUSTOMER_SESSION_KEY);
      }
    } catch (err) {
      console.warn("Error saving customer session:", err);
    }
  }, [customerUser]);

  // Helper: Retrieve all registered customers from localStorage
  const getRegisteredCustomers = () => {
    try {
      const data = localStorage.getItem(ALL_CUSTOMERS_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  };

  // Helper: Save a customer to registry
  const saveCustomerToRegistry = async (user) => {
    try {
      const current = getRegisteredCustomers();
      if (user.phone) current[user.phone] = user;
      if (user.email) current[user.email.toLowerCase()] = user;
      localStorage.setItem(ALL_CUSTOMERS_KEY, JSON.stringify(current));

      // Attempt remote Firestore backup (non-blocking)
      try {
        if (user.email) {
          await setDoc(doc(db, "customers", user.email.toLowerCase()), user, { merge: true });
        }
        if (user.phone) {
          await setDoc(doc(db, "customers", user.phone), user, { merge: true });
        }
      } catch (e) {}
    } catch (err) {
      console.warn("Registry save warning:", err);
    }
  };

  /**
   * 1. Sign In via Google (Gmail)
   */
  const signInWithGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const email = user.email || "";
      const name = user.displayName || "";
      const photoURL = user.photoURL || "";
      const uid = user.uid;

      // 1. Check local customer registry
      const registry = getRegisteredCustomers();
      let existingCustomer = null;

      for (const key of Object.keys(registry)) {
        const c = registry[key];
        if ((email && c.email?.toLowerCase() === email.toLowerCase()) || c.firebaseUid === uid) {
          existingCustomer = c;
          break;
        }
      }

      // 2. Check remote Firestore customers collection if not in local
      if (!existingCustomer && email) {
        try {
          const emailDoc = await getDoc(doc(db, "customers", email.toLowerCase()));
          if (emailDoc.exists()) {
            existingCustomer = emailDoc.data();
          } else {
            const uidDoc = await getDoc(doc(db, "customers", uid));
            if (uidDoc.exists()) {
              existingCustomer = uidDoc.data();
            }
          }
        } catch (e) {
          console.warn("Firestore customer check warning:", e);
        }
      }

      // If existing customer already has complete info including 10-digit mobile
      if (existingCustomer && existingCustomer.phone && existingCustomer.phone.length === 10) {
        existingCustomer.firebaseUid = uid;
        if (photoURL && !existingCustomer.avatarUrl) {
          existingCustomer.avatarUrl = photoURL;
        }
        await saveCustomerToRegistry(existingCustomer);
        setCustomerUser(existingCustomer);
        setPendingProfile(null);
        if (onAuthSuccessCallback) {
          onAuthSuccessCallback(existingCustomer);
          setOnAuthSuccessCallback(null);
        }
        setIsAuthModalOpen(false);
        return { success: true, isNewUser: false, user: existingCustomer };
      }

      // User needs to provide/confirm Name, Mobile Number, Email
      const pendingData = {
        uid,
        name: existingCustomer?.name || name || "",
        email: existingCustomer?.email || email || "",
        phone: existingCustomer?.phone || "",
        photoURL
      };
      setPendingProfile(pendingData);
      return { success: true, isNewUser: true, pendingData };
    } catch (err) {
      console.error("Google Sign-In Error:", err);
      let errorMsg = "Google Sign-In was cancelled or failed.";
      if (err.code === "auth/popup-closed-by-user") {
        errorMsg = "Sign-in popup was closed before completing.";
      } else if (err.code === "auth/unauthorized-domain") {
        errorMsg = "This domain is not authorized for Google Sign-In in Firebase Console. Go to Firebase Console > Authentication > Settings > Authorized Domains.";
      } else if (err.code === "auth/popup-blocked") {
        errorMsg = "Sign-in popup was blocked by your browser. Please allow popups for this site.";
      } else if (err.message) {
        errorMsg = err.message;
      }
      return { success: false, error: errorMsg };
    }
  }, [onAuthSuccessCallback]);

  /**
   * 2. Complete Profile after Gmail Sign-In (Name, Mobile, Email)
   */
  const completeProfile = useCallback(async ({ name, phone, email }) => {
    if (!name || name.trim().length < 2) {
      return { success: false, error: "Please enter your full name (at least 2 characters)." };
    }
    const cleanPhone = (phone || "").replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      return { success: false, error: "Please enter a valid 10-digit mobile number for delivery." };
    }
    if (!email || !email.includes("@")) {
      return { success: false, error: "Please enter a valid email address." };
    }

    const uid = pendingProfile?.uid || auth.currentUser?.uid || `usr_${Date.now().toString(36)}`;
    const avatarMonogram = name.trim().slice(0, 2).toUpperCase();

    const customerRecord = {
      id: `cust_${cleanPhone}`,
      firebaseUid: uid,
      phone: cleanPhone,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      avatarUrl: pendingProfile?.photoURL || "",
      avatarMonogram,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await saveCustomerToRegistry(customerRecord);
    setCustomerUser(customerRecord);
    setPendingProfile(null);

    if (onAuthSuccessCallback) {
      onAuthSuccessCallback(customerRecord);
      setOnAuthSuccessCallback(null);
    }

    setIsAuthModalOpen(false);
    return { success: true, user: customerRecord };
  }, [pendingProfile, onAuthSuccessCallback]);

  /**
   * Quick Demo Google Sign-In for testing environments
   */
  const demoGoogleSignIn = useCallback(async (demoEmail = "customer@gmail.com", demoName = "Demo Customer") => {
    const pendingData = {
      uid: `demo_uid_${Date.now()}`,
      name: demoName,
      email: demoEmail,
      phone: "",
      photoURL: ""
    };
    setPendingProfile(pendingData);
    return { success: true, isNewUser: true, pendingData };
  }, []);

  /**
   * Cancel pending profile onboarding
   */
  const cancelPendingAuth = useCallback(() => {
    setPendingProfile(null);
  }, []);

  /**
   * Update profile info (Name & Email & Avatar)
   */
  const updateProfile = useCallback(async ({ name, email, avatarMonogram }) => {
    if (!customerUser) return { success: false, error: "No active user session." };
    if (!name || name.trim().length < 2) {
      return { success: false, error: "Please enter a valid name." };
    }

    const updated = {
      ...customerUser,
      name: name.trim(),
      email: (email || "").trim(),
      avatarMonogram: (avatarMonogram || customerUser.avatarMonogram || name.trim().slice(0, 2)).toUpperCase(),
      updatedAt: new Date().toISOString()
    };

    setCustomerUser(updated);
    await saveCustomerToRegistry(updated);
    return { success: true, user: updated };
  }, [customerUser]);

  // ADDRESS MANAGEMENT METHODS
  const addAddress = useCallback((newAddr) => {
    const cleanAddress = (newAddr.address || "").trim();
    const cleanLandmark = (newAddr.landmark || "").trim();
    const cleanRecipient = (newAddr.recipientName || customerUser?.name || "Customer").trim();
    const cleanPhone = (newAddr.phone || customerUser?.phone || "").replace(/\D/g, "").slice(-10);

    const item = {
      id: `addr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: newAddr.label || "Home",
      recipientName: cleanRecipient,
      phone: cleanPhone,
      address: cleanAddress,
      fullAddress: cleanAddress,
      landmark: cleanLandmark,
      isDefault: Boolean(newAddr.isDefault)
    };

    setSavedAddresses((prev) => {
      const cleanPrev = sanitizeAddresses(prev);
      let list = item.isDefault ? cleanPrev.map((a) => ({ ...a, isDefault: false })) : [...cleanPrev];
      if (list.length === 0) item.isDefault = true;
      return [item, ...list];
    });
    return item;
  }, [customerUser]);

  const updateAddress = useCallback((id, updatedFields) => {
    setSavedAddresses((prev) =>
      sanitizeAddresses(prev).map((item) => {
        if (item.id === id) {
          const cleanAddr = (updatedFields.address || item.address || "").trim();
          return {
            ...item,
            ...updatedFields,
            address: cleanAddr,
            fullAddress: cleanAddr
          };
        }
        if (updatedFields.isDefault) {
          return { ...item, isDefault: false };
        }
        return item;
      })
    );
  }, []);

  const deleteAddress = useCallback((id) => {
    setSavedAddresses((prev) => {
      const remaining = sanitizeAddresses(prev).filter((a) => a.id !== id);
      if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
        remaining[0].isDefault = true;
      }
      return remaining;
    });
  }, []);

  const setDefaultAddress = useCallback((id) => {
    setSavedAddresses((prev) =>
      sanitizeAddresses(prev).map((a) => ({
        ...a,
        isDefault: a.id === id
      }))
    );
  }, []);

  const defaultAddress = useMemo(() => {
    const clean = sanitizeAddresses(savedAddresses);
    return clean.find((a) => a.isDefault) || clean[0] || null;
  }, [savedAddresses]);

  // SETTINGS MANAGEMENT METHODS
  const updateNotificationSettings = useCallback((updated) => {
    setNotificationSettings((prev) => ({ ...prev, ...updated }));
  }, []);

  const addPaymentMethod = useCallback((pm) => {
    const item = {
      id: `pm_${Date.now()}`,
      ...pm
    };
    setSavedPaymentMethods((prev) => [...sanitizePaymentMethods(prev), item]);
  }, []);

  const deletePaymentMethod = useCallback((id) => {
    setSavedPaymentMethods((prev) => sanitizePaymentMethods(prev).filter((p) => p.id !== id));
  }, []);

  /**
   * Sign Out
   */
  const logout = useCallback(() => {
    setCustomerUser(null);
    setPendingProfile(null);
    setSavedAddresses([]);
    signOut(auth).catch(() => {});
    try {
      localStorage.removeItem(CUSTOMER_SESSION_KEY);
      localStorage.removeItem(ADDRESSES_STORAGE_KEY);
    } catch {}
  }, []);

  /**
   * Delete Account (Simulated safeguard)
   */
  const deleteAccount = useCallback(() => {
    if (!customerUser) return;
    try {
      const registry = getRegisteredCustomers();
      if (customerUser.phone) delete registry[customerUser.phone];
      if (customerUser.email) delete registry[customerUser.email.toLowerCase()];
      localStorage.setItem(ALL_CUSTOMERS_KEY, JSON.stringify(registry));
      localStorage.removeItem(CUSTOMER_SESSION_KEY);
      localStorage.removeItem(ADDRESSES_STORAGE_KEY);
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
      const userKey = customerUser.phone || customerUser.email;
      if (userKey) localStorage.removeItem(`twohearts_addresses_${userKey}`);
    } catch {}
    setCustomerUser(null);
    setSavedAddresses([]);
  }, [customerUser]);

  /**
   * Open Auth Modal with optional continuation callback
   */
  const openAuthModal = useCallback((callback = null) => {
    if (callback) {
      setOnAuthSuccessCallback(() => callback);
    } else {
      setOnAuthSuccessCallback(null);
    }
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setOnAuthSuccessCallback(null);
  }, []);

  const value = {
    customerUser,
    isLoggedIn: Boolean(customerUser),
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    signInWithGoogle,
    completeProfile,
    pendingProfile,
    cancelPendingAuth,
    demoGoogleSignIn,
    updateProfile,
    logout,
    deleteAccount,
    // Saved addresses
    savedAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    defaultAddress,
    // Settings
    notificationSettings,
    updateNotificationSettings,
    savedPaymentMethods,
    addPaymentMethod,
    deletePaymentMethod
  };

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  }
  return context;
}
