import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    api
      .get('/auth/me')
      .then(({ user: sessionUser }) => setUser(sessionUser))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      authOpen,
      openAuth: () => setAuthOpen(true),
      closeAuth: () => setAuthOpen(false),
      async login(input) {
        const result = await api.post('/auth/login', input);
        setUser(result.user);
        setAuthOpen(false);
        return result.user;
      },
      async register(input) {
        const result = await api.post('/auth/register', input);
        setUser(result.user);
        setAuthOpen(false);
        return result.user;
      },
      async logout() {
        await api.post('/auth/logout');
        setUser(null);
      },
      updateUser: setUser,
      requireUser(callback) {
        if (!user) {
          setAuthOpen(true);
          return false;
        }
        callback?.();
        return true;
      },
    }),
    [user, loading, authOpen],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
