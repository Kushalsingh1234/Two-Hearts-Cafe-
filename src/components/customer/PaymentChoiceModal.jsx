import React from "react";
import { X, Smartphone, Building2, CheckCircle2, ChevronRight, Clock, ShieldCheck } from "lucide-react";
import CafeLogoIcon from "../common/CafeLogoIcon";

export default function PaymentChoiceModal({
  isOpen,
  onClose,
  order,
  tableNumber,
  onChooseOnlinePay,
  onChooseCounterPay,
  isSubmittingCounter = false
}) {
  if (!isOpen || !order) return null;

  const total = order.total || 0;
  const itemsCount = (order.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
  const itemsList = (order.items || []).map((it) => `${it.quantity || 1}× ${it.name}`).join(", ");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        backgroundColor: "rgba(28, 25, 23, 0.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: "100%",
          maxWidth: 440,
          backgroundColor: "#FAF7F2",
          borderRadius: 8,
          border: "2px solid var(--color-border-frame)",
          boxShadow: "var(--shadow-floating)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1.5px solid var(--color-border-frame)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#fff"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CafeLogoIcon size={34} />
            <div>
              <div
                style={{
                  fontFamily: "var(--font-script)",
                  fontSize: 22,
                  color: "var(--color-bronze)",
                  lineHeight: 1
                }}
              >
                Two Hearts Cafe
              </div>
              <div
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 12,
                  fontWeight: 800,
                  color: "var(--color-ink)",
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  marginTop: 2
                }}
              >
                Table #{tableNumber} • Order Confirmed
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-ink)",
              cursor: "pointer",
              padding: 4,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 20px" }}>
          {/* Success / Bill Summary Card */}
          <div
            style={{
              backgroundColor: "#fff",
              border: "1px solid var(--border-color)",
              borderRadius: 6,
              padding: "14px 16px",
              marginBottom: 18,
              boxShadow: "var(--shadow-sm)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 12,
                  color: "var(--color-bronze)",
                  fontStyle: "italic"
                }}
              >
                Kitchen is preparing your order
              </span>
              <span
                style={{
                  backgroundColor: "#dcfce7",
                  color: "#15803d",
                  fontSize: 11,
                  fontFamily: "var(--font-serif)",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "var(--radius-pill)"
                }}
              >
                Order Active
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginTop: 8
              }}
            >
              <div style={{ fontSize: 13, color: "var(--color-ink)", maxWidth: "65%" }}>
                <strong>{itemsCount} {itemsCount === 1 ? "Item" : "Items"}:</strong>{" "}
                <span style={{ fontSize: 12, opacity: 0.85 }}>{itemsList}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 11, color: "var(--color-bronze)", display: "block" }}>Total Bill</span>
                <span
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 22,
                    fontWeight: 800,
                    color: "var(--color-ink)"
                  }}
                >
                  ₹{total}
                </span>
              </div>
            </div>
          </div>

          <h3
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 15,
              fontWeight: 700,
              color: "var(--color-ink)",
              marginBottom: 6,
              textAlign: "center"
            }}
          >
            How would you like to pay?
          </h3>
          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 12,
              fontStyle: "italic",
              color: "var(--color-bronze)",
              textAlign: "center",
              marginBottom: 16
            }}
          >
            You can settle now or pay after your meal.
          </p>

          {/* Option 1: Pay Online */}
          <button
            onClick={onChooseOnlinePay}
            style={{
              width: "100%",
              backgroundColor: "var(--color-ink)",
              color: "#FAF7F2",
              border: "1.5px solid var(--color-ink)",
              borderRadius: 6,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              marginBottom: 12,
              transition: "transform 0.15s, box-shadow 0.15s",
              boxShadow: "var(--shadow-sm)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
              <div
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  borderRadius: "50%",
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
              >
                <Smartphone size={18} color="#FAF7F2" />
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: 14, fontWeight: 700 }}>
                  Pay Online (UPI / QR Code)
                </div>
                <div style={{ fontSize: 11, color: "#E0D7CD" }}>
                  Instant digital payment via PhonePe, GPay, Paytm, or UPI apps
                </div>
              </div>
            </div>
            <ChevronRight size={18} color="#FAF7F2" />
          </button>

          {/* Option 2: Pay at Counter */}
          <button
            onClick={onChooseCounterPay}
            disabled={isSubmittingCounter}
            style={{
              width: "100%",
              backgroundColor: "#fff",
              color: "var(--color-ink)",
              border: "1.5px solid var(--color-border-frame)",
              borderRadius: 6,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: isSubmittingCounter ? "not-allowed" : "pointer",
              marginBottom: 14,
              boxShadow: "var(--shadow-sm)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
              <div
                style={{
                  backgroundColor: "var(--bg-subtle)",
                  borderRadius: "50%",
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
              >
                <Building2 size={18} color="var(--color-bronze)" />
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: 14, fontWeight: 700 }}>
                  {isSubmittingCounter ? "Notifying Counter..." : "Pay at Counter (Cash)"}
                </div>
                <div style={{ fontSize: 11, color: "var(--color-bronze)" }}>
                  Notify staff to prepare a cash bill at the counter
                </div>
              </div>
            </div>
            <ChevronRight size={18} color="var(--color-ink)" />
          </button>

          {/* Option 3: Pay After Meal / Decide Later */}
          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%",
              background: "none",
              border: "none",
              color: "var(--color-bronze)",
              fontFamily: "var(--font-serif)",
              fontSize: 12.5,
              fontStyle: "italic",
              textDecoration: "underline",
              cursor: "pointer",
              padding: "6px 0",
              textAlign: "center"
            }}
          >
            Pay after meal / Decide later
          </button>
        </div>
      </div>
    </div>
  );
}
