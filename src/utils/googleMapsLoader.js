/**
 * googleMapsLoader.js
 * Singleton Google Maps JavaScript API Loader for Two Hearts Café
 *
 * Uses @googlemaps/js-api-loader v2 functional API:
 * setOptions() to configure once, importLibrary() to load namespaces on demand.
 * The Maps script is loaded exactly once regardless of how many components call this.
 */

import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

// Configure once at module load time
setOptions({
  apiKey: GOOGLE_MAPS_API_KEY,
  version: "weekly",
  language: "en",
  region: "IN"
});

// Per-library promise cache — each library loads at most once
const _libraryCache = new Map();

/**
 * Import a specific Google Maps library on demand.
 * Results are cached — subsequent calls return the cached promise.
 *
 * @param {"maps"|"places"|"geometry"|"marker"} libraryName
 * @returns {Promise<object>} The library namespace (e.g. google.maps.places)
 */
export async function importGoogleLibrary(libraryName) {
  if (!_libraryCache.has(libraryName)) {
    _libraryCache.set(libraryName, importLibrary(libraryName));
  }
  return _libraryCache.get(libraryName);
}

/**
 * Returns the core google.maps namespace (equivalent to the old getGoogleMaps()).
 * Loads the "maps" library to ensure window.google.maps is initialized.
 *
 * @returns {Promise<typeof google.maps>}
 */
export async function getGoogleMaps() {
  await importGoogleLibrary("maps");
  return window.google.maps;
}

/**
 * Cafe origin coordinates — Pillar #852, Shivam Vihar / KIET vicinity, Muradnagar
 */
export const CAFE_LAT = 28.7526;
export const CAFE_LNG = 77.4985;

/**
 * Build a Google Maps Directions URL using coordinates (most reliable) or
 * falling back to a text-based destination.
 *
 * @param {{ lat?: number, lng?: number } | null} coords
 * @param {string} [textFallback]
 * @returns {string}
 */
export function buildDirectionsUrl(coords, textFallback = "") {
  if (coords?.lat && coords?.lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
  }
  const dest = textFallback.trim() || "Muradnagar, Uttar Pradesh";
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
}

/**
 * Build a Google Maps iframe embed URL.
 * Uses maps.google.com embed (no API key required for basic iframes).
 *
 * @param {{ lat?: number, lng?: number } | null} coords
 * @param {string} [textFallback]
 * @param {number} [zoom=15]
 * @returns {string}
 */
export function buildEmbedUrl(coords, textFallback = "", zoom = 15) {
  const q =
    coords?.lat && coords?.lng
      ? `${coords.lat},${coords.lng}`
      : encodeURIComponent(textFallback || "Muradnagar, Uttar Pradesh");
  return `https://maps.google.com/maps?width=100%25&height=600&hl=en&q=${q}&t=&z=${zoom}&ie=UTF8&iwloc=B&output=embed`;
}
