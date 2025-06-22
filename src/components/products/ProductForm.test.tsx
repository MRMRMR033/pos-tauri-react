// src/components/products/ProductForm.test.tsx - Tests para ProductForm
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductForm from './ProductForm';
import { usePermissions } from '../../hooks/usePermissions';
import { ALL_PERMISSIONS } from '../../types/permissions';

// Mock hooks
vi.mock('../../hooks/usePermissions');

const mockUsePermissions = vi.mocked(usePermissions);

describe('ProductForm', () => {
  const mockProps = {
    product: null,
    categorias: [
      { id: 1, nombre: 'Bebidas' },
      { id: 2, nombre: 'Snacks' }
    ],
    proveedores: [
      { id: 1, nombre: 'Coca Cola' },
      { id: 2, nombre: 'Pepsi' }
    ],
    onSave: vi.fn(),
    onCancel: vi.fn(),
    loading: false
  };

  beforeEach(() => {
    mockUsePermissions.mockReturnValue({
      hasPermission: vi.fn().mockReturnValue(true),
      hasAnyPermission: vi.fn().mockReturnValue(true),
      hasAllPermissions: vi.fn().mockReturnValue(true),
      isAdmin: vi.fn().mockReturnValue(true),
      refreshPermissions: vi.fn(),
      user: null,
      accessToken: null,
      permissions: Object.values(ALL_PERMISSIONS)
    });
  });

  it('debe renderizar el formulario correctamente', () => {
    render(<ProductForm {...mockProps} />);
    
    expect(screen.getByRole('heading', { name: /nuevo producto/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/código de barras/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre del producto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/categoría/i)).toBeInTheDocument();
  });

  it('debe validar campos requeridos', async () => {
    const user = userEvent.setup();
    render(<ProductForm {...mockProps} />);
    
    const submitButton = screen.getByRole('button', { name: /crear producto/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/el código de barras es requerido/i)).toBeInTheDocument();
      expect(screen.getByText(/el nombre es requerido/i)).toBeInTheDocument();
    });
  });

  it('debe permitir crear un producto válido', async () => {
    const user = userEvent.setup();
    render(<ProductForm {...mockProps} />);
    
    // Llenar el formulario
    await user.type(screen.getByLabelText(/código de barras/i), '1234567890');
    await user.type(screen.getByLabelText(/nombre del producto/i), 'Coca Cola 350ml');
    await user.selectOptions(screen.getByLabelText(/categoría/i), '1');
    await user.type(screen.getByLabelText(/precio de venta/i), '25.50');
    await user.type(screen.getByLabelText(/precio de costo/i), '18.00');
    await user.type(screen.getByLabelText(/stock inicial/i), '100');
    
    // Enviar formulario
    const submitButton = screen.getByRole('button', { name: /crear producto/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockProps.onSave).toHaveBeenCalledWith({
        codigoBarras: '1234567890',
        nombre: 'Coca Cola 350ml',
        categoriaId: 1,
        precioVenta: 25.50,
        precioCosto: 18.00,
        stock: 100,
        stockMinimo: 5,
        descripcion: undefined,
        precioEspecial: undefined,
        proveedorId: undefined
      });
    });
  });

  it('debe mostrar el botón de cancelar', () => {
    render(<ProductForm {...mockProps} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    expect(cancelButton).toBeInTheDocument();
    
    fireEvent.click(cancelButton);
    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  it('debe deshabilitar campos si no tiene permisos', () => {
    mockUsePermissions.mockReturnValue({
      hasPermission: vi.fn().mockReturnValue(false),
      hasAnyPermission: vi.fn().mockReturnValue(false),
      hasAllPermissions: vi.fn().mockReturnValue(false),
      isAdmin: vi.fn().mockReturnValue(false),
      refreshPermissions: vi.fn(),
      user: null,
      accessToken: null,
      permissions: []
    });

    render(<ProductForm {...mockProps} />);
    
    expect(screen.getByDisplayValue(/sin permisos/i)).toBeInTheDocument();
  });
});