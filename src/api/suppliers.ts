// src/api/suppliers.ts - API actualizada con apiClient y ApiResponse<T>
import { apiClient } from './client';
import { Proveedor, CreateProveedorRequest, ApiResponse } from '../types/api';

// Re-export tipos para compatibilidad
export type { Proveedor, CreateProveedorRequest };

// ============ PROVEEDORES ============

export async function getProveedores(): Promise<ApiResponse<Proveedor[]>> {
  return apiClient.get<Proveedor[]>('/proveedor');
}

export async function getProveedorById(id: number): Promise<ApiResponse<Proveedor>> {
  return apiClient.get<Proveedor>(`/proveedor/${id}`);
}

export async function createProveedor(data: CreateProveedorRequest): Promise<ApiResponse<Proveedor>> {
  return apiClient.post<Proveedor>('/proveedor', data);
}

export async function updateProveedor(id: number, data: Partial<CreateProveedorRequest>): Promise<ApiResponse<Proveedor>> {
  return apiClient.patch<Proveedor>(`/proveedor/${id}`, data);
}

export async function deleteProveedor(id: number): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`/proveedor/${id}`);
}