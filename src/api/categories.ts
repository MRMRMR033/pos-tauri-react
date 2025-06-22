// src/api/categories.ts - API actualizada con apiClient y ApiResponse<T>
import { apiClient } from './client';
import { Categoria, CreateCategoriaRequest, ApiResponse, PaginationParams } from '../types/api';

// Re-export tipos para compatibilidad
export type { Categoria, CreateCategoriaRequest };

// Parámetros de búsqueda para categorías
export interface CategorySearchParams extends PaginationParams {
  search?: string;
}

// ============ CATEGORÍAS ============

export async function getCategorias(params?: CategorySearchParams): Promise<ApiResponse<Categoria[]>> {
  return apiClient.get<Categoria[]>('/categoria', params);
}

export async function getCategoriaById(id: number): Promise<ApiResponse<Categoria>> {
  return apiClient.get<Categoria>(`/categoria/${id}`);
}

export async function createCategoria(data: CreateCategoriaRequest): Promise<ApiResponse<Categoria>> {
  return apiClient.post<Categoria>('/categoria', data);
}

export async function updateCategoria(id: number, data: Partial<CreateCategoriaRequest>): Promise<ApiResponse<Categoria>> {
  return apiClient.patch<Categoria>(`/categoria/${id}`, data);
}

export async function deleteCategoria(id: number): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`/categoria/${id}`);
}