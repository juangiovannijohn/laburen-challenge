-- Tabla de Productos (Versión 2 - Basada en el CSV)
-- Almacena todos los productos disponibles para la venta.
CREATE TABLE products (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY, -- Usamos un ID numérico autoincremental, ignorando el del CSV
    name TEXT NOT NULL, -- Mapeado de la columna TIPO_PRENDA
    talla TEXT,
    color TEXT,
    stock INT NOT NULL CHECK (stock >= 0), -- Mapeado de CANTIDAD_DISPONIBLE
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0), -- Mapeado de PRECIO_50_U para simplificar
    disponible BOOLEAN NOT NULL, -- Mapeado de DISPONIBLE (Sí/No)
    categoria TEXT, -- Mapeado de CATEGORÍA
    description TEXT -- Mapeado de DESCRIPCIÓN
);

-- Tabla de Carritos (sin cambios)
-- Representa una sesión de compra de un usuario.
CREATE TABLE carts (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Items del Carrito (sin cambios)
-- Conecta los productos con los carritos, especificando la cantidad de cada producto.
CREATE TABLE cart_items (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    cart_id BIGINT REFERENCES carts(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    qty INT NOT NULL CHECK (qty > 0),
    -- Asegurarse que no se pueda agregar el mismo producto dos veces al mismo carrito
    UNIQUE (cart_id, product_id)
);

-- Comentario para el LLM/desarrollador: 
-- Después de ejecutar este script en el SQL Editor de Supabase,
-- no olvides recargar el esquema de la API para que Supabase reconozca las nuevas tablas.
-- Esto se hace yendo a la sección "API Docs" y haciendo clic en el botón de recargar.