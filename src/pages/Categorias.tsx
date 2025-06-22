// src/pages/Categorias.tsx - Con sistema de permisos
import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import './Categorias.css';
import { getCategorias, createCategoria, updateCategoria, deleteCategoria, type Categoria } from '../api/categories';
import { ProtectedButton } from '../components/auth/ProtectedComponent';
import { usePermissions } from '../hooks/usePermissions';
import { ALL_PERMISSIONS } from '../types/permissions';
import '../components/auth/ProtectedComponent.css';

const Categorias: React.FC = () => {
  const { hasPermission } = usePermissions();
  
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [form, setForm] = useState({ nombre: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      const response = await getCategorias();
      setCategorias(response.data);
    } catch (err: any) {
      setError('Error al cargar categorías');
      console.error('Error loading categorias:', err);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Verificar permisos
    const requiredPermission = editingId ? ALL_PERMISSIONS.CATEGORIAS_EDITAR : ALL_PERMISSIONS.CATEGORIAS_CREAR;
    if (!hasPermission(requiredPermission)) {
      setError(`No tienes permisos para ${editingId ? 'editar' : 'crear'} categorías`);
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingId) {
        await updateCategoria(editingId, form);
        setSuccess('Categoría actualizada exitosamente');
        setEditingId(null);
      } else {
        await createCategoria(form);
        setSuccess('Categoría creada exitosamente');
      }
      
      setForm({ nombre: '' });
      await loadCategorias();
    } catch (err: any) {
      if (err.message?.includes('permiso') || err.message?.includes('autorizado')) {
        setError('No tienes permisos suficientes para realizar esta acción');
      } else {
        setError(err.message || 'Error al procesar la categoría');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (categoria: Categoria) => {
    setForm({ nombre: categoria.nombre });
    setEditingId(categoria.id);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      return;
    }

    try {
      await deleteCategoria(id);
      setSuccess('Categoría eliminada exitosamente');
      await loadCategorias();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la categoría');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ nombre: '' });
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="categorias-page">
      <h1 className="categorias-title">Gestión de Categorías</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form className="categorias-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nombre">Nombre de la Categoría</label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            value={form.nombre}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-actions">
          {/* Botón de crear/editar - Con protección de permisos */}
          <ProtectedButton
            permission={editingId ? ALL_PERMISSIONS.CATEGORIAS_EDITAR : ALL_PERMISSIONS.CATEGORIAS_CREAR}
            type="submit"
            className="submit-btn"
            disabled={loading}
            fallback={
              <div className="permission-error">
                <span className="error-text">
                  No tienes permisos para {editingId ? 'editar' : 'crear'} categorías
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

      <div className="categorias-list">
        <h2>Categorías Existentes</h2>
        <div className="categorias-grid">
          {categorias.map((categoria) => (
            <div key={categoria.id} className="categoria-card">
              <h3>{categoria.nombre}</h3>
              <div className="categoria-actions">
                {/* Botón de editar - Solo con permisos */}
                <ProtectedButton
                  permission={ALL_PERMISSIONS.CATEGORIAS_EDITAR}
                  className="edit-btn"
                  onClick={() => handleEdit(categoria)}
                >
                  Editar
                </ProtectedButton>
                
                {/* Botón de eliminar - Solo con permisos */}
                <ProtectedButton
                  permission={ALL_PERMISSIONS.CATEGORIAS_ELIMINAR}
                  className="delete-btn"
                  onClick={() => handleDelete(categoria.id)}
                >
                  Eliminar
                </ProtectedButton>
              </div>
            </div>
          ))}
        </div>
        
        {categorias.length === 0 && (
          <p className="no-data">No hay categorías registradas</p>
        )}
      </div>
    </div>
  );
};

export default Categorias;