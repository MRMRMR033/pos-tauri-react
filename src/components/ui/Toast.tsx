// src/components/ui/Toast.tsx - Sistema de notificaciones
import React, { useEffect } from 'react';
import './Toast.css';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ 
  id, 
  type, 
  message, 
  duration = 4000, 
  onClose 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '';
    }
  };

  return (
    <div className={`toast toast--${type}`}>
      <div className="toast__content">
        <span className="toast__icon">{getIcon()}</span>
        <span className="toast__message">{message}</span>
      </div>
      <button 
        className="toast__close"
        onClick={() => onClose(id)}
        aria-label="Cerrar notificación"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;