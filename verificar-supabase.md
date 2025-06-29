# 🔍 Verificación de Configuración de Supabase

## Pasos para verificar que todo esté configurado correctamente:

### 1. Verificar que el proyecto de Supabase esté activo
- Ve a [supabase.com](https://supabase.com)
- Inicia sesión y verifica que tu proyecto esté activo
- URL del proyecto: `https://mgxgsfkespclwluhyipy.supabase.co`

### 2. Ejecutar el script SQL
1. Ve al **SQL Editor** en tu proyecto de Supabase
2. Copia y ejecuta todo el contenido del archivo `database-schema.sql`
3. Verifica que no haya errores en la ejecución

### 3. Verificar las tablas creadas
En el **Table Editor** de Supabase, deberías ver estas tablas:
- ✅ `vendedores`
- ✅ `clientes`
- ✅ `productos`
- ✅ `reportes`
- ✅ `entradas_reporte`

### 4. Verificar las políticas RLS
En **Authentication > Policies**, verifica que existan políticas para:
- `vendedores` - Permitir todas las operaciones
- `clientes` - Permitir todas las operaciones
- `productos` - Permitir todas las operaciones
- `reportes` - Permitir todas las operaciones
- `entradas_reporte` - Permitir todas las operaciones

### 5. Verificar datos de ejemplo
Después de ejecutar el script, deberías tener:
- 3 vendedores de ejemplo
- 3 clientes de ejemplo
- 3 productos de ejemplo

### 6. Probar la aplicación
1. Ejecuta `ng serve --open`
2. Abre la consola del navegador (F12)
3. Deberías ver mensajes como:
   - ✅ Supabase client creado correctamente
   - ✅ Conexión exitosa con Supabase
   - ✅ Vendedores obtenidos: 3
   - ✅ Clientes obtenidos: 3
   - ✅ Productos obtenidos: 3

### 7. Si hay errores

#### Error: "Invalid URL"
- Verifica que la URL no termine en `/`
- La URL debe ser: `https://mgxgsfkespclwluhyipy.supabase.co`

#### Error: "relation does not exist"
- Ejecuta el script SQL completo
- Verifica que las tablas se crearon correctamente

#### Error: "permission denied"
- Verifica que las políticas RLS estén configuradas
- Asegúrate de que las políticas permitan operaciones anónimas

#### Error: "JWT secret not set"
- Ve a **Settings > API**
- Verifica que el JWT secret esté configurado

### 8. Comandos útiles para debugging

```bash
# Limpiar caché de Angular
ng cache clean

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Ejecutar con logs detallados
ng serve --verbose
```

### 9. Verificar en la consola del navegador

Abre las herramientas de desarrollador (F12) y busca estos mensajes:

```
✅ Supabase client creado correctamente
✅ Conexión exitosa con Supabase
✅ Vendedores obtenidos: 3
✅ Clientes obtenidos: 3
✅ Productos obtenidos: 3
```

Si ves errores, compártelos para poder ayudarte mejor. 
