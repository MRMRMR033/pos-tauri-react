// src/api/auth.ts - VERSIÓN CORREGIDA
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

// Nuevas funciones para manejo de permisos
export async function getUserPermissions(userId: number, token: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/auth/permissions/user/${userId}`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    
    if (!res.ok) {
      const errorData = await res.text();
      console.error('Error obteniendo permisos:', errorData);
      throw new Error(`Error ${res.status}: No se pudieron obtener los permisos`);
    }
    
    const data = await res.json();
    return data.permissions || [];
  } catch (error) {
    console.error('Error en getUserPermissions:', error);
    throw error;
  }
}

export async function getAllPermissions(token: string): Promise<{ name: string; description: string; module: string }[]> {
  try {
    const res = await fetch(`${API_URL}/auth/permissions/all`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    
    if (!res.ok) {
      const errorData = await res.text();
      console.error('Error obteniendo todos los permisos:', errorData);
      throw new Error(`Error ${res.status}: No se pudieron obtener los permisos`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en getAllPermissions:', error);
    throw error;
  }
}

export async function grantPermission(userId: number, permission: string, token: string): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/auth/permissions/grant`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, permission })
    });
    
    if (!res.ok) {
      const errorData = await res.text();
      console.error('Error asignando permiso:', errorData);
      throw new Error(`Error ${res.status}: No se pudo asignar el permiso`);
    }
  } catch (error) {
    console.error('Error en grantPermission:', error);
    throw error;
  }
}

export async function revokePermission(userId: number, permission: string, token: string): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/auth/permissions/revoke`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, permission })
    });
    
    if (!res.ok) {
      const errorData = await res.text();
      console.error('Error revocando permiso:', errorData);
      throw new Error(`Error ${res.status}: No se pudo revocar el permiso`);
    }
  } catch (error) {
    console.error('Error en revokePermission:', error);
    throw error;
  }
}