// src/contexts/AuthContext.tsx - VERSIÓN FINAL CON ENDPOINTS REALES
// 🚀 Sistema de permisos completamente integrado con backend
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { login, getProfile, getUserPermissions, getAllPermissions, refreshToken as refreshTokenAPI, logout } from '../api/auth';
import { apiClient } from '../api/client';
import { Store } from '@tauri-apps/plugin-store';
import { ALL_PERMISSIONS } from '../types/permissions';
import { API_CONFIG } from '../config/api';

interface User {
  id: number;
  email: string | null;
  fullName: string;
  rol: string;
}

interface AuthData {
  accessToken: string;
  refreshToken: string;
  user: User;
  permissions: string[];
  expiresAt: number; // timestamp when access token expires
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
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
  refreshToken: null,
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
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
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
        if (saved && saved.accessToken && saved.refreshToken) {
          // Check if access token is expired
          const isExpired = saved.expiresAt && Date.now() > saved.expiresAt;
          
          if (isExpired) {
            console.log('🔄 Access token expired, attempting refresh');
            try {
              const response = await refreshTokenAPI(saved.refreshToken);
              const { access_token, refresh_token: new_refresh_token, expires_in } = response.data;
              
              setAccessToken(access_token);
              setRefreshToken(new_refresh_token);
              apiClient.setAccessToken(access_token);
              
              const expiresAt = Date.now() + (expires_in * 1000);
              
              // Update stored auth data
              const updatedAuth = {
                ...saved,
                accessToken: access_token,
                refreshToken: new_refresh_token,
                expiresAt
              };
              
              await storeInstance.set('auth', updatedAuth);
              await storeInstance.save();
              
              // Schedule next refresh
              scheduleTokenRefresh(expires_in);
              
            } catch (refreshError) {
              console.error('❌ Failed to refresh token on startup:', refreshError);
              // Clear invalid session
              await storeInstance.delete('auth');
              await storeInstance.save();
              setIsLoadingAuth(false);
              return;
            }
          } else {
            // Token is still valid
            setAccessToken(saved.accessToken);
            setRefreshToken(saved.refreshToken);
            apiClient.setAccessToken(saved.accessToken);
            
            // Schedule refresh based on remaining time
            const remainingTime = Math.max(0, (saved.expiresAt - Date.now()) / 1000);
            if (remainingTime > 120) { // More than 2 minutes left
              scheduleTokenRefresh(remainingTime);
            } else {
              // Less than 2 minutes, refresh immediately
              attemptTokenRefresh();
            }
          }
          
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
                  const allPermissions = await getAllPermissions();
                  const adminPermissions = allPermissions.data.map(p => p.key);
                  setPermissions(adminPermissions);
                  
                  // Actualizar store
                  await storeInstance.set('auth', {
                    ...saved,
                    permissions: adminPermissions
                  });
                  await storeInstance.save();
                } else {
                  // Para empleados, obtener permisos específicos
                  const userPerms = await getUserPermissions(saved.user.id);
                  setPermissions(userPerms.data.map(p => p.key));
                  
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
                apiClient.setAccessToken(null);
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
      
      // 1. Llamar login para obtener tokens
      const response = await login({ email, password });
      const { access_token, refresh_token, expires_in } = response.data;
      
      if (!access_token || !refresh_token) {
        throw new Error('No se recibieron tokens de acceso');
      }
      
      // Calcular timestamp de expiración
      const expiresAt = Date.now() + (expires_in * 1000);
      
      setAccessToken(access_token);
      setRefreshToken(refresh_token);
      apiClient.setAccessToken(access_token);
      
      // 2. Obtener el perfil del usuario con el token
      const usuario = await getProfile();
      console.log('👤 Usuario obtenido:', usuario.data);
      setUser(usuario.data);

      // 3. Obtener permisos del usuario desde backend real
      let userPermissions: string[] = [];
      
      try {
        if (usuario.data.rol === 'admin') {
          // Los admins tienen todos los permisos automáticamente
          
          try {
            // Intentar obtener todos los permisos del backend para estar al día
            const allPermissionsFromBackend = await getAllPermissions();
            userPermissions = allPermissionsFromBackend.data.map(p => p.key);
          } catch (adminPermError) {
            // Fallback: usar permisos definidos en frontend
            console.warn('⚠️ No se pudieron obtener permisos del backend, usando fallback de admin');
            userPermissions = Object.values(ALL_PERMISSIONS);
          }
        } else {
          // Empleados: obtener permisos específicos desde backend
          const userPerms = await getUserPermissions(usuario.data.id);
          userPermissions = userPerms.data.map(p => p.key);
          
          if (userPermissions.length === 0) {
            console.warn('⚠️ Usuario sin permisos asignados en backend');
            throw new Error('Usuario sin permisos asignados');
          }
          
        }
      } catch (permError) {
        console.error('❌ Error obteniendo permisos desde backend:', permError);
        
        // En caso de error crítico, no permitir acceso
        if (usuario.data.rol === 'admin') {
          // Para admins, usar permisos de fallback
            userPermissions = Object.values(ALL_PERMISSIONS);
        } else {
          // Para empleados, mostrar error - no dar acceso sin permisos del backend
          console.error('❌ No se pueden cargar permisos para empleado desde backend');
          throw new Error('No se pudieron cargar los permisos. Contacte al administrador.');
        }
      }
      
      setPermissions(userPermissions);
      console.log('✅ AuthContext - Login completado exitosamente');
      console.log('👤 Usuario final:', usuario.data);
      console.log('🔐 Permisos final:', userPermissions);

      // 4. Persistir en store
      if (authStore) {
        await authStore.set('auth', { 
          accessToken: access_token, 
          refreshToken: refresh_token,
          user: usuario.data, 
          permissions: userPermissions,
          expiresAt
        });
        await authStore.save();
      }
      
      // 5. Configurar auto-refresh
      scheduleTokenRefresh(expires_in);
      
    } catch (error) {
      console.error('Error detallado en signIn:', error);
      
      // Mostrar información más específica del error
      if (error instanceof Error) {
        console.error('Mensaje del error:', error.message);
        console.error('Stack trace:', error.stack);
      }
      
      // Si es un error de red, mostrar información específica
      if ((error as Error).name === 'TypeError' && (error as Error).message.includes('fetch')) {
        console.error('Error de conexión: No se puede conectar al servidor backend');
        console.error('Verificar que el servidor está ejecutándose en:', API_CONFIG.BASE_URL);
      }
      
      // Limpiar estado en caso de error
      setAccessToken(null);
      setRefreshToken(null);
      apiClient.setAccessToken(null);
      setUser(null);
      setPermissions([]);
      throw error;
    }
  };

  // Auto-refresh timer
  const [refreshTimeoutId, setRefreshTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const scheduleTokenRefresh = (expiresInSeconds: number) => {
    // Clear existing timeout
    if (refreshTimeoutId) {
      clearTimeout(refreshTimeoutId);
    }

    // Schedule refresh 2 minutes before expiration
    const refreshTime = Math.max(0, (expiresInSeconds - 120) * 1000);
    
    console.log(`🕐 Scheduling token refresh in ${refreshTime / 1000} seconds`);
    
    const timeoutId = setTimeout(async () => {
      await attemptTokenRefresh();
    }, refreshTime);
    
    setRefreshTimeoutId(timeoutId);
  };

  const attemptTokenRefresh = async () => {
    if (!refreshToken) {
      console.log('⚠️ No refresh token available for refresh');
      return;
    }

    try {
      console.log('🔄 Attempting automatic token refresh');
      const response = await refreshTokenAPI(refreshToken);
      const { access_token, refresh_token: new_refresh_token, expires_in } = response.data;
      
      // Update tokens
      setAccessToken(access_token);
      setRefreshToken(new_refresh_token);
      apiClient.setAccessToken(access_token);
      
      // Update stored auth data
      if (authStore && user) {
        const expiresAt = Date.now() + (expires_in * 1000);
        await authStore.set('auth', { 
          accessToken: access_token, 
          refreshToken: new_refresh_token,
          user, 
          permissions,
          expiresAt
        });
        await authStore.save();
      }
      
      // Schedule next refresh
      scheduleTokenRefresh(expires_in);
      
      console.log('✅ Token refreshed successfully');
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      // If refresh fails, force logout
      await signOut();
    }
  };

  const signOut = async () => {
    try {
      // Clear refresh timeout
      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId);
        setRefreshTimeoutId(null);
      }

      // Call logout endpoint if we have a refresh token
      if (refreshToken) {
        try {
          await logout(refreshToken);
        } catch (error) {
          console.warn('⚠️ Logout request failed, cleaning local state anyway:', error);
        }
      }

      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      apiClient.setAccessToken(null);
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
        const allPermissions = await getAllPermissions();
        userPermissions = allPermissions.data.map(p => p.key);
      } else {
        // Empleados: obtener permisos específicos actualizados
        const permsResponse = await getUserPermissions(user.id);
        userPermissions = permsResponse.data.map(p => p.key);
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
        refreshToken,
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