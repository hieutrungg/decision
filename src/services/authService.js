// src/services/authService.js
// [M1] Auth + Profile. UI chỉ gọi các hàm này, không import firebase/auth trực tiếp.
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as fbUpdateProfile,
} from 'firebase/auth';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../api/firebase';
import { COLLECTIONS } from '../utils/constants';

export async function register(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await fbUpdateProfile(cred.user, { displayName });

  // Tạo document profile trong Firestore
  await setDoc(doc(db, COLLECTIONS.USERS, cred.user.uid), {
    email,
    displayName: displayName ?? '',
    displayNameLower: (displayName ?? '').toLowerCase(),
    avatar: '',
    preferences: { defaultBudget: 300000, defaultMood: 'relax' },
    streak: 0,
    completedCount: 0,
    createdAt: serverTimestamp(),
  });
  return cred.user;
}

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export function logout() {
  return signOut(auth);
}

export function getCurrentUser() {
  return auth.currentUser;
}

export function updateUserProfile(uid, data) {
  return updateDoc(doc(db, COLLECTIONS.USERS, uid), data);
}
