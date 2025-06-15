// src/pages/Venta.tsx
import React from 'react';
import './Venta.css';

const Venta: React.FC = () => {
  return (
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
            <tr>
              <td>Ejemplo Producto</td>
              <td className="text-right">$10.00</td>
              <td className="text-center">1</td>
              <td className="text-right">$10.00</td>
              <td className="text-center">
                <button className="text-red-600">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="venta-summary">
        <span className="venta-total">
          Total: <span className="amount">$0.00</span>
        </span>
        <button className="venta-process-button">Procesar Venta</button>
      </div>
    </div>
  );
};

export default Venta;
