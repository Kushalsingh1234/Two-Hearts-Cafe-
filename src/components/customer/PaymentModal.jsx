import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import confetti from "canvas-confetti";
import {
  X,
  Smartphone,
  CheckCircle2,
  Copy,
  Check,
  Building2,
  Receipt,
  Star,
  ShieldCheck,
  Loader2
} from "lucide-react";
import { updateOrderPayment } from "../../firebase/services";
import { launchRazorpayCheckout } from "../../services/razorpayService";

export default function PaymentModal({
  isOpen,
  onClose,
  order,
  onPaymentSuccess,
  onOpenInvoice,
  onOpenReview
}) {
  if (!isOpen || !order) return null;

  const [paymentType, setPaymentType] = useState("online"); // 'online' | 'counter'
  const [utrNumber, setUtrNumber] = useState("");
  const [showUtrInput, setShowUtrInput] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);
  const [razorpayError, setRazorpayError] = useState(null);
  const [upiLaunched, setUpiLaunched] = useState(false);
  const [showReturnPrompt, setShowReturnPrompt] = useState(false);
  const [settledSuccess, setSettledSuccess] = useState(false);
  const [confirmedMessage, setConfirmedMessage] = useState(null);
  const [qrMode, setQrMode] = useState("auto"); // 'auto' | 'standee'

  const upiId = "Q327979600@ybl";
  const payeeName = "PhonePeMerchant";
  const amount = order.total || 0;
  const isDeliveryOrder = order.orderType === "delivery" || order.orderType === "pickup";
  const orderLabel = order.orderType === "delivery" ? "Delivery" : order.orderType === "pickup" ? "Pickup" : `Table #${order.tableNumber}`;
  const transactionNote = isDeliveryOrder
    ? `Two Hearts ${orderLabel} ${order.orderNumber || (order.id ? order.id.slice(0, 6) : "101")}`
    : `Two Hearts Cafe T${order.tableNumber} ${order.orderNumber || (order.id ? order.id.slice(0, 6) : "101")}`;

  // 1. Dynamic UPI links
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&mc=0000&mode=02&purpose=00&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
  const phonepeUri = `phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&mc=0000&mode=02&purpose=00&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
  const paytmUri = `paytmmp://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&mc=0000&mode=02&purpose=00&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;

  // 2. Official Standee QR
  const officialStandeeUri = `upi://pay?pa=Q327979600@ybl&pn=PhonePeMerchant&mc=0000&mode=02&purpose=00`;

  const handleLaunchUpi = () => {
    try {
      sessionStorage.setItem(
        "twohearts_upi_in_flight",
        JSON.stringify({
          orderId: order.id,
          tableNumber: order.tableNumber,
          amount,
          time: Date.now()
        })
      );
    } catch {}
    setUpiLaunched(true);
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // 1. RAZORPAY STANDARD CHECKOUT: Automatic Bank-Verified Settlement
  const handlePayWithRazorpay = async () => {
    setIsRazorpayLoading(true);
    setRazorpayError(null);
    try {
      await launchRazorpayCheckout({
        order,
        onSuccess: async (paymentResult) => {
          const paidAt = new Date().toISOString();
          if (order.id) {
            await updateOrderPayment(order.id, {
              paymentStatus: "paid_online",
              paymentMethod: "razorpay_upi",
              status: "settled",
              settledAt: paidAt,
              settledBy: "Razorpay Standard Checkout",
              settledMethod: "razorpay",
              upiId: "razorpay_gateway",
              utr: paymentResult.paymentId,
              paymentDetails: {
                paymentId: paymentResult.paymentId,
                orderId: paymentResult.orderId,
                signature: paymentResult.signature,
                verified: true,
                paidAt
              },
              paidAt
            });

            try {
              if (order.tableNumber) {
                const raw = sessionStorage.getItem(`twohearts_table_${order.tableNumber}_session_orders`);
                const curr = raw ? JSON.parse(raw) : [];
                if (!curr.includes(order.id)) {
                  sessionStorage.setItem(
                    `twohearts_table_${order.tableNumber}_session_orders`,
                    JSON.stringify([...curr, order.id])
                  );
                }
                localStorage.setItem(`twohearts_table_${order.tableNumber}_last_settled_id`, order.id);
              }
            } catch {}

            try {
              confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
            } catch {}

            setSettledSuccess(true);
            setConfirmedMessage(`Payment of Rs.${amount} verified by bank! Table #${order.tableNumber} bill is settled automatically.`);
          } else {
            setSettledSuccess(true);
            setConfirmedMessage("Payment confirmed! Your order is being placed...");
          }

          if (onPaymentSuccess) onPaymentSuccess(order);
        },
        onFailure: (errMsg) => {
          console.warn("Razorpay error:", errMsg);
          setRazorpayError(typeof errMsg === "string" ? errMsg : "Payment was not completed");
        },
        onDismiss: () => {
          console.log("Razorpay modal dismissed by user");
        }
      });
    } catch (err) {
      console.error("Razorpay initiation error:", err);
      setRazorpayError(err.message || "Could not launch Razorpay. Please try again or use counter QR.");
    } finally {
      setIsRazorpayLoading(false);
    }
  };

  // 2. Fallback Manual Standee Settlement
  const handleConfirmOnlinePayment = async (overrideUtr) => {
    setIsSubmitting(true);
    try {
      const resolvedUtr = typeof overrideUtr === "string" ? overrideUtr : utrNumber.trim();
      const paidAt = new Date().toISOString();

      if (order.id) {
        await updateOrderPayment(order.id, {
          paymentStatus: "paid_online",
          paymentMethod: "upi",
          status: "settled",
          settledAt: paidAt,
          settledBy: "Customer Online UPI",
          settledMethod: "upi_online",
          upiId,
          utr: resolvedUtr,
          paidAt
        });

        try {
          if (order.tableNumber) {
            const raw = sessionStorage.getItem(`twohearts_table_${order.tableNumber}_session_orders`);
            const curr = raw ? JSON.parse(raw) : [];
            if (!curr.includes(order.id)) {
              sessionStorage.setItem(
                `twohearts_table_${order.tableNumber}_session_orders`,
                JSON.stringify([...curr, order.id])
              );
            }
            localStorage.setItem(`twohearts_table_${order.tableNumber}_last_settled_id`, order.id);
          }
        } catch {}

        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch {}

        setSettledSuccess(true);
        setConfirmedMessage(`Payment of Rs.${amount} confirmed! Your table bill has been settled.`);
      } else {
        setSettledSuccess(true);
        setConfirmedMessage("Payment confirmed! Your order is being placed...");
      }

      if (onPaymentSuccess) onPaymentSuccess(order);
    } catch (err) {
      console.error("Payment confirmation error:", err);
      alert("Could not update payment status. Please inform your server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // App return detection for standee links (prompts user explicitly, never auto-settles blindly)
  useEffect(() => {
    if (!isOpen || !order || settledSuccess) return;

    const checkAppReturn = () => {
      if (document.visibilityState === "visible") {
        let shouldPrompt = upiLaunched;
        if (!shouldPrompt) {
          try {
            const raw = sessionStorage.getItem("twohearts_upi_in_flight");
            if (raw) {
              const data = JSON.parse(raw);
              if (data.orderId === order.id && Date.now() - data.time < 15 * 60 * 1000) {
                shouldPrompt = true;
              }
            }
          } catch {}
        }

        if (shouldPrompt && !isSubmitting && !settledSuccess) {
          setUpiLaunched(false);
          setShowReturnPrompt(true);
        }
      }
    };

    document.addEventListener("visibilitychange", checkAppReturn);
    window.addEventListener("focus", checkAppReturn);

    return () => {
      document.removeEventListener("visibilitychange", checkAppReturn);
      window.removeEventListener("focus", checkAppReturn);
    };
  }, [isOpen, order, upiLaunched, isSubmitting, settledSuccess]);

  const handleSelectCounterPayment = async () => {
    setIsSubmitting(true);
    try {
      await updateOrderPayment(order.id, {
        paymentStatus: "pay_at_counter",
        paymentMethod: "counter",
        paidAt: null
      });
      setConfirmedMessage("Pay at Counter selected! Please pay cash at the counter; staff will settle your bill.");
      if (onPaymentSuccess) onPaymentSuccess(order);
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
      backgroundColor: "rgba(28, 25, 23, 0.7)",
      backdropFilter: "blur(5px)",
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
        overflow: "hidden",
        position: "relative"
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

        {/* SUCCESS VIEW */}
        {confirmedMessage || settledSuccess ? (
          <div style={{
            padding: "26px 20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14
          }}>
            <div style={{
              width: 62,
              height: 62,
              borderRadius: "50%",
              backgroundColor: "#dcfce7",
              color: "#15803d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(21, 128, 61, 0.25)"
            }}>
              <CheckCircle2 size={36} />
            </div>

            <div>
              <h4 style={{
                fontFamily: "var(--font-serif)",
                fontSize: 20,
                fontWeight: 700,
                color: "var(--color-ink)",
                margin: "0 0 6px 0"
              }}>
                Bill Settled Successfully!
              </h4>
              <p style={{
                fontFamily: "var(--font-serif)",
                fontSize: 14,
                color: "var(--color-bronze)",
                margin: 0,
                lineHeight: 1.45
              }}>
                {confirmedMessage}
              </p>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", marginTop: 8 }}>
              {onOpenInvoice && (
                <button
                  type="button"
                  onClick={() => onOpenInvoice(order)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "11px 16px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: "var(--color-ink)",
                    color: "#FAF7F2",
                    fontFamily: "var(--font-serif)",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  <Receipt size={16} />
                  <span>View & Download Invoice</span>
                </button>
              )}

              {onOpenReview && (
                <button
                  type="button"
                  onClick={() => onOpenReview(order)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "10px 16px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: "#fff",
                    color: "var(--color-bronze)",
                    border: "1.2px solid var(--color-border-frame)",
                    fontFamily: "var(--font-serif)",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  <Star size={15} color="var(--color-bronze)" />
                  <span>Rate Your Food & Experience</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                style={{
                  width: "100%",
                  padding: "9px 16px",
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: "transparent",
                  color: "var(--color-ink)",
                  border: "1px solid var(--color-border-frame)",
                  fontFamily: "var(--font-serif)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Close & Return to Menu
              </button>
            </div>
          </div>
        ) : (
          /* PAYMENT OPTIONS */
          <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Standee return prompt if customer used standee link */}
            {showReturnPrompt && (
              <div style={{
                backgroundColor: "#F0FDF4",
                border: "1.5px solid #22c55e",
                borderRadius: 8,
                padding: "14px 16px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                boxShadow: "0 4px 12px rgba(22, 163, 74, 0.12)"
              }}>
                <div style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#166534"
                }}>
                  💳 Returning from Standee UPI?
                </div>
                <p style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 13,
                  color: "var(--color-bronze)",
                  margin: 0,
                  lineHeight: 1.4
                }}>
                  Did you enter your UPI PIN and complete the <strong>Rs.{amount}</strong> payment?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowReturnPrompt(false);
                    try { sessionStorage.removeItem("twohearts_upi_in_flight"); } catch {}
                    handleConfirmOnlinePayment();
                  }}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: "#15803d",
                    color: "#fff",
                    padding: "11px 18px",
                    borderRadius: "var(--radius-pill)",
                    fontWeight: 700,
                    fontSize: 13.5,
                    border: "none",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{isSubmitting ? "Settling..." : `✓ Yes, I Have Paid Rs.${amount}`}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReturnPrompt(false);
                    try { sessionStorage.removeItem("twohearts_upi_in_flight"); } catch {}
                  }}
                  style={{
                    background: "transparent",
                    color: "#6b7280",
                    border: "none",
                    fontSize: 12,
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                >
                  ✕ Payment Incomplete or Cancelled
                </button>
              </div>
            )}

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
                <span>Pay Online (Instant)</span>
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

            {/* TAB 1: PAY ONLINE */}
            {paymentType === "online" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* 1. PRIMARY HERO OPTION: RAZORPAY STANDARD GATEWAY (AUTO-SETTLES ON PIN) */}
                <div style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 8,
                  border: "2px solid #16a34a",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  boxShadow: "0 4px 14px rgba(22, 163, 74, 0.15)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <ShieldCheck size={18} color="#15803d" />
                      <span style={{ fontFamily: "var(--font-serif)", fontSize: 14, fontWeight: 700, color: "var(--color-ink)" }}>
                        Automated Bank Checkout
                      </span>
                    </div>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      backgroundColor: "#DCFCE7",
                      color: "#15803d",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-pill)",
                      letterSpacing: 0.5
                    }}>
                      Auto-Settles on PIN
                    </span>
                  </div>

                  <p style={{ fontFamily: "var(--font-serif)", fontSize: 12.5, color: "var(--color-bronze)", margin: 0, lineHeight: 1.4 }}>
                    Pay seamlessly with <strong>PhonePe, Google Pay, Paytm, Cards & Netbanking</strong>. Bank verifies payment instantly and closes your bill.
                  </p>

                  <button
                    type="button"
                    onClick={handlePayWithRazorpay}
                    disabled={isRazorpayLoading}
                    style={{
                      width: "100%",
                      padding: "13px 18px",
                      borderRadius: "var(--radius-pill)",
                      backgroundColor: "#16a34a",
                      color: "#FFFFFF",
                      border: "none",
                      fontFamily: "var(--font-serif)",
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      cursor: isRazorpayLoading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      boxShadow: "0 4px 12px rgba(22, 163, 74, 0.3)",
                      transition: "all 0.15s"
                    }}
                  >
                    {isRazorpayLoading ? (
                      <>
                        <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} />
                        <span>Opening UPI Gateway...</span>
                      </>
                    ) : (
                      <>
                        <Smartphone size={16} />
                        <span>⚡ Pay Rs.{amount} with UPI / Apps</span>
                      </>
                    )}
                  </button>

                  {razorpayError && (
                    <div style={{ fontSize: 11.5, color: "#b91c1c", backgroundColor: "#FEF2F2", padding: "6px 10px", borderRadius: 4, textAlign: "center" }}>
                      {razorpayError}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  margin: "2px 0",
                  color: "var(--color-bronze)",
                  fontSize: 11,
                  fontFamily: "var(--font-serif)",
                  letterSpacing: 1,
                  textTransform: "uppercase"
                }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: "var(--color-border-frame)" }} />
                  <span>Or Standee QR</span>
                  <div style={{ flex: 1, height: 1, backgroundColor: "var(--color-border-frame)" }} />
                </div>

                {/* 2. SECONDARY OPTION: COUNTER STANDEE QR CODE */}
                <div style={{
                  backgroundColor: "#fff",
                  borderRadius: 6,
                  border: "1.2px solid var(--color-border-frame)",
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10
                }}>
                  <div style={{ fontSize: 12, fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--color-ink)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Counter Standee QR (PhonePe)
                  </div>

                  {/* Mode Selector */}
                  <div style={{ display: "flex", gap: 6, backgroundColor: "#FAF7F2", padding: 3, borderRadius: "var(--radius-pill)", border: "1px solid var(--color-border-frame)" }}>
                    <button
                      type="button"
                      onClick={() => setQrMode("auto")}
                      style={{
                        padding: "3px 10px",
                        borderRadius: "var(--radius-pill)",
                        backgroundColor: qrMode === "auto" ? "var(--color-ink)" : "transparent",
                        color: qrMode === "auto" ? "#FFFFFF" : "var(--color-ink)",
                        border: "none",
                        fontSize: 11,
                        fontFamily: "var(--font-serif)",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Pre-filled (Rs.{amount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrMode("standee")}
                      style={{
                        padding: "3px 10px",
                        borderRadius: "var(--radius-pill)",
                        backgroundColor: qrMode === "standee" ? "var(--color-ink)" : "transparent",
                        color: qrMode === "standee" ? "#FFFFFF" : "var(--color-ink)",
                        border: "none",
                        fontSize: 11,
                        fontFamily: "var(--font-serif)",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Official Standee
                    </button>
                  </div>

                  <div style={{
                    padding: 6,
                    backgroundColor: "#fff",
                    borderRadius: 4,
                    border: "1px solid var(--color-border-frame)"
                  }}>
                    <QRCodeSVG
                      value={qrMode === "standee" ? officialStandeeUri : upiUri}
                      size={130}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  {/* Direct App Launchers */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%" }}>
                    <a
                      href={phonepeUri}
                      onClick={handleLaunchUpi}
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
                    <a
                      href={paytmUri}
                      onClick={handleLaunchUpi}
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
                  </div>

                  {/* Copy Pills for UPI ID */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: "#FAF7F2",
                      padding: "4px 10px",
                      borderRadius: "var(--radius-pill)",
                      border: "1px solid var(--color-border-frame)",
                      fontSize: 11.5,
                      fontFamily: "monospace"
                    }}>
                      <span>UPI: <strong>{upiId}</strong></span>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-bronze)", display: "flex", alignItems: "center" }}
                        title="Copy UPI ID"
                      >
                        {isCopied ? <Check size={12} color="#15803d" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Optional Manual Settle for Standee Scanners */}
                <div style={{ textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={() => setShowUtrInput(!showUtrInput)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--color-bronze)",
                      fontFamily: "var(--font-serif)",
                      fontSize: 11.5,
                      textDecoration: "underline",
                      cursor: "pointer"
                    }}
                  >
                    {showUtrInput ? "Hide Standee Settlement" : "Scanned the Physical Standee? Confirm here"}
                  </button>

                  {showUtrInput && (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                      <input
                        type="text"
                        maxLength={16}
                        placeholder="Enter 12-digit UTR (optional)"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "8px 10px",
                          borderRadius: 4,
                          border: "1px solid var(--color-border-frame)",
                          fontFamily: "monospace",
                          fontSize: 13,
                          outline: "none",
                          textAlign: "center"
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleConfirmOnlinePayment()}
                        disabled={isSubmitting}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "var(--radius-pill)",
                          backgroundColor: "var(--color-ink)",
                          color: "#FAF7F2",
                          border: "none",
                          fontFamily: "var(--font-serif)",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: isSubmitting ? "not-allowed" : "pointer"
                        }}
                      >
                        {isSubmitting ? "Settling..." : `Settle Bill (Paid Standee Rs.${amount})`}
                      </button>
                    </div>
                  )}
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
