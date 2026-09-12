import React, { useState } from "react";
import { CheckCircle2, Clock, X, ChefHat, Receipt, Smartphone, Building2, Star } from "lucide-react";
import PaymentModal from "./PaymentModal";
import DigitalInvoiceModal from "./DigitalInvoiceModal";
import TableReviewModal from "./TableReviewModal";

const STATUS_STEPS = [
  { key: "placed", title: "Order Placed", desc: "Received at kitchen counter" },
  { key: "preparing", title: "Cooking in Kitchen", desc: "Freshly preparing your order" },
  { key: "served", title: "Served at Table", desc: "Delivered to your table. Enjoy!" },
  { key: "settled", title: "Bill Settled", desc: "Thank you for visiting Two Hearts!" }
];

export default function LiveOrderTracker({ isOpen, onClose, orders, tableNumber }) {
  const [activePaymentOrder, setActivePaymentOrder] = useState(null);
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState(null);
  const [activeReviewOrder, setActiveReviewOrder] = useState(null);

  if (!isOpen) return null;

  const getSessionOrderIds = () => {
    try {
      const raw = sessionStorage.getItem(`twohearts_table_${tableNumber}_session_orders`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const sessionOrderIds = getSessionOrderIds();

  // Filter orders for this table:
  // - MUST match tableNumber
  // - Active in-kitchen orders (placed, preparing, served)
  // - Settled orders are ONLY shown to the device that placed them in this session (< 30 mins)
  // Prevents past settled orders of previous dining parties from ever appearing to new customers!
  const tableOrders = (orders || []).filter((ord) => {
    if (String(ord.tableNumber) !== String(tableNumber)) return false;

    if (ord.status === "placed" || ord.status === "preparing" || ord.status === "served") {
      if (sessionOrderIds.length > 0) {
        return sessionOrderIds.includes(ord.id);
      }
      const ageMs = Date.now() - (ord.timestamp || (ord.createdAt ? new Date(ord.createdAt).getTime() : 0));
      return ageMs < 45 * 60 * 1000;
    }

    if (ord.status === "settled") {
      let isAllowed = sessionOrderIds.includes(ord.id);
      if (!isAllowed) {
        try {
          const lastSettledId = localStorage.getItem(`twohearts_table_${tableNumber}_last_settled_id`);
          if (lastSettledId === ord.id) isAllowed = true;
        } catch {}
      }
      if (!isAllowed) return false;
      const settledTime = ord.settledAt ? new Date(ord.settledAt).getTime() : (ord.timestamp || 0);
      const settledAgeMs = Date.now() - settledTime;
      return settledAgeMs < 30 * 60 * 1000;
    }

    return false;
  });

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 70,
      backgroundColor: "rgba(28, 25, 23, 0.6)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16
    }}>
      <div
        className="animate-fade-in"
        style={{
          width: "100%",
          maxWidth: 480,
          backgroundColor: "#FAF7F2",
          borderRadius: 4,
          border: "2px solid var(--color-border-frame)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "var(--shadow-floating)"
        }}
      >
        {/* Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1.5px solid var(--color-border-frame)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#FAF7F2"
        }}>
          <div>
            <div style={{
              fontFamily: "var(--font-script)",
              fontSize: 24,
              color: "var(--color-bronze)",
              lineHeight: 1
            }}>
              Two Hearts Cafe
            </div>
            <h3 style={{
              fontFamily: "var(--font-serif)",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--color-ink)",
              marginTop: 2
            }}>
              Table #{tableNumber} Live Status
            </h3>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "#fff",
              border: "1px solid var(--color-border-frame)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-ink)"
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: 20,
          overflowY: "auto",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 16
        }}>
          {tableOrders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 10px" }}>
              <ChefHat size={36} style={{ color: "var(--color-bronze)", marginBottom: 10 }} />
              <h4 style={{ fontFamily: "var(--font-serif)", fontSize: 18, color: "var(--color-ink)" }}>
                No active orders for Table #{tableNumber}
              </h4>
              <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 14, color: "var(--color-bronze)" }}>
                Select dishes from the menu to send your first order to the kitchen.
              </p>
            </div>
          ) : (
            tableOrders.map((ord) => {
              const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === ord.status);
              const activeIdx = currentStepIdx === -1 ? 0 : currentStepIdx;

              return (
                <div
                  key={ord.id}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 4,
                    padding: 16,
                    border: "1.2px solid var(--color-border-frame)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14
                  }}
                >
                  {/* Order Top Meta */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px dashed var(--color-border-subtle)",
                    paddingBottom: 8
                  }}>
                    <div>
                      <span style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 16,
                        fontWeight: 700,
                        color: "var(--color-ink)"
                      }}>
                        Order #{ord.orderNumber || ord.id.slice(0, 6)}
                      </span>
                      <div style={{
                        fontSize: 11,
                        fontFamily: "var(--font-serif)",
                        fontStyle: "italic",
                        color: "var(--color-bronze)"
                      }}>
                        Placed at {new Date(ord.createdAt || ord.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>

                    <span style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      padding: "3px 10px",
                      borderRadius: "var(--radius-pill)",
                      border: "1px solid var(--color-border-frame)",
                      backgroundColor: ord.status === "served" ? "#dcfce7" : "#F0E6DA",
                      color: ord.status === "served" ? "#15803d" : "var(--color-bronze-dark)"
                    }}>
                      {ord.status}
                    </span>
                  </div>

                  {/* Stepper */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {STATUS_STEPS.map((step, idx) => {
                      const isComplete = activeIdx >= idx;
                      const isCurrent = activeIdx === idx;

                      return (
                        <div key={step.key} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <div style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: isComplete ? "var(--color-bronze)" : "#e5e7eb",
                            color: isComplete ? "#fff" : "#999",
                            fontSize: 11,
                            fontWeight: 700,
                            flexShrink: 0
                          }}>
                            {isComplete ? <CheckCircle2 size={14} /> : idx + 1}
                          </div>

                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontFamily: "var(--font-serif)",
                              fontSize: 14,
                              fontWeight: isCurrent ? 700 : 500,
                              color: isComplete ? "var(--color-ink)" : "#999"
                            }}>
                              {step.title}
                            </div>
                            <div style={{
                              fontFamily: "var(--font-serif)",
                              fontStyle: "italic",
                              fontSize: 12,
                              color: "var(--color-bronze)"
                            }}>
                              {step.desc}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Items List */}
                  <div style={{
                    backgroundColor: "#FAF7F2",
                    padding: 10,
                    borderRadius: 2,
                    border: "1px solid var(--color-border-subtle)"
                  }}>
                    {ord.items?.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontFamily: "var(--font-serif)",
                          fontSize: 14,
                          padding: "3px 0"
                        }}
                      >
                        <span>
                          <strong>{item.quantity}×</strong> {item.name}
                        </span>
                        <span style={{ fontWeight: 600 }}>Rs.{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontFamily: "var(--font-serif)",
                      fontSize: 15,
                      fontWeight: 800,
                      marginTop: 6,
                      paddingTop: 6,
                      borderTop: "1px dashed var(--color-border-subtle)"
                    }}>
                      <span>Total Bill</span>
                      <span>Rs.{ord.total}</span>
                    </div>

                    {Boolean(ord.additions?.some((a) => a.status === "rejected")) && (
                      <div style={{
                        marginTop: 8,
                        padding: "7px 10px",
                        backgroundColor: "#FEF2F2",
                        border: "1px solid #FECACA",
                        borderRadius: 4,
                        fontSize: 12,
                        color: "#991B1B",
                        fontFamily: "var(--font-serif)",
                        lineHeight: 1.4
                      }}>
                        ℹ️ <strong>Kitchen note:</strong> An additional item added later could not be prepared (e.g. out of ingredients) and was removed from the bill. Your main accepted order is actively being prepared!
                      </div>
                    )}
                  </div>

                  {/* Payment & Invoice Action Area */}
                  {ord.status === "settled" ? (
                    <div style={{
                      backgroundColor: "#F2FAF4",
                      border: "1.2px solid #86efac",
                      borderRadius: 4,
                      padding: "12px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      alignItems: "center",
                      textAlign: "center"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#15803d", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-serif)" }}>
                        <CheckCircle2 size={16} />
                        <span>Bill Settled & Closed</span>
                      </div>
                      <div style={{ fontSize: 12, fontStyle: "italic", color: "var(--color-bronze)", fontFamily: "var(--font-serif)" }}>
                        Your paperless digital tax invoice is ready.
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", width: "100%" }}>
                        <button
                          onClick={() => setActiveInvoiceOrder(ord)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 16px",
                            borderRadius: "var(--radius-pill)",
                            backgroundColor: "var(--color-ink)",
                            color: "#FAF7F2",
                            border: "none",
                            fontFamily: "var(--font-serif)",
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: 0.5,
                            textTransform: "uppercase",
                            cursor: "pointer",
                            boxShadow: "var(--shadow-sm)"
                          }}
                        >
                          <Receipt size={14} />
                          <span>View Invoice</span>
                        </button>

                        <button
                          onClick={() => setActiveReviewOrder(ord)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 16px",
                            borderRadius: "var(--radius-pill)",
                            backgroundColor: ord.hasReview || ord.review ? "#FAF7F2" : "#8A5738",
                            color: ord.hasReview || ord.review ? "var(--color-ink)" : "#FFFFFF",
                            border: "1.5px solid var(--color-bronze)",
                            fontFamily: "var(--font-serif)",
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: 0.5,
                            textTransform: "uppercase",
                            cursor: "pointer",
                            boxShadow: "var(--shadow-sm)"
                          }}
                        >
                          <Star size={14} fill={ord.hasReview || ord.review ? "#F59E0B" : "#FFFFFF"} color={ord.hasReview || ord.review ? "#F59E0B" : "#FFFFFF"} />
                          <span>{ord.hasReview || ord.review ? `Rated (${ord.review?.overallRating || 5}★)` : "Rate Meal & Dishes"}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {/* Current Payment Status Banner */}
                      {ord.paymentStatus === "paid_online" ? (
                        <div style={{
                          backgroundColor: "#F2FAF4",
                          border: "1px solid #86efac",
                          borderRadius: 4,
                          padding: "8px 12px",
                          fontSize: 12,
                          fontFamily: "var(--font-serif)",
                          color: "#15803d",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <CheckCircle2 size={14} />
                            <span>Paid Online via UPI ({ord.paymentDetails?.upiId || "Q327979600@ybl"}){ord.paymentDetails?.utr ? ` • Ref: ${ord.paymentDetails.utr}` : ""}</span>
                          </div>
                          <span style={{ fontSize: 11, fontStyle: "italic", color: "var(--color-bronze)" }}>Verifying</span>
                        </div>
                      ) : ord.paymentStatus === "pay_at_counter" ? (
                        <div style={{
                          backgroundColor: "#FFFBEB",
                          border: "1px solid #fde68a",
                          borderRadius: 4,
                          padding: "8px 12px",
                          fontSize: 12,
                          fontFamily: "var(--font-serif)",
                          color: "#92400e",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Building2 size={14} />
                            <span>Pay at Counter Requested</span>
                          </div>
                          <button
                            onClick={() => setActivePaymentOrder(ord)}
                            style={{ background: "transparent", border: "none", color: "var(--color-bronze)", textDecoration: "underline", fontSize: 11, cursor: "pointer", fontFamily: "var(--font-serif)" }}
                          >
                            Pay Online instead
                          </button>
                        </div>
                      ) : null}

                      {/* Pay Online / Settle Bill Button */}
                      {ord.paymentStatus !== "paid_online" && (
                        <button
                          onClick={() => setActivePaymentOrder(ord)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            padding: "11px 16px",
                            borderRadius: "var(--radius-pill)",
                            backgroundColor: "var(--color-bronze)",
                            color: "#ffffff",
                            border: "none",
                            fontFamily: "var(--font-serif)",
                            fontSize: 13,
                            fontWeight: 700,
                            letterSpacing: 0.5,
                            textTransform: "uppercase",
                            cursor: "pointer",
                            boxShadow: "var(--shadow-sm)"
                          }}
                        >
                          <Smartphone size={15} />
                          <span>Pay Rs.{ord.total} Online or at Counter</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: 14,
          borderTop: "1.5px solid var(--color-border-frame)",
          backgroundColor: "#FAF7F2",
          display: "flex",
          justifyContent: "flex-end"
        }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: "var(--color-ink)",
              color: "#FAF7F2",
              padding: "8px 18px",
              borderRadius: "var(--radius-pill)",
              fontFamily: "var(--font-serif)",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase"
            }}
          >
            Back to Menu
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={Boolean(activePaymentOrder)}
        order={activePaymentOrder}
        onClose={() => setActivePaymentOrder(null)}
        onPaymentSuccess={(settledOrd) => {
          if (settledOrd?.id) {
            try {
              localStorage.setItem(`twohearts_table_${tableNumber}_last_settled_id`, settledOrd.id);
            } catch {}
          }
        }}
        onOpenInvoice={(ord) => {
          setActivePaymentOrder(null);
          setActiveInvoiceOrder(ord || activePaymentOrder);
        }}
        onOpenReview={(ord) => {
          setActivePaymentOrder(null);
          setActiveReviewOrder(ord || activePaymentOrder);
        }}
      />

      {/* Digital Paperless Invoice Modal */}
      <DigitalInvoiceModal
        isOpen={Boolean(activeInvoiceOrder)}
        order={activeInvoiceOrder}
        onClose={() => setActiveInvoiceOrder(null)}
        onOpenReview={(ord) => {
          setActiveInvoiceOrder(null);
          setActiveReviewOrder(ord);
        }}
      />

      {/* Table & Dish Review Modal */}
      <TableReviewModal
        isOpen={Boolean(activeReviewOrder)}
        order={activeReviewOrder}
        onClose={() => setActiveReviewOrder(null)}
      />
    </div>
  );
}
