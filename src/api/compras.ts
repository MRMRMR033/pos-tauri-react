// src/api/compras.ts - API para órdenes de compra según schema definitivo
import { fetch } from '@tauri-apps/plugin-http';

const API_URL = 'http://localhost:3000';

// Schema EXACTO según backend definitivo
export interface OrdenCompra {
  id: number;
  numeroOrden: string; // Generado automáticamente
  proveedorId: number;
  usuarioId: number;
  estado: "PENDIENTE" | "RECIBIDA" | "CANCELADA";
  fechaOrden: string;
  fechaEntrega?: string;
  subtotal: number;
  impuestos: number;
  total: number;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
  proveedor?: {
    id: number;
    nombre: string;
    contacto?: string;
  };
  detalles?: Array<{
    id: number;
    productoId: number;
    cantidad: number;
    precioUnitario: number;
    total: number;
    producto?: {
      nombre: string;
      codigoBarras: string;
    };
  }>;
}

// Request para crear orden de compra - schema EXACTO
export interface CreateOrdenCompraDto {
  proveedorId: number;
  fechaEntrega?: string; // Formato: "YYYY-MM-DD"
  observaciones?: string;
  detalles: Array<{
    productoId: number;
    cantidad: number;
    precioUnitario: number;
  }>;
}

// Request para recibir compra - schema EXACTO
export interface RecibirCompraDto {
  observaciones?: string;
  detallesRecibidos: Array<{
    productoId: number;
    cantidadRecibida: number; // Puede ser diferente a la cantidad pedida
  }>;
}

// Response de compra recibida - schema EXACTO
export interface CompraRecibidaResponse {
  message: string;
  orden: OrdenCompra; // Orden actualizada
  stockActualizado: Array<{
    productoId: number;
    stockAnterior: number;
    stockNuevo: number;
    cantidadAñadida: number;
  }>;
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

// Crear nueva orden de compra - endpoint EXACTO: POST /compra
export async function createOrdenCompra(data: CreateOrdenCompraDto, token?: string): Promise<OrdenCompra> {
  try {
    const res = await fetch(`${API_URL}/compra`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      console.error('Error del servidor:', errorData);
      throw new Error(errorData.message || `Error ${res.status}: No se pudo crear la orden de compra`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en createOrdenCompra:', error);
    throw error;
  }
}

// Recibir orden de compra - endpoint EXACTO: POST /compra/:id/recibir
export async function recibirCompra(ordenId: number, data: RecibirCompraDto, token?: string): Promise<CompraRecibidaResponse> {
  try {
    const res = await fetch(`${API_URL}/compra/${ordenId}/recibir`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      console.error('Error del servidor:', errorData);
      throw new Error(errorData.message || `Error ${res.status}: No se pudo recibir la orden de compra`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en recibirCompra:', error);
    throw error;
  }
}

// Obtener todas las órdenes de compra - endpoint: GET /compra
export async function getOrdenesCompra(token?: string): Promise<OrdenCompra[]> {
  try {
    const res = await fetch(`${API_URL}/compra`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || `Error ${res.status}: No se pudieron obtener las órdenes de compra`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en getOrdenesCompra:', error);
    throw error;
  }
}

// Obtener orden de compra por ID - endpoint: GET /compra/:id
export async function getOrdenCompraById(id: number, token?: string): Promise<OrdenCompra> {
  try {
    const res = await fetch(`${API_URL}/compra/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || `Error ${res.status}: No se pudo obtener la orden de compra`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en getOrdenCompraById:', error);
    throw error;
  }
}

// Cancelar orden de compra (si es necesario)
export async function cancelarOrdenCompra(ordenId: number, motivo?: string, token?: string): Promise<OrdenCompra> {
  try {
    const res = await fetch(`${API_URL}/compra/${ordenId}/cancelar`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ motivo: motivo || 'Cancelada por el usuario' }),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || `Error ${res.status}: No se pudo cancelar la orden de compra`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en cancelarOrdenCompra:', error);
    throw error;
  }
}