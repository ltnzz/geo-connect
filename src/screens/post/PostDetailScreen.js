import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    post?.location?.address ||
    post?.location?.city ||
    post?.placeName ||
    'AroundU'
  );
};

function CommentRow({ comment, isReply, canDelete, onDelete, onReply }) {
  return (
    <View style={[styles.commentRow, isReply && styles.commentRowReply]}>
      {comment.authorAvatar ? (
        <Image
          source={{ uri: comment.authorAvatar }}
          style={[styles.commentAvatar, isReply && styles.commentAvatarReply]}
        />
      ) : (
        <View
          style={[
            styles.commentAvatar,
            isReply && styles.commentAvatarReply,
            styles.commentAvatarPlaceholder,
          ]}
        >
          <Ionicons name="person" size={isReply ? 13 : 16} color={colors.mutedText} />
        </View>
      )}

      <View style={styles.commentBody}>
        <View style={styles.commentHeaderRow}>
          <Text style={styles.commentAuthor}>
            {comment.authorName || 'Anonymous'}
          </Text>
          <Text style={styles.commentTime}>
            {formatRelativeTime(comment.createdAt)}
          </Text>
        </View>

        {isReply && comment.replyToAuthorName ? (
          <View style={styles.mentionTag}>
            <Text style={styles.mentionTagText}>@{comment.replyToAuthorName}</Text>
          </View>
        ) : null}

        <Text style={styles.commentContent}>{comment.content}</Text>

        <Pressable hitSlop={8} onPress={onReply} style={styles.replyButton}>
          <Text style={styles.replyButtonText}>Balas</Text>
        </Pressable>
      </View>

      {canDelete ? (
        <Pressable hitSlop={8} onPress={onDelete} style={styles.commentDelete}>
          <Ionicons name="trash-outline" size={16} color={colors.mutedText} />
        </Pressable>
      ) : null}
    </View>
  );
}

function CommentThread({ comment, replies, currentUserId, onDelete, onReply }) {
  return (
    <View>
      <CommentRow
        comment={comment}
        canDelete={comment.userId === currentUserId}
        onDelete={() => onDelete(comment.id)}
        onReply={() => onReply(comment)}
      />
      {replies.map((reply) => (
        <CommentRow
          comment={reply}
          canDelete={reply.userId === currentUserId}
          isReply
          key={reply.id}
          onDelete={() => onDelete(reply.id)}
          onReply={() => onReply(comment)}
        />
      ))}
    </View>
  );
}

