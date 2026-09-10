import React from "react";
import { X, Clock, MapPin, Download, Star, CheckCircle, ShieldCheck, Bike, ShoppingBag } from "lucide-react";
import { printReceipt } from "../../utils/receiptGenerator";

export default function OrderDetailsModal({ order, onClose, onOpenFeedback }) {
  if (!order) return null;

  const items = order.items || [];
  const orderNumber = order.orderNumber || order.id || "THD-1001";
  const dateFormatted = order.createdAt
    ? new Date(order.createdAt).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
      })
    : "Just now";

  const subtotal = Number(order.subtotal || 0);
  const deliveryFee = Number(order.deliveryFee || 0);
  const tax = Number(order.tax || 0);
  const total = Number(order.total || subtotal + deliveryFee + tax);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backgroundColor: "rgba(28, 25, 23, 0.65)",
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
          maxWidth: 580,
          maxHeight: "90vh",
          backgroundColor: "#FAF7F2",
          borderRadius: 20,
          border: "1px solid var(--border-color)",
          boxShadow: "0 20px 45px rgba(28, 25, 23, 0.2)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            backgroundColor: "#FFFFFF",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 700 }}>
                Order #{orderNumber}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-serif)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  padding: "3px 10px",
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: "#ECFDF5",
                  color: "#059669",
                  border: "1px solid #A7F3D0"
                }}
              >
                {order.status ? order.status.replace("_", " ").toUpperCase() : "DELIVERED"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#78716C" }}>
              <Clock size={13} />
              <span>{dateFormatted}</span>
              <span>•</span>
              <span>{order.orderType === "pickup" ? "Takeaway Pick-up" : "Home Delivery"}</span>
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
          >
            <X size={17} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {/* Delivery or Pickup Address */}
          <div
            style={{
              padding: "14px 16px",
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              marginBottom: 20
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              {order.orderType === "pickup" ? (
                <ShoppingBag size={18} color="var(--color-bronze)" style={{ marginTop: 2 }} />
              ) : (
                <Bike size={18} color="var(--color-bronze)" style={{ marginTop: 2 }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--color-bronze)", fontWeight: 700 }}>
                  {order.orderType === "pickup" ? "Pick Up Point" : "Delivery Address"}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)", marginTop: 2 }}>
                  {order.customerName || "Customer"} {order.customerPhone && `• ${order.customerPhone}`}
                </div>
                <div style={{ fontSize: 13, color: "var(--color-ink-soft)", marginTop: 2 }}>
                  {order.deliveryAddress || "Takeaway Counter at Two Hearts Cafe"}
                </div>
                {order.customerNotes && (
                  <div style={{ fontSize: 12, color: "var(--color-bronze)", fontStyle: "italic", marginTop: 4 }}>
                    Cooking Note: "{order.customerNotes}"
                  </div>
                )}
              </div>
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
                    borderRadius: "var(--radius-md)"
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
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 12, color: "#78716C" }}>
                        Qty: {item.quantity} × ₹{item.price}
                      </div>
                      {item.specialInstructions && (
                        <div style={{ fontSize: 11, color: "var(--color-bronze)", fontStyle: "italic" }}>
                          Note: {item.specialInstructions}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-ink)" }}>
                    ₹{item.price * item.quantity}
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
              borderRadius: "var(--radius-md)",
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
              <span>GST (5%)</span>
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
              Payment Mode: <strong>{(order.paymentMethod || "Online").toUpperCase()}</strong> • Ref: {order.paymentId || "PAID"}
            </div>
          </div>

          {/* Rating / Feedback display if available */}
          {order.rating ? (
            <div
              style={{
                padding: "14px 16px",
                backgroundColor: "#FDF8F0",
                border: "1px solid #F5E8D3",
                borderRadius: "var(--radius-md)",
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
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "16px 24px",
            backgroundColor: "#FFFFFF",
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            gap: 12
          }}
        >
          <button
            type="button"
            onClick={() => printReceipt(order)}
            className="btn-pill-black"
            style={{ flex: 1, padding: "12px", justifyContent: "center" }}
          >
            <Download size={15} />
            <span>Download Receipt (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
