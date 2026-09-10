import React, { useState, useMemo } from "react";
import {
  Bike,
  Store,
  Clock,
  CheckCircle2,
  ChefHat,
  PackageCheck,
  Search,
  Filter,
  RefreshCw,
  Navigation,
  ExternalLink,
  Eye,
  ChevronRight,
  User,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  ArrowUpDown,
  LayoutGrid,
  Table as TableIcon,
  AlertCircle,
  TrendingUp,
  CreditCard,
  Plus
} from "lucide-react";
import OnlineOrderDetailModal from "./OnlineOrderDetailModal";
import { INITIAL_DEMO_ORDERS, updateOnlineOrder, placeOnlineDeliveryOrder } from "../../firebase/services";

// Helper: Format relative time
function formatTimeAgo(dateString) {
  if (!dateString) return "Just now";
  const diffSec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diffSec < 45) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

// Status configuration
const STATUS_CONFIG = {
  placed: { label: "New Order", bg: "#FEF3C7", text: "#D97706", border: "#FCD34D", icon: Clock },
  confirmed: { label: "Confirmed", bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE", icon: CheckCircle2 },
  preparing: { label: "Preparing", bg: "#F3E8FF", text: "#7C3AED", border: "#DDD6FE", icon: ChefHat },
  out_for_delivery: { label: "Out for Delivery", bg: "#ECFDF5", text: "#059669", border: "#A7F3D0", icon: Bike },
  ready_for_pickup: { label: "Ready for Pickup", bg: "#ECFDF5", text: "#059669", border: "#A7F3D0", icon: Store },
  delivered: { label: "Delivered", bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0", icon: PackageCheck },
  completed: { label: "Completed", bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0", icon: PackageCheck },
  cancelled: { label: "Cancelled", bg: "#FEF2F2", text: "#DC2626", border: "#FCA5A5", icon: AlertCircle }
};

export default function OnlineOrdersManager({ orders = [], onRefresh }) {
  const [selectedOrder, setSelectedOrder] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get("orderId") || params.get("openOrder");
      if (targetId) {
        return (
          (orders || []).find((o) => o.id === targetId || o.orderNumber === targetId) ||
          INITIAL_DEMO_ORDERS.find((o) => o.id === targetId || o.orderNumber === targetId) ||
          null
        );
      }
    } catch {}
    return null;
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all"); // 'all' | 'delivery' | 'pickup'
  const [dateFilter, setDateFilter] = useState("all"); // 'all' | 'today' | 'yesterday' | 'week'
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // 'newest' | 'oldest' | 'highest'
  const [viewMode, setViewMode] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("view") === "table" ? "table" : "cards";
    } catch {
      return "cards";
    }
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Filter only online orders (Website Delivery & Pickup, not dine-in QR table orders)
  const onlineOrders = useMemo(() => {
    const list = (orders || []).filter((ord) => {
      if (!ord) return false;
      const isOnlineType = ord.orderType === "delivery" || ord.orderType === "pickup";
      const isOnlineTable = ord.tableNumber === "Delivery" || ord.tableNumber === "Takeaway";
      const isOnlinePrefix =
        typeof ord.orderNumber === "string" &&
        (ord.orderNumber.startsWith("THD-") || ord.orderNumber.startsWith("THP-"));
      return isOnlineType || isOnlineTable || isOnlinePrefix;
    });

    // If no online orders exist yet in Firestore, populate with demo orders so the section is immediately usable
    if (list.length === 0) {
      return INITIAL_DEMO_ORDERS;
    }
    return list;
  }, [orders]);

  // Apply search, filters & sort
  const filteredOrders = useMemo(() => {
    return onlineOrders
      .filter((ord) => {
        // Status filter
        if (statusFilter === "active") {
          if (ord.status === "delivered" || ord.status === "completed" || ord.status === "cancelled") {
            return false;
          }
        } else if (statusFilter !== "all" && ord.status !== statusFilter) {
          return false;
        }

        // Type filter
        if (typeFilter !== "all" && ord.orderType !== typeFilter) {
          return false;
        }

        // Date filter
        if (dateFilter !== "all" && ord.createdAt) {
          const ordDate = new Date(ord.createdAt);
          const now = new Date();
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
          const startOfWeek = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);

          if (dateFilter === "today" && ordDate < startOfToday) return false;
          if (dateFilter === "yesterday" && (ordDate < startOfYesterday || ordDate >= startOfToday)) return false;
          if (dateFilter === "week" && ordDate < startOfWeek) return false;
        }

        // Search query (Order number, customer name, phone, address)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchId = String(ord.orderNumber || ord.id).toLowerCase().includes(q);
          const matchName = String(ord.customerName || "").toLowerCase().includes(q);
          const matchPhone = String(ord.customerPhone || "").toLowerCase().includes(q);
          const matchAddr = String(ord.deliveryAddress || "").toLowerCase().includes(q);
          if (!matchId && !matchName && !matchPhone && !matchAddr) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "oldest") {
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        }
        if (sortBy === "highest") {
          return (b.total || 0) - (a.total || 0);
        }
        // Default: newest first
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }, [onlineOrders, statusFilter, typeFilter, dateFilter, searchQuery, sortBy]);

  // KPI Calculations
  const stats = useMemo(() => {
    const totalCount = onlineOrders.length;
    const newCount = onlineOrders.filter((o) => o.status === "placed").length;
    const activeCount = onlineOrders.filter((o) =>
      ["placed", "confirmed", "preparing", "out_for_delivery", "ready_for_pickup"].includes(o.status)
    ).length;
    const completedCount = onlineOrders.filter((o) => o.status === "delivered" || o.status === "completed").length;
    const totalRevenue = onlineOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + (o.total || 0), 0);

    return { totalCount, newCount, activeCount, completedCount, totalRevenue };
  }, [onlineOrders]);

  // Manual refresh trigger
  const handleManualRefresh = () => {
    setIsRefreshing(true);
    if (onRefresh) onRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Quick Advance Status from Card
  const handleQuickAdvanceStatus = async (ord, e) => {
    e.stopPropagation();
    const isDelivery = ord.orderType === "delivery";
    const nextStatusMap = isDelivery
      ? {
          placed: "confirmed",
          confirmed: "preparing",
          preparing: "out_for_delivery",
          out_for_delivery: "delivered"
        }
      : {
          placed: "confirmed",
          confirmed: "preparing",
          preparing: "ready_for_pickup",
          ready_for_pickup: "completed"
        };

    const next = nextStatusMap[ord.status];
    if (!next) return;

    setActionLoadingId(ord.id);
    try {
      await updateOnlineOrder(ord.id, { status: next });
    } catch (err) {
      console.error("Failed to advance status:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Create demo order if admin wants to test
  const handleCreateDemoOrder = async () => {
    try {
      await placeOnlineDeliveryOrder({
        orderType: "delivery",
        items: [
          { id: "demo_pasta_1", name: "Penne Rosa Love Pasta", price: 249, quantity: 2, category: "pasta" },
          { id: "demo_shake_1", name: "Kitkat Hazelnut Shake", price: 149, quantity: 1, category: "shakes" }
        ],
        subtotal: 647,
        deliveryFee: 0,
        tax: 32,
        total: 679,
        customerName: "Aarav Sharma",
        customerPhone: "9812345678",
        deliveryAddress: "Room 304, Ganga Boys Hostel, KIET Campus, Muradnagar",
        landmark: "Near College Gate No. 2, Opp. Pillar 852",
        customerNotes: "Please call when near hostel gate",
        paymentMethod: "Instant UPI (Google Pay)",
        paymentId: `TXN_${Date.now().toString().slice(-8)}`,
        etaMinutes: 30
      });
      handleManualRefresh();
    } catch (err) {
      console.error("Demo order creation failed:", err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* 1. TOP KPI SUMMARY STATS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12
        }}
      >
        {/* Total Orders */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            padding: "16px 18px",
            borderRadius: 8,
            border: "1px solid var(--border-color)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontFamily: "var(--font-serif)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--color-bronze-dark)" }}>
              Total Online Orders
            </span>
            <Store size={15} style={{ color: "var(--color-bronze)" }} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-serif)", color: "var(--color-ink)", marginTop: 4 }}>
            {stats.totalCount}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--color-ink-soft)", marginTop: 2 }}>
            Website delivery & pickup
          </div>
        </div>

        {/* Active Deliveries */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            padding: "16px 18px",
            borderRadius: 8,
            border: stats.activeCount > 0 ? "2px solid var(--color-bronze)" : "1px solid var(--border-color)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontFamily: "var(--font-serif)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--color-bronze-dark)" }}>
              Active In-Flight
            </span>
            <Bike size={15} style={{ color: "var(--color-bronze)" }} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-serif)", color: "var(--color-bronze-dark)", marginTop: 4 }}>
            {stats.activeCount}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--color-bronze)", fontWeight: 600, marginTop: 2 }}>
            {stats.newCount > 0 ? `⚠️ ${stats.newCount} needs confirmation` : "All orders in progress"}
          </div>
        </div>

        {/* Completed */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            padding: "16px 18px",
            borderRadius: 8,
            border: "1px solid var(--border-color)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontFamily: "var(--font-serif)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: "#15803D" }}>
              Fulfilled & Delivered
            </span>
            <PackageCheck size={15} color="#15803D" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-serif)", color: "#15803D", marginTop: 4 }}>
            {stats.completedCount}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--color-ink-soft)", marginTop: 2 }}>
            Successfully completed
          </div>
        </div>

        {/* Total Revenue */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            padding: "16px 18px",
            borderRadius: 8,
            border: "1px solid var(--border-color)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontFamily: "var(--font-serif)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--color-bronze-dark)" }}>
              Online Revenue
            </span>
            <TrendingUp size={15} style={{ color: "#16A34A" }} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-serif)", color: "var(--color-ink)", marginTop: 4 }}>
            ₹{stats.totalRevenue}
          </div>
          <div style={{ fontSize: 11.5, color: "#16A34A", fontWeight: 600, marginTop: 2 }}>
            100% Verified Paid Online
          </div>
        </div>
      </div>

      {/* 2. FILTER, SEARCH & CONTROLS TOOLBAR */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          padding: "16px",
          border: "1px solid var(--border-color)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: 12
        }}
      >
        {/* Search Bar + Refresh Button + View Toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10
          }}
        >
          {/* Search Input */}
          <div style={{ position: "relative", flex: "1 1 280px", maxWidth: 460 }}>
            <input
              type="text"
              placeholder="Search by Order #, Customer Name, Phone, or Street..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 34px",
                fontSize: 12.5,
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-app)",
                outline: "none"
              }}
            />
            <Search size={14} style={{ position: "absolute", left: 12, top: 12, color: "var(--color-ink-soft)" }} />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: 10,
                  top: 9,
                  border: "none",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  fontSize: 12,
                  color: "var(--color-ink-soft)"
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Action Tools: Refresh + Sort + View Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {/* Live sync beacon */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                fontFamily: "var(--font-serif)",
                fontWeight: 700,
                color: "#16A34A",
                padding: "6px 12px",
                borderRadius: "var(--radius-pill)",
                backgroundColor: "rgba(34, 197, 94, 0.08)",
                border: "1px solid rgba(34, 197, 94, 0.2)"
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  backgroundColor: "#16A34A",
                  animation: "pulse 1.8s infinite"
                }}
              />
              <span>Live Synced</span>
            </div>

            {/* Manual Refresh Button */}
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="touch-target-44"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                borderRadius: "var(--radius-pill)",
                backgroundColor: "#FFFFFF",
                border: "1px solid var(--border-color)",
                fontSize: 11.5,
                fontFamily: "var(--font-serif)",
                fontWeight: 700,
                color: "var(--color-ink)",
                cursor: "pointer"
              }}
              title="Refresh Orders"
            >
              <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "7px 10px",
                fontSize: 11.5,
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--border-color)",
                backgroundColor: "#FFFFFF",
                color: "var(--color-ink)",
                outline: "none",
                fontFamily: "var(--font-serif)",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Amount: High to Low</option>
            </select>

            {/* View Mode Toggle: Cards / Table */}
            <div
              style={{
                display: "inline-flex",
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--border-color)",
                overflow: "hidden",
                backgroundColor: "var(--bg-app)"
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                style={{
                  padding: "6px 10px",
                  border: "none",
                  backgroundColor: viewMode === "cards" ? "var(--color-ink)" : "transparent",
                  color: viewMode === "cards" ? "#FFFFFF" : "var(--color-ink-soft)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center"
                }}
                title="Cards View"
              >
                <LayoutGrid size={13} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                style={{
                  padding: "6px 10px",
                  border: "none",
                  backgroundColor: viewMode === "table" ? "var(--color-ink)" : "transparent",
                  color: viewMode === "table" ? "#FFFFFF" : "var(--color-ink-soft)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center"
                }}
                title="Table View"
              >
                <TableIcon size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Chips: Status + Delivery Mode + Date Range */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
            paddingTop: 10,
            borderTop: "1px solid var(--border-color)"
          }}
        >
          {/* Status Filter Chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 11, fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--color-bronze-dark)", textTransform: "uppercase", marginRight: 2 }}>
              Status:
            </span>
            {[
              { id: "all", label: `All (${onlineOrders.length})` },
              { id: "active", label: `Active (${stats.activeCount})` },
              { id: "placed", label: "New (Placed)" },
              { id: "confirmed", label: "Confirmed" },
              { id: "preparing", label: "Preparing" },
              { id: "out_for_delivery", label: "Out for Delivery" },
              { id: "delivered", label: "Delivered" },
              { id: "cancelled", label: "Cancelled" }
            ].map((f) => {
              const isActive = statusFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "var(--radius-pill)",
                    border: isActive ? "1px solid var(--color-ink)" : "1px solid var(--border-color)",
                    backgroundColor: isActive ? "var(--color-ink)" : "#FFFFFF",
                    color: isActive ? "#FFFFFF" : "var(--color-ink)",
                    fontSize: 11,
                    fontFamily: "var(--font-serif)",
                    fontWeight: isActive ? 700 : 500,
                    cursor: "pointer"
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Mode & Date Filters */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            {/* Delivery vs Pickup */}
            <div style={{ display: "flex", gap: 4 }}>
              {[
                { id: "all", label: "All Modes" },
                { id: "delivery", label: "🛵 Delivery" },
                { id: "pickup", label: "🛍️ Pickup" }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setTypeFilter(m.id)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "var(--radius-pill)",
                    border: typeFilter === m.id ? "1px solid var(--color-bronze)" : "1px solid var(--border-color)",
                    backgroundColor: typeFilter === m.id ? "var(--color-bronze-light)" : "#FFFFFF",
                    color: typeFilter === m.id ? "var(--color-bronze-dark)" : "var(--color-ink-soft)",
                    fontSize: 11,
                    fontFamily: "var(--font-serif)",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Date Range */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                padding: "4px 8px",
                fontSize: 11,
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--border-color)",
                backgroundColor: "#FFFFFF",
                color: "var(--color-ink)",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Past 7 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. ORDERS LIST SECTION */}
      {filteredOrders.length === 0 ? (
        /* Empty State */
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            border: "1.5px dashed var(--border-color)",
            padding: "48px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              backgroundColor: "var(--bg-app)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-bronze)"
            }}
          >
            <Store size={26} />
          </div>
          <div>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 700, margin: "0 0 6px 0", color: "var(--color-ink)" }}>
              No Online Orders Found
            </h3>
            <p style={{ fontSize: 12.5, color: "var(--color-ink-soft)", margin: 0, maxWidth: 400 }}>
              {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                ? "No online orders match your active search or filter filters. Try clearing filters."
                : "No delivery or takeaway orders have been placed through the website yet."}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 6 }}>
            {searchQuery || statusFilter !== "all" || typeFilter !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                  setDateFilter("all");
                }}
                className="btn-pill-black"
                style={{ padding: "8px 18px", fontSize: 12 }}
              >
                Clear All Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreateDemoOrder}
                className="btn-pill-black"
                style={{ padding: "8px 18px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Plus size={14} />
                <span>Create Test Delivery Order</span>
              </button>
            )}
          </div>
        </div>
      ) : viewMode === "cards" ? (
        /* CARD GRID VIEW */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))",
            gap: 14
          }}
        >
          {filteredOrders.map((ord) => {
            const isDelivery = ord.orderType === "delivery";
            const statusStyle = STATUS_CONFIG[ord.status] || STATUS_CONFIG.placed;
            const StatusIcon = statusStyle.icon;
            const itemsCount = (ord.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0);
            const itemsSummary = (ord.items || [])
              .map((i) => `${i.quantity}x ${i.name}`)
              .slice(0, 2)
              .join(", ") + ((ord.items || []).length > 2 ? "..." : "");

            const hasAddress = isDelivery && ord.deliveryAddress;
            const mapsDirectionsUrl = hasAddress
              ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  `${ord.deliveryAddress}${ord.landmark ? `, ${ord.landmark}` : ""}, Muradnagar, UP`
                )}`
              : null;

            return (
              <div
                key={ord.id}
                onClick={() => setSelectedOrder(ord)}
                className="bistro-card bistro-card-hover"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 14,
                  border: ord.status === "placed" ? "2px solid var(--color-bronze)" : "1px solid var(--border-color)",
                  boxShadow: ord.status === "placed" ? "0 8px 24px -4px rgba(138, 87, 56, 0.16)" : "0 2px 8px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  overflow: "hidden",
                  transition: "all 0.2s ease"
                }}
              >
                {/* Card Top Header */}
                <div
                  style={{
                    padding: "12px 16px",
                    backgroundColor: ord.status === "placed" ? "#FFFDF9" : "#FAF6F0",
                    borderBottom: "1px solid var(--border-color)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "var(--radius-pill)",
                        backgroundColor: isDelivery ? "rgba(138, 87, 56, 0.12)" : "rgba(16, 185, 129, 0.12)",
                        color: isDelivery ? "var(--color-bronze-dark)" : "#065F46",
                        fontSize: 10.5,
                        fontFamily: "var(--font-serif)",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      {isDelivery ? <Bike size={11} /> : <Store size={11} />}
                      <span>{isDelivery ? "Delivery" : "Takeaway"}</span>
                    </span>

                    <strong style={{ fontFamily: "var(--font-serif)", fontSize: 13, color: "var(--color-ink)" }}>
                      #{ord.orderNumber || ord.id.slice(0, 8)}
                    </strong>
                  </div>

                  {/* Status Badge */}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 10.5,
                      fontFamily: "var(--font-serif)",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      padding: "3px 9px",
                      borderRadius: "var(--radius-pill)",
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.text,
                      border: `1px solid ${statusStyle.border}`
                    }}
                  >
                    {ord.status === "placed" && (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          backgroundColor: statusStyle.text,
                          animation: "pulse 1.4s infinite"
                        }}
                      />
                    )}
                    <StatusIcon size={11} />
                    <span>{statusStyle.label}</span>
                  </span>
                </div>

                {/* Card Body */}
                <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                  {/* Customer Info & Time */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-ink)" }}>
                        {ord.customerName || "Customer"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-ink-soft)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                        <Phone size={11} style={{ color: "var(--color-bronze)" }} />
                        <span>{ord.customerPhone || "No phone provided"}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 11, color: "var(--color-ink-soft)", display: "flex", alignItems: "center", gap: 3 }}>
                        <Clock size={11} />
                        <span>{formatTimeAgo(ord.createdAt)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Delivery Address Preview (if Delivery) */}
                  {isDelivery && ord.deliveryAddress && (
                    <div
                      style={{
                        padding: "8px 10px",
                        backgroundColor: "#FAF6F0",
                        borderRadius: 8,
                        border: "1px solid rgba(138, 87, 56, 0.15)",
                        fontSize: 11.5,
                        color: "var(--color-ink)",
                        lineHeight: 1.4,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 6
                      }}
                    >
                      <MapPin size={13} style={{ color: "var(--color-bronze)", flexShrink: 0, marginTop: 2 }} />
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 }}>
                          {ord.deliveryAddress}
                        </div>
                        {ord.landmark && (
                          <div style={{ fontSize: 10.5, color: "var(--color-bronze-dark)" }}>
                            Near {ord.landmark}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Items summary */}
                  <div style={{ fontSize: 12, color: "var(--color-ink-soft)", lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 600, color: "var(--color-ink)" }}>Items: </span>
                    <span>{itemsSummary}</span>
                  </div>

                  {/* Estimated Time Badge if set */}
                  {ord.estimatedTime && (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 11,
                        color: "#059669",
                        backgroundColor: "#ECFDF5",
                        padding: "3px 8px",
                        borderRadius: "var(--radius-pill)",
                        fontWeight: 700,
                        alignSelf: "flex-start"
                      }}
                    >
                      <Clock size={11} />
                      <span>ETA: {ord.estimatedTime}</span>
                    </div>
                  )}
                </div>

                {/* Card Bottom Footer: Total & Actions */}
                <div
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#FAF6F0",
                    borderTop: "1px solid var(--border-color)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8
                  }}
                >
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--font-serif)", color: "var(--color-ink)" }}>
                      ₹{ord.total || 0}
                    </div>
                    <div style={{ fontSize: 10.5, color: "#16A34A", fontWeight: 700 }}>
                      Paid Online
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {/* Quick Google Maps directions button */}
                    {mapsDirectionsUrl && (
                      <a
                        href={mapsDirectionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "var(--radius-pill)",
                          backgroundColor: "#FFFFFF",
                          border: "1px solid var(--border-color)",
                          color: "var(--color-ink)",
                          fontSize: 11,
                          fontWeight: 700,
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4
                        }}
                        title="Get Google Maps Directions"
                      >
                        <Navigation size={11} style={{ color: "var(--color-bronze)" }} />
                        <span>Map</span>
                      </a>
                    )}

                    {/* Advance Status Quick Button */}
                    {ord.status !== "delivered" && ord.status !== "completed" && ord.status !== "cancelled" && (
                      <button
                        type="button"
                        disabled={actionLoadingId === ord.id}
                        onClick={(e) => handleQuickAdvanceStatus(ord, e)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "var(--radius-pill)",
                          backgroundColor: "var(--color-ink)",
                          color: "#FFFFFF",
                          border: "none",
                          fontSize: 11,
                          fontFamily: "var(--font-serif)",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        <span>Next</span>
                        <ChevronRight size={12} />
                      </button>
                    )}

                    {/* View Details Icon */}
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(ord)}
                      style={{
                        padding: "6px 8px",
                        borderRadius: "var(--radius-pill)",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid var(--border-color)",
                        color: "var(--color-ink)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center"
                      }}
                      title="View Order Details"
                    >
                      <Eye size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            border: "1px solid var(--border-color)",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ backgroundColor: "#FAF6F0", borderBottom: "1.5px solid var(--border-color)" }}>
                  <th style={{ textAlign: "left", padding: "12px 14px", fontFamily: "var(--font-serif)", color: "var(--color-bronze-dark)" }}>Order #</th>
                  <th style={{ textAlign: "left", padding: "12px 14px", fontFamily: "var(--font-serif)", color: "var(--color-bronze-dark)" }}>Customer</th>
                  <th style={{ textAlign: "left", padding: "12px 14px", fontFamily: "var(--font-serif)", color: "var(--color-bronze-dark)" }}>Type</th>
                  <th style={{ textAlign: "left", padding: "12px 14px", fontFamily: "var(--font-serif)", color: "var(--color-bronze-dark)" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "12px 14px", fontFamily: "var(--font-serif)", color: "var(--color-bronze-dark)" }}>Address / Notes</th>
                  <th style={{ textAlign: "center", padding: "12px 14px", fontFamily: "var(--font-serif)", color: "var(--color-bronze-dark)" }}>Items</th>
                  <th style={{ textAlign: "center", padding: "12px 14px", fontFamily: "var(--font-serif)", color: "var(--color-bronze-dark)" }}>ETA</th>
                  <th style={{ textAlign: "right", padding: "12px 14px", fontFamily: "var(--font-serif)", color: "var(--color-bronze-dark)" }}>Amount</th>
                  <th style={{ textAlign: "center", padding: "12px 14px", fontFamily: "var(--font-serif)", color: "var(--color-bronze-dark)" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((ord, idx) => {
                  const isDelivery = ord.orderType === "delivery";
                  const statusStyle = STATUS_CONFIG[ord.status] || STATUS_CONFIG.placed;
                  const itemsCount = (ord.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0);
                  const hasAddress = isDelivery && ord.deliveryAddress;
                  const mapsDirectionsUrl = hasAddress
                    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                        `${ord.deliveryAddress}${ord.landmark ? `, ${ord.landmark}` : ""}, Muradnagar, UP`
                      )}`
                    : null;

                  return (
                    <tr
                      key={ord.id}
                      onClick={() => setSelectedOrder(ord)}
                      style={{
                        borderBottom: "1px solid var(--border-color)",
                        backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#FCF9F5",
                        cursor: "pointer"
                      }}
                    >
                      <td style={{ padding: "12px 14px" }}>
                        <strong style={{ color: "var(--color-ink)" }}>#{ord.orderNumber || ord.id.slice(0, 8)}</strong>
                        <div style={{ fontSize: 11, color: "var(--color-ink-soft)" }}>{formatTimeAgo(ord.createdAt)}</div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 600, color: "var(--color-ink)" }}>{ord.customerName || "Customer"}</div>
                        <div style={{ fontSize: 11, color: "var(--color-ink-soft)" }}>{ord.customerPhone}</div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "var(--radius-pill)",
                            backgroundColor: isDelivery ? "rgba(138, 87, 56, 0.1)" : "rgba(16, 185, 129, 0.1)",
                            color: isDelivery ? "var(--color-bronze-dark)" : "#065F46",
                            fontSize: 11,
                            fontWeight: 700
                          }}
                        >
                          {isDelivery ? "🛵 Delivery" : "🛍️ Pickup"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "3px 8px",
                            borderRadius: "var(--radius-pill)",
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.text,
                            border: `1px solid ${statusStyle.border}`,
                            fontSize: 11,
                            fontWeight: 700
                          }}
                        >
                          {statusStyle.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", maxWidth: 220 }}>
                        <div style={{ fontSize: 11.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {isDelivery ? ord.deliveryAddress || "Address provided" : "Cafe Counter Pickup"}
                        </div>
                        {ord.customerNotes && (
                          <div style={{ fontSize: 10.5, color: "var(--color-bronze)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            "{ord.customerNotes}"
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 600 }}>
                        {itemsCount} items
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: ord.estimatedTime ? "#059669" : "var(--color-ink-soft)" }}>
                          {ord.estimatedTime || "Not set"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right" }}>
                        <strong style={{ color: "var(--color-ink)", fontSize: 13.5 }}>₹{ord.total || 0}</strong>
                        <div style={{ fontSize: 10, color: "#16A34A", fontWeight: 700 }}>PAID</div>
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          {mapsDirectionsUrl && (
                            <a
                              href={mapsDirectionsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                padding: "4px 8px",
                                borderRadius: 6,
                                backgroundColor: "#FAF6F0",
                                border: "1px solid var(--border-color)",
                                color: "var(--color-ink)",
                                fontSize: 11,
                                textDecoration: "none"
                              }}
                              title="Directions"
                            >
                              <Navigation size={12} color="var(--color-bronze)" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(ord)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: 6,
                              backgroundColor: "var(--color-ink)",
                              color: "#FFFFFF",
                              border: "none",
                              fontSize: 11,
                              cursor: "pointer"
                            }}
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. ORDER DETAIL SLIDE-OVER / MODAL */}
      {selectedOrder && (
        <OnlineOrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdated={(updated) => {
            setSelectedOrder(updated);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}
