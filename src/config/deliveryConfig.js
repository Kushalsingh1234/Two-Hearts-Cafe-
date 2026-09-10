/**
 * deliveryConfig.js
 * Centralized Configuration for Two Hearts Café Online Ordering & Delivery Rules
 */

export const DELIVERY_CONFIG = {
  // Cafe Origin Location: Pillar #852, Delhi-Meerut Road, Muradnagar (KIET Campus vicinity)
  CAFE_COORDINATES: {
    lat: 28.7758,
    lng: 77.5026,
    areaName: "Near Pillar 852, Delhi-Meerut Road, Muradnagar, Ghaziabad",
    landmark: "Pillar #852"
  },

  // Rule 1: Maximum straight-line delivery radius in kilometers
  MAX_DELIVERY_RADIUS_KM: 2.0,

  // Rule 2: Minimum required item subtotal (before delivery fee & taxes) for delivery orders
  MIN_DELIVERY_SUBTOTAL: 299,

  // Free delivery threshold (subtotal >= ₹299 gets free delivery)
  FREE_DELIVERY_THRESHOLD: 299,

  // Standard delivery partner fee when subtotal is below free threshold (or general fee)
  STANDARD_DELIVERY_FEE: 30,

  // GST percentage (5%)
  GST_PERCENTAGE: 0.05
};

export const DEFAULT_CAFE_COORDS = DELIVERY_CONFIG.CAFE_COORDINATES;

/**
 * Calculate straight-line distance in kilometers between two lat/lng points using the Haversine formula
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number|null} Distance in kilometers rounded to 2 decimal places, or null if coordinates are invalid
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);
  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) return null;

  const R = 6371; // Earth's mean radius in kilometers
  const dLat = ((numLat2 - numLat1) * Math.PI) / 180;
  const dLon = ((numLon2 - numLon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((numLat1 * Math.PI) / 180) *
      Math.cos((numLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 100) / 100;
}

/**
 * Check delivery eligibility for a given address and cart subtotal
 * @param {Object} options
 * @param {Object} [options.coords] - { lat, lng }
 * @param {number} options.subtotal - Item subtotal
 * @param {string} [options.orderType="delivery"] - 'delivery' | 'pickup'
 * @returns {Object} Comprehensive validation results & user-facing guidance
 */
export function checkDeliveryEligibility({ coords, subtotal = 0, orderType = "delivery" }) {
  // Pickup orders have zero minimum subtotal and zero distance restrictions
  if (orderType === "pickup") {
    return {
      isEligible: true,
      orderType: "pickup",
      distanceKm: null,
      hasCoords: false,
      isWithinRadius: true,
      meetsMinSubtotal: true,
      amountNeeded: 0,
      radiusLimitKm: DELIVERY_CONFIG.MAX_DELIVERY_RADIUS_KM,
      minSubtotal: DELIVERY_CONFIG.MIN_DELIVERY_SUBTOTAL,
      reason: null
    };
  }

  // 1. Check Subtotal Requirement (>= ₹299)
  const currentSubtotal = Number(subtotal) || 0;
  const meetsMinSubtotal = currentSubtotal >= DELIVERY_CONFIG.MIN_DELIVERY_SUBTOTAL;
  const amountNeeded = Math.max(0, DELIVERY_CONFIG.MIN_DELIVERY_SUBTOTAL - currentSubtotal);

  // 2. Check Distance Radius (<= 2.0 km)
  let distanceKm = null;
  let hasCoords = false;
  let isWithinRadius = true; // default to true until valid coords are verified

  if (coords && coords.lat != null && coords.lng != null) {
    hasCoords = true;
    distanceKm = calculateDistanceKm(
      DELIVERY_CONFIG.CAFE_COORDINATES.lat,
      DELIVERY_CONFIG.CAFE_COORDINATES.lng,
      coords.lat,
      coords.lng
    );
    if (distanceKm != null) {
      isWithinRadius = distanceKm <= DELIVERY_CONFIG.MAX_DELIVERY_RADIUS_KM;
    }
  }

  const isEligible = meetsMinSubtotal && isWithinRadius;

  let reason = null;
  if (!isWithinRadius) {
    reason = `This location (${distanceKm != null ? `${distanceKm} km away` : "outside zone"}) is beyond our ${DELIVERY_CONFIG.MAX_DELIVERY_RADIUS_KM} km delivery zone. You're welcome to place a Pickup order instead!`;
  } else if (!meetsMinSubtotal) {
    reason = `Add ₹${amountNeeded} more to your cart to reach the ₹${DELIVERY_CONFIG.MIN_DELIVERY_SUBTOTAL} minimum required for delivery, or switch to Pickup.`;
  }

  return {
    isEligible,
    orderType: "delivery",
    distanceKm,
    hasCoords,
    isWithinRadius,
    meetsMinSubtotal,
    amountNeeded,
    radiusLimitKm: DELIVERY_CONFIG.MAX_DELIVERY_RADIUS_KM,
    minSubtotal: DELIVERY_CONFIG.MIN_DELIVERY_SUBTOTAL,
    reason
  };
}
