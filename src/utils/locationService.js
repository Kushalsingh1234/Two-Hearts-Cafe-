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

import {
  DELIVERY_CONFIG,
  calculateDistanceKm,
  DEFAULT_CAFE_COORDS
} from "../config/deliveryConfig";

export { DELIVERY_CONFIG, calculateDistanceKm, DEFAULT_CAFE_COORDS };

const GOOGLE_MAPS_API_KEY = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || "";

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

// Google Maps JS SDK Loader promise cache
let googleMapsLoadingPromise = null;

/**
 * Dynamically load Google Maps JavaScript API SDK if API key is provided
 * @param {string} [apiKey]
 * @returns {Promise<any|null>}
 */
export function loadGoogleMapsApi(apiKey = GOOGLE_MAPS_API_KEY) {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }
  if (!apiKey || apiKey.includes("YOUR_") || apiKey.includes("PLACEHOLDER")) {
    return Promise.resolve(null);
  }
  if (googleMapsLoadingPromise) {
    return googleMapsLoadingPromise;
  }

  googleMapsLoadingPromise = new Promise((resolve) => {
    const existingScript = document.getElementById("google-maps-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google?.maps || null));
      existingScript.addEventListener("error", () => resolve(null));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google?.maps || null);
    script.onerror = (err) => {
      console.warn("Failed to load Google Maps JS SDK:", err);
      resolve(null);
    };
    document.head.appendChild(script);
  });

  return googleMapsLoadingPromise;
}

/**
 * Reverse geocode using Google Maps JS SDK Geocoder (avoids browser REST CORS)
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<any|null>}
 */
