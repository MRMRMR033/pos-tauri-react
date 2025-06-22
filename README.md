# My POS Desktop

Sistema de Punto de Venta (POS) desarrollado con React, TypeScript y Tauri. Una aplicación de escritorio moderna para gestión de ventas, inventario y usuarios.

## 🚀 Características Principales

### ✅ Sistema de Autenticación
- Login seguro con JWT tokens
- Gestión de sesiones con Tauri Store
- Sistema de permisos granular por módulos
- Roles de usuario (ADMIN/EMPLEADO)

### 💰 Módulo de Ventas
- Búsqueda de productos en tiempo real con debounce
- Validación de stock antes de agregar productos
- Carrito de compras con controles de cantidad
- Sistema de descuentos (con permisos)
- Cálculo automático de totales
- Modal de cobro integrado
- **Sin visualización de márgenes de ganancia** (eliminado por solicitud del usuario)

### 📦 Gestión de Productos
- CRUD completo de productos
- Gestión de categorías y proveedores
- Control de precios (costo y venta)
- Sistema de códigos de barras
- Búsqueda y filtrado avanzado

### 📊 Gestión de Inventario
- **Sistema completamente funcional** (actualizado de mockup a API real)
- Movimientos de inventario (entrada/salida/ajuste)
- Búsqueda de productos con dropdown
- Validación de stock en tiempo real
- Historial de movimientos
- Alertas de stock bajo
- Permisos granulares para operaciones

### 📈 Reportes y Estadísticas
- **Integración completa con API real** (eliminados todos los mockups)
- Estadísticas en tiempo real:
  - Ventas diarias, semanales y mensuales
  - Productos activos y stock bajo
  - Usuarios activos
  - Valor total del inventario
- Reportes detallados:
  - Reporte de ventas por fechas
  - Productos más vendidos (ranking)
  - Estado del inventario con detalles
- Filtros por fecha y tipo de reporte
- Exportación a Excel/PDF (en desarrollo)

### 👥 Gestión de Usuarios
- **CRUD completo con API real** (eliminados mockups)
- Creación de nuevos usuarios con formulario completo
- Edición de usuarios existentes
- Eliminación de usuarios (con validaciones de seguridad)
- Sistema de permisos por módulo
- Roles dinámicos (ADMIN/EMPLEADO)
- Estados activo/inactivo
- Prevención de auto-eliminación y auto-modificación crítica

## 🎨 Diseño y UX

### Glassmorphism Design System
- **Efectos de vidrio esmerilado** en toda la aplicación
- **Gradientes modernos** con colores consistentes
- **Animaciones suaves** y transiciones fluidas
- **Backdrop blur effects** para profundidad visual

### Layout Responsivo
- **Problema resuelto**: Elementos ocultos por scroll
  - Corregido en DashboardLayout.css (`.dl-content` overflow)
  - Altura calculada correctamente con `calc(100vh - 70px)`
  - Total y botones siempre visibles en vista de ventas
- Adaptado para móviles y tablets
- Grid systems flexibles

### Sistema de Búsqueda
- **Z-index corregido** para resultados de búsqueda
- Búsqueda en tiempo real con debounce (300ms)
- Dropdown con información completa del producto
- Navegación por teclado (flechas, Enter, Escape)

## 🔧 Arquitectura Técnica

### Frontend
- **React 18** con TypeScript
- **Tauri** para aplicación de escritorio
- **React Router** para navegación
- **Context API** para estado global
- **Custom hooks** para lógica reutilizable

### Sistema de Permisos
```typescript
// Permisos granulares por módulo
ALL_PERMISSIONS = {
  VENTAS_CREAR: 'ventas:crear',
  PRODUCTOS_VER: 'productos:ver',
  PRODUCTOS_VER_STOCK: 'productos:ver_stock',
  PRODUCTOS_VER_PRECIO_COSTO: 'productos:ver_precio_costo',
  USUARIOS_GESTIONAR: 'usuarios:gestionar',
  // ... más permisos
}
```

