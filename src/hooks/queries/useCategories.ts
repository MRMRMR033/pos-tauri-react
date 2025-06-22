// src/hooks/queries/useCategories.ts - React Query hooks para Categorías
import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import {
  getCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  type Categoria,
  type CreateCategoriaRequest,
  type CategorySearchParams
} from '../../api/categories';

// Query keys
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (search?: string) => [...categoryKeys.lists(), { search }] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: number) => [...categoryKeys.details(), id] as const,
};

// ============ QUERIES ============

export function useCategories(params?: CategorySearchParams) {
  return useQuery({
    queryKey: categoryKeys.list(params?.search),
    queryFn: async () => {
      const response = await getCategorias(params);
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useCategory(id: number) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => getCategoriaById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// ============ MUTATIONS ============

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn: createCategoria,
    onSuccess: (data) => {
      // Invalidar todas las listas de categorías
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      showSuccess('Categoría creada exitosamente');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al crear categoría';
      showError(message);
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateCategoriaRequest> }) =>
      updateCategoria(id, data),
    onSuccess: (data, variables) => {
      // Invalidar listas y el detalle específico
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(variables.id) });
      showSuccess('Categoría actualizada exitosamente');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al actualizar categoría';
      showError(message);
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn: deleteCategoria,
    onSuccess: (_, deletedId) => {
      // Invalidar listas y remover del cache el detalle eliminado
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      queryClient.removeQueries({ queryKey: categoryKeys.detail(deletedId) });
      showSuccess('Categoría eliminada exitosamente');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al eliminar categoría';
      showError(message);
    },
  });
}

// ============ UTILITIES ============

export function useCategorySearch(searchTerm: string) {
  const debouncedSearch = useDebounce(searchTerm, 300);
  return useCategories(debouncedSearch);
}

// Hook simple para debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook para verificar si un nombre de categoría ya existe
export function useCategoryNameExists() {
  const { data: categories } = useCategories();
  
  return React.useCallback((name: string, excludeId?: number) => {
    if (!categories?.data) return false;
    
    return categories.data.some(categoria => 
      categoria.nombre.toLowerCase() === name.toLowerCase() && 
      categoria.id !== excludeId
    );
  }, [categories?.data]);
}