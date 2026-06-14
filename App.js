import { useCallback, useEffect, useState } from 'react';
import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AuthScreen from './src/screens/auth/AuthScreen';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/splash/SplashScreen';
import { useAuthStore } from './src/stores/authStore';
import { notificationService } from './src/services/notificationService';

notificationService.configureForegroundNotifications();

export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const initialize = useAuthStore((state) => state.initialize);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const user = useAuthStore((state) => state.user);
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const handleSplashFinish = useCallback(() => {
    setIsSplashVisible(false);
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!user?.uid) {
      return undefined;
    }

    notificationService.registerDevice(user.uid).catch((error) => {
      if (__DEV__) {
        console.warn('Unable to register FCM token:', error.message);
      }
    });

    return undefined;
  }, [user?.uid]);

  if (!fontsLoaded) {
    return null;
  }

  const content = user ? <AppNavigator /> : <AuthScreen />;

  return (
    <SafeAreaProvider>
      {isSplashVisible || !isInitialized ? (
        <SplashScreen onFinish={handleSplashFinish} />
      ) : (
        content
      )}
      <StatusBar style={isSplashVisible ? 'dark' : 'auto'} />
    </SafeAreaProvider>
  );
}
