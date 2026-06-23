import { useCallback, useEffect, useState } from 'react';
import {
  Poppins_400Regular,
  Poppins_500Medium,
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
import { useThemeStore } from './src/stores/themeStore';
import { notificationService } from './src/services/notificationService';
import { useColors } from './src/utils/theme';
import { useNotificationStore } from './src/stores/notificationStore';

notificationService.configureForegroundNotifications();

export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const initialize = useAuthStore((state) => state.initialize);
  const initializeTheme = useThemeStore((state) => state.initializeTheme);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const themeMode = useThemeStore((state) => state.mode);
  const user = useAuthStore((state) => state.user);
  const startListening = useNotificationStore((state) => state.startListening);
  const stopListening = useNotificationStore((state) => state.stopListening);
  const colors = useColors();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
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
    initializeTheme();
  }, [initialize, initializeTheme]);

  useEffect(() => {
    if (!user?.uid) {
      return undefined;
    }

    startListening(user.uid);
    notificationService.registerDevice(user.uid).catch((error) => {
      if (__DEV__) {
        console.warn('Unable to register FCM token:', error.message);
      }
    });

    return () => stopListening();
  }, [user?.uid, startListening, stopListening]);

  if (!fontsLoaded) {
    return null;
  }

  const content = user ? <AppNavigator /> : <AuthScreen />;

  return (
    <SafeAreaProvider style={{ backgroundColor: colors.background, flex: 1 }}>
      {isSplashVisible || !isInitialized ? (
        <SplashScreen onFinish={handleSplashFinish} />
      ) : (
        content
      )}
      <StatusBar style={themeMode === 'light' ? 'dark' : 'light'} />
    </SafeAreaProvider>
  );
}
