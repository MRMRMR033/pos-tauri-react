// src/api/products.ts
import { fetch } from '@tauri-apps/plugin-http';

const API_URL = 'http://localhost:3000';

export interface Producto {
  id: number;
  codigoBarras: string;
  nombre: string;
  precioCosto: number;
  precioVenta: number;
  precioEspecial?: number;
  stock: number;
  categoriaId: number;
  proveedorId: number;
  categoria: Categoria;
  proveedor: Proveedor;
  createdAt: string;
  updatedAt: string;
}

export interface Categoria {
  id: number;
  nombre: string;
}

export interface Proveedor {
  id: number;
  nombre: string;
  contacto?: string;
}

export interface CreateProductoRequest {
  codigoBarras: string;
  nombre: string;
  precioCosto: number;
  precioVenta: number;
  precioEspecial?: number;
  stock: number;
  categoriaId: number;
  proveedorId: number;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export async function getCategorias(): Promise<Categoria[]> {
  try {
    const res = await fetch(`${API_URL}/categorias`, {
      method: 'GET',
      headers: getAuthHeaders(),
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

export async function getProveedores(): Promise<Proveedor[]> {
  try {
    const res = await fetch(`${API_URL}/proveedores`, {
      method: 'GET',
      headers: getAuthHeaders(),
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

export async function createProducto(data: CreateProductoRequest): Promise<Producto> {
  try {
    const res = await fetch(`${API_URL}/productos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorData = await res.text();
      console.error('Error del servidor:', errorData);
      throw new Error(`Error ${res.status}: No se pudo crear el producto`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en createProducto:', error);
    throw error;
  }
}

export async function getProductos(): Promise<Producto[]> {
  try {
    const res = await fetch(`${API_URL}/productos`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudieron obtener los productos`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en getProductos:', error);
    throw error;
  }
}

export async function getProductoByBarcode(codigo: string): Promise<Producto | null> {
  try {
    const res = await fetch(`${API_URL}/productos/barcode/${codigo}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (res.status === 404) {
      return null;
    }
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudo obtener el producto`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en getProductoByBarcode:', error);
    throw error;
  }
}

export async function updateProducto(id: number, data: Partial<CreateProductoRequest>): Promise<Producto> {
  try {
    const res = await fetch(`${API_URL}/productos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorData = await res.text();
      console.error('Error del servidor:', errorData);
      throw new Error(`Error ${res.status}: No se pudo actualizar el producto`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en updateProducto:', error);
    throw error;
  }
}

export async function deleteProducto(id: number): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/productos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudo eliminar el producto`);
    }
  } catch (error) {
    console.error('Error en deleteProducto:', error);
    throw error;
  }
}