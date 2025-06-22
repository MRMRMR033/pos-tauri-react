import React from 'react';
import './Spinner.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'white';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className = ''
}) => {
  const baseClasses = 'spinner';
  const sizeClasses = `spinner--${size}`;
  const variantClasses = `spinner--${variant}`;

  const combinedClasses = [
    baseClasses,
    sizeClasses,
    variantClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={combinedClasses} role="status" aria-label="Loading">
      <div className="spinner__circle" />
    </div>
  );
};

export default Spinner;