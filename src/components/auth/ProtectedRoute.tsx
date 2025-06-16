// src/components/auth/ProtectedRoute.tsx
import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

interface ProtectedRouteProps {
  // Permiso requerido para acceder a la ruta
  permission?: string;
  
  // Lista de permisos - el usuario debe tener AL MENOS UNO
  anyPermissions?: string[];
  
  // Lista de permisos - el usuario debe tener TODOS
  allPermissions?: string[];
  
  // Verificar si es admin
  requireAdmin?: boolean;
  
  // Componente a renderizar si tiene permisos
  children: ReactNode;
  
  // Ruta de redirección si no tiene permisos (por defecto: /login)
  redirectTo?: string;
  
  // Verificación personalizada
  customCheck?: () => boolean;
}

/**
 * Componente que protege rutas completas basado en permisos del usuario
 * Redirige al login o página de error si no tiene permisos
 * 
 * Ejemplos de uso:
 * 
 * <ProtectedRoute permission="usuarios:ver_todos">
 *   <UsuariosPage />
 * </ProtectedRoute>
 * 
 * <ProtectedRoute anyPermissions={["reportes:ventas_dia", "reportes:inventario"]}>
 *   <ReportesPage />
 * </ProtectedRoute>
 * 
 * <ProtectedRoute requireAdmin>
 *   <ConfiguracionPage />
 * </ProtectedRoute>
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  permission,
  anyPermissions,
  allPermissions,
  requireAdmin = false,
  children,
  redirectTo = '/login',
  customCheck
}) => {
  const location = useLocation();
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    isAdmin, 
    isAuthenticated 
  } = usePermissions();

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar permisos según los props
  let hasRequiredPermissions = true;

  // Verificación personalizada tiene prioridad
  if (customCheck) {
    hasRequiredPermissions = customCheck();
  }
  // Verificar si requiere ser admin
  else if (requireAdmin) {
    hasRequiredPermissions = isAdmin();
  }
  // Verificar permiso específico
  else if (permission) {
    hasRequiredPermissions = hasPermission(permission);
  }
  // Verificar si tiene cualquiera de los permisos
  else if (anyPermissions) {
    hasRequiredPermissions = hasAnyPermission(anyPermissions);
  }
  // Verificar si tiene todos los permisos
  else if (allPermissions) {
    hasRequiredPermissions = hasAllPermissions(allPermissions);
  }

  // Si no tiene permisos, redirigir
  if (!hasRequiredPermissions) {
    return <Navigate to={redirectTo} replace />;
  }

  // Si tiene permisos, renderizar el componente
  return <>{children}</>;
};

// Componente para mostrar página de "Sin permisos"
export const NoPermissionsPage: React.FC = () => {
  return (
    <div className="no-permissions-page">
      <div className="no-permissions-content">
        <div className="no-permissions-icon">
          <svg 
            width="64" 
            height="64" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <h1 className="no-permissions-title">Acceso Denegado</h1>
        <p className="no-permissions-message">
          No tienes permisos suficientes para acceder a esta página.
        </p>
        <p className="no-permissions-submessage">
          Si crees que esto es un error, contacta a tu administrador.
        </p>
        <button 
          className="btn btn-primary"
          onClick={() => window.history.back()}
        >
          Volver Atrás
        </button>
      </div>
    </div>
  );
};

export default ProtectedRoute;