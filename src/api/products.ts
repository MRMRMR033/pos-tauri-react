// src/api/products.ts - Integración completa con API de NestJS
import { fetch } from '@tauri-apps/plugin-http';

const API_URL = 'http://localhost:3000';

export interface Producto {
  id: number;
  codigoBarras?: string;
  nombre: string;
  descripcion?: string;
  precioCosto: number;
  precioVenta: number;
  stock: number;
  stockMinimo?: number;
  categoriaId?: number; // Opcional
  proveedorId?: number; // Opcional
  categoria?: Categoria; // Opcional
  proveedor?: Proveedor; // Opcional
  activo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  activa?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

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

export interface CreateProductoRequest {
  codigoBarras?: string;
  nombre: string;
  descripcion?: string;
  precioCosto: number;
  precioVenta: number;
  stock: number;
  stockMinimo?: number;
  categoriaId?: number; // Opcional - si no se proporciona será "Sin categoría"
  proveedorId?: number; // Opcional
  activo?: boolean;
}

function getAuthHeaders(token?: string): HeadersInit {
  const authToken = token || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };
}

// ========== PRODUCTOS ==========
export interface ProductSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductListResponse {
  productos: Producto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getProductos(params?: ProductSearchParams, token?: string): Promise<ProductListResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const url = `${API_URL}/producto${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudieron obtener los productos`);
    }
    
    const data = await res.json();
    
    // Si el backend no devuelve la estructura de paginación, adaptamos
    if (Array.isArray(data)) {
      return {
        productos: data,
        total: data.length,
        page: params?.page || 1,
        limit: params?.limit || data.length,
        totalPages: 1
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error en getProductos:', error);
    throw error;
  }
}

export async function getProductoById(id: number, token?: string): Promise<Producto> {
  try {
    const res = await fetch(`${API_URL}/producto/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudo obtener el producto`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en getProductoById:', error);
    throw error;
  }
}

export async function createProducto(data: CreateProductoRequest, token?: string): Promise<Producto> {
  try {
    const res = await fetch(`${API_URL}/producto`, {
      method: 'POST',
      headers: getAuthHeaders(token),
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

export async function updateProducto(id: number, data: Partial<CreateProductoRequest>, token?: string): Promise<Producto> {
  try {
    const res = await fetch(`${API_URL}/producto/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(token),
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

export async function deleteProducto(id: number, token?: string): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/producto/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudo eliminar el producto`);
    }
  } catch (error) {
    console.error('Error en deleteProducto:', error);
    throw error;
  }
}

// ========== CATEGORÍAS ==========
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

// ========== PROVEEDORES ==========
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

// Función auxiliar para buscar producto por código de barras
export async function getProductoByBarcode(codigo: string, token?: string): Promise<Producto | null> {
  try {
    const response = await getProductos(undefined, token);
    return response.productos.find(p => p.codigoBarras === codigo) || null;
  } catch (error) {
    console.error('Error en getProductoByBarcode:', error);
    throw error;
  }
}