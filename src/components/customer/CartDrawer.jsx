import React, { useState } from "react";
import { X, Plus, Minus, Trash2, ArrowRight, ShieldCheck } from "lucide-react";

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  tableNumber,
  onUpdateQuantity,
  onRemoveItem,
  onPlaceOrder,
  isPlacing
}) {
  const [instructions, setInstructions] = useState("");

  if (!isOpen) return null;

  const total = cartItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const hasOutOfStockItem = cartItems.some((it) => it.isAvailable === false);

  const handleOrderSubmit = () => {
    if (hasOutOfStockItem) return;
    onPlaceOrder({
      tableNumber,
      items: cartItems,
      specialInstructions: instructions.trim(),
      subtotal: total,
      tax: 0,
      total
    });
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 60,
      backgroundColor: "rgba(28, 25, 23, 0.6)",
      backdropFilter: "blur(4px)",
      display: "flex",
      justifyContent: "flex-end"
    }}>
      <div
        className="animate-slide-up"
        style={{
          width: "100%",
          maxWidth: 460,
          backgroundColor: "#FAF7F2",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--shadow-floating)",
          borderLeft: "2px solid var(--color-border-frame)"
        }}
      >
        {/* Drawer Header */}
        <div style={{
          padding: "20px 22px",
          borderBottom: "1.5px solid var(--color-border-frame)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#FAF7F2"
        }}>
          <div>
            <div style={{
              fontFamily: "var(--font-script)",
              fontSize: 26,
              color: "var(--color-bronze)",
              lineHeight: 1
            }}>
              Two Hearts Cafe
            </div>
            <h2 style={{
              fontFamily: "var(--font-serif)",
              fontSize: 22,
              fontWeight: 700,
              color: "var(--color-ink)",
              marginTop: 2
            }}>
              Table #{tableNumber} Order
            </h2>
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

        {/* Drawer Content */}
        {cartItems.length === 0 ? (
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 30,
            textAlign: "center"
          }}>
            <h3 style={{
              fontFamily: "var(--font-serif)",
              fontSize: 20,
              fontWeight: 600,
              color: "var(--color-ink)",
              marginBottom: 8
            }}>
              Your order is currently empty
            </h3>
            <p style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: 14,
              color: "var(--color-bronze)",
              maxWidth: 240,
              marginBottom: 20
            }}>
              Browse our pasta, sandwiches, noodles, and maggie to select items.
            </p>
            <button
              onClick={onClose}
              style={{
                backgroundColor: "var(--color-ink)",
                color: "#FAF7F2",
                padding: "10px 24px",
                borderRadius: "var(--radius-pill)",
                fontFamily: "var(--font-serif)",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase"
              }}
            >
              Back to Menu
            </button>
          </div>
        ) : (
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "18px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 16
          }}>
            {/* List of Cart Items */}
            <div style={{
              backgroundColor: "#fff",
              borderRadius: 4,
              border: "1.2px solid var(--color-border-frame)",
              padding: "14px 16px"
            }}>
              {cartItems.map((item, idx) => (
                <div
                  key={item.cartItemId}
                  style={{
                    padding: "10px 0",
                    borderBottom: idx < cartItems.length - 1 ? "1px dashed var(--color-border-subtle)" : "none"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ flex: 1, paddingRight: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 700, color: "var(--color-ink)" }}>
                          {item.name}
                        </span>
                        {item.isAvailable === false && (
                          <span style={{
                            fontSize: 10,
                            fontFamily: "var(--font-serif)",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            color: "#dc2626",
                            backgroundColor: "#fee2e2",
                            border: "1px solid #fca5a5",
                            padding: "1px 6px",
                            borderRadius: "var(--radius-pill)"
                          }}>
                            Out of Stock
                          </span>
                        )}
                      </div>
                      {item.note && (
                        <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--color-bronze)", marginTop: 2 }}>
                          "{item.note}"
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => onRemoveItem(item.cartItemId)}
                      style={{ color: "#dc2626", padding: 2 }}
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Quantity and Price */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      border: "1px solid var(--color-border-frame)",
                      borderRadius: "var(--radius-pill)",
                      padding: "2px 8px",
                      backgroundColor: "#FAF7F2"
                    }}>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        style={{ color: "var(--color-ink)" }}
                      >
                        <Minus size={11} />
                      </button>
                      <span style={{ fontFamily: "var(--font-serif)", fontSize: 14, fontWeight: 700, minWidth: 16, textAlign: "center" }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        style={{ color: "var(--color-ink)" }}
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    <div style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 700, color: "var(--color-ink)" }}>
                      Rs.{item.price * item.quantity}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Special Instructions for Kitchen */}
            <div style={{
              backgroundColor: "#fff",
              borderRadius: 4,
              border: "1.2px solid var(--color-border-frame)",
              padding: 14
            }}>
              <label style={{
                fontFamily: "var(--font-serif)",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--color-ink)",
                letterSpacing: 0.5,
                textTransform: "uppercase",
                display: "block",
                marginBottom: 6
              }}>
                Special Request for Table
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Please bring water glasses, make maggie extra spicy..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 2,
                  border: "1px solid var(--color-border-subtle)",
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  fontSize: 14,
                  resize: "none",
                  outline: "none"
                }}
              />
            </div>

            {/* Pay at counter info */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 12px",
              backgroundColor: "#F0E6DA",
              border: "1px solid #D8C6B2",
              borderRadius: 4,
              fontFamily: "var(--font-serif)",
              fontSize: 13,
              color: "var(--color-bronze-dark)"
            }}>
              <ShieldCheck size={16} style={{ flexShrink: 0 }} />
              <div>
                <strong>Pay at Counter:</strong> Place order now; bill is settled when leaving.
              </div>
            </div>

            {/* Out of stock warning message */}
            {hasOutOfStockItem && (
              <div style={{
                backgroundColor: "#FEF2F2",
                border: "1.2px solid #FCA5A5",
                borderRadius: 4,
                padding: "10px 14px",
                fontSize: 12.5,
                fontFamily: "var(--font-serif)",
                color: "#991B1B",
                lineHeight: 1.4
              }}>
                <strong>⚠️ Out of Stock Alert:</strong> One or more items in your order are currently out of stock. Please remove them using the trash icon above to send your order to the kitchen.
              </div>
            )}

            {/* Total Amount */}
            <div style={{
              backgroundColor: "#fff",
              borderRadius: 4,
              border: "1.2px solid var(--color-border-frame)",
              padding: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline"
            }}>
              <span style={{
                fontFamily: "var(--font-serif)",
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase"
              }}>
                Total Bill
              </span>
              <span style={{
                fontFamily: "var(--font-serif)",
                fontSize: 22,
                fontWeight: 800,
                color: "var(--color-ink)"
              }}>
                Rs.{total}
              </span>
            </div>
          </div>
        )}

        {/* Drawer Footer */}
        {cartItems.length > 0 && (
          <div style={{
            padding: "16px 22px",
            borderTop: "1.5px solid var(--color-border-frame)",
            backgroundColor: "#FAF7F2"
          }}>
            <button
              onClick={handleOrderSubmit}
              disabled={isPlacing || hasOutOfStockItem}
              style={{
                width: "100%",
                backgroundColor: (isPlacing || hasOutOfStockItem) ? "#999" : "var(--color-ink)",
                color: "#FAF7F2",
                padding: "14px 20px",
                borderRadius: "var(--radius-pill)",
                fontFamily: "var(--font-serif)",
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                border: (isPlacing || hasOutOfStockItem) ? "1.5px solid #888" : "1.5px solid var(--color-bronze)",
                boxShadow: "var(--shadow-floating)",
                cursor: (isPlacing || hasOutOfStockItem) ? "not-allowed" : "pointer"
              }}
            >
              {isPlacing ? (
                <span>Sending to Kitchen...</span>
              ) : hasOutOfStockItem ? (
                <span>Remove Out of Stock Items to Order</span>
              ) : (
                <>
                  <span>Send Order to Kitchen • Rs.{total}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
