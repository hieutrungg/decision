// src/services/socialService.js
// [M5] Social & Gamification — completed list, streak, achievement.
import {
  doc,
  collection,
  setDoc,
  getDoc,
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
import { BADGES } from '../utils/badges';

/**
 * Đánh dấu đã trải nghiệm + tăng completedCount.
 * category được lưu kèm để tính badge "đa dạng category" mà không cần
 * đọc lại getExperienceById cho từng completed item.
 */
export async function markCompleted(userId, expId, category = null) {
  await setDoc(doc(db, COLLECTIONS.COMPLETED, userId, 'items', expId), {
    completedAt: serverTimestamp(),
    category,
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
 *
 * Trả về streak SAU khi cập nhật, để caller dùng ngay cho việc chấm badge
 * mà không cần đọc lại profile.
 */
export async function updateStreak(userId, lastCompletedDate) {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const userSnap = await getDoc(userRef);
  const currentStreak = userSnap.exists() ? (userSnap.data()?.streak ?? 0) : 0;

  let newStreak;

  if (!lastCompletedDate) {
    newStreak = 1;
  } else {
    const prevDate = lastCompletedDate.toDate ? lastCompletedDate.toDate() : lastCompletedDate;

    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const now = new Date();
    const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const prevMid = new Date(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate());
    const diffDays = Math.round((todayMid - prevMid) / MS_PER_DAY);

    if (diffDays === 1) {
      newStreak = currentStreak + 1;
    } else if (diffDays === 0) {
      newStreak = currentStreak; // đã check-in hôm nay rồi — giữ nguyên
    } else {
      newStreak = 1;
    }
  }

  if (newStreak !== currentStreak) {
    await updateDoc(userRef, { streak: newStreak });
  }

  return newStreak;
}

export async function grantBadge(userId, badgeId, meta = {}) {
  await setDoc(doc(db, COLLECTIONS.ACHIEVEMENTS, userId, 'badges', badgeId), {
    ...meta,
    grantedAt: serverTimestamp(),
  });
}

/** Lấy danh sách badge đã đạt, dạng { [badgeId]: { grantedAt, ... } } */
export async function getGrantedBadges(userId) {
  const snap = await getDocs(collection(db, COLLECTIONS.ACHIEVEMENTS, userId, 'badges'));
  const map = {};
  snap.docs.forEach((d) => {
    map[d.id] = d.data();
  });
  return map;
}

/**
 * Chấm điều kiện toàn bộ BADGES dựa trên context hiện tại, cấp badge nào
 * đủ điều kiện mà chưa có. Gọi sau mỗi check-in thành công.
 *
 * @param {string} userId
 * @param {number} streak - streak SAU khi updateStreak (dùng giá trị trả về của updateStreak)
 * @returns {Promise<Array>} danh sách badge vừa được cấp mới (để hiện thông báo)
 */
export async function checkAndGrantBadges(userId, streak) {
  const [completed, granted] = await Promise.all([getCompleted(userId), getGrantedBadges(userId)]);

  const completedCount = completed.length;
  const categories = new Set(completed.map((c) => c.category).filter(Boolean));
  const ctx = { completedCount, streak, categories };

  const newlyGranted = [];
  for (const badge of BADGES) {
    if (granted[badge.id]) continue; // đã có rồi, bỏ qua
    if (badge.check(ctx)) {
      await grantBadge(userId, badge.id);
      newlyGranted.push(badge);
    }
  }
  return newlyGranted;
}
