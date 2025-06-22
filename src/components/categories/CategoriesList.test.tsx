// src/components/categories/CategoriesList.test.tsx - Tests unitarios para CategoriesList
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CategoriesList from './CategoriesList';
import { useCategories, useDeleteCategory } from '../../hooks/queries/useCategories';

// Mock hooks
vi.mock('../../hooks/queries/useCategories');

const mockUseCategories = vi.mocked(useCategories);
const mockUseDeleteCategory = vi.mocked(useDeleteCategory);

// Mock data
const mockCategories = [
  { id: 1, nombre: 'Bebidas' },
  { id: 2, nombre: 'Snacks' },
  { id: 3, nombre: 'Limpieza' }
];

const mockCategoriesResponse = {
  data: mockCategories,
  meta: {
    page: 1,
    limit: 10,
    total: 3,
    totalPages: 1,
    timestamp: '2024-01-01',
    apiVersion: '1'
  }
};

describe('CategoriesList', () => {
  let queryClient: QueryClient;
  const mockOnEdit = vi.fn();
  const mockOnCreate = vi.fn();
  const mockDeleteMutate = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    mockUseCategories.mockReturnValue({
      data: mockCategoriesResponse,
      isLoading: false,
      error: null
    } as any);

    mockUseDeleteCategory.mockReturnValue({
      mutateAsync: mockDeleteMutate,
      isPending: false
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

  it('debe renderizar la lista de categorías correctamente', () => {
    renderWithProviders(
      <CategoriesList onEdit={mockOnEdit} onCreate={mockOnCreate} />
    );

    expect(screen.getByText('Gestión de Categorías')).toBeInTheDocument();
    expect(screen.getByText('Bebidas')).toBeInTheDocument();
    expect(screen.getByText('Snacks')).toBeInTheDocument();
    expect(screen.getByText('Limpieza')).toBeInTheDocument();
    expect(screen.getByText('3 categorías encontradas')).toBeInTheDocument();
  });

  it('debe mostrar spinner cuando está cargando', () => {
    mockUseCategories.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null
    } as any);

    renderWithProviders(
      <CategoriesList onEdit={mockOnEdit} onCreate={mockOnCreate} />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('debe mostrar mensaje de error cuando falla la carga', () => {
    mockUseCategories.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error')
    } as any);

    renderWithProviders(
      <CategoriesList onEdit={mockOnEdit} onCreate={mockOnCreate} />
    );

    expect(screen.getByText(/Error al cargar categorías/)).toBeInTheDocument();
    expect(screen.getByText('Reintentar')).toBeInTheDocument();
  });

  it('debe mostrar mensaje cuando no hay categorías', () => {
    mockUseCategories.mockReturnValue({
      data: { ...mockCategoriesResponse, data: [] },
      isLoading: false,
      error: null
    } as any);

    renderWithProviders(
      <CategoriesList onEdit={mockOnEdit} onCreate={mockOnCreate} />
    );

    expect(screen.getByText('No hay categorías registradas')).toBeInTheDocument();
    expect(screen.getByText('Crear primera categoría')).toBeInTheDocument();
  });

  it('debe permitir buscar categorías', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CategoriesList onEdit={mockOnEdit} onCreate={mockOnCreate} />
    );

    const searchInput = screen.getByPlaceholderText('Buscar categorías por nombre...');
    
    await user.type(searchInput, 'Bebidas');
    
    await waitFor(() => {
      expect(mockUseCategories).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Bebidas'
        })
      );
    });
  });

  it('debe llamar onEdit cuando se hace clic en Editar', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CategoriesList onEdit={mockOnEdit} onCreate={mockOnCreate} />
    );

    const editButtons = screen.getAllByText('Editar');
    await user.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(1);
  });

  it('debe llamar onDelete con confirmación', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    renderWithProviders(
      <CategoriesList onEdit={mockOnEdit} onCreate={mockOnCreate} />
    );

    const deleteButtons = screen.getAllByText('Eliminar');
    await user.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith(
      '¿Estás seguro de eliminar la categoría "Bebidas"?'
    );
    expect(mockDeleteMutate).toHaveBeenCalledWith(1);
  });

  it('no debe eliminar si se cancela la confirmación', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    
    renderWithProviders(
      <CategoriesList onEdit={mockOnEdit} onCreate={mockOnCreate} />
    );

    const deleteButtons = screen.getAllByText('Eliminar');
    await user.click(deleteButtons[0]);

    expect(mockDeleteMutate).not.toHaveBeenCalled();
  });

  it('debe llamar onCreate cuando se hace clic en Nueva Categoría', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CategoriesList onEdit={mockOnEdit} onCreate={mockOnCreate} />
    );

    const createButton = screen.getByText('+ Nueva Categoría');
    await user.click(createButton);

    expect(mockOnCreate).toHaveBeenCalled();
  });

  it('debe mostrar paginación cuando hay múltiples páginas', () => {
    mockUseCategories.mockReturnValue({
      data: {
        ...mockCategoriesResponse,
        meta: {
          ...mockCategoriesResponse.meta,
          totalPages: 3,
          page: 1
        }
      },
      isLoading: false,
      error: null
    } as any);

    renderWithProviders(
      <CategoriesList onEdit={mockOnEdit} onCreate={mockOnCreate} />
    );

    expect(screen.getByText(/Mostrando página.*1.*de.*3/)).toBeInTheDocument();
    expect(screen.getAllByText('Siguiente')).toHaveLength(2); // Mobile y desktop
  });
});