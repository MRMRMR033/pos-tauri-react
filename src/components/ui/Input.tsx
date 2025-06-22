import React from 'react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  required?: boolean;
  variant?: 'default' | 'filled';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  required = false,
  variant = 'default',
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const baseClasses = 'input';
  const variantClasses = `input--${variant}`;
  const errorClasses = error ? 'input--error' : '';
  const disabledClasses = props.disabled ? 'input--disabled' : '';

  const combinedClasses = [
    baseClasses,
    variantClasses,
    errorClasses,
    disabledClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="input-group">
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      
      <input
        id={inputId}
        className={combinedClasses}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined
        }
        {...props}
      />
      
      {error && (
        <div id={`${inputId}-error`} className="input-error">
          {error}
        </div>
      )}
      
      {helper && !error && (
        <div id={`${inputId}-helper`} className="input-helper">
          {helper}
        </div>
      )}
    </div>
  );
};

export default Input;