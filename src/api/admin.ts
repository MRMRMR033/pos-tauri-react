// src/api/admin.ts - API de administración y mantenimiento
import { apiClient } from './client';
import { 
  HealthCheckResponse, 
  BackupResponse, 
  RestoreRequest,
  ApiResponse 
} from '../types/api';

// ============ MONITOREO Y SALUD DEL SISTEMA ============

export async function getHealthCheck(): Promise<ApiResponse<HealthCheckResponse>> {
  return apiClient.get<HealthCheckResponse>('/admin/health');
}

export async function getSystemIntegrity(): Promise<ApiResponse<{
  database: boolean;
  migrations: number;
  permissions: number;
  referentialIntegrity: boolean;
  issues: string[];
}>> {
  return apiClient.get('/admin/integrity-check');
}

export async function getSystemLogs(params?: {
  level?: 'error' | 'warn' | 'info' | 'debug';
  limit?: number;
  since?: string;
}): Promise<Blob> {
  return apiClient.download('/admin/logs', params);
}

// ============ BACKUP Y RESTORE ============

export async function createBackup(): Promise<ApiResponse<BackupResponse>> {
  return apiClient.post<BackupResponse>('/admin/backup');
}

export async function getBackupsList(): Promise<ApiResponse<BackupResponse[]>> {
  return apiClient.get<BackupResponse[]>('/admin/backups');
}

export async function downloadBackup(filename: string): Promise<Blob> {
  return apiClient.download(`/admin/backups/${filename}`);
}

export async function restoreFromBackup(data: RestoreRequest): Promise<ApiResponse<{
  success: boolean;
  message: string;
  restoredTables: string[];
}>> {
  return apiClient.post('/admin/restore', data);
}

export async function uploadAndRestoreBackup(file: File): Promise<ApiResponse<{
  success: boolean;
  message: string;
  filename: string;
  restoredTables: string[];
}>> {
  return apiClient.upload('/admin/restore-upload', file, 'backup');
}

// ============ GESTIÓN DE SECRETOS Y SEGURIDAD ============

export async function rotateSecrets(): Promise<ApiResponse<{
  success: boolean;
  message: string;
  newSecretGenerated: boolean;
  backupCreated: boolean;
}>> {
  return apiClient.post('/admin/rotate-secrets');
}

export async function getSecurityStatus(): Promise<ApiResponse<{
  jwtSecretAge: number;
  lastRotation: string | null;
  recommendsRotation: boolean;
  activeTokens: number;
}>> {
  return apiClient.get('/admin/security-status');
}

// ============ ESTADÍSTICAS Y MÉTRICAS ============

export async function getSystemStats(): Promise<ApiResponse<{
  uptime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  diskUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  activeConnections: number;
  requestsToday: number;
  errorRate: number;
}>> {
  return apiClient.get('/admin/stats');
}

export async function getDatabaseStats(): Promise<ApiResponse<{
  tables: Array<{
    name: string;
    rows: number;
    size: string;
  }>;
  totalSize: string;
  connections: number;
  version: string;
}>> {
  return apiClient.get('/admin/database-stats');
}

// ============ CONFIGURACIÓN DEL SISTEMA ============

export async function getSystemConfig(): Promise<ApiResponse<{
  version: string;
  environment: string;
  features: Record<string, boolean>;
  limits: {
    maxUsers: number;
    maxProducts: number;
    maxTransactionsPerDay: number;
  };
}>> {
  return apiClient.get('/admin/config');
}

export async function updateSystemConfig(config: {
  features?: Record<string, boolean>;
  limits?: {
    maxUsers?: number;
    maxProducts?: number;
    maxTransactionsPerDay?: number;
  };
}): Promise<ApiResponse<{ success: boolean; message: string }>> {
  return apiClient.patch('/admin/config', config);
}

// ============ FUNCIONES UTILITARIAS ============

export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

export function getHealthStatus(health: HealthCheckResponse): 'healthy' | 'warning' | 'critical' {
  if (health.status === 'error' || health.database === 'disconnected') {
    return 'critical';
  }
  
  if (health.uptime < 300) { // Menos de 5 minutos
    return 'warning';
  }
  
  return 'healthy';
}

export function shouldRotateSecrets(securityStatus: {
  jwtSecretAge: number;
  lastRotation: string | null;
  recommendsRotation: boolean;
}): boolean {
  return securityStatus.recommendsRotation || securityStatus.jwtSecretAge > 30; // 30 días
}

// Funciones para manejo de errores administrativos
export class AdminError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AdminError';
  }
}

export function handleAdminOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  return operation().catch(error => {
    console.error(`Error en operación administrativa [${operationName}]:`, error);
    throw new AdminError(
      `Error en ${operationName}: ${error.message}`,
      `ADMIN_${operationName.toUpperCase()}_ERROR`,
      error
    );
  });
}