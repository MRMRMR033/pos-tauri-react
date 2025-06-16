// src/components/products/ProductTable.tsx - Tabla de productos con permisos
import React from 'react';
import { ProtectedComponent, ProtectedButton } from '../auth/ProtectedComponent';
import { ALL_PERMISSIONS } from '../../types/permissions';
import type { Producto } from '../../api/products';
import './ProductTable.css';

interface ProductTableProps {
  productos: Producto[];
  categorias: any[];
  proveedores: any[];
  loading: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (column: string) => void;
  onEdit: (producto: Producto) => void;
  onDelete: (id: number) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({
  productos,
  categorias,
  proveedores,
  loading,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete
}) => {
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

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↗️' : '↘️';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getStockStatus = (stock: number, stockMinimo?: number) => {
    if (!stockMinimo) return 'normal';
    if (stock === 0) return 'agotado';
    if (stock <= stockMinimo) return 'bajo';
    return 'normal';
  };

  if (loading) {
    return (
      <div className="product-table-loading">
        <div className="loading-spinner"></div>
        <p>Cargando productos...</p>
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <div className="product-table-empty">
        <div className="empty-icon">📦</div>
        <h3>No hay productos</h3>
        <p>No se encontraron productos que coincidan con los criterios de búsqueda.</p>
      </div>
    );
  }

  return (
    <div className="product-table-container">
      <div className="table-responsive">
        <table className="product-table">
          <thead>
            <tr>
              <th 
                className="sortable"
                onClick={() => onSort('codigoBarras')}
              >
                Código {getSortIcon('codigoBarras')}
              </th>
              <th 
                className="sortable"
                onClick={() => onSort('nombre')}
              >
                Nombre {getSortIcon('nombre')}
              </th>
              <th>Categoría</th>
              <th>Proveedor</th>
              
              {/* Columna de precio de costo - Solo visible con permiso */}
              <ProtectedComponent permission={ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_COSTO}>
                <th 
                  className="sortable text-right"
                  onClick={() => onSort('precioCosto')}
                >
                  Precio Costo {getSortIcon('precioCosto')}
                </th>
              </ProtectedComponent>
              
              <th 
                className="sortable text-right"
                onClick={() => onSort('precioVenta')}
              >
                Precio Venta {getSortIcon('precioVenta')}
              </th>
              
              {/* Columna de stock - Solo visible con permiso */}
              <ProtectedComponent permission={ALL_PERMISSIONS.PRODUCTOS_VER_STOCK}>
                <th 
                  className="sortable text-center"
                  onClick={() => onSort('stock')}
                >
                  Stock {getSortIcon('stock')}
                </th>
              </ProtectedComponent>
              
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          
          <tbody>
            {productos.map(producto => (
              <tr key={producto.id} className="product-row">
                <td className="codigo-barras">
                  {producto.codigoBarras || <span className="text-muted">Sin código</span>}
                </td>
                
                <td className="producto-nombre">
                  <div className="nombre-container">
                    <span className="nombre">{producto.nombre}</span>
                    {producto.descripcion && (
                      <span className="descripcion">{producto.descripcion}</span>
                    )}
                  </div>
                </td>
                
                <td className="categoria">
                  <span className="categoria-badge">
                    {getCategoriaName(producto.categoriaId)}
                  </span>
                </td>
                
                <td className="proveedor">
                  {getProveedorName(producto.proveedorId)}
                </td>
                
                {/* Precio de costo - Solo visible con permiso */}
                <ProtectedComponent permission={ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_COSTO}>
                  <td className="precio-costo text-right">
                    {formatCurrency(producto.precioCosto)}
                  </td>
                </ProtectedComponent>
                
                <td className="precio-venta text-right">
                  <strong>{formatCurrency(producto.precioVenta)}</strong>
                </td>
                
                {/* Stock - Solo visible con permiso */}
                <ProtectedComponent permission={ALL_PERMISSIONS.PRODUCTOS_VER_STOCK}>
                  <td className="stock text-center">
                    <span className={`stock-badge stock-${getStockStatus(producto.stock, producto.stockMinimo)}`}>
                      {producto.stock}
                      {getStockStatus(producto.stock, producto.stockMinimo) === 'agotado' && ' ⚠️'}
                      {getStockStatus(producto.stock, producto.stockMinimo) === 'bajo' && ' ⚠️'}
                    </span>
                  </td>
                </ProtectedComponent>
                
                <td className="acciones text-center">
                  <div className="action-buttons">
                    <ProtectedButton
                      permission={ALL_PERMISSIONS.PRODUCTOS_EDITAR}
                      onClick={() => onEdit(producto)}
                      className="btn btn-sm btn-edit"
                    >
                      ✏️
                    </ProtectedButton>
                    
                    <ProtectedButton
                      permission={ALL_PERMISSIONS.PRODUCTOS_ELIMINAR}
                      onClick={() => onDelete(producto.id)}
                      className="btn btn-sm btn-delete"
                    >
                      🗑️
                    </ProtectedButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTable;