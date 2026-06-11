// src/services/recommendService.js
// [M2] Recommendation Engine — RULE-BASED, KHÔNG ML (theo doc, mục 14: không over-engineer).
//
// Luồng: filters → query Firestore → group thành combo 2–3 hoạt động → ExperiencePackage
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../api/firebase';
import { COLLECTIONS } from '../utils/constants';

/** Query experiences theo mood + trần budget */
async function fetchCandidates({ budget, mood }) {
  // Cần composite index: mood (array-contains) + budget (<=) — tạo trong Firebase Console
  const q = query(
    collection(db, COLLECTIONS.EXPERIENCES),
    where('mood', 'array-contains', mood),
    where('budget', '<=', budget),
    limit(30),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function pickRandom(arr) {
  return arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;
}

/**
 * Rule-based combo: cafe → activity (workshop/entertainment) → food.
 * Ràng buộc: tổng budget <= budget, tổng duration <= duration.
 * @returns {Promise<{items: object[], totalBudget: number, totalDuration: number} | null>}
 */
export async function generatePackage({ budget, duration, mood }) {
  const candidates = await fetchCandidates({ budget, mood });
  if (!candidates.length) return null;

  const byCat = (cat) => candidates.filter((e) => e.category === cat);
  const slots = [byCat('cafe'), [...byCat('workshop'), ...byCat('entertainment')], byCat('food')];

  const items = [];
  let remainingBudget = budget;
  let remainingTime = duration;

  for (const slot of slots) {
    const ok = slot.filter((e) => e.budget <= remainingBudget && e.duration <= remainingTime);
    const picked = pickRandom(ok);
    if (picked) {
      items.push(picked);
      remainingBudget -= picked.budget;
      remainingTime -= picked.duration;
    }
  }

  // Cần ít nhất 2 hoạt động mới thành "mini itinerary"; nếu không, trả 1 gợi ý đơn
  if (items.length === 0) return null;
  return {
    items,
    totalBudget: items.reduce((s, e) => s + e.budget, 0),
    totalDuration: items.reduce((s, e) => s + e.duration, 0),
  };
}

/** Shake to Discover — 1 experience ngẫu nhiên theo profile */
export async function getRandomExperience({ budget = 500000, mood = 'relax' } = {}) {
  const candidates = await fetchCandidates({ budget, mood });
  return pickRandom(candidates);
}

export async function getSuggestionsByMood(mood, max = 10) {
  const q = query(
    collection(db, COLLECTIONS.EXPERIENCES),
    where('mood', 'array-contains', mood),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
