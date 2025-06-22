// src/pages/Inventario.tsx - Sistema de inventario funcional
import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import './Inventario.css';
import { getProductos, adjustStock, type Producto, type ProductSearchParams, type AdjustStockRequest } from '../api/products';
import { usePermissions } from '../hooks/usePermissions';
import { useDebounce } from '../hooks/useDebounce';
import { useToast } from '../contexts/ToastContext';
import { ProtectedComponent } from '../components/auth/ProtectedComponent';
import { ALL_PERMISSIONS } from '../types/permissions';
import ImportarProductosModal from '../components/modals/ImportarProductosModal';

interface MovimientoForm {
  cantidad: string;
  tipo: 'entrada' | 'salida' | 'ajuste';
  motivo: string;
}

interface MovimientoInventario {
  id: number;
  productoId: number;
  productoNombre: string;
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  motivo: string;
  fecha: string;
}

const Inventario: React.FC = () => {
  const { hasPermission, accessToken } = usePermissions();
  const { showSuccess, showError } = useToast();
  
  // Estados principales
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Producto[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Estados del formulario
  const [form, setForm] = useState<MovimientoForm>({
    cantidad: '',
    tipo: 'entrada',
    motivo: ''
  });
  
  // Estados del historial (simulado por ahora)
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  
  // Debounce para búsqueda
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Cargar productos al inicio
  useEffect(() => {
    loadProductos();
  }, []);

  // Búsqueda con debounce
  useEffect(() => {
    if (debouncedSearchTerm) {
      searchProducts(debouncedSearchTerm);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [debouncedSearchTerm, accessToken]);

  // Event listener para F4 - Importar productos
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F4' && !event.altKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        if (hasPermission(ALL_PERMISSIONS.PRODUCTOS_CREAR)) {
          setShowImportModal(true);
        } else {
          showError('No tienes permisos para importar productos');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [hasPermission, showError]);

  const loadProductos = async () => {
    if (!hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER_STOCK)) {
      showError('No tienes permisos para ver el inventario');
      return;
    }

    try {
      setLoading(true);
      const params: ProductSearchParams = {
        page: 1,
        limit: 100,
        sortBy: 'nombre',
        sortOrder: 'asc'
      };
      
      const response = await getProductos(params);
      setProductos(response.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      showError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (term: string) => {
    try {
      setLoading(true);
      const params: ProductSearchParams = {
        search: term,
        limit: 10,
        page: 1
      };
      
      const response = await getProductos(params);
      setSearchResults(response.data || []);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching products:', error);
      showError('Error al buscar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const selectProduct = (producto: Producto) => {
    setSelectedProduct(producto);
    setSearchTerm(producto.nombre);
    setShowResults(false);
    setForm({
      cantidad: '',
      tipo: 'entrada',
      motivo: ''
    });
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Funciones del modal de importación
  const handleCloseImportModal = () => {
    setShowImportModal(false);
  };

  const handleImportSuccess = () => {
    loadProductos(); // Recargar productos
    showSuccess('Productos importados exitosamente');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      showError('Selecciona un producto primero');
      return;
    }

    if (!hasPermission(ALL_PERMISSIONS.PRODUCTOS_AJUSTAR_STOCK)) {
      showError('No tienes permisos para ajustar el inventario');
      return;
    }

    const cantidad = parseInt(form.cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      showError('Ingresa una cantidad válida');
      return;
    }

    // Validation for salida type with insufficient stock
    if (form.tipo === 'salida' && selectedProduct.stock < cantidad) {
      showError('No hay suficiente stock para la salida');
      return;
    }

    try {
      setLoading(true);
      
      const stockAnterior = selectedProduct.stock;
      
      // Call the backend API for stock adjustment
      const adjustmentData: AdjustStockRequest = {
        cantidad,
        tipo: form.tipo,
        motivo: form.motivo || undefined
      };
      
      const response = await adjustStock(selectedProduct.id, adjustmentData);
      const updatedProduct = response.data;

      // Create movement record for UI display
      const nuevoMovimiento: MovimientoInventario = {
        id: Date.now(),
        productoId: selectedProduct.id,
        productoNombre: selectedProduct.nombre,
        tipo: form.tipo,
        cantidad: cantidad,
        stockAnterior: stockAnterior,
        stockNuevo: updatedProduct.stock,
        motivo: form.motivo || 'Sin motivo especificado',
        fecha: new Date().toISOString()
      };

      setMovimientos(prev => [nuevoMovimiento, ...prev.slice(0, 9)]); // Keep last 10

      // Update selected product with response from API
      setSelectedProduct(updatedProduct);

      // Update products list
      setProductos(prev => prev.map(p => 
        p.id === selectedProduct.id ? updatedProduct : p
      ));

      // Clear form
      setForm({
        cantidad: '',
        tipo: 'entrada',
        motivo: ''
      });

      showSuccess(`Movimiento registrado: ${form.tipo} de ${cantidad} unidades`);
      
    } catch (error: any) {
      console.error('Error adjusting stock:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al ajustar el inventario';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || searchResults.length === 0) return;
    
    if (e.key === 'Enter' && searchResults.length > 0) {
      e.preventDefault();
      selectProduct(searchResults[0]);
    } else if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

  // Verificar permisos
  if (!hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER_STOCK)) {
    return (
      <div className="inventario-no-permission">
        <h2>Acceso Denegado</h2>
        <p>No tienes permisos para ver el inventario.</p>
      </div>
    );
  }

  return (
    <div className="inventario-page">
      <div className="inventario-header">
        <h1 className="inventario-title">Gestión de Inventario</h1>
        <div className="inventario-actions">
          <ProtectedComponent permission={ALL_PERMISSIONS.PRODUCTOS_CREAR}>
            <button 
              onClick={() => setShowImportModal(true)}
              className="btn-import"
              title="Importar productos desde Excel (F4)"
            >
              📥 Importar Excel
            </button>
          </ProtectedComponent>
        </div>
      </div>

      {/* Búsqueda de productos */}
      <div className="inventario-search">
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar producto por nombre o código de barras..."
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            className="search-input"
            autoFocus
          />
          {loading && (
            <div className="search-loading">🔍</div>
          )}
          
          {showResults && searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((producto) => (
                <div
                  key={producto.id}
                  className="search-result-item"
                  onClick={() => selectProduct(producto)}
                >
                  <div className="result-info">
                    <span className="result-name">{producto.nombre}</span>
                    {producto.codigoBarras && (
                      <span className="result-code">Código: {producto.codigoBarras}</span>
                    )}
                    <span className="result-stock">
                      Stock actual: {producto.stock} unidades
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {showResults && searchTerm && searchResults.length === 0 && !loading && (
            <div className="search-results">
              <div className="search-no-results">
                <span>No se encontraron productos</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Información del producto seleccionado */}
      {selectedProduct && (
        <div className="inventario-producto-info">
          <div className="producto-details">
            <h3>{selectedProduct.nombre}</h3>
            {selectedProduct.codigoBarras && (
              <p className="codigo">Código: {selectedProduct.codigoBarras}</p>
            )}
            <div className="stock-info">
              <span className={`stock-badge ${
                selectedProduct.stock <= 0 ? 'no-stock' : 
                selectedProduct.stock <= 5 ? 'low-stock' : 'normal'
              }`}>
                Stock actual: {selectedProduct.stock} unidades
              </span>
              <span className="stock-minimo">
                Stock mínimo: 5 (configurado por sistema)
              </span>
            </div>
          </div>

          <ProtectedComponent permission={ALL_PERMISSIONS.PRODUCTOS_AJUSTAR_STOCK}>
            <form className="inventario-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="tipo">Tipo de Movimiento *</label>
                  <select
                    id="tipo"
                    name="tipo"
                    value={form.tipo}
                    onChange={handleFormChange}
                    required
                    disabled={loading}
                  >
                    <option value="entrada">Entrada (+)</option>
                    <option value="salida">Salida (-)</option>
                    <option value="ajuste">Ajuste (=)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="cantidad">
                    {form.tipo === 'ajuste' ? 'Nuevo Stock *' : 'Cantidad *'}
                  </label>
                  <input
                    id="cantidad"
                    name="cantidad"
                    type="number"
                    value={form.cantidad}
                    onChange={handleFormChange}
                    min={form.tipo === 'ajuste' ? '0' : '1'}
                    required
                    disabled={loading}
                    placeholder={form.tipo === 'ajuste' ? 'Stock total' : 'Cantidad a mover'}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="motivo">Motivo</label>
                <textarea
                  id="motivo"
                  name="motivo"
                  value={form.motivo}
                  onChange={handleFormChange}
                  placeholder="Razón del movimiento (opcional)"
                  disabled={loading}
                  rows={2}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="inventario-submit" disabled={loading}>
                  {loading ? 'Procesando...' : 'Registrar Movimiento'}
                </button>
                <button 
                  type="button" 
                  className="inventario-cancel"
                  onClick={() => {
                    setSelectedProduct(null);
                    setSearchTerm('');
                    setForm({ cantidad: '', tipo: 'entrada', motivo: '' });
                  }}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>

              {form.tipo === 'salida' && selectedProduct.stock < parseInt(form.cantidad || '0') && (
                <div className="warning-message">
                  ⚠️ No hay suficiente stock. Stock disponible: {selectedProduct.stock}
                </div>
              )}
            </form>
          </ProtectedComponent>
        </div>
      )}

      {/* Historial de movimientos recientes */}
      {movimientos.length > 0 && (
        <div className="inventario-historial">
          <h3>Movimientos Recientes</h3>
          <div className="historial-list">
            {movimientos.map((movimiento) => (
              <div key={movimiento.id} className="movimiento-item">
                <div className="movimiento-info">
                  <span className="producto-nombre">{movimiento.productoNombre}</span>
                  <span className={`movimiento-tipo ${movimiento.tipo}`}>
                    {movimiento.tipo === 'entrada' && '+'}
                    {movimiento.tipo === 'salida' && '-'}
                    {movimiento.tipo === 'ajuste' && '='}
                    {movimiento.cantidad}
                  </span>
                </div>
                <div className="movimiento-details">
                  <span className="stock-change">
                    {movimiento.stockAnterior} → {movimiento.stockNuevo}
                  </span>
                  <span className="fecha">
                    {new Date(movimiento.fecha).toLocaleString()}
                  </span>
                </div>
                {movimiento.motivo && movimiento.motivo !== 'Sin motivo especificado' && (
                  <div className="motivo">{movimiento.motivo}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumen de productos con stock bajo */}
      <div className="inventario-resumen">
        <h3>Stock Bajo</h3>
        <div className="stock-bajo-list">
          {productos
            .filter(p => p.stock <= 5)
            .slice(0, 10)
            .map((producto) => (
              <div key={producto.id} className="stock-bajo-item">
                <span className="producto-nombre">{producto.nombre}</span>
                <span className="stock-actual">{producto.stock} unidades</span>
                <button 
                  className="btn-select"
                  onClick={() => selectProduct(producto)}
                >
                  Ajustar
                </button>
              </div>
            ))}
          {productos.filter(p => p.stock <= 5).length === 0 && (
            <p className="no-stock-bajo">No hay productos con stock bajo</p>
          )}
        </div>
      </div>

      {/* Modal de importación de productos */}
      <ImportarProductosModal 
        isOpen={showImportModal}
        onClose={handleCloseImportModal}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
};

export default Inventario;
