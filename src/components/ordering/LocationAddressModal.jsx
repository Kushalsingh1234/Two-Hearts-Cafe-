import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  MapPin,
  Crosshair,
  Home,
  Building,
  Briefcase,
  Compass,
  Check,
  AlertCircle,
  Loader2,
  Navigation,
  Plus,
  Minus
} from "lucide-react";
import {
  getCurrentCoordinates,
  reverseGeocode,
  DEFAULT_CAFE_COORDS
} from "../../utils/locationService";
import {
  DELIVERY_CONFIG,
  calculateDistanceKm
} from "../../config/deliveryConfig";

const ADDRESS_TYPES = [
  { id: "Hostel", label: "Hostel", icon: Building, emoji: "🏢" },
  { id: "PG", label: "PG / Flat", icon: Home, emoji: "🛏️" },
  { id: "Home", label: "Home", icon: Home, emoji: "🏠" },
  { id: "Work", label: "Work / Office", icon: Briefcase, emoji: "💼" },
  { id: "Other", label: "Other", icon: Compass, emoji: "📍" }
];

export default function LocationAddressModal({
  isOpen,
  onClose,
  onSaveAddress,
  initialCoords = null,
  initialAddress = null,
  customerUser = null,
  savedAddressesCount = 0
}) {
  if (!isOpen) return null;

  // Map position state (lat, lng, zoom)
  const [coords, setCoords] = useState(() => {
    if (initialCoords && initialCoords.lat && initialCoords.lng) {
      return initialCoords;
    }
    return { lat: DEFAULT_CAFE_COORDS.lat, lng: DEFAULT_CAFE_COORDS.lng };
  });
  const [zoom, setZoom] = useState(16);

  // Address details state
  const [addressType, setAddressType] = useState(initialAddress?.label || "Hostel");
  const [roomNumber, setRoomNumber] = useState(initialAddress?.roomNumber || "");
  const [streetArea, setStreetArea] = useState(initialAddress?.street || initialAddress?.address || "");
  const [landmark, setLandmark] = useState(initialAddress?.landmark || "");
  const [recipientName, setRecipientName] = useState(
    initialAddress?.recipientName || customerUser?.name || ""
  );
  const [phone, setPhone] = useState(
    initialAddress?.phone || customerUser?.phone || ""
  );
  const [isDefault, setIsDefault] = useState(
    initialAddress ? Boolean(initialAddress.isDefault) : savedAddressesCount === 0
  );

  // Geocoding and status state
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState(initialAddress?.fullAddress || "");
  const [locationError, setLocationError] = useState("");
  const [formErrors, setFormErrors] = useState({});

  // Map dragging state
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const dragStartRef = useRef(null);
  const mapContainerRef = useRef(null);

  // Perform reverse geocoding for coordinates
  const fetchAddressForCoords = useCallback(async (lat, lng) => {
    setIsGeocoding(true);
    setLocationError("");
    try {
      const geo = await reverseGeocode(lat, lng);
      setDetectedAddress(geo.formattedAddress || geo.fullAddress);
      // If user hasn't typed a custom area yet or if it was auto-detected, update streetArea
      setStreetArea((prev) => {
        if (!prev || prev.includes("Near Muradnagar") || prev === geo.street) {
          return geo.formattedAddress;
        }
        return prev;
      });
      if (!landmark && geo.landmark) {
        setLandmark(geo.landmark);
      }
    } catch (err) {
      console.warn("Reverse geocode failed:", err);
      setDetectedAddress(`Location at ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`);
    } finally {
      setIsGeocoding(false);
    }
  }, [landmark]);

  // Request user's current GPS location
  const handleDetectLocation = async () => {
    setIsLocating(true);
    setLocationError("");
    try {
      const pos = await getCurrentCoordinates();
      setCoords({ lat: pos.lat, lng: pos.lng });
      setZoom(16);
      await fetchAddressForCoords(pos.lat, pos.lng);
    } catch (err) {
      setLocationError(err.message || "Could not detect your location. Please enter details manually.");
    } finally {
      setIsLocating(false);
    }
  };

  // If initialCoords passed or if modal just opened without initial coords, auto-detect location once
  useEffect(() => {
    if (isOpen) {
      if (initialCoords && initialCoords.lat && initialCoords.lng) {
        fetchAddressForCoords(initialCoords.lat, initialCoords.lng);
      } else if (!initialAddress) {
        handleDetectLocation();
      }
    }
  }, [isOpen]);

  // Mouse & touch pan handlers for interactive map
  const handleMouseDown = (e) => {
    setIsDraggingMap(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, lat: coords.lat, lng: coords.lng };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingMap || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    // Conversion factor based on zoom
    const factor = 360 / (Math.pow(2, zoom) * 256);
    const newLng = dragStartRef.current.lng - dx * factor;
    const newLat = dragStartRef.current.lat + dy * factor;
    setCoords({ lat: newLat, lng: newLng });
  };

  const handleMouseUp = () => {
    if (isDraggingMap) {
      setIsDraggingMap(false);
      dragStartRef.current = null;
      fetchAddressForCoords(coords.lat, coords.lng);
    }
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      setIsDraggingMap(true);
      dragStartRef.current = { x: t.clientX, y: t.clientY, lat: coords.lat, lng: coords.lng };
    }
  };

  const handleTouchMove = (e) => {
    if (!isDraggingMap || !dragStartRef.current || e.touches.length !== 1) return;
    const t = e.touches[0];
    const dx = t.clientX - dragStartRef.current.x;
    const dy = t.clientY - dragStartRef.current.y;
    const factor = 360 / (Math.pow(2, zoom) * 256);
    const newLng = dragStartRef.current.lng - dx * factor;
    const newLat = dragStartRef.current.lat + dy * factor;
    setCoords({ lat: newLat, lng: newLng });
  };

  const handleTouchEnd = () => {
    if (isDraggingMap) {
      setIsDraggingMap(false);
      dragStartRef.current = null;
      fetchAddressForCoords(coords.lat, coords.lng);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    if (!roomNumber.trim()) {
      errors.roomNumber = "Please enter your Room / Flat / House No.";
    }
    if (!streetArea.trim()) {
      errors.streetArea = "Please specify street or hostel/building name.";
    }
    if (!recipientName.trim()) {
      errors.recipientName = "Please enter contact person's name.";
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      errors.phone = "Please enter a valid 10-digit phone number.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Compose complete address string
    const fullCombined = `${roomNumber.trim()}, ${streetArea.trim()}`;

    const newAddressObj = {
      id: initialAddress?.id || `addr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: addressType,
      tag: addressType,
      roomNumber: roomNumber.trim(),
      address: fullCombined,
      fullAddress: fullCombined,
      street: streetArea.trim(),
      landmark: landmark.trim(),
      recipientName: recipientName.trim(),
      phone: cleanPhone.slice(-10),
      isDefault: Boolean(isDefault),
      coords: { lat: coords.lat, lng: coords.lng }
    };

    onSaveAddress(newAddressObj);
    onClose();
  };

  // Convert lat/lng to static OpenStreetMap tile calculation for smooth background
  const n = Math.pow(2, zoom);
  const xTile = Math.floor(((coords.lng + 180) / 360) * n);
  const latRad = (coords.lat * Math.PI) / 180;
  const yTile = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  const osmTileUrl = `https://tile.openstreetmap.org/${zoom}/${xTile}/${yTile}.png`;

  // Calculate distance from cafe origin (Pillar #852, Muradnagar)
  const currentDistanceKm = calculateDistanceKm(
    DELIVERY_CONFIG.CAFE_COORDINATES.lat,
    DELIVERY_CONFIG.CAFE_COORDINATES.lng,
    coords.lat,
    coords.lng
  );
  const isWithinDeliveryRadius =
    currentDistanceKm != null
      ? currentDistanceKm <= DELIVERY_CONFIG.MAX_DELIVERY_RADIUS_KM
      : true;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(28, 25, 23, 0.75)",
        backdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bistro-card"
        style={{
          width: "100%",
          maxWidth: 580,
          maxHeight: "92vh",
          backgroundColor: "#FFFFFF",
          borderRadius: 24,
          boxShadow: "0 24px 64px -12px rgba(28, 25, 23, 0.35)",
          border: "1px solid rgba(138, 87, 56, 0.2)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "modalFadeIn 0.22s ease-out"
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#FCFAF7"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                backgroundColor: "var(--color-bronze-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-bronze)"
              }}
            >
              <MapPin size={18} />
            </div>
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--color-ink)",
                  margin: 0
                }}
              >
                {initialAddress ? "Edit Delivery Address" : "Add Delivery Address"}
              </h2>
              <span style={{ fontSize: 11, color: "var(--color-ink-soft)" }}>
                Confirm precise pin on map for seamless food delivery
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--color-ink)"
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            padding: "20px 24px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 18
          }}
        >
          {/* Interactive Map Section */}
          <div
            style={{
              position: "relative",
              borderRadius: 16,
              overflow: "hidden",
              border: "1.5px solid rgba(138, 87, 56, 0.25)",
              boxShadow: "0 4px 16px rgba(74, 53, 39, 0.08)"
            }}
          >
            {/* Map Canvas / Draggable Viewport */}
            <div
              ref={mapContainerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                width: "100%",
                height: 190,
                backgroundColor: "#E5E3DF",
                backgroundImage: `url(${osmTileUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                cursor: isDraggingMap ? "grabbing" : "grab",
                position: "relative",
                userSelect: "none"
              }}
            >
              {/* Central Map Pin with Pulse Shadow */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -100%)",
                  pointerEvents: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center"
                }}
              >
                {/* Pin Tooltip Bubble */}
                <div
                  style={{
                    backgroundColor: "rgba(28, 25, 23, 0.92)",
                    color: "#FFFFFF",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    padding: "3px 8px",
                    borderRadius: "var(--radius-pill)",
                    whiteSpace: "nowrap",
                    marginBottom: 4,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
                  }}
                >
                  Order Delivered Here
                </div>
                {/* Visual Pin Icon */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50% 50% 50% 0",
                    transform: "rotate(-45deg)",
                    backgroundColor: "var(--color-bronze)",
                    border: "2px solid #FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 8px 16px rgba(138, 87, 56, 0.45)"
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: "#FFFFFF"
                    }}
                  />
                </div>
                {/* Pin Ground Shadow */}
                <div
                  style={{
                    width: 14,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "rgba(0,0,0,0.3)",
                    marginTop: 2,
                    filter: "blur(1px)"
                  }}
                />
              </div>

              {/* Top Hint Bar */}
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                  right: 60,
                  backgroundColor: "rgba(255, 255, 255, 0.94)",
                  backdropFilter: "blur(6px)",
                  padding: "6px 12px",
                  borderRadius: "var(--radius-pill)",
                  border: "1px solid rgba(138, 87, 56, 0.2)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--color-ink)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {isGeocoding ? (
                  <>
                    <Loader2 size={12} className="animate-spin" style={{ color: "var(--color-bronze)" }} />
                    <span style={{ color: "var(--color-bronze)" }}>Detecting address...</span>
                  </>
                ) : (
                  <>
                    <MapPin size={12} style={{ color: "var(--color-bronze)", flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                      {detectedAddress || "Drag map to position pin at your exact doorstep"}
                    </span>
                  </>
                )}
              </div>

              {/* Map Zoom Controls */}
              <div
                style={{
                  position: "absolute",
                  right: 10,
                  top: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4
                }}
              >
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(19, z + 1))}
                  title="Zoom in"
                  style={{
                    width: 28,
                    height: 28,
                    backgroundColor: "#FFFFFF",
                    border: "1px solid rgba(0,0,0,0.15)",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
                  }}
                >
                  <Plus size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(12, z - 1))}
                  title="Zoom out"
                  style={{
                    width: 28,
                    height: 28,
                    backgroundColor: "#FFFFFF",
                    border: "1px solid rgba(0,0,0,0.15)",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
                  }}
                >
                  <Minus size={14} />
                </button>
              </div>

              {/* Live Delivery Zone Status Pill (Bottom-Left) */}
              <div
                style={{
                  position: "absolute",
                  bottom: 10,
                  left: 10,
                  backgroundColor: isWithinDeliveryRadius
                    ? "rgba(240, 253, 244, 0.95)"
                    : "rgba(254, 242, 242, 0.95)",
                  color: isWithinDeliveryRadius ? "#15803D" : "#B91C1C",
                  border: isWithinDeliveryRadius
                    ? "1px solid rgba(34, 197, 94, 0.45)"
                    : "1px solid rgba(239, 68, 68, 0.45)",
                  borderRadius: "var(--radius-pill)",
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: "var(--font-serif)",
                  backdropFilter: "blur(6px)",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                  pointerEvents: "none",
                  maxWidth: "calc(100% - 130px)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                <span>{isWithinDeliveryRadius ? "✓" : "⚠️"}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  {currentDistanceKm != null ? `${currentDistanceKm} km` : ""}
                  {" • "}
                  {isWithinDeliveryRadius
                    ? "Within 2 km delivery zone"
                    : "Outside 2 km zone (Pickup only)"}
                </span>
              </div>

              {/* "Locate Me" Button Overlay */}
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isLocating}
                title="Detect current location"
                style={{
                  position: "absolute",
                  bottom: 10,
                  right: 10,
                  backgroundColor: "#FFFFFF",
                  color: "var(--color-bronze)",
                  border: "1px solid rgba(138, 87, 56, 0.3)",
                  borderRadius: "var(--radius-pill)",
                  padding: "6px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}
              >
                {isLocating ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Crosshair size={13} />
                )}
                <span>{isLocating ? "Locating..." : "Locate Me"}</span>
              </button>
            </div>

            {/* Drag instruction footer */}
            <div
              style={{
                backgroundColor: "#FAF6F0",
                padding: "6px 14px",
                fontSize: 11,
                color: "var(--color-ink-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "1px solid rgba(138, 87, 56, 0.12)"
              }}
            >
              <span>✋ Drag map or tap 'Locate Me' (Cafe origin: Pillar #852, Muradnagar)</span>
              <span style={{ fontSize: 11, color: isWithinDeliveryRadius ? "#16A34A" : "#DC2626", fontWeight: 700 }}>
                {currentDistanceKm != null ? `${currentDistanceKm} km away` : `${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E`}
              </span>
            </div>
          </div>

          {/* Location error notice if permission denied */}
          {locationError && (
            <div
              style={{
                padding: "10px 14px",
                backgroundColor: "#FEF2F2",
                border: "1px solid #FCA5A5",
                borderRadius: 10,
                color: "#991B1B",
                fontSize: 12,
                display: "flex",
                alignItems: "flex-start",
                gap: 8
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{locationError}</span>
            </div>
          )}

          {/* Address Type Selector Chips */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "var(--font-serif)",
                marginBottom: 8,
                color: "var(--color-ink)"
              }}
            >
              Save Address As:
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ADDRESS_TYPES.map((type) => {
                const isSelected = addressType === type.id;
                const IconComponent = type.icon;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setAddressType(type.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 14px",
                      borderRadius: "var(--radius-pill)",
                      border: isSelected
                        ? "1.5px solid var(--color-bronze)"
                        : "1px solid var(--border-color)",
                      backgroundColor: isSelected ? "var(--color-bronze-light)" : "#FFFFFF",
                      color: isSelected ? "var(--color-bronze-dark)" : "var(--color-ink)",
                      fontSize: 12,
                      fontFamily: "var(--font-serif)",
                      fontWeight: isSelected ? 700 : 500,
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <span>{type.emoji}</span>
                    <span>{type.label}</span>
                    {isSelected && <Check size={12} style={{ color: "var(--color-bronze-dark)" }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Fields Grid */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* House / Flat / Room / Floor No. */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "var(--font-serif)",
                  marginBottom: 6,
                  color: "var(--color-ink)"
                }}
              >
                Room / Flat / House / Floor No. *
              </label>
              <input
                type="text"
                placeholder="e.g. Room 304, Ganga Hostel OR Flat 4B, Shivalik Tower"
                value={roomNumber}
                onChange={(e) => {
                  setRoomNumber(e.target.value);
                  if (formErrors.roomNumber) {
                    setFormErrors((prev) => ({ ...prev, roomNumber: null }));
                  }
                }}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: 13,
                  borderRadius: "var(--radius-sm)",
                  border: `1px solid ${formErrors.roomNumber ? "#DC2626" : "var(--border-color)"}`,
                  backgroundColor: "var(--bg-app)",
                  outline: "none"
                }}
              />
              {formErrors.roomNumber && (
                <span style={{ color: "#DC2626", fontSize: 11, marginTop: 4, display: "block" }}>
                  {formErrors.roomNumber}
                </span>
              )}
            </div>

            {/* Street / Campus / Locality */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "var(--font-serif)",
                  marginBottom: 6,
                  color: "var(--color-ink)"
                }}
              >
                Area / Street / Campus Locality *
              </label>
              <textarea
                rows={2}
                placeholder="e.g. KIET Campus, Delhi-Meerut Road OR Shivam Vihar, Muradnagar"
                value={streetArea}
                onChange={(e) => {
                  setStreetArea(e.target.value);
                  if (formErrors.streetArea) {
                    setFormErrors((prev) => ({ ...prev, streetArea: null }));
                  }
                }}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: 13,
                  borderRadius: "var(--radius-sm)",
                  border: `1px solid ${formErrors.streetArea ? "#DC2626" : "var(--border-color)"}`,
                  backgroundColor: "var(--bg-app)",
                  outline: "none",
                  resize: "vertical"
                }}
              />
              {formErrors.streetArea && (
                <span style={{ color: "#DC2626", fontSize: 11, marginTop: 4, display: "block" }}>
                  {formErrors.streetArea}
                </span>
              )}
            </div>

            {/* Landmark */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "var(--font-serif)",
                  marginBottom: 6,
                  color: "var(--color-ink)"
                }}
              >
                Nearby Landmark (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Opposite Pillar 852, Near College Main Gate, Beside Bank ATM"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: 13,
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-app)",
                  outline: "none"
                }}
              />
            </div>

            {/* Recipient Name & Phone */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "var(--font-serif)",
                    marginBottom: 6,
                    color: "var(--color-ink)"
                  }}
                >
                  Contact Person *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aarav Sharma"
                  value={recipientName}
                  onChange={(e) => {
                    setRecipientName(e.target.value);
                    if (formErrors.recipientName) {
                      setFormErrors((prev) => ({ ...prev, recipientName: null }));
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontSize: 13,
                    borderRadius: "var(--radius-sm)",
                    border: `1px solid ${formErrors.recipientName ? "#DC2626" : "var(--border-color)"}`,
                    backgroundColor: "var(--bg-app)",
                    outline: "none"
                  }}
                />
                {formErrors.recipientName && (
                  <span style={{ color: "#DC2626", fontSize: 11, marginTop: 4, display: "block" }}>
                    {formErrors.recipientName}
                  </span>
                )}
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "var(--font-serif)",
                    marginBottom: 6,
                    color: "var(--color-ink)"
                  }}
                >
                  10-Digit Phone Number *
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, ""));
                    if (formErrors.phone) {
                      setFormErrors((prev) => ({ ...prev, phone: null }));
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontSize: 13,
                    borderRadius: "var(--radius-sm)",
                    border: `1px solid ${formErrors.phone ? "#DC2626" : "var(--border-color)"}`,
                    backgroundColor: "var(--bg-app)",
                    outline: "none"
                  }}
                />
                {formErrors.phone && (
                  <span style={{ color: "#DC2626", fontSize: 11, marginTop: 4, display: "block" }}>
                    {formErrors.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Set as Default Address Checkbox */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: "var(--color-ink)",
                cursor: "pointer",
                marginTop: 2
              }}
            >
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                style={{ accentColor: "var(--color-bronze)", width: 16, height: 16 }}
              />
              <span style={{ fontWeight: 600 }}>Save as primary / default delivery address</span>
            </label>

            {/* Out-of-zone friendly notice */}
            {!isWithinDeliveryRadius && (
              <div
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#FFFBEB",
                  border: "1px solid #FCD34D",
                  borderRadius: 8,
                  fontSize: 11.5,
                  color: "#92400E",
                  lineHeight: 1.4,
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <AlertCircle size={14} style={{ color: "#D97706", flexShrink: 0 }} />
                <span>
                  This location is <strong>{currentDistanceKm} km away</strong> (outside our 2 km delivery zone). You can still save this address and use it for <strong>Pickup / Takeaway</strong> orders!
                </span>
              </div>
            )}

            {/* Form Action Buttons */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 12,
                marginTop: 8,
                paddingTop: 14,
                borderTop: "1px solid var(--border-color)"
              }}
            >
              <button
                type="button"
                onClick={onClose}
                className="btn-pill-outline"
                style={{ padding: "10px 20px", fontSize: 12 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-pill-black"
                style={{ padding: "11px 24px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
              >
                <Check size={14} />
                <span>Save & Deliver Here</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
