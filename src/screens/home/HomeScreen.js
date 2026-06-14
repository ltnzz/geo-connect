import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import ScreenHeader from '../../components/common/ScreenHeader';
import HomeSkeleton from '../../components/home/HomeSkeleton';
import PostCard from '../../components/post/PostCard';
import { DUMMY_POSTS } from '../../data/dummyPosts';
import { colors, spacing } from '../../utils/theme';

const INITIAL_LOADING_DURATION = 1100;
const LOAD_MORE_DURATION = 600;

const createPostPage = (page) =>
  DUMMY_POSTS.map((post) => ({
    ...post,
    id: `${post.id}-${page}`,
  }));

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [posts, setPosts] = useState(() => createPostPage(1));
  const [searchQuery, setSearchQuery] = useState('');
  const pageRef = useRef(1);
  const isLoadingMoreRef = useRef(false);
  const loadMoreTimerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), INITIAL_LOADING_DURATION);
    return () => {
      clearTimeout(timer);
      clearTimeout(loadMoreTimerRef.current);
    };
  }, []);

  const loadMorePosts = useCallback(() => {
    if (isLoadingMoreRef.current) {
      return;
    }

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    const nextPage = pageRef.current + 1;

    loadMoreTimerRef.current = setTimeout(() => {
      setPosts((currentPosts) => [
        ...currentPosts,
        ...createPostPage(nextPage),
      ]);
      pageRef.current = nextPage;
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
      loadMoreTimerRef.current = null;
    }, LOAD_MORE_DURATION);
  }, []);

  if (isLoading) {
    return <HomeSkeleton />;
  }

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const visiblePosts = normalizedSearch
    ? posts.filter((post) =>
        [post.author, post.location, post.caption].some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        ),
      )
    : posts;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        onSearchChange={setSearchQuery}
        searchValue={searchQuery}
        showSearch
      />
      <FlatList
        contentContainerStyle={styles.listContent}
        data={visiblePosts}
        keyExtractor={(post) => post.id}
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator
              color={colors.primary}
              style={styles.footerLoader}
            />
          ) : null
        }
        onEndReached={normalizedSearch ? undefined : loadMorePosts}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) => <PostCard post={item} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
  },
  footerLoader: {
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
});
