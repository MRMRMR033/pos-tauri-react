// src/types/api.ts - Tipos actualizados basados en schema Prisma del backend

import { ApiResponse, PaginationParams } from '../config/api';

// Re-export para uso en otros módulos
export type { ApiResponse, PaginationParams };

// ============ ENUMS DEL BACKEND ============
export enum Rol {
  ADMIN = 'admin',
  EMPLEADO = 'empleado'
}

export enum EventoTipo {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT'
}

export enum MovimientoTipo {
  IN = 'IN',
  OUT = 'OUT'
}

export enum EstadoOrden {
  PENDIENTE = 'PENDIENTE',
  RECIBIDA = 'RECIBIDA',
  CANCELADA = 'CANCELADA'
}

export enum EstadoTurno {
  ABIERTO = 'ABIERTO',
  CERRADO = 'CERRADO'
}

// ============ MODELOS PRINCIPALES ============

export interface Usuario {
  id: number;
  email: string | null;
  fullName: string;
  rol: Rol;
  createdAt: string;
  updatedAt: string;
}

export interface Producto {
  id: number;
  codigoBarras: string;
  nombre: string;
  precioCosto: number;
  precioVenta: number;
  precioEspecial?: number;
  stock: number;
  categoriaId?: number;  // Backend lo tiene como opcional
  proveedorId?: number;
  createdAt: string;
  updatedAt: string;
  // Relaciones
  categoria?: Categoria;
  proveedor?: Proveedor;
}

export interface Categoria {
  id: number;
  nombre: string;
}

export interface Proveedor {
  id: number;
  nombre: string;
  contacto?: string | null;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  condicionesPago?: string | null;
  descuentoPromedio: string; // Backend returns as string (Decimal type)
}

export interface ConfiguracionImpuesto {
  id: number;
  nombre: string;
  porcentaje: number;
  aplicadoPorDefecto: boolean;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: number;
  usuarioId: number;
  turnoCajaId?: number;
  numeroTicket: number;
  fecha: string;
  subtotal: number;
  impuestos: number;
  descuentoTotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  // Relaciones
  usuario?: Usuario;
  turnoCaja?: TurnoCaja;
  items?: TicketItem[];
}

export interface TicketItem {
  id: number;
  ticketId: number;
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  impuesto: number;
  total: number;
  // Relaciones
  producto?: Producto;
  ticket?: Ticket;
}

export interface TurnoCaja {
  id: number;
  usuarioId: number;
  cajaId: number;
  fechaApertura: string;
  fechaCierre?: string;
  saldoInicial: number | string; // Backend puede devolver como string (Decimal)
  saldoFinal?: number | string;
  totalIngresos: number | string;
  totalEgresos: number | string;
  diferencia: number | string;
  observaciones?: string;
  estado: EstadoTurno;
  // Propiedades adicionales para compatibilidad con UI
  resumen?: {
    saldoInicial: number | string;
    saldoActual: number;
    saldoEsperado?: number;
    diferencia?: number;
    totalIngresos: number;
    totalEgresos: number;
    ventasRealizadas?: number;
    ventasTotal?: number | string;
  };
  caja?: {
    id: number;
    nombre: string;
  };
  // Relaciones
  usuario?: Usuario;
  tickets?: Ticket[];
}

export interface CashMovement {
  id: number;
  usuarioId: number;
  tipo: MovimientoTipo;
  monto: number;
  descripcion?: string;
  createdAt: string;
  // Relaciones
  usuario?: Usuario;
}

export interface StockMovement {
  id: number;
  productoId: number;
  tipo: MovimientoTipo;
  cantidad: number;
  motivo?: string;
  usuarioId: number;
  createdAt: string;
  // Relaciones
  producto?: Producto;
  usuario?: Usuario;
}

export interface OrdenCompra {
  id: number;
  numeroOrden: string;
  proveedorId: number;
  usuarioId: number;
  estado: EstadoOrden;
  fechaOrden: string;
  fechaEntrega?: string;
  subtotal: number;
  impuestos: number;
  total: number;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
  // Relaciones
  proveedor?: Proveedor;
  usuario?: Usuario;
  detalles?: DetalleOrdenCompra[];
}

export interface DetalleOrdenCompra {
  id: number;
  ordenCompraId: number;
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  total: number;
  // Relaciones
  ordenCompra?: OrdenCompra;
  producto?: Producto;
}

export interface Permission {
  id: number;
  key: string;
  name: string;
  description?: string;
  module: string;
  createdAt: string;
}

export interface UserPermission {
  id: number;
  usuarioId: number;
  permissionId: number;
  granted: boolean;
  grantedAt: string;
  grantedById?: number;
  // Relaciones
  grantedBy?: Usuario;
  permission?: Permission;
  usuario?: Usuario;
}

export interface SessionEvent {
  id: number;
  usuarioId: number;
  tipo: EventoTipo;
  timestamp: string;
  // Relaciones
  usuario?: Usuario;
}

// ============ TIPOS DE REQUEST/RESPONSE ============

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface LogoutRequest {
  refresh_token: string;
}

// Productos - Basado en CreateProductoDto del backend
export interface CreateProductoRequest {
  codigoBarras: string;
  nombre: string;
  precioCosto: number;
  precioVenta: number;
  precioEspecial?: number;
  stock: number;
  categoriaId?: number;  // Backend lo tiene como opcional
  proveedorId?: number;
}

// Categorías
export interface CreateCategoriaRequest {
  nombre: string;
}

// Proveedores - Basado en CreateProveedorDto del backend
export interface CreateProveedorRequest {
  nombre: string;
  contacto?: string;
}

export interface ProductSearchParams extends PaginationParams {
  categoria?: number;
  proveedor?: number;
  stockBajo?: boolean;
}

export interface ProductListResponse extends ApiResponse<Producto[]> {}

// Ventas/Tickets
export interface CreateTicketRequest {
  items: Array<{
    productoId: number;
    cantidad: number;
    precioUnitario?: number;
    descuento?: number;
  }>;
  descuentoTotal?: number;
  observaciones?: string;
}

export interface TicketListResponse extends ApiResponse<Ticket[]> {}

// Caja
export interface AbrirCajaRequest {
  saldoInicial: number;
  cajaId?: number;
  observaciones?: string;
}

export interface CerrarCajaRequest {
  saldoFinal: number;
  observaciones?: string;
}

export interface CajaStatusResponse {
  sesionActiva: TurnoCaja | null;
  puedeOperarVentas: boolean;
  ultimosMovimientos: CashMovement[];
}

// Reportes
export interface ReporteVentasParams {
  fechaInicio: string;
  fechaFin: string;
  usuarioId?: number;
  incluirDetalles?: boolean;
}

export interface ReporteInventarioParams {
  categoria?: number;
  stockBajo?: boolean;
  proveedor?: number;
}

// Admin
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  database: 'connected' | 'disconnected';
  migrations: number;
  permissions: number;
  uptime: number;
}

export interface BackupResponse {
  filename: string;
  size: number;
  created: string;
  path: string;
}

export interface RestoreRequest {
  filename: string;
}

// Usuarios
export interface CreateUsuarioRequest {
  email?: string;
  password: string;
  fullName: string;
  rol: Rol;
}

export interface UpdateUsuarioRequest {
  email?: string;
  password?: string;
  fullName?: string;
  rol?: Rol;
}

export interface GrantPermissionRequest {
  userId: number;
  permissionKey: string;
}

export interface RevokePermissionRequest {
  userId: number;
  permissionKey: string;
}