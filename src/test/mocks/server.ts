import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock handlers for API endpoints
export const handlers = [
  // Auth endpoints
  http.post('http://localhost:3000/auth/login', () => {
    return HttpResponse.json({
      access_token: 'mock-jwt-token',
      user: {
        id: 1,
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'empleado'
      }
    });
  }),

  http.get('http://localhost:3000/auth/profile', () => {
    return HttpResponse.json({
      id: 1,
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'empleado',
      permisos: ['productos:ver', 'ventas:crear']
    });
  }),

  // Products endpoints
  http.get('http://localhost:3000/producto', () => {
    return HttpResponse.json({
      data: [
        {
          id: 1,
          nombre: 'Producto Test',
          codigoBarras: '123456789',
          precioVenta: 10.50,
          precioCosto: 5.25,
          stock: 100,
          categoria: { id: 1, nombre: 'Categoría Test' }
        }
      ],
      meta: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      }
    });
  }),

  // Sales endpoints
  http.post('http://localhost:3000/ticket', () => {
    return HttpResponse.json({
      id: 1,
      numeroTicket: 1,
      total: 10.50,
      fecha: new Date().toISOString(),
      items: []
    });
  }),

  // Catch-all handler for unhandled requests
  http.all('*', ({ request }) => {
    console.warn(`Unhandled ${request.method} request to ${request.url}`);
    return new HttpResponse(null, { status: 404 });
  }),
];

export const server = setupServer(...handlers);