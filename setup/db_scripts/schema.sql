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

-- Tabla para el Historial de Conversaciones del Bot
-- Almacena el historial de chat para cada usuario (identificado por 'phone').
CREATE TABLE conversation_history (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    phone TEXT NOT NULL UNIQUE, -- El número de teléfono del usuario, actúa como ID único.
    history JSONB, -- El historial de la conversación en formato JSON.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

 -- Función para añadir mensajes al historial de una conversación.
-- Crea un nuevo registro si el usuario no existe (UPSERT).
CREATE OR REPLACE FUNCTION append_to_history(p_phone TEXT, p_new_entries JSONB)
    RETURNS VOID AS $func$
BEGIN
    INSERT INTO conversation_history (phone, history, created_at, updated_at) 
        VALUES (p_phone, p_new_entries, NOW(), NOW()) 
    ON CONFLICT (phone)
    DO UPDATE SET 
            history = conversation_history.history || p_new_entries,
            updated_at = NOW();
    END;
    $func$ LANGUAGE plpgsql;

-- Tabla de Configuración del Bot
-- Almacena el estado persistente del bot (activo/pausado, quién lo pausó, etc.)
CREATE TABLE bot_config (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    environment TEXT NOT NULL DEFAULT 'development', -- 'development' o 'production'
    is_paused BOOLEAN NOT NULL DEFAULT FALSE, -- Estado del bot (activo/pausado)
    paused_at TIMESTAMPTZ, -- Cuándo se pausó el bot
    paused_by TEXT, -- Número de teléfono del administrador que pausó el bot
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Asegurar que solo haya un registro por ambiente
    UNIQUE (environment)
);

-- Función para crear la configuración inicial del bot si no existe
CREATE OR REPLACE FUNCTION create_bot_config_if_not_exists(p_environment TEXT)
    RETURNS VOID AS $func$
BEGIN
    INSERT INTO bot_config (environment, is_paused, created_at, updated_at)
        VALUES (p_environment, FALSE, NOW(), NOW())
    ON CONFLICT (environment) DO NOTHING;
END;
$func$ LANGUAGE plpgsql;

-- Función para actualizar el estado del bot
CREATE OR REPLACE FUNCTION update_bot_state(
    p_environment TEXT,
    p_is_paused BOOLEAN,
    p_paused_by TEXT DEFAULT NULL
)
    RETURNS VOID AS $func$
BEGIN
    INSERT INTO bot_config (
        environment, 
        is_paused, 
        paused_at, 
        paused_by, 
        created_at, 
        updated_at
    )
    VALUES (
        p_environment,
        p_is_paused,
        CASE WHEN p_is_paused THEN NOW() ELSE NULL END,
        CASE WHEN p_is_paused THEN p_paused_by ELSE NULL END,
        NOW(),
        NOW()
    )
    ON CONFLICT (environment)
    DO UPDATE SET
        is_paused = p_is_paused,
        paused_at = CASE WHEN p_is_paused THEN NOW() ELSE NULL END,
        paused_by = CASE WHEN p_is_paused THEN p_paused_by ELSE NULL END,
        updated_at = NOW();
END;
$func$ LANGUAGE plpgsql;

-- Función para obtener la configuración del bot
CREATE OR REPLACE FUNCTION get_bot_config(p_environment TEXT)
    RETURNS TABLE(
        id BIGINT,
        environment TEXT,
        is_paused BOOLEAN,
        paused_at TIMESTAMPTZ,
        paused_by TEXT,
        created_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ
    ) AS $func$
BEGIN
    -- Crear configuración si no existe
    PERFORM create_bot_config_if_not_exists(p_environment);
    
    -- Retornar la configuración
    RETURN QUERY
    SELECT bc.id, bc.environment, bc.is_paused, bc.paused_at, bc.paused_by, 
           bc.created_at, bc.updated_at
    FROM bot_config bc
    WHERE bc.environment = p_environment;
END;
$func$ LANGUAGE plpgsql;