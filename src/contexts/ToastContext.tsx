// src/contexts/ToastContext.tsx - Contexto para notificaciones
import React, { createContext, useContext, useState, ReactNode } from 'react';
import Toast from '../components/ui/Toast';

interface ToastData {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastData, 'id'>) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const showToast = (toast: Omit<ToastData, 'id'>) => {
    const id = generateId();
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
  };

  const showSuccess = (message: string, duration = 4000) => {
    showToast({ type: 'success', message, duration });
  };

  const showError = (message: string, duration = 5000) => {
    showToast({ type: 'error', message, duration });
  };

  const showInfo = (message: string, duration = 4000) => {
    showToast({ type: 'info', message, duration });
  };

  const showWarning = (message: string, duration = 4000) => {
    showToast({ type: 'warning', message, duration });
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{
      showToast,
      showSuccess,
      showError,
      showInfo,
      showWarning
    }}>
      {children}
      
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};