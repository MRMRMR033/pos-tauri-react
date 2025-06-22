// src/components/categories/CategoryForm.tsx - Formulario de categoría con validación
import React from 'react';
import { useForm } from 'react-hook-form';
import { useCategory } from '../../hooks/queries/useCategories';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import type { CreateCategoriaRequest } from '../../api/categories';

type CategoryFormData = {
  nombre: string;
};

interface CategoryFormProps {
  categoryId?: number | null;
  onSubmit: (data: CreateCategoriaRequest) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  categoryId,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const { data: categoryData, isLoading } = useCategory(categoryId || 0);
  const category = categoryData?.data;
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CategoryFormData>({
    defaultValues: {
      nombre: ''
    }
  });

  // Cargar datos al editar
  React.useEffect(() => {
    if (category) {
      reset({
        nombre: category.nombre
      });
    } else {
      reset({
        nombre: ''
      });
    }
  }, [category, reset]);

  const handleFormSubmit = (data: CategoryFormData) => {
    const formData: CreateCategoriaRequest = {
      nombre: data.nombre.trim()
    };
    
    onSubmit(formData);
  };

  // Mostrar spinner mientras carga los datos para editar
  if (categoryId && isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">
          {category ? 'Editar Categoría' : 'Nueva Categoría'}
        </h3>
        <Button 
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          ✕
        </Button>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la Categoría *
          </label>
          <input
            type="text"
            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.nombre ? 'border-red-500' : ''
            }`}
            placeholder="Ej: Bebidas, Snacks, Limpieza..."
            disabled={isSubmitting}
            autoFocus
            {...register('nombre', {
              required: 'El nombre es obligatorio',
              minLength: { 
                value: 2, 
                message: 'Mínimo 2 caracteres' 
              }
            })}
          />
          {errors.nombre && (
            <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {category ? 'Actualizar Categoría' : 'Crear Categoría'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;