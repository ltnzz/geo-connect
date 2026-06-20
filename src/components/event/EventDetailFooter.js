import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../utils/theme';

export default function EventDetailFooter({
  isOwnEvent,
  response,
  onResponseChange,
  onDelete,
  onEdit,
}) {
  if (isOwnEvent) {
    return (
      <>
        <Pressable
          accessibilityRole="button"
          onPress={onDelete}
          style={[styles.responseButton, styles.deleteButton]}
        >
          <Ionicons color="#E11D48" name="trash-outline" size={16} />
          <Text style={[styles.buttonText, { color: '#E11D48' }]}>Delete</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onEdit}
          style={[styles.responseButton, styles.goingButton, styles.goingSelected]}
        >
          <Ionicons color="#FFFFFF" name="pencil" size={16} />
          <Text style={[styles.goingText, styles.goingTextSelected]}>Edit Event</Text>
        </Pressable>
      </>
    );
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => onResponseChange(response === 'interested' ? null : 'interested')}
        style={[
          styles.responseButton,
          response === 'interested' && styles.interestedSelected,
        ]}
      >
        <Ionicons
          color={response === 'interested' ? colors.tertiary : colors.neutral}
          name={response === 'interested' ? 'bookmark' : 'bookmark-outline'}
          size={16}
        />
        <Text
          style={[
            styles.buttonText,
            response === 'interested' && styles.interestedTextSelected,
          ]}
        >
          Interested
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => onResponseChange(response === 'going' ? null : 'going')}
        style={[
          styles.responseButton,
          styles.goingButton,
          response === 'going' && styles.goingSelected,
        ]}
      >
        <Ionicons
          color={response === 'going' ? '#FFFFFF' : colors.primary}
          name={response === 'going' ? 'checkmark-circle' : 'checkmark-circle-outline'}
          size={17}
        />
        <Text
          style={[
            styles.goingText,
            response === 'going' && styles.goingTextSelected,
          ]}
        >
          Going
        </Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  responseButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: '#C7D2E3',
    borderRadius: radius.sm,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    height: 44,
    justifyContent: 'center',
  },
  deleteButton: {
    borderColor: '#FFE4E6',
    backgroundColor: '#FFF1F2',
  },
  interestedSelected: {
    backgroundColor: '#EAF8F2',
    borderColor: colors.tertiary,
  },
  buttonText: {
    color: colors.neutral,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  interestedTextSelected: {
    color: colors.tertiary,
  },
  goingSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  goingButton: {
    flex: 2,
  },
  goingText: {
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  goingTextSelected: {
    color: '#FFFFFF',
  },
});
