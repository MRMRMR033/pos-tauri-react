// Test simple para verificar los nuevos reportes
import React, { useState } from 'react';

const ReportesTest: React.FC = () => {
  const [tipoReporte, setTipoReporte] = useState<'movimientos-inventario' | 'movimientos-caja'>('movimientos-inventario');
  const [datos, setDatos] = useState<any[]>([]);

  const movimientosInventario = [
    {
      id: 1,
      fecha: '2025-06-20T10:30:00Z',
      producto: 'Coca Cola 600ml',
      tipo: 'AJUSTE',
      cantidad: -5,
      stockAnterior: 50,
      stockNuevo: 45,
      motivo: 'Productos vencidos',
      usuario: 'Juan Pérez',
      turno: 'Turno 1 - 09:00-17:00'
    },
    {
      id: 2,
      fecha: '2025-06-20T14:15:00Z',
      producto: 'Pepsi 500ml',
      tipo: 'AJUSTE',
      cantidad: 10,
      stockAnterior: 20,
      stockNuevo: 30,
      motivo: 'Reconteo de inventario',
      usuario: 'María García',
      turno: 'Turno 2 - 14:00-22:00'
    }
  ];

  const movimientosCaja = [
    {
      id: 1,
      fecha: '2025-06-20T09:15:00Z',
      tipo: 'EGRESO',
      monto: 200.00,
      descripcion: 'Gastos de limpieza',
      usuario: 'Juan Pérez',
      turno: 'Turno 1 - 09:00-17:00'
    },
    {
      id: 2,
      fecha: '2025-06-20T15:20:00Z',
      tipo: 'INGRESO',
      monto: 100.00,
      descripcion: 'Pago extra',
      usuario: 'María García',
      turno: 'Turno 2 - 14:00-22:00'
    }
  ];

  const generarReporte = () => {
    if (tipoReporte === 'movimientos-inventario') {
      setDatos(movimientosInventario);
    } else {
      setDatos(movimientosCaja);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test de Reportes</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <select value={tipoReporte} onChange={(e) => setTipoReporte(e.target.value as any)}>
          <option value="movimientos-inventario">Movimientos de Inventario</option>
          <option value="movimientos-caja">Movimientos de Caja</option>
        </select>
        <button onClick={generarReporte} style={{ marginLeft: '10px' }}>
          Generar Reporte
        </button>
      </div>

      {datos.length > 0 && (
        <div>
          <h3>{tipoReporte === 'movimientos-inventario' ? 'Movimientos de Inventario' : 'Movimientos de Caja'}</h3>
          <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {tipoReporte === 'movimientos-inventario' ? (
                  <>
                    <th>Fecha</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Motivo</th>
                    <th>Usuario</th>
                  </>
                ) : (
                  <>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Monto</th>
                    <th>Descripción</th>
                    <th>Usuario</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {datos.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.fecha).toLocaleString()}</td>
                  {tipoReporte === 'movimientos-inventario' ? (
                    <>
                      <td>{item.producto}</td>
                      <td>{item.cantidad}</td>
                      <td>{item.motivo}</td>
                      <td>{item.usuario}</td>
                    </>
                  ) : (
                    <>
                      <td>{item.tipo}</td>
                      <td>${item.monto}</td>
                      <td>{item.descripcion}</td>
                      <td>{item.usuario}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReportesTest;