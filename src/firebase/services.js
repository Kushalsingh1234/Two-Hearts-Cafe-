import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDoc
} from "firebase/firestore";
import { db } from "./config";
import { INITIAL_MENU_ITEMS } from "../data/seedMenu";

const MENU_COLLECTION = "menu_items";
const ORDERS_COLLECTION = "orders";
const LOCAL_STORAGE_MENU_KEY = "twohearts_menu_cache_v2";
const LOCAL_STORAGE_ORDERS_KEY = "twohearts_orders_cache";

// Helper for local storage backup
const getLocalData = (key, fallback) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
};

const setLocalData = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.warn("LocalStorage save error", err);
  }
};

let firestorePermissionErrorDetected = false;

export const hasFirestorePermissionError = () => firestorePermissionErrorDetected;

/**
 * Realtime subscription to menu items
 */
export const subscribeMenuItems = (onSuccess, onError) => {
  try {
    const q = collection(db, MENU_COLLECTION);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        firestorePermissionErrorDetected = false;
        if (snapshot.empty) {
          // If Firestore is empty, return initial items and optionally seed
          const localMenu = getLocalData(LOCAL_STORAGE_MENU_KEY, INITIAL_MENU_ITEMS);
          onSuccess(localMenu);
        } else {
          const items = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data()
          }));
          setLocalData(LOCAL_STORAGE_MENU_KEY, items);
          onSuccess(items);
        }
      },
      (err) => {
        console.warn("Firestore menu subscription fallback to local:", err.message);
        firestorePermissionErrorDetected = true;
        const localMenu = getLocalData(LOCAL_STORAGE_MENU_KEY, INITIAL_MENU_ITEMS);
        onSuccess(localMenu);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn("Firestore error:", err);
    firestorePermissionErrorDetected = true;
    onSuccess(getLocalData(LOCAL_STORAGE_MENU_KEY, INITIAL_MENU_ITEMS));
    return () => {};
  }
};

/**
 * Seed initial cafe menu into Firestore
 */
export const seedMenuToFirestore = async () => {
  try {
    for (const item of INITIAL_MENU_ITEMS) {
      const docRef = doc(db, MENU_COLLECTION, item.id);
      await setDoc(docRef, item, { merge: true });
    }
    return { success: true, count: INITIAL_MENU_ITEMS.length };
  } catch (err) {
    console.warn("Could not seed to Firestore directly:", err);
    setLocalData(LOCAL_STORAGE_MENU_KEY, INITIAL_MENU_ITEMS);
    return { success: false, error: err.message };
  }
};

/**
 * Toggle menu item availability (In Stock / Out of Stock)
 */
export const toggleItemAvailability = async (itemId, isAvailable) => {
  try {
    const docRef = doc(db, MENU_COLLECTION, itemId);
    await updateDoc(docRef, { isAvailable });
  } catch (err) {
    console.warn("Firestore update error, updating locally:", err);
    const local = getLocalData(LOCAL_STORAGE_MENU_KEY, INITIAL_MENU_ITEMS);
    const updated = local.map((it) => (it.id === itemId ? { ...it, isAvailable } : it));
    setLocalData(LOCAL_STORAGE_MENU_KEY, updated);
    window.dispatchEvent(new CustomEvent("twohearts_menu_updated"));
  }
};

/**
 * Quick update menu item price
 */
