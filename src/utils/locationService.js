/**
 * locationService.js
 * Geolocation & Reverse Geocoding Utility for Two Hearts Café
 * 
 * Supports:
 * - Browser Geolocation API
 * - Google Maps Geocoding API (when VITE_GOOGLE_MAPS_API_KEY is configured)
 * - OpenStreetMap Nominatim Reverse Geocoding as a free, reliable, instant fallback
 * - Smart campus/local address extraction for Muradnagar, Ghaziabad & Delhi NCR
 */

const GOOGLE_MAPS_API_KEY = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || "";

// Default fallback coordinates: Two Hearts Café, Pillar #852, Muradnagar (KIET Campus vicinity)
export const DEFAULT_CAFE_COORDS = {
  lat: 28.7758,
  lng: 77.5026,
  areaName: "Near Pillar 852, Delhi-Meerut Road, Muradnagar, Ghaziabad"
};

/**
 * Get current browser coordinates via Geolocation API
 * @returns {Promise<{lat: number, lng: number, accuracy: number}>}
 */
export async function getCurrentCoordinates() {
  if (!navigator.geolocation) {
    throw new Error("Geolocation is not supported by your browser.");
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let message = "Unable to retrieve your location.";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location access was denied. Please enable location permissions or enter your address manually.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Location information is currently unavailable. Please enter your address manually.";
        } else if (error.code === error.TIMEOUT) {
          message = "Request to get user location timed out. Please try again or type your address.";
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000
      }
    );
  });
}

/**
 * Reverse geocode coordinates to a structured address
 * @param {number} lat 
 * @param {number} lng 
 * @returns {Promise<{
 *   fullAddress: string,
 *   street: string,
 *   area: string,
 *   landmark: string,
 *   city: string,
 *   state: string,
 *   postalCode: string,
 *   formattedAddress: string
 * }>}
 */
export async function reverseGeocode(lat, lng) {
  // 1. Try Google Maps Geocoding API if key is present and not placeholder
  if (GOOGLE_MAPS_API_KEY && !GOOGLE_MAPS_API_KEY.includes("YOUR_") && !GOOGLE_MAPS_API_KEY.includes("PLACEHOLDER")) {
    try {
      const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(gUrl);
      const data = await res.json();
      if (data.status === "OK" && data.results && data.results.length > 0) {
        const result = data.results[0];
        let street = "";
        let area = "";
        let city = "";
        let state = "";
        let postalCode = "";

        result.address_components.forEach((comp) => {
          if (comp.types.includes("route") || comp.types.includes("street_number")) {
            street += (street ? " " : "") + comp.long_name;
          }
          if (comp.types.includes("sublocality") || comp.types.includes("neighborhood")) {
            area = comp.long_name;
          }
          if (comp.types.includes("locality")) {
            city = comp.long_name;
          }
          if (comp.types.includes("administrative_area_level_1")) {
            state = comp.long_name;
          }
          if (comp.types.includes("postal_code")) {
            postalCode = comp.long_name;
          }
        });

        return {
          fullAddress: result.formatted_address,
          street: street || area,
          area: area || city,
          landmark: "",
          city: city || "Muradnagar",
          state: state || "Uttar Pradesh",
          postalCode,
          formattedAddress: result.formatted_address
        };
      }
    } catch (err) {
      console.warn("Google Maps Geocoding failed, falling back to Nominatim:", err);
    }
  }

  // 2. High-precision OpenStreetMap Nominatim Reverse Geocoding (Free, instant, accurate in India)
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
    const res = await fetch(nomUrl, {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "TwoHeartsCafeWeb/1.0"
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const a = data.address;
        const street = a.road || a.pedestrian || a.suburb || a.neighbourhood || "";
        const area = a.suburb || a.neighbourhood || a.village || a.city_district || "";
        const city = a.city || a.town || a.village || a.county || "Muradnagar";
        const state = a.state || "Uttar Pradesh";
        const postalCode = a.postcode || "";

        // Build human-readable formatted address
        const parts = [street, area, city, postalCode].filter(Boolean);
        const formatted = parts.length > 0 ? parts.join(", ") : data.display_name;

        return {
          fullAddress: formatted || data.display_name,
          street: street || area,
          area: area || city,
          landmark: a.amenity || a.building || "",
          city,
          state,
          postalCode,
          formattedAddress: formatted || data.display_name
        };
      }
    }
  } catch (err) {
    console.warn("Nominatim Geocoding error:", err);
  }

  // 3. Fallback: Localized coordinate label
  return {
    fullAddress: `Location at ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E (Near Muradnagar)`,
    street: "Local Area",
    area: "Muradnagar",
    landmark: "Near Pillar 852",
    city: "Muradnagar",
    state: "Uttar Pradesh",
    postalCode: "",
    formattedAddress: `Near Muradnagar (${lat.toFixed(4)}, ${lng.toFixed(4)})`
  };
}
