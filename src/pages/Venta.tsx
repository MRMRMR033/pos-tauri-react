// src/pages/Venta.tsx - Con sistema de permisos y buscador funcional
import React, { useState, useEffect, createContext, useContext, useReducer } from 'react';
import './Venta.css';
import CobroModal from '../components/modals/CobroModal';
import MovimientoEfectivoModal from '../components/modals/MovimientoEfectivoModal';
import { ProtectedComponent, ProtectedButton } from '../components/auth/ProtectedComponent';
import { usePermissions } from '../hooks/usePermissions';
import { useDebounce } from '../hooks/useDebounce';
import { ALL_PERMISSIONS } from '../types/permissions';
import { buscarProductos, getProductoByBarcode, esCodigoBarras, type Producto } from '../api/products';
import { getEstadoCaja, type TurnoActual } from '../api/caja';
import { createVenta, type CreateVentaRequest } from '../api/sales';
import '../components/auth/ProtectedComponent.css';

// Type for caja status
interface EstadoCaja {
  sesionActiva: TurnoActual | null;
  puedeOperarVentas: boolean;
}

// Context para compartir el estado de venta con App.tsx
export const VentaContext = createContext<{
  total: number;
  showCobroModal: boolean;
  openCobroModal: () => void;
  closeCobroModal: () => void;
  confirmarVenta: () => void;
} | null>(null);

export const useVentaContext = () => {
  const context = useContext(VentaContext);
  if (!context) {
    throw new Error('useVentaContext debe usarse dentro de VentaProvider');
  }
  return context;
};

// 🛒 INTERFACES DEL CARRITO INTELIGENTE - Según documento
interface CartItem {
  id: number;
  productoId: number;
  nombre: string;
  codigoBarras?: string;
  precio: number;              // Precio actual de venta
  precioCosto?: number;        // Precio de costo (opcional)
  precioOriginal: number;      // Precio original antes de descuentos
  cantidad: number;
  subtotal: number;            // cantidad * precio (con descuentos aplicados)
  descuentoAplicado: number;   // Descuento en % (0-100)
  descuentoMonto: number;      // Monto del descuento en dinero
  stockDisponible: number;     // Stock disponible del producto
  impuesto?: {
    id: number;
    nombre: string;
    porcentaje: number;
  };
}

interface CartState {
  items: CartItem[];
  subtotal: number;           // Suma de todos los subtotales
  descuentoGlobal: number;    // Descuento global en %
  descuentoGlobalMonto: number; // Monto del descuento global
  impuestos: number;          // Total de impuestos
  total: number;              // Total final
}

// 🚀 ACCIONES DEL CARRITO
type CartAction = 
  | { type: 'ADD_ITEM'; producto: Producto; cantidad?: number }
  | { type: 'REMOVE_ITEM'; productoId: number }
  | { type: 'UPDATE_QUANTITY'; productoId: number; cantidad: number }
  | { type: 'APPLY_ITEM_DISCOUNT'; productoId: number; descuento: number }
  | { type: 'APPLY_GLOBAL_DISCOUNT'; descuento: number }
  | { type: 'CLEAR_CART' }
  | { type: 'UPDATE_STOCK'; productoId: number; stock: number };

// 💰 CALCULADORA DE TOTALES
const calcularTotales = (items: CartItem[], descuentoGlobal: number = 0): Omit<CartState, 'items'> => {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const descuentoGlobalMonto = (subtotal * descuentoGlobal) / 100;
  const subtotalConDescuento = subtotal - descuentoGlobalMonto;
  
  // Calcular impuestos sobre el subtotal con descuento
  const impuestos = items.reduce((sum, item) => {
    if (item.impuesto) {
      const baseImponible = item.subtotal * (1 - descuentoGlobal / 100);
      return sum + (baseImponible * item.impuesto.porcentaje / 100);
    }
    return sum;
  }, 0);
  
  const total = subtotalConDescuento + impuestos;
  
  return {
    subtotal,
    descuentoGlobal,
    descuentoGlobalMonto,
    impuestos,
    total: Math.max(0, total) // Nunca negativo
  };
};

