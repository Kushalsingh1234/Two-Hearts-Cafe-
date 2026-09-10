import React, { useState, useEffect } from "react";
import { ArrowRight, CheckCircle, User, Mail, Sparkles, Clock, Receipt, Star, ShieldCheck } from "lucide-react";
import CafeLogoIcon from "../common/CafeLogoIcon";
import { useCustomerAuth } from "../../context/CustomerAuthContext";

export default function SignInPage({ setPage }) {
  const {
    customerUser,
    isLoggedIn,
    signInWithGoogle,
    completeProfile,
    pendingProfile,
    cancelPendingAuth,
    demoGoogleSignIn,
    logout
  } = useCustomerAuth();

  const [step, setStep] = useState("google"); // 'google' | 'profile' | 'success'
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (pendingProfile) {
      setStep("profile");
      setName(pendingProfile.name || "");
      setEmail(pendingProfile.email || "");
      setPhone(pendingProfile.phone || "");
    }
  }, [pendingProfile]);

  // If already logged in
  if (isLoggedIn && customerUser) {
    return (
      <div style={{ padding: "60px 20px 100px 20px", backgroundColor: "var(--bg-app)", minHeight: "80vh" }}>
        <div className="site-container-narrow" style={{ textAlign: "center" }}>
          <div
            className="bistro-card"
            style={{
              padding: "48px 32px",
              maxWidth: 520,
              margin: "0 auto",
              backgroundColor: "#FFFFFF"
            }}
          >
            <div style={{ display: "inline-flex", marginBottom: 12 }}>
              <CafeLogoIcon size={52} />
            </div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 28, marginBottom: 8 }}>
              Welcome back, {customerUser.name || "Customer"}!
            </h2>
            <p style={{ fontSize: 14, color: "var(--color-ink-soft)", marginBottom: 24 }}>
              You are currently signed in with <strong>{customerUser.email || customerUser.phone}</strong>.
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setPage("profile")}
                className="btn-pill-black"
                style={{ padding: "12px 28px" }}
              >
                Go to My Profile
              </button>
              <button
                type="button"
                onClick={() => setPage("menu")}
                className="btn-pill-outline"
                style={{ padding: "12px 24px" }}
              >
                Browse Menu
              </button>
              <button
                type="button"
                onClick={logout}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "12px 18px",
                  fontSize: 13,
                  color: "#DC2626",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          setPage("profile");
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
        setPage("profile");
      }, 1200);
    } else {
      setError(res.error || "Could not save profile.");
    }
  };

  // Demo Sign-In
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
      className="mobile-section-tight"
      style={{
        minHeight: "90vh",
        backgroundColor: "var(--bg-app)",
        padding: "clamp(36px, 6vw, 64px) 20px 100px 20px"
      }}
    >
      <div className="site-container">
        <div
          style={{
            maxWidth: 1020,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 40,
            alignItems: "center"
          }}
        >
          {/* Left Column: Brand & Benefits */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <CafeLogoIcon size={32} />
              <span
                style={{
                  fontFamily: "var(--font-script)",
                  fontSize: 26,
                  color: "var(--color-bronze)"
                }}
              >
                Two Hearts Cafe
              </span>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(28px, 4.5vw, 42px)",
                fontWeight: 600,
                color: "var(--color-ink)",
                lineHeight: 1.15,
                marginBottom: 16
              }}
            >
              Sign In to Order Fresh Artisanal Meals
            </h1>

            <p
              style={{
                fontSize: 15,
                color: "var(--color-ink-soft)",
                lineHeight: 1.6,
                marginBottom: 28,
                maxWidth: 440
              }}
            >
              Sign in with your Google account (Gmail) to order Italian pastas, farm-fresh burgers, and noodles with real-time tracking directly to your hostel or doorstep.
            </p>

            {/* Perks Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { icon: Receipt, title: "1-Click Online Checkout", desc: "Instantly reorder your favorite meals without typing your address again." },
                { icon: Clock, title: "Live Order Status & Receipts", desc: "Track kitchen preparation, rider dispatch, and download PDF receipts." },
                { icon: Star, title: "Rate Dishes & Give Feedback", desc: "Help our chef craft your favorite recipes with your dish reviews." }
              ].map((perk, i) => {
                const IconComp = perk.icon;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 14,
                      padding: "12px 16px",
                      backgroundColor: "#FFFFFF",
                      borderRadius: 14,
                      border: "1px solid var(--border-color)",
                      boxShadow: "0 2px 8px rgba(28, 25, 23, 0.03)"
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        backgroundColor: "var(--color-bronze-light)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--color-bronze)",
                        flexShrink: 0
                      }}
                    >
                      <IconComp size={18} />
                    </div>
                    <div>
                      <h4 style={{ fontFamily: "var(--font-serif)", fontSize: 15, margin: "0 0 2px 0", color: "var(--color-ink)" }}>
                        {perk.title}
                      </h4>
                      <p style={{ fontSize: 12, color: "#78716C", margin: 0, lineHeight: 1.4 }}>
                        {perk.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Sign In Card */}
          <div
            className="bistro-card mobile-card-compact"
            style={{
              backgroundColor: "#FFFFFF",
              padding: "clamp(28px, 5vw, 42px)",
              borderRadius: 24,
              boxShadow: "0 12px 35px rgba(28, 25, 23, 0.08)"
            }}
          >
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <h2
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 26,
                  color: "var(--color-ink)",
                  margin: "0 0 8px 0"
                }}
              >
                {step === "google" && "Sign In with Google"}
                {step === "profile" && "Complete Your Profile"}
                {step === "success" && "You Are Signed In!"}
              </h2>
              <p style={{ fontSize: 13, color: "var(--color-ink-soft)", margin: 0 }}>
                {step === "google" && "Log in securely through Gmail to continue"}
                {step === "profile" && "Please enter your delivery contact details"}
                {step === "success" && "Redirecting to your profile..."}
              </p>
            </div>

            {error && (
              <div
                style={{
                  marginBottom: 20,
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

            {/* STEP 1: Google Login */}
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
                    padding: "15px 20px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: "#FFFFFF",
                    border: "1.5px solid var(--border-color)",
                    color: "var(--color-ink)",
                    fontFamily: "var(--font-serif)",
                    fontSize: 16,
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
                  <svg width="22" height="22" viewBox="0 0 24 24">
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
                  fontSize: 12,
                  color: "#78716C",
                  fontFamily: "var(--font-serif)"
                }}>
                  <ShieldCheck size={15} style={{ color: "var(--color-bronze)" }} />
                  <span>1-Click Safe Login • No OTP or passwords</span>
                </div>

                <div style={{
                  marginTop: 12,
                  paddingTop: 16,
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
                      padding: "7px 16px",
                      borderRadius: "var(--radius-pill)",
                      backgroundColor: "#F4ECE3",
                      border: "1px solid var(--border-color)",
                      color: "var(--color-bronze-dark)",
                      fontSize: 12,
                      fontFamily: "var(--font-serif)",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    <Sparkles size={13} style={{ color: "var(--color-bronze)" }} />
                    <span>Quick Test Login</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Ask Name, Mobile, Email */}
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
                    <strong>Google Sign-In Successful!</strong>
                    <div>Please provide your delivery details so our rider and kitchen can contact you.</div>
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
                    padding: "14px",
                    fontSize: 14,
                    minHeight: 48,
                    opacity: phone.length === 10 && name.trim() ? 1 : 0.6,
                    cursor: phone.length === 10 && name.trim() ? "pointer" : "not-allowed"
                  }}
                >
                  <span>{loading ? "Saving Profile..." : "Confirm & Start Ordering"}</span>
                  {!loading && <ArrowRight size={16} />}
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
                      fontSize: 12,
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
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    backgroundColor: "#ECFDF5",
                    border: "2px solid #059669",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 18px auto"
                  }}
                >
                  <CheckCircle size={36} />
                </div>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 24, margin: "0 0 8px 0" }}>
                  Welcome to Two Hearts Cafe!
                </h3>
                <p style={{ fontSize: 14, color: "var(--color-ink-soft)", margin: 0 }}>
                  You are securely logged in. Redirecting...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
