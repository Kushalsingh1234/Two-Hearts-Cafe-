import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Menu,
  X,
  BookOpen,
  MapPin,
  Clock,
  ShoppingBag,
  User,
  Settings,
  Star,
  LogOut,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import CafeLogoIcon from "./CafeLogoIcon";
import { useOnlineOrder } from "../../context/OnlineOrderContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";

export default function SiteNavbar({ currentPage, setPage }) {
  const { cartCount, total } = useOnlineOrder();
  const { customerUser, isLoggedIn, openAuthModal, logout } = useCustomerAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const profileDropdownRef = useRef(null);

  // Close desktop dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (typeof window !== "undefined" && window.innerWidth <= 768) {
        // Mobile bottom sheet handles dismissals via its own backdrop and close button
        return;
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileMenuOpen]);

  // Lock mobile body scroll while profile sheet is open
  useEffect(() => {
    if (profileMenuOpen && typeof window !== "undefined" && window.innerWidth <= 768) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [profileMenuOpen]);

  const profileMenuItems = [
    { id: "orders", label: "Order History", icon: Clock, desc: "Past meals & receipts" },
    { id: "addresses", label: "Your Addresses", icon: MapPin, desc: "Saved delivery locations" },
    { id: "profile", label: "My Profile", icon: User, desc: "Name, email & phone" },
    { id: "settings", label: "Settings", icon: Settings, desc: "Notifications & payment" },
    { id: "feedback", label: "Feedback / Ratings", icon: Star, desc: "Rated dishes & reviews" }
  ];

  const handleProfileItemClick = (tabId) => {
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
    setPage("profile", tabId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = (window.scrollY || document.documentElement.scrollTop || 0) > 15;
      setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { id: "home", label: "Home" },
    { id: "about", label: "Our Story" },
    { id: "menu", label: "Menu" },
    { id: "contact", label: "Visit & Contact" }
  ];

  const handleNavClick = (pageId) => {
    setPage(pageId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header
      id="site-header"
      className={`site-header ${scrolled ? "is-scrolled site-header-scrolled" : ""} ${currentPage === "menu" ? "site-header-menu-page" : ""}`}
      style={{
        position: "-webkit-sticky",
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%",
        backgroundColor: scrolled ? "rgba(235, 225, 210, 0.98)" : "rgba(239, 230, 216, 0.96)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: `1px solid ${scrolled ? "rgba(138, 87, 56, 0.22)" : "rgba(138, 87, 56, 0.16)"}`,
        boxShadow: scrolled ? "0 4px 20px rgba(28, 25, 23, 0.08)" : "0 2px 10px rgba(28, 25, 23, 0.04)",
        transition: "all 0.25s ease"
      }}
    >
      <div className="site-container site-navbar-container" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 10,
        paddingBottom: 10,
        minHeight: "var(--site-navbar-height, 64px)"
      }}>
        {/* Brand Lockup */}
        <div
          onClick={() => handleNavClick("home")}
          className={`site-brand-lockup ${scrolled ? "brand-scrolled" : ""}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
            userSelect: "none"
          }}
          title="Two Hearts Cafe Home"
        >
          <div className="site-brand-crest">
            <CafeLogoIcon size={42} />
          </div>
          <div className="site-brand-text-col" style={{ display: "flex", flexDirection: "column" }}>
            <span
              className="site-brand-script"
              style={{
                fontFamily: "var(--font-script)",
                fontSize: "clamp(24px, 4vw, 28px)",
                color: "var(--color-bronze)",
                lineHeight: 1,
                letterSpacing: "0.01em"
              }}>
              Two Hearts Cafe
            </span>
            <span
              className="site-brand-tagline"
              style={{
                fontSize: 10,
                fontFamily: "var(--font-serif)",
                color: "var(--color-ink)",
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                marginTop: 3,
                opacity: 0.8
              }}
            >
              Boutique Pure Veg Bistro
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav style={{ display: "none" }} className="site-nav-desktop">
          <ul style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
            listStyle: "none",
            margin: 0,
            padding: 0
          }}>
            {navLinks.map((link) => {
              const isActive = currentPage === link.id;
              return (
                <li key={link.id}>
                  <button
                    onClick={() => handleNavClick(link.id)}
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 15,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? "var(--color-ink)" : "var(--color-ink-soft)",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      position: "relative",
                      padding: "6px 0",
                      transition: "color 0.2s ease"
                    }}
                  >
                    {link.label}
                    {isActive && (
                      <span style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 2,
                        backgroundColor: "var(--color-bronze)",
                        borderRadius: 1
                      }} />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right CTA Actions: Cart + View Menu + Auth (Profile option at far right) */}
        <div className="site-navbar-actions" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Cart Pill Button */}
          <button
            type="button"
            onClick={() => handleNavClick("cart")}
            className="touch-target-44 site-navbar-cart-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              minHeight: 44,
              borderRadius: "var(--radius-pill)",
              border: `1.5px solid ${cartCount > 0 ? "var(--color-bronze)" : "var(--border-color)"}`,
              backgroundColor: cartCount > 0 ? "var(--color-bronze-light)" : "#FFFFFF",
              color: cartCount > 0 ? "var(--color-bronze-dark)" : "var(--color-ink)",
              fontSize: 12,
              fontFamily: "var(--font-serif)",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            title="View Delivery Basket"
          >
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <ShoppingBag size={15} style={{ color: cartCount > 0 ? "var(--color-bronze-dark)" : "var(--color-bronze)" }} />
              {cartCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: -8,
                  right: -9,
                  backgroundColor: "var(--color-bronze)",
                  color: "#FFFFFF",
                  fontSize: 9,
                  fontWeight: 700,
                  width: 15,
                  height: 15,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {cartCount}
                </span>
              )}
            </div>
            <span className="cart-text-label">{cartCount > 0 ? `₹${total}` : "Cart"}</span>
          </button>

          {/* Menu Button (Hidden on mobile) */}
          <button
            onClick={() => handleNavClick("menu")}
            className="btn-pill-black site-navbar-menu-btn"
            style={{
              padding: "8px 14px",
              fontSize: 11
            }}
            title="Browse Our Complete Menu"
          >
            <BookOpen size={13} style={{ color: "var(--color-bronze-light)" }} />
            <span>Menu</span>
          </button>

          {/* Auth State Button (Sign In or User Profile Dropdown - ALWAYS at far right in place of 3 lines) */}
          {isLoggedIn && customerUser ? (
            <div ref={profileDropdownRef} className="site-navbar-profile-wrapper" style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="touch-target-44 site-navbar-profile-btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 10px 5px 6px",
                  minHeight: 44,
                  borderRadius: "var(--radius-pill)",
                  border: `1.5px solid ${profileMenuOpen || currentPage === "profile" ? "var(--color-bronze)" : "var(--border-color)"}`,
                  backgroundColor: profileMenuOpen || currentPage === "profile" ? "var(--color-bronze-light)" : "#FFFFFF",
                  color: "var(--color-ink)",
                  fontSize: 12,
                  fontFamily: "var(--font-serif)",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                title={`Account menu for ${customerUser.name || "Customer"}`}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    backgroundColor: "var(--color-bronze)",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    overflow: "hidden"
                  }}
                >
                  {customerUser.avatarUrl ? (
                    <img src={customerUser.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    customerUser.avatarMonogram || (customerUser.name ? customerUser.name.charAt(0).toUpperCase() : "U")
                  )}
                </div>

                <span
                  className="site-profile-name-text"
                  style={{
                    maxWidth: 70,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}
                >
                  {customerUser.name ? customerUser.name.split(" ")[0] : "Profile"}
                </span>

                <ChevronDown
                  size={12}
                  style={{
                    color: "var(--color-bronze)",
                    transition: "transform 0.2s ease",
                    transform: profileMenuOpen ? "rotate(180deg)" : "rotate(0)"
                  }}
                />
              </button>

              {/* Desktop Anchored Dropdown Panel */}
              {profileMenuOpen && (
                <div
                  className="site-profile-desktop-dropdown animate-fade-in"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 8px)",
                    width: 280,
                    backgroundColor: "#FFFFFF",
                    border: "1px solid var(--border-color)",
                    borderRadius: 16,
                    boxShadow: "0 12px 35px rgba(28, 25, 23, 0.12)",
                    padding: "14px 12px 10px 12px",
                    zIndex: 100
                  }}
                >
                  {/* Header User info */}
                  <div style={{
                    padding: "4px 8px 12px 8px",
                    borderBottom: "1px solid var(--border-color)",
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 10
                  }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      backgroundColor: "var(--color-bronze-light)",
                      border: "1.5px solid var(--color-bronze)",
                      color: "var(--color-bronze-dark)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-serif)",
                      fontSize: 15,
                      fontWeight: 700
                    }}>
                      {customerUser.avatarMonogram || (customerUser.name ? customerUser.name.charAt(0).toUpperCase() : "U")}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 15,
                        fontWeight: 700,
                        color: "var(--color-ink)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {customerUser.name || "Customer"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--color-ink-soft)" }}>
                        +91 {customerUser.phone}
                      </div>
                    </div>
                  </div>

                  {/* 5 Menu Items */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {profileMenuItems.map((item) => {
                      const IconComp = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleProfileItemClick(item.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "9px 10px",
                            borderRadius: 8,
                            backgroundColor: "transparent",
                            border: "none",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "background-color 0.15s ease",
                            width: "100%"
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-app)")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            backgroundColor: "var(--bg-app)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--color-bronze)",
                            flexShrink: 0
                          }}>
                            <IconComp size={14} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-ink)" }}>
                              {item.label}
                            </div>
                            <div style={{ fontSize: 10, color: "#78716C", lineHeight: 1.2 }}>
                              {item.desc}
                            </div>
                          </div>
                          <ChevronRight size={12} style={{ color: "#A8A29E" }} />
                        </button>
                      );
                    })}
                  </div>

                  {/* Navigation Links in Dropdown */}
                  <div style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: "1px solid var(--border-color)",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 4
                  }}>
                    {navLinks.map((link) => (
                      <button
                        key={link.id}
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          handleNavClick(link.id);
                        }}
                        style={{
                          padding: "6px 8px",
                          borderRadius: 6,
                          backgroundColor: currentPage === link.id ? "var(--color-bronze-light)" : "transparent",
                          border: "none",
                          fontSize: 11,
                          fontFamily: "var(--font-serif)",
                          fontWeight: 600,
                          color: currentPage === link.id ? "var(--color-bronze-dark)" : "var(--color-ink-soft)",
                          cursor: "pointer",
                          textAlign: "center"
                        }}
                      >
                        {link.label}
                      </button>
                    ))}
                  </div>

                  {/* Divider & Sign Out */}
                  <div style={{
                    marginTop: 6,
                    paddingTop: 8,
                    borderTop: "1px solid var(--border-color)"
                  }}>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        logout();
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 8,
                        backgroundColor: "transparent",
                        border: "none",
                        color: "#DC2626",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FEF2F2")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal(() => handleNavClick("profile"))}
              className="btn-pill-outline touch-target-44 site-navbar-signin-btn"
              style={{
                padding: "8px 16px",
                minHeight: 44,
                fontSize: 12,
                borderWidth: 1.2
              }}
              title="Sign in with Google (Gmail)"
            >
              <User size={13} />
              <span className="signin-text-label">Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          className="animate-fade-in"
          style={{
            backgroundColor: "#FAF7F2",
            borderBottom: "1px solid var(--border-color)",
            padding: "16px 20px 24px",
            boxShadow: "0 10px 25px rgba(28, 25, 23, 0.08)"
          }}
        >
          {/* User Auth Card in Mobile Drawer */}
          <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid var(--border-color)" }}>
            {isLoggedIn && customerUser ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div
                  onClick={() => handleNavClick("profile")}
                  style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      backgroundColor: "var(--color-bronze)",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-serif)",
                      fontSize: 15,
                      fontWeight: 700
                    }}
                  >
                    {customerUser.name ? customerUser.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 700, color: "var(--color-ink)" }}>
                      {customerUser.name || "Customer"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-ink-soft)" }}>
                      +91 {customerUser.phone} • View Profile
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: "transparent",
                    border: "1px solid #FCA5A5",
                    color: "#DC2626",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal(() => handleNavClick("profile"));
                }}
                className="btn-pill-black"
                style={{ width: "100%", padding: "11px", justifyContent: "center", fontSize: 12 }}
              >
                <User size={14} />
                <span>Sign In with Google</span>
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {navLinks.map((link) => {
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  style={{
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: isActive ? "rgba(138, 87, 56, 0.08)" : "transparent",
                    color: isActive ? "var(--color-bronze)" : "var(--color-ink)",
                    fontFamily: "var(--font-serif)",
                    fontSize: 17,
                    fontWeight: isActive ? 700 : 600,
                    letterSpacing: "0.03em"
                  }}
                >
                  {link.label}
                </button>
              );
            })}

            {isLoggedIn && (
              <button
                onClick={() => handleNavClick("profile")}
                style={{
                  textAlign: "left",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: currentPage === "profile" ? "rgba(138, 87, 56, 0.08)" : "transparent",
                  color: currentPage === "profile" ? "var(--color-bronze)" : "var(--color-ink)",
                  fontFamily: "var(--font-serif)",
                  fontSize: 17,
                  fontWeight: currentPage === "profile" ? 700 : 600,
                  letterSpacing: "0.03em"
                }}
              >
                My Profile & Orders
              </button>
            )}

            <div style={{
              marginTop: 10,
              paddingTop: 16,
              borderTop: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              fontSize: 12,
              color: "var(--color-bronze)",
              fontFamily: "var(--font-serif)",
              fontStyle: "italic"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={13} />
                <span>Open Daily: 12:00 PM – 12:00 AM</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin size={13} />
                <span>Shivam Vihar, Pillar 852, Muradnagar</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Slide-Up Bottom Sheet for Profile Menu */}
      {isLoggedIn && customerUser && profileMenuOpen && typeof document !== "undefined" && createPortal(
        <div
          className="site-profile-mobile-sheet animate-fade-in"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            backgroundColor: "rgba(28, 25, 23, 0.65)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setProfileMenuOpen(false);
          }}
        >
          <div
            className="animate-slide-up"
            style={{
              backgroundColor: "#FAF7F2",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderTop: "1px solid var(--border-color)",
              padding: "16px 20px 32px 20px",
              boxShadow: "0 -10px 40px rgba(28, 25, 23, 0.2)",
              maxHeight: "85vh",
              overflowY: "auto"
            }}
          >
            {/* Drag Handle Bar */}
            <div style={{
              width: 44,
              height: 4,
              borderRadius: 2,
              backgroundColor: "#D6C8B8",
              margin: "0 auto 16px auto"
            }} />

            {/* User Profile Header Row */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 16,
              borderBottom: "1px solid var(--border-color)",
              marginBottom: 16
            }}>
              <div
                onClick={() => handleProfileItemClick("profile")}
                style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", flex: 1 }}
                title="Tap to view & edit profile"
              >
                <div style={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  backgroundColor: "var(--color-bronze-light)",
                  border: "2px solid var(--color-bronze)",
                  color: "var(--color-bronze-dark)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-serif)",
                  fontSize: 18,
                  fontWeight: 700
                }}>
                  {customerUser.avatarMonogram || (customerUser.name ? customerUser.name.charAt(0).toUpperCase() : "U")}
                </div>
                <div>
                  <h3 style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 19,
                    fontWeight: 700,
                    margin: 0,
                    color: "var(--color-ink)"
                  }}>
                    {customerUser.name || "Customer"}
                  </h3>
                  <div style={{ fontSize: 12, color: "var(--color-ink-soft)", marginTop: 2 }}>
                    +91 {customerUser.phone} {customerUser.email ? `• ${customerUser.email}` : ""}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-bronze)", fontWeight: 600, marginTop: 2 }}>
                    View & Edit Profile →
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setProfileMenuOpen(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid var(--border-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-ink-soft)",
                  cursor: "pointer"
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* 5 Menu Items - Mobile touch friendly rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {profileMenuItems.map((item) => {
                const IconComp = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleProfileItemClick(item.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 16px",
                      borderRadius: 14,
                      backgroundColor: "#FFFFFF",
                      border: "1px solid var(--border-color)",
                      textAlign: "left",
                      cursor: "pointer",
                      width: "100%",
                      boxShadow: "var(--shadow-sm)"
                    }}
                  >
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      backgroundColor: "var(--color-bronze-light)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--color-bronze)",
                      flexShrink: 0
                    }}>
                      <IconComp size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-ink)", fontFamily: "var(--font-serif)" }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 11, color: "#78716C", marginTop: 2 }}>
                        {item.desc}
                      </div>
                    </div>
                    <ChevronRight size={16} color="var(--color-bronze)" />
                  </button>
                );
              })}
            </div>

            {/* Quick Navigation to Cafe Pages on Mobile */}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-serif)", color: "var(--color-bronze)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                Explore Two Hearts Cafe
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { id: "home", label: "🏠 Home" },
                  { id: "menu", label: "🍽️ Menu" },
                  { id: "about", label: "📖 Our Story" },
                  { id: "contact", label: "📍 Contact" }
                ].map((pg) => (
                  <button
                    key={pg.id}
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleNavClick(pg.id);
                    }}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      backgroundColor: currentPage === pg.id ? "var(--color-bronze-light)" : "#FFFFFF",
                      border: `1px solid ${currentPage === pg.id ? "var(--color-bronze)" : "var(--border-color)"}`,
                      fontSize: 13,
                      fontFamily: "var(--font-serif)",
                      fontWeight: 600,
                      color: currentPage === pg.id ? "var(--color-bronze-dark)" : "var(--color-ink)",
                      cursor: "pointer",
                      textAlign: "center"
                    }}
                  >
                    {pg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sign Out Button on Mobile */}
            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen(false);
                logout();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                padding: "14px",
                borderRadius: "var(--radius-pill)",
                backgroundColor: "transparent",
                border: "1px solid #FCA5A5",
                color: "#DC2626",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                marginTop: 20
              }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Media query helper styles */}
      <style>{`
        @media (min-width: 860px) {
          .site-nav-desktop {
            display: block !important;
          }
          .site-mobile-toggle {
            display: none !important;
          }
        }
        @media (min-width: 769px) {
          .site-profile-mobile-sheet {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .site-navbar-menu-btn {
            display: none !important;
          }
          .site-profile-desktop-dropdown {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
