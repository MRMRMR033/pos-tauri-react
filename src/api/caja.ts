// src/api/caja.ts - API de caja actualizada con ApiResponse<T>
import { apiClient } from './client';
import { 
  TurnoCaja, 
  CashMovement, 
  CajaStatusResponse,
  ApiResponse,
  MovimientoTipo
} from '../types/api';

// Re-export local types for pages
export interface AbrirCajaRequest {
  saldoInicial: number;
  cajaId?: number;
  observaciones?: string;
}

export interface CerrarCajaRequest {
  saldoFinal: number;
  observaciones?: string;
}

// ============ GESTIÓN DE TURNOS DE CAJA ============
// NOTA: Implementación temporal mientras se desarrolla el backend completo

export async function getEstadoCaja(): Promise<ApiResponse<CajaStatusResponse>> {
  // Usar el endpoint real para obtener turno actual
  try {
    const turnoResponse = await getTurnoActual();
    
    const status: CajaStatusResponse = {
      sesionActiva: turnoResponse.data,
      puedeOperarVentas: turnoResponse.data !== null,
      ultimosMovimientos: [] // TODO: Implementar cuando el backend esté listo
    };
    
    return Promise.resolve({
      data: status,
      success: true,
      message: turnoResponse.data ? 'Caja abierta' : 'Caja cerrada',
      meta: {
        timestamp: new Date().toISOString(),
        apiVersion: '1.0'
      }
    });
  } catch (error) {
    console.error('Error obteniendo estado de caja:', error);
    // Fallback: asumir que no hay caja abierta
    return Promise.resolve({
      data: {
        sesionActiva: null,
        puedeOperarVentas: false,
        ultimosMovimientos: []
      },
      success: true,
      message: 'No se pudo verificar estado de caja',
      meta: {
        timestamp: new Date().toISOString(),
        apiVersion: '1.0'
      }
    });
  }
}

export async function abrirCaja(data: AbrirCajaRequest): Promise<ApiResponse<TurnoCaja>> {
  return apiClient.post<TurnoCaja>('/caja/abrir', data);
}

export async function cerrarCaja(data: CerrarCajaRequest): Promise<ApiResponse<TurnoCaja>> {
  // Necesitamos el ID del turno - obtenerlo primero
  const turnoActual = await getTurnoActual();
  if (!turnoActual.data) {
    throw new Error('No hay turno activo para cerrar');
  }
  
  return apiClient.post<TurnoCaja>(`/caja/${turnoActual.data.id}/cerrar`, data);
}

export async function getTurnoActual(): Promise<ApiResponse<TurnoCaja | null>> {
  // Usar el endpoint real del backend
  try {
    return await apiClient.get<TurnoCaja | null>('/caja/actual');
  } catch (error: any) {
    // Si falla (ej: no hay turno activo), retornar null
    console.warn('⚠️ No hay turno de caja activo:', error.message);
    return Promise.resolve({
      data: null,
      success: true,
      message: 'No hay turno de caja activo',
      meta: {
        timestamp: new Date().toISOString(),
        apiVersion: '1.0'
      }
    });
  }
}

export async function getTurnos(params?: {
  page?: number;
  limit?: number;
  fechaInicio?: string;
  fechaFin?: string;
  usuarioId?: number;
}): Promise<ApiResponse<TurnoCaja[]>> {
  return apiClient.get<TurnoCaja[]>('/caja/turnos', params);
}

export async function getTurnoById(id: number): Promise<ApiResponse<TurnoCaja>> {
  return apiClient.get<TurnoCaja>(`/caja/turnos/${id}`);
}

// ============ MOVIMIENTOS DE CAJA ============

export async function getMovimientosCaja(params?: {
  page?: number;
  limit?: number;
  tipo?: MovimientoTipo;
  fechaInicio?: string;
  fechaFin?: string;
  usuarioId?: number;
}): Promise<ApiResponse<CashMovement[]>> {
  return apiClient.get<CashMovement[]>('/cash-movement', params);
}

export async function registrarMovimiento(data: {
  usuarioId: number;
  tipo: MovimientoTipo;
  monto: number;
  descripcion?: string;
}): Promise<ApiResponse<CashMovement>> {
  return apiClient.post<CashMovement>('/cash-movement', data);
}

export async function getMovimientoById(id: number): Promise<ApiResponse<CashMovement>> {
  return apiClient.get<CashMovement>(`/cash-movement/${id}`);
}

export async function updateMovimiento(
  id: number, 
  data: Partial<{
    monto: number;
    descripcion: string;
  }>
): Promise<ApiResponse<CashMovement>> {
  return apiClient.patch<CashMovement>(`/cash-movement/${id}`, data);
}

export async function deleteMovimiento(id: number): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`/cash-movement/${id}`);
}

// ============ FUNCIONES UTILITARIAS ============

export function calcularTotalCaja(movimientos: CashMovement[], saldoInicial: number = 0): number {
  return movimientos.reduce((total, mov) => {
    return mov.tipo === MovimientoTipo.IN 
      ? total + mov.monto 
      : total - mov.monto;
  }, saldoInicial);
}

export function agruparMovimientosPorTipo(movimientos: CashMovement[]): {
  ingresos: CashMovement[];
  egresos: CashMovement[];
} {
  return {
    ingresos: movimientos.filter(mov => mov.tipo === MovimientoTipo.IN),
    egresos: movimientos.filter(mov => mov.tipo === MovimientoTipo.OUT)
  };
}

export function calcularResumenCaja(turno: TurnoCaja): {
  saldoEsperado: number;
  diferencia: number;
  totalIngresos: number;
  totalEgresos: number;
} {
  const saldoInicial = Number(turno.saldoInicial);
  const totalIngresos = Number(turno.totalIngresos);
  const totalEgresos = Number(turno.totalEgresos);
  const saldoFinal = Number(turno.saldoFinal || 0);
  
  const saldoEsperado = saldoInicial + totalIngresos - totalEgresos;
  const diferencia = saldoFinal - saldoEsperado;
  
  return {
    saldoEsperado,
    diferencia,
    totalIngresos,
    totalEgresos
  };
}

export function formatearMoneda(monto: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(monto);
}

export function esTurnoActivo(turno: TurnoCaja): boolean {
  return turno.estado === 'ABIERTO' && !turno.fechaCierre;
}

// Verificar si se puede operar ventas
export async function puedeOperarVentas(): Promise<boolean> {
  try {
    const estadoResponse = await getEstadoCaja();
    return estadoResponse.data.puedeOperarVentas;
  } catch (error) {
    console.error('Error verificando si puede operar ventas:', error);
    return false;
  }
}

// Legacy types y funciones para compatibilidad con código existente
export interface TurnoActual extends TurnoCaja {}

export interface AbrirCajaDto extends AbrirCajaRequest {}
export interface CerrarCajaDto extends CerrarCajaRequest {}

// Re-export types para compatibilidad
export type { TurnoCaja };

// Legacy function para compatibilidad
export async function hayTurnoActivo(): Promise<boolean> {
  try {
    const turno = await getTurnoActual();
    return turno.data !== null;
  } catch (error) {
    console.error('Error verificando turno activo:', error);
    return false;
  }
}

// Legacy function para compatibilidad con código existente en Venta.tsx
export { getEstadoCaja as getCajaStatus };

// Legacy function para obtener historial de turnos
export async function getHistorialTurnos(params?: {
  page?: number;
  limit?: number;
  fechaInicio?: string;
  fechaFin?: string;
  usuarioId?: number;
}): Promise<ApiResponse<TurnoCaja[]>> {
  return getTurnos(params);
}