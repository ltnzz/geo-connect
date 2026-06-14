import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { db } from '../config/firebase';
import { COLLECTIONS, SUBCOLLECTIONS } from '../constants/firestore';

const CHANNEL_ID = 'social';

const getTokenReference = async (userId, token) => {
  const tokenId = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    token,
  );

  return doc(
    db,
    COLLECTIONS.users,
    userId,
    SUBCOLLECTIONS.pushTokens,
    tokenId,
  );
};

export const notificationService = {
  configureForegroundNotifications() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  },

  async registerDevice(userId) {
    if (Platform.OS === 'web' || !Device.isDevice) {
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Social activity',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 150, 250],
      });
    }

    const currentPermissions = await Notifications.getPermissionsAsync();
    const permissions =
      currentPermissions.status === 'granted'
        ? currentPermissions
        : await Notifications.requestPermissionsAsync();

    if (permissions.status !== 'granted') {
      return null;
    }

    const pushToken = await Notifications.getDevicePushTokenAsync();
    if (pushToken.type !== 'fcm' || !pushToken.data) {
      return null;
    }

    const tokenRef = await getTokenReference(userId, pushToken.data);
    await setDoc(
      tokenRef,
      {
        token: pushToken.data,
        platform: Platform.OS,
        deviceName: Device.deviceName || '',
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    return pushToken.data;
  },

  async unregisterDevice(userId) {
    if (Platform.OS === 'web' || !Device.isDevice) {
      return;
    }

    const pushToken = await Notifications.getDevicePushTokenAsync().catch(
      () => null,
    );

    if (pushToken?.type !== 'fcm' || !pushToken.data) {
      return;
    }

    const tokenRef = await getTokenReference(userId, pushToken.data);
    await deleteDoc(tokenRef).catch(() => {});
  },
};
