/**
 * locationService.js
 * Geolocation, Reverse Geocoding & Autocomplete Engine for Two Hearts Café
 * 
 * 100% Free, No API Key Required Stack:
 * - Map Rendering: Leaflet.js with OpenStreetMap tiles
 * - Reverse Geocoding: OpenStreetMap Nominatim API (no custom User-Agent in client fetch to avoid CORS errors)
 * - Autocomplete Search: Photon by Komoot (free, OSM-based, CORS-enabled, designed for typing with proximity bias)
 * - PIN Code Lookup: India Post API & Nominatim postal code search
 * - Geolocation: HTML5 Geolocation API with high-accuracy GPS fix
 */

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
          message = "Location permission was denied. Tap the 🔒 lock icon in your browser's address bar to allow location access, then tap Retry.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Location signal is currently unavailable. Please verify GPS / Location is turned on.";
        } else if (error.code === error.TIMEOUT) {
          message = "GPS request timed out while acquiring a satellite fix. Please tap Retry or drag the map.";
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

/**
 * Reverse geocode coordinates to a structured Indian delivery address via OpenStreetMap Nominatim
 * Note: Never send a custom User-Agent header in client-side fetch, as browsers block it or fail CORS preflights.
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
// String normalizer to strip accents and clean input (e.g. Café -> cafe)
export function normalizeSearchText(str) {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Reverse geocode coordinates to a structured Indian delivery address
 * Uses Photon Komoot /reverse API (100% free, CORS-enabled, fast) with Nominatim fallback
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

  // 1. Proximity check for immediate exact cafe or landmark match (~45 meters)
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

  // 2. Query Photon Komoot /reverse API (free, CORS-friendly, zero rate-limit 403)
  try {
    const photonUrl = `https://photon.komoot.io/reverse?lat=${numLat}&lon=${numLng}`;
    const pRes = await fetch(photonUrl);
    if (pRes.ok) {
      const pData = await pRes.json();
      const feat = pData.features?.[0];
      if (feat && feat.properties) {
        const p = feat.properties;
        const name = p.name || "";
        const street = p.street || "";
        const locality = p.locality || p.district || "";
        const city = p.city || p.county || "Muradnagar";
        const state = p.state || "Uttar Pradesh";
        let postalCode = (p.postcode || "").replace(/\D/g, "").slice(0, 6);

        // Smart Local PIN Resolution if Photon did not provide postcode
        if (!postalCode || postalCode.length !== 6) {
          const distToCafe = calculateDistanceKm(
            DELIVERY_CONFIG.CAFE_COORDINATES.lat,
            DELIVERY_CONFIG.CAFE_COORDINATES.lng,
            numLat,
            numLng
          );
          if (distToCafe != null && distToCafe <= 5.0) {
            postalCode = "201206"; // Muradnagar
          } else if (numLat > 28.81 && numLat < 28.86) {
            postalCode = "201204"; // Modinagar
          } else if (numLat >= 28.65 && numLat <= 28.73) {
            postalCode = "201002"; // Ghaziabad
          }
        }

        const resolvedArea = name || locality || street || city || "Muradnagar";
        const parts = [
          street && street !== resolvedArea ? street : "",
          resolvedArea,
          city,
          postalCode ? `PIN ${postalCode}` : ""
        ].filter(Boolean);

        const formatted = parts.length > 0 ? parts.join(", ") : `${resolvedArea}, ${city}`;

        const result = {
          fullAddress: formatted,
          street: street || name,
          area: resolvedArea,
          landmark: name || street,
          city: city || "Muradnagar",
          state,
          postalCode,
          formattedAddress: formatted
        };

        REVERSE_CACHE.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn("Photon reverse geocode warning, falling back:", err);
  }

  // 3. Query OpenStreetMap Nominatim /reverse as secondary
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${numLat}&lon=${numLng}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "en" }
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const a = data.address;
        const street = a.road || a.pedestrian || a.street || "";
        const landmark = a.amenity || a.building || a.shop || "";
        const area = a.suburb || a.neighbourhood || a.residential || a.village || "";
        const city = a.city || a.town || a.municipality || a.district || "Muradnagar";
        const state = a.state || "Uttar Pradesh";
        let postalCode = (a.postcode || "").replace(/\D/g, "").slice(0, 6);

        if (!postalCode || postalCode.length !== 6) {
          postalCode = "201206";
        }

        const resolvedArea = area || landmark || street || city || "Muradnagar";
        const parts = [landmark || street, resolvedArea, city, postalCode ? `PIN ${postalCode}` : ""].filter(Boolean);
        const formatted = parts.length > 0 ? parts.join(", ") : data.display_name;

        const result = {
          fullAddress: formatted || data.display_name,
          street: street || landmark,
          area: resolvedArea,
          landmark: landmark || street,
          city,
          state,
          postalCode,
          formattedAddress: formatted || data.display_name
        };

        REVERSE_CACHE.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn("Nominatim reverse geocode fetch warning:", err);
  }

  // 4. Graceful fallback for partial / unmapped coordinates
  const distToCafe = calculateDistanceKm(
    DELIVERY_CONFIG.CAFE_COORDINATES.lat,
    DELIVERY_CONFIG.CAFE_COORDINATES.lng,
    numLat,
    numLng
  );
  const fallbackPin = distToCafe != null && distToCafe <= 5.0 ? "201206" : "";

  const fallbackResult = {
    fullAddress: `Muradnagar, Uttar Pradesh ${fallbackPin}`,
    street: "",
    area: "Muradnagar",
    landmark: "Pillar #852 Area",
    city: "Muradnagar",
    state: "Uttar Pradesh",
    postalCode: fallbackPin,
    formattedAddress: `Muradnagar, Uttar Pradesh ${fallbackPin}`
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

let activeSearchAbortController = null;

/**
 * Autocomplete place search using Photon by Komoot (free, OSM-based, CORS-enabled)
 * Designed specifically for live autocomplete-while-typing with proximity bias towards Muradnagar
 * @param {string} query 
 * @returns {Promise<Array<{title: string, subtitle: string, lat: number, lng: number}>>}
 */
export async function searchPlaces(query) {
  if (!query || typeof query !== "string" || query.trim().length < 2) {
    return [];
  }
  const cleanQ = normalizeSearchText(query);

  // 1. Check in-memory session cache
  if (SEARCH_CACHE.has(cleanQ)) {
    return SEARCH_CACHE.get(cleanQ);
  }

  // 2. Immediate local landmarks matching with accent normalization
  const localMatches = LOCAL_LANDMARKS.filter((item) => {
    const normName = normalizeSearchText(item.name);
    const normArea = normalizeSearchText(item.area);
    const normCity = normalizeSearchText(item.city);
    const hasAliasMatch = (item.aliases || []).some((a) => normalizeSearchText(a).includes(cleanQ));
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
    lng: item.lng
  }));

  // 3. Cancel any previous in-flight search request to prevent race conditions
  if (activeSearchAbortController) {
    activeSearchAbortController.abort();
  }
  activeSearchAbortController = new AbortController();

  // 4. Query Photon API (Komoot) - free, CORS-friendly, optimized for autocomplete
  try {
    const encodedQuery = encodeURIComponent(query.trim());
    // Biased to Muradnagar (lat: 28.7758, lon: 77.5026)
    const photonUrl = `https://photon.komoot.io/api/?q=${encodedQuery}&limit=8&lat=28.7758&lon=77.5026`;

    const res = await fetch(photonUrl, {
      signal: activeSearchAbortController.signal
    });

    if (res.ok) {
      const data = await res.json();
      const features = data.features || [];

      // Filter strictly to Indian locations to prevent showing foreign results
      const indianFeatures = features.filter((f) => {
        const p = f.properties || {};
        return (
          p.countrycode === "IN" ||
          p.country === "India" ||
          p.state === "Uttar Pradesh" ||
          p.state === "Delhi" ||
          p.state === "Haryana"
        );
      });

      const photonMatches = indianFeatures.map((f) => {
        const p = f.properties || {};
        const coords = f.geometry?.coordinates || [77.5026, 28.7758]; // [lon, lat]
        const title = p.name || p.street || p.city || "Location";
        const subtitleParts = [
          p.street && p.street !== title ? p.street : "",
          p.locality || p.district || "",
          p.city || p.county || "",
          p.state || "",
          p.postcode ? `PIN ${p.postcode}` : ""
        ].filter(Boolean);

        return {
          title,
          subtitle: subtitleParts.length > 0 ? subtitleParts.join(", ") : p.country || "India",
          lat: Number(coords[1]),
          lng: Number(coords[0])
        };
      });

      // Deduplicate between local landmarks and Photon results (local matches prioritized)
      const seen = new Set();
      const combined = [...localMatches, ...photonMatches].filter((item) => {
        const key = `${item.lat.toFixed(3)},${item.lng.toFixed(3)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 7);

      SEARCH_CACHE.set(cleanQ, combined);
      return combined;
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      console.warn("Photon autocomplete warning, falling back to local matches:", err);
    }
  }

  SEARCH_CACHE.set(cleanQ, localMatches);
  return localMatches;
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
 * Look up Indian Postal PIN code details via India Post API & Nominatim
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
      if (Array.isArray(data) && data[0] && data[0].Status === "Success" && Array.isArray(data[0].PostOffice)) {
        const offices = data[0].PostOffice;
        const firstOffice = offices[0] || {};
        const district = firstOffice.District || firstOffice.Division || "Ghaziabad";
        const state = firstOffice.State || "Uttar Pradesh";
        const city = firstOffice.Block || firstOffice.District || firstOffice.Name || "Muradnagar";

        const postOffices = offices.map((po) => ({
          name: po.Name,
          branchType: po.BranchType || "Post Office"
        }));

        const primaryOfficeName = offices.find((o) => o.Name.toLowerCase().includes("murad"))?.Name || firstOffice.Name;
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

  // 4. Nominatim search fallback with country=India (no custom User-Agent in client fetch)
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?postalcode=${cleanPin}&country=India&format=json&addressdetails=1&limit=3`;
    const nomRes = await fetch(nomUrl, {
      headers: { "Accept-Language": "en" }
    });
    if (nomRes.ok) {
      const nomData = await nomRes.json();
      if (Array.isArray(nomData) && nomData.length > 0) {
        const first = nomData[0];
        const a = first.address || {};
        const district = a.state_district || a.county || a.district || "Ghaziabad";
        const state = a.state || "Uttar Pradesh";
        const city = a.city || a.town || a.municipality || district;

        const result = {
          success: true,
          pincode: cleanPin,
          district,
          state,
          city,
          postOffices: [{ name: city, branchType: "Area" }],
          formattedPreview: `${city}, ${district}, ${state}`
        };

        PINCODE_CACHE.set(cleanPin, result);
        return result;
      }
    }
  } catch (nomErr) {
    console.warn("Nominatim PIN lookup error:", nomErr);
  }

  return {
    success: false,
    error: `Could not verify PIN code ${cleanPin}. Please check the 6 digits.`
  };
}
