// src/types/permissions.ts - Sistema de permisos granulares actualizado (41 permisos)
export interface Permission {
  name: string;
  description: string;
  module: string;
}

export interface UserPermissions {
  userId: number;
  permissions: string[];
}

// ============ SISTEMA DE PERMISOS GRANULARES (41 PERMISOS) ============
// Basado en el backend completado - Cada permiso controla acceso específico a UI y funcionalidad

export const ALL_PERMISSIONS = {
  // ============ PRODUCTOS (8 permisos) ============
  PRODUCTOS_VER: 'productos:ver',                           // Ver lista de productos
  PRODUCTOS_VER_PRECIO_COSTO: 'productos:ver_precio_costo', // Ver precio de costo en UI
  PRODUCTOS_VER_PRECIO_VENTA: 'productos:ver_precio_venta', // Ver precio de venta
  PRODUCTOS_CREAR: 'productos:crear',                       // Botón "Nuevo Producto"
  PRODUCTOS_EDITAR: 'productos:editar',                     // Botón "Editar" en tabla
  PRODUCTOS_ELIMINAR: 'productos:eliminar',                 // Botón "Eliminar" en tabla
  PRODUCTOS_VER_STOCK: 'productos:ver_stock',               // Ver columna de stock
  PRODUCTOS_AJUSTAR_STOCK: 'productos:ajustar_stock',       // Botón "Ajustar Stock"

  // ============ VENTAS (7 permisos) ============
  VENTAS_CREAR: 'ventas:crear',                             // Acceso a pantalla de ventas
  VENTAS_VER_PROPIAS: 'ventas:ver_propias',                 // Ver solo sus ventas
  VENTAS_VER_TODAS: 'ventas:ver_todas',                     // Ver ventas de todos
  VENTAS_CANCELAR: 'ventas:cancelar',                       // Botón "Anular Venta"
  VENTAS_APLICAR_DESCUENTO: 'ventas:aplicar_descuento',     // Input de descuentos
  VENTAS_EDITAR: 'ventas:editar',                           // Editar venta existente
  VENTAS_ELIMINAR: 'ventas:eliminar',                       // Eliminar venta

  // ============ CAJA (6 permisos) ============
  CAJA_ABRIR: 'caja:abrir',                                 // Botón "Abrir Caja"
  CAJA_CERRAR: 'caja:cerrar',                               // Botón "Cerrar Caja"
  CAJA_VER: 'caja:ver',                                     // Ver información de caja
  CAJA_VER_MOVIMIENTOS: 'caja:ver_movimientos',             // Ver sus movimientos
  CAJA_VER_MOVIMIENTOS_TODOS: 'caja:ver_movimientos_todos', // Ver todos los movimientos
  CAJA_REGISTRAR_ENTRADA: 'caja:registrar_entrada',         // Botón "Registro Entrada"
  CAJA_REGISTRAR_SALIDA: 'caja:registrar_salida',           // Botón "Registro Salida"

  // ============ USUARIOS (6 permisos) ============
  USUARIOS_VER_TODOS: 'usuarios:ver_todos',                 // Acceso a gestión usuarios
  USUARIOS_VER_PROPIO: 'usuarios:ver_propio',               // Ver solo su perfil
  USUARIOS_CREAR: 'usuarios:crear',                         // Botón "Nuevo Usuario"
  USUARIOS_EDITAR: 'usuarios:editar',                       // Botón "Editar Usuario"
  USUARIOS_ELIMINAR: 'usuarios:eliminar',                   // Botón "Eliminar Usuario"
  USUARIOS_GESTIONAR_PERMISOS: 'usuarios:gestionar_permisos', // Panel de permisos

  // ============ CATEGORÍAS (4 permisos) ============
  CATEGORIAS_VER: 'categorias:ver',                         // Ver lista categorías
  CATEGORIAS_CREAR: 'categorias:crear',                     // Botón "Nueva Categoría"
  CATEGORIAS_EDITAR: 'categorias:editar',                   // Botón "Editar"
  CATEGORIAS_ELIMINAR: 'categorias:eliminar',               // Botón "Eliminar"

  // ============ PROVEEDORES (4 permisos) ============
  PROVEEDORES_VER: 'proveedores:ver',                       // Ver lista proveedores
  PROVEEDORES_CREAR: 'proveedores:crear',                   // Botón "Nuevo Proveedor"
  PROVEEDORES_EDITAR: 'proveedores:editar',                 // Botón "Editar"
  PROVEEDORES_ELIMINAR: 'proveedores:eliminar',             // Botón "Eliminar"

  // ============ SESIONES (2 permisos) ============
  SESIONES_VER_PROPIAS: 'sesiones:ver_propias',             // Ver sus sesiones
  SESIONES_VER_TODAS: 'sesiones:ver_todas',                 // Ver todas las sesiones

  // ============ REPORTES (4 permisos) ============
  REPORTES_VENTAS_DIA: 'reportes:ventas_dia',               // Reporte ventas del día
  REPORTES_VENTAS_PERIODO: 'reportes:ventas_periodo',       // Reportes por período
  REPORTES_INVENTARIO: 'reportes:inventario',               // Reportes de inventario
  REPORTES_FINANCIEROS: 'reportes:financieros',             // Reportes financieros avanzados
} as const;

