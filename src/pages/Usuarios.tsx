// src/pages/Usuarios.tsx - Gestión de usuarios y permisos (Solo admins)
import React, { useState, useEffect } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { ALL_PERMISSIONS, PERMISSIONS_BY_MODULE, DEFAULT_EMPLOYEE_PERMISSIONS } from '../types/permissions';
import { getAllPermissions, grantPermission, revokePermission } from '../api/auth';
import '../components/auth/ProtectedComponent.css';
import './Usuarios.css';

interface User {
  id: number;
  email: string;
  fullName: string;
  rol: string;
  createdAt: string;
}

interface UserWithPermissions extends User {
  permissions: string[];
}

const Usuarios: React.FC = () => {
  const { isAdmin, accessToken } = usePermissions();
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Datos simulados para demo (en producción vendrían de la API)
  const mockUsers: User[] = [
    {
      id: 1,
      email: 'admin@pos.com',
      fullName: 'Administrador Principal',
      rol: 'ADMIN',
      createdAt: '2024-01-01'
    },
    {
      id: 2,
      email: 'empleado1@pos.com',
      fullName: 'Juan Pérez',
      rol: 'EMPLEADO',
      createdAt: '2024-01-15'
    },
    {
      id: 3,
      email: 'empleado2@pos.com',
      fullName: 'María García',
      rol: 'EMPLEADO',
      createdAt: '2024-02-01'
    }
  ];

  useEffect(() => {
    const loadData = async () => {
      if (!isAdmin() || !accessToken) {
        setError('No tienes permisos para acceder a esta página');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Cargar usuarios con sus permisos
        const usersWithPermissions = await Promise.all(
          mockUsers.map(async (user) => {
            try {
              let permissions: string[] = [];
              if (user.rol === 'ADMIN') {
                permissions = Object.values(ALL_PERMISSIONS);
              } else {
                // En producción, esto vendría de getUserPermissions(user.id, accessToken)
                permissions = DEFAULT_EMPLOYEE_PERMISSIONS;
              }
              return { ...user, permissions };
            } catch (err) {
              console.error(`Error loading permissions for user ${user.id}:`, err);
              return { ...user, permissions: [] };
            }
          })
        );

        setUsers(usersWithPermissions);

        // Cargar permisos disponibles
        try {
          await getAllPermissions(accessToken);
        } catch (err) {
          console.error('Error cargando permisos:', err);
        }
      } catch (err: any) {
        setError(err.message || 'Error al cargar usuarios');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAdmin, accessToken]);

  const handleGrantPermission = async (userId: number, permission: string) => {
    if (!accessToken) return;

    try {
      await grantPermission(userId, permission, accessToken);
      
      // Actualizar estado local
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, permissions: [...user.permissions, permission] }
          : user
      ));
      
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({
          ...selectedUser,
          permissions: [...selectedUser.permissions, permission]
        });
      }
      
      setSuccess(`Permiso "${permission}" otorgado exitosamente`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al otorgar permiso');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRevokePermission = async (userId: number, permission: string) => {
    if (!accessToken) return;

    try {
      await revokePermission(userId, permission, accessToken);
      
      // Actualizar estado local
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, permissions: user.permissions.filter(p => p !== permission) }
          : user
      ));
      
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({
          ...selectedUser,
          permissions: selectedUser.permissions.filter(p => p !== permission)
        });
      }
      
      setSuccess(`Permiso "${permission}" revocado exitosamente`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al revocar permiso');
      setTimeout(() => setError(null), 3000);
    }
  };


  if (!isAdmin()) {
    return (
      <div className="permission-error">
        <span className="error-text">Solo los administradores pueden acceder a esta página</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="usuarios-page loading">
        <div className="loading-spinner"></div>
        <p>Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="usuarios-page">
      <h1 className="usuarios-title">Gestión de Usuarios y Permisos</h1>
      
      {error && <div className="message message-error">{error}</div>}
      {success && <div className="message message-success">{success}</div>}
      
      <div className="usuarios-content">
        {/* Lista de usuarios */}
        <div className="usuarios-list">
          <h2>Usuarios del Sistema</h2>
          <div className="users-grid">
            {users.map(user => (
              <div 
                key={user.id} 
                className={`user-card ${selectedUser?.id === user.id ? 'selected' : ''}`}
                onClick={() => setSelectedUser(user)}
              >
                <div className="user-info">
                  <h3>{user.fullName}</h3>
                  <p className="user-email">{user.email}</p>
                  <span className={`user-role ${user.rol.toLowerCase()}`}>
                    {user.rol}
                  </span>
                </div>
                <div className="user-stats">
                  <span className="permission-count">
                    {user.permissions.length} permisos
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel de permisos */}
        {selectedUser && (
          <div className="permissions-panel">
            <h2>Permisos de {selectedUser.fullName}</h2>
            <p className="user-role-info">
              Rol: <span className={`role-badge ${selectedUser.rol.toLowerCase()}`}>
                {selectedUser.rol}
              </span>
              {selectedUser.rol === 'ADMIN' && (
                <span className="admin-note">
                  Los administradores tienen todos los permisos automáticamente
                </span>
              )}
            </p>

            {selectedUser.rol !== 'ADMIN' && (
              <div className="permissions-modules">
                {Object.entries(PERMISSIONS_BY_MODULE).map(([module, modulePermissions]) => (
                  <div key={module} className="permission-module">
                    <h3 className="module-title">
                      {module.charAt(0).toUpperCase() + module.slice(1)}
                    </h3>
                    <div className="permissions-grid">
                      {modulePermissions.map(permission => {
                        const hasPermission = selectedUser.permissions.includes(permission);
                        return (
                          <div key={permission} className={`permission-item ${hasPermission ? 'granted' : 'denied'}`}>
                            <div className="permission-info">
                              <span className="permission-name">
                                {permission.split(':')[1].replace(/_/g, ' ')}
                              </span>
                              <span className="permission-code">{permission}</span>
                            </div>
                            <button
                              className={`permission-toggle ${hasPermission ? 'revoke' : 'grant'}`}
                              onClick={() => 
                                hasPermission 
                                  ? handleRevokePermission(selectedUser.id, permission)
                                  : handleGrantPermission(selectedUser.id, permission)
                              }
                            >
                              {hasPermission ? '✓ Revocar' : '+ Otorgar'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedUser.rol === 'ADMIN' && (
              <div className="admin-permissions-info">
                <p>Como administrador, este usuario tiene acceso completo a todas las funcionalidades del sistema.</p>
                <div className="admin-permissions-list">
                  <h4>Permisos incluidos:</h4>
                  <ul>
                    <li>Gestión completa de productos y precios</li>
                    <li>Acceso a todos los reportes financieros</li>
                    <li>Gestión de usuarios y permisos</li>
                    <li>Configuración del sistema</li>
                    <li>Todas las operaciones de venta y caja</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Usuarios;