// src/App.tsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Venta from './pages/Venta';
import Productos from './pages/Productos';
import Inventario from './pages/Inventario';
import ProtectedRoute from './components/layout/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

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
    <Routes>
      {/* Ruta pública */}
      <Route path="/login" element={<Login />} />

      {/* Redirigir la raíz a /login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Rutas protegidas, envueltas en DashboardLayout */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="ventas" element={<Venta />} />
        <Route path="productos" element={<Productos />} />
        <Route path="inventario" element={<Inventario />} />
        {/* Cuando entres a /, redirige automáticamente a /ventas */}
        <Route index element={<Navigate to="ventas" replace />} />
      </Route>
    </Routes>
  );
};

export default App;
