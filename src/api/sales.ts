// src/api/sales.ts - API completa para ventas (tickets) con NestJS
import { fetch } from '@tauri-apps/plugin-http';

const API_URL = 'http://localhost:3000';

export interface VentaProducto {
  id?: number;
  productoId: number;
  cantidad: number;
  precio: number; // Precio al momento de la venta
  subtotal: number;
  producto?: {
    id: number;
    nombre: string;
    codigoBarras?: string;
  };
}

export interface Venta {
  id: number;
  numero: string; // Número de factura/ticket
  usuarioId: number;
  sesionId?: number;
  fecha: string;
  subtotal: number;
  descuento: number;
  total: number;
  metodoPago: string; // EFECTIVO, TARJETA, TRANSFERENCIA, MIXTO
  montoPagado: number;
  cambio: number;
  estado: string; // COMPLETADA, CANCELADA
  observaciones?: string;
  productos: VentaProducto[];
  usuario?: {
    id: number;
    fullName: string;
    email: string;
  };
}

export interface CreateVentaRequest {
  productos: {
    productoId: number;
    cantidad: number;
    precio: number;
  }[];
  metodoPago: string;
  montoPagado: number;
  descuento?: number;
  observaciones?: string;
}

export interface UpdateVentaRequest {
  estado?: string;
  observaciones?: string;
}

function getAuthHeaders(token?: string): HeadersInit {
  const authToken = token || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };
}

export async function getVentas(token?: string): Promise<Venta[]> {
  try {
    const res = await fetch(`${API_URL}/venta`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudieron obtener las ventas`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en getVentas:', error);
    throw error;
  }
}

export async function getVentaById(id: number, token?: string): Promise<Venta> {
  try {
    const res = await fetch(`${API_URL}/venta/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudo obtener la venta`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en getVentaById:', error);
    throw error;
  }
}

export async function createVenta(data: CreateVentaRequest, token?: string): Promise<Venta> {
  try {
    const res = await fetch(`${API_URL}/venta`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorData = await res.text();
      console.error('Error del servidor:', errorData);
      throw new Error(`Error ${res.status}: No se pudo crear la venta`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en createVenta:', error);
    throw error;
  }
}

export async function updateVenta(id: number, data: UpdateVentaRequest, token?: string): Promise<Venta> {
  try {
    const res = await fetch(`${API_URL}/venta/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorData = await res.text();
      console.error('Error del servidor:', errorData);
      throw new Error(`Error ${res.status}: No se pudo actualizar la venta`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en updateVenta:', error);
    throw error;
  }
}

export async function deleteVenta(id: number, token?: string): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/venta/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudo eliminar la venta`);
    }
  } catch (error) {
    console.error('Error en deleteVenta:', error);
    throw error;
  }
}

// Función auxiliar para calcular totales de venta
export function calcularTotalesVenta(productos: VentaProducto[], descuento: number = 0) {
  const subtotal = productos.reduce((sum, item) => sum + item.subtotal, 0);
  const descuentoAplicado = Math.min(descuento, subtotal);
  const total = subtotal - descuentoAplicado;
  
  return {
    subtotal,
    descuento: descuentoAplicado,
    total
  };
}

// Función auxiliar para calcular cambio
export function calcularCambio(total: number, montoPagado: number): number {
  return Math.max(0, montoPagado - total);
}