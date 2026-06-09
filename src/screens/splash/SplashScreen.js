import { useEffect, useRef, useState } from 'react';
import { Animated, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../../utils/theme';

const BRAND_TEXT = 'AroundU';
const TAGLINE_TEXT = "Discover What's Happening Around You";
const TYPE_SPEED = 72;

export default function SplashScreen({ onFinish }) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.88)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const [brandText, setBrandText] = useState('');
  const [taglineText, setTaglineText] = useState('');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        damping: 12,
        stiffness: 110,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }).start();
    });
  }, [logoOpacity, logoScale, textOpacity]);

  useEffect(() => {
    const timers = [];

    timers.push(
      setTimeout(() => {
        let brandIndex = 0;
        const brandTimer = setInterval(() => {
          brandIndex += 1;
          setBrandText(BRAND_TEXT.slice(0, brandIndex));

          if (brandIndex === BRAND_TEXT.length) {
            clearInterval(brandTimer);

            let taglineIndex = 0;
            const taglineTimer = setInterval(() => {
              taglineIndex += 1;
              setTaglineText(TAGLINE_TEXT.slice(0, taglineIndex));

              if (taglineIndex === TAGLINE_TEXT.length) {
                clearInterval(taglineTimer);
                timers.push(setTimeout(onFinish, 850));
              }
            }, TYPE_SPEED);

            timers.push(taglineTimer);
          }
        }, TYPE_SPEED);

        timers.push(brandTimer);
      }, 900),
    );

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [onFinish]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoMark,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Text style={styles.logoText}>A</Text>
        </Animated.View>

        <Animated.View style={[styles.textGroup, { opacity: textOpacity }]}>
          <View style={styles.brandLine}>
            <Text style={[styles.brand, styles.hiddenText]}>{BRAND_TEXT}</Text>
            <Text style={[styles.brand, styles.typedText]}>
              {brandText}
              <Text style={styles.cursor}>{brandText.length < BRAND_TEXT.length ? '|' : ''}</Text>
            </Text>
          </View>

          <View style={styles.taglineLine}>
            <Text style={[styles.tagline, styles.hiddenText]}>{TAGLINE_TEXT}</Text>
            <Text style={[styles.tagline, styles.typedText]}>
              {taglineText}
              <Text style={styles.cursor}>
                {brandText.length === BRAND_TEXT.length && taglineText.length < TAGLINE_TEXT.length
                  ? '|'
                  : ''}
              </Text>
            </Text>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logoMark: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    height: 88,
    justifyContent: 'center',
    marginBottom: spacing.xl,
    width: 88,
  },
  logoText: {
    color: colors.primary,
    fontSize: 44,
    fontWeight: '700',
  },
  textGroup: {
    alignItems: 'center',
    minHeight: 92,
  },
  brandLine: {
    position: 'relative',
  },
  brand: {
    color: colors.surface,
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    lineHeight: 48,
  },
  taglineLine: {
    marginTop: spacing.sm,
    maxWidth: 320,
    position: 'relative',
  },
  tagline: {
    color: '#DBEAFE',
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    lineHeight: 24,
    minHeight: 48,
  },
  hiddenText: {
    opacity: 0,
  },
  typedText: {
    left: 0,
    position: 'absolute',
    top: 0,
  },
  cursor: {
    color: colors.secondary,
    fontFamily: 'Poppins_400Regular',
  },
});
