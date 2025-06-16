// src/pages/Productos.tsx - Con sistema de permisos y CRUD completo
import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import './Productos.css';
import { createProducto, getProductos, getCategorias, getProveedores, updateProducto, deleteProducto, type Producto, type Categoria, type Proveedor, type CreateProductoRequest } from '../api/products';
import { ProtectedComponent, ProtectedButton } from '../components/auth/ProtectedComponent';
import { usePermissions } from '../hooks/usePermissions';
import { ALL_PERMISSIONS } from '../types/permissions';
import '../components/auth/ProtectedComponent.css';

interface ProductoFormFields {
  codigoBarras: string;
  nombre: string;
  descripcion: string;
  precioCosto: string;
  precioVenta: string;
  stock: string;
  stockMinimo: string;
  categoriaId: string;
  proveedorId: string;
}

const Productos: React.FC = () => {
  const { hasPermission, accessToken } = usePermissions();
  
  const [form, setForm] = useState<ProductoFormFields>({
    codigoBarras: '',
    nombre: '',
    descripcion: '',
    precioCosto: '',
    precioVenta: '',
    stock: '',
    stockMinimo: '',
    categoriaId: '',
    proveedorId: '',
  });
  
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const [productosResponse, categoriasData, proveedoresData] = await Promise.all([
        getProductos(undefined, accessToken || undefined),
        getCategorias(accessToken || undefined),
        getProveedores(accessToken || undefined)
      ]);
      setProductos(productosResponse.productos);
      setCategorias(categoriasData);
      setProveedores(proveedoresData);
    } catch (err) {
      setError('Error al cargar datos');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Verificar permisos antes de enviar
    if (editingProduct) {
      if (!hasPermission(ALL_PERMISSIONS.PRODUCTOS_EDITAR)) {
        setError('No tienes permisos para editar productos');
        return;
      }
    } else {
      if (!hasPermission(ALL_PERMISSIONS.PRODUCTOS_CREAR)) {
        setError('No tienes permisos para crear productos');
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Construir datos del producto basado en permisos
      const productData: CreateProductoRequest = {
        codigoBarras: form.codigoBarras || undefined,
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        // Solo incluir precio de costo si tiene permiso
        precioCosto: hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_COSTO) 
          ? parseFloat(form.precioCosto || '0') 
          : 0,
        // Solo incluir precio de venta si tiene permiso
        precioVenta: parseFloat(form.precioVenta || '0'),
        // Solo incluir stock si tiene permiso
        stock: hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER_STOCK) 
          ? parseInt(form.stock || '0') 
          : 0,
        stockMinimo: parseInt(form.stockMinimo || '0'),
        categoriaId: form.categoriaId ? parseInt(form.categoriaId) : undefined,
        proveedorId: form.proveedorId ? parseInt(form.proveedorId) : undefined,
      };

      if (editingProduct) {
        await updateProducto(editingProduct.id, productData, accessToken || undefined);
        setSuccess('Producto actualizado exitosamente');
        setEditingProduct(null);
      } else {
        await createProducto(productData, accessToken || undefined);
        setSuccess('Producto creado exitosamente');
      }
      
      // Limpiar formulario
      setForm({
        codigoBarras: '',
        nombre: '',
        descripcion: '',
        precioCosto: '',
        precioVenta: '',
        stock: '',
        stockMinimo: '',
        categoriaId: '',
        proveedorId: '',
      });
      setShowForm(false);
      
      // Recargar productos
      await loadData();
    } catch (err: any) {
      if (err.message?.includes('permiso') || err.message?.includes('autorizado')) {
        setError('No tienes permisos suficientes para realizar esta acción');
      } else {
        setError(err.message || 'Error al procesar el producto');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (producto: Producto) => {
    setEditingProduct(producto);
    setForm({
      codigoBarras: producto.codigoBarras || '',
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precioCosto: producto.precioCosto.toString(),
      precioVenta: producto.precioVenta.toString(),
      stock: producto.stock.toString(),
      stockMinimo: producto.stockMinimo?.toString() || '0',
      categoriaId: producto.categoriaId?.toString() || '',
      proveedorId: producto.proveedorId?.toString() || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!hasPermission(ALL_PERMISSIONS.PRODUCTOS_ELIMINAR)) {
      setError('No tienes permisos para eliminar productos');
      return;
    }

    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteProducto(id, accessToken || undefined);
      setSuccess('Producto eliminado exitosamente');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setForm({
      codigoBarras: '',
      nombre: '',
      descripcion: '',
      precioCosto: '',
      precioVenta: '',
      stock: '',
      stockMinimo: '',
      categoriaId: '',
      proveedorId: '',
    });
    setShowForm(false);
  };

  const getCategoriaName = (categoriaId?: number) => {
    if (!categoriaId) return 'Sin categoría';
    const categoria = categorias.find(c => c.id === categoriaId);
    return categoria?.nombre || 'Sin categoría';
  };

  const getProveedorName = (proveedorId?: number) => {
    if (!proveedorId) return 'Sin proveedor';
    const proveedor = proveedores.find(p => p.id === proveedorId);
    return proveedor?.nombre || 'Sin proveedor';
  };

  return (
    <div className="producto-page">
      <div className="page-header">
        <h1 className="producto-title">
          {showForm ? (editingProduct ? 'Editar Producto' : 'Agregar Producto') : 'Gestión de Productos'}
        </h1>
        
        {!showForm && (
          <ProtectedButton
            permission={ALL_PERMISSIONS.PRODUCTOS_CREAR}
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            Agregar Producto
          </ProtectedButton>
        )}
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      {showForm && (
        <form className="producto-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="codigoBarras">Código de Barras</label>
            <input
              id="codigoBarras"
              name="codigoBarras"
              type="text"
              value={form.codigoBarras}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="nombre">Nombre *</label>
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
            <label htmlFor="descripcion">Descripción</label>
            <input
              id="descripcion"
              name="descripcion"
              type="text"
              value={form.descripcion}
              onChange={handleChange}
            />
          </div>

          {/* Campo de Precio de Costo - Solo visible con permiso */}
          <ProtectedComponent 
            permission={ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_COSTO}
            fallback={
              <div className="form-group">
                <label>Precio de Costo</label>
                <div className="permission-error inline">
                  <span className="error-text">Sin permisos para ver precio de costo</span>
                </div>
              </div>
            }
          >
            <div className="form-group">
              <label htmlFor="precioCosto">Precio de Costo *</label>
              <input
                id="precioCosto"
                name="precioCosto"
                type="number"
                step="0.01"
                value={form.precioCosto}
                onChange={handleChange}
                required
              />
            </div>
          </ProtectedComponent>

          <div className="form-group">
            <label htmlFor="precioVenta">Precio de Venta *</label>
            <input
              id="precioVenta"
              name="precioVenta"
              type="number"
              step="0.01"
              value={form.precioVenta}
              onChange={handleChange}
              required
            />
          </div>

          {/* Campo de Stock - Solo visible con permiso */}
          <ProtectedComponent 
            permission={ALL_PERMISSIONS.PRODUCTOS_VER_STOCK}
            fallback={
              <div className="form-group">
                <label>Stock</label>
                <div className="permission-error inline">
                  <span className="error-text">Sin permisos para ver stock</span>
                </div>
              </div>
            }
          >
            <div className="form-group">
              <label htmlFor="stock">Stock *</label>
              <input
                id="stock"
                name="stock"
                type="number"
                value={form.stock}
                onChange={handleChange}
                required
              />
            </div>
          </ProtectedComponent>

          <div className="form-group">
            <label htmlFor="stockMinimo">Stock Mínimo</label>
            <input
              id="stockMinimo"
              name="stockMinimo"
              type="number"
              value={form.stockMinimo}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="categoriaId">Categoría</label>
            <select
              id="categoriaId"
              name="categoriaId"
              value={form.categoriaId}
              onChange={handleChange}
            >
              <option value="">Sin categoría</option>
              {categorias.map(categoria => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="proveedorId">Proveedor</label>
            <select
              id="proveedorId"
              name="proveedorId"
              value={form.proveedorId}
              onChange={handleChange}
            >
              <option value="">Sin proveedor</option>
              {proveedores.map(proveedor => (
                <option key={proveedor.id} value={proveedor.id}>
                  {proveedor.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Procesando...' : (editingProduct ? 'Actualizar' : 'Crear')}
            </button>
            <button type="button" onClick={handleCancelEdit} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {!showForm && (
        <div className="productos-list">
          {loading ? (
            <div className="loading">Cargando productos...</div>
          ) : productos.length === 0 ? (
            <div className="empty-state">No hay productos registrados</div>
          ) : (
            <div className="productos-grid">
              {productos.map(producto => (
                <div key={producto.id} className="producto-card">
                  <div className="producto-info">
                    <h3>{producto.nombre}</h3>
                    {producto.descripcion && <p className="descripcion">{producto.descripcion}</p>}
                    {producto.codigoBarras && <p className="codigo">Código: {producto.codigoBarras}</p>}
                    <p className="categoria">Categoría: {getCategoriaName(producto.categoriaId)}</p>
                    <p className="proveedor">Proveedor: {getProveedorName(producto.proveedorId)}</p>
                    
                    <div className="precios">
                      <ProtectedComponent permission={ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_COSTO}>
                        <span className="precio-costo">Costo: ${producto.precioCosto}</span>
                      </ProtectedComponent>
                      <span className="precio-venta">Venta: ${producto.precioVenta}</span>
                    </div>
                    
                    <ProtectedComponent permission={ALL_PERMISSIONS.PRODUCTOS_VER_STOCK}>
                      <div className="stock">
                        <span>Stock: {producto.stock}</span>
                        {producto.stockMinimo && producto.stock <= producto.stockMinimo && (
                          <span className="stock-bajo">⚠️ Stock bajo</span>
                        )}
                      </div>
                    </ProtectedComponent>
                  </div>
                  
                  <div className="producto-actions">
                    <ProtectedButton
                      permission={ALL_PERMISSIONS.PRODUCTOS_EDITAR}
                      onClick={() => handleEdit(producto)}
                      className="btn-edit"
                    >
                      Editar
                    </ProtectedButton>
                    <ProtectedButton
                      permission={ALL_PERMISSIONS.PRODUCTOS_ELIMINAR}
                      onClick={() => handleDelete(producto.id)}
                      className="btn-delete"
                    >
                      Eliminar
                    </ProtectedButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Productos;