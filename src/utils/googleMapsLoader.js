/**
 * googleMapsLoader.js
 * Singleton Google Maps JavaScript API Loader for Two Hearts Café
 *
 * Uses @googlemaps/js-api-loader to load the Maps script exactly ONCE,
 * no matter how many components call getGoogleMaps().
 * All map components import from here — never inject <script> tags manually.
 */

import { Loader } from "@googlemaps/js-api-loader";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const loader = new Loader({
  apiKey: GOOGLE_MAPS_API_KEY,
  version: "weekly",
  libraries: ["places", "geometry"],
  language: "en",
  region: "IN"
});

let mapsPromise = null;

/**
 * Returns a promise that resolves to the google.maps namespace.
 * The Maps script is loaded at most once; subsequent calls return the cached promise.
 *
 * @returns {Promise<typeof google.maps>}
 */
export async function getGoogleMaps() {
  if (!mapsPromise) {
    mapsPromise = loader.load().then(() => window.google.maps);
  }
  return mapsPromise;
}

/**
 * Cafe origin coordinates — Pillar #852, Delhi-Meerut Road, Muradnagar
 */
export const CAFE_LAT = 28.7758;
export const CAFE_LNG = 77.5026;

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
 * Build a static map embed URL using coords or text query.
 * Uses maps.google.com embed (no API key required for iframes in India).
 *
 * @param {{ lat?: number, lng?: number } | null} coords
 * @param {string} [textFallback]
 * @param {number} [zoom=15]
 * @returns {string}
 */
export function buildEmbedUrl(coords, textFallback = "", zoom = 15) {
  const q = coords?.lat && coords?.lng
    ? `${coords.lat},${coords.lng}`
    : encodeURIComponent(textFallback || "Muradnagar, Uttar Pradesh");
  return `https://maps.google.com/maps?width=100%25&height=600&hl=en&q=${q}&t=&z=${zoom}&ie=UTF8&iwloc=B&output=embed`;
}
