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

  // Payment Method: 'upi' | 'card' | 'netbanking'
  const [paymentTab, setPaymentTab] = useState("upi");
  const [upiMethod, setUpiMethod] = useState("gpay");
  const [customUpiId, setCustomUpiId] = useState("");

  // Card details
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: ""
  });

  // Netbanking bank selection
  const [selectedBank, setSelectedBank] = useState("hdfc");

  // Payment Processing Modal State
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [processingStep, setProcessingStep] = useState(1); // 1 = contacting bank, 2 = authorizing, 3 = success

  // Redirect if cart is empty
  if (cart.length === 0) {
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

  const handlePayAndPlaceOrder = () => {
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

    // Open Payment Gateway Simulator
    setIsProcessingPayment(true);
    setProcessingStep(1);

    setTimeout(() => {
      setProcessingStep(2);
    }, 1200);

    setTimeout(() => {
      setProcessingStep(3);
    }, 2400);

    setTimeout(async () => {
      try {
        await submitOnlineOrder(
          {
            method: paymentTab === "upi" ? `UPI (${upiMethod.toUpperCase()})` : paymentTab === "card" ? "Credit/Debit Card" : "Net Banking",
            transactionId: `TXN_${Date.now().toString().slice(-8)}`,
            userId: customerUser?.phone || formData.phone.trim(),
            customerName: formData.name.trim(),
            customerPhone: formData.phone.trim(),
            deliveryAddress: formData.address.trim(),
            address: formData.address.trim(),
            landmark: formData.landmark?.trim() || "",
            customerNotes: formData.notes?.trim() || ""
          },
          formData
        );
        setIsProcessingPayment(false);
        onNavigate("order-confirmation");
      } catch (err) {
        console.error("Order submit failed:", err);
        setIsProcessingPayment(false);
        alert("There was an error saving your order. Please check connection.");
      }
    }, 3200);
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

            {/* 2. Online Payment Gateway Interface (ONLY online payments!) */}
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
                      Online Payment Gateway
                    </h3>
                    <span style={{ fontSize: 11, color: "var(--color-ink-soft)" }}>
                      Online payments only • 256-Bit Bank Encrypted
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

              {/* Payment Methods Tabs */}
              <div style={{
                display: "flex",
                gap: 8,
                marginBottom: 20,
                borderBottom: "1px solid var(--border-color)",
                paddingBottom: 10,
                overflowX: "auto"
              }}>
                <button
                  type="button"
                  onClick={() => setPaymentTab("upi")}
                  className="touch-target-44"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    borderRadius: "var(--radius-pill)",
                    fontSize: 12,
                    fontFamily: "var(--font-serif)",
                    fontWeight: paymentTab === "upi" ? 700 : 500,
                    backgroundColor: paymentTab === "upi" ? "var(--color-ink)" : "var(--bg-app)",
                    color: paymentTab === "upi" ? "#FFFFFF" : "var(--color-ink)",
                    border: "1px solid var(--border-color)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    minHeight: 44
                  }}
                >
                  <Smartphone size={13} />
                  <span>Instant UPI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentTab("card")}
                  className="touch-target-44"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    borderRadius: "var(--radius-pill)",
                    fontSize: 12,
                    fontFamily: "var(--font-serif)",
                    fontWeight: paymentTab === "card" ? 700 : 500,
                    backgroundColor: paymentTab === "card" ? "var(--color-ink)" : "var(--bg-app)",
                    color: paymentTab === "card" ? "#FFFFFF" : "var(--color-ink)",
                    border: "1px solid var(--border-color)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    minHeight: 44
                  }}
                >
                  <CreditCard size={13} />
                  <span>Credit / Debit Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentTab("netbanking")}
                  className="touch-target-44"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    borderRadius: "var(--radius-pill)",
                    fontSize: 12,
                    fontFamily: "var(--font-serif)",
                    fontWeight: paymentTab === "netbanking" ? 700 : 500,
                    backgroundColor: paymentTab === "netbanking" ? "var(--color-ink)" : "var(--bg-app)",
                    color: paymentTab === "netbanking" ? "#FFFFFF" : "var(--color-ink)",
                    border: "1px solid var(--border-color)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    minHeight: 44
                  }}
                >
                  <Building2 size={13} />
                  <span>Net Banking</span>
                </button>
              </div>

              {/* Tab 1: UPI */}
              {paymentTab === "upi" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <span style={{ fontSize: 12, color: "var(--color-ink-soft)" }}>
                    Choose your UPI payment app or enter any UPI VPA:
                  </span>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10 }}>
                    {[
                      { id: "gpay", name: "Google Pay" },
                      { id: "phonepe", name: "PhonePe" },
                      { id: "paytm", name: "Paytm UPI" },
                      { id: "bhim", name: "BHIM UPI" }
                    ].map((app) => (
                      <div
                        key={app.id}
                        onClick={() => setUpiMethod(app.id)}
                        style={{
                          padding: "12px 10px",
                          borderRadius: "var(--radius-sm)",
                          border: upiMethod === app.id ? "1.5px solid var(--color-bronze)" : "1px solid var(--border-color)",
                          backgroundColor: upiMethod === app.id ? "var(--color-bronze-light)" : "#FFFFFF",
                          textAlign: "center",
                          cursor: "pointer",
                          fontWeight: upiMethod === app.id ? 700 : 500,
                          fontSize: 12,
                          color: upiMethod === app.id ? "var(--color-bronze-dark)" : "var(--color-ink)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {app.name}
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 4 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--color-ink-soft)", marginBottom: 4 }}>
                      Or Enter UPI ID:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. mobile@upi or username@okhdfcbank"
                      value={customUpiId}
                      onChange={(e) => setCustomUpiId(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        fontSize: 12,
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "var(--bg-app)",
                        outline: "none"
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Credit / Debit Card */}
              {paymentTab === "card" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--color-ink-soft)", marginBottom: 4 }}>
                      Card Number
                    </label>
                    <input
                      type="text"
                      maxLength={19}
                      placeholder="4532 •••• •••• 8892"
                      value={cardData.number}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                        const formatted = val.match(/.{1,4}/g)?.join(" ") || val;
                        setCardData({ ...cardData, number: formatted });
                      }}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        fontSize: 13,
                        letterSpacing: "1px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "var(--bg-app)",
                        outline: "none"
                      }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--color-ink-soft)", marginBottom: 4 }}>
                        Expiry (MM/YY)
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="MM/YY"
                        value={cardData.expiry}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                          if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
                          setCardData({ ...cardData, expiry: v });
                        }}
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          fontSize: 13,
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border-color)",
                          backgroundColor: "var(--bg-app)",
                          outline: "none"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--color-ink-soft)", marginBottom: 4 }}>
                        CVV / CVC
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="•••"
                        value={cardData.cvv}
                        onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, "") })}
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          fontSize: 13,
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border-color)",
                          backgroundColor: "var(--bg-app)",
                          outline: "none"
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--color-ink-soft)", marginBottom: 4 }}>
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      placeholder="Name as printed on card"
                      value={cardData.name}
                      onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
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

              {/* Tab 3: Net Banking */}
              {paymentTab === "netbanking" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <span style={{ fontSize: 12, color: "var(--color-ink-soft)" }}>Select your retail banking portal:</span>
                  {[
                    { id: "hdfc", name: "HDFC Bank" },
                    { id: "sbi", name: "State Bank of India (SBI)" },
                    { id: "icici", name: "ICICI Bank" },
                    { id: "axis", name: "Axis Bank" },
                    { id: "kotak", name: "Kotak Mahindra Bank" }
                  ].map((bank) => (
                    <label
                      key={bank.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: selectedBank === bank.id ? "var(--color-bronze-light)" : "var(--bg-app)",
                        border: selectedBank === bank.id ? "1px solid var(--color-bronze)" : "1px solid var(--border-color)",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: selectedBank === bank.id ? 700 : 500
                      }}
                    >
                      <input
                        type="radio"
                        name="bankSelect"
                        checked={selectedBank === bank.id}
                        onChange={() => setSelectedBank(bank.id)}
                      />
                      <span>{bank.name}</span>
                    </label>
                  ))}
                </div>
              )}
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
                    gap: 8
                  }}
                >
                  <Lock size={14} />
                  <span>Pay ₹{total} & Confirm Order</span>
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

      {/* Simulated Payment Processing Modal */}
      {isProcessingPayment && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(28, 25, 23, 0.75)",
          backdropFilter: "blur(8px)",
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20
        }}>
          <div className="bistro-card animate-fade-in" style={{
            maxWidth: 400,
            width: "100%",
            backgroundColor: "#FFFFFF",
            padding: "36px 28px",
            textAlign: "center",
            boxShadow: "var(--shadow-float)"
          }}>
            {processingStep < 3 ? (
              <>
                <div style={{
                  width: 64,
                  height: 64,
                  margin: "0 auto 20px auto",
                  border: "3px solid rgba(138, 87, 56, 0.2)",
                  borderTopColor: "var(--color-bronze)",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }} />
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                  {processingStep === 1 ? "Connecting to Payment Gateway..." : "Authorizing Transaction..."}
                </h3>
                <p style={{ fontSize: 13, color: "var(--color-ink-soft)", lineHeight: 1.6 }}>
                  Securing payment with 256-bit SSL encryption. Please do not refresh or close this window.
                </p>
              </>
            ) : (
              <>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  backgroundColor: "rgba(34, 197, 94, 0.15)",
                  color: "#16A34A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px auto"
                }}>
                  <CheckCircle2 size={36} />
                </div>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 700, color: "#16A34A", marginBottom: 6 }}>
                  Payment Verified!
                </h3>
                <p style={{ fontSize: 13, color: "var(--color-ink-soft)" }}>
                  Generating your official kitchen order ticket...
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Helper inline keyframe for spin */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
