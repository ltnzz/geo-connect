import { create } from 'zustand';

import { firestoreService } from '../services/firestoreService';

const PAGE_SIZE = 10;

const createLoopedPosts = (posts, loopPage) =>
  posts.slice(0, PAGE_SIZE).map((post, index) => ({
    ...post,
    _listKey: `${post.id}-loop-${loopPage}-${index}`,
  }));

const enrichPostsWithUserData = async (posts) => {
  return await Promise.all(
    posts.map(async (post) => {
      try {
        if (!post.authorId) {
          return { ...post, authorName: 'Anonymous', authorAvatar: null };
        }

        const userData = await firestoreService.getUser(post.authorId);

        return {
          ...post,
          authorName: userData?.username || 'Anonymous',
          authorAvatar: userData?.avatarUrl || null,
        };
      } catch (err) {
        return { ...post, authorName: 'Anonymous', authorAvatar: null };
      }
    })
  );
};

export const useFeedStore = create((set, get) => ({
  posts: [],
  lastDoc: null,
  isLoading: false,
  isRefreshing: false,
  isLoadingMore: false,
  hasMore: true,
  loopPage: 0,
  error: null,

  commentsByPost: {},
  commentsLoadingByPost: {},
  followingByUser: {},

  fetchFeed: async (currentUserId) => {
    set({ isLoading: true, error: null });
    try {
      const { posts, lastDoc } = await firestoreService.getFeedPosts({ pageSize: PAGE_SIZE });

      const enrichedPosts = await enrichPostsWithUserData(posts);

      const likedIds = currentUserId
        ? await firestoreService.getLikedPostIds(enrichedPosts.map((p) => p.id), currentUserId)
        : new Set();

      set({
        posts: enrichedPosts.map((p) => ({ ...p, isLiked: likedIds.has(p.id) })),
        lastDoc,
        hasMore: posts.length === PAGE_SIZE,
        loopPage: 0,
        isLoading: false,
      });
    } catch (err) {
      set({ error: err.message || 'Failed to load feed.', isLoading: false });
    }
  },

  refreshFeed: async (currentUserId) => {
    set({ isRefreshing: true, error: null });
    try {
      const { posts, lastDoc } = await firestoreService.getFeedPosts({ pageSize: PAGE_SIZE });

      const enrichedPosts = await enrichPostsWithUserData(posts);

      const likedIds = currentUserId
        ? await firestoreService.getLikedPostIds(enrichedPosts.map((p) => p.id), currentUserId)
        : new Set();

      set({
        posts: enrichedPosts.map((p) => ({ ...p, isLiked: likedIds.has(p.id) })),
        lastDoc,
        hasMore: posts.length === PAGE_SIZE,
        loopPage: 0,
        isRefreshing: false,
      });
    } catch (err) {
      set({ error: err.message || 'Failed to refresh.', isRefreshing: false });
    }
  },

  fetchMorePosts: async (currentUserId) => {
    const { lastDoc, hasMore, isLoadingMore, posts, loopPage } = get();
    if (isLoadingMore || posts.length === 0) return;

    set({ isLoadingMore: true });

    if (!hasMore || !lastDoc) {
      const nextLoopPage = loopPage + 1;
      set((s) => ({
        posts: [...s.posts, ...createLoopedPosts(s.posts, nextLoopPage)],
        loopPage: nextLoopPage,
        isLoadingMore: false,
      }));
      return;
    }

    try {
      const { posts: newPosts, lastDoc: nextLastDoc } = await firestoreService.getFeedPosts({
        pageSize: PAGE_SIZE,
        cursor: lastDoc,
      });

      if (newPosts.length === 0) {
        const nextLoopPage = loopPage + 1;
        set((s) => ({
          posts: [...s.posts, ...createLoopedPosts(s.posts, nextLoopPage)],
          hasMore: false,
          loopPage: nextLoopPage,
          isLoadingMore: false,
        }));
        return;
      }

      const enrichedNewPosts = await enrichPostsWithUserData(newPosts);

      const likedIds = currentUserId
        ? await firestoreService.getLikedPostIds(enrichedNewPosts.map((p) => p.id), currentUserId)
        : new Set();

      set((s) => ({
        posts: [...s.posts, ...enrichedNewPosts.map((p) => ({ ...p, isLiked: likedIds.has(p.id) }))],
        lastDoc: nextLastDoc,
        hasMore: newPosts.length === PAGE_SIZE,
        isLoadingMore: false,
      }));
    } catch (err) {
      set({ error: err.message || 'Failed to load more.', isLoadingMore: false });
    }
  },

  prependPost: (post) =>
    set((s) => ({ posts: [{ ...post, isLiked: false }, ...s.posts] })),

  fetchPost: async (postId, currentUserId) => {
    const cached = get().posts.find((p) => p.id === postId);
    if (cached) return cached;

    const raw = await firestoreService.getPost(postId);
    if (!raw) return null;

    const [enriched] = await enrichPostsWithUserData([raw]);
    const likedIds = currentUserId
      ? await firestoreService.getLikedPostIds([enriched.id], currentUserId)
      : new Set();

    return { ...enriched, isLiked: likedIds.has(enriched.id) };
  },

  toggleLike: async (postId, userId) => {
    const target = get().posts.find((p) => p.id === postId);
    if (!target) return;

    const wasLiked = !!target.isLiked;
    const nextLiked = !wasLiked;
    const delta = nextLiked ? 1 : -1;

    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === postId
          ? { ...p, isLiked: nextLiked, likesCount: Math.max(0, (p.likesCount || 0) + delta) }
          : p,
      ),
    }));

    try {
      await firestoreService.setPostLiked(postId, userId, nextLiked);
    } catch (err) {
      set((s) => ({
        posts: s.posts.map((p) =>
          p.id === postId
            ? { ...p, isLiked: wasLiked, likesCount: Math.max(0, (p.likesCount || 0) - delta) }
            : p,
        ),
        error: 'Failed to update like. Please try again.',
      }));
    }
  },

  fetchComments: async (postId) => {
    set((s) => ({
      commentsLoadingByPost: { ...s.commentsLoadingByPost, [postId]: true },
    }));
    try {
      const comments = await firestoreService.getComments(postId);
      set((s) => ({
        commentsByPost: { ...s.commentsByPost, [postId]: comments },
        commentsLoadingByPost: { ...s.commentsLoadingByPost, [postId]: false },
      }));
    } catch {
      set((s) => ({
        commentsLoadingByPost: { ...s.commentsLoadingByPost, [postId]: false },
      }));
    }
  },

  addComment: async (postId, { userId, content, authorName = '', authorAvatar = '', parentId = null, replyToAuthorName = '' }) => {
  if (!content.trim()) return;

  const tempId = `temp_${Date.now()}`;
  const optimistic = {
    id: tempId,
    postId,
    userId,
    content: content.trim(),
    authorName,
    authorAvatar,
    parentId,
    replyToAuthorName,
    createdAt: new Date(),
    _pending: true,
  };

  set((s) => ({
    commentsByPost: {
      ...s.commentsByPost,
      [postId]: [...(s.commentsByPost[postId] || []), optimistic],
    },
    posts: s.posts.map((p) =>
      p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p,
    ),
  }));

  try {
    const realId = await firestoreService.addComment(postId, {
      userId,
      content,
      authorName,
      authorAvatar,
      parentId,
      replyToAuthorName,
    });

    set((s) => ({
      commentsByPost: {
        ...s.commentsByPost,
        [postId]: (s.commentsByPost[postId] || []).map((c) =>
          c.id === tempId ? { ...c, id: realId, _pending: false } : c,
        ),
      },
    }));
  } catch (err) {
    set((s) => ({
      commentsByPost: {
        ...s.commentsByPost,
        [postId]: (s.commentsByPost[postId] || []).filter((c) => c.id !== tempId),
      },
      posts: s.posts.map((p) =>
        p.id === postId
          ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 0) - 1) }
          : p,
      ),
      error: err.message || 'Failed to post comment.',
    }));
  }
},

  deleteComment: async (postId, commentId) => {
    const prevComments = get().commentsByPost[postId] || [];

    set((s) => ({
      commentsByPost: {
        ...s.commentsByPost,
        [postId]: prevComments.filter((c) => c.id !== commentId),
      },
      posts: s.posts.map((p) =>
        p.id === postId ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 0) - 1) } : p,
      ),
    }));

    try {
      await firestoreService.deleteComment(postId, commentId);
    } catch (err) {
      set((s) => ({
        commentsByPost: { ...s.commentsByPost, [postId]: prevComments },
        posts: s.posts.map((p) =>
          p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p,
        ),
        error: err.message || 'Failed to delete comment.',
      }));
    }
  },

  checkFollowing: async (currentUserId, targetUserId) => {
    if (!currentUserId || currentUserId === targetUserId) return;
    try {
      const result = await firestoreService.isFollowing(currentUserId, targetUserId);
      set((s) => ({
        followingByUser: { ...s.followingByUser, [targetUserId]: result },
      }));
    } catch {
    }
  },

  toggleFollow: async (currentUserId, targetUserId) => {
    if (!currentUserId || currentUserId === targetUserId) return;

    const wasFollowing = !!get().followingByUser[targetUserId];
    const nextFollowing = !wasFollowing;

    set((s) => ({
      followingByUser: { ...s.followingByUser, [targetUserId]: nextFollowing },
    }));

    try {
      await firestoreService.setFollowing(currentUserId, targetUserId, nextFollowing);
    } catch (err) {
      set((s) => ({
        followingByUser: { ...s.followingByUser, [targetUserId]: wasFollowing },
        error: err.message || 'Failed to update follow.',
      }));
    }
  },

  clearError: () => set({ error: null }),
}));