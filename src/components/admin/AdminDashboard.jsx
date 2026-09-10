import React, { useState, useEffect, useRef } from "react";
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
  Bike
} from "lucide-react";
import OrderCard from "./OrderCard";
import MenuManager from "./MenuManager";
import TableQRGenerator from "./TableQRGenerator";
import ChangePinModal from "./ChangePinModal";
import OnlineOrdersManager from "./OnlineOrdersManager";
import { updateOrderStatus, clearAllOrders } from "../../firebase/services";
import { soundNotifier } from "../../utils/audio";

export default function AdminDashboard({ orders, menuItems, currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "online-orders";
  });
  const [orderStatusFilter, setOrderStatusFilter] = useState("active");
  const [tableFilter, setTableFilter] = useState("all");
  const [isMuted, setIsMuted] = useState(false);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);

  const prevOrdersCountRef = useRef(orders.length);

  // Play audio chime when a new order arrives
  useEffect(() => {
    if (orders.length > prevOrdersCountRef.current) {
      const latestOrder = orders[0];
      if (latestOrder && latestOrder.status === "placed") {
        soundNotifier.playChime();
      }
    }
    prevOrdersCountRef.current = orders.length;
  }, [orders]);

  const handleToggleMute = () => {
    const muted = soundNotifier.toggleMute();
    setIsMuted(muted);
  };

  const handleTestChime = () => {
    soundNotifier.playChime();
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
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px 80px 16px" }}>
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

      {/* KPI Stats - Table Orders (only shown on Table Feed tab, Online Orders tab has its own dedicated KPI grid) */}
      {activeTab === "orders" && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
          marginBottom: 24
        }}>
          {/* New Orders */}
          <div style={{
            backgroundColor: "#fff",
            padding: "14px 18px",
            borderRadius: 4,
            border: tableNewOrdersCount > 0 ? "2px solid var(--color-bronze)" : "1.2px solid var(--color-border-frame)",
            boxShadow: "var(--shadow-sheet)"
          }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 13, fontWeight: 700, color: "var(--color-bronze)", textTransform: "uppercase", letterSpacing: 0.5 }}>
              New Orders
            </div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 32, fontWeight: 800, color: "var(--color-ink)", lineHeight: 1.1, marginTop: 4 }}>
              {tableNewOrdersCount}
            </div>
            <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--color-bronze)" }}>
              Needs preparation
            </div>
          </div>

          {/* In Kitchen */}
          <div style={{
            backgroundColor: "#fff",
            padding: "14px 18px",
            borderRadius: 4,
            border: "1.2px solid var(--color-border-frame)",
            boxShadow: "var(--shadow-sheet)"
          }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 13, fontWeight: 700, color: "var(--color-ink)", textTransform: "uppercase", letterSpacing: 0.5 }}>
              In Cooking
            </div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 32, fontWeight: 800, color: "#2563eb", lineHeight: 1.1, marginTop: 4 }}>
              {tablePreparingCount}
            </div>
            <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--color-bronze)" }}>
              Currently on the stove/pan
            </div>
          </div>

          {/* Served */}
          <div style={{
            backgroundColor: "#fff",
            padding: "14px 18px",
            borderRadius: 4,
            border: "1.2px solid var(--color-border-frame)",
            boxShadow: "var(--shadow-sheet)"
          }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 13, fontWeight: 700, color: "var(--color-ink)", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Delivered
            </div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 32, fontWeight: 800, color: "#15803d", lineHeight: 1.1, marginTop: 4 }}>
              {tableServedCount}
            </div>
            <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--color-bronze)" }}>
              Served to table
            </div>
          </div>

          {/* Revenue */}
          <div style={{
            backgroundColor: "#fff",
            padding: "14px 18px",
            borderRadius: 4,
            border: "1.2px solid var(--color-border-frame)",
            boxShadow: "var(--shadow-sheet)"
          }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 13, fontWeight: 700, color: "var(--color-ink)", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Total Tickets Value
            </div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 32, fontWeight: 800, color: "var(--color-ink)", lineHeight: 1.1, marginTop: 4 }}>
              Rs.{tableTotalRevenue}
            </div>
            <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--color-bronze)" }}>
              {tableOrders.length} table orders placed today
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{
        display: "flex",
        borderBottom: "1.5px solid var(--color-border-frame)",
        marginBottom: 20,
        gap: 8,
        overflowX: "auto"
      }}>
        {/* New Online Delivery & Pickup Orders Section */}
        <button
          onClick={() => setActiveTab("online-orders")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderBottom: activeTab === "online-orders" ? "3px solid #15803d" : "none",
            color: activeTab === "online-orders" ? "#15803d" : "var(--color-bronze)",
            fontFamily: "var(--font-serif)",
            fontWeight: activeTab === "online-orders" ? 800 : 600,
            fontSize: 15,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            cursor: "pointer",
            whiteSpace: "nowrap"
          }}
        >
          <Bike size={18} />
          <span>Online Orders</span>
          {onlineActiveCount > 0 && (
            <span style={{
              backgroundColor: onlineNewCount > 0 ? "#D97706" : "#15803D",
              color: "#fff",
              fontSize: 11,
              fontWeight: 800,
              padding: "2px 7px",
              borderRadius: "var(--radius-pill)"
            }}>
              {onlineActiveCount}
            </span>
          )}
        </button>

        {/* Physical Dine-in Table QR Orders Section */}
        <button
          onClick={() => setActiveTab("orders")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderBottom: activeTab === "orders" ? "3px solid var(--color-ink)" : "none",
            color: activeTab === "orders" ? "var(--color-ink)" : "var(--color-bronze)",
            fontFamily: "var(--font-serif)",
            fontWeight: activeTab === "orders" ? 800 : 600,
            fontSize: 15,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            cursor: "pointer",
            whiteSpace: "nowrap"
          }}
        >
          <ChefHat size={17} />
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

        <button
          onClick={() => setActiveTab("menu")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderBottom: activeTab === "menu" ? "3px solid var(--color-ink)" : "none",
            color: activeTab === "menu" ? "var(--color-ink)" : "var(--color-bronze)",
            fontFamily: "var(--font-serif)",
            fontWeight: activeTab === "menu" ? 800 : 600,
            fontSize: 15,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            cursor: "pointer",
            whiteSpace: "nowrap"
          }}
        >
          <UtensilsCrossed size={17} />
          <span>Menu & Stock</span>
        </button>

        <button
          onClick={() => setActiveTab("qr")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderBottom: activeTab === "qr" ? "3px solid var(--color-ink)" : "none",
            color: activeTab === "qr" ? "var(--color-ink)" : "var(--color-bronze)",
            fontFamily: "var(--font-serif)",
            fontWeight: activeTab === "qr" ? 800 : 600,
            fontSize: 15,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            cursor: "pointer",
            whiteSpace: "nowrap"
          }}
        >
          <QrCode size={17} />
          <span>Table QR Kit</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "online-orders" && (
        <OnlineOrdersManager orders={orders} />
      )}

      {activeTab === "orders" && (
        <div>
          {/* Filters Bar */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16
          }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                { id: "active", label: "Active Orders" },
                { id: "placed", label: "New (Needs Prep)" },
                { id: "preparing", label: "In Cooking" },
                { id: "served", label: "Served" },
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
                    color: orderStatusFilter === pill.id ? "#FAF7F2" : "var(--color-ink)"
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                    fontWeight: 700
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
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 16
            }}>
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

      {/* Change PIN Modal */}
      <ChangePinModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
      />
    </div>
  );
}
