// src/api/products.ts - API actualizada con esquema del backend y ApiResponse<T>
import { apiClient } from './client';
import { 
  Producto, 
  Categoria, 
  Proveedor, 
  CreateProductoRequest, 
  ProductSearchParams,
  ProductListResponse,
  ApiResponse
} from '../types/api';

// Re-export tipos para compatibilidad
export type { 
  CreateProductoRequest, 
  ProductSearchParams,
  ProductListResponse
};

// Removed duplicate - defined at end of file

// ============ PRODUCTOS ============

export async function getProductos(params?: ProductSearchParams): Promise<ProductListResponse> {
  // El backend no soporta paginación, así que simulamos la respuesta paginada
  const response = await apiClient.get<Producto[]>('/producto');
  
  // Si hay parámetros de búsqueda, filtrar en el frontend
  let filteredProducts = response.data;
  
  if (params?.search) {
    filteredProducts = response.data.filter(product => 
      product.nombre.toLowerCase().includes(params.search!.toLowerCase()) ||
      product.codigoBarras?.toLowerCase().includes(params.search!.toLowerCase())
    );
  }
  
  if (params?.categoria) {
    filteredProducts = filteredProducts.filter(product => product.categoriaId === params.categoria);
  }
  
  if (params?.proveedor) {
    filteredProducts = filteredProducts.filter(product => product.proveedorId === params.proveedor);
  }
  
  if (params?.stockBajo) {
    filteredProducts = filteredProducts.filter(product => product.stock <= 5); // Stock bajo = 5 o menos
  }
  
  // Simular paginación
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  
  // Simular ordenamiento
  if (params?.sortBy) {
    paginatedProducts.sort((a, b) => {
      const aValue = a[params.sortBy as keyof Producto];
      const bValue = b[params.sortBy as keyof Producto];
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      if (params.sortOrder === 'desc') {
        return aValue > bValue ? -1 : 1;
      }
      return aValue < bValue ? -1 : 1;
    });
  }
  
  return {
    data: paginatedProducts,
    meta: {
      timestamp: new Date().toISOString(),
      apiVersion: '1.0',
      page,
      limit,
      total: filteredProducts.length,
      totalPages: Math.ceil(filteredProducts.length / limit)
    }
  };
}

export async function getProductoById(id: number): Promise<ApiResponse<Producto>> {
  return apiClient.get<Producto>(`/producto/${id}`);
}

// Búsqueda por código de barras - SIMULADA (backend no implementa este endpoint)
export async function getProductoByBarcode(barcode: string): Promise<ApiResponse<Producto>> {
  // Obtener todos los productos y buscar por código
  const allProducts = await getProductos();
  const product = allProducts.data.find(p => p.codigoBarras === barcode);
  
  if (!product) {
    throw new Error(`Producto con código ${barcode} no encontrado`);
  }
  
  return {
    data: product,
    meta: {
      timestamp: new Date().toISOString(),
      apiVersion: '1.0'
    }
  };
}

export async function createProducto(data: CreateProductoRequest): Promise<ApiResponse<Producto>> {
  return apiClient.post<Producto>('/producto', data);
}

export async function updateProducto(id: number, data: Partial<CreateProductoRequest>): Promise<ApiResponse<Producto>> {
  return apiClient.patch<Producto>(`/producto/${id}`, data);
}

export async function deleteProducto(id: number): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`/producto/${id}`);
}

// ============ AJUSTES DE STOCK ============

export interface AdjustStockRequest {
  cantidad: number;
  tipo: 'entrada' | 'salida' | 'ajuste';
  motivo?: string;
}

export async function adjustStock(
  productId: number, 
  data: AdjustStockRequest
): Promise<ApiResponse<Producto>> {
  return apiClient.post<Producto>(`/producto/${productId}/adjust-stock`, data);
}

export interface StockMovement {
  id: number;
  productoId: number;
  tipo: 'IN' | 'OUT';
  cantidad: number;
  motivo?: string;
  usuarioId: number;
  createdAt: string;
  producto: {
    id: number;
    nombre: string;
  };
  usuario: {
    id: number;
    fullName: string;
  };
}

// Get stock movements for a product (simulated - no backend endpoint exists)
export async function getProductStockMovements(_productId: number): Promise<ApiResponse<StockMovement[]>> {
  // This would be: return apiClient.get<StockMovement[]>(`/producto/${productId}/stock-movements`);
  // For now, return empty array since backend doesn't have this endpoint
  return {
    data: [],
    meta: {
      timestamp: new Date().toISOString(),
      apiVersion: '1.0'
    }
  };
}

