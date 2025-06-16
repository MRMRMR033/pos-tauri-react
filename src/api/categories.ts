// src/api/categories.ts - API completa para categorías con NestJS
import { fetch } from '@tauri-apps/plugin-http';

const API_URL = 'http://localhost:3000';

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  activa?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoriaRequest {
  nombre: string;
  descripcion?: string;
  activa?: boolean;
}

function getAuthHeaders(token?: string): HeadersInit {
  const authToken = token || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };
}

export async function getCategorias(token?: string): Promise<Categoria[]> {
  try {
    const res = await fetch(`${API_URL}/categoria`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudieron obtener las categorías`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en getCategorias:', error);
    throw error;
  }
}

export async function getCategoriaById(id: number, token?: string): Promise<Categoria> {
  try {
    const res = await fetch(`${API_URL}/categoria/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudo obtener la categoría`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en getCategoriaById:', error);
    throw error;
  }
}

export async function createCategoria(data: CreateCategoriaRequest, token?: string): Promise<Categoria> {
  try {
    const res = await fetch(`${API_URL}/categoria`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorData = await res.text();
      console.error('Error del servidor:', errorData);
      throw new Error(`Error ${res.status}: No se pudo crear la categoría`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en createCategoria:', error);
    throw error;
  }
}

export async function updateCategoria(id: number, data: Partial<CreateCategoriaRequest>, token?: string): Promise<Categoria> {
  try {
    const res = await fetch(`${API_URL}/categoria/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorData = await res.text();
      console.error('Error del servidor:', errorData);
      throw new Error(`Error ${res.status}: No se pudo actualizar la categoría`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en updateCategoria:', error);
    throw error;
  }
}

export async function deleteCategoria(id: number, token?: string): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/categoria/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudo eliminar la categoría`);
    }
  } catch (error) {
    console.error('Error en deleteCategoria:', error);
    throw error;
  }
}