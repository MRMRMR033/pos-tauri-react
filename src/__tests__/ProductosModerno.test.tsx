import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../test/test-utils';
import ProductosModerno from '../pages/ProductosModerno';

describe('ProductosModerno Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders products page correctly', () => {
    render(<ProductosModerno />);
    
    expect(screen.getByRole('heading', { name: /gestión de productos/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/buscar productos/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nuevo producto/i })).toBeInTheDocument();
  });

  it('displays products list', async () => {
    render(<ProductosModerno />);
    
    await waitFor(() => {
      expect(screen.getByText('Producto Test')).toBeInTheDocument();
    });
  });

  it('handles product search', async () => {
    const user = userEvent.setup();
    render(<ProductosModerno />);
    
    const searchInput = screen.getByPlaceholderText(/buscar productos/i);
    await user.type(searchInput, 'Test');
    
    await waitFor(() => {
      expect(screen.getByText('Producto Test')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(<ProductosModerno />);
    
    expect(screen.getByText(/cargando productos/i)).toBeInTheDocument();
  });

  it('displays product information correctly', async () => {
    render(<ProductosModerno />);
    
    await waitFor(() => {
      expect(screen.getByText('Producto Test')).toBeInTheDocument();
      expect(screen.getByText('123456789')).toBeInTheDocument(); // Código de barras
      expect(screen.getByText('$10.50')).toBeInTheDocument(); // Precio
      expect(screen.getByText('100')).toBeInTheDocument(); // Stock
    });
  });

  it('opens create product modal', async () => {
    const user = userEvent.setup();
    render(<ProductosModerno />);
    
    const createButton = screen.getByRole('button', { name: /nuevo producto/i });
    await user.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText(/crear producto/i)).toBeInTheDocument();
    });
  });
});