# 🔧 Guía de Troubleshooting - API Connections

## Problema Identificado: Error 500 al crear categorías

### ✅ **Frontend - FUNCIONANDO CORRECTAMENTE**
- Token de autenticación se pasa correctamente
- Headers están bien formados
- Datos se envían en formato JSON correcto
- URL del endpoint es correcta: `http://localhost:3000/categoria`

### ❌ **Backend - REQUIERE ATENCIÓN**
El error 500 indica un problema interno del servidor. Posibles causas:

#### 1. **Base de Datos**
```bash
# Verificar que la base de datos esté corriendo
# PostgreSQL/MySQL/SQLite según tu configuración
```

#### 2. **Prisma**
```bash
# Verificar migraciones
npx prisma migrate status

# Aplicar migraciones pendientes
npx prisma migrate dev

# Regenerar cliente
npx prisma generate
```

#### 3. **Logs del Backend**
Revisar los logs del servidor NestJS cuando ocurre el error:
```bash
# Ejecutar el backend en modo verbose
npm run start:dev
```

#### 4. **Permisos de Usuario**
- Verificar que el usuario autenticado tenga el permiso `CATEGORIAS_CREAR`
- Revisar la configuración de roles y permisos

### 🧪 **Test Manual del Backend**
```bash
# Test directo al backend
curl -X POST http://localhost:3000/categoria \
  -H "Authorization: Bearer TOKEN_AQUÍ" \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Test Categoria"}'
```

### 📋 **Checklist de Verificación**
- [ ] Backend corriendo en puerto 3000
- [ ] Base de datos conectada y accesible
- [ ] Migraciones de Prisma aplicadas
- [ ] Usuario tiene permisos correctos
- [ ] Variables de entorno configuradas
- [ ] Logs del backend revisados

### 🔄 **Próximos Pasos**
1. Backend developer debe revisar logs internos del servidor
2. Verificar estado de la base de datos
3. Confirmar configuración de Prisma
4. Una vez resuelto el backend, probar nuevamente desde el frontend

### 📞 **Información para Backend Developer**
**Request que llega al servidor:**
- Method: POST
- URL: /categoria
- Headers: Content-Type: application/json, Authorization: Bearer [token]
- Body: {"nombre": "Nombre de la categoría"}

**Response actual:**
- Status: 500
- Body: {"statusCode":500,"timestamp":"...","path":"/categoria","message":"Internal server error"}