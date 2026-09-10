import React, { useState } from "react";
import {
  MapPin,
  Crosshair,
  Plus,
  Edit2,
  Building,
  Home,
  Briefcase,
  Compass,
  Check,
  Phone,
  User,
  AlertCircle,
  FileText,
  Loader2,
  Navigation,
  Store
} from "lucide-react";
import LocationAddressModal from "./LocationAddressModal";
import { getCurrentCoordinates } from "../../utils/locationService";
import {
  DELIVERY_CONFIG,
  calculateDistanceKm
} from "../../config/deliveryConfig";

const TAG_CONFIG = {
  Hostel: { emoji: "🏢", label: "Hostel", color: "var(--color-bronze)" },
  PG: { emoji: "🛏️", label: "PG / Flat", color: "#8B5CF6" },
  Home: { emoji: "🏠", label: "Home", color: "#10B981" },
  Work: { emoji: "💼", label: "Work", color: "#3B82F6" },
  Other: { emoji: "📍", label: "Other", color: "#6B7280" }
};

export default function CheckoutAddressSection({
  savedAddresses = [],
  selectedAddressId,
  onSelectAddress,
  onAddNewAddress,
  onUpdateAddress,
  formData,
  setFormData,
  formErrors = {},
  setFormErrors,
  customerUser,
  onNavigate,
  deliveryType = "delivery",
  setDeliveryType
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialCoords, setModalInitialCoords] = useState(null);
  const [editingAddress, setEditingAddress] = useState(null);
  const [isQuickDetecting, setIsQuickDetecting] = useState(false);
  const [quickDetectError, setQuickDetectError] = useState("");

  // Handler for top "Use My Current Location" button
  const handleQuickLocate = async () => {
    setIsQuickDetecting(true);
    setQuickDetectError("");
    try {
      const coords = await getCurrentCoordinates();
      setModalInitialCoords(coords);
      setEditingAddress(null);
      setIsModalOpen(true);
    } catch (err) {
      setQuickDetectError(
        err.message || "Location permission denied. Please add address manually."
      );
      // Open modal anyway so user can enter address or drag map pin
      setModalInitialCoords(null);
      setEditingAddress(null);
      setIsModalOpen(true);
    } finally {
      setIsQuickDetecting(false);
    }
  };

  // Handler for Add New Address button
  const handleOpenAddModal = () => {
    setEditingAddress(null);
    setModalInitialCoords(null);
    setIsModalOpen(true);
  };

  // Handler for Edit Address
  const handleOpenEditModal = (addr, e) => {
    e.stopPropagation();
    setEditingAddress(addr);
    setModalInitialCoords(addr.coords || null);
    setIsModalOpen(true);
  };

  // Handler when address is saved in modal
  const handleSaveModalAddress = (newOrUpdated) => {
    if (editingAddress) {
      if (onUpdateAddress) {
        onUpdateAddress(editingAddress.id, newOrUpdated);
      }
    } else {
      if (onAddNewAddress) {
        onAddNewAddress(newOrUpdated);
      }
    }
    // Select this address
    onSelectAddress(newOrUpdated);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Top Bar: Title & "Use My Current Location" Action */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px 10px",
          width: "100%"
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "var(--font-serif)",
            color: "var(--color-bronze-dark)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <MapPin size={14} style={{ color: "var(--color-bronze)" }} />
          Select Delivery Address
        </div>

        {/* Quick GPS Location Button */}
        <button
          type="button"
          onClick={handleQuickLocate}
          disabled={isQuickDetecting}
          className="touch-target-44"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            backgroundColor: "rgba(138, 87, 56, 0.08)",
            color: "var(--color-bronze-dark)",
            border: "1px solid rgba(138, 87, 56, 0.25)",
            borderRadius: "var(--radius-pill)",
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "var(--font-serif)",
            cursor: "pointer",
            transition: "all 0.18s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(138, 87, 56, 0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(138, 87, 56, 0.08)";
          }}
        >
          {isQuickDetecting ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Crosshair size={13} style={{ color: "var(--color-bronze)" }} />
          )}
          <span>{isQuickDetecting ? "Detecting GPS..." : "Use My Current Location"}</span>
        </button>
      </div>

      {/* Quick Location Error Notice */}
      {quickDetectError && (
        <div
          style={{
            padding: "8px 12px",
            backgroundColor: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 8,
            color: "#991B1B",
            fontSize: 11.5,
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>{quickDetectError}</span>
        </div>
      )}

      {/* 1. Saved Addresses Cards (Zomato/Swiggy Style) */}
      {savedAddresses && savedAddresses.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
              gap: 12
            }}
          >
            {savedAddresses.map((addr) => {
              const isSelected = selectedAddressId === addr.id;
              const tagInfo = TAG_CONFIG[addr.label] || TAG_CONFIG[addr.tag] || TAG_CONFIG.Other;

              // Calculate distance from cafe origin (Pillar #852, Muradnagar)
              const distanceKm =
                addr.coords && addr.coords.lat != null && addr.coords.lng != null
                  ? calculateDistanceKm(
                      DELIVERY_CONFIG.CAFE_COORDINATES.lat,
                      DELIVERY_CONFIG.CAFE_COORDINATES.lng,
                      addr.coords.lat,
                      addr.coords.lng
                    )
                  : null;
              const isWithinZone =
                distanceKm == null
                  ? true
                  : distanceKm <= DELIVERY_CONFIG.MAX_DELIVERY_RADIUS_KM;

              const getCardBorder = () => {
                if (isSelected) {
                  if (!isWithinZone && deliveryType === "delivery") return "2px solid #EF4444";
                  return "2px solid var(--color-bronze)";
                }
                if (!isWithinZone && deliveryType === "delivery") return "1px dashed #FCA5A5";
                return "1px solid rgba(138, 87, 56, 0.2)";
              };

              const getCardBg = () => {
                if (isSelected) {
                  if (!isWithinZone && deliveryType === "delivery") return "#FEF2F2";
                  return "#FFFDF9";
                }
                if (!isWithinZone && deliveryType === "delivery") return "#FAFAFA";
                return "#FFFFFF";
              };

              return (
                <div
                  key={addr.id}
                  onClick={() => onSelectAddress(addr)}
                  style={{
                    position: "relative",
                    padding: "16px",
                    borderRadius: 14,
                    border: getCardBorder(),
                    backgroundColor: getCardBg(),
                    opacity: !isWithinZone && deliveryType === "delivery" && !isSelected ? 0.82 : 1,
                    boxShadow: isSelected
                      ? !isWithinZone && deliveryType === "delivery"
                        ? "0 6px 20px -4px rgba(239, 68, 68, 0.18)"
                        : "0 6px 20px -4px rgba(138, 87, 56, 0.18)"
                      : "0 2px 6px rgba(0, 0, 0, 0.02)",
                    cursor: "pointer",
                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 10
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = !isWithinZone && deliveryType === "delivery" ? "#EF4444" : "rgba(138, 87, 56, 0.4)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = !isWithinZone && deliveryType === "delivery" ? "#FCA5A5" : "rgba(138, 87, 56, 0.2)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  {/* Card Header: Radio Selector, Tag Badge, Distance Badge & Edit Button */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      flexWrap: "wrap"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {/* Radio Circle */}
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          border: isSelected
                            ? !isWithinZone && deliveryType === "delivery"
                              ? "5.5px solid #DC2626"
                              : "5.5px solid var(--color-bronze)"
                            : "2px solid #D1D5DB",
                          backgroundColor: "#FFFFFF",
                          transition: "all 0.15s ease",
                          flexShrink: 0
                        }}
                      />

                      {/* Tag Chip */}
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "3px 9px",
                          backgroundColor: isSelected
                            ? !isWithinZone && deliveryType === "delivery"
                              ? "#FEE2E2"
                              : "var(--color-bronze-light)"
                            : "rgba(0, 0, 0, 0.04)",
                          color: isSelected
                            ? !isWithinZone && deliveryType === "delivery"
                              ? "#991B1B"
                              : "var(--color-bronze-dark)"
                            : "var(--color-ink)",
                          borderRadius: "var(--radius-pill)",
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: "var(--font-serif)"
                        }}
                      >
                        <span>{tagInfo.emoji}</span>
                        <span>{addr.label || addr.tag || "Address"}</span>
                      </div>

                      {/* Distance / Delivery Zone Badge */}
                      {distanceKm != null && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            fontFamily: "var(--font-serif)",
                            padding: "2px 7px",
                            borderRadius: "var(--radius-pill)",
                            backgroundColor: isWithinZone ? "#F0FDF4" : "#FEF2F2",
                            color: isWithinZone ? "#166534" : "#B91C1C",
                            border: isWithinZone ? "1px solid #BBF7D0" : "1px solid #FECACA",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3
                          }}
                        >
                          <span>{isWithinZone ? "✓" : "✕"}</span>
                          <span>{distanceKm} km {isWithinZone ? "(Within 2 km)" : "(Outside zone)"}</span>
                        </span>
                      )}

                      {/* Default Badge */}
                      {addr.isDefault && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: 0.5,
                            textTransform: "uppercase",
                            backgroundColor: "var(--color-bronze)",
                            color: "#FFFFFF",
                            padding: "2px 6px",
                            borderRadius: 4
                          }}
                        >
                          Default
                        </span>
                      )}
                    </div>

                    {/* Edit Action Button */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenEditModal(addr, e)}
                      title="Edit this address"
                      style={{
                        padding: 6,
                        backgroundColor: "transparent",
                        border: "none",
                        color: "var(--color-ink-soft)",
                        cursor: "pointer",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-bronze)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-ink-soft)")}
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>

                  {/* Recipient & Full Address */}
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--color-ink)",
                        marginBottom: 3
                      }}
                    >
                      {addr.recipientName || customerUser?.name || "Customer"}
                      {addr.phone && (
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 500,
                            color: "var(--color-ink-soft)",
                            marginLeft: 6
                          }}
                        >
                          • +91 {addr.phone}
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--color-ink-soft)",
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}
                    >
                      {addr.fullAddress || addr.address}
                    </div>

                    {addr.landmark && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--color-bronze-dark)",
                          marginTop: 4,
                          display: "flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>Landmark:</span> {addr.landmark}
                      </div>
                    )}
                  </div>

                  {/* Selected Indicator Bottom Bar */}
                  {isSelected && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 11,
                        fontWeight: 700,
                        color: !isWithinZone && deliveryType === "delivery" ? "#B91C1C" : "var(--color-bronze-dark)",
                        borderTop: `1px dashed ${!isWithinZone && deliveryType === "delivery" ? "rgba(239, 68, 68, 0.3)" : "rgba(138, 87, 56, 0.25)"}`,
                        paddingTop: 8,
                        marginTop: 2
                      }}
                    >
                      {!isWithinZone && deliveryType === "delivery" ? (
                        <>
                          <AlertCircle size={13} style={{ color: "#DC2626", flexShrink: 0 }} />
                          <span>Outside 2 km delivery zone — Switch to Pickup</span>
                        </>
                      ) : (
                        <>
                          <Check size={12} style={{ color: "var(--color-bronze)" }} />
                          <span>{deliveryType === "delivery" ? "Delivering to this address" : "Address selected"}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* "Add New Address" Card Button in Grid */}
            <button
              type="button"
              onClick={handleOpenAddModal}
              style={{
                minHeight: 130,
                padding: 16,
                borderRadius: 14,
                border: "1.5px dashed rgba(138, 87, 56, 0.35)",
                backgroundColor: "rgba(138, 87, 56, 0.03)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(138, 87, 56, 0.08)";
                e.currentTarget.style.borderColor = "var(--color-bronze)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(138, 87, 56, 0.03)";
                e.currentTarget.style.borderColor = "rgba(138, 87, 56, 0.35)";
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  backgroundColor: "var(--color-bronze)",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Plus size={18} />
              </div>
              <span
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--color-bronze-dark)"
                }}
              >
                Add New Address
              </span>
              <span style={{ fontSize: 10.5, color: "var(--color-ink-soft)" }}>
                Hostel, PG, flat, or home location
              </span>
            </button>
          </div>

          {/* Out-of-Zone Alert Banner for Selected Address */}
          {(() => {
            const selectedAddr = savedAddresses.find((a) => a.id === selectedAddressId);
            const selectedDist =
              selectedAddr?.coords &&
              selectedAddr.coords.lat != null &&
              selectedAddr.coords.lng != null
                ? calculateDistanceKm(
                    DELIVERY_CONFIG.CAFE_COORDINATES.lat,
                    DELIVERY_CONFIG.CAFE_COORDINATES.lng,
                    selectedAddr.coords.lat,
                    selectedAddr.coords.lng
                  )
                : null;
            const isSelectedOutOfZone =
              selectedDist != null &&
              selectedDist > DELIVERY_CONFIG.MAX_DELIVERY_RADIUS_KM;

            if (deliveryType === "delivery" && isSelectedOutOfZone) {
              return (
                <div
                  style={{
                    padding: "12px 16px",
                    backgroundColor: "#FEF2F2",
                    border: "1px solid #FCA5A5",
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 10
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "#991B1B",
                      fontSize: 12.5,
                      fontWeight: 600
                    }}
                  >
                    <AlertCircle size={18} style={{ flexShrink: 0, color: "#DC2626" }} />
                    <span>
                      Sorry, this address is outside our 2 km delivery zone ({selectedDist} km away). You're welcome to place a Pickup order instead!
                    </span>
                  </div>
                  {setDeliveryType && (
                    <button
                      type="button"
                      onClick={() => setDeliveryType("pickup")}
                      className="touch-target-44"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 14px",
                        backgroundColor: "#991B1B",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "var(--radius-pill)",
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: "var(--font-serif)",
                        cursor: "pointer",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        minHeight: 36
                      }}
                    >
                      <Store size={13} />
                      <span>Switch to Pickup</span>
                    </button>
                  )}
                </div>
              );
            }
            return null;
          })()}
        </div>
      ) : (
        /* Empty State: No addresses saved yet */
        <div
          style={{
            padding: "24px 20px",
            backgroundColor: "#FAF6F0",
            borderRadius: 16,
            border: "1.5px dashed rgba(138, 87, 56, 0.3)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              backgroundColor: "var(--color-bronze-light)",
              color: "var(--color-bronze)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <MapPin size={22} />
          </div>
          <div>
            <h4
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 16,
                fontWeight: 700,
                color: "var(--color-ink)",
                margin: "0 0 4px 0"
              }}
            >
              No Delivery Addresses Saved Yet
            </h4>
            <p
              style={{
                fontSize: 12,
                color: "var(--color-ink-soft)",
                maxWidth: 380,
                margin: 0,
                lineHeight: 1.5
              }}
            >
              Add your college hostel room, PG, or residence once to enable fast 1-tap checkout on all future orders.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            <button
              type="button"
              onClick={handleQuickLocate}
              className="btn-pill-black"
              style={{ padding: "10px 20px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
            >
              <Crosshair size={14} />
              <span>Use My Current Location</span>
            </button>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="btn-pill-outline"
              style={{ padding: "10px 20px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
            >
              <Plus size={14} />
              <span>Enter Address Manually</span>
            </button>
          </div>
        </div>
      )}

      {/* Validation Error for Address */}
      {formErrors.address && (
        <div
          style={{
            padding: "8px 12px",
            backgroundColor: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: 8,
            color: "#DC2626",
            fontSize: 11.5,
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <AlertCircle size={14} />
          <span>{formErrors.address}</span>
        </div>
      )}

      {/* 2. Editable Full Name & Mobile Number (Per-Order Overrides) */}
      <div
        style={{
          marginTop: 4,
          paddingTop: 16,
          borderTop: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          gap: 12
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "var(--font-serif)",
            color: "var(--color-bronze-dark)",
            textTransform: "uppercase",
            letterSpacing: 0.5
          }}
        >
          Contact Details for this Order
        </span>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
            gap: 14
          }}
        >
          {/* Full Name */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "var(--font-serif)",
                marginBottom: 6
              }}
            >
              Receiver Name *
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="e.g. Aarav Sharma"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (formErrors.name) setFormErrors((p) => ({ ...p, name: null }));
                }}
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 34px",
                  fontSize: 13,
                  borderRadius: "var(--radius-sm)",
                  border: `1px solid ${formErrors.name ? "#DC2626" : "var(--border-color)"}`,
                  backgroundColor: "var(--bg-app)",
                  outline: "none"
                }}
              />
              <User size={15} style={{ position: "absolute", left: 10, top: 12, color: "var(--color-bronze)" }} />
            </div>
            {formErrors.name && (
              <span style={{ color: "#DC2626", fontSize: 11, marginTop: 3, display: "block" }}>
                {formErrors.name}
              </span>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "var(--font-serif)",
                marginBottom: 6
              }}
            >
              10-Digit Mobile Number *
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="tel"
                maxLength={10}
                placeholder="9876543210"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") });
                  if (formErrors.phone) setFormErrors((p) => ({ ...p, phone: null }));
                }}
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 34px",
                  fontSize: 13,
                  borderRadius: "var(--radius-sm)",
                  border: `1px solid ${formErrors.phone ? "#DC2626" : "var(--border-color)"}`,
                  backgroundColor: "var(--bg-app)",
                  outline: "none"
                }}
              />
              <Phone size={15} style={{ position: "absolute", left: 10, top: 12, color: "var(--color-bronze)" }} />
            </div>
            {formErrors.phone && (
              <span style={{ color: "#DC2626", fontSize: 11, marginTop: 3, display: "block" }}>
                {formErrors.phone}
              </span>
            )}
          </div>
        </div>

        {/* 3. Delivery Notes / Landmark */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 14 }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "var(--font-serif)",
                marginBottom: 6
              }}
            >
              Nearby Landmark (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Near Main Gate, Opp. Pillar 852..."
              value={formData.landmark}
              onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: 13,
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-app)",
                outline: "none"
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "var(--font-serif)",
                marginBottom: 6
              }}
            >
              Delivery Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Call upon arrival, leave at hostel guard desk..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: 13,
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-app)",
                outline: "none"
              }}
            />
          </div>
        </div>
      </div>

      {/* Address & Location Picker Modal */}
      {isModalOpen && (
        <LocationAddressModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaveAddress={handleSaveModalAddress}
          initialCoords={modalInitialCoords}
          initialAddress={editingAddress}
          customerUser={customerUser}
          savedAddressesCount={savedAddresses.length}
        />
      )}
    </div>
  );
}