### API Integration
- **HTTP Client** con Tauri fetch plugin
- **Error handling** robusto en todas las llamadas
- **Loading states** apropiados
- **Toast notifications** para feedback

### Componentes Protegidos
```typescript
<ProtectedComponent permission={ALL_PERMISSIONS.PRODUCTOS_VER}>
  <ProductosList />
</ProtectedComponent>
```

## 🛠️ Desarrollo

### Estructura del Proyecto
```
src/
├── api/           # Integración con backend API
├── components/    # Componentes reutilizables
├── contexts/      # Contextos de React
├── hooks/         # Custom hooks
├── pages/         # Páginas principales
├── types/         # Definiciones TypeScript
└── utils/         # Utilidades
```

### APIs Implementadas
- `auth.ts` - Autenticación y autorización
- `products.ts` - Gestión de productos
- `sales.ts` - Gestión de ventas
- `users.ts` - Gestión de usuarios
- `reports.ts` - Reportes y estadísticas
- `categories.ts` - Categorías
- `suppliers.ts` - Proveedores

### Atajos de Teclado
- **F1**: Ventas
- **F2**: Productos  
- **F4**: Inventario
- **F12**: Abrir modal de cobro (solo en ventas)

## 🔥 Últimas Actualizaciones

### Sesión de Desarrollo Actual
1. **✅ Corregido z-index búsqueda**: Los resultados de búsqueda ahora aparecen correctamente encima de la tabla de ventas
2. **✅ Vista de Reportes**: Migrada completamente de mockups a API real con estadísticas en tiempo real
3. **✅ Vista de Inventario**: Sistema completamente funcional con API real, movimientos y validaciones
4. **✅ Vista de Usuarios**: CRUD completo implementado con modales modernos y validaciones de seguridad

### Problemas Resueltos
- **Layout scroll issues**: Elementos no se ocultan más por problemas de scroll
- **Search dropdown z-index**: Los resultados de búsqueda aparecen correctamente encima de otros elementos
- **API integration**: Todas las vistas ahora usan datos reales en lugar de mockups
- **Permission system**: Sistema de permisos granular funcionando en todas las vistas

### Características Eliminadas por Solicitud
- **Visualización de márgenes**: Eliminada la columna de margen en la vista de ventas
- **Mockup data**: Eliminados todos los datos simulados, ahora usa API real

## 🎯 Estado del Proyecto

### Completado ✅
- Sistema de autenticación completo
- Vista de ventas funcional con validaciones
- Gestión de productos, categorías y proveedores
- **Sistema de inventario completamente funcional**
- **Reportes con datos reales y estadísticas en tiempo real**
- **Gestión de usuarios con CRUD completo**
- Sistema de permisos granular
- Layout responsivo y diseño moderno

### En Desarrollo 🔄
- Funcionalidad de exportación de reportes (Excel/PDF)
- Módulo de configuración del sistema
- Gestión de sesiones de caja

### Arquitectura Backend
- **NestJS** con TypeScript
- **Base de datos** (PostgreSQL/MySQL)
- **JWT Authentication**
- **Role-based permissions**

## 📝 Notas para la Nueva Versión

Este proyecto tiene una arquitectura sólida con:
- **Separación clara** entre componentes de UI y lógica de negocio
- **Sistema de permisos** granular y extensible
- **Integración completa** con API backend
- **Diseño moderno** con glassmorphism y animaciones
- **Código limpio** y bien documentado

**Puntos importantes**:
- El usuario prefiere **funcionalidad sobre mockups** - siempre usar API real
- **Layout responsivo** es crítico - elementos deben estar siempre visibles
- **Sistema de permisos** debe respetarse en todas las vistas
- **UX moderna** con animaciones pero sin comprometer performance
- **Validaciones robustas** tanto en frontend como integración con backend

La aplicación está en un estado avanzado y listo para continuar con módulos adicionales o refinamientos según las necesidades del usuario.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
