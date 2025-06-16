// src/pages/Venta.tsx - Con sistema de permisos
import React, { useState, createContext, useContext } from 'react';
import './Venta.css';
import CobroModal from '../components/modals/CobroModal';
import { ProtectedComponent, ProtectedButton } from '../components/auth/ProtectedComponent';
import { usePermissions } from '../hooks/usePermissions';
import { ALL_PERMISSIONS } from '../types/permissions';
import '../components/auth/ProtectedComponent.css';

// Context para compartir el estado de venta con App.tsx
export const VentaContext = createContext<{
  total: number;
  showCobroModal: boolean;
  openCobroModal: () => void;
  closeCobroModal: () => void;
  confirmarVenta: () => void;
} | null>(null);

export const useVentaContext = () => {
  const context = useContext(VentaContext);
  if (!context) {
    throw new Error('useVentaContext debe usarse dentro de VentaProvider');
  }
  return context;
};

interface VentaItem {
  id: number;
  nombre: string;
  precio: number;
  precioCosto?: number;  // Precio de costo (opcional)
  cantidad: number;
  subtotal: number;
  descuentoAplicado?: number; // Descuento aplicado
}

const Venta: React.FC = () => {
  const { hasPermission } = usePermissions();
  
  const [items, setItems] = useState<VentaItem[]>([
    {
      id: 1,
      nombre: 'Ejemplo Producto',
      precio: 10.00,
      precioCosto: 7.50, // Solo visible si tiene permisos
      cantidad: 1,
      subtotal: 10.00,
      descuentoAplicado: 0
    }
  ]);
  const [showCobroModal, setShowCobroModal] = useState(false);
  
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  
  // Escuchar evento F12 desde App.tsx
  React.useEffect(() => {
    const handleOpenCobroModal = () => {
      if (items.length > 0) {
        setShowCobroModal(true);
      }
    };
    
    window.addEventListener('openCobroModal', handleOpenCobroModal);
    return () => {
      window.removeEventListener('openCobroModal', handleOpenCobroModal);
    };
  }, [items.length]);
  
  const openCobroModal = () => {
    if (items.length > 0) {
      setShowCobroModal(true);
    }
  };
  
  const closeCobroModal = () => {
    setShowCobroModal(false);
  };
  
  const confirmarVenta = () => {
    // Aquí iría la lógica para procesar la venta
    console.log('Venta procesada:', { items, total });
    setItems([]); // Limpiar carrito
    setShowCobroModal(false);
    alert('¡Venta procesada exitosamente!');
  };
  
  const eliminarItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };
  
  const aplicarDescuento = (id: number, descuento: number) => {
    if (!hasPermission(ALL_PERMISSIONS.VENTAS_APLICAR_DESCUENTO)) {
      alert('No tienes permisos para aplicar descuentos');
      return;
    }
    
    setItems(items.map(item => {
      if (item.id === id) {
        const nuevoPrecio = item.precio * (1 - descuento / 100);
        return {
          ...item,
          precio: nuevoPrecio,
          subtotal: nuevoPrecio * item.cantidad,
          descuentoAplicado: descuento
        };
      }
      return item;
    }));
  };
  
  const calcularMargen = (item: VentaItem): number => {
    if (!item.precioCosto || !hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_COSTO)) {
      return 0;
    }
    return ((item.precio - item.precioCosto) / item.precioCosto) * 100;
  };
  
  // Proveemos el contexto para que App.tsx pueda acceder
  const ventaContextValue = {
    total,
    showCobroModal,
    openCobroModal,
    closeCobroModal,
    confirmarVenta
  };

  return (
    <VentaContext.Provider value={ventaContextValue}>
      <div className="venta-page">
        <h1>Ventas</h1>
        <div className="venta-search">
          <input
            type="text"
            placeholder="Buscar producto o escanear código de barras"
          />
          <button>Agregar</button>
        </div>
        <div className="venta-table-container">
          <table className="venta-table">
            <thead>
              <tr>
                <th>Producto</th>
                {/* Columna de costo solo visible con permisos */}
                <ProtectedComponent permission={ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_COSTO}>
                  <th className="text-right">Costo</th>
                </ProtectedComponent>
                <th className="text-right">Precio</th>
                {/* Columna de margen solo visible con permisos */}
                <ProtectedComponent permission={ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_COSTO}>
                  <th className="text-right">Margen %</th>
                </ProtectedComponent>
                <th className="text-center">Cantidad</th>
                <th className="text-right">Subtotal</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="product-info">
                      <span className="product-name">{item.nombre}</span>
                      {item.descuentoAplicado && item.descuentoAplicado > 0 && (
                        <span className="discount-badge">-{item.descuentoAplicado}%</span>
                      )}
                    </div>
                  </td>
                  
                  {/* Precio de costo - Solo visible con permisos */}
                  <ProtectedComponent permission={ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_COSTO}>
                    <td className="text-right cost-price">
                      {item.precioCosto ? `$${item.precioCosto.toFixed(2)}` : 'N/A'}
                    </td>
                  </ProtectedComponent>
                  
                  <td className="text-right">
                    <span className={item.descuentoAplicado && item.descuentoAplicado > 0 ? 'discounted-price' : ''}>
                      ${item.precio.toFixed(2)}
                    </span>
                  </td>
                  
                  {/* Margen - Solo visible con permisos */}
                  <ProtectedComponent permission={ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_COSTO}>
                    <td className="text-right margin-info">
                      {item.precioCosto ? (
                        <span className={calcularMargen(item) > 50 ? 'high-margin' : calcularMargen(item) > 20 ? 'medium-margin' : 'low-margin'}>
                          {calcularMargen(item).toFixed(1)}%
                        </span>
                      ) : 'N/A'}
                    </td>
                  </ProtectedComponent>
                  
                  <td className="text-center">{item.cantidad}</td>
                  <td className="text-right font-bold">${item.subtotal.toFixed(2)}</td>
                  <td className="text-center">
                    <div className="action-buttons">
                      {/* Botón de descuento - Solo con permisos */}
                      <ProtectedButton
                        permission={ALL_PERMISSIONS.VENTAS_APLICAR_DESCUENTO}
                        className="discount-btn"
                        onClick={() => {
                          const descuento = prompt('Ingrese el porcentaje de descuento (0-100):');
                          if (descuento && !isNaN(Number(descuento))) {
                            aplicarDescuento(item.id, Number(descuento));
                          }
                        }}
                      >
                        % Desc
                      </ProtectedButton>
                      
                      <button 
                        className="delete-btn" 
                        onClick={() => eliminarItem(item.id)}
                      >
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_COSTO) ? 7 : 5} className="text-center text-gray-500">
                    No hay productos en el carrito
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="venta-summary">
          <span className="venta-total">
            Total: <span className="amount">${total.toFixed(2)}</span>
          </span>
          {/* Botón procesar venta - Solo con permisos */}
          <ProtectedButton
            permission={ALL_PERMISSIONS.VENTAS_CREAR}
            className="venta-process-button"
            onClick={openCobroModal}
            disabled={items.length === 0}
            fallback={
              <div className="permission-error">
                <span className="error-text">No tienes permisos para procesar ventas</span>
              </div>
            }
          >
            Procesar Venta [F12]
          </ProtectedButton>
        </div>
        
        <CobroModal
          isOpen={showCobroModal}
          total={total}
          onConfirm={confirmarVenta}
          onCancel={closeCobroModal}
        />
      </div>
    </VentaContext.Provider>
  );
};

export default Venta;