function PostHeader({ post, currentUserId, onLike, showFollow, isFollowing, onToggleFollow }) {
  const locationLabel = getLocationLabel(post);

  return (
    <View style={styles.post}>
      <View style={styles.authorRow}>
        {post.authorAvatar ? (
          <Image source={{ uri: post.authorAvatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons color={colors.mutedText} name="person" size={22} />
          </View>
        )}

        <View style={styles.authorInfo}>
          <Text numberOfLines={1} style={styles.author}>
            {post.authorName || 'Anonymous'}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons color={colors.primary} name="location-outline" size={13} />
            <Text numberOfLines={1} style={styles.location}>
              {locationLabel}
            </Text>
          </View>
        </View>

        {showFollow ? (
          <Pressable
            onPress={onToggleFollow}
            style={[styles.followButton, isFollowing && styles.followButtonActive]}
          >
            <Text
              style={[
                styles.followButtonText,
                isFollowing && styles.followButtonTextActive,
              ]}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={styles.mediaImage} />
      ) : null}

      <Text style={styles.caption}>{post.caption}</Text>
      <Text style={styles.time}>{formatRelativeTime(post.createdAt)}</Text>

      <View style={styles.actions}>
        <Pressable hitSlop={8} onPress={onLike} style={styles.action}>
          <Ionicons
            color={post.isLiked ? colors.danger : colors.text}
            name={post.isLiked ? 'heart' : 'heart-outline'}
            size={22}
          />
          <Text style={styles.actionText}>{formatCount(post.likesCount || 0)}</Text>
        </Pressable>
        <View style={styles.action}>
          <Ionicons color={colors.text} name="chatbubble-outline" size={21} />
          <Text style={styles.actionText}>{formatCount(post.commentsCount || 0)}</Text>
        </View>
      </View>

      <View style={styles.commentsDivider}>
        <Text style={styles.commentsDividerText}>Comments</Text>
      </View>
    </View>
  );
}

export default function PostDetailScreen({ route }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const postId = route.params?.postId ?? route.params?.initialPostId;
  const passedPosts = route.params?.posts;

  const currentUser = useAuthStore((s) => s.user);
  const currentUserId = currentUser?.uid;

  const toggleLike = useFeedStore((s) => s.toggleLike);
  const fetchPost = useFeedStore((s) => s.fetchPost);
  const fetchComments = useFeedStore((s) => s.fetchComments);
  const addComment = useFeedStore((s) => s.addComment);
  const deleteComment = useFeedStore((s) => s.deleteComment);
  const commentsByPost = useFeedStore((s) => s.commentsByPost);
  const commentsLoadingByPost = useFeedStore((s) => s.commentsLoadingByPost);
  const livePosts = useFeedStore((s) => s.posts);
  const followingByUser = useFeedStore((s) => s.followingByUser);
  const checkFollowing = useFeedStore((s) => s.checkFollowing);
  const toggleFollow = useFeedStore((s) => s.toggleFollow);

  const [post, setPost] = useState(() =>
    passedPosts?.find((p) => p.id === postId) || null,
  );
  const [isLoadingPost, setIsLoadingPost] = useState(!post);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  const comments = commentsByPost[postId] || [];
  const isLoadingComments = !!commentsLoadingByPost[postId];

  useEffect(() => {
    let isMounted = true;

    const livePost = livePosts.find((p) => p.id === postId);
    if (livePost) {
      setPost(livePost);
      setIsLoadingPost(false);
    } else if (!post) {
      setIsLoadingPost(true);
      fetchPost(postId, currentUserId).then((result) => {
        if (isMounted) {
          setPost(result);
          setIsLoadingPost(false);
        }
      });
    }

    fetchComments(postId);

    return () => {
      isMounted = false;
    };

  }, [postId]);

  useEffect(() => {
    const livePost = livePosts.find((p) => p.id === postId);
    if (livePost) setPost(livePost);
  }, [livePosts, postId]);

  useEffect(() => {
    if (post?.authorId && currentUserId && post.authorId !== currentUserId) {
      checkFollowing(currentUserId, post.authorId);
    }
  }, [post?.authorId, currentUserId]);

  const handleLike = () => {
    if (!currentUserId) return;
    toggleLike(postId, currentUserId);
  };

  const handleToggleFollow = () => {
    if (!currentUserId || !post?.authorId) return;
    toggleFollow(currentUserId, post.authorId);
  };

  const handleSendComment = async () => {
    if (!draft.trim() || !currentUserId || isSending) return;
    setIsSending(true);
    try {
      await addComment(postId, {
        userId: currentUserId,
        content: draft,
        authorName: currentUser?.username || 'Anonymous',
        authorAvatar: currentUser?.avatarUrl || '',
        parentId: replyingTo?.id ?? null,
        replyToAuthorName: replyingTo?.authorName ?? '',
      });
      setDraft('');
      setReplyingTo(null);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteComment = (commentId) => {
    deleteComment(postId, commentId);
  };

  const handleReply = (comment) => {

    const threadRootId = comment.parentId || comment.id;
    setReplyingTo({ id: threadRootId, authorName: comment.authorName });
  };

  const cancelReply = () => setReplyingTo(null);

  const threads = useMemo(() => {
    const topLevel = comments
      .filter((c) => !c.parentId)
      .sort((a, b) => (a._pending ? 1 : 0) - (b._pending ? 1 : 0) || 0);

    return topLevel.map((comment) => ({
      comment,
      replies: comments
        .filter((c) => c.parentId === comment.id)
        .sort((a, b) => (a._pending ? 1 : 0) - (b._pending ? 1 : 0) || 0),
    }));
  }, [comments]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      style={styles.screen}
    >
      <ScreenHeader title="Post" showBack onLeftPress={() => navigation.goBack()} />

      {isLoadingPost ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !post ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Post tidak ditemukan.</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={threads}
          keyExtractor={(item) => item.comment.id}
          ListHeaderComponent={
            <PostHeader
              post={post}
              currentUserId={currentUserId}
              onLike={handleLike}
              showFollow={!!currentUserId && post.authorId !== currentUserId}
              isFollowing={!!followingByUser[post.authorId]}
              onToggleFollow={handleToggleFollow}
            />
          }
          ListEmptyComponent={
            isLoadingComments ? (
              <ActivityIndicator
                color={colors.primary}
                style={styles.commentsLoader}
              />
            ) : (
              <View style={styles.emptyComments}>
                <Text style={styles.emptyText}>
                  Belum ada komentar. Jadi yang pertama!
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <CommentThread
              comment={item.comment}
              currentUserId={currentUserId}
              onDelete={handleDeleteComment}
              onReply={handleReply}
              replies={item.replies}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {replyingTo ? (
        <View style={styles.replyBar}>
          <Text style={styles.replyBarText}>
            Membalas <Text style={styles.replyBarName}>{replyingTo.authorName || 'komentar'}</Text>
          </Text>
          <Pressable hitSlop={8} onPress={cancelReply}>
            <Ionicons name="close" size={16} color={colors.mutedText} />
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        {currentUser?.avatarUrl ? (
          <Image source={{ uri: currentUser.avatarUrl }} style={styles.inputAvatar} />
        ) : (
          <View style={[styles.inputAvatar, styles.commentAvatarPlaceholder]}>
            <Ionicons name="person" size={14} color={colors.mutedText} />
          </View>
        )}
        <TextInput
          multiline
          onChangeText={setDraft}
          placeholder={replyingTo ? `Balas ${replyingTo.authorName}...` : 'Tulis komentar...'}
          placeholderTextColor={colors.neutral}
          style={styles.input}
          value={draft}
        />
        <Pressable
          disabled={!draft.trim() || isSending}
          onPress={handleSendComment}
          style={[
            styles.sendButton,
            (!draft.trim() || isSending) && styles.sendButtonDisabled,
          ]}
        >
          {isSending ? (
            <ActivityIndicator color={colors.surface} size="small" />
          ) : (
            <Ionicons name="send" size={16} color={colors.surface} />
          )}
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
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: spacing.xl,
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
    borderRadius: radius.md,
    height: 46,
    width: 46,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
  },
  authorInfo: {
    flex: 1,
    marginLeft: 10,
  },
  followButton: {
    borderColor: colors.primary,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  followButtonActive: {
    backgroundColor: '#F1F5F9',
    borderColor: colors.border,
  },
  followButtonText: {
    color: colors.primary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  followButtonTextActive: {
    color: colors.mutedText,
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
  mediaImage: {
    aspectRatio: 1,
    backgroundColor: '#DCE4EF',
    width: '100%',
  },
  caption: {
    color: colors.text,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  time: {
    color: colors.neutral,
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  actions: {
    alignItems: 'center',
    borderTopColor: '#E8EDF4',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  action: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginRight: spacing.lg,
  },
  actionText: {
    color: colors.text,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
  },
  commentsDivider: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  commentsDividerText: {
    color: colors.mutedText,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  commentsLoader: {
    marginTop: spacing.lg,
  },
  emptyComments: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.mutedText,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    textAlign: 'center',
  },
  commentRow: {
    backgroundColor: colors.surface,
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    padding: spacing.md,
  },
  commentRowReply: {
    borderBottomWidth: 0,
    paddingLeft: spacing.xl + spacing.md,
    paddingTop: 0,
    paddingBottom: spacing.sm,
  },
  commentAvatar: {
    borderRadius: radius.full,
    height: 32,
    marginRight: spacing.sm,
    width: 32,
  },
  commentAvatarReply: {
    height: 26,
    width: 26,
  },
  commentAvatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
  },
  commentBody: {
    flex: 1,
  },
  commentHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commentAuthor: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  commentTime: {
    color: colors.mutedText,
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
  },
  commentContent: {
    color: colors.text,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  replyButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  replyButtonText: {
    color: colors.mutedText,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
  },
  mentionTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAF1FF',
    borderRadius: radius.sm,
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mentionTagText: {
    color: colors.primary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
  },
  commentDelete: {
    alignSelf: 'flex-start',
    marginLeft: spacing.sm,
    padding: 4,
  },
  replyBar: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  replyBarText: {
    color: colors.mutedText,
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
  },
  replyBarName: {
    color: colors.primary,
    fontFamily: 'Poppins_600SemiBold',
  },
  inputBar: {
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  inputAvatar: {
    borderRadius: radius.full,
    height: 30,
    width: 30,
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: radius.lg,
    color: colors.text,
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    maxHeight: 100,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
});