import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  ActivityIndicator,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { firestoreService } from '../../services/firestoreService';
import { useLocation } from '../../hooks/useLocation';
import { useColors, radius, spacing } from '../../utils/theme';

export default function CreateStoryModal({
  visible,
  onClose,
  imageUri,
  events = [],
  places = [],
  onShare,
  isSharing,
}) {
  const [selectedTarget, setSelectedTarget] = useState(null);
  
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    if (visible) {
      setSelectedTarget(null);
    }
  }, [visible]);

  const handleShare = () => {
    if (!selectedTarget || !imageUri) return;
    onShare(selectedTarget);
  };

  const renderTargetItem = (item, isEvent) => {
    const isSelected = selectedTarget?.id === item.id;
    return (
      <Pressable
        key={item.id}
        onPress={() => setSelectedTarget({ ...item, type: isEvent ? 'event' : 'place' })}
        style={[
          styles.eventCard,
          isSelected && styles.eventCardActive,
        ]}
      >
        {item.bannerUrl || item.photoUrl ? (
          <Image source={{ uri: item.bannerUrl || item.photoUrl }} style={styles.eventBanner} />
        ) : (
          <View style={styles.eventBannerPlaceholder}>
            <Ionicons name={isEvent ? "calendar" : "business"} size={20} color={colors.primary} />
          </View>
        )}
        
        <View style={styles.eventInfo}>
          <Text numberOfLines={1} style={styles.eventTitle}>
            {item.title || item.name}
          </Text>
          <Text numberOfLines={1} style={styles.eventLocation}>
            {item.location?.city || item.address || 'Nearby'}
          </Text>
        </View>

        <View style={[
          styles.radioCircle,
          isSelected && styles.radioCircleActive
        ]}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalContent}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.md) }]}>
          <Pressable hitSlop={8} onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>New Story</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.previewPlaceholder}>
                <Ionicons name="image-outline" size={48} color={colors.neutral} />
              </View>
            )}
          </View>

          {events.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Tag an Event</Text>
              <Text style={styles.sectionSubtitle}>Select the event where you want to share this photo:</Text>
              <View style={styles.eventList}>
                {events.map((item) => renderTargetItem(item, true))}
              </View>
            </>
          )}

          {places.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Tag a Venue</Text>
              <Text style={styles.sectionSubtitle}>Select the venue where you want to share this photo:</Text>
              <View style={styles.eventList}>
                {places.map((item) => renderTargetItem(item, false))}
              </View>
            </>
          )}

          {events.length === 0 && places.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={32} color={colors.neutral} />
              <Text style={styles.emptyText}>No events or venues available to tag.</Text>
            </View>
          )}

        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            disabled={!selectedTarget || isSharing}
            onPress={handleShare}
            style={[
              styles.shareButton,
              (!selectedTarget || isSharing) && styles.shareButtonDisabled,
            ]}
          >
            {isSharing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
                <Text style={styles.shareButtonText}>Share Story</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  modalContent: {
    backgroundColor: colors.surface,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  closeButton: {
    padding: spacing.xs,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.neutral,
    marginBottom: spacing.md,
  },
  previewContainer: {
    width: '100%',
    height: 220,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.border,
    borderWidth: 1,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.neutral,
  },
  eventList: {
    gap: spacing.sm,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  eventCardActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  eventBanner: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
  },
  eventBannerPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: `${colors.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  eventLocation: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: colors.neutral,
    marginTop: 1,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: colors.primary,
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  shareButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  shareButtonDisabled: {
    backgroundColor: colors.border,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
});
