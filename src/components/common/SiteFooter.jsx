import React from "react";
import { MapPin, Phone, Clock, Heart, BookOpen } from "lucide-react";
import CafeLogoIcon from "./CafeLogoIcon";
import InstagramIcon from "./InstagramIcon";
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

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
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

              {/* Instagram Follow Badge */}
              <a
                href={CAFE_INFO.instagramUrl || "https://www.instagram.com/Two_hearts_cafe/"}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 11px",
                  borderRadius: "var(--radius-pill)",
                  background: "linear-gradient(135deg, rgba(245, 133, 41, 0.12), rgba(221, 42, 123, 0.12), rgba(129, 52, 175, 0.12))",
                  border: "1px solid rgba(221, 42, 123, 0.3)",
                  color: "var(--color-ink)",
                  textDecoration: "none",
                  fontSize: 11,
                  fontFamily: "var(--font-serif)",
                  fontWeight: 600,
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 3px 8px rgba(221, 42, 123, 0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
                title="Follow Two Hearts Cafe on Instagram"
              >
                <InstagramIcon size={13} color="#E1306C" />
                <span>Follow @{CAFE_INFO.instagram || "Two_hearts_cafe"}</span>
              </a>
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
                    12:00 PM – 12:00 AM (Midnight)
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
                  <span>Delhi-Meerut Road</span><br />
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

              {/* Instagram Handle Line */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <InstagramIcon size={16} color="#E1306C" style={{ flexShrink: 0 }} />
                <a
                  href={CAFE_INFO.instagramUrl || "https://www.instagram.com/Two_hearts_cafe/"}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "var(--color-ink)",
                    textDecoration: "none",
                    fontWeight: 600,
                    transition: "color 0.2s ease"
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "#E1306C")}
                  onMouseLeave={(e) => (e.target.style.color = "var(--color-ink)")}
                  title="Open Two Hearts Cafe on Instagram"
                >
                  @{CAFE_INFO.instagram || "Two_hearts_cafe"}
                </a>
              </div>
            </div>
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
            <span>in Muradnagar.</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
              French Bistro Aesthetics • Authentic Comfort Taste
            </span>
            <a
              href="/?admin=true"
              style={{
                color: "var(--color-ink-soft)",
                textDecoration: "none",
                fontSize: 11,
                fontFamily: "var(--font-serif)",
                opacity: 0.75,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.opacity = "1";
                e.target.style.color = "var(--color-bronze)";
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = "0.75";
                e.target.style.color = "var(--color-ink-soft)";
              }}
              title="Staff & Admin Portal"
            >
              Staff Portal →
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
