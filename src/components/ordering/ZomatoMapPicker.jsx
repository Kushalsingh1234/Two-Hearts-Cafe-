import React, { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Search,
  X,
  Crosshair,
  MapPin,
  Check,
  AlertCircle,
  Loader2,
  Plus,
  Minus,
  Navigation,
  RotateCcw
} from "lucide-react";
import {
  loadGoogleMapsApi,
  reverseGeocode,
  searchPlaces,
  DEFAULT_CAFE_COORDS
} from "../../utils/locationService";
import {
  DELIVERY_CONFIG,
  calculateDistanceKm
} from "../../config/deliveryConfig";

export default function ZomatoMapPicker({
  initialCoords = null,
  onConfirmLocation,
  onCancel,
  isConfirming = false
}) {
  // Center coordinates of the map
  const [centerCoords, setCenterCoords] = useState(() => {
    if (initialCoords && initialCoords.lat && initialCoords.lng) {
      return { lat: Number(initialCoords.lat), lng: Number(initialCoords.lng) };
    }
    return { lat: DEFAULT_CAFE_COORDS.lat, lng: DEFAULT_CAFE_COORDS.lng };
  });

  // Zoom level (default 17 for street/doorstep level accuracy)
  const [zoom, setZoom] = useState(17);

  // Dragging / panning state for fixed pin micro-interaction (lift & drop)
  const [isPanning, setIsPanning] = useState(false);

  // Address detection state
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState({
    fullAddress: "Locating address...",
    area: "Muradnagar",
    city: "Muradnagar",
    pincode: "201206",
    street: "",
    landmark: ""
  });

  // Search input state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Location GPS button state
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [gpsErrorCode, setGpsErrorCode] = useState(null);
  const [accuracyMeters, setAccuracyMeters] = useState(null);

  // Map DOM & Engine references
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const engineRef = useRef(null); // "google" | "leaflet"
  const debounceTimerRef = useRef(null);
  const isProgrammaticMoveRef = useRef(false);

  // Calculate distance from cafe origin (Pillar #852, Muradnagar)
  const currentDistanceKm = calculateDistanceKm(
    DELIVERY_CONFIG.CAFE_COORDINATES.lat,
    DELIVERY_CONFIG.CAFE_COORDINATES.lng,
    centerCoords.lat,
    centerCoords.lng
  );
  const isWithinDeliveryRadius =
    currentDistanceKm != null
      ? currentDistanceKm <= DELIVERY_CONFIG.MAX_DELIVERY_RADIUS_KM
      : true;

  // Reverse geocode the center coordinates
  const runReverseGeocode = useCallback(async (lat, lng) => {
    setIsGeocoding(true);
    try {
      const geo = await reverseGeocode(lat, lng);
      if (geo) {
        setDetectedLocation({
          fullAddress: geo.formattedAddress || geo.fullAddress,
          area: geo.area || geo.city || "Muradnagar",
          city: geo.city || "Muradnagar",
          pincode: geo.postalCode || "201206",
          street: geo.street || "",
          landmark: geo.landmark || ""
        });
      }
    } catch (err) {
      console.warn("ZomatoMapPicker reverse geocode error:", err);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Handle map center changes with debounced reverse geocoding
  const handleCenterChanged = useCallback(
    (newLat, newLng) => {
      const lat = Number(newLat);
      const lng = Number(newLng);
      setCenterCoords({ lat, lng });

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        runReverseGeocode(lat, lng);
      }, 280);
    },
    [runReverseGeocode]
  );

  // Smoothly pan map to given coordinates (re-centering map under fixed center pin)
  const panMapToLocation = useCallback((lat, lng, targetZoom = 17) => {
    const numLat = Number(lat);
    const numLng = Number(lng);
    setCenterCoords({ lat: numLat, lng: numLng });
    isProgrammaticMoveRef.current = true;

    if (mapInstanceRef.current) {
      if (engineRef.current === "google") {
        mapInstanceRef.current.panTo({ lat: numLat, lng: numLng });
        if (targetZoom) mapInstanceRef.current.setZoom(targetZoom);
        setTimeout(() => {
          isProgrammaticMoveRef.current = false;
        }, 600);
      } else if (engineRef.current === "leaflet") {
        mapInstanceRef.current.flyTo([numLat, numLng], targetZoom, {
          duration: 0.8
        });
        setTimeout(() => {
          isProgrammaticMoveRef.current = false;
        }, 950);
      }
    }
    // Directly run reverse geocode on exact coordinates without debounce lag
    runReverseGeocode(numLat, numLng);
  }, [runReverseGeocode]);

  // Synchronize map when initialCoords prop updates
  useEffect(() => {
    if (initialCoords && initialCoords.lat && initialCoords.lng) {
      const numLat = Number(initialCoords.lat);
      const numLng = Number(initialCoords.lng);
      setCenterCoords({ lat: numLat, lng: numLng });
      panMapToLocation(numLat, numLng, 17);
    }
  }, [initialCoords, panMapToLocation]);

  // Initialize Map (Google Maps if SDK loaded, otherwise Leaflet with OSM)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    let isCancelled = false;

    async function initMapEngine() {
      // 1. Try Google Maps JS SDK
      try {
        const googleMaps = await loadGoogleMapsApi();
        if (!isCancelled && googleMaps && mapContainerRef.current) {
          engineRef.current = "google";
          const map = new googleMaps.Map(mapContainerRef.current, {
            center: { lat: centerCoords.lat, lng: centerCoords.lng },
            zoom: 17,
            disableDefaultUI: true,
            gestureHandling: "greedy",
            clickableIcons: false
          });
          mapInstanceRef.current = map;

          map.addListener("dragstart", () => {
            if (!isProgrammaticMoveRef.current) {
              setIsPanning(true);
            }
          });
          map.addListener("idle", () => {
            setIsPanning(false);
            if (isProgrammaticMoveRef.current) return;
            const c = map.getCenter();
            if (c) {
              setAccuracyMeters(null); // User manually repositioned the pin
              handleCenterChanged(c.lat(), c.lng());
            }
          });

          // Initial geocode
          runReverseGeocode(centerCoords.lat, centerCoords.lng);
          return;
        }
      } catch (gErr) {
        console.warn("Google Maps init failed, using Leaflet fallback:", gErr);
      }

      // 2. Leaflet Fallback (Rock solid, instant, free, zero key required)
      if (!isCancelled && mapContainerRef.current) {
        engineRef.current = "leaflet";
        // Clean any existing container
        if (mapInstanceRef.current && mapInstanceRef.current.remove) {
          mapInstanceRef.current.remove();
        }

        const map = L.map(mapContainerRef.current, {
          center: [centerCoords.lat, centerCoords.lng],
          zoom: 17,
          zoomControl: false,
          attributionControl: false
        });
        mapInstanceRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19
        }).addTo(map);

        map.on("movestart", () => {
          if (!isProgrammaticMoveRef.current) {
            setIsPanning(true);
          }
        });
        map.on("moveend", () => {
          setIsPanning(false);
          if (isProgrammaticMoveRef.current) return;
          const c = map.getCenter();
          if (c) {
            setAccuracyMeters(null); // User manually repositioned the pin
            handleCenterChanged(c.lat, c.lng);
          }
        });

        // Trigger map invalidateSize after layout renders
        setTimeout(() => {
          if (map) map.invalidateSize();
        }, 150);

        // Initial geocode
        runReverseGeocode(centerCoords.lat, centerCoords.lng);
      }
    }

    initMapEngine();

    return () => {
      isCancelled = true;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (mapInstanceRef.current && engineRef.current === "leaflet" && mapInstanceRef.current.remove) {
        try {
          mapInstanceRef.current.remove();
        } catch (_) {}
      }
    };
  }, []);

  // Zoom in / Zoom out handlers
  const handleZoomIn = () => {
    const nextZ = Math.min(19, zoom + 1);
    setZoom(nextZ);
    if (mapInstanceRef.current) {
      if (engineRef.current === "google") mapInstanceRef.current.setZoom(nextZ);
      else if (engineRef.current === "leaflet") mapInstanceRef.current.setZoom(nextZ);
    }
  };

  const handleZoomOut = () => {
    const nextZ = Math.max(12, zoom - 1);
    setZoom(nextZ);
    if (mapInstanceRef.current) {
      if (engineRef.current === "google") mapInstanceRef.current.setZoom(nextZ);
      else if (engineRef.current === "leaflet") mapInstanceRef.current.setZoom(nextZ);
    }
  };

  // "Use Current Location" (Zomato-precision GPS fix with maximumAge: 0 & high accuracy)
  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    setGpsError("");
    setGpsErrorCode(null);

    if (!navigator.geolocation) {
      setIsLocating(false);
      setGpsError("Geolocation is not supported by your browser or device.");
      setGpsErrorCode(2);
      return;
    }

    // High accuracy GPS options - strictly maximumAge: 0 to force fresh satellite fix without stale cache
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude, accuracy } = pos.coords;
        if (accuracy) {
          setAccuracyMeters(Math.round(accuracy));
        } else {
          setAccuracyMeters(null);
        }
        setGpsError("");
        setGpsErrorCode(null);

        // Smoothly animate map and reverse-geocode exact GPS coordinates
        panMapToLocation(latitude, longitude, 17);
      },
      (err) => {
        setIsLocating(false);
        setGpsErrorCode(err.code);
        let msg = "Could not detect your current location.";
        if (err.code === 1) { // PERMISSION_DENIED
          msg = "Location permission was denied. Tap the 🔒 lock icon in your browser's address bar to allow location access, then tap Retry.";
        } else if (err.code === 3) { // TIMEOUT
          msg = "GPS signal request timed out. We couldn't acquire a satellite fix. Tap Retry or drag the map to position the pin.";
        } else if (err.code === 2) { // POSITION_UNAVAILABLE
          msg = "Location signal is currently unavailable. Please verify GPS / Location is enabled on your device, or drag the map.";
        }
        setGpsError(msg);
      },
      geoOptions
    );
  };

  // Search places handler
  const handleSearchChange = async (val) => {
    setSearchQuery(val);
    if (val.trim().length >= 2) {
      setIsSearching(true);
      setShowSearchResults(true);
      try {
        const results = await searchPlaces(val);
        setSearchResults(results);
      } catch (err) {
        console.warn("Search places failed:", err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    setSearchQuery(result.title);
    setShowSearchResults(false);
    panMapToLocation(result.lat, result.lng, 17);
  };

  const handleConfirm = () => {
    if (!onConfirmLocation) return;
    onConfirmLocation({
      coords: centerCoords,
      fullAddress: detectedLocation.fullAddress,
      area: detectedLocation.area,
      city: detectedLocation.city,
      pincode: detectedLocation.pincode,
      street: detectedLocation.street,
      landmark: detectedLocation.landmark,
      distanceKm: currentDistanceKm,
      isDeliverable: isWithinDeliveryRadius
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* GPS Error Alert with Actionable Guidance & Retry */}
      {gpsError && (
        <div
          style={{
            padding: "10px 14px",
            backgroundColor: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: 12,
            color: "#991B1B",
            fontSize: 12,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 10
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flex: 1 }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1, color: "#DC2626" }} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>
                {gpsErrorCode === 1
                  ? "Location Permission Blocked"
                  : gpsErrorCode === 3
                  ? "GPS Signal Timed Out"
                  : "Location Detection Failed"}
              </div>
              <div style={{ lineHeight: 1.4, color: "#7F1D1D" }}>{gpsError}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            style={{
              flexShrink: 0,
              padding: "6px 12px",
              backgroundColor: "#DC2626",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "var(--radius-pill)",
              fontSize: 11.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              boxShadow: "0 2px 6px rgba(220, 38, 38, 0.3)"
            }}
          >
            <RotateCcw size={12} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Main Interactive Map Canvas Container with Fixed Pin */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 350,
          borderRadius: 20,
          overflow: "hidden",
          border: "1.5px solid rgba(138, 87, 56, 0.25)",
          boxShadow: "0 8px 24px rgba(74, 53, 39, 0.12)",
          backgroundColor: "#E5E3DF"
        }}
      >
        {/* Floating Locating Radar / Indicator on Map */}
        {isLocating && (
          <div
            style={{
              position: "absolute",
              top: 58,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 560,
              backgroundColor: "rgba(28, 25, 23, 0.94)",
              color: "#FFFFFF",
              padding: "7px 16px",
              borderRadius: "var(--radius-pill)",
              fontSize: 12,
              fontWeight: 600,
              boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              whiteSpace: "nowrap"
            }}
          >
            <Loader2 size={14} className="animate-spin" style={{ color: "#F59E0B" }} />
            <span>Finding your exact GPS location...</span>
          </div>
        )}

        {/* The Moving Map Canvas */}
        <div
          ref={mapContainerRef}
          style={{
            width: "100%",
            height: "100%",
            zIndex: 1
          }}
        />

        {/* 1. TOP FLOATING SEARCH BAR */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            right: 12,
            zIndex: 550
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#FFFFFF",
              borderRadius: "var(--radius-pill)",
              padding: "7px 14px",
              boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
              border: "1px solid rgba(138, 87, 56, 0.2)"
            }}
          >
            <Search size={15} style={{ color: "var(--color-bronze)", marginRight: 8, flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search area, campus (KIET), landmark, road..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowSearchResults(true);
              }}
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                fontSize: 12.5,
                fontWeight: 500,
                color: "var(--color-ink)",
                backgroundColor: "transparent"
              }}
            />
            {isSearching && <Loader2 size={14} className="animate-spin" style={{ color: "var(--color-bronze)", marginLeft: 6 }} />}
            {searchQuery && !isSearching && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setShowSearchResults(false);
                }}
                style={{
                  border: "none",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  color: "var(--color-ink-soft)",
                  padding: 2
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Search Results Dropdown List */}
          {showSearchResults && searchResults.length > 0 && (
            <div
              style={{
                marginTop: 6,
                backgroundColor: "#FFFFFF",
                borderRadius: 14,
                boxShadow: "0 12px 32px rgba(0,0,0,0.22)",
                border: "1px solid rgba(138, 87, 56, 0.2)",
                maxHeight: 200,
                overflowY: "auto",
                zIndex: 600
              }}
            >
              {searchResults.map((res, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectSearchResult(res)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    textAlign: "left",
                    border: "none",
                    borderBottom: index < searchResults.length - 1 ? "1px solid #F3EFEA" : "none",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    transition: "background 0.15s ease"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAF7F2")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <MapPin size={15} style={{ color: "var(--color-bronze)", flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--color-ink)" }}>
                      {res.title}
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
                      {res.subtitle}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. FIXED CENTER PIN (Zomato-Style Fixed Overlay) */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: isPanning
              ? "translate(-50%, -116%) scale(1.08)"
              : "translate(-50%, -100%) scale(1.0)",
            pointerEvents: "none",
            zIndex: 500,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transition: "transform 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
          }}
        >
          {/* Tooltip speech bubble */}
          <div
            style={{
              backgroundColor: "rgba(28, 25, 23, 0.94)",
              color: "#FFFFFF",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.5px",
              padding: "4px 9px",
              borderRadius: "var(--radius-pill)",
              whiteSpace: "nowrap",
              marginBottom: 4,
              boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
          >
            <span>Order delivered here</span>
          </div>

          {/* Red/Bronze Teardrop Pin Marker */}
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50% 50% 50% 0",
              transform: "rotate(-45deg)",
              backgroundColor: "#DC2626", // Zomato signature red for high visibility
              border: "2.5px solid #FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: isPanning
                ? "0 16px 28px rgba(220, 38, 38, 0.55)"
                : "0 8px 18px rgba(220, 38, 38, 0.45)"
            }}
          >
            <div
              style={{
                width: 13,
                height: 13,
                borderRadius: "50%",
                backgroundColor: "#FFFFFF"
              }}
            />
          </div>

          {/* Ground Pulse Shadow (shrinks when pin is lifted) */}
          <div
            style={{
              width: isPanning ? 10 : 16,
              height: isPanning ? 4 : 7,
              borderRadius: "50%",
              backgroundColor: "rgba(0,0,0,0.35)",
              marginTop: isPanning ? 6 : 2,
              filter: "blur(1.5px)",
              opacity: isPanning ? 0.35 : 0.75,
              transition: "all 0.18s ease"
            }}
          />
        </div>

        {/* 3. ZOOM CONTROLS (+ / -) */}
        <div
          style={{
            position: "absolute",
            right: 12,
            top: 70,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            zIndex: 500
          }}
        >
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom in"
            style={{
              width: 32,
              height: 32,
              backgroundColor: "#FFFFFF",
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
              color: "var(--color-ink)"
            }}
          >
            <Plus size={15} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom out"
            style={{
              width: 32,
              height: 32,
              backgroundColor: "#FFFFFF",
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
              color: "var(--color-ink)"
            }}
          >
            <Minus size={15} />
          </button>
        </div>

        {/* 4. "USE CURRENT LOCATION" (LOCATE ME TARGET BUTTON) */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          title="Center on my current location"
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            zIndex: 500,
            backgroundColor: "#FFFFFF",
            color: "var(--color-bronze)",
            border: "1.5px solid rgba(138, 87, 56, 0.3)",
            borderRadius: "var(--radius-pill)",
            padding: "8px 14px",
            fontSize: 11.5,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            boxShadow: "0 6px 18px rgba(0,0,0,0.2)"
          }}
        >
          {isLocating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Crosshair size={15} style={{ color: "#DC2626" }} />
          )}
          <span>{isLocating ? "Locating..." : "Use Current Location"}</span>
        </button>

        {/* Instruction Banner at Map Bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            zIndex: 500,
            backgroundColor: "rgba(28, 25, 23, 0.88)",
            color: "#FAF7F2",
            backdropFilter: "blur(4px)",
            padding: "4px 10px",
            borderRadius: "var(--radius-pill)",
            fontSize: 10.5,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 4,
            pointerEvents: "none"
          }}
        >
          <span>✋ Pan map to position pin</span>
        </div>
      </div>

      {/* 5. BOTTOM CONFIRMATION CARD (Zomato Style) */}
      <div
        style={{
          backgroundColor: "#FCFAF7",
          borderRadius: 18,
          border: "1px solid rgba(138, 87, 56, 0.25)",
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          boxShadow: "0 4px 14px rgba(74, 53, 39, 0.06)"
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "var(--color-bronze-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-bronze)",
              flexShrink: 0
            }}
          >
            <MapPin size={18} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
              <span
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--color-ink)"
                }}
              >
                {isGeocoding ? "Detecting location..." : detectedLocation.area}
              </span>
              {detectedLocation.pincode && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: "#F3EFEA",
                    color: "var(--color-ink)",
                    border: "1px solid var(--border-color)"
                  }}
                >
                  PIN {detectedLocation.pincode}
                </span>
              )}
              {accuracyMeters != null && (
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: accuracyMeters <= 30 ? "#DCFCE7" : "#FEF3C7",
                    color: accuracyMeters <= 30 ? "#15803D" : "#B45309",
                    border: `1px solid ${accuracyMeters <= 30 ? "#86EFAC" : "#FDE68A"}`,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3
                  }}
                  title={`GPS fix accurate within ${accuracyMeters} meters`}
                >
                  <Navigation size={10} style={{ transform: "rotate(45deg)" }} />
                  <span>GPS ±{accuracyMeters}m</span>
                </span>
              )}
            </div>

            <p
              style={{
                fontSize: 12,
                color: "var(--color-ink-soft)",
                margin: 0,
                lineHeight: 1.4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical"
              }}
            >
              {isGeocoding ? (
                <span style={{ color: "var(--color-bronze)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Loader2 size={12} className="animate-spin" />
                  <span>Reading street & postal details...</span>
                </span>
              ) : (
                detectedLocation.fullAddress
              )}
            </p>
          </div>
        </div>

        {/* Real-time 2 KM Delivery Zone Status Badge */}
        {currentDistanceKm != null && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              backgroundColor: isWithinDeliveryRadius
                ? "rgba(240, 253, 244, 0.95)"
                : "rgba(254, 242, 242, 0.95)",
              border: isWithinDeliveryRadius
                ? "1px solid rgba(34, 197, 94, 0.45)"
                : "1px solid rgba(239, 68, 68, 0.45)",
              color: isWithinDeliveryRadius ? "#15803D" : "#B91C1C",
              fontSize: 11.5,
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

        {/* Action Buttons (Cancel / Confirm Location & Enter Details) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 4
          }}
        >
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-pill-outline"
              style={{ padding: "10px 18px", fontSize: 12 }}
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isGeocoding || isConfirming}
            className="btn-pill-black"
            style={{
              flex: 1,
              maxWidth: 320,
              padding: "12px 20px",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6
            }}
          >
            {isConfirming ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Confirming...</span>
              </>
            ) : (
              <>
                <span>Confirm Location & Enter Details</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
