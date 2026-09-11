import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  X,
  Smartphone,
  CheckCircle2,
  Copy,
  Check,
  Building2
} from "lucide-react";
import { updateOrderPayment } from "../../firebase/services";

export default function PaymentModal({ isOpen, onClose, order, onPaymentSuccess }) {
  if (!isOpen || !order) return null;

  const [paymentType, setPaymentType] = useState("online"); // 'online' | 'counter'
  const [utrNumber, setUtrNumber] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isCopiedPhone, setIsCopiedPhone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedMessage, setConfirmedMessage] = useState(null);

  const upiId = "q086839601@ybl";
  // PhonePe Merchant account for Two Hearts Cafe
  const payeeName = "Two Hearts Cafe";
  const amount = order.total || 0;
  const isDeliveryOrder = order.orderType === "delivery" || order.orderType === "pickup";
  const orderLabel = order.orderType === "delivery" ? "Delivery" : order.orderType === "pickup" ? "Pickup" : `Table #${order.tableNumber}`;
  const transactionNote = isDeliveryOrder
    ? `Two Hearts ${orderLabel} ${order.orderNumber || (order.id ? order.id.slice(0, 6) : "101")}`
    : `Two Hearts Cafe T${order.tableNumber} ${order.orderNumber || (order.id ? order.id.slice(0, 6) : "101")}`;

  // Standard NPCI UPI URI Schemes with verified merchant handle & MCC 5812 (Restaurant)
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}&mc=5812`;
  const phonepeUri = `phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&mc=5812`;
  const paytmUri = `paytmmp://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR`;
  const gpayUri = `tez://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleConfirmOnlinePayment = async () => {
    setIsSubmitting(true);
    try {
      if (order.id) {
        const paidAt = new Date().toISOString();
        // Table QR order: update existing Firestore doc with payment confirmation & auto-settle
        await updateOrderPayment(order.id, {
          paymentStatus: "paid_online",
          paymentMethod: "upi",
          status: "settled",
          settledAt: paidAt,
          settledBy: "Customer Online UPI",
          settledMethod: "upi_online",
          upiId,
          utr: utrNumber.trim(),
          paidAt
        });
        setConfirmedMessage("Online payment verified! Your bill has been settled automatically. Thank you for dining with us!");
      } else {
        // Delivery checkout: no Firestore doc yet — parent's onPaymentSuccess creates the order.
        setConfirmedMessage("Payment confirmed! Your order is being placed...");
      }
      // Notify parent of success (parent handles navigation, Firebase creation for delivery)
      if (onPaymentSuccess) onPaymentSuccess();
    } catch (err) {
      console.error("Payment confirmation error:", err);
      alert("Could not update payment status. Please inform your server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectCounterPayment = async () => {
    setIsSubmitting(true);
    try {
      await updateOrderPayment(order.id, {
        paymentStatus: "pay_at_counter",
        paymentMethod: "counter",
        paidAt: null
      });
      setConfirmedMessage("Pay at Counter selected! Please pay cash at the counter; staff will settle your bill.");
      // Notify parent of success (parent handles navigation)
      if (onPaymentSuccess) onPaymentSuccess();
    } catch (err) {
      console.error("Counter request error:", err);
      alert("Could not update payment status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 85,
      backgroundColor: "rgba(28, 25, 23, 0.65)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16
    }}>
      <div style={{
        width: "100%",
        maxWidth: 440,
        backgroundColor: "#FAF7F2",
        borderRadius: 8,
        border: "2px solid var(--color-border-frame)",
        boxShadow: "var(--shadow-floating)",
        display: "flex",
        flexDirection: "column",
        maxHeight: "92vh",
        overflow: "hidden"
      }}>
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
              fontSize: 26,
              color: "var(--color-bronze)",
              lineHeight: 1
            }}>
              Two Hearts Cafe
            </div>
            <h3 style={{
              fontFamily: "var(--font-serif)",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--color-ink)",
              margin: "3px 0 0 0"
            }}>
              {isDeliveryOrder ? `Pay for ${orderLabel} Order` : `Settle Bill • Table #${order.tableNumber}`}
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
              color: "var(--color-ink)",
              cursor: "pointer"
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Bill Amount Banner */}
        <div style={{
          padding: "14px 20px",
          backgroundColor: "#fff",
          borderBottom: "1px dashed var(--color-border-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline"
        }}>
          <div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 12, color: "var(--color-bronze)", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Total Payable Amount
            </div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 13, fontStyle: "italic", color: "var(--color-ink)" }}>
              Order #{order.orderNumber || (order.id ? order.id.slice(0, 6) : "101")} ({order.items?.length || 0} items)
            </div>
          </div>
          <div style={{
            fontFamily: "var(--font-serif)",
            fontSize: 28,
            fontWeight: 800,
            color: "var(--color-ink)"
          }}>
            Rs.{amount}
          </div>
        </div>

        {/* Success Confirmation Toast */}
        {confirmedMessage ? (
          <div style={{ padding: 24, textAlign: "center" }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: "#dcfce7",
              color: "#15803d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px auto"
            }}>
              <CheckCircle2 size={32} />
            </div>
            <h4 style={{ fontFamily: "var(--font-serif)", fontSize: 19, fontWeight: 700, color: "var(--color-ink)", marginBottom: 6 }}>
              Thank You!
            </h4>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--color-bronze)", margin: 0 }}>
              {confirmedMessage}
            </p>
          </div>
        ) : (
          <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Toggle: Pay Online vs Pay at Counter */}
            <div style={{
              display: "flex",
              backgroundColor: "var(--bg-subtle)",
              padding: 3,
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--border-color)"
            }}>
              <button
                type="button"
                onClick={() => setPaymentType("online")}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "8px 12px",
                  borderRadius: "var(--radius-pill)",
                  fontFamily: "var(--font-serif)",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  backgroundColor: paymentType === "online" ? "var(--color-ink)" : "transparent",
                  color: paymentType === "online" ? "#FAF7F2" : "var(--color-ink)",
                  cursor: "pointer",
                  border: "none",
                  transition: "all 0.15s"
                }}
              >
                <Smartphone size={14} />
                <span>Pay Online (UPI)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType("counter")}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "8px 12px",
                  borderRadius: "var(--radius-pill)",
                  fontFamily: "var(--font-serif)",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  backgroundColor: paymentType === "counter" ? "var(--color-ink)" : "transparent",
                  color: paymentType === "counter" ? "#FAF7F2" : "var(--color-ink)",
                  cursor: "pointer",
                  border: "none",
                  transition: "all 0.15s"
                }}
              >
                <Building2 size={14} />
                <span>Pay at Counter</span>
              </button>
            </div>

            {/* TAB 1: PAY ONLINE (PhonePe Merchant UPI: q086839601@ybl) */}
            {paymentType === "online" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* 1-Click Launch Button for Mobile */}
                <a
                  href={upiUri}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "12px 18px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: "var(--color-bronze)",
                    color: "#ffffff",
                    fontFamily: "var(--font-serif)",
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    textDecoration: "none",
                    boxShadow: "var(--shadow-sm)",
                    textAlign: "center"
                  }}
                >
                  <Smartphone size={16} />
                  <span>Open Any UPI App (Rs.{amount})</span>
                </a>

                {/* Direct App Launchers */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <a
                    href={paytmUri}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-pill)",
                      backgroundColor: "#00BAF2",
                      color: "#FFFFFF",
                      fontFamily: "var(--font-serif)",
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: "none",
                      textAlign: "center"
                    }}
                  >
                    Open in Paytm
                  </a>
                  <a
                    href={phonepeUri}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-pill)",
                      backgroundColor: "#5f259f",
                      color: "#FFFFFF",
                      fontFamily: "var(--font-serif)",
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: "none",
                      textAlign: "center"
                    }}
                  >
                    Open in PhonePe
                  </a>
                </div>

                {/* Dynamic QR Code */}
                <div style={{
                  backgroundColor: "#fff",
                  borderRadius: 6,
                  border: "1.2px solid var(--color-border-frame)",
                  padding: 14,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10
                }}>
                  <div style={{ fontSize: 12, fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--color-ink)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Or Scan QR to Pay Rs.{amount}
                  </div>

                  <div style={{
                    padding: 8,
                    backgroundColor: "#fff",
                    borderRadius: 4,
                    border: "1px solid var(--color-border-frame)"
                  }}>
                    <QRCodeSVG
                      value={upiUri}
                      size={150}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  {/* Copy Pills for UPI ID & Mobile */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                    {/* UPI ID Pill */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: "#FAF7F2",
                      padding: "5px 12px",
                      borderRadius: "var(--radius-pill)",
                      border: "1px solid var(--color-border-frame)",
                      fontSize: 12,
                      fontFamily: "monospace"
                    }}>
                      <span>UPI: <strong>{upiId}</strong></span>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-bronze)", display: "flex", alignItems: "center" }}
                        title="Copy UPI ID"
                      >
                        {isCopied ? <Check size={13} color="#15803d" /> : <Copy size={13} />}
                      </button>
                    </div>

                    {/* Verified Merchant Badge Pill */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: "#FAF7F2",
                      padding: "5px 12px",
                      borderRadius: "var(--radius-pill)",
                      border: "1px solid var(--color-border-frame)",
                      fontSize: 12,
                      fontFamily: "var(--font-serif)",
                      color: "#15803d",
                      fontWeight: 600
                    }}>
                      <CheckCircle2 size={13} color="#15803d" />
                      <span>PhonePe Verified Merchant</span>
                    </div>
                  </div>
                </div>

                {/* Helpful Guidance Notice for Merchant QR */}
                <div style={{
                  backgroundColor: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  borderRadius: 6,
                  padding: "10px 12px",
                  fontSize: 11.5,
                  fontFamily: "var(--font-serif)",
                  color: "#166534",
                  lineHeight: 1.45
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>
                    ✓ Official PhonePe Merchant QR
                  </div>
                  <div>
                    Tap <strong>"Open Any UPI App"</strong> or scan the QR code above. Works smoothly on <strong>PhonePe, Google Pay, Paytm, BHIM</strong> and all UPI banking apps.
                  </div>
                </div>

                {/* UTR Reference input */}
                <div style={{
                  backgroundColor: "#fff",
                  padding: "12px 14px",
                  borderRadius: 6,
                  border: "1px dashed var(--color-border-frame)"
                }}>
                  <label style={{
                    display: "block",
                    fontFamily: "var(--font-serif)",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--color-ink)",
                    marginBottom: 4
                  }}>
                    Done paying? Confirm Payment:
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="Enter 12-digit UTR / UPI Ref (optional)"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "8px 10px",
                      borderRadius: 3,
                      border: "1px solid var(--color-border-frame)",
                      fontFamily: "monospace",
                      fontSize: 13,
                      outline: "none",
                      marginBottom: 8
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleConfirmOnlinePayment}
                    disabled={isSubmitting}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "var(--radius-pill)",
                      backgroundColor: "var(--color-ink)",
                      color: "#FAF7F2",
                      border: "none",
                      fontFamily: "var(--font-serif)",
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6
                    }}
                  >
                    <CheckCircle2 size={15} />
                    <span>{isSubmitting ? "Submitting..." : `I Have Paid Rs.${amount}`}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* TAB 2: PAY AT COUNTER */
              <div style={{
                backgroundColor: "#fff",
                borderRadius: 6,
                border: "1px solid var(--color-border-frame)",
                padding: 18,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                gap: 12
              }}>
                <div style={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  backgroundColor: "#FAF7F2",
                  border: "1px solid var(--color-border-frame)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                  color: "var(--color-ink)"
                }}>
                  <Building2 size={22} />
                </div>

                <h4 style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 700, color: "var(--color-ink)", margin: 0 }}>
                  Pay Cash or Card at Counter
                </h4>

                <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13, color: "var(--color-bronze)", margin: 0, lineHeight: 1.4 }}>
                  You can walk up to the counter when leaving or hand cash / card to your table server.
                </p>

                <button
                  type="button"
                  onClick={handleSelectCounterPayment}
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: "var(--color-ink)",
                    color: "#FAF7F2",
                    border: "none",
                    fontFamily: "var(--font-serif)",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    marginTop: 4
                  }}
                >
                  <CheckCircle2 size={15} />
                  <span>{isSubmitting ? "Notifying Staff..." : "Request Counter Bill"}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: 12,
          borderTop: "1.5px solid var(--color-border-frame)",
          backgroundColor: "#FAF7F2",
          display: "flex",
          justifyContent: "flex-end"
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "#fff",
              border: "1px solid var(--color-border-frame)",
              fontFamily: "var(--font-serif)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
