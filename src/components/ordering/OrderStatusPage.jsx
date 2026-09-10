import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Bike,
  ChefHat,
  ShoppingBag,
  Phone,
  MapPin,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Store
} from "lucide-react";
import { useOnlineOrder } from "../../context/OnlineOrderContext";
import CafeLogoIcon from "../common/CafeLogoIcon";

export default function OrderStatusPage({ onNavigate }) {
  const { activeOrder } = useOnlineOrder();
  const isDelivery = activeOrder?.orderType === "delivery";

  // Map order status to progress step:
  // placed / confirmed -> 1
  // preparing -> 2
  // out_for_delivery / ready_for_pickup -> 3
  // delivered / completed -> 4
  // cancelled -> -1
  const getStepFromStatus = (status) => {
    switch (status) {
      case "placed":
        return 1;
      case "confirmed":
        return 1;
      case "preparing":
        return 2;
      case "out_for_delivery":
      case "ready_for_pickup":
        return 3;
      case "delivered":
      case "completed":
        return 4;
      case "cancelled":
        return -1;
      default:
        return 1;
    }
  };

  const currentStep = getStepFromStatus(activeOrder?.status || "placed");
  const isCancelled = activeOrder?.status === "cancelled";

  // Live estimated delivery/ready time from admin or initial estimate
  const estimatedTimeDisplay = activeOrder?.estimatedTime || (activeOrder?.etaMinutes ? `${activeOrder.etaMinutes} mins` : (isDelivery ? "35 mins" : "20 mins"));
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  if (!activeOrder) {
    return (
      <div style={{
        minHeight: "75vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: "var(--bg-app)"
      }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 26, marginBottom: 12 }}>No Active Order</h2>
        <button
          onClick={() => onNavigate("menu")}
          className="btn-pill-black"
          style={{ padding: "12px 24px" }}
        >
          Explore Menu
        </button>
      </div>
    );
  }

  const steps = [
    {
      step: 1,
      title: "Order Confirmed",
      subtitle: "Payment authorized and ticket sent to kitchen",
      icon: CheckCircle2,
      time: "Just now"
    },
    {
      step: 2,
      title: "Handcrafting in Kitchen",
      subtitle: "Our chefs are freshly tossing and preparing your dishes",
      icon: ChefHat,
      time: "In progress"
    },
    {
      step: 3,
      title: isDelivery ? "Out for Delivery" : "Ready for Pickup",
      subtitle: isDelivery
        ? "Delivery partner on the way to your destination"
        : "Your order is packed and waiting at our main counter",
      icon: isDelivery ? Bike : Store,
      time: isDelivery ? "Estimated in 15 mins" : "Estimated in 10 mins"
    },
    {
      step: 4,
      title: isDelivery ? "Delivered" : "Order Completed",
      subtitle: "Enjoy your comforting gourmet meal!",
      icon: ShoppingBag,
      time: "Final step"
    }
  ];

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "var(--bg-app)",
      paddingTop: "clamp(32px, 5vw, 48px)",
      paddingBottom: 80
    }}>
      <div className="site-container-narrow">
        {/* Navigation bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => onNavigate("menu")}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                backgroundColor: "#FFFFFF",
                border: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-ink)",
                cursor: "pointer"
              }}
              title="Back to Menu"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(22px, 3.5vw, 28px)",
                fontWeight: 600,
                color: "var(--color-ink)",
                margin: 0
              }}>
                Live Order Tracker
              </h1>
              <span style={{ fontSize: 12, color: "var(--color-bronze)", fontFamily: "var(--font-serif)", fontWeight: 600 }}>
                Order #{activeOrder.orderNumber}
              </span>
            </div>
          </div>

          <a
            href="tel:9027012158"
            className="btn-pill-outline"
            style={{ padding: "8px 16px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
          >
            <Phone size={13} style={{ color: "var(--color-bronze)" }} />
            <span>Call Cafe</span>
          </a>
        </div>

        {/* Live ETA Card */}
        <div className="bistro-card" style={{
          padding: "clamp(24px, 4vw, 32px)",
          backgroundColor: "#FFFFFF",
          marginBottom: 24,
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <span style={{
                fontSize: 11,
                fontFamily: "var(--font-serif)",
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: "var(--color-bronze)",
                display: "block",
                marginBottom: 4
              }}>
                {isDelivery ? "Estimated Arrival Time" : "Estimated Pickup Ready Time"}
              </span>
              <div style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(28px, 4.5vw, 40px)",
                fontWeight: 700,
                color: isCancelled ? "#DC2626" : "var(--color-ink)",
                lineHeight: 1.1
              }}>
                {isCancelled ? "Order Cancelled" : estimatedTimeDisplay}
              </div>
              {Boolean(activeOrder?.estimatedTime) && !isCancelled && (
                <div style={{
                  fontSize: 11,
                  color: "#16A34A",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  marginTop: 6,
                  backgroundColor: "rgba(22, 163, 74, 0.08)",
                  padding: "3px 10px",
                  borderRadius: "var(--radius-pill)",
                  border: "1px solid rgba(22, 163, 74, 0.2)"
                }}>
                  <span>✓ Updated live by Cafe Kitchen</span>
                </div>
              )}
              <span style={{ fontSize: 12, color: "var(--color-ink-soft)", marginTop: 6, display: "block" }}>
                {isDelivery
                  ? `Delivering to: ${activeOrder.deliveryAddress}`
                  : "Pickup counter: Pillar 852, Muradnagar"}
              </span>
            </div>

            {/* Pulsing Status Orb */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.25)"
            }}>
              <span style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: "#16A34A",
                display: "inline-block",
                animation: "pulse 1.8s infinite ease-in-out"
              }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: isCancelled ? "#DC2626" : "#16A34A", fontFamily: "var(--font-serif)" }}>
                {isCancelled
                  ? "Order Cancelled"
                  : currentStep === 1
                  ? "Order Placed & Confirmed"
                  : currentStep === 2
                  ? "Kitchen is freshly preparing your meal"
                  : currentStep === 3
                  ? (isDelivery ? "Out for Delivery with rider" : "Ready for pickup at cafe counter")
                  : "Order Delivered & Completed"}
              </span>
            </div>
          </div>

          {/* Progress bar line */}
          <div style={{
            width: "100%",
            height: 6,
            backgroundColor: "rgba(230, 223, 213, 0.5)",
            borderRadius: 3,
            marginTop: 24,
            overflow: "hidden"
          }}>
            <div style={{
              width: `${(currentStep / 4) * 100}%`,
              height: "100%",
              backgroundColor: "var(--color-bronze)",
              borderRadius: 3,
              transition: "width 0.4s ease"
            }} />
          </div>
        </div>

        {/* Step-by-Step Delivery Tracker */}
        <div className="bistro-card" style={{ padding: 24, backgroundColor: "#FFFFFF", marginBottom: 24 }}>
          <h3 style={{
            fontFamily: "var(--font-serif)",
            fontSize: 18,
            fontWeight: 700,
            color: "var(--color-ink)",
            marginBottom: 20
          }}>
            Order Progress Journey
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {steps.map((s, idx) => {
              const isPast = s.step < currentStep;
              const isCurrent = s.step === currentStep;
              const isFuture = s.step > currentStep;
              const StepIcon = s.icon;

              return (
                <div key={s.step} style={{ display: "flex", gap: 16, position: "relative" }}>
                  {/* Left Icon Node */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      backgroundColor: isPast || isCurrent ? "var(--color-bronze-light)" : "var(--bg-app)",
                      border: isCurrent
                        ? "2px solid var(--color-bronze)"
                        : isPast
                        ? "1px solid var(--color-bronze)"
                        : "1px solid var(--border-color)",
                      color: isPast || isCurrent ? "var(--color-bronze-dark)" : "var(--color-ink-soft)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      zIndex: 2
                    }}>
                      <StepIcon size={18} />
                    </div>

                    {/* Connecting vertical line */}
                    {idx < steps.length - 1 && (
                      <div style={{
                        width: 2,
                        flex: 1,
                        minHeight: 28,
                        backgroundColor: isPast ? "var(--color-bronze)" : "var(--border-color)",
                        marginTop: 4,
                        marginBottom: 4
                      }} />
                    )}
                  </div>

                  {/* Right Description */}
                  <div style={{ flex: 1, paddingTop: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{
                        fontSize: 15,
                        fontWeight: isCurrent ? 700 : 600,
                        fontFamily: "var(--font-serif)",
                        color: isCurrent ? "var(--color-ink)" : isPast ? "var(--color-ink)" : "#9CA3AF"
                      }}>
                        {s.title}
                      </span>
                      <span style={{
                        fontSize: 11,
                        color: isCurrent ? "var(--color-bronze)" : "#9CA3AF",
                        fontFamily: "var(--font-serif)",
                        fontWeight: 600
                      }}>
                        {s.time}
                      </span>
                    </div>

                    <p style={{
                      fontSize: 12,
                      color: isFuture ? "#9CA3AF" : "var(--color-ink-soft)",
                      marginTop: 2,
                      lineHeight: 1.5
                    }}>
                      {s.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Test step advance controls for demonstration / inspection */}
          <div style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: "1px dashed var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
            fontSize: 11,
            color: "var(--color-ink-soft)"
          }}>
            <span>Demo: Simulate order progression</span>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3, 4].map((stepNum) => (
                <button
                  key={stepNum}
                  onClick={() => setCurrentStep(stepNum)}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "var(--radius-pill)",
                    fontSize: 11,
                    backgroundColor: currentStep === stepNum ? "var(--color-ink)" : "var(--bg-app)",
                    color: currentStep === stepNum ? "#fff" : "var(--color-ink)",
                    border: "1px solid var(--border-color)"
                  }}
                >
                  Step {stepNum}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Collapsible Order Items Summary */}
        <div className="bistro-card" style={{ padding: 20, backgroundColor: "#FFFFFF" }}>
          <button
            onClick={() => setIsDetailsOpen(!isDetailsOpen)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "var(--font-serif)",
              color: "var(--color-ink)",
              cursor: "pointer"
            }}
          >
            <span>View Ordered Items ({activeOrder.items.reduce((a, b) => a + b.quantity, 0)} items) • ₹{activeOrder.total}</span>
            {isDetailsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {isDetailsOpen && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: 8 }}>
              {activeOrder.items.map((item, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--color-ink-soft)" }}>
                    {item.quantity}x {item.name}
                  </span>
                  <span style={{ fontWeight: 600, color: "var(--color-ink)" }}>
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Button to Order More */}
        <div style={{ textAlign: "center", marginTop: 28 }}>
          <button
            onClick={() => onNavigate("menu")}
            className="btn-pill-black"
            style={{ padding: "12px 28px", fontSize: 13 }}
          >
            <span>Order Something Else</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
