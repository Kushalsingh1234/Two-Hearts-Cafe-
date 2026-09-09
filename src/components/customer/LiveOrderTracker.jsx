import React from "react";
import { CheckCircle2, Clock, X, ChefHat } from "lucide-react";

const STATUS_STEPS = [
  { key: "placed", title: "Order Placed", desc: "Received at kitchen counter" },
  { key: "preparing", title: "Cooking in Kitchen", desc: "Freshly preparing your order" },
  { key: "served", title: "Served at Table", desc: "Delivered to your table. Enjoy!" },
  { key: "settled", title: "Bill Settled", desc: "Thank you for visiting Two Hearts!" }
];

export default function LiveOrderTracker({ isOpen, onClose, orders, tableNumber }) {
  if (!isOpen) return null;

  const tableOrders = (orders || []).filter(
    (ord) => String(ord.tableNumber) === String(tableNumber)
  );

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
                      <span>Total</span>
                      <span>Rs.{ord.total}</span>
                    </div>
                  </div>
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
    </div>
  );
}
