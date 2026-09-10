import React, { useState, useEffect } from "react";
import { X, Star, Heart, CheckCircle2, Sparkles, Send, Utensils, MessageSquare, Flame, Award } from "lucide-react";
import confetti from "canvas-confetti";
import CafeLogoIcon from "../common/CafeLogoIcon";
import { submitTableReview } from "../../firebase/services";

export default function TableReviewModal({ isOpen, onClose, order, onSubmitted }) {
  if (!isOpen || !order) return null;

  const existingReview = order.review;

  // Experience Parameters State
  const [parameters, setParameters] = useState({
    orderQuality: existingReview?.parameters?.orderQuality || 5,
    foodTaste: existingReview?.parameters?.foodTaste || 5,
    service: existingReview?.parameters?.service || 5,
    cafeAesthetic: existingReview?.parameters?.cafeAesthetic || 5
  });

  const [hoverParams, setHoverParams] = useState({
    orderQuality: 0,
    foodTaste: 0,
    service: 0,
    cafeAesthetic: 0
  });

  // Individual Dishes State
  const [dishRatings, setDishRatings] = useState([]);
  const [hoverDishes, setHoverDishes] = useState({});

  // Comments State
  const [comments, setComments] = useState(existingReview?.comments || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Initialize dish ratings from order items (deduplicated)
  useEffect(() => {
    if (order && order.items) {
      const existingDishRatingsMap = new Map();
      if (existingReview?.dishRatings) {
        existingReview.dishRatings.forEach((d) => {
          existingDishRatingsMap.set(d.dishId || d.dishName, d.rating);
        });
      }

      const uniqueItemsMap = new Map();
      order.items.forEach((it) => {
        const key = it.id || it.name;
        if (!uniqueItemsMap.has(key)) {
          uniqueItemsMap.set(key, {
            dishId: it.id || `dish_${it.name.toLowerCase().replace(/\s+/g, "_")}`,
            dishName: it.name,
            price: it.price,
            rating: existingDishRatingsMap.get(it.id || it.name) || 5
          });
        }
      });

      setDishRatings(Array.from(uniqueItemsMap.values()));
    }
  }, [order, existingReview]);

  const PARAMETER_CONFIGS = [
    {
      id: "foodTaste",
      title: "Food Taste & Flavors",
      subtitle: "Seasoning, temperature & deliciousness",
      icon: "😋"
    },
    {
      id: "orderQuality",
      title: "Order Quality & Freshness",
      subtitle: "Ingredient freshness & presentation",
      icon: "🍽️"
    },
    {
      id: "service",
      title: "Cafe Service & Care",
      subtitle: "Attentiveness, speed & friendliness",
      icon: "🛎️"
    },
    {
      id: "cafeAesthetic",
      title: "Aesthetic & Ambiance",
      subtitle: "Lighting, music, vibes & decor",
      icon: "🌿"
    }
  ];

  const STAR_LABELS = {
    1: "Needs Work",
    2: "Fair",
    3: "Good",
    4: "Great",
    5: "Exceptional!"
  };

  const handleParamChange = (paramId, val) => {
    setParameters((prev) => ({ ...prev, [paramId]: val }));
  };

  const handleDishRatingChange = (dishId, val) => {
    setDishRatings((prev) =>
      prev.map((d) => (d.dishId === dishId ? { ...d, rating: val } : d))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const reviewPayload = {
        orderId: order.id,
        orderNumber: order.orderNumber || "TH-1001",
        tableNumber: order.tableNumber || "1",
        parameters,
        dishRatings,
        comments
      };

      const saved = await submitTableReview(reviewPayload);

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // Confetti fallback
      }

      setIsSuccess(true);
      if (onSubmitted) {
        onSubmitted(saved);
      }

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Failed to submit review:", err);
      alert("Something went wrong saving your review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 95,
        backgroundColor: "rgba(28, 25, 23, 0.75)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "92vh",
          backgroundColor: "#FAF7F2",
          borderRadius: 12,
          border: "2px solid var(--color-border-frame)",
          boxShadow: "var(--shadow-floating)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1.5px solid var(--color-border-frame)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#FAF7F2"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CafeLogoIcon size={24} />
            <div>
              <div
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 16,
                  fontWeight: 800,
                  color: "var(--color-ink)",
                  lineHeight: 1.1
                }}
              >
                Rate Your Experience
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-serif)",
                  color: "var(--color-bronze)",
                  marginTop: 1
                }}
              >
                Table #{order.tableNumber} • Order #{order.orderNumber || order.id}
              </div>
            </div>
          </div>

          <button
            type="button"
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

        {/* Modal Body */}
        <div style={{ padding: "18px 20px", overflowY: "auto", flex: 1 }}>
          {isSuccess ? (
            <div style={{ textAlign: "center", padding: "36px 12px" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  backgroundColor: "#ECFDF5",
                  border: "2.5px solid #10B981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px auto",
                  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.2)"
                }}
              >
                <CheckCircle2 size={36} color="#059669" />
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-script)",
                  fontSize: 34,
                  color: "var(--color-bronze)",
                  margin: "0 0 6px 0"
                }}
              >
                Thank You So Much!
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 14,
                  color: "var(--color-ink)",
                  maxWidth: 340,
                  margin: "0 auto 8px auto",
                  lineHeight: 1.5
                }}
              >
                Your review and dish ratings have been shared directly with our kitchen and management team.
              </p>
              <div
                style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  fontSize: 12,
                  color: "var(--color-bronze)"
                }}
              >
                We hope to welcome you back to Two Hearts Cafe soon!
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Intro Banner */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 8,
                  border: "1px solid var(--color-border-frame)",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    backgroundColor: "#FAF7F2",
                    border: "1px solid var(--color-border-frame)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    flexShrink: 0
                  }}
                >
                  ✨
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--color-ink)"
                    }}
                  >
                    Your feedback shapes our craft
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 11.5,
                      color: "var(--color-bronze)",
                      lineHeight: 1.3
                    }}
                  >
                    Rate the parameters below and review the dishes you enjoyed today.
                  </div>
                </div>
              </div>

              {/* SECTION 1: Overall Experience Parameters */}
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 12,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    color: "var(--color-bronze)",
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <Award size={14} />
                  <span>1. Overall Experience Ratings</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {PARAMETER_CONFIGS.map((param) => {
                    const currentVal = parameters[param.id] || 5;
                    const hoverVal = hoverParams[param.id] || 0;
                    const activeVal = hoverVal || currentVal;

                    return (
                      <div
                        key={param.id}
                        style={{
                          backgroundColor: "#ffffff",
                          borderRadius: 8,
                          border: "1px solid var(--color-border-frame)",
                          padding: "10px 14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: 8
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 15 }}>{param.icon}</span>
                            <span
                              style={{
                                fontFamily: "var(--font-serif)",
                                fontSize: 13,
                                fontWeight: 700,
                                color: "var(--color-ink)"
                              }}
                            >
                              {param.title}
                            </span>
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--font-serif)",
                              fontSize: 11,
                              color: "var(--color-bronze)",
                              marginLeft: 22
                            }}
                          >
                            {param.subtitle}
                          </div>
                        </div>

                        {/* Stars */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ display: "flex", gap: 3 }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => handleParamChange(param.id, star)}
                                onMouseEnter={() =>
                                  setHoverParams((prev) => ({ ...prev, [param.id]: star }))
                                }
                                onMouseLeave={() =>
                                  setHoverParams((prev) => ({ ...prev, [param.id]: 0 }))
                                }
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  padding: "2px",
                                  transition: "transform 0.12s ease",
                                  transform: activeVal >= star ? "scale(1.15)" : "scale(1)"
                                }}
                              >
                                <Star
                                  size={20}
                                  fill={star <= activeVal ? "#F59E0B" : "transparent"}
                                  color={star <= activeVal ? "#F59E0B" : "#D1D5DB"}
                                />
                              </button>
                            ))}
                          </div>
                          <span
                            style={{
                              fontFamily: "var(--font-serif)",
                              fontSize: 11,
                              fontWeight: 700,
                              color: "var(--color-bronze)",
                              minWidth: 70,
                              textAlign: "right"
                            }}
                          >
                            {STAR_LABELS[activeVal]}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: Separate Dish Ratings */}
              {dishRatings.length > 0 && (
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 12,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                      color: "var(--color-bronze)",
                      marginBottom: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <Utensils size={14} />
                    <span>2. Rate Your Dishes Separately</span>
                  </div>

                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: 8,
                      border: "1px solid var(--color-border-frame)",
                      padding: "10px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontFamily: "var(--font-serif)",
                        fontStyle: "italic",
                        color: "var(--color-bronze)",
                        borderBottom: "1px dashed var(--color-border-subtle)",
                        paddingBottom: 6
                      }}
                    >
                      Ratings given to each dish are updated in our live menu for all guests to see:
                    </div>

                    {dishRatings.map((dish, idx) => {
                      const currentDishRating = dish.rating || 5;
                      const hoverDishVal = hoverDishes[dish.dishId] || 0;
                      const activeDishVal = hoverDishVal || currentDishRating;

                      return (
                        <div
                          key={dish.dishId || idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: 8,
                            padding: "6px 0",
                            borderBottom:
                              idx < dishRatings.length - 1
                                ? "1px dashed var(--color-border-subtle)"
                                : "none"
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 150 }}>
                            <div
                              style={{
                                fontFamily: "var(--font-serif)",
                                fontSize: 13,
                                fontWeight: 700,
                                color: "var(--color-ink)"
                              }}
                            >
                              {dish.dishName}
                            </div>
                            {dish.price && (
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "var(--color-bronze)",
                                  fontFamily: "var(--font-serif)"
                                }}
                              >
                                Rs.{dish.price}
                              </div>
                            )}
                          </div>

                          {/* Dish Stars */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ display: "flex", gap: 2 }}>
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => handleDishRatingChange(dish.dishId, s)}
                                  onMouseEnter={() =>
                                    setHoverDishes((prev) => ({ ...prev, [dish.dishId]: s }))
                                  }
                                  onMouseLeave={() =>
                                    setHoverDishes((prev) => ({ ...prev, [dish.dishId]: 0 }))
                                  }
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "2px",
                                    transition: "transform 0.12s ease",
                                    transform: activeDishVal >= s ? "scale(1.15)" : "scale(1)"
                                  }}
                                >
                                  <Star
                                    size={18}
                                    fill={s <= activeDishVal ? "#F59E0B" : "transparent"}
                                    color={s <= activeDishVal ? "#F59E0B" : "#D1D5DB"}
                                  />
                                </button>
                              ))}
                            </div>
                            <span
                              style={{
                                fontFamily: "var(--font-serif)",
                                fontSize: 11,
                                fontWeight: 700,
                                color: "var(--color-bronze)",
                                minWidth: 26,
                                textAlign: "right"
                              }}
                            >
                              {activeDishVal}★
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 3: Additional Comments */}
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 12,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    color: "var(--color-bronze)",
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <MessageSquare size={14} />
                  <span>3. Additional Comments & Compliments (Optional)</span>
                </div>

                <textarea
                  rows={3}
                  placeholder="Tell our chefs what you loved, or share any suggestions for your next visit..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 6,
                    border: "1.5px solid var(--color-border-frame)",
                    backgroundColor: "#ffffff",
                    fontSize: 13,
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                    fontFamily: "var(--font-serif)",
                    color: "var(--color-ink)",
                    lineHeight: 1.5
                  }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: "11px 18px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: "transparent",
                    border: "1.5px solid var(--color-border-frame)",
                    color: "var(--color-ink)",
                    fontFamily: "var(--font-serif)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Maybe Later
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "11px 20px",
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
                    boxShadow: "var(--shadow-sm)",
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  <Sparkles size={15} />
                  <span>{isSubmitting ? "Submitting Review..." : "Submit Review & Ratings"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
