// src/components/products/ProductForm.tsx - Formulario con React Hook Form + Zod
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

// Zod schema basado en el CreateProductoDto del backend
const createProductSchema = (hasPermission: (permission: string) => boolean) => {
  return z.object({
    codigoBarras: z
      .string()
      .min(1, 'El código de barras es requerido')
      .min(8, 'El código debe tener al menos 8 caracteres')
      .regex(/^\d{8,}$/, 'El código debe contener solo números'),
    
    nombre: z
      .string()
      .min(1, 'El nombre es requerido')
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(255, 'El nombre no puede exceder 255 caracteres'),
    
    precioCosto: hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_COSTO) 
      ? z.number().min(0, 'El precio de costo debe ser mayor o igual a 0')
      : z.number().optional(),
    
    precioVenta: z
      .number()
      .min(0.01, 'El precio de venta debe ser mayor a 0'),
    
    precioEspecial: z
      .number()
      .min(0, 'El precio especial debe ser mayor o igual a 0')
      .optional(),
    
    stock: hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER_STOCK)
      ? z.number().int().min(0, 'El stock debe ser mayor o igual a 0')
      : z.number().int().optional(),
    
    categoriaId: z
      .number()
      .int()
      .optional(), // Backend lo tiene como opcional
    
    proveedorId: z
      .number()
      .int()
      .min(1)
      .optional()
  }).refine((data) => {
    if (hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_COSTO) && 
        data.precioCosto !== undefined && 
        data.precioVenta <= data.precioCosto) {
      return false;
    }
    return true;
  }, {
    message: 'El precio de venta debe ser mayor al precio de costo',
    path: ['precioVenta']
  });
};

type ProductFormData = z.infer<ReturnType<typeof createProductSchema>>;

const ProductForm: React.FC<ProductFormProps> = ({
  product,
  categorias,
  proveedores,
  onSave,
  onCancel,
  loading
}) => {
  const { hasPermission } = usePermissions();
  
  const schema = createProductSchema(hasPermission);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset
  } = useForm<ProductFormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      codigoBarras: '',
      nombre: '',
      precioCosto: 0,
      precioVenta: 0,
      stock: 0,
      categoriaId: undefined,
      proveedorId: undefined
    }
  });

  // Llenar formulario si estamos editando
  useEffect(() => {
    if (product) {
      reset({
        codigoBarras: product.codigoBarras || '',
        nombre: product.nombre,
        precioCosto: product.precioCosto,
        precioVenta: product.precioVenta,
        precioEspecial: product.precioEspecial,
        stock: product.stock,
        categoriaId: product.categoriaId,
        proveedorId: product.proveedorId || undefined
      });
    }
  }, [product, reset]);

  const onSubmit = (data: ProductFormData) => {
    const productData: CreateProductoRequest = {
      codigoBarras: data.codigoBarras,
      nombre: data.nombre,
      precioCosto: data.precioCosto || 0,
      precioVenta: data.precioVenta,
      precioEspecial: data.precioEspecial || undefined,
      stock: data.stock || 0,
      categoriaId: data.categoriaId || undefined,
      proveedorId: data.proveedorId || undefined
    };

    onSave(productData);
  };

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

      <form onSubmit={handleSubmit(onSubmit)} className="product-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="codigoBarras" className="required">Código de Barras</label>
            <input
              type="text"
              id="codigoBarras"
              {...register('codigoBarras')}
              placeholder="Escáner o ingreso manual"
              className={errors.codigoBarras ? 'error' : ''}
              disabled={loading}
            />
            {errors.codigoBarras && (
              <span className="error-message">{errors.codigoBarras.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="nombre" className="required">Nombre del Producto</label>
            <input
              type="text"
              id="nombre"
              {...register('nombre')}
              placeholder="Ej: Coca Cola 350ml"
              className={errors.nombre ? 'error' : ''}
              disabled={loading}
            />
            {errors.nombre && (
              <span className="error-message">{errors.nombre.message}</span>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="categoriaId">Categoría</label>
            <select
              id="categoriaId"
              {...register('categoriaId', { 
                valueAsNumber: true,
                setValueAs: (value) => value === 0 ? undefined : value 
              })}
              disabled={loading}
              className={errors.categoriaId ? 'error' : ''}
            >
              <option value={0}>Sin categoría</option>
              {categorias.map(categoria => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
            {errors.categoriaId && (
              <span className="error-message">{errors.categoriaId.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="proveedorId">Proveedor</label>
            <select
              id="proveedorId"
              {...register('proveedorId', { 
                valueAsNumber: true,
                setValueAs: (value) => value === 0 ? undefined : value 
              })}
              disabled={loading}
            >
              <option value={0}>Sin proveedor</option>
              {proveedores.map(proveedor => (
                <option key={proveedor.id} value={proveedor.id}>
                  {proveedor.nombre}
                </option>
              ))}
            </select>
            {errors.proveedorId && (
              <span className="error-message">{errors.proveedorId.message}</span>
            )}
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
                {...register('precioCosto', { valueAsNumber: true })}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={errors.precioCosto ? 'error' : ''}
                disabled={loading}
              />
              {errors.precioCosto && (
                <span className="error-message">{errors.precioCosto.message}</span>
              )}
            </div>
          </ProtectedComponent>

          <div className="form-group">
            <label htmlFor="precioVenta" className="required">Precio de Venta</label>
            <input
              type="number"
              id="precioVenta"
              {...register('precioVenta', { valueAsNumber: true })}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              className={errors.precioVenta ? 'error' : ''}
              disabled={loading}
            />
            {errors.precioVenta && (
              <span className="error-message">{errors.precioVenta.message}</span>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="precioEspecial">Precio Especial</label>
            <input
              type="number"
              id="precioEspecial"
              {...register('precioEspecial', { valueAsNumber: true })}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={errors.precioEspecial ? 'error' : ''}
              disabled={loading}
            />
            {errors.precioEspecial && (
              <span className="error-message">{errors.precioEspecial.message}</span>
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
                {...register('stock', { valueAsNumber: true })}
                placeholder="0"
                min="0"
                className={errors.stock ? 'error' : ''}
                disabled={loading}
              />
              {errors.stock && (
                <span className="error-message">{errors.stock.message}</span>
              )}
            </div>
          </ProtectedComponent>
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
            disabled={loading || !isValid}
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