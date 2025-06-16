// src/api/categories.ts
import { fetch } from '@tauri-apps/plugin-http';
import type { Categoria } from './products';

const API_URL = 'http://localhost:3000';

export interface CreateCategoriaRequest {
  nombre: string;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export async function createCategoria(data: CreateCategoriaRequest): Promise<Categoria> {
  try {
    const res = await fetch(`${API_URL}/categorias`, {
      method: 'POST',
      headers: getAuthHeaders(),
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

export async function updateCategoria(id: number, data: CreateCategoriaRequest): Promise<Categoria> {
  try {
    const res = await fetch(`${API_URL}/categorias/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
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

export async function deleteCategoria(id: number): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/categorias/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudo eliminar la categoría`);
    }
  } catch (error) {
    console.error('Error en deleteCategoria:', error);
    throw error;
  }
}