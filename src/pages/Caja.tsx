// src/pages/Caja.tsx - Página de gestión de caja con apertura y cierre
import React, { useState, useEffect } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { ALL_PERMISSIONS } from '../types/permissions';
import { 
  getTurnoActual,
  abrirCaja, 
  cerrarCaja, 
  getTurnos,
  type TurnoCaja, 
  type AbrirCajaRequest,
  type CerrarCajaRequest
} from '../api/caja';
import './Caja.css';

export const Caja: React.FC = () => {
  const { hasPermission, user } = usePermissions();
  const [turnoActual, setTurnoActual] = useState<TurnoCaja | null>(null);
  const [historial, setHistorial] = useState<TurnoCaja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para modales
  const [showAbrirModal, setShowAbrirModal] = useState(false);
  const [showCerrarModal, setShowCerrarModal] = useState(false);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [turnoDetalle, setTurnoDetalle] = useState<TurnoCaja | null>(null);

  // Estados para formularios
  const [formApertura, setFormApertura] = useState<AbrirCajaRequest>({
    saldoInicial: 100, // Saldo inicial sugerido
    cajaId: 1, // Caja por defecto
    observaciones: ''
  });
  
  const [formCierre, setFormCierre] = useState<CerrarCajaRequest>({
    saldoFinal: 0,
    observaciones: ''
  });

  const [procesando, setProcesando] = useState(false);

  // Cargar estado inicial
  useEffect(() => {
    cargarTurnoActual();
  }, []);

  const cargarTurnoActual = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const turnoResponse = await getTurnoActual();
      setTurnoActual(turnoResponse.data);
      
    } catch (err: any) {
      console.error('Error cargando turno actual:', err);
      setError(err.message || 'Error al cargar el turno de caja');
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorial = async () => {
    try {
      const historialResponse = await getTurnos({});
      setHistorial(historialResponse.data || []);
    } catch (err: any) {
      console.error('Error cargando historial:', err);
      showError(err.message || 'Error al cargar el historial');
    }
  };

  const handleAbrirCaja = async () => {
    try {
      setProcesando(true);
      
      console.log('Intentando abrir caja con datos:', formApertura);
      
      await abrirCaja(formApertura);
      
      showSuccess('Caja abierta exitosamente');
      setShowAbrirModal(false);
      
      // Resetear formulario
      setFormApertura({
        saldoInicial: 100, // Saldo inicial sugerido
        cajaId: 1, // Caja por defecto
        observaciones: ''
      });
      
      // Recargar estado
      await cargarTurnoActual();
      
    } catch (err: any) {
      console.error('Error abriendo caja:', err);
      showError(err.message || 'Error al abrir la caja');
    } finally {
      setProcesando(false);
    }
  };

  const handleCerrarCaja = async () => {
    try {
      setProcesando(true);
      
      if (!turnoActual) return;
      
      await cerrarCaja(formCierre);
      
      showSuccess('Caja cerrada exitosamente');
      setShowCerrarModal(false);
      
      // Resetear formulario
      setFormCierre({
        saldoFinal: 0,
        observaciones: ''
      });
      
      // Recargar estado
      await cargarTurnoActual();
      
    } catch (err: any) {
      console.error('Error cerrando caja:', err);
      showError(err.message || 'Error al cerrar la caja');
    } finally {
      setProcesando(false);
    }
  };

  const showSuccess = (message: string) => {
    // Implementar toast de éxito
    alert(message); // Temporal
  };

  const showError = (message: string) => {
    // Implementar toast de error
    alert(message); // Temporal
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN' 
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-MX');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-MX');
  };

  const handleVerDetalle = async (turno: TurnoCaja) => {
    try {
      // Obtener detalles completos del turno desde el backend
      const { getTurnoById } = await import('../api/caja');
      const response = await getTurnoById(turno.id);
      setTurnoDetalle(response.data);
      setShowDetalleModal(true);
    } catch (err: any) {
      console.error('Error cargando detalle del turno:', err);
      showError(err.message || 'Error al cargar los detalles del turno');
    }
  };

  // Verificar permisos
  if (!hasPermission(ALL_PERMISSIONS.CAJA_ABRIR) && !hasPermission(ALL_PERMISSIONS.CAJA_CERRAR) && !hasPermission(ALL_PERMISSIONS.CAJA_VER)) {
    return (
      <div className="caja-page permission-denied">
        <div className="error-message">
          <h2>Acceso Denegado</h2>
          <p>No tienes permisos para gestionar la caja</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="caja-page loading">
        <div className="loading-spinner"></div>
        <p>Cargando estado de caja...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="caja-page error">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={cargarTurnoActual} className="btn-retry">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const sesionActiva = turnoActual;

  return (
    <div className="caja-page">
      <div className="caja-header">
        <h1>Gestión de Caja</h1>
        <div className="caja-actions">
          <button 
            onClick={() => {
              setShowHistorialModal(true);
              cargarHistorial();
            }}
            className="btn-secondary"
          >
            Ver Historial
          </button>
          <button 
            onClick={cargarTurnoActual}
            className="btn-refresh"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      <div className="caja-content">
        {/* Estado Actual */}
        <div className="caja-card estado-card">
          <h2>Estado Actual</h2>
          
          {sesionActiva ? (
            <div className="sesion-activa">
              <div className="estado-badge abierta">CAJA ABIERTA</div>
              <div className="sesion-info">
                <p><strong>Operador:</strong> {sesionActiva.usuario?.fullName || 'Usuario Actual'}</p>
                <p><strong>Apertura:</strong> {formatDateTime(sesionActiva.fechaApertura)}</p>
                <p><strong>Saldo Inicial:</strong> {formatCurrency(Number(sesionActiva.saldoInicial))}</p>
                <p><strong>Saldo Actual:</strong> {formatCurrency(Number(sesionActiva.resumen?.saldoActual || sesionActiva.saldoInicial))}</p>
                <p><strong>Ingresos del Día:</strong> {formatCurrency(Number(sesionActiva.resumen?.totalIngresos || sesionActiva.totalIngresos))}</p>
              </div>
            </div>
          ) : (
            <div className="sesion-cerrada">
              <div className="estado-badge cerrada">CAJA CERRADA</div>
              <p>No hay sesión de caja activa</p>
            </div>
          )}
        </div>

        {/* Resumen (solo si hay sesión activa) */}
        {sesionActiva && (
          <div className="caja-card resumen-card">
            <h2>Resumen del Día</h2>
            <div className="resumen-grid">
              <div className="resumen-item">
                <span className="label">Saldo Inicial:</span>
                <span className="value">{formatCurrency(Number(sesionActiva.saldoInicial))}</span>
              </div>
              <div className="resumen-item">
                <span className="label">Total Ingresos:</span>
                <span className="value positive">{formatCurrency(Number(sesionActiva.resumen?.totalIngresos || sesionActiva.totalIngresos))}</span>
              </div>
              <div className="resumen-item">
                <span className="label">Total Egresos:</span>
                <span className="value negative">{formatCurrency(Number(sesionActiva.resumen?.totalEgresos || sesionActiva.totalEgresos))}</span>
              </div>
              <div className="resumen-item total">
                <span className="label">Saldo Actual:</span>
                <span className="value">{formatCurrency(Number(sesionActiva.resumen?.saldoActual || sesionActiva.saldoInicial))}</span>
              </div>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="caja-card acciones-card">
          <h2>Acciones</h2>
          <div className="acciones-buttons">
            {!sesionActiva ? (
              <button 
                onClick={() => setShowAbrirModal(true)}
                className="btn-primary btn-abrir"
                disabled={!hasPermission(ALL_PERMISSIONS.CAJA_ABRIR)}
              >
                🔓 Abrir Caja
              </button>
            ) : (
              <button 
                onClick={() => setShowCerrarModal(true)}
                className="btn-danger btn-cerrar"
                disabled={!hasPermission(ALL_PERMISSIONS.CAJA_CERRAR)}
              >
                🔒 Cerrar Caja
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal Abrir Caja */}
      {showAbrirModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Abrir Caja</h3>
              <button 
                onClick={() => setShowAbrirModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Saldo Inicial: *</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  max="999999.99"
                  value={formApertura.saldoInicial}
                  onChange={(e) => setFormApertura(prev => ({
                    ...prev, 
                    saldoInicial: parseFloat(e.target.value) || 0
                  }))}
                  placeholder="100.00"
                />
                <small style={{color: '#666', fontSize: '12px'}}>
                  Ingrese el monto inicial en caja (ej: 100.00)
                </small>
              </div>
              <div className="form-group">
                <label>Observaciones:</label>
                <textarea 
                  value={formApertura.observaciones}
                  onChange={(e) => setFormApertura(prev => ({
                    ...prev, 
                    observaciones: e.target.value
                  }))}
                  placeholder="Observaciones de apertura..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => setShowAbrirModal(false)}
                className="btn-secondary"
                disabled={procesando}
              >
                Cancelar
              </button>
              <button 
                onClick={handleAbrirCaja}
                className="btn-primary"
                disabled={procesando || formApertura.saldoInicial < 0}
              >
                {procesando ? 'Abriendo...' : 'Abrir Caja'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cerrar Caja */}
      {showCerrarModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Cerrar Caja</h3>
              <button 
                onClick={() => setShowCerrarModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {sesionActiva && (
                <div className="resumen-cierre">
                  <h4>Resumen del Día</h4>
                  <div className="resumen-line">
                    <span>Saldo Esperado:</span>
                    <span>{formatCurrency(Number(sesionActiva.resumen?.saldoActual || sesionActiva.saldoInicial))}</span>
                  </div>
                </div>
              )}
              <div className="form-group">
                <label>Saldo Real en Caja: *</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  value={formCierre.saldoFinal}
                  onChange={(e) => setFormCierre(prev => ({
                    ...prev, 
                    saldoFinal: parseFloat(e.target.value) || 0
                  }))}
                  placeholder="0.00"
                />
              </div>
              {sesionActiva && formCierre.saldoFinal > 0 && (
                <div className="diferencia-info">
                  <span className={`diferencia ${
                    formCierre.saldoFinal - Number(sesionActiva.resumen?.saldoActual || sesionActiva.saldoInicial) === 0 ? 'neutral' :
                    formCierre.saldoFinal - Number(sesionActiva.resumen?.saldoActual || sesionActiva.saldoInicial) > 0 ? 'positive' : 'negative'
                  }`}>
                    Diferencia: {formatCurrency(formCierre.saldoFinal - Number(sesionActiva.resumen?.saldoActual || sesionActiva.saldoInicial))}
                  </span>
                </div>
              )}
              <div className="form-group">
                <label>Observaciones de Cierre:</label>
                <textarea 
                  value={formCierre.observaciones}
                  onChange={(e) => setFormCierre(prev => ({
                    ...prev, 
                    observaciones: e.target.value
                  }))}
                  placeholder="Observaciones de cierre..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => setShowCerrarModal(false)}
                className="btn-secondary"
                disabled={procesando}
              >
                Cancelar
              </button>
              <button 
                onClick={handleCerrarCaja}
                className="btn-danger"
                disabled={procesando || formCierre.saldoFinal < 0}
              >
                {procesando ? 'Cerrando...' : 'Cerrar Caja'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historial */}
      {showHistorialModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h3>Historial de Turnos</h3>
              <button 
                onClick={() => setShowHistorialModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {historial.length === 0 ? (
                <p>Cargando historial...</p>
              ) : (
                <div className="historial-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha Apertura</th>
                        <th>Hora Apertura</th>
                        <th>Fecha Cierre</th>
                        <th>Hora Cierre</th>
                        <th>Operador</th>
                        <th>Saldo Inicial</th>
                        <th>Saldo Final</th>
                        <th>Diferencia</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.map(turno => (
                        <tr key={turno.id} className="historial-row">
                          <td>{formatDate(turno.fechaApertura)}</td>
                          <td>{formatTime(turno.fechaApertura)}</td>
                          <td>
                            {turno.fechaCierre 
                              ? formatDate(turno.fechaCierre)
                              : '-'
                            }
                          </td>
                          <td>
                            {turno.fechaCierre 
                              ? formatTime(turno.fechaCierre)
                              : '-'
                            }
                          </td>
                          <td>{turno.usuario?.fullName}</td>
                          <td>{formatCurrency(Number(turno.saldoInicial))}</td>
                          <td>
                            {turno.saldoFinal !== null && turno.saldoFinal !== undefined
                              ? formatCurrency(Number(turno.saldoFinal)) 
                              : '-'
                            }
                          </td>
                          <td>
                            <span className={`diferencia ${
                              Number(turno.diferencia) === 0 ? 'neutral' :
                              Number(turno.diferencia) > 0 ? 'positive' : 'negative'
                            }`}>
                              {formatCurrency(Number(turno.diferencia))}
                            </span>
                          </td>
                          <td>
                            <span className={`estado-badge ${turno.estado.toLowerCase()}`}>
                              {turno.estado}
                            </span>
                          </td>
                          <td>
                            <button 
                              onClick={() => handleVerDetalle(turno)}
                              className="btn-detalle"
                              title="Ver detalles"
                            >
                              🔍
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => setShowHistorialModal(false)}
                className="btn-secondary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle de Turno */}
      {showDetalleModal && turnoDetalle && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h3>Detalle del Turno - {formatDate(turnoDetalle.fechaApertura)}</h3>
              <button 
                onClick={() => setShowDetalleModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {/* Información General */}
              <div className="detalle-section">
                <h4>Información General</h4>
                <div className="detalle-grid">
                  <div className="detalle-item">
                    <label>Operador:</label>
                    <span>{turnoDetalle.usuario?.fullName}</span>
                  </div>
                  <div className="detalle-item">
                    <label>Fecha y Hora de Apertura:</label>
                    <span>{formatDateTime(turnoDetalle.fechaApertura)}</span>
                  </div>
                  {turnoDetalle.fechaCierre && (
                    <div className="detalle-item">
                      <label>Fecha y Hora de Cierre:</label>
                      <span>{formatDateTime(turnoDetalle.fechaCierre)}</span>
                    </div>
                  )}
                  <div className="detalle-item">
                    <label>Estado:</label>
                    <span className={`estado-badge ${turnoDetalle.estado.toLowerCase()}`}>
                      {turnoDetalle.estado}
                    </span>
                  </div>
                </div>
              </div>

              {/* Resumen Financiero */}
              <div className="detalle-section">
                <h4>Resumen Financiero</h4>
                <div className="resumen-detalle">
                  <div className="resumen-row">
                    <span className="label">Saldo Inicial:</span>
                    <span className="value">{formatCurrency(Number(turnoDetalle.saldoInicial))}</span>
                  </div>
                  <div className="resumen-row">
                    <span className="label">Total Ingresos:</span>
                    <span className="value positive">{formatCurrency(Number(turnoDetalle.totalIngresos))}</span>
                  </div>
                  <div className="resumen-row">
                    <span className="label">Total Egresos:</span>
                    <span className="value negative">{formatCurrency(Number(turnoDetalle.totalEgresos))}</span>
                  </div>
                  <div className="resumen-row total-row">
                    <span className="label">Saldo Esperado:</span>
                    <span className="value">
                      {formatCurrency(Number(turnoDetalle.saldoInicial) + Number(turnoDetalle.totalIngresos) - Number(turnoDetalle.totalEgresos))}
                    </span>
                  </div>
                  {turnoDetalle.saldoFinal !== null && turnoDetalle.saldoFinal !== undefined && (
                    <>
                      <div className="resumen-row">
                        <span className="label">Saldo Final:</span>
                        <span className="value">{formatCurrency(Number(turnoDetalle.saldoFinal))}</span>
                      </div>
                      <div className="resumen-row">
                        <span className="label">Diferencia:</span>
                        <span className={`value diferencia ${
                          Number(turnoDetalle.diferencia) === 0 ? 'neutral' :
                          Number(turnoDetalle.diferencia) > 0 ? 'positive' : 'negative'
                        }`}>
                          {formatCurrency(Number(turnoDetalle.diferencia))}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Ventas Realizadas */}
              {turnoDetalle.tickets && turnoDetalle.tickets.length > 0 && (
                <div className="detalle-section">
                  <h4>Ventas Realizadas ({turnoDetalle.tickets.length})</h4>
                  <div className="tickets-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Ticket #</th>
                          <th>Fecha</th>
                          <th>Total</th>
                          <th>Items</th>
                        </tr>
                      </thead>
                      <tbody>
                        {turnoDetalle.tickets.map(ticket => (
                          <tr key={ticket.id}>
                            <td>{ticket.numeroTicket}</td>
                            <td>{formatDateTime(ticket.fecha)}</td>
                            <td>{formatCurrency(Number(ticket.total))}</td>
                            <td>{ticket.items?.length || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Observaciones */}
              {turnoDetalle.observaciones && (
                <div className="detalle-section">
                  <h4>Observaciones</h4>
                  <div className="observaciones-detalle">
                    <pre>{turnoDetalle.observaciones}</pre>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => setShowDetalleModal(false)}
                className="btn-secondary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Caja;