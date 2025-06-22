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
import ReportesSimple from './pages/ReportesSimple';
import Caja from './pages/Caja';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { ProtectedRoute as PermissionProtectedRoute, NoPermissionsPage } from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import './components/auth/ProtectedRoute.css';
import { ALL_PERMISSIONS } from './types/permissions';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleFunctionKeys = (event: KeyboardEvent) => {
      // Solo procesar atajos si no estamos en la página de login
      if (location.pathname === '/login') return;
      
      // Detección más robusta de teclas F (F1-F12)
      const isFunctionKey = /^F([1-9]|1[0-2])$/.test(event.key) || 
                          /^F([1-9]|1[0-2])$/.test(event.code);
      
      // Si es una tecla F, procesar independientemente del foco
      if (isFunctionKey) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        switch (event.key) {
          case 'F1':
            navigate('/ventas');
            break;
          case 'F2':
            navigate('/productos');
            break;
          case 'F4':
            navigate('/inventario');
            break;
          case 'F7':
            // Solo abrir modal de entrada de efectivo si estamos en la página de ventas
            if (location.pathname === '/ventas') {
              window.dispatchEvent(new CustomEvent('openEntradaEfectivoModal'));
            }
            break;
          case 'F8':
            // Solo abrir modal de salida de efectivo si estamos en la página de ventas
            if (location.pathname === '/ventas') {
              window.dispatchEvent(new CustomEvent('openSalidaEfectivoModal'));
            }
            break;
          case 'F12':
            // Solo abrir modal de cobro si estamos en la página de ventas
            if (location.pathname === '/ventas') {
              // Disparar evento personalizado para que Venta.tsx abra el modal
              window.dispatchEvent(new CustomEvent('openCobroModal'));
            }
            break;
        }
      }
    };

    const handleGeneralKeys = (event: KeyboardEvent) => {
      // Solo procesar atajos si no estamos en la página de login
      if (location.pathname === '/login') return;
      
      const activeElement = document.activeElement;
      const isFunctionKey = /^F([1-9]|1[0-2])$/.test(event.key) || 
                          /^F([1-9]|1[0-2])$/.test(event.code);
      
      // Para teclas normales (no F), respetar el foco en inputs
      if (!isFunctionKey && (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA')) {
        return;
      }
    };

    // Usar múltiples listeners para máxima compatibilidad
    // Capture phase para interceptar ANTES que cualquier otro handler
    document.addEventListener('keydown', handleFunctionKeys, { capture: true });
    window.addEventListener('keydown', handleFunctionKeys, { capture: true });
    
    // Listener adicional para teclas normales
    document.addEventListener('keydown', handleGeneralKeys, { capture: false });

    // Cleanup: remover los event listeners cuando se desmonte el componente
    return () => {
      document.removeEventListener('keydown', handleFunctionKeys, { capture: true });
      window.removeEventListener('keydown', handleFunctionKeys, { capture: true });
      document.removeEventListener('keydown', handleGeneralKeys, { capture: false });
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
        
        {/* Página de Reportes - Solo para administradores */}
        <Route path="reportes" element={
          <PermissionProtectedRoute 
            requireAdmin={true}
            redirectTo="/no-permisos"
          >
            <ReportesSimple />
          </PermissionProtectedRoute>
        } />
        
        {/* Página de Caja - requiere permisos de caja */}
        <Route path="caja" element={
          <PermissionProtectedRoute 
            permission={ALL_PERMISSIONS.CAJA_VER}
            redirectTo="/no-permisos"
          >
            <Caja />
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
