// src/pages/Productos.tsx - Con sistema de permisos
import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import './Productos.css';
import { createProducto, getCategorias, getProveedores, type Categoria, type Proveedor, type CreateProductoRequest } from '../api/products';
import { ProtectedComponent, ProtectedButton } from '../components/auth/ProtectedComponent';
import { usePermissions } from '../hooks/usePermissions';
import { ALL_PERMISSIONS } from '../types/permissions';
import '../components/auth/ProtectedComponent.css';

interface ProductoFormFields {
  codigoBarras: string;
  nombre: string;
  precioCosto: string;
  precioVenta: string;
  precioEspecial: string;
  stock: string;
  categoriaId: string;
  proveedorId: string;
}

const Productos: React.FC = () => {
  const { hasPermission } = usePermissions();
  
  const [form, setForm] = useState<ProductoFormFields>({
    codigoBarras: '',
    nombre: '',
    precioCosto: '',
    precioVenta: '',
    precioEspecial: '',
    stock: '',
    categoriaId: '',
    proveedorId: '',
  });
  
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriasData, proveedoresData] = await Promise.all([
          getCategorias(),
          getProveedores()
        ]);
        setCategorias(categoriasData);
        setProveedores(proveedoresData);
      } catch (err) {
        setError('Error al cargar categorías y proveedores');
        console.error('Error loading data:', err);
      }
    };
    
    loadData();
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Verificar permisos antes de enviar
    if (!hasPermission(ALL_PERMISSIONS.PRODUCTOS_CREAR)) {
      setError('No tienes permisos para crear productos');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Construir datos del producto basado en permisos
      const productData: CreateProductoRequest = {
        codigoBarras: form.codigoBarras,
        nombre: form.nombre,
        // Solo incluir precio de costo si tiene permiso
        precioCosto: hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_COSTO) 
          ? parseFloat(form.precioCosto || '0') 
          : 0,
        // Solo incluir precio de venta si tiene permiso
        precioVenta: hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_VENTA) 
          ? parseFloat(form.precioVenta || '0') 
          : 0,
        precioEspecial: form.precioEspecial ? parseFloat(form.precioEspecial) : undefined,
        // Solo incluir stock si tiene permiso
        stock: hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER_STOCK) 
          ? parseInt(form.stock || '0') 
          : 0,
        categoriaId: parseInt(form.categoriaId),
        proveedorId: parseInt(form.proveedorId),
      };

      await createProducto(productData);
      setSuccess('Producto creado exitosamente');
      
      // Limpiar formulario
      setForm({
        codigoBarras: '',
        nombre: '',
        precioCosto: '',
        precioVenta: '',
        precioEspecial: '',
        stock: '',
        categoriaId: '',
        proveedorId: '',
      });
    } catch (err: any) {
      if (err.message?.includes('permiso') || err.message?.includes('autorizado')) {
        setError('No tienes permisos suficientes para realizar esta acción');
      } else {
        setError(err.message || 'Error al crear el producto');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="producto-page">
      <h1 className="producto-title">Agregar Producto</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form className="producto-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="codigoBarras">Código de Barras</label>
          <input
            id="codigoBarras"
            name="codigoBarras"
            type="text"
            value={form.codigoBarras}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            value={form.nombre}
            onChange={handleChange}
            required
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
            <label htmlFor="precioCosto">Precio de Costo</label>
            <input
              id="precioCosto"
              name="precioCosto"
              type="number"
              step="0.01"
              value={form.precioCosto}
              onChange={handleChange}
              required={hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_COSTO)}
              disabled={!hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_COSTO)}
            />
          </div>
        </ProtectedComponent>

        {/* Campo de Precio de Venta - Solo editable con permiso */}
        <div className="form-group">
          <label htmlFor="precioVenta">Precio de Venta</label>
          <input
            id="precioVenta"
            name="precioVenta"
            type="number"
            step="0.01"
            value={form.precioVenta}
            onChange={handleChange}
            required={hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_VENTA)}
            disabled={!hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_VENTA)}
            className={!hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_VENTA) ? 'protected-disabled' : ''}
          />
          {!hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_VENTA) && (
            <small className="permission-error inline">
              <span className="error-text">Sin permisos para editar precio de venta</span>
            </small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="precioEspecial">Precio Especial</label>
          <input
            id="precioEspecial"
            name="precioEspecial"
            type="number"
            step="0.01"
            value={form.precioEspecial}
            onChange={handleChange}
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
            <label htmlFor="stock">Stock</label>
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
          <label htmlFor="categoriaId">Categoría</label>
          <select
            id="categoriaId"
            name="categoriaId"
            value={form.categoriaId}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona categoría</option>
            {categorias.map((categoria) => (
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
            required
          >
            <option value="">Selecciona proveedor</option>
            {proveedores.map((proveedor) => (
              <option key={proveedor.id} value={proveedor.id}>
                {proveedor.nombre} {proveedor.contacto && `(${proveedor.contacto})`}
              </option>
            ))}
          </select>
        </div>

        {/* Botón de guardar - Solo visible con permiso de crear */}
        <ProtectedButton
          permission={ALL_PERMISSIONS.PRODUCTOS_CREAR}
          type="submit"
          className="producto-submit"
          disabled={loading}
          fallback={
            <div className="permission-error">
              <span className="error-text">No tienes permisos para crear productos</span>
            </div>
          }
        >
          {loading ? 'Guardando...' : 'Guardar Producto'}
        </ProtectedButton>
      </form>
    </div>
  );
};

export default Productos;
