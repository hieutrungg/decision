// src/services/socialService.js
// [M5] Social & Gamification — completed list, streak, achievement.
import {
  doc,
  collection,
  setDoc,
  getDocs,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../api/firebase';
import { COLLECTIONS } from '../utils/constants';

/** Đánh dấu đã trải nghiệm + tăng completedCount */
export async function markCompleted(userId, expId) {
  await setDoc(doc(db, COLLECTIONS.COMPLETED, userId, 'items', expId), {
    completedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
    completedCount: increment(1),
  });
}

export async function getCompleted(userId) {
  const snap = await getDocs(collection(db, COLLECTIONS.COMPLETED, userId, 'items'));
  return snap.docs.map((d) => ({ expId: d.id, ...d.data() }));
}

/**
 * Cập nhật streak: nếu lần completed gần nhất là hôm qua → +1, cách >1 ngày → reset 1.
 * Đơn giản hóa: client tính, đủ cho demo (production sẽ cần Cloud Function).
 */
export async function updateStreak(userId, lastCompletedDate) {
  const today = new Date();
  const diffDays = lastCompletedDate
    ? Math.floor((today - lastCompletedDate) / (1000 * 60 * 60 * 24))
    : null;

  const userRef = doc(db, COLLECTIONS.USERS, userId);
  if (diffDays === 1) {
    await updateDoc(userRef, { streak: increment(1) });
  } else if (diffDays === null || diffDays > 1) {
    await updateDoc(userRef, { streak: 1 });
  }
  // diffDays === 0: đã tính hôm nay, không làm gì
}

export async function grantBadge(userId, badgeId, meta = {}) {
  await setDoc(doc(db, COLLECTIONS.ACHIEVEMENTS, userId, 'badges', badgeId), {
    ...meta,
    grantedAt: serverTimestamp(),
  });
}
