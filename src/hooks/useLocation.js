import * as Location from 'expo-location';
import { useState } from 'react';

export function useLocation() {
  const [location, setLocation] = useState(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const handleGetLocation = async () => {
    setIsFetchingLocation(true);
    setLocationError(null);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied.');
        setIsFetchingLocation(false);
        return;
      }

      let currentPos = await Location.getCurrentPositionAsync({});
      let geocode = await Location.reverseGeocodeAsync({
        latitude: currentPos.coords.latitude,
        longitude: currentPos.coords.longitude,
      });

      if (geocode.length > 0) {
        const place = geocode[0];
        setLocation({
          latitude: currentPos.coords.latitude,
          longitude: currentPos.coords.longitude,
          city: place.city || place.subregion,
          address: place.street || place.name || 'Current Location',
        });
      }
    } catch (err) {
      setLocationError('Failed to get location. Make sure GPS is enabled.');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  return { location, isFetchingLocation, locationError, handleGetLocation };
}
