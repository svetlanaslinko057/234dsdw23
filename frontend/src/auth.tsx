import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

type User = {
  user_id: string;
  email: string;
  name: string;
  roles: string[];
  active_role: string;
  tier: string;
  strikes: number;
  capacity: number;
  active_modules: number;
};

type AuthCtx = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, roles: string[]) => Promise<void>;
  verifyCode: (email: string, code: string, name?: string) => Promise<void>;
  demoLogin: () => Promise<string>;  // returns project_id for redirect
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    try {
      const t = await AsyncStorage.getItem('atlas_token');
      if (t) {
        const res = await api.get('/mobile/auth/me', { headers: { Authorization: `Bearer ${t}` } });
        setToken(t);
        setUser(res.data.user);
      }
    } catch {
      await AsyncStorage.removeItem('atlas_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSession(); }, [loadSession]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/mobile/auth/login', { email, password });
    await AsyncStorage.setItem('atlas_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const register = async (email: string, password: string, name: string, roles: string[]) => {
    const res = await api.post('/mobile/auth/register', { email, password, name, roles });
    await AsyncStorage.setItem('atlas_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const verifyCode = async (email: string, code: string, name?: string) => {
    const res = await api.post('/auth/verify-code', { email, code, name });
    await AsyncStorage.setItem('atlas_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const demoLogin = async (): Promise<string> => {
    const res = await api.post('/mobile/auth/demo', { role: 'client' });
    await AsyncStorage.setItem('atlas_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.project_id as string;
  };

  // Real Google Sign-In. `idToken` is the JWT Google handed us in the
  // `expo-auth-session` callback (`authentication.idToken` on web OR
  // `id_token` in the URL fragment on native). Backend verifies signature
  // + aud, then issues the same bearer token the rest of the app uses.
  const googleLogin = async (idToken: string) => {
    const res = await api.post('/mobile/auth/google', { credential: idToken });
    await AsyncStorage.setItem('atlas_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const logout = async () => {
    try { await api.post('/mobile/auth/logout'); } catch {}
    await AsyncStorage.removeItem('atlas_token');
    setToken(null);
    setUser(null);
  };

  const switchRole = async (role: string) => {
    const res = await api.post('/mobile/auth/switch-role', { role });
    setUser(res.data.user);
  };

  const refresh = async () => { await loadSession(); };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, verifyCode, demoLogin, googleLogin, logout, switchRole, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
