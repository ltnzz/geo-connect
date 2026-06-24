
/**
 * Calculates the straight-line distance between two geographical points using the Haversine formula.
 * 
 * @param {number} lat1 - Latitude of the first point.
 * @param {number} lon1 - Longitude of the first point.
 * @param {number} lat2 - Latitude of the second point.
 * @param {number} lon2 - Longitude of the second point.
 * @returns {number|null} The distance in kilometers, or null if any coordinate is missing.
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;

  const R = 6371; 
  const dLat = deg2rad(lat2 - lat1);  
  const dLon = deg2rad(lon2 - lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; 
  return d;
}


/**
 * Converts degrees to radians.
 * 
 * @param {number} deg - The angle in degrees.
 * @returns {number} The angle in radians.
 */
function deg2rad(deg) {
  return deg * (Math.PI/180);
}


/**
 * Formats the distance between a user and an event into a readable string.
 * 
 * @param {{latitude: number, longitude: number}|null} userLocation - The user's current location.
 * @param {{latitude: number, longitude: number}|null} eventLocation - The event's or venue's location.
 * @param {boolean} [isFetching=false] - Whether the location is still being fetched.
 * @returns {string} A human-readable distance string (e.g., '2.5 km away' or 'Nearby').
 */
export function formatDistanceString(userLocation, eventLocation, isFetching) {
  if (isFetching) return 'Calculating...';

  const dist = userLocation && eventLocation ? calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    eventLocation.latitude,
    eventLocation.longitude
  ) : null;

  return dist !== null ? `${dist.toFixed(1)} km away` : 'Nearby';
}
