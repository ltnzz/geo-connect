import { useCallback, useEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native'; 

import ScreenHeader from '../../components/common/ScreenHeader';
import HomeSkeleton from '../../components/home/HomeSkeleton';
import PostCard from '../../components/post/PostCard';
import { useAuthStore } from '../../stores/authStore';
import { useFeedStore } from '../../stores/feedstore';
import { colors, spacing } from '../../utils/theme';

export default function HomeScreen() {
  const navigation = useNavigation(); 
  const currentUserId = useAuthStore((s) => s.user?.uid);

  const posts        = useFeedStore((s) => s.posts);
  const isLoading    = useFeedStore((s) => s.isLoading);
  const isRefreshing = useFeedStore((s) => s.isRefreshing);
  const isLoadingMore = useFeedStore((s) => s.isLoadingMore);
  const error        = useFeedStore((s) => s.error);
  const fetchFeed    = useFeedStore((s) => s.fetchFeed);
  const refreshFeed  = useFeedStore((s) => s.refreshFeed);
  const fetchMorePosts = useFeedStore((s) => s.fetchMorePosts);

  useEffect(() => {
    fetchFeed(currentUserId);
  }, [currentUserId, fetchFeed]);

  const handleEndReached = useCallback(() => {
    if (isLoading || isLoadingMore || posts.length === 0) {
      return;
    }

    fetchMorePosts(currentUserId);
  }, [
    currentUserId,
    fetchMorePosts,
    isLoading,
    isLoadingMore,
    posts.length,
  ]);

  if (isLoading && posts.length === 0) {
    return <HomeSkeleton />;
  }

  if (error && posts.length === 0) {
    return (
      <View style={styles.screen}>
        <ScreenHeader onSearchIconPress={() => navigation.navigate('Search')} />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader onSearchIconPress={() => navigation.navigate('Search')} />
      <FlatList
        contentContainerStyle={styles.listContent}
        data={posts}
        keyExtractor={(item) => item._listKey || item.id}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        onRefresh={() => refreshFeed(currentUserId)}
        refreshing={isRefreshing}
        renderItem={({ item }) => <PostCard post={item} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Belum ada post.</Text>
          </View>
        }
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator color={colors.primary} style={styles.footerLoader} />
          ) : null
        }
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
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    color: colors.danger,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.mutedText,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  footerLoader: {
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
});
