import React, { useState } from "react";
import { KeyRound, X, Check, AlertCircle, Eye, EyeOff } from "lucide-react";
import { changeAdminPin } from "../../firebase/auth";

export default function ChangePinModal({ isOpen, onClose }) {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPins, setShowPins] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleReset = () => {
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setError("");
    setSuccess(false);
    setLoading(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!currentPin.trim()) {
      setError("Please enter your current PIN.");
      return;
    }

    if (!newPin.trim() || newPin.trim().length < 4) {
      setError("New PIN must be at least 4 digits long.");
      return;
    }

    if (!/^\d+$/.test(newPin.trim())) {
      setError("New PIN must contain digits only.");
      return;
    }

    if (newPin.trim() !== confirmPin.trim()) {
      setError("New PIN and Confirm PIN do not match.");
      return;
    }

    setLoading(true);
    const res = await changeAdminPin(currentPin.trim(), newPin.trim());
    setLoading(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        handleReset();
      }, 1800);
    } else {
      setError(res.error || "Failed to update PIN. Please verify your current PIN.");
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 100,
      backgroundColor: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16
    }}>
      <div style={{
        backgroundColor: "#FAF7F2",
        borderRadius: 8,
        border: "1.5px solid var(--color-border-frame)",
        padding: "24px 22px",
        width: "100%",
        maxWidth: 420,
        boxShadow: "var(--shadow-floating)"
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              backgroundColor: "#fff",
              border: "1.2px solid var(--color-border-frame)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-ink)"
            }}>
              <KeyRound size={18} />
            </div>
            <div>
              <h3 style={{
                fontFamily: "var(--font-serif)",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--color-ink)",
                margin: 0
              }}>
                Change Admin PIN
              </h3>
              <p style={{
                fontFamily: "var(--font-serif)",
                fontSize: 12,
                fontStyle: "italic",
                color: "var(--color-bronze)",
                margin: "2px 0 0 0"
              }}>
                Verify your old PIN to configure a new one.
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--color-bronze)",
              padding: 4
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Notification */}
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
            marginBottom: 14
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Notification */}
        {success && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: "#dcfce7",
            border: "1px solid #86efac",
            color: "#15803d",
            padding: "10px 12px",
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 14
          }}>
            <Check size={16} style={{ flexShrink: 0 }} />
            <span>PIN changed successfully! Remember your new PIN.</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Current PIN */}
          <div>
            <label style={{
              display: "block",
              fontFamily: "var(--font-serif)",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--color-ink)",
              marginBottom: 4
            }}>
              Current PIN *
            </label>
            <input
              type={showPins ? "text" : "password"}
              maxLength={6}
              required
              autoFocus
              placeholder="Enter current PIN"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "9px 12px",
                borderRadius: 4,
                border: "1.2px solid var(--color-border-frame)",
                backgroundColor: "#fff",
                fontSize: 15,
                fontWeight: 600,
                outline: "none",
                fontFamily: "var(--font-serif)",
                letterSpacing: showPins ? 1 : 4
              }}
            />
          </div>

          {/* New PIN */}
          <div>
            <label style={{
              display: "block",
              fontFamily: "var(--font-serif)",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--color-ink)",
              marginBottom: 4
            }}>
              New PIN (at least 4 digits) *
            </label>
            <input
              type={showPins ? "text" : "password"}
              maxLength={6}
              required
              placeholder="Enter new 4-digit PIN"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "9px 12px",
                borderRadius: 4,
                border: "1.2px solid var(--color-border-frame)",
                backgroundColor: "#fff",
                fontSize: 15,
                fontWeight: 600,
                outline: "none",
                fontFamily: "var(--font-serif)",
                letterSpacing: showPins ? 1 : 4
              }}
            />
          </div>

          {/* Confirm New PIN */}
          <div>
            <label style={{
              display: "block",
              fontFamily: "var(--font-serif)",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--color-ink)",
              marginBottom: 4
            }}>
              Confirm New PIN *
            </label>
            <input
              type={showPins ? "text" : "password"}
              maxLength={6}
              required
              placeholder="Re-enter new PIN"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "9px 12px",
                borderRadius: 4,
                border: "1.2px solid var(--color-border-frame)",
                backgroundColor: "#fff",
                fontSize: 15,
                fontWeight: 600,
                outline: "none",
                fontFamily: "var(--font-serif)",
                letterSpacing: showPins ? 1 : 4
              }}
            />
          </div>

          {/* Toggle PIN visibility */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => setShowPins(!showPins)}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 12,
                fontFamily: "var(--font-serif)",
                color: "var(--color-bronze)",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                cursor: "pointer",
                padding: 0
              }}
            >
              {showPins ? <EyeOff size={13} /> : <Eye size={13} />}
              <span>{showPins ? "Hide PIN" : "Show PIN digits"}</span>
            </button>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
            <button
              type="button"
              onClick={handleReset}
              disabled={loading || success}
              style={{
                padding: "7px 16px",
                borderRadius: "var(--radius-pill)",
                backgroundColor: "#fff",
                border: "1.2px solid var(--color-border-frame)",
                fontFamily: "var(--font-serif)",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-ink)",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              style={{
                padding: "7px 20px",
                borderRadius: "var(--radius-pill)",
                backgroundColor: "var(--color-ink)",
                color: "#FAF7F2",
                border: "none",
                fontFamily: "var(--font-serif)",
                fontSize: 13,
                fontWeight: 700,
                cursor: loading || success ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6
              }}
            >
              {loading ? "Verifying..." : "Update PIN"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
