// src/api/client.ts - Cliente HTTP centralizado con manejo de ApiResponse<T>
import { fetch } from '@tauri-apps/plugin-http';
import { API_CONFIG, ApiResponse, ErrorResponse } from '../config/api';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    public details?: string | string[],
    public requestId?: string
  ) {
    super(error);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;
  private accessToken: string | null = null;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.defaultHeaders = API_CONFIG.DEFAULT_HEADERS;
  }

  // Configurar token de acceso
  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  // Obtener headers con autenticación
  private getHeaders(customHeaders?: HeadersInit): HeadersInit {
    const headers = {
      ...this.defaultHeaders,
      ...customHeaders
    };

    if (this.accessToken) {
      (headers as any)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  // Procesar respuesta de la API
  private async processResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      let errorData: ErrorResponse;
      
      try {
        if (contentType?.includes('application/json')) {
          errorData = await response.json();
        } else {
          const text = await response.text();
          errorData = {
            statusCode: response.status,
            message: text || response.statusText,
            error: response.statusText,
            timestamp: new Date().toISOString(),
            path: response.url,
            apiVersion: '1'
          };
        }
      } catch {
        errorData = {
          statusCode: response.status,
          message: 'Error de conexión',
          error: response.statusText,
          timestamp: new Date().toISOString(),
          path: response.url,
          apiVersion: '1'
        };
      }

      throw new ApiError(
        errorData.statusCode,
        errorData.error,
        errorData.message,
        errorData.requestId
      );
    }

    if (!contentType?.includes('application/json')) {
      throw new ApiError(
        500,
        'Invalid Content Type',
        'Expected JSON response'
      );
    }

    try {
      const data = await response.json();
      
      // Si la respuesta ya es un ApiResponse wrapper, la devolvemos
      if (data.data !== undefined && data.meta !== undefined) {
        return data as ApiResponse<T>;
      }
      
      // Si no, la envolvemos en ApiResponse
      return {
        data: data as T,
        meta: {
          timestamp: new Date().toISOString(),
          apiVersion: response.headers.get('api-version') || '1',
          requestId: response.headers.get('x-request-id') || undefined
        }
      };
    } catch (error) {
      throw new ApiError(
        500,
        'JSON Parse Error',
        'Response is not valid JSON'
      );
    }
  }

  // GET request
  async get<T>(
    endpoint: string, 
    params?: Record<string, any>,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const url = new URL(endpoint, this.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });
    }

    console.log(`🌐 GET Request: ${url.toString()}`);
    console.log(`🔑 Headers:`, this.getHeaders(options?.headers));

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders(options?.headers),
        ...options
      });

      console.log(`✅ Response status: ${response.status}`);
      return this.processResponse<T>(response);
    } catch (error) {
      console.error(`❌ Error en GET ${url.toString()}:`, error);
      
      // Información más detallada del error
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}`);
        console.error(`Error message: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      }
      
      // Si ya es un ApiError, re-lanzarlo sin modificar
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Para otros errores, crear un ApiError descriptivo
      throw new ApiError(
        0, 
        'Error de conexión', 
        error instanceof Error ? error.message : 'Error desconocido'
      );
    }
  }

  // POST request
  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const url = new URL(endpoint, this.baseUrl);

    console.log(`🌐 POST Request: ${url.toString()}`);
    console.log(`📦 Data:`, data);
    console.log(`🔑 Headers:`, this.getHeaders(options?.headers));

    try {
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: this.getHeaders({
          'Content-Type': 'application/json',
          ...options?.headers
        }),
        body: data ? JSON.stringify(data) : undefined,
        ...options
      });

      console.log(`✅ Response status: ${response.status}`);
      return this.processResponse<T>(response);
    } catch (error) {
      console.error(`❌ Error en POST ${url.toString()}:`, error);
      
      // Información más detallada del error
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}`);
        console.error(`Error message: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      }
      
      // Si ya es un ApiError, re-lanzarlo sin modificar
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Para otros errores, crear un ApiError descriptivo
      throw new ApiError(
        0, 
        'Error de conexión', 
        error instanceof Error ? error.message : 'Error desconocido'
      );
    }
  }

  // PUT request
  async put<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const url = new URL(endpoint, this.baseUrl);

    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers: this.getHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
      ...options
    });

    return this.processResponse<T>(response);
  }

  // PATCH request
  async patch<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const url = new URL(endpoint, this.baseUrl);

    const response = await fetch(url.toString(), {
      method: 'PATCH',
      headers: this.getHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
      ...options
    });

    return this.processResponse<T>(response);
  }

  // DELETE request
  async delete<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const url = new URL(endpoint, this.baseUrl);

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: this.getHeaders(options?.headers),
      ...options
    });

    return this.processResponse<T>(response);
  }

  // Upload de archivos
  async upload<T>(
    endpoint: string,
    file: File,
    fieldName: string = 'file',
    additionalData?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const url = new URL(endpoint, this.baseUrl);
    const formData = new FormData();
    
    formData.append(fieldName, file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const headers = this.getHeaders();
    // Remover Content-Type para que el browser lo configure automáticamente con boundary
    delete (headers as any)['Content-Type'];

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: formData
    });

    return this.processResponse<T>(response);
  }

  // Download de archivos
  async download(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<Blob> {
    const url = new URL(endpoint, this.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new ApiError(
        response.status,
        response.statusText,
        'Download failed'
      );
    }

    return response.blob();
  }
}

// Instancia global del cliente
export const apiClient = new ApiClient();