// ============ CONFIGURACIONES DE PERMISOS ============

// Permisos por defecto para empleados nuevos (conjunto mínimo funcional)
export const DEFAULT_EMPLOYEE_PERMISSIONS = [
  ALL_PERMISSIONS.PRODUCTOS_VER,
  ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_VENTA,
  ALL_PERMISSIONS.PRODUCTOS_VER_STOCK,
  ALL_PERMISSIONS.VENTAS_CREAR,
  ALL_PERMISSIONS.VENTAS_VER_PROPIAS,
  ALL_PERMISSIONS.CAJA_ABRIR,
  ALL_PERMISSIONS.CAJA_CERRAR,
  ALL_PERMISSIONS.CAJA_VER_MOVIMIENTOS,
  ALL_PERMISSIONS.CAJA_REGISTRAR_ENTRADA,
  ALL_PERMISSIONS.CAJA_REGISTRAR_SALIDA,
  ALL_PERMISSIONS.CATEGORIAS_VER,
  ALL_PERMISSIONS.PROVEEDORES_VER,
  ALL_PERMISSIONS.USUARIOS_VER_PROPIO,
  ALL_PERMISSIONS.SESIONES_VER_PROPIAS,
  ALL_PERMISSIONS.REPORTES_VENTAS_DIA,
];

// Permisos críticos que requieren autorización especial
export const CRITICAL_PERMISSIONS = [
  ALL_PERMISSIONS.PRODUCTOS_ELIMINAR,
  ALL_PERMISSIONS.VENTAS_CANCELAR,
  ALL_PERMISSIONS.VENTAS_ELIMINAR,
  ALL_PERMISSIONS.USUARIOS_ELIMINAR,
  ALL_PERMISSIONS.USUARIOS_GESTIONAR_PERMISOS,
  ALL_PERMISSIONS.REPORTES_FINANCIEROS,
];

// Agrupación de permisos por módulos para la UI de gestión
export const PERMISSIONS_BY_MODULE = {
  productos: {
    name: 'Productos',
    icon: '📦',
    permissions: [
      ALL_PERMISSIONS.PRODUCTOS_VER,
      ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_COSTO,
      ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_VENTA,
      ALL_PERMISSIONS.PRODUCTOS_CREAR,
      ALL_PERMISSIONS.PRODUCTOS_EDITAR,
      ALL_PERMISSIONS.PRODUCTOS_ELIMINAR,
      ALL_PERMISSIONS.PRODUCTOS_VER_STOCK,
      ALL_PERMISSIONS.PRODUCTOS_AJUSTAR_STOCK,
    ]
  },
  ventas: {
    name: 'Ventas',
    icon: '💰',
    permissions: [
      ALL_PERMISSIONS.VENTAS_CREAR,
      ALL_PERMISSIONS.VENTAS_VER_PROPIAS,
      ALL_PERMISSIONS.VENTAS_VER_TODAS,
      ALL_PERMISSIONS.VENTAS_CANCELAR,
      ALL_PERMISSIONS.VENTAS_APLICAR_DESCUENTO,
      ALL_PERMISSIONS.VENTAS_EDITAR,
      ALL_PERMISSIONS.VENTAS_ELIMINAR,
    ]
  },
  caja: {
    name: 'Caja',
    icon: '🏦',
    permissions: [
      ALL_PERMISSIONS.CAJA_ABRIR,
      ALL_PERMISSIONS.CAJA_CERRAR,
      ALL_PERMISSIONS.CAJA_VER_MOVIMIENTOS,
      ALL_PERMISSIONS.CAJA_VER_MOVIMIENTOS_TODOS,
      ALL_PERMISSIONS.CAJA_REGISTRAR_ENTRADA,
      ALL_PERMISSIONS.CAJA_REGISTRAR_SALIDA,
    ]
  },
  usuarios: {
    name: 'Usuarios',
    icon: '👥',
    permissions: [
      ALL_PERMISSIONS.USUARIOS_VER_TODOS,
      ALL_PERMISSIONS.USUARIOS_VER_PROPIO,
      ALL_PERMISSIONS.USUARIOS_CREAR,
      ALL_PERMISSIONS.USUARIOS_EDITAR,
      ALL_PERMISSIONS.USUARIOS_ELIMINAR,
      ALL_PERMISSIONS.USUARIOS_GESTIONAR_PERMISOS,
    ]
  },
  categorias: {
    name: 'Categorías',
    icon: '🏷️',
    permissions: [
      ALL_PERMISSIONS.CATEGORIAS_VER,
      ALL_PERMISSIONS.CATEGORIAS_CREAR,
      ALL_PERMISSIONS.CATEGORIAS_EDITAR,
      ALL_PERMISSIONS.CATEGORIAS_ELIMINAR,
    ]
  },
  proveedores: {
    name: 'Proveedores',
    icon: '🏭',
    permissions: [
      ALL_PERMISSIONS.PROVEEDORES_VER,
      ALL_PERMISSIONS.PROVEEDORES_CREAR,
      ALL_PERMISSIONS.PROVEEDORES_EDITAR,
      ALL_PERMISSIONS.PROVEEDORES_ELIMINAR,
    ]
  },
  sesiones: {
    name: 'Sesiones',
    icon: '🔐',
    permissions: [
      ALL_PERMISSIONS.SESIONES_VER_PROPIAS,
      ALL_PERMISSIONS.SESIONES_VER_TODAS,
    ]
  },
  reportes: {
    name: 'Reportes',
    icon: '📊',
    permissions: [
      ALL_PERMISSIONS.REPORTES_VENTAS_DIA,
      ALL_PERMISSIONS.REPORTES_VENTAS_PERIODO,
      ALL_PERMISSIONS.REPORTES_INVENTARIO,
      ALL_PERMISSIONS.REPORTES_FINANCIEROS,
    ]
  },
};

