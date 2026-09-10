import React, { useState } from "react";
import {
  X,
  Clock,
  MapPin,
  Download,
  Star,
  CheckCircle2,
  ChefHat,
  Bike,
  Store,
  ShoppingBag,
  Phone,
  MessageSquare,
  Navigation,
  ExternalLink,
  Copy,
  Check,
  AlertCircle
} from "lucide-react";
import { printReceipt } from "../../utils/receiptGenerator";

export default function OrderDetailsModal({
  order,
  onClose,
  onOpenFeedback,
  onCancelOrder,
  onNavigate
}) {
  const [copiedId, setCopiedId] = useState(false);

  if (!order) return null;

  const items = order.items || [];
  const rawOrderNumber = order.orderNumber || order.id || "THD-1001";
  const orderNumber = String(rawOrderNumber).replace(/^#/, "");
  const isPickup = order.orderType === "pickup";
  const isCancelled = String(order.status || "").toLowerCase() === "cancelled";
  const isDelivered = ["delivered", "completed"].includes(String(order.status || "").toLowerCase());
  const isInProgress = !isCancelled && !isDelivered;

  const dateFormatted = order.createdAt
    ? new Date(order.createdAt).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
      })
    : "Just now";

  const subtotal = Number(order.subtotal || 0);
  const deliveryFee = Number(order.deliveryFee || 0);
  const tax = Number(order.tax || Math.round(subtotal * 0.05));
  const total = Number(order.total || subtotal + deliveryFee + tax);

  const getStepIndex = (status) => {
    switch (String(status || "").toLowerCase()) {
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

  const stepIndex = getStepIndex(order.status);

  const steps = [
    { step: 1, label: "Confirmed", desc: "Ticket received in kitchen", icon: CheckCircle2 },
    { step: 2, label: "In Kitchen", desc: "Chefs cooking freshly", icon: ChefHat },
    { step: 3, label: isPickup ? "Ready for Pickup" : "On the Way", desc: isPickup ? "Packed at counter" : "Driver on route", icon: isPickup ? Store : Bike },
    { step: 4, label: isPickup ? "Collected" : "Delivered", desc: "Enjoy your meal!", icon: ShoppingBag }
  ];

  const liveEta =
    order.estimatedTime ||
    (order.etaMinutes ? `${order.etaMinutes} mins` : isPickup ? "15-20 mins" : "30-35 mins");

  const deliveryAddr = (order.deliveryAddress || order.address || order.fullAddress || "").trim();
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${deliveryAddr || "Muradnagar"}${order.landmark ? `, Near ${order.landmark}` : ""}, Muradnagar, Uttar Pradesh`
  )}`;

  const handleCopyId = () => {
    navigator.clipboard?.writeText(orderNumber);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px 12px",
        backgroundColor: "rgba(28, 25, 23, 0.7)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: "100%",
          maxWidth: 640,
          maxHeight: "92vh",
          backgroundColor: "#FAF7F2",
          borderRadius: 20,
          border: "1px solid var(--border-color)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            backgroundColor: "#FFFFFF",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 700, color: "var(--color-ink)" }}>
                Order #{orderNumber}
              </span>

              <button
                type="button"
                onClick={handleCopyId}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 8px",
                  borderRadius: 6,
                  border: "1px solid var(--border-color)",
                  backgroundColor: "#F9FAFB",
                  fontSize: 11,
                  fontWeight: 600,
                  color: copiedId ? "#059669" : "var(--color-ink-soft)",
                  cursor: "pointer"
                }}
                title="Copy Order ID"
              >
                {copiedId ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                <span>{copiedId ? "Copied" : "Copy ID"}</span>
              </button>

              {/* Dynamic Status Badge */}
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-serif)",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  padding: "3px 10px",
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: isCancelled ? "#FEE2E2" : (isDelivered ? "#ECFDF5" : "#D1FAE5"),
                  color: isCancelled ? "#DC2626" : (isDelivered ? "#059669" : "#065F46"),
                  border: `1px solid ${isCancelled ? "#FCA5A5" : (isDelivered ? "#A7F3D0" : "#6EE7B7")}`,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5
                }}
              >
                {isInProgress && (
                  <span style={{ position: "relative", display: "flex", height: 6, width: 6 }}>
                    <span style={{ animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite", position: "absolute", display: "inline-flex", height: "100%", width: "100%", borderRadius: "50%", backgroundColor: "#10B981", opacity: 0.75 }} />
                    <span style={{ position: "relative", display: "inline-flex", borderRadius: "50%", height: 6, width: 6, backgroundColor: "#059669" }} />
                  </span>
                )}
                <span>
                  {isCancelled ? "CANCELLED" : (order.status ? order.status.replace("_", " ").toUpperCase() : "DELIVERED")}
                </span>
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#78716C", marginTop: 4 }}>
              <Clock size={13} />
              <span>{dateFormatted}</span>
              <span>•</span>
              <span>{isPickup ? "Takeaway Pick-up" : "Home Delivery"}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--bg-app)",
              border: "1px solid var(--border-color)",
              color: "var(--color-ink-soft)",
              cursor: "pointer"
            }}
            title="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {/* Status Banner */}
          {isCancelled ? (
            <div
              style={{
                padding: "14px 18px",
                backgroundColor: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 14,
                marginBottom: 20,
                display: "flex",
                alignItems: "flex-start",
                gap: 12
              }}
            >
              <AlertCircle size={20} color="#DC2626" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B" }}>
                  This Order Has Been Cancelled
                </div>
                <div style={{ fontSize: 12, color: "#B91C1C", marginTop: 2, lineHeight: 1.4 }}>
                  The order was cancelled and kitchen preparation has stopped. Any payment made via UPI or online gateway will be refunded to your original payment method within 2-4 business days.
                </div>
              </div>
            </div>
          ) : isInProgress ? (
            <div
              style={{
                background: "linear-gradient(135deg, #064E3B 0%, #04382A 100%)",
                borderRadius: 14,
                padding: "16px 20px",
                color: "#FFFFFF",
                boxShadow: "0 8px 24px -4px rgba(6, 78, 59, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 14,
                marginBottom: 20
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: "rgba(52, 211, 153, 0.15)",
                    border: "1.5px solid rgba(52, 211, 153, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#34D399"
                  }}
                >
                  <Clock size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#A7F3D0", textTransform: "uppercase" }}>
                    {isPickup ? "Estimated Ready for Pickup" : "Kitchen Estimated Delivery"}
                  </div>
                  <div style={{ fontSize: 24, fontFamily: "var(--font-serif)", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.2 }}>
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
                  <CheckCircle2 size={12} />
                  <span>Live Synced with Kitchen</span>
                </span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
                  Updates live as chefs cook
                </span>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: "14px 18px",
                backgroundColor: "#ECFDF5",
                border: "1px solid #A7F3D0",
                borderRadius: 14,
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 12
              }}
            >
              <CheckCircle2 size={20} color="#059669" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#065F46" }}>
                  Order Successfully Delivered & Completed
                </div>
                <div style={{ fontSize: 12, color: "#047857", marginTop: 1 }}>
                  Thank you for ordering with Two Hearts Cafe! We hope you enjoyed your meal.
                </div>
              </div>
            </div>
          )}

          {/* 4-Stage Visual Stepper */}
          {!isCancelled && (
            <div
              style={{
                padding: "16px 14px",
                backgroundColor: "#FFFFFF",
                borderRadius: 14,
                border: "1px solid var(--border-color)",
                marginBottom: 20
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, position: "relative" }}>
                {steps.map((st) => {
                  const isDone = stepIndex > st.step;
                  const isCurrent = stepIndex === st.step;
                  const IconComp = st.icon;

                  return (
                    <div key={st.step} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: isDone ? "#059669" : isCurrent ? "#064E3B" : "#F3F4F6",
                          color: isDone || isCurrent ? "#FFFFFF" : "#9CA3AF",
                          border: isCurrent ? "3px solid #10B981" : isDone ? "2px solid #059669" : "2px solid #E5E7EB",
                          boxShadow: isCurrent ? "0 0 0 4px rgba(16, 185, 129, 0.25)" : "none",
                          transition: "all 0.3s ease",
                          marginBottom: 6
                        }}
                      >
                        {isDone ? <Check size={16} strokeWidth={3} /> : <IconComp size={16} />}
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          fontWeight: isCurrent ? 800 : 600,
                          color: isCurrent ? "#064E3B" : isDone ? "#059669" : "var(--color-ink-soft)",
                          lineHeight: 1.2
                        }}
                      >
                        {st.label}
                      </div>
                      <div style={{ fontSize: 10, color: "#78716C", marginTop: 2, display: "none" }}>
                        {st.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Delivery or Pickup Destination & Google Maps */}
          <div
            style={{
              padding: "16px",
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--border-color)",
              borderRadius: 14,
              marginBottom: 20
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1, minWidth: 220 }}>
                {isPickup ? (
                  <Store size={18} color="var(--color-bronze)" style={{ marginTop: 2, flexShrink: 0 }} />
                ) : (
                  <MapPin size={18} color="var(--color-bronze)" style={{ marginTop: 2, flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--color-bronze)", fontWeight: 700 }}>
                    {isPickup ? "Pick Up Point" : "Delivery Destination"}
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-ink)", marginTop: 2 }}>
                    {order.customerName || "Customer"} {order.customerPhone && `• ${order.customerPhone}`}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--color-ink-soft)", marginTop: 2 }}>
                    {deliveryAddr || (isPickup ? "Two Hearts Cafe Main Counter, Pillar #852, Delhi-Meerut Highway, Muradnagar" : "Muradnagar, Uttar Pradesh")}
                  </div>
                  {order.landmark && (
                    <div style={{ fontSize: 12, color: "var(--color-bronze-dark)", marginTop: 2 }}>
                      Landmark: {order.landmark}
                    </div>
                  )}
                  {order.customerNotes && (
                    <div style={{ fontSize: 12, color: "var(--color-bronze)", fontStyle: "italic", marginTop: 4 }}>
                      Cooking Note: "{order.customerNotes}"
                    </div>
                  )}
                </div>
              </div>

              {isPickup ? (
                <a
                  href="https://maps.google.com/?q=28.7758,77.5026+(Two+Hearts+Cafe+Muradnagar+Pillar+852)"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-pill-outline"
                  style={{
                    fontSize: 11.5,
                    padding: "7px 14px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    borderColor: "var(--border-color)",
                    textDecoration: "none"
                  }}
                  title="Open Cafe Location in Google Maps"
                >
                  <Navigation size={13} color="var(--color-bronze)" />
                  <span>Directions to Cafe</span>
                  <ExternalLink size={11} />
                </a>
              ) : (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-pill-outline"
                  style={{
                    fontSize: 11.5,
                    padding: "7px 14px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    borderColor: "var(--border-color)",
                    textDecoration: "none"
                  }}
                  title="Open in Google Maps for directions"
                >
                  <Navigation size={13} color="var(--color-bronze)" />
                  <span>Google Maps Directions</span>
                  <ExternalLink size={11} />
                </a>
              )}
            </div>

            {/* Embedded Google Map */}
            <div style={{
              width: "100%",
              height: 180,
              borderRadius: 8,
              overflow: "hidden",
              border: "1px solid var(--border-color)",
              marginTop: 14,
              backgroundColor: "#f3f4f6"
            }}>
              <iframe
                title={isPickup ? "Two Hearts Cafe Pickup Location" : "Delivery Address Map"}
                width="100%"
                height="100%"
                style={{ border: 0, display: "block" }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={isPickup
                  ? "https://maps.google.com/maps?width=100%25&height=600&hl=en&q=28.7758,77.5026+(Two%20Hearts%20Cafe%20Pillar%20852)&t=&z=16&ie=UTF8&iwloc=B&output=embed"
                  : `https://maps.google.com/maps?width=100%25&height=600&hl=en&q=${encodeURIComponent((deliveryAddr || "Muradnagar, Uttar Pradesh") + (order.landmark ? ` Near ${order.landmark}` : ""))}&t=&z=15&ie=UTF8&iwloc=B&output=embed`
                }
              />
            </div>
          </div>

          {/* Itemized Dish List */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, color: "var(--color-bronze-dark)", marginBottom: 10 }}>
              Dishes Ordered ({items.reduce((acc, i) => acc + (i.quantity || 1), 0)} items)
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid var(--border-color)",
                    borderRadius: 12
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", backgroundColor: "var(--bg-app)" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          backgroundColor: "var(--color-bronze-light)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--color-bronze)",
                          fontWeight: 700,
                          fontSize: 16
                        }}
                      >
                        {item.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-ink)" }}>
                        {item.quantity || 1}x {item.name}
                      </div>
                      <div style={{ fontSize: 12, color: "#78716C" }}>
                        Rate: ₹{item.price} each
                      </div>
                      {(item.specialInstructions || item.itemNotes) && (
                        <div style={{ fontSize: 11, color: "var(--color-bronze)", fontStyle: "italic", marginTop: 2 }}>
                          Note: {item.specialInstructions || item.itemNotes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-ink)" }}>
                    ₹{(item.price || 0) * (item.quantity || 1)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bill Breakdown */}
          <div
            style={{
              padding: "16px",
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--border-color)",
              borderRadius: 14,
              marginBottom: 20
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8, color: "var(--color-ink-soft)" }}>
              <span>Item Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8, color: "var(--color-ink-soft)" }}>
              <span>Delivery Fee</span>
              <span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 12, color: "var(--color-ink-soft)" }}>
              <span>GST Taxes (5%)</span>
              <span>₹{tax}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: 12,
                borderTop: "1px dashed var(--border-color)",
                fontFamily: "var(--font-serif)",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--color-ink)"
              }}
            >
              <span>Total Paid</span>
              <span>₹{total}</span>
            </div>

            <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border-color)", fontSize: 11, color: "#78716C" }}>
              Payment Mode: <strong>{(order.paymentMethod || "Online UPI").toUpperCase()}</strong> • Status: {isCancelled ? "REFUND INITIATED" : "PAID"}
            </div>
          </div>

          {/* Rating / Review if Completed */}
          {isDelivered && (
            order.rating ? (
              <div
                style={{
                  padding: "14px 16px",
                  backgroundColor: "#FDF8F0",
                  border: "1px solid #F5E8D3",
                  borderRadius: 14,
                  marginBottom: 10
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-bronze)" }}>
                    Your Review:
                  </span>
                  <div style={{ display: "flex", gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        fill={star <= order.rating ? "#F59E0B" : "transparent"}
                        color={star <= order.rating ? "#F59E0B" : "#D1D5DB"}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#D97706" }}>
                    ({order.rating}/5)
                  </span>
                </div>
                {order.feedback && (
                  <p style={{ fontSize: 13, color: "var(--color-ink)", fontStyle: "italic", margin: 0 }}>
                    "{order.feedback}"
                  </p>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", marginBottom: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenFeedback) onOpenFeedback(order);
                  }}
                  className="btn-pill-outline"
                  style={{ width: "100%", justifyContent: "center", padding: "10px" }}
                >
                  <Star size={14} color="var(--color-bronze)" />
                  <span>Rate & Review this Order</span>
                </button>
              </div>
            )
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "14px 24px",
            backgroundColor: "#FFFFFF",
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <a
              href="tel:09634824522"
              className="btn-pill-outline"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "8px 14px",
                fontSize: 11.5,
                textDecoration: "none"
              }}
            >
              <Phone size={13} color="var(--color-bronze)" />
              <span>Call Cafe</span>
            </a>

            <a
              href={`https://wa.me/919634824522?text=${encodeURIComponent(
                `Hello Two Hearts Cafe, inquiring about my order #${orderNumber}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pill-outline"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "8px 14px",
                fontSize: 11.5,
                color: "#059669",
                borderColor: "#A7F3D0",
                textDecoration: "none"
              }}
            >
              <MessageSquare size={13} />
              <span>WhatsApp</span>
            </a>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              onClick={() => printReceipt(order)}
              className="btn-pill-outline"
              style={{ padding: "8px 14px", fontSize: 11.5 }}
            >
              <Download size={13} />
              <span>Download Receipt</span>
            </button>

            {isInProgress && onNavigate && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate("order-status");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="btn-pill-black"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  fontSize: 12,
                  fontWeight: 700
                }}
              >
                <span>Live Tracker</span>
                <ExternalLink size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
