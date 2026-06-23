import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useColors, radius, spacing } from '../../utils/theme';

export default function CreateStoryModal({
  visible,
  onClose,
  imageUri,
  events = [],
  onShare,
  isSharing,
}) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  
  useEffect(() => {
    if (visible) {
      setSelectedEvent(null);
    }
  }, [visible]);

  const handleShare = () => {
    if (!selectedEvent || !imageUri) return;
    onShare(selectedEvent);
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalContent}>
          {}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>New Story</Text>
            <Pressable hitSlop={8} onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {}
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

            {}
            <Text style={styles.sectionTitle}>Tag an Event</Text>
            <Text style={styles.sectionSubtitle}>Select the event where you want to share this photo:</Text>
            
            {events.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={32} color={colors.neutral} />
                <Text style={styles.emptyText}>No events available to tag.</Text>
              </View>
            ) : (
              <View style={styles.eventList}>
                {events.map((item) => {
                  const isSelected = selectedEvent?.id === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setSelectedEvent(item)}
                      style={[
                        styles.eventCard,
                        isSelected && styles.eventCardActive,
                      ]}
                    >
                      {item.bannerUrl ? (
                        <Image source={{ uri: item.bannerUrl }} style={styles.eventBanner} />
                      ) : (
                        <View style={styles.eventBannerPlaceholder}>
                          <Ionicons name="calendar" size={20} color={colors.primary} />
                        </View>
                      )}
                      
                      <View style={styles.eventInfo}>
                        <Text numberOfLines={1} style={styles.eventTitle}>
                          {item.title}
                        </Text>
                        <Text numberOfLines={1} style={styles.eventLocation}>
                          {item.location?.city || item.location?.address || 'Nearby'}
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
                })}
              </View>
            )}
          </ScrollView>

          {}
          <View style={styles.footer}>
            <Pressable
              disabled={!selectedEvent || isSharing}
              onPress={handleShare}
              style={[
                styles.shareButton,
                (!selectedEvent || isSharing) && styles.shareButtonDisabled,
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
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    height: '85%',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
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
