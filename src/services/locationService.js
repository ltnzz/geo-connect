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
};
