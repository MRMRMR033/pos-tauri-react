// src/contexts/AuthContext.tsx - VERSIÓN CORREGIDA
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { login, getProfile } from '../api/auth';
import { Store } from '@tauri-apps/plugin-store';

interface User {
  id: number;
  email: string;
  fullName: string;
  rol: string;
}

interface AuthData {
  accessToken: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoadingAuth: boolean;
  signIn: (creds: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  isLoadingAuth: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [authStore, setAuthStore] = useState<Store | null>(null);

  // Al montar, inicializamos el store y cargamos sesión si existe
  useEffect(() => {
    (async () => {
      try {
        // Carga (o crea) el store nativo
        const storeInstance = await Store.load('auth.json');
        setAuthStore(storeInstance);

        const saved = await storeInstance.get<AuthData>('auth');
        if (saved && saved.accessToken) {
          setAccessToken(saved.accessToken);
          if (saved.user) {
            setUser(saved.user);
          }
        }
      } catch (err) {
        console.error('Error cargando sesión:', err);
      } finally {
        setIsLoadingAuth(false);
      }
    })();
  }, []);

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    try {
      console.log('Intentando login con:', { email, password: '***' });
      
      // 1. Llamar login para obtener token
      const { access_token } = await login({ email, password });
      console.log('Token obtenido:', access_token ? 'Sí' : 'No');
      
      if (!access_token) {
        throw new Error('No se recibió token de acceso');
      }
      
      setAccessToken(access_token);

      // 2. Llamar perfil para obtener datos de usuario
      console.log('Obteniendo perfil...');
      const perfil = await getProfile(access_token);
      console.log('Perfil obtenido:', perfil);
      
      setUser(perfil);

      // 3. Persistir en store
      if (authStore) {
        await authStore.set('auth', { accessToken: access_token, user: perfil });
        await authStore.save();
        console.log('Sesión guardada en store');
      }
    } catch (error) {
      console.error('Error en signIn:', error);
      // Limpiar estado en caso de error
      setAccessToken(null);
      setUser(null);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      setAccessToken(null);
      if (authStore) {
        await authStore.delete('auth');
        await authStore.save();
      }
    } catch (error) {
      console.error('Error en signOut:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isLoadingAuth, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};