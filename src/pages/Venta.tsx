// src/pages/Venta.tsx
import React, { useState, createContext, useContext } from 'react';
import './Venta.css';
import CobroModal from '../components/modals/CobroModal';

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
  cantidad: number;
  subtotal: number;
}

const Venta: React.FC = () => {
  const [items, setItems] = useState<VentaItem[]>([
    {
      id: 1,
      nombre: 'Ejemplo Producto',
      precio: 10.00,
      cantidad: 1,
      subtotal: 10.00
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
                <th className="text-right">Precio</th>
                <th className="text-center">Cantidad</th>
                <th className="text-right">Subtotal</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.nombre}</td>
                  <td className="text-right">${item.precio.toFixed(2)}</td>
                  <td className="text-center">{item.cantidad}</td>
                  <td className="text-right">${item.subtotal.toFixed(2)}</td>
                  <td className="text-center">
                    <button 
                      className="text-red-600" 
                      onClick={() => eliminarItem(item.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-500">
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
          <button 
            className="venta-process-button" 
            onClick={openCobroModal}
            disabled={items.length === 0}
          >
            Procesar Venta
          </button>
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
