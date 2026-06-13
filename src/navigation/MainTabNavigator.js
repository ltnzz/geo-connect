import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Pressable, StyleSheet, View } from 'react-native';

import CreatePostScreen from '../screens/create/CreatePostScreen';
import EventScreen from '../screens/event/EventScreen';
import HomeScreen from '../screens/home/HomeScreen';
import MapScreen from '../screens/map/MapScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { colors } from '../utils/theme';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: ['home', 'home-outline'],
  Events: ['calendar', 'calendar-outline'],
  Maps: ['map', 'map-outline'],
  Profile: ['person', 'person-outline'],
};

function CameraTabButton({ accessibilityState, onPress }) {
  const isSelected = accessibilityState?.selected;

  return (
    <Pressable
      accessibilityLabel="Create post"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.cameraButtonSlot, pressed && styles.pressed]}
    >
      <View style={styles.centerCutout}>
        <View style={[styles.createButton, isSelected && styles.createButtonSelected]}>
          <Ionicons color={colors.surface} name="add" size={34} />
        </View>
      </View>
    </Pressable>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.neutral,
        tabBarIcon: ({ color, focused, size }) => {
          if (route.name === 'Create') {
            return null;
          }

          const [activeIcon, inactiveIcon] = TAB_ICONS[route.name];
          return <Ionicons color={color} name={focused ? activeIcon : inactiveIcon} size={size} />;
        },
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
      })}
    >
      <Tab.Screen component={HomeScreen} name="Home" />
      <Tab.Screen component={EventScreen} name="Events" />
      <Tab.Screen
        component={CreatePostScreen}
        name="Create"
        options={{
          tabBarButton: (props) => <CameraTabButton {...props} />,
          tabBarLabel: '',
        }}
      />
      <Tab.Screen component={MapScreen} name="Maps" />
      <Tab.Screen component={ProfileScreen} name="Profile" />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FCFCFD',
    borderTopColor: '#D8DEE8',
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 14,
    height: 72,
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: '#0F172A',
    shadowOffset: {
      height: -4,
      width: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  tabLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
  },
  cameraButtonSlot: {
    alignItems: 'center',
    flex: 1,
    overflow: 'visible',
  },
  centerCutout: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 39,
    height: 78,
    justifyContent: 'center',
    marginTop: -31,
    width: 78,
  },
  createButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 29,
    elevation: 8,
    height: 58,
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: {
      height: 4,
      width: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    width: 58,
  },
  createButtonSelected: {
    backgroundColor: colors.tertiary,
  },
  pressed: {
    opacity: 0.82,
  },
});
