import React, { useState, useEffect } from "react";
import { X, ArrowRight, CheckCircle, User, Mail, ShieldCheck, Sparkles } from "lucide-react";
import CafeLogoIcon from "../common/CafeLogoIcon";
import { useCustomerAuth } from "../../context/CustomerAuthContext";

export default function CustomerAuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    signInWithGoogle,
    completeProfile,
    pendingProfile,
    cancelPendingAuth,
    demoGoogleSignIn
  } = useCustomerAuth();

  // Step: 'google' | 'profile' | 'success'
  const [step, setStep] = useState("google");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset state when modal opens
  useEffect(() => {
    if (isAuthModalOpen) {
      if (pendingProfile) {
        setStep("profile");
        setName(pendingProfile.name || "");
        setEmail(pendingProfile.email || "");
        setPhone(pendingProfile.phone || "");
      } else {
        setStep("google");
        setName("");
        setPhone("");
        setEmail("");
      }
      setError("");
      setLoading(false);
    }
  }, [isAuthModalOpen, pendingProfile]);

  if (!isAuthModalOpen) return null;

  // 1. Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);

    const res = await signInWithGoogle();
    setLoading(false);

    if (res.success) {
      if (res.isNewUser) {
        setStep("profile");
        setName(res.pendingData?.name || "");
        setEmail(res.pendingData?.email || "");
        setPhone(res.pendingData?.phone || "");
      } else {
        setStep("success");
        setTimeout(() => {
          closeAuthModal();
        }, 1200);
      }
    } else {
      setError(res.error || "Google sign in failed. Please try again.");
    }
  };

  // 2. Handle Profile Completion (Name, Mobile, Email)
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await completeProfile({ name, phone: cleanPhone, email });
    setLoading(false);

    if (res.success) {
      setStep("success");
      setTimeout(() => {
        closeAuthModal();
      }, 1200);
    } else {
      setError(res.error || "Could not save profile.");
    }
  };

  // Demo Sign-In for instant testing
  const handleDemoSignIn = async () => {
    setError("");
    setLoading(true);
    const res = await demoGoogleSignIn("testcustomer@gmail.com", "Aarav Sharma");
    setLoading(false);
    if (res.success) {
      setStep("profile");
      setName(res.pendingData.name);
      setEmail(res.pendingData.email);
      setPhone("9876543210");
    }
  };

  return (
    <div
      className="mobile-modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backgroundColor: "rgba(28, 25, 23, 0.68)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div
        className="animate-fade-in mobile-modal-sheet"
        style={{
          width: "100%",
          maxWidth: 460,
          backgroundColor: "#FAF7F2",
          border: "1px solid var(--border-color)",
          borderRadius: 22,
          boxShadow: "0 20px 45px rgba(28, 25, 23, 0.22)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Top Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="touch-target-44"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 40,
            height: 40,
            minWidth: 40,
            minHeight: 40,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--border-color)",
            color: "var(--color-ink-soft)",
            cursor: "pointer",
            zIndex: 10
          }}
          title="Close sign in"
        >
          <X size={17} />
        </button>

        {/* Modal Header */}
        <div
          style={{
            padding: "26px 24px 18px 24px",
            textAlign: "center",
            backgroundColor: "#FFFFFF",
            borderBottom: "1px solid var(--border-color)"
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
            <CafeLogoIcon size={38} />
          </div>
          <h3
            style={{
              fontFamily: "var(--font-script)",
              fontSize: 32,
              color: "var(--color-bronze)",
              lineHeight: 1,
              marginBottom: 4
            }}
          >
            Two Hearts Cafe
          </h3>
          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 13,
              color: "var(--color-ink-soft)",
              margin: 0
            }}
          >
            {step === "google" && "Sign in with Google to place online orders & track delivery"}
            {step === "profile" && "Complete your delivery contact details"}
            {step === "success" && "You are signed in!"}
          </p>
        </div>

        {/* Body content */}
        <div style={{ padding: "24px 24px 28px 24px" }}>
          {error && (
            <div
              style={{
                marginBottom: 18,
                padding: "11px 14px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "#FEF2F2",
                border: "1px solid #FCA5A5",
                color: "#991B1B",
                fontSize: 12,
                lineHeight: 1.4,
                textAlign: "left"
              }}
            >
              {error}
            </div>
          )}

          {/* STEP 1: Sign in with Google (Gmail only) */}
          {step === "google" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="touch-target-44"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  width: "100%",
                  padding: "14px 20px",
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: "#FFFFFF",
                  border: "1.5px solid var(--border-color)",
                  color: "var(--color-ink)",
                  fontFamily: "var(--font-serif)",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: loading ? "wait" : "pointer",
                  boxShadow: "0 3px 12px rgba(28, 25, 23, 0.06)",
                  transition: "all 0.2s ease",
                  minHeight: 48
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--bg-app)";
                  e.currentTarget.style.borderColor = "var(--color-bronze)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#FFFFFF";
                  e.currentTarget.style.borderColor = "var(--border-color)";
                }}
              >
                {/* Official Google G Logo */}
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{loading ? "Connecting to Google..." : "Continue with Google (Gmail)"}</span>
              </button>

              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: 11,
                color: "#78716C",
                fontFamily: "var(--font-serif)"
              }}>
                <ShieldCheck size={14} style={{ color: "var(--color-bronze)" }} />
                <span>Instant 1-Click Sign-In • No OTP delays or passwords</span>
              </div>

              {/* Quick test option */}
              <div style={{
                marginTop: 8,
                paddingTop: 14,
                borderTop: "1px dashed var(--border-color)",
                textAlign: "center"
              }}>
                <button
                  type="button"
                  onClick={handleDemoSignIn}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 14px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: "#F4ECE3",
                    border: "1px solid var(--border-color)",
                    color: "var(--color-bronze-dark)",
                    fontSize: 11,
                    fontFamily: "var(--font-serif)",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  <Sparkles size={12} style={{ color: "var(--color-bronze)" }} />
                  <span>Test Mode: Quick Demo Login</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Ask Name, Mobile, Email after Google Sign-In */}
          {step === "profile" && (
            <form onSubmit={handleProfileSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{
                padding: "10px 14px",
                backgroundColor: "#ECFDF5",
                border: "1px solid #A7F3D0",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                gap: 10
              }}>
                <CheckCircle size={18} style={{ color: "#059669", flexShrink: 0 }} />
                <div style={{ fontSize: 12, color: "#065F46", lineHeight: 1.4 }}>
                  <strong>Google Account Verified!</strong>
                  <div>Please provide your delivery details so our kitchen and rider can contact you.</div>
                </div>
              </div>

              {/* 1. Full Name */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontFamily: "var(--font-serif)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 700,
                    color: "var(--color-bronze-dark)",
                    marginBottom: 6
                  }}
                >
                  Full Name *
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "11px 12px 11px 36px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "#FFFFFF",
                      fontSize: 14,
                      outline: "none",
                      color: "var(--color-ink)"
                    }}
                  />
                  <User size={16} style={{ position: "absolute", left: 11, top: 12, color: "var(--color-bronze)" }} />
                </div>
              </div>

              {/* 2. Mobile Number */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontFamily: "var(--font-serif)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 700,
                    color: "var(--color-bronze-dark)",
                    marginBottom: 6
                  }}
                >
                  10-Digit Mobile Number (For Delivery Calls) *
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "#FFFFFF",
                    overflow: "hidden"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "11px 12px",
                      backgroundColor: "var(--bg-app)",
                      borderRight: "1px solid var(--border-color)",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--color-ink)"
                    }}
                  >
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    style={{
                      flex: 1,
                      padding: "11px 12px",
                      fontSize: 14,
                      fontWeight: 600,
                      border: "none",
                      outline: "none",
                      color: "var(--color-ink)",
                      backgroundColor: "transparent"
                    }}
                  />
                </div>
              </div>

              {/* 3. Email Address */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontFamily: "var(--font-serif)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 700,
                    color: "var(--color-bronze-dark)",
                    marginBottom: 6
                  }}
                >
                  Email Address *
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="email"
                    required
                    placeholder="e.g. yourname@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "11px 12px 11px 36px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "#FFFFFF",
                      fontSize: 14,
                      outline: "none",
                      color: "var(--color-ink)"
                    }}
                  />
                  <Mail size={16} style={{ position: "absolute", left: 11, top: 12, color: "var(--color-bronze)" }} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length !== 10 || !name.trim()}
                className="btn-pill-black touch-target-44"
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: "13px",
                  fontSize: 13,
                  minHeight: 48,
                  opacity: phone.length === 10 && name.trim() ? 1 : 0.6,
                  cursor: phone.length === 10 && name.trim() ? "pointer" : "not-allowed"
                }}
              >
                <span>{loading ? "Saving Profile..." : "Confirm & Start Ordering"}</span>
                {!loading && <ArrowRight size={15} />}
              </button>

              <div style={{ textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => {
                    cancelPendingAuth();
                    setStep("google");
                    setError("");
                  }}
                  style={{
                    fontSize: 11,
                    color: "var(--color-ink-soft)",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                >
                  Switch Google Account
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Success Confirmation */}
          {step === "success" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  backgroundColor: "#ECFDF5",
                  border: "2px solid #059669",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px auto"
                }}
              >
                <CheckCircle size={32} />
              </div>
              <h4 style={{ fontFamily: "var(--font-serif)", fontSize: 22, margin: "0 0 6px 0" }}>
                Welcome to Two Hearts Cafe!
              </h4>
              <p style={{ fontSize: 13, color: "var(--color-ink-soft)", margin: 0 }}>
                You are securely logged in. Happy ordering!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
