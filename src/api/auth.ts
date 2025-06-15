// src/api/auth.ts - VERSIÓN CORREGIDA
import { fetch } from '@tauri-apps/plugin-http';
import type { Credentials } from '../types/auth';

const API_URL = 'http://localhost:3000';

export async function login(credentials: Credentials): Promise<{ access_token: string }> {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    
    if (!res.ok) {
      const errorData = await res.text();
      console.error('Error del servidor:', errorData);
      throw new Error(`Error ${res.status}: Credenciales inválidas`);
    }
    
    const data = await res.json();
    return data as { access_token: string };
  } catch (error) {
    console.error('Error en login:', error);
    throw error;
  }
}

export async function getProfile(token: string): Promise<any> {
  try {
    const res = await fetch(`${API_URL}/auth/perfil`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    
    if (!res.ok) {
      const errorData = await res.text();
      console.error('Error del servidor en perfil:', errorData);
      throw new Error(`Error ${res.status}: No autorizado`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error en getProfile:', error);
    throw error;
  }
}