// src/components/modals/CobroModal.tsx
import React, { useEffect, useState } from 'react';
import './CobroModal.css';

interface CobroModalProps {
  isOpen: boolean;
  total: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const CobroModal: React.FC<CobroModalProps> = ({ isOpen, total, onConfirm, onCancel }) => {
  const [efectivo, setEfectivo] = useState<string>('');
  const [cambio, setCambio] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) {
      setEfectivo('');
      setCambio(0);
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Enter':
        case 'F1':
          event.preventDefault();
          if (parseFloat(efectivo) >= total) {
            onConfirm();
          }
          break;
        case 'Escape':
          event.preventDefault();
          onCancel();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, efectivo, total, onConfirm, onCancel]);

  useEffect(() => {
    const efectivoNum = parseFloat(efectivo) || 0;
    setCambio(efectivoNum - total);
  }, [efectivo, total]);

  if (!isOpen) return null;

  const isValidAmount = parseFloat(efectivo) >= total;

  return (
    <div className="cobro-modal-overlay">
      <div className="cobro-modal">
        <div className="cobro-modal__header">
          <h2>Procesar Venta</h2>
          <button className="cobro-modal__close" onClick={onCancel}>×</button>
        </div>
        
        <div className="cobro-modal__content">
          <div className="cobro-total">
            <span className="cobro-label">Total a cobrar:</span>
            <span className="cobro-amount">${total.toFixed(2)}</span>
          </div>
          
          <div className="cobro-input-group">
            <label htmlFor="efectivo">Efectivo recibido:</label>
            <input
              id="efectivo"
              type="number"
              step="0.01"
              value={efectivo}
              onChange={(e) => setEfectivo(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
          </div>
          
          {efectivo && (
            <div className="cobro-cambio">
              <span className="cobro-label">Cambio:</span>
              <span className={`cobro-amount ${cambio < 0 ? 'negative' : 'positive'}`}>
                ${cambio.toFixed(2)}
              </span>
            </div>
          )}
          
          {!isValidAmount && efectivo && (
            <div className="cobro-error">
              El monto recibido es insuficiente
            </div>
          )}
        </div>
        
        <div className="cobro-modal__footer">
          <div className="cobro-instructions">
            <span>Enter/F1: Confirmar</span>
            <span>Esc: Cancelar</span>
          </div>
          
          <div className="cobro-actions">
            <button 
              className="cobro-btn cobro-btn--cancel" 
              onClick={onCancel}
            >
              Cancelar (Esc)
            </button>
            <button 
              className={`cobro-btn cobro-btn--confirm ${!isValidAmount ? 'disabled' : ''}`}
              onClick={onConfirm}
              disabled={!isValidAmount}
            >
              Confirmar (Enter)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CobroModal;