// src/navigation/RootNavigator.js
// Phân nhánh: chưa login → AuthStack, đã login → MainTabs.
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuthContext } from '../context/AuthContext';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';

export default function RootNavigator() {
  const { user, initializing } = useAuthContext();

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return user ? <MainTabs /> : <AuthStack />;
}
