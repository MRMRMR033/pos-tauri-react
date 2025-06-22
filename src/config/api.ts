// src/config/api.ts - Configuración centralizada de la API
export const API_CONFIG = {
  // Configuración para entorno LAN - Cambiar por IP del servidor
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'http://192.168.0.100:3000'  // IP del servidor en LAN
    : 'http://localhost:3000',     // Desarrollo local
  
  // Headers estándar para todas las peticiones
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'API-Version': '1',           // Versionado de API
    'Accept-Version': '1'         // Header alternativo de versión
  },
  
  // Configuración de timeouts
  TIMEOUT: {
    DEFAULT: 10000,     // 10 segundos
    UPLOAD: 30000,      // 30 segundos para uploads
    DOWNLOAD: 60000     // 60 segundos para descargas
  },
  
  // Configuración de polling
  POLLING: {
    CAJA_STATUS: 30000,       // 30 segundos
    STOCK_BAJO: 30000,        // 30 segundos
    GENERAL_REFRESH: 60000    // 1 minuto
  }
} as const;

// Tipos para el wrapper estándar de respuestas de la API
export interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    apiVersion: string;
    requestId?: string;
    // Para paginación
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
  apiVersion: string;
  requestId?: string;
}

// Parámetros estándar de paginación
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Función helper para construir URLs con parámetros
export function buildUrl(endpoint: string, params?: Record<string, any>): string {
  const url = new URL(endpoint, API_CONFIG.BASE_URL);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
  }
  
  return url.toString();
}