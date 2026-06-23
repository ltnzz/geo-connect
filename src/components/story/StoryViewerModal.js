import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { formatRelativeTime } from '../../utils/dateUtils';

const STORY_DURATION = 5000;

export default function StoryViewerModal({ visible, stories = [], initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
    }
  }, [visible, initialIndex]);

  const currentStory = stories[currentIndex];

  const startAnimation = () => {
    progressAnim.setValue(0);
    animationRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });
    
    animationRef.current.start(({ finished }) => {
      if (finished) {
        handleNext();
      }
    });
  };

  useEffect(() => {
    if (visible && currentStory) {
      startAnimation();
    }
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [visible, currentIndex, currentStory]);

  if (!visible || !currentStory) {
    return null;
  }

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleTap = (evt) => {
    const x = evt.nativeEvent.locationX;
    const screenWidth = Dimensions.get('window').width;
    if (x < screenWidth * 0.35) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <Pressable onPress={handleTap} style={styles.container}>
        {}
        <Image source={{ uri: currentStory.mediaUrl }} style={styles.storyImage} />

        {}
        <View style={styles.topOverlay}>
          {}
          <View style={styles.progressRow}>
            {stories.map((story, index) => {
              let width = '0%';
              if (index < currentIndex) width = '100%';
              else if (index === currentIndex) {
                width = progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                });
              }

              return (
                <View key={story.id} style={styles.progressTrack}>
                  <Animated.View style={[styles.progressBar, { width }]} />
                </View>
              );
            })}
          </View>

          {}
          <View style={styles.userInfoRow}>
            <View style={styles.avatar}>
              {currentStory.userAvatar ? (
                <Image source={{ uri: currentStory.userAvatar }} style={styles.avatarImage} />
              ) : (
                <Ionicons color="#FFFFFF" name="person" size={14} />
              )}
            </View>
            <View style={styles.userText}>
              <View style={styles.usernameRow}>
                <Text numberOfLines={1} style={styles.username}>
                  @{currentStory.username}
                </Text>
                {currentStory.createdAt && (
                  <Text style={styles.timeText}>
                    {' · '}{formatRelativeTime(currentStory.createdAt)}
                  </Text>
                )}
              </View>
              <Text numberOfLines={1} style={styles.eventTitle}>
                {currentStory.placeName
                  ? `at ${currentStory.placeName}`
                  : currentStory.eventTitle
                    ? `in ${currentStory.eventTitle}`
                    : 'AroundU'}
              </Text>
            </View>
            <Pressable hitSlop={12} onPress={onClose} style={styles.closeButton}>
              <Ionicons color="#FFFFFF" name="close" size={24} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    flex: 1,
    justifyContent: 'center',
  },
  storyImage: {
    height: '100%',
    resizeMode: 'contain',
    width: '100%',
  },
  topOverlay: {
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 46,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    height: 3,
    width: '100%',
  },
  progressTrack: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 1.5,
    flex: 1,
    height: '100%',
    overflow: 'hidden',
  },
  progressBar: {
    backgroundColor: '#FFFFFF',
    height: '100%',
  },
  userInfoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 12,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 36,
  },
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  userText: {
    flex: 1,
    marginLeft: 10,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 2,
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 2,
  },
  eventTitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    marginTop: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 2,
  },
  closeButton: {
    padding: 4,
  },
});
