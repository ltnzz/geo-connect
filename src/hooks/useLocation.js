import * as Location from 'expo-location';
import { create } from 'zustand';
import { locationService } from '../services/locationService';

const useLocationStore = create((set, get) => ({
  location: null,
  isFetchingLocation: false,
  locationError: null,

  handleGetLocation: async () => {
    if (get().isFetchingLocation) return;
    set({ isFetchingLocation: true, locationError: null });
    try {
      let { status } = await locationService.requestForegroundPermission();
      if (status !== 'granted') {
        set({ locationError: 'Location permission denied.', isFetchingLocation: false });
        return;
      }

      let currentPos = await locationService.getCurrentPosition();
      let city = 'Nearby';
      let address = 'Current Location';

      try {
        let geocode = await Location.reverseGeocodeAsync({
          latitude: currentPos.coords.latitude,
          longitude: currentPos.coords.longitude,
        });

        if (geocode && geocode.length > 0) {
          const place = geocode[0];
          city = place.city || place.subregion || 'Nearby';
          address = place.street || place.name || 'Current Location';
        }
      } catch (err) {
        console.warn('Reverse geocoding failed, using coordinates only:', err);
      }

      set({
        location: {
          latitude: currentPos.coords.latitude,
          longitude: currentPos.coords.longitude,
          city,
          address,
        },
        isFetchingLocation: false,
      });
    } catch (err) {
      set({
        locationError: 'Failed to get location. Make sure GPS is enabled.',
        isFetchingLocation: false,
      });
    }
  },

  clearLocation: () => {
    set({ location: null, locationError: null });
  },
}));

export function useLocation() {
  return useLocationStore();
}
