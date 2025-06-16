// src/App.tsx - Con sistema de permisos
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Venta from './pages/Venta';
import ProductosModerno from './pages/ProductosModerno';
import Inventario from './pages/Inventario';
import Categorias from './pages/Categorias';
import Proveedores from './pages/Proveedores';
import Usuarios from './pages/Usuarios';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { ProtectedRoute as PermissionProtectedRoute, NoPermissionsPage } from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import './components/auth/ProtectedRoute.css';
import { ALL_PERMISSIONS } from './types/permissions';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Solo procesar atajos si no estamos en la página de login
      if (location.pathname === '/login') return;
      
      // Solo procesar si no hay un input o textarea enfocado
      const activeElement = document.activeElement;
      if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.key) {
        case 'F1':
          event.preventDefault();
          navigate('/ventas');
          break;
        case 'F2':
          event.preventDefault();
          navigate('/productos');
          break;
        case 'F4':
          event.preventDefault();
          navigate('/inventario');
          break;
        case 'F12':
          event.preventDefault();
          // Solo abrir modal de cobro si estamos en la página de ventas
          if (location.pathname === '/ventas') {
            // Disparar evento personalizado para que Venta.tsx abra el modal
            window.dispatchEvent(new CustomEvent('openCobroModal'));
          }
          break;
      }
    };

    // Agregar el event listener globalmente
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup: remover el event listener cuando se desmonte el componente
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, location.pathname]);

  return (
    <>
      <Routes>
      {/* Ruta pública */}
      <Route path="/login" element={<Login />} />

      {/* Redirigir la raíz a /login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Ruta para mostrar "Sin permisos" */}
      <Route path="/no-permisos" element={<NoPermissionsPage />} />

      {/* Rutas protegidas, envueltas en DashboardLayout */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Página de Ventas - requiere permiso para crear ventas */}
        <Route path="ventas" element={
          <PermissionProtectedRoute 
            permission={ALL_PERMISSIONS.VENTAS_CREAR}
            redirectTo="/no-permisos"
          >
            <Venta />
          </PermissionProtectedRoute>
        } />
        
        {/* Página de Productos - requiere ver productos */}
        <Route path="productos" element={
          <PermissionProtectedRoute 
            permission={ALL_PERMISSIONS.PRODUCTOS_VER}
            redirectTo="/no-permisos"
          >
            <ProductosModerno />
          </PermissionProtectedRoute>
        } />
        
        {/* Página de Inventario - requiere ver stock */}
        <Route path="inventario" element={
          <PermissionProtectedRoute 
            permission={ALL_PERMISSIONS.PRODUCTOS_VER_STOCK}
            redirectTo="/no-permisos"
          >
            <Inventario />
          </PermissionProtectedRoute>
        } />
        
        {/* Página de Categorías - requiere ver categorías */}
        <Route path="categorias" element={
          <PermissionProtectedRoute 
            permission={ALL_PERMISSIONS.CATEGORIAS_VER}
            redirectTo="/no-permisos"
          >
            <Categorias />
          </PermissionProtectedRoute>
        } />
        
        {/* Página de Proveedores - requiere ver proveedores */}
        <Route path="proveedores" element={
          <PermissionProtectedRoute 
            permission={ALL_PERMISSIONS.PROVEEDORES_VER}
            redirectTo="/no-permisos"
          >
            <Proveedores />
          </PermissionProtectedRoute>
        } />
        
        {/* Página de Usuarios - Solo para administradores */}
        <Route path="usuarios" element={
          <PermissionProtectedRoute 
            requireAdmin={true}
            redirectTo="/no-permisos"
          >
            <Usuarios />
          </PermissionProtectedRoute>
        } />
        
        {/* Cuando entres a /, redirige automáticamente a /ventas */}
        <Route index element={<Navigate to="ventas" replace />} />
      </Route>
    </Routes>
    </>
  );
};

export default App;
