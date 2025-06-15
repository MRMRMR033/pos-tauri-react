// src/types/tauri.d.ts o src/global.d.ts

interface Window {
    /**
     * La API de Tauri inyectada globalmente cuando se ejecuta dentro de un entorno Tauri.
     * Contiene funciones como 'invoke', 'appWindow', 'path', etc.
     * Es 'undefined' cuando la aplicación se ejecuta fuera de un entorno Tauri (ej. en un navegador web).
     */
    __TAURI__?: {
      // Puedes ser más específico si quieres, pero 'any' suele ser suficiente
      // para esta verificación simple. Si necesitas tipar profundamente,
      // puedes importar los tipos de @tauri-apps/api.
      // Por ejemplo:
      // appWindow: import('@tauri-apps/api/app').AppWindow;
      // invoke: typeof import('@tauri-apps/api/core').invoke;
      // etc.
    } | {
      // Para Tauri v2, la estructura de __TAURI__ puede ser ligeramente diferente o más detallada.
      // Lo importante es que exista. Si necesitas más detalle para los plugins:
      plugins: {
        store: {
          Store: any; // o typeof import('@tauri-apps/plugin-store').Store;
        }
        // ... otros plugins
      }
    } | any; // Para ser más flexible y cubrir diferentes versiones y configuraciones
  }