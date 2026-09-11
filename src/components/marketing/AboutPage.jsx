import React from "react";
import { BookOpen, Coffee, Award } from "lucide-react";
import CafeLogoIcon from "../common/CafeLogoIcon";
import InstagramIcon from "../common/InstagramIcon";
import { CAFE_INFO } from "../../data/seedMenu";
import { CAFE_STORY, VALUES_LIST } from "./MarketingData";

export default function AboutPage({ setPage }) {
  const galleryImages = [
    {
      url: "/images/cafe_ambience_1_heart_lounge.jpg",
      caption: "Our signature floral heart wall & celebration lounge"
    },
    {
      url: "/images/cafe_ambience_2_dining_canopy.jpg",
      caption: "Dining hall under an ethereal wisteria blossom canopy"
    },
    {
      url: "/images/cafe_ambience_3_welcome_counter.jpg",
      caption: "Warm welcome reception & barista counter"
    },
    {
      url: "/images/cafe_ambience_4_wall_decor.png",
      caption: "European classic wall decor, murals & ambient sconces"
    },
    {
      url: "/images/cafe_ambience_5_intimate_nook.jpg",
      caption: "Secluded corner with handwoven yellow cane chairs"
    },
    {
      url: "/images/cafe_ambience_6_amber_sconces.png",
      caption: "Murals in warm amber sconce radiance"
    },
    {
      url: "/images/cafe_ambience_7_banquet_vista.jpg",
      caption: "Long marble feast table beneath wisteria ceiling"
    },
    {
      url: "/images/cafe_ambience_8_memory_wall.jpg",
      caption: "The Better Together memory wall & butterfly lamp date nook"
    },
    {
      url: "/images/cafe_ambience_9_window_lounge.jpg",
      caption: "Crystal chandelier windowside lounge & teatime table"
    },
    {
      url: "/images/cafe_ambience_10_floral_facade.jpg",
      caption: "Enchanting illuminated floral facade & glass storefront at night"
    }
  ];

  return (
    <div style={{ width: "100%", overflowX: "hidden", backgroundColor: "var(--bg-app)" }}>
      {/* Header Banner */}
      <section className="mobile-section-banner" style={{
        paddingTop: "clamp(48px, 7vw, 76px)",
        paddingBottom: "clamp(48px, 7vw, 76px)",
        borderBottom: "1px solid var(--border-color)",
        backgroundColor: "#FFFFFF",
        textAlign: "center"
      }}>
        <div className="site-container-narrow">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <CafeLogoIcon size={52} />
          </div>
          <span style={{
            fontFamily: "var(--font-serif)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            color: "var(--color-bronze)",
            display: "block",
            marginBottom: 8
          }}>
            Our Origins & Philosophy
          </span>
          <h1 style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 600,
            color: "var(--color-ink)",
            lineHeight: 1.18,
            marginBottom: 16
          }}>
            A Tale of Two Hearts in Muradnagar
          </h1>
          <p style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "clamp(16px, 2vw, 19px)",
            color: "var(--color-bronze)",
            lineHeight: 1.6,
            maxWidth: 600,
            margin: "0 auto"
          }}>
            How a humble dream of bringing European cafe intimacy and genuine Indian comfort to Muradnagar became a cherished reality.
          </p>
        </div>
      </section>

      {/* Origin Story Section */}
      <section className="mobile-section-tight" style={{
        paddingTop: "clamp(56px, 8vw, 84px)",
        paddingBottom: "clamp(56px, 8vw, 84px)"
      }}>
        <div className="site-container">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "clamp(36px, 6vw, 64px)",
            alignItems: "center"
          }}>
            {/* Left Story Text */}
            <div>
              <span style={{
                fontFamily: "var(--font-serif)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: "var(--color-bronze)",
                display: "block",
                marginBottom: 8
              }}>
                Our Warm Sanctuary
              </span>
              <h2 style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(26px, 3.5vw, 34px)",
                fontWeight: 600,
                color: "var(--color-ink)",
                lineHeight: 1.25,
                marginBottom: 18
              }}>
                More Than Just Food — A Space to Unwind
              </h2>

              <p style={{
                fontSize: 15,
                color: "var(--color-ink-soft)",
                lineHeight: 1.7,
                marginBottom: 16
              }}>
                Everyday life can be relentlessly demanding — deadlines, work, studies, and endless hustle. We recognized that people didn't just need fast sustenance; they longed for a warm sanctuary where time slows down.
              </p>

              <p style={{
                fontSize: 15,
                color: "var(--color-ink-soft)",
                lineHeight: 1.7,
                marginBottom: 16
              }}>
                Named <strong>"Two Hearts"</strong> to honor both the bonds of genuine companionship and the unison of hearty comforting food, our bistro is curated to feel like an extension of your living room — quiet enough to study, lively enough to share laughs over steaming plates.
              </p>

              <div style={{
                padding: "16px 20px",
                backgroundColor: "var(--color-bronze-light)",
                borderRadius: "var(--radius-sm)",
                borderLeft: "3px solid var(--color-bronze)",
                marginTop: 20
              }}>
                <p style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  fontSize: 14,
                  color: "var(--color-bronze-dark)",
                  lineHeight: 1.55
                }}>
                  "No rushed bills, no blaring televisions. Just gentle jazz, the rich aroma of simmering San Marzano sauce, and freshly pressed garlic breads."
                </p>
              </div>
            </div>

            {/* Right Photo */}
            <div className="bistro-card" style={{
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(28, 25, 23, 0.08)"
            }}>
              <img
                src={CAFE_STORY.imageAmbience1}
                alt="Two Hearts Cafe Warm Interior"
                style={{ width: "100%", height: "clamp(220px, 40vw, 420px)", objectFit: "cover", display: "block" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="mobile-section-tight" style={{
        paddingTop: "clamp(56px, 8vw, 84px)",
        paddingBottom: "clamp(56px, 8vw, 84px)",
        backgroundColor: "#FFFFFF",
        borderTop: "1px solid var(--border-color)",
        borderBottom: "1px solid var(--border-color)"
      }}>
        <div className="site-container">
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 48px auto" }}>
            <span style={{
              fontFamily: "var(--font-serif)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              color: "var(--color-bronze)",
              display: "block",
              marginBottom: 8
            }}>
              Our Core Pillars
            </span>
            <h2 style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(26px, 3.8vw, 36px)",
              fontWeight: 600,
              color: "var(--color-ink)",
              lineHeight: 1.2
            }}>
              What We Stand For Every Day
            </h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 28
          }}>
            {VALUES_LIST.map((val, idx) => (
              <div
                key={idx}
                className="bistro-card mobile-card-compact"
                style={{
                  padding: "32px 26px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start"
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  backgroundColor: "var(--color-bronze-light)",
                  border: "1px solid rgba(138, 87, 56, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20
                }}>
                  {idx === 0 && <BookOpen size={22} style={{ color: "var(--color-bronze)" }} />}
                  {idx === 1 && <Award size={22} style={{ color: "var(--color-bronze)" }} />}
                  {idx === 2 && <Coffee size={22} style={{ color: "var(--color-bronze)" }} />}
                </div>

                <h3 style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--color-ink)",
                  marginBottom: 10
                }}>
                  {val.title}
                </h3>

                <p style={{
                  fontSize: 14,
                  color: "var(--color-ink-soft)",
                  lineHeight: 1.6
                }}>
                  {val.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="mobile-section-tight" style={{
        paddingTop: "clamp(56px, 8vw, 84px)",
        paddingBottom: "clamp(56px, 8vw, 84px)"
      }}>
        <div className="site-container">
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 40px auto" }}>
            <span style={{
              fontFamily: "var(--font-serif)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              color: "var(--color-bronze)",
              display: "block",
              marginBottom: 8
            }}>
              Visual Ambience
            </span>
            <h2 style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(26px, 3.8vw, 36px)",
              fontWeight: 600,
              color: "var(--color-ink)",
              lineHeight: 1.2
            }}>
              A Glimpse Inside Two Hearts
            </h2>
          </div>

          <div className="mobile-2col-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20
          }}>
            {galleryImages.map((img, i) => (
              <div key={i} className="bistro-card bistro-card-hover" style={{ overflow: "hidden" }}>
                <img
                  src={img.url}
                  alt={img.caption}
                  loading="lazy"
                  style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }}
                />
                <div style={{ padding: "14px 16px", backgroundColor: "#fff" }}>
                  <p style={{
                    fontFamily: "var(--font-serif)",
                    fontStyle: "italic",
                    fontSize: 13,
                    color: "var(--color-bronze)"
                  }}>
                    {img.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Direct CTA into Menu page */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 14, marginTop: 48 }}>
            <button
              onClick={() => {
                if (setPage) setPage("menu");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="btn-pill-black touch-target-44"
              style={{ padding: "14px 32px", fontSize: 13 }}
            >
              <BookOpen size={15} />
              <span>Browse Our Complete Menu</span>
            </button>

            <a
              href={CAFE_INFO.instagramUrl || "https://www.instagram.com/Two_hearts_cafe/"}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target-44"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "13px 24px",
                borderRadius: "var(--radius-pill)",
                backgroundColor: "rgba(225, 48, 108, 0.08)",
                border: "1.5px solid rgba(225, 48, 108, 0.28)",
                color: "#E1306C",
                fontFamily: "var(--font-serif)",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(225, 48, 108, 0.16)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(225, 48, 108, 0.08)";
                e.currentTarget.style.transform = "none";
              }}
            >
              <InstagramIcon size={16} color="#E1306C" />
              <span>Follow @{CAFE_INFO.instagram || "Two_hearts_cafe"}</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
