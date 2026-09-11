import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowRight,
  Sparkles,
  Clock,
  MapPin,
  QrCode,
  HeartHandshake,
  Star,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Flame,
  Heart,
  Layers,
  X,
  Maximize2,
  Eye
} from "lucide-react";
import {
  BRAND_SUBTITLE,
  HERO_IMAGES,
  CATEGORY_CARDS,
  CAFE_STORIES,
  SIGNATURE_ITEMS,
  TRUST_FEATURES,
  TESTIMONIALS,
  CAFE_STORY,
  DISH_PHOTOS,
  getDishPhoto
} from "./MarketingData";
import { INITIAL_MENU_ITEMS, CAFE_INFO } from "../../data/seedMenu";
import CafeLogoIcon from "../common/CafeLogoIcon";
import InstagramIcon from "../common/InstagramIcon";

const POPULAR_CATEGORY_TABS = [
  { id: "all", name: "All Favorites" },
  { id: "pasta", name: "Pasta" },
  { id: "pizza", name: "Pizza" },
  { id: "burger", name: "Burgers" },
  { id: "sandwiches", name: "Sandwiches" },
  { id: "momo", name: "Momos" },
  { id: "roll", name: "Rolls" },
  { id: "combo", name: "Combos" },
  { id: "platter", name: "Platters" },
  { id: "desi", name: "Desi Cuisine" },
  { id: "breads", name: "Breads" },
  { id: "noodles", name: "Noodles" },
  { id: "rice", name: "Rice" },
  { id: "paneer", name: "Paneer" },
  { id: "snacks", name: "Snacks" },
  { id: "waffles", name: "Waffles" },
  { id: "shakes", name: "Shakes" },
  { id: "maggie", name: "Maggie" }
];

const HERO_MOBILE_BANNERS = [
  { id: 1, src: "/images/hero_banner_1.png", alt: "Two Hearts Cafe - White Sauce Pasta & Cold Coffee" },
  { id: 2, src: "/images/hero_banner_2.png", alt: "Two Hearts Cafe - Handcrafted Comfort & Ambience" },
  { id: 3, src: "/images/hero_banner_3.png", alt: "Two Hearts Cafe - Pure Veg Bistro Specials" },
  { id: 4, src: "/images/hero_banner_4.png", alt: "Two Hearts Cafe - Freshly Brewed Happiness" }
];

