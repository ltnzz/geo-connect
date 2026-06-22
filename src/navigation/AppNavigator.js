import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MainTabNavigator from './MainTabNavigator';
import ConnectionsScreen from '../screens/profile/ConnectionsScreen';
import ProfileFeedScreen from '../screens/profile/ProfileFeedScreen';
import NotificationScreen from '../screens/notification/NotificationScreen';
import PostDetailScreen from '../screens/post/PostDetailScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import EventDetailScreen from '../screens/event/EventDetailScreen';
import SearchScreen from '../screens/search/SearchScreen';
import AllNewEventsScreen from '../screens/event/AllNewEventsScreen';
import EditEventScreen from '../screens/create/EditEventScreen';
import DraftsScreen from '../screens/create/DraftsScreen';
import VenueDetailScreen from '../screens/venue/VenueDetailScreen';
import { useColors } from '../utils/theme';
import { useThemeStore } from '../stores/themeStore';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const colors = useColors();
  const themeMode = useThemeStore((state) => state.mode);

  const baseTheme = themeMode === 'dark' ? DarkTheme : DefaultTheme;

  const navigationTheme = {
    ...baseTheme,
    dark: themeMode === 'dark',
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen name="Connections" component={ConnectionsScreen} />
        <Stack.Screen name="ProfileFeed" component={ProfileFeedScreen} />
        <Stack.Screen name="Notification" component={NotificationScreen} />
        <Stack.Screen name="PostDetail" component={PostDetailScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="EventDetail" component={EventDetailScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="AllNewEvents" component={AllNewEventsScreen} />
        <Stack.Screen name="EditEvent" component={EditEventScreen} />
        <Stack.Screen name="Drafts" component={DraftsScreen} />
        <Stack.Screen name="VenueDetail" component={VenueDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

