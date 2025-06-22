// src/services/polling.ts - Servicio de polling para datos en tiempo real
import React from 'react';
import { API_CONFIG } from '../config/api';
import { getEstadoCaja } from '../api/caja';
import { getProductosStockBajo } from '../api/products';
import { CajaStatusResponse, Producto } from '../types/api';

export type PollingCallback<T> = (data: T, error?: Error) => void;

export interface PollingService {
  start(): void;
  stop(): void;
  isRunning(): boolean;
  onUpdate(callback: PollingCallback<any>): () => void;
}

// ============ SERVICIO BASE DE POLLING ============

class BasePollingService<T> implements PollingService {
  private intervalId: NodeJS.Timeout | null = null;
  private callbacks: Set<PollingCallback<T>> = new Set();
  private isActive = false;

  constructor(
    private fetchData: () => Promise<T>,
    private interval: number,
    private serviceName: string
  ) {}

  start(): void {
    if (this.isActive) {
      console.warn(`⚠️ ${this.serviceName} polling ya está activo`);
      return;
    }

    console.log(`🔄 Iniciando ${this.serviceName} polling (cada ${this.interval / 1000}s)`);
    this.isActive = true;
    
    // Ejecutar inmediatamente
    this.executePolling();
    
    // Configurar intervalo
    this.intervalId = setInterval(() => {
      this.executePolling();
    }, this.interval);
  }

  stop(): void {
    if (!this.isActive) return;

    console.log(`⏹️ Deteniendo ${this.serviceName} polling`);
    this.isActive = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  isRunning(): boolean {
    return this.isActive;
  }

  onUpdate(callback: PollingCallback<T>): () => void {
    this.callbacks.add(callback);
    
    // Retornar función para limpiar el callback
    return () => {
      this.callbacks.delete(callback);
    };
  }

  private async executePolling(): Promise<void> {
    try {
      const data = await this.fetchData();
      this.notifyCallbacks(data);
    } catch (error) {
      console.error(`❌ Error en ${this.serviceName} polling:`, error);
      this.notifyCallbacks(null, error as Error);
    }
  }

  private notifyCallbacks(data: T | null, error?: Error): void {
    this.callbacks.forEach(callback => {
      try {
        if (error) {
          callback(data as T, error);
        } else {
          callback(data as T);
        }
      } catch (callbackError) {
        console.error(`Error en callback de ${this.serviceName}:`, callbackError);
      }
    });
  }
}

// ============ SERVICIOS ESPECÍFICOS ============

// Servicio de estado de caja
class CajaStatusPollingService extends BasePollingService<CajaStatusResponse> {
  constructor() {
    super(
      async () => {
        const response = await getEstadoCaja();
        return response.data;
      },
      API_CONFIG.POLLING.CAJA_STATUS,
      'Estado de Caja'
    );
  }
}

// Servicio de stock bajo
class StockBajoPollingService extends BasePollingService<Producto[]> {
  constructor() {
    super(
      async () => {
        const response = await getProductosStockBajo();
        return response.data;
      },
      API_CONFIG.POLLING.STOCK_BAJO,
      'Stock Bajo'
    );
  }
}

// ============ MANAGER DE POLLING ============

export class PollingManager {
  private services: Map<string, PollingService> = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeServices();
  }

  private initializeServices(): void {
    if (this.isInitialized) return;

    // Registrar servicios
    this.services.set('cajaStatus', new CajaStatusPollingService());
    this.services.set('stockBajo', new StockBajoPollingService());
    
    this.isInitialized = true;
    console.log('📡 Polling Manager inicializado');
  }

  startService(serviceName: string): void {
    const service = this.services.get(serviceName);
    if (!service) {
      console.error(`❌ Servicio de polling '${serviceName}' no encontrado`);
      return;
    }
    
    service.start();
  }

  stopService(serviceName: string): void {
    const service = this.services.get(serviceName);
    if (!service) {
      console.error(`❌ Servicio de polling '${serviceName}' no encontrado`);
      return;
    }
    
    service.stop();
  }

  startAll(): void {
    console.log('🚀 Iniciando todos los servicios de polling...');
    this.services.forEach((service, name) => {
      console.log(`  - Iniciando ${name}`);
      service.start();
    });
  }

