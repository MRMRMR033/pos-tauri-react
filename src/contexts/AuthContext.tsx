// src/contexts/AuthContext.tsx - VERSIÓN FINAL CON ENDPOINTS REALES
// 🚀 Sistema de permisos completamente integrado con backend
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { login, getProfile, getUserPermissions, getAllPermissions } from '../api/auth';
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
            
            // Verificar permisos guardados
            if (saved.permissions && saved.permissions.length > 0) {
              setPermissions(saved.permissions);
            } else {
              
              // Si no hay permisos guardados, intentar recargarlos del backend
              try {
                if (saved.user.rol === 'ADMIN' || saved.user.rol === 'admin') {
                  // Para admins, obtener todos los permisos
                  const allPermissions = await getAllPermissions(saved.accessToken);
                  const adminPermissions = allPermissions.map(p => p.key);
                  setPermissions(adminPermissions);
                  
                  // Actualizar store
                  await storeInstance.set('auth', {
                    ...saved,
                    permissions: adminPermissions
                  });
                  await storeInstance.save();
                } else {
                  // Para empleados, obtener permisos específicos
                  const userPerms = await getUserPermissions(saved.user.id, saved.accessToken);
                  setPermissions(userPerms);
                  
                  // Actualizar store
                  await storeInstance.set('auth', {
                    ...saved,
                    permissions: userPerms
                  });
                  await storeInstance.save();
                }
              } catch (reloadError) {
                console.error('❌ Error recargando permisos - sesión puede estar expirada:', reloadError);
                // Limpiar sesión inválida
                await storeInstance.delete('auth');
                await storeInstance.save();
                setUser(null);
                setAccessToken(null);
                setPermissions([]);
              }
            }
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
      
      // 1. Llamar login para obtener token
      const { access_token } = await login({ email, password });
      
      if (!access_token) {
        throw new Error('No se recibió token de acceso');
      }
      
      setAccessToken(access_token);

      // 2. Llamar perfil para obtener datos de usuario
      const perfil = await getProfile(access_token);
      
      setUser(perfil);

      // 3. Obtener permisos del usuario desde backend real
      let userPermissions: string[] = [];
      
      try {
        if (perfil.rol === 'ADMIN' || perfil.rol === 'admin') {
          // Los admins tienen todos los permisos automáticamente
          
          try {
            // Intentar obtener todos los permisos del backend para estar al día
            const allPermissionsFromBackend = await getAllPermissions(access_token);
            userPermissions = allPermissionsFromBackend.map(p => p.key);
          } catch (adminPermError) {
            // Fallback: usar permisos definidos en frontend
            console.warn('⚠️ No se pudieron obtener permisos del backend, usando fallback de admin');
            userPermissions = Object.values(ALL_PERMISSIONS);
          }
        } else {
          // Empleados: obtener permisos específicos desde backend
          userPermissions = await getUserPermissions(perfil.id, access_token);
          
          if (userPermissions.length === 0) {
            console.warn('⚠️ Usuario sin permisos asignados en backend');
            throw new Error('Usuario sin permisos asignados');
          }
          
        }
      } catch (permError) {
        console.error('❌ Error obteniendo permisos desde backend:', permError);
        
        // En caso de error crítico, no permitir acceso
        if (perfil.rol === 'ADMIN' || perfil.rol === 'admin') {
          // Para admins, usar permisos de fallback
            userPermissions = Object.values(ALL_PERMISSIONS);
        } else {
          // Para empleados, mostrar error - no dar acceso sin permisos del backend
          console.error('❌ No se pueden cargar permisos para empleado desde backend');
          throw new Error('No se pudieron cargar los permisos. Contacte al administrador.');
        }
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
    if (user.rol === 'ADMIN' || user.rol === 'admin') return true; // Admin tiene todos los permisos
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionList: string[]): boolean => {
    if (!user || !accessToken) return false;
    if (user.rol === 'ADMIN' || user.rol === 'admin') return true; // Admin tiene todos los permisos
    return permissionList.some(permission => permissions.includes(permission));
  };

  const hasAllPermissions = (permissionList: string[]): boolean => {
    if (!user || !accessToken) return false;
    if (user.rol === 'ADMIN' || user.rol === 'admin') return true; // Admin tiene todos los permisos
    return permissionList.every(permission => permissions.includes(permission));
  };

  const isAdmin = (): boolean => {
    return user?.rol === 'ADMIN' || user?.rol === 'admin';
  };

  const refreshPermissions = async (): Promise<void> => {
    if (!user || !accessToken) {
      console.warn('⚠️ No se pueden refrescar permisos: usuario o token ausente');
      return;
    }
    
    try {
      let userPermissions: string[] = [];
      
      if (user.rol === 'ADMIN' || user.rol === 'admin') {
        // Admins: obtener todos los permisos actualizados
        const allPermissions = await getAllPermissions(accessToken);
        userPermissions = allPermissions.map(p => p.key);
      } else {
        // Empleados: obtener permisos específicos actualizados
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
      console.error('❌ Error refrescando permisos desde backend:', error);
      throw error;
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