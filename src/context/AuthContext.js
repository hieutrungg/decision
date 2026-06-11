// src/context/AuthContext.js
// [M1] Auth state toàn app. UI KHÔNG gọi Firebase trực tiếp — đi qua authService.
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../api/firebase';

const AuthContext = createContext({ user: null, initializing: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });
    return unsub;
  }, []);

  return <AuthContext.Provider value={{ user, initializing }}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => useContext(AuthContext);
