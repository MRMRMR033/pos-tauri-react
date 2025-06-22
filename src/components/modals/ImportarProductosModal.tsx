// src/components/modals/ImportarProductosModal.tsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import './ImportarProductosModal.css';
import { useToast } from '../../contexts/ToastContext';
import { createProducto } from '../../api/products';
import { getProveedores } from '../../api/suppliers';
import { getCategorias } from '../../api/categories';

interface ImportarProductosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ExcelRow {
  [key: string]: any;
}

interface CampoMapeo {
  campo: string;
  nombre: string;
  requerido: boolean;
  tipo: 'texto' | 'numero' | 'decimal';
  descripcion: string;
}

interface MapeoColumnas {
  [campo: string]: string | null; // mapea campo del sistema -> columna del Excel
}

const CAMPOS_PRODUCTO: CampoMapeo[] = [
  { campo: 'nombre', nombre: 'Nombre del Producto', requerido: true, tipo: 'texto', descripcion: 'Nombre comercial del producto' },
  { campo: 'codigoBarras', nombre: 'Código de Barras', requerido: false, tipo: 'texto', descripcion: 'Código de barras único del producto' },
  { campo: 'descripcion', nombre: 'Descripción', requerido: false, tipo: 'texto', descripcion: 'Descripción detallada del producto' },
  { campo: 'precioCosto', nombre: 'Precio de Costo', requerido: true, tipo: 'decimal', descripcion: 'Precio de compra del producto' },
  { campo: 'precioVenta', nombre: 'Precio de Venta', requerido: true, tipo: 'decimal', descripcion: 'Precio al público del producto' },
  { campo: 'stock', nombre: 'Stock Inicial', requerido: true, tipo: 'numero', descripcion: 'Cantidad inicial en inventario' },
  { campo: 'stockMinimo', nombre: 'Stock Mínimo', requerido: false, tipo: 'numero', descripcion: 'Cantidad mínima antes de reordenar' },
  { campo: 'categoria', nombre: 'Categoría', requerido: true, tipo: 'texto', descripcion: 'Nombre de la categoría del producto' },
  { campo: 'proveedor', nombre: 'Proveedor', requerido: false, tipo: 'texto', descripcion: 'Nombre del proveedor del producto' },
  { campo: 'unidadMedida', nombre: 'Unidad de Medida', requerido: false, tipo: 'texto', descripcion: 'Unidad de medida (pza, kg, lt, etc.)' },
];

