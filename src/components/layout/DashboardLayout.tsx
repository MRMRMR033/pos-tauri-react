// src/components/layout/DashboardLayout.tsx - Con navegación condicional
import React, { ReactNode, useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { ProtectedComponent } from '../auth/ProtectedComponent';
import { ALL_PERMISSIONS } from '../../types/permissions';
import { usePermissions } from '../../hooks/usePermissions';
import './DashboardLayout.css';
import '../auth/ProtectedComponent.css';

interface Props {
  children?: ReactNode;
}

const DashboardLayout: React.FC<Props> = ({ children }) => {
  const { signOut, user } = useContext(AuthContext);
  const { isAdmin } = usePermissions();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const confirmLogout = confirm('¿Estás seguro de que quieres cerrar sesión?');
    if (confirmLogout) {
      try {
        await signOut();
        navigate('/login');
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión');
      }
    }
  };

  return (
    <div className="dl-root">
      <header className="dl-header">
        <div className="dl-header__brand">
          My POS {user && <span className="dl-user-info">- {user.fullName}</span>}
        </div>
        <button className="dl-header__logout" onClick={handleLogout}>
          Cerrar Sesión
        </button>
      </header>
      <aside className="dl-sidebar">
        <nav>
          {/* Ventas - Solo si puede crear ventas */}
          <ProtectedComponent permission={ALL_PERMISSIONS.VENTAS_CREAR}>
            <NavLink to="ventas" className="dl-nav__link">Ventas [F1]</NavLink>
          </ProtectedComponent>
          
          {/* Productos - Solo si puede ver productos */}
          <ProtectedComponent permission={ALL_PERMISSIONS.PRODUCTOS_VER}>
            <NavLink to="productos" className="dl-nav__link">Productos [F2]</NavLink>
          </ProtectedComponent>
          
          {/* Inventario - Solo si puede ver stock */}
          <ProtectedComponent permission={ALL_PERMISSIONS.PRODUCTOS_VER_STOCK}>
            <NavLink to="inventario" className="dl-nav__link">Inventario [F4]</NavLink>
          </ProtectedComponent>
          
          {/* Categorías - Solo si puede ver categorías */}
          <ProtectedComponent permission={ALL_PERMISSIONS.CATEGORIAS_VER}>
            <NavLink to="categorias" className="dl-nav__link">Categorías</NavLink>
          </ProtectedComponent>
          
          {/* Proveedores - Solo si puede ver proveedores */}
          <ProtectedComponent permission={ALL_PERMISSIONS.PROVEEDORES_VER}>
            <NavLink to="proveedores" className="dl-nav__link">Proveedores</NavLink>
          </ProtectedComponent>
          
          {/* Sección administrativa - Solo para admins */}
          {isAdmin() && (
            <>
              <hr className="nav-separator" />
              <NavLink to="usuarios" className="dl-nav__link dl-nav__link--admin">
                👥 Usuarios
              </NavLink>
              <NavLink to="reportes" className="dl-nav__link dl-nav__link--admin">
                📈 Reportes
              </NavLink>
              <NavLink to="configuracion" className="dl-nav__link dl-nav__link--admin">
                ⚙️ Configuración
              </NavLink>
            </>
          )}
        </nav>
      </aside>
      <main className="dl-content">
        {/* renderiza <Outlet/> si usas React Router */}
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default DashboardLayout;
