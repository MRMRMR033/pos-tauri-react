// src/pages/Proveedores.tsx - Con sistema de permisos
import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import './Proveedores.css';
import { getProveedores, createProveedor, updateProveedor, deleteProveedor, type Proveedor, type CreateProveedorRequest } from '../api/suppliers';
import { ProtectedButton } from '../components/auth/ProtectedComponent';
import { usePermissions } from '../hooks/usePermissions';
import { ALL_PERMISSIONS } from '../types/permissions';
import '../components/auth/ProtectedComponent.css';

const Proveedores: React.FC = () => {
  const { hasPermission, accessToken } = usePermissions();
  
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [form, setForm] = useState<CreateProveedorRequest>({ 
    nombre: '', 
    contacto: '' 
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadProveedores();
  }, []);

  const loadProveedores = async () => {
    try {
      const response = await getProveedores();
      setProveedores(response.data);
    } catch (err: any) {
      setError('Error al cargar proveedores');
      console.error('Error loading proveedores:', err);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Verificar permisos
    const requiredPermission = editingId ? ALL_PERMISSIONS.PROVEEDORES_EDITAR : ALL_PERMISSIONS.PROVEEDORES_CREAR;
    if (!hasPermission(requiredPermission)) {
      setError(`No tienes permisos para ${editingId ? 'editar' : 'crear'} proveedores`);
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = {
        nombre: form.nombre,
        contacto: form.contacto || undefined
      };

      if (editingId) {
        await updateProveedor(editingId, formData);
        setSuccess('Proveedor actualizado exitosamente');
        setEditingId(null);
      } else {
        await createProveedor(formData);
        setSuccess('Proveedor creado exitosamente');
      }
      
      setForm({ nombre: '', contacto: '' });
      await loadProveedores();
    } catch (err: any) {
      if (err.message?.includes('permiso') || err.message?.includes('autorizado')) {
        setError('No tienes permisos suficientes para realizar esta acción');
      } else {
        setError(err.message || 'Error al procesar el proveedor');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (proveedor: Proveedor) => {
    setForm({ 
      nombre: proveedor.nombre, 
      contacto: proveedor.contacto || '' 
    });
    setEditingId(proveedor.id);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (id: number) => {
    // Verificar permisos
    if (!hasPermission(ALL_PERMISSIONS.PROVEEDORES_ELIMINAR)) {
      setError('No tienes permisos para eliminar proveedores');
      return;
    }
    
    if (!confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
      return;
    }

    try {
      await deleteProveedor(id);
      setSuccess('Proveedor eliminado exitosamente');
      await loadProveedores();
    } catch (err: any) {
      if (err.message?.includes('permiso') || err.message?.includes('autorizado')) {
        setError('No tienes permisos suficientes para realizar esta acción');
      } else {
        setError(err.message || 'Error al eliminar el proveedor');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ nombre: '', contacto: '' });
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="proveedores-page">
      <h1 className="proveedores-title">Gestión de Proveedores</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form className="proveedores-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nombre">Nombre del Proveedor</label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            value={form.nombre}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="contacto">Contacto (Opcional)</label>
          <input
            id="contacto"
            name="contacto"
            type="text"
            value={form.contacto}
            onChange={handleChange}
            placeholder="Teléfono, email, etc."
          />
        </div>
        
        <div className="form-actions">
          {/* Botón de crear/editar - Con protección de permisos */}
          <ProtectedButton
            permission={editingId ? ALL_PERMISSIONS.PROVEEDORES_EDITAR : ALL_PERMISSIONS.PROVEEDORES_CREAR}
            type="submit"
            className="submit-btn"
            disabled={loading}
            fallback={
              <div className="permission-error">
                <span className="error-text">
                  No tienes permisos para {editingId ? 'editar' : 'crear'} proveedores
                </span>
              </div>
            }
          >
            {loading ? 'Procesando...' : editingId ? 'Actualizar' : 'Crear'}
          </ProtectedButton>
          
          {editingId && (
            <button type="button" className="cancel-btn" onClick={handleCancelEdit}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="proveedores-list">
        <h2>Proveedores Existentes</h2>
        <div className="proveedores-grid">
          {proveedores.map((proveedor) => (
            <div key={proveedor.id} className="proveedor-card">
              <h3>{proveedor.nombre}</h3>
              {proveedor.contacto && (
                <p className="proveedor-contacto">{proveedor.contacto}</p>
              )}
              <div className="proveedor-actions">
                {/* Botón de editar - Solo con permisos */}
                <ProtectedButton
                  permission={ALL_PERMISSIONS.PROVEEDORES_EDITAR}
                  className="edit-btn"
                  onClick={() => handleEdit(proveedor)}
                >
                  Editar
                </ProtectedButton>
                
                {/* Botón de eliminar - Solo con permisos */}
                <ProtectedButton
                  permission={ALL_PERMISSIONS.PROVEEDORES_ELIMINAR}
                  className="delete-btn"
                  onClick={() => handleDelete(proveedor.id)}
                >
                  Eliminar
                </ProtectedButton>
              </div>
            </div>
          ))}
        </div>
        
        {proveedores.length === 0 && (
          <p className="no-data">No hay proveedores registrados</p>
        )}
      </div>
    </div>
  );
};

export default Proveedores;