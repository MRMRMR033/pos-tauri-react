// src/pages/Administracion.tsx - Panel de administración del sistema
import React, { useState, useEffect } from 'react';
import { Button, Input, Spinner } from '../components/ui';
import { usePermissions } from '../hooks/usePermissions';
import { 
  getHealthCheck, 
  createBackup, 
  getBackupsList, 
  downloadBackup,
  uploadAndRestoreBackup,
  rotateSecrets,
  getSystemStats,
  getDatabaseStats,
  formatFileSize,
  formatUptime,
  getHealthStatus,
  AdminError
} from '../api/admin';
import {
  HealthCheckResponse,
  BackupResponse
} from '../types/api';
import { ALL_PERMISSIONS } from '../types/permissions';
import './Administracion.css';

const Administracion: React.FC = () => {
  const { hasPermission, isAdmin } = usePermissions();
  
  // Estados para salud del sistema
  const [healthCheck, setHealthCheck] = useState<HealthCheckResponse | null>(null);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [databaseStats, setDatabaseStats] = useState<any>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Estados para backups
  const [backups, setBackups] = useState<BackupResponse[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(false);

  // Estados para rotación de secretos
  const [rotatingSecrets, setRotatingSecrets] = useState(false);

  // Estados para restauración
  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  // Estados de notificaciones
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Verificar permisos de admin
  if (!isAdmin()) {
    return (
      <div className="admin-page no-access">
        <h2>Acceso Denegado</h2>
        <p>Solo los administradores pueden acceder a esta sección.</p>
      </div>
    );
  }

  // Cargar datos iniciales
  useEffect(() => {
    loadHealthData();
    loadBackupsList();
  }, []);

  // ============ FUNCIONES DE SALUD DEL SISTEMA ============

  const loadHealthData = async () => {
    setLoadingHealth(true);
    try {
      const [healthResponse, statsResponse, dbStatsResponse] = await Promise.all([
        getHealthCheck(),
        getSystemStats(),
        getDatabaseStats()
      ]);

      setHealthCheck(healthResponse.data);
      setSystemStats(statsResponse.data);
      setDatabaseStats(dbStatsResponse.data);
    } catch (error) {
      console.error('Error cargando datos de salud:', error);
      showMessage('error', 'Error al cargar el estado del sistema');
    } finally {
      setLoadingHealth(false);
    }
  };

  // ============ FUNCIONES DE BACKUP ============

  const loadBackupsList = async () => {
    setLoadingBackups(true);
    try {
      const response = await getBackupsList();
      setBackups(response.data);
    } catch (error) {
      console.error('Error cargando lista de backups:', error);
      showMessage('error', 'Error al cargar la lista de backups');
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const response = await createBackup();
      showMessage('success', `Backup creado exitosamente: ${response.data.filename}`);
      await loadBackupsList(); // Recargar lista
    } catch (error) {
      console.error('Error creando backup:', error);
      showMessage('error', 'Error al crear el backup');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDownloadBackup = async (filename: string) => {
    try {
      const blob = await downloadBackup(filename);
      
      // Crear URL y descargar
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showMessage('success', `Backup ${filename} descargado`);
    } catch (error) {
      console.error('Error descargando backup:', error);
      showMessage('error', 'Error al descargar el backup');
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreFile) {
      showMessage('error', 'Selecciona un archivo de backup');
      return;
    }

    const confirmRestore = confirm(
      '⚠️ ADVERTENCIA: Esta operación sobrescribirá todos los datos actuales. ¿Estás seguro?'
    );
    
    if (!confirmRestore) return;

    setRestoringBackup(true);
    try {
      const response = await uploadAndRestoreBackup(restoreFile);
      
      if (response.data.success) {
        showMessage('success', `Restauración exitosa: ${response.data.message}`);
        setRestoreFile(null);
      } else {
        showMessage('error', `Error en restauración: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error restaurando backup:', error);
      showMessage('error', 'Error al restaurar el backup');
    } finally {
      setRestoringBackup(false);
    }
  };

  // ============ FUNCIONES DE SEGURIDAD ============

  const handleRotateSecrets = async () => {
    const confirmRotate = confirm(
      '⚠️ ADVERTENCIA: Esto invalidará todas las sesiones activas. ¿Continuar?'
    );
    
    if (!confirmRotate) return;

    setRotatingSecrets(true);
    try {
      const response = await rotateSecrets();
      
      if (response.data.success) {
        showMessage('success', 'Secretos rotados exitosamente. Las sesiones se reiniciarán.');
        // Podrías redirigir al login aquí
      } else {
        showMessage('error', 'Error al rotar secretos');
      }
    } catch (error) {
      console.error('Error rotando secretos:', error);
      showMessage('error', 'Error al rotar secretos');
    } finally {
      setRotatingSecrets(false);
    }
  };

  // ============ FUNCIONES UTILITARIAS ============

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-MX');
  };

  // ============ RENDER ============

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Administración del Sistema</h1>
        <Button onClick={loadHealthData} disabled={loadingHealth} size="sm">
          🔄 Actualizar
        </Button>
      </div>

      {/* Notificaciones */}
      {message && (
        <div className={`admin-message admin-message--${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Estado de Salud del Sistema */}
      <section className="admin-section">
        <h2>📊 Estado del Sistema</h2>
        
        {loadingHealth ? (
          <div className="admin-loading">
            <Spinner size="md" />
            <span>Cargando estado del sistema...</span>
          </div>
        ) : (
          <div className="health-grid">
            {healthCheck && (
              <div className={`health-card health-card--${getHealthStatus(healthCheck)}`}>
                <h3>Salud General</h3>
                <div className="health-status">
                  <span className="status-indicator"></span>
                  {healthCheck.status === 'ok' ? 'Saludable' : 'Con problemas'}
                </div>
                <div className="health-details">
                  <p><strong>Base de datos:</strong> {healthCheck.database}</p>
                  <p><strong>Migraciones:</strong> {healthCheck.migrations}</p>
                  <p><strong>Permisos:</strong> {healthCheck.permissions}</p>
                  <p><strong>Tiempo activo:</strong> {formatUptime(healthCheck.uptime)}</p>
                </div>
              </div>
            )}

            {systemStats && (
              <div className="health-card">
                <h3>Recursos del Sistema</h3>
                <div className="resource-stats">
                  <div className="stat-item">
                    <span>Memoria:</span>
                    <span>{systemStats.memoryUsage.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="stat-item">
                    <span>Disco:</span>
                    <span>{systemStats.diskUsage.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="stat-item">
                    <span>Conexiones:</span>
                    <span>{systemStats.activeConnections}</span>
                  </div>
                  <div className="stat-item">
                    <span>Requests hoy:</span>
                    <span>{systemStats.requestsToday}</span>
                  </div>
                </div>
              </div>
            )}

            {databaseStats && (
              <div className="health-card">
                <h3>Base de Datos</h3>
                <div className="db-stats">
                  <p><strong>Versión:</strong> {databaseStats.version}</p>
                  <p><strong>Tamaño total:</strong> {databaseStats.totalSize}</p>
                  <p><strong>Conexiones:</strong> {databaseStats.connections}</p>
                  <p><strong>Tablas:</strong> {databaseStats.tables.length}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Gestión de Backups */}
      <section className="admin-section">
        <h2>💾 Gestión de Backups</h2>
        
        <div className="backup-actions">
          <Button
            onClick={handleCreateBackup}
            loading={creatingBackup}
            variant="primary"
          >
            📁 Crear Backup
          </Button>
          
          <Button
            onClick={loadBackupsList}
            loading={loadingBackups}
            variant="secondary"
            size="sm"
          >
            🔄 Actualizar Lista
          </Button>
        </div>

        {/* Lista de Backups */}
        <div className="backups-list">
          <h3>Backups Disponibles</h3>
          {loadingBackups ? (
            <div className="admin-loading">
              <Spinner size="sm" />
              <span>Cargando backups...</span>
            </div>
          ) : backups.length === 0 ? (
            <p className="no-backups">No hay backups disponibles</p>
          ) : (
            <div className="backups-table">
              <table>
                <thead>
                  <tr>
                    <th>Archivo</th>
                    <th>Tamaño</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((backup) => (
                    <tr key={backup.filename}>
                      <td>{backup.filename}</td>
                      <td>{formatFileSize(backup.size)}</td>
                      <td>{formatDate(backup.created)}</td>
                      <td>
                        <Button
                          onClick={() => handleDownloadBackup(backup.filename)}
                          variant="ghost"
                          size="sm"
                        >
                          📥 Descargar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Restaurar Backup */}
        <div className="restore-section">
          <h3>⚠️ Restaurar desde Backup</h3>
          <div className="restore-form">
            <Input
              type="file"
              accept=".sql,.dump"
              onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
              label="Seleccionar archivo de backup"
            />
            
            <Button
              onClick={handleRestoreBackup}
              loading={restoringBackup}
              variant="danger"
              disabled={!restoreFile}
            >
              ⚠️ Restaurar Base de Datos
            </Button>
          </div>
          <p className="restore-warning">
            ⚠️ Esta operación sobrescribirá todos los datos actuales de forma irreversible.
          </p>
        </div>
      </section>

      {/* Seguridad y Mantenimiento */}
      <section className="admin-section">
        <h2>🔐 Seguridad y Mantenimiento</h2>
        
        <div className="security-actions">
          <div className="security-card">
            <h3>Rotación de Secretos</h3>
            <p>Rota las claves JWT para invalidar todas las sesiones activas.</p>
            <Button
              onClick={handleRotateSecrets}
              loading={rotatingSecrets}
              variant="danger"
            >
              🔄 Rotar Secretos
            </Button>
          </div>
        </div>
      </section>

      {/* Información del Sistema */}
      <section className="admin-section">
        <h2>ℹ️ Información del Sistema</h2>
        <div className="system-info">
          <div className="info-grid">
            <div className="info-item">
              <span>Versión de la API:</span>
              <span>1.0.0</span>
            </div>
            <div className="info-item">
              <span>Entorno:</span>
              <span>{process.env.NODE_ENV}</span>
            </div>
            <div className="info-item">
              <span>Última actualización:</span>
              <span>{new Date().toLocaleString('es-MX')}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Administracion;