// Productos con stock bajo - Simulado (backend no tiene este endpoint)
export async function getProductosStockBajo(): Promise<ProductListResponse> {
  const allProducts = await getProductos();
  const lowStockProducts = allProducts.data.filter(product => product.stock <= 5);
  
  return {
    data: lowStockProducts,
    meta: {
      timestamp: new Date().toISOString(),
      apiVersion: '1.0',
      page: 1,
      limit: lowStockProducts.length,
      total: lowStockProducts.length,
      totalPages: 1
    }
  };
}

// Búsqueda de productos - SIMULADA (backend no implementa búsqueda)
export async function buscarProductos(query: string, limit: number = 10): Promise<ProductListResponse> {
  // Obtener todos los productos y filtrar en el frontend
  const allProducts = await getProductos();
  
  if (!query.trim()) {
    return {
      data: allProducts.data.slice(0, limit),
      meta: {
        timestamp: new Date().toISOString(),
        apiVersion: '1.0'
      }
    };
  }
  
  const filteredProducts = allProducts.data.filter(product => 
    product.nombre.toLowerCase().includes(query.toLowerCase()) ||
    product.codigoBarras?.toLowerCase().includes(query.toLowerCase())
  ).slice(0, limit);
  
  return {
    data: filteredProducts,
    meta: {
      timestamp: new Date().toISOString(),
      apiVersion: '1.0'
    }
  };
}

// ============ CATEGORÍAS ============

export async function getCategorias(): Promise<ApiResponse<Categoria[]>> {
  return apiClient.get<Categoria[]>('/categoria');
}

export async function getCategoriaById(id: number): Promise<ApiResponse<Categoria>> {
  return apiClient.get<Categoria>(`/categoria/${id}`);
}

export async function createCategoria(data: { nombre: string }): Promise<ApiResponse<Categoria>> {
  return apiClient.post<Categoria>('/categoria', data);
}

export async function updateCategoria(id: number, data: { nombre: string }): Promise<ApiResponse<Categoria>> {
  return apiClient.patch<Categoria>(`/categoria/${id}`, data);
}

export async function deleteCategoria(id: number): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`/categoria/${id}`);
}

// ============ PROVEEDORES ============

export async function getProveedores(): Promise<ApiResponse<Proveedor[]>> {
  return apiClient.get<Proveedor[]>('/proveedor');
}

export async function getProveedorById(id: number): Promise<ApiResponse<Proveedor>> {
  return apiClient.get<Proveedor>(`/proveedor/${id}`);
}

export async function createProveedor(data: {
  nombre: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  condicionesPago?: string;
  descuentoPromedio?: number;
}): Promise<ApiResponse<Proveedor>> {
  return apiClient.post<Proveedor>('/proveedor', data);
}

export async function updateProveedor(id: number, data: Partial<{
  nombre: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  condicionesPago?: string;
  descuentoPromedio?: number;
}>): Promise<ApiResponse<Proveedor>> {
  return apiClient.patch<Proveedor>(`/proveedor/${id}`, data);
}

export async function deleteProveedor(id: number): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`/proveedor/${id}`);
}

// ============ FUNCIONES UTILITARIAS ============

// Validar código de barras
export function esCodigoBarras(value: string): boolean {
  // Validación básica: números, al menos 8 dígitos
  return /^\d{8,}$/.test(value);
}

// Calcular precio con impuesto
export function calcularPrecioConImpuesto(precio: number, porcentajeImpuesto: number): number {
  return precio * (1 + porcentajeImpuesto / 100);
}

// Formatear precio
export function formatearPrecio(precio: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(precio);
}

// Verificar si tiene stock disponible
export function tieneStockDisponible(producto: Producto, cantidadRequerida: number = 1): boolean {
  return producto.stock >= cantidadRequerida;
}

// Verificar si está en stock bajo
export function estaEnStockBajo(producto: Producto): boolean {
  return producto.stock <= 5; // Stock bajo = 5 o menos
}

// Legacy exports para compatibilidad con código existente
export type { Producto, Categoria, Proveedor };
export type ProductosList = ProductListResponse;
export type ProductoSearchParams = ProductSearchParams;