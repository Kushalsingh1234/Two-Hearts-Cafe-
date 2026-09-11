import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Bell,
  Volume2,
  VolumeX,
  ChefHat,
  UtensilsCrossed,
  QrCode,
  Trash2,
  LogOut,
  KeyRound,
  Bike,
  Star,
  Smartphone,
  Sun,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import OrderCard from "./OrderCard";
import MenuManager from "./MenuManager";
import TableQRGenerator from "./TableQRGenerator";
import ReviewsManager from "./ReviewsManager";
import ChangePinModal from "./ChangePinModal";
import OnlineOrdersManager from "./OnlineOrdersManager";
import { updateOrderStatus, clearAllOrders, subscribeReviews } from "../../firebase/services";
import { soundNotifier } from "../../utils/audio";
import {
  triggerOrderNotification,
  triggerPaymentNotification,
  requestNotificationPermission,
  getNotificationPermission,
  subscribeInstallPrompt,
  promptPwaInstall
} from "../../utils/notifications";

export default function AdminDashboard({ orders, menuItems, currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "online-orders";
  });

  const [orderStatusFilter, setOrderStatusFilter] = useState("active");
  const [tableFilter, setTableFilter] = useState("all");
  const [isMuted, setIsMuted] = useState(false);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const tabsNavRef = useRef(null);

  useEffect(() => {
    const unsub = subscribeReviews((data) => {
      setReviews(data || []);
    });
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  // Smooth scroll tabs horizontally via chevrons or swipe
  const handleScrollTabs = (direction) => {
    if (tabsNavRef.current) {
      tabsNavRef.current.scrollBy({
        left: direction === "left" ? -160 : 160,
        behavior: "smooth"
      });
    }
  };

  // Center active tab when clicked or selected
  useEffect(() => {
    if (tabsNavRef.current) {
      const activeBtn = tabsNavRef.current.querySelector('[data-active="true"]');
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [activeTab]);

  // Combine reviews from table_reviews subscription AND real-time orders collection
  const allReviews = useMemo(() => {
    const map = new Map();

    // 1. From table_reviews collection subscription (or local cache)
    (reviews || []).forEach((rev) => {
      if (!rev) return;
      const key = rev.id || rev.orderId || `rev_${rev.timestamp}_${rev.tableNumber}`;
      map.set(key, rev);
    });

    // 2. Extract reviews attached directly to orders (synced across devices via orders collection)
    (orders || []).forEach((ord) => {
      if (ord && ord.review) {
        const rev = ord.review;
        const key = rev.id || ord.id || `rev_${rev.timestamp || ord.timestamp}_${ord.tableNumber}`;
        if (!map.has(key)) {
          map.set(key, {
            ...rev,
            orderId: ord.id,
            orderNumber: rev.orderNumber || ord.orderNumber || "TH-1001",
            tableNumber: String(rev.tableNumber || ord.tableNumber || "1")
          });
        }
      }
    });

    const list = Array.from(map.values());
    list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return list;
  }, [reviews, orders]);

  const [notifPermission, setNotifPermission] = useState(getNotificationPermission());
  const [canInstallPwa, setCanInstallPwa] = useState(false);
  const [isScreenAwake, setIsScreenAwake] = useState(false);
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  });

  // Subscribe to PWA install prompt availability
  useEffect(() => {
    const unsub = subscribeInstallPrompt((available) => {
      setCanInstallPwa(available);
    });
    return () => unsub();
  }, []);

  // Track known order IDs and paid order IDs so we only alert for genuinely new events
  const knownOrderIdsRef = useRef(new Set());
  const knownPaidOrderIdsRef = useRef(new Set());
  const isInitialLoadRef = useRef(true);
  const [latestPaymentAlert, setLatestPaymentAlert] = useState(null);

  // Auto-dismiss floating payment alert banner after 9 seconds
  useEffect(() => {
    if (!latestPaymentAlert) return;
    const timer = setTimeout(() => {
      setLatestPaymentAlert(null);
    }, 9000);
    return () => clearTimeout(timer);
  }, [latestPaymentAlert]);

  const [soundState, setSoundState] = useState({
    isRepeating: soundNotifier.isRepeating,
    isMuted: soundNotifier.isMuted,
    isSilenced: soundNotifier.isTemporarilySilenced
  });

  // Real-time subscription to sound notifier state
  useEffect(() => {
    return soundNotifier.subscribe(setSoundState);
  }, []);

  useEffect(() => {
    if (isInitialLoadRef.current) {
      orders.forEach((o) => {
        knownOrderIdsRef.current.add(o.id);
        if (o.paymentStatus === "paid_online" || o.settledMethod === "upi_online") {
          knownPaidOrderIdsRef.current.add(o.id);
        }
      });
      isInitialLoadRef.current = false;
      return;
    }

    orders.forEach((order) => {
      // 1. New incoming order alert (push notification)
      if (!knownOrderIdsRef.current.has(order.id)) {
        knownOrderIdsRef.current.add(order.id);
        if (order.status === "placed") {
          triggerOrderNotification(order);
        }
      }

      // 2. Online table scanner payment completed alert (auto-settles bill)
      const isOnlinePaid = order.paymentStatus === "paid_online" || order.settledMethod === "upi_online";
      if (isOnlinePaid && !knownPaidOrderIdsRef.current.has(order.id)) {
        knownPaidOrderIdsRef.current.add(order.id);
        triggerPaymentNotification(order);
        setLatestPaymentAlert({
          id: order.id,
          orderNumber: order.orderNumber,
          tableNumber: order.tableNumber,
          total: order.total,
          utr: order.paymentDetails?.utr,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        });
      }
    });
  }, [orders]);

  const handleToggleMute = () => {
    soundNotifier.toggleMute();
  };

  // Placed / unaccepted orders count
  const unhandledPlacedOrders = useMemo(() => {
    return (orders || []).filter((o) => o && o.status === "placed");
  }, [orders]);

  const handleTestChime = () => {
    triggerOrderNotification({
      id: "test_" + Date.now(),
      tableNumber: "5",
      total: 380,
      items: [
        { name: "Penne Arabiata", quantity: 1 },
        { name: "KitKat Shake", quantity: 1 }
      ]
    });
  };

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setNotifPermission(res);
  };

  const handleToggleWakeLock = async () => {
    if (isScreenAwake) {
      soundNotifier.releaseWakeLock();
      setIsScreenAwake(false);
    } else {
      const success = await soundNotifier.requestWakeLock();
      setIsScreenAwake(success);
    }
  };

  const handleInstallApp = async () => {
    if (canInstallPwa) {
      const accepted = await promptPwaInstall();
      if (accepted) {
        setIsAlreadyInstalled(true);
      }
    } else {
      alert(
        "To install Two Hearts Cafe on your device:\n\n" +
        "• On Android/Chrome: Tap the 3 dots menu (⋮) at top right and select 'Install app' or 'Add to Home screen'.\n" +
        "• On iPhone/iPad (Safari): Tap the Share button (⬆) and select 'Add to Home Screen'.\n" +
        "• On PC/Mac: Click the Install icon (⊕) in your browser address bar."
      );
    }
  };

  // Helper to distinguish online delivery/pickup orders from dine-in QR table orders
  const isOnlineOrder = (ord) => {
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

  const tableOrders = orders.filter((ord) => !isOnlineOrder(ord));
  const onlineOrders = orders.filter(isOnlineOrder);

  // Stats calculation for table orders
  const tableNewOrdersCount = tableOrders.filter((o) => o.status === "placed").length;
  const tablePreparingCount = tableOrders.filter((o) => o.status === "preparing").length;
  const tableServedCount = tableOrders.filter((o) => o.status === "served").length;
  const tableSettledCount = tableOrders.filter((o) => o.status === "settled").length;
  const tableTotalRevenue = tableOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((acc, o) => acc + (o.total || 0), 0);

  // Online active orders count for tab badge
  const onlineActiveCount = onlineOrders.filter(
    (o) => !["delivered", "completed", "cancelled"].includes(o.status)
  ).length;
  const onlineNewCount = onlineOrders.filter((o) => o.status === "placed").length;

  // Filtered table orders
  const filteredTableOrders = tableOrders.filter((ord) => {
    if (orderStatusFilter === "active") {
      if (ord.status === "settled" || ord.status === "cancelled") return false;
    } else if (orderStatusFilter === "settled") {
      if (ord.status !== "settled") return false;
    } else if (orderStatusFilter !== "all" && ord.status !== orderStatusFilter) {
      return false;
    }
    if (tableFilter !== "all" && String(ord.tableNumber) !== String(tableFilter)) {
      return false;
    }
    return true;
  });

  const uniqueTables = Array.from(new Set(tableOrders.map((o) => String(o.tableNumber)))).sort(
    (a, b) => Number(a) - Number(b)
  );

  return (
    <div className="admin-dashboard-container" style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px 80px 16px" }}>
      {/* Floating Online Payment Received & Auto-Settlement Alert Banner */}
      {latestPaymentAlert && (
        <div style={{
          position: "fixed",
          top: 18,
          right: 18,
          zIndex: 9999,
          maxWidth: 400,
          backgroundColor: "#14532d",
          color: "#f0fdf4",
          padding: "14px 18px",
          borderRadius: 12,
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.35), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
          border: "1.5px solid #22c55e",
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          animation: "fadeIn 0.25s ease-out"
        }}>
          <div style={{
            backgroundColor: "#22c55e",
            color: "#052e16",
            borderRadius: "50%",
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontWeight: 900,
            fontSize: 15
          }}>
            ✓
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 14, fontWeight: 700, letterSpacing: 0.3, marginBottom: 2 }}>
              💳 Table #{latestPaymentAlert.tableNumber || "QR"} Paid Online!
            </div>
            <div style={{ fontSize: 12.5, opacity: 0.95, lineHeight: 1.4 }}>
              Received <strong>₹{latestPaymentAlert.total}</strong> via UPI
              {latestPaymentAlert.utr ? ` • UTR: ${latestPaymentAlert.utr}` : ""}
            </div>
            <div style={{ fontSize: 11.5, color: "#86efac", marginTop: 4, fontWeight: 600 }}>
              ✓ Bill settled automatically
            </div>
          </div>
          <button
            onClick={() => setLatestPaymentAlert(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "#bbf7d0",
              cursor: "pointer",
              fontSize: 16,
              padding: "0 4px",
              lineHeight: 1
            }}
            title="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 24
      }}>
        <div>
          <div style={{
            fontFamily: "var(--font-script)",
            fontSize: 32,
            color: "var(--color-bronze)",
            lineHeight: 1
          }}>
            Two Hearts Cafe
          </div>
          <h1 style={{
            fontFamily: "var(--font-serif)",
            fontSize: 26,
            fontWeight: 700,
            color: "var(--color-ink)",
            marginTop: 2
          }}>
            Kitchen Live Order Hub
          </h1>
        </div>

        {/* Audio and help buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={handleTestChime}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "#fff",
              border: "1.2px solid var(--color-border-frame)",
              fontFamily: "var(--font-serif)",
              fontSize: 12,
              fontWeight: 700,
              color: "var(--color-ink)"
            }}
          >
            <Bell size={13} />
            <span>Test Sound</span>
          </button>

          <button
            onClick={handleToggleMute}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: isMuted ? "#fee2e2" : "#fff",
              border: "1.2px solid var(--color-border-frame)",
              fontFamily: "var(--font-serif)",
              fontSize: 12,
              fontWeight: 700,
              color: isMuted ? "#dc2626" : "var(--color-ink)"
            }}
          >
            {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            <span>{isMuted ? "Muted" : "Chime On"}</span>
          </button>

          <button
            onClick={() => setIsChangePinOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "#fff",
              border: "1.2px solid var(--color-border-frame)",
              fontFamily: "var(--font-serif)",
              fontSize: 12,
              fontWeight: 700,
              color: "var(--color-ink)",
              cursor: "pointer"
            }}
            title="Change Kitchen & Admin PIN"
          >
            <KeyRound size={13} />
            <span>Change PIN</span>
          </button>


          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "7px 14px",
                borderRadius: "var(--radius-pill)",
                backgroundColor: "#fff",
                border: "1.2px solid #dc2626",
                fontFamily: "var(--font-serif)",
                fontSize: 12,
                fontWeight: 700,
                color: "#dc2626"
              }}
              title="Sign Out"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* PWA & Background Ting Sound Status Banner */}
      <div style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 6,
        border: "1.2px solid var(--color-border-frame)",
        padding: "12px 16px",
        marginBottom: 20,
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12
      }}>
        {/* Left: Status Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {notifPermission === "granted" ? (
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              backgroundColor: "#f0fdf4",
              border: "1.2px solid #86efac",
              color: "#15803d",
              padding: "5px 12px",
              borderRadius: "var(--radius-pill)",
              fontFamily: "var(--font-serif)",
              fontSize: 12.5,
              fontWeight: 700
            }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#16a34a",
                boxShadow: "0 0 6px rgba(22, 163, 74, 0.7)"
              }} />
              <span>Background Ting Sound & System Notifications Active</span>
            </div>
          ) : (
            <button
              onClick={handleRequestPermission}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                backgroundColor: "#fef3c7",
                border: "1.5px solid #f59e0b",
                color: "#92400e",
                padding: "6px 14px",
                borderRadius: "var(--radius-pill)",
                fontFamily: "var(--font-serif)",
                fontSize: 12.5,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(245, 158, 11, 0.2)"
              }}
              title="Click to allow background sound and system alerts"
            >
              <Bell size={14} />
              <span>Tap to Enable Background Ting Sound & Notifications</span>
            </button>
          )}

          <span style={{
            fontSize: 12,
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            color: "var(--color-bronze)"
          }}>
            {notifPermission === "granted"
              ? "Ting chime sounds and native banner pops up even when app is minimized or phone is locked."
              : "Allow permission so you never miss an incoming order!"}
          </span>
        </div>

        {/* Right: Quick Controls (Test Chime, Screen Wake, Install PWA) */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Test Chime Button */}
          <button
            onClick={handleTestChime}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 12px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "#FAF7F2",
              border: "1px solid var(--color-border-frame)",
              fontFamily: "var(--font-serif)",
              fontSize: 12,
              fontWeight: 700,
              color: "var(--color-ink)",
              cursor: "pointer"
            }}
            title="Simulate a new order chime and notification"
          >
            <Bell size={13} />
            <span>Test "Ting!" Chime</span>
          </button>

          {/* Screen Wake Lock for Counter Tablet */}
          <button
            onClick={handleToggleWakeLock}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 12px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: isScreenAwake ? "#eff6ff" : "#FAF7F2",
              border: isScreenAwake ? "1px solid #93c5fd" : "1px solid var(--color-border-frame)",
              fontFamily: "var(--font-serif)",
              fontSize: 12,
              fontWeight: 700,
              color: isScreenAwake ? "#1d4ed8" : "var(--color-ink)",
              cursor: "pointer"
            }}
            title="Keep screen awake while tablet is stationed at counter"
          >
            <Sun size={13} />
            <span>{isScreenAwake ? "Screen Awake: ON" : "Keep Screen Awake"}</span>
          </button>

          {/* Sound Mute/Unmute Toggle */}
          <button
            onClick={handleToggleMute}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 12px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: soundState.isMuted ? "#FEF2F2" : "#FAF7F2",
              border: soundState.isMuted ? "1px solid #FCA5A5" : "1px solid var(--color-border-frame)",
              fontFamily: "var(--font-serif)",
              fontSize: 12,
              fontWeight: 700,
              color: soundState.isMuted ? "#DC2626" : "var(--color-ink)",
              cursor: "pointer"
            }}
            title={soundState.isMuted ? "Audio is Muted - Click to Unmute" : "Audio is Active - Click to Mute"}
          >
            {soundState.isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            <span>{soundState.isMuted ? "Sound: Muted" : "Sound: ON"}</span>
          </button>

          {/* PWA Install Button */}
          {!isAlreadyInstalled && (
            <button
              onClick={handleInstallApp}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 14px",
                borderRadius: "var(--radius-pill)",
                backgroundColor: "var(--color-ink)",
                color: "#FAF7F2",
                border: "none",
                fontFamily: "var(--font-serif)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "var(--shadow-sm)"
              }}
              title="Install Two Hearts Cafe as an app on your device"
            >
              <Smartphone size={13} />
              <span>Install App</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Unaccepted Orders Chime Alert Banner */}
      {unhandledPlacedOrders.length > 0 && (
        <div
          style={{
            backgroundColor: "#FEF2F2",
            border: "2px solid #DC2626",
            borderRadius: 10,
            padding: "12px 18px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            boxShadow: "0 6px 20px -4px rgba(220, 38, 38, 0.25)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24, lineHeight: 1 }}>
              🔔
            </span>
            <div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 14, fontWeight: 800, color: "#991B1B" }}>
                {unhandledPlacedOrders.length} New Order{unhandledPlacedOrders.length > 1 ? "s" : ""} Awaiting Acceptance!
              </div>
              <div style={{ fontSize: 12, color: "#B91C1C", marginTop: 2 }}>
                {soundState.isSilenced
                  ? "Ting chime is temporarily silenced. Accept or reject the orders to complete."
                  : soundState.isMuted
                  ? "Audio is muted. Orders are waiting below for confirmation."
                  : "Ting chime will continuously ring until you accept or reject all orders."}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {soundState.isRepeating && (
              <button
                type="button"
                onClick={() => {
                  if (soundState.isSilenced) {
                    soundNotifier.resumeAlarm();
                  } else {
                    soundNotifier.silenceAlarm();
                  }
                }}
                style={{
                  padding: "7px 16px",
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: soundState.isSilenced ? "#15803D" : "#FFFFFF",
                  color: soundState.isSilenced ? "#FFFFFF" : "#DC2626",
                  border: soundState.isSilenced ? "none" : "1.5px solid #DC2626",
                  fontFamily: "var(--font-serif)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                {soundState.isSilenced ? <Volume2 size={13} /> : <VolumeX size={13} />}
                <span>{soundState.isSilenced ? "Resume Ting Chime" : "Silence Ting Chime"}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* KPI Stats - Table Orders (only shown on Table Feed tab, Online Orders tab has its own dedicated KPI grid) */}
      {activeTab === "orders" && (
        <div className="admin-kpi-grid">
          {/* New Orders */}
          <div className="admin-kpi-card" style={{
            border: tableNewOrdersCount > 0 ? "2px solid var(--color-bronze)" : "1.2px solid var(--color-border-frame)"
          }}>
            <div className="admin-kpi-title" style={{ color: "var(--color-bronze)" }}>
              New Orders
            </div>
            <div className="admin-kpi-num" style={{ color: "var(--color-ink)" }}>
              {tableNewOrdersCount}
            </div>
            <div className="admin-kpi-desc">
              Needs preparation
            </div>
          </div>

          {/* In Kitchen */}
          <div className="admin-kpi-card">
            <div className="admin-kpi-title" style={{ color: "var(--color-ink)" }}>
              In Cooking
            </div>
            <div className="admin-kpi-num" style={{ color: "#2563eb" }}>
              {tablePreparingCount}
            </div>
            <div className="admin-kpi-desc">
              Currently cooking
            </div>
          </div>

          {/* Served */}
          <div className="admin-kpi-card">
            <div className="admin-kpi-title" style={{ color: "var(--color-ink)" }}>
              Delivered
            </div>
            <div className="admin-kpi-num" style={{ color: "#15803d" }}>
              {tableServedCount}
            </div>
            <div className="admin-kpi-desc">
              Served to table
            </div>
          </div>

          {/* Revenue */}
          <div className="admin-kpi-card">
            <div className="admin-kpi-title" style={{ color: "var(--color-ink)" }}>
              Total Tickets Value
            </div>
            <div className="admin-kpi-num" style={{ color: "var(--color-ink)" }}>
              Rs.{tableTotalRevenue}
            </div>
            <div className="admin-kpi-desc">
              {tableOrders.length} table orders placed today
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs with Smooth Horizontal Touch Scrolling & Fail-safe Chevrons */}
      <div style={{ position: "relative", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Scroll Left Button for small screens */}
          <button
            onClick={() => handleScrollTabs("left")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: "50%",
              backgroundColor: "#fff",
              border: "1px solid var(--color-border-frame)",
              color: "var(--color-bronze)",
              cursor: "pointer",
              flexShrink: 0,
              boxShadow: "var(--shadow-sm)"
            }}
            title="Scroll tabs left"
            aria-label="Scroll tabs left"
          >
            <ChevronLeft size={16} />
          </button>

          <div
            ref={tabsNavRef}
            className="admin-nav-tabs-wrapper no-scrollbar"
            style={{ flex: 1 }}
          >
            {/* 1. Online Orders Tab */}
            <button
              onClick={() => setActiveTab("online-orders")}
              className="admin-nav-tab-btn"
              data-active={activeTab === "online-orders"}
              style={{
                borderBottom: activeTab === "online-orders" ? "3px solid #15803d" : "3px solid transparent",
                color: activeTab === "online-orders" ? "#15803d" : "var(--color-bronze)",
                fontWeight: activeTab === "online-orders" ? 800 : 600,
                marginBottom: -2
              }}
            >
              <Bike size={16} />
              <span>Online Orders</span>
              {onlineActiveCount > 0 && (
                <span style={{
                  backgroundColor: onlineNewCount > 0 ? "#D97706" : "#15803D",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "1px 6px",
                  borderRadius: "var(--radius-pill)"
                }}>
                  {onlineActiveCount}
                </span>
              )}
            </button>

            {/* 2. Table QR Orders Tab */}
            <button
              onClick={() => setActiveTab("orders")}
              className="admin-nav-tab-btn"
              data-active={activeTab === "orders"}
              style={{
                borderBottom: activeTab === "orders" ? "3px solid var(--color-ink)" : "3px solid transparent",
                color: activeTab === "orders" ? "var(--color-ink)" : "var(--color-bronze)",
                fontWeight: activeTab === "orders" ? 800 : 600,
                marginBottom: -2
              }}
            >
              <ChefHat size={16} />
              <span>Table QR Feed</span>
              {tableNewOrdersCount > 0 && (
                <span style={{
                  backgroundColor: "var(--color-bronze)",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "1px 6px",
                  borderRadius: "var(--radius-pill)"
                }}>
                  {tableNewOrdersCount}
                </span>
              )}
            </button>

            {/* 3. Menu & Stock Tab */}
            <button
              onClick={() => setActiveTab("menu")}
              className="admin-nav-tab-btn"
              data-active={activeTab === "menu"}
              style={{
                borderBottom: activeTab === "menu" ? "3px solid var(--color-ink)" : "3px solid transparent",
                color: activeTab === "menu" ? "var(--color-ink)" : "var(--color-bronze)",
                fontWeight: activeTab === "menu" ? 800 : 600,
                marginBottom: -2
              }}
            >
              <UtensilsCrossed size={16} />
              <span>Menu & Stock</span>
            </button>

            {/* 4. Table QR Kit Tab */}
            <button
              onClick={() => setActiveTab("qr")}
              className="admin-nav-tab-btn"
              data-active={activeTab === "qr"}
              style={{
                borderBottom: activeTab === "qr" ? "3px solid var(--color-ink)" : "3px solid transparent",
                color: activeTab === "qr" ? "var(--color-ink)" : "var(--color-bronze)",
                fontWeight: activeTab === "qr" ? 800 : 600,
                marginBottom: -2
              }}
            >
              <QrCode size={16} />
              <span>Table QR Kit</span>
            </button>

            {/* 5. Table Reviews Tab */}
            <button
              onClick={() => setActiveTab("reviews")}
              className="admin-nav-tab-btn"
              data-active={activeTab === "reviews"}
              style={{
                borderBottom: activeTab === "reviews" ? "3px solid var(--color-ink)" : "3px solid transparent",
                color: activeTab === "reviews" ? "var(--color-ink)" : "var(--color-bronze)",
                fontWeight: activeTab === "reviews" ? 800 : 600,
                marginBottom: -2
              }}
            >
              <Star size={16} fill={activeTab === "reviews" ? "#F59E0B" : "transparent"} color={activeTab === "reviews" ? "#F59E0B" : "currentColor"} />
              <span>Table Reviews</span>
              {allReviews.length > 0 && (
                <span style={{
                  backgroundColor: "var(--color-bronze)",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "1px 6px",
                  borderRadius: "var(--radius-pill)"
                }}>
                  {allReviews.length}
                </span>
              )}
            </button>
          </div>

          {/* Scroll Right Button for small screens */}
          <button
            onClick={() => handleScrollTabs("right")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: "50%",
              backgroundColor: "#fff",
              border: "1px solid var(--color-border-frame)",
              color: "var(--color-bronze)",
              cursor: "pointer",
              flexShrink: 0,
              boxShadow: "var(--shadow-sm)"
            }}
            title="Scroll tabs right"
            aria-label="Scroll tabs right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "online-orders" && (
        <OnlineOrdersManager orders={orders} />
      )}

      {activeTab === "orders" && (
        <div>
          {/* Filters Bar with Horizontal Scroll for Mobile */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 16
          }}>
            <div className="admin-pills-scroll">
              {[
                { id: "active", label: "Active Orders" },
                { id: "placed", label: "New (Needs Prep)" },
                { id: "preparing", label: "In Cooking" },
                { id: "served", label: "Served" },
                { id: "settled", label: tableSettledCount > 0 ? `Settled Bills (${tableSettledCount})` : "Settled Bills" },
                { id: "all", label: "All History" }
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setOrderStatusFilter(pill.id)}
                  style={{
                    padding: "5px 14px",
                    borderRadius: "var(--radius-pill)",
                    fontFamily: "var(--font-serif)",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    border: "1px solid var(--color-border-frame)",
                    backgroundColor: orderStatusFilter === pill.id ? "var(--color-ink)" : "#fff",
                    color: orderStatusFilter === pill.id ? "#FAF7F2" : "var(--color-ink)",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    cursor: "pointer"
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {uniqueTables.length > 0 && (
                <select
                  value={tableFilter}
                  onChange={(e) => setTableFilter(e.target.value)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "var(--radius-pill)",
                    border: "1px solid var(--color-border-frame)",
                    backgroundColor: "#fff",
                    fontFamily: "var(--font-serif)",
                    fontSize: 13,
                    fontWeight: 700,
                    outline: "none"
                  }}
                >
                  <option value="all">All Tables</option>
                  {uniqueTables.map((tbl) => (
                    <option key={tbl} value={tbl}>
                      Table {tbl}
                    </option>
                  ))}
                </select>
              )}

              {tableOrders.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm("Clear all table orders from the kitchen board?")) {
                      clearAllOrders();
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "5px 12px",
                    borderRadius: "var(--radius-pill)",
                    border: "1px solid #dc2626",
                    backgroundColor: "#fff",
                    color: "#dc2626",
                    fontFamily: "var(--font-serif)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  <Trash2 size={12} />
                  <span>Reset Board</span>
                </button>
              )}
            </div>
          </div>

          {/* Table Orders Grid */}
          {filteredTableOrders.length === 0 ? (
            <div style={{
              backgroundColor: "#fff",
              borderRadius: 4,
              padding: "50px 20px",
              textAlign: "center",
              border: "1.5px solid var(--color-border-frame)"
            }}>
              <ChefHat size={44} style={{ color: "var(--color-bronze)", marginBottom: 12 }} />
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 20, color: "var(--color-ink)" }}>
                No table orders match your filter
              </h3>
              <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 14, color: "var(--color-bronze)", marginTop: 4 }}>
                Customer QR table orders will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="admin-orders-grid">
              {filteredTableOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={updateOrderStatus}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "menu" && <MenuManager menuItems={menuItems} />}
      {activeTab === "qr" && <TableQRGenerator />}
      {activeTab === "reviews" && <ReviewsManager reviews={allReviews} />}

      {/* Change PIN Modal */}
      <ChangePinModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
      />


    </div>
  );
}
