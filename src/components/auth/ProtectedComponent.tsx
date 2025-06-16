// src/components/auth/ProtectedComponent.tsx
import React, { ReactNode } from 'react';
import { usePermissions } from '../../hooks/usePermissions';

interface ProtectedComponentProps {
  // Permiso requerido para mostrar el componente
  permission?: string;
  
  // Lista de permisos - el usuario debe tener AL MENOS UNO
  anyPermissions?: string[];
  
  // Lista de permisos - el usuario debe tener TODOS
  allPermissions?: string[];
  
  // Verificar si es admin
  requireAdmin?: boolean;
  
  // Contenido a mostrar si tiene permisos
  children: ReactNode;
  
  // Contenido alternativo si no tiene permisos (opcional)
  fallback?: ReactNode;
  
  // Mensaje personalizado cuando no tiene permisos
  noPermissionMessage?: string;
  
  // Mostrar mensaje de error o solo ocultar el componente
  showErrorMessage?: boolean;
  
  // Verificación personalizada
  customCheck?: () => boolean;
}

/**
 * Componente que condiciona la renderización basada en permisos del usuario
 * Ejemplos de uso:
 * 
 * <ProtectedComponent permission="productos:ver_precio_costo">
 *   <span>Costo: ${producto.precioCosto}</span>
 * </ProtectedComponent>
 * 
 * <ProtectedComponent anyPermissions={["productos:crear", "productos:editar"]}>
 *   <Button>Gestionar Producto</Button>
 * </ProtectedComponent>
 * 
 * <ProtectedComponent requireAdmin>
 *   <AdminPanel />
 * </ProtectedComponent>
 */
export const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  permission,
  anyPermissions,
  allPermissions,
  requireAdmin = false,
  children,
  fallback,
  noPermissionMessage = "No tienes permisos para ver este contenido",
  showErrorMessage = false,
  customCheck
}) => {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    isAdmin, 
    isAuthenticated 
  } = usePermissions();

  // Si no está autenticado, no mostrar nada
  if (!isAuthenticated) {
    return showErrorMessage ? (
      <div className="permission-error">
        <span className="error-text">Debes iniciar sesión para ver este contenido</span>
      </div>
    ) : null;
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

  // Si tiene permisos, mostrar el contenido
  if (hasRequiredPermissions) {
    return <>{children}</>;
  }

  // Si no tiene permisos, mostrar fallback o mensaje de error
  if (fallback) {
    return <>{fallback}</>;
  }

  if (showErrorMessage) {
    return (
      <div className="permission-error">
        <span className="error-text">{noPermissionMessage}</span>
      </div>
    );
  }

  // Por defecto, no mostrar nada
  return null;
};

// Componente especializado para proteger botones de acción
interface ProtectedButtonProps extends ProtectedComponentProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  children: ReactNode;
}

export const ProtectedButton: React.FC<ProtectedButtonProps> = ({
  onClick,
  disabled = false,
  className = '',
  type = 'button',
  children,
  ...protectedProps
}) => {
  return (
    <ProtectedComponent {...protectedProps}>
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={className}
      >
        {children}
      </button>
    </ProtectedComponent>
  );
};

// Componente especializado para proteger enlaces de navegación
interface ProtectedLinkProps extends ProtectedComponentProps {
  to: string;
  className?: string;
  children: ReactNode;
}

export const ProtectedLink: React.FC<ProtectedLinkProps> = ({
  to,
  className = '',
  children,
  ...protectedProps
}) => {
  return (
    <ProtectedComponent {...protectedProps}>
      <a href={to} className={className}>
        {children}
      </a>
    </ProtectedComponent>
  );
};

export default ProtectedComponent;