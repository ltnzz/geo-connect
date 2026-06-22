import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '../../stores/authStore';
import { useFeedStore } from '../../stores/feedstore';
import { colors, radius, spacing } from '../../utils/theme';
import { formatCount, formatRelativeTime } from '../../utils/format';

export default function PostCard({ post }) {
  const navigation = useNavigation();
  const currentUserId = useAuthStore((s) => s.user?.uid);
  const toggleLike = useFeedStore((s) => s.toggleLike);

  const locationLabel =
    post?.location?.address || post?.location?.city || 'Around you';

  if (!post) return null;

  const handleLike = () => {
    if (!currentUserId) return;
    toggleLike(post.id, currentUserId);
  };

  const handleLikePress = (event) => {
    event.stopPropagation?.();
    handleLike();
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

        <Pressable
          onPress={() =>
            navigation.navigate('UserDetail', {
              userId: post.userId || post.authorId || post.ownerId,
            })
          }
        >
          {post.authorAvatar ? (
            <Image
              source={{ uri: post.authorAvatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons
                name="person"
                size={20}
                color={colors.mutedText}
              />
            </View>
          )}
        </Pressable>

          <Pressable
    onPress={() =>
      navigation.navigate('UserDetail', {
        userId: post.userId || post.authorId || post.ownerId,
      })
    }
  >
    <Text style={styles.userName}>
      {post.authorName}
    </Text>

    <View style={styles.locationRow}>
      <Ionicons
        color={colors.primary}
        name="location-outline"
        size={12}
      />
      <Text style={styles.locationText}>
        {locationLabel}
      </Text>
    </View>
  </Pressable>

        </View>

        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>{post.distance ?? '0 km'}</Text>
        </View>
      </View>

      {post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: post.color ?? '#E2E8F0' }]} />
      )}

      <View style={styles.footer}>
        <View style={styles.actionsRow}>
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

        <Text style={styles.description}>{post.caption}</Text>

        <View style={styles.timeBadge}>
          <Text style={styles.timeText}>{formatRelativeTime(post.createdAt)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#F1F5F9',
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
    backgroundColor: '#DBEAFE',
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
    backgroundColor: '#E2E8F0',
    height: 240,
    width: '100%',
  },
  image: {
    backgroundColor: '#E2E8F0',
    height: 240,
    width: '100%',
  },
  footer: {
    padding: spacing.md,
  },
  actionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
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
    backgroundColor: '#F1F5F9',
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
