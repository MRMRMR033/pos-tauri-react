// src/pages/Productos.tsx
import React, { useState, FormEvent, ChangeEvent } from 'react';
import './Productos.css';

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

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: enviar form a la API
    console.log('Guardar producto', form);
  };

  return (
    <div className="producto-page">
      <h1 className="producto-title">Agregar Producto</h1>
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

        <div className="form-group">
          <label htmlFor="precioCosto">Precio de Costo</label>
          <input
            id="precioCosto"
            name="precioCosto"
            type="number"
            step="0.01"
            value={form.precioCosto}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="precioVenta">Precio de Venta</label>
          <input
            id="precioVenta"
            name="precioVenta"
            type="number"
            step="0.01"
            value={form.precioVenta}
            onChange={handleChange}
            required
          />
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
            {/* Opciones dinámicas desde tu API */}
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
            {/* Opciones dinámicas desde tu API */}
          </select>
        </div>

        <button type="submit" className="producto-submit">
          Guardar Producto
        </button>
      </form>
    </div>
  );
};

export default Productos;
