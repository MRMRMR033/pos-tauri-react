// src/pages/Login.tsx - VERSIÓN CORREGIDA
import React, { useState, useContext, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Button, Input } from '../components/ui';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { signIn } = useContext(AuthContext);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      console.log('Iniciando proceso de login...');
      await signIn({ email, password });
      console.log('Login exitoso, navegando...');
      navigate('/ventas');
    } catch (err: any) {
      console.error('Error capturado en handleSubmit:', err);
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="login-grid"></div>
      </div>
      
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <div className="logo-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7M3 7L12 2L21 7M3 7L12 13M21 7L12 13M12 13V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="logo-text">My POS</span>
            </div>
            <h1 className="login-title">Iniciar Sesión</h1>
            <p className="login-subtitle">Accede a tu sistema de punto de venta</p>
          </div>
          
          {error && (
            <div className="error-message">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
              </svg>
              {error}
            </div>
          )}
          
          <form className="login-form" onSubmit={handleSubmit}>
            <Input
              id="email"
              type="text"
              label="Usuario"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingresa tu usuario"
              required
              disabled={isLoading}
            />
            
            <Input
              id="password"
              type="password"
              label="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              required
              disabled={isLoading}
            />
            
            <Button
              type="submit"
              loading={isLoading}
              className="login-button"
              size="lg"
            >
              Iniciar Sesión
            </Button>
          </form>
          
          <div className="login-footer">
            <p className="footer-text">Sistema de Punto de Venta</p>
            <p className="footer-version">v2.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;