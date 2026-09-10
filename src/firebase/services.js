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
    return () => { };
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
 * Update order payment details (UPI to twohearts@ptaxis or Pay at Counter)
 */
export const updateOrderPayment = async (orderId, paymentData) => {
  const updatedAt = new Date().toISOString();
  const updatePayload = {
    paymentStatus: paymentData.paymentStatus, // 'paid_online' | 'pay_at_counter' | 'unpaid'
    paymentMethod: paymentData.paymentMethod, // 'upi' | 'counter'
    paymentDetails: {
      upiId: paymentData.upiId || "twohearts@ptaxis",
      utr: paymentData.utr || "",
      paidAt: paymentData.paidAt || updatedAt
    },
    updatedAt
  };

  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, updatePayload);
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
  if (!phone) return [];
  const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);

  // 1. First check local storage orders
  const localOrders = getLocalData(LOCAL_STORAGE_ORDERS_KEY, []);

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
  [...remoteOrders, ...localOrders].forEach((ord) => {
    if (ord && ord.id) {
      map.set(ord.id, ord);
    }
  });

  const allOrders = Array.from(map.values());

  // Filter for orders matching this phone or userId
  const customerOrders = allOrders.filter((ord) => {
    const ordPhone = String(ord.customerPhone || "").replace(/\D/g, "").slice(-10);
    const ordUserId = String(ord.userId || "");
    return (ordPhone && ordPhone === cleanPhone) || ordUserId === cleanPhone;
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
    orderId,
    orderNumber: orderNumber || "TH-1001",
    tableNumber: String(tableNumber || "1"),
    parameters: {
      orderQuality: Number(parameters.orderQuality) || 5,
      foodTaste: Number(parameters.foodTaste) || 5,
      service: Number(parameters.service) || 5,
      cafeAesthetic: Number(parameters.cafeAesthetic) || 5
    },
    overallRating,
    dishRatings: (dishRatings || []).map((d) => ({
      dishId: d.dishId || d.id,
      dishName: d.dishName || d.name,
      rating: Number(d.rating) || 5
    })),
    comments: (comments || "").trim(),
    createdAt,
    timestamp: Date.now()
  };

  // 1. Save review to REVIEWS_COLLECTION
  let savedReviewId = `rev_${Date.now()}`;
  try {
    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), reviewRecord);
    savedReviewId = docRef.id;
  } catch (err) {
    console.warn("Firestore submitTableReview fallback to local storage:", err);
  }

  const savedReview = { id: savedReviewId, ...reviewRecord };
  const currentReviews = getLocalData(LOCAL_STORAGE_REVIEWS_KEY, []);
  setLocalData(LOCAL_STORAGE_REVIEWS_KEY, [savedReview, ...currentReviews]);
  window.dispatchEvent(new CustomEvent("twohearts_new_review", { detail: savedReview }));

  // 2. Mark order as reviewed in orders collection
  if (orderId) {
    try {
      const orderRef = doc(db, ORDERS_COLLECTION, orderId);
      await updateDoc(orderRef, {
        hasReview: true,
        review: savedReview
      });
    } catch (err) {
      console.warn("Firestore order review status fallback:", err);
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
        await updateDoc(dishRef, dishUpdates);
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
 */
export const subscribeReviews = (onSuccess, onError) => {
  try {
    const q = collection(db, REVIEWS_COLLECTION);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        firestorePermissionErrorDetected = false;
        const reviews = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));

        reviews.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setLocalData(LOCAL_STORAGE_REVIEWS_KEY, reviews);
        onSuccess(reviews);
      },
      (err) => {
        console.warn("Firestore reviews subscription fallback to local:", err.message);
        firestorePermissionErrorDetected = true;
        const local = getLocalData(LOCAL_STORAGE_REVIEWS_KEY, []);
        local.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        onSuccess(local);
        if (onError) onError(err);
      }
    );

    const handleLocalSync = () => {
      const local = getLocalData(LOCAL_STORAGE_REVIEWS_KEY, []);
      local.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      onSuccess(local);
    };
    window.addEventListener("storage", handleLocalSync);
    window.addEventListener("twohearts_new_review", handleLocalSync);

    return () => {
      unsubscribe();
      window.removeEventListener("storage", handleLocalSync);
      window.removeEventListener("twohearts_new_review", handleLocalSync);
    };
  } catch (err) {
    console.warn("Reviews subscription setup error:", err);
    const local = getLocalData(LOCAL_STORAGE_REVIEWS_KEY, []);
    onSuccess(local);
    return () => { };
  }
};
