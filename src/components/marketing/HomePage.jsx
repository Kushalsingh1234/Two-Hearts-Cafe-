import React, { useState, useEffect } from "react";
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
  DISH_PHOTOS
} from "./MarketingData";
import { INITIAL_MENU_ITEMS } from "../../data/seedMenu";
import CafeLogoIcon from "../common/CafeLogoIcon";

export default function HomePage({ setPage, menuItems = INITIAL_MENU_ITEMS }) {
  const [selectedPreviewCat, setSelectedPreviewCat] = useState("all");
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-rotate stories preview every 5.5s (like professional sites)
  useEffect(() => {
    if (isPaused || isGalleryOpen) return;
    const interval = setInterval(() => {
      setActiveStoryIdx((prev) => (prev + 1) % CAFE_STORIES.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused, isGalleryOpen]);

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
      {/* 1. Subtle Announcement Ribbon */}
      <div style={{
        backgroundColor: "var(--color-bronze-light)",
        borderBottom: "1px solid rgba(138, 87, 56, 0.15)",
        padding: "8px 16px",
        textAlign: "center",
        fontSize: 12,
        fontFamily: "var(--font-serif)",
        color: "var(--color-bronze-dark)",
        letterSpacing: "0.04em"
      }}>
        <span>✨ Welcome to Two Hearts • Open Daily <strong>12:00 PM – 12:00 AM</strong> • Pillar #852, KIET University • Pure Vegetarian Kitchen</span>
      </div>

      {/* 2. Bold, Full-Bleed Hero Section */}
      <section style={{
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

        <div className="site-container" style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            alignItems: "center",
            gap: "clamp(36px, 6vw, 64px)"
          }}>
            {/* Left Content Column */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              {/* Boutique Tag */}
              <div style={{
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
              <h1 style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(34px, 5.5vw, 54px)",
                fontWeight: 600,
                color: "var(--color-ink)",
                lineHeight: 1.14,
                letterSpacing: "-0.01em",
                marginBottom: 18
              }}>
                Where Every Flavor Tells a Story of{" "}
                <span style={{
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
              <p style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: "clamp(16px, 2.2vw, 19px)",
                color: "var(--color-bronze)",
                lineHeight: 1.6,
                marginBottom: 32,
                maxWidth: 540
              }}>
                {BRAND_SUBTITLE}
              </p>

              {/* Hero CTA Buttons */}
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 14,
                marginBottom: 36
              }}>
                <button
                  onClick={() => handleNav("menu")}
                  className="btn-pill-black"
                  style={{ padding: "14px 30px", fontSize: 13 }}
                >
                  <BookOpen size={15} />
                  <span>View Menu</span>
                </button>

                <button
                  onClick={() => handleNav("about")}
                  className="btn-pill-outline"
                  style={{ padding: "13px 26px", fontSize: 13 }}
                >
                  <span>Our Story & Ambience</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Quick Trust Highlights */}
              <div style={{
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
                    Near Pillar 852 (KIET)
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

            {/* Right Hero Brand Emblem (Completely Borderless) */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "clamp(8px, 2vw, 24px)"
            }}>
              <img
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
      <section style={{
        backgroundColor: "#FFFFFF",
        borderTop: "1px solid var(--border-color)",
        borderBottom: "1px solid var(--border-color)",
        paddingTop: 36,
        paddingBottom: 36
      }}>
        <div className="site-container">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 28
          }}>
            {TRUST_FEATURES.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "6px"
                }}
              >
                <div style={{
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
                <div>
                  <h4 style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--color-ink)",
                    marginBottom: 4
                  }}>
                    {item.title}
                  </h4>
                  <p style={{
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

      {/* 4. Photo-Forward Category Showcase (Pasta / Sandwiches / Noodles / Maggie) */}
      <section style={{
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
                Step into our warm sanctuary near KIET University. Spotlight preview of our handcrafted dining spaces.
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
            const isPrivateCorner = currentStory.id === "private-corner";

            return (
              <div
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                {/* Main Spotlight Card */}
                <div
                  key={currentStory.id}
                  className="story-fade-in"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                    gap: "clamp(32px, 5vw, 56px)",
                    alignItems: "center",
                    background: "linear-gradient(155deg, #FFFFFF 0%, #FCFAF7 60%, #F6EFE6 100%)",
                    borderRadius: "28px",
                    border: "1px solid rgba(180, 130, 90, 0.28)",
                    padding: "clamp(24px, 4vw, 44px)",
                    boxShadow: "0 24px 64px -16px rgba(74, 53, 39, 0.09), 0 2px 6px rgba(74, 53, 39, 0.02)",
                    position: "relative",
                    overflow: "hidden"
                  }}
                >
                  {/* Top golden hairline accent */}
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: "linear-gradient(90deg, transparent 0%, rgba(180, 130, 90, 0.6) 50%, transparent 100%)"
                  }} />

                  {/* Photo Column (Left) */}
                  <div style={{
                    position: "relative",
                    borderRadius: "22px",
                    overflow: "hidden",
                    boxShadow: "0 16px 36px -8px rgba(74, 53, 39, 0.16)",
                    backgroundColor: "#EFE8DC"
                  }}>
                    <img
                      src={currentStory.image}
                      alt={currentStory.alt}
                      loading="eager"
                      style={{
                        width: "100%",
                        height: "clamp(440px, 46vw, 540px)",
                        objectFit: "cover",
                        objectPosition: isPrivateCorner ? "center bottom" : "center center",
                        display: "block",
                        transition: "transform 0.5s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.025)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
                    />

                    {/* Premium Badge (No Emoji) */}
                    <div style={{
                      position: "absolute",
                      top: 18,
                      left: 18,
                      backgroundColor: "rgba(255, 255, 255, 0.92)",
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
                      color: "var(--color-bronze)",
                      boxShadow: "0 6px 18px rgba(0,0,0,0.08)"
                    }}>
                      {isPrivateCorner ? (
                        <Sparkles size={12} style={{ color: "var(--color-bronze)" }} />
                      ) : (
                        <Heart size={12} style={{ color: "var(--color-bronze)" }} />
                      )}
                      <span>{currentStory.badgeText}</span>
                    </div>

                    {/* Quick Expand to Gallery Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsGalleryOpen(true);
                      }}
                      title="View in full gallery"
                      style={{
                        position: "absolute",
                        bottom: 18,
                        right: 18,
                        backgroundColor: "rgba(28, 25, 23, 0.82)",
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

                  {/* Narrative & Cool Toggles Column (Right) */}
                  <div>
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
                        color: "var(--color-bronze)"
                      }}>
                        {currentStory.eyebrow}
                      </span>
                      <span style={{
                        fontSize: 11,
                        color: "var(--color-bronze)",
                        fontWeight: 600,
                        fontFamily: "var(--font-serif)"
                      }}>
                        Space {String(activeStoryIdx + 1).padStart(2, "0")} / {String(CAFE_STORIES.length).padStart(2, "0")}
                      </span>
                    </div>

                    <h3 style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "clamp(24px, 3.2vw, 34px)",
                      fontWeight: 600,
                      color: "var(--color-ink)",
                      lineHeight: 1.25,
                      marginBottom: 10
                    }}>
                      {currentStory.title}
                    </h3>
                    <p style={{
                      fontFamily: "var(--font-serif)",
                      fontStyle: "italic",
                      fontSize: 15,
                      color: "var(--color-bronze)",
                      lineHeight: 1.5,
                      marginBottom: 16
                    }}>
                      "{currentStory.quote}"
                    </p>
                    <p style={{
                      fontSize: 14,
                      color: "var(--color-ink-soft)",
                      lineHeight: 1.75,
                      marginBottom: 24
                    }}>
                      {currentStory.description}
                    </p>


                    {/* Action buttons */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => handleNav("menu")}
                        className="btn-pill-black"
                        style={{ padding: "12px 26px", fontSize: 12 }}
                      >
                        <span>View Our Menu</span>
                        <ArrowRight size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsGalleryOpen(true)}
                        className="btn-pill-outline"
                        style={{ padding: "11px 20px", fontSize: 12 }}
                      >
                        <Eye size={13} style={{ color: "var(--color-bronze)" }} />
                        <span>Open Gallery</span>
                      </button>
                      <span style={{
                        fontSize: 12,
                        color: "var(--color-bronze)",
                        fontWeight: 600,
                        fontFamily: "var(--font-serif)"
                      }}>
                        {currentStory.locationNote}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Professional Auto-Rotation Navigation & Control Bar */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 16,
                  padding: "14px 20px",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "var(--radius-pill)",
                  border: "1px solid rgba(180, 130, 90, 0.25)",
                  boxShadow: "0 4px 16px rgba(74, 53, 39, 0.04)"
                }}>
                  {/* Previous / Next Arrow Controls */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setActiveStoryIdx((prev) => (prev - 1 + CAFE_STORIES.length) % CAFE_STORIES.length)}
                      title="Previous space"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        backgroundColor: "var(--bg-app)",
                        border: "1px solid rgba(180, 130, 90, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--color-ink)",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStoryIdx((prev) => (prev + 1) % CAFE_STORIES.length)}
                      title="Next space"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        backgroundColor: "var(--bg-app)",
                        border: "1px solid rgba(180, 130, 90, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--color-ink)",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Story Selectors with Progress Bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {CAFE_STORIES.map((story, idx) => {
                      const isActive = activeStoryIdx === idx;
                      return (
                        <button
                          key={story.id}
                          type="button"
                          onClick={() => setActiveStoryIdx(idx)}
                          style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 16px",
                            borderRadius: "var(--radius-pill)",
                            border: isActive ? "1px solid rgba(180, 130, 90, 0.4)" : "1px solid transparent",
                            backgroundColor: isActive ? "var(--bg-app)" : "transparent",
                            color: isActive ? "var(--color-ink)" : "var(--color-ink-soft)",
                            fontFamily: "var(--font-serif)",
                            fontSize: 12,
                            fontWeight: isActive ? 700 : 500,
                            cursor: "pointer",
                            transition: "all 0.25s ease",
                            overflow: "hidden"
                          }}
                        >
                          <span style={{ fontSize: 10, color: "var(--color-bronze)", fontWeight: 700 }}>
                            0{idx + 1}
                          </span>
                          <span>{story.title.split("for")[0].trim()}</span>

                          {/* Live rotation progress bar indicator on active tab */}
                          {isActive && !isPaused && (
                            <div
                              className="progress-timer-bar"
                              style={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                height: 2,
                                backgroundColor: "var(--color-bronze)"
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Auto-Rotation State Note & Gallery Trigger */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{
                      fontSize: 11,
                      color: "var(--color-bronze)",
                      fontStyle: "italic",
                      fontFamily: "var(--font-serif)"
                    }}>
                      {isPaused ? "Paused on hover" : "Auto-advancing"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsGalleryOpen(true)}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--color-ink)",
                        background: "none",
                        border: "none",
                        textDecoration: "underline",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      <span>View Gallery</span>
                      <ArrowRight size={11} />
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

                {/* Modal Body: Both Stories Displayed In Full View */}
                <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
                  {CAFE_STORIES.map((story) => {
                    const isPrivateCorner = story.id === "private-corner";
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
                        {/* Photo */}
                        <div style={{
                          position: "relative",
                          borderRadius: "20px",
                          overflow: "hidden",
                          boxShadow: "0 12px 28px rgba(74, 53, 39, 0.12)",
                          backgroundColor: "#EFE8DC"
                        }}>
                          <img
                            src={story.image}
                            alt={story.alt}
                            style={{
                              width: "100%",
                              height: "clamp(380px, 40vw, 480px)",
                              objectFit: "cover",
                              objectPosition: isPrivateCorner ? "center bottom" : "center center",
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

                        {/* Details & Toggles */}
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

          {/* Real Menu Items Preview Grid */}
          <div style={{ marginTop: 64 }}>
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

            {/* Category Filter Tabs */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 36
            }}>
              {[
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
              ].map((tab) => {
                const isSelected = selectedPreviewCat === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedPreviewCat(tab.id)}
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

            {/* Real Dishes Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 22
            }}>
              {menuItems
                .filter((item) => selectedPreviewCat === "all" || item.category === selectedPreviewCat)
                .slice(0, 8)
                .map((item) => {
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
                      <div style={{ position: "relative", height: 170, overflow: "hidden" }}>
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
                            lineHeight: 1.25,
                            marginBottom: 6
                          }}>
                            {item.name}
                          </h4>

                          <p style={{
                            fontFamily: "var(--font-serif)",
                            fontStyle: "italic",
                            fontSize: 12.5,
                            color: "var(--color-bronze)",
                            lineHeight: 1.45,
                            marginBottom: 12
                          }}>
                            {item.description}
                          </p>
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

            {/* View Full Menu CTA */}
            <div style={{ textAlign: "center", marginTop: 36 }}>
              <button
                onClick={() => handleNav("menu")}
                className="btn-pill-black"
                style={{ padding: "12px 28px", fontSize: 12 }}
              >
                <BookOpen size={14} />
                <span>View Full Menu ({menuItems.length} Dishes)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Chef's Special / Signature Dish Spotlight */}
      <section style={{
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
      <section style={{
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
      <section style={{
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
              Words from KIET Students & Neighbors
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

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24
          }}>
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
        </div>
      </section>

      {/* 8. CTA Banner Linking to Menu & Visit */}
      <section style={{
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
              Browse our complete recipe collection or stop by our bistro right next to KIET University. Once seated at your table, simply scan the physical QR code to order.
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
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
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
