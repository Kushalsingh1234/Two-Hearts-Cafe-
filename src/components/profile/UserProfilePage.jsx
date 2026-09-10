import React, { useState, useEffect, useCallback } from "react";
import {
  User,
  Mail,
  Edit3,
  LogOut,
  Clock,
  Download,
  Star,
  ChevronRight,
  ShoppingBag,
  Bike,
  CheckCircle,
  Package,
  MapPin,
  Plus,
  Trash2,
  Check,
  Settings,
  Bell,
  CreditCard,
  Shield,
  Smartphone,
  X,
  ChefHat,
  Store,
  Phone,
  MessageSquare,
  Navigation,
  ExternalLink,
  Copy,
  CheckCircle2
} from "lucide-react";
import CafeLogoIcon from "../common/CafeLogoIcon";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { getCustomerOrders } from "../../firebase/services";
import { printReceipt } from "../../utils/receiptGenerator";
import OrderDetailsModal from "./OrderDetailsModal";
import OrderFeedbackModal from "./OrderFeedbackModal";

export default function UserProfilePage({ setPage, initialTab = "orders" }) {
  const {
    customerUser,
    isLoggedIn,
    openAuthModal,
    logout,
    updateProfile,
    deleteAccount,
    savedAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    notificationSettings,
    updateNotificationSettings,
    savedPaymentMethods,
    addPaymentMethod,
    deletePaymentMethod
  } = useCustomerAuth();

  // Active Tab: 'orders' | 'addresses' | 'profile' | 'settings' | 'feedback'
  const [activeTab, setActiveTab] = useState(initialTab || "orders");

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [activeOrderDetails, setActiveOrderDetails] = useState(null);
  const [activeFeedbackOrder, setActiveFeedbackOrder] = useState(null);
  const [copiedOrderId, setCopiedOrderId] = useState(null);

  // Profile Edit State
  const [editName, setEditName] = useState(customerUser?.name || "");
  const [editEmail, setEditEmail] = useState(customerUser?.email || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: "Hostel",
    recipientName: "",
    phone: "",
    address: "",
    landmark: "",
    isDefault: false
  });
  const [addressError, setAddressError] = useState("");

  // Payment method state
  const [isAddUpiOpen, setIsAddUpiOpen] = useState(false);
  const [newUpiId, setNewUpiId] = useState("");

  // Sync profile form
  useEffect(() => {
    if (customerUser) {
      setEditName((prev) => prev || customerUser.name || "");
      setEditEmail((prev) => prev || customerUser.email || "");
    }
  }, [customerUser]);

  // Load customer orders with live active order sync
  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    const phone = customerUser?.phone || "";
    let list = await getCustomerOrders(phone);

    // Also check active order from localStorage
    try {
      const activeRaw = localStorage.getItem("twohearts_active_online_order_v1");
      if (activeRaw) {
        const activeObj = JSON.parse(activeRaw);
        if (activeObj && activeObj.id) {
          const exists = list.some((o) => o.id === activeObj.id);
          if (!exists) {
            list = [activeObj, ...list];
          } else {
            // merge latest fields (like updated estimatedTime or status)
            list = list.map((o) => (o.id === activeObj.id ? { ...o, ...activeObj } : o));
          }
        }
      }
    } catch (e) {}

    // Sort newest first
    list.sort((a, b) => {
      const timeA = a.timestamp || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.timestamp || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });

    setOrders(list);
    setLoadingOrders(false);
  }, [customerUser]);

  useEffect(() => {
    loadOrders();

    const handleOrderChange = () => {
      loadOrders();
    };

    window.addEventListener("twohearts_new_order", handleOrderChange);
    window.addEventListener("twohearts_order_updated", handleOrderChange);
    window.addEventListener("storage", handleOrderChange);

    // Periodic sync every 3 seconds to catch live kitchen updates
    const syncInterval = setInterval(() => {
      loadOrders();
    }, 3000);

    return () => {
      window.removeEventListener("twohearts_new_order", handleOrderChange);
      window.removeEventListener("twohearts_order_updated", handleOrderChange);
      window.removeEventListener("storage", handleOrderChange);
      clearInterval(syncInterval);
    };
  }, [loadOrders]);

  // Save profile changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setSavingProfile(true);

    const res = await updateProfile({ name: editName, email: editEmail });
    setSavingProfile(false);

    if (res.success) {
      setProfileSuccessMsg("Your profile details have been saved.");
      setTimeout(() => setProfileSuccessMsg(""), 3500);
    }
  };

  // Open Address Modal for New
  const handleOpenNewAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      label: "Hostel",
      recipientName: customerUser?.name || "",
      phone: customerUser?.phone || "",
      address: "",
      landmark: "",
      isDefault: savedAddresses.length === 0
    });
    setAddressError("");
    setIsAddressModalOpen(true);
  };

  // Open Address Modal for Edit
  const handleOpenEditAddress = (addr) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      label: addr.label || "Home",
      recipientName: addr.recipientName || customerUser?.name || "",
      phone: addr.phone || customerUser?.phone || "",
      address: addr.address || "",
      landmark: addr.landmark || "",
      isDefault: Boolean(addr.isDefault)
    });
    setAddressError("");
    setIsAddressModalOpen(true);
  };

  // Save Address submission
  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (!addressForm.address.trim()) {
      setAddressError("Please enter a street or hostel address.");
      return;
    }
    if (!addressForm.recipientName.trim()) {
      setAddressError("Please enter recipient name.");
      return;
    }

    if (editingAddressId) {
      updateAddress(editingAddressId, addressForm);
    } else {
      addAddress(addressForm);
    }

    setIsAddressModalOpen(false);
  };

  // Add new UPI
  const handleSaveUpi = (e) => {
    e.preventDefault();
    if (!newUpiId.includes("@")) {
      alert("Please enter a valid UPI ID (e.g. user@okhdfcbank)");
      return;
    }
    addPaymentMethod({ type: "upi", upiId: newUpiId.trim(), isDefault: false });
    setNewUpiId("");
    setIsAddUpiOpen(false);
  };

  // If user is not logged in, show elegant Sign-In barrier
  if (!isLoggedIn || !customerUser) {
    return (
      <div style={{ padding: "80px 20px 120px 20px", backgroundColor: "var(--bg-app)", minHeight: "80vh" }}>
        <div className="site-container-narrow" style={{ textAlign: "center" }}>
          <div
            className="bistro-card"
            style={{
              padding: "48px 32px",
              maxWidth: 480,
              margin: "0 auto",
              backgroundColor: "#FFFFFF"
            }}
          >
            <div style={{ display: "inline-flex", marginBottom: 12 }}>
              <CafeLogoIcon size={52} />
            </div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 28, marginBottom: 8 }}>
              Customer Profile & Orders
            </h2>
            <p style={{ fontSize: 14, color: "var(--color-ink-soft)", lineHeight: 1.5, marginBottom: 24 }}>
              Sign in with your Google account to view your past orders, manage saved addresses, download receipts, and configure settings.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => openAuthModal(() => setPage("profile"))}
                className="btn-pill-black"
                style={{ padding: "13px 32px" }}
              >
                Sign In with Google (Gmail)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const initials = customerUser.avatarMonogram || (
    customerUser.name
      ? customerUser.name
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : "TH"
  );

  const tabs = [
    { id: "orders", label: "My Orders", icon: Clock },
    { id: "addresses", label: "Your Addresses", icon: MapPin },
    { id: "profile", label: "My Profile", icon: User },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "feedback", label: "Feedback / Ratings", icon: Star }
  ];

  // Rated orders list
  const ratedOrders = orders.filter((o) => o.rating);
  const unratedOrders = orders.filter((o) => !o.rating && o.status === "delivered");

  return (
    <div className="mobile-section-tight" style={{ backgroundColor: "var(--bg-app)", minHeight: "90vh", padding: "32px 20px 100px 20px" }}>
      <div className="site-container" style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Success Toast */}
        {profileSuccessMsg && (
          <div
            className="animate-fade-in"
            style={{
              marginBottom: 20,
              padding: "12px 18px",
              backgroundColor: "#ECFDF5",
              border: "1px solid #A7F3D0",
              borderRadius: "var(--radius-md)",
              color: "#065F46",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13
            }}
          >
            <CheckCircle size={16} />
            <span>{profileSuccessMsg}</span>
          </div>
        )}

        {/* 1. COMPACT USER MINI HEADER */}
        <div
          className="bistro-card mobile-card-compact"
          style={{
            backgroundColor: "#FFFFFF",
            padding: "24px 28px",
            borderRadius: 18,
            marginBottom: 24,
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: "var(--color-bronze-light)",
                border: "2px solid var(--color-bronze)",
                color: "var(--color-bronze-dark)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-serif)",
                fontSize: 22,
                fontWeight: 700
              }}
            >
              {initials}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "clamp(20px, 3.5vw, 24px)",
                    fontWeight: 600,
                    color: "var(--color-ink)",
                    margin: 0
                  }}
                >
                  {customerUser.name || "Customer"}
                </h1>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "var(--font-serif)",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    backgroundColor: "#ECFDF5",
                    border: "1px solid #A7F3D0",
                    color: "#059669",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-pill)"
                  }}
                >
                  Verified
                </span>
              </div>
              <div style={{ fontSize: 13, color: "var(--color-ink-soft)", marginTop: 2 }}>
                +91 {customerUser.phone} {customerUser.email ? `• ${customerUser.email}` : ""}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={() => setPage("menu")}
              className="btn-pill-outline touch-target-44"
              style={{ padding: "8px 16px", fontSize: 12, minHeight: 44 }}
            >
              <span>Order Food</span>
              <ChevronRight size={13} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Are you sure you want to sign out?")) {
                  logout();
                  setPage("home");
                }
              }}
              className="touch-target-44"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "8px 14px",
                borderRadius: "var(--radius-pill)",
                backgroundColor: "transparent",
                color: "#DC2626",
                border: "1px solid #FCA5A5",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                minHeight: 44
              }}
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* 2. TAB NAVIGATION BAR (Horizontal pill carousel, touch-friendly) */}
        <div
          className="no-scrollbar"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            overflowX: "auto",
            marginBottom: 24,
            paddingBottom: 4
          }}
        >
          {tabs.map((tab) => {
            const IconComp = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="touch-target-44"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 18px",
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: isCurrent ? "var(--color-ink)" : "#FFFFFF",
                  color: isCurrent ? "#FFFFFF" : "var(--color-ink)",
                  border: `1.5px solid ${isCurrent ? "var(--color-ink)" : "var(--border-color)"}`,
                  fontSize: 13,
                  fontFamily: "var(--font-serif)",
                  fontWeight: isCurrent ? 700 : 500,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: isCurrent ? "0 2px 8px rgba(28, 25, 23, 0.15)" : "var(--shadow-sm)",
                  minHeight: 44
                }}
              >
                <IconComp size={15} color={isCurrent ? "#FFFFFF" : "var(--color-bronze)"} />
                <span>{tab.label}</span>
                {tab.id === "orders" && orders.length > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 6px",
                      borderRadius: 10,
                      backgroundColor: isCurrent ? "rgba(255, 255, 255, 0.25)" : "var(--bg-app)",
                      color: isCurrent ? "#FFFFFF" : "var(--color-ink-soft)"
                    }}
                  >
                    {orders.length}
                  </span>
                )}
                {tab.id === "addresses" && savedAddresses.length > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 6px",
                      borderRadius: 10,
                      backgroundColor: isCurrent ? "rgba(255, 255, 255, 0.25)" : "var(--bg-app)",
                      color: isCurrent ? "#FFFFFF" : "var(--color-ink-soft)"
                    }}
                  >
                    {savedAddresses.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 3. TAB CONTENT SECTIONS */}

        {/* TAB 1: MY ORDERS */}
        {activeTab === "orders" && (
          <div>
            {loadingOrders ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#78716C" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                  <Clock size={18} style={{ color: "var(--color-bronze)" }} />
                  <span>Loading your orders...</span>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div
                className="bistro-card"
                style={{
                  textAlign: "center",
                  padding: "60px 24px",
                  backgroundColor: "#FFFFFF"
                }}
              >
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: "50%",
                    backgroundColor: "var(--color-bronze-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px auto",
                    color: "var(--color-bronze)"
                  }}
                >
                  <Package size={28} />
                </div>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 22, marginBottom: 6 }}>
                  No orders found
                </h3>
                <p style={{ fontSize: 13, color: "var(--color-ink-soft)", maxWidth: 380, margin: "0 auto 20px auto" }}>
                  You haven't placed an online food delivery or takeaway order with us yet. Explore our handcrafted pastas, burgers, and shakes!
                </p>
                <button
                  type="button"
                  onClick={() => setPage("menu")}
                  className="btn-pill-black"
                  style={{ padding: "12px 28px" }}
                >
                  Browse Menu & Order Now
                </button>
              </div>
            ) : (() => {
              const activeOrders = orders.filter(
                (ord) => !["delivered", "completed", "cancelled"].includes(ord.status)
              );
              const pastOrders = orders.filter(
                (ord) => ["delivered", "completed", "cancelled"].includes(ord.status)
              );

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {/* SECTION A: ACTIVE IN-PROGRESS ORDERS */}
                  {activeOrders.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ position: "relative", display: "flex", height: 10, width: 10 }}>
                            <span style={{ animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite", position: "absolute", display: "inline-flex", height: "100%", width: "100%", borderRadius: "50%", backgroundColor: "#10B981", opacity: 0.75 }} />
                            <span style={{ position: "relative", display: "inline-flex", borderRadius: "50%", height: 10, width: 10, backgroundColor: "#059669" }} />
                          </span>
                          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 19, fontWeight: 700, color: "var(--color-ink)", margin: 0 }}>
                            Live Order in Progress ({activeOrders.length})
                          </h3>
                        </div>
                        <span style={{ fontSize: 12, color: "#059669", fontWeight: 700 }}>
                          ● Synced with Kitchen
                        </span>
                      </div>

                      {activeOrders.map((ord) => {
                        const isPickup = ord.orderType === "pickup";
                        const itemsCount = (ord.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0);
                        const dateText = ord.createdAt
                          ? new Date(ord.createdAt).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short"
                            })
                          : "Just now";

                        const getStepIndex = (status) => {
                          switch (status) {
                            case "placed":
                            case "confirmed":
                              return 1;
                            case "preparing":
                              return 2;
                            case "out_for_delivery":
                            case "ready_for_pickup":
                              return 3;
                            case "delivered":
                            case "completed":
                              return 4;
                            default:
                              return 1;
                          }
                        };
                        const stepIndex = getStepIndex(ord.status);

                        const steps = [
                          { step: 1, label: "Confirmed", desc: "Ticket received", icon: CheckCircle2 },
                          { step: 2, label: "In Kitchen", desc: "Chefs cooking", icon: ChefHat },
                          { step: 3, label: isPickup ? "Ready" : "On the Way", desc: isPickup ? "At counter" : "Driver moving", icon: isPickup ? Store : Bike },
                          { step: 4, label: isPickup ? "Collected" : "Delivered", desc: "Enjoy meal!", icon: ShoppingBag }
                        ];

                        const liveEta = ord.estimatedTime || (ord.etaMinutes ? `${ord.etaMinutes} mins` : (isPickup ? "15-20 mins" : "30-35 mins"));
                        const deliveryAddr = (ord.deliveryAddress || ord.address || ord.fullAddress || "").trim();
                        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                          `${deliveryAddr || "Muradnagar"}${ord.landmark ? `, Near ${ord.landmark}` : ""}, Muradnagar, Uttar Pradesh`
                        )}`;

                        return (
                          <div
                            key={ord.id}
                            className="bistro-card"
                            style={{
                              backgroundColor: "#FFFFFF",
                              padding: "24px 26px",
                              borderRadius: 18,
                              border: "2px solid #059669",
                              boxShadow: "0 10px 30px -5px rgba(5, 150, 105, 0.18)"
                            }}
                          >
                            {/* Card Top: Beacon & Meta */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: 10,
                                marginBottom: 16
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "4px 12px",
                                    backgroundColor: "#ECFDF5",
                                    borderRadius: "var(--radius-pill)",
                                    border: "1px solid #A7F3D0"
                                  }}
                                >
                                  <span style={{ position: "relative", display: "flex", height: 8, width: 8 }}>
                                    <span style={{ animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite", position: "absolute", display: "inline-flex", height: "100%", width: "100%", borderRadius: "50%", backgroundColor: "#10B981", opacity: 0.75 }} />
                                    <span style={{ position: "relative", display: "inline-flex", borderRadius: "50%", height: 8, width: 8, backgroundColor: "#059669" }} />
                                  </span>
                                  <span style={{ fontSize: 11, fontFamily: "var(--font-serif)", fontWeight: 800, color: "#065F46", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                    LIVE IN PROGRESS
                                  </span>
                                </div>

                                <span style={{ fontFamily: "var(--font-serif)", fontSize: 17, fontWeight: 700, color: "var(--color-ink)" }}>
                                  Order #{ord.orderNumber || ord.id}
                                </span>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard?.writeText(ord.orderNumber || ord.id);
                                    setCopiedOrderId(ord.orderNumber || ord.id);
                                    setTimeout(() => setCopiedOrderId(null), 2000);
                                  }}
                                  style={{
                                    background: "#F9FAFB",
                                    border: "1px solid #E5E7EB",
                                    borderRadius: 6,
                                    cursor: "pointer",
                                    color: "var(--color-ink)",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    padding: "4px 8px",
                                    fontSize: 11
                                  }}
                                  title="Copy Order ID"
                                >
                                  {copiedOrderId === (ord.orderNumber || ord.id) ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
                                  <span>{copiedOrderId === (ord.orderNumber || ord.id) ? "Copied" : "Copy ID"}</span>
                                </button>
                                <span style={{ fontSize: 12, color: "var(--color-ink-soft)" }}>
                                  {dateText}
                                </span>
                              </div>
                            </div>

                            {/* Hero Synced Kitchen ETA Box */}
                            <div
                              style={{
                                background: "linear-gradient(135deg, #064E3B 0%, #04382A 100%)",
                                borderRadius: 14,
                                padding: "18px 22px",
                                color: "#FFFFFF",
                                boxShadow: "0 8px 24px -4px rgba(6, 78, 59, 0.25)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: 16,
                                marginBottom: 20
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                <div
                                  style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 12,
                                    backgroundColor: "rgba(52, 211, 153, 0.15)",
                                    border: "1.5px solid rgba(52, 211, 153, 0.35)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#34D399"
                                  }}
                                >
                                  <Clock size={26} />
                                </div>
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#A7F3D0", textTransform: "uppercase" }}>
                                    {isPickup ? "Estimated Ready for Pickup" : "Kitchen Estimated Delivery"}
                                  </div>
                                  <div style={{ fontSize: "clamp(22px, 3.5vw, 28px)", fontFamily: "var(--font-serif)", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.2 }}>
                                    {liveEta}
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    padding: "4px 10px",
                                    borderRadius: "var(--radius-pill)",
                                    backgroundColor: "rgba(16, 185, 129, 0.2)",
                                    border: "1px solid rgba(16, 185, 129, 0.4)",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#6EE7B7"
                                  }}
                                >
                                  <CheckCircle size={12} />
                                  <span>Live Synced with Kitchen</span>
                                </span>
                                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
                                  Updates in real-time as chefs cook
                                </span>
                              </div>
                            </div>

                            {/* 4-Stage Stepper */}
                            <div style={{ padding: "8px 0 20px 0", borderBottom: "1px dashed var(--border-color)", marginBottom: 18 }}>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, position: "relative" }}>
                                {steps.map((st) => {
                                  const isDone = stepIndex > st.step;
                                  const isCurrent = stepIndex === st.step;
                                  const IconComp = st.icon;

                                  return (
                                    <div key={st.step} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                                      <div
                                        style={{
                                          width: 38,
                                          height: 38,
                                          borderRadius: "50%",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          backgroundColor: isDone ? "#059669" : isCurrent ? "#064E3B" : "#F3F4F6",
                                          color: isDone || isCurrent ? "#FFFFFF" : "#9CA3AF",
                                          border: isCurrent ? "3px solid #10B981" : isDone ? "2px solid #059669" : "2px solid #E5E7EB",
                                          boxShadow: isCurrent ? "0 0 0 4px rgba(16, 185, 129, 0.25)" : "none",
                                          transition: "all 0.3s ease",
                                          marginBottom: 8
                                        }}
                                      >
                                        {isDone ? <Check size={18} strokeWidth={3} /> : <IconComp size={18} />}
                                      </div>
                                      <div style={{ fontSize: 12, fontWeight: isCurrent ? 800 : 600, color: isCurrent ? "#064E3B" : isDone ? "#059669" : "var(--color-ink-soft)", fontFamily: "var(--font-serif)" }}>
                                        {st.label}
                                      </div>
                                      <div style={{ fontSize: 10.5, color: "#78716C", marginTop: 2 }}>
                                        {st.desc}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Itemized Order Breakdown (Whole Order) */}
                            <div style={{ backgroundColor: "#FAF6F0", borderRadius: 12, padding: "16px 18px", border: "1px solid var(--border-color)", marginBottom: 18 }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                                <span style={{ fontFamily: "var(--font-serif)", fontSize: 13, fontWeight: 700, color: "var(--color-ink)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                  Itemized Order Breakdown ({itemsCount} item{itemsCount !== 1 ? "s" : ""})
                                </span>
                                <span style={{ fontSize: 11, color: "#15803D", fontWeight: 700 }}>
                                  PAID ONLINE ({ord.paymentMethod || "UPI"})
                                </span>
                              </div>

                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {(ord.items || []).map((item, idx) => (
                                  <div key={idx} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", fontSize: 13, gap: 10 }}>
                                    <div>
                                      <span style={{ fontWeight: 700, color: "var(--color-ink)" }}>{item.quantity}x </span>
                                      <span style={{ color: "var(--color-ink)", fontWeight: 600 }}>{item.name}</span>
                                      {item.itemNotes && (
                                        <div style={{ fontSize: 11, color: "var(--color-bronze-dark)", marginTop: 2 }}>
                                          Note: {item.itemNotes}
                                        </div>
                                      )}
                                    </div>
                                    <span style={{ fontWeight: 700, color: "var(--color-ink)", flexShrink: 0 }}>
                                      ₹{(item.price || 0) * (item.quantity || 1)}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {/* Math summary */}
                              <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed var(--border-color)", display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "var(--color-ink-soft)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span>Item Subtotal</span>
                                  <span>₹{ord.subtotal || ord.total}</span>
                                </div>
                                {ord.orderType === "delivery" && (
                                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span>Delivery Fee</span>
                                    <span>{ord.deliveryFee > 0 ? `₹${ord.deliveryFee}` : "FREE"}</span>
                                  </div>
                                )}
                                {ord.tax > 0 && (
                                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span>GST Taxes (5%)</span>
                                    <span>₹{ord.tax}</span>
                                  </div>
                                )}
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800, color: "var(--color-ink)", paddingTop: 6, borderTop: "1px solid var(--border-color)", marginTop: 4 }}>
                                  <span>Grand Total</span>
                                  <span style={{ color: "var(--color-bronze-dark)" }}>₹{ord.total}</span>
                                </div>
                              </div>
                            </div>

                            {/* Delivery Destination & Google Maps */}
                            {!isPickup ? (
                              <div style={{ backgroundColor: "#FFFFFF", borderRadius: 12, padding: "14px 16px", border: "1px solid var(--border-color)", marginBottom: 18, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flex: 1, minWidth: 200 }}>
                                  <MapPin size={16} style={{ color: "var(--color-bronze)", flexShrink: 0, marginTop: 2 }} />
                                  <div>
                                    <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, color: "var(--color-ink-soft)" }}>
                                      Delivery Destination
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-ink)", marginTop: 2 }}>
                                      {deliveryAddr || "Muradnagar, Uttar Pradesh"}
                                    </div>
                                    {ord.landmark && (
                                      <div style={{ fontSize: 11.5, color: "var(--color-bronze-dark)", marginTop: 2 }}>
                                        Landmark: {ord.landmark}
                                      </div>
                                    )}
                                    {ord.customerNotes && (
                                      <div style={{ fontSize: 11.5, color: "#6B7280", marginTop: 2 }}>
                                        Note: {ord.customerNotes}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <a
                                  href={googleMapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    padding: "7px 14px",
                                    borderRadius: "var(--radius-pill)",
                                    backgroundColor: "#FAF6F0",
                                    border: "1.5px solid var(--border-color)",
                                    color: "var(--color-ink)",
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                    textDecoration: "none"
                                  }}
                                  title="Open destination in Google Maps"
                                >
                                  <Navigation size={12} />
                                  <span>Google Maps</span>
                                  <ExternalLink size={10} />
                                </a>
                              </div>
                            ) : (
                              <div style={{ backgroundColor: "#FFFFFF", borderRadius: 12, padding: "14px 16px", border: "1px solid var(--border-color)", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
                                <Store size={18} style={{ color: "var(--color-bronze)" }} />
                                <div style={{ fontSize: 12.5, color: "var(--color-ink)" }}>
                                  <strong>Pickup Location:</strong> Two Hearts Cafe Counter, Pillar #852, Delhi-Meerut Highway, Muradnagar
                                </div>
                              </div>
                            )}

                            {/* Action Row */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <a
                                  href="tel:+917906208341"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    padding: "8px 14px",
                                    borderRadius: "var(--radius-pill)",
                                    backgroundColor: "#FFFFFF",
                                    border: "1px solid var(--border-color)",
                                    color: "var(--color-ink)",
                                    fontSize: 11.5,
                                    fontWeight: 600,
                                    textDecoration: "none"
                                  }}
                                  title="Call Cafe Kitchen"
                                >
                                  <Phone size={13} style={{ color: "var(--color-bronze)" }} />
                                  <span>Call Cafe</span>
                                </a>

                                <a
                                  href="https://wa.me/917906208341"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    padding: "8px 14px",
                                    borderRadius: "var(--radius-pill)",
                                    backgroundColor: "#ECFDF5",
                                    border: "1px solid #A7F3D0",
                                    color: "#065F46",
                                    fontSize: 11.5,
                                    fontWeight: 600,
                                    textDecoration: "none"
                                  }}
                                  title="WhatsApp Cafe Kitchen"
                                >
                                  <MessageSquare size={13} style={{ color: "#059669" }} />
                                  <span>WhatsApp</span>
                                </a>

                                <button
                                  type="button"
                                  onClick={() => printReceipt(ord)}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    padding: "8px 14px",
                                    borderRadius: "var(--radius-pill)",
                                    backgroundColor: "#FFFFFF",
                                    border: "1px solid var(--border-color)",
                                    color: "var(--color-ink)",
                                    fontSize: 11.5,
                                    fontWeight: 600,
                                    cursor: "pointer"
                                  }}
                                  title="Print Receipt"
                                >
                                  <Download size={13} />
                                  <span>Receipt</span>
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setPage("order-status");
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                className="btn-pill-black"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "10px 22px",
                                  fontSize: 12.5,
                                  fontWeight: 700,
                                  boxShadow: "0 4px 14px rgba(0,0,0,0.18)"
                                }}
                              >
                                <span>Track Live on Tracker</span>
                                <ExternalLink size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* SECTION B: PAST COMPLETED ORDERS */}
                  {pastOrders.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {activeOrders.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0 6px 0" }}>
                          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 700, color: "var(--color-ink)", margin: 0 }}>
                            Past Completed Orders ({pastOrders.length})
                          </h3>
                          <div style={{ height: 1, flex: 1, backgroundColor: "var(--border-color)" }} />
                        </div>
                      )}

                      {pastOrders.map((ord) => {
                        const itemsCount = (ord.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0);
                        const itemsSummary = (ord.items || [])
                          .map((i) => `${i.quantity}x ${i.name}`)
                          .slice(0, 3)
                          .join(", ") + ((ord.items || []).length > 3 ? "..." : "");

                        const dateText = ord.createdAt
                          ? new Date(ord.createdAt).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short"
                            })
                          : "Past Order";

                        const isDelivered = ord.status === "delivered";

                        return (
                          <div
                            key={ord.id}
                            className="bistro-card bistro-card-hover mobile-card-compact"
                            style={{
                              backgroundColor: "#FFFFFF",
                              padding: "20px 24px",
                              borderRadius: 16,
                              border: "1px solid var(--border-color)"
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: 12,
                                paddingBottom: 14,
                                borderBottom: "1px solid var(--border-color)"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                {ord.orderType === "pickup" ? (
                                  <div
                                    style={{
                                      width: 36,
                                      height: 36,
                                      borderRadius: "50%",
                                      backgroundColor: "var(--bg-app)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "var(--color-bronze)"
                                    }}
                                  >
                                    <ShoppingBag size={18} />
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      width: 36,
                                      height: 36,
                                      borderRadius: "50%",
                                      backgroundColor: "var(--bg-app)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "var(--color-bronze)"
                                    }}
                                  >
                                    <Bike size={18} />
                                  </div>
                                )}

                                <div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontFamily: "var(--font-serif)", fontSize: 17, fontWeight: 700, color: "var(--color-ink)" }}>
                                      Order #{ord.orderNumber || ord.id}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: 10,
                                        fontFamily: "var(--font-serif)",
                                        fontWeight: 700,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                        padding: "2px 8px",
                                        borderRadius: "var(--radius-pill)",
                                        backgroundColor: isDelivered ? "#ECFDF5" : "#FEF3C7",
                                        color: isDelivered ? "#059669" : "#D97706",
                                        border: `1px solid ${isDelivered ? "#A7F3D0" : "#FCD34D"}`
                                      }}
                                    >
                                      {ord.status ? ord.status.replace("_", " ").toUpperCase() : "COMPLETED"}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: 12, color: "#78716C", marginTop: 2 }}>
                                    {dateText} • {ord.orderType === "pickup" ? "Takeaway" : "Home Delivery"}
                                  </div>
                                </div>
                              </div>

                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 700, color: "var(--color-ink)" }}>
                                  ₹{ord.total}
                                </div>
                                <div style={{ fontSize: 11, color: "#78716C" }}>
                                  {itemsCount} item{itemsCount !== 1 ? "s" : ""}
                                </div>
                              </div>
                            </div>

                            <div style={{ padding: "12px 0", fontSize: 13, color: "var(--color-ink-soft)" }}>
                              <strong>Items:</strong> {itemsSummary}
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: 10,
                                paddingTop: 12,
                                borderTop: "1px dashed var(--border-color)"
                              }}
                            >
                              <div>
                                {ord.rating ? (
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <div style={{ display: "flex", gap: 2 }}>
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          size={13}
                                          fill={star <= ord.rating ? "#F59E0B" : "transparent"}
                                          color={star <= ord.rating ? "#F59E0B" : "#D1D5DB"}
                                        />
                                      ))}
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-bronze-dark)" }}>
                                      You rated {ord.rating}★
                                    </span>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setActiveFeedbackOrder(ord)}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 5,
                                      padding: "6px 12px",
                                      borderRadius: "var(--radius-pill)",
                                      backgroundColor: "var(--bg-app)",
                                      border: "1px solid var(--border-color)",
                                      fontSize: 11,
                                      fontWeight: 600,
                                      color: "var(--color-bronze-dark)",
                                      cursor: "pointer"
                                    }}
                                  >
                                    <Star size={12} color="#F59E0B" />
                                    <span>Rate this meal</span>
                                  </button>
                                )}
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <button
                                  type="button"
                                  onClick={() => printReceipt(ord)}
                                  className="btn-pill-outline"
                                  style={{ padding: "7px 14px", fontSize: 11 }}
                                  title="Print or Save PDF Receipt"
                                >
                                  <Download size={12} />
                                  <span>Receipt</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setActiveOrderDetails(ord)}
                                  className="btn-pill-black"
                                  style={{ padding: "7px 16px", fontSize: 11 }}
                                >
                                  <span>View Details</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 2: YOUR ADDRESSES */}
        {activeTab === "addresses" && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 18,
                flexWrap: "wrap",
                gap: 10
              }}
            >
              <div>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, margin: 0 }}>
                  Saved Delivery Addresses
                </h2>
                <p style={{ fontSize: 13, color: "var(--color-bronze)", fontStyle: "italic", margin: "2px 0 0 0" }}>
                  Manage addresses for 1-tap checkout on your food delivery orders
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenNewAddress}
                className="btn-pill-black"
                style={{ padding: "9px 18px", fontSize: 12 }}
              >
                <Plus size={14} />
                <span>Add New Address</span>
              </button>
            </div>

            {savedAddresses.length === 0 ? (
              <div
                className="bistro-card"
                style={{
                  textAlign: "center",
                  padding: "60px 24px",
                  backgroundColor: "#FFFFFF",
                  borderRadius: 18,
                  border: "1.5px dashed var(--border-color)"
                }}
              >
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: "50%",
                    backgroundColor: "var(--color-bronze-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px auto",
                    color: "var(--color-bronze)"
                  }}
                >
                  <MapPin size={28} />
                </div>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 22, marginBottom: 6 }}>
                  No Saved Addresses Yet
                </h3>
                <p style={{ fontSize: 13, color: "var(--color-ink-soft)", maxWidth: 420, margin: "0 auto 24px auto", lineHeight: 1.5 }}>
                  You haven't added any delivery addresses yet. Add your hostel room, PG, flat, or home address for fast 1-tap checkout.
                </p>
                <button
                  type="button"
                  onClick={handleOpenNewAddress}
                  className="btn-pill-black"
                  style={{ padding: "12px 28px", fontSize: 13 }}
                >
                  <Plus size={15} style={{ marginRight: 6 }} />
                  Add Your Delivery Address
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                {savedAddresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bistro-card mobile-card-compact"
                  style={{
                    backgroundColor: "#FFFFFF",
                    padding: "20px",
                    borderRadius: 16,
                    border: `1.5px solid ${addr.isDefault ? "var(--color-bronze)" : "var(--border-color)"}`,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span
                          style={{
                            fontFamily: "var(--font-serif)",
                            fontSize: 16,
                            fontWeight: 700,
                            color: "var(--color-ink)"
                          }}
                        >
                          {addr.label === "Hostel" && "🏫 Hostel / Campus"}
                          {addr.label === "Home" && "🏠 Home"}
                          {addr.label === "Work" && "💼 Work / Office"}
                          {addr.label === "Other" && "📍 Location"}
                          {!["Hostel", "Home", "Work", "Other"].includes(addr.label) && `📍 ${addr.label}`}
                        </span>
                      </div>

                      {addr.isDefault && (
                        <span
                          style={{
                            fontSize: 10,
                            fontFamily: "var(--font-serif)",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            backgroundColor: "var(--color-bronze-light)",
                            color: "var(--color-bronze-dark)",
                            padding: "2px 8px",
                            borderRadius: "var(--radius-pill)"
                          }}
                        >
                          Default
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-ink)", marginBottom: 4 }}>
                      {addr.recipientName} {addr.phone && `• +91 ${addr.phone}`}
                    </div>

                    <p style={{ fontSize: 13, color: "var(--color-ink-soft)", lineHeight: 1.4, margin: "0 0 6px 0" }}>
                      {addr.address}
                    </p>

                    {addr.landmark && (
                      <div style={{ fontSize: 12, color: "#78716C", fontStyle: "italic", marginBottom: 14 }}>
                        Landmark: {addr.landmark}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: 12,
                      borderTop: "1px dashed var(--border-color)"
                    }}
                  >
                    {!addr.isDefault ? (
                      <button
                        type="button"
                        onClick={() => setDefaultAddress(addr.id)}
                        style={{
                          fontSize: 11,
                          color: "var(--color-bronze)",
                          fontWeight: 600,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0
                        }}
                      >
                        Set as Default
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: "#059669", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                        <Check size={12} /> Default Choice
                      </span>
                    )}

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditAddress(addr)}
                        className="btn-pill-outline"
                        style={{ padding: "5px 12px", fontSize: 11 }}
                      >
                        <Edit3 size={11} />
                        <span>Edit</span>
                      </button>
                      {savedAddresses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Delete this saved address?")) {
                              deleteAddress(addr.id);
                            }
                          }}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            border: "1px solid #FCA5A5",
                            backgroundColor: "transparent",
                            color: "#DC2626",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer"
                          }}
                          title="Delete address"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MY PROFILE EDIT */}
        {activeTab === "profile" && (
          <div className="bistro-card mobile-card-compact" style={{ backgroundColor: "#FFFFFF", padding: "32px", borderRadius: 20 }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, margin: "0 0 6px 0" }}>
              Personal Profile Details
            </h2>
            <p style={{ fontSize: 13, color: "#78716C", margin: "0 0 24px 0" }}>
              Update your contact information for delivery receipts and customer service
            </p>

            <form onSubmit={handleSaveProfile} style={{ maxWidth: 540 }}>
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontFamily: "var(--font-serif)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 700,
                    color: "var(--color-bronze)",
                    marginBottom: 6
                  }}
                >
                  Full Name *
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    border: "1.5px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "#FAF7F2",
                    padding: "10px 14px"
                  }}
                >
                  <User size={16} color="var(--color-bronze)" />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ flex: 1, border: "none", outline: "none", backgroundColor: "transparent", fontSize: 14, color: "var(--color-ink)" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontFamily: "var(--font-serif)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 700,
                    color: "var(--color-bronze)",
                    marginBottom: 6
                  }}
                >
                  Mobile Number (Login ID)
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    border: "1.5px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "#F3ECE2",
                    padding: "10px 14px",
                    color: "var(--color-ink-soft)"
                  }}
                >
                  <Smartphone size={16} color="var(--color-bronze)" />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>+91 {customerUser.phone}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "#059669", fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                    <CheckCircle size={12} /> Verified
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "#78716C", marginTop: 4 }}>
                  Mobile number is your unique customer ID and cannot be changed directly.
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontFamily: "var(--font-serif)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 700,
                    color: "var(--color-bronze)",
                    marginBottom: 6
                  }}
                >
                  Email Address (For Invoices & Order Confirmations)
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    border: "1.5px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "#FAF7F2",
                    padding: "10px 14px"
                  }}
                >
                  <Mail size={16} color="var(--color-bronze)" />
                  <input
                    type="email"
                    placeholder="yourname@gmail.com"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    style={{ flex: 1, border: "none", outline: "none", backgroundColor: "transparent", fontSize: 14, color: "var(--color-ink)" }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingProfile || !editName.trim()}
                className="btn-pill-black"
                style={{ padding: "12px 32px", fontSize: 13 }}
              >
                {savingProfile ? "Saving..." : "Save Profile Details"}
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === "settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Notification Preferences */}
            <div className="bistro-card" style={{ backgroundColor: "#FFFFFF", padding: "28px", borderRadius: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <Bell size={18} color="var(--color-bronze)" />
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 20, margin: 0 }}>
                  Notification & Alert Preferences
                </h3>
              </div>
              <p style={{ fontSize: 13, color: "#78716C", margin: "0 0 20px 0" }}>
                Choose how Two Hearts Cafe communicates delivery updates and offers with you.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", padding: "8px 0" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>
                      Live Order Tracking via SMS
                    </div>
                    <div style={{ fontSize: 12, color: "#78716C" }}>
                      Receive OTP codes, kitchen status, and rider delivery notifications.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.smsUpdates}
                    onChange={(e) => updateNotificationSettings({ smsUpdates: e.target.checked })}
                    style={{ width: 20, height: 20, accentColor: "var(--color-ink)", cursor: "pointer" }}
                  />
                </label>

                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", padding: "8px 0" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>
                      WhatsApp Delivery Tracking
                    </div>
                    <div style={{ fontSize: 12, color: "#78716C" }}>
                      Get live delivery map link and delivery partner details on WhatsApp.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.whatsappTracking}
                    onChange={(e) => updateNotificationSettings({ whatsappTracking: e.target.checked })}
                    style={{ width: 20, height: 20, accentColor: "var(--color-ink)", cursor: "pointer" }}
                  />
                </label>

                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", padding: "8px 0" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>
                      Chef Specials & Weekend Discounts
                    </div>
                    <div style={{ fontSize: 12, color: "#78716C" }}>
                      Receive alerts when new pastas or student discount coupons are active.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.promoOffers}
                    onChange={(e) => updateNotificationSettings({ promoOffers: e.target.checked })}
                    style={{ width: 20, height: 20, accentColor: "var(--color-ink)", cursor: "pointer" }}
                  />
                </label>
              </div>
            </div>

            {/* Saved Payment Methods */}
            <div className="bistro-card" style={{ backgroundColor: "#FFFFFF", padding: "28px", borderRadius: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <CreditCard size={18} color="var(--color-bronze)" />
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 20, margin: 0 }}>
                    Saved Payment Methods
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddUpiOpen(!isAddUpiOpen)}
                  className="btn-pill-outline"
                  style={{ padding: "6px 14px", fontSize: 11 }}
                >
                  <Plus size={12} />
                  <span>Add UPI ID</span>
                </button>
              </div>
              <p style={{ fontSize: 13, color: "#78716C", margin: "0 0 16px 0" }}>
                Faster 1-click checkout with your saved UPI apps and cards
              </p>

              {isAddUpiOpen && (
                <form onSubmit={handleSaveUpi} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <input
                    type="text"
                    placeholder="e.g. mobile@okaxis"
                    value={newUpiId}
                    onChange={(e) => setNewUpiId(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-color)",
                      fontSize: 13
                    }}
                  />
                  <button type="submit" className="btn-pill-black" style={{ padding: "8px 16px", fontSize: 12 }}>
                    Save
                  </button>
                </form>
              )}

              {savedPaymentMethods.length === 0 ? (
                <div
                  style={{
                    padding: "24px 16px",
                    textAlign: "center",
                    backgroundColor: "var(--bg-app)",
                    borderRadius: "var(--radius-md)",
                    border: "1px dashed var(--border-color)",
                    fontSize: 13,
                    color: "#78716C"
                  }}
                >
                  <CreditCard size={24} style={{ color: "var(--color-bronze)", margin: "0 auto 8px auto", display: "block" }} />
                  <div style={{ fontWeight: 600, color: "var(--color-ink)", marginBottom: 4 }}>No Saved Payment Methods</div>
                  <div>You can link a UPI ID for 1-tap checkout, or choose UPI / Cash on Delivery during order checkout.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {savedPaymentMethods.map((pm) => (
                  <div
                    key={pm.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--bg-app)",
                      border: "1px solid var(--border-color)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Smartphone size={16} color="var(--color-bronze)" />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                          {pm.type === "upi" ? pm.upiId : `${pm.bank} ending in ${pm.last4}`}
                        </div>
                        <div style={{ fontSize: 11, color: "#78716C" }}>
                          {pm.isDefault ? "Primary Payment Mode" : "Linked Method"}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => deletePaymentMethod(pm.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#DC2626",
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 600
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  ))}
                </div>
              )}
            </div>

            {/* Danger Zone: Reset & Delete Account */}
            <div className="bistro-card" style={{ backgroundColor: "#FFFFFF", padding: "28px", borderRadius: 20, border: "1px solid #FCA5A5" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#991B1B", marginBottom: 6 }}>
                <Shield size={18} />
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 18, margin: 0 }}>
                  Account & Data Management
                </h3>
              </div>
              <p style={{ fontSize: 13, color: "#78716C", marginBottom: 16 }}>
                Permanently purge your local ordering session, saved addresses, and cached preferences from this device.
              </p>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete your local customer profile and saved addresses?")) {
                    deleteAccount();
                    setPage("home");
                  }
                }}
                style={{
                  padding: "9px 20px",
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: "#FEF2F2",
                  border: "1.5px solid #F87171",
                  color: "#DC2626",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Delete Customer Profile & Clear Data
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: FEEDBACK / RATINGS */}
        {activeTab === "feedback" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, margin: 0 }}>
                Your Reviews & Dish Ratings
              </h2>
              <p style={{ fontSize: 13, color: "var(--color-bronze)", fontStyle: "italic", margin: "2px 0 0 0" }}>
                Track all ratings you've shared with Two Hearts Cafe and update reviews
              </p>
            </div>

            {/* Unrated orders callout if any */}
            {unratedOrders.length > 0 && (
              <div
                style={{
                  padding: "16px 20px",
                  backgroundColor: "#FFFBEB",
                  border: "1px solid #FCD34D",
                  borderRadius: 16,
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#92400E" }}>
                    ⭐ You have {unratedOrders.length} unrated delivered meal{unratedOrders.length > 1 ? "s" : ""}!
                  </div>
                  <div style={{ fontSize: 12, color: "#B45309", marginTop: 2 }}>
                    How was order #{unratedOrders[0].orderNumber || unratedOrders[0].id}? Tell the kitchen team!
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveFeedbackOrder(unratedOrders[0])}
                  className="btn-pill-black"
                  style={{ padding: "8px 18px", fontSize: 12 }}
                >
                  Rate Order Now
                </button>
              </div>
            )}

            {ratedOrders.length === 0 ? (
              <div
                className="bistro-card"
                style={{
                  textAlign: "center",
                  padding: "48px 24px",
                  backgroundColor: "#FFFFFF"
                }}
              >
                <Star size={36} color="var(--color-bronze)" style={{ margin: "0 auto 12px auto" }} />
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 20, marginBottom: 6 }}>
                  No ratings submitted yet
                </h3>
                <p style={{ fontSize: 13, color: "#78716C", maxWidth: 360, margin: "0 auto 16px auto" }}>
                  Whenever you order food delivery from Two Hearts Cafe, you can rate the freshness, crust, and flavor right here.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
                  className="btn-pill-black"
                  style={{ padding: "10px 24px", fontSize: 12 }}
                >
                  View My Orders
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {ratedOrders.map((ord) => {
                  const itemsSummary = (ord.items || []).map((i) => i.name).join(", ");
                  const dateText = ord.createdAt
                    ? new Date(ord.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
                    : "Delivered Meal";

                  return (
                    <div
                      key={ord.id}
                      className="bistro-card"
                      style={{
                        backgroundColor: "#FFFFFF",
                        padding: "20px",
                        borderRadius: 16,
                        display: "flex",
                        flexDirection: "column",
                        gap: 10
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <span style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 700, color: "var(--color-ink)" }}>
                            Order #{ord.orderNumber || ord.id}
                          </span>
                          <span style={{ fontSize: 12, color: "#78716C", marginLeft: 8 }}>
                            {dateText}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ display: "flex", gap: 2 }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={15}
                                fill={s <= ord.rating ? "#F59E0B" : "transparent"}
                                color={s <= ord.rating ? "#F59E0B" : "#D1D5DB"}
                              />
                            ))}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#D97706" }}>
                            {ord.rating}/5
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: 12, color: "#78716C" }}>
                        <strong>Dishes:</strong> {itemsSummary}
                      </div>

                      {ord.feedback && (
                        <div
                          style={{
                            padding: "10px 14px",
                            backgroundColor: "var(--bg-app)",
                            borderRadius: "var(--radius-sm)",
                            fontSize: 13,
                            color: "var(--color-ink)",
                            fontStyle: "italic"
                          }}
                        >
                          "{ord.feedback}"
                        </div>
                      )}

                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                        <button
                          type="button"
                          onClick={() => setActiveFeedbackOrder(ord)}
                          className="btn-pill-outline"
                          style={{ padding: "6px 14px", fontSize: 11 }}
                        >
                          <Edit3 size={12} />
                          <span>Edit Your Rating</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT ADDRESS */}
      {isAddressModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 110,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            backgroundColor: "rgba(28, 25, 23, 0.65)",
            backdropFilter: "blur(6px)"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddressModalOpen(false);
          }}
        >
          <div
            className="animate-fade-in"
            style={{
              width: "100%",
              maxWidth: 480,
              backgroundColor: "#FAF7F2",
              borderRadius: 20,
              border: "1px solid var(--border-color)",
              boxShadow: "0 20px 45px rgba(28, 25, 23, 0.2)",
              padding: "28px 24px",
              position: "relative"
            }}
          >
            <button
              type="button"
              onClick={() => setIsAddressModalOpen(false)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: "#FFFFFF",
                border: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-ink-soft)",
                cursor: "pointer"
              }}
            >
              <X size={16} />
            </button>

            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 22, marginBottom: 4 }}>
              {editingAddressId ? "Edit Delivery Address" : "Add New Delivery Address"}
            </h3>
            <p style={{ fontSize: 13, color: "#78716C", margin: "0 0 20px 0" }}>
              Save hostel room, campus department, or home details for fast checkout.
            </p>

            {addressError && (
              <div style={{ padding: "8px 12px", backgroundColor: "#FEF2F2", color: "#DC2626", fontSize: 12, borderRadius: 6, marginBottom: 14 }}>
                {addressError}
              </div>
            )}

            <form onSubmit={handleSaveAddress}>
              {/* Category label selector */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, fontFamily: "var(--font-serif)", textTransform: "uppercase", fontWeight: 700, color: "var(--color-bronze)", marginBottom: 6 }}>
                  Address Type
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["Hostel", "Home", "Work", "Other"].map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setAddressForm({ ...addressForm, label: lbl })}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "var(--radius-pill)",
                        backgroundColor: addressForm.label === lbl ? "var(--color-ink)" : "#FFFFFF",
                        color: addressForm.label === lbl ? "#FFFFFF" : "var(--color-ink)",
                        border: `1px solid ${addressForm.label === lbl ? "var(--color-ink)" : "var(--border-color)"}`,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Name & Phone */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontFamily: "var(--font-serif)", textTransform: "uppercase", fontWeight: 700, color: "var(--color-bronze)", marginBottom: 4 }}>
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    value={addressForm.recipientName}
                    onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                    placeholder="e.g. your full name"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border-color)", backgroundColor: "#FFFFFF", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontFamily: "var(--font-serif)", textTransform: "uppercase", fontWeight: 700, color: "var(--color-bronze)", marginBottom: 4 }}>
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    placeholder="10-digit number"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border-color)", backgroundColor: "#FFFFFF", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Address details */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontFamily: "var(--font-serif)", textTransform: "uppercase", fontWeight: 700, color: "var(--color-bronze)", marginBottom: 4 }}>
                  Full Street Address / Hostel & Room Number *
                </label>
                <textarea
                  rows={2}
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                  placeholder="e.g. Flat/House/Room No., Building/Hostel name, Street, Area"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border-color)", backgroundColor: "#FFFFFF", fontSize: 13, boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>

              {/* Landmark */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, fontFamily: "var(--font-serif)", textTransform: "uppercase", fontWeight: 700, color: "var(--color-bronze)", marginBottom: 4 }}>
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={addressForm.landmark}
                  onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                  placeholder="e.g. Near main gate, tower 3, or prominent landmark"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border-color)", backgroundColor: "#FFFFFF", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>

              {/* Default checkbox */}
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--color-ink)", marginBottom: 20, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: "var(--color-ink)" }}
                />
                <span>Set as my default delivery address</span>
              </label>

              <button
                type="submit"
                className="btn-pill-black"
                style={{ width: "100%", padding: "12px", fontSize: 13, justifyContent: "center" }}
              >
                <span>{editingAddressId ? "Update Address" : "Save Address"}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Order Details */}
      {activeOrderDetails && (
        <OrderDetailsModal
          order={activeOrderDetails}
          onClose={() => setActiveOrderDetails(null)}
          onOpenFeedback={(orderToRate) => setActiveFeedbackOrder(orderToRate)}
        />
      )}

      {/* Modal: Order Feedback & Star Rating */}
      {activeFeedbackOrder && (
        <OrderFeedbackModal
          order={activeFeedbackOrder}
          onClose={() => setActiveFeedbackOrder(null)}
          onSubmitted={(orderId, { rating, feedback }) => {
            setOrders((prev) =>
              prev.map((o) => (o.id === orderId ? { ...o, rating, feedback } : o))
            );
          }}
        />
      )}
    </div>
  );
}
