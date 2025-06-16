// src/hooks/usePermissions.ts
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Hook personalizado para manejar permisos de usuario
 * Proporciona funciones útiles para verificar permisos en componentes
 */
export const usePermissions = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('usePermissions debe ser usado dentro de un AuthProvider');
  }

  const {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    refreshPermissions,
    user,
    accessToken
  } = context;

  return {
    // Lista completa de permisos del usuario
    permissions,
    
    // Verificar si tiene un permiso específico
    hasPermission,
    
    // Verificar si tiene al menos uno de los permisos de la lista
    hasAnyPermission,
    
    // Verificar si tiene todos los permisos de la lista
    hasAllPermissions,
    
    // Verificar si es administrador (tiene todos los permisos)
    isAdmin,
    
    // Refrescar permisos desde el servidor
    refreshPermissions,
    
    // Verificaciones de estado
    isAuthenticated: !!user && !!accessToken,
    
    // Funciones de utilidad específicas para módulos
    canManageProducts: () => hasAnyPermission([
      'productos:crear',
      'productos:editar',
      'productos:eliminar'
    ]),
    
    canViewCostPrices: () => hasPermission('productos:ver_precio_costo'),
    
    canManageUsers: () => hasAnyPermission([
      'usuarios:crear',
      'usuarios:editar',
      'usuarios:eliminar',
      'usuarios:gestionar_permisos'
    ]),
    
    canViewAllSales: () => hasPermission('ventas:ver_todas'),
    
    canManageCategories: () => hasAnyPermission([
      'categorias:crear',
      'categorias:editar',
      'categorias:eliminar'
    ]),
    
    canManageSuppliers: () => hasAnyPermission([
      'proveedores:crear',
      'proveedores:editar',
      'proveedores:eliminar'
    ]),
    
    canAccessReports: () => hasAnyPermission([
      'reportes:ventas_dia',
      'reportes:ventas_periodo',
      'reportes:inventario',
      'reportes:financieros'
    ]),
    
    canManageCash: () => hasAnyPermission([
      'caja:abrir',
      'caja:cerrar',
      'caja:ver_movimientos_todos'
    ]),
    
    // Función para verificar permisos específicos de venta
    canProcessSales: () => hasPermission('ventas:crear'),
    
    canApplyDiscounts: () => hasPermission('ventas:aplicar_descuento'),
    
    // Función para verificar si puede ver información financiera sensible
    canViewFinancialData: () => hasAnyPermission([
      'productos:ver_precio_costo',
      'reportes:financieros',
      'caja:ver_movimientos_todos'
    ]),
  };
};

export default usePermissions;