export default function HomePage({ setPage, menuItems = INITIAL_MENU_ITEMS }) {
  const [selectedPreviewCat, setSelectedPreviewCat] = useState("all");
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);
  const [isStoryExpanded, setIsStoryExpanded] = useState(false);
  const [activeTestimonialIdx, setActiveTestimonialIdx] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [popularLimit, setPopularLimit] = useState(3);
  const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);
  const [heroBannerIdx, setHeroBannerIdx] = useState(0);
  const [mobileDishIdx, setMobileDishIdx] = useState(0);
  const mobileCarouselRef = useRef(null);

  // Auto-rotate testimonials on mobile every 5 seconds
  useEffect(() => {
    const testimonialTimer = setInterval(() => {
      setActiveTestimonialIdx((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(testimonialTimer);
  }, []);

  // Reset story expanded state when switching between spaces/stories
  useEffect(() => {
    setIsStoryExpanded(false);
  }, [activeStoryIdx]);

  // Auto-change hero banner every 4 seconds
  useEffect(() => {
    const bannerTimer = setInterval(() => {
      setHeroBannerIdx((prev) => (prev + 1) % HERO_MOBILE_BANNERS.length);
    }, 4000);
    return () => clearInterval(bannerTimer);
  }, []);

  const popularDishes = useMemo(() => {
    if (selectedPreviewCat === "all") {
      const topIds = [
        "th_penne_alfredo",         // 1st card: White Sauce Pasta
        "th_kitkat_shake",          // 2nd card: Kitkat Shake
        "th_paneer_roll",           // 3rd card: Roll (Paneer Roll)
        "th_aloo_tikki_burger",     // Aloo Tikki Burger
        "th_bombay_grilled",        // Bombay Grilled Sandwich
        "th_cheese_butter_maggie",  // Cheese Butter Maggie
        "th_kurkure_paneer_momo",   // Kurkure Momos
        "th_paneer_tikka_pizza",    // Paneer Tikka Pizza
        "th_chilli_paneer",         // Chilli Paneer
        "th_chocolate_chip_waffle", // Chocolate Chip Waffle
        "th_cold_coffee",           // Classic Cold Coffee
        "th_peri_peri_french_fries" // Peri Peri Fries
      ];
      const featured = topIds
        .map((id) => menuItems.find((m) => m.id === id))
        .filter(Boolean);
      const remaining = menuItems.filter((m) => !topIds.includes(m.id));
      return [...featured, ...remaining];
    }
    return menuItems.filter((item) => item.category === selectedPreviewCat);
  }, [selectedPreviewCat, menuItems]);

  // Reset mobile carousel to start when category filter changes
  useEffect(() => {
    setMobileDishIdx(0);
    if (mobileCarouselRef.current) {
      mobileCarouselRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, [selectedPreviewCat]);

  const handleMobileScroll = (e) => {
    const el = e.currentTarget;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== mobileDishIdx && index >= 0 && index < popularDishes.length) {
      setMobileDishIdx(index);
    }
  };

  const scrollToMobileDish = (targetIdx) => {
    if (!mobileCarouselRef.current) return;
    const clamped = Math.max(0, Math.min(popularDishes.length - 1, targetIdx));
    const width = mobileCarouselRef.current.clientWidth;
    mobileCarouselRef.current.scrollTo({
      left: clamped * width,
      behavior: "smooth"
    });
    setMobileDishIdx(clamped);
  };

  // Auto-rotate stories and ambience preview every 4 seconds automatically without getting stuck on hover
  useEffect(() => {
    if (isGalleryOpen) return;
    const interval = setInterval(() => {
      setActiveStoryIdx((prev) => (prev + 1) % CAFE_STORIES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isGalleryOpen, activeStoryIdx]);

  // Lock body scroll and listen for Escape key when gallery modal is open
  useEffect(() => {
    if (isGalleryOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e) => {
        if (e.key === "Escape") setIsGalleryOpen(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isGalleryOpen]);


  const iconMap = {
    Clock: <Clock size={20} style={{ color: "var(--color-bronze)" }} />,
    MapPin: <MapPin size={20} style={{ color: "var(--color-bronze)" }} />,
    QrCode: <QrCode size={20} style={{ color: "var(--color-bronze)" }} />,
    HeartHandshake: <HeartHandshake size={20} style={{ color: "var(--color-bronze)" }} />
  };

  const handleNav = (pageId) => {
    setPage(pageId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ width: "100%", overflowX: "hidden" }}>
      {/* 1. Subtle Announcement Ribbon in Signature Pure Veg Green */}
      <div className="hero-announcement-ribbon" style={{
        backgroundColor: "#183623",
        borderBottom: "1px solid #12291A",
        padding: "8px 16px",
        textAlign: "center",
        fontSize: 12,
        fontFamily: "var(--font-serif)",
        color: "#E6ECE4",
        letterSpacing: "0.04em"
      }}>
        <span>✨ Welcome to Two Hearts • Open Daily <strong style={{ color: "#FFFFFF", fontWeight: 700 }}>12:00 PM – 12:00 AM</strong> • Pillar #852, Muradnagar • Pure Vegetarian Kitchen</span>
      </div>

      {/* 2. Bold, Full-Bleed Hero Section / Mobile Grand Entrance */}
      <section className="mobile-section-tight hero-section-wrapper" style={{
        position: "relative",
        paddingTop: "clamp(48px, 8vw, 84px)",
        paddingBottom: "clamp(56px, 10vw, 100px)",
        backgroundColor: "var(--bg-app)",
        overflow: "hidden"
      }}>
        {/* Subtle decorative radial glow behind hero */}
        <div style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 800,
          height: 400,
          background: "radial-gradient(circle, rgba(244, 236, 227, 0.7) 0%, rgba(250, 247, 242, 0) 70%)",
          pointerEvents: "none",
          zIndex: 0
        }} />

        <div className="site-container hero-site-container" style={{ position: "relative", zIndex: 1 }}>
          <div className="hero-grid-container" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            alignItems: "center",
            gap: "clamp(36px, 6vw, 64px)"
          }}>
            {/* Left Content Column / Mobile Entrance Experience */}
            <div className="hero-content-col" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <div className="hero-entrance-main">
                {/* Boutique Tag */}
                <div className="hero-boutique-badge" style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 14px",
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: "#fff",
                  border: "1px solid var(--border-color)",
                  marginBottom: 20,
                  boxShadow: "var(--shadow-sm)"
                }}>
                  <Sparkles size={13} style={{ color: "var(--color-bronze)" }} />
                  <span style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    color: "var(--color-bronze)"
                  }}>
                    Boutique Campus Bistro
                  </span>
                </div>

                {/* Main Headline */}
                <h1 className="hero-headline-mobile" style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(34px, 5.5vw, 54px)",
                  fontWeight: 600,
                  color: "var(--color-ink)",
                  lineHeight: 1.14,
                  letterSpacing: "-0.01em",
                  marginBottom: 18
                }}>
                  Where Every Flavor Tells a Story of{" "}
                  <span className="hero-script-highlight" style={{
                    fontFamily: "var(--font-script)",
                    fontSize: "clamp(46px, 7.5vw, 72px)",
                    color: "var(--color-bronze)",
                    fontWeight: 400,
                    display: "inline-block",
                    paddingLeft: 4
                  }}>
                    Two Hearts
                  </span>
                </h1>

                {/* Supporting Subtitle */}
                <p className="hero-subtitle-mobile" style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  fontSize: "clamp(16px, 2.2vw, 19px)",
                  color: "var(--color-bronze)",
                  lineHeight: 1.6,
                  marginBottom: 28,
                  maxWidth: 540
                }}>
                  {BRAND_SUBTITLE}
                </p>

                {/* Mobile Entrance Trust Strip */}
                <div className="hero-mobile-entrance-trust">
                  <div className="hero-trust-item">
                    <div className="veg-badge-dot" />
                    <span>100% Pure Veg</span>
                  </div>
                  <span className="hero-trust-bullet">•</span>
                  <div className="hero-trust-item">
                    <MapPin size={12} style={{ color: "var(--color-bronze)" }} />
                    <span>Pillar #852</span>
                  </div>
                  <span className="hero-trust-bullet">•</span>
                  <div className="hero-trust-item">
                    <Clock size={12} style={{ color: "var(--color-bronze)" }} />
                    <span>Till Midnight</span>
                  </div>
                </div>

                {/* Auto-sliding Panoramic Hero Banners (Changes automatically every 4 seconds) */}
                <div
                  className="hero-mobile-banners-slider"
                  onClick={() => handleNav("menu")}
                  title="Discover Two Hearts Cafe Menu"
                >
                  {HERO_MOBILE_BANNERS.map((banner, idx) => (
                    <img
                      key={banner.id}
                      src={banner.src}
                      alt={banner.alt}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: heroBannerIdx === idx ? 1 : 0,
                        transition: "opacity 0.75s ease-in-out",
                        pointerEvents: heroBannerIdx === idx ? "auto" : "none"
                      }}
                      loading={idx === 0 ? "eager" : "lazy"}
                    />
                  ))}

                  {/* Indicator Dots */}
                  <div style={{
                    position: "absolute",
                    bottom: 7,
                    left: 0,
                    right: 0,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 5,
                    zIndex: 5
                  }}>
                    {HERO_MOBILE_BANNERS.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHeroBannerIdx(idx);
                        }}
                        aria-label={`Slide ${idx + 1}`}
                        style={{
                          width: heroBannerIdx === idx ? 16 : 5,
                          height: 5,
                          borderRadius: 3,
                          backgroundColor: heroBannerIdx === idx ? "#FFFFFF" : "rgba(255, 255, 255, 0.55)",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.45)"
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Entrance Bottom Section: Buttons + Scroll Cue */}
              <div className="hero-entrance-bottom">
                {/* Hero CTA Buttons */}
                <div className="hero-cta-buttons-wrapper" style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 14,
                  marginBottom: 36
                }}>
                  <button
                    onClick={() => handleNav("menu")}
                    className="btn-pill-black touch-target-44 hero-cta-menu-btn"
                    style={{ padding: "14px 30px", fontSize: 13 }}
                  >
                    <BookOpen size={15} />
                    <span>View Menu</span>
                  </button>

                  <button
                    onClick={() => handleNav("about")}
                    className="btn-pill-outline touch-target-44 hero-cta-story-btn"
                    style={{ padding: "13px 26px", fontSize: 13 }}
                  >
                    <span>Our Story & Ambience</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                {/* Mobile Entrance Scroll Cue */}
                <div
                  className="hero-mobile-scroll-cue"
                  onClick={() => {
                    const nextSec = document.getElementById("trust-section");
                    if (nextSec) nextSec.scrollIntoView({ behavior: "smooth" });
                  }}
                  title="Scroll down to explore Two Hearts Cafe"
                >
                  <span>Step Inside & Explore</span>
                  <ChevronDown size={14} className="hero-scroll-chevron" />
                </div>

                {/* Quick Trust Highlights (Desktop) */}
                <div className="hero-quick-highlights-desktop" style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  paddingTop: 18,
                  borderTop: "1px solid var(--border-color)",
                  width: "100%"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#16a34a" }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-ink-soft)" }}>
                      100% Pure Veg
                    </span>
                  </div>
                  <div style={{ width: 1, height: 16, backgroundColor: "var(--border-color)" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-ink-soft)" }}>
                      Near Pillar 852, Muradnagar
                    </span>
                  </div>
                  <div style={{ width: 1, height: 16, backgroundColor: "var(--border-color)" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-ink-soft)" }}>
                      Open till Midnight
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Hero Visual: Brand Emblem on Desktop ONLY */}
            <div className="hero-emblem-wrapper" style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "clamp(8px, 2vw, 24px)"
            }}>
              {/* Desktop Brand Emblem */}
              <img
                className="hero-emblem-img hero-desktop-emblem"
                src="/images/two_hearts_hero_logo_transparent.png"
                alt="Two Hearts Cafe Brand Emblem"
                loading="eager"
                style={{
                  width: "100%",
                  maxWidth: 440,
                  height: "auto",
                  objectFit: "contain",
                  display: "block",
                  filter: "drop-shadow(0 14px 28px rgba(138, 87, 56, 0.12))"
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Trust & Hospitality Strip */}
      <section id="trust-section" className="mobile-section-tight trust-section-wrapper" style={{
        backgroundColor: "#FFFFFF",
        borderTop: "1px solid var(--border-color)",
        borderBottom: "1px solid var(--border-color)",
        paddingTop: 36,
        paddingBottom: 36
      }}>
        <div className="site-container">
          <div className="trust-strip-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 28
          }}>
            {TRUST_FEATURES.map((item, idx) => (
              <div
                key={idx}
                className="trust-card-compact"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "6px"
                }}
              >
                <div className="trust-card-compact-icon" style={{
                  width: 44,
                  height: 44,
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: "var(--color-bronze-light)",
                  border: "1px solid rgba(138, 87, 56, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  {iconMap[item.icon]}
                </div>
                <div className="trust-card-text">
                  <h4 className="trust-card-title" style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--color-ink)",
                    marginBottom: 4
                  }}>
                    {item.title}
                  </h4>
                  <p className="trust-card-desc" style={{
                    fontSize: 13,
                    color: "var(--color-ink-soft)",
                    lineHeight: 1.45
                  }}>
                    {item.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Popular Menu Items Preview Grid */}
      <section id="popular-dishes-section" className="mobile-section-tight" style={{
        paddingTop: "clamp(48px, 6vw, 76px)",
        paddingBottom: "clamp(48px, 6vw, 76px)",
        backgroundColor: "var(--bg-app)",
        borderBottom: "1px solid var(--border-color)"
      }}>
        <div className="site-container">
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <span style={{
              fontFamily: "var(--font-serif)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              color: "var(--color-bronze)",
              display: "block",
              marginBottom: 6
            }}>
              From Our Fresh Kitchen
            </span>
            <h3 style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(24px, 3.5vw, 32px)",
              fontWeight: 600,
              color: "var(--color-ink)",
              margin: 0
            }}>
              Popular Menu Items
            </h3>
          </div>

          {/* Desktop Category Filter Tabs - visible on desktop (md+) */}
          <div className="popular-categories-desktop" style={{
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 36
          }}>
            {POPULAR_CATEGORY_TABS.map((tab) => {
              const isSelected = selectedPreviewCat === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedPreviewCat(tab.id);
                    setPopularLimit(3);
                  }}
                  style={{
                    padding: "8px 20px",
                    borderRadius: "var(--radius-pill)",
                    fontFamily: "var(--font-serif)",
                    fontSize: 13,
                    fontWeight: isSelected ? 700 : 500,
                    backgroundColor: isSelected ? "var(--color-ink)" : "#FFFFFF",
                    color: isSelected ? "#FFFFFF" : "var(--color-ink)",
                    border: `1px solid ${isSelected ? "var(--color-ink)" : "var(--border-color)"}`,
                    letterSpacing: "0.03em",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  {tab.name}
                </button>
              );
            })}
          </div>

          {/* Mobile Category Selector Toggle - visible on mobile only */}
          <div className="popular-categories-mobile" style={{ marginBottom: 20, textAlign: "center" }}>
            <button
              type="button"
              onClick={() => setIsMobileCategoryOpen((prev) => !prev)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "7px 16px",
                backgroundColor: "#FFFFFF",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-pill)",
                boxShadow: "0 1px 4px rgba(28, 25, 23, 0.05)",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
              aria-expanded={isMobileCategoryOpen}
            >
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "var(--color-bronze)"
              }}>
                Category:
              </span>
              <span style={{
                fontSize: 12.5,
                fontWeight: 600,
                fontFamily: "var(--font-serif)",
                color: "var(--color-ink)"
              }}>
                {POPULAR_CATEGORY_TABS.find((t) => t.id === selectedPreviewCat)?.name || "All Favorites"}
              </span>
              {isMobileCategoryOpen ? (
                <ChevronUp size={13} color="var(--color-bronze)" style={{ marginLeft: 2 }} />
              ) : (
                <ChevronDown size={13} color="var(--color-bronze)" style={{ marginLeft: 2 }} />
              )}
            </button>

            {/* Collapsible Category Drawer */}
            {isMobileCategoryOpen && (
              <div style={{
                padding: "12px 10px",
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                border: "1px solid var(--border-color)",
                boxShadow: "0 6px 18px rgba(28, 25, 23, 0.07)",
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                justifyContent: "center",
                maxWidth: 360,
                margin: "10px auto 0 auto"
              }}>
                {POPULAR_CATEGORY_TABS.map((tab) => {
                  const isSelected = selectedPreviewCat === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setSelectedPreviewCat(tab.id);
                        setPopularLimit(3);
                        setIsMobileCategoryOpen(false);
                      }}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "var(--radius-pill)",
                        fontFamily: "var(--font-serif)",
                        fontSize: 11,
                        fontWeight: isSelected ? 700 : 500,
                        backgroundColor: isSelected ? "var(--color-ink)" : "var(--bg-app)",
                        color: isSelected ? "#FFFFFF" : "var(--color-ink)",
                        border: `1px solid ${isSelected ? "var(--color-ink)" : "var(--border-color)"}`,
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      {tab.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop Real Dishes Grid (3 cards per row) */}
          <div
            className="popular-cards-desktop"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 22
            }}
          >
            {popularDishes
              .slice(0, popularLimit)
              .map((item) => {
                const photoUrl = getDishPhoto(item);

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
                    <div style={{ position: "relative", height: 225, overflow: "hidden" }}>
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
                      />

                      {/* Veg and Special Badges */}
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
                          backgroundColor: "rgba(255, 255, 255, 0.94)",
                          backdropFilter: "blur(6px)",
                          border: "1px solid rgba(230, 223, 213, 0.9)",
                          borderRadius: "var(--radius-pill)",
                          padding: "2px 8px",
                          fontSize: 10,
                          fontFamily: "var(--font-serif)",
                          fontWeight: 700,
                          color: "var(--color-ink)"
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#16a34a" }} />
                          Veg
                        </span>

                        {item.isSpecial && (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            backgroundColor: "rgba(250, 247, 242, 0.95)",
                            border: "1px solid var(--color-bronze)",
                            borderRadius: "var(--radius-pill)",
                            padding: "2px 7px",
                            fontSize: 9,
                            fontFamily: "var(--font-serif)",
                            fontStyle: "italic",
                            fontWeight: 700,
                            color: "var(--color-bronze)"
                          }}>
                            <Flame size={9} />
                            Special
                          </span>
                        )}
                      </div>

                      {/* Price Badge */}
                      <div style={{
                        position: "absolute",
                        bottom: 10,
                        right: 10,
                        backgroundColor: "rgba(28, 25, 23, 0.9)",
                        backdropFilter: "blur(6px)",
                        color: "#FFFFFF",
                        borderRadius: "var(--radius-pill)",
                        padding: "3px 10px",
                        fontFamily: "var(--font-serif)",
                        fontSize: 13,
                        fontWeight: 700
                      }}>
                        Rs. {item.price}
                      </div>
                    </div>

                    <div style={{
                      padding: "16px 18px 14px 18px",
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
                          marginBottom: 10
                        }}>
                          {item.name}
                        </h4>
                      </div>

                      <div style={{
                        borderTop: "1px solid var(--border-color)",
                        paddingTop: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: 11,
                        fontFamily: "var(--font-serif)",
                        color: "var(--color-ink-soft)"
                      }}>
                        <span style={{ textTransform: "uppercase", letterSpacing: 0.6 }}>
                          {item.category}
                        </span>
                        <button
                          onClick={() => handleNav("menu")}
                          style={{
                            color: "var(--color-bronze)",
                            fontStyle: "italic",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3
                          }}
                        >
                          <span>Details</span>
                          <ArrowRight size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Desktop View More & View Full Menu CTA */}
          <div
            className="popular-cta-desktop"
            style={{
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              marginTop: 36,
              flexWrap: "wrap"
            }}
          >
            {popularDishes.length > 3 && popularLimit < popularDishes.length && (
              <button
                type="button"
                onClick={() => setPopularLimit((prev) => Math.min(prev + 6, popularDishes.length))}
                className="btn-pill-outline touch-target-44"
                style={{
                  padding: "12px 26px",
                  fontSize: 12,
                  fontWeight: 700,
                  backgroundColor: "#FFFFFF"
                }}
                title="View more dishes in this category"
              >
                <span>View More</span>
                <ChevronDown size={15} />
              </button>
            )}

            {popularLimit > 3 && (
              <button
                type="button"
                onClick={() => {
                  setPopularLimit(3);
                  const sec = document.getElementById("popular-dishes-section");
                  if (sec) sec.scrollIntoView({ behavior: "smooth" });
                }}
                className="btn-pill-outline touch-target-44"
                style={{
                  padding: "12px 26px",
                  fontSize: 12,
                  fontWeight: 700,
                  backgroundColor: "#FFFFFF"
                }}
                title="Show fewer dishes"
              >
                <span>Show Less</span>
                <ChevronUp size={15} />
              </button>
            )}

            <button
              type="button"
              onClick={() => handleNav("menu")}
              className="btn-pill-black touch-target-44"
              style={{ padding: "12px 28px", fontSize: 12 }}
              title="Browse complete menu"
            >
              <BookOpen size={14} />
              <span>View Full Menu ({menuItems.length} Dishes)</span>
            </button>
          </div>

          {/* Mobile Single-Card Swipe Carousel (1 card at a time with swipe) */}
          <div className="popular-cards-mobile" style={{ width: "100%" }}>
            <div
              ref={mobileCarouselRef}
              onScroll={handleMobileScroll}
              className="mobile-dish-swiper"
            >
              {popularDishes.map((item, idx) => {
                const photoUrl = getDishPhoto(item);

                return (
                  <div key={item.id} className="mobile-dish-slide">
                    <div
                      className="bistro-card"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        backgroundColor: "#FFFFFF",
                        overflow: "hidden",
                        borderRadius: "20px",
                        boxShadow: "0 8px 24px rgba(28, 25, 23, 0.08)",
                        border: "1px solid var(--border-color)"
                      }}
                    >
                      <div style={{ position: "relative", height: "clamp(220px, 62vw, 260px)", overflow: "hidden" }}>
                        <img
                          src={photoUrl}
                          alt={item.name}
                          loading={idx < 2 ? "eager" : "lazy"}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/images/dishes/penne_arabiata.jpg";
                          }}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block"
                          }}
                        />

                        {/* Veg and Special Badges */}
                        <div style={{
                          position: "absolute",
                          top: 10,
                          left: 10,
                          display: "flex",
                          gap: 6,
                          zIndex: 2
                        }}>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            backgroundColor: "rgba(255, 255, 255, 0.96)",
                            backdropFilter: "blur(6px)",
                            border: "1px solid rgba(230, 223, 213, 0.9)",
                            borderRadius: "var(--radius-pill)",
                            padding: "3px 9px",
                            fontSize: 10.5,
                            fontFamily: "var(--font-serif)",
                            fontWeight: 700,
                            color: "var(--color-ink)"
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#16a34a" }} />
                            Veg
                          </span>

                          {item.isSpecial && (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                              backgroundColor: "rgba(250, 247, 242, 0.96)",
                              border: "1px solid var(--color-bronze)",
                              borderRadius: "var(--radius-pill)",
                              padding: "3px 8px",
                              fontSize: 9.5,
                              fontFamily: "var(--font-serif)",
                              fontStyle: "italic",
                              fontWeight: 700,
                              color: "var(--color-bronze)"
                            }}>
                              <Flame size={10} />
                              Special
                            </span>
                          )}
                        </div>

                        {/* Price Badge */}
                        <div style={{
                          position: "absolute",
                          bottom: 10,
                          right: 10,
                          backgroundColor: "rgba(28, 25, 23, 0.92)",
                          backdropFilter: "blur(6px)",
                          color: "#FFFFFF",
                          borderRadius: "var(--radius-pill)",
                          padding: "4px 12px",
                          fontFamily: "var(--font-serif)",
                          fontSize: 14,
                          fontWeight: 700,
                          zIndex: 2
                        }}>
                          Rs. {item.price}
                        </div>
                      </div>

                      <div style={{
                        padding: "16px 18px 14px 18px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between"
                      }}>
                        <div>
                          <h4 style={{
                            fontFamily: "var(--font-serif)",
                            fontSize: 18,
                            fontWeight: 700,
                            color: "var(--color-ink)",
                            lineHeight: 1.3,
                            marginBottom: 10
                          }}>
                            {item.name}
                          </h4>
                        </div>

                        <div style={{
                          borderTop: "1px solid var(--border-color)",
                          paddingTop: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          fontSize: 11.5,
                          fontFamily: "var(--font-serif)",
                          color: "var(--color-ink-soft)"
                        }}>
                          <span style={{ textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>
                            {item.category}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleNav("menu")}
                            style={{
                              color: "var(--color-bronze)",
                              fontStyle: "italic",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              background: "none",
                              border: "none",
                              padding: 0
                            }}
                          >
                            <span>Details</span>
                            <ArrowRight size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Swipe Navigation Controls */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 4px",
              marginTop: 4
            }}>
              <button
                type="button"
                onClick={() => scrollToMobileDish(mobileDishIdx - 1)}
                disabled={mobileDishIdx === 0}
                aria-label="Previous Dish"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  backgroundColor: mobileDishIdx === 0 ? "rgba(255, 255, 255, 0.4)" : "#FFFFFF",
                  border: `1px solid ${mobileDishIdx === 0 ? "rgba(230, 223, 213, 0.5)" : "var(--border-color)"}`,
                  color: mobileDishIdx === 0 ? "rgba(28, 25, 23, 0.25)" : "var(--color-ink)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: mobileDishIdx === 0 ? "default" : "pointer",
                  boxShadow: mobileDishIdx === 0 ? "none" : "0 2px 6px rgba(28, 25, 23, 0.08)",
                  transition: "all 0.15s ease"
                }}
              >
                <ChevronLeft size={17} />
              </button>

              {/* Progress dots & counter */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {popularDishes.slice(0, Math.min(7, popularDishes.length)).map((_, i) => {
                    const isActive = i === mobileDishIdx || (i === 6 && mobileDishIdx >= 6);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => scrollToMobileDish(i)}
                        style={{
                          width: isActive ? 16 : 6,
                          height: 5,
                          borderRadius: "var(--radius-pill)",
                          backgroundColor: isActive ? "var(--color-ink)" : "rgba(138, 87, 56, 0.25)",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                        aria-label={`Go to dish ${i + 1}`}
                      />
                    );
                  })}
                </div>
                <span style={{
                  fontSize: 11,
                  fontFamily: "var(--font-serif)",
                  fontWeight: 700,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  color: "var(--color-bronze)"
                }}>
                  {mobileDishIdx + 1} of {popularDishes.length} • Swipe
                </span>
              </div>

              <button
                type="button"
                onClick={() => scrollToMobileDish(mobileDishIdx + 1)}
                disabled={mobileDishIdx === popularDishes.length - 1}
                aria-label="Next Dish"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  backgroundColor: mobileDishIdx === popularDishes.length - 1 ? "rgba(255, 255, 255, 0.4)" : "#FFFFFF",
                  border: `1px solid ${mobileDishIdx === popularDishes.length - 1 ? "rgba(230, 223, 213, 0.5)" : "var(--border-color)"}`,
                  color: mobileDishIdx === popularDishes.length - 1 ? "rgba(28, 25, 23, 0.25)" : "var(--color-ink)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: mobileDishIdx === popularDishes.length - 1 ? "default" : "pointer",
                  boxShadow: mobileDishIdx === popularDishes.length - 1 ? "none" : "0 2px 6px rgba(28, 25, 23, 0.08)",
                  transition: "all 0.15s ease"
                }}
              >
                <ChevronRight size={17} />
              </button>
            </div>

            {/* Mobile Full Menu CTA Button */}
            <div className="popular-cta-mobile" style={{
              justifyContent: "center",
              marginTop: 18
            }}>
              <button
                type="button"
                onClick={() => handleNav("menu")}
                className="btn-pill-black touch-target-44"
                style={{ padding: "12px 28px", fontSize: 12, width: "100%", maxWidth: 320 }}
                title="Browse complete menu"
              >
                <BookOpen size={14} />
                <span>View Full Menu ({menuItems.length} Dishes)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Café Stories & Ambience Showcase */}
      <section className="mobile-section-tight" style={{
        paddingTop: "clamp(56px, 8vw, 90px)",
        paddingBottom: "clamp(56px, 8vw, 90px)",
        backgroundColor: "var(--bg-app)"
      }}>
        <div className="site-container">
          {/* Section Header: Cafe Stories & Ambience */}
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 20,
            marginBottom: 32
          }}>
            <div style={{ maxWidth: 640 }}>
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
                Café Stories & Ambience
              </span>
              <h2 style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: 600,
                color: "var(--color-ink)",
                lineHeight: 1.25,
                marginBottom: 10
              }}>
                Every Corner Whispers a Story of Love
              </h2>
              <p style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: "clamp(14px, 1.6vw, 16px)",
                color: "var(--color-bronze)",
                lineHeight: 1.5,
                margin: 0
              }}>
                Step into our warm sanctuary in Muradnagar. Spotlight preview of our handcrafted dining spaces.
              </p>
            </div>

            {/* View Gallery Action Button */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                onClick={() => setIsGalleryOpen(true)}
                className="btn-pill-outline"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 22px",
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 2px 8px rgba(74, 53, 39, 0.05)"
                }}
              >
                <Layers size={15} style={{ color: "var(--color-bronze)" }} />
                <span>View Gallery ({CAFE_STORIES.length} Spaces)</span>
              </button>
            </div>
          </div>

          {/* Single Story Spotlight Preview Card (Changes Automatically) */}
          {(() => {
            const currentStory = CAFE_STORIES[activeStoryIdx] || CAFE_STORIES[0];
            const isHorizontal = currentStory.orientation === "horizontal";

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Main Spotlight Card in rich luxury dark green */}
                {isHorizontal ? (
                  <div
                    key={currentStory.id}
                    className="story-fade-in cafe-story-spotlight-card cafe-story-spotlight-horizontal"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "clamp(20px, 3vw, 28px)",
                      background: "linear-gradient(155deg, #1C3B2B 0%, #122B1E 50%, #0A1C13 100%)",
                      borderRadius: "28px",
                      border: "1.5px solid rgba(110, 185, 140, 0.25)",
                      padding: "clamp(20px, 3.5vw, 36px)",
                      boxShadow: "0 24px 64px -16px rgba(5, 18, 11, 0.45), 0 2px 8px rgba(5, 18, 11, 0.2)",
                      position: "relative",
                      overflow: "hidden"
                    }}
                  >
                    {/* Top emerald hairline accent */}
                    <div style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: "linear-gradient(90deg, transparent 0%, rgba(138, 222, 172, 0.7) 50%, transparent 100%)"
                    }} />

                    {/* Full Photo Showcase (Top) - Natural horizontal aspect ratio */}
                    <div
                      className="cafe-story-photo-wrapper cafe-story-photo-horizontal"
                      style={{
                        position: "relative",
                        borderRadius: "22px",
                        overflow: "hidden",
                        boxShadow: "0 16px 40px -8px rgba(0, 0, 0, 0.5)",
                        backgroundColor: "#0C1E15",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        width: "100%",
                        aspectRatio: "16 / 9",
                        maxHeight: "clamp(340px, 48vw, 560px)"
                      }}
                    >
                      <img
                        src={currentStory.image}
                        alt={currentStory.alt}
                        loading="eager"
                        className="cafe-story-image cafe-story-image-horizontal"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          objectPosition: "center center",
                          display: "block",
                          transition: "transform 0.5s ease"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
                      />

                      {/* Premium Badge */}
                      <div
                        className="cafe-story-photo-badge"
                        style={{
                          position: "absolute",
                          top: 18,
                          left: 18,
                          backgroundColor: "rgba(10, 24, 16, 0.88)",
                          backdropFilter: "blur(12px)",
                          borderRadius: "var(--radius-pill)",
                          padding: "6px 14px",
                          border: "1px solid rgba(138, 222, 172, 0.35)",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 11,
                          fontFamily: "var(--font-serif)",
                          fontWeight: 700,
                          letterSpacing: "1.2px",
                          textTransform: "uppercase",
                          color: "#E2F4EA",
                          boxShadow: "0 6px 18px rgba(0,0,0,0.25)"
                        }}
                      >
                        <Sparkles size={12} style={{ color: "#8AE6B0" }} />
                        <span>{currentStory.badgeText}</span>
                      </div>

                      {/* Floating Prev / Next Arrow Controls Directly on Photo */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveStoryIdx((prev) => (prev - 1 + CAFE_STORIES.length) % CAFE_STORIES.length);
                        }}
                        aria-label="Previous space"
                        style={{
                          position: "absolute",
                          left: 14,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 38,
                          height: 38,
                          borderRadius: "50%",
                          backgroundColor: "rgba(10, 24, 16, 0.75)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(255, 255, 255, 0.25)",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
                          transition: "all 0.2s ease",
                          zIndex: 3
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(10, 24, 16, 0.95)";
                          e.currentTarget.style.transform = "translateY(-50%) scale(1.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(10, 24, 16, 0.75)";
                          e.currentTarget.style.transform = "translateY(-50%) scale(1.0)";
                        }}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveStoryIdx((prev) => (prev + 1) % CAFE_STORIES.length);
                        }}
                        aria-label="Next space"
                        style={{
                          position: "absolute",
                          right: 14,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 38,
                          height: 38,
                          borderRadius: "50%",
                          backgroundColor: "rgba(10, 24, 16, 0.75)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(255, 255, 255, 0.25)",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
                          transition: "all 0.2s ease",
                          zIndex: 3
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(10, 24, 16, 0.95)";
                          e.currentTarget.style.transform = "translateY(-50%) scale(1.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(10, 24, 16, 0.75)";
                          e.currentTarget.style.transform = "translateY(-50%) scale(1.0)";
                        }}
                      >
                        <ChevronRight size={18} />
                      </button>

                      {/* Quick Expand to Gallery Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsGalleryOpen(true);
                        }}
                        title="View in full gallery"
                        className="cafe-story-fullview-btn"
                        style={{
                          position: "absolute",
                          bottom: 18,
                          right: 18,
                          backgroundColor: "rgba(10, 20, 14, 0.82)",
                          backdropFilter: "blur(8px)",
                          color: "#FFFFFF",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "var(--radius-pill)",
                          padding: "6px 14px",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 11,
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <Maximize2 size={12} />
                        <span>Full View</span>
                      </button>
                    </div>

                    {/* Streamlined Details Bar (No bulky story paragraphs for horizontal & big photos) */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 16
                    }}>
                      <div style={{ maxWidth: 680 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <span style={{
                            fontFamily: "var(--font-serif)",
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "2px",
                            textTransform: "uppercase",
                            color: "#7DD19F"
                          }}>
                            {currentStory.eyebrow}
                          </span>
                          <span style={{ color: "rgba(255, 255, 255, 0.35)" }}>•</span>
                          <span style={{
                            fontSize: 11,
                            color: "rgba(255, 255, 255, 0.65)",
                            fontWeight: 600,
                            fontFamily: "var(--font-serif)"
                          }}>
                            Space {String(activeStoryIdx + 1).padStart(2, "0")} / {String(CAFE_STORIES.length).padStart(2, "0")}
                          </span>
                        </div>
                        {/* Interactive space indicator dots */}
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
                          {CAFE_STORIES.map((st, idx) => (
                            <button
                              key={st.id || idx}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveStoryIdx(idx);
                              }}
                              aria-label={`Go to space ${idx + 1}`}
                              style={{
                                width: activeStoryIdx === idx ? 22 : 6,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: activeStoryIdx === idx ? "#8AE6B0" : "rgba(255, 255, 255, 0.25)",
                                border: "none",
                                cursor: "pointer",
                                padding: 0,
                                transition: "all 0.3s ease"
                              }}
                            />
                          ))}
                        </div>
                        <h3
                          className="cafe-story-title"
                          style={{
                            fontFamily: "var(--font-serif)",
                            fontSize: "clamp(22px, 2.8vw, 32px)",
                            fontWeight: 700,
                            color: "#FFFFFF",
                            lineHeight: 1.25,
                            marginBottom: 6
                          }}
                        >
                          {currentStory.title}
                        </h3>
                        <p
                          className="cafe-story-quote"
                          style={{
                            fontFamily: "var(--font-serif)",
                            fontStyle: "italic",
                            fontSize: 14,
                            color: "#CBE3D3",
                            lineHeight: 1.5,
                            margin: 0
                          }}
                        >
                          "{currentStory.quote}"
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="cafe-story-actions-row" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => handleNav("menu")}
                          className="cafe-story-action-btn"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            padding: "11px 22px",
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            borderRadius: "var(--radius-pill)",
                            backgroundColor: "#FFFFFF",
                            color: "#0F2318",
                            border: "1px solid #FFFFFF",
                            boxShadow: "0 6px 18px rgba(0, 0, 0, 0.3)",
                            cursor: "pointer",
                            transition: "all 0.22s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#EAF5EE";
                            e.currentTarget.style.transform = "translateY(-1px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#FFFFFF";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          <span style={{ color: "#0F2318" }}>View Menu</span>
                          <ArrowRight size={13} style={{ color: "#0F2318" }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsGalleryOpen(true)}
                          className="cafe-story-action-btn"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            padding: "10px 20px",
                            fontSize: 12,
                            fontWeight: 600,
                            letterSpacing: "0.06em",
                            borderRadius: "var(--radius-pill)",
                            backgroundColor: "rgba(255, 255, 255, 0.12)",
                            backdropFilter: "blur(8px)",
                            border: "1.5px solid rgba(255, 255, 255, 0.35)",
                            color: "#FFFFFF",
                            cursor: "pointer",
                            transition: "all 0.22s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
                            e.currentTarget.style.transform = "translateY(-1px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.12)";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          <Eye size={13} style={{ color: "#8AE6B0" }} />
                          <span style={{ color: "#FFFFFF" }}>Gallery ({CAFE_STORIES.length})</span>
                        </button>
                        <span
                          className="cafe-story-location-note"
                          style={{
                            fontSize: 12,
                            color: "#8AE6B0",
                            fontWeight: 600,
                            fontFamily: "var(--font-serif)"
                          }}
                        >
                          {currentStory.locationNote}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Vertical Card - Space available for story description & details */
                  <div
                    key={currentStory.id}
                    className="story-fade-in cafe-story-spotlight-card cafe-story-spotlight-vertical"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                      gap: "clamp(32px, 5vw, 56px)",
                      alignItems: "center",
                      background: "linear-gradient(155deg, #1C3B2B 0%, #122B1E 50%, #0A1C13 100%)",
                      borderRadius: "28px",
                      border: "1.5px solid rgba(110, 185, 140, 0.25)",
                      padding: "clamp(24px, 4vw, 44px)",
                      boxShadow: "0 24px 64px -16px rgba(5, 18, 11, 0.45), 0 2px 8px rgba(5, 18, 11, 0.2)",
                      position: "relative",
                      overflow: "hidden"
                    }}
                  >
                    {/* Top emerald hairline accent */}
                    <div style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: "linear-gradient(90deg, transparent 0%, rgba(138, 222, 172, 0.7) 50%, transparent 100%)"
                    }} />

                    {/* Photo Column (Left) - Vertical portrait aspect ratio */}
                    <div
                      className="cafe-story-photo-wrapper cafe-story-photo-vertical"
                      style={{
                        position: "relative",
                        borderRadius: "22px",
                        overflow: "hidden",
                        boxShadow: "0 16px 40px -8px rgba(0, 0, 0, 0.5)",
                        backgroundColor: "#0C1E15",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        aspectRatio: "3 / 4",
                        maxHeight: "clamp(440px, 46vw, 540px)",
                        width: "100%"
                      }}
                    >
                      <img
                        src={currentStory.image}
                        alt={currentStory.alt}
                        loading="eager"
                        className="cafe-story-image cafe-story-image-vertical"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          objectPosition: "center center",
                          display: "block",
                          transition: "transform 0.5s ease"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.025)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
                      />

                      {/* Premium Badge */}
                      <div
                        className="cafe-story-photo-badge"
                        style={{
                          position: "absolute",
                          top: 18,
                          left: 18,
                          backgroundColor: "rgba(10, 24, 16, 0.88)",
                          backdropFilter: "blur(12px)",
                          borderRadius: "var(--radius-pill)",
                          padding: "6px 14px",
                          border: "1px solid rgba(138, 222, 172, 0.35)",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 11,
                          fontFamily: "var(--font-serif)",
                          fontWeight: 700,
                          letterSpacing: "1.2px",
                          textTransform: "uppercase",
                          color: "#E2F4EA",
                          boxShadow: "0 6px 18px rgba(0,0,0,0.25)"
                        }}
                      >
                        <Sparkles size={12} style={{ color: "#8AE6B0" }} />
                        <span>{currentStory.badgeText}</span>
                      </div>

                      {/* Floating Prev / Next Arrow Controls Directly on Photo */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveStoryIdx((prev) => (prev - 1 + CAFE_STORIES.length) % CAFE_STORIES.length);
                        }}
                        aria-label="Previous space"
                        style={{
                          position: "absolute",
                          left: 14,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 38,
                          height: 38,
                          borderRadius: "50%",
                          backgroundColor: "rgba(10, 24, 16, 0.75)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(255, 255, 255, 0.25)",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
                          transition: "all 0.2s ease",
                          zIndex: 3
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(10, 24, 16, 0.95)";
                          e.currentTarget.style.transform = "translateY(-50%) scale(1.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(10, 24, 16, 0.75)";
                          e.currentTarget.style.transform = "translateY(-50%) scale(1.0)";
                        }}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveStoryIdx((prev) => (prev + 1) % CAFE_STORIES.length);
                        }}
                        aria-label="Next space"
                        style={{
                          position: "absolute",
                          right: 14,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 38,
                          height: 38,
                          borderRadius: "50%",
                          backgroundColor: "rgba(10, 24, 16, 0.75)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(255, 255, 255, 0.25)",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
                          transition: "all 0.2s ease",
                          zIndex: 3
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(10, 24, 16, 0.95)";
                          e.currentTarget.style.transform = "translateY(-50%) scale(1.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(10, 24, 16, 0.75)";
                          e.currentTarget.style.transform = "translateY(-50%) scale(1.0)";
                        }}
                      >
                        <ChevronRight size={18} />
                      </button>

                      {/* Quick Expand to Gallery Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsGalleryOpen(true);
                        }}
                        title="View in full gallery"
                        className="cafe-story-fullview-btn"
                        style={{
                          position: "absolute",
                          bottom: 18,
                          right: 18,
                          backgroundColor: "rgba(10, 20, 14, 0.82)",
                          backdropFilter: "blur(8px)",
                          color: "#FFFFFF",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "var(--radius-pill)",
                          padding: "6px 12px",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 11,
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <Maximize2 size={12} />
                        <span>Full View</span>
                      </button>
                    </div>

                    {/* Narrative Column (Right) - Space available so write full story */}
                    <div className="cafe-story-narrative-col">
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 8
                      }}>
                        <span style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: "2px",
                          textTransform: "uppercase",
                          color: "#7DD19F"
                        }}>
                          {currentStory.eyebrow}
                        </span>
                        <span style={{
                          fontSize: 11,
                          color: "rgba(255, 255, 255, 0.65)",
                          fontWeight: 600,
                          fontFamily: "var(--font-serif)"
                        }}>
                          Space {String(activeStoryIdx + 1).padStart(2, "0")} / {String(CAFE_STORIES.length).padStart(2, "0")}
                        </span>
                      </div>
                      {/* Interactive space indicator dots */}
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 12 }}>
                        {CAFE_STORIES.map((st, idx) => (
                          <button
                            key={st.id || idx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveStoryIdx(idx);
                            }}
                            aria-label={`Go to space ${idx + 1}`}
                            style={{
                              width: activeStoryIdx === idx ? 22 : 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: activeStoryIdx === idx ? "#8AE6B0" : "rgba(255, 255, 255, 0.25)",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                              transition: "all 0.3s ease"
                            }}
                          />
                        ))}
                      </div>

                      <h3
                        className="cafe-story-title"
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: "clamp(24px, 3.2vw, 34px)",
                          fontWeight: 700,
                          color: "#FFFFFF",
                          lineHeight: 1.25,
                          marginBottom: 10
                        }}
                      >
                        {currentStory.title}
                      </h3>
                      <p
                        className="cafe-story-quote"
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontStyle: "italic",
                          fontSize: 15,
                          color: "#CBE3D3",
                          lineHeight: 1.5,
                          marginBottom: 16
                        }}
                      >
                        "{currentStory.quote}"
                      </p>
                      <div className="story-description-wrapper">
                        <p
                          className={`story-description-para ${isStoryExpanded ? "is-expanded" : ""}`}
                          style={{
                            fontSize: 14,
                            color: "rgba(255, 255, 255, 0.88)",
                            lineHeight: 1.75
                          }}
                        >
                          {currentStory.description}
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsStoryExpanded((prev) => !prev)}
                          className="story-view-more-toggle"
                          title={isStoryExpanded ? "Show fewer lines" : "Read complete story description"}
                          style={{
                            color: "#8AE6B0",
                            fontWeight: 600
                          }}
                        >
                          <span>{isStoryExpanded ? "View Less" : "View More"}</span>
                          <ChevronDown
                            size={13}
                            style={{
                              transition: "transform 0.2s ease",
                              transform: isStoryExpanded ? "rotate(180deg)" : "rotate(0)",
                              color: "#8AE6B0"
                            }}
                          />
                        </button>
                      </div>

                      {/* Action buttons */}
                      <div className="cafe-story-actions-row" style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => handleNav("menu")}
                          className="cafe-story-action-btn"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            padding: "12px 26px",
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            borderRadius: "var(--radius-pill)",
                            backgroundColor: "#FFFFFF",
                            color: "#0F2318",
                            border: "1px solid #FFFFFF",
                            boxShadow: "0 6px 18px rgba(0, 0, 0, 0.3)",
                            cursor: "pointer",
                            transition: "all 0.22s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#EAF5EE";
                            e.currentTarget.style.transform = "translateY(-1px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#FFFFFF";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          <span style={{ color: "#0F2318" }}>View Our Menu</span>
                          <ArrowRight size={13} style={{ color: "#0F2318" }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsGalleryOpen(true)}
                          className="cafe-story-action-btn"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            padding: "11px 22px",
                            fontSize: 12,
                            fontWeight: 600,
                            letterSpacing: "0.06em",
                            borderRadius: "var(--radius-pill)",
                            backgroundColor: "rgba(255, 255, 255, 0.12)",
                            backdropFilter: "blur(8px)",
                            border: "1.5px solid rgba(255, 255, 255, 0.35)",
                            color: "#FFFFFF",
                            cursor: "pointer",
                            transition: "all 0.22s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
                            e.currentTarget.style.transform = "translateY(-1px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.12)";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          <Eye size={13} style={{ color: "#8AE6B0" }} />
                          <span style={{ color: "#FFFFFF" }}>Open Gallery</span>
                        </button>
                        <span
                          className="cafe-story-location-note"
                          style={{
                            fontSize: 12,
                            color: "#8AE6B0",
                            fontWeight: 600,
                            fontFamily: "var(--font-serif)"
                          }}
                        >
                          {currentStory.locationNote}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sleek Pagination Dots & Navigation Control Bar */}
                <div className="story-control-bar" style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 16,
                  padding: "12px 24px",
                  background: "linear-gradient(155deg, #183727 0%, #10271B 100%)",
                  borderRadius: "var(--radius-pill)",
                  border: "1px solid rgba(110, 185, 140, 0.25)",
                  boxShadow: "0 8px 24px rgba(5, 18, 11, 0.25)"
                }}>
                  {/* Space Title & Counter */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      fontSize: 12,
                      fontFamily: "var(--font-serif)",
                      fontWeight: 700,
                      color: "#8AE6B0",
                      letterSpacing: "1px"
                    }}>
                      Space {String(activeStoryIdx + 1).padStart(2, "0")} / {String(CAFE_STORIES.length).padStart(2, "0")}
                    </span>
                    <span style={{ color: "rgba(255, 255, 255, 0.3)" }}>•</span>
                    <span style={{
                      fontSize: 13,
                      fontFamily: "var(--font-serif)",
                      fontWeight: 600,
                      color: "#FFFFFF"
                    }}>
                      {currentStory.tabLabel || currentStory.title}
                    </span>
                  </div>

                  {/* Sleek Minimalist Pagination Dots */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "4px 8px"
                  }}>
                    {CAFE_STORIES.map((story, idx) => {
                      const isActive = activeStoryIdx === idx;
                      return (
                        <button
                          key={story.id}
                          type="button"
                          onClick={() => setActiveStoryIdx(idx)}
                          title={`Space ${idx + 1}: ${story.tabLabel || story.title}`}
                          style={{
                            width: isActive ? 28 : 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: isActive ? "#52A26F" : "rgba(255, 255, 255, 0.25)",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            boxShadow: isActive ? "0 0 10px rgba(82, 162, 111, 0.6)" : "none"
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Previous / Next Arrow Controls & Gallery Trigger */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setActiveStoryIdx((prev) => (prev - 1 + CAFE_STORIES.length) % CAFE_STORIES.length)}
                        aria-label="Previous space"
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          backgroundColor: "rgba(255, 255, 255, 0.08)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#FFFFFF",
                          cursor: "pointer",
                          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(82, 162, 111, 0.3)";
                          e.currentTarget.style.transform = "scale(1.06)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                          e.currentTarget.style.transform = "scale(1.0)";
                        }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveStoryIdx((prev) => (prev + 1) % CAFE_STORIES.length)}
                        aria-label="Next space"
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          backgroundColor: "rgba(255, 255, 255, 0.08)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#FFFFFF",
                          cursor: "pointer",
                          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(82, 162, 111, 0.3)";
                          e.currentTarget.style.transform = "scale(1.06)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                          e.currentTarget.style.transform = "scale(1.0)";
                        }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsGalleryOpen(true)}
                      className="btn-pill-outline"
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        border: "1px solid rgba(255, 255, 255, 0.22)",
                        color: "#FFFFFF",
                        padding: "8px 18px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.15)",
                        cursor: "pointer"
                      }}
                    >
                      <span>View Gallery ({CAFE_STORIES.length})</span>
                      <ArrowRight size={12} style={{ color: "#8AE6B0" }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Full Ambience Gallery Modal (Opens on "View Gallery") */}
          {isGalleryOpen && (
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsGalleryOpen(false);
              }}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 10000,
                backgroundColor: "rgba(24, 20, 18, 0.82)",
                backdropFilter: "blur(14px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "clamp(16px, 3vw, 32px)",
                animation: "storyFadeIn 0.25s ease-out forwards"
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: 1140,
                  maxHeight: "92vh",
                  overflowY: "auto",
                  backgroundColor: "var(--bg-app)",
                  borderRadius: "28px",
                  border: "1px solid rgba(180, 130, 90, 0.35)",
                  boxShadow: "0 32px 80px -20px rgba(0,0,0,0.5)",
                  padding: "clamp(24px, 4vw, 40px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 32
                }}
              >
                {/* Modal Header */}
                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  borderBottom: "1px solid var(--border-color)",
                  paddingBottom: 20
                }}>
                  <div>
                    <span style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 1.8,
                      textTransform: "uppercase",
                      color: "var(--color-bronze)",
                      display: "block",
                      marginBottom: 6
                    }}>
                      Full Ambience Gallery
                    </span>
                    <h3 style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "clamp(22px, 3.2vw, 30px)",
                      fontWeight: 600,
                      color: "var(--color-ink)",
                      margin: 0
                    }}>
                      All Handcrafted Dining Spaces
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsGalleryOpen(false)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid var(--border-color)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "var(--color-ink)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      transition: "transform 0.2s ease"
                    }}
                    title="Close Gallery (Esc)"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Body: All 5 Spaces Displayed In Full View */}
                <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
                  {CAFE_STORIES.map((story) => {
                    const isHorizontal = story.orientation === "horizontal";
                    const isPrivateCorner = story.id === "private-corner";

                    if (isHorizontal) {
                      return (
                        <div
                          key={story.id}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 18,
                            background: "linear-gradient(155deg, #FFFFFF 0%, #FCFAF7 60%, #F6EFE6 100%)",
                            borderRadius: "24px",
                            border: "1px solid rgba(180, 130, 90, 0.28)",
                            padding: "clamp(16px, 3vw, 28px)",
                            boxShadow: "0 14px 36px rgba(74, 53, 39, 0.05)"
                          }}
                        >
                          {/* Photo - Horizontal Aspect Ratio with Full View */}
                          <div style={{
                            position: "relative",
                            borderRadius: "18px",
                            overflow: "hidden",
                            boxShadow: "0 12px 28px rgba(74, 53, 39, 0.12)",
                            backgroundColor: "#EFE8DC",
                            width: "100%",
                            aspectRatio: "16 / 9",
                            maxHeight: "clamp(260px, 42vw, 440px)"
                          }}>
                            <img
                              src={story.image}
                              alt={story.alt}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                objectPosition: "center center",
                                display: "block"
                              }}
                            />
                            <div style={{
                              position: "absolute",
                              top: 16,
                              left: 16,
                              backgroundColor: "rgba(255, 255, 255, 0.94)",
                              backdropFilter: "blur(12px)",
                              borderRadius: "var(--radius-pill)",
                              padding: "6px 14px",
                              border: "1px solid rgba(180, 130, 90, 0.3)",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              fontSize: 11,
                              fontFamily: "var(--font-serif)",
                              fontWeight: 700,
                              letterSpacing: "1.2px",
                              textTransform: "uppercase",
                              color: "var(--color-bronze)"
                            }}>
                              <Sparkles size={12} style={{ color: "var(--color-bronze)" }} />
                              <span>{story.badgeText}</span>
                            </div>
                          </div>

                          {/* Streamlined Details without bulky story paragraph */}
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: 12
                          }}>
                            <div>
                              <span style={{
                                fontFamily: "var(--font-serif)",
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: "2px",
                                textTransform: "uppercase",
                                color: "var(--color-bronze)",
                                display: "block",
                                marginBottom: 4
                              }}>
                                {story.eyebrow}
                              </span>
                              <h4 style={{
                                fontFamily: "var(--font-serif)",
                                fontSize: "clamp(20px, 2.6vw, 26px)",
                                fontWeight: 600,
                                color: "var(--color-ink)",
                                lineHeight: 1.25,
                                marginBottom: 6
                              }}>
                                {story.title}
                              </h4>
                              <p style={{
                                fontFamily: "var(--font-serif)",
                                fontStyle: "italic",
                                fontSize: 14,
                                color: "var(--color-bronze)",
                                lineHeight: 1.5,
                                margin: 0
                              }}>
                                "{story.quote}"
                              </p>
                            </div>

                            <span style={{
                              fontSize: 12,
                              color: "var(--color-bronze)",
                              fontWeight: 600,
                              fontFamily: "var(--font-serif)"
                            }}>
                              {story.locationNote}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={story.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                          gap: "clamp(24px, 4vw, 44px)",
                          alignItems: "center",
                          background: "linear-gradient(155deg, #FFFFFF 0%, #FCFAF7 60%, #F6EFE6 100%)",
                          borderRadius: "24px",
                          border: "1px solid rgba(180, 130, 90, 0.28)",
                          padding: "clamp(20px, 3vw, 36px)",
                          boxShadow: "0 14px 36px rgba(74, 53, 39, 0.05)"
                        }}
                      >
                        {/* Photo - Vertical tall aspect ratio */}
                        <div style={{
                          position: "relative",
                          borderRadius: "20px",
                          overflow: "hidden",
                          boxShadow: "0 12px 28px rgba(74, 53, 39, 0.12)",
                          backgroundColor: "#EFE8DC",
                          aspectRatio: "3 / 4",
                          maxHeight: "clamp(380px, 40vw, 480px)",
                          width: "100%"
                        }}>
                          <img
                            src={story.image}
                            alt={story.alt}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              objectPosition: "center center",
                              display: "block"
                            }}
                          />
                          <div style={{
                            position: "absolute",
                            top: 16,
                            left: 16,
                            backgroundColor: "rgba(255, 255, 255, 0.94)",
                            backdropFilter: "blur(12px)",
                            borderRadius: "var(--radius-pill)",
                            padding: "6px 14px",
                            border: "1px solid rgba(180, 130, 90, 0.3)",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 11,
                            fontFamily: "var(--font-serif)",
                            fontWeight: 700,
                            letterSpacing: "1.2px",
                            textTransform: "uppercase",
                            color: "var(--color-bronze)"
                          }}>
                            {isPrivateCorner ? (
                              <Sparkles size={12} style={{ color: "var(--color-bronze)" }} />
                            ) : (
                              <Heart size={12} style={{ color: "var(--color-bronze)" }} />
                            )}
                            <span>{story.badgeText}</span>
                          </div>
                        </div>

                        {/* Details & Story - Space available for story description */}
                        <div>
                          <span style={{
                            fontFamily: "var(--font-serif)",
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "2px",
                            textTransform: "uppercase",
                            color: "var(--color-bronze)",
                            display: "block",
                            marginBottom: 6
                          }}>
                            {story.eyebrow}
                          </span>
                          <h4 style={{
                            fontFamily: "var(--font-serif)",
                            fontSize: "clamp(22px, 3vw, 28px)",
                            fontWeight: 600,
                            color: "var(--color-ink)",
                            lineHeight: 1.25,
                            marginBottom: 8
                          }}>
                            {story.title}
                          </h4>
                          <p style={{
                            fontFamily: "var(--font-serif)",
                            fontStyle: "italic",
                            fontSize: 14,
                            color: "var(--color-bronze)",
                            lineHeight: 1.5,
                            marginBottom: 14
                          }}>
                            "{story.quote}"
                          </p>
                          <p style={{
                            fontSize: 13,
                            color: "var(--color-ink-soft)",
                            lineHeight: 1.7,
                            marginBottom: 20
                          }}>
                            {story.description}
                          </p>

                          <span style={{
                            fontSize: 12,
                            color: "var(--color-bronze)",
                            fontWeight: 600,
                            fontFamily: "var(--font-serif)"
                          }}>
                            {story.locationNote}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Modal Footer */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderTop: "1px solid var(--border-color)",
                  paddingTop: 20,
                  flexWrap: "wrap",
                  gap: 14
                }}>
                  <span style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 13,
                    color: "var(--color-ink-soft)",
                    fontStyle: "italic"
                  }}>
                    Visit us daily 12:00 PM – 12:00 AM midnight at Pillar 852, Muradnagar
                  </span>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setIsGalleryOpen(false)}
                      className="btn-pill-outline"
                      style={{ padding: "10px 22px", fontSize: 12 }}
                    >
                      Close Gallery
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsGalleryOpen(false);
                        handleNav("menu");
                      }}
                      className="btn-pill-black"
                      style={{ padding: "10px 24px", fontSize: 12 }}
                    >
                      <span>Explore Food Menu</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}


        </div>
      </section>

      {/* 5. Chef's Special / Signature Dish Spotlight */}
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
              Signature Creations
            </span>
            <h2 style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(28px, 4vw, 38px)",
              fontWeight: 600,
              color: "var(--color-ink)",
              lineHeight: 1.2
            }}>
              The Dishes Guests Return For
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            {SIGNATURE_ITEMS.map((item, index) => (
              <div
                key={item.id}
                className="bistro-card"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  alignItems: "center",
                  overflow: "hidden",
                  direction: index % 2 === 1 ? "rtl" : "ltr"
                }}
              >
                {/* Image half */}
                <div style={{ height: "clamp(260px, 35vw, 360px)", direction: "ltr" }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block"
                    }}
                  />
                </div>

                {/* Content half */}
                <div style={{
                  padding: "clamp(28px, 5vw, 44px)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  direction: "ltr"
                }}>
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: "var(--color-bronze-light)",
                    fontSize: 11,
                    fontFamily: "var(--font-serif)",
                    fontWeight: 700,
                    color: "var(--color-bronze-dark)",
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    marginBottom: 12
                  }}>
                    <Flame size={12} />
                    <span>{item.badge}</span>
                  </div>

                  <h3 style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "clamp(22px, 3vw, 28px)",
                    fontWeight: 700,
                    color: "var(--color-ink)",
                    marginBottom: 8
                  }}>
                    {item.name}
                  </h3>

                  <div style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--color-bronze)",
                    marginBottom: 14
                  }}>
                    Rs. {item.price}
                  </div>

                  <p style={{
                    fontFamily: "var(--font-serif)",
                    fontStyle: "italic",
                    fontSize: 15,
                    color: "var(--color-bronze)",
                    lineHeight: 1.55,
                    marginBottom: 12
                  }}>
                    "{item.quote}"
                  </p>

                  <p style={{
                    fontSize: 13,
                    color: "var(--color-ink-soft)",
                    lineHeight: 1.6,
                    marginBottom: 24
                  }}>
                    {item.details}
                  </p>

                  <button
                    onClick={() => handleNav("menu")}
                    className="btn-pill-black"
                  >
                    <span>View on Menu</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. About / Ambience Snippet */}
      <section className="mobile-section-tight" style={{
        paddingTop: "clamp(56px, 8vw, 84px)",
        paddingBottom: "clamp(56px, 8vw, 84px)",
        backgroundColor: "var(--bg-app)"
      }}>
        <div className="site-container">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "clamp(36px, 6vw, 64px)",
            alignItems: "center"
          }}>
            {/* Ambient Photos Collage */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16
            }}>
              <div className="bistro-card" style={{ height: 260, borderRadius: "var(--radius-md)" }}>
                <img
                  src={CAFE_STORY.imageAmbience1}
                  alt="Two Hearts Cafe Ambience"
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div className="bistro-card" style={{ height: 260, borderRadius: "var(--radius-md)", marginTop: 24 }}>
                <img
                  src={CAFE_STORY.imageAmbience2}
                  alt="Cozy bistro tables"
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            </div>

            {/* Narrative */}
            <div>
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
                The Sanctuary
              </span>
              <h2 style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(26px, 3.8vw, 36px)",
                fontWeight: 600,
                color: "var(--color-ink)",
                lineHeight: 1.2,
                marginBottom: 16
              }}>
                {CAFE_STORY.headline}
              </h2>
              <p style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: 16,
                color: "var(--color-bronze)",
                lineHeight: 1.5,
                marginBottom: 16
              }}>
                {CAFE_STORY.subheadline}
              </p>
              <p style={{
                fontSize: 14,
                color: "var(--color-ink-soft)",
                lineHeight: 1.65,
                marginBottom: 14
              }}>
                {CAFE_STORY.bodyP1}
              </p>
              <p style={{
                fontSize: 14,
                color: "var(--color-ink-soft)",
                lineHeight: 1.65,
                marginBottom: 24
              }}>
                {CAFE_STORY.bodyP2}
              </p>

              <button
                onClick={() => handleNav("about")}
                className="btn-pill-outline"
              >
                <span>Read Our Full Story</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Testimonials ("Why Guests Love Us") */}
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
              Words from Our Guests & Neighbors
            </span>
            <h2 style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(28px, 4vw, 36px)",
              fontWeight: 600,
              color: "var(--color-ink)",
              lineHeight: 1.2
            }}>
              Why Guests Love Two Hearts
            </h2>
          </div>

          {/* Desktop: 3 Separate Review Cards */}
          <div className="testimonials-grid-desktop">
            {TESTIMONIALS.map((t, idx) => (
              <div
                key={idx}
                className="bistro-card"
                style={{
                  padding: "26px 22px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={14} fill="#8A5738" color="#8A5738" />
                    ))}
                  </div>

                  <p style={{
                    fontFamily: "var(--font-serif)",
                    fontStyle: "italic",
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "var(--color-ink)",
                    marginBottom: 20
                  }}>
                    "{t.quote}"
                  </p>
                </div>

                <div style={{
                  borderTop: "1px solid var(--border-color)",
                  paddingTop: 12,
                  display: "flex",
                  flexDirection: "column"
                }}>
                  <span style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--color-bronze-dark)"
                  }}>
                    {t.author}
                  </span>
                  <span style={{
                    fontSize: 11,
                    color: "var(--color-ink-soft)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginTop: 2
                  }}>
                    {t.role}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile: Single Card Auto-Rotating Every 5 Seconds */}
          <div className="testimonials-mobile-carousel">
            <div
              key={activeTestimonialIdx}
              className="bistro-card animate-fade-in"
              style={{
                padding: "22px 20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 210,
                boxShadow: "0 4px 18px rgba(74, 53, 39, 0.06)"
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[...Array(TESTIMONIALS[activeTestimonialIdx].rating)].map((_, i) => (
                      <Star key={i} size={15} fill="#8A5738" color="#8A5738" />
                    ))}
                  </div>
                  <span style={{
                    fontSize: 10,
                    fontFamily: "var(--font-serif)",
                    fontWeight: 700,
                    color: "var(--color-bronze)",
                    letterSpacing: 1,
                    textTransform: "uppercase"
                  }}>
                    {activeTestimonialIdx + 1} / {TESTIMONIALS.length}
                  </span>
                </div>

                <p style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "var(--color-ink)",
                  marginBottom: 16
                }}>
                  "{TESTIMONIALS[activeTestimonialIdx].quote}"
                </p>
              </div>

              <div style={{
                borderTop: "1px solid var(--border-color)",
                paddingTop: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--color-bronze-dark)"
                  }}>
                    {TESTIMONIALS[activeTestimonialIdx].author}
                  </span>
                  <span style={{
                    fontSize: 11,
                    color: "var(--color-ink-soft)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginTop: 2
                  }}>
                    {TESTIMONIALS[activeTestimonialIdx].role}
                  </span>
                </div>

                {/* Optional manual tap controls */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setActiveTestimonialIdx((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
                    aria-label="Previous review"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      backgroundColor: "var(--bg-app)",
                      border: "1px solid rgba(180, 130, 90, 0.25)",
                      color: "var(--color-bronze)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer"
                    }}
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTestimonialIdx((prev) => (prev + 1) % TESTIMONIALS.length)}
                    aria-label="Next review"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      backgroundColor: "var(--bg-app)",
                      border: "1px solid rgba(180, 130, 90, 0.25)",
                      color: "var(--color-bronze)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer"
                    }}
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Indicator Dots */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              marginTop: 14
            }}>
              {TESTIMONIALS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveTestimonialIdx(idx)}
                  aria-label={`Go to review ${idx + 1}`}
                  style={{
                    height: 5,
                    width: activeTestimonialIdx === idx ? 20 : 6,
                    borderRadius: 3,
                    backgroundColor: activeTestimonialIdx === idx ? "var(--color-bronze)" : "rgba(180, 130, 90, 0.25)",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    transition: "all 0.25s ease"
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. CTA Banner Linking to Menu & Visit */}
      <section className="mobile-section-tight" style={{
        paddingTop: "clamp(60px, 8vw, 84px)",
        paddingBottom: "clamp(60px, 8vw, 84px)",
        backgroundColor: "var(--bg-app)"
      }}>
        <div className="site-container-narrow">
          <div style={{
            backgroundColor: "#FFFFFF",
            border: "1.5px solid var(--border-color)",
            borderRadius: "var(--radius-lg)",
            padding: "clamp(36px, 6vw, 54px)",
            textAlign: "center",
            boxShadow: "0 8px 30px rgba(28, 25, 23, 0.06)",
            position: "relative"
          }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <CafeLogoIcon size={56} />
            </div>

            <h3 style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(26px, 4vw, 36px)",
              fontWeight: 600,
              color: "var(--color-ink)",
              lineHeight: 1.2,
              marginBottom: 12
            }}>
              Planning Your Visit to Two Hearts?
            </h3>

            <p style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: 16,
              color: "var(--color-bronze)",
              lineHeight: 1.55,
              maxWidth: 520,
              margin: "0 auto 28px auto"
            }}>
              Browse our complete recipe collection or stop by our bistro at Pillar #852, Muradnagar. Once seated at your table, simply scan the physical QR code to order.
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              <button
                onClick={() => handleNav("menu")}
                className="btn-pill-black"
                style={{ padding: "14px 32px", fontSize: 13 }}
              >
                <BookOpen size={15} />
                <span>Explore Full Menu</span>
              </button>

              <button
                onClick={() => handleNav("contact")}
                className="btn-pill-outline"
                style={{ padding: "13px 26px", fontSize: 13 }}
              >
                <MapPin size={14} />
                <span>Find Our Location</span>
              </button>

              <a
                href={CAFE_INFO.instagramUrl || "https://www.instagram.com/Two_hearts_cafe/"}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-pill-subtle"
                style={{
                  padding: "13px 22px",
                  fontSize: 13,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#E1306C",
                  borderColor: "rgba(225, 48, 108, 0.35)",
                  backgroundColor: "rgba(225, 48, 108, 0.05)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(225, 48, 108, 0.12)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(225, 48, 108, 0.05)";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <InstagramIcon size={15} color="#E1306C" />
                <span>@{CAFE_INFO.instagram || "Two_hearts_cafe"}</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
