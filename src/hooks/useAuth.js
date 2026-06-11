// src/hooks/useAuth.js
// Hook tiện dụng gộp auth state + các action.
import { useAuthContext } from '../context/AuthContext';
import * as authService from '../services/authService';

export function useAuth() {
  const { user, initializing } = useAuthContext();
  return {
    user,
    initializing,
    isLoggedIn: !!user,
    login: authService.login,
    register: authService.register,
    logout: authService.logout,
  };
}
