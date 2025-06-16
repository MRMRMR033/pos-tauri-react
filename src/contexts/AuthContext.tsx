// src/contexts/AuthContext.tsx - VERSIÓN CON PERMISOS
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { login, getProfile, getUserPermissions } from '../api/auth';
import { Store } from '@tauri-apps/plugin-store';
import { ALL_PERMISSIONS } from '../types/permissions';

interface User {
  id: number;
  email: string;
  fullName: string;
  rol: string;
}

interface AuthData {
  accessToken: string;
  user: User;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  permissions: string[];
  isLoadingAuth: boolean;
  signIn: (creds: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isAdmin: () => boolean;
  refreshPermissions: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  permissions: [],
  isLoadingAuth: true,
  signIn: async () => {},
  signOut: async () => {},
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  isAdmin: () => false,
  refreshPermissions: async () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
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
          if (saved.permissions) {
            setPermissions(saved.permissions);
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

      // 3. Obtener permisos del usuario
      console.log('Obteniendo permisos...');
      let userPermissions: string[] = [];
      try {
        // Si es admin, tiene todos los permisos
        if (perfil.rol === 'ADMIN') {
          userPermissions = Object.values(ALL_PERMISSIONS);
          console.log('Usuario admin - todos los permisos asignados');
        } else {
          userPermissions = await getUserPermissions(perfil.id, access_token);
          console.log('Permisos obtenidos:', userPermissions);
        }
      } catch (permError) {
        console.warn('Error obteniendo permisos, usando permisos vacíos:', permError);
        userPermissions = [];
      }
      
      setPermissions(userPermissions);

      // 4. Persistir en store
      if (authStore) {
        await authStore.set('auth', { 
          accessToken: access_token, 
          user: perfil, 
          permissions: userPermissions 
        });
        await authStore.save();
        console.log('Sesión guardada en store');
      }
    } catch (error) {
      console.error('Error en signIn:', error);
      // Limpiar estado en caso de error
      setAccessToken(null);
      setUser(null);
      setPermissions([]);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      setAccessToken(null);
      setPermissions([]);
      if (authStore) {
        await authStore.delete('auth');
        await authStore.save();
      }
    } catch (error) {
      console.error('Error en signOut:', error);
    }
  };

  // Funciones para manejo de permisos
  const hasPermission = (permission: string): boolean => {
    if (!user || !accessToken) return false;
    if (user.rol === 'ADMIN') return true; // Admin tiene todos los permisos
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionList: string[]): boolean => {
    if (!user || !accessToken) return false;
    if (user.rol === 'ADMIN') return true; // Admin tiene todos los permisos
    return permissionList.some(permission => permissions.includes(permission));
  };

  const hasAllPermissions = (permissionList: string[]): boolean => {
    if (!user || !accessToken) return false;
    if (user.rol === 'ADMIN') return true; // Admin tiene todos los permisos
    return permissionList.every(permission => permissions.includes(permission));
  };

  const isAdmin = (): boolean => {
    return user?.rol === 'ADMIN';
  };

  const refreshPermissions = async (): Promise<void> => {
    if (!user || !accessToken) return;
    
    try {
      let userPermissions: string[] = [];
      if (user.rol === 'ADMIN') {
        userPermissions = Object.values(ALL_PERMISSIONS);
      } else {
        userPermissions = await getUserPermissions(user.id, accessToken);
      }
      
      setPermissions(userPermissions);
      
      // Actualizar en store
      if (authStore) {
        await authStore.set('auth', { 
          accessToken, 
          user, 
          permissions: userPermissions 
        });
        await authStore.save();
      }
    } catch (error) {
      console.error('Error refrescando permisos:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        accessToken, 
        permissions, 
        isLoadingAuth, 
        signIn, 
        signOut, 
        hasPermission, 
        hasAnyPermission, 
        hasAllPermissions, 
        isAdmin, 
        refreshPermissions 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};