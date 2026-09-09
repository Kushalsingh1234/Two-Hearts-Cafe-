import React, { useState } from "react";
import { QrCode, Flame } from "lucide-react";
import CafeLogoIcon from "../common/CafeLogoIcon";
import { INITIAL_MENU_ITEMS } from "../../data/seedMenu";
import { DISH_PHOTOS, CATEGORY_CARDS } from "./MarketingData";

export default function MenuLandingPage({ menuItems = INITIAL_MENU_ITEMS, activeCategory = "all", onSelectCategory }) {
  const [selectedCat, setSelectedCat] = useState(activeCategory);

  const categories = [
    { id: "all", name: "Full Showcase" },
    { id: "pasta", name: "Artisanal Pasta" },
    { id: "pizza", name: "Hand-Stretched Pizza" },
    { id: "burger", name: "Artisan Burgers" },
    { id: "sandwiches", name: "Grilled Sandwiches" },
    { id: "momo", name: "Himalayan Momos" },
    { id: "roll", name: "Artisan Rolls" },
    { id: "combo", name: "Value Combos" },
    { id: "platter", name: "Bistro Thalis & Platters" },
    { id: "desi", name: "Desi Main Course" },
    { id: "breads", name: "Breads & Parathas" },
    { id: "noodles", name: "Wok Noodles" },
    { id: "rice", name: "Fried Rice" },
    { id: "paneer", name: "Paneer Specials" },
    { id: "snacks", name: "Bistro Snacks" },
    { id: "waffles", name: "Belgian Waffles" },
    { id: "shakes", name: "Shakes & Beverages" },
    { id: "maggie", name: "Comfort Maggie" }
  ];

  const handleTabChange = (catId) => {
    setSelectedCat(catId);
    if (onSelectCategory) onSelectCategory(catId);
  };

  const filteredItems = selectedCat === "all"
    ? menuItems
    : menuItems.filter((i) => i.category === selectedCat);

  return (
    <div style={{ width: "100%", overflowX: "hidden", backgroundColor: "var(--bg-app)" }}>
      {/* 1. Header Banner */}
      <section style={{
        paddingTop: "clamp(52px, 8vw, 84px)",
        paddingBottom: "clamp(44px, 6vw, 68px)",
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid var(--border-color)",
        textAlign: "center"
      }}>
        <div className="site-container-narrow">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <CafeLogoIcon size={54} />
          </div>

          <span style={{
            fontFamily: "var(--font-serif)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1.8,
            textTransform: "uppercase",
            color: "var(--color-bronze)",
            display: "block",
            marginBottom: 8
          }}>
            Pure Vegetarian • Crafted Fresh to Order
          </span>

          <h1 style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(34px, 5.5vw, 52px)",
            fontWeight: 600,
            color: "var(--color-ink)",
            lineHeight: 1.15,
            marginBottom: 16
          }}>
            Our Culinary Repertoire
          </h1>

          <p style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "clamp(16px, 2.2vw, 19px)",
            color: "var(--color-bronze)",
            lineHeight: 1.6,
            maxWidth: 620,
            margin: "0 auto 28px auto"
          }}>
            Browse through our slow-simmered pastas, golden crusted sandwiches, smokey wok noodles, and heartwarming maggie bowls.
          </p>

          {/* Elegant QR Ordering Notice */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            backgroundColor: "var(--color-bronze-light)",
            border: "1px solid rgba(138, 87, 56, 0.25)",
            borderRadius: "var(--radius-pill)",
            padding: "10px 22px",
            boxShadow: "0 2px 8px rgba(138, 87, 56, 0.08)"
          }}>
            <QrCode size={18} style={{ color: "var(--color-bronze)", flexShrink: 0 }} />
            <span style={{
              fontFamily: "var(--font-serif)",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-bronze-dark)",
              letterSpacing: "0.02em"
            }}>
              Visiting the cafe? <em>Scan the physical QR code at your table to place your order.</em>
            </span>
          </div>
        </div>
      </section>

      {/* 2. Visual Category Strip */}
      <section style={{
        paddingTop: 32,
        paddingBottom: 32,
        backgroundColor: "var(--bg-app)",
        borderBottom: "1px solid var(--border-color)"
      }}>
        <div className="site-container">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 16
          }}>
            {CATEGORY_CARDS.map((cat) => (
              <div
                key={cat.id}
                onClick={() => handleTabChange(cat.id)}
                className="bistro-card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 16px",
                  cursor: "pointer",
                  border: selectedCat === cat.id ? "1.5px solid var(--color-bronze)" : "1px solid var(--border-color)",
                  backgroundColor: selectedCat === cat.id ? "#FFFFFF" : "rgba(255, 255, 255, 0.75)",
                  boxShadow: selectedCat === cat.id ? "0 4px 14px rgba(138, 87, 56, 0.14)" : "var(--shadow-sm)",
                  transition: "all 0.22s ease"
                }}
              >
                <img
                  src={cat.image}
                  alt={cat.title}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/images/dishes/penne_arabiata.jpg";
                  }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0,
                    border: "1px solid var(--border-color)"
                  }}
                />
                <div>
                  <span style={{
                    fontSize: 10,
                    fontFamily: "var(--font-serif)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    color: "var(--color-bronze)",
                    display: "block"
                  }}>
                    {cat.eyebrow}
                  </span>
                  <h4 style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 16,
                    fontWeight: 700,
                    color: selectedCat === cat.id ? "var(--color-bronze-dark)" : "var(--color-ink)",
                    margin: "2px 0 0 0"
                  }}>
                    {cat.title}
                  </h4>
                  <span style={{ fontSize: 11, color: "var(--color-ink-soft)" }}>
                    from Rs. {cat.startPrice}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Category Filter Tabs & Dish Showcase */}
      <section style={{
        paddingTop: 48,
        paddingBottom: 88
      }}>
        <div className="site-container">
          {/* Filter Pills */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 44
          }}>
            {categories.map((tab) => {
              const isSelected = selectedCat === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  style={{
                    padding: "9px 22px",
                    borderRadius: "var(--radius-pill)",
                    fontFamily: "var(--font-serif)",
                    fontSize: 14,
                    fontWeight: isSelected ? 700 : 500,
                    backgroundColor: isSelected ? "var(--color-ink)" : "#FFFFFF",
                    color: isSelected ? "#FFFFFF" : "var(--color-ink)",
                    border: `1px solid ${isSelected ? "var(--color-ink)" : "var(--border-color)"}`,
                    letterSpacing: "0.04em",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: isSelected ? "0 2px 6px rgba(0, 0, 0, 0.1)" : "var(--shadow-sm)"
                  }}
                >
                  {tab.name}
                </button>
              );
            })}
          </div>

          {/* Dish Cards Grid - Purely View-Only Browsable Showcase */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 28
          }}>
            {filteredItems.map((item) => {
              const photoUrl = DISH_PHOTOS[item.id] || "/images/dishes/penne_arabiata.jpg";

              return (
                <div
                  key={item.id}
                  className="bistro-card bistro-card-hover"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "#FFFFFF"
                  }}
                >
                  {/* High-Resolution Dish Photography */}
                  <div style={{ position: "relative", height: 210, overflow: "hidden" }}>
                    <img
                      src={photoUrl}
                      alt={item.name}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/images/dishes/penne_arabiata.jpg";
                      }}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        transition: "transform 0.4s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
                    />

                    {/* Pure Vegetarian & Chef Special Badges */}
                    <div style={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      display: "flex",
                      gap: 6
                    }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        backgroundColor: "rgba(255, 255, 255, 0.94)",
                        backdropFilter: "blur(6px)",
                        border: "1px solid rgba(230, 223, 213, 0.9)",
                        borderRadius: "var(--radius-pill)",
                        padding: "3px 9px",
                        fontSize: 10,
                        fontFamily: "var(--font-serif)",
                        fontWeight: 700,
                        letterSpacing: 0.6,
                        textTransform: "uppercase",
                        color: "var(--color-ink)"
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#16a34a" }} />
                        Veg
                      </span>

                      {item.isSpecial && (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          backgroundColor: "rgba(250, 247, 242, 0.96)",
                          backdropFilter: "blur(6px)",
                          border: "1px solid var(--color-bronze)",
                          borderRadius: "var(--radius-pill)",
                          padding: "3px 9px",
                          fontSize: 10,
                          fontFamily: "var(--font-serif)",
                          fontStyle: "italic",
                          fontWeight: 700,
                          color: "var(--color-bronze)"
                        }}>
                          <Flame size={10} />
                          Specialty
                        </span>
                      )}
                    </div>

                    {/* Price Ribbon */}
                    <div style={{
                      position: "absolute",
                      bottom: 12,
                      right: 12,
                      backgroundColor: "rgba(28, 25, 23, 0.9)",
                      backdropFilter: "blur(6px)",
                      color: "#FFFFFF",
                      borderRadius: "var(--radius-pill)",
                      padding: "4px 12px",
                      fontFamily: "var(--font-serif)",
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: 0.5
                    }}>
                      Rs. {item.price}
                    </div>
                  </div>

                  {/* Dish Details */}
                  <div style={{
                    padding: "20px 20px 22px 20px",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    justifyContent: "space-between"
                  }}>
                    <div>
                      <h3 style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 19,
                        fontWeight: 700,
                        color: "var(--color-ink)",
                        lineHeight: 1.25,
                        marginBottom: 8
                      }}>
                        {item.name}
                      </h3>

                      <p style={{
                        fontFamily: "var(--font-serif)",
                        fontStyle: "italic",
                        fontSize: 13.5,
                        color: "var(--color-bronze)",
                        lineHeight: 1.5,
                        marginBottom: 14
                      }}>
                        {item.description}
                      </p>
                    </div>

                    {/* Display-Only Category Footer */}
                    <div style={{
                      borderTop: "1px solid var(--border-color)",
                      paddingTop: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 11,
                      fontFamily: "var(--font-serif)",
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                      color: "var(--color-ink-soft)"
                    }}>
                      <span>Category: {item.category}</span>
                      <span style={{ fontStyle: "italic", textTransform: "none", color: "var(--color-bronze)" }}>
                        Table QR to Order
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 4. Elegant Bottom Notice */}
          <div style={{
            marginTop: 56,
            backgroundColor: "#FFFFFF",
            border: "1.2px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "32px 28px",
            textAlign: "center",
            boxShadow: "var(--shadow-sm)",
            maxWidth: 680,
            margin: "56px auto 0 auto"
          }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <CafeLogoIcon size={44} />
            </div>

            <h3 style={{
              fontFamily: "var(--font-serif)",
              fontSize: 22,
              fontWeight: 700,
              color: "var(--color-ink)",
              marginBottom: 8
            }}>
              Ready to Taste? Visit Us Near KIET
            </h3>

            <p style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: 14.5,
              color: "var(--color-bronze)",
              lineHeight: 1.55,
              marginBottom: 8
            }}>
              "Every dish is cooked fresh upon ordering. Simply scan the wooden QR emblem on your table when you arrive, and our staff will bring your meal straight from the kitchen."
            </p>

            <span style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 1.2,
              color: "var(--color-ink-soft)",
              fontWeight: 700
            }}>
              Shivam Vihar Colony, Pillar #852 • Open Daily 12 PM – 12 AM
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
