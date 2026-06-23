import { useEffect, useRef, useMemo } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
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
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;
  const logoTranslateY = useRef(new Animated.Value(12)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandTranslateY = useRef(new Animated.Value(10)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(8)).current;

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
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          damping: 16,
          stiffness: 130,
          mass: 0.8,
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(brandOpacity, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(brandTranslateY, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslateY, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(2040),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        onFinish();
      }
    });

    return () => animation.stop();
  }, [
    brandOpacity,
    brandTranslateY,
    logoOpacity,
    logoScale,
    logoTranslateY,
    onFinish,
    taglineOpacity,
    taglineTranslateY,
  ]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [
                { translateY: logoTranslateY },
                { scale: logoScale },
              ],
            },
          ]}
        >
          <BrandMark size={150} />
        </Animated.View>

        <Animated.Text
          style={[
            styles.brand,
            {
              opacity: brandOpacity,
              transform: [{ translateY: brandTranslateY }],
            },
          ]}
        >
          {BRAND_TEXT}
        </Animated.Text>

        <Animated.Text
          style={[
            styles.tagline,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineTranslateY }],
            },
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
