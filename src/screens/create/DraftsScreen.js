import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ScreenHeader from '../../components/common/ScreenHeader';
import { draftService } from '../../services/draftService';
import { colors, radius, spacing } from '../../utils/theme';

export default function DraftsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [drafts, setDrafts] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadDrafts();
    }, [])
  );

  const loadDrafts = async () => {
    const data = await draftService.getDrafts();
    setDrafts(data);
  };

  const handleLoadDraft = (draft) => {
    navigation.navigate('MainTabs', {
      screen: 'Create',
      params: { draft },
    });
  };

  const handleDeleteDraft = (draftId) => {
    Alert.alert('Delete Draft', 'Are you sure you want to delete this draft?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await draftService.deleteDraft(draftId);
          loadDrafts();
        },
      },
    ]);
  };

  const handleClearAll = () => {
    if (drafts.length === 0) return;
    Alert.alert('Clear All Drafts', 'This will permanently delete all your drafts.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          await draftService.clearAllDrafts();
          setDrafts([]);
        },
      },
    ]);
  };

  const formatDate = (timestamp) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderDraft = ({ item }) => {
    const isEvent = item.type === 'EVENT';
    const thumbnailUrl = isEvent ? (item.eventData?.asset?.uri || item.eventData?.bannerUrl) : item.assetUri;
    const titleText = isEvent ? (item.eventData?.title || 'Untitled Event') : (item.content || 'No caption');
    const metaText = isEvent 
      ? `Event Draft · ${formatDate(item.updatedAt)}`
      : `${formatDate(item.updatedAt)} · Radius ${item.radius} km`;
    const placeholderIcon = isEvent ? 'calendar' : 'document-text-outline';

    return (
      <Pressable
        style={({ pressed }) => [styles.draftCard, pressed && styles.pressed]}
        onPress={() => handleLoadDraft(item)}
      >
        <View style={styles.draftContent}>
          {thumbnailUrl ? (
            <Image source={{ uri: thumbnailUrl }} style={styles.draftThumbnail} />
          ) : (
            <View style={[styles.draftThumbnail, styles.draftThumbnailPlaceholder]}>
              <Ionicons name={placeholderIcon} size={20} color={colors.neutral} />
            </View>
          )}
          <View style={styles.draftTextContainer}>
            <Text numberOfLines={2} style={styles.draftCaption}>
              {titleText}
            </Text>
            <Text style={styles.draftMeta}>
              {metaText}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => handleDeleteDraft(item.id)}
          style={styles.deleteButton}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={18} color="#E11D48" />
        </Pressable>
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="document-outline" size={40} color={colors.neutral} />
      </View>
      <Text style={styles.emptyTitle}>No Drafts</Text>
      <Text style={styles.emptySubtitle}>
        When you save a post as draft, it will appear here.
      </Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScreenHeader
        showBack
        title="Drafts"
        rightComponent={
          drafts.length > 0 ? (
            <Pressable onPress={handleClearAll} style={styles.clearAllButton}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </Pressable>
          ) : null
        }
      />
      <FlatList
        contentContainerStyle={[
          styles.listContent,
          drafts.length === 0 && styles.listContentEmpty,
          { paddingBottom: Math.max(insets.bottom, spacing.md) },
        ]}
        data={drafts}
        keyExtractor={(item) => item.id}
        renderItem={renderDraft}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  listContent: {
    padding: spacing.md,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  clearAllButton: {
    padding: spacing.xs,
  },
  clearAllText: {
    color: '#E11D48',
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
  },
  draftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.72,
  },
  draftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  draftThumbnail: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
  },
  draftThumbnailPlaceholder: {
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftTextContainer: {
    flex: 1,
  },
  draftCaption: {
    color: colors.text,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    lineHeight: 20,
  },
  draftMeta: {
    color: colors.neutral,
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    marginTop: 2,
  },
  deleteButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIconWrap: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: radius.full,
    height: 72,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 72,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    color: colors.neutral,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
});