const ImportarProductosModal: React.FC<ImportarProductosModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showSuccess, showError, showWarning } = useToast();
  const [paso, setPaso] = useState<'upload' | 'mapeo' | 'preview' | 'importing'>('upload');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [datosExcel, setDatosExcel] = useState<ExcelRow[]>([]);
  const [columnasExcel, setColumnasExcel] = useState<string[]>([]);
  const [mapeoColumnas, setMapeoColumnas] = useState<MapeoColumnas>({});
  const [productosPreview, setProductosPreview] = useState<any[]>([]);
  const [erroresValidacion, setErroresValidacion] = useState<string[]>([]);
  const [progreso, setProgreso] = useState(0);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);

  // Cargar categorías y proveedores al abrir
  React.useEffect(() => {
    if (isOpen) {
      cargarCatalogosDatos();
    }
  }, [isOpen]);

  const cargarCatalogosDatos = async () => {
    try {
      const [categoriasRes, proveedoresRes] = await Promise.all([
        getCategorias(),
        getProveedores()
      ]);
      setCategorias(categoriasRes.data || []);
      setProveedores(proveedoresRes.data || []);
    } catch (error) {
      console.error('Error cargando catálogos:', error);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      showError('Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV válido');
      return;
    }

    setArchivo(file);
    procesarArchivo(file);
  }, []);

  const procesarArchivo = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Tomar la primera hoja
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir a JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          showError('El archivo debe tener al menos una fila de encabezados y una fila de datos');
          return;
        }

        // Primera fila como encabezados
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];

        // Convertir a objetos
        const excelData = rows.map(row => {
          const obj: ExcelRow = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        }).filter(row => {
          // Filtrar filas completamente vacías
          return Object.values(row).some(value => value !== '' && value != null);
        });

        setColumnasExcel(headers);
        setDatosExcel(excelData);
        setPaso('mapeo');
        
        // Sugerir mapeo automático
        sugerirMapeoAutomatico(headers);
        
        showSuccess(`Archivo cargado: ${excelData.length} productos encontrados`);
      } catch (error) {
        console.error('Error procesando archivo:', error);
        showError('Error al procesar el archivo. Verifica que sea un Excel válido.');
      }
    };

    reader.readAsBinaryString(file);
  };

  const sugerirMapeoAutomatico = (headers: string[]) => {
    const mapeoSugerido: MapeoColumnas = {};
    
    // Patrones de coincidencia para mapeo automático
    const patrones = {
      'nombre': /^(nombre|product|descripcion|description|title|titulo)$/i,
      'codigoBarras': /^(codigo|code|barcode|sku|ref|referencia)$/i,
      'descripcion': /^(descripcion|description|desc|detalle)$/i,
      'precioCosto': /^(costo|cost|precio_costo|precio_compra|compra)$/i,
      'precioVenta': /^(precio|price|venta|precio_venta|pvp|sale)$/i,
      'stock': /^(stock|cantidad|qty|quantity|inventario|existencia)$/i,
      'stockMinimo': /^(minimo|minimum|min_stock|stock_min)$/i,
      'categoria': /^(categoria|category|cat|tipo|type)$/i,
      'proveedor': /^(proveedor|supplier|vendor|distribuidor)$/i,
      'unidadMedida': /^(unidad|unit|medida|measure|um)$/i,
    };

    headers.forEach(header => {
      Object.entries(patrones).forEach(([campo, patron]) => {
        if (patron.test(header.trim())) {
          mapeoSugerido[campo] = header;
        }
      });
    });

    setMapeoColumnas(mapeoSugerido);
  };

  const actualizarMapeo = (campo: string, columna: string | null) => {
    setMapeoColumnas(prev => ({
      ...prev,
      [campo]: columna
    }));
  };

  const generarPreview = () => {
    const errores: string[] = [];
    const productos: any[] = [];

    // Validar mapeos requeridos
    CAMPOS_PRODUCTO.filter(c => c.requerido).forEach(campo => {
      if (!mapeoColumnas[campo.campo]) {
        errores.push(`El campo "${campo.nombre}" es requerido y debe estar mapeado`);
      }
    });

    if (errores.length > 0) {
      setErroresValidacion(errores);
      return;
    }

    // Procesar cada fila
    datosExcel.forEach((fila, index) => {
      const producto: any = {};
      const erroresFila: string[] = [];

      // Mapear cada campo
      Object.entries(mapeoColumnas).forEach(([campo, columna]) => {
        if (!columna) return;

        const valor = fila[columna];
        const campoInfo = CAMPOS_PRODUCTO.find(c => c.campo === campo);

        if (!campoInfo) return;

        // Validar campo requerido
        if (campoInfo.requerido && (!valor || valor.toString().trim() === '')) {
          erroresFila.push(`Fila ${index + 2}: ${campoInfo.nombre} es requerido`);
          return;
        }

        // Convertir según tipo
        try {
          switch (campoInfo.tipo) {
            case 'numero':
              if (valor && valor !== '') {
                const num = parseInt(valor);
                if (isNaN(num)) {
                  erroresFila.push(`Fila ${index + 2}: ${campoInfo.nombre} debe ser un número entero`);
                } else {
                  producto[campo] = num;
                }
              }
              break;
            case 'decimal':
              if (valor && valor !== '') {
                const num = parseFloat(valor);
                if (isNaN(num)) {
                  erroresFila.push(`Fila ${index + 2}: ${campoInfo.nombre} debe ser un número decimal`);
                } else {
                  producto[campo] = num;
                }
              }
              break;
            default:
              producto[campo] = valor ? valor.toString().trim() : '';
          }
        } catch (error) {
          erroresFila.push(`Fila ${index + 2}: Error procesando ${campoInfo.nombre}`);
        }
      });

      // Validaciones adicionales
      if (producto.precioCosto && producto.precioVenta && producto.precioCosto > producto.precioVenta) {
        erroresFila.push(`Fila ${index + 2}: El precio de costo no puede ser mayor al precio de venta`);
      }

      if (erroresFila.length === 0) {
        productos.push({ ...producto, fila: index + 2 });
      } else {
        errores.push(...erroresFila);
      }
    });

    setErroresValidacion(errores);
    setProductosPreview(productos);

    if (errores.length === 0) {
      setPaso('preview');
      showSuccess(`${productos.length} productos listos para importar`);
    } else {
      showWarning(`Se encontraron ${errores.length} errores en los datos`);
    }
  };

  const importarProductos = async () => {
    setPaso('importing');
    setProgreso(0);

    let exitosos = 0;
    let fallidos = 0;
    const erroresImportacion: string[] = [];

    for (let i = 0; i < productosPreview.length; i++) {
      const producto = productosPreview[i];
      
      try {
        // Buscar o crear categoría
        let categoriaId = 1; // Categoría por defecto
        if (producto.categoria) {
          const categoriaExistente = categorias.find(c => 
            c.nombre.toLowerCase() === producto.categoria.toLowerCase()
          );
          if (categoriaExistente) {
            categoriaId = categoriaExistente.id;
          } else {
            // En una implementación completa, aquí crearías la categoría
            showWarning(`Categoría "${producto.categoria}" no encontrada, usando categoría por defecto`);
          }
        }

        // Buscar proveedor
        let proveedorId = null;
        if (producto.proveedor) {
          const proveedorExistente = proveedores.find(p => 
            p.nombre.toLowerCase() === producto.proveedor.toLowerCase()
          );
          if (proveedorExistente) {
            proveedorId = proveedorExistente.id;
          }
        }

        // Crear producto
        const nuevoProducto = {
          nombre: producto.nombre,
          codigoBarras: producto.codigoBarras || null,
          descripcion: producto.descripcion || '',
          precioCosto: producto.precioCosto,
          precioVenta: producto.precioVenta,
          stock: producto.stock || 0,
          stockMinimo: producto.stockMinimo || 0,
          categoriaId,
          proveedorId,
          unidadMedida: producto.unidadMedida || 'pza',
        };

        await createProducto(nuevoProducto);
        exitosos++;
      } catch (error: any) {
        fallidos++;
        erroresImportacion.push(`Fila ${producto.fila}: ${error.message || 'Error desconocido'}`);
      }

      // Actualizar progreso
      setProgreso(Math.round(((i + 1) / productosPreview.length) * 100));
    }

    // Mostrar resultados
    if (exitosos > 0) {
      showSuccess(`Importación completada: ${exitosos} productos importados exitosamente`);
      if (fallidos > 0) {
        showWarning(`${fallidos} productos fallaron al importar`);
      }
      onSuccess();
      cerrarModal();
    } else {
      showError('No se pudo importar ningún producto');
    }
  };

  const cerrarModal = () => {
    setPaso('upload');
    setArchivo(null);
    setDatosExcel([]);
    setColumnasExcel([]);
    setMapeoColumnas({});
    setProductosPreview([]);
    setErroresValidacion([]);
    setProgreso(0);
    onClose();
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content importar-productos-modal">
        <div className="modal-header">
          <h2>📥 Importar Productos desde Excel</h2>
          <button onClick={cerrarModal} className="modal-close">×</button>
        </div>

        <div className="modal-body">
          {/* Indicador de pasos */}
          <div className="pasos-indicator">
            <div className={`paso ${paso === 'upload' ? 'activo' : (paso === 'mapeo' || paso === 'preview' || paso === 'importing') ? 'completado' : ''}`}>
              1. Cargar Archivo
            </div>
            <div className={`paso ${paso === 'mapeo' ? 'activo' : (paso === 'preview' || paso === 'importing') ? 'completado' : ''}`}>
              2. Mapear Columnas
            </div>
            <div className={`paso ${paso === 'preview' ? 'activo' : paso === 'importing' ? 'completado' : ''}`}>
              3. Vista Previa
            </div>
            <div className={`paso ${paso === 'importing' ? 'activo' : ''}`}>
              4. Importar
            </div>
          </div>

          {/* Paso 1: Upload */}
          {paso === 'upload' && (
            <div className="paso-upload">
              <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                <input {...getInputProps()} />
                <div className="dropzone-content">
                  <div className="dropzone-icon">📁</div>
                  <p className="dropzone-text">
                    {isDragActive 
                      ? 'Suelta el archivo aquí...' 
                      : 'Arrastra y suelta un archivo Excel aquí, o haz clic para seleccionar'
                    }
                  </p>
                  <p className="dropzone-subtext">
                    Archivos soportados: .xlsx, .xls, .csv (máximo 1 archivo)
                  </p>
                </div>
              </div>

              {archivo && (
                <div className="archivo-seleccionado">
                  <p>📄 {archivo.name} ({(archivo.size / 1024).toFixed(1)} KB)</p>
                </div>
              )}

              <div className="requisitos-info">
                <h4>📋 Requisitos del archivo:</h4>
                <ul>
                  <li>Primera fila debe contener los encabezados de columnas</li>
                  <li>Los campos requeridos son: Nombre, Precio Costo, Precio Venta, Stock, Categoría</li>
                  <li>Los precios deben ser números válidos</li>
                  <li>El stock debe ser un número entero</li>
                </ul>
              </div>
            </div>
          )}

          {/* Paso 2: Mapeo */}
          {paso === 'mapeo' && (
            <div className="paso-mapeo">
              <h3>🔗 Mapear Columnas del Excel a Campos del Sistema</h3>
              <p>Selecciona qué columna de tu Excel corresponde a cada campo del sistema:</p>

              <div className="mapeo-grid">
                {CAMPOS_PRODUCTO.map(campo => (
                  <div key={campo.campo} className="mapeo-field">
                    <div className="field-info">
                      <label className={campo.requerido ? 'required' : ''}>
                        {campo.nombre}
                        {campo.requerido && <span className="required-asterisk">*</span>}
                      </label>
                      <small>{campo.descripcion}</small>
                    </div>
                    <select
                      value={mapeoColumnas[campo.campo] || ''}
                      onChange={(e) => actualizarMapeo(campo.campo, e.target.value || null)}
                      className={campo.requerido && !mapeoColumnas[campo.campo] ? 'error' : ''}
                    >
                      <option value="">-- No mapear --</option>
                      {columnasExcel.map(columna => (
                        <option key={columna} value={columna}>{columna}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {erroresValidacion.length > 0 && (
                <div className="errores-validacion">
                  <h4>❌ Errores de Validación:</h4>
                  <ul>
                    {erroresValidacion.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="paso-actions">
                <button onClick={() => setPaso('upload')} className="btn-secondary">
                  ← Volver
                </button>
                <button onClick={generarPreview} className="btn-primary">
                  Generar Vista Previa →
                </button>
              </div>
            </div>
          )}

          {/* Paso 3: Preview */}
          {paso === 'preview' && (
            <div className="paso-preview">
              <h3>👀 Vista Previa de Productos</h3>
              <p>Se encontraron {productosPreview.length} productos válidos para importar:</p>

              <div className="preview-table-container">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>Fila</th>
                      <th>Nombre</th>
                      <th>Código</th>
                      <th>Precio Costo</th>
                      <th>Precio Venta</th>
                      <th>Stock</th>
                      <th>Categoría</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosPreview.slice(0, 10).map((producto, index) => (
                      <tr key={index}>
                        <td>{producto.fila}</td>
                        <td>{producto.nombre}</td>
                        <td>{producto.codigoBarras || '-'}</td>
                        <td>${producto.precioCosto}</td>
                        <td>${producto.precioVenta}</td>
                        <td>{producto.stock}</td>
                        <td>{producto.categoria}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {productosPreview.length > 10 && (
                  <p className="preview-note">... y {productosPreview.length - 10} productos más</p>
                )}
              </div>

              <div className="paso-actions">
                <button onClick={() => setPaso('mapeo')} className="btn-secondary">
                  ← Ajustar Mapeo
                </button>
                <button onClick={importarProductos} className="btn-primary">
                  🚀 Importar {productosPreview.length} Productos
                </button>
              </div>
            </div>
          )}

          {/* Paso 4: Importing */}
          {paso === 'importing' && (
            <div className="paso-importing">
              <h3>⏳ Importando Productos...</h3>
              <p>Por favor espera mientras se importan los productos</p>
              
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progreso}%` }}
                ></div>
              </div>
              <p className="progress-text">{progreso}% completado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportarProductosModal;