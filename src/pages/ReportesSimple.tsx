// src/pages/ReportesSimple.tsx - Reportes con API real
import React, { useState, useEffect } from 'react';
import './ReportesSimple.css';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../contexts/ToastContext';
import { apiClient } from '../api/client';
// import { getReporteVentasPorHora, getReporteVentasPorVendedor, ReporteVentasPorHora, ReporteVentasPorVendedor } from '../api/reports';

interface ReporteInventario {
  id: number;
  fecha: string;
  producto: string;
  tipo: string;
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  motivo: string;
  usuario: string;
  turno: string;
}

interface ReporteCaja {
  id: number;
  fecha: string;
  tipo: string;
  monto: number;
  descripcion: string;
  usuario: string;
  turno: string;
}

const ReportesSimple: React.FC = () => {
  const { isAdmin } = usePermissions();
  const { showSuccess, showError } = useToast();
  const [tipoReporte, setTipoReporte] = useState<'movimientos-inventario' | 'movimientos-caja'>('movimientos-inventario');
  const [movimientosInventario, setMovimientosInventario] = useState<ReporteInventario[]>([]);
  const [movimientosCaja, setMovimientosCaja] = useState<ReporteCaja[]>([]);
  const [loading, setLoading] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    return new Date().toISOString().split('T')[0]; // Día actual por defecto
  });

  // Cargar datos al montar el componente y cuando cambie la fecha o tipo de reporte
  useEffect(() => {
    cargarDatos();
  }, [fechaSeleccionada, tipoReporte]); // Recargar cuando cambie la fecha o tipo de reporte

  const cargarDatos = async () => {
    if (!fechaSeleccionada) return; // No cargar si no hay fecha seleccionada
    
    setLoading(true);
    try {
      if (tipoReporte === 'movimientos-inventario') {
        await cargarMovimientosInventario();
      } else if (tipoReporte === 'movimientos-caja') {
        await cargarMovimientosCaja();
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      showError('Error al cargar los datos de reportes');
    } finally {
      setLoading(false);
    }
  };

  const cargarMovimientosInventario = async () => {
    try {
      // Usar el endpoint de reportes de inventario que incluye movimientos recientes
      const response = await apiClient.get('/reportes/inventario');
      
      if (response.data && response.data.movimientosRecientes) {
        // Filtrar solo los movimientos del día seleccionado
        const movimientosDia = response.data.movimientosRecientes.filter((mov: any) => {
          const fechaMovimiento = new Date(mov.fecha || mov.createdAt).toISOString().split('T')[0];
          return fechaMovimiento === fechaSeleccionada;
        });
        
        // Mapear los datos al formato esperado por el frontend
        const movimientos = movimientosDia.map((mov: any) => ({
          id: mov.id,
          fecha: mov.fecha || mov.createdAt,
          producto: mov.producto?.nombre || 'Producto desconocido',
          tipo: mov.tipo === 'OUT' ? 'SALIDA' : mov.tipo === 'IN' ? 'ENTRADA' : 'AJUSTE',
          cantidad: mov.tipo === 'OUT' ? -Math.abs(mov.cantidad) : Math.abs(mov.cantidad),
          stockAnterior: mov.stockAnterior || 0,
          stockNuevo: mov.stockNuevo || 0,
          motivo: mov.motivo || 'Sin motivo especificado',
          usuario: mov.usuario?.fullName || 'Usuario desconocido',
          turno: mov.turno || 'N/A'
        }));
        setMovimientosInventario(movimientos);
      } else {
        setMovimientosInventario([]);
      }
    } catch (error) {
      console.error('Error cargando movimientos de inventario:', error);
      setMovimientosInventario([]);
      showError('Error al cargar movimientos de inventario');
    }
  };

  const cargarMovimientosCaja = async () => {
    try {
      // Usar el endpoint de cash-movement con filtro de fecha única
      const params = new URLSearchParams();
      if (fechaSeleccionada) {
        params.append('desde', fechaSeleccionada);
        params.append('hasta', fechaSeleccionada);
      }
      
      const response = await apiClient.get(`/cash-movement?${params.toString()}`);
      
      if (response.data) {
        // Si es array directo o tiene data
        const data = Array.isArray(response.data) ? response.data : response.data.data || [];
        
        // Filtrar solo los movimientos del día seleccionado
        const movimientosDia = data.filter((mov: any) => {
          const fechaMovimiento = new Date(mov.createdAt || mov.fecha).toISOString().split('T')[0];
          return fechaMovimiento === fechaSeleccionada;
        });
        
        // Mapear los datos al formato esperado por el frontend
        const movimientos = movimientosDia.map((mov: any) => ({
          id: mov.id,
          fecha: mov.createdAt || mov.fecha,
          tipo: mov.tipo === 'IN' ? 'INGRESO' : 'EGRESO',
          monto: parseFloat(mov.monto) || 0,
          descripcion: mov.descripcion || mov.observaciones || 'Sin descripción',
          usuario: mov.usuario?.fullName || 'Usuario desconocido',
          turno: mov.turnoCaja ? `Turno #${mov.turnoCaja.id}` : 'N/A'
        }));
        setMovimientosCaja(movimientos);
      } else {
        setMovimientosCaja([]);
      }
    } catch (error) {
      console.error('Error cargando movimientos de caja:', error);
      setMovimientosCaja([]);
      showError('Error al cargar movimientos de caja');
    }
  };

  const generarReporte = async () => {
    setLoading(true);
    try {
      // Validar fecha seleccionada
      if (!fechaSeleccionada) {
        showError('Por favor selecciona una fecha');
        return;
      }

      if (tipoReporte === 'movimientos-inventario') {
        await cargarMovimientosInventario();
      } else if (tipoReporte === 'movimientos-caja') {
        await cargarMovimientosCaja();
      }
      
      const fechaFormateada = new Date(fechaSeleccionada).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      showSuccess(`Reporte del ${fechaFormateada} generado exitosamente`);
    } catch (error) {
      console.error('Error generando reporte:', error);
      showError('Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  // Verificar permisos
  if (!isAdmin()) {
    return (
      <div className="reportes-no-permission">
        <h2>Acceso Denegado</h2>
        <p>Solo los administradores pueden ver los reportes.</p>
      </div>
    );
  }

  return (
    <div className="reportes-page">
      <h1 className="reportes-title">Reportes de Movimientos</h1>

      {/* Filtros */}
      <div className="reportes-filtros">
        <h2>Configuración de Reporte</h2>
        <div className="filtros-container">
          <div className="filtro-grupo">
            <label htmlFor="tipoReporte">Tipo de Reporte</label>
            <select
              id="tipoReporte"
              value={tipoReporte}
              onChange={(e) => setTipoReporte(e.target.value as any)}
            >
              <option value="movimientos-inventario">Movimientos de Inventario</option>
              <option value="movimientos-caja">Movimientos de Caja</option>
            </select>
          </div>
          
          <div className="filtro-grupo">
            <label htmlFor="fechaSeleccionada">📅 Fecha a Consultar {loading && <span style={{color: '#059669'}}>🔄</span>}</label>
            <input
              type="date"
              id="fechaSeleccionada"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              max={new Date().toISOString().split('T')[0]} // No permitir fechas futuras
              disabled={loading}
            />
          </div>
          
          <div className="filtro-grupo">
            <button 
              onClick={() => setFechaSeleccionada(new Date().toISOString().split('T')[0])}
              className="btn-hoy"
              type="button"
            >
              📅 Hoy
            </button>
          </div>
          
          <div className="filtro-grupo">
            <button 
              onClick={cargarDatos}
              disabled={loading}
              className="btn-generar"
            >
              {loading ? 'Cargando...' : '🔄 Actualizar'}
            </button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="reportes-resultados">
        {tipoReporte === 'movimientos-inventario' && (
          <div className="reporte-movimientos-inventario">
            <h3>Movimientos de Inventario - {new Date(fechaSeleccionada).toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}</h3>
            <div className="tabla-container">
              <table className="reportes-tabla">
                <thead>
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Producto</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Stock Anterior</th>
                    <th>Stock Nuevo</th>
                    <th>Motivo</th>
                    <th>Usuario</th>
                    <th>Turno</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientosInventario.map((movimiento) => (
                    <tr key={movimiento.id}>
                      <td>{new Date(movimiento.fecha).toLocaleString('es-MX')}</td>
                      <td>{movimiento.producto}</td>
                      <td>
                        <span className={`tipo-movimiento ${movimiento.tipo.toLowerCase()}`}>
                          {movimiento.tipo === 'ENTRADA' ? '📦 ENTRADA' : 
                           movimiento.tipo === 'SALIDA' ? '📤 SALIDA' : 
                           '⚙️ AJUSTE'}
                        </span>
                      </td>
                      <td className={`cantidad ${movimiento.cantidad < 0 ? 'negativo' : 'positivo'}`}>
                        {movimiento.cantidad > 0 ? '+' : ''}{movimiento.cantidad}
                      </td>
                      <td className="text-center">{movimiento.stockAnterior}</td>
                      <td className="text-center">{movimiento.stockNuevo}</td>
                      <td>{movimiento.motivo}</td>
                      <td>{movimiento.usuario}</td>
                      <td className="turno-info">{movimiento.turno}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {movimientosInventario.length === 0 && !loading && (
              <div className="text-center" style={{ padding: '2rem', color: '#6b7280' }}>
                <p>📦 No se registraron movimientos de inventario el {new Date(fechaSeleccionada).toLocaleDateString('es-MX')}.</p>
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Intenta seleccionar otra fecha o verifica que haya habido actividad.</p>
              </div>
            )}
          </div>
        )}

        {tipoReporte === 'movimientos-caja' && (
          <div className="reporte-movimientos-caja">
            <h3>💰 Registro de Movimientos de Caja - {new Date(fechaSeleccionada).toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'long',
              day: 'numeric', 
              weekday: 'long'
            })}</h3>
            
            {/* Resumen del Día */}
            <div style={{background: '#eff6ff', padding: '12px', borderRadius: '6px', marginBottom: '1rem', border: '1px solid #dbeafe'}}>
              <p style={{margin: 0, color: '#1e40af', fontSize: '0.875rem'}}>
                ℹ️ <strong>Reporte de Solo Lectura:</strong> Este registro muestra todas las entradas y salidas de dinero registradas en el sistema.
                Los movimientos se generan automáticamente desde las ventas y otros módulos del sistema.
              </p>
            </div>            <div className="resumen-movimientos">
              <div className="resumen-item ingreso">
                <span className="label">📈 Total Ingresos del Día:</span>
                <span className="valor">
                  ${movimientosCaja
                    .filter(m => m.tipo === 'INGRESO')
                    .reduce((sum, m) => sum + m.monto, 0)
                    .toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="resumen-item egreso">
                <span className="label">📉 Total Egresos del Día:</span>
                <span className="valor">
                  ${movimientosCaja
                    .filter(m => m.tipo === 'EGRESO')
                    .reduce((sum, m) => sum + m.monto, 0)
                    .toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="resumen-item neto">
                <span className="label">💰 Balance Neto del Día:</span>
                <span className="valor">
                  ${(movimientosCaja
                    .filter(m => m.tipo === 'INGRESO')
                    .reduce((sum, m) => sum + m.monto, 0) -
                    movimientosCaja
                    .filter(m => m.tipo === 'EGRESO')
                    .reduce((sum, m) => sum + m.monto, 0)
                  ).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="resumen-item" style={{borderLeftColor: '#6b7280', background: '#f9fafb'}}>
                <span className="label">📊 Total de Movimientos:</span>
                <span className="valor" style={{color: '#6b7280'}}>
                  {movimientosCaja.length} registros
                </span>
              </div>
            </div>

            {/* Tabla */}
            <div className="tabla-container">
              <table className="reportes-tabla">
                <thead>
                  <tr>
                    <th>🕑 Fecha y Hora</th>
                    <th>💵 Tipo de Movimiento</th>
                    <th>💰 Monto</th>
                    <th>📝 Descripción/Motivo</th>
                    <th>👤 Usuario Responsable</th>
                    <th>🏢 Turno de Caja</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientosCaja.map((movimiento) => (
                    <tr key={movimiento.id}>
                      <td style={{fontFamily: 'monospace'}}>
                        {new Date(movimiento.fecha).toLocaleString('es-MX', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td>
                        <span className={`tipo-movimiento ${movimiento.tipo.toLowerCase()}`}>
                          {movimiento.tipo === 'INGRESO' ? '📈 ENTRADA DE DINERO' : '📉 SALIDA DE DINERO'}
                        </span>
                      </td>
                      <td className={`valor-monetario ${movimiento.tipo.toLowerCase()}`} style={{fontFamily: 'monospace', fontSize: '1rem'}}>
                        {movimiento.tipo === 'INGRESO' ? '+' : '-'}${movimiento.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{maxWidth: '200px', wordWrap: 'break-word'}}>
                        {movimiento.descripcion || 'Sin descripción especificada'}
                      </td>
                      <td>
                        <strong>{movimiento.usuario}</strong>
                      </td>
                      <td className="turno-info">
                        {movimiento.turno}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {loading && (
          <div className="text-center" style={{ padding: '2rem' }}>
            <p>Cargando reporte...</p>
          </div>
        )}

        {tipoReporte === 'movimientos-caja' && movimientosCaja.length === 0 && !loading && (
          <div className="text-center" style={{ padding: '2rem', color: '#6b7280' }}>
            <p>💰 No se registraron movimientos de caja el {new Date(fechaSeleccionada).toLocaleDateString('es-MX')}.</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Intenta seleccionar otra fecha o verifica que haya habido actividad de caja.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportesSimple;

