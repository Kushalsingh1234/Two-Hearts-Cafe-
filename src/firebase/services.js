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
const LOCAL_STORAGE_MENU_KEY = "twohearts_menu_cache_v7";
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

// Purge any legacy demo/testing orders from local caches
try {
  const cachedOrders = getLocalData(LOCAL_STORAGE_ORDERS_KEY, []);
  if (Array.isArray(cachedOrders) && cachedOrders.length > 0) {
    const cleaned = cachedOrders.filter(
      (o) =>
        !o?.id?.startsWith("ord_demo_") &&
        o?.orderNumber !== "THD-8942" &&
        o?.orderNumber !== "THD-8938" &&
        o?.orderNumber !== "THP-8931"
    );
    if (cleaned.length !== cachedOrders.length) {
      setLocalData(LOCAL_STORAGE_ORDERS_KEY, cleaned);
    }
  }
  const active = localStorage.getItem("twohearts_active_online_order_v1");
  if (
    active &&
    (active.includes("ord_demo_") ||
      active.includes("THD-8942") ||
      active.includes("THD-8938") ||
      active.includes("THP-8931"))
  ) {
    localStorage.removeItem("twohearts_active_online_order_v1");
  }
} catch {}

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
          // Ensure all seed items exist in localMenu
          const existingIds = new Set(localMenu.map((i) => i.id));
          const merged = [...localMenu];
          for (const s of INITIAL_MENU_ITEMS) {
            if (!existingIds.has(s.id)) merged.push(s);
          }
          setLocalData(LOCAL_STORAGE_MENU_KEY, merged);
          onSuccess(merged);
        } else {
          const items = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data()
          }));
          // Ensure all seed items are present (e.g. newly added categories)
          const existingIds = new Set(items.map((it) => it.id));
          const merged = [...items];
          for (const s of INITIAL_MENU_ITEMS) {
            if (!existingIds.has(s.id)) merged.push(s);
          }
          setLocalData(LOCAL_STORAGE_MENU_KEY, merged);
          onSuccess(merged);
        }
      },
      (err) => {
        console.warn("Firestore menu subscription fallback to local:", err.message);
        firestorePermissionErrorDetected = true;
        const localMenu = getLocalData(LOCAL_STORAGE_MENU_KEY, INITIAL_MENU_ITEMS);
        const existingIds = new Set(localMenu.map((i) => i.id));
        const merged = [...localMenu];
        for (const s of INITIAL_MENU_ITEMS) {
          if (!existingIds.has(s.id)) merged.push(s);
        }
        setLocalData(LOCAL_STORAGE_MENU_KEY, merged);
        onSuccess(merged);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn("Firestore error:", err);
    const localMenu = getLocalData(LOCAL_STORAGE_MENU_KEY, INITIAL_MENU_ITEMS);
    const existingIds = new Set(localMenu.map((i) => i.id));
    const merged = [...localMenu];
    for (const s of INITIAL_MENU_ITEMS) {
      if (!existingIds.has(s.id)) merged.push(s);
    }
    onSuccess(merged);
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
 * Place a new online food delivery / takeaway order
 */
export const placeOnlineDeliveryOrder = async (payload) => {
  const orderNumber = `THD-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();

  const order = {
    orderNumber,
    userId: payload.userId || null,
    orderType: payload.orderType || "delivery", // 'delivery' | 'pickup'
    tableNumber: payload.orderType === "pickup" ? "Takeaway" : "Delivery",
    status: "placed", // 'placed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'
    items: payload.items || [],
    subtotal: payload.subtotal || 0,
    deliveryFee: payload.deliveryFee || 0,
    tax: payload.tax || 0,
    total: payload.total || 0,
    customerName: payload.customerName || "Customer",
    customerPhone: payload.customerPhone || "",
    deliveryAddress: payload.deliveryAddress || "",
    landmark: payload.landmark || "",
    customerNotes: payload.customerNotes || "",
    paymentStatus: "paid",
    paymentMethod: payload.paymentMethod || "online_gateway",
    paymentId: payload.paymentId || "",
    etaMinutes: payload.etaMinutes || 35,
    rating: null,
    feedback: null,
    feedbackSubmittedAt: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    timestamp: Date.now()
  };

  try {
    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), order);
    const created = { id: docRef.id, ...order };
    const currentOrders = getLocalData(LOCAL_STORAGE_ORDERS_KEY, []);
    setLocalData(LOCAL_STORAGE_ORDERS_KEY, [created, ...currentOrders.filter((o) => o.id !== docRef.id)]);
    window.dispatchEvent(new CustomEvent("twohearts_new_order", { detail: created }));
    return created;
  } catch (err) {
    console.warn("Firestore placeOnlineDeliveryOrder fallback to local storage:", err);
    const localId = `local_deliv_${Date.now()}`;
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
    window.addEventListener("twohearts_order_updated", handleLocalSync);

    return () => {
      isUnsubscribed = true;
      unsubscribe();
      window.removeEventListener("storage", handleLocalSync);
      window.removeEventListener("twohearts_new_order", handleLocalSync);
      window.removeEventListener("twohearts_order_updated", handleLocalSync);
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
 * Update online delivery / pickup order details (status, estimated ready time, etaMinutes, notes)
 */
export const updateOnlineOrder = async (orderId, updates = {}) => {
  const updatedAt = new Date().toISOString();
  const payload = {
    ...updates,
    updatedAt
  };

  let updatedOrder = null;

  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, payload);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      updatedOrder = { id: snap.id, ...snap.data() };
    }
  } catch (err) {
    console.warn("Firestore updateOnlineOrder fallback to local storage:", err);
  }

  // Always update local storage
  const orders = getLocalData(LOCAL_STORAGE_ORDERS_KEY, []);
  let found = false;
  const updatedOrders = orders.map((ord) => {
    if (ord.id === orderId || ord.orderNumber === orderId) {
      found = true;
      const merged = { ...ord, ...payload };
      updatedOrder = merged;
      return merged;
    }
    return ord;
  });

  if (found) {
    setLocalData(LOCAL_STORAGE_ORDERS_KEY, updatedOrders);
  }

  // Sync to customer active order in localStorage if matching
  try {
    const activeRaw = localStorage.getItem("twohearts_active_online_order_v1");
    if (activeRaw) {
      const active = JSON.parse(activeRaw);
      if (active && (active.id === orderId || active.orderNumber === orderId)) {
        const mergedActive = { ...active, ...payload };
        localStorage.setItem("twohearts_active_online_order_v1", JSON.stringify(mergedActive));
      }
    }
  } catch (e) {
    console.warn("Error syncing active customer order", e);
  }

  const finalDetail = updatedOrder || { id: orderId, ...payload };
  // Dispatch events for real-time reactive sync across tabs / components
  window.dispatchEvent(new CustomEvent("twohearts_order_updated", { detail: finalDetail }));
  window.dispatchEvent(new CustomEvent("twohearts_new_order", { detail: finalDetail }));

  return finalDetail;
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

/**
 * Retrieve past orders for a specific customer (by mobile phone or customer ID)
 */
export const getCustomerOrders = async (phone) => {
  const cleanPhone = phone ? String(phone).replace(/\D/g, "").slice(-10) : "";
  
  // 1. First check local storage orders
  const localOrders = getLocalData(LOCAL_STORAGE_ORDERS_KEY, []);
  const activeOrder = getLocalData("twohearts_active_online_order_v1", null);
  
  // 2. Try fetching from Firestore
  let remoteOrders = [];
  try {
    const snap = await getDocs(collection(db, ORDERS_COLLECTION));
    remoteOrders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    // offline/rules fallback
  }

  // Combine and deduplicate
  const map = new Map();
  [...remoteOrders, ...localOrders, ...(activeOrder ? [activeOrder] : [])].forEach((ord) => {
    if (ord && ord.id) {
      const existing = map.get(ord.id);
      map.set(ord.id, existing ? { ...existing, ...ord } : ord);
    }
  });

  const allOrders = Array.from(map.values());

  // Filter for orders matching this phone or userId, or show active browser order
  const customerOrders = allOrders.filter((ord) => {
    if (!cleanPhone) return true;
    const ordPhone = String(ord.customerPhone || "").replace(/\D/g, "").slice(-10);
    const ordUserId = String(ord.userId || "").replace(/\D/g, "").slice(-10);
    const ordRawUserId = String(ord.userId || "");
    return (
      (ordPhone && ordPhone === cleanPhone) ||
      (ordUserId && ordUserId === cleanPhone) ||
      ordRawUserId === phone ||
      (activeOrder && activeOrder.id === ord.id)
    );
  });

  // Sort newest first
  customerOrders.sort((a, b) => {
    const timeA = a.timestamp || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const timeB = b.timestamp || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return timeB - timeA;
  });

  return customerOrders;
};

/**
 * Submit star rating (1-5) and written feedback for an order
 */
export const submitOrderFeedback = async (orderId, { rating, feedback }) => {
  const feedbackSubmittedAt = new Date().toISOString();
  const updatePayload = {
    rating: Number(rating) || 5,
    feedback: (feedback || "").trim(),
    feedbackSubmittedAt
  };

  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, updatePayload);
  } catch (err) {
    console.warn("Firestore submitOrderFeedback fallback to local:", err);
  }

  // Always update local cache
  const localOrders = getLocalData(LOCAL_STORAGE_ORDERS_KEY, []);
  const updated = localOrders.map((ord) =>
    ord.id === orderId ? { ...ord, ...updatePayload } : ord
  );
  setLocalData(LOCAL_STORAGE_ORDERS_KEY, updated);
  window.dispatchEvent(new CustomEvent("twohearts_order_updated", { detail: { orderId, ...updatePayload } }));

  return { success: true, ...updatePayload };
};
