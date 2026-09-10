import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  ArrowRight,
  Utensils,
  Receipt,
  Bike,
  Store
} from "lucide-react";
import { useOnlineOrder } from "../../context/OnlineOrderContext";
import CafeLogoIcon from "../common/CafeLogoIcon";

export default function OrderConfirmationPage({ onNavigate }) {
  const { activeOrder } = useOnlineOrder();

  useEffect(() => {
    // Fire confetti cannon
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 300);
    } catch (e) {
      console.warn("Confetti effect note:", e);
    }
  }, []);

  if (!activeOrder) {
    return (
      <div style={{
        minHeight: "75vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: "var(--bg-app)"
      }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 26, marginBottom: 12 }}>No Active Order Found</h2>
        <button
          onClick={() => onNavigate("menu")}
          className="btn-pill-black"
          style={{ padding: "12px 24px" }}
        >
          Explore Menu
        </button>
      </div>
    );
  }

  const isDelivery = activeOrder.orderType === "delivery";

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "var(--bg-app)",
      paddingTop: "clamp(36px, 6vw, 60px)",
      paddingBottom: 80
    }}>
      <div className="site-container-narrow">
        {/* Success Card */}
        <div className="bistro-card" style={{
          backgroundColor: "#FFFFFF",
          padding: "clamp(24px, 4vw, 40px)",
          textAlign: "center",
          marginBottom: 24
        }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <CafeLogoIcon size={52} />
          </div>

          <div style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            backgroundColor: "rgba(34, 197, 94, 0.12)",
            color: "#16A34A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px auto"
          }}>
            <CheckCircle2 size={42} />
          </div>

          <span style={{
            fontSize: 11,
            fontFamily: "var(--font-serif)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1.5,
            color: "#16A34A",
            display: "block",
            marginBottom: 6
          }}>
            Payment Authorized & Verified
          </span>

          <h1 style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(28px, 4.5vw, 38px)",
            fontWeight: 600,
            color: "var(--color-ink)",
            lineHeight: 1.2,
            marginBottom: 8
          }}>
            Order Confirmed!
          </h1>

          <p style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: 16,
            color: "var(--color-bronze)",
            maxWidth: 480,
            margin: "0 auto 20px auto",
            lineHeight: 1.6
          }}>
            "Thank you for ordering with Two Hearts Cafe. Our kitchen has received your order and is handcrafting each dish fresh."
          </p>

          {/* Key Order Badges */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            flexWrap: "wrap",
            padding: "12px 18px",
            backgroundColor: "var(--bg-app)",
            borderRadius: "var(--radius-pill)",
            border: "1px solid var(--border-color)",
            width: "fit-content",
            margin: "0 auto 24px auto"
          }}>
            <span style={{ fontSize: 13, fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--color-ink)" }}>
              Order #{activeOrder.orderNumber}
            </span>
            <span style={{ color: "var(--border-color)" }}>•</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--color-bronze)", fontWeight: 600 }}>
              <Clock size={14} />
              <span>Est. {activeOrder.etaMinutes || 35} Mins</span>
            </div>
            <span style={{ color: "var(--border-color)" }}>•</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#16A34A", fontWeight: 600 }}>
              <ShieldCheck size={14} />
              <span>Paid Online</span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            flexWrap: "wrap"
          }}>
            <button
              onClick={() => onNavigate("order-status")}
              className="btn-pill-black"
              style={{ padding: "13px 28px", fontSize: 13 }}
            >
              <span>Track Live Order Status</span>
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => onNavigate("menu")}
              className="btn-pill-outline"
              style={{ padding: "12px 24px", fontSize: 13 }}
            >
              <span>Explore More Dishes</span>
            </button>
          </div>
        </div>

        {/* Order Details Breakdown Card */}
        <div className="bistro-card" style={{ padding: "24px 28px", backgroundColor: "#FFFFFF" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            borderBottom: "1px solid var(--border-color)",
            paddingBottom: 12,
            marginBottom: 16
          }}>
            <Receipt size={18} style={{ color: "var(--color-bronze)" }} />
            <h3 style={{
              fontFamily: "var(--font-serif)",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--color-ink)",
              margin: 0
            }}>
              Order & Delivery Receipt
            </h3>
          </div>

          {/* Delivery destination info */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            padding: "14px 16px",
            backgroundColor: "var(--bg-app)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-color)",
            marginBottom: 20,
            fontSize: 12
          }}>
            <div>
              <span style={{ color: "var(--color-ink-soft)", textTransform: "uppercase", fontSize: 10, letterSpacing: 0.8, display: "block", marginBottom: 3 }}>
                Customer & Contact
              </span>
              <strong style={{ color: "var(--color-ink)", fontSize: 13 }}>{activeOrder.customerName}</strong>
              <div style={{ color: "var(--color-bronze)", marginTop: 2 }}>{activeOrder.customerPhone}</div>
            </div>

            <div>
              <span style={{ color: "var(--color-ink-soft)", textTransform: "uppercase", fontSize: 10, letterSpacing: 0.8, display: "block", marginBottom: 3 }}>
                Fulfillment Address
              </span>
              <div style={{ color: "var(--color-ink)", lineHeight: 1.4 }}>
                {activeOrder.deliveryAddress}
                {activeOrder.landmark && (
                  <div style={{ color: "var(--color-ink-soft)", fontStyle: "italic", marginTop: 2 }}>
                    Ref: {activeOrder.landmark}
                  </div>
                )}
              </div>
            </div>

            <div>
              <span style={{ color: "var(--color-ink-soft)", textTransform: "uppercase", fontSize: 10, letterSpacing: 0.8, display: "block", marginBottom: 3 }}>
                Payment Method
              </span>
              <div style={{ color: "var(--color-ink)", fontWeight: 600 }}>{activeOrder.paymentMethod}</div>
              <div style={{ color: "#16A34A", fontSize: 11, marginTop: 2 }}>Txn ID: {activeOrder.paymentId}</div>
            </div>
          </div>

          {/* Itemized list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {activeOrder.items.map((item, idx) => (
              <div key={idx} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 13,
                borderBottom: "1px solid rgba(230, 223, 213, 0.5)",
                paddingBottom: 8
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    backgroundColor: "#16A34A",
                    flexShrink: 0
                  }} />
                  <span style={{ fontWeight: 600, color: "var(--color-ink)" }}>
                    {item.quantity}x {item.name}
                  </span>
                  {item.specialInstructions && (
                    <span style={{ fontSize: 11, fontStyle: "italic", color: "var(--color-ink-soft)" }}>
                      ("{item.specialInstructions}")
                    </span>
                  )}
                </div>
                <span style={{ fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--color-ink)" }}>
                  ₹{item.price * item.quantity}
                </span>
              </div>
            ))}
          </div>

          {/* Price Totals */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            fontSize: 13,
            paddingTop: 8
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-ink-soft)" }}>
              <span>Subtotal</span>
              <span>₹{activeOrder.subtotal}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-ink-soft)" }}>
              <span>Delivery Fee</span>
              <span>{activeOrder.deliveryFee === 0 ? <strong style={{ color: "#16A34A" }}>FREE</strong> : `₹${activeOrder.deliveryFee}`}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-ink-soft)" }}>
              <span>Taxes (5% GST)</span>
              <span>₹{activeOrder.tax}</span>
            </div>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 16,
              fontWeight: 700,
              fontFamily: "var(--font-serif)",
              borderTop: "1px dashed var(--border-color)",
              paddingTop: 10,
              marginTop: 4,
              color: "var(--color-ink)"
            }}>
              <span>Total Paid</span>
              <span style={{ color: "var(--color-bronze-dark)" }}>₹{activeOrder.total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
