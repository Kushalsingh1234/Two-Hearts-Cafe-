import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Bike,
  Store,
  Info,
  Sparkles,
  MessageSquareQuote
} from "lucide-react";
import { useOnlineOrder } from "../../context/OnlineOrderContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { DISH_PHOTOS, getDishPhoto } from "../marketing/MarketingData";

export default function CartPage({ onNavigate }) {
  const { isLoggedIn, openAuthModal } = useCustomerAuth();
  const {
    cart,
    updateQuantity,
    removeFromCart,
    updateItemNotes,
    clearCart,
    subtotal,
    deliveryFee,
    taxes,
    total,
    FREE_DELIVERY_THRESHOLD,
    deliveryType,
    setDeliveryType,
    customerInfo,
    setCustomerInfo
  } = useOnlineOrder();

  const handleProceedToCheckout = () => {
    if (isLoggedIn) {
      onNavigate("checkout");
    } else {
      openAuthModal(() => onNavigate("checkout"));
    }
  };

  const [activeNoteItemId, setActiveNoteItemId] = useState(null);

  const amountNeededForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const freeDeliveryProgress = Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100));

  if (cart.length === 0) {
    return (
      <div style={{
        minHeight: "75vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 16px",
        backgroundColor: "var(--bg-app)"
      }}>
        <div className="bistro-card" style={{
          maxWidth: 480,
          width: "100%",
          padding: "48px 32px",
          textAlign: "center",
          backgroundColor: "#FFFFFF"
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "var(--color-bronze-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px auto",
            color: "var(--color-bronze)"
          }}>
            <ShoppingBag size={38} />
          </div>

          <h2 style={{
            fontFamily: "var(--font-serif)",
            fontSize: 28,
            fontWeight: 600,
            color: "var(--color-ink)",
            marginBottom: 10
          }}>
            Your Cart is Empty
          </h2>

          <p style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: 16,
            color: "var(--color-bronze)",
            lineHeight: 1.6,
            marginBottom: 28
          }}>
            "Good food is made to be shared. Explore our handcrafted pastas, toasted sandwiches, and steamy maggie bowls."
          </p>

          <button
            onClick={() => onNavigate("menu")}
            className="btn-pill-black"
            style={{ padding: "14px 32px", fontSize: 13, width: "100%" }}
          >
            <span>Explore Delicious Menu</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-section-tight" style={{
      minHeight: "100vh",
      backgroundColor: "var(--bg-app)",
      paddingTop: "clamp(32px, 5vw, 48px)",
      paddingBottom: 80
    }}>
      <div className="site-container">
        {/* Header bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 14
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => onNavigate("menu")}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                backgroundColor: "#FFFFFF",
                border: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-ink)",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              title="Back to Menu"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(24px, 4vw, 32px)",
                fontWeight: 600,
                color: "var(--color-ink)",
                margin: 0
              }}>
                Review Your Order
              </h1>
              <span style={{
                fontSize: 12,
                color: "var(--color-bronze)",
                fontFamily: "var(--font-serif)",
                fontWeight: 600
              }}>
                {cart.reduce((a, b) => a + b.quantity, 0)} handcrafted items in cart
              </span>
            </div>
          </div>

          <button
            onClick={clearCart}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "#991B1B",
              fontFamily: "var(--font-serif)",
              fontWeight: 600,
              backgroundColor: "rgba(254, 242, 242, 0.8)",
              padding: "6px 14px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              cursor: "pointer"
            }}
          >
            <Trash2 size={13} />
            <span>Clear Cart</span>
          </button>
        </div>

        {/* Delivery / Pickup Mode Selector */}
        <div className="bistro-card mobile-card-compact" style={{
          padding: "16px 20px",
          marginBottom: 24,
          backgroundColor: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16
        }}>
          <div>
            <span style={{
              fontSize: 11,
              fontFamily: "var(--font-serif)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1.2,
              color: "var(--color-bronze)",
              display: "block"
            }}>
              Order Fulfillment Mode
            </span>
            <span style={{ fontSize: 13, color: "var(--color-ink)", fontWeight: 600 }}>
              {deliveryType === "delivery"
                ? "Doorstep Delivery (Pillar 852 / Muradnagar)"
                : "Self Takeaway / Pickup at Two Hearts Cafe Counter"}
            </span>
          </div>

          <div style={{
            display: "inline-flex",
            backgroundColor: "var(--bg-app)",
            padding: 4,
            borderRadius: "var(--radius-pill)",
            border: "1px solid var(--border-color)"
          }}>
            <button
              onClick={() => setDeliveryType("delivery")}
              className="touch-target-44"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 18px",
                borderRadius: "var(--radius-pill)",
                fontSize: 12,
                fontWeight: deliveryType === "delivery" ? 700 : 500,
                fontFamily: "var(--font-serif)",
                backgroundColor: deliveryType === "delivery" ? "var(--color-ink)" : "transparent",
                color: deliveryType === "delivery" ? "#FFFFFF" : "var(--color-ink-soft)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                minHeight: 44
              }}
            >
              <Bike size={14} />
              <span>Delivery</span>
            </button>
            <button
              onClick={() => setDeliveryType("pickup")}
              className="touch-target-44"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 18px",
                borderRadius: "var(--radius-pill)",
                fontSize: 12,
                fontWeight: deliveryType === "pickup" ? 700 : 500,
                fontFamily: "var(--font-serif)",
                backgroundColor: deliveryType === "pickup" ? "var(--color-ink)" : "transparent",
                color: deliveryType === "pickup" ? "#FFFFFF" : "var(--color-ink-soft)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                minHeight: 44
              }}
            >
              <Store size={14} />
              <span>Takeaway</span>
            </button>
          </div>
        </div>

        {/* Free Delivery Threshold Bar (if delivery) */}
        {deliveryType === "delivery" && (
          <div className="bistro-card" style={{
            padding: "14px 18px",
            marginBottom: 24,
            backgroundColor: amountNeededForFreeDelivery === 0 ? "rgba(240, 253, 244, 0.95)" : "#FFFFFF",
            border: amountNeededForFreeDelivery === 0 ? "1px solid rgba(34, 197, 94, 0.4)" : "1px solid var(--border-color)"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
                <Sparkles size={15} color={amountNeededForFreeDelivery === 0 ? "#16A34A" : "var(--color-bronze)"} />
                <span>
                  {amountNeededForFreeDelivery === 0
                    ? "Congratulations! You've unlocked FREE Delivery 🎉"
                    : `Add ₹${amountNeededForFreeDelivery} more to enjoy FREE Delivery`}
                </span>
              </div>
              <span style={{ fontSize: 12, color: "var(--color-bronze)", fontFamily: "var(--font-serif)", fontWeight: 700 }}>
                {freeDeliveryProgress}%
              </span>
            </div>

            <div style={{
              width: "100%",
              height: 6,
              backgroundColor: "rgba(230, 223, 213, 0.5)",
              borderRadius: 3,
              overflow: "hidden"
            }}>
              <div style={{
                width: `${freeDeliveryProgress}%`,
                height: "100%",
                backgroundColor: amountNeededForFreeDelivery === 0 ? "#16A34A" : "var(--color-bronze)",
                transition: "width 0.3s ease"
              }} />
            </div>
          </div>
        )}

        {/* 2-Column Grid: Cart Items (Left) + Bill Summary (Right) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 28,
          alignItems: "flex-start"
        }}>
          {/* Left Column: Items List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {cart.map((item) => {
              const photoUrl = getDishPhoto(item);
              const isNoteOpen = activeNoteItemId === item.id;

              return (
                <div
                  key={item.id}
                  className="bistro-card mobile-card-compact"
                  style={{
                    padding: 16,
                    backgroundColor: "#FFFFFF",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    {/* Item Thumbnail */}
                    <img
                      src={photoUrl}
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/images/dishes/penne_arabiata.jpg";
                      }}
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: "var(--radius-sm)",
                        objectFit: "cover",
                        flexShrink: 0,
                        border: "1px solid var(--border-color)"
                      }}
                    />

                    {/* Name & Pricing */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: "#16A34A",
                          display: "inline-block",
                          flexShrink: 0
                        }} />
                        <h3 style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: 16,
                          fontWeight: 700,
                          color: "var(--color-ink)",
                          margin: 0,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}>
                          {item.name}
                        </h3>
                      </div>

                      <div style={{
                        fontSize: 13,
                        color: "var(--color-bronze)",
                        fontFamily: "var(--font-serif)",
                        fontWeight: 600,
                        marginTop: 3
                      }}>
                        ₹{item.price} each
                      </div>

                      {item.specialInstructions && (
                        <div style={{
                          fontSize: 11,
                          fontStyle: "italic",
                          color: "var(--color-ink-soft)",
                          marginTop: 3,
                          backgroundColor: "rgba(245, 239, 230, 0.6)",
                          padding: "2px 8px",
                          borderRadius: 4,
                          display: "inline-block"
                        }}>
                          Note: "{item.specialInstructions}"
                        </div>
                      )}
                    </div>

                    {/* Stepper + Total */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <span style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 15,
                        fontWeight: 700,
                        color: "var(--color-ink)"
                      }}>
                        ₹{item.price * item.quantity}
                      </span>

                      {/* Stepper */}
                      <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        backgroundColor: "var(--bg-app)",
                        border: "1.2px solid var(--color-ink)",
                        borderRadius: "var(--radius-pill)",
                        padding: "3px 8px"
                      }}>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--color-ink)"
                          }}
                          title="Reduce quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span style={{
                          fontSize: 13,
                          fontWeight: 700,
                          fontFamily: "var(--font-serif)",
                          minWidth: 18,
                          textAlign: "center"
                        }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--color-ink)"
                          }}
                          title="Add more"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Optional Item Instruction */}
                  <div>
                    {!isNoteOpen && !item.specialInstructions ? (
                      <button
                        type="button"
                        onClick={() => setActiveNoteItemId(item.id)}
                        style={{
                          fontSize: 11,
                          color: "var(--color-bronze)",
                          fontFamily: "var(--font-serif)",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        <span>+ Add cooking instructions (e.g. less spicy)</span>
                      </button>
                    ) : (
                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <input
                          type="text"
                          value={item.specialInstructions || ""}
                          placeholder="e.g. extra crispy, mild sauce, no onion..."
                          onChange={(e) => updateItemNotes(item.id, e.target.value)}
                          style={{
                            flex: 1,
                            padding: "6px 10px",
                            fontSize: 12,
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border-color)",
                            backgroundColor: "var(--bg-app)",
                            outline: "none"
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setActiveNoteItemId(null)}
                          style={{
                            fontSize: 11,
                            padding: "4px 10px",
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: "var(--color-ink)",
                            color: "#fff",
                            cursor: "pointer"
                          }}
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add More Items Link */}
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <button
                type="button"
                onClick={() => onNavigate("menu")}
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--color-bronze)",
                  textDecoration: "underline",
                  cursor: "pointer"
                }}
              >
                + Add more dishes from menu
              </button>
            </div>
          </div>

          {/* Right Column: Bill Summary & Checkout */}
          <div style={{ position: "sticky", top: 80, display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="bistro-card mobile-card-compact" style={{ padding: 22, backgroundColor: "#FFFFFF" }}>
              <h3 style={{
                fontFamily: "var(--font-serif)",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--color-ink)",
                borderBottom: "1px solid var(--border-color)",
                paddingBottom: 12,
                marginBottom: 16
              }}>
                Bill Summary
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-ink-soft)" }}>
                  <span>Item Subtotal</span>
                  <span style={{ fontWeight: 600, color: "var(--color-ink)" }}>₹{subtotal}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-ink-soft)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span>Delivery Partner Fee</span>
                    <Info size={12} style={{ color: "var(--color-bronze)" }} />
                  </div>
                  <span>
                    {deliveryFee === 0 ? (
                      <strong style={{ color: "#16A34A" }}>FREE</strong>
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-ink-soft)" }}>
                  <span>Taxes & Restaurant Packaging (5% GST)</span>
                  <span style={{ fontWeight: 600, color: "var(--color-ink)" }}>₹{taxes}</span>
                </div>

                <div style={{
                  borderTop: "1px dashed var(--border-color)",
                  paddingTop: 12,
                  marginTop: 6,
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 17,
                  fontWeight: 700,
                  fontFamily: "var(--font-serif)",
                  color: "var(--color-ink)"
                }}>
                  <span>To Pay</span>
                  <span style={{ color: "var(--color-bronze-dark)" }}>₹{total}</span>
                </div>
              </div>

              {/* Delivery info notice */}
              <div style={{
                marginTop: 18,
                padding: "10px 12px",
                backgroundColor: "rgba(245, 239, 230, 0.6)",
                borderRadius: "var(--radius-sm)",
                fontSize: 11,
                color: "var(--color-ink-soft)",
                lineHeight: 1.5
              }}>
                ⚡ Handcrafted fresh to order. Estimated delivery: <strong>30–40 mins</strong>.
              </div>

              {/* Proceed to Checkout Button */}
              <button
                type="button"
                onClick={handleProceedToCheckout}
                className="btn-pill-black touch-target-44"
                style={{
                  width: "100%",
                  padding: "14px 24px",
                  fontSize: 13,
                  marginTop: 18,
                  minHeight: 48
                }}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Pure Veg Guarantee Ribbon */}
            <div style={{
              textAlign: "center",
              fontSize: 11,
              fontFamily: "var(--font-serif)",
              color: "var(--color-bronze)",
              fontStyle: "italic"
            }}>
              100% Pure Vegetarian Kitchen • Zero Artificial Additives
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
