// src/api/suppliers.ts
import { fetch } from '@tauri-apps/plugin-http';
import type { Proveedor } from './products';

const API_URL = 'http://localhost:3000';

export interface CreateProveedorRequest {
  nombre: string;
  contacto?: string;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export async function createProveedor(data: CreateProveedorRequest): Promise<Proveedor> {
  try {
    const res = await fetch(`${API_URL}/proveedores`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorData = await res.text();
      console.error('Error del servidor:', errorData);
      throw new Error(`Error ${res.status}: No se pudo crear el proveedor`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en createProveedor:', error);
    throw error;
  }
}

export async function updateProveedor(id: number, data: CreateProveedorRequest): Promise<Proveedor> {
  try {
    const res = await fetch(`${API_URL}/proveedores/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorData = await res.text();
      console.error('Error del servidor:', errorData);
      throw new Error(`Error ${res.status}: No se pudo actualizar el proveedor`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en updateProveedor:', error);
    throw error;
  }
}

export async function deleteProveedor(id: number): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/proveedores/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudo eliminar el proveedor`);
    }
  } catch (error) {
    console.error('Error en deleteProveedor:', error);
    throw error;
  }
}