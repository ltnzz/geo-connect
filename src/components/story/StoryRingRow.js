import React, { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, Pressable, View, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors, spacing, radius } from '../../utils/theme';

export default function StoryRingRow({
  groupedStories = [],
  onRingPress,
  onAddStoryPress,
  currentUserAvatar,
  currentUserStories = [],
  onCurrentUserRingPress,
  style,
}) {
  const hasStories = currentUserStories && currentUserStories.length > 0;
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {}
        <View style={styles.ringWrapper}>
          {hasStories ? (
            <Pressable
              onPress={onCurrentUserRingPress}
              style={styles.gradientRingOuter}
            >
              <LinearGradient
                colors={['#2563EB', '#8B5CF6', '#EC4899']}
                start={{ x: 0.0, y: 0.0 }}
                end={{ x: 1.0, y: 1.0 }}
                style={styles.gradientRing}
              >
                <View style={styles.ringInner}>
                  {currentUserAvatar ? (
                    <Image source={{ uri: currentUserAvatar }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={24} color={colors.primary} />
                    </View>
                  )}
                </View>
              </LinearGradient>

              <Pressable
                hitSlop={8}
                onPress={onAddStoryPress}
                style={styles.plusBadge}
              >
                <Ionicons name="add" size={13} color="#FFFFFF" />
              </Pressable>
            </Pressable>
          ) : (
            <Pressable
              onPress={onAddStoryPress}
              style={[
                styles.addRingBase,
                styles.addRingDashed,
              ]}
            >
              {currentUserAvatar ? (
                <Image source={{ uri: currentUserAvatar }} style={styles.avatarImage} />
              ) : (
                <View style={styles.addInner}>
                  <Ionicons
                    name="camera-outline"
                    size={26}
                    color={colors.primary}
                  />
                </View>
              )}

              <View style={styles.plusBadge}>
                <Ionicons name="add" size={13} color="#FFFFFF" />
              </View>
            </Pressable>
          )}
          <Text numberOfLines={1} style={styles.ringLabel}>
            {hasStories ? 'Your Story' : 'Add Story'}
          </Text>
        </View>

        {}
        {groupedStories.map((group) => {
          const avatarUrl = group.userAvatar;

          return (
            <View key={group.userId} style={styles.ringWrapper}>
              <Pressable onPress={() => onRingPress(group)} style={styles.gradientRingOuter}>
                <LinearGradient
                  colors={['#2563EB', '#8B5CF6', '#EC4899']}
                  start={{ x: 0.0, y: 0.0 }}
                  end={{ x: 1.0, y: 1.0 }}
                  style={styles.gradientRing}
                >
                  <View style={styles.ringInner}>
                    {avatarUrl ? (
                      <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={24} color={colors.primary} />
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </Pressable>
              <Text numberOfLines={1} style={styles.ringLabel}>
                @{group.username || 'user'}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.sm + 4,
    marginBottom: spacing.md,
  },
  scrollContent: {
    gap: 16,
    paddingHorizontal: spacing.md,
  },
  ringWrapper: {
    alignItems: 'center',
    width: 80,
  },
  gradientRingOuter: {
    height: 68,
    width: 68,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gradientRing: {
    height: 68,
    width: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    width: 60,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    width: 56,
    backgroundColor: colors.background,
    borderRadius: 28,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  addRingBase: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 68,
    width: 68,
    backgroundColor: colors.surface,
    borderRadius: 34,
  },
  addRingDashed: {
    borderColor: colors.border,
    borderRadius: 34,
    borderStyle: 'dashed',
    borderWidth: 1.5,
  },
  addInner: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  plusBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    bottom: 0,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  ringLabel: {
    color: colors.mutedText,
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    marginTop: 6,
    textAlign: 'center',
    width: '100%',
  },
});
