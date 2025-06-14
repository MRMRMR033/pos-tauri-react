// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { login } from '../api/auth';
import { load } from '@tauri-apps/plugin-store';

interface User {
  id: number;
  email: string;
}

interface AuthData {
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  signIn: async () => {},
  signOut: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const store = await load('auth.json', { autoSave: true });
      const saved = await store.get<AuthData | null>('auth');
      if (saved) {
        setAccessToken(saved.accessToken);
        setUser(saved.user);
      }
    })();
  }, []);

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    const data = await login({ email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    const store = await load('auth.json', { autoSave: true });
    await store.set('auth', data);
  };

  const signOut = async () => {
    setUser(null);
    setAccessToken(null);
    const store = await load('auth.json', { autoSave: true });
    await store.delete('auth');
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
