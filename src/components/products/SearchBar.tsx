// src/components/products/SearchBar.tsx - Barra de búsqueda con filtros
import React from 'react';
import './SearchBar.css';

interface SearchBarProps {
  searchTerm: string;
  onSearch: (term: string) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  loading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearch,
  pageSize,
  onPageSizeChange,
  loading
}) => {
  return (
    <div className="search-bar">
      <div className="search-input-container">
        <div className="search-field">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre o código de barras..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className="search-input"
            disabled={loading}
          />
          {searchTerm && (
            <button 
              className="clear-search"
              onClick={() => onSearch('')}
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
      <div className="search-controls">
        <div className="page-size-control">
          <label htmlFor="pageSize">Mostrar:</label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            disabled={loading}
            className="page-size-select"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>por página</span>
        </div>
        
        {loading && (
          <div className="search-loading">
            <div className="loading-spinner-small"></div>
            <span>Buscando...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;