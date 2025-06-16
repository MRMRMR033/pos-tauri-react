// src/pages/Inventario.tsx
import React, { useState, ChangeEvent, FormEvent } from 'react';
import './Inventario.css';

interface MovimientoForm {
  cantidad: string;
  tipo: 'entrada' | 'salida';
}

const Inventario: React.FC = () => {
  const [barcode, setBarcode] = useState<string>('');
  const [producto, setProducto] = useState<{ nombre: string; stock: number } | null>(null);
  const [form, setForm] = useState<MovimientoForm>({
    cantidad: '',
    tipo: 'entrada',
  });

  const handleBarcodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setBarcode(e.target.value);
  };

  const handleBarcodeSearch = () => {
    // TODO: fetch(`/producto/codigo/${barcode}`) → setProducto(...)
    console.log('Buscar producto por código:', barcode);
    // Ejemplo estático:
    setProducto({ nombre: 'Ejemplo Producto', stock: 25 });
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log('Registrar movimiento de inventario:', producto, form);
    // TODO: enviar a tu API
  };

  return (
    <div className="inventario-page">
      <h1 className="inventario-title">Gestión de Inventario</h1>

      {/* Búsqueda por código de barras */}
      <div className="inventario-search">
        <input
          type="text"
          placeholder="Introduce o escanea código de barras"
          value={barcode}
          onChange={handleBarcodeChange}
        />
        <button onClick={handleBarcodeSearch}>Buscar</button>
      </div>

      {/* Si encontramos el producto, mostramos su info y formulario */}
      {producto && (
        <>
          <div className="inventario-producto-info">
            <strong>Producto:</strong> {producto.nombre} &nbsp;|&nbsp;
            <strong>Stock actual:</strong> {producto.stock}
          </div>

          <form className="inventario-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="cantidad">Cantidad</label>
              <input
                id="cantidad"
                name="cantidad"
                type="number"
                value={form.cantidad}
                onChange={handleChange}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="tipo">Tipo de Movimiento</label>
              <select
                id="tipo"
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                required
              >
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
              </select>
            </div>

            <button type="submit" className="inventario-submit">
              Registrar Movimiento
            </button>
          </form>
        </>
      )}

      {/* Tabla de últimos movimientos */}
      <div className="inventario-table-container">
        <table className="inventario-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th className="text-center">Stock Actual</th>
              <th className="text-center">Último Movimiento</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Ejemplo Producto</td>
              <td className="text-center">25</td>
              <td className="text-center">Entrada +10</td>
            </tr>
            {/* Más filas dinámicas */}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventario;
