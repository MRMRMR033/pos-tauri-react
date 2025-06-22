// src/pages/Usuarios.tsx - Gestión completa de usuarios con API real
import React, { useState, useEffect } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../contexts/ToastContext';
import { ALL_PERMISSIONS, PERMISSIONS_BY_MODULE } from '../types/permissions';
import { 
  getUserPermissions,
  grantPermission, 
  revokePermission,
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario
} from '../api/auth';
import { 
  type Usuario,
  type CreateUsuarioRequest,
  type UpdateUsuarioRequest,
  Rol 
} from '../types/api';
import '../components/auth/ProtectedComponent.css';
import './Usuarios.css';

interface UserWithPermissions extends Usuario {
  permissions: string[];
}

interface UsuarioFormData {
  email: string;
  fullName: string;
  password: string;
  confirmPassword: string;
  rol: Rol;
}

const Usuarios: React.FC = () => {
  const { isAdmin, accessToken, user: currentUser } = usePermissions();
  const { showSuccess, showError } = useToast();
  
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithPermissions | null>(null);
  
  // Estado del formulario de creación/edición
  const [formData, setFormData] = useState<UsuarioFormData>({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    rol: Rol.EMPLEADO
  });

  useEffect(() => {
    cargarUsuarios();
  }, [isAdmin, accessToken]);

  const cargarUsuarios = async () => {
    if (!isAdmin() || !accessToken) {
      showError('No tienes permisos para acceder a esta página');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Cargar usuarios desde la API
      const usuariosResponse = await getUsuarios();
      const usuariosData = usuariosResponse.data;
      
      // Cargar usuarios con sus permisos reales desde la API
      const usersWithPermissions = await Promise.all(
        usuariosData.map(async (user) => {
          try {
            let permissions: string[] = [];
            if (user.rol === Rol.ADMIN) {
              // Los administradores tienen todos los permisos
              permissions = Object.values(ALL_PERMISSIONS);
            } else {
              // Para empleados, cargar permisos reales desde la API
              try {
                const userPermissionsResponse = await getUserPermissions(user.id);
                const userPermissionsData = userPermissionsResponse.data;
                permissions = userPermissionsData.map(p => p.key);
              } catch (permErr) {
                console.error(`Error loading permissions for user ${user.id}:`, permErr);
                // Si hay error cargando permisos, usar array vacío
                permissions = [];
              }
            }
            return { ...user, permissions };
          } catch (err) {
            console.error(`Error loading permissions for user ${user.id}:`, err);
            return { ...user, permissions: [] };
          }
        })
      );

      setUsers(usersWithPermissions);
    } catch (err: any) {
      console.error('Error cargando usuarios:', err);
      showError(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  // Funciones de formulario
  const resetForm = () => {
    setFormData({
      email: '',
      fullName: '',
      password: '',
      confirmPassword: '',
      rol: Rol.EMPLEADO
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Crear usuario
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      showError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      const createData: CreateUsuarioRequest = {
        email: formData.email || undefined, // Solo enviar si no está vacío
        password: formData.password,
        fullName: formData.fullName,
        rol: formData.rol
      };

      await createUsuario(createData);
      showSuccess('Usuario creado exitosamente');
      setShowCreateForm(false);
      resetForm();
      cargarUsuarios();
    } catch (err: any) {
      console.error('Error creando usuario:', err);
      showError(err.message || 'Error al crear usuario');
    }
  };

  // Editar usuario
  const handleEditUser = (user: UserWithPermissions) => {
    setEditingUser(user);
    setFormData({
      email: user.email || '',
      fullName: user.fullName,
      password: '',
      confirmPassword: '',
      rol: user.rol
    });
    setShowEditForm(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser) return;

    if (formData.password && formData.password !== formData.confirmPassword) {
      showError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      const updateData: UpdateUsuarioRequest = {
        email: formData.email || undefined,
        fullName: formData.fullName,
        rol: formData.rol
      };

      // Solo incluir contraseña si se proporcionó una nueva
      if (formData.password) {
        updateData.password = formData.password;
      }

      await updateUsuario(editingUser.id, updateData);
      showSuccess('Usuario actualizado exitosamente');
      setShowEditForm(false);
      setEditingUser(null);
      resetForm();
      cargarUsuarios();
    } catch (err: any) {
      console.error('Error actualizando usuario:', err);
      showError(err.message || 'Error al actualizar usuario');
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (user: UserWithPermissions) => {
    // Prevenir eliminar al usuario actual
    if (currentUser && user.id === currentUser.id) {
      showError('No puedes eliminar tu propia cuenta');
      return;
    }

    const confirmDelete = confirm(`¿Estás seguro de que quieres eliminar al usuario "${user.fullName}"?`);
    if (!confirmDelete) return;

    try {
      await deleteUsuario(user.id);
      showSuccess('Usuario eliminado exitosamente');
      
      // Si el usuario eliminado era el seleccionado, limpiar selección
      if (selectedUser && selectedUser.id === user.id) {
        setSelectedUser(null);
      }
      
      cargarUsuarios();
    } catch (err: any) {
      console.error('Error eliminando usuario:', err);
      showError(err.message || 'Error al eliminar usuario');
    }
  };

  const handleGrantPermission = async (userId: number, permission: string) => {
    if (!accessToken) return;

    try {
      await grantPermission({ userId: userId, permissionKey: permission });
      
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
      
      // Si es el usuario actual, refrescar la página para actualizar permisos
      if (currentUser && currentUser.id === userId) {
        window.location.reload();
      }
      
      showSuccess(`Permiso "${permission}" otorgado exitosamente`);
    } catch (err: any) {
      showError(err.message || 'Error al otorgar permiso');
    }
  };

  const handleRevokePermission = async (userId: number, permission: string) => {
    if (!accessToken) return;

    try {
      await revokePermission({ userId: userId, permissionKey: permission });
      
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
      
      // Si es el usuario actual, refrescar la página para actualizar permisos
      if (currentUser && currentUser.id === userId) {
        window.location.reload();
      }
      
      showSuccess(`Permiso "${permission}" revocado exitosamente`);
    } catch (err: any) {
      showError(err.message || 'Error al revocar permiso');
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
      <div className="usuarios-header">
        <h1 className="usuarios-title">Gestión de Usuarios y Permisos</h1>
        <button 
          className="btn-create-user"
          onClick={() => setShowCreateForm(true)}
        >
          + Crear Usuario
        </button>
      </div>
      
      <div className="usuarios-content">
        {/* Lista de usuarios */}
        <div className="usuarios-list">
          <h2>Usuarios del Sistema ({users.length})</h2>
          <div className="users-grid">
            {users.map(user => (
              <div 
                key={user.id} 
                className={`user-card ${selectedUser?.id === user.id ? 'selected' : ''}`}
                onClick={() => setSelectedUser(user)}
              >
                <div className="user-info">
                  <h3>{user.fullName}</h3>
                  <p className="user-email">{user.email || 'Sin email'}</p>
                  <div className="user-badges">
                    <span className={`user-role ${user.rol}`}>
                      {user.rol === Rol.ADMIN ? 'ADMIN' : 'EMPLEADO'}
                    </span>
                  </div>
                </div>
                <div className="user-stats">
                  <span className="permission-count">
                    {user.permissions.length} permisos
                  </span>
                  <div className="user-actions">
                    <button 
                      className="btn-edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditUser(user);
                      }}
                      title="Editar usuario"
                    >
                      ✏️
                    </button>
                    {currentUser?.id !== user.id && (
                      <button 
                        className="btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteUser(user);
                        }}
                        title="Eliminar usuario"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
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
              Rol: <span className={`role-badge ${selectedUser.rol}`}>
                {selectedUser.rol === Rol.ADMIN ? 'ADMIN' : 'EMPLEADO'}
              </span>
              {selectedUser.rol === Rol.ADMIN && (
                <span className="admin-note">
                  Los administradores tienen todos los permisos automáticamente
                </span>
              )}
            </p>

            {selectedUser.rol !== Rol.ADMIN && (
              <div className="permissions-modules">
                {Object.entries(PERMISSIONS_BY_MODULE).map(([module, modulePermissions]) => (
                  <div key={module} className="permission-module">
                    <h3 className="module-title">
                      {module.charAt(0).toUpperCase() + module.slice(1)}
                    </h3>
                    <div className="permissions-grid">
                      {modulePermissions.permissions.map(permission => {
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

            {selectedUser.rol === Rol.ADMIN && (
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

      {/* Modal de crear usuario */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Crear Nuevo Usuario</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCreateForm(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="user-form">
              <div className="form-group">
                <label htmlFor="fullName">Nombre Completo *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email (opcional)</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="usuario@email.com"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Contraseña *</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleFormChange}
                    required
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirmar Contraseña *</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleFormChange}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="rol">Rol *</label>
                <select
                  id="rol"
                  name="rol"
                  value={formData.rol}
                  onChange={handleFormChange}
                  required
                >
                  <option value={Rol.EMPLEADO}>Empleado</option>
                  <option value={Rol.ADMIN}>Administrador</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de editar usuario */}
      {showEditForm && editingUser && (
        <div className="modal-overlay" onClick={() => setShowEditForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Usuario: {editingUser.fullName}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowEditForm(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="user-form">
              <div className="form-group">
                <label htmlFor="edit-fullName">Nombre Completo *</label>
                <input
                  type="text"
                  id="edit-fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-email">Email (opcional)</label>
                <input
                  type="email"
                  id="edit-email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="usuario@email.com"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-password">Nueva Contraseña (opcional)</label>
                  <input
                    type="password"
                    id="edit-password"
                    name="password"
                    value={formData.password}
                    onChange={handleFormChange}
                    minLength={6}
                    placeholder="Dejar vacío para mantener la actual"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-confirmPassword">Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    id="edit-confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleFormChange}
                    minLength={6}
                    placeholder="Solo si cambias la contraseña"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit-rol">Rol *</label>
                <select
                  id="edit-rol"
                  name="rol"
                  value={formData.rol}
                  onChange={handleFormChange}
                  required
                  disabled={editingUser.id === currentUser?.id}
                >
                  <option value={Rol.EMPLEADO}>Empleado</option>
                  <option value={Rol.ADMIN}>Administrador</option>
                </select>
                {editingUser.id === currentUser?.id && (
                  <small>No puedes cambiar tu propio rol</small>
                )}
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowEditForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Actualizar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;