// src/pages/Reportes.tsx - Vista de reportes y estadísticas con API real
import React, { useState, useEffect } from 'react';
import './Reportes.css';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../contexts/ToastContext';
import { ProtectedComponent } from '../components/auth/ProtectedComponent';
import { ALL_PERMISSIONS } from '../types/permissions';
import {
  getEstadisticasGenerales,
  getReporteVentas,
  getProductosTop,
  getReporteInventario,
  exportarReporte,
  type EstadisticasGenerales,
  type ReporteVentas,
  type ProductoTop,
  type ReporteInventario,
  type FiltrosReporte
} from '../api/reports';

// Funciones temporales para movimientos (las implementaremos)
const getMovimientosInventario = async (filtros: FiltrosReporte, token: string) => {
  // Simulación de datos - reemplazar con API real
  return [
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
    },
    {
      id: 3,
      fecha: '2025-06-20T16:45:00Z',
      producto: 'Doritos Nacho',
      tipo: 'AJUSTE',
      cantidad: -2,
      stockAnterior: 15,
      stockNuevo: 13,
      motivo: 'Producto dañado',
      usuario: 'Carlos López',
      turno: 'Turno 2 - 14:00-22:00'
    }
  ];
};

const getMovimientosCaja = async (filtros: FiltrosReporte, token: string) => {
  // Simulación de datos - reemplazar con API real
  return [
    {
      id: 1,
      fecha: '2025-06-20T09:15:00Z',
      tipo: 'EGRESO',
      monto: 200.00,
      descripcion: 'Gastos de limpieza',
      usuario: 'Juan Pérez',
      turno: 'Turno 1 - 09:00-17:00',
      turnoId: 1
    },
    {
      id: 2,
      fecha: '2025-06-20T11:30:00Z',
      tipo: 'EGRESO',
      monto: 50.00,
      descripcion: 'Cambio para cliente',
      usuario: 'Juan Pérez',
      turno: 'Turno 1 - 09:00-17:00',
      turnoId: 1
    },
    {
      id: 3,
      fecha: '2025-06-20T15:20:00Z',
      tipo: 'INGRESO',
      monto: 100.00,
      descripcion: 'Pago de cliente en efectivo extra',
      usuario: 'María García',
      turno: 'Turno 2 - 14:00-22:00',
      turnoId: 2
    },
    {
      id: 4,
      fecha: '2025-06-20T17:45:00Z',
      tipo: 'EGRESO',
      monto: 75.00,
      descripcion: 'Gastos de transporte',
      usuario: 'María García',
      turno: 'Turno 2 - 14:00-22:00',
      turnoId: 2
    }
  ];
};

