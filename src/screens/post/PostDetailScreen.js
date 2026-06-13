import { Ionicons } from '@expo/vector-icons';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import ScreenHeader from '../../components/common/ScreenHeader';
import { colors, radius, spacing } from '../../utils/theme';

const getLocationLabel = (post) => {
  if (typeof post?.location === 'string') {
    return post.location;
  }

  return (
    post?.location?.name ||
    post?.location?.address ||
    post?.placeName ||
    post?.city ||
    'AroundU'
  );
};

const formatCreatedAt = (post) => {
  if (post?.time) {
    return post.time;
  }

  const date = post?.createdAt?.toDate?.();
  return date
    ? date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Recently';
};

const orderPostsFromSelection = (posts, initialPostId) => {
  const selectedIndex = posts.findIndex((post) => post.id === initialPostId);

  if (selectedIndex <= 0) {
    return posts;
  }

  return [
    ...posts.slice(selectedIndex),
    ...posts.slice(0, selectedIndex),
  ];
};

function ProfilePost({ post }) {
  const author =
    post.author || post.authorName || post.username || 'AroundU user';
  const likes = post.likes ?? post.likesCount ?? 0;
  const comments = post.comments ?? post.commentsCount ?? 0;

  return (
    <View style={styles.post}>
      <View style={styles.authorRow}>
        <View style={styles.avatar}>
          {post.authorAvatarUrl ? (
            <Image
              source={{ uri: post.authorAvatarUrl }}
              style={styles.avatarImage}
            />
          ) : (
            <Ionicons color="#A9B4C5" name="person-outline" size={25} />
          )}
        </View>

        <View style={styles.authorInfo}>
          <Text numberOfLines={1} style={styles.author}>
            {author}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons color={colors.primary} name="location-outline" size={13} />
            <Text numberOfLines={1} style={styles.location}>
              {getLocationLabel(post)}
            </Text>
          </View>
        </View>

        {post.distance ? (
          <View style={styles.distanceBadge}>
            <Text style={styles.distance}>{post.distance}</Text>
          </View>
        ) : null}
      </View>

      <View
        style={[
          styles.media,
          { backgroundColor: post.color || '#DCE4EF' },
        ]}
      >
        {post.imageUrl ? (
          <Image source={{ uri: post.imageUrl }} style={styles.mediaImage} />
        ) : (
          <Ionicons
            color="rgba(255,255,255,0.72)"
            name="image-outline"
            size={54}
          />
        )}
      </View>

      <View style={styles.actions}>
        <View style={styles.action}>
          <Ionicons color={colors.text} name="heart-outline" size={23} />
          <Text style={styles.actionText}>{likes}</Text>
        </View>
        <View style={styles.action}>
          <Ionicons color={colors.text} name="chatbubble-outline" size={22} />
          <Text style={styles.actionText}>{comments}</Text>
        </View>
        <Ionicons
          color={colors.text}
          name="bookmark-outline"
          size={23}
          style={styles.bookmark}
        />
      </View>

      <Text style={styles.caption}>
        {post.caption || 'Shared a moment around the city.'}
      </Text>
      <Text style={styles.time}>{formatCreatedAt(post)}</Text>
    </View>
  );
}

export default function PostDetailScreen({ route }) {
  const routePosts = route.params?.posts || [];
  const posts = orderPostsFromSelection(
    routePosts,
    route.params?.initialPostId,
  );

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Posts" showBack />

      <ScrollView showsVerticalScrollIndicator={false}>
        {posts.map((post) => (
          <ProfilePost key={post.id} post={post} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FBFCFF',
    flex: 1,
  },
  post: {
    backgroundColor: colors.surface,
    borderBottomColor: '#E8EDF4',
    borderBottomWidth: 8,
    paddingBottom: spacing.md,
  },
  authorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: spacing.md,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: radius.md,
    height: 46,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 46,
  },
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  authorInfo: {
    flex: 1,
    marginLeft: 10,
  },
  author: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 1,
  },
  location: {
    color: colors.neutral,
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    marginLeft: 2,
  },
  distanceBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: radius.full,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  distance: {
    color: colors.primary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
  },
  media: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  mediaImage: {
    height: '100%',
    width: '100%',
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  action: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    marginRight: spacing.md,
  },
  actionText: {
    color: colors.text,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
  },
  bookmark: {
    marginLeft: 'auto',
  },
  caption: {
    color: colors.text,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
  },
  time: {
    color: colors.neutral,
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
});
