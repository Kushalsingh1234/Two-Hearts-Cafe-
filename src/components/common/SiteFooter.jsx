import React from "react";
import { MapPin, Phone, Clock, Heart, BookOpen } from "lucide-react";
import CafeLogoIcon from "./CafeLogoIcon";
import { CAFE_INFO } from "../../data/seedMenu";

export default function SiteFooter({ setPage }) {
  const handleNav = (pageId) => {
    setPage(pageId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer style={{
      backgroundColor: "#F3ECE2",
      borderTop: "1px solid var(--border-color)",
      color: "var(--color-ink)",
      paddingTop: 60,
      paddingBottom: 40,
      marginTop: "auto"
    }}>
      <div className="site-container">
        {/* Main Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 40,
          marginBottom: 48
        }}>
          {/* Column 1: Brand & Identity */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <CafeLogoIcon size={44} />
              <div>
                <span style={{
                  fontFamily: "var(--font-script)",
                  fontSize: 28,
                  color: "var(--color-bronze)",
                  lineHeight: 1,
                  display: "block"
                }}>
                  Two Hearts Cafe
                </span>
                <span style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  color: "var(--color-ink-soft)"
                }}>
                  Boutique Bistro & Comfort Kitchen
                </span>
              </div>
            </div>

            <p style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: 14,
              lineHeight: 1.6,
              color: "var(--color-bronze)"
            }}>
              "Where college conversations turn into lifelong memories over warm, comforting bowls."
            </p>

            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "rgba(138, 87, 56, 0.1)",
              border: "1px solid rgba(138, 87, 56, 0.2)",
              fontSize: 11,
              fontFamily: "var(--font-serif)",
              fontWeight: 600,
              color: "var(--color-bronze-dark)",
              width: "fit-content"
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#16a34a" }} />
              <span>100% Pure Vegetarian Kitchen</span>
            </div>
          </div>

          {/* Column 2: Hours & Hospitality */}
          <div>
            <h4 style={{
              fontFamily: "var(--font-serif)",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              color: "var(--color-ink)",
              marginBottom: 16
            }}>
              Visiting Hours
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <Clock size={16} style={{ color: "var(--color-bronze)", marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, color: "var(--color-ink)" }}>Daily Continuous Service</div>
                  <div style={{ color: "var(--color-bronze)", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
                    12:00 PM – 12:00 PM (Midnight)
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-ink-soft)", marginTop: 2 }}>
                    Dine-in, Table QR Ordering & Quick Takeaway
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() => handleNav("menu")}
                  className="btn-pill-black"
                  style={{ padding: "8px 18px", fontSize: 11 }}
                >
                  <BookOpen size={12} />
                  <span>View Online Menu</span>
                </button>
              </div>
            </div>
          </div>

          {/* Column 3: Location & Neighborhood */}
          <div>
            <h4 style={{
              fontFamily: "var(--font-serif)",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              color: "var(--color-ink)",
              marginBottom: 16
            }}>
              Find Our Bistro
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <MapPin size={16} style={{ color: "var(--color-bronze)", marginTop: 2, flexShrink: 0 }} />
                <div style={{ lineHeight: 1.45 }}>
                  <span style={{ fontWeight: 600 }}>Shivam Vihar Colony, Pillar No. 852</span><br />
                  <span>Near KIET University Campus Gate</span><br />
                  <span>Muradnagar, Uttar Pradesh — 201206</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Phone size={16} style={{ color: "var(--color-bronze)", flexShrink: 0 }} />
                <a
                  href={`tel:${CAFE_INFO.phone}`}
                  style={{
                    color: "var(--color-ink)",
                    textDecoration: "none",
                    fontWeight: 600
                  }}
                >
                  +91 {CAFE_INFO.phone}
                </a>
              </div>
            </div>
          </div>

          {/* Column 4: Quick Navigation */}
          <div>
            <h4 style={{
              fontFamily: "var(--font-serif)",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              color: "var(--color-ink)",
              marginBottom: 16
            }}>
              Explore
            </h4>
            <ul style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              fontSize: 14,
              fontFamily: "var(--font-serif)"
            }}>
              <li>
                <button
                  onClick={() => handleNav("home")}
                  style={{ color: "var(--color-ink-soft)", transition: "color 0.2s" }}
                  onMouseEnter={(e) => (e.target.style.color = "var(--color-bronze)")}
                  onMouseLeave={(e) => (e.target.style.color = "var(--color-ink-soft)")}
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav("about")}
                  style={{ color: "var(--color-ink-soft)", transition: "color 0.2s" }}
                  onMouseEnter={(e) => (e.target.style.color = "var(--color-bronze)")}
                  onMouseLeave={(e) => (e.target.style.color = "var(--color-ink-soft)")}
                >
                  Our Story & Ambience
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav("menu")}
                  style={{ color: "var(--color-ink-soft)", transition: "color 0.2s" }}
                  onMouseEnter={(e) => (e.target.style.color = "var(--color-bronze)")}
                  onMouseLeave={(e) => (e.target.style.color = "var(--color-ink-soft)")}
                >
                  Browse Menu (Pasta, Sandwiches, Noodles, Maggie)
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav("contact")}
                  style={{ color: "var(--color-ink-soft)", transition: "color 0.2s" }}
                  onMouseEnter={(e) => (e.target.style.color = "var(--color-bronze)")}
                  onMouseLeave={(e) => (e.target.style.color = "var(--color-ink-soft)")}
                >
                  Directions & Contact Form
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: "1px solid var(--border-color)",
          paddingTop: 24,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          fontSize: 12,
          color: "var(--color-ink-soft)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span>© {new Date().getFullYear()} Two Hearts Cafe. Crafted with</span>
            <Heart size={12} fill="#8A5738" color="#8A5738" />
            <span>near KIET University.</span>
          </div>

          <div style={{ display: "flex", gap: 20 }}>
            <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
              French Bistro Aesthetics • Authentic Comfort Taste
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
