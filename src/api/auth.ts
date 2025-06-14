// src/api/auth.ts
import { fetch } from '@tauri-apps/plugin-http';
import type { AuthData, Credentials } from '../types/auth';

const API_URL = 'http://localhost:3000';

export async function login(credentials: Credentials): Promise<AuthData> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (response.status !== 200) {
    throw new Error('Usuario o contraseña incorrectos');
  }
  return (await response.json()) as AuthData;
}

export async function refreshToken(token: string): Promise<{ accessToken: string }> {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: token }),
  });
  if (response.status !== 200) {
    throw new Error('No se pudo renovar el token');
  }
  return (await response.json()) as { accessToken: string };
}
