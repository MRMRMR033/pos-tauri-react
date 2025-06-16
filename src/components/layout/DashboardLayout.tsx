// src/components/layout/DashboardLayout.tsx
import React, { ReactNode, useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import './DashboardLayout.css';

interface Props {
  children?: ReactNode;
}

const DashboardLayout: React.FC<Props> = ({ children }) => {
  const { signOut, user } = useContext(AuthContext);
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
          <NavLink to="ventas" className="dl-nav__link">Ventas [F1]</NavLink>
          <NavLink to="productos" className="dl-nav__link">Productos [F2]</NavLink>
          <NavLink to="inventario" className="dl-nav__link">Inventario [F4]</NavLink>
          <NavLink to="categorias" className="dl-nav__link">Categorías</NavLink>
          <NavLink to="proveedores" className="dl-nav__link">Proveedores</NavLink>
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
