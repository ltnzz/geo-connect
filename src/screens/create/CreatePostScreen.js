import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useState, useCallback } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLocation } from '../../hooks/useLocation';
import CreateEventScreen from './CreateEventScreen';
import ScreenHeader from '../../components/common/ScreenHeader';
import { cloudinaryService } from '../../services/cloudinaryService';
import { firestoreService } from '../../services/firestoreService';
import { imagePickerService } from '../../services/imagePickerService';
import { useAuthStore } from '../../stores/authStore';
import { useFeedStore } from '../../stores/feedstore';
import { colors, radius, spacing } from '../../utils/theme';

const RADIUS_OPTIONS = [1, 5, 10, 25, 50];

export default function CreatePostScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);
  const prependPost = useFeedStore((s) => s.prependPost);

  const [activeTab, setActiveTab] = useState('POST');
  const [content, setContent] = useState('');
  const [asset, setAsset] = useState(null);

  const { location, isFetchingLocation, locationError, handleGetLocation, clearLocation } = useLocation();
  const [postRadius, setPostRadius] = useState(5); // Default 5 km

  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setContent('');
        setAsset(null);
        setActiveTab('POST');
        setPostRadius(5);
        setError(null);
        clearLocation();
      };
    }, [])
  );

  const handlePickImage = async () => {
    setError(null);
    try {
      const picked = await imagePickerService.fromLibrary();
      if (picked) setAsset(picked);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveImage = () => setAsset(null);

  const handleToggleRadius = () => {
    const currentIndex = RADIUS_OPTIONS.indexOf(postRadius);
    const nextIndex = (currentIndex + 1) % RADIUS_OPTIONS.length;
    setPostRadius(RADIUS_OPTIONS[nextIndex]);
  };

  const handleSubmitPost = async () => {
    setError(null);
    setIsPosting(true);

    try {
      let imageUrl = '';

      if (asset) {
        const uploaded = await cloudinaryService.uploadImage(asset, { folder: 'posts' });
        imageUrl = uploaded.secureUrl;
      }

      const postId = await firestoreService.createPost({
        authorId: user.uid,
        caption: content,
        imageUrl,
        location: location,
        radius: postRadius,
      });


      prependPost({
        id: postId,
        authorId: user.uid,
        caption: content.trim(),
        imageUrl,
        location: location,
        radius: postRadius,
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date(),
      });

      setContent('');
      setAsset(null);
      clearLocation();
      setPostRadius(5);
      navigation.goBack();
    } catch (err) {
      setError(err.message || 'Failed to create post. Try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const canSubmit = content.trim().length > 0 && !!asset && !!location && !isPosting;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        leftIcon="close"
        onLeftPress={() => navigation.goBack()}
        rightComponent={
          <Pressable onPress={() => { }} style={styles.draftButton}>
            <Text style={styles.draftText}>Drafts</Text>
          </Pressable>
        }
        title="Create"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.tabContainer}>
          <Pressable
            onPress={() => setActiveTab('POST')}
            style={[styles.tabButton, activeTab === 'POST' && styles.activeTabButton]}
          >
            <Text style={[styles.tabText, activeTab === 'POST' && styles.activeTabText]}>POST</Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('EVENT')}
            style={[styles.tabButton, activeTab === 'EVENT' && styles.activeTabButton]}
          >
            <Text style={[styles.tabText, activeTab === 'EVENT' && styles.activeTabText]}>EVENT</Text>
          </Pressable>
        </View>

        <View style={{ display: activeTab === 'POST' ? 'flex' : 'none' }}>
          <TextInput
            multiline
            onChangeText={setContent}
            placeholder="What's happening around you right now?"
            placeholderTextColor={colors.neutral}
            style={styles.textInput}
            value={content}
          />

          <View style={styles.imageGrid}>
            {!asset ? (
              <Pressable onPress={handlePickImage} style={styles.addImageButton}>
                <Ionicons color={colors.primary} name="add" size={24} />
              </Pressable>
            ) : (
              <View style={styles.imageContainer}>
                <Image source={{ uri: asset.uri }} style={styles.selectedImage} />
                <Pressable onPress={handleRemoveImage} style={styles.removeImageButton}>
                  <Ionicons color={colors.text} name="close-circle" size={20} />
                </Pressable>
              </View>
            )}
          </View>

          <Pressable
            onPress={handleGetLocation}
            style={styles.actionRow}
            disabled={isFetchingLocation}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="location" size={20} color={colors.primary} />
            </View>
            <View style={styles.textContainer}>
              {isFetchingLocation ? (
                <Text style={styles.mainText}>Locating...</Text>
              ) : location ? (
                <>
                  <Text style={styles.mainText}>{location.address}</Text>
                  <Text style={styles.subText}>{location.city}</Text>
                </>
              ) : (
                <Text style={styles.mainText}>Add Location</Text>
              )}
            </View>
            {location && (
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={{ marginLeft: 'auto' }} />
            )}
          </Pressable>

          {location && (
            <Pressable
              onPress={handleToggleRadius}
              style={styles.actionRow}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#FCE7F3' }]}>
                <Ionicons
                  name="radio-outline"
                  size={20}
                  color="#DB2777"
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.mainText}>
                  Radius: {postRadius} km
                </Text>
                <Text style={styles.subText}>
                  Visible to people within {postRadius} km
                </Text>
              </View>
              <Ionicons name="sync" size={18} color={colors.neutral} style={{ marginLeft: 'auto' }} />
            </Pressable>
          )}

          {error || locationError ? <Text style={styles.errorText}>{error || locationError}</Text> : null}
        </View>

        <View style={{ display: activeTab === 'EVENT' ? 'flex' : 'none' }}>
          <CreateEventScreen />
        </View>

      </ScrollView>

      {activeTab === 'POST' ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable
            disabled={!canSubmit}
            onPress={handleSubmitPost}
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          >
            {isPosting ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={[styles.submitButtonText, !canSubmit && styles.submitButtonTextDisabled]}>CREATE POST</Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.surface,
    flex: 1,
  },
  draftButton: {
    padding: spacing.xs,
  },
  draftText: {
    color: colors.neutral,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
  },
  scrollContent: {
    padding: spacing.md,
  },
  tabContainer: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    marginBottom: spacing.lg,
    padding: 4,
  },
  tabButton: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flex: 1,
    paddingVertical: 10,
  },
  activeTabButton: {
    backgroundColor: colors.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    color: colors.neutral,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    letterSpacing: 1,
  },
  activeTabText: {
    color: colors.primary,
  },
  textInput: {
    color: colors.text,
    fontFamily: 'Poppins_400Regular',
    fontSize: 18,
    marginBottom: spacing.xl,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  imageGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  addImageButton: {
    alignItems: 'center',
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    height: 100,
    justifyContent: 'center',
    width: 100,
  },
  imageContainer: {
    height: 100,
    width: 100,
  },
  selectedImage: {
    borderRadius: radius.sm,
    height: '100%',
    width: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    right: 4,
    top: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    backgroundColor: '#DBEAFE',
    padding: 8,
    borderRadius: radius.full,
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  mainText: {
    color: colors.text,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
  },
  subText: {
    color: colors.mutedText,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
  errorText: {
    color: colors.danger,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginBottom: spacing.md,
  },
  footer: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 14,
  },
  submitButtonDisabled: {
    backgroundColor: colors.border,
  },
  submitButtonText: {
    color: colors.surface,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    letterSpacing: 1,
  },
  submitButtonTextDisabled: {
    color: '#94A3B8',
  },
});