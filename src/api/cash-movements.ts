// src/api/cash-movements.ts - API para movimientos de caja con NestJS
import { fetch } from '@tauri-apps/plugin-http';

const API_URL = 'http://localhost:3000';

export interface MovimientoCaja {
  id: number;
  tipo: string; // ENTRADA, SALIDA, VENTA
  monto: number;
  descripcion: string;
  fecha: string;
  usuarioId: number;
  ventaId?: number; // Solo si es por venta
  usuario?: {
    id: number;
    fullName: string;
    email: string;
  };
  venta?: {
    id: number;
    numero: string;
    total: number;
  };
}

export interface CreateMovimientoCajaRequest {
  tipo: string; // ENTRADA, SALIDA
  monto: number;
  descripcion: string;
  ventaId?: number; // Opcional, solo para movimientos por venta
}

export interface UpdateMovimientoCajaRequest {
  tipo?: string;
  monto?: number;
  descripcion?: string;
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

export async function getMovimientosCaja(token?: string): Promise<MovimientoCaja[]> {
  try {
    const res = await fetch(`${API_URL}/cash-movement`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudieron obtener los movimientos de caja`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en getMovimientosCaja:', error);
    throw error;
  }
}

export async function getMovimientoCajaById(id: number, token?: string): Promise<MovimientoCaja> {
  try {
    const res = await fetch(`${API_URL}/cash-movement/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudo obtener el movimiento de caja`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en getMovimientoCajaById:', error);
    throw error;
  }
}

export async function createMovimientoCaja(data: CreateMovimientoCajaRequest, token?: string): Promise<MovimientoCaja> {
  try {
    const res = await fetch(`${API_URL}/cash-movement`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorData = await res.text();
      console.error('Error del servidor:', errorData);
      throw new Error(`Error ${res.status}: No se pudo crear el movimiento de caja`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en createMovimientoCaja:', error);
    throw error;
  }
}

export async function updateMovimientoCaja(id: number, data: UpdateMovimientoCajaRequest, token?: string): Promise<MovimientoCaja> {
  try {
    const res = await fetch(`${API_URL}/cash-movement/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorData = await res.text();
      console.error('Error del servidor:', errorData);
      throw new Error(`Error ${res.status}: No se pudo actualizar el movimiento de caja`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en updateMovimientoCaja:', error);
    throw error;
  }
}

export async function deleteMovimientoCaja(id: number, token?: string): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/cash-movement/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudo eliminar el movimiento de caja`);
    }
  } catch (error) {
    console.error('Error en deleteMovimientoCaja:', error);
    throw error;
  }
}

// Función auxiliar para obtener balance de caja
export function calcularBalanceCaja(movimientos: MovimientoCaja[]): {
  totalEntradas: number;
  totalSalidas: number;
  balance: number;
} {
  const totalEntradas = movimientos
    .filter(m => m.tipo === 'ENTRADA' || m.tipo === 'VENTA')
    .reduce((sum, m) => sum + m.monto, 0);
    
  const totalSalidas = movimientos
    .filter(m => m.tipo === 'SALIDA')
    .reduce((sum, m) => sum + m.monto, 0);
    
  return {
    totalEntradas,
    totalSalidas,
    balance: totalEntradas - totalSalidas
  };
}