  stopAll(): void {
    console.log('🛑 Deteniendo todos los servicios de polling...');
    this.services.forEach((service, name) => {
      console.log(`  - Deteniendo ${name}`);
      service.stop();
    });
  }

  onCajaStatusUpdate(callback: PollingCallback<CajaStatusResponse>): () => void {
    const service = this.services.get('cajaStatus');
    if (!service) {
      console.error('❌ Servicio de caja status no disponible');
      return () => {};
    }
    
    return service.onUpdate(callback);
  }

  onStockBajoUpdate(callback: PollingCallback<Producto[]>): () => void {
    const service = this.services.get('stockBajo');
    if (!service) {
      console.error('❌ Servicio de stock bajo no disponible');
      return () => {};
    }
    
    return service.onUpdate(callback);
  }

  getServiceStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    this.services.forEach((service, name) => {
      status[name] = service.isRunning();
    });
    return status;
  }

  // Método para suscribirse a múltiples servicios a la vez
  subscribeToMultiple(subscriptions: {
    cajaStatus?: PollingCallback<CajaStatusResponse>;
    stockBajo?: PollingCallback<Producto[]>;
  }): () => void {
    const unsubscribeFunctions: (() => void)[] = [];

    if (subscriptions.cajaStatus) {
      const unsubscribe = this.onCajaStatusUpdate(subscriptions.cajaStatus);
      unsubscribeFunctions.push(unsubscribe);
    }

    if (subscriptions.stockBajo) {
      const unsubscribe = this.onStockBajoUpdate(subscriptions.stockBajo);
      unsubscribeFunctions.push(unsubscribe);
    }

    // Retornar función que limpia todas las suscripciones
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }
}

// ============ INSTANCIA GLOBAL ============

export const pollingManager = new PollingManager();

// ============ HOOKS DE REACT PARA POLLING ============

export function usePollingService<T>(
  serviceName: string,
  callback: PollingCallback<T>,
  autoStart: boolean = true
): {
  isRunning: boolean;
  start: () => void;
  stop: () => void;
} {
  const [isRunning, setIsRunning] = React.useState(false);
  
  React.useEffect(() => {
    const service = pollingManager['services'].get(serviceName);
    if (!service) return;

    // Suscribirse a actualizaciones
    const unsubscribe = service.onUpdate(callback);
    
    // Auto-iniciar si está configurado
    if (autoStart && !service.isRunning()) {
      service.start();
      setIsRunning(true);
    }

    // Verificar estado inicial
    setIsRunning(service.isRunning());

    return () => {
      unsubscribe();
      if (autoStart) {
        service.stop();
        setIsRunning(false);
      }
    };
  }, [serviceName, autoStart]);

  const start = React.useCallback(() => {
    pollingManager.startService(serviceName);
    setIsRunning(true);
  }, [serviceName]);

  const stop = React.useCallback(() => {
    pollingManager.stopService(serviceName);
    setIsRunning(false);
  }, [serviceName]);

  return { isRunning, start, stop };
}

// Hook específico para estado de caja
export function useCajaStatusPolling(
  callback: PollingCallback<CajaStatusResponse>,
  autoStart: boolean = true
) {
  return usePollingService('cajaStatus', callback, autoStart);
}

// Hook específico para stock bajo
export function useStockBajoPolling(
  callback: PollingCallback<Producto[]>,
  autoStart: boolean = true
) {
  return usePollingService('stockBajo', callback, autoStart);
}

// Hook para múltiples servicios
export function useMultiplePolling(
  subscriptions: {
    cajaStatus?: PollingCallback<CajaStatusResponse>;
    stockBajo?: PollingCallback<Producto[]>;
  },
  autoStart: boolean = true
) {
  React.useEffect(() => {
    if (autoStart) {
      pollingManager.startAll();
    }

    const unsubscribe = pollingManager.subscribeToMultiple(subscriptions);

    return () => {
      unsubscribe();
      if (autoStart) {
        pollingManager.stopAll();
      }
    };
  }, [autoStart]);

  return {
    status: pollingManager.getServiceStatus(),
    startAll: () => pollingManager.startAll(),
    stopAll: () => pollingManager.stopAll()
  };
}