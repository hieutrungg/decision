// src/services/experienceService.js
// [M4] Experience CRUD + bookmark + review.
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../api/firebase';
import { COLLECTIONS } from '../utils/constants';

export async function createExperience(data) {
  const ref = await addDoc(collection(db, COLLECTIONS.EXPERIENCES), {
    ...data,
    rating: 0,
    reviewCount: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateExperience(expId, data) {
  await updateDoc(doc(db, COLLECTIONS.EXPERIENCES, expId), data);
}

/** Chỉ creator mới xóa được (firestore.rules enforce). Reviews cũ giữ nguyên — chấp nhận trong scope đồ án. */
export async function deleteExperience(expId) {
  await deleteDoc(doc(db, COLLECTIONS.EXPERIENCES, expId));
}

/** Upload ảnh local (uri từ expo-image-picker) lên Firebase Storage, trả về download URL */
export async function uploadExperienceImage(localUri, userId) {
  const res = await fetch(localUri);
  const blob = await res.blob();
  const path = `experiences/${userId}_${Date.now()}.jpg`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, blob);
  return getDownloadURL(ref);
}

/** Experience do chính user tạo — sort client-side để khỏi cần composite index */
export async function listMyExperiences(userId) {
  const q = query(
    collection(db, COLLECTIONS.EXPERIENCES),
    where('createdBy', '==', userId),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
}

export async function getExperienceById(id) {
  const snap = await getDoc(doc(db, COLLECTIONS.EXPERIENCES, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Phân trang: truyền lastDoc của lần trước để lấy trang kế (doc mục 11: limit 10/lần) */
export async function listExperiences(filters = {}, pageSize = 10, lastDoc = null) {
  const parts = [collection(db, COLLECTIONS.EXPERIENCES)];
  if (filters.category) parts.push(where('category', '==', filters.category));
  if (filters.mood) parts.push(where('mood', 'array-contains', filters.mood));
  parts.push(orderBy('createdAt', 'desc'));
  if (lastDoc) parts.push(startAfter(lastDoc));
  parts.push(limit(pageSize));

  const snap = await getDocs(query(...parts));
  return {
    items: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    lastDoc: snap.docs[snap.docs.length - 1] ?? null,
  };
}

export async function toggleBookmark(userId, expId) {
  const ref = doc(db, COLLECTIONS.BOOKMARKS, userId, 'items', expId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
    return false;
  }
  await setDoc(ref, { createdAt: serverTimestamp() });
  return true;
}

export async function getBookmarks(userId) {
  const snap = await getDocs(collection(db, COLLECTIONS.BOOKMARKS, userId, 'items'));
  return snap.docs.map((d) => d.id); // danh sách expId
}

/**
 * Thêm review + cập nhật rating trung bình trên experience.
 * Công thức tăng dần: newAvg = (avg × count + rating) / (count + 1)
 * (rules cho phép user thường update riêng 2 field rating/reviewCount)
 */
export async function addReview(expId, userId, rating, comment) {
  const ref = await addDoc(collection(db, COLLECTIONS.REVIEWS), {
    expId,
    userId,
    rating,
    comment,
    createdAt: serverTimestamp(),
  });

  const expRef = doc(db, COLLECTIONS.EXPERIENCES, expId);
  const expSnap = await getDoc(expRef);
  if (expSnap.exists()) {
    const { rating: avg = 0, reviewCount: count = 0 } = expSnap.data();
    await updateDoc(expRef, {
      rating: Math.round(((avg * count + rating) / (count + 1)) * 10) / 10,
      reviewCount: count + 1,
    });
  }
  return ref.id;
}

export async function getReviews(expId, max = 20) {
  const q = query(
    collection(db, COLLECTIONS.REVIEWS),
    where('expId', '==', expId),
    orderBy('createdAt', 'desc'),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Lấy các review MÀ userId đã viết (khác getReviews — lọc theo expId) */
export async function getReviewsByUser(userId, max = 20) {
  const q = query(
    collection(db, COLLECTIONS.REVIEWS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
