import React, { useState } from "react";
import { Clock, CheckCircle2, ChefHat, AlertCircle, Receipt, Smartphone, Building2 } from "lucide-react";
import DigitalInvoiceModal from "../customer/DigitalInvoiceModal";

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
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const isPlaced = order.status === "placed";
  const isPreparing = order.status === "preparing";
  const isServed = order.status === "served";
  const isSettled = order.status === "settled";

  const isPaidOnline = order.paymentStatus === "paid_online";
  const isPayAtCounter = order.paymentStatus === "pay_at_counter" || Boolean(order.billRequested);
  const utr = order.paymentDetails?.utr;

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
              {order.orderNumber || (order.id ? order.id.slice(0, 7) : "101")}
            </div>
            <div style={{ fontSize: 11, fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--color-bronze)", display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={11} />
              <span>{formatTimeAgo(order.createdAt)}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Payment Status Pill */}
          {isPaidOnline ? (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontFamily: "var(--font-serif)",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "#dcfce7",
              color: "#15803d",
              border: "1px solid #86efac"
            }}>
              <Smartphone size={10} />
              <span>UPI Paid</span>
            </span>
          ) : isPayAtCounter ? (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontFamily: "var(--font-serif)",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "#fef3c7",
              color: "#b45309",
              border: "1px solid #fde68a"
            }}>
              <Building2 size={10} />
              <span>Counter Pay</span>
            </span>
          ) : (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontFamily: "var(--font-serif)",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "#f5f5f4",
              color: "#78716c",
              border: "1px solid #e7e5e4"
            }}>
              <span>Dining (Unpaid)</span>
            </span>
          )}

          <span style={{
            fontFamily: "var(--font-serif)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            padding: "2px 8px",
            borderRadius: "var(--radius-pill)",
            backgroundColor: isPlaced ? "#fee2e2" : isPreparing ? "#dbeafe" : isServed ? "#dcfce7" : "#e5e7eb",
            color: isPlaced ? "#dc2626" : isPreparing ? "#1d4ed8" : isServed ? "#15803d" : "#374151"
          }}>
            {isPlaced ? "● New Order" : order.status}
          </span>
        </div>
      </div>

      {/* Latest Addition Highlight Badge */}
      {order.lastAdditionSummary && (
        <div style={{
          backgroundColor: "#ecfdf5",
          borderBottom: "1px dashed #10b981",
          padding: "6px 16px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "var(--font-serif)",
          fontSize: 12,
          fontWeight: 700,
          color: "#047857"
        }}>
          <span>+ Item Added: {order.lastAdditionSummary}</span>
        </div>
      )}

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

      {/* Bill Total & Payment Details */}
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
          alignItems: "center",
          fontFamily: "var(--font-serif)",
          flexWrap: "wrap",
          gap: 6
        }}>
          <div>
            {isPaidOnline ? (
              <div style={{ fontSize: 12, color: "#15803d", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCircle2 size={13} />
                <span>Paid Online ({order.paymentDetails?.upiId || "Q327979600@ybl"}) {utr ? `[UTR: ${utr}]` : ""}</span>
              </div>
            ) : isPayAtCounter ? (
              <div style={{ fontSize: 12, color: "#b45309", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                <Building2 size={13} />
                <span>Customer requested Cash/Counter Bill</span>
              </div>
            ) : (
              <span style={{ fontSize: 12, fontStyle: "italic", color: "var(--color-bronze)" }}>
                Bill not requested yet
              </span>
            )}
          </div>
          <div>
            <span style={{ fontSize: 13, marginRight: 6 }}>Total:</span>
            <strong style={{ fontSize: 18, color: "var(--color-ink)" }}>Rs.{order.total}</strong>
          </div>
        </div>

        {/* Status Buttons */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                gap: 6,
                border: "none",
                cursor: "pointer"
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
                gap: 6,
                border: "none",
                cursor: "pointer"
              }}
            >
              <CheckCircle2 size={15} />
              <span>Mark as Served</span>
            </button>
          )}

          {/* Cash Counter Manual Settlement (if customer requested Pay at Counter and not yet settled) */}
          {!isSettled && isPayAtCounter && (
            <button
              onClick={() => onUpdateStatus(order.id, "settled", {
                paymentStatus: "paid_counter",
                paymentMethod: "cash",
                settledBy: "Counter Admin (Cash)",
                settledMethod: "cash_counter",
                settledAt: new Date().toISOString()
              })}
              style={{
                flex: 1,
                backgroundColor: "#b45309",
                color: "#ffffff",
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
                gap: 6,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(180, 83, 9, 0.25)"
              }}
              title="Collect cash at counter and manually settle this bill"
            >
              <Building2 size={15} />
              <span>Settle Bill (Cash Received)</span>
            </button>
          )}

          {/* If served, not settled, and not already showing counter button above */}
          {!isSettled && isServed && !isPayAtCounter && (
            <button
              onClick={() => onUpdateStatus(order.id, "settled", {
                paymentStatus: "paid_counter",
                paymentMethod: "cash",
                settledBy: "Counter Admin (Cash)",
                settledMethod: "cash_counter",
                settledAt: new Date().toISOString()
              })}
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
                gap: 6,
                border: "none",
                cursor: "pointer"
              }}
            >
              <CheckCircle2 size={15} />
              <span>Settle Bill & Close (Counter)</span>
            </button>
          )}

          {isSettled && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "6px 10px",
                borderRadius: 4,
                backgroundColor: isPaidOnline || order.settledMethod === "upi_online" ? "#dcfce7" : "#fef3c7",
                color: isPaidOnline || order.settledMethod === "upi_online" ? "#15803d" : "#92400e",
                fontSize: 11.5,
                fontFamily: "var(--font-serif)",
                fontWeight: 700
              }}>
                <CheckCircle2 size={13} />
                <span>
                  {isPaidOnline || order.settledMethod === "upi_online"
                    ? "✓ Settled Automatically • Paid Online via UPI"
                    : "✓ Settled Manually • Cash at Counter"}
                </span>
              </div>

              <button
                onClick={() => setIsInvoiceOpen(true)}
                style={{
                  width: "100%",
                  backgroundColor: "#fff",
                  color: "var(--color-ink)",
                  border: "1.2px solid var(--color-border-frame)",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-pill)",
                  fontFamily: "var(--font-serif)",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  cursor: "pointer"
                }}
              >
                <Receipt size={14} />
                <span>View Digital Bill</span>
              </button>
            </div>
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
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Reject
            </button>
          )}
        </div>
      </div>

      {/* Invoice Modal for Admin Inspection */}
      <DigitalInvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        order={order}
      />
    </div>
  );
}
