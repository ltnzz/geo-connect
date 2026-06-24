import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const NEARBY_OPT_IN_KEY = '@aroundu:nearby-location-enabled';

export const locationService = {
  async isNearbyEnabled() {
    return (await AsyncStorage.getItem(NEARBY_OPT_IN_KEY)) === 'true';
  },

  async setNearbyEnabled(enabled) {
    await AsyncStorage.setItem(NEARBY_OPT_IN_KEY, String(enabled));
  },

  async getPermissionStatus() {
    return Location.getForegroundPermissionsAsync();
  },

  async requestForegroundPermission() {
    return Location.requestForegroundPermissionsAsync();
  },

  async getCurrentPosition() {
    const lastKnown = await Location.getLastKnownPositionAsync({
      maxAge: 2 * 60 * 1000,
      requiredAccuracy: 500,
    });

    if (lastKnown) {
      return lastKnown;
    }

    return Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      mayShowUserSettingsDialog: true,
    });
  },

  async reverseGeocode(latitude, longitude) {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results && results.length > 0) {
        return results[0].city || results[0].subregion || results[0].region || '';
      }
      return '';
    } catch {
      return '';
    }
  },

  async requestBackgroundPermission() {
    return Location.requestBackgroundPermissionsAsync();
  },

  async startBackgroundLocationUpdates(taskName) {
    const isTaskDefined = await Location.hasStartedLocationUpdatesAsync(taskName);
    if (!isTaskDefined) {
      await Location.startLocationUpdatesAsync(taskName, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 60000,
        distanceInterval: 100,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'Location Tracking',
          notificationBody: 'AroundU is tracking your location to find nearby events.',
        },
      });
    }
  },

  async stopBackgroundLocationUpdates(taskName) {
    const isTaskDefined = await Location.hasStartedLocationUpdatesAsync(taskName);
    if (isTaskDefined) {
      await Location.stopLocationUpdatesAsync(taskName);
    }
  },
};
