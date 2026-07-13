import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DiscoverScreen from '../screens/discover/DiscoverScreen';
import BrowseScreen from '../screens/experience/BrowseScreen';
import ExperienceDetailScreen from '../screens/experience/ExperienceDetailScreen';
import ExperienceFormScreen from '../screens/experience/ExperienceFormScreen';
import WishlistScreen from '../screens/experience/WishlistScreen';
import MapScreen from '../screens/map/MapScreen';
import ProfileScreen from '../screens/auth/ProfileScreen';
import EditPreferencesScreen from '../screens/auth/EditPreferencesScreen';
import EditProfileScreen from '../screens/auth/EditProfileScreen';
import CompletedScreen from '../screens/social/CompletedScreen';
import AchievementScreen from '../screens/social/AchievementScreen';
import FindFriendsScreen from '../screens/social/FindFriendsScreen';
import FollowingScreen from '../screens/social/FollowingScreen';
import FriendProfileScreen from '../screens/social/FriendProfileScreen';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../utils/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS = {
  Discover: { active: 'dice-multiple', inactive: 'dice-multiple-outline' },
  Browse: { active: 'view-grid', inactive: 'view-grid-outline' },
  Map: { active: 'map-marker-radius', inactive: 'map-marker-radius-outline' },
  Wishlist: { active: 'heart', inactive: 'heart-outline' },
  Profile: { active: 'account-circle', inactive: 'account-circle-outline' },
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const source = focused ? icons.active : icons.inactive;
          return (
            <MaterialCommunityIcons
              name={source}
              color={color}
              size={route.name === 'Map' ? size + 2 : size}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Discover" component={DiscoverScreen} options={{ title: 'Gợi ý' }} />
      <Tab.Screen name="Browse" component={BrowseScreen} options={{ title: 'Danh sách' }} />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        initialParams={{ viewMode: 'all', refreshKey: 0 }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Map', {
              viewMode: 'all',
              refreshKey: Date.now(),
            });
          },
        })}
        options={{ title: 'Bản đồ' }}
      />
      <Tab.Screen name="Wishlist" component={WishlistScreen} options={{ title: 'Đã lưu' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Cá nhân' }} />
    </Tab.Navigator>
  );
}

export default function MainTabs() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="ExperienceDetail"
        component={ExperienceDetailScreen}
        options={{ presentation: 'modal', title: 'Chi tiết' }}
      />
      <Stack.Screen
        name="ExperienceForm"
        component={ExperienceFormScreen}
        options={{ title: 'Tạo trải nghiệm' }}
      />
      <Stack.Screen
        name="Completed"
        component={CompletedScreen}
        options={{ title: 'Đã hoàn thành' }}
      />
      <Stack.Screen
        name="Achievement"
        component={AchievementScreen}
        options={{ title: 'Thành tích' }}
      />
      <Stack.Screen
        name="FindFriends"
        component={FindFriendsScreen}
        options={{ title: 'Tìm bạn' }}
      />
      <Stack.Screen
        name="Following"
        component={FollowingScreen}
        options={{ title: 'Đang theo dõi' }}
      />
      <Stack.Screen
        name="FriendProfile"
        component={FriendProfileScreen}
        options={{ title: 'Trang cá nhân' }}
      />
      <Stack.Screen
        name="EditPreferences"
        component={EditPreferencesScreen}
        options={{ title: 'Cài đặt sở thích' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Sửa hồ sơ' }}
      />
    </Stack.Navigator>
  );
}
