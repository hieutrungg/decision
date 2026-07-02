// src/navigation/MainTabs.js
// Root stack: Tabs + ExperienceDetail (modal dùng chung cho mọi tab)
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DiscoverScreen from '../screens/discover/DiscoverScreen';
import BrowseScreen from '../screens/experience/BrowseScreen';
import ExperienceDetailScreen from '../screens/experience/ExperienceDetailScreen';
import MapScreen from '../screens/map/MapScreen';
import ProfileScreen from '../screens/auth/ProfileScreen';
import CompletedScreen from '../screens/social/CompletedScreen';
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
      <Tab.Screen name="Discover" component={DiscoverScreen} options={{ title: 'Gợi ý' }} />
      <Tab.Screen name="Browse" component={BrowseScreen} options={{ title: 'Danh sách' }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ title: 'Bản đồ' }} />
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
        name="Completed"
        component={CompletedScreen}
        options={{ title: 'Đã hoàn thành' }}
      />
    </Stack.Navigator>
  );
}
