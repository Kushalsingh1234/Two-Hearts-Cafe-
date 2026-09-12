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
const REVIEWS_COLLECTION = "table_reviews";
const LOCAL_STORAGE_MENU_KEY = "twohearts_menu_cache_v7";
const LOCAL_STORAGE_ORDERS_KEY = "twohearts_orders_cache";
const LOCAL_STORAGE_REVIEWS_KEY = "twohearts_reviews_cache";

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
  const seedMap = new Map(INITIAL_MENU_ITEMS.map((s) => [s.id, s]));

  const handleLocalUpdate = () => {
    const localMenu = getLocalData(LOCAL_STORAGE_MENU_KEY, INITIAL_MENU_ITEMS);
    const existingIds = new Set(localMenu.map((i) => i.id));
    const merged = localMenu.map((item) => {
      const seed = seedMap.get(item.id);
      return seed ? { ...seed, ...item, portions: seed.portions || item.portions, options: seed.options || item.options } : item;
    });
    for (const s of INITIAL_MENU_ITEMS) {
      if (!existingIds.has(s.id)) merged.push(s);
    }
    onSuccess(merged);
  };

  window.addEventListener("twohearts_menu_updated", handleLocalUpdate);

  try {
    const q = collection(db, MENU_COLLECTION);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        firestorePermissionErrorDetected = false;
        if (snapshot.empty) {
          // If Firestore is empty, return initial items and optionally seed
          const localMenu = getLocalData(LOCAL_STORAGE_MENU_KEY, INITIAL_MENU_ITEMS);
          const existingIds = new Set(localMenu.map((i) => i.id));
          const merged = localMenu.map((item) => {
            const seed = seedMap.get(item.id);
            return seed ? { ...seed, ...item, portions: seed.portions || item.portions, options: seed.options || item.options } : item;
          });
          for (const s of INITIAL_MENU_ITEMS) {
            if (!existingIds.has(s.id)) merged.push(s);
          }
          setLocalData(LOCAL_STORAGE_MENU_KEY, merged);
          onSuccess(merged);
        } else {
          // Merge each Firestore doc with its seed counterpart to guarantee name, category, price are never lost
          const items = snapshot.docs.map((docSnap) => {
            const docData = docSnap.data();
            const seed = seedMap.get(docSnap.id) || {};
            return {
              ...seed,
              ...docData,
              portions: docData.portions !== undefined ? docData.portions : seed.portions,
              options: docData.options !== undefined ? docData.options : seed.options,
              id: docSnap.id
            };
          });

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
        const merged = localMenu.map((item) => {
          const seed = seedMap.get(item.id);
          return seed
            ? {
                ...seed,
                ...item,
                portions: item.portions !== undefined ? item.portions : seed.portions,
                options: item.options !== undefined ? item.options : seed.options
              }
            : item;
        });
        for (const s of INITIAL_MENU_ITEMS) {
          if (!existingIds.has(s.id)) merged.push(s);
        }
        setLocalData(LOCAL_STORAGE_MENU_KEY, merged);
        onSuccess(merged);
        if (onError) onError(err);
      }
    );

    return () => {
      window.removeEventListener("twohearts_menu_updated", handleLocalUpdate);
      if (typeof unsubscribe === "function") unsubscribe();
    };
  } catch (err) {
    console.warn("Firestore error:", err);
    const localMenu = getLocalData(LOCAL_STORAGE_MENU_KEY, INITIAL_MENU_ITEMS);
    const existingIds = new Set(localMenu.map((i) => i.id));
    const merged = localMenu.map((item) => {
      const seed = seedMap.get(item.id);
      return seed ? { ...seed, ...item, portions: seed.portions || item.portions, options: seed.options || item.options } : item;
    });
    for (const s of INITIAL_MENU_ITEMS) {
      if (!existingIds.has(s.id)) merged.push(s);
    }
    onSuccess(merged);
    return () => {
      window.removeEventListener("twohearts_menu_updated", handleLocalUpdate);
    };
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
export const toggleItemAvailability = async (itemId, isAvailable, fallbackItem = null) => {
  // 1. Find existing full item
  const local = getLocalData(LOCAL_STORAGE_MENU_KEY, INITIAL_MENU_ITEMS);
  const existingLocal = local.find((it) => it.id === itemId);
  const seedItem = INITIAL_MENU_ITEMS.find((it) => it.id === itemId);
  const fullItem = {
    ...(seedItem || {}),
    ...(fallbackItem || {}),
    ...(existingLocal || {}),
    id: itemId,
    isAvailable,
    updatedAt: new Date().toISOString()
  };

  // 2. Immediately update local storage cache & broadcast for instant response
  const updated = local.map((it) => (it.id === itemId ? { ...it, ...fullItem, isAvailable } : it));
  if (!local.some((it) => it.id === itemId)) {
    updated.push(fullItem);
  }
  setLocalData(LOCAL_STORAGE_MENU_KEY, updated);
  window.dispatchEvent(new CustomEvent("twohearts_menu_updated"));

  // 3. Persist full item to Firestore with setDoc merge so no properties are missing
  try {
    const docRef = doc(db, MENU_COLLECTION, itemId);
    await setDoc(docRef, fullItem, { merge: true });
  } catch (err) {
    console.warn("Firestore toggleItemAvailability error, preserved in local storage:", err);
  }
};

/**
 * Toggle menu item special tag (Chef's Special / Featured on QR menu)
 */
export const toggleItemSpecial = async (itemId, isSpecial, fallbackItem = null) => {
  const local = getLocalData(LOCAL_STORAGE_MENU_KEY, INITIAL_MENU_ITEMS);
  const existingLocal = local.find((it) => it.id === itemId);
  const seedItem = INITIAL_MENU_ITEMS.find((it) => it.id === itemId);
  const fullItem = {
    ...(seedItem || {}),
    ...(fallbackItem || {}),
    ...(existingLocal || {}),
    id: itemId,
    isSpecial: Boolean(isSpecial),
    updatedAt: new Date().toISOString()
  };

  const updated = local.map((it) => (it.id === itemId ? { ...it, ...fullItem, isSpecial: Boolean(isSpecial) } : it));
  if (!local.some((it) => it.id === itemId)) {
    updated.push(fullItem);
  }
  setLocalData(LOCAL_STORAGE_MENU_KEY, updated);
  window.dispatchEvent(new CustomEvent("twohearts_menu_updated"));

  try {
    const docRef = doc(db, MENU_COLLECTION, itemId);
    await setDoc(docRef, fullItem, { merge: true });
  } catch (err) {
    console.warn("Firestore toggleItemSpecial error, preserved in local storage:", err);
  }
};

/**
 * Quick update menu item price (and optional portion pricing)
 */
export const updateMenuItemPrice = async (itemId, newPrice, newPortions = undefined) => {
  const price = Number(newPrice);
  const updateFields = {
    price,
    updatedAt: new Date().toISOString()
  };
  if (newPortions !== undefined) {
    updateFields.portions = newPortions;
  }

  try {
    const docRef = doc(db, MENU_COLLECTION, itemId);
    await updateDoc(docRef, updateFields);
  } catch (err) {
    console.warn("Firestore update price fallback:", err);
    const local = getLocalData(LOCAL_STORAGE_MENU_KEY, INITIAL_MENU_ITEMS);
    const updated = local.map((it) => (it.id === itemId ? { ...it, ...updateFields } : it));
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
 * Helper to check if an order is an online delivery/takeaway order
 */
export const isOnlineDeliveryOrder = (ord) => {
  if (!ord) return false;
  return (
    ord.orderType === "delivery" ||
    ord.orderType === "pickup" ||
    ord.tableNumber === "Delivery" ||
    ord.tableNumber === "Takeaway" ||
    (typeof ord.orderNumber === "string" && ord.orderNumber.startsWith("THD-")) ||
    Boolean(ord.deliveryAddress)
  );
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
    paymentStatus: orderPayload.paymentStatus || "pending", // Initially pending until customer chooses online or counter
    billRequested: Boolean(orderPayload.billRequested),
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
 * Place a new table order OR append items to existing active table order
 * Ensures on the admin side there is NEVER two different cards of the same table number at the same time.
 */
export const placeOrAppendTableOrder = async (orderPayload, existingOrders = []) => {
  const tableNum = String(orderPayload.tableNumber || "1");

  // 1. Find if an active (unsettled & non-cancelled) order already exists for this table
  let existingOrder = (existingOrders || []).find(
    (o) =>
      String(o.tableNumber) === tableNum &&
      !isOnlineDeliveryOrder(o) &&
      o.status !== "settled" &&
      o.status !== "cancelled"
  );

  if (!existingOrder) {
    const cachedOrders = getLocalData(LOCAL_STORAGE_ORDERS_KEY, []);
    existingOrder = cachedOrders.find(
      (o) =>
        String(o.tableNumber) === tableNum &&
        !isOnlineDeliveryOrder(o) &&
        o.status !== "settled" &&
        o.status !== "cancelled"
    );
  }

  const now = new Date();
  const newItems = orderPayload.items || [];

  if (existingOrder && existingOrder.id) {
    // Append items into the single active table order
    const mergedItems = [...(existingOrder.items || [])];
    newItems.forEach((newItem) => {
      // Find matching item without distinct special instructions
      const idx = mergedItems.findIndex(
        (it) =>
          it.id === newItem.id &&
          it.name === newItem.name &&
          !it.specialInstructions &&
          !newItem.specialInstructions
      );
      if (idx >= 0) {
        mergedItems[idx] = {
          ...mergedItems[idx],
          quantity: (Number(mergedItems[idx].quantity) || 1) + (Number(newItem.quantity) || 1)
        };
      } else {
        mergedItems.push({ ...newItem });
      }
    });

    const newSubtotal = mergedItems.reduce(
      (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
      0
    );
    const newTotal = newSubtotal;

    const additionRecord = {
      items: newItems,
      addedAt: now.toISOString(),
      timestamp: Date.now(),
      notes: orderPayload.specialInstructions || ""
    };

    const lastAdditionSummary = newItems
      .map((it) => `${it.quantity || 1}× ${it.name}`)
      .join(", ");

    const updatePayload = {
      items: mergedItems,
      subtotal: newSubtotal,
      total: newTotal,
      // If customer had already paid online for previous items, keep paid; otherwise pending
      paymentStatus:
        existingOrder.paymentStatus === "paid_online"
          ? "paid_online"
          : (orderPayload.paymentStatus || "pending"),
      billRequested: false, // Reset bill requested since more food was ordered!
      additions: [...(existingOrder.additions || []), additionRecord],
      lastItemAddedAt: now.toISOString(),
      lastAdditionSummary,
      updatedAt: now.toISOString(),
      // Reset status to 'placed' so admin panel rings repeating chime and staff accepts new additions
      status: "placed",
      specialInstructions: orderPayload.specialInstructions
        ? (existingOrder.specialInstructions
            ? `${existingOrder.specialInstructions} | Add: ${orderPayload.specialInstructions}`
            : orderPayload.specialInstructions)
        : (existingOrder.specialInstructions || "")
    };

    try {
      const docRef = doc(db, ORDERS_COLLECTION, existingOrder.id);
      await updateDoc(docRef, updatePayload);
      const updatedOrder = { ...existingOrder, ...updatePayload };
      const currentOrders = getLocalData(LOCAL_STORAGE_ORDERS_KEY, []);
      setLocalData(
        LOCAL_STORAGE_ORDERS_KEY,
        currentOrders.map((o) => (o.id === existingOrder.id ? updatedOrder : o))
      );
      window.dispatchEvent(new CustomEvent("twohearts_order_updated", { detail: updatedOrder }));
      window.dispatchEvent(new CustomEvent("twohearts_new_order", { detail: updatedOrder }));
      return { isAppended: true, order: updatedOrder, newItems };
    } catch (err) {
      console.warn("Firestore appendTableOrder fallback:", err);
      const updatedOrder = { ...existingOrder, ...updatePayload };
      const currentOrders = getLocalData(LOCAL_STORAGE_ORDERS_KEY, []);
      setLocalData(
        LOCAL_STORAGE_ORDERS_KEY,
        currentOrders.map((o) => (o.id === existingOrder.id ? updatedOrder : o))
      );
      window.dispatchEvent(new CustomEvent("twohearts_order_updated", { detail: updatedOrder }));
      window.dispatchEvent(new CustomEvent("twohearts_new_order", { detail: updatedOrder }));
      return { isAppended: true, order: updatedOrder, newItems };
    }
  }

  // Otherwise, create a brand new table order:
  const created = await placeOrder({
    ...orderPayload,
    paymentStatus: orderPayload.paymentStatus || "pending",
    billRequested: false
  });
  return { isAppended: false, order: created, newItems };
};

/**
 * Customer requests physical cash/counter bill
 */
export const requestCounterBill = async (orderId) => {
  const updatedAt = new Date().toISOString();
  const updatePayload = {
    paymentStatus: "pay_at_counter",
    paymentMethod: "counter",
    billRequested: true,
    billRequestedAt: updatedAt,
    updatedAt
  };

  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, updatePayload);
  } catch (err) {
    console.warn("Firestore requestCounterBill fallback to local:", err);
  }

  const orders = getLocalData(LOCAL_STORAGE_ORDERS_KEY, []);
  const updated = orders.map((ord) =>
    ord.id === orderId ? { ...ord, ...updatePayload } : ord
  );
  setLocalData(LOCAL_STORAGE_ORDERS_KEY, updated);
  window.dispatchEvent(new CustomEvent("twohearts_order_updated"));
  window.dispatchEvent(new CustomEvent("twohearts_new_order"));
  return updated.find((o) => o.id === orderId) || { id: orderId, ...updatePayload };
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
    paymentStatus: payload.paymentStatus || "paid",
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
    return () => { };
  }
};

/**
 * Update order status ('placed' -> 'preparing' -> 'served' -> 'settled')
 */
export const updateOrderStatus = async (orderId, newStatus, extraData = {}) => {
  const updatedAt = new Date().toISOString();
  const updatePayload = {
    status: newStatus,
    updatedAt,
    ...(newStatus === "settled" ? { settledAt: updatedAt } : {}),
    ...extraData
  };

  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, updatePayload);
  } catch (err) {
    console.warn("Firestore updateOrderStatus fallback to local:", err);
    const orders = getLocalData(LOCAL_STORAGE_ORDERS_KEY, []);
    const updated = orders.map((ord) =>
      ord.id === orderId ? { ...ord, ...updatePayload } : ord
    );
    setLocalData(LOCAL_STORAGE_ORDERS_KEY, updated);
    window.dispatchEvent(new CustomEvent("twohearts_new_order"));
  }
};