// 🧮 REDUCER DEL CARRITO INTELIGENTE
const carritoReducer = (state: CartState, action: CartAction): CartState => {
  let newItems: CartItem[];
  
  switch (action.type) {
    case 'ADD_ITEM': {
      const { producto, cantidad = 1 } = action;
      const existingItemIndex = state.items.findIndex(item => item.productoId === producto.id);
      
      if (existingItemIndex >= 0) {
        // Producto ya existe, actualizar cantidad
        const existingItem = state.items[existingItemIndex];
        const nuevaCantidad = existingItem.cantidad + cantidad;
        
        // Verificar stock disponible
        if (nuevaCantidad > producto.stock) {
          console.warn(`⚠️ Stock insuficiente. Disponible: ${producto.stock}, Solicitado: ${nuevaCantidad}`);
          return state; // No hacer cambios si no hay stock
        }
        
        newItems = [...state.items];
        newItems[existingItemIndex] = {
          ...existingItem,
          cantidad: nuevaCantidad,
          subtotal: nuevaCantidad * existingItem.precio,
          stockDisponible: producto.stock
        };
      } else {
        // Producto nuevo
        if (cantidad > producto.stock) {
          console.warn(`⚠️ Stock insuficiente. Disponible: ${producto.stock}, Solicitado: ${cantidad}`);
          return state;
        }
        
        const newItem: CartItem = {
          id: Date.now(), // ID único temporal
          productoId: producto.id,
          nombre: producto.nombre,
          codigoBarras: producto.codigoBarras,
          precio: producto.precioVenta,
          precioCosto: producto.precioCosto,
          precioOriginal: producto.precioVenta,
          cantidad,
          subtotal: cantidad * producto.precioVenta,
          descuentoAplicado: 0,
          descuentoMonto: 0,
          stockDisponible: producto.stock,
          impuesto: undefined // TODO: Implementar impuestos cuando est\u00e9 disponible en el backend
        };
        
        newItems = [...state.items, newItem];
      }
      break;
    }
    
    case 'REMOVE_ITEM': {
      newItems = state.items.filter(item => item.productoId !== action.productoId);
      break;
    }
    
    case 'UPDATE_QUANTITY': {
      const { productoId, cantidad } = action;
      
      if (cantidad <= 0) {
        newItems = state.items.filter(item => item.productoId !== productoId);
      } else {
        newItems = state.items.map(item => {
          if (item.productoId === productoId) {
            // Verificar stock
            if (cantidad > item.stockDisponible) {
              console.warn(`⚠️ Stock insuficiente. Disponible: ${item.stockDisponible}`);
              return item; // No cambiar si no hay stock
            }
            
            return {
              ...item,
              cantidad,
              subtotal: cantidad * item.precio
            };
          }
          return item;
        });
      }
      break;
    }
    
    case 'APPLY_ITEM_DISCOUNT': {
      const { productoId, descuento } = action;
      newItems = state.items.map(item => {
        if (item.productoId === productoId) {
          const descuentoValidado = Math.max(0, Math.min(100, descuento)); // 0-100%
          const precioConDescuento = item.precioOriginal * (1 - descuentoValidado / 100);
          const descuentoMonto = (item.precioOriginal - precioConDescuento) * item.cantidad;
          
          return {
            ...item,
            precio: precioConDescuento,
            descuentoAplicado: descuentoValidado,
            descuentoMonto,
            subtotal: precioConDescuento * item.cantidad
          };
        }
        return item;
      });
      break;
    }
    
    case 'APPLY_GLOBAL_DISCOUNT': {
      const descuentoValidado = Math.max(0, Math.min(100, action.descuento));
      const totales = calcularTotales(state.items, descuentoValidado);
      return { ...state, ...totales };
    }
    
    case 'UPDATE_STOCK': {
      const { productoId, stock } = action;
      newItems = state.items.map(item => {
        if (item.productoId === productoId) {
          // Si la cantidad actual excede el nuevo stock, ajustar
          const nuevaCantidad = Math.min(item.cantidad, stock);
          return {
            ...item,
            cantidad: nuevaCantidad,
            subtotal: nuevaCantidad * item.precio,
            stockDisponible: stock
          };
        }
        return item;
      });
      break;
    }
    
    case 'CLEAR_CART': {
      return {
        items: [],
        subtotal: 0,
        descuentoGlobal: 0,
        descuentoGlobalMonto: 0,
        impuestos: 0,
        total: 0
      };
    }
    
    default:
      return state;
  }
  
  // Recalcular totales con los nuevos items
  const totales = calcularTotales(newItems, state.descuentoGlobal);
  return { items: newItems, ...totales };
};

// Estado inicial del carrito
const initialCartState: CartState = {
  items: [],
  subtotal: 0,
  descuentoGlobal: 0,
  descuentoGlobalMonto: 0,
  impuestos: 0,
  total: 0
};

