// src/api/products.test.ts - Tests para API de productos
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getProductos, 
  getProductoById, 
  createProducto, 
  updateProducto, 
  deleteProducto,
  esCodigoBarras,
  formatearPrecio,
  tieneStockDisponible,
  estaEnStockBajo
} from './products';
import { apiClient } from './client';

// Mock del cliente API
vi.mock('./client');
const mockApiClient = vi.mocked(apiClient);

describe('API de Productos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProductos', () => {
    it('debe obtener lista de productos', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            codigoBarras: '1234567890',
            nombre: 'Producto Test',
            precioCosto: 10,
            precioVenta: 15,
            stock: 100,
            stockMinimo: 5,
            categoriaId: 1,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01'
          }
        ],
        meta: {
          timestamp: '2024-01-01',
          apiVersion: '1',
          total: 1,
          totalPages: 1
        }
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await getProductos();
      
      expect(mockApiClient.get).toHaveBeenCalledWith('/producto', undefined);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createProducto', () => {
    it('debe crear un producto', async () => {
      const productoData = {
        codigoBarras: '1234567890',
        nombre: 'Nuevo Producto',
        precioCosto: 10,
        precioVenta: 15,
        stock: 100,
        stockMinimo: 5,
        categoriaId: 1
      };

      const mockResponse = {
        data: { id: 1, ...productoData },
        meta: { timestamp: '2024-01-01', apiVersion: '1' }
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await createProducto(productoData);
      
      expect(mockApiClient.post).toHaveBeenCalledWith('/producto', productoData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Funciones utilitarias', () => {
    it('esCodigoBarras - debe validar códigos de barras', () => {
      expect(esCodigoBarras('1234567890')).toBe(true);
      expect(esCodigoBarras('12345678')).toBe(true);
      expect(esCodigoBarras('1234567')).toBe(false);
      expect(esCodigoBarras('abc12345')).toBe(false);
      expect(esCodigoBarras('')).toBe(false);
    });

    it('formatearPrecio - debe formatear precios correctamente', () => {
      expect(formatearPrecio(25.50)).toBe('$25.50');
      expect(formatearPrecio(1000)).toBe('$1,000.00');
    });

    it('tieneStockDisponible - debe verificar stock disponible', () => {
      const producto = {
        id: 1,
        stock: 10,
        stockMinimo: 5,
        codigoBarras: '123',
        nombre: 'Test',
        precioCosto: 10,
        precioVenta: 15,
        categoriaId: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      expect(tieneStockDisponible(producto, 5)).toBe(true);
      expect(tieneStockDisponible(producto, 15)).toBe(false);
    });

    it('estaEnStockBajo - debe detectar stock bajo', () => {
      const producto = {
        id: 1,
        stock: 3,
        stockMinimo: 5,
        codigoBarras: '123',
        nombre: 'Test',
        precioCosto: 10,
        precioVenta: 15,
        categoriaId: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      expect(estaEnStockBajo(producto)).toBe(true);
      
      producto.stock = 10;
      expect(estaEnStockBajo(producto)).toBe(false);
    });
  });
});