// src/components/layout/ProtectedRoute.tsx
import React, { useContext, ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../../contexts/AuthContext'

interface Props { children: ReactNode }

const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const { user } = useContext(AuthContext)
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

export default ProtectedRoute
