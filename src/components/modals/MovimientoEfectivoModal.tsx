// src/components/modals/MovimientoEfectivoModal.tsx
import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';
import { registrarMovimiento } from '../../api/caja';
import { MovimientoTipo } from '../../types/api';
import './MovimientoEfectivoModal.css';

interface MovimientoEfectivoModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: 'IN' | 'OUT'; // 'IN' para entrada, 'OUT' para salida
}

const MovimientoEfectivoModal: React.FC<MovimientoEfectivoModalProps> = ({
  isOpen,
  onClose,
  tipo
}) => {
  const { showSuccess, showError } = useToast();
  const { user } = usePermissions();
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);

  const tituloModal = tipo === 'OUT' ? 'Registrar Salida de Efectivo' : 'Registrar Entrada de Efectivo';
  const iconoTipo = tipo === 'OUT' ? '📤' : '📥';
  const colorTipo = tipo === 'OUT' ? '#dc2626' : '#059669';
  const placeholderDescripcion = tipo === 'OUT' 
    ? 'Ej: Compra de suministros, gastos varios, etc.'
    : 'Ej: Efectivo inicial, devolución de préstamo, etc.';

  const resetForm = () => {
    setMonto('');
    setDescripcion('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!monto || parseFloat(monto) <= 0) {
      showError('El monto debe ser mayor a cero');
      return;
    }

    if (!descripcion.trim()) {
      showError('La descripción es obligatoria');
      return;
    }

    if (!user?.id) {
      showError('No se pudo identificar el usuario. Por favor, inicie sesión nuevamente.');
      return;
    }

    setLoading(true);
    try {
      const response = await registrarMovimiento({
        usuarioId: user.id,
        tipo: tipo === 'IN' ? MovimientoTipo.IN : MovimientoTipo.OUT,
        monto: parseFloat(monto),
        descripcion: descripcion.trim()
      });

      if (response.data) {
        const tipoTexto = tipo === 'OUT' ? 'salida' : 'entrada';
        showSuccess(`${iconoTipo} ${tipoTexto.charAt(0).toUpperCase() + tipoTexto.slice(1)} de efectivo registrada exitosamente`);
        handleClose();
      }
    } catch (error: any) {
      console.error('Error registrando movimiento de efectivo:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al registrar el movimiento';
      showError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Solo permitir números y un punto decimal
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setMonto(value);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="movimiento-efectivo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ borderBottom: `3px solid ${colorTipo}` }}>
          <h2 style={{ color: colorTipo }}>
            {iconoTipo} {tituloModal}
          </h2>
          <button 
            className="modal-close-btn"
            onClick={handleClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="info-banner" style={{ 
            background: tipo === 'OUT' ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${tipo === 'OUT' ? '#fecaca' : '#bbf7d0'}`,
            color: tipo === 'OUT' ? '#991b1b' : '#166534'
          }}>
            <p>
              ℹ️ Este registro se guardará en el sistema como un movimiento de efectivo y 
              aparecerá en los reportes de caja del día actual.
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="monto">
              💰 Monto (MXN) <span className="required">*</span>
            </label>
            <div className="input-with-symbol">
              <span className="currency-symbol">$</span>
              <input
                type="text"
                id="monto"
                value={monto}
                onChange={handleMontoChange}
                placeholder="0.00"
                required
                disabled={loading}
                className="monto-input"
              />
            </div>
            {monto && (
              <div className="monto-preview" style={{ color: colorTipo }}>
                Cantidad: ${parseFloat(monto || '0').toLocaleString('es-MX', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="descripcion">
              📝 Descripción/Motivo <span className="required">*</span>
            </label>
            <textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder={placeholderDescripcion}
              required
              disabled={loading}
              rows={3}
              maxLength={500}
            />
            <div className="char-counter">
              {descripcion.length}/500 caracteres
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={handleClose}
              className="btn-cancel"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading || !monto || !descripcion.trim()}
              style={{ background: colorTipo }}
            >
              {loading ? (
                <>🔄 Registrando...</>
              ) : (
                <>{iconoTipo} Registrar {tipo === 'OUT' ? 'Salida' : 'Entrada'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MovimientoEfectivoModal;