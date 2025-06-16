// src/api/suppliers.ts - API completa para proveedores con NestJS
import { fetch } from '@tauri-apps/plugin-http';

const API_URL = 'http://localhost:3000';

export interface Proveedor {
  id: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProveedorRequest {
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo?: boolean;
}

function getAuthHeaders(token?: string): HeadersInit {
  const authToken = token || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };
}

export async function getProveedores(token?: string): Promise<Proveedor[]> {
  try {
    const res = await fetch(`${API_URL}/proveedor`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudieron obtener los proveedores`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en getProveedores:', error);
    throw error;
  }
}

export async function getProveedorById(id: number, token?: string): Promise<Proveedor> {
  try {
    const res = await fetch(`${API_URL}/proveedor/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudo obtener el proveedor`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en getProveedorById:', error);
    throw error;
  }
}

export async function createProveedor(data: CreateProveedorRequest, token?: string): Promise<Proveedor> {
  try {
    const res = await fetch(`${API_URL}/proveedor`, {
      method: 'POST',
      headers: getAuthHeaders(token),
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

export async function updateProveedor(id: number, data: Partial<CreateProveedorRequest>, token?: string): Promise<Proveedor> {
  try {
    const res = await fetch(`${API_URL}/proveedor/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(token),
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

export async function deleteProveedor(id: number, token?: string): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/proveedor/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudo eliminar el proveedor`);
    }
  } catch (error) {
    console.error('Error en deleteProveedor:', error);
    throw error;
  }
}