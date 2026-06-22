import { useEffect, useMemo, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColors, radius, spacing } from '../../utils/theme';

function SkeletonBlock({ style, styles }) {
  return <View style={[styles.block, style]} />;
}

function PostSkeleton({ styles }) {
  return (
    <View style={styles.card}>
      <View style={styles.authorRow}>
        <SkeletonBlock style={styles.avatar} styles={styles} />
        <View style={styles.authorText}>
          <SkeletonBlock style={styles.authorName} styles={styles} />
          <SkeletonBlock style={styles.location} styles={styles} />
        </View>
      </View>

      <SkeletonBlock style={styles.captionLong} styles={styles} />
      <SkeletonBlock style={styles.captionShort} styles={styles} />
      <SkeletonBlock style={styles.postImage} styles={styles} />

      <View style={styles.actionRow}>
        <SkeletonBlock style={styles.action} styles={styles} />
        <SkeletonBlock style={styles.action} styles={styles} />
        <SkeletonBlock style={styles.actionSmall} styles={styles} />
      </View>
    </View>
  );
}

export default function HomeSkeleton() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const opacity = useRef(new Animated.Value(0.48)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.48,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity }}>
          <View style={styles.header}>
            <View>
              <SkeletonBlock style={styles.greeting} styles={styles} />
              <SkeletonBlock style={styles.heading} styles={styles} />
            </View>
            <SkeletonBlock style={styles.headerAvatar} styles={styles} />
          </View>

          <SkeletonBlock style={styles.search} styles={styles} />

          <View style={styles.sectionHeader}>
            <SkeletonBlock style={styles.sectionTitle} styles={styles} />
            <SkeletonBlock style={styles.sectionAction} styles={styles} />
          </View>

          <View style={styles.categoryRow}>
            <SkeletonBlock style={styles.category} styles={styles} />
            <SkeletonBlock style={styles.category} styles={styles} />
            <SkeletonBlock style={styles.category} styles={styles} />
          </View>

          <PostSkeleton styles={styles} />
          <PostSkeleton styles={styles} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  block: {
    backgroundColor: colors.border,
    borderRadius: radius.sm,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  greeting: {
    height: 12,
    marginBottom: spacing.sm,
    width: 92,
  },
  heading: {
    height: 25,
    width: 170,
  },
  headerAvatar: {
    borderRadius: radius.full,
    height: 44,
    width: 44,
  },
  search: {
    height: 48,
    marginBottom: spacing.lg,
    width: '100%',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    height: 18,
    width: 112,
  },
  sectionAction: {
    height: 14,
    width: 54,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  category: {
    borderRadius: radius.full,
    height: 34,
    width: 92,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  authorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  avatar: {
    borderRadius: radius.full,
    height: 42,
    width: 42,
  },
  authorText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  authorName: {
    height: 14,
    marginBottom: spacing.sm,
    width: '42%',
  },
  location: {
    height: 11,
    width: '30%',
  },
  captionLong: {
    height: 12,
    marginBottom: spacing.sm,
    width: '92%',
  },
  captionShort: {
    height: 12,
    marginBottom: spacing.md,
    width: '65%',
  },
  postImage: {
    borderRadius: radius.md,
    height: 168,
    width: '100%',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  action: {
    height: 14,
    width: 64,
  },
  actionSmall: {
    height: 14,
    marginLeft: 'auto',
    width: 28,
  },
});
