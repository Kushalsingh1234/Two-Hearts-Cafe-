import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  X,
  Plus,
  Minus,
  ShoppingBag,
  Flame,
  Star,
  ArrowRight,
  ArrowUpDown,
  Bike,
  Sparkles,
  Info,
  Check
} from "lucide-react";
import CafeLogoIcon from "../common/CafeLogoIcon";
import { INITIAL_MENU_ITEMS } from "../../data/seedMenu";
import { DISH_PHOTOS, CATEGORY_CARDS } from "./MarketingData";
import { useOnlineOrder } from "../../context/OnlineOrderContext";
import CartDrawer from "../ordering/CartDrawer";

export default function MenuLandingPage({
  menuItems = INITIAL_MENU_ITEMS,
  activeCategory = "all",
  onNavigate
}) {
  const {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    getItemQuantity,
    cartCount,
    total,
    deliveryType,
    setDeliveryType,
    isCartDrawerOpen,
    setIsCartDrawerOpen
  } = useOnlineOrder();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState(activeCategory);
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'special' | 'price_asc' | 'price_desc'
  const [bouncedItemId, setBouncedItemId] = useState(null);

  // Sync prop changes
  useEffect(() => {
    if (activeCategory) {
      setSelectedCat(activeCategory);
    }
  }, [activeCategory]);

  const categories = [
    { id: "all", name: "All Dishes" },
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

  // Filter & Search computation
  const filteredDishes = useMemo(() => {
    return menuItems.filter((dish) => {
      // 1. Category Filter
      if (selectedCat !== "all" && dish.category !== selectedCat) {
        return false;
      }

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = dish.name.toLowerCase().includes(query);
        const matchesDesc = (dish.description || "").toLowerCase().includes(query);
        const matchesCat = (dish.category || "").toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCat) {
          return false;
        }
      }

      // 3. Quick Special Filter
      if (activeFilter === "special" && !dish.isSpecial) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (activeFilter === "price_asc") return a.price - b.price;
      if (activeFilter === "price_desc") return b.price - a.price;
      return 0;
    });
  }, [menuItems, selectedCat, searchQuery, activeFilter]);

  // Handle Add Item with bounce trigger
  const handleAddItem = (dish) => {
    addToCart(dish);
    setBouncedItemId(dish.id);
    setTimeout(() => setBouncedItemId(null), 400);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCat("all");
    setActiveFilter("all");
  };

  return (
    <div style={{ width: "100%", overflowX: "clip", backgroundColor: "var(--bg-app)", position: "relative" }}>
      {/* 1. Header Banner & Delivery Mode Bar */}
      <section className="mobile-section-banner" style={{
        paddingTop: "clamp(40px, 6vw, 64px)",
        paddingBottom: 28,
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid var(--border-color)"
      }}>
        <div className="site-container">
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 20
          }}>
            {/* Title & Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <CafeLogoIcon size={38} />
                <span style={{
                  fontFamily: "var(--font-script)",
                  fontSize: "clamp(26px, 4vw, 34px)",
                  color: "var(--color-bronze)",
                  lineHeight: 1
                }}>
                  Two Hearts Cafe
                </span>
              </div>
              <h1 style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(24px, 3.8vw, 34px)",
                fontWeight: 600,
                color: "var(--color-ink)",
                margin: "4px 0 6px 0"
              }}>
                Online Delivery & Takeaway Menu
              </h1>
              <p style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: 14,
                color: "var(--color-bronze)",
                margin: 0
              }}>
                Pure Vegetarian • Handcrafted Fresh to Order • Direct Online Checkout
              </p>
            </div>

            {/* Delivery/Pickup Switch & ETA Badge */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 8
            }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                backgroundColor: "var(--bg-app)",
                padding: "4px 8px",
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--border-color)"
              }}>
                <button
                  type="button"
                  onClick={() => setDeliveryType("delivery")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 16px",
                    borderRadius: "var(--radius-pill)",
                    fontSize: 12,
                    fontFamily: "var(--font-serif)",
                    fontWeight: deliveryType === "delivery" ? 700 : 500,
                    backgroundColor: deliveryType === "delivery" ? "var(--color-ink)" : "transparent",
                    color: deliveryType === "delivery" ? "#FFFFFF" : "var(--color-ink-soft)",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  <Bike size={13} />
                  <span>Delivery</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType("pickup")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 16px",
                    borderRadius: "var(--radius-pill)",
                    fontSize: 12,
                    fontFamily: "var(--font-serif)",
                    fontWeight: deliveryType === "pickup" ? 700 : 500,
                    backgroundColor: deliveryType === "pickup" ? "var(--color-ink)" : "transparent",
                    color: deliveryType === "pickup" ? "#FFFFFF" : "var(--color-ink-soft)",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  <span>Takeaway</span>
                </button>
              </div>

              <span style={{ fontSize: 11, color: "var(--color-ink-soft)", fontFamily: "var(--font-serif)" }}>
                ⚡ Est. <strong>{deliveryType === "delivery" ? "25–35 Mins" : "15–20 Mins"}</strong> • Near Pillar 852, Muradnagar
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2A. STICKY SEARCH BAR (On mobile, this is the ONLY bar pinned at top: 0 while scrolling) */}
      <div className="menu-search-sticky-bar">
        <div className="site-container menu-search-container">
          {/* Row A: Search Bar + Filter Chips */}
          <div className="menu-search-row">
            {/* Live Search Input */}
            <div className="menu-search-wrapper">
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-bronze)",
                  pointerEvents: "none"
                }}
              />
              <input
                id="menu-search-input"
                type="text"
                placeholder="Search dishes by name (e.g. Penne Rosa, Momos, Burger)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 38px 10px 38px",
                  borderRadius: "var(--radius-pill)",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "#FFFFFF",
                  fontSize: 13,
                  outline: "none",
                  boxShadow: "var(--shadow-sm)",
                  transition: "border-color 0.2s ease"
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--color-ink-soft)",
                    cursor: "pointer",
                    background: "none",
                    border: "none"
                  }}
                  title="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Quick Sort / Filter Buttons (Desktop) */}
            <div className="menu-desktop-filters" style={{ display: "flex", alignItems: "center", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
              <button
                type="button"
                onClick={() => setActiveFilter(activeFilter === "special" ? "all" : "special")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "7px 14px",
                  borderRadius: "var(--radius-pill)",
                  fontSize: 12,
                  fontFamily: "var(--font-serif)",
                  fontWeight: activeFilter === "special" ? 700 : 500,
                  backgroundColor: activeFilter === "special" ? "var(--color-ink)" : "#FFFFFF",
                  color: activeFilter === "special" ? "#FFFFFF" : "var(--color-ink)",
                  border: `1px solid ${activeFilter === "special" ? "var(--color-ink)" : "var(--border-color)"}`,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                <Flame size={12} color={activeFilter === "special" ? "#FFA500" : "var(--color-bronze)"} />
                <span>Chef's Specials</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter(activeFilter === "price_asc" ? "all" : "price_asc")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "7px 14px",
                  borderRadius: "var(--radius-pill)",
                  fontSize: 12,
                  fontFamily: "var(--font-serif)",
                  fontWeight: activeFilter === "price_asc" ? 700 : 500,
                  backgroundColor: activeFilter === "price_asc" ? "var(--color-ink)" : "#FFFFFF",
                  color: activeFilter === "price_asc" ? "#FFFFFF" : "var(--color-ink)",
                  border: `1px solid ${activeFilter === "price_asc" ? "var(--color-ink)" : "var(--border-color)"}`,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                <ArrowUpDown size={11} />
                <span>Price: Low to High</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2B. CATEGORY CHIPS CAROUSEL (Sticky on desktop, scrolls naturally on mobile so ONLY search bar is pinned on mobile) */}
      <div className="menu-category-chips-bar">
        <div className="site-container menu-chips-container">
          <div className="no-scrollbar" style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            paddingBottom: 4
          }}>
            {/* Mobile-only Quick Filter Chips */}
            <button
              type="button"
              className="menu-mobile-filter-chip"
              onClick={() => setActiveFilter(activeFilter === "special" ? "all" : "special")}
              style={{
                alignItems: "center",
                gap: 5,
                padding: "6px 14px",
                borderRadius: "var(--radius-pill)",
                fontSize: 12,
                fontFamily: "var(--font-serif)",
                fontWeight: activeFilter === "special" ? 700 : 500,
                backgroundColor: activeFilter === "special" ? "var(--color-ink)" : "#FFFFFF",
                color: activeFilter === "special" ? "#FFFFFF" : "var(--color-ink)",
                border: `1px solid ${activeFilter === "special" ? "var(--color-ink)" : "var(--border-color)"}`,
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              <Flame size={12} color={activeFilter === "special" ? "#FFA500" : "var(--color-bronze)"} />
              <span>Specials</span>
            </button>

            <button
              type="button"
              className="menu-mobile-filter-chip"
              onClick={() => setActiveFilter(activeFilter === "price_asc" ? "all" : "price_asc")}
              style={{
                alignItems: "center",
                gap: 5,
                padding: "6px 14px",
                borderRadius: "var(--radius-pill)",
                fontSize: 12,
                fontFamily: "var(--font-serif)",
                fontWeight: activeFilter === "price_asc" ? 700 : 500,
                backgroundColor: activeFilter === "price_asc" ? "var(--color-ink)" : "#FFFFFF",
                color: activeFilter === "price_asc" ? "#FFFFFF" : "var(--color-ink)",
                border: `1px solid ${activeFilter === "price_asc" ? "var(--color-ink)" : "var(--border-color)"}`,
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              <ArrowUpDown size={11} />
              <span>Price: Low</span>
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCat === cat.id;
              const count = cat.id === "all"
                ? menuItems.length
                : menuItems.filter((i) => i.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCat(cat.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 14px",
                    borderRadius: "var(--radius-pill)",
                    fontSize: 12,
                    fontFamily: "var(--font-serif)",
                    fontWeight: isSelected ? 700 : 500,
                    backgroundColor: isSelected ? "var(--color-bronze)" : "#FFFFFF",
                    color: isSelected ? "#FFFFFF" : "var(--color-ink)",
                    border: `1px solid ${isSelected ? "var(--color-bronze)" : "var(--border-color)"}`,
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: isSelected ? "0 2px 8px rgba(138, 87, 56, 0.2)" : "var(--shadow-sm)"
                  }}
                >
                  <span>{cat.name}</span>
                  <span style={{
                    fontSize: 10,
                    padding: "1px 6px",
                    borderRadius: 10,
                    backgroundColor: isSelected ? "rgba(255, 255, 255, 0.25)" : "var(--bg-app)",
                    color: isSelected ? "#FFFFFF" : "var(--color-ink-soft)"
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Main Dish Catalog */}
      <section style={{
        paddingTop: 32,
        paddingBottom: 120
      }}>
        <div className="site-container">
          {/* Active section header with search count */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 10
          }}>
            <span style={{
              fontFamily: "var(--font-serif)",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--color-bronze)",
              letterSpacing: 0.5
            }}>
              Showing {filteredDishes.length} {filteredDishes.length === 1 ? "dish" : "dishes"}
              {searchQuery && ` matching "${searchQuery}"`}
            </span>

            {(searchQuery || selectedCat !== "all" || activeFilter !== "all") && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  fontSize: 12,
                  fontFamily: "var(--font-serif)",
                  color: "var(--color-bronze)",
                  textDecoration: "underline",
                  cursor: "pointer"
                }}
              >
                Reset all filters
              </button>
            )}
          </div>

          {/* Empty State if 0 matching items */}
          {filteredDishes.length === 0 ? (
            <div className="bistro-card" style={{
              padding: "48px 24px",
              textAlign: "center",
              backgroundColor: "#FFFFFF",
              maxWidth: 460,
              margin: "40px auto"
            }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: "var(--color-bronze-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
                color: "var(--color-bronze)"
              }}>
                <Search size={28} />
              </div>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 20, marginBottom: 6 }}>
                No Dishes Match Your Search
              </h3>
              <p style={{ fontSize: 13, color: "var(--color-ink-soft)", lineHeight: 1.6, marginBottom: 20 }}>
                We couldn't find anything matching "<strong>{searchQuery}</strong>". Try another keyword or browse our full showcase.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-pill-black"
                style={{ padding: "10px 24px", fontSize: 12 }}
              >
                View Full Menu
              </button>
            </div>
          ) : (
            /* Dish Cards Grid */
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 24
            }}>
              {filteredDishes.map((item) => {
                const photoUrl = DISH_PHOTOS[item.id] || "/images/dishes/penne_arabiata.jpg";
                const qty = getItemQuantity(item.id);
                const isBounced = bouncedItemId === item.id;

                return (
                  <div
                    key={item.id}
                    className="bistro-card"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      backgroundColor: "#FFFFFF",
                      overflow: "hidden",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      border: qty > 0 ? "1.5px solid var(--color-bronze)" : "1px solid var(--border-color)",
                      boxShadow: qty > 0 ? "0 4px 18px rgba(138, 87, 56, 0.12)" : "var(--shadow-sm)"
                    }}
                  >
                    {/* Dish Photography */}
                    <div style={{ position: "relative", height: 190, overflow: "hidden", backgroundColor: "var(--bg-app)" }}>
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
                          transition: "transform 0.35s ease"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
                      />

                      {/* Veg Badge & Specialty Tags */}
                      <div style={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        display: "flex",
                        gap: 6
                      }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          backgroundColor: "rgba(255, 255, 255, 0.96)",
                          backdropFilter: "blur(6px)",
                          border: "1px solid rgba(22, 163, 74, 0.3)",
                          borderRadius: "var(--radius-pill)",
                          padding: "2px 8px",
                          fontSize: 10,
                          fontFamily: "var(--font-serif)",
                          fontWeight: 700,
                          color: "var(--color-ink)"
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#16A34A" }} />
                          Veg
                        </span>

                        {item.isSpecial && (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            backgroundColor: "rgba(250, 247, 242, 0.96)",
                            backdropFilter: "blur(6px)",
                            border: "1px solid var(--color-bronze)",
                            borderRadius: "var(--radius-pill)",
                            padding: "2px 8px",
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
                    </div>

                    {/* Card Content & Action Area */}
                    <div style={{
                      padding: "16px 18px",
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                      justifyContent: "space-between"
                    }}>
                      <div>
                        <h4 style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: 17,
                          fontWeight: 700,
                          color: "var(--color-ink)",
                          lineHeight: 1.3,
                          marginBottom: 4
                        }}>
                          {item.name}
                        </h4>

                        <p style={{
                          fontFamily: "var(--font-serif)",
                          fontStyle: "italic",
                          fontSize: 13,
                          color: "var(--color-ink-soft)",
                          lineHeight: 1.5,
                          marginBottom: 14,
                          minHeight: 38
                        }}>
                          {item.description || "Freshly cooked to order with premium Amul dairy & authentic whole spices."}
                        </p>
                      </div>

                      {/* Pricing + Add Button / Stepper */}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: 10,
                        borderTop: "1px solid var(--border-color)"
                      }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{
                            fontFamily: "var(--font-serif)",
                            fontSize: 18,
                            fontWeight: 700,
                            color: "var(--color-ink)"
                          }}>
                            ₹{item.price}
                          </span>
                        </div>

                        {/* If 0: Pill "+ ADD" Button, If >= 1: Stepper */}
                        {qty === 0 ? (
                          <button
                            type="button"
                            onClick={() => handleAddItem(item)}
                            className="btn-pill-black touch-target-44"
                            style={{
                              padding: "8px 20px",
                              minHeight: 44,
                              fontSize: 12,
                              borderRadius: "var(--radius-pill)"
                            }}
                          >
                            <span>+ ADD</span>
                          </button>
                        ) : (
                          <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            backgroundColor: "var(--bg-app)",
                            border: "1.5px solid var(--color-ink)",
                            borderRadius: "var(--radius-pill)",
                            padding: "4px 10px",
                            minHeight: 44,
                            transform: isBounced ? "scale(1.08)" : "scale(1)",
                            transition: "transform 0.2s ease"
                          }}>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "var(--color-ink)",
                                cursor: "pointer",
                                backgroundColor: "#FFFFFF",
                                border: "1px solid var(--border-color)"
                              }}
                              title="Decrease"
                            >
                              <Minus size={13} />
                            </button>
                            <span style={{
                              fontSize: 14,
                              fontWeight: 700,
                              fontFamily: "var(--font-serif)",
                              minWidth: 18,
                              textAlign: "center"
                            }}>
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, qty + 1)}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "var(--color-ink)",
                                cursor: "pointer",
                                backgroundColor: "#FFFFFF",
                                border: "1px solid var(--border-color)"
                              }}
                              title="Increase"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 4. PERSISTENT FLOATING BOTTOM CART BAR (Zomato/Swiggy mobile-style + desktop) */}
      {cartCount > 0 && (
        <div style={{
          position: "fixed",
          bottom: "max(16px, env(safe-area-inset-bottom, 16px))",
          left: 0,
          right: 0,
          zIndex: 40,
          display: "flex",
          justifyContent: "center",
          padding: "0 16px",
          pointerEvents: "none"
        }}>
          <div
            className="animate-fade-in"
            onClick={() => setIsCartDrawerOpen(true)}
            style={{
              pointerEvents: "auto",
              maxWidth: 520,
              width: "100%",
              backgroundColor: "var(--color-ink)",
              color: "#FFFFFF",
              borderRadius: "var(--radius-pill)",
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 10px 30px rgba(28, 25, 23, 0.35)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              cursor: "pointer",
              transition: "transform 0.2s ease"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                position: "relative",
                width: 34,
                height: 34,
                borderRadius: "50%",
                backgroundColor: "var(--color-bronze)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <ShoppingBag size={16} />
              </div>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-serif)", display: "block" }}>
                  {cartCount} {cartCount === 1 ? "Item" : "Items"} • ₹{total}
                </span>
                <span style={{ fontSize: 10, color: "var(--color-bronze-light)", opacity: 0.9 }}>
                  Extra taxes & packaging calculated
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>
              <span>View Cart</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      )}

      {/* 5. Sliding Cart Drawer */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
}
