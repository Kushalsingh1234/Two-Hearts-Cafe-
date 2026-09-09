import React, { useState } from "react";
import { MapPin, Send, CheckCircle2, ChevronDown, Navigation } from "lucide-react";
import CafeLogoIcon from "../common/CafeLogoIcon";
import { CAFE_INFO, FAQS } from "./MarketingData";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    guests: "2 Guests",
    notes: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;
    setSubmitted(true);
  };

  return (
    <div style={{ width: "100%", overflowX: "hidden", backgroundColor: "var(--bg-app)" }}>
      {/* Header Banner */}
      <section style={{
        paddingTop: "clamp(48px, 7vw, 76px)",
        paddingBottom: "clamp(40px, 6vw, 60px)",
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid var(--border-color)",
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
            Visit Us in Muradnagar
          </span>
          <h1 style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 600,
            color: "var(--color-ink)",
            lineHeight: 1.18,
            marginBottom: 16
          }}>
            Find Your Way to Two Hearts
          </h1>
          <p style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "clamp(16px, 2vw, 18px)",
            color: "var(--color-bronze)",
            lineHeight: 1.55,
            maxWidth: 580,
            margin: "0 auto"
          }}>
            Situated right along the KIET University stretch at Pillar #852. We welcome table drop-ins, study sessions, and takeaway pickups daily.
          </p>
        </div>
      </section>

      {/* Main Details & Form Grid */}
      <section style={{
        paddingTop: 56,
        paddingBottom: 72
      }}>
        <div className="site-container">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 36
          }}>
            {/* Left Column: Location, Hours, Directions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Location Card */}
              <div className="bistro-card" style={{ padding: 28 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: "var(--color-bronze-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <MapPin size={22} style={{ color: "var(--color-bronze)" }} />
                  </div>
                  <div>
                    <span style={{
                      fontSize: 11,
                      fontFamily: "var(--font-serif)",
                      fontWeight: 700,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      color: "var(--color-bronze)",
                      display: "block"
                    }}>
                      Exact Landmark
                    </span>
                    <h3 style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 20,
                      fontWeight: 700,
                      color: "var(--color-ink)",
                      marginBottom: 6
                    }}>
                      Shivam Vihar Colony, Pillar #852
                    </h3>
                    <p style={{ fontSize: 14, color: "var(--color-ink-soft)", lineHeight: 1.5 }}>
                      Right next to KIET University gate, Muradnagar, Ghaziabad, Uttar Pradesh — 201206.
                    </p>
                  </div>
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  paddingTop: 18,
                  borderTop: "1px solid var(--border-color)"
                }}>
                  <div>
                    <span style={{ fontSize: 11, color: "var(--color-ink-soft)", textTransform: "uppercase", letterSpacing: 0.8 }}>
                      Telephone / WhatsApp
                    </span>
                    <a
                      href={`tel:${CAFE_INFO.phone}`}
                      style={{
                        display: "block",
                        fontFamily: "var(--font-serif)",
                        fontSize: 16,
                        fontWeight: 700,
                        color: "var(--color-ink)",
                        textDecoration: "none",
                        marginTop: 4
                      }}
                    >
                      +91 {CAFE_INFO.phone}
                    </a>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, color: "var(--color-ink-soft)", textTransform: "uppercase", letterSpacing: 0.8 }}>
                      Operating Hours
                    </span>
                    <span style={{
                      display: "block",
                      fontFamily: "var(--font-serif)",
                      fontSize: 15,
                      fontWeight: 700,
                      color: "var(--color-bronze-dark)",
                      marginTop: 4
                    }}>
                      12:00 PM – 12:00 PM
                    </span>
                  </div>
                </div>
              </div>

              {/* Map Placeholder Card with External Directions Action */}
              <div className="bistro-card" style={{ padding: 24 }}>
                <div style={{
                  height: 220,
                  backgroundColor: "var(--bg-subtle)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px dashed var(--border-color)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: 20,
                  position: "relative",
                  overflow: "hidden"
                }}>
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0.08,
                    backgroundImage: "radial-gradient(#8A5738 1px, transparent 1px)",
                    backgroundSize: "16px 16px"
                  }} />

                  <div style={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                    boxShadow: "var(--shadow-sm)",
                    zIndex: 1
                  }}>
                    <Navigation size={22} style={{ color: "var(--color-bronze)" }} />
                  </div>

                  <span style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 17,
                    fontWeight: 700,
                    color: "var(--color-ink)",
                    zIndex: 1
                  }}>
                    Pillar #852 Landmark Navigator
                  </span>
                  <p style={{
                    fontFamily: "var(--font-serif)",
                    fontStyle: "italic",
                    fontSize: 13,
                    color: "var(--color-bronze)",
                    marginTop: 4,
                    zIndex: 1
                  }}>
                    Two minutes walking distance from KIET University main gate
                  </p>

                  <a
                    href="https://maps.google.com/?q=KIET+University+Muradnagar+Pillar+852"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-pill-black"
                    style={{ marginTop: 14, fontSize: 11, padding: "8px 18px", zIndex: 1 }}
                  >
                    <span>Open in Google Maps</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: Table Inquiry & Reservation Form */}
            <div className="bistro-card" style={{ padding: "32px 28px" }}>
              <span style={{
                fontSize: 11,
                fontFamily: "var(--font-serif)",
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: "var(--color-bronze)",
                display: "block",
                marginBottom: 6
              }}>
                Table & Celebration Inquiries
              </span>
              <h3 style={{
                fontFamily: "var(--font-serif)",
                fontSize: 24,
                fontWeight: 700,
                color: "var(--color-ink)",
                marginBottom: 8
              }}>
                Reserve or Say Hello
              </h3>
              <p style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: 14,
                color: "var(--color-bronze)",
                lineHeight: 1.5,
                marginBottom: 24
              }}>
                Planning a birthday celebration, project study table, or bulk takeaway? Leave us a note and we'll confirm via WhatsApp/call.
              </p>

              {submitted ? (
                <div style={{
                  padding: "24px 20px",
                  backgroundColor: "var(--color-bronze-light)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(138, 87, 56, 0.3)",
                  textAlign: "center"
                }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                    <CheckCircle2 size={36} style={{ color: "#16a34a" }} />
                  </div>
                  <h4 style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--color-ink)",
                    marginBottom: 6
                  }}>
                    Thank You, {formData.name}!
                  </h4>
                  <p style={{
                    fontFamily: "var(--font-serif)",
                    fontStyle: "italic",
                    fontSize: 14,
                    color: "var(--color-bronze-dark)",
                    lineHeight: 1.5
                  }}>
                    Your message has been received. Our team will get back to you at <strong>{formData.phone}</strong> shortly.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="btn-pill-outline"
                    style={{ marginTop: 16, fontSize: 11 }}
                  >
                    <span>Send Another Inquiry</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{
                      display: "block",
                      fontSize: 12,
                      fontFamily: "var(--font-serif)",
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      color: "var(--color-ink)",
                      marginBottom: 6
                    }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Yashvardhan Singh"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "#FFFFFF",
                        fontSize: 14,
                        color: "var(--color-ink)",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: "block",
                      fontSize: 12,
                      fontFamily: "var(--font-serif)",
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      color: "var(--color-ink)",
                      marginBottom: 6
                    }}>
                      Phone / WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "#FFFFFF",
                        fontSize: 14,
                        color: "var(--color-ink)",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: "block",
                      fontSize: 12,
                      fontFamily: "var(--font-serif)",
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      color: "var(--color-ink)",
                      marginBottom: 6
                    }}>
                      Party / Table Size
                    </label>
                    <select
                      value={formData.guests}
                      onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "#FFFFFF",
                        fontSize: 14,
                        color: "var(--color-ink)",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    >
                      <option value="1 Guest">Solo Study Visit (1 Guest)</option>
                      <option value="2 Guests">Cozy Duo (2 Guests)</option>
                      <option value="4 Guests">Group Table (4 Guests)</option>
                      <option value="6-10 Guests">Celebration Table (6–10 Guests)</option>
                      <option value="Takeaway">Takeaway Pickup Order</option>
                    </select>
                  </div>

                  <div>
                    <label style={{
                      display: "block",
                      fontSize: 12,
                      fontFamily: "var(--font-serif)",
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      color: "var(--color-ink)",
                      marginBottom: 6
                    }}>
                      Message / Dietary Requests
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Need table reserved at 7 PM for birthday with extra chocolate shakes."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "#FFFFFF",
                        fontSize: 14,
                        color: "var(--color-ink)",
                        outline: "none",
                        boxSizing: "border-box",
                        resize: "vertical"
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-pill-black"
                    style={{ width: "100%", padding: "13px", marginTop: 8 }}
                  >
                    <Send size={13} />
                    <span>Send Inquiry to Kitchen</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section style={{
        paddingTop: 48,
        paddingBottom: 80,
        backgroundColor: "#FFFFFF",
        borderTop: "1px solid var(--border-color)"
      }}>
        <div className="site-container-narrow">
          <div style={{ textAlign: "center", marginBottom: 40 }}>
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
              Need Help?
            </span>
            <h2 style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(26px, 3.5vw, 36px)",
              fontWeight: 600,
              color: "var(--color-ink)",
              lineHeight: 1.2
            }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bistro-card"
                  style={{
                    border: isOpen ? "1.5px solid var(--color-bronze)" : "1px solid var(--border-color)",
                    transition: "all 0.2s ease"
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    style={{
                      width: "100%",
                      padding: "18px 22px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      textAlign: "left",
                      gap: 16
                    }}
                  >
                    <span style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 17,
                      fontWeight: 700,
                      color: isOpen ? "var(--color-bronze)" : "var(--color-ink)"
                    }}>
                      {faq.q}
                    </span>
                    <ChevronDown
                      size={18}
                      style={{
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                        color: "var(--color-bronze)",
                        flexShrink: 0
                      }}
                    />
                  </button>

                  {isOpen && (
                    <div style={{
                      padding: "0 22px 20px 22px",
                      fontSize: 14,
                      color: "var(--color-ink-soft)",
                      lineHeight: 1.6,
                      borderTop: "1px dashed var(--border-color)",
                      paddingTop: 14
                    }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
