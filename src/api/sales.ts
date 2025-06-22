// src/api/sales.ts - API completa para ventas (tickets) con NestJS
import { apiClient } from './client';
import { ApiResponse, Ticket } from '../types/api';

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
  numero: string; // N�mero de factura/ticket
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

// DTO que coincide con el backend CreateEnhancedTicketDto
export interface CreateTicketRequest {
  usuarioId: number; // Placeholder - Se sobreescribe con el JWT token en el backend
  turnoCajaId?: number;
  fecha?: string;
  items: {
    productoId: number;
    cantidad?: number;
    precioUnitario?: number;
    descuento?: number;
  }[];
  descuentoManual?: number;
  recargoManual?: number;
  observaciones?: string;
}

export interface UpdateVentaRequest {
  estado?: string;
  observaciones?: string;
}

export async function getVentas(): Promise<ApiResponse<Venta[]>> {
  return apiClient.get<Venta[]>('/venta');
}

export async function getVentaById(id: number): Promise<ApiResponse<Venta>> {
  return apiClient.get<Venta>(`/venta/${id}`);
}

export async function createVenta(data: CreateVentaRequest): Promise<ApiResponse<Ticket>> {
  // Mapear al formato correcto del backend (CreateEnhancedTicketDto)
  const backendData: CreateTicketRequest = {
    usuarioId: 1, // Placeholder - Se sobreescribe con el JWT token en el backend (línea 107 del controller)
    items: data.productos.map(p => ({
      productoId: p.productoId,
      cantidad: p.cantidad,
      precioUnitario: p.precio
      // No incluimos descuento por item por ahora
    })),
    descuentoManual: data.descuento || 0,
    observaciones: data.observaciones
    // turnoCajaId se puede obtener automáticamente del backend si está configurado
  };
  
  console.log('🚀 Enviando venta al backend:', backendData);
  
  try {
    const response = await apiClient.post<Ticket>('/ventas', backendData);
    console.log('✅ Respuesta exitosa del backend:', response);
    return response;
  } catch (error) {
    console.error('💥 Error específico en createVenta:', error);
    console.error('💥 Tipo de error:', typeof error);
    console.error('💥 Es ApiError?:', error instanceof Error);
    
    if (error && typeof error === 'object') {
      console.error('💥 Propiedades del error:', Object.keys(error));
      console.error('💥 Error completo:', JSON.stringify(error, null, 2));
    }
    
    throw error;
  }
}

export async function updateVenta(id: number, data: UpdateVentaRequest): Promise<ApiResponse<Venta>> {
  return apiClient.patch<Venta>(`/venta/${id}`, data);
}

export async function deleteVenta(id: number): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`/venta/${id}`);
}

// Funci�n auxiliar para calcular totales de venta
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

// Funci�n auxiliar para calcular cambio
export function calcularCambio(total: number, montoPagado: number): number {
  return Math.max(0, montoPagado - total);
}