import { createContext, useContext, useState, useCallback } from 'react';
import {
  getStoredUser,
  loginWithBackend,
  saveAuthSession,
  clearAuthSession,
  getRoleDashboardPath,
} from '../lib/authApi';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async ({ identifier, email, phone, password }) => {
    setLoading(true);
    setError(null);
    try {
      const authData = await loginWithBackend({ identifier, email, phone, password });
      setUser(authData.user);
      return { success: true, user: authData.user, redirect_to: authData.redirect_to || getRoleDashboardPath(authData.user.role) };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
