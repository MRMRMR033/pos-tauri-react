// src/pages/Categorias.tsx
import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import './Categorias.css';
import { getCategorias, createCategoria, updateCategoria, deleteCategoria, type Categoria } from '../api/products';
import { createCategoria as createCategoriaApi, updateCategoria as updateCategoriaApi, deleteCategoria as deleteCategoriaApi } from '../api/categories';

const Categorias: React.FC = () => {
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
      const data = await getCategorias();
      setCategorias(data);
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
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingId) {
        await updateCategoriaApi(editingId, form);
        setSuccess('Categoría actualizada exitosamente');
        setEditingId(null);
      } else {
        await createCategoriaApi(form);
        setSuccess('Categoría creada exitosamente');
      }
      
      setForm({ nombre: '' });
      await loadCategorias();
    } catch (err: any) {
      setError(err.message || 'Error al procesar la categoría');
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
      await deleteCategoriaApi(id);
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
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Procesando...' : editingId ? 'Actualizar' : 'Crear'}
          </button>
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
                <button 
                  className="edit-btn" 
                  onClick={() => handleEdit(categoria)}
                >
                  Editar
                </button>
                <button 
                  className="delete-btn" 
                  onClick={() => handleDelete(categoria.id)}
                >
                  Eliminar
                </button>
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