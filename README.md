# 📊 Reporte de Novedades - Sistema de Vendedores

Sistema completo para el registro y gestión de reportes de novedades de vendedores, con almacenamiento en Supabase y generación de reportes Excel.

## 🚀 Características

- ✅ **Formulario completo** para registro de ventas
- ✅ **Cálculos automáticos** de diferencias y descuentos
- ✅ **Almacenamiento en Supabase** (PostgreSQL)
- ✅ **Generación de CSV/Excel** automática
- ✅ **Gestión de vendedores, clientes y productos**
- ✅ **Interfaz moderna y responsive**
- ✅ **Componentes Angular standalone**

## 🛠️ Tecnologías

- **Frontend**: Angular 17 (Standalone Components)
- **Backend**: Supabase (PostgreSQL + API REST)
- **Estilos**: CSS3 con Grid y Flexbox
- **Base de Datos**: PostgreSQL con RLS

## 📋 Configuración

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una nueva cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Guarda la URL y la anon key

### 2. Configurar la Base de Datos

1. Ve al **SQL Editor** en tu proyecto de Supabase
2. Copia y ejecuta el contenido del archivo `database-schema.sql`
3. Esto creará todas las tablas necesarias con datos de ejemplo

### 3. Configurar las Credenciales

1. Ve a **Settings > API** en Supabase
2. Copia la **Project URL** y **anon public key**
3. Abre `src/app/services/supabase.service.ts`
4. Reemplaza las líneas 58-59:

```typescript
const SUPABASE_URL = 'TU_URL_DE_SUPABASE';
const SUPABASE_ANON_KEY = 'TU_ANON_KEY_DE_SUPABASE';
```

Con tus credenciales reales:

```typescript
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = 'tu-anon-key-aqui';
```

### 4. Instalar Dependencias

```bash
npm install
```

### 5. Ejecutar la Aplicación

```bash
ng serve --open
```

## 🗄️ Estructura de la Base de Datos

### Tablas Principales

#### `vendedores`
- `id`: Identificador único
- `nombre`: Nombre del vendedor
- `email`: Email del vendedor
- `activo`: Estado activo/inactivo

#### `clientes`
- `id`: Identificador único
- `nombre`: Nombre del cliente
- `email`: Email del cliente (opcional)
- `telefono`: Teléfono del cliente (opcional)
- `activo`: Estado activo/inactivo

#### `productos`
- `id`: Identificador único
- `nombre`: Nombre del producto
- `descripcion`: Descripción del producto
- `precio_base`: Precio base del producto
- `activo`: Estado activo/inactivo

#### `reportes`
- `id`: Identificador único
- `vendedor_id`: Referencia al vendedor
- `fecha`: Fecha del reporte
- `observaciones`: Observaciones adicionales

#### `entradas_reporte`
- `id`: Identificador único
- `reporte_id`: Referencia al reporte
- `factura`: Número de factura
- `cliente_id`: Referencia al cliente
- `producto_id`: Referencia al producto
- `cantidad`: Cantidad vendida
- `precio_facturado`: Precio facturado
- `precio_ofrecido`: Precio ofrecido
- `diferencia`: Diferencia calculada automáticamente
- `total_descuento`: Total de descuento calculado automáticamente

## 🔧 Funcionalidades

### Para Vendedores
1. **Registro de ventas** con información completa
2. **Cálculos automáticos** de diferencias y descuentos
3. **Gestión de entradas** múltiples por reporte
4. **Descarga automática** de CSV con los datos

### Para Administradores
1. **Acceso a todos los reportes** en la base de datos
2. **Generación de reportes** desde Supabase
3. **Gestión de vendedores, clientes y productos**
4. **Análisis de datos** con consultas SQL

## 📊 Generación de Reportes

### Desde la Aplicación
- Los reportes se guardan automáticamente en Supabase
- Se genera un CSV que se descarga automáticamente
- Los datos quedan disponibles para consultas posteriores

### Desde Supabase
Puedes ejecutar consultas SQL para generar reportes:

```sql
-- Reporte de todos los vendedores con totales
SELECT 
    v.nombre as vendedor,
    COUNT(r.id) as total_reportes,
    SUM(er.total_descuento) as total_descuentos
FROM vendedores v
LEFT JOIN reportes r ON v.id = r.vendedor_id
LEFT JOIN entradas_reporte er ON r.id = er.reporte_id
WHERE v.activo = true
GROUP BY v.id, v.nombre
ORDER BY total_descuentos DESC;
```

## 🔒 Seguridad

- **Row Level Security (RLS)** habilitado en todas las tablas
- **Políticas de acceso** configuradas para desarrollo
- **Validación de datos** en el frontend y backend
- **Sanitización** de inputs

## 🚀 Despliegue

### Desarrollo Local
```bash
ng serve
```

### Producción
```bash
ng build --configuration production
```

## 📝 Notas Importantes

1. **Configuración de Supabase**: Asegúrate de configurar correctamente las credenciales
2. **Base de Datos**: Ejecuta el script SQL antes de usar la aplicación
3. **RLS**: En producción, configura políticas más restrictivas
4. **Backup**: Configura backups automáticos en Supabase

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Si tienes problemas:
1. Verifica que las credenciales de Supabase estén correctas
2. Asegúrate de que el script SQL se ejecutó correctamente
3. Revisa la consola del navegador para errores
4. Verifica la configuración de RLS en Supabase