export async function reverseGeocodeWithGoogle(lat, lng) {
  if (typeof window === "undefined") return null;
  try {
    const maps = await loadGoogleMapsApi();
    if (!maps || !maps.Geocoder) return null;

    return new Promise((resolve) => {
      const geocoder = new maps.Geocoder();
      geocoder.geocode({ location: { lat: Number(lat), lng: Number(lng) } }, (results, status) => {
        if (status === "OK" && results && results.length > 0) {
          const result = results[0];
          let street = "";
          let area = "";
          let city = "";
          let state = "";
          let postalCode = "";

          result.address_components.forEach((comp) => {
            const types = comp.types || [];
            if (types.includes("route") || types.includes("street_number") || types.includes("premise")) {
              street += (street ? " " : "") + comp.long_name;
            }
            if (
              types.includes("sublocality") ||
              types.includes("sublocality_level_1") ||
              types.includes("sublocality_level_2") ||
              types.includes("neighborhood")
            ) {
              area = comp.long_name;
            }
            if (types.includes("locality")) {
              city = comp.long_name;
            } else if (!city && types.includes("administrative_area_level_2")) {
              city = comp.long_name;
            }
            if (types.includes("administrative_area_level_1")) {
              state = comp.long_name;
            }
            if (types.includes("postal_code")) {
              postalCode = comp.long_name.replace(/\D/g, "").slice(0, 6);
            }
          });

          const parts = [street, area, city, postalCode ? `PIN ${postalCode}` : ""].filter(Boolean);
          const formatted = parts.length > 0 ? parts.join(", ") : result.formatted_address;

          resolve({
            fullAddress: formatted || result.formatted_address,
            street: street || area,
            area: area || city || "Muradnagar",
            landmark: "",
            city: city || "Muradnagar",
            state: state || "Uttar Pradesh",
            postalCode,
            formattedAddress: formatted || result.formatted_address
          });
        } else {
          resolve(null);
        }
      });
    });
  } catch (err) {
    console.warn("Google Maps JS reverse geocode error:", err);
    return null;
  }
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
  // 1. Try Google Maps JS SDK Geocoding (high precision, parsed address_components)
  const googleResult = await reverseGeocodeWithGoogle(lat, lng);
  if (googleResult) {
    return googleResult;
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
        const street = a.road || a.pedestrian || a.street || "";
        const area = a.suburb || a.neighbourhood || a.residential || a.village || a.city_district || a.county || "";
        const city = a.city || a.town || a.municipality || a.district || "Muradnagar";
        const state = a.state || "Uttar Pradesh";
        const postalCode = (a.postcode || "").replace(/\D/g, "").slice(0, 6);

        // Build human-readable formatted address
        const parts = [street, area, city, postalCode ? `PIN ${postalCode}` : ""].filter(Boolean);
        const formatted = parts.length > 0 ? parts.join(", ") : data.display_name;

        return {
          fullAddress: formatted || data.display_name,
          street: street,
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

/**
 * Search places for top search bar (combining local landmarks & Nominatim search)
 * @param {string} query
 * @returns {Promise<Array<{title: string, subtitle: string, lat: number, lng: number}>>}
 */
export async function searchPlaces(query) {
  if (!query || typeof query !== "string" || query.trim().length < 2) return [];
  const cleanQ = query.trim().toLowerCase();

  const LOCAL_LANDMARKS = [
    {
      name: "Two Hearts Café",
      area: "Pillar #852, Delhi-Meerut Road",
      city: "Muradnagar",
      pincode: "201206",
      lat: 28.7758,
      lng: 77.5026
    },
    {
      name: "KIET Group of Institutions",
      area: "Main Campus & Hostels, Delhi-Meerut Road",
      city: "Muradnagar",
      pincode: "201206",
      lat: 28.7734,
      lng: 77.5034
    },
    {
      name: "Shivam Vihar",
      area: "College Road / NH-58",
      city: "Muradnagar",
      pincode: "201206",
      lat: 28.7745,
      lng: 77.5015
    },
    {
      name: "Muradnagar RRTS Station (RapidX)",
      area: "Delhi-Meerut Regional Rapid Transit",
      city: "Muradnagar",
      pincode: "201206",
      lat: 28.7845,
      lng: 77.5085
    },
    {
      name: "Muradnagar Town / Police Station",
      area: "Main Market & Railway Road",
      city: "Muradnagar",
      pincode: "201206",
      lat: 28.7885,
      lng: 77.5042
    },
    {
      name: "Duhai Depot RRTS Station",
      area: "Duhai, Delhi-Meerut Expressway",
      city: "Ghaziabad",
      pincode: "201206",
      lat: 28.742,
      lng: 77.493
    },
    {
      name: "Modinagar South",
      area: "Delhi-Meerut Road",
      city: "Modinagar",
      pincode: "201204",
      lat: 28.825,
      lng: 77.535
    },
    {
      name: "Ghaziabad RDC / Raj Nagar",
      area: "Raj Nagar District Centre",
      city: "Ghaziabad",
      pincode: "201002",
      lat: 28.675,
      lng: 77.442
    }
  ];

  const localMatches = LOCAL_LANDMARKS.filter(
    (item) =>
      item.name.toLowerCase().includes(cleanQ) ||
      item.area.toLowerCase().includes(cleanQ) ||
      item.city.toLowerCase().includes(cleanQ) ||
      item.pincode.includes(cleanQ)
  ).map((item) => ({
    title: item.name,
    subtitle: `${item.area}, ${item.city}, PIN ${item.pincode}`,
    lat: item.lat,
    lng: item.lng
  }));

  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query + ", Uttar Pradesh, India")}&limit=5&addressdetails=1`;
    const res = await fetch(nomUrl, {
      headers: { "Accept-Language": "en", "User-Agent": "TwoHeartsCafeWeb/1.0" }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const nomMatches = data.map((item) => ({
          title: item.name || item.display_name.split(",")[0],
          subtitle: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        }));
        return [...localMatches, ...nomMatches].slice(0, 7);
      }
    }
  } catch (err) {
    console.warn("Search places error:", err);
  }

  return localMatches;
}

/**
 * Forward geocode an address string to lat/lng coordinates
 * @param {string} addressString
 * @returns {Promise<{lat: number, lng: number}|null>}
 */
export async function geocodeAddress(addressString) {
  if (!addressString || typeof addressString !== "string") return null;
  const cleanAddr = addressString.trim();
  if (cleanAddr.length < 3) return null;

  // 1. Try Google Maps Geocoding API if key configured
  if (GOOGLE_MAPS_API_KEY && !GOOGLE_MAPS_API_KEY.includes("YOUR_") && !GOOGLE_MAPS_API_KEY.includes("PLACEHOLDER")) {
    try {
      const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cleanAddr)}&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(gUrl);
      const data = await res.json();
      if (data.status === "OK" && data.results && data.results.length > 0) {
        const loc = data.results[0].geometry.location;
        return { lat: Number(loc.lat), lng: Number(loc.lng) };
      }
    } catch (err) {
      console.warn("Google forward geocode failed:", err);
    }
  }

  // 2. OpenStreetMap Nominatim search
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanAddr + ", Muradnagar, Uttar Pradesh")}&limit=1`;
    const res = await fetch(nomUrl, {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "TwoHeartsCafeWeb/1.0"
      }
    });
    if (res.ok) {
      const results = await res.json();
      if (Array.isArray(results) && results.length > 0) {
        return {
          lat: parseFloat(results[0].lat),
          lng: parseFloat(results[0].lon)
        };
      }
    }
  } catch (err) {
    console.warn("Nominatim forward geocode failed:", err);
  }

  return null;
}

// In-memory cache for PIN code lookups to ensure instant response and avoid redundant network requests
const PINCODE_CACHE = new Map();

