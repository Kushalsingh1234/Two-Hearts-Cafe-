import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building2,
  Lock,
  CheckCircle2,
  Bike,
  Store,
  MapPin,
  Phone,
  User,
  Check,
  AlertCircle
} from "lucide-react";
import { useOnlineOrder } from "../../context/OnlineOrderContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import CheckoutAddressSection from "./CheckoutAddressSection";
import PaymentModal from "../customer/PaymentModal";
import { launchRazorpayCheckout } from "../../services/razorpayService";

export default function CheckoutPage({ onNavigate }) {
  const {
    customerUser,
    isLoggedIn,
    openAuthModal,
    savedAddresses = [],
    defaultAddress,
    addAddress,
    updateAddress
  } = useCustomerAuth();
  const {
    cart,
    subtotal,
    deliveryFee,
    taxes,
    total,
    deliveryType,
    setDeliveryType,
    customerInfo,
    setCustomerInfo,
    clearCart,
    submitOnlineOrder,
    DELIVERY_CONFIG,
    calculateDistanceKm,
    checkDeliveryEligibility
  } = useOnlineOrder();

  // Track currently selected saved address
  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddress?.id || null);

  // Resolve selected address object and evaluate live delivery eligibility
  const selectedAddressObj = savedAddresses.find((a) => a.id === selectedAddressId);
  const currentCoords = selectedAddressObj?.coords || null;

  const deliveryEligibility = checkDeliveryEligibility
    ? checkDeliveryEligibility({
        coords: currentCoords,
        subtotal,
        orderType: deliveryType
      })
    : {
        isEligible: true,
        orderType: deliveryType,
        distanceKm: null,
        isWithinRadius: true,
        meetsMinSubtotal: true,
        amountNeeded: 0,
        reason: null
      };

  // Form State - pre-filled from customerUser & default address if available
  const [formData, setFormData] = useState({
    name: customerInfo.name || (customerUser ? customerUser.name : ""),
    phone: customerInfo.phone || (customerUser ? customerUser.phone : ""),
    address: customerInfo.address || (defaultAddress ? defaultAddress.fullAddress : ""),
    landmark: customerInfo.landmark || (defaultAddress ? (defaultAddress.landmark || "") : ""),
    notes: customerInfo.notes || ""
  });

  const [formErrors, setFormErrors] = useState({});

  // Address selection handler
  const handleSelectAddress = (addr) => {
    if (!addr) return;
    setSelectedAddressId(addr.id);
    setFormData((prev) => ({
      ...prev,
      address: addr.fullAddress || addr.address || "",
      landmark: addr.landmark || prev.landmark || "",
      name: prev.name || addr.recipientName || customerUser?.name || "",
      phone: prev.phone || addr.phone || customerUser?.phone || ""
    }));
    if (formErrors.address) {
      setFormErrors((prev) => ({ ...prev, address: null }));
    }
  };

  // Add new address handler - saves to address book and pre-selects
  const handleAddNewAddress = (newAddr) => {
    if (addAddress) {
      const saved = addAddress(newAddr);
      handleSelectAddress(saved || newAddr);
    } else {
      handleSelectAddress(newAddr);
    }
  };

  // Update existing address handler
  const handleUpdateAddress = (id, updatedFields) => {
    if (updateAddress) {
      updateAddress(id, updatedFields);
    }
    if (selectedAddressId === id) {
      handleSelectAddress({ id, ...updatedFields });
    }
  };

  // Sync if customerUser or default address is loaded / changes
  useEffect(() => {
    if (customerUser) {
      setFormData((prev) => {
        if (prev.name && prev.phone && prev.address) return prev;
        return {
          ...prev,
          name: prev.name || customerUser.name || "",
          phone: prev.phone || customerUser.phone || "",
          address: prev.address || (defaultAddress ? defaultAddress.fullAddress : ""),
          landmark: prev.landmark || (defaultAddress ? (defaultAddress.landmark || "") : "")
        };
      });
      if (defaultAddress && !selectedAddressId) {
        setSelectedAddressId(defaultAddress.id);
      }
    }
  }, [customerUser, defaultAddress]);

  // Pre-select default address if none selected in delivery mode
  useEffect(() => {
    if (deliveryType === "delivery" && savedAddresses.length > 0) {
      const exists = savedAddresses.find((a) => a.id === selectedAddressId);
      if (!exists) {
        const toSelect = defaultAddress || savedAddresses[0];
        if (toSelect) {
          handleSelectAddress(toSelect);
        }
      }
    }
  }, [savedAddresses, defaultAddress, deliveryType]);

  // Pending order state - set after order is placed, shown in PaymentModal
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // If cart emptied after order was placed, only show PaymentModal (not "Cart is Empty")
  if (cart.length === 0 && !pendingPaymentOrder) {
    return (
      <div style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: "var(--bg-app)"
      }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 26, marginBottom: 12 }}>Your Cart is Empty</h2>
        <button
          onClick={() => onNavigate("menu")}
          className="btn-pill-black"
          style={{ padding: "12px 24px" }}
        >
          Return to Menu
        </button>
      </div>
    );
  }

  // If order has been placed and PaymentModal should show, render it directly
  // (This handles an edge case where pendingPaymentOrder is set but cart somehow emptied)
  if (cart.length === 0 && pendingPaymentOrder) {
    return (
      <>
        <PaymentModal
          isOpen={true}
          order={pendingPaymentOrder}
          onClose={() => {
            // Closed without paying — no order was created in Firebase, cart is still intact
            setPendingPaymentOrder(null);
            onNavigate("cart");
          }}
          onPaymentSuccess={async (paymentResult) => {
            // Payment confirmed via Razorpay — NOW create the real Firebase order
            try {
              const paidAt = new Date().toISOString();
              const txnId = paymentResult?.paymentId || `RZP_${Date.now().toString().slice(-8)}`;
              await submitOnlineOrder(
                {
                  method: "razorpay",
                  transactionId: txnId,
                  paymentId: txnId,
                  razorpayOrderId: paymentResult?.orderId || "",
                  userId: pendingPaymentOrder.userId,
                  customerName: pendingPaymentOrder.customerName,
                  customerPhone: pendingPaymentOrder.customerPhone,
                  deliveryAddress: pendingPaymentOrder.deliveryAddress,
                  address: pendingPaymentOrder.deliveryAddress,
                  landmark: pendingPaymentOrder.landmark || "",
                  customerNotes: pendingPaymentOrder.customerNotes || "",
                  paymentStatus: "paid_online",
                  paymentMethod: "razorpay",
                  settledBy: "Razorpay Standard Checkout",
                  settledMethod: "razorpay",
                  utr: txnId,
                  paidAt
                },
                { name: pendingPaymentOrder.customerName, phone: pendingPaymentOrder.customerPhone }
              );
            } catch (err) {
              console.error("Order creation after payment failed:", err);
            }
            clearCart();
            setPendingPaymentOrder(null);
            onNavigate("order-confirmation");
          }}
        />
      </>
    );
  }

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Please enter your full name";
    if (!formData.phone.trim() || formData.phone.trim().length < 10) {
      errors.phone = "Please enter a valid 10-digit mobile number";
    }
    if (deliveryType === "delivery" && !formData.address.trim()) {
      errors.address = "Please provide your street or campus hostel address";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePayAndPlaceOrder = async () => {
    if (!isLoggedIn) {
      openAuthModal();
      return;
    }

    // Check delivery eligibility strictly if in delivery mode
    if (deliveryType === "delivery" && !deliveryEligibility.isEligible) {
      alert(
        deliveryEligibility.reason ||
          "This order does not meet delivery eligibility requirements. Please switch to Pickup."
      );
      return;
    }

    if (!validateForm()) {
      window.scrollTo({ top: 180, behavior: "smooth" });
      return;
    }

    // Save customer info to context/localStorage
    setCustomerInfo(formData);

    const previewOrder = {
      orderType: deliveryType,
      orderNumber: `THD-${Math.floor(1000 + Math.random() * 9000)}`,
      tableNumber: deliveryType === "pickup" ? "Takeaway" : "Delivery",
      total,
      subtotal,
      deliveryFee,
      tax: taxes,
      items: cart,
      customerName: formData.name.trim(),
      customerPhone: formData.phone.trim(),
      customerEmail: customerUser?.email || "",
      deliveryAddress: formData.address.trim(),
      address: formData.address.trim(),
      landmark: formData.landmark?.trim() || "",
      customerNotes: formData.notes?.trim() || "",
      userId: customerUser?.phone || formData.phone.trim(),
    };

    // Website orders (home delivery or takeaway): RAZORPAY EXCLUSIVE
    setIsPlacingOrder(true);
    try {
      await launchRazorpayCheckout({
        order: previewOrder,
        onSuccess: async (paymentResult) => {
          try {
            const paidAt = new Date().toISOString();
            await submitOnlineOrder(
              {
                method: "razorpay",
                transactionId: paymentResult.paymentId,
                paymentId: paymentResult.paymentId,
                razorpayOrderId: paymentResult.orderId,
                userId: previewOrder.userId,
                customerName: previewOrder.customerName,
                customerPhone: previewOrder.customerPhone,
                deliveryAddress: previewOrder.deliveryAddress,
                address: previewOrder.deliveryAddress,
                landmark: previewOrder.landmark || "",
                customerNotes: previewOrder.customerNotes || "",
                paymentStatus: "paid_online",
                paymentMethod: "razorpay",
                settledBy: "Razorpay Standard Checkout",
                settledMethod: "razorpay",
                utr: paymentResult.paymentId,
                paidAt,
                orderType: previewOrder.orderType,
                paymentDetails: {
                  paymentId: paymentResult.paymentId,
                  orderId: paymentResult.orderId,
                  signature: paymentResult.signature,
                  verified: true,
                  paidAt
                }
              },
              {
                name: previewOrder.customerName,
                phone: previewOrder.customerPhone,
                address: previewOrder.deliveryAddress,
                landmark: previewOrder.landmark,
                notes: previewOrder.customerNotes
              }
            );
            clearCart();
            setIsPlacingOrder(false);
            onNavigate("order-confirmation");
          } catch (err) {
            console.error("Order save error after Razorpay payment:", err);
            setIsPlacingOrder(false);
            alert("Payment was successful (" + paymentResult.paymentId + "), but order saving encountered an error. Please contact cafe support.");
          }
        },
        onFailure: (errMsg) => {
          setIsPlacingOrder(false);
          alert(errMsg || "Payment was not completed. You can try again anytime.");
        },
        onDismiss: () => {
          setIsPlacingOrder(false);
        }
      });
    } catch (err) {
      console.error("Razorpay initiation error:", err);
      setIsPlacingOrder(false);
      alert(err.message || "Could not launch Razorpay checkout. Please try again.");
    }
  };

  return (
    <div className="mobile-section-tight" style={{
      minHeight: "100vh",
      backgroundColor: "var(--bg-app)",
      paddingTop: "clamp(32px, 5vw, 48px)",
      paddingBottom: 80
    }}>
      <div className="site-container">
        {/* Navigation & Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <button
            onClick={() => onNavigate("cart")}
            className="touch-target-44"
            style={{
              width: 40,
              height: 40,
              minWidth: 40,
              minHeight: 40,
              borderRadius: "50%",
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-ink)",
              cursor: "pointer"
            }}
            title="Back to Cart"
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
              Checkout & Payment
            </h1>
            <span style={{
              fontSize: 12,
              color: "var(--color-bronze)",
              fontFamily: "var(--font-serif)",
              fontWeight: 600
            }}>
              100% Encrypted & Verified Digital Checkout
            </span>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          gap: 28,
          alignItems: "flex-start"
        }}>
          {/* Left Column: Delivery Details + Payment Gateway */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* 1. Contact & Address Details */}
            <div className="bistro-card mobile-card-compact" style={{ padding: "clamp(14px, 3vw, 24px)", backgroundColor: "#FFFFFF" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                  marginBottom: 18
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: "var(--color-bronze-light)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--color-bronze)"
                    }}
                  >
                    {deliveryType === "delivery" ? <Bike size={16} /> : <Store size={16} />}
                  </div>
                  <div>
                    <h3
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 18,
                        fontWeight: 700,
                        color: "var(--color-ink)",
                        margin: 0
                      }}
                    >
                      {deliveryType === "delivery"
                        ? "Delivery Destination & Contact"
                        : "Takeaway Contact Info"}
                    </h3>
                    <span style={{ fontSize: 11, color: "var(--color-ink-soft)" }}>
                      {deliveryType === "delivery"
                        ? "Within 2 km of Pillar #852, Muradnagar"
                        : "Pick up at Two Hearts Cafe Counter (No Minimum)"}
                    </span>
                  </div>
                </div>

                {/* Delivery / Takeaway Mode Switcher */}
                <div
                  style={{
                    display: "inline-flex",
                    backgroundColor: "var(--bg-app)",
                    padding: 3,
                    borderRadius: "var(--radius-pill)",
                    border: "1px solid var(--border-color)"
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setDeliveryType("delivery")}
                    className="touch-target-44"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "6px 14px",
                      borderRadius: "var(--radius-pill)",
                      fontSize: 11.5,
                      fontWeight: deliveryType === "delivery" ? 700 : 500,
                      fontFamily: "var(--font-serif)",
                      backgroundColor: deliveryType === "delivery" ? "var(--color-ink)" : "transparent",
                      color: deliveryType === "delivery" ? "#FFFFFF" : "var(--color-ink-soft)",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <Bike size={13} />
                    <span>Delivery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryType("pickup")}
                    className="touch-target-44"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "6px 14px",
                      borderRadius: "var(--radius-pill)",
                      fontSize: 11.5,
                      fontWeight: deliveryType === "pickup" ? 700 : 500,
                      fontFamily: "var(--font-serif)",
                      backgroundColor: deliveryType === "pickup" ? "var(--color-ink)" : "transparent",
                      color: deliveryType === "pickup" ? "#FFFFFF" : "var(--color-ink-soft)",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <Store size={13} />
                    <span>Takeaway</span>
                  </button>
                </div>
              </div>

              {deliveryType === "delivery" ? (
                <CheckoutAddressSection
                  savedAddresses={savedAddresses}
                  selectedAddressId={selectedAddressId}
                  onSelectAddress={handleSelectAddress}
                  onAddNewAddress={handleAddNewAddress}
                  onUpdateAddress={handleUpdateAddress}
                  formData={formData}
                  setFormData={setFormData}
                  formErrors={formErrors}
                  setFormErrors={setFormErrors}
                  customerUser={customerUser}
                  onNavigate={onNavigate}
                  deliveryType={deliveryType}
                  setDeliveryType={setDeliveryType}
                />
              ) : (
                /* Takeaway Form */
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, fontFamily: "var(--font-serif)", marginBottom: 6 }}>
                        Full Name *
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          placeholder="e.g. Aarav Sharma"
                          value={formData.name}
                          onChange={(e) => {
                            setFormData({ ...formData, name: e.target.value });
                            if (formErrors.name) setFormErrors((p) => ({ ...p, name: null }));
                          }}
                          style={{
                            width: "100%",
                            padding: "10px 12px 10px 34px",
                            fontSize: 13,
                            borderRadius: "var(--radius-sm)",
                            border: `1px solid ${formErrors.name ? "#DC2626" : "var(--border-color)"}`,
                            backgroundColor: "var(--bg-app)",
                            outline: "none"
                          }}
                        />
                        <User size={15} style={{ position: "absolute", left: 10, top: 12, color: "var(--color-bronze)" }} />
                      </div>
                      {formErrors.name && (
                        <span style={{ color: "#DC2626", fontSize: 11, marginTop: 3, display: "block" }}>
                          {formErrors.name}
                        </span>
                      )}
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, fontFamily: "var(--font-serif)", marginBottom: 6 }}>
                        10-Digit Mobile Number *
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="9876543210"
                          value={formData.phone}
                          onChange={(e) => {
                            setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") });
                            if (formErrors.phone) setFormErrors((p) => ({ ...p, phone: null }));
                          }}
                          style={{
                            width: "100%",
                            padding: "10px 12px 10px 34px",
                            fontSize: 13,
                            borderRadius: "var(--radius-sm)",
                            border: `1px solid ${formErrors.phone ? "#DC2626" : "var(--border-color)"}`,
                            backgroundColor: "var(--bg-app)",
                            outline: "none"
                          }}
                        />
                        <Phone size={15} style={{ position: "absolute", left: 10, top: 12, color: "var(--color-bronze)" }} />
                      </div>
                      {formErrors.phone && (
                        <span style={{ color: "#DC2626", fontSize: 11, marginTop: 3, display: "block" }}>
                          {formErrors.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, fontFamily: "var(--font-serif)", marginBottom: 6 }}>
                      Special Pickup Notes (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Preparing for arrival in 15 mins..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        fontSize: 13,
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "var(--bg-app)",
                        outline: "none"
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Payment Info Banner — Razorpay Exclusive Checkout */}
            <div className="bistro-card mobile-card-compact" style={{ padding: "clamp(14px, 3vw, 24px)", backgroundColor: "#FFFFFF" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
                borderBottom: "1px solid var(--border-color)",
                paddingBottom: 12
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: "rgba(22, 163, 74, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#16A34A"
                  }}>
                    <Lock size={16} />
                  </div>
                  <div>
                    <h3 style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 18,
                      fontWeight: 700,
                      color: "var(--color-ink)",
                      margin: 0
                    }}>
                      Razorpay Online Checkout
                    </h3>
                    <span style={{ fontSize: 11, color: "var(--color-ink-soft)" }}>
                      Razorpay only • 256-Bit Bank Encrypted
                    </span>
                  </div>
                </div>

                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 10,
                  fontFamily: "var(--font-serif)",
                  fontWeight: 700,
                  color: "#16A34A",
                  backgroundColor: "rgba(240, 253, 244, 0.9)",
                  padding: "4px 8px",
                  borderRadius: "var(--radius-pill)"
                }}>
                  <ShieldCheck size={12} />
                  <span>SECURE GATEWAY</span>
                </div>
              </div>

              {/* Payment Info: Razorpay only */}
              <div style={{
                backgroundColor: "rgba(22, 163, 74, 0.06)",
                borderRadius: 10,
                border: "1px solid rgba(22, 163, 74, 0.2)",
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 8
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-serif)", fontSize: 14, fontWeight: 700, color: "#15803d" }}>
                  <CreditCard size={16} />
                  <span>Exclusive Razorpay Payment Options</span>
                </div>
                <p style={{ fontSize: 12, color: "#166534", margin: 0, lineHeight: 1.5 }}>
                  Home delivery and takeaway orders are processed exclusively through <strong>Razorpay</strong>. You can pay securely with <strong>UPI (GPay, PhonePe, Paytm, BHIM)</strong>, <strong>Credit &amp; Debit Cards</strong>, <strong>NetBanking</strong>, or <strong>Wallets</strong>.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#15803d", fontWeight: 600 }}>
                  <ShieldCheck size={13} />
                  <span>Bank-verified instant settlement • No extra transaction charges</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Place Order Button */}
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
                Order Summary ({cart.reduce((a, b) => a + b.quantity, 0)} items)
              </h3>

              {/* Mini Item List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 180, overflowY: "auto", marginBottom: 16 }}>
                {cart.map((item) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--color-ink-soft)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.quantity}x {item.name}
                    </span>
                    <span style={{ fontWeight: 600, color: "var(--color-ink)" }}>
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bill Details */}
              <div style={{
                borderTop: "1px solid var(--border-color)",
                paddingTop: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                fontSize: 13
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-ink-soft)" }}>
                  <span>Item Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-ink-soft)" }}>
                  <span>Delivery Fee</span>
                  <span>{deliveryFee === 0 ? <strong style={{ color: "#16A34A" }}>FREE</strong> : `₹${deliveryFee}`}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-ink-soft)" }}>
                  <span>Taxes (5% GST)</span>
                  <span>₹{taxes}</span>
                </div>
                <div style={{
                  borderTop: "1px dashed var(--border-color)",
                  paddingTop: 10,
                  marginTop: 4,
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 18,
                  fontWeight: 700,
                  fontFamily: "var(--font-serif)",
                  color: "var(--color-ink)"
                }}>
                  <span>Total Due</span>
                  <span style={{ color: "var(--color-bronze-dark)" }}>₹{total}</span>
                </div>
              </div>

              {/* Delivery Ineligibility Warning Callout */}
              {deliveryType === "delivery" && !deliveryEligibility.isEligible && (
                <div
                  style={{
                    marginTop: 16,
                    padding: "12px 14px",
                    backgroundColor: "#FEF2F2",
                    border: "1px solid #FCA5A5",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "#991B1B",
                    lineHeight: 1.45,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700 }}>
                    <AlertCircle size={16} style={{ color: "#DC2626", flexShrink: 0 }} />
                    <span>
                      {!deliveryEligibility.meetsMinSubtotal
                        ? `Minimum ₹${DELIVERY_CONFIG?.MIN_DELIVERY_SUBTOTAL || 299} Required for Delivery`
                        : "Delivery Zone Restriction"}
                    </span>
                  </div>
                  <div>{deliveryEligibility.reason}</div>
                </div>
              )}

              {/* Pay Now Button */}
              {deliveryType === "delivery" && !deliveryEligibility.isEligible ? (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  <button
                    type="button"
                    disabled
                    className="touch-target-44"
                    style={{
                      width: "100%",
                      padding: "14px 20px",
                      fontSize: 13,
                      fontWeight: 700,
                      backgroundColor: "#F3F4F6",
                      color: "#9CA3AF",
                      border: "1px solid #E5E7EB",
                      borderRadius: "var(--radius-pill)",
                      cursor: "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      minHeight: 48
                    }}
                  >
                    <AlertCircle size={15} style={{ color: "#9CA3AF" }} />
                    <span>
                      {!deliveryEligibility.meetsMinSubtotal
                        ? `Add ₹${deliveryEligibility.amountNeeded} more for Delivery`
                        : "Outside 2 km Delivery Zone"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryType("pickup")}
                    className="btn-pill-black touch-target-44"
                    style={{
                      width: "100%",
                      padding: "12px 18px",
                      fontSize: 12.5,
                      minHeight: 44,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      backgroundColor: "var(--color-bronze-dark)"
                    }}
                  >
                    <Store size={14} />
                    <span>Switch to Pickup to Place Order</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handlePayAndPlaceOrder}
                  disabled={isPlacingOrder}
                  className="btn-pill-black touch-target-44"
                  style={{
                    width: "100%",
                    padding: "14px 20px",
                    fontSize: 13,
                    marginTop: 20,
                    minHeight: 48,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    opacity: isPlacingOrder ? 0.7 : 1,
                    cursor: isPlacingOrder ? "not-allowed" : "pointer"
                  }}
                >
                  {isPlacingOrder ? (
                    <>
                      <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      <span>Opening Razorpay...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard size={15} />
                      <span>Pay ₹{total} via Razorpay</span>
                    </>
                  )}
                </button>
              )}

              <div style={{
                textAlign: "center",
                fontSize: 10,
                color: "var(--color-ink-soft)",
                marginTop: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4
              }}>
                <ShieldCheck size={13} color="#16A34A" />
                <span>Verified SSL Payment Gateway • No extra surcharge</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real UPI PaymentModal — opens when user clicks Pay (before Firebase order is created) */}
      <PaymentModal
        isOpen={Boolean(pendingPaymentOrder)}
        order={pendingPaymentOrder}
        onClose={() => {
          // Closed without paying — no Firebase order was created, cart intact, user can retry
          setPendingPaymentOrder(null);
        }}
        onPaymentSuccess={async (paymentResult) => {
          // Payment confirmed via Razorpay — NOW create the real Firebase order
          try {
            const paidAt = new Date().toISOString();
            const txnId = paymentResult?.paymentId || `RZP_${Date.now().toString().slice(-8)}`;
            await submitOnlineOrder(
              {
                method: "razorpay",
                transactionId: txnId,
                paymentId: txnId,
                razorpayOrderId: paymentResult?.orderId || "",
                userId: pendingPaymentOrder.userId,
                customerName: pendingPaymentOrder.customerName,
                customerPhone: pendingPaymentOrder.customerPhone,
                deliveryAddress: pendingPaymentOrder.deliveryAddress,
                address: pendingPaymentOrder.deliveryAddress,
                landmark: pendingPaymentOrder.landmark || "",
                customerNotes: pendingPaymentOrder.customerNotes || "",
                paymentStatus: "paid_online",
                paymentMethod: "razorpay",
                settledBy: "Razorpay Standard Checkout",
                settledMethod: "razorpay",
                utr: txnId,
                paidAt,
                orderType: pendingPaymentOrder.orderType
              },
              {
                name: pendingPaymentOrder.customerName,
                phone: pendingPaymentOrder.customerPhone,
                address: pendingPaymentOrder.deliveryAddress,
                landmark: pendingPaymentOrder.landmark || "",
                notes: pendingPaymentOrder.customerNotes || ""
              }
            );
          } catch (err) {
            console.error("Order creation after payment failed:", err);
            alert("Payment received but order save failed. Please contact cafe with your payment details.");
          }
          clearCart();
          setPendingPaymentOrder(null);
          onNavigate("order-confirmation");
        }}
      />

      {/* Helper inline keyframe for spin */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
