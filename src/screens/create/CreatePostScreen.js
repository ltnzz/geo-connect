import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ActivityIndicator, Alert, BackHandler, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLocation } from '../../hooks/useLocation';
import CreateEventScreen from './CreateEventScreen';
import LocationSelectModal from '../../components/create/LocationSelectModal';
import ScreenHeader from '../../components/common/ScreenHeader';
import { POST_LOCATION_VISIBILITY } from '../../constants/firestore';
import { cloudinaryService } from '../../services/cloudinaryService';
import { firestoreService } from '../../services/firestoreService';
import { imagePickerService } from '../../services/imagePickerService';
import { useAuthStore } from '../../stores/authStore';
import { useFeedStore } from '../../stores/feedstore';
import { draftService } from '../../services/draftService';
import { useColors, radius, spacing } from '../../utils/theme';

export default function CreatePostScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const user = useAuthStore((s) => s.user);
  const prependPost = useFeedStore((s) => s.prependPost);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [activeTab, setActiveTab] = useState('POST');
  const [content, setContent] = useState('');
  const [asset, setAsset] = useState(null);

  const { location: userLocation, handleGetLocation } = useLocation();
  const [postLocation, setPostLocation] = useState(null);
  const [postVisibility, setPostVisibility] = useState(POST_LOCATION_VISIBILITY.exact);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);

  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState(null);
  const loadedDraftId = useRef(null);
  
  const [initialEventDraft, setInitialEventDraft] = useState(null);
  const [eventFormData, setEventFormData] = useState(null);

  // Ref to always read latest state inside tabPress listener (prevents stale closure)
  const stateRef = useRef({});
  stateRef.current = { activeTab, content, asset, eventFormData };

  // Fetch location on mount
  useEffect(() => {
    handleGetLocation();
  }, [handleGetLocation]);

  // Sync user's current location once fetched
  useEffect(() => {
    if (userLocation && !postLocation) {
      setPostLocation(userLocation);
    }
  }, [userLocation]);

  
  useEffect(() => {
    const draft = route.params?.draft;
    if (draft) {
      loadedDraftId.current = draft.id;
      if (draft.type === 'EVENT') {
        setActiveTab('EVENT');
        setInitialEventDraft(draft);
      } else {
        setActiveTab('POST');
        setContent(draft.content || '');
        if (draft.assetUri) setAsset({ uri: draft.assetUri });
      }
      // Clear params so it doesn't reload on focus
      navigation.setParams({ draft: undefined });
    }
  }, [route.params?.draft]);

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
        placeId: selectedVenue?.id || null,
        location: {
          ...postLocation,
          visibility: postVisibility,
        },
      });


      prependPost({
        id: postId,
        authorId: user.uid,
        authorName: user.username || 'Anonymous',
        authorAvatar: user.avatarUrl || '',
        caption: content.trim(),
        imageUrl,
        placeId: selectedVenue?.id || null,
        location: {
          ...postLocation,
          visibility: postVisibility,
        },
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date(),
      });

      setContent('');
      setAsset(null);
      setPostLocation(null);
      setSelectedVenue(null);

      // Auto-delete draft if it was loaded
      if (loadedDraftId.current) {
        await draftService.deleteDraft(loadedDraftId.current);
        loadedDraftId.current = null;
      }

      navigation.goBack();
    } catch (err) {
      setError(err.message || 'Failed to create post. Try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const canSubmit = content.trim().length > 0 && !!asset && !!postLocation && !isPosting;

  const hasContent = content.trim().length > 0 || !!asset;
  const hasEventContent = eventFormData?.title?.trim().length > 0 || !!eventFormData?.asset || eventFormData?.description?.trim().length > 0;

  const showDraftAlert = useCallback((onConfirmLeave) => {
    const { activeTab: tab, content: c, asset: a, eventFormData: efd } = stateRef.current;
    const isPostActive = tab === 'POST';
    const isEventActive = tab === 'EVENT';

    Alert.alert(
      'Save Draft?',
      'You have unsaved content. Would you like to save it as a draft?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setContent('');
            setAsset(null);
            setError(null);
            setPostLocation(null);
            setSelectedVenue(null);
            loadedDraftId.current = null;
            setInitialEventDraft(null);
            onConfirmLeave();
          },
        },
        {
          text: 'Save Draft',
          onPress: async () => {
            if (isPostActive) {
              await draftService.saveDraft({
                id: loadedDraftId.current,
                type: 'POST',
                content: c,
                assetUri: a?.uri || null,
              });
            } else if (isEventActive) {
              await draftService.saveDraft({
                id: loadedDraftId.current,
                type: 'EVENT',
                eventData: efd,
              });
            }
            setContent('');
            setAsset(null);
            setError(null);
            setPostLocation(null);
            setSelectedVenue(null);
            loadedDraftId.current = null;
            setInitialEventDraft(null);
            onConfirmLeave();
          },
        },
      ]
    );
  }, []);

  // Intercept tab-switch: fires when user taps another tab while Create is active
  useFocusEffect(
    useCallback(() => {
      const unsubscribe = navigation.addListener('tabPress', (e) => {
        const { activeTab: tab, content: c, asset: a, eventFormData: efd } = stateRef.current;
        const isPostActive = tab === 'POST';
        const isEventActive = tab === 'EVENT';
        const postHasContent = c.trim().length > 0 || !!a;
        const eventHasContent = efd?.title?.trim().length > 0 || !!efd?.asset || efd?.description?.trim().length > 0;
        const shouldPrompt = (isPostActive && postHasContent) || (isEventActive && eventHasContent);

        if (!shouldPrompt) return;

        
        e.preventDefault();
        showDraftAlert(() => {
          
          navigation.navigate(e.target.split('-')[0]);
        });
      });
      return unsubscribe;
    }, [navigation, showDraftAlert])
  );

  
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        const { activeTab: tab, content: c, asset: a, eventFormData: efd } = stateRef.current;
        const isPostActive = tab === 'POST';
        const isEventActive = tab === 'EVENT';
        const postHasContent = c.trim().length > 0 || !!a;
        const eventHasContent = efd?.title?.trim().length > 0 || !!efd?.asset || efd?.description?.trim().length > 0;
        const shouldPrompt = (isPostActive && postHasContent) || (isEventActive && eventHasContent);

        if (!shouldPrompt) return false; 

        showDraftAlert(() => navigation.navigate('Home'));
        return true; 
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation, showDraftAlert])
  );

  
  const handleClose = () => {
    if (!hasContent && !hasEventContent) {
      navigation.goBack();
      return;
    }
    showDraftAlert(() => navigation.goBack());
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        leftIcon="close"
        onLeftPress={handleClose}
        rightComponent={
          <Pressable 
            onPress={() => navigation.navigate('Drafts')} 
            style={styles.draftButton}
          >
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
            onPress={() => setIsLocationModalVisible(true)}
            style={styles.actionRow}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="location" size={20} color={colors.primary} />
            </View>
            <View style={styles.textContainer}>
              {postLocation ? (
                <>
                  <Text style={styles.mainText}>{postLocation.address}</Text>
                  <Text style={styles.subText}>{postLocation.city}</Text>
                </>
              ) : (
                <Text style={styles.mainText}>Add Location</Text>
              )}
            </View>
            {postLocation && (
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={{ marginLeft: 'auto' }} />
            )}
          </Pressable>

          {postLocation && (
            <View style={styles.visibilityContainer}>
              <Text style={styles.visibilityLabel}>Location Privacy</Text>
              <View style={styles.visibilityTabs}>
                {[
                  { value: POST_LOCATION_VISIBILITY.exact, label: 'Exact', icon: 'pin' },
                  { value: POST_LOCATION_VISIBILITY.blurred, label: 'Blurred', icon: 'scan' },
                  { value: POST_LOCATION_VISIBILITY.city, label: 'City Only', icon: 'business' }
                ].map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setPostVisibility(option.value)}
                    style={[
                      styles.visibilityTab,
                      postVisibility === option.value && styles.visibilityTabActive
                    ]}
                  >
                    <Ionicons 
                      name={postVisibility === option.value ? option.icon : `${option.icon}-outline`} 
                      size={16} 
                      color={postVisibility === option.value ? colors.surface : colors.neutral} 
                    />
                    <Text style={[
                      styles.visibilityTabText,
                      postVisibility === option.value && styles.visibilityTabTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={{ display: activeTab === 'EVENT' ? 'flex' : 'none' }}>
          <CreateEventScreen 
            initialDraft={initialEventDraft}
            onEventDataChange={setEventFormData}
            onSuccess={() => {
              if (loadedDraftId.current) {
                draftService.deleteDraft(loadedDraftId.current);
                loadedDraftId.current = null;
              }
            }}
          />
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

      <LocationSelectModal
        visible={isLocationModalVisible}
        onClose={() => setIsLocationModalVisible(false)}
        onSelect={(loc) => {
          setPostLocation(loc);
          if (loc.placeId) {
            setSelectedVenue({ id: loc.placeId, name: loc.address });
          } else {
            setSelectedVenue(null);
          }
        }}
        currentUserLocation={userLocation}
      />
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
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
    borderColor: colors.border,
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
    shadowColor: colors.neutral,
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
    borderColor: colors.border,
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
    backgroundColor: `${colors.surface}CC`,
    borderRadius: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    backgroundColor: `${colors.primary}1A`,
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
    color: colors.mutedText,
  },
  visibilityContainer: {
    marginBottom: spacing.md,
  },
  visibilityLabel: {
    color: colors.mutedText,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  visibilityTabs: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 4,
  },
  visibilityTab: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  visibilityTabActive: {
    backgroundColor: colors.primary,
  },
  visibilityTabText: {
    color: colors.neutral,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  visibilityTabTextActive: {
    color: colors.surface,
  },
});
