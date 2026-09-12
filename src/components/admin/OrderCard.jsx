import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  ChefHat,
  AlertCircle,
  Receipt,
  Smartphone,
  Building2,
  X,
  PlusCircle,
  Sparkles
} from "lucide-react";
import DigitalInvoiceModal from "../customer/DigitalInvoiceModal";
import { acceptOrderAddition, rejectOrderAddition } from "../../firebase/services";

function formatTimeAgo(dateString) {
  if (!dateString) return "Just now";
  const diffSec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diffSec < 45) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  return `${diffHours}h ago`;
}

export default function OrderCard({
  order,
  onUpdateStatus,
  onAcceptAddition,
  onRejectAddition
}) {
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const isPlaced = order.status === "placed";
  const isPreparing = order.status === "preparing";
  const isServed = order.status === "served";
  const isSettled = order.status === "settled";

  const isPaidOnline = order.paymentStatus === "paid_online";
  const isPayAtCounter = order.paymentStatus === "pay_at_counter" || Boolean(order.billRequested);
  const utr = order.paymentDetails?.utr;

  // Identify if this order has an addition awaiting staff review / action
  const pendingAddition =
    order.pendingAddition && order.pendingAddition.status !== "accepted" && order.pendingAddition.status !== "rejected"
      ? order.pendingAddition
      : order.status === "placed" && order.additions && order.additions.length > 0 && order.additions[order.additions.length - 1].status !== "accepted"
      ? order.additions[order.additions.length - 1]
      : null;

  const hasPendingAddition = Boolean(pendingAddition && pendingAddition.items && pendingAddition.items.length > 0);
  const [isAdditionModalOpen, setIsAdditionModalOpen] = useState(true);
  const [isProcessingAddition, setIsProcessingAddition] = useState(false);

  // Automatically pop up on the table card whenever a new addition arrives
  useEffect(() => {
    if (hasPendingAddition) {
      setIsAdditionModalOpen(true);
    }
  }, [order.pendingAddition?.id, order.lastItemAddedAt]);

  const activeAdditionItems = pendingAddition?.items || [];
  const additionTotal =
    pendingAddition?.amount ||
    activeAdditionItems.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
  const additionNotes = pendingAddition?.notes || "";

  const handleAcceptAddition = async () => {
    setIsProcessingAddition(true);
    try {
      if (onAcceptAddition) {
        await onAcceptAddition(order.id, pendingAddition?.id);
      } else {
        await acceptOrderAddition(order.id, pendingAddition?.id);
      }
      setIsAdditionModalOpen(false);
    } catch (err) {
      console.error("Failed to accept addition:", err);
    } finally {
      setIsProcessingAddition(false);
    }
  };

  const handleRejectAddition = async () => {
    const summaryText =
      activeAdditionItems.map((i) => `${i.quantity || 1}× ${i.name}`).join(", ") || "these items";
    if (
      !confirm(
        `Reject addition (${summaryText}) from Table #${order.tableNumber}? These items will be removed from the table's total bill.`
      )
    ) {
      return;
    }
    setIsProcessingAddition(true);
    try {
      if (onRejectAddition) {
        await onRejectAddition(order.id, pendingAddition?.id);
      } else {
        await rejectOrderAddition(order.id, pendingAddition?.id);
      }
      setIsAdditionModalOpen(false);
    } catch (err) {
      console.error("Failed to reject addition:", err);
    } finally {
      setIsProcessingAddition(false);
    }
  };

  return (
    <div style={{
      position: "relative",
      backgroundColor: "#ffffff",
      borderRadius: 6,
      border: hasPendingAddition ? "2.5px solid var(--color-bronze)" : isPlaced ? "2px solid var(--color-bronze)" : "1.5px solid var(--color-border-frame)",
      boxShadow: hasPendingAddition ? "0 8px 24px rgba(138, 87, 56, 0.22)" : "var(--shadow-sheet)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    }}>
      {/* 1. Interactive Addition Pop-up Overlay right on the table card */}
      {hasPendingAddition && isAdditionModalOpen && (
        <div
          className="animate-fade-in"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 35,
            backgroundColor: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(4px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "16px",
            boxSizing: "border-box",
            borderRadius: 6,
            border: "2px solid var(--color-bronze)",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.25)"
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1.5px dashed var(--color-border-frame)", paddingBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                backgroundColor: "var(--color-bronze)",
                color: "#fff",
                borderRadius: "50%",
                width: 30,
                height: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                fontWeight: 800,
                flexShrink: 0
              }}>
                🔔
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: 14, fontWeight: 800, color: "var(--color-ink)", letterSpacing: 0.5 }}>
                  TABLE #{order.tableNumber} — NEW ITEM ADDED!
                </div>
                <div style={{ fontSize: 11, fontFamily: "var(--font-serif)", color: "var(--color-bronze)", fontStyle: "italic" }}>
                  Customer ordered more dishes for kitchen
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsAdditionModalOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--color-bronze)",
                cursor: "pointer",
                padding: "4px 8px",
                fontSize: 12,
                fontFamily: "var(--font-serif)",
                fontWeight: 600,
                textDecoration: "underline"
              }}
              title="Minimize to view previous dishes"
            >
              Minimize
            </button>
          </div>

          {/* Body: Added items itemized */}
          <div style={{ flex: 1, padding: "12px 0", overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{
              backgroundColor: "#fdf8f3",
              border: "1.2px solid #fed7aa",
              borderRadius: 6,
              padding: "12px 14px"
            }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.5, color: "var(--color-bronze-dark)", textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={14} color="var(--color-bronze)" />
                <span>Newly Added Items:</span>
              </div>
              {activeAdditionItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    fontSize: 13.5,
                    fontFamily: "var(--font-serif)",
                    padding: "4px 0",
                    borderBottom: idx < activeAdditionItems.length - 1 ? "1px dashed #fed7aa" : "none"
                  }}
                >
                  <span style={{ fontWeight: 700, color: "var(--color-ink)" }}>
                    {item.quantity || 1}× {item.name}
                  </span>
                  <span style={{ fontWeight: 600, color: "var(--color-bronze-dark)" }}>
                    Rs.{(Number(item.price) || 0) * (Number(item.quantity) || 1)}
                  </span>
                </div>
              ))}
              {additionNotes && (
                <div style={{ fontSize: 12, fontStyle: "italic", color: "var(--color-bronze-dark)", marginTop: 8, paddingTop: 6, borderTop: "1px dashed #fed7aa" }}>
                  Note: "{additionNotes}"
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 4px" }}>
              <span style={{ fontSize: 12.5, fontFamily: "var(--font-serif)", color: "var(--color-bronze)" }}>Addition Amount:</span>
              <strong style={{ fontSize: 15, color: "#15803d" }}>+Rs.{additionTotal}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 4px", borderTop: "1.2px solid var(--color-border-frame)" }}>
              <span style={{ fontSize: 13, fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--color-ink)" }}>Updated Total Table Bill:</span>
              <strong style={{ fontSize: 18, color: "var(--color-ink)" }}>Rs.{order.total}</strong>
            </div>
          </div>

          {/* Actions: Accept & Prepare / Reject Addition */}
          <div style={{ display: "flex", gap: 10, paddingTop: 8, borderTop: "1.2px solid var(--color-border-frame)" }}>
            <button
              onClick={handleAcceptAddition}
              disabled={isProcessingAddition}
              style={{
                flex: 2,
                backgroundColor: "var(--color-bronze)",
                color: "#fff",
                border: "none",
                padding: "11px 14px",
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
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(138, 87, 56, 0.3)"
              }}
            >
              <ChefHat size={16} />
              <span>{isProcessingAddition ? "Processing..." : "Accept & Prepare"}</span>
            </button>

            <button
              onClick={handleRejectAddition}
              disabled={isProcessingAddition}
              style={{
                flex: 1,
                backgroundColor: "#fff",
                color: "#dc2626",
                border: "1.5px solid #dc2626",
                padding: "11px 12px",
                borderRadius: "var(--radius-pill)",
                fontFamily: "var(--font-serif)",
                fontSize: 12.5,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                cursor: "pointer"
              }}
            >
              <X size={15} />
              <span>Reject</span>
            </button>
          </div>
        </div>
      )}

      {/* Header: Table Number & Time */}
      <div style={{
        padding: "12px 16px",
        backgroundColor: hasPendingAddition ? "#FEF3C7" : isPlaced ? "#FDF8F3" : isPreparing ? "#F0F5FA" : isServed ? "#F2FAF4" : "#F7F3EB",
        borderBottom: "1.2px solid var(--color-border-frame)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            backgroundColor: hasPendingAddition ? "#b45309" : isPlaced ? "var(--color-bronze)" : isPreparing ? "#2563eb" : isServed ? "#15803d" : "#444",
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
            backgroundColor: hasPendingAddition ? "#fed7aa" : isPlaced ? "#fee2e2" : isPreparing ? "#dbeafe" : isServed ? "#dcfce7" : "#e5e7eb",
            color: hasPendingAddition ? "#9a3412" : isPlaced ? "#dc2626" : isPreparing ? "#1d4ed8" : isServed ? "#15803d" : "#374151"
          }}>
            {hasPendingAddition ? "● Item Added" : isPlaced ? "● New Order" : order.status}
          </span>
        </div>
      </div>

      {/* Minimized Addition Review Banner */}
      {hasPendingAddition && !isAdditionModalOpen && (
        <div style={{
          backgroundColor: "#fff7ed",
          borderBottom: "1.5px solid #f97316",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontFamily: "var(--font-serif)", fontWeight: 700, color: "#c2410c" }}>
            <PlusCircle size={14} />
            <span>New Item Added: {order.lastAdditionSummary || activeAdditionItems.map(i => `${i.quantity || 1}× ${i.name}`).join(", ")}</span>
          </div>
          <button
            onClick={() => setIsAdditionModalOpen(true)}
            style={{
              backgroundColor: "#c2410c",
              color: "#fff",
              border: "none",
              padding: "4px 12px",
              borderRadius: "var(--radius-pill)",
              fontSize: 11,
              fontFamily: "var(--font-serif)",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 1px 4px rgba(194, 65, 12, 0.25)"
            }}
          >
            Review Addition
          </button>
        </div>
      )}

      {/* Item Added Badge (if addition already accepted) */}
      {!hasPendingAddition && order.lastAdditionSummary && (
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
          {/* Initial Placed Order: Accept & Prepare + Reject side-by-side */}
          {isPlaced && !hasPendingAddition && (
            <div style={{ display: "flex", gap: 8, width: "100%" }}>
              <button
                onClick={() => onUpdateStatus(order.id, "preparing")}
                style={{
                  flex: 2,
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

              <button
                onClick={() => {
                  if (confirm(`Reject/Cancel order for Table #${order.tableNumber}?`)) {
                    onUpdateStatus(order.id, "cancelled");
                  }
                }}
                style={{
                  flex: 1,
                  backgroundColor: "#fff",
                  border: "1.5px solid #dc2626",
                  color: "#dc2626",
                  padding: "9px 12px",
                  borderRadius: "var(--radius-pill)",
                  fontFamily: "var(--font-serif)",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  cursor: "pointer"
                }}
              >
                <X size={14} />
                <span>Reject</span>
              </button>
            </div>
          )}

          {/* Addition Pending Action: Review & Accept Button */}
          {isPlaced && hasPendingAddition && !isAdditionModalOpen && (
            <button
              onClick={() => setIsAdditionModalOpen(true)}
              style={{
                flex: 1,
                backgroundColor: "var(--color-bronze)",
                color: "#fff",
                padding: "10px 14px",
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
                boxShadow: "0 2px 6px rgba(138, 87, 56, 0.3)"
              }}
            >
              <ChefHat size={15} />
              <span>Review & Accept Addition</span>
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
