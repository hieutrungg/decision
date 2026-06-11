// src/hooks/useFirestore.js
// Generic hook query 1 collection với filter đơn giản (realtime).
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, limit as fbLimit } from 'firebase/firestore';
import { db } from '../api/firebase';

/**
 * @param {string} collectionName
 * @param {[field, op, value][]} filters - vd: [['category','==','cafe']]
 * @param {number} max
 */
export function useFirestore(collectionName, filters = [], max = 20) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const parts = [collection(db, collectionName)];
    filters.forEach(([f, op, v]) => parts.push(where(f, op, v)));
    parts.push(fbLimit(max));

    const unsub = onSnapshot(
      query(...parts),
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      },
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, JSON.stringify(filters), max]);

  return { data, loading, error };
}
