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

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

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
