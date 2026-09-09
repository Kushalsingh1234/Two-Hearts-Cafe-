import React, { useState } from "react";
import { Lock, Mail, KeyRound, ArrowRight, AlertCircle } from "lucide-react";
import { loginWithEmail, registerWithEmail, loginWithPin } from "../../firebase/auth";

export default function StaffLogin({ onLoginSuccess }) {
  const [loginMode, setLoginMode] = useState("pin"); // 'pin' | 'email'
  const [isRegistering, setIsRegistering] = useState(false);

  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await loginWithPin(pin);
    setLoading(false);
    if (res.user) {
      onLoginSuccess(res.user);
    } else {
      setPin("");
      setError(res.error);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    let res;
    if (isRegistering) {
      res = await registerWithEmail(email, password);
    } else {
      res = await loginWithEmail(email, password);
    }
    setLoading(false);

    if (res.user) {
      onLoginSuccess(res.user);
    } else {
      setError(res.error || "Authentication failed. Please check credentials.");
    }
  };

  return (
    <div style={{
      minHeight: "75vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px 16px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: 380,
        backgroundColor: "#ffffff",
        borderRadius: 8,
        border: "1.5px solid var(--border-color)",
        boxShadow: "var(--shadow-md)",
        padding: "28px 24px"
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{
            fontFamily: "var(--font-script)",
            fontSize: 34,
            color: "var(--color-bronze)",
            lineHeight: 1
          }}>
            Two Hearts Cafe
          </div>
          <h2 style={{
            fontFamily: "var(--font-serif)",
            fontSize: 20,
            fontWeight: 700,
            color: "var(--color-ink)",
            marginTop: 4
          }}>
            Staff & Owner Portal
          </h2>
          <p style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: 13,
            color: "var(--color-bronze)",
            marginTop: 2
          }}>
            Kitchen order management & stock controls
          </p>
        </div>

        {/* Tab Toggle between PIN and Email */}
        <div style={{
          display: "flex",
          backgroundColor: "var(--bg-subtle)",
          padding: 3,
          borderRadius: "var(--radius-pill)",
          marginBottom: 20,
          border: "1px solid var(--border-color)"
        }}>
          <button
            type="button"
            onClick={() => { setLoginMode("pin"); setError(""); }}
            style={{
              flex: 1,
              padding: "7px 10px",
              borderRadius: "var(--radius-pill)",
              fontSize: 12,
              fontFamily: "var(--font-serif)",
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              backgroundColor: loginMode === "pin" ? "var(--color-ink)" : "transparent",
              color: loginMode === "pin" ? "#FAF7F2" : "var(--color-ink)",
              transition: "all 0.15s"
            }}
          >
            Counter PIN
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode("email"); setError(""); }}
            style={{
              flex: 1,
              padding: "7px 10px",
              borderRadius: "var(--radius-pill)",
              fontSize: 12,
              fontFamily: "var(--font-serif)",
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              backgroundColor: loginMode === "email" ? "var(--color-ink)" : "transparent",
              color: loginMode === "email" ? "#FAF7F2" : "var(--color-ink)",
              transition: "all 0.15s"
            }}
          >
            Firebase Email
          </button>
        </div>

        {error && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: "#fee2e2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            padding: "8px 12px",
            borderRadius: 4,
            fontSize: 12,
            marginBottom: 16
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {loginMode === "pin" ? (
          <form onSubmit={handlePinSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{
                display: "block",
                fontFamily: "var(--font-serif)",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 6,
                color: "var(--color-ink)"
              }}>
                Enter 4-Digit Staff PIN
              </label>
              <div style={{ position: "relative" }}>
                <KeyRound size={16} style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-bronze)"
                }} />
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  placeholder="• • • •"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px 10px 38px",
                    borderRadius: 4,
                    border: "1.5px solid var(--color-ink)",
                    fontSize: 20,
                    letterSpacing: 6,
                    fontWeight: 700,
                    outline: "none",
                    textAlign: "center"
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: "var(--color-ink)",
                color: "#FAF7F2",
                padding: "11px 16px",
                borderRadius: "var(--radius-pill)",
                fontFamily: "var(--font-serif)",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 4
              }}
            >
              <span>Unlock Kitchen Hub</span>
              <ArrowRight size={15} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{
                display: "block",
                fontFamily: "var(--font-serif)",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 4,
                color: "var(--color-ink)"
              }}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={15} style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-bronze)"
                }} />
                <input
                  type="email"
                  required
                  placeholder="owner@twoheartscafe.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "9px 12px 9px 36px",
                    borderRadius: 4,
                    border: "1px solid var(--border-color)",
                    fontSize: 13,
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{
                display: "block",
                fontFamily: "var(--font-serif)",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 4,
                color: "var(--color-ink)"
              }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={15} style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-bronze)"
                }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "9px 12px 9px 36px",
                    borderRadius: 4,
                    border: "1px solid var(--border-color)",
                    fontSize: 13,
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: "var(--color-ink)",
                color: "#FAF7F2",
                padding: "11px 16px",
                borderRadius: "var(--radius-pill)",
                fontFamily: "var(--font-serif)",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 6,
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              <span>{loading ? "Verifying..." : isRegistering ? "Create Staff Account" : "Sign In"}</span>
              <ArrowRight size={15} />
            </button>

            <button
              type="button"
              onClick={() => { setIsRegistering(!isRegistering); setError(""); }}
              style={{
                fontSize: 12,
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                color: "var(--color-bronze)",
                textDecoration: "underline",
                marginTop: 4,
                textAlign: "center"
              }}
            >
              {isRegistering ? "Already have an account? Sign In" : "First time owner setup? Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
