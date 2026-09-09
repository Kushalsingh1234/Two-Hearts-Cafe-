import React from "react";
import { Clock, CheckCircle2, ChefHat, AlertCircle } from "lucide-react";

function formatTimeAgo(dateString) {
  if (!dateString) return "Just now";
  const diffSec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diffSec < 45) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  return `${diffHours}h ago`;
}

export default function OrderCard({ order, onUpdateStatus }) {
  const isPlaced = order.status === "placed";
  const isPreparing = order.status === "preparing";
  const isServed = order.status === "served";

  return (
    <div style={{
      backgroundColor: "#ffffff",
      borderRadius: 4,
      border: isPlaced ? "2px solid var(--color-bronze)" : "1.5px solid var(--color-border-frame)",
      boxShadow: "var(--shadow-sheet)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    }}>
      {/* Header: Table Number & Time */}
      <div style={{
        padding: "12px 16px",
        backgroundColor: isPlaced ? "#FDF8F3" : isPreparing ? "#F0F5FA" : isServed ? "#F2FAF4" : "#F7F3EB",
        borderBottom: "1.2px solid var(--color-border-frame)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            backgroundColor: isPlaced ? "var(--color-bronze)" : isPreparing ? "#2563eb" : isServed ? "#15803d" : "#444",
            color: "#fff",
            fontFamily: "var(--font-serif)",
            fontWeight: 800,
            fontSize: 15,
            padding: "3px 10px",
            borderRadius: 2,
            letterSpacing: 1
          }}>
            TABLE {order.tableNumber}
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 13, fontWeight: 700, color: "var(--color-ink)" }}>
              {order.orderNumber || order.id.slice(0, 7)}
            </div>
            <div style={{ fontSize: 11, fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--color-bronze)", display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={11} />
              <span>{formatTimeAgo(order.createdAt)}</span>
            </div>
          </div>
        </div>

        <span style={{
          fontFamily: "var(--font-serif)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: "uppercase",
          padding: "2px 8px",
          borderRadius: "var(--radius-pill)",
          border: "1px solid var(--color-border-frame)",
          backgroundColor: "#fff",
          color: "var(--color-ink)"
        }}>
          {isPlaced ? "● New Order" : order.status}
        </span>
      </div>

      {/* Special Kitchen Notes */}
      {order.specialInstructions && (
        <div style={{
          backgroundColor: "#FDF4EC",
          borderBottom: "1px dashed var(--color-bronze)",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontSize: 13,
          color: "var(--color-bronze-dark)"
        }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>Note: "{order.specialInstructions}"</span>
        </div>
      )}

      {/* Items List */}
      <div style={{
        padding: "14px 16px",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 6
      }}>
        {order.items?.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              fontFamily: "var(--font-serif)",
              fontSize: 14,
              paddingBottom: 6,
              borderBottom: idx < order.items.length - 1 ? "1px dashed var(--color-border-subtle)" : "none"
            }}
          >
            <div style={{ flex: 1 }}>
              <strong style={{ color: "var(--color-ink)", marginRight: 6 }}>
                {item.quantity}×
              </strong>
              <span>{item.name}</span>
              {item.note && (
                <div style={{ fontStyle: "italic", fontSize: 12, color: "var(--color-bronze)", paddingLeft: 20 }}>
                  "{item.note}"
                </div>
              )}
            </div>
            <span style={{ fontWeight: 600, color: "var(--color-ink)" }}>
              Rs.{item.price * item.quantity}
            </span>
          </div>
        ))}
      </div>

      {/* Bill Total & Actions */}
      <div style={{
        padding: "12px 16px",
        borderTop: "1.2px solid var(--color-border-frame)",
        backgroundColor: "#FAF7F2",
        display: "flex",
        flexDirection: "column",
        gap: 10
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          fontFamily: "var(--font-serif)"
        }}>
          <span style={{ fontSize: 12, fontStyle: "italic", color: "var(--color-bronze)" }}>
            Pay at Counter
          </span>
          <div>
            <span style={{ fontSize: 13, marginRight: 6 }}>Total:</span>
            <strong style={{ fontSize: 18, color: "var(--color-ink)" }}>Rs.{order.total}</strong>
          </div>
        </div>

        {/* Status Buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          {isPlaced && (
            <button
              onClick={() => onUpdateStatus(order.id, "preparing")}
              style={{
                flex: 1,
                backgroundColor: "var(--color-bronze)",
                color: "#fff",
                padding: "9px 12px",
                borderRadius: "var(--radius-pill)",
                fontFamily: "var(--font-serif)",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}
            >
              <ChefHat size={15} />
              <span>Accept & Prepare</span>
            </button>
          )}

          {isPreparing && (
            <button
              onClick={() => onUpdateStatus(order.id, "served")}
              style={{
                flex: 1,
                backgroundColor: "#15803d",
                color: "#fff",
                padding: "9px 12px",
                borderRadius: "var(--radius-pill)",
                fontFamily: "var(--font-serif)",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}
            >
              <CheckCircle2 size={15} />
              <span>Mark as Served</span>
            </button>
          )}

          {isServed && (
            <button
              onClick={() => onUpdateStatus(order.id, "settled")}
              style={{
                flex: 1,
                backgroundColor: "var(--color-ink)",
                color: "#FAF7F2",
                padding: "9px 12px",
                borderRadius: "var(--radius-pill)",
                fontFamily: "var(--font-serif)",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}
            >
              <CheckCircle2 size={15} />
              <span>Settle Bill & Close</span>
            </button>
          )}

          {isPlaced && (
            <button
              onClick={() => {
                if (confirm("Reject/Cancel this order?")) {
                  onUpdateStatus(order.id, "cancelled");
                }
              }}
              style={{
                backgroundColor: "#fff",
                border: "1px solid #dc2626",
                color: "#dc2626",
                padding: "8px 12px",
                borderRadius: "var(--radius-pill)",
                fontFamily: "var(--font-serif)",
                fontSize: 12,
                fontWeight: 700
              }}
            >
              Reject
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
