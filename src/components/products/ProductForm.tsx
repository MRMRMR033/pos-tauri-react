// src/components/products/ProductForm.tsx - Formulario de producto con validación
import React, { useState, useEffect } from 'react';
import { ProtectedComponent } from '../auth/ProtectedComponent';
import { usePermissions } from '../../hooks/usePermissions';
import { ALL_PERMISSIONS } from '../../types/permissions';
import type { Producto, CreateProductoRequest } from '../../api/products';
import './ProductForm.css';

interface ProductFormProps {
  product: Producto | null;
  categorias: any[];
  proveedores: any[];
  onSave: (product: CreateProductoRequest) => void;
  onCancel: () => void;
  loading: boolean;
}

interface FormData {
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

interface FormErrors {
  [key: string]: string;
}

const ProductForm: React.FC<ProductFormProps> = ({
  product,
  categorias,
  proveedores,
  onSave,
  onCancel,
  loading
}) => {
  const { hasPermission } = usePermissions();
  
  const [formData, setFormData] = useState<FormData>({
    codigoBarras: '',
    nombre: '',
    descripcion: '',
    precioCosto: '',
    precioVenta: '',
    stock: '',
    stockMinimo: '',
    categoriaId: '',
    proveedorId: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});

  // Llenar formulario si estamos editando
  useEffect(() => {
    if (product) {
      setFormData({
        codigoBarras: product.codigoBarras || '',
        nombre: product.nombre,
        descripcion: product.descripcion || '',
        precioCosto: product.precioCosto.toString(),
        precioVenta: product.precioVenta.toString(),
        stock: product.stock.toString(),
        stockMinimo: product.stockMinimo?.toString() || '',
        categoriaId: product.categoriaId?.toString() || '',
        proveedorId: product.proveedorId?.toString() || ''
      });
    }
  }, [product]);

  // Validaciones en tiempo real
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'nombre':
        if (!value.trim()) return 'El nombre es requerido';
        if (value.length < 2) return 'El nombre debe tener al menos 2 caracteres';
        return '';
      
      case 'precioCosto':
        if (hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_COSTO)) {
          if (!value) return 'El precio de costo es requerido';
          const precio = parseFloat(value);
          if (isNaN(precio) || precio < 0) return 'Ingrese un precio válido';
        }
        return '';
      
      case 'precioVenta':
        if (!value) return 'El precio de venta es requerido';
        const precio = parseFloat(value);
        if (isNaN(precio) || precio <= 0) return 'Ingrese un precio válido mayor a 0';
        
