// src/api/session-events.ts - API para sesiones de venta con NestJS
import { fetch } from '@tauri-apps/plugin-http';

const API_URL = 'http://localhost:3000';

export interface SesionVenta {
  id: number;
  usuarioId: number;
  fechaInicio: string;
  fechaCierre?: string;
  montoInicial: number;
  montoFinal?: number;
  totalVentas: number;
  totalCobrado: number;
  totalEfectivo: number;
  totalTarjeta: number;
  totalTransferencia: number;
  estado: string; // ABIERTA, CERRADA
  observaciones?: string;
  usuario?: {
    id: number;
    fullName: string;
    email: string;
  };
}

export interface CreateSesionVentaRequest {
  montoInicial: number;
  observaciones?: string;
}

export interface UpdateSesionVentaRequest {
  montoFinal?: number;
  totalVentas?: number;
  totalCobrado?: number;
  totalEfectivo?: number;
  totalTarjeta?: number;
  totalTransferencia?: number;
  estado?: string;
  observaciones?: string;
}

export interface CerrarSesionRequest {
  montoFinal: number;
  observaciones?: string;
}

function getAuthHeaders(token?: string): HeadersInit {
  const authToken = token || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };
}

export async function getSesionesVenta(token?: string): Promise<SesionVenta[]> {
  try {
    const res = await fetch(`${API_URL}/session-event`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudieron obtener las sesiones de venta`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en getSesionesVenta:', error);
    throw error;
  }
}

export async function getSesionVentaById(id: number, token?: string): Promise<SesionVenta> {
  try {
    const res = await fetch(`${API_URL}/session-event/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudo obtener la sesión de venta`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en getSesionVentaById:', error);
    throw error;
  }
}

export async function createSesionVenta(data: CreateSesionVentaRequest, token?: string): Promise<SesionVenta> {
  try {
    const res = await fetch(`${API_URL}/session-event`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorData = await res.text();
      console.error('Error del servidor:', errorData);
      throw new Error(`Error ${res.status}: No se pudo crear la sesión de venta`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en createSesionVenta:', error);
    throw error;
  }
}

export async function updateSesionVenta(id: number, data: UpdateSesionVentaRequest, token?: string): Promise<SesionVenta> {
  try {
    const res = await fetch(`${API_URL}/session-event/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorData = await res.text();
      console.error('Error del servidor:', errorData);
      throw new Error(`Error ${res.status}: No se pudo actualizar la sesión de venta`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en updateSesionVenta:', error);
    throw error;
  }
}

export async function cerrarSesionVenta(id: number, data: CerrarSesionRequest, token?: string): Promise<SesionVenta> {
  try {
    const updateData: UpdateSesionVentaRequest = {
      ...data,
      estado: 'CERRADA'
    };
    
    return await updateSesionVenta(id, updateData, token);
  } catch (error) {
    console.error('Error en cerrarSesionVenta:', error);
    throw error;
  }
}

export async function deleteSesionVenta(id: number, token?: string): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/session-event/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudo eliminar la sesión de venta`);
    }
  } catch (error) {
    console.error('Error en deleteSesionVenta:', error);
    throw error;
  }
}

// Función auxiliar para obtener sesión activa del usuario
export async function getSesionActivaUsuario(token?: string): Promise<SesionVenta | null> {
  try {
    const sesiones = await getSesionesVenta(token);
    return sesiones.find(s => s.estado === 'ABIERTA') || null;
  } catch (error) {
    console.error('Error en getSesionActivaUsuario:', error);
    throw error;
  }
}

// Función auxiliar para validar si se puede abrir una nueva sesión
export async function puedeAbrirNuevaSesion(token?: string): Promise<boolean> {
  try {
    const sesionActiva = await getSesionActivaUsuario(token);
    return sesionActiva === null;
  } catch (error) {
    console.error('Error en puedeAbrirNuevaSesion:', error);
    return false;
  }
}