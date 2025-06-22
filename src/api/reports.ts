// src/api/reports.ts - API para reportes y estadísticas usando datos reales
import { getTickets } from './tickets';
import { getProductos } from './products';
import { getUsuarios } from './users';
import { apiClient } from './client';
import { getVentas } from './sales';

export interface ReporteVentas {
  fecha: string;
  totalVentas: number;
  cantidadVentas: number;
  ticketPromedio: number;
}

export interface ProductoTop {
  id: number;
  nombre: string;
  cantidadVendida: number;
  ingresoTotal: number;
}

export interface EstadisticasGenerales {
  ventasHoy: number;
  ventasSemana: number;
  ventasMes: number;
  productosActivos: number;
  stockBajo: number;
  usuariosActivos: number;
  valorInventario: number;
  productosAgotados: number;
}

export interface FiltrosReporte {
  fechaInicio: string;
  fechaFin: string;
  tipoReporte: 'ventas' | 'productos' | 'inventario' | 'ventas-por-hora' | 'ventas-por-vendedor';
}

// Interfaces para los nuevos reportes
export interface ReporteVentasPorHora {
  periodo: {
    desde: string;
    hasta: string;
  };
  resumen: {
    totalVentas: number;
    totalTickets: number;
    ticketPromedio: number;
    horasConVentas: number;
    mejorHora: {
      fecha: string;
      hora: number;
      totalVentas: number;
      cantidadTickets: number;
    } | null;
  };
  ventasPorHora: Array<{
    fecha: string;
    hora: number;
    totalVentas: number;
    cantidadTickets: number;
    ticketPromedio: number;
    usuarios: Array<{
      usuarioId: number;
      fullName: string;
      totalVentas: number;
      cantidadTickets: number;
    }>;
  }>;
}

export interface ReporteVentasPorVendedor {
  periodo: {
    desde: string;
    hasta: string;
  };
  resumen: {
    totalVendedores: number;
    vendedoresActivos: number;
    vendedoresSinVentas: number;
    totalVentas: number;
    totalTickets: number;
    ticketPromedio: number;
    mejorVendedor: {
      usuarioId: number;
      fullName: string;
      totalVentas: number;
    } | null;
  };
  vendedoresConVentas: Array<{
    usuarioId: number;
    fullName: string;
    email: string;
    totalVentas: number;
    cantidadTickets: number;
    ticketPromedio: number;
    ventasPorHora: Array<{
      hora: number;
      totalVentas: number;
      cantidadTickets: number;
    }>;
    primerVenta: string | null;
    ultimaVenta: string | null;
    mejorHora: {
      hora: number;
      totalVentas: number;
    } | null;
  }>;
  vendedoresSinVentas: Array<{
    usuarioId: number;
    fullName: string;
    email: string;
  }>;
}

// Función auxiliar para obtener token desde localStorage
function getAuthToken(): string | null {
  const authData = localStorage.getItem('auth-data');
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      return parsed.accessToken || null;
    } catch {
      return null;
    }
  }
  return null;
}

// Función auxiliar para verificar si una fecha es hoy
function esHoy(fecha: Date): boolean {
  const hoy = new Date();
  return fecha.toDateString() === hoy.toDateString();
}

// Función auxiliar para verificar si una fecha está en esta semana
function esEstaSemana(fecha: Date): boolean {
  const hoy = new Date();
  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(hoy.getDate() - hoy.getDay()); // Domingo
  inicioSemana.setHours(0, 0, 0, 0);
  
  return fecha >= inicioSemana;
}

// Función auxiliar para agrupar ventas por fecha
function agruparVentasPorFecha(ventas: any[]): Record<string, any[]> {
  return ventas.reduce((grupos, venta) => {
    const fecha = new Date(venta.fecha).toISOString().split('T')[0];
    if (!grupos[fecha]) {
      grupos[fecha] = [];
    }
    grupos[fecha].push(venta);
    return grupos;
  }, {} as Record<string, any[]>);
}

// Función auxiliar para filtrar ventas por rango de fechas
function filtrarVentasPorFecha(ventas: any[], fechaInicio: string, fechaFin: string): any[] {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  fin.setHours(23, 59, 59, 999); // Incluir todo el día final
  
  return ventas.filter(venta => {
    const fechaVenta = new Date(venta.fecha);
    return fechaVenta >= inicio && fechaVenta <= fin;
  });
}

// Función auxiliar para verificar si una fecha está en este mes
function esEsteMes(fecha: Date): boolean {
  const hoy = new Date();
  return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
}