/**
 * Update order payment details (UPI to Q327979600@ybl or Pay at Counter)
 */
export const updateOrderPayment = async (orderId, paymentData) => {
  const updatedAt = new Date().toISOString();
  const isOnlinePaid = paymentData.paymentStatus === "paid_online" || paymentData.paymentMethod === "upi";

  const updatePayload = {
    paymentStatus: paymentData.paymentStatus || (isOnlinePaid ? "paid_online" : "unpaid"),
    paymentMethod: paymentData.paymentMethod || (isOnlinePaid ? "upi" : "counter"),
    paymentDetails: {
      upiId: paymentData.upiId || "Q327979600@ybl",
      utr: paymentData.utr || "",
      paidAt: paymentData.paidAt || (isOnlinePaid ? updatedAt : null)
    },
    updatedAt,
    // Automatic bill settlement when paid online from the scanner
    ...(isOnlinePaid ? {
      status: "settled",
      settledAt: paymentData.settledAt || paymentData.paidAt || updatedAt,
      settledBy: paymentData.settledBy || "Customer Online UPI",
      settledMethod: paymentData.settledMethod || "upi_online"
    } : {})
  };

  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, updatePayload);
    // Also update local cache for immediate zero-latency cross-tab reactivity
    const orders = getLocalData(LOCAL_STORAGE_ORDERS_KEY, []);
    const updated = orders.map((ord) =>
      ord.id === orderId ? { ...ord, ...updatePayload } : ord
    );
    setLocalData(LOCAL_STORAGE_ORDERS_KEY, updated);
    window.dispatchEvent(new CustomEvent("twohearts_new_order"));
  } catch (err) {
    console.warn("Firestore updateOrderPayment fallback to local:", err);
    const orders = getLocalData(LOCAL_STORAGE_ORDERS_KEY, []);
    const updated = orders.map((ord) =>
      ord.id === orderId ? { ...ord, ...updatePayload } : ord
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
  const cleanNum = (n) => String(n || "").replace(/^#/, "").trim().toUpperCase();
  const targetNum = cleanNum(orderId);

  const orders = getLocalData(LOCAL_STORAGE_ORDERS_KEY, []);
  let found = false;
  const updatedOrders = orders.map((ord) => {
    const matches =
      ord.id === orderId ||
      ord.orderNumber === orderId ||
      (targetNum && (cleanNum(ord.id) === targetNum || cleanNum(ord.orderNumber) === targetNum));
    if (matches) {
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
      const isTarget =
        active &&
        (active.id === orderId ||
          active.orderNumber === orderId ||
          (targetNum && (cleanNum(active.id) === targetNum || cleanNum(active.orderNumber) === targetNum)) ||
          (updatedOrder && (cleanNum(active.orderNumber) === cleanNum(updatedOrder.orderNumber) || active.id === updatedOrder.id)));
      if (isTarget) {
        const isTerminal = ["cancelled", "delivered", "completed", "rejected"].includes(
          String(payload.status || "").toLowerCase().trim()
        );
        if (isTerminal) {
          localStorage.removeItem("twohearts_active_online_order_v1");
        } else {
          const mergedActive = { ...active, ...payload };
          localStorage.setItem("twohearts_active_online_order_v1", JSON.stringify(mergedActive));
        }
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

  // Normalize order keys for universal deduplication (ignoring leading #, case-insensitive)
  const cleanOrderNum = (num) => String(num || "").replace(/^#/, "").trim().toUpperCase();
  const isOrderMatch = (a, b) => {
    if (!a || !b) return false;
    if (a.id && b.id && a.id === b.id) return true;
    const numA = cleanOrderNum(a.orderNumber);
    const numB = cleanOrderNum(b.orderNumber);
    if (numA && numB && numA === numB) return true;
    if (a.id && numB && cleanOrderNum(a.id) === numB) return true;
    if (b.id && numA && cleanOrderNum(b.id) === numA) return true;
    return false;
  };

  // Combine and deduplicate: localOrders and remoteOrders first, then activeOrder
  const combined = [...localOrders, ...remoteOrders, ...(activeOrder ? [activeOrder] : [])];
  const unified = [];

  combined.forEach((ord) => {
    if (!ord || (!ord.id && !ord.orderNumber)) return;
    const existingIdx = unified.findIndex((u) => isOrderMatch(u, ord));
    if (existingIdx >= 0) {
      const existing = unified[existingIdx];
      const isTerminal = (st) =>
        ["cancelled", "delivered", "completed", "rejected"].includes(String(st || "").toLowerCase().trim());
      
      // Authoritative status: terminal status (cancelled/delivered/completed) ALWAYS wins
      let finalStatus = ord.status || existing.status;
      if (isTerminal(existing.status) && !isTerminal(ord.status)) {
        finalStatus = existing.status;
      } else if (isTerminal(ord.status)) {
        finalStatus = ord.status;
      }

      unified[existingIdx] = {
        ...existing,
        ...ord,
        status: finalStatus
      };
    } else {
      unified.push({ ...ord });
    }
  });

  // Clean up localStorage active order if it is cancelled or completed
  if (activeOrder) {
    const matchedActive = unified.find((u) => isOrderMatch(u, activeOrder));
    if (
      matchedActive &&
      ["cancelled", "delivered", "completed", "rejected"].includes(String(matchedActive.status || "").toLowerCase().trim())
    ) {
      try {
        localStorage.removeItem("twohearts_active_online_order_v1");
      } catch {}
    }
  }

  // Filter for orders matching this phone or userId, or active browser order
  const customerOrders = unified.filter((ord) => {
    if (!cleanPhone) return true;
    const ordPhone = String(ord.customerPhone || "").replace(/\D/g, "").slice(-10);
    const ordUserId = String(ord.userId || "").replace(/\D/g, "").slice(-10);
    const ordRawUserId = String(ord.userId || "");
    return (
      (ordPhone && ordPhone === cleanPhone) ||
      (ordUserId && ordUserId === cleanPhone) ||
      ordRawUserId === phone ||
      (activeOrder && isOrderMatch(ord, activeOrder))
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

/**
 * Submit Table Experience & Individual Dish Reviews
 * Aggregates dish ratings into menu_items in the database
 */
export const submitTableReview = async ({
  orderId,
  orderNumber,
  tableNumber,
  parameters = {},
  dishRatings = [],
  comments = ""
}) => {
  const now = new Date();
  const createdAt = now.toISOString();

  // Calculate overall rating from the 4 parameters
  const paramValues = Object.values(parameters).map(Number).filter((v) => !isNaN(v) && v > 0);
  const overallRating = paramValues.length > 0
    ? Math.round((paramValues.reduce((a, b) => a + b, 0) / paramValues.length) * 10) / 10
    : 5;

  const reviewRecord = {
    orderId: orderId || null,
    orderNumber: orderNumber || "TH-1001",
    tableNumber: String(tableNumber || "1"),
    parameters: {
      orderQuality: Number(parameters?.orderQuality) || 5,
      foodTaste: Number(parameters?.foodTaste) || 5,
      service: Number(parameters?.service) || 5,
      cafeAesthetic: Number(parameters?.cafeAesthetic) || 5
    },
    overallRating: Number(overallRating) || 5,
    dishRatings: (dishRatings || []).map((d) => ({
      dishId: String(d.dishId || d.id || ""),
      dishName: String(d.dishName || d.name || ""),
      rating: Number(d.rating) || 5
    })),
    comments: (comments || "").trim(),
    createdAt,
    timestamp: Date.now()
  };

  // 1. Save review to REVIEWS_COLLECTION (table_reviews)
  let savedReviewId = `rev_${Date.now()}`;
  try {
    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), reviewRecord);
    savedReviewId = docRef.id;
  } catch (err) {
    console.warn("Firestore submitTableReview fallback (table_reviews collection):", err);
  }

  const savedReview = { id: savedReviewId, ...reviewRecord };
  const currentReviews = getLocalData(LOCAL_STORAGE_REVIEWS_KEY, []);
  const updatedReviews = [savedReview, ...currentReviews.filter((r) => r.id !== savedReviewId)];
  setLocalData(LOCAL_STORAGE_REVIEWS_KEY, updatedReviews);
  window.dispatchEvent(new CustomEvent("twohearts_new_review", { detail: savedReview }));

  // 2. Mark order as reviewed in orders collection (Guaranteed write via allowed orders collection)
  if (orderId) {
    try {
      const orderRef = doc(db, ORDERS_COLLECTION, orderId);
      await setDoc(
        orderRef,
        {
          hasReview: true,
          review: savedReview
        },
        { merge: true }
      );
    } catch (err) {
      console.warn("Firestore order review status merge fallback:", err);
    }

    const localOrders = getLocalData(LOCAL_STORAGE_ORDERS_KEY, []);
    const updatedOrders = localOrders.map((ord) =>
      ord.id === orderId ? { ...ord, hasReview: true, review: savedReview } : ord
    );
    setLocalData(LOCAL_STORAGE_ORDERS_KEY, updatedOrders);
    window.dispatchEvent(new CustomEvent("twohearts_new_order"));
  }

  // 3. Update each rated dish in menu_items with running average rating
  if (Array.isArray(dishRatings) && dishRatings.length > 0) {
    const localMenu = getLocalData(LOCAL_STORAGE_MENU_KEY, INITIAL_MENU_ITEMS);

    for (const d of dishRatings) {
      const dishId = d.dishId || d.id;
      const ratingGiven = Number(d.rating);
      if (!dishId || isNaN(ratingGiven) || ratingGiven <= 0) continue;

      // Find in local menu
      const localDish = localMenu.find((it) => it.id === dishId || it.name?.toLowerCase() === d.dishName?.toLowerCase());
      const currentCount = Number(localDish?.ratingCount || 0);
      const currentTotalScore = Number(localDish?.totalRatingScore || (localDish?.rating ? localDish.rating * currentCount : 0));

      const newCount = currentCount + 1;
      const newTotalScore = currentTotalScore + ratingGiven;
      const newAverageRating = Math.round((newTotalScore / newCount) * 10) / 10;

      const dishUpdates = {
        rating: newAverageRating,
        ratingCount: newCount,
        totalRatingScore: newTotalScore,
        lastRatedAt: createdAt
      };

      // Try Firestore update
      try {
        const dishRef = doc(db, MENU_COLLECTION, localDish?.id || dishId);
        await setDoc(dishRef, dishUpdates, { merge: true });
      } catch (err) {
        console.warn(`Firestore dish rating update fallback for ${dishId}:`, err);
      }

      // Update in localMenu
      const matchIdx = localMenu.findIndex((it) => it.id === (localDish?.id || dishId));
      if (matchIdx >= 0) {
        localMenu[matchIdx] = {
          ...localMenu[matchIdx],
          ...dishUpdates
        };
      }
    }

    setLocalData(LOCAL_STORAGE_MENU_KEY, localMenu);
    window.dispatchEvent(new CustomEvent("twohearts_menu_updated"));
  }

  return savedReview;
};

/**
 * Realtime subscription to customer reviews (for Admin reviews hub)
 * Resiliently combines table_reviews collection with any reviews attached to orders.
 */
export const subscribeReviews = (onSuccess, onError) => {
  const getMergedReviews = (firestoreReviews = []) => {
    const local = getLocalData(LOCAL_STORAGE_REVIEWS_KEY, []);
    const localOrders = getLocalData(LOCAL_STORAGE_ORDERS_KEY, []);
    const orderReviews = localOrders
      .filter((o) => o && o.review)
      .map((o) => ({
        ...o.review,
        orderNumber: o.review?.orderNumber || o.orderNumber,
        tableNumber: String(o.review?.tableNumber || o.tableNumber || "1")
      }));

    const map = new Map();
    [...firestoreReviews, ...local, ...orderReviews].forEach((rev) => {
      if (!rev) return;
      const key = rev.id || rev.orderId || `rev_${rev.timestamp}_${rev.tableNumber}`;
      map.set(key, rev);
    });

    const merged = Array.from(map.values());
    merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return merged;
  };

  try {
    const q = collection(db, REVIEWS_COLLECTION);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        firestorePermissionErrorDetected = false;
        const firestoreReviews = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));

        const merged = getMergedReviews(firestoreReviews);
        setLocalData(LOCAL_STORAGE_REVIEWS_KEY, merged);
        onSuccess(merged);
      },
      (err) => {
        console.warn("Firestore reviews subscription fallback to orders/local:", err.message);
        const merged = getMergedReviews([]);
        onSuccess(merged);
        if (onError) onError(err);
      }
    );

    const handleLocalSync = () => {
      const merged = getMergedReviews([]);
      onSuccess(merged);
    };

    window.addEventListener("storage", handleLocalSync);
    window.addEventListener("twohearts_new_review", handleLocalSync);
    window.addEventListener("twohearts_new_order", handleLocalSync);

    return () => {
      unsubscribe();
      window.removeEventListener("storage", handleLocalSync);
      window.removeEventListener("twohearts_new_review", handleLocalSync);
      window.removeEventListener("twohearts_new_order", handleLocalSync);
    };
  } catch (err) {
    console.warn("Reviews subscription setup error:", err);
    const merged = getMergedReviews([]);
    onSuccess(merged);
    return () => {};
  }
};
