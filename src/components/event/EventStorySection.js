import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLocation } from '../../hooks/useLocation';
import { useEventCheckin } from '../../hooks/useEventCheckin';
import { useEventStories } from '../../hooks/useEventStories';
import { useAuthStore } from '../../stores/authStore';
import { imagePickerService } from '../../services/imagePickerService';
import { cloudinaryService } from '../../services/cloudinaryService';
import { firestoreService } from '../../services/firestoreService';
import { calculateDistance } from '../../utils/locationUtils';
import { colors, radius, spacing } from '../../utils/theme';

export default function EventStorySection({ eventId, eventLocation }) {
  const { location, isFetchingLocation } = useLocation();
  const { hasCheckedIn, isLoading: checkingInStatus } = useEventCheckin(eventId);
  const { stories, isLoading: loadingStories } = useEventStories(eventId);
  const user = useAuthStore((s) => s.user);

  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckIn = async () => {
    if (!location) {
      Alert.alert('Location Required', 'Please wait until your location is available.');
      return;
    }
    if (!eventLocation) return;

    const distanceKm = calculateDistance(
      location.latitude,
      location.longitude,
      eventLocation.latitude,
      eventLocation.longitude
    );

    // 0.5 km = 500 meters
    if (distanceKm > 0.5) {
      Alert.alert(
        'Too Far', 
        `You must be within 500 meters of the event to check in.\nYou are currently ${distanceKm.toFixed(1)} km away.`
      );
      return;
    }

    setIsProcessing(true);
    try {
      await firestoreService.checkInToEvent(eventId, user.uid);
      Alert.alert('Checked In!', 'You have successfully checked into this event. You can now add photos to the Event Story.');
    } catch (err) {
      Alert.alert('Error', 'Failed to check in.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddStory = async () => {
    try {
      const picked = await imagePickerService.fromLibrary();
      if (!picked) return;

      setIsProcessing(true);
      const uploaded = await cloudinaryService.uploadImage(picked, { folder: 'event_stories' });
      await firestoreService.addEventStory(eventId, user.uid, uploaded.secureUrl);
    } catch (err) {
      Alert.alert('Error', 'Failed to upload story photo.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.storyCard}>
      <View style={styles.headerRow}>
        <Text style={styles.storyTitle}>Event Story</Text>
        {checkingInStatus ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : hasCheckedIn ? (
          <Pressable 
            style={[styles.actionButton, styles.addStoryButton]} 
            onPress={handleAddStory}
            disabled={isProcessing}
          >
            {isProcessing ? <ActivityIndicator size="small" color="#FFF" /> : (
              <>
                <Ionicons name="camera" size={14} color="#FFF" />
                <Text style={styles.addStoryText}>Add Photo</Text>
              </>
            )}
          </Pressable>
        ) : (
          <Pressable 
            style={[styles.actionButton, styles.checkInButton]} 
            onPress={handleCheckIn}
            disabled={isProcessing || isFetchingLocation}
          >
            {isProcessing ? <ActivityIndicator size="small" color={colors.primary} /> : (
              <>
                <Ionicons name="location" size={14} color={colors.primary} />
                <Text style={styles.checkInText}>Check In</Text>
              </>
            )}
          </Pressable>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery} contentContainerStyle={styles.galleryContent}>
        {loadingStories ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.galleryLoader} />
        ) : stories.length === 0 ? (
          <View style={styles.emptyGallery}>
            <Ionicons name="images-outline" size={24} color="#CBD5E1" />
            <Text style={styles.emptyText}>No photos yet. Check in to add one!</Text>
          </View>
        ) : (
          stories.map((story) => (
            <Image key={story.id} source={{ uri: story.imageUrl }} style={styles.storyThumbnail} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  storyCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  storyTitle: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: radius.full,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  checkInButton: {
    backgroundColor: '#EEF2FF',
  },
  checkInText: {
    color: colors.primary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  addStoryButton: {
    backgroundColor: colors.primary,
  },
  addStoryText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  gallery: {
    marginHorizontal: -spacing.md,
  },
  galleryContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  storyThumbnail: {
    borderRadius: radius.md,
    height: 100,
    width: 80,
  },
  emptyGallery: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    flex: 1,
    gap: spacing.xs,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    width: 300,
  },
  emptyText: {
    color: colors.neutral,
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
  },
  galleryLoader: {
    alignSelf: 'center',
    marginVertical: spacing.xl,
  },
});
