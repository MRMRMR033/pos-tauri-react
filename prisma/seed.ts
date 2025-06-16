import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seeding de la base de datos...');

  // 1. Crear categoría por defecto "Sin categoría"
  console.log('📂 Creando categoría por defecto...');
  const categoriaDefault = await prisma.categoria.upsert({
    where: { nombre: 'Sin categoría' },
    update: {},
    create: {
      nombre: 'Sin categoría',
      descripcion: 'Productos sin categoría asignada',
      activa: true
    }
  });
  console.log(`✅ Categoría creada: ${categoriaDefault.nombre}`);

  // 2. Crear permisos del sistema
  console.log('🔐 Creando permisos del sistema...');
  const permisos = [
    // Productos
    { key: 'productos:ver', name: 'Ver productos', description: 'Permite ver la lista de productos', module: 'productos' },
    { key: 'productos:ver_precio_costo', name: 'Ver precio de costo', description: 'Permite ver el precio de costo de los productos', module: 'productos' },
    { key: 'productos:ver_precio_venta', name: 'Ver precio de venta', description: 'Permite ver el precio de venta de los productos', module: 'productos' },
    { key: 'productos:crear', name: 'Crear producto', description: 'Permite crear nuevos productos', module: 'productos' },
    { key: 'productos:editar', name: 'Editar producto', description: 'Permite editar productos existentes', module: 'productos' },
    { key: 'productos:eliminar', name: 'Eliminar producto', description: 'Permite eliminar productos', module: 'productos' },
    { key: 'productos:ver_stock', name: 'Ver stock', description: 'Permite ver el stock de los productos', module: 'productos' },
    { key: 'productos:ajustar_stock', name: 'Ajustar stock', description: 'Permite ajustar el stock de los productos', module: 'productos' },

    // Ventas
    { key: 'ventas:crear', name: 'Crear venta', description: 'Permite crear nuevas ventas', module: 'ventas' },
    { key: 'ventas:ver_propias', name: 'Ver ventas propias', description: 'Permite ver las ventas propias', module: 'ventas' },
    { key: 'ventas:ver_todas', name: 'Ver todas las ventas', description: 'Permite ver todas las ventas del sistema', module: 'ventas' },
    { key: 'ventas:cancelar', name: 'Cancelar venta', description: 'Permite cancelar ventas', module: 'ventas' },
    { key: 'ventas:aplicar_descuento', name: 'Aplicar descuento', description: 'Permite aplicar descuentos en las ventas', module: 'ventas' },

    // Caja
    { key: 'caja:abrir_sesion', name: 'Abrir sesión de caja', description: 'Permite abrir sesiones de caja', module: 'caja' },
    { key: 'caja:cerrar_sesion', name: 'Cerrar sesión de caja', description: 'Permite cerrar sesiones de caja', module: 'caja' },
    { key: 'caja:registrar_entrada', name: 'Registrar entrada', description: 'Permite registrar entradas de dinero', module: 'caja' },
    { key: 'caja:registrar_salida', name: 'Registrar salida', description: 'Permite registrar salidas de dinero', module: 'caja' },
    { key: 'caja:ver_movimientos', name: 'Ver movimientos', description: 'Permite ver los movimientos de caja', module: 'caja' },

    // Usuarios
    { key: 'usuarios:ver', name: 'Ver usuarios', description: 'Permite ver la lista de usuarios', module: 'usuarios' },
    { key: 'usuarios:crear', name: 'Crear usuario', description: 'Permite crear nuevos usuarios', module: 'usuarios' },
    { key: 'usuarios:editar', name: 'Editar usuario', description: 'Permite editar usuarios existentes', module: 'usuarios' },
    { key: 'usuarios:eliminar', name: 'Eliminar usuario', description: 'Permite eliminar usuarios', module: 'usuarios' },
    { key: 'usuarios:gestionar_permisos', name: 'Gestionar permisos', description: 'Permite gestionar permisos de usuarios', module: 'usuarios' },
    { key: 'usuarios:ver_propio', name: 'Ver perfil propio', description: 'Permite ver el perfil propio', module: 'usuarios' },

    // Categorías
    { key: 'categorias:ver', name: 'Ver categorías', description: 'Permite ver la lista de categorías', module: 'categorias' },
    { key: 'categorias:crear', name: 'Crear categoría', description: 'Permite crear nuevas categorías', module: 'categorias' },
    { key: 'categorias:editar', name: 'Editar categoría', description: 'Permite editar categorías existentes', module: 'categorias' },
    { key: 'categorias:eliminar', name: 'Eliminar categoría', description: 'Permite eliminar categorías', module: 'categorias' },

    // Proveedores
    { key: 'proveedores:ver', name: 'Ver proveedores', description: 'Permite ver la lista de proveedores', module: 'proveedores' },
    { key: 'proveedores:crear', name: 'Crear proveedor', description: 'Permite crear nuevos proveedores', module: 'proveedores' },
    { key: 'proveedores:editar', name: 'Editar proveedor', description: 'Permite editar proveedores existentes', module: 'proveedores' },
    { key: 'proveedores:eliminar', name: 'Eliminar proveedor', description: 'Permite eliminar proveedores', module: 'proveedores' },

    // Sesiones
    { key: 'sesiones:ver_propias', name: 'Ver sesiones propias', description: 'Permite ver las sesiones propias', module: 'sesiones' },
    { key: 'sesiones:ver_todas', name: 'Ver todas las sesiones', description: 'Permite ver todas las sesiones del sistema', module: 'sesiones' },

    // Reportes
    { key: 'reportes:ventas', name: 'Reportes de ventas', description: 'Permite generar reportes de ventas', module: 'reportes' },
    { key: 'reportes:inventario', name: 'Reportes de inventario', description: 'Permite generar reportes de inventario', module: 'reportes' },
    { key: 'reportes:caja', name: 'Reportes de caja', description: 'Permite generar reportes de caja', module: 'reportes' },
    { key: 'reportes:usuarios', name: 'Reportes de usuarios', description: 'Permite generar reportes de usuarios', module: 'reportes' }
  ];

  for (const permiso of permisos) {
    await prisma.permiso.upsert({
      where: { key: permiso.key },
      update: permiso,
      create: permiso
    });
  }
  console.log(`✅ ${permisos.length} permisos creados/actualizados`);

  // 3. Crear usuario administrador por defecto
  console.log('👤 Creando usuario administrador...');
  const hashedPassword = await bcrypt.hash('12345', 10);
  
  const adminUser = await prisma.usuario.upsert({
    where: { email: 'admin@pos-system.com' },
    update: {},
    create: {
      email: 'admin@pos-system.com',
      password: hashedPassword,
      fullName: 'Administrador del Sistema',
      rol: 'ADMIN',
      activo: true
    }
  });
  console.log(`✅ Usuario admin creado: ${adminUser.email}`);

  // 4. Crear algunas categorías de ejemplo
  console.log('📂 Creando categorías de ejemplo...');
  const categoriasEjemplo = [
    { nombre: 'Bebidas', descripcion: 'Bebidas y refrescos' },
    { nombre: 'Snacks', descripcion: 'Botanas y golosinas' },
    { nombre: 'Panadería', descripcion: 'Pan y productos horneados' },
    { nombre: 'Lácteos', descripcion: 'Productos lácteos' },
    { nombre: 'Limpieza', descripcion: 'Productos de limpieza' }
  ];

  for (const categoria of categoriasEjemplo) {
    await prisma.categoria.upsert({
      where: { nombre: categoria.nombre },
      update: {},
      create: categoria
    });
  }
  console.log(`✅ ${categoriasEjemplo.length} categorías de ejemplo creadas`);

  // 5. Crear algunos productos de ejemplo
  console.log('📦 Creando productos de ejemplo...');
  const productosEjemplo = [
    {
      nombre: 'Coca Cola 600ml',
      descripcion: 'Refresco de cola 600ml',
      codigoBarras: '7501055363057',
      precioCosto: 12.50,
      precioVenta: 18.00,
      stock: 50,
      stockMinimo: 10,
      categoriaId: undefined // Sin categoría
    },
    {
      nombre: 'Sabritas Clásicas',
      descripcion: 'Papas fritas sabor natural 45g',
      codigoBarras: '7501055363058',
      precioCosto: 8.00,
      precioVenta: 12.00,
      stock: 30,
      stockMinimo: 5,
      categoriaId: undefined // Sin categoría
    }
  ];

  for (const producto of productosEjemplo) {
    await prisma.producto.upsert({
      where: { codigoBarras: producto.codigoBarras },
      update: {},
      create: producto
    });
  }
  console.log(`✅ ${productosEjemplo.length} productos de ejemplo creados`);

  console.log('🎉 Seeding completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });