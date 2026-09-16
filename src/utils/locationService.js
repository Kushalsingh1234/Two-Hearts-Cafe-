/**
 * locationService.js
 * Geolocation, Reverse Geocoding & Autocomplete Engine for Two Hearts Café
 *
 * Stack:
 * - Map Rendering: Google Maps JavaScript API (via googleMapsLoader.js)
 * - Reverse Geocoding: Google Maps Geocoding API (primary)
 * - Autocomplete Search: Google Places Autocomplete with session tokens
 * - PIN Code Lookup: India Post API + local dictionary (no map API needed)
 * - Geolocation: HTML5 Geolocation API with high-accuracy GPS fix
 */

import { getGoogleMaps, CAFE_LAT, CAFE_LNG } from "./googleMapsLoader.js";
import {
  DELIVERY_CONFIG,
  calculateDistanceKm,
  DEFAULT_CAFE_COORDS
} from "../config/deliveryConfig.js";

export { DELIVERY_CONFIG, calculateDistanceKm, DEFAULT_CAFE_COORDS };

// Client-Side In-Memory Session Caches (Eliminates redundant network requests)
const REVERSE_CACHE = new Map();
const SEARCH_CACHE = new Map();
const PINCODE_CACHE = new Map();

// Active Places session token for billing-efficient autocomplete
let _sessionToken = null;
let _placesService = null; // google.maps.places.AutocompleteService instance

/**
 * Get current browser coordinates via Geolocation API
 * Enforces enableHighAccuracy: true, timeout: 10000ms, maximumAge: 0 (fresh satellite fix)
 * @returns {Promise<{lat: number, lng: number, accuracy: number}>}
 */
export async function getCurrentCoordinates() {
  if (typeof window === "undefined" || !navigator.geolocation) {
    throw new Error("Geolocation is not supported by your browser.");
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy || 10
        });
      },
      (error) => {
        let message = "Could not retrieve your location.";
        if (error.code === error.PERMISSION_DENIED) {
          message =
            "Location permission was denied. Tap the 🔒 lock icon in your browser's address bar to allow location access, then tap Retry.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message =
            "Location signal is currently unavailable. Please verify GPS / Location is turned on.";
        } else if (error.code === error.TIMEOUT) {
          message =
            "GPS request timed out while acquiring a satellite fix. Please tap Retry or drag the map.";
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

// String normalizer to strip accents and clean input (e.g. Café → cafe)
export function normalizeSearchText(str) {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Reverse geocode coordinates to a structured Indian delivery address
 * Primary: Google Maps Geocoding API
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
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (isNaN(numLat) || isNaN(numLng)) return null;

  // Cache key rounded to 4 decimal places (~11 meters resolution)
  const cacheKey = `${numLat.toFixed(4)},${numLng.toFixed(4)}`;
  if (REVERSE_CACHE.has(cacheKey)) {
    return REVERSE_CACHE.get(cacheKey);
  }

  // 1. Proximity check for exact cafe or landmark match (~45 meters)
  for (const lm of LOCAL_LANDMARKS) {
    const d = calculateDistanceKm(lm.lat, lm.lng, numLat, numLng);
    if (d != null && d <= 0.045) {
      const matchResult = {
        fullAddress: `${lm.name}, ${lm.area}, ${lm.city}, PIN ${lm.pincode}`,
        street: lm.area,
        area: lm.name,
        landmark: lm.name,
        city: lm.city,
        state: "Uttar Pradesh",
        postalCode: lm.pincode,
        formattedAddress: `${lm.name}, ${lm.area}, ${lm.city}, PIN ${lm.pincode}`
      };
      REVERSE_CACHE.set(cacheKey, matchResult);
      return matchResult;
    }
  }

  // 2. Google Maps Geocoding API
  try {
    const maps = await getGoogleMaps();
    const geocoder = new maps.Geocoder();

    const geoResult = await new Promise((resolve, reject) => {
      geocoder.geocode(
        { location: { lat: numLat, lng: numLng }, language: "en", region: "IN" },
        (results, status) => {
          if (status === "OK" && results && results.length > 0) {
            resolve(results);
          } else {
            reject(new Error(`Geocoder status: ${status}`));
          }
        }
      );
    });

    if (geoResult && geoResult.length > 0) {
      const best = geoResult[0];
      const comps = best.address_components || [];

      const get = (type) =>
        comps.find((c) => c.types.includes(type))?.long_name || "";

      const streetNumber = get("street_number");
      const route = get("route");
      const sublocality1 = get("sublocality_level_1");
      const sublocality2 = get("sublocality_level_2");
      const locality = get("locality");
      const adminArea2 = get("administrative_area_level_2");
      const adminArea1 = get("administrative_area_level_1");
      const postalCode = get("postal_code").replace(/\D/g, "").slice(0, 6);
      const pointOfInterest = get("point_of_interest");
      const establishment = get("establishment");
      const premise = get("premise");
      const neighborhood = get("neighborhood");

      const street = [streetNumber, route].filter(Boolean).join(" ");
      const area =
        sublocality1 ||
        sublocality2 ||
        neighborhood ||
        locality ||
        adminArea2 ||
        "Muradnagar";
      const city = locality || adminArea2 || "Muradnagar";
      const state = adminArea1 || "Uttar Pradesh";
      const landmark = pointOfInterest || establishment || premise || "";

      const parts = [
        street || landmark,
        area !== city ? area : null,
        city,
        postalCode ? `PIN ${postalCode}` : ""
      ].filter(Boolean);

      const formatted =
        parts.length > 0 ? parts.join(", ") : best.formatted_address;

      const result = {
        fullAddress: formatted || best.formatted_address,
        street,
        area,
        landmark,
        city,
        state,
        postalCode: postalCode || "201206",
        formattedAddress: formatted || best.formatted_address
      };

      REVERSE_CACHE.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.warn("Google Geocoding API reverse geocode warning:", err.message);
  }

  // 3. Graceful fallback for unmapped / API-failed coordinates
  const distToCafe = calculateDistanceKm(
    DELIVERY_CONFIG.CAFE_COORDINATES.lat,
    DELIVERY_CONFIG.CAFE_COORDINATES.lng,
    numLat,
    numLng
  );
  const fallbackPin = distToCafe != null && distToCafe <= 5.0 ? "201206" : "";

  const fallbackResult = {
    fullAddress: `Muradnagar, Uttar Pradesh${fallbackPin ? ` ${fallbackPin}` : ""}`,
    street: "",
    area: "Muradnagar",
    landmark: "Pillar #852 Area",
    city: "Muradnagar",
    state: "Uttar Pradesh",
    postalCode: fallbackPin,
    formattedAddress: `Muradnagar, Uttar Pradesh${fallbackPin ? ` ${fallbackPin}` : ""}`
  };

  REVERSE_CACHE.set(cacheKey, fallbackResult);
  return fallbackResult;
}

// Pre-indexed Local Campus & Landmark Shortcuts for Muradnagar & KIET Region
const LOCAL_LANDMARKS = [
  {
    name: "Two Hearts Café",
    aliases: ["two hearts cafe", "two hearts", "cafe", "pillar 852", "pillar #852"],
    area: "Pillar #852, Delhi-Meerut Road",
    city: "Muradnagar",
    pincode: "201206",
    lat: 28.7758,
    lng: 77.5026
  },
  {
    name: "KIET Group of Institutions",
    aliases: ["kiet", "kiet college", "kiet campus", "kiet hostel", "kiet gate"],
    area: "Main Campus & Hostels, Delhi-Meerut Road",
    city: "Muradnagar",
    pincode: "201206",
    lat: 28.7734,
    lng: 77.5034
  },
  {
    name: "Radheshyam Vihar",
    aliases: ["radheshyam vihar", "radhe shyam", "radheshyam vihar muradnagar"],
    area: "Near Modinagar Road, Muradnagar",
    city: "Muradnagar",
    pincode: "201206",
    lat: 28.7559,
    lng: 77.5005
  },
  {
    name: "Shivam Vihar",
    aliases: ["shivam vihar", "shivam vihar colony"],
    area: "College Road / NH-58",
    city: "Muradnagar",
    pincode: "201206",
    lat: 28.7745,
    lng: 77.5015
  },
  {
    name: "Muradnagar RRTS Station (RapidX)",
    aliases: ["muradnagar rrts", "rapidx muradnagar", "muradnagar station"],
    area: "Delhi-Meerut Regional Rapid Transit",
    city: "Muradnagar",
    pincode: "201206",
    lat: 28.7845,
    lng: 77.5085
  },
  {
    name: "Muradnagar Town / Police Station",
    aliases: ["muradnagar town", "muradnagar market", "railway road muradnagar"],
    area: "Main Market & Railway Road",
    city: "Muradnagar",
    pincode: "201206",
    lat: 28.7885,
    lng: 77.5042
  },
  {
    name: "Ordnance Factory Muradnagar",
    aliases: ["ordnance factory", "ofm", "ofm muradnagar"],
    area: "Defence Colony, Muradnagar",
    city: "Muradnagar",
    pincode: "201206",
    lat: 28.771,
    lng: 77.512
  },
  {
    name: "Duhai Depot RRTS Station",
    aliases: ["duhai depot", "duhai rrts", "duhai rapidx"],
    area: "Duhai, Delhi-Meerut Expressway",
    city: "Ghaziabad",
    pincode: "201206",
    lat: 28.742,
    lng: 77.493
  },
  {
    name: "Modinagar South",
    aliases: ["modinagar", "modinagar south", "srm modinagar"],
    area: "Delhi-Meerut Road",
    city: "Modinagar",
    pincode: "201204",
    lat: 28.825,
    lng: 77.535
  },
  {
    name: "Raj Nagar District Centre (RDC)",
    aliases: ["rdc", "raj nagar", "rdc ghaziabad"],
    area: "RDC, Raj Nagar",
    city: "Ghaziabad",
    pincode: "201002",
    lat: 28.675,
    lng: 77.442
  }
];

/**
 * Reset session token after user selects a place.
 * Call this whenever a place selection is completed.
 */
export function resetAutocompleteSession() {
  _sessionToken = null;
}

/**
 * Autocomplete place search using Google Places AutocompleteService
 * with session tokens for cost-efficient billing.
 * Falls back to local landmarks for offline/API-unavailable scenarios.
 *
 * @param {string} query
 * @returns {Promise<Array<{title: string, subtitle: string, lat: number, lng: number, placeId?: string}>>}
 */
export async function searchPlaces(query) {
  if (!query || typeof query !== "string" || query.trim().length < 2) {
    return [];
  }
  const cleanQ = normalizeSearchText(query);

  // 1. Check in-memory session cache (per-session dedup)
  const cacheKey = cleanQ;
  if (SEARCH_CACHE.has(cacheKey)) {
    return SEARCH_CACHE.get(cacheKey);
  }

  // 2. Immediate local landmarks matching with accent normalization
  const localMatches = LOCAL_LANDMARKS.filter((item) => {
    const normName = normalizeSearchText(item.name);
    const normArea = normalizeSearchText(item.area);
    const normCity = normalizeSearchText(item.city);
    const hasAliasMatch = (item.aliases || []).some((a) =>
      normalizeSearchText(a).includes(cleanQ)
    );
    return (
      normName.includes(cleanQ) ||
      normArea.includes(cleanQ) ||
      normCity.includes(cleanQ) ||
      item.pincode.includes(cleanQ) ||
      hasAliasMatch
    );
  }).map((item) => ({
    title: item.name,
    subtitle: `${item.area}, ${item.city}, PIN ${item.pincode}`,
    lat: item.lat,
    lng: item.lng,
    placeId: null
  }));

  // 3. Google Places Autocomplete with session token
  try {
    const maps = await getGoogleMaps();

    // Reuse or create a session token (one token per search session = one billing event)
    if (!_sessionToken) {
      _sessionToken = new maps.places.AutocompleteSessionToken();
    }

    if (!_placesService) {
      _placesService = new maps.places.AutocompleteService();
    }

    const predictions = await new Promise((resolve, reject) => {
      _placesService.getPlacePredictions(
        {
          input: query.trim(),
          sessionToken: _sessionToken,
          componentRestrictions: { country: "in" },
          locationBias: new maps.Circle({
            center: { lat: CAFE_LAT, lng: CAFE_LNG },
            radius: 10000 // 10 km bias radius around the cafe
          })
        },
        (results, status) => {
          if (
            status === maps.places.PlacesServiceStatus.OK ||
            status === maps.places.PlacesServiceStatus.ZERO_RESULTS
          ) {
            resolve(results || []);
          } else {
            reject(new Error(`Places status: ${status}`));
          }
        }
      );
    });

    const placesResults = predictions.map((pred) => ({
      title: pred.structured_formatting?.main_text || pred.description,
      subtitle:
        pred.structured_formatting?.secondary_text ||
        pred.description,
      lat: 0, // Coordinates not available from predictions; resolved on selection
      lng: 0,
      placeId: pred.place_id,
      description: pred.description
    }));

    // Deduplicate: local matches first, then places
    const seen = new Set();
    const combined = [...localMatches, ...placesResults].filter((item) => {
      const key = item.placeId || `${item.lat.toFixed(3)},${item.lng.toFixed(3)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 8);

    SEARCH_CACHE.set(cacheKey, combined);
    return combined;
  } catch (err) {
    console.warn("Google Places autocomplete warning, using local matches:", err.message);
  }

  SEARCH_CACHE.set(cacheKey, localMatches);
  return localMatches;
}

/**
 * Resolve a Google Place ID to coordinates.
 * Called when user selects a Google Places prediction (not a local landmark).
 * Resets the session token after resolution (completes the billing session).
 *
 * @param {string} placeId
 * @returns {Promise<{lat: number, lng: number, fullAddress: string}>}
 */
export async function resolvePlaceId(placeId) {
  if (!placeId) return null;

  try {
    const maps = await getGoogleMaps();
    const currentToken = _sessionToken;

    // Create a temporary invisible div for PlacesService
    const dummyDiv = document.createElement("div");
    const placesService = new maps.places.PlacesService(dummyDiv);

    const place = await new Promise((resolve, reject) => {
      placesService.getDetails(
        {
          placeId,
          fields: ["geometry", "formatted_address", "address_components", "name"],
          sessionToken: currentToken
        },
        (result, status) => {
          if (status === maps.places.PlacesServiceStatus.OK && result) {
            resolve(result);
          } else {
            reject(new Error(`PlacesService status: ${status}`));
          }
        }
      );
    });

    // Reset session token after getDetails (billing session complete)
    _sessionToken = null;

    if (place.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      // Also warm the reverse-geocode cache from address_components
      const comps = place.address_components || [];
      const get = (type) =>
        comps.find((c) => c.types.includes(type))?.long_name || "";

      const postalCode = get("postal_code").replace(/\D/g, "").slice(0, 6);
      const sublocality = get("sublocality_level_1") || get("sublocality");
      const locality = get("locality");
      const adminArea2 = get("administrative_area_level_2");
      const adminArea1 = get("administrative_area_level_1");
      const route = get("route");
      const streetNumber = get("street_number");

      const area = sublocality || locality || adminArea2 || "Muradnagar";
      const city = locality || adminArea2 || "Muradnagar";
      const state = adminArea1 || "Uttar Pradesh";
      const street = [streetNumber, route].filter(Boolean).join(" ");

      const parts = [street, area !== city ? area : null, city, postalCode ? `PIN ${postalCode}` : ""].filter(Boolean);
      const formatted = parts.length > 0 ? parts.join(", ") : place.formatted_address;

      // Warm reverse cache
      const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      REVERSE_CACHE.set(cacheKey, {
        fullAddress: formatted,
        street,
        area,
        landmark: place.name || "",
        city,
        state,
        postalCode: postalCode || "201206",
        formattedAddress: formatted
      });

      return {
        lat,
        lng,
        fullAddress: place.formatted_address || formatted,
        area,
        city,
        state,
        postalCode: postalCode || "201206",
        street
      };
    }
  } catch (err) {
    console.warn("resolvePlaceId error:", err.message);
    _sessionToken = null; // Reset on error too
  }

  return null;
}

// Known local PIN codes dictionary for Muradnagar & Delhi-NCR
const LOCAL_PINCODE_FALLBACK = {
  "201206": {
    district: "Ghaziabad",
    state: "Uttar Pradesh",
    city: "Muradnagar",
    postOffices: [
      { name: "Murad Nagar (Ghaziabad)", branchType: "Sub Post Office" },
      { name: "Duhai", branchType: "Branch Post Office" },
      { name: "Shahpur", branchType: "Branch Post Office" },
      { name: "Basantpur Sainthli", branchType: "Branch Post Office" },
      { name: "Khimawati", branchType: "Branch Post Office" },
      { name: "Raoli Kalan", branchType: "Branch Post Office" },
      { name: "Surana", branchType: "Branch Post Office" }
    ],
    formattedPreview: "Muradnagar, Ghaziabad, Uttar Pradesh"
  },
  "201204": {
    district: "Ghaziabad",
    state: "Uttar Pradesh",
    city: "Modinagar",
    postOffices: [
      { name: "Modinagar", branchType: "Head Post Office" },
      { name: "Govindpuri", branchType: "Sub Post Office" },
      { name: "Bhojpur", branchType: "Sub Post Office" }
    ],
    formattedPreview: "Modinagar, Ghaziabad, Uttar Pradesh"
  },
  "201001": {
    district: "Ghaziabad",
    state: "Uttar Pradesh",
    city: "Ghaziabad",
    postOffices: [{ name: "Ghaziabad H.O", branchType: "Head Post Office" }],
    formattedPreview: "Ghaziabad, Uttar Pradesh"
  },
  "201002": {
    district: "Ghaziabad",
    state: "Uttar Pradesh",
    city: "Ghaziabad",
    postOffices: [{ name: "Navyug Market", branchType: "Sub Post Office" }],
    formattedPreview: "Navyug Market, Ghaziabad, Uttar Pradesh"
  },
  "201003": {
    district: "Ghaziabad",
    state: "Uttar Pradesh",
    city: "Ghaziabad",
    postOffices: [{ name: "Raj Nagar", branchType: "Sub Post Office" }],
    formattedPreview: "Raj Nagar, Ghaziabad, Uttar Pradesh"
  },
  "201017": {
    district: "Ghaziabad",
    state: "Uttar Pradesh",
    city: "Ghaziabad",
    postOffices: [{ name: "Sanjay Nagar", branchType: "Sub Post Office" }],
    formattedPreview: "Sanjay Nagar, Ghaziabad, Uttar Pradesh"
  },
  "110001": {
    district: "Central Delhi",
    state: "Delhi",
    city: "New Delhi",
    postOffices: [{ name: "Connaught Place", branchType: "Head Post Office" }],
    formattedPreview: "Connaught Place, New Delhi, Delhi"
  }
};

/**
 * Look up Indian Postal PIN code details via India Post API
 * Resolves City (strictly locked) and candidate local areas / post offices
 * @param {string} pincode - 6-digit numeric PIN code
 * @returns {Promise<{
 *   success: boolean,
 *   pincode: string,
 *   district: string,
 *   state: string,
 *   city: string,
 *   postOffices: Array<{ name: string, branchType?: string }>,
 *   formattedPreview: string,
 *   error?: string
 * }>}
 */
export async function lookupPincode(pincode) {
  if (!pincode) {
    return { success: false, error: "Please enter a 6-digit PIN code." };
  }

  const cleanPin = String(pincode).trim().replace(/\D/g, "");
  if (cleanPin.length !== 6) {
    return { success: false, error: "PIN code must be exactly 6 digits." };
  }

  // 1. Check in-memory session cache
  if (PINCODE_CACHE.has(cleanPin)) {
    return PINCODE_CACHE.get(cleanPin);
  }

  // 2. Check local known dictionary
  if (LOCAL_PINCODE_FALLBACK[cleanPin]) {
    const localData = {
      success: true,
      pincode: cleanPin,
      ...LOCAL_PINCODE_FALLBACK[cleanPin]
    };
    PINCODE_CACHE.set(cleanPin, localData);
    return localData;
  }

  // 3. India Post PIN code public API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (
        Array.isArray(data) &&
        data[0] &&
        data[0].Status === "Success" &&
        Array.isArray(data[0].PostOffice)
      ) {
        const offices = data[0].PostOffice;
        const firstOffice = offices[0] || {};
        const district = firstOffice.District || firstOffice.Division || "Ghaziabad";
        const state = firstOffice.State || "Uttar Pradesh";
        const city = firstOffice.Block || firstOffice.District || firstOffice.Name || "Muradnagar";

        const postOffices = offices.map((po) => ({
          name: po.Name,
          branchType: po.BranchType || "Post Office"
        }));

        const primaryOfficeName =
          offices.find((o) => o.Name.toLowerCase().includes("murad"))?.Name ||
          firstOffice.Name;
        const formattedPreview = `${primaryOfficeName ? `${primaryOfficeName}, ` : ""}${district}, ${state}`;

        const result = {
          success: true,
          pincode: cleanPin,
          district,
          state,
          city,
          postOffices,
          formattedPreview
        };

        PINCODE_CACHE.set(cleanPin, result);
        return result;
      }
    }
  } catch (err) {
    console.warn("India Post API fallback warning:", err);
  }

  return {
    success: false,
    error: `Could not verify PIN code ${cleanPin}. Please check the 6 digits.`
  };
}