export async function getEstadisticasGenerales(): Promise<EstadisticasGenerales> {
  try {
    // Obtener datos de todas las fuentes
    const [tickets, productos, usuarios] = await Promise.all([
      getTickets(),
      getProductos({ page: 1, limit: 1000 }),
      getUsuarios()
    ]);

    // Todos los tickets son válidos (no hay estado COMPLETADA en el nuevo schema)
    const ticketsResponse = tickets as any;
    const ticketsValidos = Array.isArray(ticketsResponse) ? ticketsResponse : (ticketsResponse.data || []);

    // Calcular estadísticas de ventas
    let ventasHoy = 0;
    let ventasSemana = 0;
    let ventasMes = 0;

    ticketsValidos.forEach((ticket: any) => {
      const fechaTicket = new Date(ticket.fecha);
      
      if (esHoy(fechaTicket)) {
        ventasHoy += ticket.total;
      }
      
      if (esEstaSemana(fechaTicket)) {
        ventasSemana += ticket.total;
      }
      
      if (esEsteMes(fechaTicket)) {
        ventasMes += ticket.total;
      }
    });

    // Calcular estadísticas de productos (REAL: array directo, no hay stockMinimo)
    const productosData = productos.data || [];
    const productosActivos = productosData.filter((p: any) => p.stock > 0).length;
    const stockBajo = productosData.filter((p: any) => 
      p.stock > 0 && p.stock <= 5 // Usar umbral fijo de 5
    ).length;
    const productosAgotados = productosData.filter((p: any) => 
      p.stock <= 0
    ).length;

    // Calcular valor total del inventario
    const valorInventario = productosData.reduce((total: number, producto: any) => {
      return total + (producto.precioCosto * producto.stock);
    }, 0);

    // Calcular usuarios activos (asumiendo que todos los usuarios son activos)
    const usuariosResponse = usuarios as any;
    const usuariosData = Array.isArray(usuariosResponse) ? usuariosResponse : (usuariosResponse.data || []);
    const usuariosActivos = usuariosData.length;

    return {
      ventasHoy,
      ventasSemana,
      ventasMes,
      productosActivos,
      stockBajo,
      usuariosActivos,
      valorInventario,
      productosAgotados
    };

  } catch (error) {
    console.error('Error obteniendo estadísticas generales:', error);
    throw error;
  }
}

export async function getReporteVentas(filtros: FiltrosReporte): Promise<ReporteVentas[]> {
  try {
    const ventas = await getVentas();
    const ventasResponse = ventas as any;
    const ventasCompletadas = Array.isArray(ventasResponse) ? ventasResponse : (ventasResponse.data || []);
    const ventasFiltradas = filtrarVentasPorFecha(ventasCompletadas, filtros.fechaInicio, filtros.fechaFin);
    
    const ventasAgrupadas = agruparVentasPorFecha(ventasFiltradas);
    
    const reporte: ReporteVentas[] = Object.entries(ventasAgrupadas).map(([fecha, ventasDia]) => {
      const totalVentas = ventasDia.reduce((sum: number, venta: any) => sum + venta.total, 0);
      const cantidadVentas = ventasDia.length;
      const ticketPromedio = cantidadVentas > 0 ? totalVentas / cantidadVentas : 0;
      
      return {
        fecha,
        totalVentas,
        cantidadVentas,
        ticketPromedio
      };
    });

    // Ordenar por fecha descendente
    return reporte.sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  } catch (error) {
    console.error('Error generando reporte de ventas:', error);
    throw error;
  }
}

export async function getProductosTop(filtros: FiltrosReporte): Promise<ProductoTop[]> {
  try {
    const [ventas, productos] = await Promise.all([
      getTickets(),
      getProductos({ page: 1, limit: 1000 })
    ]);

    const ventasResponse = ventas as any;
    const ventasCompletadas = Array.isArray(ventasResponse) ? ventasResponse : (ventasResponse.data || []);
    const ventasFiltradas = filtrarVentasPorFecha(ventasCompletadas, filtros.fechaInicio, filtros.fechaFin);
    
    // Agrupar productos vendidos
    const productosVendidos: Record<number, { cantidadVendida: number; ingresoTotal: number }> = {};
    
    ventasFiltradas.forEach((venta: any) => {
      venta.productos.forEach((producto: any) => {
        if (!productosVendidos[producto.productoId]) {
          productosVendidos[producto.productoId] = {
            cantidadVendida: 0,
            ingresoTotal: 0
          };
        }
        productosVendidos[producto.productoId].cantidadVendida += producto.cantidad;
        productosVendidos[producto.productoId].ingresoTotal += producto.subtotal;
      });
    });

    // Crear lista de productos top con nombres
    const productosMap = new Map(productos.data.map(p => [p.id, p]));
    
    const productosTop: ProductoTop[] = Object.entries(productosVendidos)
      .map(([productoId, datos]) => {
        const producto = productosMap.get(parseInt(productoId));
        return {
          id: parseInt(productoId),
          nombre: producto?.nombre || `Producto ID ${productoId}`,
          cantidadVendida: datos.cantidadVendida,
          ingresoTotal: datos.ingresoTotal
        };
      })
      .sort((a, b) => b.ingresoTotal - a.ingresoTotal) // Ordenar por ingreso total
      .slice(0, 10); // Top 10

    return productosTop;

  } catch (error) {
    console.error('Error generando reporte de productos top:', error);
    throw error;
  }
}

