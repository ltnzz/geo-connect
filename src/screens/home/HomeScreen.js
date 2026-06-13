import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import ScreenHeader from '../../components/common/ScreenHeader';
import HomeSkeleton from '../../components/home/HomeSkeleton';
import PostCard from '../../components/post/PostCard';
import { DUMMY_POSTS } from '../../data/dummyPosts';
import { colors, spacing } from '../../utils/theme';

const INITIAL_LOADING_DURATION = 1100;

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), INITIAL_LOADING_DURATION);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <HomeSkeleton />;
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader />
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {DUMMY_POSTS.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </ScrollView>
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
});
