import React, { useState } from "react";
import {
  X,
  Clock,
  CheckCircle2,
  ChefHat,
  Bike,
  Store,
  MapPin,
  Phone,
  MessageSquare,
  Navigation,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Calendar,
  User,
  CreditCard,
  Printer,
  Copy,
  Check,
  Plus,
  ArrowRight,
  Loader2,
  PackageCheck,
  Ban
} from "lucide-react";
import { updateOnlineOrder } from "../../firebase/services";

export default function OnlineOrderDetailModal({ order, onClose, onOrderUpdated }) {
  if (!order) return null;

  const isDelivery = order.orderType === "delivery";
  const [currentStatus, setCurrentStatus] = useState(order.status || "placed");
  const [etaInput, setEtaInput] = useState(order.estimatedTime || (order.etaMinutes ? `${order.etaMinutes} mins` : ""));
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingEta, setIsUpdatingEta] = useState(false);
  const [copiedText, setCopiedText] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const statusSteps = isDelivery
    ? [
        { key: "placed", label: "Placed", icon: Clock },
        { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
        { key: "preparing", label: "Preparing", icon: ChefHat },
        { key: "out_for_delivery", label: "Out for Delivery", icon: Bike },
        { key: "delivered", label: "Delivered", icon: PackageCheck }
      ]
    : [
        { key: "placed", label: "Placed", icon: Clock },
        { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
        { key: "preparing", label: "Preparing", icon: ChefHat },
        { key: "ready_for_pickup", label: "Ready for Pickup", icon: Store },
        { key: "completed", label: "Completed", icon: PackageCheck }
      ];

  const getStepIndex = (st) => statusSteps.findIndex((s) => s.key === st);
  const activeStepIdx = getStepIndex(currentStatus);

  // Status progression update handler
  const handleUpdateStatus = async (newStatus) => {
    setIsUpdatingStatus(true);
    setFeedbackMessage("");
    try {
      const updated = await updateOnlineOrder(order.id, { status: newStatus });
      setCurrentStatus(newStatus);
      if (onOrderUpdated) onOrderUpdated(updated);
      setFeedbackMessage(`Status updated to ${newStatus.replace(/_/g, " ").toUpperCase()}`);
      setTimeout(() => setFeedbackMessage(""), 3500);
    } catch (err) {
      console.error("Error updating order status:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Approximate time updater handler
  const handleSaveEstimatedTime = async (timeValue) => {
    const val = (timeValue !== undefined ? timeValue : etaInput).trim();
    if (!val) return;

    setIsUpdatingEta(true);
    setFeedbackMessage("");
    try {
      // Parse numeric minutes if available
      const parsedMinutes = parseInt(val.replace(/\D/g, ""), 10);
      const updates = {
        estimatedTime: val,
        etaMinutes: !isNaN(parsedMinutes) && parsedMinutes > 0 ? parsedMinutes : (order.etaMinutes || 30)
      };

      const updated = await updateOnlineOrder(order.id, updates);
      setEtaInput(val);
      if (onOrderUpdated) onOrderUpdated(updated);
      setFeedbackMessage(`✓ Estimated ready/delivery time synced to customer: "${val}"`);
      setTimeout(() => setFeedbackMessage(""), 4000);
    } catch (err) {
      console.error("Error updating estimated time:", err);
    } finally {
      setIsUpdatingEta(false);
    }
  };

  // Google Maps directions URL
  const getGoogleMapsDirectionsUrl = () => {
    const rawDest = (order.deliveryAddress || order.address || order.fullAddress || "").trim();
    const destination = rawDest
      ? `${rawDest}${order.landmark ? `, Near ${order.landmark}` : ""}, Muradnagar, Uttar Pradesh`
      : `${order.landmark ? `Near ${order.landmark}, ` : ""}Muradnagar, Uttar Pradesh`;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  };

  // Copy to clipboard helper
  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(""), 2000);
  };

  // Printable receipt handler
  const handlePrintSlip = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsHtml = (order.items || [])
      .map(
        (item) => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
          <span>${item.quantity}x ${item.name} ${item.itemNotes ? `<br/><small style="color:#666;">(${item.itemNotes})</small>` : ""}</span>
          <span style="font-weight: 700;">Rs. ${(item.price || 0) * (item.quantity || 1)}</span>
        </div>`
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Two Hearts Cafe - Order ${order.orderNumber || order.id}</title>
          <style>
            body { font-family: monospace, sans-serif; padding: 24px; max-width: 380px; margin: 0 auto; color: #111; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 12px; margin-bottom: 12px; }
            .section { border-bottom: 1px dashed #000; padding-bottom: 12px; margin-bottom: 12px; }
            .total-row { display: flex; justify-content: space-between; font-weight: 800; font-size: 16px; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin: 0; font-size: 20px;">TWO HEARTS CAFE</h2>
            <p style="margin: 4px 0 0; font-size: 11px;">Pillar #852, Delhi-Meerut Rd, Muradnagar</p>
            <p style="margin: 4px 0 0; font-size: 12px; font-weight: 700;">
              ${isDelivery ? "HOME DELIVERY SLIP" : "TAKEAWAY COUNTER SLIP"}
            </p>
          </div>
          <div class="section">
            <p style="margin: 2px 0;"><strong>Order ID:</strong> ${order.orderNumber || order.id}</p>
            <p style="margin: 2px 0;"><strong>Date:</strong> ${new Date(order.createdAt || Date.now()).toLocaleString("en-IN")}</p>
            <p style="margin: 2px 0;"><strong>Customer:</strong> ${order.customerName || "Customer"}</p>
            <p style="margin: 2px 0;"><strong>Phone:</strong> ${order.customerPhone || "N/A"}</p>
            ${
              isDelivery
                ? `<p style="margin: 2px 0;"><strong>Delivery Address:</strong> ${order.deliveryAddress || "N/A"}</p>
                   ${order.landmark ? `<p style="margin: 2px 0;"><strong>Landmark:</strong> ${order.landmark}</p>` : ""}
                   ${order.customerNotes ? `<p style="margin: 2px 0;"><strong>Rider Notes:</strong> ${order.customerNotes}</p>` : ""}`
                : `<p style="margin: 2px 0;"><strong>Type:</strong> Pick up at Cafe Counter</p>`
            }
            <p style="margin: 2px 0;"><strong>Payment:</strong> PAID ONLINE (${order.paymentMethod || "Verified"})</p>
            ${order.estimatedTime ? `<p style="margin: 2px 0;"><strong>Estimated Time:</strong> ${order.estimatedTime}</p>` : ""}
          </div>
          <div class="section">
            <h4 style="margin: 0 0 8px 0; text-transform: uppercase;">Items Ordered</h4>
            ${itemsHtml}
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
              <span>Subtotal:</span>
              <span>Rs. ${order.subtotal || 0}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
              <span>Delivery Fee:</span>
              <span>${order.deliveryFee ? `Rs. ${order.deliveryFee}` : "FREE"}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
              <span>Taxes (5% GST):</span>
              <span>Rs. ${order.tax || 0}</span>
            </div>
            <div class="total-row">
              <span>TOTAL DUE:</span>
              <span>Rs. ${order.total || 0}</span>
            </div>
          </div>
          <p style="text-align: center; margin-top: 20px; font-size: 11px;">Thank you for ordering with Two Hearts Cafe!</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(28, 25, 23, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px"
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 780,
          maxHeight: "92vh",
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid var(--border-color)",
          animation: "modalFadeIn 0.22s ease-out"
        }}
      >
        {/* Modal Top Header */}
        <div
          style={{
            padding: "18px 24px",
            backgroundColor: "#FAF6F0",
            borderBottom: "1.5px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                backgroundColor: isDelivery ? "rgba(138, 87, 56, 0.12)" : "rgba(16, 185, 129, 0.12)",
                color: isDelivery ? "var(--color-bronze)" : "#10B981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {isDelivery ? <Bike size={22} /> : <Store size={22} />}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-serif)",
                    fontSize: 20,
                    fontWeight: 700,
                    color: "var(--color-ink)"
                  }}
                >
                  Order #{order.orderNumber || order.id}
                </h2>
                <button
                  type="button"
                  onClick={() => handleCopy(order.orderNumber || order.id, "id")}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-bronze)",
                    padding: 4,
                    display: "flex",
                    alignItems: "center"
                  }}
                  title="Copy Order ID"
                >
                  {copiedText === "id" ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                </button>
              </div>
              <div style={{ fontSize: 12, color: "var(--color-ink-soft)", marginTop: 2, display: "flex", alignItems: "center", gap: 8 }}>
                <span>{new Date(order.createdAt || Date.now()).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                <span>•</span>
                <span style={{ fontWeight: 700, color: isDelivery ? "var(--color-bronze)" : "#059669" }}>
                  {isDelivery ? "Home Delivery" : "Takeaway Pickup"}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={handlePrintSlip}
              className="touch-target-44"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: "var(--radius-pill)",
                backgroundColor: "#FFFFFF",
                border: "1px solid var(--border-color)",
                color: "var(--color-ink)",
                fontSize: 12,
                fontFamily: "var(--font-serif)",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              <Printer size={14} />
              <span>Print Slip</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="touch-target-44"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                backgroundColor: "#FFFFFF",
                border: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--color-ink-soft)"
              }}
              title="Close Modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Feedback Alert if status/time updated */}
        {feedbackMessage && (
          <div
            style={{
              padding: "10px 20px",
              backgroundColor: "#ECFDF5",
              borderBottom: "1px solid #A7F3D0",
              color: "#065F46",
              fontSize: 12.5,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
              animation: "fadeIn 0.2s ease"
            }}
          >
            <CheckCircle2 size={16} color="#059669" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 20
          }}
        >
          {/* SECTION 1: Status Stepper Controller */}
          <div
            style={{
              padding: 16,
              backgroundColor: "#FAF6F0",
              borderRadius: 12,
              border: "1px solid rgba(138, 87, 56, 0.2)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-serif)",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  color: "var(--color-bronze-dark)"
                }}
              >
                Order Lifecycle Progression
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: currentStatus === "cancelled" ? "#FEE2E2" : "#FEF3C7",
                  color: currentStatus === "cancelled" ? "#DC2626" : "#D97706",
                  border: `1px solid ${currentStatus === "cancelled" ? "#FCA5A5" : "#FCD34D"}`
                }}
              >
                {currentStatus.replace(/_/g, " ").toUpperCase()}
              </span>
            </div>

            {/* Stepper Buttons */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${statusSteps.length}, 1fr)`,
                gap: 8
              }}
            >
              {statusSteps.map((step, idx) => {
                const isPassed = activeStepIdx >= idx && currentStatus !== "cancelled";
                const isCurrent = currentStatus === step.key;
                const Icon = step.icon;

                return (
                  <button
                    key={step.key}
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleUpdateStatus(step.key)}
                    style={{
                      padding: "10px 6px",
                      borderRadius: 10,
                      border: isCurrent
                        ? "2px solid var(--color-bronze)"
                        : isPassed
                        ? "1px solid var(--color-bronze)"
                        : "1px solid var(--border-color)",
                      backgroundColor: isCurrent ? "var(--color-bronze)" : isPassed ? "rgba(138, 87, 56, 0.08)" : "#FFFFFF",
                      color: isCurrent ? "#FFFFFF" : isPassed ? "var(--color-bronze-dark)" : "var(--color-ink-soft)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                      transition: "all 0.18s ease"
                    }}
                    title={`Update status to ${step.label}`}
                  >
                    <Icon size={16} />
                    <span style={{ fontSize: 10.5, fontWeight: 700, fontFamily: "var(--font-serif)" }}>
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Cancel action if still open */}
            {currentStatus !== "delivered" && currentStatus !== "completed" && currentStatus !== "cancelled" && (
              <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => {
                    if (window.confirm("Are you sure you want to cancel this order?")) {
                      handleUpdateStatus("cancelled");
                    }
                  }}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    color: "#DC2626",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  <Ban size={12} />
                  <span>Cancel this Order</span>
                </button>
              </div>
            )}
          </div>

          {/* SECTION 2: NEW CAPABILITY 1 - Set Approximate Ready / Delivery Time */}
          <div
            style={{
              padding: 16,
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              border: "1.5px solid rgba(138, 87, 56, 0.25)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={16} style={{ color: "var(--color-bronze)" }} />
                <span
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--color-ink)"
                  }}
                >
                  {isDelivery ? "Set Estimated Delivery Time" : "Set Estimated Pickup Ready Time"}
                </span>
              </div>
              {order.estimatedTime && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#059669",
                    backgroundColor: "#ECFDF5",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-pill)"
                  }}
                >
                  Current ETA: {order.estimatedTime}
                </span>
              )}
            </div>

            <p style={{ margin: "0 0 12px 0", fontSize: 11.5, color: "var(--color-ink-soft)", lineHeight: 1.4 }}>
              Selected time immediately syncs to the customer's Live Order Tracker page and updates in real time.
            </p>

            {/* Quick Increment Buttons */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {["15 mins", "25 mins", "35 mins", "45 mins", "60 mins"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={isUpdatingEta}
                  onClick={() => handleSaveEstimatedTime(preset)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: etaInput === preset ? "var(--color-bronze)" : "#FAF6F0",
                    color: etaInput === preset ? "#FFFFFF" : "var(--color-bronze-dark)",
                    border: "1px solid rgba(138, 87, 56, 0.3)",
                    fontSize: 11.5,
                    fontWeight: 700,
                    fontFamily: "var(--font-serif)",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  +{preset}
                </button>
              ))}
            </div>

            {/* Custom Input & Sync Button */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="text"
                placeholder="e.g. 30 mins OR 1:30 PM"
                value={etaInput}
                onChange={(e) => setEtaInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  fontSize: 13,
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-app)",
                  outline: "none"
                }}
              />
              <button
                type="button"
                disabled={isUpdatingEta || !etaInput.trim()}
                onClick={() => handleSaveEstimatedTime()}
                className="btn-pill-black"
                style={{
                  padding: "8px 16px",
                  fontSize: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                {isUpdatingEta ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                <span>Sync to Customer</span>
              </button>
            </div>
          </div>

          {/* SECTION 3: Customer & Delivery Details + NEW CAPABILITY 2 & 3 (Address & Google Maps Directions) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 16
            }}
          >
            {/* Customer Details Box */}
            <div
              style={{
                padding: 16,
                backgroundColor: "#FAF6F0",
                borderRadius: 12,
                border: "1px solid var(--border-color)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <User size={15} style={{ color: "var(--color-bronze)" }} />
                <span style={{ fontFamily: "var(--font-serif)", fontSize: 13, fontWeight: 700, color: "var(--color-ink)" }}>
                  Customer Details
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-ink-soft)" }}>Name:</span>
                  <strong style={{ color: "var(--color-ink)" }}>
                    {order.customerName || order.name || order.userName || "Customer"}
                  </strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--color-ink-soft)" }}>Phone:</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong style={{ color: "var(--color-ink)" }}>
                      {order.customerPhone || order.phone || order.userPhone || "N/A"}
                    </strong>
                    {(order.customerPhone || order.phone || order.userPhone) && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <a
                          href={`tel:${order.customerPhone || order.phone || order.userPhone}`}
                          style={{
                            color: "var(--color-bronze)",
                            padding: "3px 6px",
                            borderRadius: 4,
                            backgroundColor: "#FFFFFF",
                            border: "1px solid var(--border-color)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            fontSize: 11,
                            textDecoration: "none"
                          }}
                          title="Call Customer"
                        >
                          <Phone size={12} />
                          <span>Call</span>
                        </a>
                        <a
                          href={`https://wa.me/91${String(order.customerPhone || order.phone || order.userPhone).replace(/\D/g, "").slice(-10)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#15803D",
                            padding: "3px 6px",
                            borderRadius: 4,
                            backgroundColor: "#ECFDF5",
                            border: "1px solid #A7F3D0",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            fontSize: 11,
                            textDecoration: "none"
                          }}
                          title="WhatsApp Customer"
                        >
                          <MessageSquare size={12} />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px dashed var(--border-color)", marginTop: 4 }}>
                  <span style={{ color: "var(--color-ink-soft)" }}>Payment:</span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      color: "#15803d",
                      fontWeight: 700,
                      fontSize: 11.5
                    }}
                  >
                    <ShieldCheck size={13} />
                    <span>PAID ONLINE ({order.paymentMethod || "Gateway"})</span>
                  </span>
                </div>

                {order.paymentId && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--color-ink-soft)" }}>
                    <span>Txn Ref:</span>
                    <span>{order.paymentId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Details & Directions Box */}
            <div
              style={{
                padding: 16,
                backgroundColor: isDelivery ? "#FFFDF9" : "#FAF6F0",
                borderRadius: 12,
                border: isDelivery ? "1.5px solid rgba(138, 87, 56, 0.3)" : "1px solid var(--border-color)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <MapPin size={15} style={{ color: "var(--color-bronze)" }} />
                  <span style={{ fontFamily: "var(--font-serif)", fontSize: 13, fontWeight: 700, color: "var(--color-ink)" }}>
                    {isDelivery ? "Delivery Destination" : "Pickup Location"}
                  </span>
                </div>

                {/* Google Maps Directions / Open Button */}
                <a
                  href={isDelivery ? getGoogleMapsDirectionsUrl() : "https://maps.google.com/?q=28.7758,77.5026+(Two+Hearts+Cafe+Pillar+852+Muradnagar)"}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "5px 12px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: "var(--color-ink)",
                    color: "#FFFFFF",
                    fontSize: 11,
                    fontFamily: "var(--font-serif)",
                    fontWeight: 700,
                    textDecoration: "none",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.12)"
                  }}
                  title={isDelivery ? "Open Google Maps Navigation" : "Open Cafe Location in Google Maps"}
                >
                  <Navigation size={11} />
                  <span>{isDelivery ? "Get Directions" : "Open in Maps"}</span>
                  <ExternalLink size={10} />
                </a>
              </div>

              {isDelivery ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* Full Formatted Address */}
                  {(() => {
                    const resolvedDeliveryAddr = (order.deliveryAddress || order.address || order.fullAddress || "").trim();
                    return (
                      <div
                        style={{
                          padding: "10px 12px",
                          backgroundColor: "#FFFFFF",
                          borderRadius: 8,
                          border: "1px solid var(--border-color)",
                          fontSize: 12.5,
                          lineHeight: 1.5,
                          color: "var(--color-ink)",
                          fontWeight: 500
                        }}
                      >
                        {resolvedDeliveryAddr || (
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span style={{ color: "#92400E", fontWeight: 600 }}>📍 Muradnagar, Uttar Pradesh</span>
                            <span style={{ fontSize: 11, color: "var(--color-ink-soft)" }}>
                              Click "Get Directions" above to navigate via Google Maps
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {order.landmark && (
                    <div style={{ fontSize: 11.5, color: "var(--color-bronze-dark)" }}>
                      <strong>Landmark:</strong> {order.landmark}
                    </div>
                  )}

                  {order.customerNotes && (
                    <div style={{ fontSize: 11.5, color: "var(--color-ink-soft)", backgroundColor: "#FFF8EE", padding: "6px 10px", borderRadius: 6, border: "1px dashed rgba(138, 87, 56, 0.25)" }}>
                      <strong>Rider Notes:</strong> "{order.customerNotes}"
                    </div>
                  )}

                  {/* Embedded Google Map for Delivery Destination */}
                  <div style={{
                    width: "100%",
                    height: 180,
                    borderRadius: 8,
                    overflow: "hidden",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "#f3f4f6",
                    marginTop: 4
                  }}>
                    <iframe
                      title="Customer Delivery Destination Map"
                      width="100%"
                      height="100%"
                      style={{ border: 0, display: "block" }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={(() => {
                        const q = (order.coords?.lat && order.coords?.lng)
                          ? `${order.coords.lat},${order.coords.lng}`
                          : encodeURIComponent((order.deliveryAddress || order.address || "Muradnagar, Uttar Pradesh") + (order.landmark ? ` Near ${order.landmark}` : ""));
                        return `https://maps.google.com/maps?width=100%25&height=600&hl=en&q=${q}&t=&z=15&ie=UTF8&iwloc=B&output=embed`;
                      })()}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 12.5, color: "var(--color-ink-soft)", lineHeight: 1.5 }}>
                  <p style={{ margin: "0 0 4px 0", fontWeight: 600, color: "var(--color-ink)" }}>
                    Pick up at Cafe Counter:
                  </p>
                  <p style={{ margin: "0 0 10px 0" }}>Two Hearts Cafe, Pillar #852, Delhi-Meerut Highway, Muradnagar</p>
                  {order.customerNotes && (
                    <p style={{ margin: "0 0 10px 0", fontSize: 11.5, color: "var(--color-bronze)" }}>
                      <strong>Customer Pickup Notes:</strong> "{order.customerNotes}"
                    </p>
                  )}

                  {/* Embedded Google Map for Cafe Counter Pickup */}
                  <div style={{
                    width: "100%",
                    height: 190,
                    borderRadius: 8,
                    overflow: "hidden",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "#f3f4f6",
                    marginTop: 6
                  }}>
                    <iframe
                      title="Two Hearts Cafe Pickup Location Map"
                      width="100%"
                      height="100%"
                      style={{ border: 0, display: "block" }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src="https://maps.google.com/maps?width=100%25&height=600&hl=en&q=28.7758,77.5026+(Two%20Hearts%20Cafe%20Pillar%20852)&t=&z=16&ie=UTF8&iwloc=B&output=embed"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: Itemized Dish Breakdown & Financials */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-serif)",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  color: "var(--color-bronze-dark)"
                }}
              >
                Itemized Order Breakdown ({(order.items || []).length} items)
              </span>
            </div>

            <div
              style={{
                border: "1px solid var(--border-color)",
                borderRadius: 10,
                overflow: "hidden"
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead>
                  <tr style={{ backgroundColor: "#FAF6F0", borderBottom: "1px solid var(--border-color)" }}>
                    <th style={{ textAlign: "left", padding: "10px 14px", fontFamily: "var(--font-serif)", color: "var(--color-bronze-dark)" }}>Item</th>
                    <th style={{ textAlign: "center", padding: "10px 12px", fontFamily: "var(--font-serif)", color: "var(--color-bronze-dark)" }}>Qty</th>
                    <th style={{ textAlign: "right", padding: "10px 12px", fontFamily: "var(--font-serif)", color: "var(--color-bronze-dark)" }}>Rate</th>
                    <th style={{ textAlign: "right", padding: "10px 14px", fontFamily: "var(--font-serif)", color: "var(--color-bronze-dark)" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: idx < (order.items || []).length - 1 ? "1px solid var(--border-color)" : "none",
                        backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#FCF9F5"
                      }}
                    >
                      <td style={{ padding: "10px 14px" }}>
                        <strong style={{ color: "var(--color-ink)" }}>{item.name}</strong>
                        {item.category && (
                          <span style={{ fontSize: 10.5, color: "var(--color-ink-soft)", marginLeft: 6, textTransform: "capitalize" }}>
                            ({item.category})
                          </span>
                        )}
                        {item.specialInstructions && (
                          <div style={{ fontSize: 11, color: "var(--color-bronze)", fontStyle: "italic", marginTop: 2 }}>
                            Instructions: {item.specialInstructions}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "center", padding: "10px 12px", fontWeight: 700 }}>
                        {item.quantity || 1}
                      </td>
                      <td style={{ textAlign: "right", padding: "10px 12px", color: "var(--color-ink-soft)" }}>
                        ₹{item.price || 0}
                      </td>
                      <td style={{ textAlign: "right", padding: "10px 14px", fontWeight: 700, color: "var(--color-ink)" }}>
                        ₹{(item.price || 0) * (item.quantity || 1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Financial Subtotal Summary Footer */}
              <div
                style={{
                  padding: "12px 16px",
                  backgroundColor: "#FAF6F0",
                  borderTop: "1px solid var(--border-color)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--color-ink-soft)" }}>
                  <span>Item Subtotal:</span>
                  <span>₹{order.subtotal || 0}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--color-ink-soft)" }}>
                  <span>Delivery Fee:</span>
                  <span style={{ color: order.deliveryFee ? "var(--color-ink)" : "#16A34A", fontWeight: 600 }}>
                    {order.deliveryFee ? `₹${order.deliveryFee}` : "FREE"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--color-ink-soft)" }}>
                  <span>GST Taxes (5%):</span>
                  <span>₹{order.tax || 0}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 16,
                    fontWeight: 800,
                    fontFamily: "var(--font-serif)",
                    color: "var(--color-ink)",
                    paddingTop: 8,
                    borderTop: "1px dashed var(--border-color)",
                    marginTop: 2
                  }}
                >
                  <span>Grand Total:</span>
                  <span style={{ color: "var(--color-bronze-dark)" }}>₹{order.total || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div
          style={{
            padding: "14px 24px",
            backgroundColor: "#FAF6F0",
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12
          }}
        >
          <div style={{ fontSize: 12, color: "var(--color-ink-soft)" }}>
            Updated: {new Date(order.updatedAt || order.createdAt || Date.now()).toLocaleTimeString("en-IN")}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Quick Next Step Action */}
            {activeStepIdx >= 0 && activeStepIdx < statusSteps.length - 1 && currentStatus !== "cancelled" && (
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleUpdateStatus(statusSteps[activeStepIdx + 1].key)}
                className="btn-pill-black"
                style={{
                  padding: "8px 18px",
                  fontSize: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                {isUpdatingStatus ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
                <span>Advance to "{statusSteps[activeStepIdx + 1].label}"</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 18px",
                borderRadius: "var(--radius-pill)",
                backgroundColor: "#FFFFFF",
                border: "1px solid var(--border-color)",
                color: "var(--color-ink)",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "var(--font-serif)",
                cursor: "pointer"
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
