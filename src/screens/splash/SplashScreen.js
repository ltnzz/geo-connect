import { useEffect, useMemo } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import BrandMark from '../../components/common/BrandMark';
import { useColors, spacing } from '../../utils/theme';

const BRAND_TEXT = 'AroundU';
const TAGLINE_TEXT = "Discover What's Happening Around You";
const SPLASH_SOUND = require('../../../assets/audio/splash.wav');
const SPLASH_AUDIO_START_SECONDS = 0;
const SPLASH_AUDIO_END_SECONDS = 2;
const SPLASH_AUDIO_DURATION_MS =
  (SPLASH_AUDIO_END_SECONDS - SPLASH_AUDIO_START_SECONDS) * 1000;

export default function SplashScreen({ onFinish }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const splashPlayer = useAudioPlayer(SPLASH_SOUND);
  
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.92);
  const logoTranslateY = useSharedValue(12);
  
  const brandOpacity = useSharedValue(0);
  const brandTranslateY = useSharedValue(10);
  
  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(8);

  useEffect(() => {
    setAudioModeAsync({
      interruptionMode: 'mixWithOthers',
      playsInSilentMode: true,
    }).catch(() => {});

    try {
      splashPlayer.volume = 0.28;
      splashPlayer.seekTo(SPLASH_AUDIO_START_SECONDS).catch(() => {});
      splashPlayer.play();
    } catch {
      
    }

    const stopTimer = setTimeout(() => {
      try {
        splashPlayer.pause();
        splashPlayer.seekTo(SPLASH_AUDIO_START_SECONDS).catch(() => {});
      } catch {}
    }, SPLASH_AUDIO_DURATION_MS);

    return () => {
      clearTimeout(stopTimer);
      try {
        splashPlayer.pause();
        splashPlayer.seekTo(SPLASH_AUDIO_START_SECONDS).catch(() => {});
      } catch {}
    };
  }, [splashPlayer]);

  useEffect(() => {
    // Logo Sequence (starts immediately)
    logoOpacity.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSpring(1, { damping: 16, stiffness: 130, mass: 0.8 });
    logoTranslateY.value = withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) });

    // Brand Sequence (starts after a short delay to overlap with logo)
    brandOpacity.value = withDelay(420, withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) }));
    brandTranslateY.value = withDelay(420, withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) }));

    // Tagline Sequence (starts after brand)
    taglineOpacity.value = withDelay(700, withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) }));
    taglineTranslateY.value = withDelay(700, withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) }));

    // Total sequence length was ~2040 in the old Animated implementation.
    // Call onFinish after the delay.
    setTimeout(() => {
      onFinish();
    }, 2040);

  }, [onFinish]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { translateY: logoTranslateY.value },
      { scale: logoScale.value },
    ],
  }));

  const brandAnimatedStyle = useAnimatedStyle(() => ({
    opacity: brandOpacity.value,
    transform: [{ translateY: brandTranslateY.value }],
  }));

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            logoAnimatedStyle,
          ]}
        >
          <BrandMark size={150} />
        </Animated.View>

        <Animated.Text
          style={[
            styles.brand,
            brandAnimatedStyle,
          ]}
        >
          {BRAND_TEXT}
        </Animated.Text>

        <Animated.Text
          style={[
            styles.tagline,
            taglineAnimatedStyle,
          ]}
        >
          {TAGLINE_TEXT}
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  brand: {
    color: colors.text,
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    letterSpacing: -0.32,
    lineHeight: 40,
    textAlign: 'center',
  },
  tagline: {
    color: colors.mutedText,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    marginTop: spacing.sm,
    maxWidth: 320,
    textAlign: 'center',
  },
});
