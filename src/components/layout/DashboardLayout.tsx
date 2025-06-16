// src/components/layout/DashboardLayout.tsx
import React, { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './DashboardLayout.css';

interface Props {
  children?: ReactNode;
}

const DashboardLayout: React.FC<Props> = ({ children }) => {
  return (
    <div className="dl-root">
      <header className="dl-header">
        <div className="dl-header__brand">My POS</div>
        <button className="dl-header__logout">Cerrar Sesión</button>
      </header>
      <aside className="dl-sidebar">
        <nav>
          <NavLink to="ventas" className="dl-nav__link">Ventas [F1]</NavLink>
          <NavLink to="productos" className="dl-nav__link">Productos [F2]</NavLink>
          <NavLink to="inventario" className="dl-nav__link">Inventario [F4]</NavLink>
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
