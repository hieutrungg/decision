// src/api/firebase.js
// Khởi tạo Firebase Web SDK (chạy được trong Expo Go, KHÔNG dùng @react-native-firebase)
import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

const firebaseConfig = {
  apiKey: extra.firebaseApiKey,
  authDomain: extra.firebaseAuthDomain,
  projectId: extra.firebaseProjectId,
  storageBucket: extra.firebaseStorageBucket,
  messagingSenderId: extra.firebaseMessagingSenderId,
  appId: extra.firebaseAppId,
};

// Tránh khởi tạo 2 lần khi Fast Refresh
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Auth với persistence qua AsyncStorage (giữ đăng nhập khi mở lại app)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