        // Validar que precio de venta sea mayor al de costo
        const precioCosto = parseFloat(formData.precioCosto);
        if (hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_COSTO) && 
            !isNaN(precioCosto) && precio <= precioCosto) {
          return 'El precio de venta debe ser mayor al precio de costo';
        }
        return '';
      
      case 'stock':
        if (hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER_STOCK)) {
          if (!value) return 'El stock es requerido';
          const stock = parseInt(value);
          if (isNaN(stock) || stock < 0) return 'Ingrese un stock válido';
        }
        return '';
      
      case 'stockMinimo':
        if (value) {
          const stockMin = parseInt(value);
          if (isNaN(stockMin) || stockMin < 0) return 'Ingrese un stock mínimo válido';
        }
        return '';
      
      case 'codigoBarras':
        if (value && value.length < 8) return 'El código debe tener al menos 8 caracteres';
        return '';
      
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validar campo si ya fue tocado
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof FormData]);
      if (error) newErrors[key] = error;
    });
    
    setErrors(newErrors);
    setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const productData: CreateProductoRequest = {
      codigoBarras: formData.codigoBarras || undefined,
      nombre: formData.nombre,
      descripcion: formData.descripcion || undefined,
      precioCosto: hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_COSTO) 
        ? parseFloat(formData.precioCosto) 
        : 0,
      precioVenta: parseFloat(formData.precioVenta),
      stock: hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER_STOCK) 
        ? parseInt(formData.stock) 
        : 0,
      stockMinimo: formData.stockMinimo ? parseInt(formData.stockMinimo) : undefined,
      categoriaId: formData.categoriaId ? parseInt(formData.categoriaId) : undefined,
      proveedorId: formData.proveedorId ? parseInt(formData.proveedorId) : undefined
    };

    onSave(productData);
  };

  const hasErrors = Object.values(errors).some(error => error !== '');

  return (
    <div className="product-form-container">
      <div className="form-header">
        <h2>{product ? 'Editar Producto' : 'Nuevo Producto'}</h2>
        <button 
          className="btn btn-ghost btn-close"
          onClick={onCancel}
          disabled={loading}
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="codigoBarras">Código de Barras</label>
            <input
              type="text"
              id="codigoBarras"
              name="codigoBarras"
              value={formData.codigoBarras}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Escáner o ingreso manual"
              className={errors.codigoBarras ? 'error' : ''}
              disabled={loading}
            />
            {errors.codigoBarras && (
              <span className="error-message">{errors.codigoBarras}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="nombre" className="required">Nombre del Producto</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Ej: Coca Cola 350ml"
              className={errors.nombre ? 'error' : ''}
              disabled={loading}
              required
            />
            {errors.nombre && (
              <span className="error-message">{errors.nombre}</span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Descripción adicional del producto"
            rows={3}
            disabled={loading}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="categoriaId">Categoría</label>
            <select
              id="categoriaId"
              name="categoriaId"
              value={formData.categoriaId}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={loading}
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
              value={formData.proveedorId}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={loading}
            >
              <option value="">Sin proveedor</option>
              {proveedores.map(proveedor => (
                <option key={proveedor.id} value={proveedor.id}>
                  {proveedor.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <ProtectedComponent 
            permission={ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_COSTO}
            fallback={
              <div className="form-group">
                <label className="disabled">Precio de Costo</label>
                <input 
                  type="text" 
                  value="Sin permisos" 
                  disabled 
                  className="permission-disabled"
                />
              </div>
            }
          >
            <div className="form-group">
              <label htmlFor="precioCosto" className="required">Precio de Costo</label>
              <input
                type="number"
                id="precioCosto"
                name="precioCosto"
                value={formData.precioCosto}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={errors.precioCosto ? 'error' : ''}
                disabled={loading}
                required
              />
              {errors.precioCosto && (
                <span className="error-message">{errors.precioCosto}</span>
              )}
            </div>
          </ProtectedComponent>

          <div className="form-group">
            <label htmlFor="precioVenta" className="required">Precio de Venta</label>
            <input
              type="number"
              id="precioVenta"
              name="precioVenta"
              value={formData.precioVenta}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              className={errors.precioVenta ? 'error' : ''}
              disabled={loading}
              required
            />
            {errors.precioVenta && (
              <span className="error-message">{errors.precioVenta}</span>
            )}
          </div>
        </div>

        <div className="form-row">
          <ProtectedComponent 
            permission={ALL_PERMISSIONS.PRODUCTOS_VER_STOCK}
            fallback={
              <div className="form-group">
                <label className="disabled">Stock</label>
                <input 
                  type="text" 
                  value="Sin permisos" 
                  disabled 
                  className="permission-disabled"
                />
              </div>
            }
          >
            <div className="form-group">
              <label htmlFor="stock" className="required">Stock Inicial</label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="0"
                min="0"
                className={errors.stock ? 'error' : ''}
                disabled={loading}
                required
              />
              {errors.stock && (
                <span className="error-message">{errors.stock}</span>
              )}
            </div>
          </ProtectedComponent>

          <div className="form-group">
            <label htmlFor="stockMinimo">Stock Mínimo</label>
            <input
              type="number"
              id="stockMinimo"
              name="stockMinimo"
              value={formData.stockMinimo}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="0"
              min="0"
              className={errors.stockMinimo ? 'error' : ''}
              disabled={loading}
            />
            {errors.stockMinimo && (
              <span className="error-message">{errors.stockMinimo}</span>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || hasErrors}
          >
            {loading ? (
              <>
                <span className="loading-spinner-small"></span>
                {product ? 'Actualizando...' : 'Creando...'}
              </>
            ) : (
              product ? 'Actualizar Producto' : 'Crear Producto'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;