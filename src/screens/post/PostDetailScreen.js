import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import ScreenHeader from '../../components/common/ScreenHeader';
import { useAuthStore } from '../../stores/authStore';
import { useFeedStore } from '../../stores/feedstore';
import { formatCount, formatRelativeTime } from '../../utils/format';
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

const orderPostsFromSelection = (posts, initialPostId) => {
  const selectedIndex = posts.findIndex((post) => post.id === initialPostId);

  if (selectedIndex <= 0) {
    return posts;
  }

  return [...posts.slice(selectedIndex), ...posts.slice(0, selectedIndex)];
};

function CommentItem({ comment, currentUserId, onDelete }) {
  const isOwnComment = comment.userId === currentUserId;
  const author = comment.authorName || comment.author?.username || 'AroundU user';

  return (
    <View style={styles.commentRow}>
      <View style={styles.commentAvatar}>
        {comment.authorAvatar ? (
          <Image source={{ uri: comment.authorAvatar }} style={styles.avatarImage} />
        ) : (
          <Ionicons color="#9AA5B5" name="person" size={15} />
        )}
      </View>
      <View style={styles.commentBubble}>
        <View style={styles.commentHeader}>
          <Text numberOfLines={1} style={styles.commentAuthor}>
            {author}
          </Text>
          {comment._pending ? (
            <Text style={styles.pendingText}>Sending</Text>
          ) : null}
        </View>
        <Text style={styles.commentText}>{comment.content}</Text>
        {isOwnComment && !comment._pending ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => onDelete(comment.id)}
            style={styles.deleteCommentButton}
          >
            <Text style={styles.deleteCommentText}>Delete</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function PostDetailCard({ post }) {
  const author = post.author || post.authorName || post.username || 'AroundU user';

  return (
    <View style={styles.post}>
      <View style={styles.authorRow}>
        <View style={styles.avatar}>
          {post.authorAvatar || post.authorAvatarUrl ? (
            <Image
              source={{ uri: post.authorAvatar || post.authorAvatarUrl }}
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

        <Text style={styles.time}>{formatRelativeTime(post.createdAt)}</Text>
      </View>

      <View style={[styles.media, { backgroundColor: post.color || '#DCE4EF' }]}>
        {post.imageUrl ? (
          <Image source={{ uri: post.imageUrl }} style={styles.mediaImage} />
        ) : (
          <Ionicons color="rgba(255,255,255,0.72)" name="image-outline" size={54} />
        )}
      </View>

      <View style={styles.actions}>
        <View style={styles.action}>
          <Ionicons
            color={post.isLiked ? colors.danger : colors.text}
            name={post.isLiked ? 'heart' : 'heart-outline'}
            size={23}
          />
          <Text style={styles.actionText}>{formatCount(post.likesCount || 0)}</Text>
        </View>
        <View style={styles.action}>
          <Ionicons color={colors.text} name="chatbubble-outline" size={22} />
          <Text style={styles.actionText}>{formatCount(post.commentsCount || 0)}</Text>
        </View>
      </View>

      <Text style={styles.caption}>
        {post.caption || 'Shared a moment around the city.'}
      </Text>
    </View>
  );
}

export default function PostDetailScreen({ route }) {
  const routePosts = route.params?.posts || [];
  const initialPostId = route.params?.initialPostId || route.params?.postId;
  const feedPosts = useFeedStore((state) => state.posts);
  const currentUser = useAuthStore((state) => state.user);
  const commentsByPost = useFeedStore((state) => state.commentsByPost);
  const commentsLoadingByPost = useFeedStore((state) => state.commentsLoadingByPost);
  const fetchComments = useFeedStore((state) => state.fetchComments);
  const addComment = useFeedStore((state) => state.addComment);
  const deleteComment = useFeedStore((state) => state.deleteComment);
  const [draft, setDraft] = useState('');

  const posts = useMemo(() => {
    const combinedPosts = routePosts.length ? routePosts : feedPosts;
    return orderPostsFromSelection(combinedPosts, initialPostId);
  }, [feedPosts, initialPostId, routePosts]);
  const post = posts[0];
  const postId = post?.id || initialPostId;
  const comments = commentsByPost[postId] || [];
  const isLoadingComments = !!commentsLoadingByPost[postId];

  useEffect(() => {
    if (postId) {
      fetchComments(postId);
    }
  }, [fetchComments, postId]);

  const handleSendComment = () => {
    if (!currentUser?.uid || !postId || !draft.trim()) {
      return;
    }

    addComment(postId, {
      userId: currentUser.uid,
      content: draft,
      author: {
        username: currentUser.username || 'You',
        avatarUrl: currentUser.avatarUrl || '',
      },
    });
    setDraft('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScreenHeader title="Post" showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {post ? (
          <PostDetailCard post={post} />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons color="#AAB2C0" name="image-outline" size={34} />
            <Text style={styles.emptyText}>Post is not available.</Text>
          </View>
        )}

        <View style={styles.commentsSection}>
          <Text style={styles.sectionTitle}>Comments</Text>
          {isLoadingComments ? (
            <ActivityIndicator color={colors.primary} style={styles.commentLoader} />
          ) : null}
          {!isLoadingComments && comments.length === 0 ? (
            <Text style={styles.noComments}>No comments yet. Start the conversation.</Text>
          ) : null}
          {comments.map((comment) => (
            <CommentItem
              comment={comment}
              currentUserId={currentUser?.uid}
              key={comment.id}
              onDelete={(commentId) => deleteComment(postId, commentId)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          editable={!!currentUser?.uid && !!postId}
          onChangeText={setDraft}
          placeholder={currentUser?.uid ? 'Add a comment...' : 'Login to comment'}
          placeholderTextColor="#9AA5B5"
          style={styles.commentInput}
          value={draft}
        />
        <Pressable
          accessibilityRole="button"
          disabled={!draft.trim() || !currentUser?.uid || !postId}
          onPress={handleSendComment}
          style={[styles.sendButton, (!draft.trim() || !currentUser?.uid) && styles.sendDisabled]}
        >
          <Ionicons color="#FFFFFF" name="send" size={18} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FBFCFF',
    flex: 1,
  },
  content: {
    paddingBottom: spacing.lg,
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
  time: {
    color: colors.neutral,
    fontFamily: 'Poppins_400Regular',
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
  caption: {
    color: colors.text,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
  },
  commentsSection: {
    padding: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    marginBottom: spacing.md,
  },
  commentLoader: {
    marginVertical: spacing.md,
  },
  noComments: {
    color: colors.neutral,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
  commentRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  commentAvatar: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: radius.full,
    height: 34,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 34,
  },
  commentBubble: {
    backgroundColor: colors.surface,
    borderColor: '#E1E7F0',
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    marginLeft: spacing.sm,
    padding: spacing.sm,
  },
  commentHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commentAuthor: {
    color: colors.text,
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  pendingText: {
    color: colors.neutral,
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
  },
  commentText: {
    color: '#526173',
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  deleteCommentButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  deleteCommentText: {
    color: colors.danger,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
  },
  composer: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopColor: '#E1E7F0',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  commentInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#D9E0EB',
    borderRadius: radius.full,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  sendDisabled: {
    opacity: 0.45,
  },
  emptyState: {
    alignItems: 'center',
    minHeight: 240,
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.neutral,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    marginTop: spacing.sm,
  },
});
