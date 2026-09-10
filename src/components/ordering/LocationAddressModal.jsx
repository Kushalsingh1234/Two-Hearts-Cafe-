import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  MapPin,
  Home,
  Building,
  Briefcase,
  Compass,
  Check,
  AlertCircle,
  Loader2,
  Lock,
  ArrowLeft,
  ChevronRight,
  Edit2
} from "lucide-react";
import ZomatoMapPicker from "./ZomatoMapPicker";
import {
  lookupPincode,
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

  // Zomato Two-Step Flow: 'map' (pick location on interactive map) | 'details' (enter flat/house & contact)
  const [step, setStep] = useState(() => (initialAddress ? "details" : "map"));

  // Coordinates confirmed on map
  const [coords, setCoords] = useState(() => {
    if (initialCoords && initialCoords.lat && initialCoords.lng) {
      return { lat: Number(initialCoords.lat), lng: Number(initialCoords.lng) };
    }
    if (initialAddress?.coords && initialAddress.coords.lat && initialAddress.coords.lng) {
      return { lat: Number(initialAddress.coords.lat), lng: Number(initialAddress.coords.lng) };
    }
    return { lat: DEFAULT_CAFE_COORDS.lat, lng: DEFAULT_CAFE_COORDS.lng };
  });

  // Confirmed full address description from map picker
  const [confirmedFullAddress, setConfirmedFullAddress] = useState(
    initialAddress?.fullAddress || initialAddress?.address || "Pillar #852, Muradnagar"
  );

  // Form fields
  const [pincode, setPincode] = useState(() => {
    if (initialAddress?.pincode) return initialAddress.pincode;
    if (initialAddress?.address) {
      const match = initialAddress.address.match(/\b\d{6}\b/);
      if (match) return match[0];
    }
    return "201206";
  });

  // City is strictly locked and read-only. Auto-derived from PIN code or map reverse-geocode.
  const [city, setCity] = useState(initialAddress?.city || "Muradnagar");

  const [area, setArea] = useState(() => {
    if (initialAddress?.area) return initialAddress.area;
    if (initialAddress?.locality) return initialAddress.locality;
    return "";
  });

  const [street, setStreet] = useState(initialAddress?.street || "");
  const [roomNumber, setRoomNumber] = useState(initialAddress?.roomNumber || "");
  const [landmark, setLandmark] = useState(initialAddress?.landmark || "");
  const [recipientName, setRecipientName] = useState(
    initialAddress?.recipientName || customerUser?.name || ""
  );
  const [phone, setPhone] = useState(
    initialAddress?.phone || customerUser?.phone || ""
  );
  const [addressType, setAddressType] = useState(
    initialAddress?.label || initialAddress?.tag || "Hostel"
  );
  const [isDefault, setIsDefault] = useState(
    initialAddress ? Boolean(initialAddress.isDefault) : savedAddressesCount === 0
  );

  // Locality options list derived from PIN code lookup
  const [localityOptions, setLocalityOptions] = useState([]);
  const [pincodeDetails, setPincodeDetails] = useState(null);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");
  const [formErrors, setFormErrors] = useState({});

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

  // Fetch PIN code details via India Post API with instant fallback
  const fetchPincodeDetails = useCallback(async (pin, currentArea = area) => {
    if (!pin || pin.length !== 6) {
      setCity("");
      setPincodeDetails(null);
      setLocalityOptions([]);
      return;
    }
    setIsPincodeLoading(true);
    setPincodeError("");
    try {
      const res = await lookupPincode(pin);
      if (res.success) {
        setPincodeDetails(res);
        const resolvedCity = res.city || res.district || "";
        setCity(resolvedCity);

        const offices = (res.postOffices || []).map((po) => po.name).filter(Boolean);
        setLocalityOptions(offices);

        if (offices.length === 1 && !currentArea.trim()) {
          setArea(offices[0]);
        } else if (offices.length > 1 && !currentArea.trim()) {
          setArea(offices[0]);
        }
      } else {
        setPincodeError(res.error || "Could not verify PIN code.");
        setCity("");
        setLocalityOptions([]);
      }
    } catch (err) {
      console.warn("Pincode lookup error:", err);
      setPincodeError("Unable to verify PIN code right now. You can still enter your address.");
      setCity("");
      setLocalityOptions([]);
    } finally {
      setIsPincodeLoading(false);
    }
  }, [area]);

  // Initial load hook
  useEffect(() => {
    if (isOpen && pincode && pincode.length === 6) {
      fetchPincodeDetails(pincode, area);
    }
  }, [isOpen]);

  // Handler when user confirms location in Step 1 (Map Picker)
  const handleConfirmMapLocation = (data) => {
    if (data.coords) {
      setCoords(data.coords);
    }
    if (data.fullAddress) {
      setConfirmedFullAddress(data.fullAddress);
    }
    if (data.area) {
      setArea(data.area);
    }
    if (data.city) {
      setCity(data.city);
    }
    if (data.pincode && data.pincode.length === 6) {
      setPincode(data.pincode);
      fetchPincodeDetails(data.pincode, data.area);
    }
    if (data.street && !street) {
      setStreet(data.street);
    }

    // Advance to Step 2 (Doorstep Details)
    setStep("details");
  };

  // Handle PIN code typing in Step 2: when < 6 digits, immediately clear locked City
  const handlePincodeChange = (val) => {
    const clean = val.replace(/\D/g, "").slice(0, 6);
    setPincode(clean);
    if (formErrors.pincode) {
      setFormErrors((prev) => ({ ...prev, pincode: null }));
    }

    if (clean.length === 6) {
      fetchPincodeDetails(clean);
    } else {
      setCity("");
      setPincodeDetails(null);
      setPincodeError("");
      setLocalityOptions([]);
    }
  };

  // Handle selecting suggested locality from dropdown or quick-pick chip
  const handleSelectLocality = (loc) => {
    if (!loc) return;
    setArea(loc);
    if (formErrors.area) {
      setFormErrors((prev) => ({ ...prev, area: null }));
    }
  };

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    const cleanPin = pincode.replace(/\D/g, "");
    if (!cleanPin || cleanPin.length !== 6) {
      errors.pincode = "Please enter a valid 6-digit PIN code.";
    }
    if (!city.trim()) {
      errors.city = "City is required. Please enter a valid PIN code to auto-detect City.";
    }
    if (!area.trim()) {
      errors.area = "Please specify area or campus locality.";
    }
    if (!roomNumber.trim()) {
      errors.roomNumber = "Please enter your Room / Flat / House No.";
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

    // Clean structured full address assembly without duplicates or jammed text
    const addressParts = [
      roomNumber.trim(),
      street.trim(),
      area.trim(),
      city.trim(),
      cleanPin ? `PIN ${cleanPin}` : ""
    ].filter(Boolean);
    const fullCombined = addressParts.join(", ");

    const newAddressObj = {
      id: initialAddress?.id || `addr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: addressType,
      tag: addressType,
      roomNumber: roomNumber.trim(),
      street: street.trim(),
      area: area.trim(),
      city: city.trim(),
      pincode: cleanPin,
      landmark: landmark.trim(),
      address: fullCombined,
      fullAddress: fullCombined,
      recipientName: recipientName.trim(),
      phone: cleanPhone.slice(-10),
      isDefault: Boolean(isDefault),
      coords: coords,
      distanceKm: currentDistanceKm,
      isDeliverable: isWithinDeliveryRadius,
      isOutOfDeliveryZone: !isWithinDeliveryRadius,
      entryMethod: "zomato_map_picker"
    };

    onSaveAddress(newAddressObj);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(28, 25, 23, 0.78)",
        backdropFilter: "blur(8px)",
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
          maxWidth: step === "map" ? 640 : 580,
          maxHeight: "92vh",
          backgroundColor: "#FFFFFF",
          borderRadius: 24,
          boxShadow: "0 28px 68px -12px rgba(28, 25, 23, 0.4)",
          border: "1px solid rgba(138, 87, 56, 0.2)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "modalFadeIn 0.22s ease-out",
          transition: "max-width 0.25s ease"
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "16px 22px 14px 22px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#FCFAF7"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {step === "details" && (
              <button
                type="button"
                onClick={() => setStep("map")}
                title="Back to map location picker"
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
                  color: "var(--color-ink)",
                  marginRight: 2
                }}
              >
                <ArrowLeft size={16} />
              </button>
            )}

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
                {step === "map"
                  ? "Set Delivery Location"
                  : initialAddress
                  ? "Edit Delivery Address"
                  : "Complete Address Details"}
              </h2>
              <span style={{ fontSize: 11, color: "var(--color-ink-soft)" }}>
                {step === "map"
                  ? "Pan map under fixed pin for exact doorstep placement"
                  : "Enter flat / room number and contact details"}
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

        {/* Scrollable Modal Body */}
        <div
          style={{
            padding: "18px 22px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 16
          }}
        >
          {/* STEP 1: ZOMATO-STYLE MAP PICKER */}
          {step === "map" && (
            <ZomatoMapPicker
              initialCoords={coords}
              onConfirmLocation={handleConfirmMapLocation}
              onCancel={onClose}
            />
          )}

          {/* STEP 2: COMPLETE DOORSTEP & FLAT DETAILS */}
          {step === "details" && (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Confirmed Location Breadcrumb Bar (Zomato-Style with "Change" button) */}
              <div
                style={{
                  backgroundColor: "#FCFAF7",
                  borderRadius: 14,
                  padding: "12px 14px",
                  border: "1px solid rgba(138, 87, 56, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      backgroundColor: "var(--color-bronze-light)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--color-bronze)",
                      flexShrink: 0
                    }}
                  >
                    <MapPin size={15} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--color-ink)" }}>
                      {area || "Confirmed Location"}, {city}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--color-ink-soft)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                    >
                      {confirmedFullAddress}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep("map")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "5px 10px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid var(--border-color)",
                    color: "var(--color-bronze)",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.06)"
                  }}
                >
                  <Edit2 size={11} />
                  <span>Change on Map</span>
                </button>
              </div>

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

              {/* Row 1: PIN Code (Anchor) & City (Strictly Locked / Read-Only) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                {/* PIN Code (Anchor) */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: "var(--font-serif)",
                        color: "var(--color-ink)",
                        margin: 0
                      }}
                    >
                      PIN Code *
                    </label>
                    {isPincodeLoading && (
                      <span style={{ fontSize: 11, color: "var(--color-bronze)", display: "flex", alignItems: "center", gap: 4 }}>
                        <Loader2 size={11} className="animate-spin" />
                        <span>Verifying PIN...</span>
                      </span>
                    )}
                    {pincodeDetails && !isPincodeLoading && (
                      <span style={{ fontSize: 11, color: "#16A34A", fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                        <Check size={12} />
                        <span>Verified PIN</span>
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="e.g. 201206"
                    value={pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      fontSize: 13,
                      fontWeight: 600,
                      letterSpacing: "0.5px",
                      borderRadius: "var(--radius-sm)",
                      border: `1px solid ${formErrors.pincode || pincodeError ? "#DC2626" : pincodeDetails ? "#16A34A" : "var(--border-color)"}`,
                      backgroundColor: "var(--bg-app)",
                      outline: "none"
                    }}
                  />
                  {formErrors.pincode && (
                    <span style={{ color: "#DC2626", fontSize: 11, marginTop: 4, display: "block" }}>
                      {formErrors.pincode}
                    </span>
                  )}
                  {pincodeError && (
                    <span style={{ color: "#DC2626", fontSize: 11, marginTop: 4, display: "block" }}>
                      {pincodeError}
                    </span>
                  )}
                </div>

                {/* City / Town (STRICTLY LOCKED / READ-ONLY) */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: "var(--font-serif)",
                        color: "var(--color-ink)",
                        margin: 0
                      }}
                    >
                      City / Town *
                    </label>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 600,
                        color: "var(--color-ink-soft)",
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                        backgroundColor: "rgba(138, 87, 56, 0.08)",
                        padding: "2px 6px",
                        borderRadius: 4
                      }}
                      title="City is locked and automatically determined from your PIN code"
                    >
                      <Lock size={10} />
                      <span>Auto-filled</span>
                    </span>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      readOnly={true}
                      tabIndex={-1}
                      placeholder={
                        pincode.length === 6 && isPincodeLoading
                          ? "Fetching city..."
                          : !pincode || pincode.length < 6
                          ? "Enter PIN code first"
                          : "City"
                      }
                      value={city}
                      style={{
                        width: "100%",
                        padding: "10px 32px 10px 14px",
                        fontSize: 13,
                        fontWeight: 600,
                        borderRadius: "var(--radius-sm)",
                        border: `1px solid ${formErrors.city ? "#DC2626" : "var(--border-color)"}`,
                        backgroundColor: "#F6F4F0",
                        color: city ? "var(--color-ink)" : "#A8A29E",
                        cursor: "not-allowed",
                        outline: "none",
                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)"
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--color-ink-soft)",
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      <Lock size={14} style={{ opacity: 0.6 }} />
                    </div>
                  </div>
                  {formErrors.city ? (
                    <span style={{ color: "#DC2626", fontSize: 11, marginTop: 4, display: "block" }}>
                      {formErrors.city}
                    </span>
                  ) : (
                    <span style={{ fontSize: 10.5, color: "var(--color-ink-soft)", marginTop: 4, display: "block" }}>
                      🔒 Locked — automatically determined from 6-digit PIN code
                    </span>
                  )}
                </div>
              </div>

              {/* Row 2: Area / Locality (Editable + Dropdown & Quick-Pick Chips) */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "var(--font-serif)",
                      color: "var(--color-ink)",
                      margin: 0
                    }}
                  >
                    Area / Campus Locality *
                  </label>
                  {localityOptions.length > 1 && (
                    <span style={{ fontSize: 11, color: "var(--color-ink-soft)" }}>
                      {localityOptions.length} postal localities found
                    </span>
                  )}
                </div>

                {localityOptions.length > 1 && (
                  <div style={{ marginBottom: 8 }}>
                    <select
                      value={localityOptions.includes(area) ? area : ""}
                      onChange={(e) => handleSelectLocality(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #BBF7D0",
                        backgroundColor: "#F0FDF4",
                        color: "#166534",
                        fontSize: 12,
                        fontWeight: 600,
                        outline: "none",
                        cursor: "pointer"
                      }}
                    >
                      <option value="">-- Choose suggested locality from PIN {pincode} --</option>
                      {localityOptions.map((loc, idx) => (
                        <option key={idx} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <input
                  type="text"
                  placeholder="e.g. Shivam Vihar, KIET Campus, Duhai"
                  value={area}
                  onChange={(e) => {
                    setArea(e.target.value);
                    if (formErrors.area) {
                      setFormErrors((prev) => ({ ...prev, area: null }));
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontSize: 13,
                    borderRadius: "var(--radius-sm)",
                    border: `1px solid ${formErrors.area ? "#DC2626" : "var(--border-color)"}`,
                    backgroundColor: "var(--bg-app)",
                    outline: "none"
                  }}
                />
                {formErrors.area && (
                  <span style={{ color: "#DC2626", fontSize: 11, marginTop: 4, display: "block" }}>
                    {formErrors.area}
                  </span>
                )}

                {/* Quick-Pick Chips */}
                {localityOptions.length > 0 && (
                  <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "var(--color-ink-soft)", marginRight: 2 }}>
                      Quick pick:
                    </span>
                    {localityOptions.slice(0, 6).map((loc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectLocality(loc)}
                        style={{
                          padding: "3px 8px",
                          borderRadius: "var(--radius-pill)",
                          backgroundColor: area === loc ? "var(--color-ink)" : "#F5F2EB",
                          color: area === loc ? "#FFFFFF" : "var(--color-ink)",
                          border: "1px solid var(--border-color)",
                          fontSize: 11,
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 3: Street / Detailed Directions (Optional) */}
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
                  Street / Detailed Directions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Delhi-Meerut Road, Near Water Tank, Hostel Lane 4"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
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

              {/* Row 4: Room / Flat / House / Floor No. * */}
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

              {/* Row 5: Nearby Landmark (Optional) */}
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

              {/* Row 6: Recipient Name & 10-Digit Phone */}
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

              {/* Real-time 2 KM Delivery Zone Status Badge */}
              {currentDistanceKm != null && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    backgroundColor: isWithinDeliveryRadius ? "rgba(240, 253, 244, 0.95)" : "rgba(254, 242, 242, 0.95)",
                    border: isWithinDeliveryRadius ? "1px solid rgba(34, 197, 94, 0.45)" : "1px solid rgba(239, 68, 68, 0.45)",
                    color: isWithinDeliveryRadius ? "#15803D" : "#B91C1C",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 6
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{isWithinDeliveryRadius ? "✓" : "⚠️"}</span>
                    <span style={{ fontWeight: 700 }}>
                      {isWithinDeliveryRadius
                        ? `Within 2 km delivery zone (${currentDistanceKm} km from cafe at Pillar #852)`
                        : `Outside 2 km delivery zone (${currentDistanceKm} km from cafe)`}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, fontStyle: "italic" }}>
                    {isWithinDeliveryRadius ? "Eligible for Doorstep Delivery" : "Available for Pickup orders"}
                  </span>
                </div>
              )}

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
                  justifyContent: "space-between",
                  gap: 12,
                  marginTop: 8,
                  paddingTop: 14,
                  borderTop: "1px solid var(--border-color)"
                }}
              >
                <button
                  type="button"
                  onClick={() => setStep("map")}
                  className="btn-pill-outline"
                  style={{ padding: "10px 18px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
                >
                  <ArrowLeft size={14} />
                  <span>Back to Map</span>
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-pill-outline"
                    style={{ padding: "10px 18px", fontSize: 12 }}
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
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
