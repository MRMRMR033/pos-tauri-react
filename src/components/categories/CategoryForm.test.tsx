// src/components/categories/CategoryForm.test.tsx - Tests unitarios para CategoryForm
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CategoryForm from './CategoryForm';
import { useCategory } from '../../hooks/queries/useCategories';

// Mock hooks
vi.mock('../../hooks/queries/useCategories');

const mockUseCategory = vi.mocked(useCategory);

describe('CategoryForm', () => {
  let queryClient: QueryClient;
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    mockUseCategory.mockReturnValue({
      data: undefined,
      isLoading: false
    } as any);

    vi.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('debe renderizar formulario para nueva categoría', () => {
    renderWithProviders(
      <CategoryForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Nueva Categoría')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre de la Categoría')).toBeInTheDocument();
    expect(screen.getByText('Crear Categoría')).toBeInTheDocument();
  });

  it('debe cargar datos al editar categoría', () => {
    const categoryData = {
      data: { id: 1, nombre: 'Bebidas' },
      meta: { timestamp: '2024-01-01', apiVersion: '1' }
    };

    mockUseCategory.mockReturnValue({
      data: categoryData,
      isLoading: false
    } as any);

    renderWithProviders(
      <CategoryForm
        categoryId={1}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Editar Categoría')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bebidas')).toBeInTheDocument();
    expect(screen.getByText('Actualizar Categoría')).toBeInTheDocument();
  });

  it('debe mostrar spinner mientras carga datos para editar', () => {
    mockUseCategory.mockReturnValue({
      data: undefined,
      isLoading: true
    } as any);

    renderWithProviders(
      <CategoryForm
        categoryId={1}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('debe validar que el nombre es obligatorio', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CategoryForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByText('Crear Categoría');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('debe validar longitud mínima del nombre', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CategoryForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText('Nombre de la Categoría');
    await user.type(nameInput, 'A');
    await user.tab(); // Trigger blur

    await waitFor(() => {
      expect(screen.getByText('Mínimo 2 caracteres')).toBeInTheDocument();
    });
  });

  it('debe enviar datos correctos al crear categoría', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CategoryForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText('Nombre de la Categoría');
    await user.type(nameInput, 'Nueva Categoría');

    const submitButton = screen.getByText('Crear Categoría');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        nombre: 'Nueva Categoría'
      });
    });
  });

  it('debe llamar onCancel al hacer clic en Cancelar', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CategoryForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancelar');
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('debe deshabilitar botones mientras está enviando', () => {
    renderWithProviders(
      <CategoryForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={true}
      />
    );

    const submitButton = screen.getByRole('button', { name: /crear categoría/i });
    const cancelButton = screen.getByText('Cancelar');

    expect(submitButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('debe limpiar espacios en blanco del nombre', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CategoryForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText('Nombre de la Categoría');
    await user.type(nameInput, '  Bebidas  ');

    const submitButton = screen.getByText('Crear Categoría');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        nombre: 'Bebidas'
      });
    });
  });
});