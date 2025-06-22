# 📥 Importación de Productos desde Excel

## 🚀 Funcionalidad Implementada

Se ha integrado una funcionalidad completa de importación de productos desde archivos Excel (.xlsx, .xls) o CSV, similar a sistemas profesionales como Eleventa.

### ✨ Características Principales

- **📁 Soporte Multi-formato**: Excel (.xlsx, .xls) y CSV
- **🔗 Mapeo Inteligente**: Detecta automáticamente columnas similares
- **✅ Validación Completa**: Valida tipos de datos y reglas de negocio
- **👀 Vista Previa**: Muestra los productos antes de importar
- **📊 Progreso en Tiempo Real**: Barra de progreso durante la importación
- **🔐 Permisos**: Respeta permisos de creación de productos
- **⌨️ Shortcut F4**: Acceso rápido con tecla de función

### 🎯 Cómo Usar

#### 1. **Acceso a la Funcionalidad**
- Ir a **Inventario** (requiere permisos de productos)
- Presionar **F4** o hacer clic en **"📥 Importar Excel"**

#### 2. **Cargar Archivo**
- Arrastrar y soltar archivo Excel/CSV
- O hacer clic para seleccionar archivo
- El archivo debe tener encabezados en la primera fila

#### 3. **Mapear Columnas**
- El sistema sugiere automáticamente mapeos basados en nombres de columnas
- Ajustar manualmente si es necesario
- Campos requeridos: Nombre, Precio Costo, Precio Venta, Stock, Categoría

#### 4. **Vista Previa**
- Revisar productos que se van a importar
- Verificar que no hay errores de validación
- Ver resumen de productos válidos

#### 5. **Importación**
- Confirmar importación
- Ver progreso en tiempo real
- Recibir reporte final de éxito/errores

### 📋 Campos Soportados

| Campo | Requerido | Tipo | Descripción |
|-------|-----------|------|-------------|
| **Nombre** | ✅ | Texto | Nombre comercial del producto |
| **Código de Barras** | ❌ | Texto | Código único del producto |
| **Descripción** | ❌ | Texto | Descripción detallada |
| **Precio de Costo** | ✅ | Decimal | Precio de compra |
| **Precio de Venta** | ✅ | Decimal | Precio al público |
| **Stock Inicial** | ✅ | Número | Cantidad en inventario |
| **Stock Mínimo** | ❌ | Número | Cantidad mínima |
| **Categoría** | ✅ | Texto | Nombre de la categoría |
| **Proveedor** | ❌ | Texto | Nombre del proveedor |
| **Unidad de Medida** | ❌ | Texto | Unidad (pza, kg, lt, etc.) |

### 🔍 Mapeo Automático

El sistema reconoce automáticamente estas variaciones de nombres de columnas:

- **Nombre**: nombre, product, descripcion, title, titulo
- **Código**: codigo, code, barcode, sku, ref, referencia
- **Precio Costo**: costo, cost, precio_costo, precio_compra, compra
- **Precio Venta**: precio, price, venta, precio_venta, pvp, sale
- **Stock**: stock, cantidad, qty, quantity, inventario, existencia
- **Categoría**: categoria, category, cat, tipo, type
- **Proveedor**: proveedor, supplier, vendor, distribuidor

### ✅ Validaciones Implementadas

1. **Campos Requeridos**: Verifica que estén presentes
2. **Tipos de Datos**: Números válidos para precios y stock
3. **Reglas de Negocio**: Precio costo ≤ Precio venta
4. **Duplicados**: Evita códigos de barras duplicados
5. **Categorías**: Busca categorías existentes o usa por defecto
6. **Proveedores**: Mapea a proveedores existentes

### 📄 Archivo de Ejemplo

Se incluye `ejemplo-productos.csv` con 10 productos de muestra mostrando el formato correcto.

### 🔧 Funcionalidades Técnicas

- **Drag & Drop**: Interfaz moderna de arrastrar y soltar
- **Procesamiento Asíncrono**: No bloquea la UI
- **Manejo de Errores**: Reportes detallados de errores por fila
- **Progreso Visual**: Barra de progreso animada
- **Responsive**: Funciona en pantallas pequeñas
- **Accesibilidad**: Navegación por teclado y shortcuts

### 🚨 Limitaciones y Consideraciones

- Máximo 1 archivo a la vez
- Se crean categorías inexistentes con ID por defecto
- Los proveedores deben existir previamente o se ignoran
- Los precios deben ser números válidos
- El stock debe ser entero positivo

### 🎨 Interfaz de Usuario

- **Pasos Visuales**: Indicador de progreso en 4 pasos
- **Glassmorphism**: Diseño moderno con efectos de cristal
- **Animaciones**: Transiciones suaves y feedback visual
- **Estados de Carga**: Indicadores de progreso y estados
- **Mensajes Claros**: Explicaciones detalladas en cada paso

Esta implementación proporciona una experiencia profesional comparable a sistemas comerciales como Eleventa, con todas las funcionalidades esperadas para la importación masiva de productos.