const Venta: React.FC = () => {
  const { hasPermission, accessToken, user } = usePermissions();
  
  // 🛒 CARRITO INTELIGENTE - Reemplaza el estado simple anterior
  const [cartState, dispatch] = useReducer(carritoReducer, initialCartState);
  const [showCobroModal, setShowCobroModal] = useState(false);
  const [showEntradaEfectivoModal, setShowEntradaEfectivoModal] = useState(false);
  const [showSalidaEfectivoModal, setShowSalidaEfectivoModal] = useState(false);
  
  // Estados del buscador
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Producto[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // Estados de caja
  const [estadoCaja, setEstadoCaja] = useState<EstadoCaja | null>(null);
  const [loadingCaja, setLoadingCaja] = useState(true);
  const [errorCaja, setErrorCaja] = useState<string | null>(null);
  
  // 🎯 Estados para navegación con teclado en tabla
  const [selectedCartItemIndex, setSelectedCartItemIndex] = useState(-1);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [tableHasFocus, setTableHasFocus] = useState(false);
  
  // Debounce para la búsqueda
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // 💰 TOTALES DEL CARRITO - Usar el estado del carrito inteligente
  const { items, subtotal, total, descuentoGlobal, descuentoGlobalMonto, impuestos } = cartState;
  
  // 🔍 FUNCIÓN DE BÚSQUEDA ACTUALIZADA - Según documento
  const searchProducts = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    
    try {
      setSearching(true);
      
      // 🎯 Detectar si es código de barras y manejarlo directamente
      if (esCodigoBarras(term)) {
        console.log('🔍 Detectado código de barras:', term);
        const productoResponse = await getProductoByBarcode(term);
        
        if (productoResponse.data) {
          const producto = productoResponse.data;
          // Si encuentra el producto por código de barras, agregarlo directamente
          if (producto.stock > 0) {
            agregarProducto(producto);
            setSearchTerm(''); // Limpiar búsqueda
            setSearchResults([]);
            setShowResults(false);
            return;
          } else {
            // Mostrar advertencia de stock
            console.warn('⚠️ Producto sin stock:', producto.nombre);
            setSearchResults([producto]); // Mostrar el producto pero con indicador de sin stock
            setShowResults(true);
            return;
          }
        } else {
          console.warn('❌ Producto no encontrado para código:', term);
          setSearchResults([]);
          setShowResults(false);
          return;
        }
      }
      
      // 📱 BÚSQUEDA NORMAL - Usar la función optimizada
      const response = await buscarProductos(term, 10);
      setSearchResults(response.data || []);
      setShowResults(true);
      setSelectedIndex(-1);
      
    } catch (error) {
      console.error('Error buscando productos:', error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setSearching(false);
    }
  };
  
  // Cargar estado de caja al montar componente
  useEffect(() => {
    cargarEstadoCaja();
  }, [accessToken]);

  // Efecto para búsqueda con debounce
  useEffect(() => {
    searchProducts(debouncedSearchTerm);
  }, [debouncedSearchTerm, accessToken]);

  const cargarEstadoCaja = async () => {
    try {
      setLoadingCaja(true);
      setErrorCaja(null);
      
      const estadoResponse = await getEstadoCaja();
      setEstadoCaja(estadoResponse.data);
      
    } catch (err: any) {
      console.error('Error cargando estado de caja:', err);
      setErrorCaja(err.message || 'Error al verificar estado de caja');
    } finally {
      setLoadingCaja(false);
    }
  };



  
  // Escuchar eventos F7, F8 y F12 desde App.tsx
  React.useEffect(() => {
    const handleOpenCobroModal = () => {
      if (items.length > 0) {
        setShowCobroModal(true);
      }
    };
    
    const handleOpenEntradaEfectivo = () => {
      setShowEntradaEfectivoModal(true);
    };
    
    const handleOpenSalidaEfectivo = () => {
      setShowSalidaEfectivoModal(true);
    };
    
    window.addEventListener('openCobroModal', handleOpenCobroModal);
    window.addEventListener('openEntradaEfectivoModal', handleOpenEntradaEfectivo);
    window.addEventListener('openSalidaEfectivoModal', handleOpenSalidaEfectivo);
    
    return () => {
      window.removeEventListener('openCobroModal', handleOpenCobroModal);
      window.removeEventListener('openEntradaEfectivoModal', handleOpenEntradaEfectivo);
      window.removeEventListener('openSalidaEfectivoModal', handleOpenSalidaEfectivo);
    };
  }, [items.length]);

  // 🎯 NAVEGACIÓN CON TECLADO EN TABLA
  React.useEffect(() => {
    const handleTableNavigation = (event: KeyboardEvent) => {
      // Solo procesar si no estamos en modales y hay items en el carrito
      if (showCobroModal || showEntradaEfectivoModal || showSalidaEfectivoModal || showDeleteConfirmModal) {
        return;
      }

      if (items.length === 0) {
        return;
      }

      const activeElement = document.activeElement;
      const isInSearchInput = activeElement?.classList.contains('search-input');

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          setTableHasFocus(true);
          setSelectedCartItemIndex(prev => {
            if (prev <= 0) return items.length - 1; // Circular: ir al último
            return prev - 1;
          });
          break;

        case 'ArrowDown':
          event.preventDefault();
          setTableHasFocus(true);
          setSelectedCartItemIndex(prev => {
            if (prev >= items.length - 1) return 0; // Circular: ir al primero
            return prev + 1;
          });
          break;

        case '+':
        case '=':
          // Solo funcionar si estamos en modo tabla (no en input)
          if (!isInSearchInput && selectedCartItemIndex >= 0 && selectedCartItemIndex < items.length) {
            event.preventDefault();
            const selectedItem = items[selectedCartItemIndex];
            const nuevaCantidad = selectedItem.cantidad + 1;
            cambiarCantidad(selectedItem.productoId, nuevaCantidad);
          }
          break;

        case '-':
          // Solo funcionar si estamos en modo tabla (no en input)
          if (!isInSearchInput && selectedCartItemIndex >= 0 && selectedCartItemIndex < items.length) {
            event.preventDefault();
            const selectedItem = items[selectedCartItemIndex];
            if (selectedItem.cantidad > 1) {
              const nuevaCantidad = selectedItem.cantidad - 1;
              cambiarCantidad(selectedItem.productoId, nuevaCantidad);
            } else {
              // Si cantidad es 1, mostrar modal de confirmación para eliminar
              setItemToDelete(selectedItem.productoId);
              setShowDeleteConfirmModal(true);
            }
          }
          break;

        case 'Delete':
        case 'Backspace':
          // Solo funcionar si estamos en modo tabla (no en input)
          if (!isInSearchInput && selectedCartItemIndex >= 0 && selectedCartItemIndex < items.length) {
            event.preventDefault();
            const selectedItem = items[selectedCartItemIndex];
            setItemToDelete(selectedItem.productoId);
            setShowDeleteConfirmModal(true);
          }
          break;

        case 'Escape':
          event.preventDefault();
          setTableHasFocus(false);
          setSelectedCartItemIndex(-1);
          // Enfocar el input de búsqueda
          const searchInput = document.querySelector('.search-input') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
          break;

        default:
          // Para cualquier otra tecla que no sea navegación/control, enfocar input de búsqueda
          if (!isInSearchInput && 
              !['ArrowUp', 'ArrowDown', '+', '=', '-', 'Delete', 'Backspace', 'Escape', 'Tab', 'Shift', 'Control', 'Alt', 'Meta'].includes(event.key) &&
              event.key.length === 1) { // Solo teclas de caracteres
            setTableHasFocus(false);
            setSelectedCartItemIndex(-1);
            // Enfocar el input de búsqueda y pasar la tecla
            const searchInput = document.querySelector('.search-input') as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
              // Simular la tecla presionada en el input
              setTimeout(() => {
                const newEvent = new KeyboardEvent('keydown', {
                  key: event.key,
                  code: event.code,
                  bubbles: true,
                  cancelable: true
                });
                searchInput.dispatchEvent(newEvent);
              }, 0);
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleTableNavigation);
    return () => {
      document.removeEventListener('keydown', handleTableNavigation);
    };
  }, [items, selectedCartItemIndex, showCobroModal, showEntradaEfectivoModal, showSalidaEfectivoModal, showDeleteConfirmModal]);

  // Actualizar índice seleccionado cuando cambie el carrito
  React.useEffect(() => {
    if (selectedCartItemIndex >= items.length) {
      setSelectedCartItemIndex(items.length - 1);
    }
    if (items.length === 0) {
      setSelectedCartItemIndex(-1);
      setTableHasFocus(false);
    }
  }, [items.length, selectedCartItemIndex]);

  // 🎯 MANEJO DE TECLADO PARA MODAL DE CONFIRMACIÓN
  React.useEffect(() => {
    const handleDeleteModalKeys = (event: KeyboardEvent) => {
      if (!showDeleteConfirmModal) return;

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          cancelarEliminacion();
          break;
        case 'Enter':
          event.preventDefault();
          // Si está enfocado el botón de cancelar, cancelar; sino confirmar
          const activeElement = document.activeElement;
          if (activeElement?.classList.contains('btn-cancel')) {
            cancelarEliminacion();
          } else {
            confirmarEliminacion();
          }
          break;
        case 'Tab':
          // Permitir navegación normal con Tab
          break;
        default:
          // Prevenir otras teclas en el modal
          event.preventDefault();
          break;
      }
    };

    if (showDeleteConfirmModal) {
      document.addEventListener('keydown', handleDeleteModalKeys);
      return () => {
        document.removeEventListener('keydown', handleDeleteModalKeys);
      };
    }
  }, [showDeleteConfirmModal]);
  
  const openCobroModal = () => {
    if (items.length > 0) {
      setShowCobroModal(true);
    }
  };
  
  const closeCobroModal = () => {
    setShowCobroModal(false);
  };
  
  // 💰 PROCESAR VENTA FINAL - Usar la API de ventas
  const confirmarVenta = async () => {
    try {
      console.log('🚀 Procesando venta:', { items, total });
      
      // Verificar que hay items en el carrito
      if (items.length === 0) {
        alert('No hay productos en el carrito para procesar la venta.');
        return;
      }
      
      // Verificar que el usuario está autenticado
      if (!user?.id) {
        alert('No se pudo identificar el usuario. Por favor, inicie sesión nuevamente.');
        return;
      }
      
      // Preparar datos para la API
      const ventaData: CreateVentaRequest = {
        productos: items.map(item => ({
          productoId: item.productoId,
          cantidad: item.cantidad,
          precio: item.precio
        })),
        metodoPago: 'EFECTIVO', // Este valor vendrá del modal de cobro
        montoPagado: total, // Este valor vendrá del modal de cobro
        descuento: descuentoGlobalMonto,
        observaciones: undefined
      };
      
      console.log('📦 Datos de venta a enviar:', ventaData);
      
      // Crear la venta (usuarioId se toma automáticamente del JWT)
      const ventaResponse = await createVenta(ventaData);
      
      console.log('✅ Venta creada exitosamente:', ventaResponse.data);
      
      // Limpiar carrito
      dispatch({ type: 'CLEAR_CART' });
      
      setShowCobroModal(false);
      
      // Mostrar información de la venta creada
      const numeroTicket = ventaResponse.data?.numeroTicket || ventaResponse.data?.id || 'N/A';
      alert(`¡Venta procesada exitosamente! Ticket: ${numeroTicket}`);
      
    } catch (error: any) {
      console.error('❌ Error procesando venta:', error);
      
      // Manejo más detallado del error
      let errorMessage = 'Error al procesar la venta. Intente nuevamente.';
      
      if (error?.response?.data?.message) {
        errorMessage = `Error: ${error.response.data.message}`;
      } else if (error?.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      console.error('💥 Detalles del error:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message
      });
      
      alert(errorMessage);
    }
  };
  
  // 🛒 AGREGAR PRODUCTO AL CARRITO - Usar el nuevo sistema inteligente
  const agregarProducto = (producto: Producto) => {
    // Verificar que la caja esté abierta
    if (!estadoCaja?.puedeOperarVentas) {
      alert('No se pueden realizar ventas. La caja debe estar abierta.');
      return;
    }
    
    // Verificar stock disponible si tenemos permisos
    if (hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER_STOCK) && producto.stock <= 0) {
      alert('Este producto no tiene stock disponible');
      return;
    }
    
    // Usar el reducer del carrito para agregar el producto
    dispatch({ type: 'ADD_ITEM', producto, cantidad: 1 });
    
    // Limpiar búsqueda
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
    
    console.log('✅ Producto agregado al carrito:', producto.nombre);
  };
  
  // Manejar selección con teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || searchResults.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          agregarProducto(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };
  
  // Manejar click fuera del buscador
  const handleSearchBlur = () => {
    // Delay para permitir click en resultados
    setTimeout(() => {
      setShowResults(false);
      setSelectedIndex(-1);
    }, 200);
  };
  
  // 🗑️ ELIMINAR ITEM DEL CARRITO
  const eliminarItem = (productoId: number) => {
    dispatch({ type: 'REMOVE_ITEM', productoId });
  };
  
  // 📊 CAMBIAR CANTIDAD DE PRODUCTO
  const cambiarCantidad = (productoId: number, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      eliminarItem(productoId);
      return;
    }
    
    // El reducer del carrito ya maneja la validación de stock
    dispatch({ type: 'UPDATE_QUANTITY', productoId, cantidad: nuevaCantidad });
  };
  
  // 💸 APLICAR DESCUENTO A PRODUCTO INDIVIDUAL
  const aplicarDescuento = (productoId: number, descuento: number) => {
    if (!hasPermission(ALL_PERMISSIONS.VENTAS_APLICAR_DESCUENTO)) {
      alert('No tienes permisos para aplicar descuentos');
      return;
    }
    
    dispatch({ type: 'APPLY_ITEM_DISCOUNT', productoId, descuento });
  };
  
  // 💸 APLICAR DESCUENTO GLOBAL A TODA LA VENTA
  const aplicarDescuentoGlobal = (descuento: number) => {
    if (!hasPermission(ALL_PERMISSIONS.VENTAS_APLICAR_DESCUENTO)) {
      alert('No tienes permisos para aplicar descuentos');
      return;
    }
    
    dispatch({ type: 'APPLY_GLOBAL_DISCOUNT', descuento });
  };

  // 🎯 FUNCIONES PARA MODAL DE CONFIRMACIÓN DE ELIMINACIÓN
  const confirmarEliminacion = () => {
    if (itemToDelete) {
      eliminarItem(itemToDelete);
      // Ajustar índice seleccionado después de eliminar
      if (selectedCartItemIndex >= items.length - 1) {
        setSelectedCartItemIndex(Math.max(0, items.length - 2));
      }
    }
    setShowDeleteConfirmModal(false);
    setItemToDelete(null);
  };

  const cancelarEliminacion = () => {
    setShowDeleteConfirmModal(false);
    setItemToDelete(null);
  };

  // Obtener información del producto a eliminar
  const getProductoAEliminar = () => {
    if (!itemToDelete) return null;
    return items.find(item => item.productoId === itemToDelete);
  };
  
  // Proveemos el contexto para que App.tsx pueda acceder
  const ventaContextValue = {
    total,
    showCobroModal,
    openCobroModal,
    closeCobroModal,
    confirmarVenta
  };

  return (
    <VentaContext.Provider value={ventaContextValue}>
      <div className="venta-page">
        <div className="venta-header">
          <h1>Ventas</h1>
          <div className="caja-status">
            {loadingCaja ? (
              <span className="caja-loading">Verificando caja...</span>
            ) : errorCaja ? (
              <span className="caja-error">
                ⚠️ Error: {errorCaja}
                <button onClick={cargarEstadoCaja} className="retry-btn">Reintentar</button>
              </span>
            ) : estadoCaja?.sesionActiva ? (
              <div className="caja-abierta">
                <span className="caja-indicator">✅</span>
                <div className="caja-info">
                  <span className="caja-label">Caja Abierta</span>
                  <span className="caja-details">
                    {estadoCaja.sesionActiva.caja?.nombre || `#${estadoCaja.sesionActiva.cajaId}`}
                    {' - '}
                    {estadoCaja.sesionActiva.usuario?.fullName}
                  </span>
                </div>
              </div>
            ) : (
              <div className="caja-cerrada">
                <span className="caja-indicator">🔒</span>
                <div className="caja-info">
                  <span className="caja-label">Caja Cerrada</span>
                  <span className="caja-details">No se pueden realizar ventas</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        
        <div className="venta-search">
          <div className="search-container">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSearchBlur}
              onFocus={() => searchTerm && setShowResults(true)}
              placeholder="Buscar producto por nombre o código de barras..."
              className="search-input"
              autoFocus
            />
            {searching && (
              <div className="search-loading">
                <span>🔍</span>
              </div>
            )}
            
            {showResults && searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((producto, index) => (
                  <div
                    key={producto.id}
                    className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
                    onClick={() => agregarProducto(producto)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="result-info">
                      <span className="result-name">{producto.nombre}</span>
                      {producto.codigoBarras && (
                        <span className="result-code">Código: {producto.codigoBarras}</span>
                      )}
                      <span className="result-price">${producto.precioVenta.toFixed(2)}</span>
                      {hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER_STOCK) && (
                        <span className={`result-stock ${producto.stock <= 0 ? 'no-stock' : producto.stock <= 5 ? 'low-stock' : ''}`}>
                          Stock: {producto.stock}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {showResults && searchTerm && searchResults.length === 0 && !searching && (
              <div className="search-results">
                <div className="search-no-results">
                  <span>No se encontraron productos</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="venta-table-container">
          <table className="venta-table">
            <thead>
              <tr>
                <th>Producto</th>
                {/* Columna de costo solo visible con permisos */}
                <ProtectedComponent permission={ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_COSTO}>
                  <th className="text-right">Costo</th>
                </ProtectedComponent>
                <th className="text-right">Precio</th>
                <th className="text-center">Cantidad</th>
                <th className="text-right">Subtotal</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr 
                  key={item.id}
                  className={`cart-item-row ${
                    selectedCartItemIndex === index && tableHasFocus ? 'selected-row' : ''
                  }`}
                  onClick={() => {
                    setSelectedCartItemIndex(index);
                    setTableHasFocus(true);
                  }}
                >
                  <td>
                    <div className="product-info">
                      <span className="product-name">{item.nombre}</span>
                      {item.codigoBarras && (
                        <span className="product-code">Código: {item.codigoBarras}</span>
                      )}
                      {item.descuentoAplicado && item.descuentoAplicado > 0 && (
                        <span className="discount-badge">-{item.descuentoAplicado}%</span>
                      )}
                      {hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER_STOCK) && (
                        <span className="stock-info">Stock: {item.stockDisponible}</span>
                      )}
                    </div>
                  </td>
                  
                  {/* Precio de costo - Solo visible con permisos */}
                  <ProtectedComponent permission={ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_COSTO}>
                    <td className="text-right cost-price">
                      {item.precioCosto ? `$${item.precioCosto.toFixed(2)}` : 'N/A'}
                    </td>
                  </ProtectedComponent>
                  
                  <td className="text-right">
                    <div className="price-info">
                      <span className={item.descuentoAplicado && item.descuentoAplicado > 0 ? 'discounted-price' : ''}>
                        ${item.precio.toFixed(2)}
                      </span>
                      {item.descuentoAplicado > 0 && (
                        <span className="original-price">${item.precioOriginal.toFixed(2)}</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="text-center">
                    <div className="quantity-controls">
                      <button 
                        className="quantity-btn"
                        onClick={() => cambiarCantidad(item.productoId, item.cantidad - 1)}
                      >
                        -
                      </button>
                      <span className="quantity-display">{item.cantidad}</span>
                      <button 
                        className="quantity-btn"
                        onClick={() => cambiarCantidad(item.productoId, item.cantidad + 1)}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="text-right font-bold">${item.subtotal.toFixed(2)}</td>
                  <td className="text-center">
                    <div className="action-buttons">
                      {/* Botón de descuento - Solo con permisos */}
                      <ProtectedButton
                        permission={ALL_PERMISSIONS.VENTAS_APLICAR_DESCUENTO}
                        className="discount-btn"
                        onClick={() => {
                          const descuento = prompt('Ingrese el porcentaje de descuento (0-100):');
                          if (descuento && !isNaN(Number(descuento))) {
                            aplicarDescuento(item.productoId, Number(descuento));
                          }
                        }}
                      >
                        % Desc
                      </ProtectedButton>
                      
                      <button 
                        className="delete-btn" 
                        onClick={() => eliminarItem(item.productoId)}
                      >
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={hasPermission(ALL_PERMISSIONS.PRODUCTOS_VER_PRECIO_COSTO) ? 6 : 5} className="text-center text-gray-500">
                    No hay productos en el carrito
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="venta-summary">
          {/* 💰 DESGLOSE DETALLADO DE TOTALES */}
          <div className="totales-breakdown">
            <div className="subtotal-line">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            
            {descuentoGlobal > 0 && (
              <div className="descuento-line">
                <span>Descuento Global (-{descuentoGlobal}%):</span>
                <span>-${descuentoGlobalMonto.toFixed(2)}</span>
              </div>
            )}
            
            {impuestos > 0 && (
              <div className="impuestos-line">
                <span>Impuestos:</span>
                <span>${impuestos.toFixed(2)}</span>
              </div>
            )}
            
            <div className="total-line">
              <span className="total-label">Total:</span>
              <span className="total-amount">${total.toFixed(2)}</span>
            </div>
          </div>
          
          {/* 🛠️ CONTROLES ADICIONALES */}
          <div className="summary-controls">
            {/* Botón de descuento global - Solo con permisos */}
            <ProtectedButton
              permission={ALL_PERMISSIONS.VENTAS_APLICAR_DESCUENTO}
              className="global-discount-btn"
              onClick={() => {
                const descuento = prompt('Ingrese el descuento global (0-100%):');
                if (descuento && !isNaN(Number(descuento))) {
                  aplicarDescuentoGlobal(Number(descuento));
                }
              }}
              disabled={items.length === 0}
            >
              💸 Descuento Global
            </ProtectedButton>
            
            {/* Botones de Movimientos de Efectivo */}
            <div className="efectivo-actions">
              <ProtectedButton
                permission={ALL_PERMISSIONS.CAJA_REGISTRAR_ENTRADA}
                className="efectivo-entrada-btn"
                onClick={() => setShowEntradaEfectivoModal(true)}
                fallback={null}
              >
                📥 Entrada [F7]
              </ProtectedButton>
              
              <ProtectedButton
                permission={ALL_PERMISSIONS.CAJA_REGISTRAR_SALIDA}
                className="efectivo-salida-btn"
                onClick={() => setShowSalidaEfectivoModal(true)}
                fallback={null}
              >
                📤 Salida [F8]
              </ProtectedButton>
            </div>
            
            {/* Botón procesar venta - Solo con permisos */}
            <ProtectedButton
              permission={ALL_PERMISSIONS.VENTAS_CREAR}
              className="venta-process-button"
              onClick={openCobroModal}
              disabled={items.length === 0}
              fallback={
                <div className="permission-error">
                  <span className="error-text">No tienes permisos para procesar ventas</span>
                </div>
              }
            >
              🚀 Procesar Venta [F12]
            </ProtectedButton>
          </div>
        </div>
        
        <CobroModal
          isOpen={showCobroModal}
          total={total}
          onConfirm={confirmarVenta}
          onCancel={closeCobroModal}
        />
        
        {/* Modal de Entrada de Efectivo (F7) */}
        <MovimientoEfectivoModal
          isOpen={showEntradaEfectivoModal}
          tipo="IN"
          onClose={() => setShowEntradaEfectivoModal(false)}
        />
        
        {/* Modal de Salida de Efectivo (F8) */}
        <MovimientoEfectivoModal
          isOpen={showSalidaEfectivoModal}
          tipo="OUT"
          onClose={() => setShowSalidaEfectivoModal(false)}
        />

        {/* Modal de Confirmación de Eliminación */}
        {showDeleteConfirmModal && (
          <div className="modal-overlay" onClick={cancelarEliminacion}>
            <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>🗑️ Confirmar Eliminación</h3>
                <button 
                  onClick={cancelarEliminacion}
                  className="modal-close"
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                {getProductoAEliminar() && (
                  <>
                    <div className="delete-warning">
                      <p>¿Estás seguro que deseas eliminar este producto del carrito?</p>
                      <div className="producto-eliminar">
                        <strong>{getProductoAEliminar()?.nombre}</strong>
                        <div className="cantidad-info">
                          Cantidad: {getProductoAEliminar()?.cantidad} x ${getProductoAEliminar()?.precio.toFixed(2)}
                          = ${getProductoAEliminar()?.subtotal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="delete-instructions">
                      <p><strong>💡 Instrucciones de navegación:</strong></p>
                      <ul>
                        <li><kbd>↑</kbd> <kbd>↓</kbd> - Navegar entre productos (funciona desde búsqueda)</li>
                        <li><kbd>+</kbd> - Aumentar cantidad</li>
                        <li><kbd>-</kbd> - Disminuir cantidad (o eliminar si cantidad = 1)</li>
                        <li><kbd>Del</kbd> o <kbd>Backspace</kbd> - Eliminar producto</li>
                        <li><kbd>Esc</kbd> o cualquier tecla - Regresar a búsqueda</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-actions">
                <button 
                  onClick={cancelarEliminacion}
                  className="btn-cancel"
                  autoFocus
                >
                  ❌ No, Cancelar [Esc]
                </button>
                <button 
                  onClick={confirmarEliminacion}
                  className="btn-danger"
                >
                  🗑️ Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Indicador de navegación con teclado */}
        {tableHasFocus && items.length > 0 && (
          <div className="navigation-hint visible">
            <div>
              🎯 <strong>Navegación:</strong>{' '}
              <kbd>↑</kbd><kbd>↓</kbd> navegar{' '}
              <kbd>+</kbd><kbd>-</kbd> cantidad{' '}
              <kbd>Del</kbd> eliminar{' '}
              <kbd>Esc</kbd> o <kbd>tecla</kbd> → buscar
            </div>
          </div>
        )}
      </div>
    </VentaContext.Provider>
  );
};

export default Venta;
