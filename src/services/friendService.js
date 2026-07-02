// src/services/friendService.js
// [M5] Follow/Unfollow, search user, xem hoạt động bạn bè.
import {
  doc,
  collection,
  getDoc,
  getDocs,
  writeBatch,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  increment,
} from 'firebase/firestore';
import { db } from '../api/firebase';
import { COLLECTIONS } from '../utils/constants';

/**
 * Follow một user: ghi 2 chiều trong cùng 1 batch (atomic)
 * - following/{userId}/items/{targetId}   → userId đang follow targetId
 * - followers/{targetId}/items/{userId}   → targetId có follower là userId
 * Đồng thời tăng followingCount / followerCount trên doc user tương ứng
 * (đọc nhanh cho ProfileScreen, không cần đếm subcollection mỗi lần hiển thị).
 */
export async function followUser(userId, targetId) {
  if (userId === targetId) {
    throw new Error('Không thể tự follow chính mình.');
  }

  const followingRef = doc(db, COLLECTIONS.FOLLOWING, userId, 'items', targetId);
  const existing = await getDoc(followingRef);
  if (existing.exists()) return; // đã follow rồi — không ghi trùng, không tăng count trùng

  const followersRef = doc(db, COLLECTIONS.FOLLOWERS, targetId, 'items', userId);
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const targetRef = doc(db, COLLECTIONS.USERS, targetId);

  const batch = writeBatch(db);
  batch.set(followingRef, { createdAt: serverTimestamp() });
  batch.set(followersRef, { createdAt: serverTimestamp() });
  batch.update(userRef, { followingCount: increment(1) });
  batch.update(targetRef, { followerCount: increment(1) });
  await batch.commit();
}

/** Unfollow: xoá 2 chiều + giảm count, cũng atomic qua batch */
export async function unfollowUser(userId, targetId) {
  const followingRef = doc(db, COLLECTIONS.FOLLOWING, userId, 'items', targetId);
  const existing = await getDoc(followingRef);
  if (!existing.exists()) return; // chưa follow — không có gì để xoá

  const followersRef = doc(db, COLLECTIONS.FOLLOWERS, targetId, 'items', userId);
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const targetRef = doc(db, COLLECTIONS.USERS, targetId);

  const batch = writeBatch(db);
  batch.delete(followingRef);
  batch.delete(followersRef);
  batch.update(userRef, { followingCount: increment(-1) });
  batch.update(targetRef, { followerCount: increment(-1) });
  await batch.commit();
}

/** Kiểm tra userId có đang follow targetId không */
export async function isFollowing(userId, targetId) {
  const snap = await getDoc(doc(db, COLLECTIONS.FOLLOWING, userId, 'items', targetId));
  return snap.exists();
}

/** Danh sách userId mà userId đang follow */
export async function getFollowing(userId) {
  const snap = await getDocs(collection(db, COLLECTIONS.FOLLOWING, userId, 'items'));
  return snap.docs.map((d) => d.id);
}

/** Danh sách userId đang follow userId (followers) */
export async function getFollowers(userId) {
  const snap = await getDocs(collection(db, COLLECTIONS.FOLLOWERS, userId, 'items'));
  return snap.docs.map((d) => d.id);
}

/**
 * Search user theo displayNameLower (prefix search, field đã chốt ở họp đầu tuần).
 * Cần user doc có field displayNameLower = displayName.toLowerCase() (M1 đảm nhiệm ghi khi tạo/sửa profile).
 */
export async function searchUsers(keyword, max = 20) {
  const kw = (keyword ?? '').trim().toLowerCase();
  if (!kw) return [];

  const q = query(
    collection(db, COLLECTIONS.USERS),
    orderBy('displayNameLower'),
    where('displayNameLower', '>=', kw),
    where('displayNameLower', '<=', kw + '\uf8ff'),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

/**
 * Hoạt động gần đây của 1 user (dùng cho trang cá nhân bạn bè / feed):
 * danh sách completed gần nhất, kèm category đã lưu sẵn từ M5.3 (markCompleted).
 */
export async function getUserActivity(userId, max = 20) {
  const q = query(
    collection(db, COLLECTIONS.COMPLETED, userId, 'items'),
    orderBy('completedAt', 'desc'),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ expId: d.id, ...d.data() }));
}
