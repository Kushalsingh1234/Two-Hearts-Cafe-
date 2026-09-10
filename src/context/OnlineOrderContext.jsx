import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { placeOnlineDeliveryOrder } from "../firebase/services";
import {
  DELIVERY_CONFIG,
  calculateDistanceKm,
  checkDeliveryEligibility
} from "../config/deliveryConfig";

const OnlineOrderContext = createContext(null);

const CART_STORAGE_KEY = "twohearts_online_cart_v1";
const CUSTOMER_STORAGE_KEY = "twohearts_customer_info_v1";
const ACTIVE_ORDER_STORAGE_KEY = "twohearts_active_online_order_v1";

export function OnlineOrderProvider({ children }) {
  // 1. Cart state (persisted)
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 2. Delivery or Takeaway / Pickup
  const [deliveryType, setDeliveryType] = useState("delivery"); // 'delivery' | 'pickup'

  // 3. Customer Info (persisted)
  const [customerInfo, setCustomerInfo] = useState(() => {
    try {
      const saved = localStorage.getItem(CUSTOMER_STORAGE_KEY);
      return saved
        ? JSON.parse(saved)
        : {
            name: "",
            phone: "",
            address: "",
            landmark: "",
            notes: ""
          };
    } catch {
      return { name: "", phone: "", address: "", landmark: "", notes: "" };
    }
  });

  // 4. Active Order for live tracking (persisted)
  const [activeOrder, setActiveOrder] = useState(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_ORDER_STORAGE_KEY);
      if (saved) return JSON.parse(saved);

      const params = new URLSearchParams(window.location.search);
      const targetId = params.get("orderId");
      if (targetId) {
        const cached = localStorage.getItem("twohearts_orders_cache");
        const list = cached ? JSON.parse(cached) : [];
        const match = (list || []).find((o) => o.id === targetId || o.orderNumber === targetId);
        if (match) return match;
      }
    } catch {
      return null;
    }
    return null;
  });

  // 5. Cart Drawer visibility state
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn("Error saving cart to localStorage", e);
    }
  }, [cart]);

  // Sync customerInfo to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customerInfo));
    } catch (e) {
      console.warn("Error saving customer info to localStorage", e);
    }
  }, [customerInfo]);

  // Sync activeOrder to localStorage (only if not cancelled/completed)
  useEffect(() => {
    try {
      const isTerminal =
        activeOrder &&
        ["cancelled", "delivered", "completed", "rejected"].includes(
          String(activeOrder.status || "").toLowerCase().trim()
        );
      if (activeOrder && !isTerminal) {
        localStorage.setItem(ACTIVE_ORDER_STORAGE_KEY, JSON.stringify(activeOrder));
      } else {
        localStorage.removeItem(ACTIVE_ORDER_STORAGE_KEY);
      }
    } catch (e) {
      console.warn("Error saving active order to localStorage", e);
    }
  }, [activeOrder]);

  // Listen for real-time admin status & estimated time updates
  useEffect(() => {
    const handleOrderUpdate = (e) => {
      const updated = e?.detail;
      if (!updated) {
        try {
          const fresh = localStorage.getItem(ACTIVE_ORDER_STORAGE_KEY);
          if (fresh) setActiveOrder(JSON.parse(fresh));
        } catch {}
        return;
      }

      const cleanNum = (n) => String(n || "").replace(/^#/, "").trim().toUpperCase();

      setActiveOrder((prev) => {
        if (!prev) return prev;
        const matches =
          prev.id === updated.id ||
          prev.orderNumber === updated.orderNumber ||
          (cleanNum(prev.orderNumber) && cleanNum(prev.orderNumber) === cleanNum(updated.orderNumber)) ||
          (cleanNum(prev.id) && cleanNum(prev.id) === cleanNum(updated.orderNumber)) ||
          (cleanNum(prev.orderNumber) && cleanNum(prev.orderNumber) === cleanNum(updated.id));

        if (matches) {
          const merged = { ...prev, ...updated };
          const isTerminal = ["cancelled", "delivered", "completed", "rejected"].includes(
            String(merged.status || "").toLowerCase().trim()
          );
          try {
            if (isTerminal) {
              localStorage.removeItem(ACTIVE_ORDER_STORAGE_KEY);
            } else {
              localStorage.setItem(ACTIVE_ORDER_STORAGE_KEY, JSON.stringify(merged));
            }
          } catch {}
          return merged;
        }
        return prev;
      });
    };

    window.addEventListener("twohearts_order_updated", handleOrderUpdate);
    window.addEventListener("twohearts_new_order", handleOrderUpdate);
    window.addEventListener("storage", handleOrderUpdate);

    return () => {
      window.removeEventListener("twohearts_order_updated", handleOrderUpdate);
      window.removeEventListener("twohearts_new_order", handleOrderUpdate);
      window.removeEventListener("storage", handleOrderUpdate);
    };
  }, []);

  // Cart operations
  const addToCart = (item) => {
    if (!item || item.isAvailable === false) return;
    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === item.id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          quantity: copy[existingIdx].quantity + 1
        };
        return copy;
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: Number(item.price) || 0,
          category: item.category || "other",
          image: item.image || "",
          isSpecial: Boolean(item.isSpecial),
          description: item.description || "",
          quantity: 1,
          specialInstructions: ""
        }
      ];
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter((i) => i.id !== itemId);
      }
      return prev.map((i) =>
        i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
      );
    });
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.id !== itemId));
    } else {
      setCart((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
      );
    }
  };

  const updateItemNotes = (itemId, notes) => {
    setCart((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, specialInstructions: notes } : i))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getItemQuantity = (itemId) => {
    const item = cart.find((i) => i.id === itemId);
    return item ? item.quantity : 0;
  };

  // Calculations
  const cartCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart]);

  // Delivery fee rules: Free above MIN_DELIVERY_SUBTOTAL or pickup; else standard fee
  const FREE_DELIVERY_THRESHOLD = DELIVERY_CONFIG.FREE_DELIVERY_THRESHOLD;
  const deliveryFee = useMemo(() => {
    if (deliveryType === "pickup" || cart.length === 0) return 0;
    return subtotal >= DELIVERY_CONFIG.FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CONFIG.STANDARD_DELIVERY_FEE;
  }, [deliveryType, subtotal, cart.length]);

  const taxes = useMemo(() => {
    // 5% GST
    return Math.round(subtotal * DELIVERY_CONFIG.GST_PERCENTAGE);
  }, [subtotal]);

  const total = useMemo(() => {
    if (cart.length === 0) return 0;
    return subtotal + deliveryFee + taxes;
  }, [subtotal, deliveryFee, taxes, cart.length]);

  // Place delivery order
  const submitOnlineOrder = async (paymentDetails = {}, customCustomerData = null) => {
    const cust = customCustomerData || {};
    const resolvedName = (cust.name || paymentDetails.customerName || paymentDetails.name || customerInfo.name || "").trim();
    const resolvedPhone = (cust.phone || paymentDetails.customerPhone || paymentDetails.phone || customerInfo.phone || "").trim();
    const resolvedAddress = (cust.address || paymentDetails.deliveryAddress || paymentDetails.address || customerInfo.address || "").trim();
    const resolvedLandmark = (cust.landmark || paymentDetails.landmark || customerInfo.landmark || "").trim();
    const resolvedNotes = (cust.notes || paymentDetails.customerNotes || paymentDetails.notes || customerInfo.notes || "").trim();
    const resolvedType = paymentDetails.orderType || deliveryType;

    const orderPayload = {
      orderType: resolvedType,
      userId: paymentDetails.userId || resolvedPhone || null,
      items: cart,
      subtotal,
      deliveryFee,
      tax: taxes,
      total,
      customerName: resolvedName || "Customer",
      customerPhone: resolvedPhone || "N/A",
      deliveryAddress: resolvedType === "delivery" ? (resolvedAddress || "Muradnagar, Uttar Pradesh") : "Pick up at Cafe Counter",
      address: resolvedType === "delivery" ? (resolvedAddress || "Muradnagar, Uttar Pradesh") : "Pick up at Cafe Counter",
      landmark: resolvedLandmark,
      customerNotes: resolvedNotes,
      paymentStatus: "paid",
      paymentMethod: paymentDetails.method || "online_upi",
      paymentId: paymentDetails.transactionId || `PAY-${Math.floor(100000 + Math.random() * 900000)}`,
      etaMinutes: resolvedType === "delivery" ? 35 : 20,
      estimatedTime: resolvedType === "delivery" ? "35 mins" : "20 mins",
      status: "placed"
    };

    // Keep customerInfo in sync
    if (resolvedName || resolvedPhone || resolvedAddress) {
      const mergedInfo = {
        name: resolvedName || customerInfo.name,
        phone: resolvedPhone || customerInfo.phone,
        address: resolvedAddress || customerInfo.address,
        landmark: resolvedLandmark || customerInfo.landmark,
        notes: resolvedNotes || customerInfo.notes
      };
      setCustomerInfo(mergedInfo);
      try {
        localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(mergedInfo));
      } catch {}
    }

    const createdOrder = await placeOnlineDeliveryOrder(orderPayload);
    setActiveOrder(createdOrder);
    clearCart();
    return createdOrder;
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateItemNotes,
    clearCart,
    getItemQuantity,
    cartCount,
    subtotal,
    deliveryFee,
    taxes,
    total,
    FREE_DELIVERY_THRESHOLD,
    DELIVERY_CONFIG,
    calculateDistanceKm,
    checkDeliveryEligibility,
    deliveryType,
    setDeliveryType,
    customerInfo,
    setCustomerInfo,
    activeOrder,
    setActiveOrder,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    submitOnlineOrder
  };

  return (
    <OnlineOrderContext.Provider value={value}>
      {children}
    </OnlineOrderContext.Provider>
  );
}

export function useOnlineOrder() {
  const context = useContext(OnlineOrderContext);
  if (!context) {
    throw new Error("useOnlineOrder must be used within an OnlineOrderProvider");
  }
  return context;
}
