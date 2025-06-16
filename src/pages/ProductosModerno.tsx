// src/pages/ProductosModerno.tsx - Interfaz completa de gestión de productos
import React, { useState, useEffect } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../contexts/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { 
  getProductos, 
  createProducto, 
  updateProducto, 
  deleteProducto,
  getCategorias, 
  getProveedores,
  type Producto, 
  type ProductSearchParams,
  type ProductListResponse,
  type CreateProductoRequest 
} from '../api/products';
import { ProtectedComponent } from '../components/auth/ProtectedComponent';
import { ALL_PERMISSIONS } from '../types/permissions';
import ProductForm from '../components/products/ProductForm';
import ProductTable from '../components/products/ProductTable';
import SearchBar from '../components/products/SearchBar';
import './ProductosModerno.css';

const ProductosModerno: React.FC = () => {
  const { hasPermission, accessToken } = usePermissions();
  const { showSuccess, showError } = useToast();

  // Estados principales
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Estados del formulario
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);

  // Estados de búsqueda y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<string>('nombre');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Debounce para la búsqueda
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Cargar productos cuando cambien los parámetros de búsqueda
  useEffect(() => {
    loadProductos();
  }, [debouncedSearchTerm, currentPage, pageSize, sortBy, sortOrder]);

  const loadInitialData = async () => {
    try {
      const [categoriasData, proveedoresData] = await Promise.all([
        getCategorias(accessToken || undefined),
        getProveedores(accessToken || undefined)
      ]);
      setCategorias(categoriasData);
      setProveedores(proveedoresData);
    } catch (error) {
      showError('Error al cargar datos iniciales');
      console.error('Error loading initial data:', error);
    }
  };

  const loadProductos = async () => {
    if (!hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER)) {
      return;
    }

    try {
      setLoading(true);
      const params: ProductSearchParams = {
        page: currentPage,
        limit: pageSize,
        search: debouncedSearchTerm || undefined,
        sortBy,
        sortOrder
      };

      const response: ProductListResponse = await getProductos(params, accessToken || undefined);
      
      setProductos(response.productos || []);
      setTotalProducts(response.total || 0);
      setTotalPages(response.totalPages || 1);
    } catch (error: any) {
      if (error.message?.includes('403')) {
        showError('Sin permisos para ver productos');
      } else {
        showError('Error al cargar productos');
      }
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleCreateProduct = () => {
    if (!hasPermission(ALL_PERMISSIONS.PRODUCTOS_CREAR)) {
      showError('No tienes permisos para crear productos');
      return;
    }
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (producto: Producto) => {
    if (!hasPermission(ALL_PERMISSIONS.PRODUCTOS_EDITAR)) {
      showError('No tienes permisos para editar productos');
      return;
    }
    setEditingProduct(producto);
    setShowForm(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!hasPermission(ALL_PERMISSIONS.PRODUCTOS_ELIMINAR)) {
      showError('No tienes permisos para eliminar productos');
      return;
    }

    const producto = productos.find(p => p.id === id);
    if (!confirm(`¿Estás seguro de eliminar "${producto?.nombre}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteProducto(id, accessToken || undefined);
      showSuccess('Producto eliminado exitosamente');
      await loadProductos();
    } catch (error: any) {
      if (error.message?.includes('403')) {
        showError('Sin permisos para eliminar productos');
      } else {
        showError('Error al eliminar producto');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (productData: CreateProductoRequest) => {
    try {
      setLoading(true);
      
      if (editingProduct) {
        await updateProducto(editingProduct.id, productData, accessToken || undefined);
        showSuccess('Producto actualizado exitosamente');
      } else {
        await createProducto(productData, accessToken || undefined);
        showSuccess('Producto creado exitosamente');
      }
      
      setShowForm(false);
      setEditingProduct(null);
      await loadProductos();
    } catch (error: any) {
      if (error.message?.includes('403')) {
        showError('Sin permisos para esta operación');
      } else {
        showError(editingProduct ? 'Error al actualizar producto' : 'Error al crear producto');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  // Verificar si el usuario puede ver esta página
  if (!hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER)) {
    return (
      <div className="productos-no-permission">
        <h2>Acceso Denegado</h2>
        <p>No tienes permisos para ver los productos.</p>
      </div>
    );
  }

  return (
    <div className="productos-moderno">
      <div className="productos-header">
        <div className="header-content">
          <h1>Gestión de Productos</h1>
          <div className="header-stats">
            <span className="stat">
              <strong>{totalProducts}</strong> productos
            </span>
            <span className="stat">
              <strong>{categorias.length}</strong> categorías
            </span>
          </div>
        </div>
        
        <ProtectedComponent permission={ALL_PERMISSIONS.PRODUCTOS_CREAR}>
          <button 
            className="btn btn-primary"
            onClick={handleCreateProduct}
            disabled={loading}
          >
            <span className="btn-icon">+</span>
            Nuevo Producto
          </button>
        </ProtectedComponent>
      </div>

      {!showForm ? (
        <div className="productos-content">
          <SearchBar
            searchTerm={searchTerm}
            onSearch={handleSearch}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
            loading={loading}
          />

          <ProductTable
            productos={productos}
            categorias={categorias}
            proveedores={proveedores}
            loading={loading}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
          />

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                Anterior
              </button>
              
              <div className="pagination-info">
                Página {currentPage} de {totalPages}
              </div>
              
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      ) : (
        <ProductForm
          product={editingProduct}
          categorias={categorias}
          proveedores={proveedores}
          onSave={handleSaveProduct}
          onCancel={handleCancelForm}
          loading={loading}
        />
      )}
    </div>
  );
};

export default ProductosModerno;