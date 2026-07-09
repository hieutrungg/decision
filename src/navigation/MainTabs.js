import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DiscoverScreen from '../screens/discover/DiscoverScreen';
import BrowseScreen from '../screens/experience/BrowseScreen';
import ExperienceDetailScreen from '../screens/experience/ExperienceDetailScreen';
import MapScreen from '../screens/map/MapScreen';
import ProfileScreen from '../screens/auth/ProfileScreen';
import CompletedScreen from '../screens/social/CompletedScreen';
import AchievementScreen from '../screens/social/AchievementScreen';
import FindFriendsScreen from '../screens/social/FindFriendsScreen';
import FollowingScreen from '../screens/social/FollowingScreen';
import FriendProfileScreen from '../screens/social/FriendProfileScreen';
import { colors } from '../utils/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
      }}
    >
      <Tab.Screen name="Discover" component={DiscoverScreen} options={{ title: 'Goi y' }} />
      <Tab.Screen name="Browse" component={BrowseScreen} options={{ title: 'Danh sach' }} />
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
        options={{ title: 'Ban do' }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Ca nhan' }} />
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
        options={{ presentation: 'modal', title: 'Chi tiet' }}
      />
      <Stack.Screen
        name="Completed"
        component={CompletedScreen}
        options={{ title: 'Đã hoàn thành' }}
      />
      {/* ← MỚI: màn thành tích, mở từ ProfileScreen */}
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
        name="Completed"
        component={CompletedScreen}
        options={{ title: 'Đã hoàn thành' }}
      />
      {/* ← MỚI: màn thành tích, mở từ ProfileScreen */}
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
    </Stack.Navigator>
  );
}
