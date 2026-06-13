import { useCallback, useEffect, useState } from 'react';
import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AuthScreen from './src/screens/auth/AuthScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import SplashScreen from './src/screens/splash/SplashScreen';
import { useAuthStore } from './src/stores/authStore';

export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const initialize = useAuthStore((state) => state.initialize);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const user = useAuthStore((state) => state.user);
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Inter_700Bold,
  });

  const handleSplashFinish = useCallback(() => {
    setIsSplashVisible(false);
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!fontsLoaded) {
    return null;
  }

  const content = user ? <MainTabNavigator /> : <AuthScreen />;

  return (
    <SafeAreaProvider>
      {isSplashVisible || !isInitialized ? (
        <SplashScreen onFinish={handleSplashFinish} />
      ) : (
        content
      )}
      <StatusBar style={isSplashVisible ? 'light' : 'auto'} />
    </SafeAreaProvider>
  );
}