export const updateMenuItemPrice = async (itemId, newPrice) => {
  const price = Number(newPrice);
  try {
    const docRef = doc(db, MENU_COLLECTION, itemId);
    await updateDoc(docRef, { price, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.warn("Firestore update price fallback:", err);
    const local = getLocalData(LOCAL_STORAGE_MENU_KEY, INITIAL_MENU_ITEMS);
    const updated = local.map((it) => (it.id === itemId ? { ...it, price } : it));
    setLocalData(LOCAL_STORAGE_MENU_KEY, updated);
    window.dispatchEvent(new CustomEvent("twohearts_menu_updated"));
  }
};

/**
 * Add or update menu item
 */
export const saveMenuItem = async (itemData) => {
  const id = itemData.id || `th_${Date.now()}`;
  const payload = { ...itemData, id, updatedAt: new Date().toISOString() };
  try {
    const docRef = doc(db, MENU_COLLECTION, id);
    await setDoc(docRef, payload, { merge: true });
    return id;
  } catch (err) {
    console.warn("Firestore save item fallback:", err);
    const local = getLocalData(LOCAL_STORAGE_MENU_KEY, INITIAL_MENU_ITEMS);
    const existingIdx = local.findIndex((i) => i.id === id);
    let updated;
    if (existingIdx >= 0) {
      updated = [...local];
      updated[existingIdx] = payload;
    } else {
      updated = [payload, ...local];
    }
    setLocalData(LOCAL_STORAGE_MENU_KEY, updated);
    window.dispatchEvent(new CustomEvent("twohearts_menu_updated"));
    return id;
  }
};

/**
 * Delete a menu item
 */
export const deleteMenuItem = async (itemId) => {
  try {
    await deleteDoc(doc(db, MENU_COLLECTION, itemId));
  } catch (err) {
    const local = getLocalData(LOCAL_STORAGE_MENU_KEY, INITIAL_MENU_ITEMS);
    setLocalData(LOCAL_STORAGE_MENU_KEY, local.filter((i) => i.id !== itemId));
    window.dispatchEvent(new CustomEvent("twohearts_menu_updated"));
  }
};

/**
 * Place a new customer table order
 */
export const placeOrder = async (orderPayload) => {
  const orderNumber = `TH-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();
  
  const order = {
    orderNumber,
    tableNumber: String(orderPayload.tableNumber || "1"),
    status: "placed", // 'placed' | 'preparing' | 'served' | 'settled' | 'cancelled'
    items: orderPayload.items || [],
    specialInstructions: orderPayload.specialInstructions || "",
    subtotal: orderPayload.subtotal || 0,
    tax: orderPayload.tax || 0,
    total: orderPayload.total || 0,
    paymentStatus: "pay_at_counter",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    timestamp: Date.now()
  };

  try {
    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), order);
    return { id: docRef.id, ...order };
  } catch (err) {
    console.warn("Firestore placeOrder fallback to local storage:", err);
    const localId = `local_ord_${Date.now()}`;
    const savedOrder = { id: localId, ...order };
    const currentOrders = getLocalData(LOCAL_STORAGE_ORDERS_KEY, []);
    setLocalData(LOCAL_STORAGE_ORDERS_KEY, [savedOrder, ...currentOrders]);
    window.dispatchEvent(new CustomEvent("twohearts_new_order", { detail: savedOrder }));
    return savedOrder;
  }
};

/**
 * Subscribe to live orders (for Kitchen / Owner Live Dashboard)
 */
export const subscribeLiveOrders = (onSuccess, onError) => {
  let isUnsubscribed = false;

  try {
    const q = collection(db, ORDERS_COLLECTION);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        firestorePermissionErrorDetected = false;
        const orders = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        
        // Sort descending by timestamp/createdAt
        orders.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setLocalData(LOCAL_STORAGE_ORDERS_KEY, orders);
        onSuccess(orders);
      },
      (err) => {
        console.warn("Firestore live orders subscription fallback to local:", err.message);
        firestorePermissionErrorDetected = true;
        const local = getLocalData(LOCAL_STORAGE_ORDERS_KEY, []);
        onSuccess(local);
        if (onError) onError(err);
      }
    );

    // Also listen to window local event for instant cross-tab or local test sync
    const handleLocalSync = () => {
      const local = getLocalData(LOCAL_STORAGE_ORDERS_KEY, []);
      onSuccess(local);
    };
    window.addEventListener("storage", handleLocalSync);
    window.addEventListener("twohearts_new_order", handleLocalSync);

    return () => {
      isUnsubscribed = true;
      unsubscribe();
      window.removeEventListener("storage", handleLocalSync);
      window.removeEventListener("twohearts_new_order", handleLocalSync);
    };
  } catch (err) {
    console.warn("Live orders setup error:", err);
    const local = getLocalData(LOCAL_STORAGE_ORDERS_KEY, []);
    onSuccess(local);
    return () => {};
  }
};

/**
 * Update order status ('placed' -> 'preparing' -> 'served' -> 'settled')
 */
export const updateOrderStatus = async (orderId, newStatus) => {
  const updatedAt = new Date().toISOString();
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, { status: newStatus, updatedAt });
  } catch (err) {
    console.warn("Firestore updateOrderStatus fallback to local:", err);
    const orders = getLocalData(LOCAL_STORAGE_ORDERS_KEY, []);
    const updated = orders.map((ord) =>
      ord.id === orderId ? { ...ord, status: newStatus, updatedAt } : ord
    );
    setLocalData(LOCAL_STORAGE_ORDERS_KEY, updated);
    window.dispatchEvent(new CustomEvent("twohearts_new_order"));
  }
};

/**
 * Clear all demo orders
 */
export const clearAllOrders = async () => {
  try {
    const snapshot = await getDocs(collection(db, ORDERS_COLLECTION));
    for (const d of snapshot.docs) {
      await deleteDoc(d.ref);
    }
  } catch (err) {
    console.warn("Clear orders fallback:", err);
  }
  setLocalData(LOCAL_STORAGE_ORDERS_KEY, []);
  window.dispatchEvent(new CustomEvent("twohearts_new_order"));
};
