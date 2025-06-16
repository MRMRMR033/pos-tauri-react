// src/api/auth.ts - VERSIÓN FINAL CON ENDPOINTS REALES
// 🚀 Integración completa con backend de permisos
import { fetch } from '@tauri-apps/plugin-http';
import type { Credentials } from '../types/auth';

const API_URL = 'http://localhost:3000';

export async function login(credentials: Credentials): Promise<{ access_token: string }> {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    
    if (!res.ok) {
      const errorData = await res.text();
      console.error('Error del servidor:', errorData);
      throw new Error(`Error ${res.status}: Credenciales inválidas`);
    }
    
    const data = await res.json();
    return data as { access_token: string };
  } catch (error) {
    console.error('Error en login:', error);
    throw error;
  }
}

export async function getProfile(token: string): Promise<any> {
  try {
    const res = await fetch(`${API_URL}/auth/perfil`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    
    if (!res.ok) {
      const errorData = await res.text();
      console.error('Error del servidor en perfil:', errorData);
      throw new Error(`Error ${res.status}: No autorizado`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en getProfile:', error);
    throw error;
  }
}

// Interfaces para los endpoints reales del backend
interface PermissionResponse {
  id: number;
  key: string;
  name: string;
  description: string;
  module: string;
}

interface SafeApiCallOptions extends RequestInit {
  headers?: Record<string, string>;
}

// Función utilitaria para llamadas seguras a la API
const safeApiCall = async (url: string, token: string, options: SafeApiCallOptions = {}): Promise<any> => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Error calling ${url}:`, error);
    throw error;
  }
};

// Obtener permisos específicos de un usuario (usa estructura real del backend)
export async function getUserPermissions(userId: number, token: string): Promise<string[]> {
  try {
    
    const permissions: PermissionResponse[] = await safeApiCall(
      `${API_URL}/auth/permissions/user/${userId}`,
      token
    );
    
    // Extraer solo las keys de los permisos (productos:ver, ventas:crear, etc.)
    const permissionKeys = permissions.map(p => p.key);
    
    return permissionKeys;
  } catch (error) {
    console.error('❌ Error en getUserPermissions:', error);
    throw error;
  }
}

// Obtener todos los permisos del sistema (usa estructura real del backend)
export async function getAllPermissions(token: string): Promise<PermissionResponse[]> {
  try {
    
    const permissions: PermissionResponse[] = await safeApiCall(
      `${API_URL}/auth/permissions/all`,
      token
    );
    
    return permissions;
  } catch (error) {
    console.error('❌ Error en getAllPermissions:', error);
    throw error;
  }
}

// Otorgar permiso a usuario (usa estructura real del backend)
export async function grantPermission(userId: number, permissionKey: string, token: string): Promise<void> {
  try {
    
    await safeApiCall(
      `${API_URL}/auth/permissions/grant`,
      token,
      {
        method: 'POST',
        body: JSON.stringify({ userId, permissionKey })
      }
    );
    
  } catch (error) {
    console.error('❌ Error en grantPermission:', error);
    throw error;
  }
}

// Revocar permiso de usuario (usa estructura real del backend)
export async function revokePermission(userId: number, permissionKey: string, token: string): Promise<void> {
  try {
    
    await safeApiCall(
      `${API_URL}/auth/permissions/revoke`,
      token,
      {
        method: 'POST',
        body: JSON.stringify({ userId, permissionKey })
      }
    );
    
  } catch (error) {
    console.error('❌ Error en revokePermission:', error);
    throw error;
  }
}