const Reportes: React.FC = () => {
  const { hasPermission, isAdmin, accessToken } = usePermissions();
  const { showSuccess, showError } = useToast();
  
  // Estados
  const [fechaInicio, setFechaInicio] = useState(() => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 30); // Últimos 30 días por defecto
    return fecha.toISOString().split('T')[0];
  });
  
  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const [tipoReporte, setTipoReporte] = useState<'ventas' | 'productos' | 'inventario' | 'movimientos-inventario' | 'movimientos-caja'>('movimientos-inventario');
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Estados para datos de la API
  const [estadisticasGenerales, setEstadisticasGenerales] = useState<EstadisticasGenerales | null>(null);
  const [reporteVentas, setReporteVentas] = useState<ReporteVentas[]>([]);
  const [productosTop, setProductosTop] = useState<ProductoTop[]>([]);
  const [reporteInventario, setReporteInventario] = useState<ReporteInventario | null>(null);
  const [movimientosInventario, setMovimientosInventario] = useState<any[]>([]);
  const [movimientosCaja, setMovimientosCaja] = useState<any[]>([]);

  // Cargar estadísticas generales al montar el componente
  useEffect(() => {
    cargarEstadisticasGenerales();
    // Cargar datos de ejemplo para los movimientos
    cargarDatosEjemplo();
  }, [accessToken]);

  const cargarDatosEjemplo = async () => {
    // Cargar datos de ejemplo para movimientos de inventario
    const movInventario = await getMovimientosInventario({
      fechaInicio: fechaInicio,
      fechaFin: fechaFin,
      tipoReporte: 'movimientos-inventario'
    }, accessToken || '');
    setMovimientosInventario(movInventario);

    // Cargar datos de ejemplo para movimientos de caja
    const movCaja = await getMovimientosCaja({
      fechaInicio: fechaInicio,
      fechaFin: fechaFin,
      tipoReporte: 'movimientos-caja'
    }, accessToken || '');
    setMovimientosCaja(movCaja);
  };

  const cargarEstadisticasGenerales = async () => {
    try {
      setLoadingStats(true);
      const stats = await getEstadisticasGenerales(accessToken || undefined);
      setEstadisticasGenerales(stats);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      showError('Error al cargar las estadísticas generales');
    } finally {
      setLoadingStats(false);
    }
  };

  const generarReporte = async () => {
    if (!accessToken) {
      showError('No hay token de autenticación');
      return;
    }

    setLoading(true);
    try {
      const filtros: FiltrosReporte = {
        fechaInicio,
        fechaFin,
        tipoReporte
      };

      switch (tipoReporte) {
        case 'ventas':
          const ventasData = await getReporteVentas(filtros, accessToken);
          setReporteVentas(ventasData);
          break;
        
        case 'productos':
          const productosData = await getProductosTop(filtros, accessToken);
          setProductosTop(productosData);
          break;
        
        case 'inventario':
          const inventarioData = await getReporteInventario(accessToken);
          setReporteInventario(inventarioData);
          break;
          
        case 'movimientos-inventario':
          const movInventarioData = await getMovimientosInventario(filtros, accessToken);
          setMovimientosInventario(movInventarioData);
          break;
          
        case 'movimientos-caja':
          const movCajaData = await getMovimientosCaja(filtros, accessToken);
          setMovimientosCaja(movCajaData);
          break;
      }
      
      showSuccess(`Reporte de ${tipoReporte} generado exitosamente`);
    } catch (error) {
      console.error('Error generando reporte:', error);
      showError(`Error al generar el reporte de ${tipoReporte}`);
    } finally {
      setLoading(false);
    }
  };

  const exportarReporteHandler = async (formato: 'excel' | 'pdf') => {
    try {
      const filtros: FiltrosReporte = {
        fechaInicio,
        fechaFin,
        tipoReporte
      };
      
      // Por ahora mostrar mensaje ya que la función de exportación no está implementada
      showError('Función de exportación en desarrollo');
      // await exportarReporte(tipoReporte, formato, filtros, accessToken || undefined);
    } catch (error) {
      console.error('Error exportando reporte:', error);
      showError(`Error al exportar el reporte en formato ${formato.toUpperCase()}`);
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
      <h1 className="reportes-title">Reportes y Estadísticas</h1>

      {/* Estadísticas generales */}
      <div className="estadisticas-grid">
        {loadingStats ? (
          // Skeleton loading
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="estadistica-card loading">
              <div className="estadistica-icon">⏳</div>
              <div className="estadistica-info">
                <h3>Cargando...</h3>
                <span className="estadistica-valor">--</span>
              </div>
            </div>
          ))
        ) : estadisticasGenerales ? (
          <>
            <div className="estadistica-card ventas-hoy">
              <div className="estadistica-icon">📊</div>
              <div className="estadistica-info">
                <h3>Ventas Hoy</h3>
                <span className="estadistica-valor">${estadisticasGenerales.ventasHoy.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="estadistica-card ventas-semana">
              <div className="estadistica-icon">📈</div>
              <div className="estadistica-info">
                <h3>Ventas Semana</h3>
                <span className="estadistica-valor">${estadisticasGenerales.ventasSemana.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="estadistica-card ventas-mes">
              <div className="estadistica-icon">💰</div>
              <div className="estadistica-info">
                <h3>Ventas Mes</h3>
                <span className="estadistica-valor">${estadisticasGenerales.ventasMes.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="estadistica-card productos">
              <div className="estadistica-icon">📦</div>
              <div className="estadistica-info">
                <h3>Productos Activos</h3>
                <span className="estadistica-valor">{estadisticasGenerales.productosActivos}</span>
              </div>
            </div>
            
            <div className="estadistica-card stock-bajo">
              <div className="estadistica-icon">⚠️</div>
              <div className="estadistica-info">
                <h3>Stock Bajo</h3>
                <span className="estadistica-valor alerta">{estadisticasGenerales.stockBajo}</span>
              </div>
            </div>
            
            <div className="estadistica-card usuarios">
              <div className="estadistica-icon">👥</div>
              <div className="estadistica-info">
                <h3>Usuarios Activos</h3>
                <span className="estadistica-valor">{estadisticasGenerales.usuariosActivos}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="estadistica-card error">
            <div className="estadistica-icon">❌</div>
            <div className="estadistica-info">
              <h3>Error</h3>
              <span className="estadistica-valor">No se pudieron cargar las estadísticas</span>
            </div>
          </div>
        )}
      </div>

      {/* Filtros de reportes */}
      <div className="reportes-filtros">
        <h2>Generar Reporte Detallado</h2>
        
        <div className="filtros-container">
          <div className="filtro-grupo">
            <label htmlFor="tipoReporte">Tipo de Reporte</label>
            <select
              id="tipoReporte"
              value={tipoReporte}
              onChange={(e) => setTipoReporte(e.target.value as any)}
            >
              <option value="ventas">Reporte de Ventas</option>
              <option value="productos">Productos Más Vendidos</option>
              <option value="inventario">Estado de Inventario</option>
              <option value="movimientos-inventario">Movimientos de Inventario</option>
              <option value="movimientos-caja">Movimientos de Caja</option>
            </select>
          </div>
          
          <div className="filtro-grupo">
            <label htmlFor="fechaInicio">Fecha Inicio</label>
            <input
              type="date"
              id="fechaInicio"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          
          <div className="filtro-grupo">
            <label htmlFor="fechaFin">Fecha Fin</label>
            <input
              type="date"
              id="fechaFin"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
          
          <div className="filtros-acciones">
            <button 
              className="btn-generar"
              onClick={generarReporte}
              disabled={loading}
            >
              {loading ? 'Generando...' : 'Generar Reporte'}
            </button>
            
            <button 
              className="btn-exportar excel"
              onClick={() => exportarReporteHandler('excel')}
              disabled={loading}
            >
              📊 Excel
            </button>
            
            <button 
              className="btn-exportar pdf"
              onClick={() => exportarReporteHandler('pdf')}
              disabled={loading}
            >
              📄 PDF
            </button>
          </div>
        </div>
      </div>

      {/* Resultados del reporte */}
      <div className="reportes-resultados">
        {tipoReporte === 'ventas' && (
          <div className="reporte-ventas">
            <h3>Reporte de Ventas</h3>
            {reporteVentas.length > 0 ? (
              <div className="tabla-container">
                <table className="reportes-tabla">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Total Ventas</th>
                      <th>Cantidad Ventas</th>
                      <th>Ticket Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporteVentas.map((venta, index) => (
                      <tr key={index}>
                        <td>{new Date(venta.fecha).toLocaleDateString()}</td>
                        <td className="valor-monetario">${venta.totalVentas.toLocaleString()}</td>
                        <td className="text-center">{venta.cantidadVentas}</td>
                        <td className="valor-monetario">${venta.ticketPromedio.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="total-row">
                      <td><strong>TOTAL</strong></td>
                      <td className="valor-monetario">
                        <strong>${reporteVentas.reduce((sum, v) => sum + v.totalVentas, 0).toLocaleString()}</strong>
                      </td>
                      <td className="text-center">
                        <strong>{reporteVentas.reduce((sum, v) => sum + v.cantidadVentas, 0)}</strong>
                      </td>
                      <td className="valor-monetario">
                        <strong>${reporteVentas.length > 0 ? (reporteVentas.reduce((sum, v) => sum + v.ticketPromedio, 0) / reporteVentas.length).toFixed(2) : '0.00'}</strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="no-data">
                <p>No hay datos de ventas para el período seleccionado. Genera un reporte para ver los resultados.</p>
              </div>
            )}
          </div>
        )}

        {tipoReporte === 'productos' && (
          <div className="reporte-productos">
            <h3>Productos Más Vendidos</h3>
            {productosTop.length > 0 ? (
              <div className="tabla-container">
                <table className="reportes-tabla">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad Vendida</th>
                      <th>Ingreso Total</th>
                      <th>Promedio por Unidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosTop.map((producto, index) => (
                      <tr key={producto.id}>
                        <td>
                          <div className="producto-info">
                            <span className="ranking">#{index + 1}</span>
                            <span className="nombre">{producto.nombre}</span>
                          </div>
                        </td>
                        <td className="text-center">{producto.cantidadVendida}</td>
                        <td className="valor-monetario">${producto.ingresoTotal.toLocaleString()}</td>
                        <td className="valor-monetario">
                          ${(producto.ingresoTotal / producto.cantidadVendida).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-data">
                <p>No hay datos de productos vendidos para el período seleccionado. Genera un reporte para ver los resultados.</p>
              </div>
            )}
          </div>
        )}

        {tipoReporte === 'inventario' && (
          <div className="reporte-inventario">
            <h3>Estado del Inventario</h3>
            {reporteInventario ? (
              <>
                <div className="inventario-resumen">
                  <div className="resumen-item">
                    <span className="label">Total de Productos:</span>
                    <span className="valor">{reporteInventario.totalProductos}</span>
                  </div>
                  <div className="resumen-item alerta">
                    <span className="label">Productos con Stock Bajo:</span>
                    <span className="valor">{reporteInventario.productosStockBajo}</span>
                  </div>
                  <div className="resumen-item">
                    <span className="label">Productos sin Stock:</span>
                    <span className="valor">{reporteInventario.productosAgotados}</span>
                  </div>
                  <div className="resumen-item">
                    <span className="label">Valor Total Inventario:</span>
                    <span className="valor">${reporteInventario.valorTotalInventario.toLocaleString()}</span>
                  </div>
                </div>

                {/* Lista de productos con stock bajo */}
                {reporteInventario.productosStockBajo_lista.length > 0 && (
                  <div className="detalle-inventario">
                    <h4>Productos con Stock Bajo</h4>
                    <div className="tabla-container">
                      <table className="reportes-tabla">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Stock Actual</th>
                            <th>Stock Mínimo</th>
                            <th>Valor Inventario</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reporteInventario.productosStockBajo_lista.map((producto) => (
                            <tr key={producto.id}>
                              <td>{producto.nombre}</td>
                              <td className="text-center alerta">{producto.stock}</td>
                              <td className="text-center">{producto.stockMinimo}</td>
                              <td className="valor-monetario">${producto.valorInventario.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Lista de productos agotados */}
                {reporteInventario.productosAgotados_lista.length > 0 && (
                  <div className="detalle-inventario">
                    <h4>Productos Agotados</h4>
                    <div className="tabla-container">
                      <table className="reportes-tabla">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Última Venta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reporteInventario.productosAgotados_lista.map((producto) => (
                            <tr key={producto.id}>
                              <td>{producto.nombre}</td>
                              <td className="text-center">
                                {producto.ultimaVenta 
                                  ? new Date(producto.ultimaVenta).toLocaleDateString()
                                  : 'Sin ventas registradas'
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="no-data">
                <p>No hay datos de inventario disponibles. Genera un reporte para ver los resultados.</p>
              </div>
            )}
          </div>
        )}

        {tipoReporte === 'movimientos-inventario' && (
          <div className="reporte-movimientos-inventario">
            <h3>Movimientos de Inventario</h3>
            {movimientosInventario.length > 0 ? (
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
                            {movimiento.tipo}
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
            ) : (
              <div className="no-data">
                <p>No hay movimientos de inventario para el período seleccionado. Genera un reporte para ver los resultados.</p>
              </div>
            )}
          </div>
        )}

        {tipoReporte === 'movimientos-caja' && (
          <div className="reporte-movimientos-caja">
            <h3>Movimientos de Caja</h3>
            {movimientosCaja.length > 0 ? (
              <>
                <div className="resumen-movimientos">
                  <div className="resumen-item ingreso">
                    <span className="label">Total Ingresos:</span>
                    <span className="valor">
                      ${movimientosCaja
                        .filter(m => m.tipo === 'INGRESO')
                        .reduce((sum, m) => sum + m.monto, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                  <div className="resumen-item egreso">
                    <span className="label">Total Egresos:</span>
                    <span className="valor">
                      ${movimientosCaja
                        .filter(m => m.tipo === 'EGRESO')
                        .reduce((sum, m) => sum + m.monto, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                  <div className="resumen-item neto">
                    <span className="label">Diferencia Neta:</span>
                    <span className="valor">
                      ${(movimientosCaja
                        .filter(m => m.tipo === 'INGRESO')
                        .reduce((sum, m) => sum + m.monto, 0) -
                        movimientosCaja
                        .filter(m => m.tipo === 'EGRESO')
                        .reduce((sum, m) => sum + m.monto, 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="tabla-container">
                  <table className="reportes-tabla">
                    <thead>
                      <tr>
                        <th>Fecha y Hora</th>
                        <th>Tipo</th>
                        <th>Monto</th>
                        <th>Descripción</th>
                        <th>Usuario</th>
                        <th>Turno</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movimientosCaja.map((movimiento) => (
                        <tr key={movimiento.id}>
                          <td>{new Date(movimiento.fecha).toLocaleString('es-MX')}</td>
                          <td>
                            <span className={`tipo-movimiento ${movimiento.tipo.toLowerCase()}`}>
                              {movimiento.tipo === 'INGRESO' ? '📈 INGRESO' : '📉 EGRESO'}
                            </span>
                          </td>
                          <td className={`valor-monetario ${movimiento.tipo.toLowerCase()}`}>
                            {movimiento.tipo === 'INGRESO' ? '+' : '-'}${movimiento.monto.toLocaleString()}
                          </td>
                          <td>{movimiento.descripcion}</td>
                          <td>{movimiento.usuario}</td>
                          <td className="turno-info">{movimiento.turno}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="total-row">
                        <td colSpan={2}><strong>RESUMEN</strong></td>
                        <td className="valor-monetario">
                          <strong>
                            ${(movimientosCaja
                              .filter(m => m.tipo === 'INGRESO')
                              .reduce((sum, m) => sum + m.monto, 0) -
                              movimientosCaja
                              .filter(m => m.tipo === 'EGRESO')
                              .reduce((sum, m) => sum + m.monto, 0)
                            ).toLocaleString()}
                          </strong>
                        </td>
                        <td colSpan={3}>
                          <strong>
                            {movimientosCaja.filter(m => m.tipo === 'INGRESO').length} ingresos, {' '}
                            {movimientosCaja.filter(m => m.tipo === 'EGRESO').length} egresos
                          </strong>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            ) : (
              <div className="no-data">
                <p>No hay movimientos de caja para el período seleccionado. Genera un reporte para ver los resultados.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reportes;