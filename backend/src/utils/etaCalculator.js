/**
 * Calculate the distance between two GPS coordinates using the Haversine formula.
 * @param {number} lat1 - Latitude of point 1 (decimal degrees)
 * @param {number} lon1 - Longitude of point 1 (decimal degrees)
 * @param {number} lat2 - Latitude of point 2 (decimal degrees)
 * @param {number} lon2 - Longitude of point 2 (decimal degrees)
 * @returns {number} Distance in meters
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};

/**
 * Calculate ETA between bus and student location.
 * @param {Object} busLocation - { lat, lng, speed }
 * @param {Object} studentLocation - { lat, lng }
 * @returns {Object} { distanceMeters, etaMinutes, etaSeconds }
 */
const calculateETA = (busLocation, studentLocation) => {
  if (!busLocation || !studentLocation) {
    return { distanceMeters: null, etaMinutes: null, etaSeconds: null };
  }

  const distanceMeters = haversineDistance(
    busLocation.lat,
    busLocation.lng,
    studentLocation.lat,
    studentLocation.lng
  );

  // Use actual speed if available, otherwise assume 30 km/h in city
  const speedMs = busLocation.speed > 0
    ? busLocation.speed / 3.6  // km/h to m/s
    : 8.33;                    // 30 km/h in m/s

  const etaSeconds = Math.round(distanceMeters / speedMs);
  const etaMinutes = Math.round(etaSeconds / 60);

  return {
    distanceMeters: Math.round(distanceMeters),
    etaMinutes,
    etaSeconds,
    distanceKm: (distanceMeters / 1000).toFixed(2),
  };
};

/**
 * Check if bus is within a proximity threshold of the student.
 * @param {Object} busLocation  - { lat, lng }
 * @param {Object} studentLocation - { lat, lng }
 * @param {number} thresholdMeters - default 500m
 * @returns {boolean}
 */
const isWithinProximity = (busLocation, studentLocation, thresholdMeters = 500) => {
  if (!busLocation || !studentLocation) return false;
  const dist = haversineDistance(busLocation.lat, busLocation.lng, studentLocation.lat, studentLocation.lng);
  return dist <= thresholdMeters;
};

module.exports = { haversineDistance, calculateETA, isWithinProximity };
