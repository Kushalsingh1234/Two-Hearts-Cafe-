import React, { useState } from "react";
import { X, Star, CheckCircle, Send } from "lucide-react";
import { submitOrderFeedback } from "../../firebase/services";

export default function OrderFeedbackModal({ order, onClose, onSubmitted }) {
  if (!order) return null;

  const [rating, setRating] = useState(order.rating || 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState(order.feedback || "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const starLabels = {
    1: "Needs Improvement",
    2: "Fair Experience",
    3: "Good & Fresh",
    4: "Very Delicious",
    5: "Excellent Bistro Quality!"
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    await submitOrderFeedback(order.id, { rating, feedback });
    setSubmitting(false);
    setSubmitted(true);

    if (onSubmitted) {
      onSubmitted(order.id, { rating, feedback });
    }

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const activeStarCount = hoverRating || rating;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 95,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backgroundColor: "rgba(28, 25, 23, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: "100%",
          maxWidth: 460,
          backgroundColor: "#FAF7F2",
          borderRadius: 20,
          border: "1px solid var(--border-color)",
          boxShadow: "0 20px 45px rgba(28, 25, 23, 0.2)",
          padding: "28px 24px",
          position: "relative"
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 34,
            height: 34,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--border-color)",
            color: "var(--color-ink-soft)",
            cursor: "pointer"
          }}
        >
          <X size={17} />
        </button>

        {submitted ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: "#ECFDF5",
                border: "2px solid #10B981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto"
              }}
            >
              <CheckCircle size={32} color="#059669" />
            </div>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 24, marginBottom: 6 }}>
              Thank You for Your Review!
            </h3>
            <p style={{ fontSize: 13, color: "var(--color-ink-soft)" }}>
              Your feedback is shared directly with our culinary team.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-serif)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--color-bronze)"
                }}
              >
                Order #{order.orderNumber || order.id}
              </span>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 24, margin: "4px 0 6px 0" }}>
                Rate Your Meal Experience
              </h3>
              <p style={{ fontSize: 13, color: "var(--color-ink-soft)", margin: 0 }}>
                How was the food quality, taste, and temperature?
              </p>
            </div>

            {/* Interactive Stars */}
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 10,
                  padding: "10px 0"
                }}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 4,
                      transition: "transform 0.15s ease",
                      transform: activeStarCount >= star ? "scale(1.15)" : "scale(1)"
                    }}
                  >
                    <Star
                      size={32}
                      fill={star <= activeStarCount ? "#F59E0B" : "transparent"}
                      color={star <= activeStarCount ? "#F59E0B" : "#D1D5DB"}
                    />
                  </button>
                ))}
              </div>

              <div
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--color-bronze-dark)",
                  minHeight: 22
                }}
              >
                {starLabels[activeStarCount] || ""}
              </div>
            </div>

            {/* Written Review */}
            <div style={{ marginBottom: 20 }}>
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
                Tell us more (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="What did you love? Any suggestions for spice levels, crust, or packaging?"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  border: "1.5px solid var(--border-color)",
                  backgroundColor: "#FFFFFF",
                  fontSize: 13,
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  lineHeight: 1.5
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-pill-black"
              style={{
                width: "100%",
                padding: "13px",
                fontSize: 13,
                justifyContent: "center"
              }}
            >
              <span>{submitting ? "Submitting..." : "Submit Rating & Review"}</span>
              {!submitting && <Send size={14} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
