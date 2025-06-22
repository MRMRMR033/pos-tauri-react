// src/e2e/categories.spec.ts - Tests E2E para categorías
import { test, expect } from '@playwright/test';

// Configuración base para tests E2E
test.describe('Gestión de Categorías E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de categorías
    await page.goto('/categorias');
    
    // Esperar a que la página cargue
    await page.waitForSelector('[data-testid="categories-list"]', { timeout: 10000 });
  });

  test('debe crear una nueva categoría', async ({ page }) => {
    // Hacer clic en el botón "Nueva Categoría"
    await page.click('text=+ Nueva Categoría');
    
    // Verificar que se abre el modal
    await expect(page.locator('text=Nueva Categoría')).toBeVisible();
    
    // Llenar el formulario
    await page.fill('input[name="nombre"]', 'Categoría Test E2E');
    
    // Enviar el formulario
    await page.click('text=Crear Categoría');
    
    // Verificar que la categoría aparece en la lista
    await expect(page.locator('text=Categoría Test E2E')).toBeVisible();
    
    // Verificar que el modal se cierra
    await expect(page.locator('text=Nueva Categoría')).not.toBeVisible();
  });

  test('debe editar una categoría existente', async ({ page }) => {
    // Buscar una categoría para editar (asumiendo que existe al menos una)
    const firstEditButton = page.locator('text=Editar').first();
    await firstEditButton.click();
    
    // Verificar que se abre el modal de edición
    await expect(page.locator('text=Editar Categoría')).toBeVisible();
    
    // Modificar el nombre
    await page.fill('input[name="nombre"]', 'Categoría Editada E2E');
    
    // Guardar cambios
    await page.click('text=Actualizar Categoría');
    
    // Verificar que la categoría actualizada aparece en la lista
    await expect(page.locator('text=Categoría Editada E2E')).toBeVisible();
  });

  test('debe eliminar una categoría', async ({ page }) => {
    // Hacer clic en el botón eliminar de la primera categoría
    const firstDeleteButton = page.locator('text=Eliminar').first();
    await firstDeleteButton.click();
    
    // Confirmar la eliminación en el diálogo
    page.on('dialog', dialog => dialog.accept());
    
    // Verificar que aparece el toast de éxito (opcional)
    // await expect(page.locator('text=Categoría eliminada exitosamente')).toBeVisible();
  });

  test('debe buscar categorías', async ({ page }) => {
    // Escribir en el campo de búsqueda
    await page.fill('input[placeholder*="Buscar"]', 'Bebidas');
    
    // Esperar a que se actualicen los resultados
    await page.waitForTimeout(500);
    
    // Verificar que solo aparecen categorías que coinciden con la búsqueda
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(page.locator('text=Bebidas')).toBeVisible();
  });

  test('debe navegar entre páginas', async ({ page }) => {
    // Solo ejecutar si hay múltiples páginas
    const nextButton = page.locator('text=Siguiente');
    
    if (await nextButton.isVisible()) {
      await nextButton.click();
      
      // Verificar que cambió la página
      await expect(page.locator('text=Página 2')).toBeVisible();
      
      // Regresar a la página anterior
      await page.click('text=Anterior');
      await expect(page.locator('text=Página 1')).toBeVisible();
    }
  });

  test('debe validar campos del formulario', async ({ page }) => {
    // Abrir formulario de nueva categoría
    await page.click('text=+ Nueva Categoría');
    
    // Intentar enviar sin llenar campos
    await page.click('text=Crear Categoría');
    
    // Verificar que aparece el mensaje de validación
    await expect(page.locator('text=El nombre es obligatorio')).toBeVisible();
    
    // Llenar con un nombre muy corto
    await page.fill('input[name="nombre"]', 'A');
    await page.click('text=Crear Categoría');
    
    // Verificar validación de longitud mínima
    await expect(page.locator('text=Mínimo 2 caracteres')).toBeVisible();
  });

  test('debe mostrar mensaje cuando no hay categorías', async ({ page }) => {
    // Este test requeriría una base de datos vacía o un mock específico
    // Verificar que aparece el mensaje apropiado
    const emptyMessage = page.locator('text=No hay categorías registradas');
    
    if (await emptyMessage.isVisible()) {
      await expect(page.locator('text=Crear primera categoría')).toBeVisible();
    }
  });
});