// Known local PIN codes fallback mapping for Muradnagar & Delhi-NCR
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
 * Look up Indian Postal PIN code details via Postal PIN Code API
 * with instant fallback and caching
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

  // 1. Check in-memory cache
  if (PINCODE_CACHE.has(cleanPin)) {
    return PINCODE_CACHE.get(cleanPin);
  }

  // 2. Fetch from India Post PIN code public API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
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

        // Map list of locality / post office names
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
    console.warn("India Post PIN code API request failed or timed out:", err);
  }

  // 3. Fallback to local dictionary if known
  if (LOCAL_PINCODE_FALLBACK[cleanPin]) {
    const localData = {
      success: true,
      pincode: cleanPin,
      ...LOCAL_PINCODE_FALLBACK[cleanPin]
    };
    PINCODE_CACHE.set(cleanPin, localData);
    return localData;
  }

  // 4. Try Nominatim reverse query for unknown PIN
  try {
    const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&postalcode=${cleanPin}&country=India&limit=1`, {
      headers: { "Accept-Language": "en", "User-Agent": "TwoHeartsCafeWeb/1.0" }
    });
    if (nomRes.ok) {
      const nomData = await nomRes.json();
      if (Array.isArray(nomData) && nomData.length > 0) {
        const dName = nomData[0].display_name || "";
        const parts = dName.split(",").map((s) => s.trim());
        const state = parts.slice(-2, -1)[0] || "India";
        const district = parts.slice(-3, -2)[0] || parts[0];
        const preview = `${parts[0]}, ${district}, ${state}`;

        const nomResult = {
          success: true,
          pincode: cleanPin,
          district,
          state,
          city: parts[0] || district,
          postOffices: [{ name: parts[0] || "Local Area", branchType: "Area" }],
          formattedPreview: preview
        };
        PINCODE_CACHE.set(cleanPin, nomResult);
        return nomResult;
      }
    }
  } catch (nomErr) {
    console.warn("Nominatim PIN lookup fallback error:", nomErr);
  }

  return {
    success: false,
    error: `Could not verify PIN code ${cleanPin}. Please check the 6 digits.`
  };
}

/**
 * Geocode a manually entered address with PIN code and street/landmark
 * @param {Object} params
 * @param {string} params.pincode
 * @param {string} params.streetArea
 * @param {string} [params.landmark]
 * @param {string} [params.city]
 * @param {string} [params.state]
 * @returns {Promise<{
 *   lat: number,
 *   lng: number,
 *   isConfident: boolean,
 *   confidence: 'high' | 'approximate' | 'unconfirmed',
 *   formattedAddress: string
 * } | null>}
 */
export async function geocodeManualAddress({
  pincode = "",
  city = "",
  area = "",
  street = "",
  landmark = "",
  streetArea = "",
  state = ""
}) {
  const cleanPin = String(pincode).trim().replace(/\D/g, "");
  const cleanCity = String(city).trim();
  const cleanArea = String(area).trim();
  const cleanStreet = String(street || streetArea).trim();
  const cleanLandmark = String(landmark).trim();

  // Try queries in order of precision
  const searchQueries = [];

  // Query 1: Full structured address (Street, Area, City, PIN)
  if (cleanStreet && cleanArea && cleanPin) {
    searchQueries.push(`${cleanStreet}, ${cleanArea}, ${cleanCity || "Muradnagar"}, ${cleanPin}, India`);
  }
  // Query 2: Area + City + PIN
  if (cleanArea && cleanPin) {
    searchQueries.push(`${cleanArea}, ${cleanCity || "Muradnagar"}, ${cleanPin}, India`);
  }
  // Query 3: Street + Area + City
  if (cleanStreet && cleanArea) {
    searchQueries.push(`${cleanStreet}, ${cleanArea}, ${cleanCity || "Muradnagar"}, Uttar Pradesh, India`);
  }
  // Query 4: Street + City
  if (cleanStreet && cleanCity) {
    searchQueries.push(`${cleanStreet}, ${cleanCity}, Uttar Pradesh, India`);
  }
  // Query 5: Landmark + City / Muradnagar
  if (cleanLandmark) {
    searchQueries.push(`${cleanLandmark}, ${cleanCity || "Muradnagar"}, Uttar Pradesh, India`);
  }
  // Query 6: Area alone in Muradnagar / City
  if (cleanArea) {
    searchQueries.push(`${cleanArea}, ${cleanCity || "Muradnagar"}, Uttar Pradesh, India`);
  }
  // Query 7: PIN code + City
  if (cleanPin) {
    searchQueries.push(`${cleanPin}, ${cleanCity || "Muradnagar"}, Uttar Pradesh, India`);
    searchQueries.push(`${cleanPin}, India`);
  }

  for (let i = 0; i < searchQueries.length; i++) {
    const q = searchQueries[i];
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`;
      const res = await fetch(url, {
        headers: { "Accept-Language": "en", "User-Agent": "TwoHeartsCafeWeb/1.0" }
      });
      if (res.ok) {
        const results = await res.json();
        if (Array.isArray(results) && results.length > 0) {
          const lat = parseFloat(results[0].lat);
          const lng = parseFloat(results[0].lon);
          const isConfident = i <= 1; // High confidence if matched full street or specific locality
          return {
            lat,
            lng,
            isConfident,
            confidence: i === 0 ? "high" : i <= 2 ? "approximate" : "approximate",
            formattedAddress: results[0].display_name || q
          };
        }
      }
    } catch (err) {
      console.warn(`Geocode query failed for "${q}":`, err);
    }
  }

  // If PIN is 201206 (Muradnagar) and nothing matched, use default Muradnagar town coordinates as approximate
  if (cleanPin === "201206") {
    return {
      lat: 28.7734,
      lng: 77.5034,
      isConfident: false,
      confidence: "approximate",
      formattedAddress: "Muradnagar, Uttar Pradesh 201206"
    };
  }

  return null;
}


