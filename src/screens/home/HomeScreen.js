import { useCallback, useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native'; 

import ScreenHeader from '../../components/common/ScreenHeader';
import HomeSkeleton from '../../components/home/HomeSkeleton';
import PostCard from '../../components/post/PostCard';
import StoryRingRow from '../../components/story/StoryRingRow';
import StoryViewerModal from '../../components/story/StoryViewerModal';
import CreateStoryModal from '../../components/story/CreateStoryModal';
import { useAuthStore } from '../../stores/authStore';
import { useFeedStore } from '../../stores/feedstore';
import { useEventStore } from '../../stores/eventStore';
import { firestoreService } from '../../services/firestoreService';
import { imagePickerService } from '../../services/imagePickerService';
import { cloudinaryService } from '../../services/cloudinaryService';
import { useColors, spacing } from '../../utils/theme';
import { useLocation } from '../../hooks/useLocation';


export default function HomeScreen() {
  const navigation = useNavigation(); 
  const currentUserId = useAuthStore((s) => s.user?.uid);
  const currentUserAvatar = useAuthStore((s) => s.user?.avatarUrl);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { handleGetLocation } = useLocation();


  const posts        = useFeedStore((s) => s.posts);
  const isLoading    = useFeedStore((s) => s.isLoading);
  const isRefreshing = useFeedStore((s) => s.isRefreshing);
  const isLoadingMore = useFeedStore((s) => s.isLoadingMore);
  const isOffline    = useFeedStore((s) => s.isOffline);
  const error        = useFeedStore((s) => s.error);
  const fetchFeed    = useFeedStore((s) => s.fetchFeed);
  const refreshFeed  = useFeedStore((s) => s.refreshFeed);
  const fetchMorePosts = useFeedStore((s) => s.fetchMorePosts);

  const { events, fetchEvents } = useEventStore();
  const [groupedStories, setGroupedStories] = useState([]);
  const [isStoryViewerVisible, setIsStoryViewerVisible] = useState(false);
  const [viewerStories, setViewerStories] = useState([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  const [isCreateStoryVisible, setIsCreateStoryVisible] = useState(false);
  const [pickedImageUri, setPickedImageUri] = useState(null);
  const [isUploadingStory, setIsUploadingStory] = useState(false);

  const groupStoriesByUser = (allStories) => {
    const groups = {};
    allStories.forEach((story) => {
      if (!story.userId) return;
      if (!groups[story.userId]) {
        groups[story.userId] = {
          userId: story.userId,
          username: story.username || 'aroundu',
          userAvatar: story.userAvatar || '',
          stories: [],
        };
      }
      groups[story.userId].stories.push(story);
    });
    return Object.values(groups);
  };

  const loadStories = useCallback(async () => {
    try {
      const activeStories = await firestoreService.getAllActiveStories();
      const grouped = groupStoriesByUser(activeStories);
      setGroupedStories(grouped);
    } catch (err) {
      console.warn('Failed to load stories:', err);
    }
  }, []);

  useEffect(() => {
    handleGetLocation(false);
    fetchFeed(currentUserId);
    loadStories();
    if (events.length === 0) {
      fetchEvents();
    }
  }, [currentUserId, fetchFeed, loadStories, events.length, fetchEvents, handleGetLocation]);

  const handleAddStory = async () => {
    if (!currentUserId) {
      Alert.alert('Login Required', 'Please log in to add stories.');
      return;
    }

    try {
      const picked = await imagePickerService.fromLibrary();
      if (!picked) return;

      setPickedImageUri(picked);
      setIsCreateStoryVisible(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const handleShareStory = async (event) => {
    setIsUploadingStory(true);
    try {
      const uploadResult = await cloudinaryService.uploadImage(pickedImageUri, { folder: 'stories' });
      const user = useAuthStore.getState().user;

      await firestoreService.createStory({
        userId: currentUserId,
        username: user?.username || 'aroundu',
        userAvatar: user?.avatarUrl || '',
        mediaUrl: uploadResult.url,
        eventId: event.id,
        eventTitle: event.title,
      });

      loadStories();
      setIsCreateStoryVisible(false);
      setPickedImageUri(null);
      Alert.alert('Story Shared', `Your story was shared in event: ${event.title}`);
    } catch (err) {
      Alert.alert('Upload Failed', err.message || 'Something went wrong.');
    } finally {
      setIsUploadingStory(false);
    }
  };

  const uniqueEvents = [];
  const seenIds = new Set();
  for (const evt of events) {
    if (!seenIds.has(evt.id)) {
      seenIds.add(evt.id);
      uniqueEvents.push(evt);
    }
  }

  const currentUserStoriesGroup = groupedStories.find((g) => g.userId === currentUserId);
  const otherUsersStoriesGroups = groupedStories.filter((g) => g.userId !== currentUserId);

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
      {isOffline ? (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Offline mode - showing cached posts</Text>
        </View>
      ) : null}
      <FlatList
        contentContainerStyle={styles.listContent}
        data={posts}
        keyExtractor={(item) => item._listKey || item.id}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        onRefresh={() => {
          refreshFeed(currentUserId);
          loadStories();
          handleGetLocation(false);
        }}
        refreshing={isRefreshing}
        renderItem={({ item }) => <PostCard post={item} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <StoryRingRow
            groupedStories={otherUsersStoriesGroups}
            currentUserAvatar={currentUserAvatar}
            currentUserStories={currentUserStoriesGroup?.stories}
            onRingPress={(group) => {
              setViewerStories(group.stories);
              setViewerInitialIndex(0);
              setIsStoryViewerVisible(true);
            }}
            onCurrentUserRingPress={() => {
              if (currentUserStoriesGroup) {
                setViewerStories(currentUserStoriesGroup.stories);
                setViewerInitialIndex(0);
                setIsStoryViewerVisible(true);
              }
            }}
            onAddStoryPress={handleAddStory}
          />
        }
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

      <StoryViewerModal
        visible={isStoryViewerVisible}
        stories={viewerStories}
        initialIndex={viewerInitialIndex}
        onClose={() => setIsStoryViewerVisible(false)}
      />

      <CreateStoryModal
        visible={isCreateStoryVisible}
        imageUri={pickedImageUri?.uri}
        events={uniqueEvents}
        onShare={handleShareStory}
        isSharing={isUploadingStory}
        onClose={() => {
          setIsCreateStoryVisible(false);
          setPickedImageUri(null);
        }}
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
  offlineBanner: {
    backgroundColor: `${colors.secondary}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  offlineText: {
    color: colors.secondary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    textAlign: 'center',
  },
});
