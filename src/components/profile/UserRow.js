import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, radius, spacing } from '../../utils/theme';

export default function UserRow({ 
  user, 
  currentUserId, 
  isFollowing, 
  onFollowPress, 
  showFollowButton = false 
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const targetUserId = user.id || user.uid;
  const isOwnUser = currentUserId === targetUserId;

  return (
    <View style={styles.personRow}>
      <View style={styles.avatar}>
        {user.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
        ) : (
          <Ionicons color={colors.neutral} name="person-outline" size={25} />
        )}
      </View>
      <View style={styles.personInfo}>
        <Text numberOfLines={1} style={styles.personName}>
          @{user.username || 'aroundu'}
        </Text>
        <Text numberOfLines={1} style={styles.personUsername}>
          {user.city || 'AroundU'}
        </Text>
      </View>
      {showFollowButton && !isOwnUser && targetUserId && onFollowPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onFollowPress(currentUserId, targetUserId)}
          style={[styles.followButton, isFollowing && styles.followingButton]}
        >
          <Text style={[styles.followText, isFollowing && styles.followingText]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  personRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    padding: 12,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 48,
  },
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  personInfo: {
    flex: 1,
    marginLeft: 12,
  },
  personName: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  personUsername: {
    color: colors.neutral,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  followButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  followingButton: {
    backgroundColor: `${colors.primary}1A`,
  },
  followText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
  },
  followingText: {
    color: colors.primary,
  },
});
