import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import CreateEventScreen from './CreateEventScreen';
import ScreenHeader from '../../components/common/ScreenHeader';
import { colors, radius, spacing } from '../../utils/theme';

export default function CreatePostScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('POST');
  const [content, setContent] = useState('');

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
        {/* Tabs */}
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

        {activeTab === 'POST' ? (
          <>
            {/* Input */}
            <TextInput
              multiline
              onChangeText={setContent}
              placeholder="What's happening around you right now?"
              placeholderTextColor={colors.neutral}
              style={styles.textInput}
              value={content}
            />

            {/* Image Grid */}
            <View style={styles.imageGrid}>
              <Pressable style={styles.addImageButton}>
                <Ionicons color={colors.primary} name="add" size={24} />
              </Pressable>
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: 'https://picsum.photos/400/400' }}
                  style={styles.selectedImage}
                />
                <Pressable style={styles.removeImageButton}>
                  <Ionicons color={colors.text} name="close-circle" size={20} />
                </Pressable>
              </View>
            </View>

            {/* Location Box */}
            <View style={styles.locationBox}>
              <Ionicons color={colors.primary} name="location" size={20} />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationTitle}>Current Location: East</Text>
                <Text style={styles.locationTitle}>Jakarta</Text>
              </View>
              <View style={styles.accuracyBadge}>
                <Text style={styles.accuracyText}>±5m</Text>
                <Text style={styles.accuracyText}>exact</Text>
              </View>
            </View>

            {/* Visibility */}
            <View style={styles.visibilityContainer}>
              <Text style={styles.visibilityLabel}>Visibility:</Text>
              <Pressable style={styles.visibilityPill}>
                <Ionicons color={colors.primary} name="earth" size={16} />
                <Text style={styles.visibilityPillText}>Public (5km radius)</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <CreateEventScreen />
        )}

      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <Pressable style={styles.submitButton}>
          <Text style={styles.submitButtonText}>
            {activeTab === 'POST' ? 'CREATE POST' : 'CREATE EVENT'}
          </Text>
        </Pressable>
      </View>
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
    marginBottom: spacing.xl,
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
  locationBox: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.xl,
    padding: spacing.md,
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  locationTitle: {
    color: colors.text,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
  },
  accuracyBadge: {
    alignItems: 'center',
  },
  accuracyText: {
    color: colors.neutral,
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
  },
  visibilityContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  visibilityLabel: {
    color: colors.neutral,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
  },
  visibilityPill: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9', // light gray
    borderColor: '#E2E8F0',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  visibilityPillText: {
    color: colors.text,
    fontFamily: 'Poppins_400Regular', // Courier/Monospace look for the (5km radius) could be done if needed, keeping simple
    fontSize: 12,
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
  submitButtonText: {
    color: colors.surface,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    letterSpacing: 1,
  },
});
