import React, { useRef, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import ScreenHeader from '../../components/common/ScreenHeader';
import PostCard from '../../components/post/PostCard';
import { useColors, spacing } from '../../utils/theme';

export default function ProfileFeedScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const flatListRef = useRef(null);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const posts = route.params?.posts || [];
  const initialPostId = route.params?.initialPostId;
  const title = route.params?.title || 'Posts';

  const initialIndex = posts.findIndex((p) => p.id === initialPostId);
  const scrollIndex = initialIndex !== -1 ? initialIndex : 0;
  const hasPosts = posts.length > 0;

  const handleScrollToIndexFailed = (info) => {
    const offset = info.averageItemLength * info.index;
    flatListRef.current?.scrollToOffset({ offset, animated: false });
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
    }, 50);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title={title} showBack onLeftPress={() => navigation.goBack()} />
      <FlatList
        ref={flatListRef}
        contentContainerStyle={styles.listContent}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No posts to show.</Text>}
        initialScrollIndex={hasPosts ? scrollIndex : undefined}
        getItemLayout={
          hasPosts
            ? (data, index) => ({
              length: 450,
              offset: 450 * index,
              index,
            })
            : undefined
        }
        onScrollToIndexFailed={handleScrollToIndexFailed}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    padding: spacing.md,
  },
  emptyText: {
    color: colors.mutedText,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
});
