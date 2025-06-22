// src/api/users.ts - API completa para usuarios con NestJS
import { fetch } from '@tauri-apps/plugin-http';

const API_URL = 'http://localhost:3000';

export interface Usuario {
  id: number;
  email: string | null;
  fullName: string;
  rol: 'admin' | 'empleado'; // Minúsculas como en el backend
  createdAt: string;
  updatedAt: string;
}

export interface CreateUsuarioRequest {
  email?: string; // Opcional en el backend
  password: string;
  fullName: string;
  rol: 'admin' | 'empleado'; // Requerido, minúsculas
}

export interface UpdateUsuarioRequest {
  email?: string;
  password?: string;
  fullName?: string;
  rol?: 'admin' | 'empleado';
}

function getAuthHeaders(token?: string): HeadersInit {
  if (!token) {
    throw new Error('Token de autenticación requerido');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export async function getUsuarios(token?: string): Promise<Usuario[]> {
  try {
    const res = await fetch(`${API_URL}/usuario`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudieron obtener los usuarios`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en getUsuarios:', error);
    throw error;
  }
}

export async function getUsuarioById(id: number, token?: string): Promise<Usuario> {
  try {
    const res = await fetch(`${API_URL}/usuario/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudo obtener el usuario`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en getUsuarioById:', error);
    throw error;
  }
}

export async function createUsuario(data: CreateUsuarioRequest, token?: string): Promise<Usuario> {
  try {
    const res = await fetch(`${API_URL}/usuario`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorData = await res.text();
      console.error('Error del servidor:', errorData);
      throw new Error(`Error ${res.status}: No se pudo crear el usuario`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en createUsuario:', error);
    throw error;
  }
}

export async function updateUsuario(id: number, data: UpdateUsuarioRequest, token?: string): Promise<Usuario> {
  try {
    const res = await fetch(`${API_URL}/usuario/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorData = await res.text();
      console.error('Error del servidor:', errorData);
      throw new Error(`Error ${res.status}: No se pudo actualizar el usuario`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en updateUsuario:', error);
    throw error;
  }
}

export async function deleteUsuario(id: number, token?: string): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/usuario/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudo eliminar el usuario`);
    }
  } catch (error) {
    console.error('Error en deleteUsuario:', error);
    throw error;
  }
}