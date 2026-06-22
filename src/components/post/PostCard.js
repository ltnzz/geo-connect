import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { memo, useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '../../stores/authStore';
import { useFeedStore } from '../../stores/feedstore';
import { useColors, radius, spacing } from '../../utils/theme';
import { formatCount, formatRelativeTime } from '../../utils/format';
import { useLocation } from '../../hooks/useLocation';
import { calculateDistance } from '../../utils/locationUtils';


const PostCard = memo(function PostCard({ post }) {
  const navigation = useNavigation();
  const currentUserId = useAuthStore((s) => s.user?.uid);
  const toggleLike = useFeedStore((s) => s.toggleLike);
  const toggleBookmark = useFeedStore((s) => s.toggleBookmark);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const userLocation = useLocation((s) => s.location);

  const distanceLabel = useMemo(() => {
    if (!post) return null;

    if (post.distance && typeof post.distance === 'string' && post.distance !== '0 km') {
      return post.distance;
    }

    if (!userLocation || !post.location?.latitude || !post.location?.longitude) {
      return null;
    }

    const dist = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      post.location.latitude,
      post.location.longitude
    );

    if (dist === null) return null;

    if (dist < 1) {
      const meters = Math.round(dist * 1000);
      return `${meters}m away`;
    }
    return `${dist.toFixed(1)} km away`;
  }, [userLocation, post]);

  const locationLabel =
    post?.location?.address || post?.location?.city || 'Around you';

  if (!post) return null;


  const handleLike = () => {
    if (!currentUserId) return;
    toggleLike(post.id, currentUserId, post);
  };

  const handleLikePress = (event) => {
    event.stopPropagation?.();
    handleLike();
  };

  const handleBookmark = () => {
    if (!currentUserId) return;
    toggleBookmark(post.id, currentUserId, post);
  };

  const handleBookmarkPress = (event) => {
    event.stopPropagation?.();
    handleBookmark();
  };

  const handleOpenDetail = () => {
    navigation.navigate('PostDetail', {
      initialPostId: post.id,
      postId: post.id,
      posts: [post],
    });
  };

  return (
    <Pressable onPress={handleOpenDetail} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.userInfo}>

          {post.authorAvatar ? (
            <Image source={{ uri: post.authorAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={20} color={colors.mutedText} />
            </View>
          )}

          <View>
            <Text style={styles.userName}>{post.authorName}</Text>

            <View style={styles.locationRow}>
              <Ionicons color={colors.primary} name="location-outline" size={12} />
              <Text style={styles.locationText}>{locationLabel}</Text>
            </View>
          </View>
        </View>

        {distanceLabel ? (
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{distanceLabel}</Text>
          </View>
        ) : null}
      </View>

      {post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: post.color ?? '#E2E8F0' }]} />
      )}

      <View style={styles.footer}>
        <View style={styles.actionsRow}>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Pressable hitSlop={8} onPress={handleLikePress} style={styles.actionItem}>
              <Ionicons
                color={post.isLiked ? colors.danger : colors.text}
                name={post.isLiked ? 'heart' : 'heart-outline'}
                size={20}
              />
              <Text style={styles.actionText}>{formatCount(post.likesCount || 0)}</Text>
            </Pressable>

            <Pressable
              hitSlop={8}
              onPress={(event) => {
                event.stopPropagation?.();
                handleOpenDetail();
              }}
              style={styles.actionItem}
            >
              <Ionicons color={colors.text} name="chatbubble-outline" size={20} />
              <Text style={styles.actionText}>{formatCount(post.commentsCount || 0)}</Text>
            </Pressable>
          </View>

          <Pressable hitSlop={8} onPress={handleBookmarkPress} style={styles.actionItem}>
            <Ionicons
              color={post.isBookmarked ? colors.primary : colors.text}
              name={post.isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={20}
            />
          </Pressable>
        </View>

        <Text style={styles.description}>{post.caption}</Text>

        <View style={styles.timeBadge}>
          <Text style={styles.timeText}>{formatRelativeTime(post.createdAt)}</Text>
        </View>
      </View>
    </Pressable>
  );
});

export default PostCard;

const makeStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  userInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  avatar: {
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 40,
    width: 40,
  },
  avatarPlaceholder: {
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    color: colors.text,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  locationText: {
    color: colors.mutedText,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  distanceBadge: {
    backgroundColor: colors.primary + '1a',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  distanceText: {
    color: colors.primary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  imagePlaceholder: {
    height: 240,
    width: '100%',
  },
  image: {
    backgroundColor: colors.border,
    height: 240,
    width: '100%',
  },
  footer: {
    padding: spacing.md,
  },
  actionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  actionItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  actionText: {
    color: colors.text,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
  description: {
    color: colors.text,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  timeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timeText: {
    color: colors.mutedText,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
