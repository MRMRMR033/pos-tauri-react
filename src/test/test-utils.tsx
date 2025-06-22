import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthContext } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';

// Mock auth context for testing
const mockAuthContext = {
  user: {
    id: 1,
    email: 'test@example.com',
    fullName: 'Test User',
    rol: 'empleado'
  },
  accessToken: 'mock-token',
  permissions: ['productos:ver', 'ventas:crear'],
  isLoadingAuth: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
  hasPermission: vi.fn().mockReturnValue(true),
  hasAnyPermission: vi.fn().mockReturnValue(true),
  hasAllPermissions: vi.fn().mockReturnValue(true),
  isAdmin: vi.fn().mockReturnValue(false),
  refreshPermissions: vi.fn()
};

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
export { mockAuthContext };