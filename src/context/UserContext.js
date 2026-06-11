// src/context/UserContext.js
// [M1] Profile + preferences của user hiện tại (đọc từ Firestore users/{uid}).
import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../api/firebase';
import { useAuthContext } from './AuthContext';
import { COLLECTIONS } from '../utils/constants';

const UserContext = createContext({ profile: null, loading: true });

export function UserProvider({ children }) {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const ref = doc(db, COLLECTIONS.USERS, user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  return <UserContext.Provider value={{ profile, loading }}>{children}</UserContext.Provider>;
}

export const useUser = () => useContext(UserContext);
