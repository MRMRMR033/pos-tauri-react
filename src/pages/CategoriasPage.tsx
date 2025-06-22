// src/pages/CategoriasPage.tsx - Página principal de gestión de categorías
import React, { useState } from 'react';
import { useCreateCategory, useUpdateCategory } from '../hooks/queries/useCategories';
import CategoriesList from '../components/categories/CategoriesList';
import CategoryForm from '../components/categories/CategoryForm';
import { QueryProvider } from '../contexts/QueryClientProvider';
import type { CreateCategoriaRequest } from '../api/categories';

type ModalState = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  categoryId?: number;
};

const CategoriasPageContent: React.FC = () => {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    mode: 'create'
  });

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const handleCreate = () => {
    setModal({
      isOpen: true,
      mode: 'create'
    });
  };

  const handleEdit = (categoryId: number) => {
    setModal({
      isOpen: true,
      mode: 'edit',
      categoryId
    });
  };

  const handleCloseModal = () => {
    setModal({
      isOpen: false,
      mode: 'create'
    });
  };

  const handleSubmit = async (data: CreateCategoriaRequest) => {
    try {
      if (modal.mode === 'create') {
        await createCategory.mutateAsync(data);
      } else if (modal.mode === 'edit' && modal.categoryId) {
        await updateCategory.mutateAsync({
          id: modal.categoryId,
          data
        });
      }
      handleCloseModal();
    } catch (error) {
      // Los errores se manejan en los hooks
    }
  };

  const isSubmitting = createCategory.isPending || updateCategory.isPending;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <CategoryForm
              categoryId={modal.mode === 'edit' ? modal.categoryId : null}
              onSubmit={handleSubmit}
              onCancel={handleCloseModal}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-8">
        <CategoriesList
          onEdit={handleEdit}
          onCreate={handleCreate}
        />
      </div>
    </div>
  );
};

const CategoriasPage: React.FC = () => {
  return (
    <QueryProvider>
      <CategoriasPageContent />
    </QueryProvider>
  );
};

export default CategoriasPage;