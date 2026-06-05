import { requestForegroundLocation } from '../services/locationService';
import { useLocationStore } from '../stores/locationStore';

export function useLocation() {
  const currentLocation = useLocationStore((state) => state.currentLocation);
  const setCurrentLocation = useLocationStore((state) => state.setCurrentLocation);

  async function requestAndSaveLocation() {
    const location = await requestForegroundLocation();

    if (location) {
      setCurrentLocation(location);
    }

    return location;
  }

  return {
    currentLocation,
    requestAndSaveLocation,
  };
}
