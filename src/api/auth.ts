// src/api/auth.ts - API de autenticación actualizada con ApiResponse<T>
import { fetch } from '@tauri-apps/plugin-http';
import { apiClient } from './client';
import { 
  LoginRequest, 
  LoginResponse, 
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,
  Usuario, 
  Permission, 
  UserPermission,
  CreateUsuarioRequest,
  UpdateUsuarioRequest,
  GrantPermissionRequest,
  RevokePermissionRequest,
  ApiResponse 
} from '../types/api';

// ============ AUTENTICACIÓN ============

export async function login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  // Login devuelve { access_token, refresh_token, expires_in }
  
  console.log(`🔐 Attempting login for: ${credentials.email}`);
  
  try {
    const url = new URL('/auth/login', 'http://localhost:3000');
    console.log(`🌐 Login URL: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    console.log(`✅ Login response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Login failed: ${response.status} - ${errorText}`);
      throw new Error(`Login failed: ${response.status}`);
    }

    const data = await response.json();
    console.log(`📦 Login data received:`, {
      access_token: data.access_token ? '[TOKEN_RECEIVED]' : 'null',
      refresh_token: data.refresh_token ? '[REFRESH_TOKEN_RECEIVED]' : 'null',
      expires_in: data.expires_in
    });

    // Configurar el token en el cliente para peticiones futuras
    if (data.access_token) {
      apiClient.setAccessToken(data.access_token);
    }

    // Envolver la respuesta en el formato ApiResponse<T> esperado
    const wrappedResponse: ApiResponse<LoginResponse> = {
      data: data as LoginResponse,
      meta: {
        timestamp: new Date().toISOString(),
        apiVersion: '1',
        requestId: response.headers.get('x-request-id') || undefined
      }
    };

    return wrappedResponse;
  } catch (error) {
    console.error(`❌ Login error:`, error);
    throw error;
  }
}

export async function getProfile(): Promise<ApiResponse<Usuario>> {
  return apiClient.get<Usuario>('/auth/perfil');
}

export async function refreshToken(refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> {
  console.log('🔄 Attempting to refresh token');
  
  try {
    const url = new URL('/auth/refresh', 'http://localhost:3000');
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Token refresh failed: ${response.status} - ${errorText}`);
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Token refreshed successfully');

    // Configurar el nuevo token en el cliente
    if (data.access_token) {
      apiClient.setAccessToken(data.access_token);
    }

    // Envolver la respuesta en el formato ApiResponse<T>
    const wrappedResponse: ApiResponse<RefreshTokenResponse> = {
      data: data as RefreshTokenResponse,
      meta: {
        timestamp: new Date().toISOString(),
        apiVersion: '1',
        requestId: response.headers.get('x-request-id') || undefined
      }
    };

    return wrappedResponse;
  } catch (error) {
    console.error(`❌ Token refresh error:`, error);
    throw error;
  }
}

export async function logout(refreshToken?: string): Promise<ApiResponse<void>> {
  console.log('🚪 Attempting logout');
  
  try {
    if (refreshToken) {
      // Use refresh token to logout properly
      const url = new URL('/auth/logout', 'http://localhost:3000');
      
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        console.warn('⚠️ Logout request failed, cleaning local state anyway');
      }
    }
  } catch (error) {
    console.warn('⚠️ Logout request error, cleaning local state anyway:', error);
  }
  
  // Always clean token from client
  apiClient.setAccessToken(null);
  console.log('✅ Logout completed');
  
  return {
    data: undefined as any,
    meta: {
      timestamp: new Date().toISOString(),
      apiVersion: '1'
    }
  };
}

export async function logoutAllSessions(): Promise<ApiResponse<void>> {
  const response = await apiClient.post<void>('/auth/logout-all');
  
  // Limpiar token del cliente
  apiClient.setAccessToken(null);
  
  return response;
}

// ============ PERMISOS ============

export async function getUserPermissions(userId?: number): Promise<ApiResponse<Permission[]>> {
  const endpoint = userId ? `/auth/permissions/user/${userId}` : '/auth/permissions';
  return apiClient.get<Permission[]>(endpoint);
}

export async function getAllPermissions(): Promise<ApiResponse<Permission[]>> {
  return apiClient.get<Permission[]>('/auth/permissions/all');
}

export async function grantPermission(data: GrantPermissionRequest): Promise<ApiResponse<UserPermission>> {
  return apiClient.post<UserPermission>('/auth/permissions/grant', data);
}

export async function revokePermission(data: RevokePermissionRequest): Promise<ApiResponse<void>> {
  return apiClient.post<void>('/auth/permissions/revoke', data);
}

// ============ GESTIÓN DE USUARIOS ============

export async function getUsuarios(params?: { 
  page?: number; 
  limit?: number; 
  search?: string; 
}): Promise<ApiResponse<Usuario[]>> {
  return apiClient.get<Usuario[]>('/usuario', params);
}

export async function getUsuarioById(id: number): Promise<ApiResponse<Usuario>> {
  return apiClient.get<Usuario>(`/usuario/${id}`);
}

export async function createUsuario(data: CreateUsuarioRequest): Promise<ApiResponse<Usuario>> {
  return apiClient.post<Usuario>('/usuario', data);
}

export async function updateUsuario(id: number, data: UpdateUsuarioRequest): Promise<ApiResponse<Usuario>> {
  return apiClient.patch<Usuario>(`/usuario/${id}`, data);
}

export async function deleteUsuario(id: number): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`/usuario/${id}`);
}

// Obtener permisos de un usuario específico
export async function getUsuarioPermissions(userId: number): Promise<ApiResponse<UserPermission[]>> {
  return apiClient.get<UserPermission[]>(`/usuario/${userId}/permissions`);
}

// Actualizar permisos masivamente para un usuario
export async function updateUsuarioPermissions(
  userId: number, 
  permissions: string[]
): Promise<ApiResponse<UserPermission[]>> {
  return apiClient.post<UserPermission[]>(`/usuario/${userId}/permissions`, {
    permissions
  });
}

// ============ FUNCIONES UTILITARIAS ============

// Verificar si un usuario tiene un permiso específico
export function hasPermission(userPermissions: string[], permission: string): boolean {
  return userPermissions.includes(permission);
}

// Verificar si un usuario tiene alguno de los permisos especificados
export function hasAnyPermission(userPermissions: string[], permissions: string[]): boolean {
  return permissions.some(permission => userPermissions.includes(permission));
}

// Verificar si un usuario tiene todos los permisos especificados
export function hasAllPermissions(userPermissions: string[], permissions: string[]): boolean {
  return permissions.every(permission => userPermissions.includes(permission));
}

// Verificar si un usuario es admin
export function isAdmin(user: Usuario | null): boolean {
  return user?.rol === 'admin';
}

// Agrupar permisos por módulo
export function groupPermissionsByModule(permissions: Permission[]): Record<string, Permission[]> {
  return permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);
}

// Configurar token de acceso (para uso con localStorage/sessionStorage)
export function setAccessToken(token: string | null): void {
  apiClient.setAccessToken(token);
}

// Legacy exports para compatibilidad
export { hasPermission as checkPermission };
export type AuthResponse = LoginResponse;