// Mapeo de permisos a componentes UI (para visibilidad dinámica)
export const PERMISSION_UI_MAPPING = {
  // Navegación principal
  'nav-ventas': [ALL_PERMISSIONS.VENTAS_CREAR],
  'nav-productos': [ALL_PERMISSIONS.PRODUCTOS_VER],
  'nav-inventario': [ALL_PERMISSIONS.PRODUCTOS_VER_STOCK],
  'nav-categorias': [ALL_PERMISSIONS.CATEGORIAS_VER],
  'nav-proveedores': [ALL_PERMISSIONS.PROVEEDORES_VER],
  'nav-caja': [ALL_PERMISSIONS.CAJA_ABRIR, ALL_PERMISSIONS.CAJA_CERRAR, ALL_PERMISSIONS.CAJA_VER],
  'nav-usuarios': [ALL_PERMISSIONS.USUARIOS_VER_TODOS],
  'nav-reportes': [ALL_PERMISSIONS.REPORTES_VENTAS_DIA, ALL_PERMISSIONS.REPORTES_VENTAS_PERIODO],

  // Botones críticos
  'btn-nuevo-producto': [ALL_PERMISSIONS.PRODUCTOS_CREAR],
  'btn-editar-producto': [ALL_PERMISSIONS.PRODUCTOS_EDITAR],
  'btn-eliminar-producto': [ALL_PERMISSIONS.PRODUCTOS_ELIMINAR],
  'btn-ajustar-stock': [ALL_PERMISSIONS.PRODUCTOS_AJUSTAR_STOCK],
  'btn-abrir-caja': [ALL_PERMISSIONS.CAJA_ABRIR],
  'btn-cerrar-caja': [ALL_PERMISSIONS.CAJA_CERRAR],
  'btn-anular-venta': [ALL_PERMISSIONS.VENTAS_CANCELAR],
  'btn-aplicar-descuento': [ALL_PERMISSIONS.VENTAS_APLICAR_DESCUENTO],

  // Columnas de datos sensibles
  'col-precio-costo': [ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_COSTO],
  'col-stock': [ALL_PERMISSIONS.PRODUCTOS_VER_STOCK],
  'col-reportes-financieros': [ALL_PERMISSIONS.REPORTES_FINANCIEROS],
};

// Funciones utilitarias para manejo de permisos
export function getPermissionsByModule(module: keyof typeof PERMISSIONS_BY_MODULE): string[] {
  return PERMISSIONS_BY_MODULE[module]?.permissions || [];
}

export function isCriticalPermission(permission: string): boolean {
  return CRITICAL_PERMISSIONS.includes(permission);
}

export function getUIComponentPermissions(componentKey: string): string[] {
  return PERMISSION_UI_MAPPING[componentKey as keyof typeof PERMISSION_UI_MAPPING] || [];
}

export type PermissionKey = keyof typeof ALL_PERMISSIONS;
export type PermissionValue = typeof ALL_PERMISSIONS[PermissionKey];