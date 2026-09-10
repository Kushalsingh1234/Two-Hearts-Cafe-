import React from "react";
import {
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  Bike,
  Store
} from "lucide-react";
import { useOnlineOrder } from "../../context/OnlineOrderContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { DISH_PHOTOS, getDishPhoto } from "../marketing/MarketingData";

export default function CartDrawer({ isOpen, onClose, onNavigate }) {
  const { isLoggedIn, openAuthModal } = useCustomerAuth();
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    deliveryFee,
    taxes,
    total,
    deliveryType,
    setDeliveryType,
    FREE_DELIVERY_THRESHOLD
  } = useOnlineOrder();

  if (!isOpen) return null;

  const amountNeededForFree = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const freeProgress = Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100));

  const handleCheckoutClick = () => {
    onClose();
    if (isLoggedIn) {
      onNavigate("checkout");
    } else {
      openAuthModal(() => onNavigate("checkout"));
    }
  };

  const handleFullCartClick = () => {
    onClose();
    onNavigate("cart");
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      display: "flex",
      justifyContent: "flex-end"
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(28, 25, 23, 0.45)",
          backdropFilter: "blur(6px)",
          transition: "opacity 0.25s ease"
        }}
      />

      {/* Drawer Panel */}
      <div
        className="animate-fade-in"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 440,
          height: "100%",
          backgroundColor: "#FFFFFF",
          boxShadow: "-8px 0 30px rgba(28, 25, 23, 0.15)",
          display: "flex",
          flexDirection: "column",
          zIndex: 2
        }}
      >
        {/* Drawer Header */}
        <div style={{
          padding: "18px 20px",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "var(--bg-app)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "var(--color-bronze-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-bronze)"
            }}>
              <ShoppingBag size={16} />
            </div>
            <div>
              <h3 style={{
                fontFamily: "var(--font-serif)",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--color-ink)",
                margin: 0
              }}>
                Delivery Basket
              </h3>
              <span style={{ fontSize: 11, color: "var(--color-bronze)", fontFamily: "var(--font-serif)", fontWeight: 600 }}>
                {cart.reduce((a, b) => a + b.quantity, 0)} items added
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                style={{
                  fontSize: 11,
                  color: "#991B1B",
                  fontFamily: "var(--font-serif)",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "4px 8px"
                }}
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: "#FFFFFF",
                border: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-ink)",
                cursor: "pointer"
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Free Delivery Bar */}
        {cart.length > 0 && deliveryType === "delivery" && (
          <div style={{
            padding: "10px 18px",
            backgroundColor: amountNeededForFree === 0 ? "rgba(240, 253, 244, 0.9)" : "rgba(245, 239, 230, 0.6)",
            borderBottom: "1px solid var(--border-color)",
            fontSize: 12
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: amountNeededForFree === 0 ? "#16A34A" : "var(--color-ink)" }}>
                {amountNeededForFree === 0
                  ? "FREE Delivery Unlocked 🎉"
                  : `Add ₹${amountNeededForFree} for FREE delivery`}
              </span>
              <span style={{ fontSize: 11, color: "var(--color-bronze)", fontWeight: 700 }}>
                {freeProgress}%
              </span>
            </div>
            <div style={{
              width: "100%",
              height: 4,
              backgroundColor: "rgba(220, 212, 200, 0.5)",
              borderRadius: 2,
              overflow: "hidden"
            }}>
              <div style={{
                width: `${freeProgress}%`,
                height: "100%",
                backgroundColor: amountNeededForFree === 0 ? "#16A34A" : "var(--color-bronze)",
                transition: "width 0.3s ease"
              }} />
            </div>
          </div>
        )}

        {/* Cart Body */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 12
        }}>
          {cart.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "48px 16px",
              color: "var(--color-ink-soft)"
            }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: "var(--bg-app)",
                margin: "0 auto 16px auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-bronze)"
              }}>
                <ShoppingBag size={28} />
              </div>
              <h4 style={{ fontFamily: "var(--font-serif)", fontSize: 18, color: "var(--color-ink)", marginBottom: 6 }}>
                Your Basket is Empty
              </h4>
              <p style={{ fontSize: 13, color: "var(--color-ink-soft)", lineHeight: 1.5, marginBottom: 20 }}>
                Explore our menu to add artisanal pastas, crispy burgers, and comforting maggie bowls.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="btn-pill-black"
                style={{ padding: "10px 22px", fontSize: 12 }}
              >
                Browse Menu
              </button>
            </div>
          ) : (
            cart.map((item) => {
              const photoUrl = getDishPhoto(item);

              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--bg-app)",
                    border: "1px solid var(--border-color)"
                  }}
                >
                  <img
                    src={photoUrl}
                    alt={item.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/images/dishes/penne_arabiata.jpg";
                    }}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "var(--radius-sm)",
                      objectFit: "cover",
                      flexShrink: 0
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h5 style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--color-ink)",
                      margin: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      {item.name}
                    </h5>
                    <span style={{ fontSize: 12, color: "var(--color-bronze)", fontWeight: 600 }}>
                      ₹{item.price}
                    </span>
                    {item.specialInstructions && (
                      <div style={{ fontSize: 10, color: "var(--color-ink-soft)", fontStyle: "italic", marginTop: 2 }}>
                        "{item.specialInstructions}"
                      </div>
                    )}
                  </div>

                  {/* Stepper */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: "#FFFFFF",
                    border: "1px solid var(--color-ink)",
                    borderRadius: "var(--radius-pill)",
                    padding: "2px 6px"
                  }}>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        width: 18,
                        height: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--color-ink)"
                      }}
                    >
                      <Minus size={10} />
                    </button>
                    <span style={{ fontSize: 12, fontWeight: 700, minWidth: 14, textAlign: "center" }}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      style={{
                        width: 18,
                        height: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--color-ink)"
                      }}
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        {cart.length > 0 && (
          <div style={{
            padding: "18px 20px",
            borderTop: "1px solid var(--border-color)",
            backgroundColor: "#FFFFFF"
          }}>
            {/* Delivery/Pickup toggle mini */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
              fontSize: 12
            }}>
              <span style={{ color: "var(--color-ink-soft)", fontWeight: 600 }}>Fulfillment:</span>
              <div style={{
                display: "inline-flex",
                backgroundColor: "var(--bg-app)",
                borderRadius: "var(--radius-pill)",
                padding: 2,
                border: "1px solid var(--border-color)"
              }}>
                <button
                  type="button"
                  onClick={() => setDeliveryType("delivery")}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "var(--radius-pill)",
                    fontSize: 11,
                    fontWeight: deliveryType === "delivery" ? 700 : 500,
                    backgroundColor: deliveryType === "delivery" ? "var(--color-ink)" : "transparent",
                    color: deliveryType === "delivery" ? "#FFFFFF" : "var(--color-ink-soft)"
                  }}
                >
                  Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType("pickup")}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "var(--radius-pill)",
                    fontSize: 11,
                    fontWeight: deliveryType === "pickup" ? 700 : 500,
                    backgroundColor: deliveryType === "pickup" ? "var(--color-ink)" : "transparent",
                    color: deliveryType === "pickup" ? "#FFFFFF" : "var(--color-ink-soft)"
                  }}
                >
                  Pickup
                </button>
              </div>
            </div>

            {/* Bill mini */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: "var(--color-ink-soft)" }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>₹{subtotal}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: "var(--color-ink-soft)" }}>Delivery</span>
              <span>{deliveryFee === 0 ? <strong style={{ color: "#16A34A" }}>FREE</strong> : `₹${deliveryFee}`}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 12 }}>
              <span style={{ color: "var(--color-ink-soft)" }}>Taxes (5% GST)</span>
              <span>₹{taxes}</span>
            </div>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 16,
              fontWeight: 700,
              fontFamily: "var(--font-serif)",
              borderTop: "1px dashed var(--border-color)",
              paddingTop: 8,
              marginBottom: 16,
              color: "var(--color-ink)"
            }}>
              <span>Total</span>
              <span style={{ color: "var(--color-bronze-dark)" }}>₹{total}</span>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={handleFullCartClick}
                className="btn-pill-outline"
                style={{ flex: 1, padding: "10px", fontSize: 12 }}
              >
                View Full Cart
              </button>
              <button
                type="button"
                onClick={handleCheckoutClick}
                className="btn-pill-black"
                style={{ flex: 1.5, padding: "10px 14px", fontSize: 12 }}
              >
                <span>Checkout</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