export interface ReporteInventario {
  totalProductos: number;
  productosStockBajo: number;
  productosAgotados: number;
  valorTotalInventario: number;
  productosStockBajo_lista: Array<{
    id: number;
    nombre: string;
    stock: number;
    stockMinimo: number;
    valorInventario: number;
  }>;
  productosAgotados_lista: Array<{
    id: number;
    nombre: string;
    ultimaVenta?: string;
  }>;
}

export async function getReporteInventario(): Promise<ReporteInventario> {
  try {
    const [productos, ventas] = await Promise.all([
      getProductos({ page: 1, limit: 1000 }),
      getTickets()
    ]);

    const productosActivos = productos.data;
    
    const productosStockBajo = productosActivos.filter(p => 
      p.stock > 0 && p.stock <= 5 // Usar umbral fijo de 5 ya que no hay stockMinimo
    );
    
    const productosAgotados = productosActivos.filter(p => p.stock <= 0);
    
    const valorTotalInventario = productosActivos.reduce((total, producto) => {
      return total + (producto.precioCosto * producto.stock);
    }, 0);

    // Obtener última venta para productos agotados
    const ventasResponse = ventas as any;
    const ventasCompletadas = Array.isArray(ventasResponse) ? ventasResponse : (ventasResponse.data || []);
    const productosAgotados_lista = productosAgotados.map((producto: any) => {
      // Buscar la última venta de este producto
      let ultimaVenta: string | undefined;
      for (const venta of ventasCompletadas.sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())) {
        if (venta.productos && venta.productos.some((p: any) => p.productoId === producto.id)) {
          ultimaVenta = venta.fecha;
          break;
        }
      }
      
      return {
        id: producto.id,
        nombre: producto.nombre,
        ultimaVenta
      };
    });

    const productosStockBajo_lista = productosStockBajo.map((producto: any) => ({
      id: producto.id,
      nombre: producto.nombre,
      stock: producto.stock,
      stockMinimo: 5, // Umbral fijo ya que no hay stockMinimo en el backend
      valorInventario: producto.precioCosto * producto.stock
    }));

    return {
      totalProductos: productosActivos.length,
      productosStockBajo: productosStockBajo.length,
      productosAgotados: productosAgotados.length,
      valorTotalInventario,
      productosStockBajo_lista,
      productosAgotados_lista
    };

  } catch (error) {
    console.error('Error generando reporte de inventario:', error);
    throw error;
  }
}

// Nuevas funciones para reportes por hora y vendedor
export async function getReporteVentasPorHora(
  desde?: string, 
  hasta?: string, 
  usuarioId?: number
): Promise<ReporteVentasPorHora> {
  try {
    const token = getAuthToken();
    apiClient.setAccessToken(token);
    
    const params: Record<string, any> = {};
    if (desde) params.desde = desde;
    if (hasta) params.hasta = hasta;
    if (usuarioId) params.usuarioId = usuarioId;
    
    const response = await apiClient.get<ReporteVentasPorHora>('/reportes/ventas-por-hora', params);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo reporte de ventas por hora:', error);
    throw error;
  }
}

export async function getReporteVentasPorVendedor(
  desde?: string, 
  hasta?: string, 
  usuarioIds?: number[]
): Promise<ReporteVentasPorVendedor> {
  try {
    const token = getAuthToken();
    apiClient.setAccessToken(token);
    
    const params: Record<string, any> = {};
    if (desde) params.desde = desde;
    if (hasta) params.hasta = hasta;
    if (usuarioIds && usuarioIds.length > 0) {
      params.usuarioIds = usuarioIds.join(',');
    }
    
    const response = await apiClient.get<ReporteVentasPorVendedor>('/reportes/ventas-por-vendedor', params);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo reporte de ventas por vendedor:', error);
    throw error;
  }
}

// Función para exportar reportes (placeholder - implementar según necesidades)
export async function exportarReporte(
  _tipoReporte: 'ventas' | 'productos' | 'inventario' | 'ventas-por-hora' | 'ventas-por-vendedor',
  _formato: 'excel' | 'pdf',
  _filtros: FiltrosReporte
): Promise<Blob> {
  // Esta función sería implementada con una librería de exportación
  // Por ahora, es un placeholder
  throw new Error('Función de exportación no implementada aún');
}