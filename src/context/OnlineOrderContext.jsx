import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { placeOnlineDeliveryOrder } from "../firebase/services";

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
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
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

  // Sync activeOrder to localStorage
  useEffect(() => {
    try {
      if (activeOrder) {
        localStorage.setItem(ACTIVE_ORDER_STORAGE_KEY, JSON.stringify(activeOrder));
      } else {
        localStorage.removeItem(ACTIVE_ORDER_STORAGE_KEY);
      }
    } catch (e) {
      console.warn("Error saving active order to localStorage", e);
    }
  }, [activeOrder]);

  // Cart operations
  const addToCart = (item) => {
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

  // Delivery fee rules: Free above ₹299 or pickup; else ₹30
  const FREE_DELIVERY_THRESHOLD = 299;
  const deliveryFee = useMemo(() => {
    if (deliveryType === "pickup" || cart.length === 0) return 0;
    return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 30;
  }, [deliveryType, subtotal, cart.length]);

  const taxes = useMemo(() => {
    // 5% GST
    return Math.round(subtotal * 0.05);
  }, [subtotal]);

  const total = useMemo(() => {
    if (cart.length === 0) return 0;
    return subtotal + deliveryFee + taxes;
  }, [subtotal, deliveryFee, taxes, cart.length]);

  // Place delivery order
  const submitOnlineOrder = async (paymentDetails = {}) => {
    const orderPayload = {
      orderType: deliveryType,
      userId: paymentDetails.userId || customerInfo.phone.trim() || null,
      items: cart,
      subtotal,
      deliveryFee,
      tax: taxes,
      total,
      customerName: customerInfo.name.trim() || "Guest Customer",
      customerPhone: customerInfo.phone.trim(),
      deliveryAddress: deliveryType === "delivery" ? customerInfo.address.trim() : "Pick up at Cafe Counter",
      landmark: customerInfo.landmark.trim(),
      customerNotes: customerInfo.notes.trim(),
      paymentStatus: "paid",
      paymentMethod: paymentDetails.method || "online_upi",
      paymentId: paymentDetails.transactionId || `PAY-${Math.floor(100000 + Math.random() * 900000)}`,
      etaMinutes: deliveryType === "delivery" ? 35 : 20
    };

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
