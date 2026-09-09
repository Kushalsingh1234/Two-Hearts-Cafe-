import React, { useState, useEffect } from "react";
import { Menu, X, BookOpen, MapPin, Clock } from "lucide-react";
import CafeLogoIcon from "./CafeLogoIcon";

export default function SiteNavbar({ currentPage, setPage }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
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
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%",
        backgroundColor: scrolled ? "rgba(250, 247, 242, 0.97)" : "rgba(250, 247, 242, 0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${scrolled ? "var(--border-color)" : "rgba(230, 223, 213, 0.7)"}`,
        boxShadow: scrolled ? "0 4px 20px rgba(28, 25, 23, 0.04)" : "none",
        transition: "all 0.25s ease"
      }}
    >
      <div className="site-container" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 12,
        paddingBottom: 12
      }}>
        {/* Brand Lockup */}
        <div
          onClick={() => handleNavClick("home")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
            userSelect: "none"
          }}
          title="Two Hearts Cafe Home"
        >
          <CafeLogoIcon size={42} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{
              fontFamily: "var(--font-script)",
              fontSize: "clamp(24px, 4vw, 28px)",
              color: "var(--color-bronze)",
              lineHeight: 1,
              letterSpacing: "0.01em"
            }}>
              Two Hearts Cafe
            </span>
            <span style={{
              fontSize: 10,
              fontFamily: "var(--font-serif)",
              color: "var(--color-ink)",
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              marginTop: 3,
              opacity: 0.8
            }}>
              Near KIET University
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

        {/* Right CTA Actions: View Menu button */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => handleNavClick("menu")}
            className="btn-pill-black"
            style={{
              padding: "10px 22px",
              fontSize: 11
            }}
            title="Browse Our Complete Menu"
          >
            <BookOpen size={13} style={{ color: "var(--color-bronze-light)" }} />
            <span>View Menu</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="site-mobile-toggle"
            aria-label="Toggle Navigation Menu"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--border-color)",
              backgroundColor: "#fff",
              color: "var(--color-ink)"
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
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
                <span>Shivam Vihar, Pillar 852, KIET University</span>
              </div>
            </div>
          </div>
        </div>
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
      `}</style>
    </header>
  );
}
