-- Script SQL para crear la estructura de la base de datos en Supabase
-- Ejecutar este script en el SQL Editor de Supabase

-- Habilitar RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Tabla de Usuarios Admin (extensión de auth.users de Supabase)
CREATE TABLE usuarios_admin (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'admin',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Vendedores (creados por admin)
CREATE TABLE vendedores (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Clientes
CREATE TABLE clientes (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Productos
CREATE TABLE productos (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio_base DECIMAL(10,2) NOT NULL DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Reportes
CREATE TABLE reportes (
    id BIGSERIAL PRIMARY KEY,
    vendedor_id BIGINT NOT NULL REFERENCES vendedores(id),
    fecha DATE NOT NULL,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Entradas de Reporte
CREATE TABLE entradas_reporte (
    id BIGSERIAL PRIMARY KEY,
    reporte_id BIGINT NOT NULL REFERENCES reportes(id) ON DELETE CASCADE,
    factura VARCHAR(100) NOT NULL,
    cliente_id BIGINT NOT NULL REFERENCES clientes(id),
    producto_id BIGINT NOT NULL REFERENCES productos(id),
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_facturado DECIMAL(10,2) NOT NULL,
    precio_ofrecido DECIMAL(10,2) NOT NULL,
    diferencia DECIMAL(10,2) GENERATED ALWAYS AS (precio_facturado - precio_ofrecido) STORED,
    total_descuento DECIMAL(10,2) GENERATED ALWAYS AS ((precio_facturado - precio_ofrecido) * cantidad) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_usuarios_admin_email ON usuarios_admin(email);
CREATE INDEX idx_usuarios_admin_activo ON usuarios_admin(activo);
CREATE INDEX idx_vendedores_activo ON vendedores(activo);
CREATE INDEX idx_vendedores_created_by ON vendedores(created_by);
CREATE INDEX idx_clientes_activo ON clientes(activo);
CREATE INDEX idx_productos_activo ON productos(activo);
CREATE INDEX idx_reportes_vendedor_id ON reportes(vendedor_id);
CREATE INDEX idx_reportes_fecha ON reportes(fecha);
CREATE INDEX idx_entradas_reporte_reporte_id ON entradas_reporte(reporte_id);
CREATE INDEX idx_entradas_reporte_cliente_id ON entradas_reporte(cliente_id);
CREATE INDEX idx_entradas_reporte_producto_id ON entradas_reporte(producto_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_usuarios_admin_updated_at BEFORE UPDATE ON usuarios_admin FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendedores_updated_at BEFORE UPDATE ON vendedores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reportes_updated_at BEFORE UPDATE ON reportes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_entradas_reporte_updated_at BEFORE UPDATE ON entradas_reporte FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para crear usuario admin automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.usuarios_admin (id, email, nombre, rol)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email), 'admin');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear usuario admin cuando se registra
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Habilitar Row Level Security (RLS)
ALTER TABLE usuarios_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE entradas_reporte ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuarios_admin
CREATE POLICY "Usuarios pueden ver su propio perfil" ON usuarios_admin
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON usuarios_admin
    FOR UPDATE USING (auth.uid() = id);

-- Políticas RLS para vendedores (solo admin puede crear/editar)
CREATE POLICY "Todos pueden ver vendedores activos" ON vendedores
    FOR SELECT USING (activo = true);

CREATE POLICY "Solo admin puede crear vendedores" ON vendedores
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios_admin
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

CREATE POLICY "Solo admin puede actualizar vendedores" ON vendedores
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM usuarios_admin
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

-- Políticas RLS para clientes (todos pueden crear/ver)
CREATE POLICY "Todos pueden ver clientes activos" ON clientes
    FOR SELECT USING (activo = true);

CREATE POLICY "Todos pueden crear clientes" ON clientes
    FOR INSERT WITH CHECK (true);

-- Políticas RLS para productos (todos pueden crear/ver)
CREATE POLICY "Todos pueden ver productos activos" ON productos
    FOR SELECT USING (activo = true);

CREATE POLICY "Todos pueden crear productos" ON productos
    FOR INSERT WITH CHECK (true);

-- Políticas RLS para reportes (todos pueden crear, admin puede ver todos)
CREATE POLICY "Todos pueden crear reportes" ON reportes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Todos pueden ver reportes" ON reportes
    FOR SELECT USING (true);

-- Políticas RLS para entradas_reporte (todos pueden crear/ver)
CREATE POLICY "Todos pueden crear entradas" ON entradas_reporte
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Todos pueden ver entradas" ON entradas_reporte
    FOR SELECT USING (true);

-- Datos de ejemplo (opcional)
INSERT INTO clientes (nombre, email, telefono) VALUES
('Empresa ABC', 'contacto@empresaabc.com', '+1234567890'),
('Corporación XYZ', 'info@corporacionxyz.com', '+0987654321'),
('Compañía DEF', 'ventas@companiadef.com', '+1122334455');

INSERT INTO productos (nombre, descripcion, precio_base) VALUES
('Producto A', 'Descripción del producto A', 100.00),
('Producto B', 'Descripción del producto B', 150.00),
('Producto C', 'Descripción del producto C', 200.00);

-- Vista para reportes completos (opcional)
CREATE VIEW reportes_completos AS
SELECT
    r.id,
    r.fecha,
    r.observaciones,
    r.created_at,
    v.nombre as vendedor_nombre,
    v.email as vendedor_email,
    COUNT(er.id) as total_entradas,
    SUM(er.total_descuento) as total_descuentos,
    AVG(er.total_descuento) as promedio_descuento
FROM reportes r
JOIN vendedores v ON r.vendedor_id = v.id
LEFT JOIN entradas_reporte er ON r.id = er.reporte_id
GROUP BY r.id, r.fecha, r.observaciones, r.created_at, v.nombre, v.email
ORDER BY r.created_at DESC;
