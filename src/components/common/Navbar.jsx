import React from "react";
import { ShoppingBag, Utensils, ArrowLeft } from "lucide-react";
import CafeLogoIcon from "./CafeLogoIcon";

export default function Navbar({
  currentView,
  setView,
  tableNumber,
  cartCount,
  onOpenCart,
  activeOrderCount,
  onOpenTracker
}) {
  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 40,
      backgroundColor: "rgba(250, 247, 242, 0.96)",
      backdropFilter: "blur(8px)",
      borderBottom: "1px solid var(--border-color)",
      width: "100%",
      maxWidth: "100%",
      boxSizing: "border-box"
    }}>
      <div style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        boxSizing: "border-box"
      }}>
        {/* Brand with Official Cafe Emblem Icon */}
        <a
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none"
          }}
          title="Two Hearts Cafe"
        >
          <CafeLogoIcon size={38} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{
              fontFamily: "var(--font-script)",
              fontSize: "clamp(22px, 5vw, 26px)",
              color: "var(--color-bronze)",
              lineHeight: 1
            }}>
              Two Hearts Cafe
            </span>
            <span style={{
              fontSize: 10,
              fontFamily: "var(--font-serif)",
              color: "var(--color-ink)",
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              marginTop: 2
            }}>
              {currentView === "customer" ? `Table #${tableNumber}` : "Staff / Kitchen Hub"}
            </span>
          </div>
        </a>

        {/* Right Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Customer View Actions */}
          {currentView === "customer" ? (
            <>
              {/* View Menu Showcase Link */}
              <a
                href="/#menu"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 12px",
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: "#fff",
                  border: "1px solid var(--border-color)",
                  fontSize: 11,
                  fontFamily: "var(--font-serif)",
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  color: "var(--color-bronze-dark)",
                  textTransform: "uppercase",
                  textDecoration: "none"
                }}
                title="View Real Menu Showcase"
              >
                <span>View Menu</span>
              </a>
              {/* Active order tracking button */}
              {activeOrderCount > 0 && (
                <button
                  onClick={onOpenTracker}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "6px 11px",
                    backgroundColor: "var(--color-bronze)",
                    color: "#fff",
                    borderRadius: "var(--radius-pill)",
                    fontSize: 12,
                    fontWeight: 600
                  }}
                >
                  <Utensils size={13} />
                  <span>Order Status ({activeOrderCount})</span>
                </button>
              )}

              {/* Cart Button */}
              <button
                onClick={onOpenCart}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 38,
                  height: 38,
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: "#fff",
                  color: "var(--color-ink)",
                  border: "1.2px solid var(--color-ink)"
                }}
                title="View Table Order"
              >
                <ShoppingBag size={18} />
                {cartCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: -3,
                    right: -3,
                    backgroundColor: "var(--color-bronze)",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    {cartCount}
                  </span>
                )}
              </button>
            </>
          ) : (
            /* Staff Dashboard Mode: Back to Table Menu button */
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete("admin");
                url.hash = "";
                window.history.pushState({}, "", url);
                setView("customer");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                borderRadius: "var(--radius-pill)",
                backgroundColor: "#fff",
                border: "1px solid var(--border-color)",
                fontSize: 12,
                fontFamily: "var(--font-serif)",
                fontWeight: 700,
                color: "var(--color-ink)"
              }}
            >
              <ArrowLeft size={13} />
              <span>Customer View</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
