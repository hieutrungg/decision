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
  query,
  orderBy,
  limit,
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
 * Lấy completedAt của lần check-in gần nhất (trước khi thêm bản ghi mới).
 * Trả về Firestore Timestamp hoặc null nếu chưa từng check-in.
 */
export async function getLastCompleted(userId) {
  const q = query(
    collection(db, COLLECTIONS.COMPLETED, userId, 'items'),
    orderBy('completedAt', 'desc'),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data()?.completedAt ?? null;
}

/**
 * Cập nhật streak dựa trên lastCompletedDate (đọc TRƯỚC khi ghi bản ghi mới).
 * - Cách 1 ngày (hôm qua) → +1
 * - Cùng ngày hôm nay → giữ nguyên
 * - Cách >1 ngày, hoặc chưa từng check-in → reset về 1
 */
export async function updateStreak(userId, lastCompletedDate) {
  const userRef = doc(db, COLLECTIONS.USERS, userId);

  if (!lastCompletedDate) {
    await updateDoc(userRef, { streak: 1 });
    return;
  }

  const prevDate = lastCompletedDate.toDate ? lastCompletedDate.toDate() : lastCompletedDate;

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const now = new Date();
  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const prevMid = new Date(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate());
  const diffDays = Math.round((todayMid - prevMid) / MS_PER_DAY);

  if (diffDays === 1) {
    await updateDoc(userRef, { streak: increment(1) });
  } else if (diffDays === 0) {
    // đã check-in hôm nay rồi (ở experience khác) — giữ nguyên
  } else {
    await updateDoc(userRef, { streak: 1 });
  }
}

export async function grantBadge(userId, badgeId, meta = {}) {
  await setDoc(doc(db, COLLECTIONS.ACHIEVEMENTS, userId, 'badges', badgeId), {
    ...meta,
    grantedAt: serverTimestamp(),
  });
}
