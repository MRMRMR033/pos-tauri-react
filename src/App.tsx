// src/App.tsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Venta from './pages/Venta'
import Productos from './pages/Productos'
import Inventario from './pages/Inventario'
import ProtectedRoute from './components/layout/ProtectedRoute'

const App: React.FC = () => {
  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/login" element={<Login />} />

      {/* Redirigir raíz a /login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Rutas protegidas */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Routes>
              <Route path="ventas" element={<Venta />} />
              <Route path="productos" element={<Productos />} />
              <Route path="inventario" element={<Inventario />} />
              <Route index element={<Navigate to="ventas" replace />} />
            </Routes>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
