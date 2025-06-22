// src/api/tickets.ts - API para tickets/ventas según schema definitivo
import { fetch } from '@tauri-apps/plugin-http';

const API_URL = 'http://localhost:3000';

// Schema EXACTO según backend definitivo
export interface Ticket {
  id: number;
  usuarioId: number;
  turnoCajaId?: number;
  numeroTicket: number; // Auto-generado por día/usuario
  fecha: string;
  subtotal: number;
  impuestos: number;
  descuentoTotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: number;
    productoId: number;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
    impuesto: number;
    total: number;
    producto: {
      id: number;
      nombre: string;
      codigoBarras: string;
    };
  }>;
}

// Request para crear ticket - schema EXACTO
export interface CreateTicketDto {
  clienteId?: number; // Opcional
  items: Array<{
    productoId: number;
    cantidad: number;
    precioUnitario?: number; // Si no se envía, usa precio del producto
    descuento?: number; // Default: 0
  }>;
  descuentoTotal?: number; // Descuento aplicado al total
  observaciones?: string;
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

// Crear nuevo ticket - endpoint EXACTO: POST /ticket
export async function createTicket(data: CreateTicketDto, token?: string): Promise<Ticket> {
  try {
    const res = await fetch(`${API_URL}/ticket`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      console.error('Error del servidor:', errorData);
      throw new Error(errorData.message || `Error ${res.status}: No se pudo crear el ticket`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en createTicket:', error);
    throw error;
  }
}

// Obtener todos los tickets
export async function getTickets(token?: string): Promise<Ticket[]> {
  try {
    const res = await fetch(`${API_URL}/ticket`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || `Error ${res.status}: No se pudieron obtener los tickets`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en getTickets:', error);
    throw error;
  }
}

// Obtener ticket por ID
export async function getTicketById(id: number, token?: string): Promise<Ticket> {
  try {
    const res = await fetch(`${API_URL}/ticket/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || `Error ${res.status}: No se pudo obtener el ticket`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en getTicketById:', error);
    throw error;
  }
}

// Obtener tickets del día actual
export async function getTicketsHoy(token?: string): Promise<Ticket[]> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const res = await fetch(`${API_URL}/ticket?fecha=${today}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || `Error ${res.status}: No se pudieron obtener los tickets de hoy`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en getTicketsHoy:', error);
    throw error;
  }
}

// Funciones utilitarias para cálculos
export function calcularSubtotal(items: CreateTicketDto['items'], precios: { [productoId: number]: number }): number {
  return items.reduce((total, item) => {
    const precio = item.precioUnitario || precios[item.productoId] || 0;
    const descuento = item.descuento || 0;
    return total + ((precio * item.cantidad) - descuento);
  }, 0);
}

export function calcularImpuestos(subtotal: number, tasaImpuesto: number = 0.16): number {
  return subtotal * tasaImpuesto;
}

export function calcularTotal(subtotal: number, impuestos: number, descuentoTotal: number = 0): number {
  return subtotal + impuestos - descuentoTotal;
}

// Validar que hay suficiente stock para la venta
export function validarStock(items: CreateTicketDto['items'], inventario: { [productoId: number]: number }): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const item of items) {
    const stockDisponible = inventario[item.productoId] || 0;
    if (stockDisponible < item.cantidad) {
      errors.push(`Producto ID ${item.productoId}: Stock insuficiente (disponible: ${stockDisponible}, solicitado: ${item.cantidad})`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}